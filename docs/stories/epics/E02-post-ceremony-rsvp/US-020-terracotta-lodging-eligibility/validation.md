# Validation

## Proof Strategy

Prove the path from Excel dropdown to stored invite scope, link-export review,
RSVP reveal/validation, and server-authoritative persistence. Preserve family
defaults, old workbook behavior, and Nhà Trai night restrictions.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Family default, explicit non-family `Có`, blank/invalid parsing, mapper round trip |
| Integration | Nine-column template, old workbook preservation, link-export ordering, migration backfill |
| E2E | Eligible non-family accepts banquet and sees lodging; ineligible non-family does not; decline clears stay |
| Platform | Existing responsive lodging card and reduced-motion behavior remain unchanged |
| Performance | Boolean field adds no new request or asset |
| Logs/Audit | Server reloads invite eligibility and rejects unauthorized lodging payloads |

## Fixtures

- Nhà Gái Họ nội invite with blank workbook lodging cell.
- Nhà Trai Họ ngoại invite retaining 26/12-only lodging.
- Non-family invite explicitly marked `Có`.
- Non-family invite left blank.
- Existing invite imported from an old workbook without the column.

## Commands

```text
npm run check:post-ceremony-rsvp
npm run check:event-access
npm run check:rsvp-branching
npm run check:rsvp-resilience
npm run check:invite-link-sides
npm run lint
npm run build
git diff --check
```

## Acceptance Evidence

- The generated workbook contains nine visible columns in the required order,
  with `Lưu trú tại Terracotta` directly after `Tham gia tiệc sau Hôn phối`.
  The new cell is editable through a `Có`/blank dropdown; the four family
  groups receive `Có` through the workbook formula and deterministic import.
- Artifact-tool inspection of `A1:I12` found the expected nine-column region.
  The rendered sheet was visually inspected for title/header alignment,
  widths, family `Có`, explicit non-family `Có`, and dropdown indicators.
- Parser coverage proves explicit non-family eligibility, automatic family
  eligibility, invalid-value rejection, and compatibility with both the
  eight-column and seven-column predecessor workbooks. Old workbooks preserve
  the stored eligibility of matching invites.
- Link exports contain `Nhóm khách`, `Chi tiết (Optional)`,
  `Tham gia tiệc sau Hôn phối`, `Lưu trú tại Terracotta`, then the canonical
  `/g/` URL. Priest full names and duplicate-name notes remain unchanged.
- Mapper and schema checks prove the additive boolean, family backfill, and
  server-authoritative normalization. Public invite reads retain a legacy
  fallback while the production migration rolls out; Admin warns instead of
  silently claiming that an unapplied lodging flag was saved.
- Browser coverage at `390x844` proves an ineligible friend never sees lodging
  and an explicitly eligible friend sees it only after accepting Terracotta.
  Existing Nhà Trai 26/12-only, fallback-party, review, edit, draft, and
  reduced-motion flows remain green.
- `npm run check:post-ceremony-rsvp`, `npm run check:event-access`,
  `npm run check:invite-link-sides`, `npm run check:rsvp-lodging-copy`,
  `npm run check:rsvp-resilience`, `npm run check:rsvp-branching`, and
  `npm run check:event-access-browser` passed. TypeScript, lint (zero errors;
  existing warnings only), production build, and `git diff --check` passed.
- The migration file is ready and non-destructive. Production application
  remains pending because the available Supabase dashboard session was not
  authenticated; the rollout fallback prevents public invitation reads and
  unrelated Admin saves from breaking before that migration is applied.
