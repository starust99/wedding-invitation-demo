import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const rsvpSource = readFileSync(join(rootDir, "src/app/rsvp/page.tsx"), "utf8");

assert.match(rsvpSource, /message: "Nhập tuổi của bé"/);
assert.doesNotMatch(rsvpSource, /Nhập tuổi của bé để resort sắp xếp/);
assert.match(
  rsvpSource,
  /Vui lòng điền số tuổi của bé để gia đình sắp xếp phòng và giường phù hợp cho Quý khách/,
);
assert.match(rsvpSource, /placeholder="VD: 5"/);
assert.match(rsvpSource, /inputMode="numeric"/);
assert.match(rsvpSource, /step=\{1\}/);
assert.match(rsvpSource, /text-sm font-bold tracking-\[0\.08em\] text-\[#252934\] uppercase/);
assert.match(rsvpSource, /text-base font-normal text-center/);
assert.match(rsvpSource, /placeholder:font-normal/);

console.log("RSVP lodging copy and typography checks passed.");
