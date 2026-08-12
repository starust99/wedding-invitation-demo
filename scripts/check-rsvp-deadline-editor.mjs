import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const editorSource = await readFile(new URL("../src/app/admin/editor/page.tsx", import.meta.url), "utf8");
const rsvpSource = await readFile(new URL("../src/app/rsvp/page.tsx", import.meta.url), "utf8");

assert.match(editorSource, /Hạn xác nhận hồi đáp/);
assert.match(editorSource, /next\.content\.rsvp\.deadline = value/);
assert.match(editorSource, /next\.content\.accommodation\.rsvpDeadline = value/);
assert.match(editorSource, /Hạn xác nhận hồi đáp không phải là một ngày hợp lệ/);

assert.match(rsvpSource, /parseRsvpDeadline\(runtimeConfig\.rsvp\.deadline\)/);
assert.match(rsvpSource, /sau \{runtimeConfig\.rsvp\.deadline\}/);
assert.doesNotMatch(rsvpSource, /RSVP_GUEST_EDIT_DEADLINE/);

console.log("RSVP deadline editor checks passed: editor persistence, compatibility sync, validation, and runtime edit lock.");
