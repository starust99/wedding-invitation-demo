# Social Link Previews

## Product Contract

- Admin copy and export actions produce one short, absolute invitation URL for
  each guest.
- The shared URL is the real invitation page. It must not be a preview-only
  gateway that immediately redirects with JavaScript.
- Opening the shared URL preserves the same personalized invitation experience
  and invalid-token behavior as the canonical `/i/<token>` route.
- The first HTML response exposes a complete Open Graph card with a title,
  description, canonical page URL, locale, and an absolute HTTPS JPEG image.
- Preview media uses a versioned physical filename so a new release creates a
  new crawler object without adding a query string to the guest-facing URL.
- `robots.txt` explicitly allows social preview crawlers and ordinary visitors.
- Existing `/i`, `/m`, and `/t` invitation URLs remain valid.

## Platform Expectations

- Messenger, Facebook, Zalo, and other chat crawlers receive HTTP 200 HTML with
  Open Graph metadata in `<head>`.
- Human visitors and social crawlers receive the same invitation content at the
  shared URL; no user-agent-specific cloaking is used.
- The guest-facing path stays compact and contains no cache-busting query.

## Validation

- Local production build and focused preview checks pass.
- A production request with Meta crawler user agents receives the expected OG
  fields, fresh physical image URL, and no redirect script or meta refresh.
- A normal production request receives the actual invitation markup at the same
  URL.
- Final rendering inside Messenger remains provider-controlled and must be
  checked with Meta Sharing Debugger or a fresh Messenger share after deploy.
