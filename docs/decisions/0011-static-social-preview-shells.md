# 0011 Static Social Preview Shells

Date: 2026-08-17

## Status

Accepted

## Context

Decision 0010 made the shared address a real invitation page and restored the
Messenger card. Production measurement then showed every `/w` and `/t` request
was an uncached serverless render. The request performed an invitee lookup and a
latest-RSVP lookup sequentially in the IAD function region. Cold TTFB reached
4.69 seconds and concurrent crawler requests commonly exceeded two seconds,
while the immutable thumbnail itself was already an edge hit near 0.2 seconds.

Each private token is normally crawled for the first time immediately after the
link is copied, so caching the personalized SSR result only after that slow
request does not improve the critical first preview.

## Decision

Make `/w/<token>` and backward-compatible `/t/<token>` params-only static
invitation shells with a 24-hour edge revalidation period. Their Open Graph
title and description are wedding-wide rather than guest-personalized, while
the canonical URL remains token-specific. Do not query Supabase or RSVP storage
before returning shared-page HTML.

The shell renders the same `InviteTokenPage` for every visitor. That component
hydrates guest and RSVP state through `/api/invites/<token>` while the opening
sequence is visible. Do not store guest or RSVP values in the edge-cached HTML,
branch by crawler user agent, or reintroduce a redirect gateway.

When an administrator copies an individual invitation URL, start a non-blocking
same-origin keepalive fetch after writing the clipboard. This warms the page
cache during the natural app-switch interval before Messenger receives the
paste. Clipboard success must not depend on the prewarm request, and workbook
exports must not fan out requests across the whole guest list.

## Alternatives Considered

1. Cache the full personalized server render for 60–300 seconds and invalidate
   it after writes.
2. Query only the guest display name for metadata and stream the remaining
   invitation behind Suspense.
3. Prewarm every private URL through Meta Graph API or Sharing Debugger.
4. Move the existing server render to a region closer to Supabase.

## Consequences

Positive:

- The first crawler response no longer waits for a serverless cold start or two
  cross-network database queries.
- Subsequent crawls are served from the edge, and the response is safe to cache
  because it contains no guest data.
- Individual copy actions normally absorb the one cold render before the link
  reaches Messenger.
- Human visitors and crawlers still receive the same real invitation shell at
  the shared URL.
- Guest and RSVP freshness remains controlled by the existing dynamic API.

Tradeoffs:

- The Messenger card title is wedding-wide instead of naming the recipient.
- First-time human personalization begins after JavaScript hydration, though it
  runs behind the existing opening sequence.
- Invalid shared tokens initially return an HTTP 200 shell and become the
  invalid-invitation gate after the API responds with 404. The canonical `/i`
  route retains server-side status-correct validation.
- Meta's own cache and rendering pipeline remains outside application control;
  origin latency can be reduced but not eliminated from provider processing.

## Follow-Up

- Add short-lived token-keyed API caching only if invitation hydration, rather
  than thumbnail crawl, remains perceptibly slow after this change.
- Use an authenticated Meta workflow only if automatic prewarming becomes a
  release requirement; never store a personal Facebook credential in the repo.
