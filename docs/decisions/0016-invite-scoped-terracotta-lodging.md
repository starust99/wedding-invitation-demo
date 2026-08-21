# 0016 Invite-Scoped Terracotta Lodging

Date: 2026-08-21

## Status

Accepted

## Context

Group-derived lodging preserved the family workflow but could not represent
selected friends or other non-family guests whom the hosts want to accommodate
after the Terracotta banquet.

## Decision

Store an administrator-controlled boolean on each invite. Effective lodging
eligibility is the stored boolean or membership in a legacy family lodging
group. The server remains authoritative and activates lodging only when the
guest accepts the Terracotta banquet.

## Alternatives Considered

1. Add special lodging guest groups. Rejected because it overloads grouping and
   makes seating/reporting labels less trustworthy.
2. Make every Terracotta attendee eligible. Rejected because resort rooms are
   intentionally offered only to selected guests.
3. Infer from family-size salutations. Rejected because an invited household
   is not necessarily a relative or lodging guest.

## Consequences

Positive:

- Hosts can grant lodging per invite without changing guest classification.
- Existing relatives keep their current behavior.
- Link exports make both permissions auditable.

Tradeoffs:

- Invite persistence, workbook compatibility, Admin, and RSVP share one new
  boolean contract.
- Deployment must apply an additive Supabase migration.

## Follow-Up

- Verify the migration and re-export the final link workbooks after deployment.

