# Validation

## Proof Strategy

Prove that the visible confirmation controls are unchanged while their links
produce deterministic, device-appropriate server responses.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | iCalendar contains stable UID, event times, UTF-8 details, and CRLF output. |
| Integration | Apple/desktop gets iCalendar; Android gets a same-tab Google Calendar redirect; unknown event returns 404. |
| E2E | Existing confirmation card still exposes only `THÁNH LỄ` and `TIỆC CƯỚI` calendar actions. |
| Platform | Mobile, tablet, desktop, and representative chat-app user agents. |
| Performance | Route adds no client bundle or third-party script. |
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
npx tsc --noEmit --pretty false
npm run lint
npm run build
```

## Acceptance Evidence

- Local smart-calendar checks passed for iPhone Safari, iPhone Messenger,
  Android Chrome, Android Zalo, desktop, cache headers, and unknown-event 404.
- Existing RSVP resilience, post-ceremony RSVP, and guest-copy checks passed.
- TypeScript and production build passed.
- ESLint passed with no errors; existing repository warnings remain.
