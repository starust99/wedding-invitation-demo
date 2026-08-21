# Validation

## Proof Strategy

Prove that obsolete fields are absent end-to-end while every current RSVP,
lodging, wish, Admin, and export path remains operational.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Reduced mapper/storage types; lodging summaries contain names/child ages only. |
| Integration | Closed RSVP payload, typed wish compare-and-set, migration scrub/drop/constraints, reduced CSV/XLSX columns. |
| E2E | Personalized RSVP, lodging, confirmation wish and gift QR, Admin response rendering. |
| Platform | Production build and live `/g/` smoke. |
| Logs/Audit | Production schema and zero orphan/invalid rows after migration. |

## Fixtures

- Eligible family and selected non-family lodging invitations.
- Adult and child lodging names without identity documents.
- One RSVP with and without a wish.

## Commands

```text
npm run check:rsvp-backend-cleanup
npm run check:rsvp-wishes
npm run check:post-ceremony-rsvp
npm run check:rsvp-branching
npm run check:rsvp-resilience
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

## Acceptance Evidence

Pending implementation.

