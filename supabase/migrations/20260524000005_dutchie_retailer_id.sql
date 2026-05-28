-- Add Dutchie retailer ID to partners table for Phase 4 API sync
-- down: alter table partners drop column if exists dutchie_retailer_id;

alter table partners add column if not exists dutchie_retailer_id text;

-- Index on dispensary_products.external_id for upsert performance
create index if not exists dispensary_products_external_id_idx
  on dispensary_products(external_id)
  where external_id is not null;
