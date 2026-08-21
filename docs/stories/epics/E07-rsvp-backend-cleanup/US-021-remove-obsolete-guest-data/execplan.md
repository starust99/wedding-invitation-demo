# Exec Plan

## Goal

Keep the production backend aligned with the current personalized RSVP: collect
only attendance, guest count, lodging names/child ages/dates, and an optional
post-RSVP wish.

## Scope

In scope:

- Remove obsolete invitation phone/email plus RSVP phone and government-ID
  fields from guest, Admin, API, exports, and Supabase.
- Remove the unused dietary, transport, room-type, elderly-support, and freeform
  RSVP note fields.
- Make typed wish columns the only wish storage path.
- Preserve invitation planning notes, event access, lodging eligibility, and all
  current public UI behavior.

Out of scope:

- Invitation tokens and their routing.
- Guest identity, event, lodging, QR, calendar, album, or animation changes.
- Room assignment or payment tracking.

## Risk Classification

Risk flags:

- Data model and destructive migration.
- Privacy and sensitive-data removal.
- Public/API contract changes.
- Existing RSVP and Admin behavior.

Hard gates:

- Data deletion and audit/security.

## Work Phases

1. Inventory current UI fields and persistence paths.
2. Record the reduced data contract and migration order.
3. Remove obsolete fields from types, routes, UI, Admin, and exports.
4. Apply the production migration and verify schema/data integrity.
5. Run focused, regression, build, and live-browser checks.
6. Update Harness evidence, commit, and publish.

## Stop Conditions

Pause for human confirmation if:

- A field currently visible or editable on the public RSVP would be removed.
- Existing production RSVP rows contain data that cannot be migrated safely.
- The wish migration cannot be applied atomically before removing legacy notes.
