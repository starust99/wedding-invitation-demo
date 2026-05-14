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
      ["insideInviteLine", "Kính mời: Bố mẹ đến chung vui trong lễ cưới của hai cháu Nhật & Phương."],
      ["envelopeLine", "Kính mời: Bố mẹ"],
      ["closingLine", "Sự hiện diện của Bố Mẹ là niềm vui rất lớn với gia đình chúng con."],
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
      ["insideInviteLine", "Kính mời: Bố cùng Mẹ đến chung vui trong lễ cưới của hai cháu Nhật & Phương."],
      ["envelopeLine", "Kính mời: Bố cùng Mẹ"],
      ["closingLine", "Sự hiện diện của Bố Mẹ là niềm vui rất lớn với gia đình chúng con."],
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
      ["insideInviteLine", "Kính mời: Anh cùng vợ đến chung vui trong lễ cưới của tụi em."],
      ["closingLine", "Sự hiện diện của anh chị là niềm vui rất lớn với tụi em."],
      ["envelopeLine", "Kính mời: Anh Hoàng cùng vợ"],
    ],
    excludes: [
      ["insideInviteLine", "Nhật & Phương"],
      ["insideInviteLine", "Sự hiện diện"],
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
      ["insideInviteLine", "Kính mời: Vợ chồng anh Hoàng đến chung vui trong lễ cưới của tụi em."],
      ["envelopeLine", "Kính mời: Vợ chồng anh Hoàng"],
      ["closingLine", "Sự hiện diện của anh chị là niềm vui rất lớn với tụi em."],
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
      ["insideInviteLine", "Kính mời: Vợ chồng em Linh đến chung vui trong lễ cưới của anh chị."],
      ["envelopeLine", "Kính mời: Vợ chồng em Linh"],
      ["closingLine", "Sự hiện diện của hai em là niềm vui rất lớn với anh chị."],
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
      ["insideInviteLine", "Kính mời: Vợ chồng anh chị đến chung vui trong lễ cưới của tụi em."],
      ["closingLine", "Sự hiện diện của anh chị là niềm vui rất lớn với tụi em."],
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
      ["insideInviteLine", "Kính mời: Bác Hùng cùng gia đình đến chung vui trong lễ cưới của tụi con."],
      ["closingLine", "Sự hiện diện của Bác và gia đình là niềm vui rất lớn với tụi con."],
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
      ["insideInviteLine", "Gia đình chúng con trân trọng kính mời Chú Sáu và gia đình đến chung vui trong lễ cưới của hai cháu Nhật & Phương."],
      ["closingLine", "Sự hiện diện của Chú và gia đình là niềm vui rất lớn với gia đình chúng con."],
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
      ["insideInviteLine", "Tụi mình mời bạn đến chung vui trong lễ cưới của tụi mình."],
      ["signaturePrefix", "Thân mến"],
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
      ["insideInviteLine", "Gia đình chúng tôi trân trọng kính mời Khách mời đến chung vui trong lễ cưới của gia đình chúng tôi."],
    ],
    excludes: [
      ["insideInviteLine", "lễ cưới của gia đình."],
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
      ["insideInviteLine", "Kính mời: Thầy Minh cùng gia đình đến chung vui trong lễ cưới của tụi em."],
      ["closingLine", "Sự hiện diện của quý khách và gia đình là niềm vui rất lớn với tụi em."],
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
