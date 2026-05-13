import { NextResponse } from "next/server";
import { getInviteStatusFromRsvp } from "@/lib/invites";
import { mapRSVPRow, toRSVPInsert, type RSVPDatabaseRow } from "@/lib/rsvp-mapper";
import type { RSVPResponse } from "@/lib/rsvp-storage";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase-server";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const { token } = await params;
  const body = await request.json() as Omit<RSVPResponse, "id" | "submittedAt">;
  const supabase = getSupabaseServerClient();
  const { data: invitee, error: inviteeError } = await supabase
    .from("invitees")
    .select("id, token, display_label, guest_group, expected_guest_count")
    .eq("token", token)
    .maybeSingle();

  if (inviteeError) return NextResponse.json({ error: inviteeError.message }, { status: 500 });
  if (!invitee) return NextResponse.json({ error: "Invite not found" }, { status: 404 });

  const payload: Omit<RSVPResponse, "id" | "submittedAt"> = {
    ...body,
    inviteeId: invitee.id as string,
    inviteToken: token,
    displayLabel: (invitee.display_label as string) || body.displayLabel,
    name: body.name || (invitee.display_label as string),
    guestGroup: body.guestGroup || (invitee.guest_group as string),
    guestCount: Math.max(0, body.guestCount || Number(invitee.expected_guest_count) || 1),
  };

  const existing = await supabase
    .from("rsvp_responses")
    .select("id")
    .or(`invitee_id.eq.${invitee.id},invite_token.eq.${token}`)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing.error) return NextResponse.json({ error: existing.error.message }, { status: 500 });

  const insertPayload = {
    ...toRSVPInsert(payload),
    submitted_at: new Date().toISOString(),
  };

  const mutation = existing.data
    ? supabase.from("rsvp_responses").update(insertPayload).eq("id", existing.data.id)
    : supabase.from("rsvp_responses").insert(insertPayload);

  const { data, error } = await mutation.select("*").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase
    .from("invitees")
    .update({ invite_status: getInviteStatusFromRsvp(payload.attending), updated_at: new Date().toISOString() })
    .eq("id", invitee.id);

  return NextResponse.json({ response: mapRSVPRow(data as RSVPDatabaseRow), backend: "supabase" });
}
