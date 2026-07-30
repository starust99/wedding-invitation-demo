import type { LodgingGuest, RSVPResponse } from "@/lib/rsvp-storage";

export type RSVPDatabaseRow = {
  id: string;
  invitee_id: string | null;
  invite_token: string | null;
  display_label: string | null;
  name: string;
  phone: string;
  attending_ceremony?: boolean | null;
  attending_banquet?: boolean | null;
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

type LegacyRsvpMetadata = {
  guests: LodgingGuest[];
  attendingCeremony?: boolean;
  attendingBanquet?: boolean;
};

function parseLegacyRsvpMetadata(value: unknown): LegacyRsvpMetadata {
  if (typeof value === "string") {
    try {
      return parseLegacyRsvpMetadata(JSON.parse(value));
    } catch {
      return { guests: [] };
    }
  }

  let rawGuests: unknown = value;
  let attendingCeremony: boolean | undefined;
  let attendingBanquet: boolean | undefined;

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const metadata = value as Record<string, unknown>;
    rawGuests = metadata.guests;
    attendingCeremony = typeof metadata.attendingCeremony === "boolean" ? metadata.attendingCeremony : undefined;
    attendingBanquet = typeof metadata.attendingBanquet === "boolean" ? metadata.attendingBanquet : undefined;
  }

  if (!Array.isArray(rawGuests)) {
    return { guests: [], attendingCeremony, attendingBanquet };
  }

  const guests = rawGuests.flatMap((item) => {
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

  return { guests, attendingCeremony, attendingBanquet };
}

export function mapRSVPRow(row: RSVPDatabaseRow): RSVPResponse {
  const legacyMetadata = parseLegacyRsvpMetadata(row.lodging_guests);

  return {
    id: row.id,
    inviteeId: row.invitee_id ?? undefined,
    inviteToken: row.invite_token ?? undefined,
    displayLabel: row.display_label ?? undefined,
    name: row.name,
    phone: row.phone,
    attendingCeremony: row.attending_ceremony ?? legacyMetadata.attendingCeremony,
    attendingBanquet: row.attending_banquet ?? legacyMetadata.attendingBanquet,
    attending: row.attending,
    guestCount: row.guest_count,
    guestGroup: row.guest_group,
    dietaryNote: row.dietary_note ?? undefined,
    transportNeeded: row.transport_needed,
    accommodationNeeded: row.accommodation_needed,
    stayingGuestCount: row.staying_guest_count ?? undefined,
    lodgingGuests: legacyMetadata.guests,
    checkInDate: row.check_in_date ?? undefined,
    checkOutDate: row.check_out_date ?? undefined,
    roomType: row.room_type ?? undefined,
    childrenCount: row.children_count,
    elderlySupportNeeded: row.elderly_support_needed,
    notes: row.notes ?? undefined,
    submittedAt: row.submitted_at,
  };
}

export function toRSVPInsert(
  response: Omit<RSVPResponse, "id" | "submittedAt">,
  options: { includeEventAttendanceColumns?: boolean } = {},
) {
  const includeEventAttendanceColumns = options.includeEventAttendanceColumns ?? true;
  const tokenColumns = response.inviteeId || response.inviteToken || response.displayLabel
    ? {
        invitee_id: response.inviteeId || null,
        invite_token: response.inviteToken || null,
        display_label: response.displayLabel || null,
      }
    : {};
  const eventAttendanceColumns = includeEventAttendanceColumns
    ? {
        attending_ceremony: response.attendingCeremony ?? null,
        attending_banquet: response.attendingBanquet ?? null,
      }
    : {};
  const lodgingGuests = includeEventAttendanceColumns
    ? response.lodgingGuests
    : {
        guests: response.lodgingGuests ?? [],
        attendingCeremony: response.attendingCeremony,
        attendingBanquet: response.attendingBanquet,
      };

  return {
    ...tokenColumns,
    ...eventAttendanceColumns,
    name: response.name,
    phone: response.phone,
    attending: response.attending,
    guest_count: response.guestCount,
    guest_group: response.guestGroup,
    dietary_note: response.dietaryNote || null,
    transport_needed: response.transportNeeded,
    accommodation_needed: response.accommodationNeeded,
    staying_guest_count: response.stayingGuestCount ?? null,
    lodging_guests: lodgingGuests,
    check_in_date: response.checkInDate || null,
    check_out_date: response.checkOutDate || null,
    room_type: response.roomType || null,
    children_count: response.childrenCount,
    elderly_support_needed: response.elderlySupportNeeded,
    notes: response.notes || null,
  };
}
