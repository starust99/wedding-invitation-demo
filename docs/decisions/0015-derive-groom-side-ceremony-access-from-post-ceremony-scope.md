# 0015 Derive Groom-Side Ceremony Access from Post-Ceremony Scope

Date: 2026-08-18

## Status

Accepted

## Context

The private invitation currently exposes ceremony information to every guest.
The family decided that every Nhà Trai invitee, including relatives and parent
guests, should see ceremony information only when they are also invited to the
post-ceremony gathering. This is guest-specific information access and must be
consistent across the invitation, RSVP, confirmation, album, and calendar.

## Decision

- Identify Nhà Trai through the normalized `[Nhà Trai]` group prefix.
- Treat `postCeremonyPartyInvited` as the ceremony-access flag only for Nhà Trai.
- Keep all non-Nhà Trai ceremony behavior unchanged.
- Disable the fallback intimate-party invitation for Nhà Trai without the flag.
- Normalize hidden ceremony attendance to false and intimate-party attendance to null at the server boundary.
- Keep lodging independent: Họ nội/Họ ngoại eligibility and allowed nights remain unchanged.
- Do not add workbook columns or database fields.

## Alternatives Considered

1. Hide ceremony only for Nhà Trai relatives. Rejected because the confirmed scope includes all Nhà Trai guests.
2. Add a separate ceremony-access column. Rejected because it duplicates the accepted invite-scope decision and increases import errors.
3. Enforce only in the browser. Rejected because stored responses and tokenized calendar routes could contradict the invitation.

## Consequences

Positive:

- Nhà Trai guests see only the events intended for them.
- A single policy governs every surface and future Nhà Trai groups.
- Workbook and database schemas remain stable.
- Existing family lodging coordination is preserved.

Tradeoffs:

- Historical incompatible responses need effective-policy normalization in reads and are corrected on the next RSVP write.
- Calendar access needs an invite lookup when a private token is supplied.

## Follow-Up

- Verify Admin ceremony totals use effective access for historical rows.
- Review production data before considering a one-time historical cleanup.
