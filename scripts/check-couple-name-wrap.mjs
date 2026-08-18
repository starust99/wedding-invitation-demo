import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(rootDir, ".tmp-couple-name-wrap-check");
const require = createRequire(import.meta.url);

rmSync(outputDir, { force: true, recursive: true });
execFileSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  [
    "tsc",
    "src/lib/couple-name-display.ts",
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

const display = require(join(outputDir, "couple-name-display.js"));
const coupleName = "Nhật & Phương";

const middle = display.segmentExactPhrase(
  `Gia đình bác Lâm đến chung vui cùng ${coupleName}.`,
  coupleName,
);
assert.equal(middle.map((segment) => segment.text).join(""), `Gia đình bác Lâm đến chung vui cùng ${coupleName}.`);
assert.deepEqual(middle.filter((segment) => segment.isMatch).map((segment) => segment.text), [coupleName]);

const repeated = display.segmentExactPhrase(`${coupleName} chào ${coupleName}`, coupleName);
assert.equal(repeated.filter((segment) => segment.isMatch).length, 2);

const dynamicName = "Long Nhật & Anh Phương";
assert.deepEqual(display.segmentExactPhrase(dynamicName, dynamicName), [{ text: dynamicName, isMatch: true }]);
assert.deepEqual(display.segmentExactPhrase("Không có tên cặp đôi", coupleName), [{ text: "Không có tên cặp đôi", isMatch: false }]);

const placeholder = display.keepExactPhraseTogether(`Nhắn gửi cho ${coupleName}`, coupleName);
assert.equal(placeholder, "Nhắn gửi cho Nhật\u00a0&\u00a0Phương");

const componentSource = readFileSync(join(rootDir, "src/components/ui/CoupleNameText.tsx"), "utf8");
assert.match(componentSource, /className="whitespace-nowrap"/);
assert.match(componentSource, /data-couple-name="true"/);

const coveredRenderPoints = [
  "src/components/wedding/ReferenceWeddingHero.tsx",
  "src/components/wedding/HeroContent.tsx",
  "src/app/rsvp/page.tsx",
  "src/components/ThankYouSection.tsx",
  "src/components/InviteAccessGate.tsx",
  "src/components/admin/VersionSnapshotsPanel.tsx",
];

for (const file of coveredRenderPoints) {
  const source = readFileSync(join(rootDir, file), "utf8");
  assert.match(source, /CoupleNameText/, `${file} must use the shared no-break renderer.`);
}

const heroContentSource = readFileSync(join(rootDir, "src/components/wedding/HeroContent.tsx"), "utf8");
assert.doesNotMatch(heroContentSource, /splitNames/, "The editor hero must not force a line break inside the couple name.");

const rsvpSource = readFileSync(join(rootDir, "src/app/rsvp/page.tsx"), "utf8");
assert.match(rsvpSource, /keepExactPhraseTogether/, "RSVP placeholder copy must keep the couple name together.");

const guestNameComponentSource = readFileSync(join(rootDir, "src/components/ui/GuestNameText.tsx"), "utf8");
assert.match(guestNameComponentSource, /WHOLE_NAME_NOWRAP_LIMIT/);
assert.match(guestNameComponentSource, /data-guest-name="true"/);
assert.match(guestNameComponentSource, /whitespace-nowrap/);

console.log("Couple-name wrapping checks passed: segmentation, placeholders, and UI render coverage.");
