alter table public.invitees
  add column if not exists post_ceremony_party_invited boolean not null default false;

alter table public.rsvp_responses
  add column if not exists attending_ceremony boolean;

alter table public.rsvp_responses
  add column if not exists attending_banquet boolean;

alter table public.rsvp_responses
  add column if not exists attending_post_ceremony_party boolean;

update public.rsvp_responses
set
  attending_ceremony = coalesce(
    attending_ceremony,
    case
      when jsonb_typeof(lodging_guests) = 'object'
        and lodging_guests ? 'attendingCeremony'
      then (lodging_guests ->> 'attendingCeremony')::boolean
      else null
    end
  ),
  attending_banquet = coalesce(
    attending_banquet,
    case
      when jsonb_typeof(lodging_guests) = 'object'
        and lodging_guests ? 'attendingBanquet'
      then (lodging_guests ->> 'attendingBanquet')::boolean
      else null
    end
  )
where jsonb_typeof(lodging_guests) = 'object';

update public.rsvp_responses
set lodging_guests = coalesce(lodging_guests -> 'guests', '[]'::jsonb)
where jsonb_typeof(lodging_guests) = 'object';

alter table public.rsvp_responses
  drop constraint if exists rsvp_post_ceremony_requires_ceremony;

alter table public.rsvp_responses
  add constraint rsvp_post_ceremony_requires_ceremony
  check (
    attending_post_ceremony_party is null
    or attending_ceremony is true
  ) not valid;

alter table public.rsvp_responses
  validate constraint rsvp_post_ceremony_requires_ceremony;

notify pgrst, 'reload schema';
