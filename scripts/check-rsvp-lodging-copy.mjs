import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const rsvpSource = readFileSync(join(rootDir, "src/app/rsvp/page.tsx"), "utf8");
const guestGroupSource = readFileSync(join(rootDir, "src/lib/rsvp-guest-group.ts"), "utf8");
const tokenRouteSource = readFileSync(join(rootDir, "src/app/api/invites/[token]/rsvp/route.ts"), "utf8");
const rsvpSectionSource = readFileSync(join(rootDir, "src/components/RsvpSection.tsx"), "utf8");
const thankYouSource = readFileSync(join(rootDir, "src/components/ThankYouSection.tsx"), "utf8");
const inviteTokenPageSource = readFileSync(join(rootDir, "src/components/InviteTokenPage.tsx"), "utf8");
const eventDetailsSource = readFileSync(join(rootDir, "src/components/wedding/EventDetailsContent.tsx"), "utf8");
const globalStyles = readFileSync(join(rootDir, "src/app/globals.css"), "utf8");

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
assert.match(rsvpSource, /text-sm font-normal leading-relaxed text-\[#B4232F\] focus:outline-none/);
assert.doesNotMatch(rsvpSource, /data-rsvp-error="true"[\s\S]{0,160}font-bold/);
assert.match(rsvpSource, /SỐ NGƯỜI THAM DỰ:/);
assert.doesNotMatch(rsvpSource, /Vui lòng tính cả người được mời\./);
assert.match(guestGroupSource, /ho \(\?:noi\|ngoai\)/);
assert.match(guestGroupSource, /\^nha trai ho \(\?:noi\|ngoai\)\$/);
assert.match(tokenRouteSource, /isFamilyLodgingGuestGroup\(guestGroup\)/);
assert.match(tokenRouteSource, /isGroomFamilyLodgingGuestGroup\(guestGroup\)/);
assert.match(tokenRouteSource, /body\.checkInDate !== "2026-12-26"/);
assert.match(tokenRouteSource, /body\.checkOutDate !== "2026-12-27"/);
assert.match(tokenRouteSource, /Math\.min\(50, Math\.max\(1, body\.guestCount/);
assert.match(
  rsvpSource,
  /Gia đình sẽ chuẩn bị phòng tại Resort Terracotta cho Quý khách\. Xin Quý khách vui lòng xác nhận nhu cầu nghỉ lại\./,
);
assert.match(rsvpSource, /hasGroomFamilyLodgingOptions \? "max-w-2xl mx-auto" : "md:grid-cols-4"/);
assert.match(rsvpSource, /redirectToInvitePage\(inviteToken, "#thank-you"\)/);
assert.match(rsvpSource, /function parseRsvpDeadline\(value: string\)/);
assert.match(rsvpSource, /parseRsvpDeadline\(runtimeConfig\.rsvp\.deadline\)/);
assert.match(rsvpSource, /T00:00:00\+07:00/);
assert.match(rsvpSectionSource, /Để gia đình chuẩn bị đón tiếp chu đáo, xin Quý khách vui lòng xác nhận tham dự trước ngày/);
assert.match(rsvpSectionSource, /<span>\{hasResponded \? "Xem & Chỉnh sửa hồi đáp" : "Xác nhận tham dự"\}<\/span>/);
assert.match(rsvpSectionSource, /text-\[#3f4642\]\/95/);
assert.match(inviteTokenPageSource, /window\.location\.hash !== "#thank-you"/);
assert.match(inviteTokenPageSource, /element\.scrollIntoView\(\{ behavior: "auto", block: "start" \}\)/);
assert.match(thankYouSource, /Thông tin Thánh lễ/);
assert.match(thankYouSource, /Thông tin Tiệc cưới/);
assert.doesNotMatch(thankYouSource, /Đến Nhà thờ|Đến Tiệc cưới/);
assert.match(thankYouSource, /wedding:reveal-event-card/);
assert.match(thankYouSource, /wedding-type-body font-sans mx-auto mt-4 max-w-xl text-\[#3f4642\]\/95/);
assert.match(inviteTokenPageSource, /const showChurchCard = !shouldShowThankYou/);
assert.match(inviteTokenPageSource, /activeRsvpObj\?\.attendingCeremony === true/);
assert.match(inviteTokenPageSource, /const showBanquetCard = !shouldShowThankYou/);
assert.match(inviteTokenPageSource, /activeRsvpObj\?\.attendingBanquet === true/);
assert.match(inviteTokenPageSource, /showChurchCard=\{showChurchCard\}/);
assert.match(inviteTokenPageSource, /showBanquetCard=\{showBanquetCard\}/);
assert.match(eventDetailsSource, /id="thanh-le-hon-phoi"/);
assert.match(eventDetailsSource, /id="tiec-cuoi"/);
assert.match(eventDetailsSource, /\{showChurchCard \? <motion\.div/);
assert.match(eventDetailsSource, /\{showBanquetCard \? <motion\.div/);
assert.match(eventDetailsSource, /instantCardVariant/);
assert.match(globalStyles, /\.save-date-copy-arch\.save-date-guest-name \{[\s\S]*?color: #3f4642;[\s\S]*?font-family: var\(--font-serif\);[\s\S]*?font-style: italic;[\s\S]*?font-weight: 500;/);

console.log("RSVP lodging, guest-group branching, navigation, error typography and hero copy checks passed.");
