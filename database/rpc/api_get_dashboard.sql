-- Canonical dashboard RPC aggregating summary metrics
-- Returns a JSON object with totals and current unit value

create or replace function public.api_get_dashboard()
returns jsonb
language sql
stable
as $$
with latest_valuation as (
  select unit_value, valuation_date
  from public.club_unit_valuations
  order by valuation_date desc
  limit 1
), member_counts as (
  select
    count(*) as total_members,
    count(*) filter (where status = 'active') as active_accounts
  from public.members
), aum as (
  select coalesce(sum(current_balance), 0) as total_aum
  from public.member_accounts
)
select jsonb_build_object(
  'total_members', (select total_members from member_counts),
  'active_accounts', (select active_accounts from member_counts),
  'total_aum', (select total_aum from aum),
  'current_unit_value', coalesce((select unit_value from latest_valuation), 0),
  'unit_value_date', (select valuation_date from latest_valuation)
);
$$;
