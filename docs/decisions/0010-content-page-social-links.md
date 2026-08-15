# 0010 Content-Page Social Links

Date: 2026-08-16

## Status

Accepted

## Context

Messenger reduced valid invitation links to a bare-domain card even though its
documented crawler user agents received HTTP 200, complete Open Graph metadata,
and a valid JPEG within the required time. Zalo rendered the same metadata. The
short URL was a preview-only HTML document that immediately used JavaScript to
replace itself with the real `/i/<token>` invitation. That bridge differed from
normal content URLs and left the page and image objects stuck behind Meta's
provider cache.

## Decision

Use a real invitation content page as the shared URL. Newly generated links use
the compact `/w/<token>` route, while `/t/<token>` remains backward-compatible
and renders the same invitation. Both human visitors and social crawlers receive
the same personalized content and metadata; do not branch by user agent or use
JavaScript/meta-refresh redirect gateways.

Give materially changed preview media a new physical HTTPS filename instead of
a cache-busting query. Keep the guest-facing URL free of query parameters and
publish an explicit crawler allow policy at `/robots.txt`.

## Alternatives Considered

1. Keep the tiny preview bridge and add more metadata tags.
2. Serve static metadata to crawler user agents and redirect human user agents.
3. Keep `/t/<token>` and append a cache-busting query to every copied link.
4. Add a third-party URL shortener or preview service.

## Consequences

Positive:

- The shared address behaves like a normal content URL instead of a redirect
  gateway.
- Meta receives personalized OG metadata and the real invitation in one HTTP
  response.
- The new page and image paths create fresh provider cache objects while the
  link stays as short as before.
- Existing `/i`, `/m`, and `/t` links continue to work.

Tradeoffs:

- The crawler response is larger than the former 2 KB bridge and requires the
  invitee lookup; production Meta TTFB is currently about 1.2 seconds.
- Meta controls whether, when, and how Messenger displays the final card. Origin
  correctness cannot guarantee a YouTube-identical layout or repair messages
  already sent.
- A future card change must use a fresh physical media filename and may require
  a new shared page path or an authenticated Sharing Debugger rescrape.

## Follow-Up

- Use Meta Sharing Debugger with an authenticated Facebook session if a fresh
  `/w` share is still suppressed, and inspect the provider's reported block or
  cache reason before changing markup again.
- Repair or remove the unused `www.nhatphuong.love` hostname separately; it is
  not part of the apex invitation URL contract.
