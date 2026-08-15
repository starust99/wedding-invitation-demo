# Validation

## Proof Strategy

Prove the route and asset contract locally and on production, while clearly
separating origin correctness from Messenger's provider-controlled rendering.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | URL builder emits `/w`; metadata builder emits canonical shared URL and fresh image path. |
| Integration | Meta user agents and a normal browser receive HTTP 200 at `/w`; no JS/meta redirect exists. |
| E2E | Shared URL contains the real invitation page markers and remains personalized by token. |
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
- Production and Messenger rendering evidence remain pending deployment.
