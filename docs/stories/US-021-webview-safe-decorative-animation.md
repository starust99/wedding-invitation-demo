# US-021 WebView-safe decorative animation

## Status

completed

## Lane

normal

## Product Contract

The wedding rings and timeline path remain visible and gently animated without creating HTML video players that Zalo, Messenger, or other in-app WebViews can take over.

## Relevant Product Docs

- `PRODUCT.md`

## Acceptance Criteria

- The rings between the couple's names are rendered without a `video` element.
- The timeline path is rendered without a `video` element and remains decorative.
- Both effects respect the user's reduced-motion preference.
- Existing splash and configurable full-bleed media behavior remains out of scope.

## Design Notes

- UI surfaces: public event details and standalone timeline section.
- The rings use inline SVG and CSS transforms; the timeline uses responsive static assets and a subtle CSS transform.
- The old generic video components remain available because other, non-decorative surfaces still use them.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Static source assertion that both affected surfaces contain no video-player component. |
| Integration | ESLint and production build. |
| E2E | Browser screenshot of the opened invitation. |
| Platform | Physical Zalo WebView check remains a release/device responsibility. |
| Release | Confirm no native media controls appear around the rings or timeline path. |

## Harness Delta

The required Harness binary is absent from this checkout, so durable intake, story, and trace records could not be written.

## Evidence

- `npm run lint`
- `npm run build`
- `rg -n "CanvasVideo|SeamlessVideoPlayer|<video" src/components/wedding/EventDetailsContent.tsx src/components/TimelineSection.tsx`
