# 0017 Minimize Guest RSVP Data

Date: 2026-08-21

## Status

Accepted

## Context

The current public RSVP asks only for event attendance, headcount, lodging
names/child ages/dates, and an optional wish. Older phone, government-ID,
dietary, transport, room-type, elderly-support, and freeform-note fields remain
in persistence and Admin despite no longer being collected. The temporary wish
fallback also keeps `notes` overloaded after typed wish storage was accepted.

## Decision

- Persist only data required by the current public RSVP and Admin workflow.
- Remove phone and government-ID collection, display, export, API fields, and
  Supabase storage.
- Remove other unused RSVP ancillary fields rather than silently retaining
  empty compatibility columns.
- Keep invitation planning notes because they distinguish duplicate guest names
  and support seating/group operations.
- Make `wish_message` and `wish_sent_at` the sole wish source of truth; migrate
  any legacy marker before dropping RSVP notes.
- Preserve event access, lodging eligibility, lodging names/child ages/dates,
  the cash-gift QR, and all current public presentation.

## Alternatives Considered

1. Hide the fields only in UI. Rejected because the backend would still accept,
   return, and retain unnecessary personal data.
2. Remove only phone and government ID. Rejected because the same dead path
   contains several other unrendered RSVP fields and the requested outcome is a
   backend matching the current web product.
3. Remove invitation notes too. Rejected because those are active internal
   planning metadata, not guest-submitted RSVP notes.

## Consequences

Positive:

- Supabase, API, Admin, exports, and UI share one smaller contract.
- The site no longer retains phone numbers or identity documents.
- Wishes no longer depend on a compatibility fallback.

Tradeoffs:

- Old clients sending removed fields will have those values ignored.
- The destructive migration requires ordered production verification.

## Follow-Up

- Revisit retention of lodging names and child ages after hotel coordination is
  complete.

