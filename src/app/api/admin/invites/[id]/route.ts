import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { mapInviteSupplementRow, mapInviteeRow, type InviteSupplementDatabaseRow, type InviteeDatabaseRow } from "@/lib/invite-mapper";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase-server";

type PatchBody = Partial<{
  token: string;
  invite_unit: string;
  guest_name: string;
  display_label: string;
  invitation_name: string;
  honorific: string;
  envelope_line: string;
  inside_invite_line: string;
  invited_by: string;
  relationship: string;
  host_relationship: string;
  host_pronoun: string;
  couple_reference: string;
  household_mode: string;
  plus_one_policy: string;
  guest_group: string;
  audience_tags: string[];
  expected_guest_count: number;
  phone: string;
  email: string;
  notes: string;
  invite_status: string;
}>;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const { id } = await params;
  const body = await request.json() as PatchBody;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("invitees")
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: supplement } = await supabase
    .from("invite_supplements")
    .select("*")
    .eq("invitee_id", id)
    .maybeSingle();

  return NextResponse.json({
    invitee: mapInviteeRow(data as InviteeDatabaseRow, supplement ? mapInviteSupplementRow(supplement as InviteSupplementDatabaseRow) : undefined),
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const { id } = await params;
  const supabase = getSupabaseServerClient();
  const { data: invitee, error: readError } = await supabase
    .from("invitees")
    .select("id, token")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }

  if (!invitee) {
    return NextResponse.json({ error: "Invitee not found" }, { status: 404 });
  }

  const token = String(invitee.token ?? "");
  const rsvpDelete = await supabase
    .from("rsvp_responses")
    .delete()
    .or(`invitee_id.eq.${id},invite_token.eq.${token}`);

  if (rsvpDelete.error) {
    return NextResponse.json({ error: rsvpDelete.error.message }, { status: 500 });
  }

  const { error } = await supabase.from("invitees").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deletedId: id, backend: "supabase" });
}
