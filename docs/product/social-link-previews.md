# Social Link Previews

## Product Contract

- Admin copy and export actions produce one short, absolute invitation URL for
  each guest.
- Newly copied and exported links use the compact `/g/<token>` route. Existing
  `/w`, `/t`, `/i`, and `/m` links remain valid.
- Selecting a guest in the admin starts a bounded same-origin prewarm request;
  copy actions repeat it without making clipboard success depend on warming.
- The shared URL is the real invitation page. It must not be a preview-only
  gateway that immediately redirects with JavaScript.
- Opening the shared URL preserves the personalized invitation experience. The
  edge-cached HTML contains a public invitation projection so `Cụm tên khách`
  is present in SSR content and OG metadata. Phone, email, admin notes, and RSVP
  responses are excluded; the invitation API refreshes dynamic state after
  hydration.
- The first HTML response exposes a complete Open Graph card with a title,
  description, canonical page URL, locale, and an absolute HTTPS JPEG image.
- Preview media uses a versioned physical filename so a new release creates a
  new crawler object without adding a query string to the guest-facing URL.
- `robots.txt` explicitly allows social preview crawlers and ordinary visitors.
- Essential title, description, canonical, and primary image metadata appears
  within the first 4 KiB of HTML.

## Platform Expectations

- Messenger, Facebook, Zalo, and other chat crawlers receive HTTP 200 HTML with
  Open Graph metadata in `<head>`.
- Human visitors and social crawlers receive the same invitation content at the
  shared URL; no user-agent-specific cloaking is used.
- The guest-facing path stays compact and contains no cache-busting query.
- Shared HTML performs at most one invitee query on cold generation and no RSVP
  query. The token-keyed public projection and rendered route are cacheable at
  the edge for 24 hours and invalidated after admin mutations.
- OG title and description use the invitee's exact `Cụm tên khách`; they must
  never silently fall back to generic `Quý khách` for a valid token.
- Invalid shared tokens return the normal status-correct not-found response.

## Validation

- Local production build and focused preview checks pass.
- A production request with Meta crawler user agents receives the expected OG
  fields, fresh physical image URL, and no redirect script or meta refresh.
- A normal production request receives the actual invitation markup at the same
  URL.
- Production requests expose a public edge-cache policy. Normal warm timings
  are recorded as evidence, not treated as a deterministic provider SLA.
- A 0–4095 byte HTML range contains the primary OG title and image.
- Focused checks preserve the copy-and-prewarm handoff without making clipboard
  success depend on the background request.
- Final rendering inside Messenger remains provider-controlled and must be
  checked with Meta Sharing Debugger or a fresh Messenger share after deploy.
