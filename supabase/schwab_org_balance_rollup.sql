-- Rollup: positions daily view and RPC to write into org_balance_history

-- 1) View: sum market value per account and date
create or replace view public.v_schwab_positions_daily as
select
  account_number,
  as_of_date,
  sum(market_value) as positions_value
from public.schwab_positions
group by account_number, as_of_date;

-- 2) Function: roll Schwab snapshots + positions into org_balance_history
create or replace function public.api_roll_schwab_into_org_balance(p_date date)
returns void
language plpgsql
as $$
begin
  -- Insert/update org_balance_history per date
  -- We join snapshots to accounts to get account_number (our snapshots store account_id)
  insert into public.org_balance_history (
    balance_date,
    source,
    total_value,
    cash_value,
    positions_value,
    metadata
  )
  select
    s.snapshot_date as balance_date,
    'schwab_positions' as source,
    coalesce(s.liquidation_value, p.positions_value) as total_value,
    s.cash_balance as cash_value,
    p.positions_value,
    jsonb_build_object(
      'account_id', s.account_id,
      'account_number', a.account_number
    ) as metadata
  from public.schwab_account_snapshots s
  join public.schwab_accounts a on a.id = s.account_id
  left join public.v_schwab_positions_daily p
    on p.account_number = a.account_number
   and p.as_of_date = s.snapshot_date
  where s.snapshot_date = p_date
  on conflict (balance_date, source) do update
    set total_value = excluded.total_value,
        cash_value = excluded.cash_value,
        positions_value = excluded.positions_value,
        metadata = excluded.metadata;
end;
$$;
