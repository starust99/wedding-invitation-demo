# 0008 Separate Post-Ceremony Invite Scope from RSVP

Date: 2026-07-31

## Status

Accepted

## Context

Only selected ceremony guests should be asked about the gathering after the
wedding ceremony. The workbook value determines whether the question applies,
while the guest's RSVP determines whether they will attend. Reusing one field
for both facts would make imports overwrite responses and make Admin reporting
ambiguous.

Existing ceremony and banquet answers also have dedicated database columns but
are still written into the lodging JSON compatibility payload.

## Decision

- Store invitation scope on `invitees.post_ceremony_party_invited`.
- Store the guest answer on
  `rsvp_responses.attending_post_ceremony_party`.
- Treat a blank workbook cell as false and accept only `Có` as true.
- Require the answer only for an invited guest attending the ceremony.
- Normalize non-applicable answers to null at the server boundary.
- Write ceremony, banquet, and post-ceremony answers to dedicated columns.
- Keep legacy JSON reading during the migration window.

## Alternatives Considered

1. One shared field for invite and response. Rejected because imports and
   responses have different owners.
2. A third value in `attending`. Rejected because `attending` summarizes the
   overall RSVP and cannot represent independent events.
3. Continue storing event answers in `lodging_guests`. Rejected because it
   mixes unrelated domains and weakens reporting.

## Consequences

Positive:

- Workbook imports cannot be confused with guest answers.
- RSVP stays short for guests outside the selected scope.
- Admin can distinguish yes, no, pending, and not applicable.
- Event reporting uses typed database columns.

Tradeoffs:

- Migration and compatibility handling touch both invite and RSVP records.
- Admin exports must combine invite scope with response data.

## Follow-Up

- Remove the legacy event-attendance JSON reader only after production data is
  confirmed normalized.
