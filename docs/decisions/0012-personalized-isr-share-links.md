# 0012 Personalized ISR Share Links

Date: 2026-08-17

## Status

Accepted

## Context

Decision 0011 removed every database read from shared-page HTML and replaced
the recipient with generic `Quý khách` metadata. Production screenshots then
showed two regressions: Zalo no longer displayed the guest's `Cụm tên khách`,
and Messenger again reduced some previously tested `/t` URLs to a bare-domain
card. Production inspection also found that automatic preload markup pushed
`og:image` beyond the first 4 KiB of HTML and that warming only after the copy
gesture could race a crawler arriving immediately after paste.

The product requires a clean short URL, personalized recipient wording, one
real invitation response for humans and crawlers, and fast first-share
delivery. Contact details, admin notes, and RSVP responses must not be stored in
the shared-page cache.

## Decision

The fresh compact `/g/<token>` namespace is the canonical published invitation
URL. Every Admin copy and export surface emits `/g`; existing `/w/<token>` and
`/t/<token>` links render the same corrected content only for backward
compatibility.

Each shared route performs one token-keyed invitee lookup on first generation,
then caches a public invitation projection and the rendered page for 24 hours.
The projection contains the guest naming and invitation fields required to
render the real personalized invitation, but excludes phone, email, notes, and
RSVP records. `Cụm tên khách` (`guestName`) is the first-choice value for the OG
title and description. The dynamic invitation API refreshes RSVP and current
guest state after hydration.

Admin create, update, delete, and token-regeneration mutations expire both the
token data cache and `/g`, `/w`, and `/t` route caches. Selecting a guest in the
admin starts a bounded prewarm request before the copy gesture; copying repeats
the non-blocking warm request.

Keep social metadata within the first 4 KiB by moving the synchronous splash
bootstrap to the start of `<body>`, disabling unnecessary font/image preloads,
and lazy-loading below-fold stationery assets. Extend Next's complete
HTML-limited-bot regex with current Meta and Zalo agent names so generated
metadata remains in `<head>` without serving different page content by user
agent.

## Alternatives Considered

1. Keep generic metadata and ask the user to accept `Quý khách`. Rejected
   because it breaks the explicit guest-personalization contract.
2. Return to uncached `/i/<token>` server rendering. Rejected because it pays
   the invitee and RSVP queries on every crawler request and had cold TTFB up to
   4.69 seconds.
3. Keep `/t` as the newly copied URL. Rejected because exact `/t` objects used
   during failed experiments can remain negatively cached by Meta for hours.
4. Append a cache-busting query parameter. Rejected because the user requires a
   short clean URL and providers may canonicalize it back to the old object.
5. Prewarm every link in an exported workbook. Rejected because an unbounded
   fan-out can overload the app and database; selected/copy warming stays
   bounded to the link being prepared.

## Consequences

Positive:

- Messenger and Zalo receive the exact personalized guest name in initial OG
  metadata and the same real invitation content.
- A fresh `/g` provider object escapes stale `/t` and `/w` negative caches
  without lengthening the guest-facing link.
- Warm crawler requests remain edge hits, while the cold path is reduced from
  two sequential queries to one invitee query.
- The primary OG image is discoverable inside the first 4 KiB response range.
- Invalid tokens return a status-correct not-found response instead of an
  unlimited generic soft-404 card.

Tradeoffs:

- The guest's invitation name and public invitation fields are cached by the
  hosting edge and exposed to the social platform that crawls the private link.
  This is required for a personalized card; contact/admin/RSVP data is excluded.
- The first request for a never-generated token can still pay one database
  round trip. Admin selection/copy warming normally absorbs it before paste.
- Meta and Zalo control their own cache and final card renderer. A fresh URL
  greatly reduces stale-object risk but cannot guarantee provider UI behavior.

## Follow-Up

- Use each platform's authenticated sharing debugger only when a fresh `/g`
  object fails despite the production origin checks.
- Add an explicit bounded batch-warm workflow later only if links are routinely
  sent straight from large workbook exports without first opening them in the
  admin.
