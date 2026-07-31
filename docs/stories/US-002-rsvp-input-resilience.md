# US-002 Preserve RSVP Input and Explicit Guest Choices

## Status

implemented

## Lane

normal

## Product Contract

The RSVP form must preserve guest input across delayed hydration and reloads,
while never manufacturing an answer the guest has not explicitly selected.

## Relevant Product Docs

- `PRODUCT.md`
- `DESIGN.md`

## Acceptance Criteria

- Opening the lodging section after accepting the wedding banquet leaves all
  four lodging choices unselected.
- Review is blocked with a polite inline message until the guest explicitly
  selects a lodging option.
- A saved RSVP or local draft restores its previously selected lodging option.
- Selecting no banquet attendance clears any lodging choice and lodging guest
  details.

## Design Notes

- `stayDecision` uses `null` for unanswered and `"none"` only for an explicit
  “Không nghỉ lại” response.
- The four lodging buttons expose their selected state through `aria-pressed`.
- The persistence payload and API contract remain unchanged.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Zod form validation rejects an unanswered lodging decision when banquet attendance is yes. |
| Integration | RSVP resilience script preserves drafts and reaches review after an explicit lodging response. |
| E2E | Mobile browser shows four unselected lodging choices and an inline validation message before review. |
| Platform | TypeScript, lint, and production build pass. |
| Release | Vercel production deployment serves the updated RSVP behavior. |

## Harness Delta

The RSVP resilience script now checks the unanswered lodging state and the
explicit-choice validation path.

## Evidence

- `npm run check:rsvp-resilience`
- `npm run check:post-ceremony-rsvp`
- `npm run check:guest-copy`
- `npx tsc --noEmit --pretty false`
- `npm run lint`
- `npm run build`
- Local browser verification at 390px width
