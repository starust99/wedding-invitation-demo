import type { LodgingGuest, RSVPResponse } from "@/lib/rsvp-storage";

export type RSVPDatabaseRow = {
  id: string;
  invitee_id: string | null;
  invite_token: string | null;
  display_label: string | null;
  name: string;
  phone: string;
  attending: "yes" | "no" | "maybe";
  guest_count: number;
  guest_group: string;
  dietary_note: string | null;
  transport_needed: boolean;
  accommodation_needed: boolean;
  staying_guest_count: number | null;
  lodging_guests: unknown | null;
  check_in_date: string | null;
  check_out_date: string | null;
  room_type: string | null;
  children_count: number;
  elderly_support_needed: boolean;
  notes: string | null;
  submitted_at: string;
};

function parseLodgingGuests(value: unknown): LodgingGuest[] {
  if (typeof value === "string") {
    try {
      return parseLodgingGuests(JSON.parse(value));
    } catch {
      return [];
    }
  }

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

    const idNumber = typeof guest.idNumber === "string"
      ? guest.idNumber
      : typeof guest.id_number === "string"
        ? guest.id_number
        : "";
    const ageValue = typeof guest.age === "number"
      ? guest.age
      : typeof guest.age === "string" && guest.age.trim() !== ""
        ? Number(guest.age)
        : undefined;

    return [{
      fullName: fullName.trim(),
      idNumber: idNumber.trim(),
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
    phone: row.phone,
    attending: row.attending,
    guestCount: row.guest_count,
    guestGroup: row.guest_group,
    dietaryNote: row.dietary_note ?? undefined,
    transportNeeded: row.transport_needed,
    accommodationNeeded: row.accommodation_needed,
    stayingGuestCount: row.staying_guest_count ?? undefined,
    lodgingGuests: parseLodgingGuests(row.lodging_guests),
    checkInDate: row.check_in_date ?? undefined,
    checkOutDate: row.check_out_date ?? undefined,
    roomType: row.room_type ?? undefined,
    childrenCount: row.children_count,
    elderlySupportNeeded: row.elderly_support_needed,
    notes: row.notes ?? undefined,
    submittedAt: row.submitted_at,
  };
}

export function toRSVPInsert(response: Omit<RSVPResponse, "id" | "submittedAt">) {
  const tokenColumns = response.inviteeId || response.inviteToken || response.displayLabel
    ? {
        invitee_id: response.inviteeId || null,
        invite_token: response.inviteToken || null,
        display_label: response.displayLabel || null,
      }
    : {};

  return {
    ...tokenColumns,
    name: response.name,
    phone: response.phone,
    attending: response.attending,
    guest_count: response.guestCount,
    guest_group: response.guestGroup,
    dietary_note: response.dietaryNote || null,
    transport_needed: response.transportNeeded,
    accommodation_needed: response.accommodationNeeded,
    staying_guest_count: response.stayingGuestCount ?? null,
    lodging_guests: response.lodgingGuests,
    check_in_date: response.checkInDate || null,
    check_out_date: response.checkOutDate || null,
    room_type: response.roomType || null,
    children_count: response.childrenCount,
    elderly_support_needed: response.elderlySupportNeeded,
    notes: response.notes || null,
  };
}
