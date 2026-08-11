# US-012 Simplify RSVP Review and Validation Feedback

## Status

in_progress

## Lane

normal

## Product Contract

The RSVP flow must remain calm and legible for older guests and in-app mobile
browsers. Invalid public links must never expose an admin sign-in surface. The
review step must summarize the submitted choices without adding administrative
numbering, nested cards, or decorative status pills. Inline validation feedback
must disappear as soon as the matching field becomes valid.

## Relevant Product Docs

- `docs/product/guest-personalization.md`

## Acceptance Criteria

- A missing or deleted invite renders only a guest-facing explanation and a
  safe way to retry the invitation; no password field or admin action is shown.
- The review step preserves every ceremony, intimate-party, banquet, lodging,
  and guest-count value while presenting them as flat rows with hairline
  separators.
- Review rows keep titles, dates, and attendance states readable without
  squeezing on narrow mobile screens.
- Correcting a ceremony, intimate-party, banquet, lodging, guest-name, child-age,
  or guest-count field clears its resolved inline error immediately.
- Functional controls use sentence case and the review actions have no
  perpetual shimmer.
- RSVP payloads, drafts, API endpoints, invite rules, and Supabase persistence
  remain unchanged.

## Design Notes

- Commands: none.
- Queries: none.
- API: unchanged.
- Tables: unchanged.
- Domain rules: unchanged.
- UI surfaces: `/rsvp?invite={token}` invalid, form, review, and completion states.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Source checks confirm the guest-only invalid state and calm functional copy. |
| Integration | Existing RSVP resilience tests preserve all branches and payload behavior. |
| E2E | Mobile browser verifies inline error recovery and review readability. |
| Platform | Next.js production build and scoped lint pass. |
| Release | Not required unless deployment is requested. |

## Harness Delta

Use the existing RSVP resilience harness and add focused source assertions only
if a regression is not covered by the existing suite.
