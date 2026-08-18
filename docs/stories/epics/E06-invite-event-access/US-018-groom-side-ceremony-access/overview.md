# Overview

## Current Behavior

Every personalized invite initially exposes the wedding-ceremony card and RSVP
question. Invitees without the initial post-ceremony flag also receive a
fallback intimate-party invitation after declining Terracotta, regardless of
whether their guest group belongs to Nhà Trai.

## Target Behavior

Every guest group whose normalized name begins with `Nhà Trai` receives
ceremony access only when `postCeremonyPartyInvited` is true. Without that
flag, the private invitation, RSVP, review, confirmation, gallery, and tokenized
calendar flow expose only the Terracotta wedding. The fallback intimate-party
flow does not apply.

Nhà Trai Họ nội/Họ ngoại guests remain eligible to register the night of
26/12 when they accept Terracotta. Nhà Trai Khách ba/Khách mẹ remain ineligible
for lodging.

## Affected Users

- Nhà Trai relatives and parent guests opening personalized invitation links.
- The family reviewing RSVP and lodging totals in Admin.

## Affected Product Docs

- `docs/product/guest-personalization.md`
- `docs/product/calendar-actions.md`

## Non-Goals

- Hiding ceremony information from Nhà Gái or other guest groups.
- Adding a lodging permission column.
- Changing guest group names or workbook layout.
- Changing room-night choices.
