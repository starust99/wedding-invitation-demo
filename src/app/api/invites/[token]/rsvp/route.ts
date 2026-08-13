import { NextResponse } from "next/server";
import { z } from "zod";
import { getInviteStatusFromRsvp } from "@/lib/invites";
import {
  mapRSVPRow,
  toRSVPInsert,
  type RSVPDatabaseRow,
} from "@/lib/rsvp-mapper";
import type { RSVPResponse } from "@/lib/rsvp-storage";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase-server";
import { resolvePostCeremonyPartyAnswer } from "@/lib/post-ceremony-rsvp";
import {
  isFamilyLodgingGuestGroup,
  isGroomFamilyLodgingGuestGroup,
} from "@/lib/rsvp-guest-group";

const guestRsvpSchema = z.object({
  displayLabel: z.string().trim().optional(),
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(30).default(""),
  attendingCeremony: z.boolean(),
  attendingPostCeremonyParty: z.boolean().optional(),
  attendingBanquet: z.boolean(),
  guestCount: z.coerce.number().int().min(0).max(50),
  guestGroup: z.string().trim().max(200).default(""),
  dietaryNote: z.string().trim().max(1000).optional(),
  transportNeeded: z.boolean().default(false),
  accommodationNeeded: z.boolean().default(false),
  stayingGuestCount: z.coerce.number().int().min(0).max(50).optional(),
  lodgingGuests: z.array(z.object({
    fullName: z.string().trim().max(200),
    idNumber: z.string().trim().max(100).default(""),
    isChild: z.boolean().default(false),
    age: z.coerce.number().int().min(0).max(120).optional(),
  })).max(50).default([]),
  checkInDate: z.string().date().optional(),
  checkOutDate: z.string().date().optional(),
  roomType: z.string().trim().max(100).optional(),
  childrenCount: z.coerce.number().int().min(0).max(50).default(0),
  elderlySupportNeeded: z.boolean().default(false),
  notes: z.string().trim().max(2000).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const { token } = await params;
  const parsedBody = guestRsvpSchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Thông tin hồi đáp không hợp lệ." }, { status: 400 });
  }

  const body = parsedBody.data;
  const supabase = getSupabaseServerClient();
  const { data: invitee, error: inviteeError } = await supabase
    .from("invitees")
    .select("id, token, display_label, guest_group, expected_guest_count, post_ceremony_party_invited")
    .eq("token", token)
    .maybeSingle();

  if (inviteeError) return NextResponse.json({ error: inviteeError.message }, { status: 500 });
  if (!invitee) return NextResponse.json({ error: "Invite not found" }, { status: 404 });

  const postCeremonyParty = resolvePostCeremonyPartyAnswer({
    invited: Boolean(invitee.post_ceremony_party_invited),
    attendingCeremony: body.attendingCeremony,
    answer: body.attendingPostCeremonyParty,
  });
  if (!postCeremonyParty.ok) {
    return NextResponse.json({ error: postCeremonyParty.error }, { status: 400 });
  }

  const expectedGuestCount = Math.max(1, Number(invitee.expected_guest_count) || 1);
  const attending = body.attendingCeremony || body.attendingBanquet ? "yes" : "no";
  const guestGroup = invitee.guest_group as string;
  const accommodationNeeded = isFamilyLodgingGuestGroup(guestGroup)
    && attending === "yes"
    && body.attendingBanquet
    && body.accommodationNeeded;
  if (
    accommodationNeeded
    && isGroomFamilyLodgingGuestGroup(guestGroup)
    && (body.checkInDate !== "2026-12-26" || body.checkOutDate !== "2026-12-27")
  ) {
    return NextResponse.json(
      { error: "Phương án lưu trú không hợp lệ. Vui lòng chọn lại." },
      { status: 400 },
    );
  }
  const lodgingGuests = accommodationNeeded ? body.lodgingGuests : [];
  const payload: Omit<RSVPResponse, "id" | "submittedAt"> = {
    ...body,
    inviteeId: invitee.id as string,
    inviteToken: token,
    displayLabel: invitee.display_label as string,
    name: invitee.display_label as string,
    guestGroup,
    attendingPostCeremonyParty: postCeremonyParty.value,
    attending,
    guestCount: attending === "no"
      ? 0
      : Math.min(50, Math.max(1, body.guestCount || expectedGuestCount)),
    accommodationNeeded,
    stayingGuestCount: accommodationNeeded ? lodgingGuests.length : 0,
    lodgingGuests,
    checkInDate: accommodationNeeded ? body.checkInDate : undefined,
    checkOutDate: accommodationNeeded ? body.checkOutDate : undefined,
    childrenCount: lodgingGuests.filter((guest) => guest.isChild).length,
  };

  const existing = await supabase
    .from("rsvp_responses")
    .select("id")
    .or(`invitee_id.eq.${invitee.id},invite_token.eq.${token}`)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing.error) return NextResponse.json({ error: existing.error.message }, { status: 500 });

  const submittedAt = new Date().toISOString();
  const mutate = (includeEventAttendanceColumns: boolean) => {
    const insertPayload = {
      ...toRSVPInsert(payload, { includeEventAttendanceColumns }),
      submitted_at: submittedAt,
    };
    const mutation = existing.data
      ? supabase.from("rsvp_responses").update(insertPayload).eq("id", existing.data.id)
      : supabase.from("rsvp_responses").insert(insertPayload);
    return mutation.select("*").single();
  };

  const { data, error } = await mutate(true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: inviteStatusError } = await supabase
    .from("invitees")
    .update({ invite_status: getInviteStatusFromRsvp(payload.attending), updated_at: new Date().toISOString() })
    .eq("id", invitee.id);

  if (inviteStatusError) {
    return NextResponse.json({ error: inviteStatusError.message }, { status: 500 });
  }

  return NextResponse.json({
    response: mapRSVPRow(data as RSVPDatabaseRow),
    backend: "supabase",
    hasSubmittedRsvp: true,
  });
}
