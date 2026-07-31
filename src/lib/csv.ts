import { buildInviteUrl, type Invitee } from "@/lib/invites";
import { attendingLabel, summarizeLodgingGuests, type RSVPResponse } from "@/lib/rsvp-storage";

const columns: Array<[string, (response: RSVPResponse) => string | number | boolean | undefined]> = [
  ["Mã link riêng", (response) => response.inviteToken],
  ["Tên hiển thị", (response) => response.displayLabel],
  ["ID khách", (response) => response.inviteeId],
  ["Tên khách", (response) => response.name],
  ["Số điện thoại", (response) => response.phone],
  ["Tham dự", (response) => attendingLabel(response.attending)],
  ["Dự Thánh lễ", (response) => response.attendingCeremony === undefined ? "" : response.attendingCeremony ? "Có" : "Không"],
  ["Dự tiệc sau Hôn phối", (response) => {
    if (!response.postCeremonyPartyInvited || !response.attendingCeremony) return "Không áp dụng";
    if (response.attendingPostCeremonyParty === undefined) return "Chưa trả lời";
    return response.attendingPostCeremonyParty ? "Có" : "Không";
  }],
  ["Dự Tiệc cưới", (response) => response.attendingBanquet === undefined ? "" : response.attendingBanquet ? "Có" : "Không"],
  ["Số khách", (response) => response.guestCount],
  ["Nhóm khách", (response) => response.guestGroup],
  ["Ghi chú thực đơn", (response) => response.dietaryNote],
  ["Cần đưa đón", (response) => response.transportNeeded],
  ["Cần lưu trú", (response) => response.accommodationNeeded],
  ["Số khách lưu trú", (response) => response.stayingGuestCount],
  ["Danh sách người lưu trú", (response) => summarizeLodgingGuests(response.lodgingGuests ?? [])],
  ["Ngày nhận phòng", (response) => response.checkInDate],
  ["Ngày trả phòng", (response) => response.checkOutDate],
  ["Loại phòng", (response) => response.roomType],
  ["Số trẻ em", (response) => response.childrenCount],
  ["Cần hỗ trợ người lớn tuổi", (response) => response.elderlySupportNeeded],
  ["Ghi chú", (response) => response.notes],
  ["Thời gian gửi", (response) => response.submittedAt],
];

const inviteStatusLabels: Record<Invitee["inviteStatus"], string> = {
  invited: "Chưa gửi",
  rsvp_yes: "Đã xác nhận",
  rsvp_no: "Đã từ chối",
  rsvp_maybe: "Đang cân nhắc",
  supplement_ready: "Đã có bổ sung",
  album_ready: "Đã sẵn sàng xem album",
};

function escapeCsv(value: string | number | boolean | undefined) {
  const text = value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function toRSVPCsv(responses: RSVPResponse[]) {
  const header = columns.map(([column]) => column).join(",");
  const rows = responses.map((response) => columns.map(([, getValue]) => escapeCsv(getValue(response))).join(","));
  return [header, ...rows].join("\n");
}

export function serializeInviteLinksCsv(invitees: Invitee[], origin = "") {
  const header = [
    "Tên hiển thị",
    "Cụm xưng hô hiển thị",
    "Tên gốc hoặc cách nhà mình gọi",
    "Cách xưng hô in trên thiệp",
    "Mã link riêng",
    "Link thiệp riêng",
    "Nhóm khách mời",
    "Số khách dự kiến",
    "Hỏi tiệc sau Hôn phối",
    "Trạng thái RSVP",
    "Số điện thoại",
    "Ghi chú",
  ].join(",");

  const rows = invitees.map((invitee) => [
    escapeCsv(invitee.displayLabel),
    escapeCsv(invitee.displaySalutation),
    escapeCsv(invitee.guestName),
    escapeCsv(invitee.invitationName),
    escapeCsv(invitee.token),
    escapeCsv(buildInviteUrl(invitee.token, origin)),
    escapeCsv(invitee.guestGroup),
    escapeCsv(invitee.expectedGuestCount),
    escapeCsv(invitee.postCeremonyPartyInvited ? "Có" : ""),
    escapeCsv(inviteStatusLabels[invitee.inviteStatus]),
    escapeCsv(invitee.phone),
    escapeCsv(invitee.notes),
  ].join(","));

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
