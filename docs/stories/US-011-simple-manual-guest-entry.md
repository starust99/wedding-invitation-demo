# US-011 Simple Manual Guest Entry

## Status

implemented

## Lane

normal

## Product Contract

Admin can add one guest with the same minimal inputs and inference rules used by the guest-list Excel template.

## Relevant Product Docs

- `PRODUCT.md`
- `DESIGN.md`

## Acceptance Criteria

- The add-guest flow asks only for salutation cluster, guest name, guest group, and whether the guest is invited to the post-ceremony party.
- Guest full name, guest unit, invitation copy, estimated count, audience tags, and token are inferred automatically with the Excel template rules.
- No placeholder guest is written before the short form is submitted.
- The saved record remains compatible with the existing admin editor and Supabase API.
- The form works as one column on mobile and a compact two-column layout on larger screens.

## Design Notes

- UI surface: `/admin`, guest list tab.
- Reuse dropdown option sources and inference rules from `src/lib/invite-spreadsheet.ts`.
- Keep advanced editing available after a guest has been created.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Spreadsheet inference checks continue to pass. |
| Integration | Existing `/api/admin/invites` payload saves without schema changes. |
| E2E | Manual short-form flow creates a guest and shows it in the list. |
| Platform | Responsive layout check at mobile and desktop widths. |
| Release | Typecheck and production build. |

## Harness Delta

None expected.

## Evidence

- `npm run check:guest-unit` passed.
- `npx tsc --noEmit` passed.
- `npm run build` passed.
- Targeted ESLint passed for the admin component, admin invite API, and spreadsheet inference module.
- Production client chunks contain no `exceljs` code.
- Manual inference probes passed for family, married-couple-as-family, and partner invite patterns.
