# Invitation Loading and Motion

## Product Contract

The private invitation must never reveal an unfinished visual state.

- The preload gate covers the complete splash sequence, music, and the assets
  needed for the first visible hero frame.
- The approved dress-code master and all seven color illustrations share their
  exact versioned render URLs with the post-gate warmup lane. They are WebP
  files at 1086x1448, remain below 400 KiB each, and stay below 2.7 MiB as a
  complete set. Warmup starts before the 6.4-second envelope animation so color
  changes remain instant without making below-the-fold artwork block opening.
- The hero entrance choreography starts only after the splash exit has fully
  completed. A slow request or a prior storage write must not let any part of
  the names-logo reveal finish behind the splash.
- The hero preparing state remains fully hidden until React has committed an
  explicit animated or static reveal branch. Changing the root splash-skip
  marker must never expose a complete hero frame between those states.
- Portrait iPad and tablet devices use all 109 frames of the 9:16 mobile
  splash composition at 720×1280. Landscape tablets use all 109 frames of the
  16:9 desktop-iPad composition at 1280×720. Embedded Messenger/Zalo viewport
  widths must not override this orientation rule.
- Below-the-fold animated scenes must show a complete static poster immediately.
  Animation may replace the poster only after the browser can render it.
- Slow networks may delay motion, but must not create a blank timeline or cause
  partially loaded frame animation.
- The timeline remains the original 108-frame canvas sequence on Zalo,
  Messenger, and other embedded browsers.
- The timeline keeps its original wide scene geometry and card positions. Its
  poster and 108-frame canvas share a centered 9:16 media box inside that
  scene, with blur and color feathering attached to the media edge so the
  source matte cannot appear as a white border.
- Timeline bytes warm in the HTTP cache after the critical splash lane is
  complete. The frames decode after splash disposal, avoiding duplicate
  in-flight downloads and reducing peak memory pressure.
- Reduced-motion users receive a complete static composition.
- Below-the-fold content reveals only after it actually enters the viewport, so
  guests can see the established fade, lift, and soft-focus motion. Long cards
  must not serialize every child into a slow queue: when a guest scrolls
  quickly, the visible region starts revealing immediately. The banquet
  timeline and dress-code block own independent reveal triggers; Gallery keeps
  its existing behavior.

## Validation Expectations

- Verify a first visit with cache disabled and a throttled network.
- Verify all eight dress-code files start only after the critical splash lane,
  complete before the guest reaches the palette, use the same versioned URL
  when rendered, and do not trigger a second network transfer on color change.
- Verify the canonical `/g` invitation publishes byte-weighted preload timing
  for Chromium and WebKit without including a token, guest name, IP, or RSVP.
- Verify versioned critical assets receive a one-year immutable browser cache
  while unversioned assets retain the shorter fallback cache policy.
- Verify the splash-to-hero handoff visibly changes from preparing to animating.
- Sample the splash-to-hero handoff frame by frame and verify that no
  `hero-preparing` frame renders a reveal layer above zero opacity.
- Verify the timeline has a visible path before its animated media is ready.
- Verify portrait iPad Messenger requests all 109 mobile frames and landscape
  iPad Messenger requests all 109 desktop-iPad frames. Neither orientation may
  request the full 1920×1080 desktop set.
- Verify the original timeline scene stays wider than its centered 9:16 media
  box, and that the poster, canvas, and blurred feather share the media bounds.
- Verify the timeline requests all 108 frames, never substitutes MP4/WebM, and
  leaves the poster visible until every frame is decoded.
- Check iPad, mobile, and desktop viewports.
- Fast-scroll through the invitation and verify the visible card or subsection
  begins revealing without waiting for offscreen content above it. Verify the
  motion remains perceptible and Gallery is unchanged.
