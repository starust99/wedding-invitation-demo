import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { attendingLabel, summarizeLodgingGuests, type RSVPResponse } from "@/lib/rsvp-storage";

export const runtime = "nodejs";

type RsvpWorkbookPayload = {
  responses?: RSVPResponse[];
  title?: string;
};

const borderStyle: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFE8DDCC" } },
  left: { style: "thin", color: { argb: "FFE8DDCC" } },
  bottom: { style: "thin", color: { argb: "FFE8DDCC" } },
  right: { style: "thin", color: { argb: "FFE8DDCC" } },
};

function text(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function formatBoolean(value: boolean) {
  return value ? "Có" : "Không";
}

function normalizeResponses(value: unknown): RSVPResponse[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const response = item as Partial<RSVPResponse>;
    if (!response.id || !response.name || !response.attending) return [];

    return [{
      id: text(response.id),
      inviteeId: response.inviteeId ? text(response.inviteeId) : undefined,
      inviteToken: response.inviteToken ? text(response.inviteToken) : undefined,
      displayLabel: response.displayLabel ? text(response.displayLabel) : undefined,
      name: text(response.name),
      phone: text(response.phone),
      attendingCeremony: typeof response.attendingCeremony === "boolean" ? response.attendingCeremony : undefined,
      attendingBanquet: typeof response.attendingBanquet === "boolean" ? response.attendingBanquet : undefined,
      attending: response.attending === "no" ? "no" : response.attending === "maybe" ? "maybe" : "yes",
      guestCount: Number(response.guestCount) || 0,
      guestGroup: text(response.guestGroup),
      dietaryNote: response.dietaryNote ? text(response.dietaryNote) : undefined,
      transportNeeded: Boolean(response.transportNeeded),
      accommodationNeeded: Boolean(response.accommodationNeeded),
      stayingGuestCount: typeof response.stayingGuestCount === "number" ? response.stayingGuestCount : undefined,
      lodgingGuests: Array.isArray(response.lodgingGuests) ? response.lodgingGuests : [],
      checkInDate: response.checkInDate ? text(response.checkInDate) : undefined,
      checkOutDate: response.checkOutDate ? text(response.checkOutDate) : undefined,
      roomType: response.roomType ? text(response.roomType) : undefined,
      childrenCount: Number(response.childrenCount) || 0,
      elderlySupportNeeded: Boolean(response.elderlySupportNeeded),
      notes: response.notes ? text(response.notes) : undefined,
      submittedAt: text(response.submittedAt),
    } satisfies RSVPResponse];
  });
}

function styleWorksheet(worksheet: ExcelJS.Worksheet, autoFilter: string) {
  worksheet.autoFilter = autoFilter;
  worksheet.views = [{ state: "frozen", ySplit: 1 }];

  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5F6F4E" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = borderStyle;
  });

  worksheet.eachRow((row, rowIndex) => {
    if (rowIndex === 1) return;
    row.height = 32;
    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = borderStyle;
    });
  });
}

function addSummarySheet(workbook: ExcelJS.Workbook, responses: RSVPResponse[], title: string) {
  const worksheet = workbook.addWorksheet("Tổng quan");
  const attendingYes = responses.filter((response) => response.attending === "yes");
  const stayingResponses = responses.filter((response) => response.accommodationNeeded);
  const stayingGuests = responses.reduce((sum, response) => sum + (response.stayingGuestCount ?? response.lodgingGuests.length), 0);

  worksheet.columns = [
    { key: "label", width: 34 },
    { key: "value", width: 24 },
  ];

  [
    ["Báo cáo", title],
    ["Ngày xuất", new Date().toLocaleString("vi-VN")],
    ["Tổng lời hồi đáp", responses.length],
    ["Số khách xác nhận tham dự", attendingYes.reduce((sum, response) => sum + response.guestCount, 0)],
    ["Số lời từ chối", responses.filter((response) => response.attending === "no").length],
    ["Số yêu cầu lưu trú", stayingResponses.length],
    ["Tổng người ở lại", stayingGuests],
    ["Trẻ em ở lại", responses.reduce((sum, response) => sum + response.childrenCount, 0)],
    ["Người lớn tuổi cần hỗ trợ", responses.filter((response) => response.elderlySupportNeeded).length],
  ].forEach(([label, value]) => worksheet.addRow({ label, value }));

  worksheet.eachRow((row, rowIndex) => {
    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = borderStyle;
      if (rowIndex === 1) {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5F6F4E" } };
      }
    });
  });
}

