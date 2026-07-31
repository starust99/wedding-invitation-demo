# Validation

## Proof Strategy

Prove that the visible confirmation controls are unchanged while their links
produce deterministic, device-appropriate server responses.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | iCalendar contains stable UID, event times, UTF-8 details, CRLF output, and readable filenames; browser guidance distinguishes chat-app recovery from downloaded-file recovery. |
| Integration | External Apple Safari gets inline iCalendar; remaining desktop/WebView clients get an attachment; Android gets a same-tab Google Calendar redirect; unknown event returns 404. |
| E2E | Existing confirmation card still exposes only `THÁNH LỄ` and `TIỆC CƯỚI`; chat-app and downloaded-file recovery appear inline, remain non-blocking, and cancel on successful handoff signals. |
| Platform | iPhone Safari, iPad Safari desktop user agent, macOS Safari/Chrome, Windows Chrome, Android Chrome, representative chat apps, and unnamed iOS/Android WebViews. |
| Performance | No third-party script; fallback adds only local user-agent detection and a short-lived timer. |
| Logs/Audit | No guest identity or provider-account data is logged or stored. |

## Fixtures

- iPhone Safari user agent.
- iPhone Messenger user agent.
- Android Chrome user agent.
- Android Zalo user agent.
- Desktop browser user agent.

## Commands

```text
CALENDAR_TEST_BASE_URL=http://localhost:3107 npm run check:smart-calendar
npm run check:calendar-handoff
npx tsc --noEmit --pretty false
npm run lint
npm run build
```

## Acceptance Evidence

- Local smart-calendar checks passed for inline iPhone/iPad/macOS Safari,
  attachment-based Messenger/macOS Chrome/Windows Chrome, readable filenames,
  Android Chrome/Zalo redirects, cache headers, and unknown-event 404.
- Browser E2E proved that Zalo still receives external-browser guidance,
  ordinary iPhone Safari receives downloaded-file recovery, and blur cancels
  either pending instruction.
- Existing RSVP resilience, post-ceremony RSVP, and guest-copy checks passed.
- TypeScript and production build passed.
- ESLint passed with no errors; existing repository warnings remain.
