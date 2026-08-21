alter table public.rsvp_responses
  add column if not exists attending_ceremony boolean,
  add column if not exists attending_banquet boolean;

notify pgrst, 'reload schema';
