# 0014 Store Post-RSVP Wishes With the RSVP Response

Date: 2026-08-18

## Status

Accepted

## Context

A guest can write one optional wish only after completing RSVP. The wish must
be attached to the correct personalized guest, visible in Admin and exports,
and unavailable for later public edits. The cash-gift QR is only a visual
disclosure and must not create payment records.

Creating an independent public wish identity would duplicate the invitation
and RSVP ownership model. Accepting arbitrary RSVP ids from the browser would
also introduce a second unauthenticated capability beyond the existing private
invitation token.

## Decision

- Add nullable `wish_message` and `wish_sent_at` columns to
  `rsvp_responses`, with a database length check of 1–500 characters when a
  message exists.
- Accept wish creation at `POST /api/invites/<token>/wish` only after resolving
  the private invitation token to an existing RSVP response.
- Trim and validate the message at the server boundary.
- Make the write compare-and-set: update only while `wish_message` is null.
  Concurrent or later submissions receive a conflict response and cannot edit
  the stored wish.
- Return wish fields through existing RSVP mappers so guest hydration, Admin,
  CSV, and Excel share one typed source of truth.
- Until the non-destructive migration reaches a deployed database, encode the
  same one-wish payload in the otherwise-unused personalized RSVP `notes`
  field. Preserve that marker across RSVP edits, decode it only through the
  shared mapper, and backfill it into the typed columns during migration.
- Keep the QR as a static public asset and store no transfer, bank, or gift
  status data.

## Alternatives Considered

1. Create a separate `guest_wishes` table. Rejected because the product allows
   exactly one wish per RSVP and does not need moderation history or multiple
   authors.
2. Accept an RSVP UUID from the client. Rejected because the existing private
   invite token is the established public capability and resolves ownership
   without exposing a second identifier.
3. Keep the wish permanently in `notes`. Rejected because guest notes and
   post-RSVP wishes have different meaning, timestamps, validation, UI, and
   export needs. A narrow compatibility marker is accepted only until the
   typed migration backfills it.
4. Save payment or QR interaction state. Rejected because the site does not
   process the transfer and must not imply that a gift was sent.

## Consequences

Positive:

- A wish remains attached to the same record Admin already uses for RSVP.
- The server and compare-and-set update enforce the one-wish rule; the typed
  database constraint also enforces the message contract after migration.
- Existing RSVP edits preserve the wish because RSVP mutations do not write
  the new columns.
- Admin and exports gain the fields through the shared mapper.

Tradeoffs:

- Deleting an RSVP also deletes its wish.
- Guests without a valid personalized invitation token cannot use the public
  wish endpoint; the normal guest flow already requires that token.
- Typed wish columns still require the production migration.
- The temporary notes compatibility path keeps deployed invitations working
  before the migration, but it is not the long-term source of truth.

## Verification

- Migration checks prove nullable fields, length constraint, and PostgREST
  schema reload.
- Route checks cover missing RSVP, invalid input, first write, and conflict.
- Browser checks cover default, composer, submitted, gift, reduced-motion,
  and narrow/mobile layouts.
- Admin and workbook checks cover filters, content, and sent time.

## Follow-Up

The temporary `notes` compatibility path was retired by decision 0017 after
typed wish storage reached production. `wish_message` and `wish_sent_at` are now
the only runtime wish source of truth.
