-- SACRRA Layout 700v2 schema additions
-- Idempotent: safe to re-run.

create table if not exists sacrra_extract_runs (
  id uuid primary key default gen_random_uuid(),
  month_end date not null,
  frequency text not null check (frequency in ('M','D','A')),
  filename text not null,
  account_type text,
  record_count integer default 0,
  rejected_count integer default 0,
  status text default 'GENERATED',
  created_at timestamptz default now()
);
create index if not exists sacrra_extract_runs_created_idx on sacrra_extract_runs(created_at desc);

create table if not exists sacrra_rejections (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references sacrra_extract_runs(id) on delete cascade,
  account_number text,
  field_name text,
  error_message text,
  severity text default 'ERROR',
  resolved boolean default false,
  created_at timestamptz default now()
);
create index if not exists sacrra_rejections_unresolved_idx on sacrra_rejections(resolved) where resolved = false;

create table if not exists sacrra_submissions (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references sacrra_extract_runs(id) on delete cascade,
  bureau text not null,
  filename text,
  http_status integer,
  response_body text,
  success boolean default false,
  submitted_at timestamptz default now()
);
create index if not exists sacrra_submissions_run_idx on sacrra_submissions(run_id);

create table if not exists sacrra_bureau_config (
  bureau text primary key,
  endpoint text,
  auth_header text,
  enabled boolean default false,
  updated_at timestamptz default now()
);

-- Seed bureau slots so the UI has rows to edit
insert into sacrra_bureau_config (bureau, enabled) values
  ('Compuscan', false), ('Experian', false),
  ('TransUnion', false), ('XDS', false)
on conflict (bureau) do nothing;

-- Member / supplier configuration (one row per supplier reference)
create table if not exists sacrra_supplier_config (
  id uuid primary key default gen_random_uuid(),
  supplier_ref text not null unique,        -- 7 alphanumeric, e.g. CP0001
  trading_name text not null,
  default_account_type text,
  active boolean default true,
  created_at timestamptz default now()
);

-- (No ALTER/DROP on existing tables. Safe to re-run.)
-- The admin module reads from the existing `accounts` table directly via the
-- projection in services/sacrraApi.js — no view required.
