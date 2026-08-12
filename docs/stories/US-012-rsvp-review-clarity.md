# US-012 Simplify RSVP Review and Validation Feedback

## Status

completed

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
- Positive attendance states use calm text without a decorative check icon;
  for non-family invitees, the guest count sits inside the Tiệc cưới row rather
  than appearing as an unrelated review section.
- Every new non-family RSVP starts at exactly one guest regardless of the
  imported estimate. A saved positive count is preserved, and changing a fully
  declined response back to attendance restores the count to one.
- Correcting a ceremony, intimate-party, banquet, lodging, guest-name, child-age,
  or guest-count field clears its resolved inline error immediately.
- Functional controls use sentence case and the review actions have no
  perpetual shimmer.
- The unanswered invitation card uses a non-blocking hand cue beside the RSVP
  button. It taps twice every 2.5 seconds, adds one subtle ripple after the
  second tap, never covers the label, and disappears after an RSVP exists.
- The RSVP form reuses that hand cue at the “Xem lại và hoàn tất” button as soon
  as the active invite branch satisfies the same validation schema used to open
  the review screen; the cue never covers the button label.
- On the final review screen, the primary “Xác nhận gửi hồi đáp” action remains
  centered at every breakpoint; “Chỉnh sửa” is a compact secondary action above
  the review card with its left edge aligned to the card, and the tap cue never
  changes either alignment.
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
| E2E | Mobile browser verifies inline error recovery, review readability, and the non-obscuring RSVP tap cue. |
| Platform | Next.js production build and scoped lint pass. |
| Release | Not required unless deployment is requested. |

## Harness Delta

Use the existing RSVP resilience harness and add focused source assertions only
if a regression is not covered by the existing suite.

## Evidence

- `npx eslint src/components/RsvpSection.tsx`
- `npx tsc --noEmit`
- `npm run check:guest-copy`
- `npm run check:rsvp-resilience`
- `npm run build`
- In-app browser visual check at 320 px and 390 px confirmed that the animated
  hand remains beside the CTA label and does not intercept the button.
