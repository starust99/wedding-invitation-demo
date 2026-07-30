# Exec Plan

## Goal

Make current and future Excel imports render the agreed full guest names and
short salutations consistently.

## Scope

In scope:

- Excel generation and parsing.
- Invitee mapping, API transport, Supabase migration, and admin editing.
- Private invite hero, thank-you copy, and RSVP result copy.
- Compatibility fallback and automated proof.

Out of scope:

- Generic `/` personalization.
- Rewriting unrelated `Quý khách` copy.
- Destructive removal of legacy relationship columns.

## Risk Classification

Risk flags:

- Data model.
- Public contracts.
- Existing behavior.
- Weak proof.

Hard gates:

- Database migration.

The user approved the plan before implementation.

## Work Phases

1. Preserve and normalize Excel source fields.
2. Extend storage and API contracts.
3. Update scoped render paths.
4. Add migration and compatibility fallback.
5. Add deterministic tests.
6. Verify workbook, build, and browser behavior.
7. Deploy only after proof passes.

## Stop Conditions

Pause if:

- Existing dirty changes overlap incompatibly with the required patch.
- A destructive migration becomes necessary.
- The agreed `Quý khách` scope would need to expand.

