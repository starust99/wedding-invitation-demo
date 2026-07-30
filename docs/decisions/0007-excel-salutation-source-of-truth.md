# 0007 — Excel Salutation as Guest-Copy Source of Truth

## Status

Accepted.

## Context

The import workbook already separates `Cụm danh xưng` from `Tên khách`, but the
application previously discarded that distinction and tried to reconstruct a
short recipient label from full names and relationship metadata. That produced
incorrect capitalization and generic family wording.

## Decision

- Treat `Cụm danh xưng` as the source of truth for short personalized copy.
- Treat `Cụm danh xưng + Tên khách` as the full guest name.
- Do not use `hostRelationship` or `kinshipPronoun` for the scoped private
  invitation and RSVP thank-you sentences.
- Persist the workbook value in `invitees.salutation_cluster`.
- Keep a deterministic prefix fallback for legacy or incomplete records.
- Preserve `Quý khách` everywhere outside the explicitly personalized surfaces.

## Consequences

New Excel imports behave consistently without adding form fields for guests.
The non-destructive `salutation_cluster` migration was applied to production on
2026-07-30. Existing records render through the stored value or fallback, and
future imports persist the short field explicitly without changing the public
API contract.

## Verification

```text
npm run check:guest-copy
npm run lint
npx tsc --noEmit
npm run build
```
