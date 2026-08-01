# US-007 Clarify RSVP Lodging Guest Input

## Status

implemented

## Lane

normal

## Product Contract

The RSVP lodging form must make each guest card easy to scan while keeping
guest-entered values visually lighter than labels and actions. Child-age
guidance must explain why the age is needed without obscuring the numeric
example or changing RSVP persistence.

## Relevant Product Docs

- `docs/product/guest-personalization.md`

## Acceptance Criteria

- `NGƯỜI LƯU TRÚ {n}` remains uppercase, bold, and uses the primary dark text
  color.
- Name, age, notes, dietary-note values, and their placeholders use normal font
  weight.
- The child-age field shows the approved helper copy and keeps `VD: 5` as its
  placeholder.
- The child-age control opens a numeric keyboard where supported and continues
  accepting integer ages only.
- A missing child age reports exactly `Nhập tuổi của bé` below the matching
  field.
- RSVP data shape, draft restoration, and submission behavior remain unchanged.

## Design Notes

- Commands: none.
- Queries: none.
- API: unchanged.
- Tables: unchanged.
- Domain rules: unchanged.
- UI surfaces: lodging subsection of `/rsvp?invite={token}`.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Source assertions for approved copy and normal input typography. |
| Integration | Existing RSVP resilience flow preserves drafts and explicit lodging decisions. |
| E2E | Responsive browser verifies helper, placeholder, title, validation, and computed font weights. |
| Platform | Next.js production build at mobile, tablet, and desktop widths. |
| Release | Not required unless deployment is requested. |

## Harness Delta

Add a focused lodging-copy and typography regression check.

## Evidence

- `npm run check:rsvp-lodging-copy` passed the approved helper, placeholder,
  error-copy, numeric-input, heading, and font-weight assertions.
- Scoped ESLint completed with no errors; existing unrelated warnings in the
  RSVP page remain.
- `npm run check:guest-copy` passed all 9 name patterns and 9 copy branches.
- `npm run build` completed the Next.js production build and TypeScript pass.
- `npm run check:rsvp-resilience` passed against the local production build,
  covering explicit lodging choice, delayed hydration, review, draft reload,
  and the direct-link loading gate.
- Local browser checks rendered the lodging heading at 14px, weight 700, and
  the primary dark color; name and age inputs rendered at weight 400.
- Mobile rendered the approved helper, `VD: 5`, numeric input attributes, and
  `Nhập tuổi của bé`; 390px, 768px, and 1440px checks found no horizontal
  overflow and the browser console stayed clean.
