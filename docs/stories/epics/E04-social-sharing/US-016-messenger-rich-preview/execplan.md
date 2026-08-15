# Exec Plan

## Goal

Remove the architectural difference between the shared URL and a normal
content URL so Messenger can crawl a fresh, trustworthy invitation object while
the link stays short for guests.

## Scope

In scope:

- Replace `/t`'s preview-only route handler with a real invitation page.
- Add a fresh `/w` shared path and switch generated links to it.
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
3. Add deterministic source and production checks.
4. Build, deploy, and smoke-test the fresh URL and image.
5. Record evidence and remaining Meta-controlled uncertainty.

## Stop Conditions

Pause for human confirmation if:

- Personalized invitation behavior would need to change.
- A Meta login or access token is required to continue provider-side testing.
- A DNS or third-party account mutation becomes necessary.
