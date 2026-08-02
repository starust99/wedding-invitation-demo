# US-008 Ship Approved Dress-Code Illustrations Through the Preload Gate

## Status

implemented

## Lane

normal

## Product Contract

Guests must see the approved master and seven light-color dress-code
illustrations sharply and switch between them without a blank frame, delayed
decode, or second download after the invitation opens.

## Relevant Product Docs

- `docs/product/invitation-loading-and-motion.md`

## Acceptance Criteria

- The master plus Hồng phấn, Xanh biển nhạt, Vàng nhạt, Xanh lá nhạt, Kem, Be,
  and Nâu nhạt illustrations render from the approved v5 asset set.
- Every final file is WebP at 1086x1448 and no larger than 400 KiB.
- The complete eight-image set remains below 2.7 MiB.
- The splash preload gate requires all eight exact render URLs before enabling
  the invitation-opening action.
- Dress-code color changes reuse the preloaded cache entries and keep the
  existing crossfade without a blank image.
- Light-color examples do not contain a dominant dark version that could be
  mistaken for a different dress-code color.

## Design Notes

- Commands: no data mutation.
- Queries: no API changes.
- API: unchanged.
- Tables: unchanged.
- Domain rules: an asset is ready only after the browser can decode the exact
  URL later used by the dress-code section.
- UI surfaces: invitation splash preload and dress-code section.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | File format, dimensions, per-file size, and total-byte assertions |
| Integration | Source assertions bind the eight render URLs to the required preload batch |
| E2E | `check:dresscode-browser` opens the invitation and switches every color without new transfers |
| Platform | Production build and mobile/tablet/desktop visual smoke checks |
| Release | GitHub main deployment reaches Vercel and production serves the v5 assets |

## Harness Delta

Add a focused dress-code asset check so future illustration replacements cannot
silently exceed the preload budget or bypass the cache-sharing contract.

## Evidence

- `npm run check:dresscode-assets`: eight 1086x1448 WebP files passed the
  400 KiB per-file limit and 2.7 MiB set limit (2.50 MiB actual).
- `npm run check:dresscode-browser`: the splash gate fetched all eight exact
  URLs once; switching through all seven colors reused browser cache entries.
- Green, yellow, and beige illustrations were recolored to their light palette
  references; pink, blue, cream, and light brown passed the same visual audit
  without correction.
- `npx tsc --noEmit`, scoped ESLint, `git diff --check`, and the production
  Next.js build pass before release.
