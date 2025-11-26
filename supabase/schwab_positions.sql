-- Detailed Schwab positions by account and date
create table if not exists public.schwab_positions (
  id uuid primary key default gen_random_uuid(),
  account_number text not null,
  as_of_date date not null,
  symbol text,
  description text,
  asset_type text,
  quantity numeric,
  price numeric,
  market_value numeric,
  cost_basis numeric,
  side text, -- 'LONG' / 'SHORT' if available
  raw_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_schwab_positions_acct_date
  on public.schwab_positions (account_number, as_of_date desc);
