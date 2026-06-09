-- Migration: add 'marketplace' as a valid subscription tier value
-- down: remove rows with tier='marketplace' before removing the value (data migration required)

-- If your Supabase instance has a check constraint on subscriptions.tier or profiles.subscription_tier,
-- update it here. Otherwise this migration is a no-op at the schema level — the tier value
-- is stored as free-form text, so no DDL change is strictly required.

-- Update any existing check constraint (run ONLY if constraint exists; check with \d subscriptions)
-- alter table subscriptions drop constraint if exists subscriptions_tier_check;
-- alter table subscriptions add constraint subscriptions_tier_check
--   check (tier in ('free', 'marketplace', 'self_guided', 'guided', 'concierge'));

-- alter table profiles drop constraint if exists profiles_subscription_tier_check;
-- alter table profiles add constraint profiles_subscription_tier_check
--   check (subscription_tier in ('free', 'marketplace', 'self_guided', 'guided', 'concierge'));

-- No destructive changes. Safe to apply with zero downtime.
select 1; -- no-op placeholder so pnpm supabase db push runs without error
