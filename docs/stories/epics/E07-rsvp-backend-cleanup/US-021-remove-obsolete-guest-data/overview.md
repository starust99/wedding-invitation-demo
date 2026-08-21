# Overview

## Current Behavior

The public RSVP no longer asks for a phone number, government ID, dietary note,
transport request, room type, elderly-support request, or freeform note. Those
fields remain in TypeScript models, API payloads, Supabase columns, Admin, and
exports. Wishes also retain a temporary `notes` fallback because the typed wish
migration has not reached production.

## Target Behavior

The backend stores only fields used by the current site: invitation ownership,
event answers, guest count, lodging decision/names/child ages/dates, derived
lodging counts, one optional wish, and submission time. No phone number or
government ID is accepted, returned, displayed, exported, or retained.

## Affected Users

- Guests submitting or reopening a personalized RSVP.
- The couple reviewing responses and exporting guest/lodging workbooks.
- Administrators importing and editing invitations.

## Affected Product Docs

- `docs/product/rsvp-keepsakes.md`
- `docs/product/guest-personalization.md`

## Non-Goals

- Changing any visible public RSVP question or animation.
- Removing invitation planning notes used to distinguish duplicate guest names.
- Changing invitation tokens or personalized link behavior.

