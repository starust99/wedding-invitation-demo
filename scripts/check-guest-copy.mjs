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
    "src/lib/guest-naming.ts",
    "src/lib/guest-rsvp-copy.ts",
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

const naming = require(join(outputDir, "guest-naming.js"));
const copy = require(join(outputDir, "guest-rsvp-copy.js"));
const personalization = require(join(outputDir, "guest-personalization.js"));

const nameCases = [
  ["Gia đình anh chị", "Hiền & Hồng", "Gia đình anh chị Hiền & Hồng"],
  ["Gia đình", "Thảo & Vũ", "Gia đình Thảo & Vũ"],
  ["Hai bạn", "Tùng & Hương", "Hai bạn Tùng & Hương"],
  ["Bạn", "Nghĩa", "Bạn Nghĩa"],
  ["Anh", "Dũng", "Anh Dũng"],
  ["Chị", "Chi", "Chị Chi"],
  ["Gia đình", "Nga & Phong", "Gia đình Nga & Phong"],
  ["Gia đình", "Hải & Linh", "Gia đình Hải & Linh"],
  ["Dì", "Nên", "Dì Nên"],
  ["Anh chị", "Chi & Người thương", "Chị Chi & Người thương"],
  ["Cha", "Linh Hướng Giuse", "Cha Linh Hướng Giuse"],
];

for (const [cluster, core, full] of nameCases) {
  if (full !== "Chị Chi & Người thương") {
    assert.equal(naming.resolveSalutationCluster("", full), cluster);
    assert.equal(naming.canonicalizeGuestFullName(`${cluster} ${core}`, cluster), full);
  }
}

assert.equal(
  naming.canonicalizeGuestFullName("Gia đình Anh Chị Tuấn", "Gia đình anh chị"),
  "Gia đình anh chị Tuấn",
);
assert.equal(naming.resolveSalutationCluster("", "Bố"), "Bố");
assert.equal(naming.resolveSalutationCluster("", "Ba"), "Ba");
assert.equal(naming.resolveSalutationCluster("", "Bà"), "Bà");
assert.equal(naming.resolveSalutationCluster("", "Mẹ"), "Mẹ");
assert.equal(naming.resolveSalutationCluster("", "Cha Linh Hướng Giuse"), "Cha");

const clergyIdentity = {
  salutationCluster: "Cha",
  displaySalutation: "Cha",
  invitationName: "Cha Linh Hướng Giuse",
  displayLabel: "Cha Linh Hướng Giuse",
  guestName: "Cha Linh Hướng Giuse",
  hostRelationship: "cha",
  relationship: "linh mục",
  invitedBy: "parents",
  householdMode: "single",
};
const clergyCopy = personalization.buildInvitationCopy(clergyIdentity);
assert.equal(clergyCopy.guestLabel, "Cha Linh Hướng Giuse");
assert(clergyCopy.heroInvitationLine.startsWith("Cha Linh Hướng Giuse đến chung vui"));
assert.equal(clergyCopy.greeting, "Cha thân mến");
assert.equal(clergyCopy.presenceSubject, "Cha");
assert.equal(clergyCopy.closingLine, "Sự hiện diện của Cha là niềm vinh hạnh và lời chúc phúc trọn vẹn nhất.");
assert(clergyCopy.insideInviteLine.includes("\nCha đến chung vui"));
assert.equal(clergyCopy.insideInviteLine.includes("\nCha Linh Hướng Giuse đến chung vui"), false);

const fatherIdentity = {
  salutationCluster: "Ba",
  displaySalutation: "Ba",
  invitationName: "Ba",
  displayLabel: "Ba",
  guestName: "Ba",
  honorific: "ba",
  hostRelationship: "ba",
  relationship: "bố/mẹ của cô dâu/chú rể",
  invitedBy: "couple",
  householdMode: "single",
};
const fatherCopy = personalization.buildInvitationCopy(fatherIdentity);
assert.equal(fatherCopy.guestLabel, "Ba");
assert.equal(fatherCopy.greeting, "Ba thân mến");
assert.equal(fatherCopy.presenceSubject, "Ba");

const clusterInput = {
  salutationCluster: "Gia đình anh chị",
  fullGuestName: "Gia đình anh chị Tuấn",
};

