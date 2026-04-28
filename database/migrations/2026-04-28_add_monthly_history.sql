-- ============================================================================
-- 2026-04-28: Monthly history snapshots (from final-history.xlsx)
--
-- Models the per-month "tab" pattern:
--   • monthly_snapshots       — one row per month (asset breakdown + unit info)
--   • member_monthly_entries  — one row per (member, month) with dues/units
--
-- Key calculations are done in the database so future months only need INPUT
-- values; everything else is derived:
--   • monthly_snapshots.total_value     = sum of asset columns
--   • monthly_snapshots.unit_value      = total_value / new_total_val_units
--   • member_monthly_entries.new_val_unit_total = previous + added
--   • member_monthly_entries.current_portfolio  = new_val_unit_total * unit_value
--   • member_monthly_entries.ownership_pct      = current_portfolio / total_value
--
-- A view `monthly_member_view` joins everything for the UI.
-- ============================================================================

create table if not exists public.monthly_snapshots (
  id                    uuid primary key default gen_random_uuid(),
  month_label           text not null unique,            -- e.g. "Apr 2026"
  snapshot_date         date not null,                   -- first of month
  -- INPUT: asset breakdown
  stock_value           numeric(14,2) not null default 0,
  cash_credit_union     numeric(14,2) not null default 0,
  cash_schwab           numeric(14,2) not null default 0,
  mm_schwab             numeric(14,2) not null default 0,
  gold_schwab           numeric(14,2) not null default 0,
  other_value           numeric(14,2) not null default 0,
  -- INPUT: unit total for the month (sum of member new val units; usually
  --        also equals previous total + units added this month)
  new_total_val_units   numeric(16,6) not null default 0,
  -- DERIVED (generated columns)
  total_value           numeric(14,2)
                          generated always as (
                            stock_value + cash_credit_union + cash_schwab
                            + mm_schwab + gold_schwab + other_value
                          ) stored,
  unit_value            numeric(14,4)
                          generated always as (
                            case
                              when new_total_val_units > 0
                                then round(
                                  (stock_value + cash_credit_union + cash_schwab
                                   + mm_schwab + gold_schwab + other_value)
                                  / new_total_val_units, 4)
                              else 0
                            end
                          ) stored,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_monthly_snapshots_date
  on public.monthly_snapshots (snapshot_date desc);

create table if not exists public.member_monthly_entries (
  id                    uuid primary key default gen_random_uuid(),
  snapshot_id           uuid not null references public.monthly_snapshots(id) on delete cascade,
  member_id             uuid references public.members(id) on delete set null,
  member_name_raw       text not null,                   -- as it appears in the sheet
  -- INPUTS for the month
  dues_paid_buyout      numeric(14,2) not null default 0,
  dues_owed             numeric(14,2) not null default 0,
  total_contribution    numeric(14,2) not null default 0,
  previous_val_units    numeric(16,6) not null default 0,
  val_units_added       numeric(16,6) not null default 0,
  -- DERIVED
  new_val_unit_total    numeric(16,6)
                          generated always as (previous_val_units + val_units_added) stored,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (snapshot_id, member_name_raw)
);

create index if not exists idx_member_monthly_entries_snapshot
  on public.member_monthly_entries (snapshot_id);
create index if not exists idx_member_monthly_entries_member
  on public.member_monthly_entries (member_id);

-- View that mirrors what each Excel tab displays.  Calculations involving
-- both tables (current_portfolio, ownership %) live here.
create or replace view public.monthly_member_view as
select
  s.id                       as snapshot_id,
  s.month_label,
  s.snapshot_date,
  s.total_value              as snapshot_total_value,
  s.unit_value               as snapshot_unit_value,
  s.new_total_val_units      as snapshot_total_units,
  e.id                       as entry_id,
  e.member_id,
  e.member_name_raw,
  m.member_name              as member_name,
  m.email                    as member_email,
  e.dues_paid_buyout,
  e.dues_owed,
  e.total_contribution,
  e.previous_val_units,
  e.val_units_added,
  e.new_val_unit_total,
  round(e.new_val_unit_total * s.unit_value, 2)        as current_portfolio,
  case
    when s.total_value > 0
      then round((e.new_val_unit_total * s.unit_value) / s.total_value, 6)
    else 0
  end                                                  as ownership_pct
from public.member_monthly_entries e
join public.monthly_snapshots s on s.id = e.snapshot_id
left join public.members m on m.id = e.member_id;

-- updated_at triggers (idempotent — re-uses helper if it exists)
do $$
begin
  if not exists (select 1 from pg_proc where proname = 'set_updated_at') then
    create function public.set_updated_at() returns trigger language plpgsql as $f$
    begin
      new.updated_at := now();
      return new;
    end;
    $f$;
  end if;
end$$;

drop trigger if exists trg_monthly_snapshots_updated on public.monthly_snapshots;
create trigger trg_monthly_snapshots_updated
  before update on public.monthly_snapshots
  for each row execute function public.set_updated_at();

drop trigger if exists trg_member_monthly_entries_updated on public.member_monthly_entries;
create trigger trg_member_monthly_entries_updated
  before update on public.member_monthly_entries
  for each row execute function public.set_updated_at();

-- RLS — admins write, members read
alter table public.monthly_snapshots       enable row level security;
alter table public.member_monthly_entries  enable row level security;

drop policy if exists "monthly_snapshots admin all"        on public.monthly_snapshots;
drop policy if exists "monthly_snapshots members read"     on public.monthly_snapshots;
drop policy if exists "member_monthly_entries admin all"   on public.member_monthly_entries;
drop policy if exists "member_monthly_entries member read" on public.member_monthly_entries;

create policy "monthly_snapshots admin all" on public.monthly_snapshots
  for all using (
    exists (select 1 from public.members m
             where m.auth_user_id = auth.uid() and m.role = 'admin')
  ) with check (
    exists (select 1 from public.members m
             where m.auth_user_id = auth.uid() and m.role = 'admin')
  );

create policy "monthly_snapshots members read" on public.monthly_snapshots
  for select using (
    exists (select 1 from public.members m where m.auth_user_id = auth.uid())
  );

create policy "member_monthly_entries admin all" on public.member_monthly_entries
  for all using (
    exists (select 1 from public.members m
             where m.auth_user_id = auth.uid() and m.role = 'admin')
  ) with check (
    exists (select 1 from public.members m
             where m.auth_user_id = auth.uid() and m.role = 'admin')
  );

create policy "member_monthly_entries member read" on public.member_monthly_entries
  for select using (
    exists (select 1 from public.members m where m.auth_user_id = auth.uid())
  );
