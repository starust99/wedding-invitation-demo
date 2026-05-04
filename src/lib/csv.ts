import { attendingLabel, type RSVPResponse } from "@/lib/rsvp-storage";

const columns: Array<[string, (response: RSVPResponse) => string | number | boolean | undefined]> = [
  ["name", (response) => response.name],
  ["phone", (response) => response.phone],
  ["attending", (response) => attendingLabel(response.attending)],
  ["guest_count", (response) => response.guestCount],
  ["guest_group", (response) => response.guestGroup],
  ["dietary_note", (response) => response.dietaryNote],
  ["transport_needed", (response) => response.transportNeeded],
  ["accommodation_needed", (response) => response.accommodationNeeded],
  ["staying_guest_count", (response) => response.stayingGuestCount],
  ["check_in_date", (response) => response.checkInDate],
  ["check_out_date", (response) => response.checkOutDate],
  ["room_type", (response) => response.roomType],
  ["children_count", (response) => response.childrenCount],
  ["elderly_support_needed", (response) => response.elderlySupportNeeded],
  ["notes", (response) => response.notes],
  ["submitted_at", (response) => response.submittedAt],
];

function escapeCsv(value: string | number | boolean | undefined) {
  const text = value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function toRSVPCsv(responses: RSVPResponse[]) {
  const header = columns.map(([column]) => column).join(",");
  const rows = responses.map((response) => columns.map(([, getValue]) => escapeCsv(getValue(response))).join(","));
  return [header, ...rows].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
