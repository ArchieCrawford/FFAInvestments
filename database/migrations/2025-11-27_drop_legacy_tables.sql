-- Drop legacy artifacts now replaced by canonical schema
-- Ensure application references are removed before running.

begin;

-- Safe drops: ignore if not exists
drop table if exists public.ffa_timeline cascade;
drop table if exists public.unit_prices cascade;
-- Add other confirmed legacy tables if applicable
-- drop table if exists public.member_positions cascade;
-- drop table if exists public.valuations cascade;
-- drop table if exists public.club_values cascade;

-- Drop related RLS policies and triggers if they linger
-- Policies
do $$
begin
  begin
    drop policy if exists "ffa_timeline admin select" on public.ffa_timeline;
  exception when others then null; end;
  begin
    drop policy if exists "ffa_timeline admin insert" on public.ffa_timeline;
  exception when others then null; end;
  begin
    drop policy if exists "ffa_timeline admin update" on public.ffa_timeline;
  exception when others then null; end;
  begin
    drop policy if exists "ffa_timeline admin delete" on public.ffa_timeline;
  exception when others then null; end;
  begin
    drop policy if exists "ffa_timeline member read" on public.ffa_timeline;
  exception when others then null; end;

  begin
    drop policy if exists "unit_prices admin select" on public.unit_prices;
  exception when others then null; end;
  begin
    drop policy if exists "unit_prices admin insert" on public.unit_prices;
  exception when others then null; end;
  begin
    drop policy if exists "unit_prices admin update" on public.unit_prices;
  exception when others then null; end;
  begin
    drop policy if exists "unit_prices admin delete" on public.unit_prices;
  exception when others then null; end;
  begin
    drop policy if exists "unit_prices member read" on public.unit_prices;
  exception when others then null; end;
end$$;

-- Triggers
drop trigger if exists set_ffa_timeline_updated_at on public.ffa_timeline;

commit;
