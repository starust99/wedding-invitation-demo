# Exec Plan

## Goal

Preserve the RSVP confirmation design while making each calendar button choose
the most suitable device handoff automatically.

## Scope

In scope:

- Shared calendar event definitions and standards-compliant iCalendar output.
- Same-origin smart calendar route.
- Existing RSVP calendar buttons.
- Automated route and source-contract checks.

Out of scope:

- Calendar-provider account authentication.
- Email invitations or reminder services.
- UI redesign.

## Risk Classification

Risk flags:

- External systems.
- Public contracts.
- Cross-platform.
- Existing behavior.

Hard gates:

- External Google Calendar behavior.

## Work Phases

1. Confirm the existing UI and calendar behavior.
2. Define the route and calendar event contract.
3. Add deterministic validation.
4. Implement the shared event builder and route.
5. Verify mobile, desktop, in-app user agents, and production deployment.
6. Record Harness evidence.

## Stop Conditions

Pause if the existing UI must change, calendar times are ambiguous, the route
would expose guest data, or validation would require submitting a real RSVP.

