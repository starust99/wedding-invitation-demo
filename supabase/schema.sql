create extension if not exists pgcrypto;

create table if not exists rsvp_responses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  attending text not null check (attending in ('yes', 'no', 'maybe')),
  guest_count int not null default 1 check (guest_count >= 0),
  guest_group text not null,
  dietary_note text,
  transport_needed boolean not null default false,
  accommodation_needed boolean not null default false,
  staying_guest_count int check (staying_guest_count is null or staying_guest_count >= 0),
  check_in_date date,
  check_out_date date,
  room_type text,
  children_count int not null default 0 check (children_count >= 0),
  elderly_support_needed boolean not null default false,
  notes text,
  submitted_at timestamptz not null default now()
);

create index if not exists rsvp_responses_submitted_at_idx on rsvp_responses (submitted_at desc);
create index if not exists rsvp_responses_attending_idx on rsvp_responses (attending);
create index if not exists rsvp_responses_accommodation_needed_idx on rsvp_responses (accommodation_needed);

create table if not exists site_settings (
  id text primary key default 'main',
  content jsonb not null,
  theme_key text not null default 'dalat-garden-elegant',
  published_content jsonb,
  published_theme_key text,
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

alter table rsvp_responses enable row level security;
alter table site_settings enable row level security;

-- This app uses Next.js route handlers with SUPABASE_SERVICE_ROLE_KEY for reads/writes.
-- RLS is enabled and no public policies are created, so anon users cannot read/write tables directly.
