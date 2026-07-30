# Overview

## Current Behavior

Excel salutation clusters are merged into full guest names during import. The
short salutation is discarded, public copy falls back to generic or inferred
kinship words, and `Bố`/`Mẹ` are classified as couple invitations.

## Target Behavior

Persist the Excel salutation cluster, preserve sentence-style capitalization in
the full guest name, and render full names versus short salutations only in the
agreed private-invite and RSVP locations.

## Affected Users

- Wedding administrators importing guest spreadsheets.
- Invitees opening private invitation links and submitting RSVP responses.

## Affected Product Docs

- `docs/product/guest-personalization.md`

## Non-Goals

- Personalizing the public `/` route.
- Rewriting dress-code, lodging, note, or other generic `Quý khách` copy.
- Dropping legacy relationship columns from Supabase.

