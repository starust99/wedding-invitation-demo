# Design

## Domain Model

`Invitee.postCeremonyPartyInvited` is the administrator-controlled invitation
scope. `RSVPResponse.attendingPostCeremonyParty` is the guest answer and is
nullable when the question is unanswered or does not apply.

Rules:

1. A blank workbook cell maps to `postCeremonyPartyInvited = false`.
2. The only non-blank workbook value accepted is `Có`.
3. The guest question applies only when the invite flag and ceremony attendance
   are both true.
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

RSVP reveals a compact nested row directly below the ceremony response using
the existing wedding visual language. Review and success states repeat the
answer only when applicable. Admin gains invite scope editing, response status,
filtering, estimated counts, and export columns.

The reveal must work with touch interaction and reduced motion across mobile,
tablet, desktop, and in-app browsers.

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
