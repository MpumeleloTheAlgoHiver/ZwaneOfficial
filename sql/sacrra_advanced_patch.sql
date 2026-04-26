-- SACRRA Advanced features patch
-- Adds: PGP key + transport on bureau config, sacrra_conversions table.
-- Idempotent. Does not drop or alter existing data.

ALTER TABLE sacrra_bureau_config ADD COLUMN IF NOT EXISTS public_key text;
ALTER TABLE sacrra_bureau_config ADD COLUMN IF NOT EXISTS transport text DEFAULT 'https';
ALTER TABLE sacrra_bureau_config ADD COLUMN IF NOT EXISTS sftp_host text;
ALTER TABLE sacrra_bureau_config ADD COLUMN IF NOT EXISTS sftp_port integer DEFAULT 22;
ALTER TABLE sacrra_bureau_config ADD COLUMN IF NOT EXISTS sftp_username text;
ALTER TABLE sacrra_bureau_config ADD COLUMN IF NOT EXISTS sftp_password text;
ALTER TABLE sacrra_bureau_config ADD COLUMN IF NOT EXISTS sftp_remote_path text;

CREATE TABLE IF NOT EXISTS sacrra_conversions (
  id uuid primary key default gen_random_uuid(),
  new_account_no text not null,
  old_account_no text not null,
  old_sub_account_no text,
  old_supplier_branch text,
  old_supplier_ref text,
  notes text,
  created_at timestamptz default now()
);
CREATE INDEX IF NOT EXISTS idx_sacrra_conversions_new ON sacrra_conversions(new_account_no);

ALTER TABLE sacrra_conversions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sacrra_conversions_all ON sacrra_conversions;
CREATE POLICY sacrra_conversions_all ON sacrra_conversions FOR ALL TO authenticated USING (true) WITH CHECK (true);
