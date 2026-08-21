import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(rootDir, ".tmp-event-access-check");
const require = createRequire(import.meta.url);

rmSync(outputDir, { force: true, recursive: true });
execFileSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["tsc", "-p", "scripts/tsconfig.event-access.json"],
  { cwd: rootDir, stdio: "inherit" },
);

mkdirSync(join(outputDir, "node_modules", "@"), { recursive: true });
symlinkSync(outputDir, join(outputDir, "node_modules", "@", "lib"), "dir");

const { resolveInviteEventAccess } = require(join(outputDir, "invite-event-access.js"));
const { doesPostCeremonyPartyApply, resolvePostCeremonyPartyAnswer } = require(join(outputDir, "post-ceremony-rsvp.js"));
const {
  isFamilyLodgingGuestGroup,
  isGroomFamilyLodgingGuestGroup,
  isGroomSideGuestGroup,
  isTerracottaLodgingEligible,
} = require(join(outputDir, "rsvp-guest-group.js"));

for (const group of [
  "[Nhà Trai] Họ nội",
  "[NHÀ TRAI] Họ ngoại",
  "Nhà Trai - Khách ba",
  "[Nhà Trai] Bạn gia đình",
]) {
  assert.equal(isGroomSideGuestGroup(group), true, `Expected Nhà Trai prefix: ${group}`);
  assert.deepEqual(resolveInviteEventAccess({ guestGroup: group, postCeremonyPartyInvited: false }), {
    isGroomSideGuest: true,
    canViewCeremony: false,
    canUsePostCeremonyFallback: false,
  });
}

assert.deepEqual(resolveInviteEventAccess({
  guestGroup: "[Nhà Trai] Khách mẹ",
  postCeremonyPartyInvited: true,
}), {
  isGroomSideGuest: true,
  canViewCeremony: true,
  canUsePostCeremonyFallback: false,
});

for (const group of ["[Nhà Gái] Họ nội", "[Nhật] Bạn bè & Đồng nghiệp", "Khác"]) {
  assert.deepEqual(resolveInviteEventAccess({ guestGroup: group, postCeremonyPartyInvited: false }), {
    isGroomSideGuest: false,
    canViewCeremony: true,
    canUsePostCeremonyFallback: true,
  });
}

assert.equal(doesPostCeremonyPartyApply({
  invited: false,
  attendingCeremony: false,
  attendingBanquet: false,
  allowFallback: false,
}), false);
assert.deepEqual(resolvePostCeremonyPartyAnswer({
  invited: false,
  attendingCeremony: false,
  attendingBanquet: false,
  answer: true,
  allowFallback: false,
}), { ok: true, applies: false, value: undefined });

assert.equal(isFamilyLodgingGuestGroup("[Nhà Trai] Họ nội"), true);
assert.equal(isFamilyLodgingGuestGroup("[Nhà Trai] Khách ba"), false);
assert.equal(isGroomFamilyLodgingGuestGroup("[Nhà Trai] Họ ngoại"), true);
assert.equal(isGroomFamilyLodgingGuestGroup("[Nhà Gái] Họ ngoại"), false);
assert.equal(isTerracottaLodgingEligible("[Nhà Gái] Họ nội", false), true);
assert.equal(isTerracottaLodgingEligible("[Nhật] Bạn bè & Đồng nghiệp", false), false);
assert.equal(isTerracottaLodgingEligible("[Nhật] Bạn bè & Đồng nghiệp", true), true);

const sourceAssertions = [
  ["src/components/InviteTokenPage.tsx", /eventAccess\.canViewCeremony/],
  ["src/app/rsvp/page.tsx", /isRegularGuestFlow = eventAccess\.canUsePostCeremonyFallback/],
  ["src/app/api/invites/[token]/rsvp/route.ts", /attendingCeremony = eventAccess\.canViewCeremony/],
  ["src/app/api/invites/[token]/rsvp/route.ts", /invitee\.terracotta_lodging_eligible/],
  ["src/app/api/rsvp/route.ts", /allowFallback: eventAccess\.canUsePostCeremonyFallback/],
  ["src/app/api/rsvp/route.ts", /const lodgingEligible = matchingInvitee[\s\S]*isTerracottaLodgingEligible/],
  ["src/lib/invite-mapper.ts", /terracotta_lodging_eligible: isTerracottaLodgingEligible/],
  ["src/app/calendar/[event]/route.ts", /!eventAccess\.canViewCeremony/],
  ["src/components/admin/InviteAdminPanel.tsx", /ceremonyStatusLabel/],
];

for (const [file, pattern] of sourceAssertions) {
  const source = readFileSync(join(rootDir, file), "utf8");
  assert.match(source, pattern, `Expected event-access enforcement in ${file}`);
}

const lodgingMigration = readFileSync(
  join(rootDir, "supabase", "migrations", "20260821_add_terracotta_lodging_eligibility.sql"),
  "utf8",
);
assert.match(lodgingMigration, /add column if not exists terracotta_lodging_eligible boolean not null default false/);
assert.match(lodgingMigration, /\[Nhà Trai\] Họ nội/);
assert.match(lodgingMigration, /\[Nhà Gái\] Họ ngoại/);

console.log("Event-access checks passed: Nhà Trai access stays flag-gated, family lodging is automatic, and selected non-family invites can be opted in.");
