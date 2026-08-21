# Social Link Previews

## Product Contract

- `/g/<token>` is the canonical published invitation URL.
- `/g/<token>` is also the only link a sender or guest must choose. Admin must
  not expose platform-specific alternatives such as a separate Messenger Web
  URL, query-string mode, or second copy button.
- Every Admin publishing surface uses that route: per-guest copy, recently
  imported-link export, Nhà Trai and Nhà Gái link exports, full-list workbook
  export, and CSV serialization.
- Existing `/w`, `/t`, `/i`, and `/m` links remain valid only for backward
  compatibility; Admin never emits them as newly published links.
- Existing `/g` links are generated during the production build. Creating,
  editing, regenerating, or importing guests prepares the affected links, and
  workbook export verifies every included link before releasing the file.
- Selecting a guest in the admin starts a bounded same-origin prewarm request;
  copy actions repeat it without making clipboard success depend on warming.
- The shared URL is the real invitation page. It must not be a preview-only
  gateway that immediately redirects with JavaScript.
- Opening a canonical `/g/<token>` link shows the same full invitation intro as
  the original guest route. A persistent “seen” record from an older URL must
  not suppress the intro in a new browser session; explicit return/skip links
  and a repeat open within the same session may still bypass it.
- Opening the shared URL preserves the personalized invitation experience. The
  edge-cached HTML contains a public invitation projection so `Cụm tên khách`
  is present in SSR content and OG metadata. Admin notes and RSVP responses are
  excluded; obsolete invitation contact fields are not stored. The invitation
  API refreshes dynamic state after hydration.
- The first HTML response exposes a complete Open Graph card with a title,
  description, canonical page URL, locale, and an absolute HTTPS JPEG image.
- Preview media is a baseline 1200×630 JPEG below 300 KiB and uses a versioned
  physical filename, so a new release creates a new crawler object without
  adding a query string to the guest-facing URL.
- `robots.txt` explicitly allows social preview crawlers and ordinary visitors.
- The apex domain returns a public 200 page with OG metadata. The `www` host
  has valid TLS and permanently consolidates onto the canonical apex host.
- A legacy `image_src` link points to the same preview image for older unfurl
  implementations that do not fully implement Open Graph.
- Essential title, description, canonical, and primary image metadata appears
  within the first 4 KiB of HTML.

## Platform Expectations

- Messenger, Facebook, Zalo, WhatsApp, Slack, Discord, Telegram, X/Twitter,
  LinkedIn, Apple Messages, Viber, LINE, KakaoTalk, Pinterest, and ordinary
  browsers receive HTTP 200 HTML with Open Graph metadata in `<head>`.
- Human visitors and social crawlers receive the same invitation content at the
  shared URL; no user-agent-specific cloaking is used.
- The guest-facing path stays compact and contains no cache-busting query.
- Shared HTML performs at most one invitee query on cold generation and no RSVP
  query. Existing tokens are generated at build time. The token-keyed public
  projection and rendered route are cacheable at the edge for 24 hours and
  invalidated, regenerated, and verified after admin mutations.
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
  success depend on the background request. Export does depend on successful
  publish-readiness verification so a cold or invalid link is not distributed
  in a workbook.
- Final rendering inside Messenger remains provider-controlled and must be
  checked with Meta Sharing Debugger or a fresh Messenger share after deploy.
