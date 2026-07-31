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
6. In an in-app browser only, the client starts a short non-blocking watch.
7. `pagehide`, blur, or a hidden document cancels the watch as a successful
   handoff signal.
8. If the page is still visible after the delay, one inline app-specific or
   generic external-browser instruction appears below the existing buttons.

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

The existing typography, spacing, card, icon, and labels remain unchanged. The
same-styled anchors keep their native navigation. A small live-status line is
conditionally added only after a likely failed in-app handoff; it never blocks
or replaces the links.

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