function addResponsesSheet(workbook: ExcelJS.Workbook, responses: RSVPResponse[]) {
  const worksheet = workbook.addWorksheet("Tổng hợp RSVP");
  worksheet.columns = [
    { key: "displayLabel", header: "Tên trên link", width: 28 },
    { key: "name", header: "Họ tên khách điền", width: 30 },
    { key: "phone", header: "Số điện thoại", width: 18 },
    { key: "attendingCeremony", header: "Dự Thánh lễ", width: 18 },
    { key: "attendingBanquet", header: "Dự Tiệc mừng", width: 18 },
    { key: "attending", header: "Phản hồi chung", width: 20 },
    { key: "guestCount", header: "Số khách", width: 12 },
    { key: "guestGroup", header: "Nhóm khách", width: 22 },
    { key: "transport", header: "Cần đưa đón", width: 14 },
    { key: "accommodation", header: "Cần lưu trú", width: 14 },
    { key: "stayingGuestCount", header: "Số người ở lại", width: 16 },
    { key: "checkInDate", header: "Ngày nhận phòng", width: 18 },
    { key: "checkOutDate", header: "Ngày trả phòng", width: 18 },
    { key: "roomType", header: "Loại phòng", width: 18 },
    { key: "lodgingGuests", header: "Danh sách người lưu trú", width: 58 },
    { key: "dietaryNote", header: "Ghi chú thực đơn", width: 30 },
    { key: "notes", header: "Ghi chú khác", width: 34 },
    { key: "submittedAt", header: "Thời gian gửi", width: 24 },
  ];

  responses.forEach((response) => {
    worksheet.addRow({
      displayLabel: response.displayLabel || response.inviteToken || "",
      name: response.name,
      phone: response.phone,
      attendingCeremony: response.attendingCeremony !== undefined ? formatBoolean(response.attendingCeremony) : "-",
      attendingBanquet: response.attendingBanquet !== undefined ? formatBoolean(response.attendingBanquet) : "-",
      attending: attendingLabel(response.attending),
      guestCount: response.guestCount,
      guestGroup: response.guestGroup,
      transport: formatBoolean(response.transportNeeded),
      accommodation: formatBoolean(response.accommodationNeeded),
      stayingGuestCount: response.stayingGuestCount ?? response.lodgingGuests.length,
      checkInDate: response.checkInDate,
      checkOutDate: response.checkOutDate,
      roomType: response.roomType,
      lodgingGuests: summarizeLodgingGuests(response.lodgingGuests),
      dietaryNote: response.dietaryNote,
      notes: response.notes,
      submittedAt: response.submittedAt,
    });
  });

  styleWorksheet(worksheet, "A1:R1");
}

function addLodgingSheet(workbook: ExcelJS.Workbook, responses: RSVPResponse[]) {
  const worksheet = workbook.addWorksheet("Danh sách lưu trú");
  worksheet.columns = [
    { key: "inviteGuest", header: "Khách đại diện", width: 28 },
    { key: "phone", header: "Số điện thoại", width: 18 },
    { key: "lodgingName", header: "Họ tên người ở lại", width: 30 },
    { key: "idNumber", header: "CCCD/Hộ chiếu", width: 22 },
    { key: "type", header: "Người lớn/trẻ em", width: 18 },
    { key: "age", header: "Tuổi trẻ em", width: 14 },
    { key: "checkInDate", header: "Ngày nhận phòng", width: 18 },
    { key: "checkOutDate", header: "Ngày trả phòng", width: 18 },
    { key: "roomType", header: "Loại phòng mong muốn", width: 24 },
    { key: "elderlySupport", header: "Cần hỗ trợ người lớn tuổi", width: 26 },
    { key: "notes", header: "Ghi chú", width: 36 },
  ];

  responses.filter((response) => response.accommodationNeeded).forEach((response) => {
    const guests = response.lodgingGuests.length
      ? response.lodgingGuests
      : [{ fullName: response.name, isChild: false }];

    guests.forEach((guest) => {
      worksheet.addRow({
        inviteGuest: response.displayLabel || response.name,
        phone: response.phone,
        lodgingName: guest.fullName,
        idNumber: guest.idNumber,
        type: guest.isChild ? "Trẻ em" : "Người lớn",
        age: guest.age,
        checkInDate: response.checkInDate,
        checkOutDate: response.checkOutDate,
        roomType: response.roomType,
        elderlySupport: formatBoolean(response.elderlySupportNeeded),
        notes: response.notes,
      });
    });
  });

  styleWorksheet(worksheet, "A1:K1");
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as RsvpWorkbookPayload;
  const responses = normalizeResponses(body.responses);

  if (responses.length === 0) {
    return NextResponse.json({ error: "Chưa có lời hồi đáp để xuất Excel." }, { status: 400 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "wedding-invitation-demo";
  workbook.created = new Date();
  workbook.modified = new Date();

  const title = body.title || "Tổng hợp lời hồi đáp";
  addSummarySheet(workbook, responses, title);
  addResponsesSheet(workbook, responses);
  addLodgingSheet(workbook, responses);

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="tong-hop-hoi-dap.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
