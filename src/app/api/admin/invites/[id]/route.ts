import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { revalidateSharedInvitation } from "@/lib/invite-share-cache";
import { mapInviteeRow, type InviteeDatabaseRow } from "@/lib/invite-mapper";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase-server";
import { isMissingSupabaseColumn } from "@/lib/supabase-errors";

type PatchBody = Partial<{
  token: string;
  invite_unit: string;
  guest_name: string;
  display_label: string;
  salutation_cluster: string;
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
  post_ceremony_party_invited: boolean;
  terracotta_lodging_eligible: boolean;
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
  const { data: existingInvitee, error: readError } = await supabase
    .from("invitees")
    .select("token")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }

  let mutation = await supabase
    .from("invitees")
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  let migrationRequired = false;
  if (isMissingSupabaseColumn(mutation.error, "terracotta_lodging_eligible")) {
    migrationRequired = true;
    const legacyBody = Object.fromEntries(
      Object.entries(body).filter(([key]) => key !== "terracotta_lodging_eligible"),
    );
    mutation = await supabase
      .from("invitees")
      .update({
        ...legacyBody,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();
  }

  const { data, error } = mutation;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const previousToken = String(existingInvitee?.token ?? "");
  const updatedToken = String(data.token ?? "");
  for (const token of new Set([previousToken, updatedToken])) {
    revalidateSharedInvitation(token);
  }

  return NextResponse.json({
    invitee: mapInviteeRow(data as InviteeDatabaseRow),
    migrationRequired,
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

  revalidateSharedInvitation(token);

  return NextResponse.json({ ok: true, deletedId: id, backend: "supabase" });
}
