# Design

## Domain Model

`WeddingCalendarEvent` owns the stable event id, dates, title, location,
description, map URL, and filename for one wedding event.

## Application Flow

1. Guest selects one of the existing calendar links.
2. The browser navigates to `/calendar/[event]` in the same view.
3. The route validates the event id and reads the request user agent.
4. Android receives a temporary redirect to a prefilled Google Calendar event.
5. Other clients receive an iCalendar response from the same route.

## Interface Contract

- `GET /calendar/thanh-le`
- `GET /calendar/tiec-cuoi`
- Unknown event ids return `404`.
- Android returns `302` with an HTTPS Google Calendar `Location`.
- Other clients return `200` with `text/calendar; charset=utf-8`.
- Every response sends `Vary: User-Agent` and `Cache-Control: private, no-store`.

## Data Model

No database or Supabase change.

## UI / Platform Impact

The existing typography, spacing, card, icon, and labels remain unchanged.
Only the interactive element changes from a JavaScript button to a same-styled
anchor, allowing navigation even when client-side popup/download APIs are
restricted.

## Observability

Vercel request logs can distinguish route status and target path. No guest
identity or calendar-account data is recorded.

## Alternatives Considered

1. Keep client-generated `Blob` downloads. Rejected because in-app WebViews
   control whether downloads are handled.
2. Open Google Calendar with `window.open`. Rejected because WebViews commonly
   suppress new windows.
3. Add provider-selection UI. Rejected because the user explicitly requires the
   current two-button interface and the fewest possible guest decisions.

