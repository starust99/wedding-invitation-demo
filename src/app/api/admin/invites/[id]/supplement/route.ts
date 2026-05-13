import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { getInviteStatusFromRsvp } from "@/lib/invites";
import { mapInviteSupplementRow, mapInviteeRow, type InviteSupplementDatabaseRow, type InviteeDatabaseRow } from "@/lib/invite-mapper";
import { mapRSVPRow, type RSVPDatabaseRow } from "@/lib/rsvp-mapper";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase-server";

type SupplementBody = {
  tableZone?: string;
  tableName?: string;
  seatNote?: string;
  arrivalNote?: string;
  status?: "draft" | "published";
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const { id } = await params;
  const body = await request.json() as SupplementBody;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("invite_supplements")
    .upsert({
      invitee_id: id,
      table_zone: body.tableZone ?? "",
      table_name: body.tableName ?? "",
      seat_note: body.seatNote ?? "",
      arrival_note: body.arrivalNote ?? "",
      status: body.status ?? "draft",
      published_at: body.status === "published" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "invitee_id" })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.status === "published") {
    await supabase.from("invitees").update({ invite_status: "supplement_ready", updated_at: new Date().toISOString() }).eq("id", id);
  }

  const { data: invitee } = await supabase.from("invitees").select("*").eq("id", id).single();
  return NextResponse.json({
    supplement: mapInviteSupplementRow(data as InviteSupplementDatabaseRow),
    invitee: invitee ? mapInviteeRow(invitee as InviteeDatabaseRow, mapInviteSupplementRow(data as InviteSupplementDatabaseRow)) : null,
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
  const { error } = await supabase.from("invite_supplements").delete().eq("invitee_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: invitee, error: inviteeError } = await supabase
    .from("invitees")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (inviteeError) {
    return NextResponse.json({ error: inviteeError.message }, { status: 500 });
  }

  if (!invitee) {
    return NextResponse.json({ ok: true, invitee: null, supplement: null, backend: "supabase" });
  }

  const inviteeRow = invitee as InviteeDatabaseRow;
  const responseResult = await supabase
    .from("rsvp_responses")
    .select("*")
    .or(`invitee_id.eq.${id},invite_token.eq.${inviteeRow.token}`)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (responseResult.error) {
    return NextResponse.json({ error: responseResult.error.message }, { status: 500 });
  }

  const nextStatus = responseResult.data
    ? getInviteStatusFromRsvp((mapRSVPRow(responseResult.data as RSVPDatabaseRow)).attending)
    : "invited";

  const { data: updatedInvitee, error: updateError } = await supabase
    .from("invitees")
    .update({ invite_status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    supplement: null,
    invitee: mapInviteeRow(updatedInvitee as InviteeDatabaseRow, undefined),
    backend: "supabase",
  });
}
