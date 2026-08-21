# Validation Report

## Result

Implementation and local verification passed. The additive production
database migration remains the only deployment follow-up.

## Verified Contracts

- Per-invite lodging is independent from post-ceremony invitation scope.
- Họ nội/Họ ngoại are always effectively eligible.
- Non-family guests require an explicit administrator flag.
- Eligibility is active only with `attendingBanquet = true`.
- Nhà Trai Họ nội/Họ ngoại remain restricted to 26/12–27/12.
- RSVP cannot self-authorize lodging; the server reads the invite record.
- Old workbooks preserve existing per-invite permissions.
- Link exports expose both invitation scopes for administrator review.

## Visual Review

The generated workbook was imported and rendered with the spreadsheet
artifact runtime. The olive title/header system, protected derived cells,
editable ivory cells, nine-column ordering, and dropdown indicators remained
legible. The new lodging column aligned with the neighboring post-ceremony
column and did not clip its header.

## Deployment Follow-Up

Apply `supabase/migrations/20260821_add_terracotta_lodging_eligibility.sql` to
production, then verify one family invite and one explicitly enabled
non-family invite through `/admin` and `/g/<token>`.
