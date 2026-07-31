# 0009 Server-Routed Calendar Actions

Date: 2026-07-31

## Status

Accepted

## Context

Calendar actions run inside ordinary browsers and chat-app WebViews controlled
by Messenger, Zalo, Viber, and Telegram. Client-generated downloads and popup
windows are not dependable across those hosts, while adding provider choices
would make the guest experience more administrative.

## Decision

Keep the existing two-button interface and route both actions through a
same-origin server endpoint. Android receives a same-tab Google Calendar
redirect. Apple, desktop, and unknown clients receive a server-generated
iCalendar file. Do not store guest identity or calendar credentials.

## Alternatives Considered

1. Keep browser-generated iCalendar blobs and popup windows.
2. Show a provider-selection dialog before every calendar action.
3. Introduce a third-party add-to-calendar service.
4. Collect email addresses and send calendar invitations.

## Consequences

Positive:

- The visible confirmation design remains unchanged.
- The website needs only one guest click before the operating system or provider
  presents its required confirmation.
- Calendar generation has one testable source of truth.
- No third-party script or new guest data is introduced.

Tradeoffs:

- The final `Add` or `Save` confirmation cannot be bypassed.
- A chat app that refuses all calendar downloads can still prevent the Apple
  handoff; the website cannot override the host app's native WebView policy.
- Android guests may need to authenticate with Google Calendar.

## Follow-Up

- Revisit an optional email-delivery fallback only if production device testing
  shows a material Apple in-app failure rate.