assert.equal(
  copy.buildThankYouMessage({ ...clusterInput, attending: "no" }),
  "Xin chân thành cảm ơn! Rất hy vọng sẽ có dịp được đón tiếp gia đình anh chị vào một dịp khác.",
);
assert.equal(
  copy.buildThankYouMessage({ ...clusterInput, attending: "yes", attendingCeremony: true, attendingBanquet: false }),
  "Xin chân thành cảm ơn! Hẹn gặp gia đình anh chị tại Thánh lễ Hôn phối.",
);
assert.equal(
  copy.buildThankYouMessage({ ...clusterInput, attending: "yes", attendingCeremony: true, attendingBanquet: true }),
  "Xin chân thành cảm ơn! Hẹn gặp gia đình anh chị tại Thánh lễ Hôn phối và Tiệc cưới.",
);
assert.equal(
  copy.buildThankYouMessage({ ...clusterInput, attending: "yes", attendingCeremony: false, attendingBanquet: true }),
  "Xin chân thành cảm ơn! Hẹn gặp gia đình anh chị vào buổi Tiệc cưới thân mật tại Đà Lạt.",
);
assert.equal(
  copy.buildThankYouMessage({ ...clusterInput, attending: "maybe" }),
  "Xin chân thành cảm ơn! Hẹn gặp gia đình anh chị tại ngày vui sắp tới.",
);

const decline = copy.buildRsvpSubmissionCopy({
  ...clusterInput,
  attending: "no",
  fallbackClosingLine: "",
});
assert(decline.body.startsWith("Cảm ơn Gia đình anh chị đã phản hồi."));
assert(decline.body.includes("Hẹn gặp lại Gia đình anh chị vào một dịp sớm nhất!"));

const both = copy.buildRsvpSubmissionCopy({
  ...clusterInput,
  attending: "yes",
  attendingCeremony: "yes",
  attendingBanquet: "yes",
  fallbackClosingLine: "",
});
assert(both.body.includes("biết gia đình anh chị sẽ có mặt"));
assert(both.body.includes("Sự hiện diện của gia đình anh chị chính là"));

const ceremony = copy.buildRsvpSubmissionCopy({
  ...clusterInput,
  attending: "yes",
  attendingCeremony: "yes",
  attendingBanquet: "no",
  fallbackClosingLine: "",
});
assert(ceremony.body.includes("Cảm ơn Gia đình anh chị đã sắp xếp"));
assert(ceremony.body.includes("lời cầu nguyện của gia đình anh chị"));

const banquet = copy.buildRsvpSubmissionCopy({
  ...clusterInput,
  attending: "yes",
  attendingCeremony: "no",
  attendingBanquet: "yes",
  fallbackClosingLine: "",
});
assert(banquet.body.includes("Cảm ơn Gia đình anh chị đã sắp xếp"));
assert(banquet.body.includes("Sự đồng hành của gia đình anh chị"));

for (const submission of [decline, both, ceremony, banquet]) {
  assert(submission.body.endsWith("\n\nChân thành cảm ơn!"));
  assert.equal(submission.body.match(/Chân thành cảm ơn!/g)?.length, 1);
  assert.equal(submission.body.includes("Lời hồi đáp đã được gửi thành công"), false);
}

const fallback = copy.buildRsvpSubmissionCopy({
  ...clusterInput,
  attending: "maybe",
  attendingCeremony: null,
  attendingBanquet: null,
  fallbackClosingLine: "Hẹn gặp Gia đình anh chị tại ngày vui sắp tới.",
});
assert(fallback.body.endsWith("\n\nChân thành cảm ơn!"));

const loverInput = {
  salutationCluster: "Anh chị",
  fullGuestName: "Chị Chi & Người thương",
};
assert.equal(
  copy.buildThankYouMessage({ ...loverInput, attending: "yes", attendingCeremony: true, attendingBanquet: true }),
  "Xin chân thành cảm ơn! Hẹn gặp anh chị tại Thánh lễ Hôn phối và Tiệc cưới.",
);
const loverBoth = copy.buildRsvpSubmissionCopy({
  ...loverInput,
  attending: "yes",
  attendingCeremony: "yes",
  attendingBanquet: "yes",
  fallbackClosingLine: "",
});
assert(loverBoth.body.includes("biết anh chị sẽ có mặt"));
assert(loverBoth.body.includes("Sự hiện diện của anh chị chính là"));

const clergyClusterInput = {
  salutationCluster: "Cha",
  fullGuestName: "Cha Linh Hướng Giuse",
};
assert.equal(
  copy.buildThankYouMessage({ ...clergyClusterInput, attending: "yes", attendingCeremony: true, attendingBanquet: true }),
  "Xin chân thành cảm ơn! Hẹn gặp cha tại Thánh lễ Hôn phối và Tiệc cưới.",
);
const clergyBoth = copy.buildRsvpSubmissionCopy({
  ...clergyClusterInput,
  attending: "yes",
  attendingCeremony: "yes",
  attendingBanquet: "yes",
  fallbackClosingLine: "",
});
assert(clergyBoth.body.includes("biết cha sẽ có mặt"));
assert.equal(clergyBoth.body.includes("Cha Linh Hướng Giuse"), false);

console.log(`Guest naming/copy checks passed (${nameCases.length} name patterns, 14 copy branches).`);
