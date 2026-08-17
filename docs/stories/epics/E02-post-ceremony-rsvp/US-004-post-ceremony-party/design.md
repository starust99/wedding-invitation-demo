# Design

## Domain Model

`Invitee.postCeremonyPartyInvited` is the administrator-controlled invitation
scope. `RSVPResponse.attendingPostCeremonyParty` is the guest answer and is
nullable when the question is unanswered or does not apply.

Rules:

1. A blank workbook cell maps to `postCeremonyPartyInvited = false` and selects
   the conditional fallback flow.
2. The only non-blank workbook value accepted is `Có`.
3. With the invite flag, the answer applies when ceremony attendance is true.
   Without the flag, the answer applies when banquet attendance is false.
4. A non-applicable answer is normalized to null by the server.
5. The existing RSVP guest count is reused as an estimate for every attended
   event.

## Application Flow

Workbook generation and parsing feed the invite mapper and Supabase invite row.
The token invite API returns the flag to RSVP. RSVP conditionally reveals and
validates the question, then posts the answer. The server reloads invite scope,
normalizes the answer, writes dedicated event columns, and Admin reads the
mapped response for summaries, filtering, and exports.

## Interface Contract

Invite DTO adds:

- `postCeremonyPartyInvited: boolean`

RSVP DTO adds:

- `attendingPostCeremonyParty?: boolean`

Guest RSVP returns HTTP 400 when an invited ceremony attendee omits the
post-ceremony answer. Values sent for an ineligible guest or a guest not
attending the ceremony are ignored and persisted as null.

## Data Model

Add:

- `invitees.post_ceremony_party_invited boolean not null default false`
- `rsvp_responses.attending_post_ceremony_party boolean`

Backfill ceremony and banquet columns from legacy RSVP JSON, then normalize
`lodging_guests` to an array. Keep the mapper's legacy reader during rollout.

## UI / Platform Impact

RSVP keeps the compact nested row directly below the ceremony response for
invitees who are eligible from the start. Other guests see `Tiếp tục`; declining
Terracotta opens a dedicated intimate-party card without repeating the ceremony
card, while accepting Terracotta goes directly to review. The dedicated step
has a top `Chỉnh sửa` action, concise generic invitation copy, and the existing guided hand
cue on `Xem lại và hoàn tất`. Review and success states repeat the answer only
when applicable. Admin retains invite scope editing, response status, filtering,
estimated counts, and export columns.

The inline and dedicated intimate-party invitations share a custom crossed
fork-and-knife raster icon. Its dusty-rose monoline treatment follows the
existing ceremony and banquet icon family without reusing a generic library
glyph; the surrounding paper badge remains a UI surface rather than part of the
asset.

The step transition must work with touch interaction across mobile, tablet,
desktop, and in-app browsers. Reduced-motion users see an instant transition
and a static hand cue.

## Observability

No new analytics provider is introduced. Validation is captured through
Harness story evidence, API response codes, E2E checks, and production smoke
tests.

## Alternatives Considered

1. Store invite scope and guest response in one field. Rejected because an
   administrator's invitation choice and a guest's answer are different facts.
2. Store the new answer inside `lodging_guests`. Rejected because event
   attendance has dedicated columns and the JSON workaround obscures reporting.
3. Always show a third event. Rejected because the question applies only to
   selected ceremony guests.
