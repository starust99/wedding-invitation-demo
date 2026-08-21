# Exec Plan

## Goal

Give administrators explicit per-invite control over Terracotta lodging while
preserving automatic eligibility for the four existing family guest groups.

## Scope

In scope:

- Add `Lưu trú tại Terracotta` to invite import and link-export workbooks.
- Persist an invite-scoped boolean through Admin and Supabase.
- Ask eligible guests about lodging only after they accept the Terracotta banquet.
- Preserve Nhà Trai family restriction to the night of 26/12.
- Keep old workbooks and existing family invitations compatible.

Out of scope:

- Assigning rooms or enforcing resort capacity.
- Offering lodging after only the post-ceremony gathering.
- Changing invitation copy, event access, or album groups.

## Risk Classification

Risk flags:

- Data model.
- Public contracts.
- Existing behavior.
- Multi-domain.

Hard gates:

- Additive database migration with an existing-data backfill.

## Work Phases

1. Audit current group-derived lodging behavior.
2. Define the invite-scoped field and compatibility rule.
3. Update workbook, mapper, persistence, Admin, and RSVP boundaries.
4. Add unit, integration, and browser regression coverage.
5. Render and inspect workbook output.
6. Build, record evidence, trace, commit, and push.

## Stop Conditions

Pause for human confirmation if:

- Eligibility would need to apply without Terracotta attendance.
- Existing RSVP lodging records require destructive rewriting.
- Nhà Trai family night restrictions must change.

