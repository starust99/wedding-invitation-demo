# RSVP Keepsakes

## Product Contract

After a personalized guest completes RSVP, the confirmation card keeps the
existing `Đã xác nhận` heading, attendance-aware thank-you copy, and
`Chân thành cảm ơn!`. It does not repeat the mechanical sentence
`Lời hồi đáp đã được gửi thành công!`.

Every personalized guest can then use two optional actions, regardless of the
attendance choices they submitted:

- `Gửi lời chúc` is a white pill matching the existing calendar and album
  actions. It expands one inline composer inside the confirmation card.
- `Gửi quà mừng` is always visible below it as a quiet text action. It reveals
  the supplied QR image inline without requiring a wish first.

Only the open disclosure is shown. Opening the wish composer closes the gift
QR; opening the gift QR closes the wish composer. Motion is short, spatial,
and disabled when the guest requests reduced motion.

## Wish Rules

- A wish is optional, trimmed, and limited to 500 characters.
- The small `Gửi` action sits inside the lower-right of the composer, with a
  visible character counter and an accessible error/status message.
- A guest may submit exactly one wish for an RSVP response. The server rejects
  later writes; the public UI does not offer edit or resend controls.
- After success, `Gửi lời chúc` becomes the muted status `Đã gửi lời chúc`, and
  `Gửi quà mừng` adopts the same white-pill treatment as the calendar and
  album actions.
- Wishes are stored with the RSVP response and include their own sent time.
- Wishes use typed RSVP columns exclusively. RSVP edits do not write those
  columns, so an existing wish survives attendance or lodging changes.

## Gift QR Rules

- The QR asset supplied by the couple is rendered without pixel rewriting or
  generated replacements.
- The QR is hidden until the guest opens `Gửi quà mừng`, and its disclosure is
  independent of wish submission.
- No account-holder copy, bank metadata, transfer amount, or payment state is
  stored or displayed by the site. The banking application owns that context.

## Admin and Export

Admin can filter responses by whether a wish exists, see the wish and its sent
time in the response list and guest detail, and include both fields in CSV and
Excel RSVP exports. RSVP deletion keeps its current semantics and therefore
also removes the wish stored on that response.

## Data Minimization

The current RSVP does not collect or retain phone numbers, government IDs,
dietary notes, transport requests, room types, elderly-support requests, or
freeform RSVP notes. Lodging guests provide only a name, child/adult status, and
child age when applicable. Invitation-side planning notes remain private Admin
metadata and are not part of the RSVP response.

## Accessibility and Responsive Behavior

- All actions have at least a 44px touch target and visible focus styles.
- The textarea has a programmatic label, the send error is announced, and the
  success state uses a polite live region.
- The QR keeps a square, scannable presentation with sufficient quiet space.
- The confirmation card has no horizontal overflow at 320px and does not
  exceed a comfortable reading measure on larger viewports.
