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
const { createInvitee } = require(join(outputDir, "lib", "invites.js"));
const adminPanelSource = readFileSync(join(rootDir, "src", "components", "admin", "InviteAdminPanel.tsx"), "utf8");

assert.match(adminPanelSource, /filterInviteesByLinkSide\(invitees, "groom"\)/);
assert.match(adminPanelSource, /filterInviteesByLinkSide\(invitees, "bride"\)/);
assert.match(adminPanelSource, /Nhà trai · \{groomSideInvitees\.length\}/);
assert.match(adminPanelSource, /Nhà gái · \{brideSideInvitees\.length\}/);
assert.match(adminPanelSource, /"Nhà trai và khách của Nhật", "nha-trai"/);
assert.match(adminPanelSource, /"Nhà gái và khách của Phương", "nha-gai"/);
assert.match(adminPanelSource, /danh-sach-link-thiep-moi\$\{scopeSuffix\}/);

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
assert.equal(groomSheet.getCell("B5").text, "Khách nhà trai");
assert.equal(groomSheet.getCell("B6").text, "Bạn Nhật");
assert.match(groomSheet.getCell("D5").text, /^https:\/\/nhatphuong\.love\/g\//);
assert.doesNotMatch(groomSheet.getCell("B5").text + groomSheet.getCell("B6").text, /nhà gái|Phương/i);

const brideWorkbook = await buildInviteLinksWorkbook(brideInvitees, "https://nhatphuong.love");
const brideSheet = brideWorkbook.getWorksheet("Link thiệp mời");
assert.ok(brideSheet, "Bride-side link workbook must contain its worksheet.");
assert.equal(brideSheet.rowCount, 6);
assert.equal(brideSheet.getCell("B5").text, "Khách nhà gái");
assert.equal(brideSheet.getCell("B6").text, "Bạn Phương");
assert.match(brideSheet.getCell("D6").text, /^https:\/\/nhatphuong\.love\/g\//);
assert.doesNotMatch(brideSheet.getCell("B5").text + brideSheet.getCell("B6").text, /nhà trai|Nhật/i);

console.log("Invite-link side checks passed: Nhà Trai includes Nhật, Nhà Gái includes Phương, unknown groups stay unassigned, and both workbooks contain only their intended guests.");
