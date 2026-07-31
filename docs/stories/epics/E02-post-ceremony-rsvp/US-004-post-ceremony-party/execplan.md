# Exec Plan

## Goal

Add invite-scoped post-ceremony-party RSVP from workbook input through
Supabase, guest RSVP, Admin coordination, and exports without changing
unrelated invitation behavior.

## Scope

In scope:

- Workbook template, validation, parsing, and compatibility.
- Invite and RSVP domain types and persistence mappers.
- Supabase migration and legacy event-attendance backfill.
- Conditional RSVP UI, draft, review, submission, and server validation.
- Admin editing, summaries, filters, response table, CSV, and XLSX export.
- Automated and production validation.

Out of scope:

- Separate event headcounts.
- New event content management.
- Splash, hero, timeline, venue, and gallery changes.

## Risk Classification

Risk flags:

- Data model.
- Public contracts.
- Cross-platform.
- Existing behavior.
- Multi-domain.

Hard gates:

- Additive production migration.

## Work Phases

1. Record the invite/response data contract.
2. Add schema and mapper support.
3. Extend workbook generation and parsing.
4. Extend RSVP and its server boundary.
5. Extend Admin reporting and exports.
6. Verify locally, migrate production, deploy, and smoke test.
7. Record proof and Harness trace.

## Stop Conditions

Pause for human confirmation if:

- The approved blank-or-`Có` workbook behavior cannot be preserved.
- Migration inspection shows conflicting production column types.
- Verification would require weakening existing RSVP validation.
