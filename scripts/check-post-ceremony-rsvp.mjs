import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, rmSync, symlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(rootDir, ".tmp-post-ceremony-check");
const require = createRequire(import.meta.url);

rmSync(outputDir, { force: true, recursive: true });
execFileSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  [
    "tsc",
    "-p",
    "scripts/tsconfig.post-ceremony.json",
  ],
  { cwd: rootDir, stdio: "inherit" },
);

mkdirSync(join(outputDir, "node_modules", "@"), { recursive: true });
symlinkSync(join(outputDir, "lib"), join(outputDir, "node_modules", "@", "lib"), "dir");
symlinkSync(join(outputDir, "config"), join(outputDir, "node_modules", "@", "config"), "dir");

const spreadsheet = require(join(outputDir, "lib", "invite-spreadsheet.js"));
const inviteMapper = require(join(outputDir, "lib", "invite-mapper.js"));
const postCeremony = require(join(outputDir, "lib", "post-ceremony-rsvp.js"));
const rsvpMapper = require(join(outputDir, "lib", "rsvp-mapper.js"));
const rsvpWish = require(join(outputDir, "lib", "rsvp-wish.js"));

const workbook = await spreadsheet.buildInviteTemplateWorkbook({ coupleDisplayName: "Nhật & Phương" });
await workbook.xlsx.writeFile(join(outputDir, "mau-danh-sach-khach-moi.xlsx"));
const sheet = workbook.getWorksheet("Danh sách khách mời");
assert(sheet, "Template sheet is missing.");
assert.equal(workbook.worksheets.filter((worksheet) => worksheet.state === "visible").length, 1);
assert.equal(workbook.getWorksheet("_Dữ liệu hệ thống")?.state, "veryHidden");
assert.equal(workbook.getWorksheet("_Dữ liệu hệ thống")?.getCell("N1").text, "Dòng dữ liệu");
assert.equal(workbook.getWorksheet("_Dữ liệu hệ thống")?.getCell("O1").text, "Ghi chú nội bộ");
assert.equal(sheet.getCell("A1").text, "DANH SÁCH KHÁCH MỜI");
assert.equal(sheet.getCell("A2").text, "Lễ thành hôn Nhật & Phương");
assert.equal(sheet.getCell("A1").isMerged, true);
assert.equal(sheet.views[0]?.xSplit, 4);
assert.equal(sheet.views[0]?.ySplit, 4);
assert(sheet.sheetProtection, "The input sheet must protect formula and presentation cells.");
assert.deepEqual(
  [1, 2, 3, 4, 5, 6, 7].map((column) => sheet.getCell(4, column).text),
  ["STT", "Cụm danh xưng", "Tên khách", "Cụm tên khách", "Đơn vị khách", "Nhóm khách", "Tham gia tiệc sau Hôn phối"],
);
assert.equal(sheet.getCell("H4").text, "", "The derived invitation sentence must not be exported as an input column.");
assert.equal(sheet.getCell("G1").isMerged, true);
assert.equal(sheet.getCell("H1").isMerged, false);
assert.equal(sheet.getCell("G5").text, "", "New rows must leave the optional field blank.");
assert.equal(sheet.getCell("G5").dataValidation.allowBlank, true);
assert.equal(sheet.getCell("G5").dataValidation.type, "list");
assert.notEqual(sheet.getCell("G5").dataValidation.showInputMessage, true);
assert.equal(sheet.getCell("F5").dataValidation.type, "list");
const guestGroupOptions = spreadsheet.getSimpleInviteEntryOptions().guestGroups;
assert(spreadsheet.getSimpleInviteEntryOptions().salutationClusters.includes("Cha"));
assert(spreadsheet.getSimpleInviteEntryOptions().salutationClusters.includes("Bà nội"));
assert(spreadsheet.getSimpleInviteEntryOptions().salutationClusters.includes("Bà ngoại"));
for (const lodgingGroup of [
  "[Nhà Trai] Họ nội",
  "[Nhà Trai] Họ ngoại",
  "[Nhà Gái] Họ nội",
  "[Nhà Gái] Họ ngoại",
]) {
  assert(guestGroupOptions.includes(lodgingGroup), `Missing lodging classification group: ${lodgingGroup}`);
}
assert.equal(sheet.getCell("A5").protection.locked, true);
assert.equal(sheet.getCell("B5").protection.locked, false);
assert.equal(sheet.getCell("D5").protection.locked, true);
assert.equal(sheet.getCell("E5").protection.locked, true);
assert.match(sheet.getCell("A5").formula, /COUNTIF\(\$D\$5:\$D5/);
assert.match(sheet.getCell("D5").formula, /VLOOKUP.*6,FALSE/);
assert.match(sheet.getCell("D5").formula, /VLOOKUP.*7,FALSE/);
assert.match(sheet.getCell("E5").formula, /VLOOKUP.*4,FALSE/);

sheet.getCell("B5").value = "Gia đình anh chị";
sheet.getCell("C5").value = "Tuấn";
sheet.getCell("F5").value = "[Nhật] Bạn bè & Đồng nghiệp";
sheet.getCell("G5").value = "Có";
workbook.getWorksheet("_Dữ liệu hệ thống").getCell("N2").value = 5;
workbook.getWorksheet("_Dữ liệu hệ thống").getCell("O2").value = "DNCG";
sheet.getCell("B6").value = "Chị + Người thương";
sheet.getCell("C6").value = "Chi";
sheet.getCell("F6").value = "[Nhật] Bạn bè & Đồng nghiệp";
sheet.getCell("B7").value = "Anh";
sheet.getCell("C7").value = "Dũng";
sheet.getCell("F7").value = "[Nhật] Bạn bè & Đồng nghiệp";
sheet.getCell("B8").value = "Vợ chồng bạn";
sheet.getCell("C8").value = "Bảo";
sheet.getCell("F8").value = "[Nhật] Bạn bè & Đồng nghiệp";
sheet.getCell("B9").value = "Cha";
sheet.getCell("C9").value = "Linh Hướng Giuse";
sheet.getCell("F9").value = "[Nhà Gái] Khách ba";
workbook.getWorksheet("_Dữ liệu hệ thống").getCell("N3").value = 9;
workbook.getWorksheet("_Dữ liệu hệ thống").getCell("O3").value = "Công giáo";
sheet.getCell("B10").value = "Bà ngoại";
sheet.getCell("F10").value = "[Nhà Gái] Họ ngoại";
await workbook.xlsx.writeFile(join(outputDir, "mau-danh-sach-khach-moi-co-du-lieu.xlsx"));

const parsed = await spreadsheet.parseInviteWorkbook(await workbook.xlsx.writeBuffer());
assert.deepEqual(parsed.errors, []);
assert.equal(parsed.hasPostCeremonyPartyColumn, true);
assert.equal(parsed.invitees.length, 6);
assert.equal(parsed.invitees[0].postCeremonyPartyInvited, true);
assert.equal(parsed.invitees[0].notes, "DNCG");
assert.equal(parsed.invitees[1].postCeremonyPartyInvited, false);
assert.equal(parsed.invitees[1].displayLabel, "Chị Chi & Người thương");
assert.equal(parsed.invitees[1].salutationCluster, "Anh chị");
assert.equal(parsed.invitees[1].householdMode, "couple");
assert.equal(parsed.invitees[1].plusOnePolicy, "lover");
assert.equal(parsed.invitees[1].expectedGuestCount, 2);
assert.equal(parsed.invitees[3].displayLabel, "Vợ chồng bạn Bảo");
assert.equal(parsed.invitees[3].householdMode, "family");
assert.equal(parsed.invitees[3].plusOnePolicy, "family");
assert.equal(parsed.invitees[3].expectedGuestCount, 4);
assert.equal(parsed.invitees[4].displayLabel, "Cha Linh Hướng Giuse");
assert.equal(parsed.invitees[4].salutationCluster, "Cha");
assert.equal(parsed.invitees[4].displaySalutation, "Cha");
assert.equal(parsed.invitees[4].invitationName, "Cha Linh Hướng Giuse");
assert.equal(parsed.invitees[4].honorific, "cha");
assert.equal(parsed.invitees[4].householdMode, "single");
assert.equal(parsed.invitees[4].expectedGuestCount, 1);
assert.equal(parsed.invitees[4].notes, "Công giáo");
assert.equal(parsed.invitees[5].displayLabel, "Bà ngoại");
assert.equal(parsed.invitees[5].salutationCluster, "Bà ngoại");
assert.equal(parsed.invitees[5].guestName, "Bà ngoại");
assert.equal(parsed.invitees[5].householdMode, "single");
assert.equal(parsed.invitees[5].expectedGuestCount, 1);

sheet.getCell("G7").value = "Không";
const invalid = await spreadsheet.parseInviteWorkbook(await workbook.xlsx.writeBuffer());
assert.match(invalid.errors.join(" "), /chỉ nhận giá trị Có hoặc để trống/);

const legacyWorkbook = await spreadsheet.buildInviteTemplateWorkbook({ coupleDisplayName: "Nhật & Phương" });
const legacySheet = legacyWorkbook.getWorksheet("Danh sách khách mời");
legacySheet.spliceColumns(7, 1);
legacySheet.getCell("B5").value = "Anh";
legacySheet.getCell("C5").value = "Dũng";
legacySheet.getCell("F5").value = "[Nhật] Bạn bè & Đồng nghiệp";
const legacyParsed = await spreadsheet.parseInviteWorkbook(await legacyWorkbook.xlsx.writeBuffer());
assert.deepEqual(legacyParsed.errors, []);
assert.equal(legacyParsed.hasPostCeremonyPartyColumn, false);
assert.equal(legacyParsed.invitees[0].postCeremonyPartyInvited, false);

const oldTemplateWorkbook = await spreadsheet.buildInviteTemplateWorkbook({ coupleDisplayName: "Nhật & Phương" });
const oldTemplateSheet = oldTemplateWorkbook.getWorksheet("Danh sách khách mời");
oldTemplateSheet.getCell("H4").value = "Lời mời trong thiệp";
oldTemplateSheet.getCell("B5").value = "Anh";
oldTemplateSheet.getCell("C5").value = "Dũng";
oldTemplateSheet.getCell("F5").value = "[Nhật] Bạn bè & Đồng nghiệp";
oldTemplateSheet.getCell("G5").value = "Có";
oldTemplateSheet.getCell("H5").value = "Nội dung cũ không còn là nguồn dữ liệu.";
const oldTemplateParsed = await spreadsheet.parseInviteWorkbook(await oldTemplateWorkbook.xlsx.writeBuffer());
assert.deepEqual(oldTemplateParsed.errors, []);
assert.equal(oldTemplateParsed.invitees.length, 1);
assert.equal(oldTemplateParsed.invitees[0].postCeremonyPartyInvited, true);
assert.notEqual(oldTemplateParsed.invitees[0].insideInviteLine, oldTemplateSheet.getCell("H5").text);

const linkWorkbook = await spreadsheet.buildInviteLinksWorkbook(parsed.invitees, "https://nhatphuong.love");
const linkSheet = linkWorkbook.getWorksheet("Link thiệp mời");
assert(linkSheet, "Invite-link sheet is missing.");
assert.deepEqual(
  [1, 2, 3, 4, 5].map((column) => linkSheet.getCell(4, column).text),
  ["STT", "Cụm tên khách", "Nhóm khách", "Mời tham gia tiệc sau Hôn phối", "Link thiệp"],
);
assert.equal(linkSheet.getCell("A5").result, 1);
assert.match(linkSheet.getCell("A5").formula, /COUNTIF\(\$B\$5:B5/);
assert.equal(linkSheet.getCell("B5").text, "Gia đình anh chị Tuấn");
assert.equal(linkSheet.getCell("C5").text, "[Nhật] Bạn bè & Đồng nghiệp");
assert.equal(linkSheet.getCell("D5").text, "Có");
assert.equal(linkSheet.getCell("E5").hyperlink, `https://nhatphuong.love/g/${parsed.invitees[0].token}`);
assert.equal(linkSheet.getCell("C9").text, "Công giáo");

const mappedInvitee = inviteMapper.mapInviteeRow({
  id: "11111111-1111-4111-8111-111111111111",
  token: "gia-dinh-anh-chi-tuan-test",
  invite_unit: "household",
  guest_name: "Gia đình anh chị Tuấn",
  display_label: "Gia đình anh chị Tuấn",
  salutation_cluster: "Gia đình anh chị",
  invitation_name: "Gia đình anh chị Tuấn",
  honorific: "",
  envelope_line: "",
  inside_invite_line: "",
  invited_by: "couple",
  relationship: "",
  household_mode: "family",
  plus_one_policy: "family",
  guest_group: "[Nhật] Bạn bè & Đồng nghiệp",
  audience_tags: [],
  expected_guest_count: 4,
  post_ceremony_party_invited: true,
  phone: "",
  email: "",
  notes: "",
  invite_status: "invited",
  created_at: "2026-07-31T00:00:00.000Z",
  updated_at: "2026-07-31T00:00:00.000Z",
});
assert.equal(mappedInvitee.postCeremonyPartyInvited, true);
assert.equal(inviteMapper.toInviteeUpsert(mappedInvitee).post_ceremony_party_invited, true);

const response = {
  inviteeId: mappedInvitee.id,
  inviteToken: mappedInvitee.token,
  displayLabel: mappedInvitee.displayLabel,
  name: mappedInvitee.displayLabel,
  phone: "",
  attendingCeremony: true,
  attendingPostCeremonyParty: true,
  attendingBanquet: false,
  attending: "yes",
  guestCount: 4,
  guestGroup: mappedInvitee.guestGroup,
  transportNeeded: false,
  accommodationNeeded: false,
  lodgingGuests: [],
  childrenCount: 0,
  elderlySupportNeeded: false,
};
const insert = rsvpMapper.toRSVPInsert(response);
assert.equal(insert.attending_ceremony, true);
assert.equal(insert.attending_post_ceremony_party, true);
assert.equal(insert.attending_banquet, false);
assert.deepEqual(insert.lodging_guests, []);
assert.equal("wish_message" in insert, false, "RSVP edits must preserve an existing post-RSVP wish.");

const roundTrip = rsvpMapper.mapRSVPRow({
  id: "22222222-2222-4222-8222-222222222222",
  invitee_id: mappedInvitee.id,
  invite_token: mappedInvitee.token,
  display_label: mappedInvitee.displayLabel,
  name: mappedInvitee.displayLabel,
  phone: "",
  attending_ceremony: true,
  attending_post_ceremony_party: true,
  attending_banquet: false,
  attending: "yes",
  guest_count: 4,
  guest_group: mappedInvitee.guestGroup,
  dietary_note: null,
  transport_needed: false,
  accommodation_needed: false,
  staying_guest_count: 0,
  lodging_guests: [],
  check_in_date: null,
  check_out_date: null,
  room_type: null,
  children_count: 0,
  elderly_support_needed: false,
  notes: null,
  wish_message: "Chúc hai bạn trăm năm hạnh phúc!",
  wish_sent_at: "2026-08-18T05:30:00.000Z",
  submitted_at: "2026-07-31T00:00:00.000Z",
});
assert.equal(roundTrip.attendingPostCeremonyParty, true);
assert.equal(roundTrip.wishMessage, "Chúc hai bạn trăm năm hạnh phúc!");
assert.equal(roundTrip.wishSentAt, "2026-08-18T05:30:00.000Z");

const legacyWishMarker = rsvpWish.encodeLegacyRsvpWish({
  message: "Chúc hai bạn luôn bình an!",
  sentAt: "2026-08-18T05:31:00.000Z",
});
assert.deepEqual(rsvpWish.parseLegacyRsvpWish(legacyWishMarker), {
  message: "Chúc hai bạn luôn bình an!",
  sentAt: "2026-08-18T05:31:00.000Z",
});
assert.equal(rsvpWish.preserveLegacyRsvpWishNotes(legacyWishMarker, null), legacyWishMarker);
assert.equal(rsvpWish.preserveLegacyRsvpWishNotes("Ghi chú thường", null), null);
const legacyWishRoundTrip = rsvpMapper.mapRSVPRow({
  id: "33333333-3333-4333-8333-333333333333",
  invitee_id: mappedInvitee.id,
  invite_token: mappedInvitee.token,
  display_label: mappedInvitee.displayLabel,
  name: mappedInvitee.displayLabel,
  phone: "",
  attending_ceremony: true,
  attending_post_ceremony_party: false,
  attending_banquet: true,
  attending: "yes",
  guest_count: 1,
  guest_group: mappedInvitee.guestGroup,
  dietary_note: null,
  transport_needed: false,
  accommodation_needed: false,
  staying_guest_count: 0,
  lodging_guests: [],
  check_in_date: null,
  check_out_date: null,
  room_type: null,
  children_count: 0,
  elderly_support_needed: false,
  notes: legacyWishMarker,
  submitted_at: "2026-08-18T05:00:00.000Z",
});
assert.equal(legacyWishRoundTrip.notes, undefined);
assert.equal(legacyWishRoundTrip.wishMessage, "Chúc hai bạn luôn bình an!");
assert.equal(legacyWishRoundTrip.wishSentAt, "2026-08-18T05:31:00.000Z");

assert.deepEqual(
  postCeremony.resolvePostCeremonyPartyAnswer({
    invited: true,
    attendingCeremony: true,
    attendingBanquet: true,
    answer: true,
  }),
  { ok: true, applies: true, value: true },
);
assert.equal(
  postCeremony.resolvePostCeremonyPartyAnswer({
    invited: true,
    attendingCeremony: true,
    attendingBanquet: true,
    answer: undefined,
  }).ok,
  false,
);
assert.deepEqual(
  postCeremony.resolvePostCeremonyPartyAnswer({
    invited: false,
    attendingCeremony: true,
    attendingBanquet: true,
    answer: true,
  }),
  { ok: true, applies: false, value: undefined },
);
assert.deepEqual(
  postCeremony.resolvePostCeremonyPartyAnswer({
    invited: true,
    attendingCeremony: false,
    attendingBanquet: false,
    answer: true,
  }),
  { ok: true, applies: false, value: undefined },
);

assert.deepEqual(
  postCeremony.resolvePostCeremonyPartyAnswer({
    invited: false,
    attendingCeremony: true,
    attendingBanquet: false,
    answer: true,
  }),
  { ok: true, applies: true, value: true },
);
assert.equal(
  postCeremony.resolvePostCeremonyPartyAnswer({
    invited: false,
    attendingCeremony: false,
    attendingBanquet: false,
    answer: undefined,
  }).ok,
  false,
);

console.log("Post-ceremony RSVP checks passed: workbook, validation, invite mapping, and RSVP persistence.");
