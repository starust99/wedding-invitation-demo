# Design

## Domain Model

`salutationCluster` is the exact short address selected from the Excel
`Cụm danh xưng` dropdown. `guestName` remains the full `Cụm tên khách`.

## Application Flow

Excel import reads both inputs, builds the full guest name without title-casing
relationship words, and creates an invitee carrying both values. API and local
storage preserve the short value. Rendering selects the full or short value
according to the product contract.

## Interface Contract

Invite payloads add an optional `salutationCluster` string for backward
compatibility. Existing clients remain valid.

## Data Model

Add `invitees.salutation_cluster text not null default ''`. Existing rows use a
deterministic application fallback until they are re-imported or edited.

## UI / Platform Impact

Private hero and RSVP review show the full guest name. Thank-you and RSVP result
sentences show the short salutation. Generic public copy remains unchanged.

## Observability

No new logs are required. Validation uses deterministic import fixtures,
component-copy assertions, workbook inspection, and browser DOM checks.

## Alternatives Considered

1. Parse every sentence from `hostRelationship`; rejected because the Excel
   salutation is the source of truth.
2. Keep deriving from full names forever; rejected because pair and family
   labels can be ambiguous.
3. Reuse `invitation_name`; rejected because it stores the full name today.

