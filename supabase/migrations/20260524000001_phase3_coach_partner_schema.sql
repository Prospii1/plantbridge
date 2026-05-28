-- Migration: phase3_coach_partner_schema
-- Created: 2026-05-24
-- Phase 3 tables: coach portal, messaging, scheduling, partner accounts, dispensary products.
--
-- down:
--   alter publication supabase_realtime drop table messages;
--   drop table dispensary_products, partners, bookings, coach_availability,
--              messages, conversations, coach_clients, coaches cascade;

-- ── coaches ───────────────────────────────────────────────────────────────────
-- Coach profile metadata. Extends profiles; user_id matches profiles.user_id.
-- verified_at is null until an admin verifies the coach.

create table coaches (
  id                    uuid        primary key default gen_random_uuid(),
  user_id               uuid        not null unique references auth.users(id) on delete cascade,
  bio                   text,
  specialization        text[]      not null default '{}',
  verified_at           timestamptz,
  availability_timezone text        not null default 'America/New_York',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger coaches_updated_at
  before update on coaches
  for each row execute function update_updated_at();

-- ── coach_clients ─────────────────────────────────────────────────────────────
-- Admin-managed assignment: links one coach to one user.
-- notes are coach-visible only (accessed via service role or coach RLS policy).

create table coach_clients (
  id          uuid        primary key default gen_random_uuid(),
  coach_id    uuid        not null references auth.users(id) on delete cascade,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  status      text        not null default 'active'
                          check (status in ('active', 'paused', 'ended')),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (coach_id, user_id)
);

create trigger coach_clients_updated_at
  before update on coach_clients
  for each row execute function update_updated_at();

-- ── conversations ─────────────────────────────────────────────────────────────
-- One conversation per coach-user pair. Created lazily on first message.

create table conversations (
  id              uuid        primary key default gen_random_uuid(),
  coach_id        uuid        not null references auth.users(id) on delete cascade,
  user_id         uuid        not null references auth.users(id) on delete cascade,
  last_message_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (coach_id, user_id)
);

create trigger conversations_updated_at
  before update on conversations
  for each row execute function update_updated_at();

-- ── messages ──────────────────────────────────────────────────────────────────
-- Chat messages. Realtime replication enabled below.
-- read_at is set by the recipient when they view the message.

create table messages (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        not null references conversations(id) on delete cascade,
  sender_id       uuid        not null references auth.users(id) on delete cascade,
  body            text        not null,
  read_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger messages_updated_at
  before update on messages
  for each row execute function update_updated_at();

-- Enable Supabase Realtime for live message delivery.
-- Note: also requires enabling replication on this table in the Supabase dashboard
-- (Database → Replication → supabase_realtime publication).
alter publication supabase_realtime add table messages;

-- ── coach_availability ────────────────────────────────────────────────────────
-- Weekly recurring availability slots. day_of_week: 0 = Sunday, 6 = Saturday.

create table coach_availability (
  id          uuid        primary key default gen_random_uuid(),
  coach_id    uuid        not null references auth.users(id) on delete cascade,
  day_of_week smallint    not null check (day_of_week between 0 and 6),
  start_time  time        not null,
  end_time    time        not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger coach_availability_updated_at
  before update on coach_availability
  for each row execute function update_updated_at();

-- ── bookings ──────────────────────────────────────────────────────────────────
-- Sessions booked by a user with their assigned coach.

create table bookings (
  id               uuid        primary key default gen_random_uuid(),
  coach_id         uuid        not null references auth.users(id) on delete cascade,
  user_id          uuid        not null references auth.users(id) on delete cascade,
  scheduled_at     timestamptz not null,
  duration_minutes int         not null default 30,
  status           text        not null default 'pending'
                               check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger bookings_updated_at
  before update on bookings
  for each row execute function update_updated_at();

-- ── partners ──────────────────────────────────────────────────────────────────
-- Partner company accounts. user_id matches a profiles row with role='partner'.
-- feature_flag_enabled controls whether their products appear in the locator.

create table partners (
  id                   uuid     primary key default gen_random_uuid(),
  user_id              uuid     not null unique references auth.users(id) on delete cascade,
  company_name         text     not null,
  type                 text     not null default 'dispensary'
                                check (type in ('dispensary', 'delivery', 'wholesaler')),
  region_states        text[]   not null default '{}',
  contact_email        text,
  feature_flag_enabled boolean  not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger partners_updated_at
  before update on partners
  for each row execute function update_updated_at();

-- ── dispensary_products ───────────────────────────────────────────────────────
-- Product catalog for partner dispensaries. Phase 3 uses seed/mock data.
-- external_id is reserved for Dutchie API product IDs (Phase 4 sync).

create table dispensary_products (
  id               uuid         primary key default gen_random_uuid(),
  partner_id       uuid         not null references partners(id) on delete cascade,
  name             text         not null,
  category         text         check (category in ('flower', 'edible', 'tincture', 'topical', 'concentrate')),
  thc_percentage   numeric(5,2),
  cbd_percentage   numeric(5,2),
  terpene_profile  jsonb        not null default '{}',
  description      text,
  price_cents      int,
  in_stock         boolean      not null default true,
  state            text,
  external_id      text,
  created_at       timestamptz  not null default now(),
  updated_at       timestamptz  not null default now()
);

create trigger dispensary_products_updated_at
  before update on dispensary_products
  for each row execute function update_updated_at();
