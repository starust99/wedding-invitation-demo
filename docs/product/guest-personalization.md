# Guest Personalization

## Source Fields

The current Excel template defines:

- `Cụm danh xưng`: the short form used to address the invited party in a sentence.
- `Tên khách`: the manually entered proper name or paired names.
- `Cụm tên khách`: `Cụm danh xưng` plus `Tên khách`, preserving the salutation casing and the entered proper-name casing.

Example:

```text
Cụm danh xưng: Gia đình anh chị
Tên khách: Tuấn
Cụm tên khách: Gia đình anh chị Tuấn
```

## Rendering Contract

The public `/` route has no invite identity and keeps the generic `Quý khách`
copy.

For `/i/{token}`:

- The hero uses `Cụm tên khách`.
- `ThankYouSection` uses `Cụm danh xưng`.
- Every other card keeps the current generic `Quý khách` copy.

For `/rsvp?invite={token}`:

- The review screen uses `Cụm tên khách`.
- Submission-result copy uses `Cụm danh xưng`.
- Every other sentence keeps the current generic `Quý khách` copy.

Public copy must not infer these two values from `hostRelationship` or
`kinshipPronoun`.

The configured couple display name is one visual phrase everywhere it appears
in the interface. Surrounding copy may wrap normally, but the browser must not
split the two names around the ampersand. This is a presentation rule and must
not add non-breaking characters to stored invitation data.

## Guest Capacity

- `Bố` and `Mẹ` are single-person invitations with expected count `1`.
- `Bố mẹ`, `Ba mẹ`, and `Ông bà` are couple invitations with expected count `2`.

## Post-Ceremony Party

The invite workbook contains `Tham gia tiệc sau Hôn phối`:

- Blank means the question does not apply to the invitee.
- `Có` means the invitee is asked whether they will attend the gathering after
  the wedding ceremony.
- No other non-blank value is valid.

The RSVP question appears only after an eligible invitee chooses to attend the
wedding ceremony. Invitation scope and the guest answer are separate fields.
The answer is cleared when the question no longer applies.

Admin estimates the post-ceremony headcount from the existing RSVP guest count;
guests are not asked for another number.

## Compatibility

Existing imported invitees may not have a stored `Cụm danh xưng`. A
deterministic longest-prefix match against the Excel salutation definitions may
be used as a compatibility fallback. New imports must persist the exact Excel
salutation cluster.
