# Validation

## Proof Strategy

Prove the full path from workbook cell to invite row, conditional RSVP,
persisted response, Admin estimate, and exported report. Preserve legacy invite
and RSVP behavior.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Blank/`Có` parsing, invalid value rejection, mapper round trips, conditional normalization |
| Integration | Template validation list, old workbook compatibility, API server authority, direct event columns |
| E2E | Hidden/revealed question, clearing on ceremony decline, draft reload, review, Admin status |
| Platform | Mobile, iPad portrait/landscape, desktop, in-app-browser user agents |
| Performance | Conditional reveal adds no network request or heavy asset |
| Logs/Audit | Migration result, API 400/200 behavior, deployment and smoke evidence |

## Fixtures

- Ineligible single guest.
- Eligible guest with ceremony yes and after-party yes.
- Eligible guest with ceremony yes and after-party no.
- Eligible guest with ceremony no.
- Legacy workbook without the new column.
- Legacy RSVP row with event attendance inside `lodging_guests`.

## Commands

```text
npm run check:post-ceremony-rsvp
npm run check:rsvp-resilience
npm run check:guest-copy
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

## Acceptance Evidence

- `npm run check:post-ceremony-rsvp` passed. It covers blank/`Có`
  workbook parsing, invalid-value rejection, legacy workbook compatibility,
  invite mapping, direct RSVP columns, round trips, and all server-authority
  branches.
- `npm run check:rsvp-resilience` passed against the local production build,
  including delayed hydration, review, and draft restoration.
- `npm run check:guest-copy`, TypeScript, lint, production build, and
  `git diff --check` passed. Lint reported existing warnings and no errors.
- Browser checks passed at mobile `390x844` and iPad portrait `768x1024`.
  Eligible invitees see the extra question only after accepting the ceremony;
  ineligible invitees never see it; review and reload preserve the answer.
- Production migration completed and verified: two legacy RSVP rows were
  backfilled into direct ceremony and banquet columns, with zero remaining
  object-shaped `lodging_guests` rows.
- The workbook renderer bundled with the spreadsheet skill could not load its
  native Skia dependency because of a local code-signature mismatch. Workbook
  structure, formulas, blank defaults, validation, and parsing were therefore
  verified programmatically through ExcelJS.
