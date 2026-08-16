# Validation

## Proof Strategy

Prove the route and asset contract locally and on production, while clearly
separating origin correctness from Messenger's provider-controlled rendering.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | URL builder emits `/w`; params-only metadata avoids Supabase; every admin copy path triggers non-blocking prewarming. |
| Integration | Meta user agents and a normal browser receive cacheable HTTP 200 at `/w`; no JS/meta redirect exists. |
| E2E | Shared shell renders immediately, then hydrates the personalized invitation or invalid-token gate through the API. |
| Platform | Production checks cover `facebookexternalhit`, Facebot, Meta agents, normal browser, `robots.txt`, and image GET/HEAD/Range. |
| Performance | OG fields remain in the first response head and page/image requests complete within Meta's documented crawl window. |
| Logs/Audit | No durable business data changes; production request evidence is captured in the story. |

## Fixtures

- Existing valid token `di-nen-62908d0b` for production smoke checks.
- Public wedding preview JPEG copied to a new physical asset path.

## Commands

```text
npm run check:invite-preview
npx tsc --noEmit
npm run lint -- <scoped files>
npm run build
INVITE_PREVIEW_BASE_URL=https://nhatphuong.love npm run check:invite-preview
```

## Acceptance Evidence

- `npm run check:invite-preview`: six crawler/browser user agents received the
  real `/w` invitation with complete OG metadata in the first 7,187 bytes;
  `/t`, `robots.txt`, JPEG HEAD, and JPEG Range checks passed.
- `npx tsc --noEmit`, scoped ESLint (zero errors),
  `npm run check:post-ceremony-rsvp`, `npm run check:guest-copy`, and
  `npm run check:rsvp-resilience` passed.
- `npm run build` passed and emitted dynamic `/i`, `/t`, and `/w` routes plus a
  static `/robots.txt` route.
- Headless mobile Chromium loaded the `/w` fixture with HTTP 200, the expected
  personalized title, one real invitation root, zero horizontal overflow, and
  no console errors.
- GitHub `main` commit `43f2cfd` deployed successfully as Vercel production
  deployment `dpl_9zWG5bB2ApprvVERrZgDCM5fFiXj` and was aliased to
  `https://nhatphuong.love`.
- The production preview check passed for all six agents. The Meta responses
  carried OG metadata in the first 7,600 bytes; `/t`, `robots.txt`, and JPEG
  Range delivery also passed. Measured `/w` TTFB was 1.17–1.26 seconds for the
  two documented `facebookexternalhit` forms and 0.92 seconds for Android
  Chrome.
- The production image returned HTTP 200, `image/jpeg`, 215,832 bytes,
  `Accept-Ranges: bytes`, and a one-year immutable cache policy.
- Production mobile Chromium loaded the Dì Nên fixture with HTTP 200, the
  personalized title, one real invitation root, zero horizontal overflow, and
  no console errors.
- Messenger's rendered card still requires a fresh manual share or an
  authenticated Meta Sharing Debugger check; the provider does not expose that
  final renderer through an unauthenticated API.
- Performance follow-up baseline on 2026-08-17: old dynamic `/w` responses were
  always serverless cache misses. Cold TTFB reached 4.69 seconds, warm median was
  1.10 seconds, and eight concurrent requests had a median near 2.46 seconds.
  The image was already an edge hit; the two sequential Supabase queries were
  the bottleneck.
- Local optimized build emits `/w` and `/t` as static routes. An uncached token
  returned headers in 55 ms; subsequent responses were cache hits around 3 ms
  with `s-maxage=86400`. Six crawler/browser agents received OG metadata in the
  first 8,441 bytes and stayed below the 500 ms local response-header budget.
- Local mobile Chromium confirmed the static shell hydrates the existing family
  fixture successfully. A nonexistent token returned the generic shell, then
  switched to the existing “Không tìm thấy thiệp” gate after the API 404.
- First optimized production deployment `dpl_73GMfCe1Lzjixj4R9qtJdT65JWCm`
  reduced cold Meta TTFB from 4.69 seconds to 1.78 seconds. After edge
  propagation, five consecutive responses were `x-vercel-cache: HIT` with
  0.178–0.196 second TTFB and a positive `Age` header.
- The final local build keeps `/w` and `/t` static, passes the six-agent preview
  test with a 144 ms uncached-token maximum, and verifies all three admin copy
  surfaces call the non-blocking keepalive prewarm helper. Mobile Chromium
  received the shell in 539 ms, completed guest hydration by 662 ms, reported
  zero horizontal overflow and no console errors, and preserved the invalid
  gate behavior.
