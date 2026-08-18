# Design

## Domain Model

`RSVPResponse` gains `wishMessage` and `wishSentAt`. Both are nullable until a
wish is sent. The wish belongs to the RSVP response, which already belongs to
the private invitation token.

## Application Flow

1. A guest submits RSVP and sees the existing attendance-aware confirmation.
2. `Gửi lời chúc` opens the inline composer; `Gửi quà mừng` opens the QR.
   Opening either closes the other disclosure.
3. The composer posts a trimmed message to the private token wish route.
4. The server resolves an existing RSVP and updates only when no wish exists.
5. Success updates local state immediately and removes all edit/resend affordance.
6. Admin reads the new fields through the shared RSVP mapper and can filter,
   inspect, and export them.

## Interface Contract

- `POST /api/invites/<token>/wish`
- Request: `{ "message": "string, trimmed, 1–500 characters" }`
- Success: HTTP 201 with the mapped RSVP response.
- Invalid input: HTTP 400.
- Unknown invite or missing RSVP: HTTP 404.
- Existing/concurrent wish: HTTP 409.
- Missing server storage configuration: HTTP 503.

## Data Model

- `rsvp_responses.wish_message text null`
- `rsvp_responses.wish_sent_at timestamptz null`
- Check: both fields are null together, or the message length is 1–500 and a
  sent time exists.

## UI Contract

- The supplied QR is rendered with Next Image optimization disabled so the
  browser receives the original PNG bytes.
- White actions reuse the calendar/album pill treatment.
- The default gift action stays visually quiet and outside a pill.
- Composer and QR transitions use `AnimatePresence` and reduced-motion-safe
  variants; no modal or nested card is introduced.
- Errors remain inline and never discard the typed message.

## Observability

The API emits ordinary HTTP status contracts without logging wish content.
Admin surfaces the stored sent time; no QR click or payment analytics are
created.

## Alternatives Considered

See decision `0014-store-post-rsvp-wishes-with-rsvp-response.md`.
