# Design

## Domain Model

Event access is derived from two administrator-owned facts:

- `guestGroup`, normalized for accents, case, brackets, and punctuation.
- `postCeremonyPartyInvited`, imported from `Tham gia tiệc sau Hôn phối`.

Rules:

1. A normalized group beginning with `nha trai` is a Nhà Trai group.
2. Nhà Trai plus a false invite flag means banquet-only access.
3. Nhà Trai plus a true invite flag means ceremony, direct intimate party, and banquet access.
4. Other groups retain their current ceremony and intimate-party behavior.
5. Lodging remains derived independently from the Họ nội/Họ ngoại group and banquet acceptance.

## Application Flow

The token invite record feeds a shared pure access resolver. The invitation and
RSVP use its result to render only applicable events. RSVP hydration clears
historical or draft ceremony answers when the policy makes them inapplicable.
The token API reloads the invitee and applies the same policy before persistence.

## Interface Contract

No request or response fields are added. For a banquet-only Nhà Trai invite:

- `attendingCeremony` is normalized to `false`.
- `attendingPostCeremonyParty` is normalized to `undefined`/database null.
- `attending` is derived only from allowed events.
- lodging fields remain accepted only under the existing family and banquet rules.

The tokenized `thanh-le` calendar route returns 404 when the invite policy does
not permit ceremony access. Other calendar events are unchanged.

## Data Model

No schema change. Existing invite and RSVP columns remain the source of truth.
Historical incompatible answers are hidden and normalized the next time the
guest edits RSVP; Admin ceremony totals will use effective policy rather than
trusting an incompatible historical ceremony value.

## UI / Platform Impact

The ceremony paper card is omitted entirely for banquet-only Nhà Trai guests,
so the banquet card and RSVP response slot close the gap naturally. RSVP omits
the ceremony question, ceremony validation, fallback intimate step, ceremony
review row, ceremony calendar action, ceremony album wording, and ceremony
information jump. The lodging block remains nested under an accepted banquet.

No new visual language or asset is introduced. Existing motion and hand cues
remain attached to the applicable continuation or review action.

## Observability

Focused policy tests cover the group/flag matrix and API normalization.
Existing RSVP, copy, build, and browser checks provide regression evidence.

## Alternatives Considered

1. Hide only the invitation card. Rejected because RSVP and direct calendar links would still disclose ceremony information.
2. List each current Nhà Trai group. Rejected because future `[Nhà Trai]` groups would bypass the rule.
3. Add a ceremony-access workbook column. Rejected because the accepted post-ceremony flag already expresses the intended access scope for Nhà Trai.
