import type { LodgingGuest, RSVPResponse } from "@/lib/rsvp-storage";

export type RSVPDatabaseRow = {
  id: string;
  invitee_id: string | null;
  invite_token: string | null;
  display_label: string | null;
  name: string;
  attending_ceremony: boolean | null;
  attending_post_ceremony_party: boolean | null;
  attending_banquet: boolean | null;
  attending: "yes" | "no" | "maybe";
  guest_count: number;
  guest_group: string;
  accommodation_needed: boolean;
  staying_guest_count: number | null;
  lodging_guests: unknown;
  check_in_date: string | null;
  check_out_date: string | null;
  children_count: number;
  wish_message: string | null;
  wish_sent_at: string | null;
  submitted_at: string;
};

function parseLodgingGuests(value: unknown): LodgingGuest[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const guest = item as Record<string, unknown>;
    const fullName = typeof guest.fullName === "string"
      ? guest.fullName
      : typeof guest.full_name === "string"
        ? guest.full_name
        : "";
    if (!fullName.trim()) return [];

    const ageValue = typeof guest.age === "number"
      ? guest.age
      : typeof guest.age === "string" && guest.age.trim() !== ""
        ? Number(guest.age)
        : undefined;

    return [{
      fullName: fullName.trim(),
      isChild: Boolean(guest.isChild ?? guest.is_child),
      age: typeof ageValue === "number" && Number.isFinite(ageValue) ? ageValue : undefined,
    }];
  });
}

export function mapRSVPRow(row: RSVPDatabaseRow): RSVPResponse {
  return {
    id: row.id,
    inviteeId: row.invitee_id ?? undefined,
    inviteToken: row.invite_token ?? undefined,
    displayLabel: row.display_label ?? undefined,
    name: row.name,
    attendingCeremony: row.attending_ceremony ?? undefined,
    attendingPostCeremonyParty: row.attending_post_ceremony_party ?? undefined,
    attendingBanquet: row.attending_banquet ?? undefined,
    attending: row.attending,
    guestCount: row.guest_count,
    guestGroup: row.guest_group,
    accommodationNeeded: row.accommodation_needed,
    stayingGuestCount: row.staying_guest_count ?? undefined,
    lodgingGuests: parseLodgingGuests(row.lodging_guests),
    checkInDate: row.check_in_date ?? undefined,
    checkOutDate: row.check_out_date ?? undefined,
    childrenCount: row.children_count,
    wishMessage: row.wish_message ?? undefined,
    wishSentAt: row.wish_sent_at ?? undefined,
    submittedAt: row.submitted_at,
  };
}

export function toRSVPInsert(response: Omit<RSVPResponse, "id" | "submittedAt">) {
  return {
    invitee_id: response.inviteeId || null,
    invite_token: response.inviteToken || null,
    display_label: response.displayLabel || null,
    name: response.name,
    attending_ceremony: response.attendingCeremony ?? null,
    attending_post_ceremony_party: response.attendingPostCeremonyParty ?? null,
    attending_banquet: response.attendingBanquet ?? null,
    attending: response.attending,
    guest_count: response.guestCount,
    guest_group: response.guestGroup,
    accommodation_needed: response.accommodationNeeded,
    staying_guest_count: response.stayingGuestCount ?? null,
    lodging_guests: response.lodgingGuests,
    check_in_date: response.checkInDate || null,
    check_out_date: response.checkOutDate || null,
    children_count: response.childrenCount,
  };
}
