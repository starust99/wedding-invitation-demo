begin;

-- Complete the typed wish rollout before removing the temporary RSVP notes
-- compatibility column.
alter table public.rsvp_responses
  add column if not exists wish_message text,
  add column if not exists wish_sent_at timestamptz;

update public.rsvp_responses
set
  wish_message = notes::jsonb ->> 'message',
  wish_sent_at = (notes::jsonb ->> 'sentAt')::timestamptz
where wish_message is null
  and wish_sent_at is null
  and notes like '{"kind":"post_rsvp_wish_v1"%'
  and notes::jsonb ->> 'kind' = 'post_rsvp_wish_v1'
  and char_length(notes::jsonb ->> 'message') between 1 and 500
  and btrim(notes::jsonb ->> 'message') <> ''
  and notes::jsonb ->> 'sentAt' is not null;

alter table public.rsvp_responses
  drop constraint if exists rsvp_wish_message_contract;

alter table public.rsvp_responses
  add constraint rsvp_wish_message_contract
  check (
    (wish_message is null and wish_sent_at is null)
    or (
      wish_message is not null
      and wish_sent_at is not null
      and char_length(wish_message) between 1 and 500
      and char_length(btrim(wish_message)) >= 1
    )
  ) not valid;

alter table public.rsvp_responses
  validate constraint rsvp_wish_message_contract;

create index if not exists rsvp_responses_wish_sent_at_idx
  on public.rsvp_responses (wish_sent_at desc)
  where wish_sent_at is not null;

-- Normalize legacy lodging objects to the current array shape and permanently
-- remove any identity-document keys that older clients may have written.
update public.rsvp_responses
set lodging_guests = case
  when jsonb_typeof(lodging_guests) = 'array' then (
    select coalesce(jsonb_agg(guest - 'idNumber' - 'id_number'), '[]'::jsonb)
    from jsonb_array_elements(lodging_guests) as items(guest)
  )
  when jsonb_typeof(lodging_guests) = 'object'
    and jsonb_typeof(lodging_guests -> 'guests') = 'array' then (
      select coalesce(jsonb_agg(guest - 'idNumber' - 'id_number'), '[]'::jsonb)
      from jsonb_array_elements(lodging_guests -> 'guests') as items(guest)
    )
  else '[]'::jsonb
end;

alter table public.rsvp_responses
  drop column if exists phone,
  drop column if exists dietary_note,
  drop column if exists transport_needed,
  drop column if exists room_type,
  drop column if exists elderly_support_needed,
  drop column if exists notes;

alter table public.invitees
  drop column if exists phone,
  drop column if exists email;

alter table public.rsvp_responses
  validate constraint rsvp_responses_invitee_id_fkey;

commit;

notify pgrst, 'reload schema';
