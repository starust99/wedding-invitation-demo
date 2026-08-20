# US-019 Export Invitation Links By Family Side

## Status

implemented

## Lane

normal

## Product Contract

Admin can export personalized invitation-link workbooks for each family side
without manually filtering the guest list. The Nhà Trai export includes all
`[Nhà Trai]` groups and `[Nhật]` guests. The Nhà Gái export includes all
`[Nhà Gái]` groups and `[Phương]` guests.

## Relevant Product Docs

- `docs/product/guest-personalization.md`
- `docs/product/social-link-previews.md`

## Acceptance Criteria

- Admin offers separate `Nhà trai` and `Nhà gái` link-export actions alongside
  the existing recently imported and full-list exports.
- Nhà Trai export includes normalized Nhà Trai groups plus Nhật's friends and
  colleagues, and excludes Nhà Gái, Phương, and unclassified groups.
- Nhà Gái export includes normalized Nhà Gái groups plus Phương's friends and
  colleagues, and excludes Nhà Trai, Nhật, and unclassified groups.
- Each action shows its current guest count, is disabled for an empty scope,
  preserves canonical `/g/<token>` links, and downloads a side-specific file.
- Existing full-list and recently imported exports remain available.
- Link workbooks include an administrator-only note beside each guest name so
  duplicate display names can be distinguished without altering either link's
  guest-facing invitation copy.

## Design Notes

- Commands: four compact export actions grouped under one `Xuất link thiệp`
  label.
- Queries: none.
- API: reuse the authenticated invite-links workbook route with a filtered
  invitee payload.
- Tables: unchanged.
- Internal notes reuse `Invitee.notes`; the seven visible import columns remain
  unchanged and optional row-note metadata lives in the very-hidden system sheet.
- Domain rules: side ownership is derived only from normalized `Nhóm khách`.
- UI surfaces: `/admin`, tab `Khách mời & Link`.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Accent-insensitive side classification across canonical and legacy group labels. |
| Integration | Generated workbooks contain only the intended side, canonical `/g/` links, and internal notes that do not alter duplicate invitation names. |
| E2E | Admin source/browser check exposes both actions, counts, and disabled empty states. |
| Platform | TypeScript, scoped lint, and production build pass. |
| Release | Vercel production is Ready and `/admin` serves the updated bundle. |

## Harness Delta

Add a focused side-classification and workbook-content regression check.

## Evidence

- `npm run check:invite-link-sides` passed all canonical Nhà Trai/Nhà Gái
  groups, Nhật/Phương friend groups, legacy punctuation, unclassified guests,
  Admin wiring, workbook isolation, and canonical `/g/` URLs.
- Direct browser review passed at desktop and 390px: the four export scopes are
  balanced, display live counts, and empty scopes are disabled.
- Direct Admin interaction exported the Nhà Trai scope and displayed the
  success state naming `Nhà trai và khách của Nhật`.
- `npm run check:invite-preview`, `npm run check:post-ceremony-rsvp`, and
  `npm run check:guest-copy` passed without regressions.
- Scoped ESLint, TypeScript, and the Next.js production build passed.
