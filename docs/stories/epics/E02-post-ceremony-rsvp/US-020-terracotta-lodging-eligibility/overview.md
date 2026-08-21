# Overview

## Current Behavior

Terracotta lodging eligibility is inferred only from `Nhóm khách`. The four
Nhà Trai/Nhà Gái `Họ nội` and `Họ ngoại` groups are eligible; every other group
is excluded even when the family wants to offer that specific invitee a room.

## Target Behavior

Each invite stores `terracottaLodgingEligible`. The invite workbook exposes the
`Lưu trú tại Terracotta` dropdown with `Có` or blank. Family groups are treated
as `Có` automatically, while other guests can be opted in individually.

An eligible guest sees lodging choices only after accepting the Terracotta
wedding banquet. Declining Terracotta clears and suppresses lodging regardless
of the invite flag.

## Affected Users

- Wedding administrators managing invitation and lodging scope.
- Selected non-family guests attending the Terracotta banquet.
- Existing family invitees whose lodging flow must remain unchanged.

## Affected Product Docs

- `docs/product/guest-personalization.md`

## Non-Goals

- Room inventory, pricing, or room assignment.
- Displaying the eligibility flag as guest-facing invitation copy.
- Changing post-ceremony invitation eligibility.

