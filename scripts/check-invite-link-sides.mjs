import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(rootDir, ".tmp-invite-link-sides-check");
const require = createRequire(import.meta.url);

rmSync(outputDir, { force: true, recursive: true });
execFileSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["tsc", "-p", "scripts/tsconfig.invite-link-sides.json"],
  { cwd: rootDir, stdio: "inherit" },
);

mkdirSync(join(outputDir, "node_modules", "@"), { recursive: true });
symlinkSync(join(outputDir, "lib"), join(outputDir, "node_modules", "@", "lib"), "dir");
symlinkSync(join(outputDir, "config"), join(outputDir, "node_modules", "@", "config"), "dir");

const { buildInviteLinksWorkbook } = require(join(outputDir, "lib", "invite-spreadsheet.js"));
const { filterInviteesByLinkSide, resolveInviteLinkSide } = require(join(outputDir, "lib", "invite-link-side.js"));
const { preserveExistingInviteLinks } = require(join(outputDir, "lib", "invite-import.js"));
const { createInvitee } = require(join(outputDir, "lib", "invites.js"));
const adminPanelSource = readFileSync(join(rootDir, "src", "components", "admin", "InviteAdminPanel.tsx"), "utf8");
const inviteApiSource = readFileSync(join(rootDir, "src", "app", "api", "invites", "[token]", "route.ts"), "utf8");

assert.match(adminPanelSource, /filterInviteesByLinkSide\(invitees, "groom"\)/);
assert.match(adminPanelSource, /filterInviteesByLinkSide\(invitees, "bride"\)/);
assert.match(adminPanelSource, /Nhà trai · \{groomSideInvitees\.length\}/);
assert.match(adminPanelSource, /Nhà gái · \{brideSideInvitees\.length\}/);
assert.match(adminPanelSource, /"Nhà trai và khách của Nhật", "nha-trai"/);
assert.match(adminPanelSource, /"Nhà gái và khách của Phương", "nha-gai"/);
assert.match(adminPanelSource, /danh-sach-link-thiep-moi\$\{scopeSuffix\}/);
assert.match(inviteApiSource, /notes:\s*""/);

const cases = [
  ["[Nhà Trai] Họ nội", "groom"],
  ["[Nhà Trai] Họ ngoại", "groom"],
  ["[Nhà Trai] Khách ba", "groom"],
  ["[Nhà Trai] Khách mẹ", "groom"],
  ["Nhà Trai - Khách ba", "groom"],
  ["[Nhật] Bạn bè & Đồng nghiệp", "groom"],
  ["[Nhà Gái] Họ nội", "bride"],
  ["[Nhà Gái] Họ ngoại", "bride"],
  ["[Nhà Gái] Khách ba", "bride"],
  ["[Nhà Gái] Khách mẹ", "bride"],
  ["Nhà Gái - Khách mẹ", "bride"],
  ["[Phương] Bạn bè & Đồng nghiệp", "bride"],
  ["Khác", null],
  ["", null],
];

for (const [guestGroup, expected] of cases) {
  assert.equal(resolveInviteLinkSide(guestGroup), expected, `Unexpected link side for ${guestGroup || "blank group"}.`);
}

const invitees = [
  createInvitee({ guestName: "Khách nhà trai", displayLabel: "Khách nhà trai", invitationName: "Khách nhà trai", guestGroup: "[Nhà Trai] Họ nội" }),
  createInvitee({ guestName: "Bạn Nhật", displayLabel: "Bạn Nhật", invitationName: "Bạn Nhật", guestGroup: "[Nhật] Bạn bè & Đồng nghiệp" }),
  createInvitee({ guestName: "Khách nhà gái", displayLabel: "Khách nhà gái", invitationName: "Khách nhà gái", guestGroup: "[Nhà Gái] Họ ngoại" }),
  createInvitee({ guestName: "Bạn Phương", displayLabel: "Bạn Phương", invitationName: "Bạn Phương", guestGroup: "[Phương] Bạn bè & Đồng nghiệp" }),
  createInvitee({ guestName: "Chưa phân nhóm", displayLabel: "Chưa phân nhóm", invitationName: "Chưa phân nhóm", guestGroup: "Khác" }),
];

const groomInvitees = filterInviteesByLinkSide(invitees, "groom");
const brideInvitees = filterInviteesByLinkSide(invitees, "bride");

assert.deepEqual(groomInvitees.map((invitee) => invitee.invitationName), ["Khách nhà trai", "Bạn Nhật"]);
assert.deepEqual(brideInvitees.map((invitee) => invitee.invitationName), ["Khách nhà gái", "Bạn Phương"]);

