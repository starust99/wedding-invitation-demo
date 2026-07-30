alter table public.invitees
  add column if not exists salutation_cluster text not null default '';

update public.invitees
set salutation_cluster = case
  when lower(invitation_name) like 'gia đình anh chị %' then 'Gia đình anh chị'
  when lower(invitation_name) like 'gia đình %' then 'Gia đình'
  when lower(invitation_name) like 'hai bạn %' then 'Hai bạn'
  when lower(invitation_name) like 'bạn %' then 'Bạn'
  when lower(invitation_name) like 'anh %' then 'Anh'
  when lower(invitation_name) like 'chị %' then 'Chị'
  when lower(invitation_name) like 'dì %' then 'Dì'
  when lower(invitation_name) = 'bố' then 'Bố'
  when lower(invitation_name) = 'mẹ' then 'Mẹ'
  else salutation_cluster
end
where salutation_cluster = '';

update public.invitees
set
  guest_name = regexp_replace(guest_name, '^Gia đình Anh Chị', 'Gia đình anh chị', 'i'),
  display_label = regexp_replace(display_label, '^Gia đình Anh Chị', 'Gia đình anh chị', 'i'),
  invitation_name = regexp_replace(invitation_name, '^Gia đình Anh Chị', 'Gia đình anh chị', 'i')
where lower(invitation_name) like 'gia đình anh chị %';
