-- Add COA (Certificate of Analysis) URL to dispensary_products
-- Down: alter table dispensary_products drop column if exists coa_url;

alter table dispensary_products
  add column if not exists coa_url text;
