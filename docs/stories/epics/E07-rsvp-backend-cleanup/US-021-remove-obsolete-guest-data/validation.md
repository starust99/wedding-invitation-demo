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

- `npm run check:rsvp-backend-cleanup` proves the runtime, Admin, CSV/XLSX,
  canonical schema, and migration contain no obsolete contact, identity, or
  legacy RSVP fields; migration versions are unique.
- Wish, post-ceremony, event-access, branching, resilience, lodging-copy,
  guest-copy, and side-specific invite-link checks pass. The browser suites
  preserve the current RSVP, lodging, wish, gift QR, and responsive behavior.
- TypeScript, scoped ESLint, the optimized Next.js production build, and
  `git diff --check` pass. Full lint has zero errors; its remaining warnings are
  pre-existing files outside this change.
- Production deployment `dpl_HY3ntHBDH7k2aq4fYeqitS498NaU` is Ready and
  aliased to `nhatphuong.love` at commit `49ebe5f`.
- Supabase migration history is contiguous and uniquely records `20260729`,
  `20260730`, `20260731`, `20260818`, `20260821`, and `20260822`.
- Production audit reports 74 invites, zero RSVP rows, zero missing required
  columns, zero obsolete columns, zero identity-document JSON keys, a validated
  invitee foreign key, a validated wish constraint, and the typed wish index.
- Live `/g/` and `/rsvp?invite=...` smoke checks load a valid personalized flow
  with no phone/CCCD/passport copy. The live typed wish endpoint returns the
  expected missing-RSVP contract rather than a schema error, and the retired
  generic RSVP POST returns HTTP 405.
