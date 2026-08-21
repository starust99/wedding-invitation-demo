import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { getInviteStatusFromRsvp } from "@/lib/invites";
import {
  mapRSVPRow,
  toRSVPInsert,
  type RSVPDatabaseRow,
} from "@/lib/rsvp-mapper";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase-server";
import { resolvePostCeremonyPartyAnswer } from "@/lib/post-ceremony-rsvp";
import { resolveInviteEventAccess } from "@/lib/invite-event-access";
import {
  isGroomFamilyLodgingGuestGroup,
  isTerracottaLodgingEligible,
} from "@/lib/rsvp-guest-group";
import { preserveLegacyRsvpWishNotes } from "@/lib/rsvp-wish";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ responses: [], backend: "local" });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("rsvp_responses")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ responses: (data as RSVPDatabaseRow[]).map(mapRSVPRow), backend: "supabase" });
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const body = await request.json();
  const supabase = getSupabaseServerClient();

  const token = body.inviteToken || body.token;
  const inviteeId = body.inviteeId;
  const name = body.name?.trim();
  const displayLabel = body.displayLabel?.trim();

  // Search for matching invitee in Supabase
  let matchingInvitee: { id: string; token: string; guest_group: string | null; post_ceremony_party_invited: boolean | null; terracotta_lodging_eligible: boolean | null } | null = null;
  if (inviteeId || token || displayLabel || name) {
    let query = supabase.from("invitees").select("*");
    if (inviteeId) {
      query = query.eq("id", inviteeId);
    } else if (token) {
      query = query.eq("token", token);
    } else if (displayLabel) {
      query = query.eq("display_label", displayLabel);
    } else if (name) {
      query = query.eq("guest_name", name);
    }
    const { data: invitee } = await query.maybeSingle();
    if (invitee) {
      matchingInvitee = invitee;
    }
  }

  const resolvedGuestGroup = matchingInvitee?.guest_group || body.guestGroup || "";
  // Lodging is an invite-scoped permission. Never trust a guest-supplied
  // group or flag when no matching invite exists on the server.
  const lodgingEligible = matchingInvitee
    ? isTerracottaLodgingEligible(
        matchingInvitee.guest_group,
        matchingInvitee.terracotta_lodging_eligible,
      )
    : false;
  const eventAccess = resolveInviteEventAccess({
    guestGroup: resolvedGuestGroup,
    postCeremonyPartyInvited: matchingInvitee?.post_ceremony_party_invited,
  });
  const attendingCeremony = eventAccess.canViewCeremony && body.attendingCeremony === true;
  const postCeremonyParty = resolvePostCeremonyPartyAnswer({
    invited: Boolean(matchingInvitee?.post_ceremony_party_invited),
    attendingCeremony,
    attendingBanquet: body.attendingBanquet === true,
    answer: body.attendingPostCeremonyParty,
    allowFallback: eventAccess.canUsePostCeremonyFallback,
  });
  if (!postCeremonyParty.ok) {
    return NextResponse.json({ error: postCeremonyParty.error }, { status: 400 });
  }

  const accommodationNeeded = body.accommodationNeeded === true
    && body.attendingBanquet === true
    && lodgingEligible;
  if (
    accommodationNeeded
    && isGroomFamilyLodgingGuestGroup(resolvedGuestGroup)
    && (body.checkInDate !== "2026-12-26" || body.checkOutDate !== "2026-12-27")
  ) {
    return NextResponse.json(
      { error: "Phương án lưu trú không hợp lệ. Vui lòng chọn lại." },
      { status: 400 },
    );
  }

  const payload = {
    ...body,
    inviteeId: matchingInvitee?.id || body.inviteeId,
    inviteToken: matchingInvitee?.token || token,
    guestGroup: resolvedGuestGroup,
    attendingCeremony,
    attendingPostCeremonyParty: postCeremonyParty.value,
    attending: attendingCeremony || body.attendingBanquet === true || postCeremonyParty.value === true
      ? "yes"
      : "no",
    accommodationNeeded,
    lodgingGuests: accommodationNeeded ? body.lodgingGuests ?? [] : [],
    stayingGuestCount: accommodationNeeded ? body.stayingGuestCount : 0,
    checkInDate: accommodationNeeded ? body.checkInDate : undefined,
    checkOutDate: accommodationNeeded ? body.checkOutDate : undefined,
    childrenCount: accommodationNeeded ? body.childrenCount : 0,
  };

  let existingId: string | null = null;
  let existingNotes: string | null = null;
  if (matchingInvitee?.id || matchingInvitee?.token || payload.inviteToken) {
    const filter = matchingInvitee?.id
      ? `invitee_id.eq.${matchingInvitee.id}`
      : `invite_token.eq.${payload.inviteToken}`;
    const { data: existing } = await supabase
      .from("rsvp_responses")
      .select("id, notes")
      .or(filter)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing?.id) {
      existingId = existing.id;
      existingNotes = existing.notes;
    }
  }

  const submittedAt = new Date().toISOString();
  const mutate = (includeEventAttendanceColumns: boolean) => {
    const rsvpInsert = toRSVPInsert(payload, { includeEventAttendanceColumns });
    const insertPayload = {
      ...rsvpInsert,
      notes: preserveLegacyRsvpWishNotes(existingNotes, rsvpInsert.notes),
      submitted_at: submittedAt,
    };
    const mutation = existingId
      ? supabase.from("rsvp_responses").update(insertPayload).eq("id", existingId)
      : supabase.from("rsvp_responses").insert(insertPayload);
    return mutation.select("*").single();
  };

  const { data, error } = await mutate(true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (matchingInvitee?.id) {
    await supabase
      .from("invitees")
      .update({
        invite_status: getInviteStatusFromRsvp(payload.attending),
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchingInvitee.id);
  }

  return NextResponse.json({
    response: mapRSVPRow(data as RSVPDatabaseRow),
    backend: "supabase",
    hasSubmittedRsvp: true,
  });
}

export async function DELETE(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as { ids?: unknown } | null;
  const ids = Array.isArray(body?.ids)
    ? [...new Set(body.ids.filter((id): id is string => typeof id === "string" && id.trim().length > 0))]
    : [];

  if (ids.length === 0) {
    return NextResponse.json({ error: "Thiếu danh sách ID cần xoá." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  const { data: rowsToDelete } = await supabase
    .from("rsvp_responses")
    .select("invitee_id, invite_token")
    .in("id", ids);

  const { error } = await supabase
    .from("rsvp_responses")
    .delete()
    .in("id", ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (rowsToDelete && rowsToDelete.length > 0) {
    const inviteeIds = rowsToDelete.map((r) => r.invitee_id).filter((id): id is string => Boolean(id));
    const tokens = rowsToDelete.map((r) => r.invite_token).filter((t): t is string => Boolean(t));

    if (inviteeIds.length > 0) {
      await supabase.from("invitees").update({ invite_status: "invited", updated_at: new Date().toISOString() }).in("id", inviteeIds);
    }
    if (tokens.length > 0) {
      await supabase.from("invitees").update({ invite_status: "invited", updated_at: new Date().toISOString() }).in("token", tokens);
    }
  }

  return NextResponse.json({ ok: true, deletedIds: ids, backend: "supabase" });
}
