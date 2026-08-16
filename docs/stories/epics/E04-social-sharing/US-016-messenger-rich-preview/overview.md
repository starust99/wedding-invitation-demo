# Overview

## Original Behavior

The short `/t/<token>` link returns a tiny Open Graph document and immediately
runs `window.location.replace()` to open `/i/<token>`. Zalo reads the metadata,
but Messenger reduces the link to the bare domain even though Meta-like curl
requests receive HTTP 200 and a valid JPEG.

## Target Behavior

Newly copied links use `/g/<token>`, a fresh short URL that renders the real
personalized invitation and exact `Cụm tên khách` Open Graph metadata at the
same address. Old `/w/<token>` and `/t/<token>` links adopt the corrected
content-page behavior. Token-scoped ISR, one-query data caching, early admin
prewarming, first-4-KiB metadata, a physical image path, and explicit
`robots.txt` rules keep the page fast and crawler-compatible.

## Affected Users

- Guests receiving invitations through Messenger, Facebook, Zalo, or another
  chat application.
- The couple copying or exporting guest invitation links from admin tools.

## Affected Product Docs

- `docs/product/social-link-previews.md`

## Non-Goals

- Guaranteeing the visual layout chosen by Messenger after Meta accepts the
  Open Graph object.
- Changing RSVP business behavior or invitation token values.
- Adding an external link-shortening provider.
