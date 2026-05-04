import type { RSVPResponse } from "@/lib/rsvp-storage";

export type RSVPDatabaseRow = {
  id: string;
  name: string;
  phone: string;
  attending: "yes" | "no" | "maybe";
  guest_count: number;
  guest_group: string;
  dietary_note: string | null;
  transport_needed: boolean;
  accommodation_needed: boolean;
  staying_guest_count: number | null;
  check_in_date: string | null;
  check_out_date: string | null;
  room_type: string | null;
  children_count: number;
  elderly_support_needed: boolean;
  notes: string | null;
  submitted_at: string;
};

export function mapRSVPRow(row: RSVPDatabaseRow): RSVPResponse {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    attending: row.attending,
    guestCount: row.guest_count,
    guestGroup: row.guest_group,
    dietaryNote: row.dietary_note ?? undefined,
    transportNeeded: row.transport_needed,
    accommodationNeeded: row.accommodation_needed,
    stayingGuestCount: row.staying_guest_count ?? undefined,
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
  return {
    name: response.name,
    phone: response.phone,
    attending: response.attending,
    guest_count: response.guestCount,
    guest_group: response.guestGroup,
    dietary_note: response.dietaryNote || null,
    transport_needed: response.transportNeeded,
    accommodation_needed: response.accommodationNeeded,
    staying_guest_count: response.stayingGuestCount ?? null,
    check_in_date: response.checkInDate || null,
    check_out_date: response.checkOutDate || null,
    room_type: response.roomType || null,
    children_count: response.childrenCount,
    elderly_support_needed: response.elderlySupportNeeded,
    notes: response.notes || null,
  };
}
