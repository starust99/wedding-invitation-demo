# US-015 Edit RSVP Deadline

## Status

in_progress

## Lane

normal

## Product Contract

The admin editor must expose one RSVP deadline field. Publishing that field
must update both the invitation copy and the guest edit-lock behavior without
requiring a database migration or a second manual date change.

## Acceptance Criteria

- `/admin/editor` shows the current published RSVP deadline in the event-time section.
- The editor accepts the existing day/month/year format and blocks publishing an invalid value.
- Editing the deadline keeps `rsvp.deadline` and the legacy accommodation deadline synchronized.
- The public RSVP card reads the published deadline.
- The `/rsvp` edit lock and its explanatory message read the same published deadline.
- Existing event dates, RSVP answers, invite tokens, Supabase rows, and public layouts remain unchanged.

## Design Notes

- Commands: none.
- Queries: none.
- API: unchanged; the existing site-settings endpoint persists the full content object.
- Tables: unchanged.
- UI surfaces: `/admin/editor`, invitation RSVP card, and `/rsvp` locked state.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Source checks confirm one editor field updates both compatible deadline keys. |
| Integration | Published settings continue through the existing site-settings API. |
| E2E | Editor draft loads the date and invalid date copy is rejected before publish. |
| Platform | Scoped lint and Next.js production build pass. |
| Release | Push `main` so the Vercel-linked editor becomes available. |

## Harness Delta

No schema or API harness change is required. Reuse the existing editor publish
flow and RSVP resilience checks.
