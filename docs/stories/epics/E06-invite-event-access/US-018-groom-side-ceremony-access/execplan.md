# Exec Plan

## Goal

Ensure every Nhà Trai invitee without an initial post-ceremony-party invitation
sees and answers only the Terracotta wedding, while preserving the existing
family lodging rules.

## Scope

In scope:

- Central event-access policy derived from guest group and invite scope.
- Invitation, RSVP, review, confirmation, gallery, and calendar behavior.
- Server-side normalization of hidden ceremony and intimate-party answers.
- Existing Nhà Trai Họ nội/Họ ngoại lodging eligibility for 26/12.
- Focused regression and responsive verification.

Out of scope:

- New workbook columns or database schema.
- Changing Nhà Gái or non-Nhà Trai event flows.
- Extending lodging to Nhà Trai Khách ba/Khách mẹ.
- Rewriting historical RSVP rows directly in production.

## Risk Classification

Risk flags:

- Authorization.
- Public contracts.
- Existing behavior.
- Multi-domain.
- Cross-platform.

Hard gates:

- Authorization.

## Work Phases

1. Document the access matrix and affected surfaces.
2. Add one shared pure policy.
3. Apply the policy to invitation and RSVP presentation.
4. Enforce the policy at RSVP and calendar server boundaries.
5. Verify the group/flag matrix, lodging invariants, and responsive behavior.
6. Update story evidence, Harness records, and release.

## Stop Conditions

Pause for human confirmation if:

- A group not prefixed by `[Nhà Trai]` must be included.
- Existing lodging eligibility must change.
- A database migration or destructive historical cleanup becomes necessary.
- Validation would require weakening current RSVP checks.
