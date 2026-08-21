alter table invitees
  add column if not exists terracotta_lodging_eligible boolean not null default false;

update invitees
set terracotta_lodging_eligible = true
where guest_group in (
  '[Nhà Trai] Họ nội',
  '[Nhà Trai] Họ ngoại',
  '[Nhà Gái] Họ nội',
  '[Nhà Gái] Họ ngoại'
);
