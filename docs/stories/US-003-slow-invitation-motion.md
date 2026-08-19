# US-003 Guarantee Animated Hero Handoff and Non-Blank Timeline

## Status

implemented

## Lane

normal

## Product Contract

Guests on slow iPad and embedded social browsers must see a complete, graceful
invitation: the hero animates after the splash, and the timeline path never
appears as an empty delayed canvas.

## Relevant Product Docs

- `docs/product/invitation-loading-and-motion.md`

## Acceptance Criteria

- A first private-invite visit keeps hero elements in their preparing state
  until the splash exit has fully completed.
- The `introFinished` signal selects the full hero animation branch even when
  splash-seen storage has already been written.
- A root `splash-skipped` class change cannot expose the logo, photo, ornaments,
  or copy while the hero still has the `hero-preparing` state.
- The timeline displays a static path poster before animated media can play.
- Portrait iPad uses all 109 mobile frames at 720×1280. Landscape iPad uses all
  109 desktop-iPad frames at 1280×720, including inside embedded WebViews whose
  reported content width falls below conventional tablet breakpoints.
- Timeline animation keeps all 108 original frames, with the recompressed set
  below 9 MiB instead of roughly 16 MiB.
- The timeline retains its original wide scene and card positions. A centered
  9:16 media box aligns frame 001, the canvas, and the blurred feather without
  exposing a rectangular source edge.
- Missing or incomplete frames leave the poster visible rather than starting a
  partial, janky loop.
- The implementation respects reduced motion and pauses offscreen playback.

## Design Notes

- Commands: no data mutation.
- Queries: no API changes.
- API: unchanged.
- Tables: unchanged.
- Domain rules: “ready” means visually renderable, not merely requested.
- UI surfaces: private/public invitation hero and event timeline.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Automated assertions for source weight, poster fallback, and hero state ordering |
| Integration | Splash exit event drives the hero animation branch |
| E2E | Throttled private invitation shows animated hero and a non-blank timeline |
| Platform | iPad desktop splash, phone splash, Zalo and Messenger frame canvases |
| Release | Production link verified after Vercel deployment |

## Harness Delta

Add a reusable slow-invitation experience check so future animation/media
changes cannot silently restore blank canvases or early hero animation.

## Evidence

- `npm run check:slow-invite-experience` passed against a local production
  build at the iPad 820×1180 viewport with a Messenger user agent.
- Local regression verifies iPad requests exactly 109 tablet-sized desktop
  splash frames and no mobile or full desktop frame.
- The hero logo remains prepared throughout splash playback; its animation is
  running only after the splash node detaches.
- Zalo regression requests exactly 108 timeline frames, no timeline video, and
  compares two canvas samples to prove the frame animation advances.
- `npm run check:rsvp-resilience` passed against production without submitting
  an RSVP.
- `npx tsc --noEmit`, affected-file ESLint, `git diff --check`, and
  `npm run build` passed.
- Recompression preserved frame count and dimensions while reducing desktop
  splash from 22 MiB to 7.8 MiB, mobile splash from 14 MiB to 5.6 MiB, and
  timeline from 16 MiB to 7.6 MiB.
- The iPad desktop-artwork set is 4.3 MiB at 1280×720, reducing its decoded
  footprint from roughly 900 MiB to roughly 400 MiB.
- Timeline bytes warm separately after the critical splash lane, frames decode
  after splash disposal, and the static path remains visible until all 108
  frames are ready.
- The canonical `/g` preload gate now contains only the exact splash sequence,
  music, closed poster, and first-visible hero assets. Dress-code and timeline
  bytes retain their original files but warm after the gate while the envelope
  animation is running.
- Preload progress is weighted by the estimated transferred bytes, including
  streaming audio progress, instead of treating every file as the same size.
- Versioned critical asset URLs use an immutable one-year cache, and sampled
  preload timing is logged with coarse country/edge context but no guest data.
- The private-invite cache synchronization no longer re-enters its own storage
  listener; the regression check caps invite lookups and observed three
  requests across two full browser contexts.
- Both regular and throttled production checks passed on the exact Tuấn invite
  at 820×1180. The throttled run enforced 3 Mbps download bandwidth and 150 ms
  latency across fresh Messenger and Zalo contexts.
- RSVP resilience passed on production without submitting a response.
- Corrective deployment:
  `wedding-invitation-demo-7vi33rzta-nhattran1596-4015s-projects.vercel.app`,
  aliased to `nhatphuong.love`.
- Hero handoff regression sampled 450 local iPad Messenger animation frames
  with zero exposed `hero-preparing` frames.
- Production deployment
  `wedding-invitation-demo-jedbsune6-nhattran1596-4015s-projects.vercel.app`
  is aliased to `nhatphuong.love`.
- Both normal production and 3 Mbps/150 ms production checks passed on the
  Tuấn invite. The checks assert the hero remains hidden until
  `hero-animating`, iPad retains all 109 desktop-artwork splash frames, and
  Zalo retains the complete 108-frame timeline.
- The previous 744×992 desktop-iPad expectation was superseded after visual
  review: portrait iPad now intentionally selects the mobile composition,
  while 992×744 landscape selects desktop-iPad.
- Local regression measured the unchanged outer timeline scene at 598px wide
  around a centered 331×589px media box (ratio 0.56249), with frame 001,
  canvas, and a 7px edge blur sharing identical bounds.
- Normal and 3 Mbps production checks passed on the Tuấn invite: portrait iPad
  requested all 109 mobile frames, landscape iPad requested all 109
  desktop-iPad frames, hero handoff remained guarded, and Zalo advanced the
  complete 108-frame feathered timeline.
- Corrective deployment
  `wedding-invitation-demo-59mq7q7a0-nhattran1596-4015s-projects.vercel.app`
  is aliased to `nhatphuong.love`.
