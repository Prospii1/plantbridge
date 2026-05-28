-- Phase 4: Analytics, embeddings, and Dutchie sync tables
-- Requires: pgvector extension (20260524000004_pgvector_extension.sql must run first on hosted;
--           for local dev run both in sequence via supabase db push)
--
-- down:
--   drop table if exists dutchie_sync_log;
--   drop table if exists user_preference_embeddings;
--   drop table if exists product_embeddings;
--   drop table if exists recommendation_effectiveness;

-- Enable pgvector extension (must precede vector(384) column definitions)
create extension if not exists vector;

-- ─── Recommendation effectiveness ───────────────────────────────────────────
-- Fully aggregated; no user PII. Recomputed by the effectiveness-cron edge function.

create table if not exists recommendation_effectiveness (
  id             uuid primary key default gen_random_uuid(),
  rule_id        text not null unique,
  sample_count   int not null default 0,
  avg_rating     numeric(3,2) not null default 0,
  positive_rate  numeric(3,2) not null default 0,
  last_computed_at timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table recommendation_effectiveness enable row level security;

-- Public read: aggregate only, no PII
create policy "effectiveness_select_public" on recommendation_effectiveness
  for select using (true);

-- Admin insert/update
create policy "effectiveness_insert_admin" on recommendation_effectiveness
  for insert with check (
    exists (select 1 from profiles p where p.user_id = auth.uid() and p.role = 'admin')
  );

create policy "effectiveness_update_admin" on recommendation_effectiveness
  for update using (
    exists (select 1 from profiles p where p.user_id = auth.uid() and p.role = 'admin')
  );

-- ─── Product embeddings ──────────────────────────────────────────────────────

create table if not exists product_embeddings (
  id                    uuid primary key default gen_random_uuid(),
  dispensary_product_id uuid not null references dispensary_products(id) on delete cascade,
  embedding             vector(384) not null,
  model_id              text not null default 'all-MiniLM-L6-v2',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (dispensary_product_id)
);

alter table product_embeddings enable row level security;

create policy "product_embeddings_select_public" on product_embeddings
  for select using (true);

create policy "product_embeddings_insert_admin" on product_embeddings
  for insert with check (
    exists (select 1 from profiles p where p.user_id = auth.uid() and p.role = 'admin')
  );

create policy "product_embeddings_update_admin" on product_embeddings
  for update using (
    exists (select 1 from profiles p where p.user_id = auth.uid() and p.role = 'admin')
  );

-- ─── User preference embeddings ──────────────────────────────────────────────

create table if not exists user_preference_embeddings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users(id) on delete cascade,
  embedding  vector(384) not null,
  model_id   text not null default 'all-MiniLM-L6-v2',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table user_preference_embeddings enable row level security;

create policy "user_pref_embeddings_select_own" on user_preference_embeddings
  for select using (auth.uid() = user_id);

create policy "user_pref_embeddings_insert_own" on user_preference_embeddings
  for insert with check (auth.uid() = user_id);

create policy "user_pref_embeddings_update_own" on user_preference_embeddings
  for update using (auth.uid() = user_id);

create policy "user_pref_embeddings_admin" on user_preference_embeddings
  for all using (
    exists (select 1 from profiles p where p.user_id = auth.uid() and p.role = 'admin')
  );

-- ─── Dutchie sync log ────────────────────────────────────────────────────────

create table if not exists dutchie_sync_log (
  id            uuid primary key default gen_random_uuid(),
  partner_id    uuid not null references partners(id) on delete cascade,
  synced_at     timestamptz not null default now(),
  product_count int not null default 0,
  error         text,
  created_at    timestamptz not null default now()
);

alter table dutchie_sync_log enable row level security;

create policy "dutchie_sync_log_admin" on dutchie_sync_log
  for select using (
    exists (select 1 from profiles p where p.user_id = auth.uid() and p.role = 'admin')
  );
