# Validation

## Proof Strategy

Prove the one-write data contract separately from the visual states, then run
the existing RSVP regressions and production build.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Trimming, empty/over-500 rejection, mapper fields, success-copy sentence removal. |
| Integration | Migration contract, token-scoped route, immutable compare-and-set, Admin mapper and export fields. |
| E2E | Default actions, composer, successful wish, conflict/error state, independent gift reveal, exact QR URL. |
| Responsive | 320px mobile, tablet, and desktop alignment; no horizontal overflow. |
| Accessibility | 44px targets, textarea label, live status/error, focus, reduced motion. |
| Asset | Copied QR SHA-256 matches the supplied PNG and renders unoptimized. |

## Commands

```text
npm run check:rsvp-wishes
npm run check:guest-copy
npm run check:post-ceremony-rsvp
npm run check:rsvp-branching
npx tsc --noEmit
npx eslint <changed TypeScript files>
npm run build
git diff --check
```

## Acceptance Evidence

- `npm run check:rsvp-wishes` passed against the optimized local server. It
  verified the exact supplied QR SHA-256, migration and compare-and-set source
  contracts, the pre-migration compatibility marker, default gift access,
  exclusive disclosures, the 500-character composer, one POST, submitted
  state, exact white-pill parity with `Thánh lễ`, Admin/export wiring,
  reduced motion, and zero mobile overflow.
- `npm run check:post-ceremony-rsvp`, `npm run check:guest-copy`,
  `npm run check:rsvp-branching`, and `npm run check:rsvp-resilience` passed.
  The persistence check also proved RSVP updates exclude typed wish columns
  and preserve/decode the compatibility marker.
- `npx tsc --noEmit` and the production build passed. Scoped ESLint reported
  zero errors and the same three pre-existing unused-symbol warnings in the
  RSVP page; full lint reported zero errors.
- Mobile screenshots at 390×844 were reviewed for the default composer and
  post-submit QR states. The composer remains inside the main paper card, the
  quiet gift action changes to the same white pill as calendar actions, and the
  QR has deliberate white quiet space without creating another nested card.
- The copied QR asset is byte-identical to the supplied PNG. Apple Vision
  detected and decoded one QR symbol; the payload was intentionally not
  printed or stored by the verification command.
- `git diff --check`, GitNexus indexing, and the optimized route manifest
  (including `/api/invites/[token]/wish`) passed.
