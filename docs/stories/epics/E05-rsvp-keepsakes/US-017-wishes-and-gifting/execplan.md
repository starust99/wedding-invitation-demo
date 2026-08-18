# Exec Plan

## Goal

Let every personalized guest leave one post-RSVP wish and discreetly open the
couple's cash-gift QR, while keeping the confirmation screen harmonious and
making wishes visible in Admin and exports.

## Scope

In scope:

- Remove the redundant RSVP success sentence from all attendance branches.
- Add the approved wish and gift disclosure states to the existing success
  card.
- Preserve and render the exact supplied QR asset.
- Persist one immutable wish per RSVP response.
- Add Admin filtering, detail visibility, CSV, and Excel fields.
- Add a migration and focused automated/browser proof.

Out of scope:

- Bank/account copy, transfer confirmation, amounts, payment processing, or
  gift analytics.
- Public wish editing, resubmission, moderation, or a guest-facing wish wall.
- Reworking the calendar/album utility card.

## Risk Classification

Risk flags:

- Data model and migration.
- New public API contract.
- Existing post-RSVP behavior.
- Public and Admin domains.
- New cross-layer proof requirement.

## Work Phases

1. Record the product and ownership contract.
2. Add typed storage, migration, and token-scoped compare-and-set API.
3. Add confirmation-card states using the existing paper and pill system.
4. Surface wishes in Admin, CSV, and Excel.
5. Validate logic, build, responsive UI, accessibility, and QR integrity.
6. Push the verified change and confirm the remote branch.

## Stop Conditions

Pause if production schema access would require exposing credentials, the
provided QR cannot be preserved byte-for-byte, or the public wish write cannot
be bound to an existing personalized RSVP.
