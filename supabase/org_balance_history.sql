-- Org balance history (created if missing)
create table if not exists public.org_balance_history (
  id uuid primary key default gen_random_uuid(),
  org_id uuid, -- nullable for now; can be wired later
  balance_date date not null,
  source text not null, -- e.g. 'schwab_positions'
  total_value numeric,
  cash_value numeric,
  positions_value numeric,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_org_balance_history_date_source
  on public.org_balance_history (balance_date, source);
