import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const source = (path) => readFileSync(join(rootDir, path), "utf8");

const runtimeFiles = [
  "src/lib/rsvp-storage.ts",
  "src/lib/rsvp-mapper.ts",
  "src/lib/rsvp-wish.ts",
  "src/app/rsvp/page.tsx",
  "src/app/api/invites/[token]/rsvp/route.ts",
  "src/app/api/invites/[token]/wish/route.ts",
  "src/components/admin/InviteAdminPanel.tsx",
  "src/app/api/admin/rsvp-workbook/route.ts",
  "src/lib/csv.ts",
].map(source).join("\n");

for (const obsolete of [
  "idNumber",
  "dietaryNote",
  "transportNeeded",
  "roomType",
  "elderlySupportNeeded",
  "preserveLegacyRsvpWishNotes",
  "encodeLegacyRsvpWish",
  "parseLegacyRsvpWish",
]) {
  assert.equal(runtimeFiles.includes(obsolete), false, `Obsolete runtime field remains: ${obsolete}`);
}

assert.doesNotMatch(source("src/lib/rsvp-storage.ts"), /\bphone\b/);
assert.doesNotMatch(source("src/lib/invites.ts"), /\bphone\b|\bemail\b/);
assert.doesNotMatch(source("src/app/api/rsvp/route.ts"), /export async function POST/);

const schema = source("supabase/schema.sql");
for (const obsoleteColumn of [
  "phone text",
  "email text",
  "dietary_note",
  "transport_needed",
  "room_type",
  "elderly_support_needed",
  "notes text,\n  wish_message",
]) {
  assert.equal(schema.includes(obsoleteColumn), false, `Obsolete schema column remains: ${obsoleteColumn}`);
}
assert.match(schema, /wish_message text/);
assert.match(schema, /lodging_guests jsonb/);

const migration = source("supabase/migrations/20260822_minimize_guest_rsvp_data.sql");
assert.match(migration, /wish_message = notes::jsonb ->> 'message'/);
assert.match(migration, /guest - 'idNumber' - 'id_number'/);
assert.match(migration, /drop column if exists phone/);
assert.match(migration, /drop column if exists dietary_note/);
assert.match(migration, /drop column if exists notes/);
assert.match(migration, /drop column if exists email/);
assert.match(migration, /validate constraint rsvp_responses_invitee_id_fkey/);
assert.match(migration, /notify pgrst, 'reload schema'/);

const migrationVersions = readdirSync(join(rootDir, "supabase", "migrations"))
  .filter((name) => name.endsWith(".sql"))
  .map((name) => name.split("_")[0]);
assert.equal(new Set(migrationVersions).size, migrationVersions.length, "Supabase migration versions must be unique.");

const workbook = source("src/app/api/admin/rsvp-workbook/route.ts");
assert.doesNotMatch(workbook, /Số điện thoại|CCCD\/Hộ chiếu|Ghi chú thực đơn|Cần đưa đón|Loại phòng/);
assert.match(workbook, /Danh sách người lưu trú/);
assert.match(workbook, /Lời chúc/);

console.log("RSVP backend cleanup checks passed: obsolete contact/identity/legacy fields are absent while attendance, lodging, and typed wishes remain.");
