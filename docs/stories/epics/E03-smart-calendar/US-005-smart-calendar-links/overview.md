# Overview

## Current Behavior

The RSVP confirmation UI creates an iCalendar `Blob` in the browser for Apple
devices, blocks known Apple in-app browsers with an alert, and opens Google
Calendar in a new window for other devices. Chat-app WebViews can block both
downloads and new windows.

## Target Behavior

Keep the confirmation UI visually unchanged. Both calendar buttons become
ordinary same-origin links backed by a server route that selects the Apple,
Android, desktop, or fallback response without asking the guest.

## Affected Users

- Guests opening private invitations in Messenger, Zalo, Viber, Telegram, and
  ordinary mobile or desktop browsers.

## Affected Product Docs

- `docs/product/calendar-actions.md`

## Non-Goals

- Silently writing to a device calendar without the operating system's consent.
- Collecting guest email addresses.
- Adding a third-party calendar-link provider.
- Redesigning the RSVP confirmation screen.

