import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync, rmSync } from "node:fs";
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
      ["dressCodeLine", "Thương mời anh chị diện trang phục tươi sáng theo bảng màu bên dưới\n(xin tránh mặc các tông màu tối).\n\nLưu ý thời tiết: Đà Lạt vào đông rất lạnh, anh chị hãy ưu tiên trang phục và phụ kiện đủ ấm cho bữa tiệc ngoài trời nhé!"],
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
      ["dressCodeLine", "Thương mời bạn diện trang phục tươi sáng theo bảng màu bên dưới\n(xin tránh mặc các tông màu tối).\n\nLưu ý thời tiết: Đà Lạt vào đông rất lạnh, bạn hãy ưu tiên trang phục và phụ kiện đủ ấm cho bữa tiệc ngoài trời nhé!"],
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
  assert.equal(copy.insideInviteLine, `TRÂN TRỌNG & THÂN MỜI\n${copy.heroInvitationLine}`, `${item.name}: insideInviteLine follows invite heading + personalized line`);
  assert(copy.heroInvitationLine.startsWith(copy.guestLabel), `${item.name}: heroInvitationLine starts with the display salutation`);
  for (const [field, expected] of item.includes ?? []) {
    if (field === "insideInviteLine") continue;
    assert.equal(copy[field], expected, `${item.name}: ${field}`);
  }
  for (const [field, forbidden] of item.excludes ?? []) {
    assert(!copy[field].includes(forbidden), `${item.name}: ${field} contains ${forbidden}`);
  }
}

const parentElderInviteOwnerCases = [
  ["Ông bà", "ông bà", "Ông bà"],
  ["Bố mẹ", "bố mẹ", "Bố mẹ"],
  ["Ba mẹ", "ba mẹ", "Ba mẹ"],
  ["Bố", "bố", "Bố"],
  ["Mẹ", "mẹ", "Mẹ"],
  ["Bác", "bác", "Bác Tiến"],
  ["Vợ chồng bác", "vợ chồng bác", "Vợ chồng Bác Tiến"],
  ["Gia đình bác", "bác", "Gia đình Bác Tiến"],
  ["Cô", "cô", "Cô Lan"],
  ["Gia đình cô", "cô", "Gia đình Cô Lan"],
  ["Chú", "chú", "Chú Sáu"],
  ["Gia đình chú", "chú", "Gia đình Chú Sáu"],
  ["Cô chú", "vợ chồng cô chú", "Cô Chú Sáu"],
  ["Gia đình cô chú", "cô", "Gia đình Cô Chú Sáu"],
  ["Dượng", "dượng", "Dượng Minh"],
  ["Cô dượng", "vợ chồng cô dượng", "Cô Dượng Minh"],
  ["Gia đình cô dượng", "cô dượng", "Gia đình Cô Dượng Minh"],
  ["Thím", "thím", "Thím Hoa"],
  ["Gia đình thím", "thím", "Gia đình Thím Hoa"],
  ["Gia đình chú thím", "chú", "Gia đình Chú Thím Hoa"],
  ["Dì", "dì", "Dì Nên"],
  ["Gia đình dì", "dì", "Gia đình Dì Sáu"],
  ["Cậu", "cậu", "Cậu Tư"],
  ["Gia đình cậu", "cậu", "Gia đình Cậu Tư"],
  ["Cậu mợ", "vợ chồng cậu mợ", "Cậu Mợ Tư"],
  ["Gia đình cậu mợ", "cậu", "Gia đình Cậu Mợ Tư"],
  ["Mợ", "mợ", "Mợ Tư"],
  ["Gia đình mợ", "mợ", "Gia đình Mợ Tư"],
  ["Bà", "bà", "Bà Lan"],
];

for (const [label, hostRelationship, guestName] of parentElderInviteOwnerCases) {
  const copy = buildInvitationCopy({
    ...base,
    guestName,
    invitationName: guestName,
    hostRelationship,
    relationship: `${hostRelationship} của cô dâu/chú rể`,
    invitedBy: "parents",
    hostPronoun: "gia đình chúng con",
    coupleReference: "hai cháu",
    householdMode: label.toLowerCase().includes("gia đình") ? "family" : "single",
    plusOnePolicy: label.toLowerCase().includes("gia đình") ? "family" : "none",
  });
  assert.equal(
    copy.heroInvitationLine,
    `${guestName} đến dự Thánh Lễ Hôn Phối & tiệc cưới của hai cháu Nhật & Phương.`,
    `parent elder invite owner: ${label}`,
  );
}

