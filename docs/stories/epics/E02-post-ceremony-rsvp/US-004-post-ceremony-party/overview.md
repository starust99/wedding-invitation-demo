# Overview

## Current Behavior

The invite workbook controls guest names and estimated party size, while RSVP
collects attendance for the wedding ceremony and wedding banquet. There is no
invite-scoped way to ask selected ceremony guests whether they will join the
small gathering after the ceremony.

Event attendance is also still written through the legacy `lodging_guests`
JSON compatibility shape even though dedicated ceremony and banquet columns
exist.

## Target Behavior

The invite workbook exposes an optional `Tham gia tiệc sau Hôn phối` column.
Blank means the question does not apply. `Có` means the guest sees a conditional
post-ceremony-party question after choosing to attend the ceremony.
The workbook no longer exposes the derived `Lời mời trong thiệp` column;
invitation copy continues to be generated from the guest identity during
import/runtime, and older workbooks containing the column remain compatible.

Invitation eligibility and the guest's answer are persisted separately,
validated by the server, summarized in Admin, and included in RSVP exports.
Existing invites and responses remain readable.

Guests with the invite flag see the intimate-party response inline with the
ceremony, as before. Guests without the flag first answer only the ceremony and
Terracotta wedding: a Terracotta acceptance goes straight to review, while a
decline opens a separate intimate-party step with an edit path
back to the preserved event choices.

## Affected Users

- Wedding administrators importing guest spreadsheets and coordinating counts.
- Selected invitees responding from private RSVP links.

## Affected Product Docs

- `docs/product/guest-personalization.md`

## Non-Goals

- Asking guests for a separate headcount for the post-ceremony party.
- Changing splash, hero, timeline, venue, or unrelated invitation animation.
- Changing existing guest-name or salutation behavior.
