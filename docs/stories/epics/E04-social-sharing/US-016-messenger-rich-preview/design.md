# Design

## Domain Model

Invitation tokens and invitee records are unchanged. A shared invitation URL is
an alternate public route to the same token-scoped invitation content.

## Application Flow

1. Admin copy/export calls `buildInviteUrl()` and receives `/w/<token>`.
2. A social crawler receives params-only generic wedding metadata and the real
   invitation client shell without waiting for Supabase.
3. The response is cached at the edge for 24 hours by token. It contains no
   guest or RSVP data.
4. A guest opens the same shell; `InviteTokenPage` hydrates the token-scoped
   invitee through `/api/invites/<token>` while the opening sequence is visible.
5. Invalid tokens receive the shell first, then switch to the existing invalid
   invitation gate when the API responds with 404.

## Interface Contract

- `GET /w/<token>`: cacheable actual-invitation shell and generic wedding OG
  metadata; token data hydrates client-side.
- `GET /t/<token>`: backward-compatible form of the same cacheable shell.
- `GET /robots.txt`: plaintext allow policy.
- Open Graph image: absolute HTTPS URL with a versioned physical filename.

## Data Model

No schema, migration, retention, or data ownership changes.

## UI / Platform Impact

The visible invitation is unchanged after hydration. First-time guest data now
loads in parallel with the opening sequence instead of blocking the HTML
response. Returning guests can still use the token-scoped local cache while the
API refreshes in the background.

## Observability

Focused checks report page status, metadata position, redirect absence, image
type/size, cache policy, response-header latency, and normal-page invitation
markers. Production curl evidence is recorded after deployment; final provider
rendering requires Meta or Messenger.

## Alternatives Considered

1. Keep the JavaScript redirect bridge and add more tags. Rejected because all
   required tags already validate and the bridge is the largest difference from
   content URLs such as YouTube.
2. Split responses by crawler user agent. Rejected because it creates cloaking
   and makes CDN caching and platform behavior harder to reason about.
3. Add query parameters for cache busting. Rejected because the user requires a
   clean short link and Meta caches the page object by shared URL.
4. Cache the full personalized SSR response. Rejected because the first crawl of
   each unique token would still pay two sequential Supabase round trips and the
   cache would contain guest and RSVP state.
5. Persist only invitee lookups with a short TTL. Kept as a future API/runtime
   optimization, but unnecessary for the thumbnail critical path once the
   shared shell no longer waits for the database.