const parentPeerInviteOwnerCases = [
  ["Bạn Nghĩa", "bạn", "single", "none"],
  ["Hai bạn Tùng & Hương", "bạn", "couple", "spouse"],
  ["Vợ chồng bạn Minh", "vợ chồng bạn", "couple", "spouse"],
  ["Gia đình Thảo & Vũ", "bạn", "family", "family"],
  ["Gia đình Bạn Minh", "bạn", "family", "family"],
  ["Anh Dũng", "anh", "single", "none"],
  ["Chị Chi", "chị", "single", "none"],
  ["Gia đình Anh Chị Hiền & Hồng", "anh chị", "family", "family"],
  ["Em Linh", "em", "single", "none"],
];

for (const [guestName, hostRelationship, householdMode, plusOnePolicy] of parentPeerInviteOwnerCases) {
  const copy = buildInvitationCopy({
    ...base,
    guestName,
    invitationName: guestName,
    hostRelationship,
    relationship: `${hostRelationship} của cô dâu/chú rể`,
    invitedBy: "parents",
    hostPronoun: "gia đình chúng tôi",
    coupleReference: "hai cháu",
    householdMode,
    plusOnePolicy,
  });
  assert.equal(
    copy.heroInvitationLine,
    `${guestName} đến dự Thánh Lễ Hôn Phối & tiệc cưới của con chúng tôi.`,
    `parent peer/lower invite owner: ${guestName}`,
  );
}

const parentYoungerReferenceCases = [
  ["Cháu Nam", "cháu", "hai em"],
  ["Cháu An", "cháu", "hai anh chị"],
  ["Vợ chồng cháu Nam", "vợ chồng cháu", "hai em"],
  ["Vợ chồng cháu An", "vợ chồng cháu", "hai anh chị"],
  ["Gia đình cháu Nam", "cháu", "hai em"],
  ["Gia đình cháu An", "cháu", "hai anh chị"],
];

for (const [guestName, hostRelationship, coupleReference] of parentYoungerReferenceCases) {
  const copy = buildInvitationCopy({
    ...base,
    guestName,
    invitationName: guestName,
    hostRelationship,
    relationship: `${hostRelationship} của cô dâu/chú rể`,
    invitedBy: "parents",
    hostPronoun: "cô chú",
    coupleReference,
    householdMode: guestName.toLowerCase().includes("gia đình") ? "family" : guestName.toLowerCase().includes("vợ chồng") ? "couple" : "single",
    plusOnePolicy: guestName.toLowerCase().includes("gia đình") ? "family" : guestName.toLowerCase().includes("vợ chồng") ? "spouse" : "none",
  });
  assert.equal(
    copy.heroInvitationLine,
    `${guestName} đến dự Thánh Lễ Hôn Phối & tiệc cưới của ${coupleReference} Nhật & Phương.`,
    `parent younger invite owner: ${guestName}`,
  );
}

const spreadsheetSource = readFileSync(join(rootDir, "src/lib/invite-spreadsheet.ts"), "utf8");
const spreadsheetParentElderKeywords = ["ông", "bà", "bố", "mẹ", "cụ", "bác", "cô", "chú", "dì", "dượng", "cậu", "mợ", "thím"];
for (const keyword of spreadsheetParentElderKeywords) {
  assert(spreadsheetSource.includes(`excelText("${keyword}")`), `Excel invite formula must classify parent elder keyword: ${keyword}`);
}
assert(spreadsheetSource.includes("&CHAR(10)&"), "Excel invite formula must keep heading and invitation line on two lines");
assert(spreadsheetSource.includes('excelText("con chúng tôi")'), "Excel invite formula must keep parent peer wording");
assert(spreadsheetSource.includes('excelText("hai cháu ")'), "Excel invite formula must keep parent elder wording");

console.log(`Checked ${cases.length} guest invitation copy cases and ${parentElderInviteOwnerCases.length + parentPeerInviteOwnerCases.length + parentYoungerReferenceCases.length} invite-owner matrix cases.`);
