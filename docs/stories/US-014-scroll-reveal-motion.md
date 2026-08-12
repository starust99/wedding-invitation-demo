# US-014 Preserve Scroll-Reveal Motion Without Queues

## Status

implemented

## Lane

normal

## Product Contract

Invitation content below the hero keeps its soft fade, lift, scale, and blur
reveal, but fast scrolling must never make the guest wait for an offscreen
animation queue before the content at the stopping point becomes readable.
Gallery retains its current animation and layout.

## Relevant Product Docs

- `docs/product/invitation-loading-and-motion.md`

## Acceptance Criteria

- Reveal motion is visibly perceptible when a card enters the viewport.
- Child content starts within a very short stagger and has no long inherited
  delay from content above it.
- The timeline and dress-code regions reveal independently inside the long
  banquet card.
- Hash navigation to an event card still reveals that destination immediately.
- Gallery code, layout, and animation are unchanged.

## Design Notes

- Use transform, opacity, scale, and a short soft-focus transition only.
- Trigger after a small part of the element is actually visible rather than
  pre-running the animation below the viewport.
- Keep the existing exponential ease and final visual state.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Existing guest copy and post-ceremony RSVP checks remain green. |
| Integration | Next.js production build and TypeScript pass. |
| E2E | Mobile viewport fast-scroll lands on readable, revealed event content. |
| Platform | Mobile viewport and browser smoke test; Gallery diff remains empty. |
| Release | Not requested in this turn. |

## Harness Delta

The scroll-reveal contract is now explicit in the loading and motion product
document so later performance work does not accidentally remove the visual
effect or restore sequential reveal queues.

## Evidence

- `npm run build`
- `npm run check:guest-copy`
- `npm run check:post-ceremony-rsvp`
- Local 390×844 browser check with fast scrolling through the event cards.
