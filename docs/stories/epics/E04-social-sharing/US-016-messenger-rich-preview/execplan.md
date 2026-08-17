# Exec Plan

## Goal

Remove the architectural difference between the shared URL and a normal
content URL so Messenger can crawl a fresh, trustworthy invitation object while
the link stays short for guests.

## Scope

In scope:

- Replace `/t`'s preview-only route handler with a real invitation page.
- Add a fresh `/g` shared path and switch generated links to it while keeping
  `/w` and `/t` compatible.
- Restore exact personalized guest metadata using one cached invitee query,
  without caching contact, admin-note, or RSVP data.
- Invalidate cached identities and routes after admin mutations.
- Put essential OG metadata inside the first 4 KiB and prewarm selected links
  before the copy gesture.
- Publish a fresh physical JPEG URL and explicit `robots.txt` policy.
- Strengthen automated preview checks and verify production after deployment.

Out of scope:

- Meta account configuration, domain reputation appeals, or modifying already
  sent Messenger messages.
- DNS and TLS changes for the unused `www` hostname.

## Risk Classification

Risk flags:

- External systems.
- Cross-platform behavior.
- Public URL contract.
- Existing invitation behavior.
- Weak provider-level proof without an authenticated Meta debugger.

Hard gates:

- External provider behavior.

## Work Phases

1. Confirm origin, image, crawler, DNS, and TLS behavior.
2. Define a content-page route with no preview bridge or crawler cloaking.
3. Add token-scoped personalization cache and mutation invalidation.
4. Reduce head preloads and add deterministic Meta/Zalo/range checks.
5. Build, deploy, and smoke-test the fresh URL and image.
6. Record evidence and remaining provider-controlled uncertainty.
7. Capture the actual Messenger Web preview request signature through a
   temporary non-guest probe before introducing any client-specific routing;
   remove the probe immediately after the signature is recorded.
8. Keep one universal guest-facing URL only: `/g/<token>`. A second Web-only
   route or platform selector is explicitly rejected because guests must never
   choose between invitation links.

## Stop Conditions

Pause for human confirmation if:

- Personalized invitation behavior would need to change.
- A Meta login or access token is required to continue provider-side testing.
- A DNS or third-party account mutation becomes necessary.
