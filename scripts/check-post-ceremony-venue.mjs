import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const rsvpSource = readFileSync(join(rootDir, "src/app/rsvp/page.tsx"), "utf8");

assert.match(rsvpSource, /const POST_CEREMONY_VENUE_NAME = "Francis Hội Restaurant"/);
assert.match(rsvpSource, /const POST_CEREMONY_VENUE_ADDRESS = "187 Gia Long, Lái Thiêu, Hồ Chí Minh"/);
assert.match(rsvpSource, /ludocid=740771515627976404/);
assert.match(rsvpSource, /function PostCeremonyVenue/);
assert.equal((rsvpSource.match(/<PostCeremonyVenue/g) ?? []).length, 2);
assert.match(rsvpSource, /<PostCeremonyVenue compact \/>/);
assert.match(rsvpSource, /compact \? "font-normal text-\[#252934\]\/72" : "font-semibold text-\[#252934\] sm:text-base"/);
assert.match(rsvpSource, /target="_blank"/);
assert.match(rsvpSource, /rel="noreferrer"/);
assert.doesNotMatch(rsvpSource, /Kính mời Quý khách dự buổi tiệc chung vui cùng gia đình sau/);

console.log("Post-ceremony venue checks passed: both RSVP cards share the Francis Hội Restaurant name and linked address.");
