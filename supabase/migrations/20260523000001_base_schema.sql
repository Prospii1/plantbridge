-- Migration: base_schema
-- Created: 2026-05-23
-- Phase 1 core tables for PlantBridge.
--
-- down:
--   drop trigger on_auth_user_created on auth.users;
--   drop function handle_new_user();
--   drop table stripe_events, recommendation_versions, events, subscriptions,
--              outcome_logs, care_plan_items, care_plans, recommendation_profiles,
--              intake_answers, intake_sessions, profiles cascade;
--   drop function update_updated_at();

-- ── Shared trigger: keep updated_at current ───────────────────────────────────

create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── profiles ──────────────────────────────────────────────────────────────────
-- One row per auth user, created automatically by handle_new_user trigger.

create table profiles (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null unique references auth.users(id) on delete cascade,
  role              text        not null default 'user'
                                check (role in ('user', 'coach', 'partner', 'admin')),
  state             text,
  age_verified_at   timestamptz,
  subscription_tier text        not null default 'free',
  consent_versions  jsonb       not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- Auto-create a profile row when a new auth user signs up.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── intake_sessions ───────────────────────────────────────────────────────────
-- One row per completed intake flow run.

create table intake_sessions (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users(id) on delete cascade,
  completed_at      timestamptz,
  questions_version text        not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger intake_sessions_updated_at
  before update on intake_sessions
  for each row execute function update_updated_at();

-- ── intake_answers ────────────────────────────────────────────────────────────
-- Normalized per-question answers for a session.

create table intake_answers (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  session_id  uuid        not null references intake_sessions(id) on delete cascade,
  question_id text        not null,
  answer      jsonb       not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger intake_answers_updated_at
  before update on intake_answers
  for each row execute function update_updated_at();

-- ── recommendation_profiles ───────────────────────────────────────────────────
-- Derived preference profile computed from intake answers.

create table recommendation_profiles (
  id                      uuid        primary key default gen_random_uuid(),
  user_id                 uuid        not null references auth.users(id) on delete cascade,
  session_id              uuid        not null references intake_sessions(id) on delete cascade,
  cannabinoid_preferences jsonb,
  terpene_mix             jsonb,
  format_preferences      jsonb,
  severity_scores         jsonb,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger recommendation_profiles_updated_at
  before update on recommendation_profiles
  for each row execute function update_updated_at();

-- ── care_plans ────────────────────────────────────────────────────────────────
-- Generated care plan header. Items are in care_plan_items.

create table care_plans (
  id                        uuid        primary key default gen_random_uuid(),
  user_id                   uuid        not null references auth.users(id) on delete cascade,
  recommendation_profile_id uuid        not null references recommendation_profiles(id) on delete cascade,
  engine_version            text        not null,
  rules_version             text        not null,
  status                    text        not null default 'active'
                                        check (status in ('active', 'archived')),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create trigger care_plans_updated_at
  before update on care_plans
  for each row execute function update_updated_at();

-- ── care_plan_items ───────────────────────────────────────────────────────────
-- Individual recommendation cards within a care plan.
-- confidence is 0.000–1.000 (three decimal places).

create table care_plan_items (
  id            uuid         primary key default gen_random_uuid(),
  user_id       uuid         not null references auth.users(id) on delete cascade,
  care_plan_id  uuid         not null references care_plans(id) on delete cascade,
  rule_id       text         not null,
  category      text         not null,
  subject       text         not null,
  confidence    numeric(4,3) not null check (confidence between 0 and 1),
  education_ref text,
  copy_ref      text,
  display_order int          not null default 0,
  created_at    timestamptz  not null default now(),
  updated_at    timestamptz  not null default now()
);

create trigger care_plan_items_updated_at
  before update on care_plan_items
  for each row execute function update_updated_at();

-- ── outcome_logs ──────────────────────────────────────────────────────────────
-- User-reported outcomes. care_plan_item_id is nullable so users can log
-- general outcomes not tied to a specific recommendation.

create table outcome_logs (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users(id) on delete cascade,
  care_plan_item_id uuid        references care_plan_items(id) on delete set null,
  logged_at         timestamptz not null default now(),
  rating            int         check (rating between 1 and 5),
  notes             text,
  metadata          jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger outcome_logs_updated_at
  before update on outcome_logs
  for each row execute function update_updated_at();

-- ── subscriptions ─────────────────────────────────────────────────────────────
-- Mirrors Stripe state. The webhook is source of truth; this is a cache.

create table subscriptions (
  id                     uuid        primary key default gen_random_uuid(),
  user_id                uuid        not null references auth.users(id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text,
  tier                   text        not null default 'free',
  status                 text        not null default 'inactive',
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create trigger subscriptions_updated_at
  before update on subscriptions
  for each row execute function update_updated_at();

-- ── events ────────────────────────────────────────────────────────────────────
-- Append-only analytics event log. Log generously; this feeds Phase 4 ML.
-- user_id is nullable to support pre-auth / anonymous events.
-- Never update rows in this table.

create table events (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        references auth.users(id) on delete set null,
  event_name  text        not null,
  properties  jsonb       not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger events_updated_at
  before update on events
  for each row execute function update_updated_at();

-- ── recommendation_versions ───────────────────────────────────────────────────
-- Immutable snapshots of rules JSON. Server-only; no user_id column.
-- Allows auditing which rule version generated any care plan.

create table recommendation_versions (
  id            uuid        primary key default gen_random_uuid(),
  rules_version text        not null unique,
  rules_json    jsonb       not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger recommendation_versions_updated_at
  before update on recommendation_versions
  for each row execute function update_updated_at();

-- ── stripe_events ─────────────────────────────────────────────────────────────
-- Idempotency log. Webhook handler checks here before processing any event.

create table stripe_events (
  id              uuid        primary key default gen_random_uuid(),
  stripe_event_id text        not null unique,
  processed_at    timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger stripe_events_updated_at
  before update on stripe_events
  for each row execute function update_updated_at();
