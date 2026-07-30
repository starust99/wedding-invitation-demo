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

## Guest Capacity

- `Bố` and `Mẹ` are single-person invitations with expected count `1`.
- `Bố mẹ`, `Ba mẹ`, and `Ông bà` are couple invitations with expected count `2`.

## Compatibility

Existing imported invitees may not have a stored `Cụm danh xưng`. A
deterministic longest-prefix match against the Excel salutation definitions may
be used as a compatibility fallback. New imports must persist the exact Excel
salutation cluster.

