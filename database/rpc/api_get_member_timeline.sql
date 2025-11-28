-- Canonical RPC: returns monthly timeline for a given member
-- Includes report_date, portfolio_value, total_units, total_contribution, growth_amount, growth_pct

create or replace function public.api_get_member_timeline(member_id_in uuid)
returns table (
  report_date date,
  portfolio_value numeric,
  total_units numeric,
  total_contribution numeric,
  growth_amount numeric,
  growth_pct numeric
)
security definer
set search_path = public
language sql
stable
as $$
  select 
    mb.report_month as report_date,
    mb.portfolio_value,
    mb.total_units,
    mb.total_contribution,
    mb.growth_amount,
    mb.growth_pct
  from public.member_monthly_balances mb
  where mb.member_id = member_id_in
  order by mb.report_month asc;
$$;
