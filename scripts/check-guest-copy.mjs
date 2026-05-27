import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(rootDir, ".tmp-guest-copy-check");
const require = createRequire(import.meta.url);

rmSync(outputDir, { force: true, recursive: true });
execFileSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  [
    "tsc",
    "src/lib/guest-personalization.ts",
    "--outDir",
    outputDir,
    "--target",
    "ES2022",
    "--module",
    "CommonJS",
    "--skipLibCheck",
  ],
  { cwd: rootDir, stdio: "inherit" },
);

const { buildInvitationCopy } = require(join(outputDir, "guest-personalization.js"));

const base = {
  coupleDisplayName: "Nhật & Phương",
  venueDisplayName: "Terracotta Đà Lạt",
};

const cases = [
  {
    name: "parents invite grandparents using parent relationship axis",
    input: {
      ...base,
      guestName: "Bố mẹ",
      invitationName: "Bố mẹ",
      hostRelationship: "bố mẹ",
      invitedBy: "parents",
      hostPronoun: "gia đình chúng con",
      coupleReference: "hai cháu",
      relationship: "ông bà của cô dâu/chú rể",
      householdMode: "couple",
      plusOnePolicy: "spouse",
    },
    includes: [
      ["insideInviteLine", "Gia đình chúng con trân trọng kính mời bố mẹ đến chung vui trong ngày cưới của hai cháu Nhật & Phương."],
      ["envelopeLine", "Kính mời: Bố mẹ"],
      ["closingLine", "Sự hiện diện của Bố Mẹ là niềm vinh hạnh và lời chúc phúc trọn vẹn nhất."],
    ],
    excludes: [
      ["insideInviteLine", "cùng Mẹ"],
      ["insideInviteLine", "cùng Bố"],
    ],
  },
  {
    name: "single parent host relationship can infer spouse when couple invited",
    input: {
      ...base,
      guestName: "Bố",
      invitationName: "Bố",
      hostRelationship: "bố",
      invitedBy: "parents",
      hostPronoun: "gia đình chúng con",
      coupleReference: "hai cháu",
      relationship: "bố/mẹ của cô dâu/chú rể",
      householdMode: "couple",
      plusOnePolicy: "spouse",
    },
    includes: [
      ["insideInviteLine", "Gia đình chúng con trân trọng kính mời bố mẹ đến chung vui trong ngày cưới của hai cháu Nhật & Phương."],
      ["envelopeLine", "Kính mời: Bố cùng Mẹ"],
      ["closingLine", "Sự hiện diện của Bố Mẹ là niềm vinh hạnh và lời chúc phúc trọn vẹn nhất."],
    ],
  },
  {
    name: "couple invites senior with spouse",
    input: {
      ...base,
      guestName: "Anh Hoàng",
      invitationName: "Anh Hoàng",
      hostRelationship: "anh",
      invitedBy: "couple",
      hostPronoun: "tụi em",
      coupleReference: "tụi em",
      householdMode: "couple",
      plusOnePolicy: "spouse",
    },
    includes: [
      ["insideInviteLine", "Tụi em trân trọng kính mời anh chị đến chung vui trong ngày cưới của tụi em."],
      ["closingLine", "Sự hiện diện của anh chị là niềm vinh hạnh và lời chúc phúc trọn vẹn nhất."],
      ["envelopeLine", "Kính mời: Anh Hoàng cùng vợ"],
      ["dressCodeLine", "Vì Đà Lạt vào đông rất lạnh, xin lưu ý anh chị mặc thật ấm.\n\nTông màu trang phục gợi ý: hồng phấn, xanh da trời, kem hoặc xanh lá dịu để khung hình thêm phần hài hòa."],
    ],
    excludes: [
      ["insideInviteLine", "Nhật & Phương"],
    ],
  },
  {
    name: "explicit couple relationship uses vo chong anh wording",
    input: {
      ...base,
      guestName: "Vợ chồng anh Hoàng",
      invitationName: "Vợ chồng anh Hoàng",
      hostRelationship: "vợ chồng anh",
      invitedBy: "couple",
      hostPronoun: "tụi em",
      coupleReference: "tụi em",
      householdMode: "couple",
      plusOnePolicy: "spouse",
    },
    includes: [
      ["insideInviteLine", "Tụi em trân trọng kính mời anh chị đến chung vui trong ngày cưới của tụi em."],
      ["envelopeLine", "Kính mời: Vợ chồng anh Hoàng"],
      ["closingLine", "Sự hiện diện của anh chị là niềm vinh hạnh và lời chúc phúc trọn vẹn nhất."],
    ],
    excludes: [
      ["insideInviteLine", "Anh cùng vợ"],
    ],
  },
  {
    name: "explicit couple relationship uses vo chong em wording",
    input: {
      ...base,
      guestName: "Vợ chồng em Linh",
      invitationName: "Vợ chồng em Linh",
      hostRelationship: "vợ chồng em",
      invitedBy: "couple",
      hostPronoun: "anh chị",
      coupleReference: "anh chị",
      householdMode: "couple",
      plusOnePolicy: "spouse",
    },
    includes: [
      ["insideInviteLine", "Anh chị trân trọng kính mời em đến chung vui trong ngày cưới của anh chị."],
      ["envelopeLine", "Kính mời: Vợ chồng em Linh"],
      ["closingLine", "Sự hiện diện của hai em là niềm vinh hạnh và lời chúc phúc trọn vẹn nhất."],
    ],
  },
  {
    name: "couple invites anh chi without spouse wording drift",
    input: {
      ...base,
      guestName: "Anh Chị Hoàng",
      invitationName: "Anh Chị Hoàng",
      hostRelationship: "anh chị",
      invitedBy: "couple",
      hostPronoun: "tụi em",
      coupleReference: "tụi em",
      householdMode: "couple",
      plusOnePolicy: "spouse",
    },
    includes: [
      ["insideInviteLine", "Tụi em trân trọng kính mời anh chị đến chung vui trong ngày cưới của tụi em."],
      ["closingLine", "Sự hiện diện của anh chị là niềm vinh hạnh và lời chúc phúc trọn vẹn nhất."],
    ],
    excludes: [
      ["insideInviteLine", "anh cùng vợ"],
      ["insideInviteLine", "chị cùng chồng"],
    ],
  },
  {
    name: "bac spouse falls back to family wording",
    input: {
      ...base,
      guestName: "Bác Hùng",
      invitationName: "Bác Hùng",
      hostRelationship: "bác",
      invitedBy: "couple",
      hostPronoun: "tụi con",
      coupleReference: "tụi con",
      householdMode: "couple",
      plusOnePolicy: "spouse",
    },
    includes: [
      ["insideInviteLine", "Tụi con trân trọng kính mời hai bác đến chung vui trong ngày cưới của tụi con."],
      ["closingLine", "Sự hiện diện của Bác và gia đình là niềm vinh hạnh và lời chúc phúc trọn vẹn nhất."],
    ],
    excludes: [
      ["insideInviteLine", "người bạn đời"],
      ["envelopeLine", "người bạn đời"],
    ],
  },
  {
    name: "parents invite elder family",
    input: {
      ...base,
      guestName: "Chú Sáu",
      invitationName: "Chú Sáu",
      hostRelationship: "chú",
      invitedBy: "parents",
      hostPronoun: "gia đình chúng con",
      coupleReference: "hai cháu",
      householdMode: "family",
      plusOnePolicy: "family",
    },
    includes: [
      ["insideInviteLine", "Chúng con trân trọng kính mời gia đình đến chung vui trong ngày cưới của hai cháu Nhật & Phương."],
      ["closingLine", "Sự hiện diện của Chú và gia đình là niềm vinh hạnh và lời chúc phúc trọn vẹn nhất."],
      ["rsvpLead", "Gia đình chúng con mong nhận được lời hồi đáp để chuẩn bị đón tiếp chu đáo"],
    ],
  },
  {
    name: "couple invites friend warmly",
    input: {
      ...base,
      guestName: "Hoàng",
      invitationName: "Hoàng",
      hostRelationship: "bạn",
      invitedBy: "couple",
      hostPronoun: "tụi mình",
      coupleReference: "tụi mình",
      householdMode: "single",
      plusOnePolicy: "none",
    },
    includes: [
      ["heroGreeting", "Gửi Hoàng"],
      ["insideInviteLine", "Tụi mình mời bạn đến chung vui trong ngày cưới."],
      ["signaturePrefix", "Thân mến"],
    ],
  },
  {
    name: "hai ban pair keeps non-married wording",
    input: {
      ...base,
      guestName: "Hai bạn Tùng & Hương",
      invitationName: "Hai bạn Tùng & Hương",
      hostRelationship: "bạn",
      relationship: "bạn của cô dâu/chú rể",
      invitedBy: "couple",
      hostPronoun: "tụi mình",
      coupleReference: "tụi mình",
      householdMode: "couple",
      plusOnePolicy: "spouse",
    },
    includes: [
      ["heroGreeting", "Gửi Hai bạn Tùng & Hương"],
      ["insideInviteLine", "Tụi mình trân trọng kính mời hai bạn đến chung vui trong ngày cưới của tụi mình."],
      ["envelopeLine", "Kính mời: Hai bạn Tùng & Hương"],
      ["closingLine", "Sự hiện diện của hai bạn là niềm vinh hạnh và lời chúc phúc trọn vẹn nhất."],
    ],
    excludes: [
      ["insideInviteLine", "vợ chồng"],
      ["envelopeLine", "Vợ chồng"],
    ],
  },
  {
    name: "gia dinh anh chi keeps both roles in short label",
    input: {
      ...base,
      guestName: "Gia đình Anh Chị Hiền & Hồng",
      invitationName: "Gia đình Anh Chị Hiền & Hồng",
      hostRelationship: "anh chị",
      relationship: "anh chị của cô dâu/chú rể",
      invitedBy: "couple",
      hostPronoun: "tụi em",
      coupleReference: "tụi em",
      householdMode: "couple",
      plusOnePolicy: "spouse",
    },
    includes: [
      ["heroGreeting", "Kính gửi Gia đình Anh Chị Hiền & Hồng"],
      ["shortRecipientLabel", "gia đình anh chị"],
      ["closingLine", "Sự hiện diện của anh chị là niềm vinh hạnh và lời chúc phúc trọn vẹn nhất."],
    ],
  },
  {
    name: "neutral fallback stays human",
    input: {
      ...base,
      guestName: "Khách mời",
      invitationName: "Khách mời",
      invitedBy: "couple",
      householdMode: "single",
      plusOnePolicy: "none",
    },
    includes: [
      ["insideInviteLine", "Chúng tôi trân trọng kính mời bạn đến chung vui trong ngày cưới của Nhật & Phương."],
      ["dressCodeLine", "Vì Đà Lạt vào đông rất lạnh, xin lưu ý bạn mặc thật ấm.\n\nTông màu trang phục gợi ý: hồng phấn, xanh da trời, kem hoặc xanh lá dịu để khung hình thêm phần hài hòa."],
    ],
    excludes: [
      ["insideInviteLine", "ngày cưới của gia đình."],
    ],
  },
  {
    name: "teacher formal wording avoids spouse guessing",
    input: {
      ...base,
      guestName: "Thầy Minh",
      invitationName: "Thầy Minh",
      hostRelationship: "thầy/cô",
      invitedBy: "couple",
      hostPronoun: "tụi em",
      coupleReference: "tụi em",
      householdMode: "couple",
      plusOnePolicy: "spouse",
    },
    includes: [
      ["insideInviteLine", "Tụi em trân trọng kính mời cô chú đến chung vui trong ngày cưới của tụi em."],
      ["closingLine", "Sự hiện diện của quý khách và gia đình là niềm vinh hạnh và lời chúc phúc trọn vẹn nhất."],
    ],
    excludes: [
      ["insideInviteLine", "cùng Chú"],
      ["insideInviteLine", "người bạn đời"],
    ],
  },
];

for (const item of cases) {
  const copy = buildInvitationCopy(item.input);
  for (const [field, expected] of item.includes ?? []) {
    assert.equal(copy[field], expected, `${item.name}: ${field}`);
  }
  for (const [field, forbidden] of item.excludes ?? []) {
    assert(!copy[field].includes(forbidden), `${item.name}: ${field} contains ${forbidden}`);
  }
}

console.log(`Checked ${cases.length} guest invitation copy cases.`);
