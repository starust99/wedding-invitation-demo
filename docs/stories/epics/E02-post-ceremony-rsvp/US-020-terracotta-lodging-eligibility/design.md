# Design

## Domain Model

`Invitee.terracottaLodgingEligible` is administrator-controlled invitation
scope. Effective eligibility is true when either the stored flag is true or
the guest belongs to one of the four legacy family lodging groups.

Rules:

1. Family guest groups default to `Có` during workbook creation/import and are
   backfilled to true in Supabase.
2. Other groups require an explicit `Có`.
3. Eligibility only activates when `attendingBanquet` is true.
4. Nhà Trai Họ nội/Họ ngoại retain the existing 26/12-only restriction.
5. Old workbooks without the column preserve existing stored eligibility; new
   family rows still derive true from their group.

## Application Flow

Workbook parsing produces the boolean. Invite import preserves it for old
files, then the mapper writes it to Supabase. Shared and dynamic invite APIs
return it to RSVP. RSVP uses the effective eligibility rule for rendering,
validation, draft hydration, and submission. The server reloads the invite row
and independently enforces the same rule before persisting lodging details.

## Interface Contract

Invite DTO adds:

- `terracottaLodgingEligible: boolean`

The invite workbook and link workbook add:

- `Lưu trú tại Terracotta` (`Có` or blank in the import workbook; `Có`/`Không`
  in the link workbook).

The RSVP request does not gain an authority field. The server reads eligibility
from the invite record so a client cannot grant itself lodging.

## Data Model

Add `invitees.terracotta_lodging_eligible boolean not null default false` and
backfill rows whose normalized `guest_group` is one of the four family groups.
No RSVP rows are rewritten or deleted.

## UI / Platform Impact

Admin simple-add and invite detail surfaces expose the flag. RSVP reuses the
existing lodging card and animations; only its eligibility predicate changes.
Mobile, desktop, WebKit, and chat WebViews retain the same layout.

## Observability

Harness evidence records workbook parsing, mapper round trips, server authority,
browser branching, build output, and migration contents.

## Alternatives Considered

1. Add more guest groups. Rejected because group labels should describe the
   guest, not act as one-off accommodation permissions.
2. Infer from `Đơn vị khách = Gia đình`. Rejected because families of friends
   are not automatically entitled to resort lodging.
3. Trust the RSVP request. Rejected because eligibility is an administrator
   decision and must be server-authoritative.

