# Design

## Domain Model

Invitation tokens and invitee records are unchanged. A shared invitation URL is
an alternate public route to the same token-scoped invitation content.

## Application Flow

1. Admin copy and workbook export call `buildInviteUrl()` and emit the fresh
   compact `/g/<token>` namespace.
2. Selecting an invitee starts a bounded prewarm before copy; the copy action
   repeats the non-blocking keepalive fetch. Workbook export does not issue
   an unbounded batch of prewarm requests.
3. Cold generation performs one cached invitee query and renders the real
   invitation with exact `Cụm tên khách` in both OG and body content.
4. The route and a public invitee projection are cached for 24 hours by token.
   Contact details, admin notes, and RSVP responses are excluded.
5. `InviteTokenPage` refreshes token-scoped guest and RSVP state through
   `/api/invites/<token>` while the opening sequence is visible.
6. Admin mutations expire the token data plus `/g`, `/w`, and `/t` paths.
7. Invalid tokens return the normal not-found response during generation.

## Interface Contract

- `GET /g/<token>`: primary cacheable invitation with personalized OG metadata.
- `GET /w/<token>` and `GET /t/<token>`: backward-compatible forms of the same
  personalized cached invitation.
- `GET /robots.txt`: plaintext allow policy.
- Open Graph image: absolute HTTPS URL with a versioned physical filename.

## Data Model

No schema, migration, retention, or data ownership changes.

## UI / Platform Impact

The visible invitation stays personalized during SSR and after hydration. The
opening sequence remains the cover while the API refreshes current RSVP state.
Below-fold images load lazily so their preload hints cannot displace social
metadata from the first 4 KiB of HTML.

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
4. Cache the full personalized SSR response including RSVP. Rejected because it
   would store dynamic attendance state. The accepted public projection keeps
   personalization but excludes RSVP and private contact/admin fields.
5. Persist only three metadata name fields while leaving body content generic.
   Rejected because OG and actual invitation content could disagree during a
   crawler trust check.
6. Prewarm every exported workbook URL. Rejected because large guest lists
   would create an unnecessary burst; individual copy actions cover the normal
   paste-into-chat workflow with bounded work.
