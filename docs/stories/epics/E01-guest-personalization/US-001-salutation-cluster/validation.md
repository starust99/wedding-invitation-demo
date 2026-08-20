# Validation

## Proof Strategy

Prove the behavior from Excel generation through import, persistence mapping,
copy generation, and browser rendering.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Casing, Bố/Mẹ counts, clergy short-form address, paired names with `&`, fallback salutations, all ThankYou and RSVP result branches |
| Integration | Generated workbook parses into exact salutation/full-name pairs, including `Cha`, and duplicate display names receive distinct tokens |
| E2E | Private hero, ThankYou, and RSVP review/result text |
| Platform | Production build and responsive browser DOM |
| Performance | No new network round trips on public pages |
| Logs/Audit | No console errors during tested flows |

## Fixtures

- `Gia đình anh chị` + `Hiền & Hồng`
- `Gia đình` + `Thảo & Vũ`
- `Hai bạn` + `Tùng & Hương`
- `Bạn` + `Nghĩa`
- `Anh` + `Dũng`
- `Chị` + `Chi`
- `Gia đình` + `Nga & Phong`
- `Gia đình` + `Hải & Linh`
- Two identical `Dì` + `Nên` rows

## Commands

```text
npm run check:guest-copy
npm run lint
npx tsc --noEmit
npm run build
```

## Acceptance Evidence

- Unit copy/name suite passed for 9 name patterns and 9 RSVP/thank-you branches.
- Generated workbook visually inspected and formula results verified.
- Workbook import returned 10 rows with 10 unique tokens, including two
  identical `Dì Nên` rows with different tokens.
- `Bố` and `Mẹ` imported as `single` with expected guest count 1.
- TypeScript, lint, local production build, and Vercel production build passed.
- Live private hero rendered `Gia đình anh chị Tuấn`.
- Live ThankYou rendered `Hẹn gặp gia đình anh chị...`.
- Live RSVP review rendered `Gia đình anh chị Tuấn`.
- Production migration added `invitees.salutation_cluster` and backfilled the
  Tuấn invitation to `Gia đình anh chị`.
- Live invite API returned `backend: supabase`, display label
  `Gia đình anh chị Tuấn`, and salutation cluster `Gia đình anh chị`.
- Production deployment: `https://nhatphuong.love`.
