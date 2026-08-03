# Guest Personalization

## Source Fields

The current Excel template defines:

- `Cụm danh xưng`: the short form used to address the invited party in a sentence.
- `Tên khách`: the manually entered proper name or paired names.
- `Cụm tên khách`: `Cụm danh xưng` plus `Tên khách`, preserving the salutation casing and the entered proper-name casing.
- `Đơn vị khách`: an automatically derived planning label backed by
  `householdMode`: `Cá nhân`, `Cặp đôi`, or `Gia đình`.

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

## Couple With An Unnamed Partner

The salutation dropdown supports `Anh + Người thương`, `Chị + Người thương`,
`Em + Người thương`, and `Bạn + Người thương`.

- The full display label is compact, for example `Chị Chi & Người thương`.
- Sentence copy uses `Anh chị` for `Anh/Chị + Người thương`, `Hai em` for
  `Em + Người thương`, and `Hai bạn` for `Bạn + Người thương`.
- These rows are couple invitations with expected count `2` and
  `plusOnePolicy = lover`.
- RSVP does not ask whether both people will attend.

## Guest Unit Classification

`Đơn vị khách` is derived from the selected salutation definition rather than
parsing the full guest name:

- single-person salutations produce `Cá nhân`;
- `+ Người thương` and explicit two-person salutations produce `Cặp đôi`;
- salutations beginning with `Vợ chồng` produce `Gia đình`, because children may
  be included and the actual party is confirmed through RSVP;
- family salutations produce `Gia đình`.

The generated workbook shows this as a locked formula cell. Import repeats the
same deterministic derivation, so a stale or missing Excel formula result does
not corrupt the stored value. Existing workbooks without the visible column
remain compatible. Admin may edit the stored classification for exceptional
cases. The classification is planning metadata and must not replace actual
lodging names or room-capacity decisions.

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

## Lodging Input Presentation

Lodging guest-card headings stay visually prominent, while guest-entered names,
ages, notes, dietary notes, and placeholders use normal font weight. When a
guest is marked as a child, RSVP explains that the numeric age helps the family
arrange a suitable room and bed, keeps `VD: 5` in the age input, and reports a
missing value as `Nhập tuổi của bé`.

## Compatibility

Existing imported invitees may not have a stored `Cụm danh xưng`. A
deterministic longest-prefix match against the Excel salutation definitions may
be used as a compatibility fallback. New imports must persist the exact Excel
salutation cluster.
