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

## Invite Workbook Classification

The visible invite workbook keeps seven columns: `STT`, `Cụm danh xưng`,
`Tên khách`, `Cụm tên khách`, `Đơn vị khách`, `Nhóm khách`, and
`Tham gia tiệc sau Hôn phối`. `Lời mời trong thiệp` is derived from the guest
identity at runtime and is not an administrator input, so new templates do not
export that column. Import remains compatible with older workbooks that still
contain it and ignores any stale value in favor of the runtime-derived copy.

No extra lodging column is required. The two existing classification inputs
have separate responsibilities:

- `Tham gia tiệc sau Hôn phối` controls the initial intimate-party invitation
  scope described below.
- `Nhóm khách` controls Terracotta lodging eligibility. Guests in the
  `[Nhà Trai] Họ nội`, `[Nhà Trai] Họ ngoại`, `[Nhà Gái] Họ nội`, or
  `[Nhà Gái] Họ ngoại` groups are asked about lodging only when they accept the
  Terracotta wedding. The two Nhà Trai family groups may choose only the night
  of 26/12 or no stay; the two Nhà Gái family groups may choose 25/12, 26/12,
  both nights, or no stay. Other groups answer the banquet party-size question
  instead of lodging.

## Post-Ceremony Party

The invite workbook contains `Tham gia tiệc sau Hôn phối`:

- `Có` means the invitee is invited from the start and sees the intimate-party
  question inside the ceremony card after accepting the wedding ceremony.
- Blank means the invitee starts with only the ceremony and Terracotta wedding
  choices. If they decline Terracotta, `Tiếp tục` opens a separate intimate-party
  step; accepting Terracotta proceeds directly to review.
- No other non-blank value is valid.

The separate intimate-party step does not repeat the ceremony card. It keeps a
top `Chỉnh sửa` action that returns to the original event choices without losing
them. The completion hand cue appears only when the current step has every
required answer; reduced-motion users keep the cue visible without animation.
Both the inline and separate intimate-party invitations use the same custom
covered-serving cloche icon and show `11:30 – Chủ Nhật, 20/12/2026`. The
separate card keeps `Nhà Thờ Giáo Xứ Tam Hải` as its own location line, and
review repeats the same time/date.

Invitation scope and the guest answer are separate fields. For guests invited
from the start, the answer applies only while ceremony attendance is `Có`. For
other guests, it applies only while Terracotta attendance is `Không`. The answer
is cleared when its corresponding condition no longer applies.

Admin estimates the post-ceremony headcount from the existing RSVP guest count;
guests are not asked for another number.

## Lodging Input Presentation

Lodging guest-card headings stay visually prominent, while guest-entered names,
ages, notes, dietary notes, and placeholders use normal font weight. When a
guest is marked as a child, RSVP explains that the numeric age helps the family
arrange a suitable room and bed, keeps `VD: 5` in the age input, and reports a
missing value as `Nhập tuổi của bé`.

## RSVP Review and Invalid Invitation Presentation

The public invalid-invitation state is guest-facing only. It explains that the
personal invitation could not be found and offers a safe retry path without
rendering an admin password field or admin action.

The RSVP review preserves the same event, lodging, and guest-count data but
presents it as a flat summary with hairline separators. It does not use numbered
form sections, nested cards, or filled status pills. On narrow screens, event
status moves below the event date so neither value is compressed.

Inline validation remains attached to the exact field requiring attention and
is cleared as soon as that field becomes valid. These presentation rules do not
change draft storage, API payloads, invite eligibility, or RSVP persistence.

## Hero Invitation Alignment

On narrow mobile and in-app browser viewports, the handwritten invitation
heading and personalized guest name share one deterministic horizontal center.
The heading artwork, its divider, and star use the approved flat `#9B7134` ink
instead of depending on WebView-specific CSS filter rendering. This does not
change the hero copy, reveal order, splash behavior, or guest-name data.

## Compatibility

Existing imported invitees may not have a stored `Cụm danh xưng`. A
deterministic longest-prefix match against the Excel salutation definitions may
be used as a compatibility fallback. New imports must persist the exact Excel
salutation cluster.
