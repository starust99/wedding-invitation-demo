import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const rsvpSource = readFileSync(join(rootDir, "src/app/rsvp/page.tsx"), "utf8");
const guestGroupSource = readFileSync(join(rootDir, "src/lib/rsvp-guest-group.ts"), "utf8");
const tokenRouteSource = readFileSync(join(rootDir, "src/app/api/invites/[token]/rsvp/route.ts"), "utf8");

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
assert.match(rsvpSource, /ĐI BAO NHIÊU NGƯỜI\?/);
assert.match(rsvpSource, /Vui lòng tính cả người được mời\./);
assert.match(guestGroupSource, /ho \(\?:noi\|ngoai\)/);
assert.match(tokenRouteSource, /isFamilyLodgingGuestGroup\(guestGroup\)/);
assert.match(tokenRouteSource, /Math\.min\(50, Math\.max\(1, body\.guestCount/);

console.log("RSVP lodging, guest-group branching, party-size copy and typography checks passed.");