const groomWorkbook = await buildInviteLinksWorkbook(groomInvitees, "https://nhatphuong.love");
const groomSheet = groomWorkbook.getWorksheet("Link thiệp mời");
assert.ok(groomSheet, "Groom-side link workbook must contain its worksheet.");
assert.equal(groomSheet.rowCount, 6);
assert.equal(groomSheet.getCell("C4").text, "Nhóm khách");
assert.equal(groomSheet.getCell("D4").text, "Chi tiết (Optional)");
assert.equal(groomSheet.getCell("E4").text, "Tham gia tiệc sau Hôn phối");
assert.equal(groomSheet.getCell("B5").text, "Khách nhà trai");
assert.equal(groomSheet.getCell("B6").text, "Bạn Nhật");
assert.equal(groomSheet.getCell("C5").text, "[Nhà Trai] Họ nội");
assert.equal(groomSheet.getCell("C6").text, "[Nhật] Bạn bè & Đồng nghiệp");
assert.equal(groomSheet.getCell("D5").text, "");
assert.match(groomSheet.getCell("F5").text, /^https:\/\/nhatphuong\.love\/g\//);
assert.doesNotMatch(groomSheet.getCell("B5").text + groomSheet.getCell("B6").text, /nhà gái|Phương/i);

const brideWorkbook = await buildInviteLinksWorkbook(brideInvitees, "https://nhatphuong.love");
const brideSheet = brideWorkbook.getWorksheet("Link thiệp mời");
assert.ok(brideSheet, "Bride-side link workbook must contain its worksheet.");
assert.equal(brideSheet.rowCount, 6);
assert.equal(brideSheet.getCell("B5").text, "Khách nhà gái");
assert.equal(brideSheet.getCell("B6").text, "Bạn Phương");
assert.equal(brideSheet.getCell("C5").text, "[Nhà Gái] Họ ngoại");
assert.equal(brideSheet.getCell("C6").text, "[Phương] Bạn bè & Đồng nghiệp");
assert.equal(brideSheet.getCell("D5").text, "");
assert.match(brideSheet.getCell("F6").text, /^https:\/\/nhatphuong\.love\/g\//);
assert.doesNotMatch(brideSheet.getCell("B5").text + brideSheet.getCell("B6").text, /nhà trai|Nhật/i);

const duplicateFamilyName = "Gia đình anh Trung";
const duplicateInvitees = [
  createInvitee({ guestName: duplicateFamilyName, displayLabel: duplicateFamilyName, invitationName: duplicateFamilyName, guestGroup: "[Nhà Gái] Khách ba" }),
  createInvitee({ guestName: duplicateFamilyName, displayLabel: duplicateFamilyName, invitationName: duplicateFamilyName, guestGroup: "[Nhà Gái] Khách ba", notes: "Công giáo" }),
];
const duplicateWorkbook = await buildInviteLinksWorkbook(duplicateInvitees, "https://nhatphuong.love");
const duplicateSheet = duplicateWorkbook.getWorksheet("Link thiệp mời");
assert.ok(duplicateSheet, "Duplicate-name workbook must contain its worksheet.");
assert.equal(duplicateSheet.getCell("B5").text, duplicateFamilyName);
assert.equal(duplicateSheet.getCell("B6").text, duplicateFamilyName);
assert.equal(duplicateSheet.getCell("C5").text, "[Nhà Gái] Khách ba");
assert.equal(duplicateSheet.getCell("C6").text, "[Nhà Gái] Khách ba");
assert.equal(duplicateSheet.getCell("D5").text, "");
assert.equal(duplicateSheet.getCell("D6").text, "Công giáo");
assert.match(duplicateSheet.getCell("F5").text, /^https:\/\/nhatphuong\.love\/g\//);
assert.match(duplicateSheet.getCell("F6").text, /^https:\/\/nhatphuong\.love\/g\//);

const priestFullName = "Cha Linh Hướng Giuse";
const priestWorkbook = await buildInviteLinksWorkbook([
  createInvitee({
    guestName: priestFullName,
    displayLabel: priestFullName,
    invitationName: "Cha",
    salutationCluster: "Cha",
    guestGroup: "[Nhà Gái] Khách ba",
    notes: "Cha đạo",
  }),
], "https://nhatphuong.love");
const priestSheet = priestWorkbook.getWorksheet("Link thiệp mời");
assert.ok(priestSheet, "Priest link workbook must contain its worksheet.");
assert.equal(priestSheet.getCell("B5").text, priestFullName);
assert.equal(priestSheet.getCell("C5").text, "[Nhà Gái] Khách ba");
assert.equal(priestSheet.getCell("D5").text, "Cha đạo");

const preservedDuplicates = preserveExistingInviteLinks(
  duplicateInvitees.map((invitee) => createInvitee({ ...invitee, id: undefined, token: undefined })),
  duplicateInvitees,
);
assert.equal(new Set(preservedDuplicates.map((invitee) => invitee.token)).size, 2);
assert.equal(preservedDuplicates[0].token, duplicateInvitees[0].token);
assert.equal(preservedDuplicates[1].token, duplicateInvitees[1].token);
assert.equal(preservedDuplicates[1].notes, "Công giáo");

console.log("Invite-link side checks passed: both exports keep Nhóm khách, Chi tiết (Optional), and post-ceremony access in separate columns, while preserving side filtering.");
