# Design

## Domain Model

Invitation tokens and invitee records are unchanged. A shared invitation URL is
an alternate public route to the same token-scoped invitation content.

## Application Flow

1. Admin copy/export calls `buildInviteUrl()` and receives `/w/<token>`.
2. A social crawler requests that URL and receives server-rendered metadata plus
   invitation HTML.
3. A guest opens the same URL and receives the normal personalized invitation.
4. Invalid tokens continue through the existing `notFound()` path.

## Interface Contract

- `GET /w/<token>`: actual invitation page, HTTP 200 for a valid token.
- `GET /t/<token>`: backward-compatible actual invitation page.
- `GET /robots.txt`: plaintext allow policy.
- Open Graph image: absolute HTTPS URL with a versioned physical filename.

## Data Model

No schema, migration, retention, or data ownership changes.

## UI / Platform Impact

The visible invitation is unchanged. Only the public link path and social
preview delivery change. The new path is the same length as `/t` and has no
query string.

## Observability

Focused checks report page status, metadata position, redirect absence, image
type/size, and normal-page invitation markers. Production curl evidence is
recorded after deployment; final provider rendering requires Meta or Messenger.

## Alternatives Considered

1. Keep the JavaScript redirect bridge and add more tags. Rejected because all
   required tags already validate and the bridge is the largest difference from
   content URLs such as YouTube.
2. Split responses by crawler user agent. Rejected because it creates cloaking
   and makes CDN caching and platform behavior harder to reason about.
3. Add query parameters for cache busting. Rejected because the user requires a
   clean short link and Meta caches the page object by shared URL.
