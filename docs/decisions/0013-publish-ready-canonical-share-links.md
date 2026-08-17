# 0013 Publish-Ready Canonical Share Links

Date: 2026-08-17

## Status

Accepted

## Context

The direct-content `/w` implementation proved that Messenger desktop can show
the personalized invitation card. Later `/g` responses became faster and put
Open Graph fields earlier in the document, yet the same token could still show
a rich card on Android and a bare-domain object on desktop. Byte-for-byte
production comparison showed that `/w` and `/g` differed only by their URL and
canonical metadata. The remaining difference was provider cache history and a
race in which the crawler could arrive while a newly invalidated ISR page was
still being generated.

Changing namespaces repeatedly creates new cache objects but does not produce
a stable publishing workflow. Warming only after the clipboard gesture also
cannot protect links copied from an exported workbook.

## Decision

Keep `/g/<token>` as the permanent canonical guest URL. Do not rotate the route
or append query-string cache busters.

Treat a link as published only after it is ready:

1. Generate all existing `/g` token routes during every production build.
2. After an Admin create, edit, token regeneration, or Excel import, request the
   affected `/g` pages and verify that the response contains both the real
   invitation marker and primary Open Graph image metadata.
3. Before exporting a link workbook, prepare all included links with a bounded
   four-worker queue. Abort the export if any link remains unavailable after
   three short attempts.
4. Keep copy synchronous for browser clipboard permission, while selection and
   copy repeat background preparation for the individual link.

Use a new physical baseline JPEG at exactly 1200×630 pixels, below 300 KiB,
with immutable one-year caching. Retain personalized `Cụm tên khách`, the real
invitation document, the full intro, status-correct invalid tokens, and the
first-4-KiB metadata budget. Expand the HTML-limited crawler set to cover the
major messaging and social unfurl agents without returning different content
by user agent.

The apex host must remain a public 200 page instead of redirecting anonymous
visitors to Admin. Attach the `www` host to the same deployment with valid TLS,
permanently redirect it to the apex host, and include a legacy `image_src`
fallback so older unfurl clients converge on the same physical image object.

## Alternatives Considered

1. Create another short namespace whenever a provider caches a bad object.
   Rejected because it fragments canonical URLs and only postpones the same
   first-crawl race.
2. Append a version query to every guest URL. Rejected because guest links must
   remain compact and some providers key caches by canonical URL.
3. Serve a tiny crawler-only gateway. Rejected because Messenger can suppress
   redirect or cloaking-like pages, and guests must open the real invitation.
4. Keep warming only after copy. Rejected because it races an immediate paste
   and does nothing for workbook links.
5. Make metadata generic and fully static. Rejected because the card must show
   the exact guest-name cluster rather than `Quý khách`.

## Consequences

Positive:

- Existing links are warm before the first guest share after deployment.
- Newly created or edited links are verified before Admin reports them ready.
- Workbook links cannot leave Admin while their invitation page is cold or
  invalid.
- The image matches the broadest documented preview-card convention and is
  roughly one tenth the previous transfer size.
- `/g` stays stable, personalized, direct-rendered, and intro-safe.
- The domain root and `www` alias no longer emit crawler-hostile authentication
  redirects or invalid TLS responses.

Tradeoffs:

- Builds perform one token-list query and generate one `/g` document per
  existing invitee.
- Large exports wait for bounded preparation before download.
- Messaging providers still own their page-object caches and final UI. Origin
  readiness removes application races but cannot erase an already negative
  provider cache without that provider's scrape/debugger workflow.

## Verification

- Production build lists pre-rendered `/g` paths.
- The focused preview check covers Meta, Zalo, WhatsApp, Slack, Discord,
  Telegram, Twitter, LinkedIn, Apple, Viber, LINE, and a normal mobile browser.
- The check requires personalized metadata in `<head>`, `og:image` inside the
  first 4096 bytes, immutable cache headers, byte-range delivery, and a
  baseline 1200×630 JPEG.
- The published-intro browser regression remains green on `/g`.
