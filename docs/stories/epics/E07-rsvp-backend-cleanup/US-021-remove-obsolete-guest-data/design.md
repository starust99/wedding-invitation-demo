# Design

## Domain Model

`RSVPResponse` contains attendance, guest count, lodging, and wish fields only.
`LodgingGuest` contains `fullName`, `isChild`, and optional `age`. `Invitee`
retains administrator planning metadata but no unused contact phone/email.

## Application Flow

1. The RSVP page builds the same visible answers as before.
2. The token-scoped route parses a closed request schema and derives all
   authority-sensitive fields from the stored invite.
3. RSVP upsert never writes wish columns, so an existing wish survives edits.
4. The wish route writes typed wish columns with compare-and-set semantics.
5. Admin and exports read the reduced mapper model.

## Interface Contract

Removed from RSVP request/response payloads: `phone`, `dietaryNote`,
`transportNeeded`, `roomType`, `elderlySupportNeeded`, and `notes`.
`lodgingGuests[].idNumber` is removed. Unknown request keys are ignored by the
token route and never persisted.

The current attendance, lodging, and wish fields remain unchanged.

## Data Model

A single ordered migration:

1. Adds/backfills/validates typed wish fields.
2. Removes `idNumber` and `id_number` keys from stored lodging JSON.
3. Drops obsolete RSVP columns and the unused `invitees.phone`/`email` columns.
4. Validates the existing invitee foreign key and reloads PostgREST schema.

Production currently has zero RSVP rows, but the migration remains safe for
legacy rows.

## UI / Platform Impact

Public RSVP layout and behavior are unchanged because removed fields were not
rendered. Admin loses empty phone/legacy-note columns and filters; its event,
lodging, wish, and invitation-planning surfaces remain.

## Observability

Validation checks source contracts, generated exports, SQL migration contents,
focused RSVP flows, build output, production schema, and the live `/g/` flow.

## Alternatives Considered

1. Hide fields but retain storage. Rejected because it preserves unused
   sensitive-data paths and backend drift.
2. Keep the wish fallback indefinitely. Rejected because typed fields are the
   accepted source of truth and production is ready for migration.
