-- Seed: mock partner dispensaries and dispensary products for Phase 3 development.
-- Idempotent: skipped if partners table already has rows.
-- These are fictional businesses for development/testing only.

do $$
declare
  partner_ca_id uuid;
  partner_co_id uuid;
  partner_wa_id uuid;
  -- Placeholder user IDs — replace with real auth.users IDs when testing locally.
  -- These rows will be skipped if the user_id doesn't exist (FK constraint).
begin
  if exists (select 1 from partners limit 1) then
    return;
  end if;

  -- In local dev: create partner users via Supabase auth dashboard or CLI,
  -- then update these UUIDs to match. The seed will insert on first run only.

  -- ── Partner 1: Green Leaf Wellness (California) ───────────────────────────
  insert into partners (id, user_id, company_name, type, region_states, contact_email, feature_flag_enabled)
  values (
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'Green Leaf Wellness',
    'dispensary',
    array['CA'],
    'hello@greenleafwellness.example',
    true
  )
  on conflict (user_id) do nothing;
  partner_ca_id := '00000000-0000-0000-0001-000000000001';

  -- ── Partner 2: Rocky Mountain Provisions (Colorado) ──────────────────────
  insert into partners (id, user_id, company_name, type, region_states, contact_email, feature_flag_enabled)
  values (
    '00000000-0000-0000-0002-000000000002',
    '00000000-0000-0000-0002-000000000002',
    'Rocky Mountain Provisions',
    'dispensary',
    array['CO'],
    'info@rockymtnprov.example',
    true
  )
  on conflict (user_id) do nothing;
  partner_co_id := '00000000-0000-0000-0002-000000000002';

  -- ── Partner 3: Cascade Botanicals (Washington) ───────────────────────────
  insert into partners (id, user_id, company_name, type, region_states, contact_email, feature_flag_enabled)
  values (
    '00000000-0000-0000-0003-000000000003',
    '00000000-0000-0000-0003-000000000003',
    'Cascade Botanicals',
    'dispensary',
    array['WA'],
    'contact@cascadebotanicals.example',
    true
  )
  on conflict (user_id) do nothing;
  partner_wa_id := '00000000-0000-0000-0003-000000000003';

  -- ── California products ───────────────────────────────────────────────────

  insert into dispensary_products
    (partner_id, name, category, thc_percentage, cbd_percentage, terpene_profile, description, price_cents, in_stock, state)
  values
    (partner_ca_id, 'Evening Haze', 'flower', 18.5, 0.3,
     '{"linalool": 0.8, "myrcene": 0.6, "caryophyllene": 0.4}',
     'A calming indica-dominant flower with floral, lavender notes. May support evening relaxation.',
     1500, true, 'CA'),

    (partner_ca_id, 'Clarity Tincture', 'tincture', 5.0, 15.0,
     '{"limonene": 0.7, "pinene": 0.5}',
     'A balanced CBD-forward tincture. May support daytime focus and calm without strong psychoactive effect.',
     4500, true, 'CA'),

    (partner_ca_id, 'Restful Nights Edible', 'edible', 10.0, 5.0,
     '{"linalool": 0.9, "myrcene": 0.7}',
     'Gummies formulated for evening use. May support sleep. 10mg THC / 5mg CBD per piece.',
     2000, true, 'CA'),

    (partner_ca_id, 'Mountain Mint Topical', 'topical', 0.0, 20.0,
     '{"caryophyllene": 0.8, "humulene": 0.4}',
     'Non-psychoactive topical balm. May support localized comfort. Apply to skin only.',
     3500, true, 'CA');

  -- ── Colorado products ─────────────────────────────────────────────────────

  insert into dispensary_products
    (partner_id, name, category, thc_percentage, cbd_percentage, terpene_profile, description, price_cents, in_stock, state)
  values
    (partner_co_id, 'Alpine Sunrise', 'flower', 22.0, 0.1,
     '{"limonene": 0.9, "pinene": 0.6, "ocimene": 0.3}',
     'A sativa-leaning flower with citrus and pine notes. May support uplifted mood and morning focus.',
     1800, true, 'CO'),

    (partner_co_id, 'Balanced Blend Tincture', 'tincture', 10.0, 10.0,
     '{"myrcene": 0.5, "linalool": 0.5, "caryophyllene": 0.4}',
     '1:1 THC:CBD tincture. Equal-ratio blends are often explored for moderate, balanced effects.',
     5000, true, 'CO'),

    (partner_co_id, 'Rocky Relief Edible', 'edible', 5.0, 5.0,
     '{"caryophyllene": 0.6, "myrcene": 0.4}',
     'Low-dose 5mg THC / 5mg CBD chocolates. Gentle option for those new to edibles.',
     1800, true, 'CO'),

    (partner_co_id, 'Full Spectrum Concentrate', 'concentrate', 70.0, 2.0,
     '{"terpinolene": 0.8, "limonene": 0.7, "myrcene": 0.3}',
     'Live resin concentrate with preserved terpene profile. For experienced users.',
     6000, false, 'CO');

  -- ── Washington products ───────────────────────────────────────────────────

  insert into dispensary_products
    (partner_id, name, category, thc_percentage, cbd_percentage, terpene_profile, description, price_cents, in_stock, state)
  values
    (partner_wa_id, 'Pacific Calm Flower', 'flower', 16.0, 0.5,
     '{"myrcene": 0.9, "caryophyllene": 0.5, "linalool": 0.4}',
     'A mellow indica-leaning flower with earthy, herbal notes. May support relaxation.',
     1400, true, 'WA'),

    (partner_wa_id, 'Cedar Coast CBD Oil', 'tincture', 0.3, 25.0,
     '{"pinene": 0.6, "ocimene": 0.4}',
     'High-CBD hemp-derived oil. Very low THC. May support calm without psychoactive effect.',
     4000, true, 'WA'),

    (partner_wa_id, 'Cascade Gummies', 'edible', 10.0, 0.0,
     '{"limonene": 0.8, "terpinolene": 0.5}',
     'Fruity 10mg THC gummies. Standard dose; allow 1–2 hours before assessing effect.',
     2200, true, 'WA'),

    (partner_wa_id, 'Rainforest Relief Balm', 'topical', 0.0, 30.0,
     '{"caryophyllene": 0.9, "myrcene": 0.4, "linalool": 0.3}',
     'CBD-only topical with high cannabidiol content. Non-psychoactive. Apply externally.',
     3800, true, 'WA');

end;
$$;
