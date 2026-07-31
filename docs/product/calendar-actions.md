# Calendar Actions

## Product Contract

The RSVP confirmation screen keeps the existing `THÁNH LỄ` and `TIỆC CƯỚI`
buttons. A guest makes no provider or browser choice on the wedding site.

Each button navigates to a same-origin smart calendar route. The server chooses
the least-friction handoff:

- Android receives a Google Calendar event URL in the current browser view.
- External Apple Safari clients receive a standards-based iCalendar response
  marked `inline` so the operating system can process it before downloading.
- Other Windows, macOS, and unknown clients receive the same iCalendar event as
  a human-readable downloaded calendar file.

The operating system or calendar provider may still require its own final
`Add` or `Save` confirmation. The wedding site must not show an alert, open a
popup, or ask the guest to identify their calendar provider first. When a
recognized chat-app WebView stays visible after a calendar action instead of
handing the event off, the confirmation card may reveal one short, inline
instruction for opening the same page in Safari, Chrome, or the default
external browser. If an ordinary non-Android browser stays visible, it may
instead explain how to open the calendar file that was just downloaded.

## Event Requirements

- Event title, start, end, location, map link, and invitation URL are populated.
- Times are encoded as UTC and represent the published Vietnam event times.
- Every event has a stable `UID` so repeated opens do not create a new identity.
- iCalendar output uses UTF-8, CRLF line endings, escaped text, and folded lines.

## Compatibility Rules

- Calendar actions must work as ordinary links without client JavaScript.
- Responses vary by `User-Agent` and must not be shared through a CDN cache.
- Android redirects must use same-tab HTTPS navigation, never `window.open`.
- Apple and desktop calendar responses must come from a real server URL, never
  a client-generated `blob:` URL.
- Downloaded filenames must describe the event in plain language; guest-facing
  help must call them `tệp lịch`, never require the guest to understand `.ics`.
- Ordinary Android browsers receive no fallback guidance because the server
  redirects them to Google Calendar.
- A successful `pagehide`, window blur, or hidden document cancels pending
  guidance before it becomes visible.
