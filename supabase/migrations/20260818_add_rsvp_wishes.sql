alter table public.rsvp_responses
  add column if not exists wish_message text,
  add column if not exists wish_sent_at timestamptz;

update public.rsvp_responses
set
  wish_message = notes::jsonb ->> 'message',
  wish_sent_at = (notes::jsonb ->> 'sentAt')::timestamptz,
  notes = null
where notes like '{"kind":"post_rsvp_wish_v1"%'
  and notes::jsonb ->> 'kind' = 'post_rsvp_wish_v1'
  and char_length(notes::jsonb ->> 'message') between 1 and 500
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

notify pgrst, 'reload schema';
