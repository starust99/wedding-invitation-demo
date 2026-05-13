create extension if not exists pgcrypto;

create table if not exists rsvp_responses (
  id uuid primary key default gen_random_uuid(),
  invitee_id uuid,
  invite_token text,
  display_label text,
  name text not null,
  phone text not null,
  attending text not null check (attending in ('yes', 'no', 'maybe')),
  guest_count int not null default 1 check (guest_count >= 0),
  guest_group text not null,
  dietary_note text,
  transport_needed boolean not null default false,
  accommodation_needed boolean not null default false,
  staying_guest_count int check (staying_guest_count is null or staying_guest_count >= 0),
  lodging_guests jsonb not null default '[]'::jsonb,
  check_in_date date,
  check_out_date date,
  room_type text,
  children_count int not null default 0 check (children_count >= 0),
  elderly_support_needed boolean not null default false,
  notes text,
  submitted_at timestamptz not null default now()
);

alter table rsvp_responses add column if not exists invitee_id uuid;
alter table rsvp_responses add column if not exists invite_token text;
alter table rsvp_responses add column if not exists display_label text;
alter table rsvp_responses add column if not exists lodging_guests jsonb not null default '[]'::jsonb;

create index if not exists rsvp_responses_submitted_at_idx on rsvp_responses (submitted_at desc);
create index if not exists rsvp_responses_attending_idx on rsvp_responses (attending);
create index if not exists rsvp_responses_accommodation_needed_idx on rsvp_responses (accommodation_needed);
create index if not exists rsvp_responses_invitee_id_idx on rsvp_responses (invitee_id);
create index if not exists rsvp_responses_invite_token_idx on rsvp_responses (invite_token);
create unique index if not exists rsvp_responses_invitee_id_unique_idx on rsvp_responses (invitee_id) where invitee_id is not null;
create unique index if not exists rsvp_responses_invite_token_unique_idx on rsvp_responses (invite_token) where invite_token is not null;

create table if not exists invitees (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  invite_unit text not null default 'individual' check (invite_unit in ('individual', 'household')),
  guest_name text not null default '',
  display_label text not null,
  invitation_name text not null default '',
  honorific text not null default '',
  envelope_line text not null default '',
  inside_invite_line text not null default '',
  invited_by text not null default 'couple' check (invited_by in ('parents', 'couple')),
  relationship text not null default '',
  host_relationship text not null default '',
  host_pronoun text not null default '',
  couple_reference text not null default '',
  household_mode text not null default 'single' check (household_mode in ('single', 'couple', 'family', 'widowed')),
  plus_one_policy text not null default 'none' check (plus_one_policy in ('none', 'spouse', 'family', 'lover', 'open_plus_one')),
  guest_group text not null default 'Khác',
  audience_tags text[] not null default '{}',
  expected_guest_count int not null default 1 check (expected_guest_count >= 1),
  phone text not null default '',
  email text not null default '',
  notes text not null default '',
  invite_status text not null default 'invited' check (invite_status in ('invited', 'rsvp_yes', 'rsvp_no', 'rsvp_maybe', 'supplement_ready', 'album_ready')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table invitees add column if not exists invitation_name text not null default '';
alter table invitees add column if not exists host_relationship text not null default '';
alter table invitees add column if not exists host_pronoun text not null default '';
alter table invitees add column if not exists couple_reference text not null default '';

create index if not exists invitees_guest_group_idx on invitees (guest_group);
create index if not exists invitees_invite_status_idx on invitees (invite_status);
create index if not exists invitees_audience_tags_idx on invitees using gin (audience_tags);

alter table rsvp_responses
  add constraint rsvp_responses_invitee_id_fkey
  foreign key (invitee_id) references invitees(id)
  on delete set null
  not valid;

create table if not exists invite_supplements (
  id uuid primary key default gen_random_uuid(),
  invitee_id uuid not null references invitees(id) on delete cascade,
  table_zone text not null default '',
  table_name text not null default '',
  seat_note text not null default '',
  arrival_note text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (invitee_id)
);

create index if not exists invite_supplements_status_idx on invite_supplements (status);

create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  src text not null,
  title text not null default '',
  alt text not null default '',
  photo_tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists media_assets_status_idx on media_assets (status);
create index if not exists media_assets_photo_tags_idx on media_assets using gin (photo_tags);

create table if not exists album_rules (
  audience_tag text primary key,
  allowed_photo_tags text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists site_settings (
  id text primary key default 'main',
  content jsonb not null,
  theme_key text not null default 'rose-quartz-serenity',
  published_content jsonb,
  published_theme_key text,
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists site_versions (
  id uuid primary key default gen_random_uuid(),
  settings jsonb not null,
  label text not null,
  source text not null default 'manual' check (source in ('manual', 'duplicate', 'restore', 'publish')),
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists site_versions_created_at_idx on site_versions (created_at desc);
create index if not exists site_versions_published_at_idx on site_versions (published_at desc);

-- Asset uploads are handled by Next.js route handlers with SUPABASE_SERVICE_ROLE_KEY.
-- Create a public Supabase Storage bucket named `wedding-assets`, or let `/api/admin/assets`
-- create it on the first upload when the service role key has storage permissions.

alter table rsvp_responses enable row level security;
alter table invitees enable row level security;
alter table invite_supplements enable row level security;
alter table media_assets enable row level security;
alter table album_rules enable row level security;
alter table site_settings enable row level security;
alter table site_versions enable row level security;

-- This app uses Next.js route handlers with SUPABASE_SERVICE_ROLE_KEY for reads/writes.
-- RLS is enabled and no public policies are created, so anon users cannot read/write tables directly.
