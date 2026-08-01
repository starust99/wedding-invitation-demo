# US-006 Keep the Couple Name Together

## Status

implemented

## Lane

normal

## Product Contract

Every visible occurrence of the configured couple display name must behave as
one inline phrase. A browser may move the whole phrase to the next line, but it
must never split the two names around the ampersand.

## Relevant Product Docs

- `docs/product/guest-personalization.md`
- `docs/product/invitation-loading-and-motion.md`

## Acceptance Criteria

- `Nhật & Phương` stays on one line in the public hero, private-invite hero,
  RSVP confirmation copy, access gate, and editor previews.
- The rule follows the configured couple display name rather than relying on a
  one-off hard-coded sentence fix.
- Long surrounding copy still wraps normally and does not create horizontal
  page overflow at a 320px viewport.
- Input placeholder copy that mentions the couple receives the same no-break
  behavior without changing its wording.

## Design Notes

- Commands: none.
- Queries: none.
- API: unchanged.
- Tables: unchanged.
- Domain rules: the stored couple name remains plain text; no-break behavior is
  a presentation concern.
- UI surfaces: `/`, `/i/{token}`, `/rsvp?invite={token}`, access gates, and
  editor/version previews.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Phrase segmentation preserves text and marks every exact couple-name occurrence. |
| Integration | Source coverage check confirms every relevant render point uses the shared presentation primitive. |
| E2E | Browser DOM verifies the couple-name span has one client rect and the page has no horizontal overflow. |
| Platform | Production build and responsive checks at 320px, tablet, and desktop. |
| Release | Not required unless the user requests deployment. |

## Harness Delta

Add a focused couple-name wrapping check to prevent future copy branches from
rendering the configured name as ordinary breakable text.

## Evidence

- `npm run check:couple-name-wrap` passed phrase segmentation, dynamic-name,
  repeated-name, placeholder, and render-coverage assertions.
- `npm run check:guest-copy` passed all 9 name patterns and 9 RSVP copy
  branches after RSVP copy started accepting the configured couple name.
- Scoped ESLint passed with no errors; existing unrelated warnings remain.
- `npm run build` completed the Next.js production build and TypeScript pass.
- Local production-browser checks at 320x720, 768x1024, and 1440x900 found
  `white-space: nowrap`, exactly one client rect for `Nhật & Phương`, and zero
  horizontal page overflow.
- The 320px RSVP browser check rendered the decline-note placeholder with
  non-breaking spaces inside `Nhật & Phương` and reported no console errors.
