# Overview

## Current Behavior

The short `/t/<token>` link returns a tiny Open Graph document and immediately
runs `window.location.replace()` to open `/i/<token>`. Zalo reads the metadata,
but Messenger reduces the link to the bare domain even though Meta-like curl
requests receive HTTP 200 and a valid JPEG.

## Target Behavior

Newly copied links use `/w/<token>`, a fresh short URL that renders the real
personalized invitation and its Open Graph metadata at the same address. Old
`/t/<token>` links adopt the same content-page behavior. The preview image uses
a new physical path and crawlers are explicitly allowed by `robots.txt`.

## Affected Users

- Guests receiving invitations through Messenger, Facebook, Zalo, or another
  chat application.
- The couple copying or exporting guest invitation links from admin tools.

## Affected Product Docs

- `docs/product/social-link-previews.md`

## Non-Goals

- Guaranteeing the visual layout chosen by Messenger after Meta accepts the
  Open Graph object.
- Changing invitation personalization, RSVP behavior, or invitation tokens.
- Adding an external link-shortening provider.
