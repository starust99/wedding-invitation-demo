# Overview

## Original Behavior

The RSVP confirmation repeats a mechanical success sentence, then offers only
calendar/album actions and a return button. Guests cannot leave a wish, the
cash-gift QR is absent, and Admin has no wish data.

## Target Behavior

The confirmation keeps only the personal thank-you copy. A white
`Gửi lời chúc` pill opens a compact inline composer, while the always-visible
quiet `Gửi quà mừng` action independently reveals the exact supplied QR. After
one successful wish, a muted confirmation replaces the wish action and the
gift action becomes a white pill. Admin and exports show the message and time.

## Affected Users

- Every guest completing RSVP through a personalized invitation link.
- The couple reviewing responses and exporting the RSVP workbook.

## Affected Product Docs

- `docs/product/rsvp-keepsakes.md`

## Non-Goals

- Recording whether a guest transferred money.
- Allowing wish edits or a public message feed.
- Changing attendance, accommodation, calendar, or album business rules.
