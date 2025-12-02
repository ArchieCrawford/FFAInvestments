-- FFA Investments Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- 0) Clean up existing policies and triggers to make script re-runnable
drop policy if exists "profiles self view" on public.profiles;
drop policy if exists "profiles self update" on public.profiles;
drop policy if exists "profiles admin view all" on public.profiles;
drop policy if exists "orgs read member" on public.orgs;
drop policy if exists "orgs insert by user" on public.orgs;
drop policy if exists "orgs update owner_admin" on public.orgs;
drop policy if exists "org_members read self_org" on public.org_members;
drop policy if exists "org_members add by owner_admin" on public.org_members;
drop policy if exists "org_members update by owner_admin" on public.org_members;
drop policy if exists "ffa_timeline admin select" on public.ffa_timeline;
drop policy if exists "ffa_timeline admin insert" on public.ffa_timeline;
drop policy if exists "ffa_timeline admin update" on public.ffa_timeline;
drop policy if exists "ffa_timeline admin delete" on public.ffa_timeline;
drop policy if exists "ffa_timeline member read" on public.ffa_timeline;
drop policy if exists "unit_prices admin select" on public.unit_prices;
drop policy if exists "unit_prices admin insert" on public.unit_prices;
drop policy if exists "unit_prices admin update" on public.unit_prices;
drop policy if exists "unit_prices admin delete" on public.unit_prices;
drop policy if exists "unit_prices member read" on public.unit_prices;
drop policy if exists "member_accounts admin select" on public.member_accounts;
drop policy if exists "member_accounts admin insert" on public.member_accounts;
drop policy if exists "member_accounts admin update" on public.member_accounts;
drop policy if exists "member_accounts admin delete" on public.member_accounts;
drop policy if exists "member_accounts self read" on public.member_accounts;
drop policy if exists "transactions admin select" on public.transactions;
drop policy if exists "transactions admin insert" on public.transactions;
drop policy if exists "transactions admin update" on public.transactions;
drop policy if exists "transactions admin delete" on public.transactions;
drop policy if exists "transactions member read own" on public.transactions;
drop policy if exists "education_progress self manage" on public.education_progress;
drop policy if exists "education_progress admin view" on public.education_progress;
drop policy if exists "audit_log read self" on public.audit_log;
drop policy if exists "audit_log admin read all" on public.audit_log;
drop policy if exists "audit_log insert all" on public.audit_log;

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists set_profiles_updated_at on public.profiles;
drop trigger if exists set_ffa_timeline_updated_at on public.ffa_timeline;
drop trigger if exists set_member_accounts_updated_at on public.member_accounts;

-- 1) Ensure required extensions are available
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Admin checker function (security definer to bypass RLS)
-- Must be created BEFORE the policies that reference it
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and role = 'admin'
  );
$$;

-- 2) Standard Supabase Auth Schema (for user management)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text default 'member' check (role in ('admin', 'member')),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orgs (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

do $$ begin
  create type public.org_role as enum ('owner','admin','member','viewer');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.org_members (
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.org_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create table if not exists public.audit_log (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  meta jsonb not null default '{}'::jsonb,
  at timestamptz not null default now()
);

-- 3) FFA Specific Tables

-- FFA Timeline Data (your CSV data permanently stored)
create table if not exists public.ffa_timeline (
  id bigserial primary key,
  member_id uuid default uuid_generate_v4(),
  member_name text not null,
  report_month text not null,
  report_date date not null,
  portfolio_value decimal(15,2),
  total_units decimal(15,8),
  total_contribution decimal(15,2),
  ownership_pct decimal(8,6),
  portfolio_growth decimal(8,9),
  portfolio_growth_amount decimal(15,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unit Prices Table
create table if not exists public.unit_prices (
  id bigserial primary key,
  price_date date not null,
  unit_price decimal(10,4) not null,
  total_portfolio_value decimal(15,2),
  total_units decimal(15,8),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(price_date)
);

-- Members Table
create table if not exists public.members (
  id uuid primary key default uuid_generate_v4(),
  member_name text,
  full_name text,
  first_name text,
  last_name text,
  email text not null unique,
  role text not null default 'member' check (role in ('member','admin')),
  phone text,
  join_date date default current_date,
  membership_status text not null default 'active' check (membership_status in ('active','inactive','pending','invited')),
  dues_status text not null default 'pending' check (dues_status in ('current','overdue','pending')),
  last_payment_date date,
  notes text,
  auth_user_id uuid references auth.users(id),
  claimed_at timestamptz,
  invite_token text,
  invite_token_expires_at timestamptz,
  member_account_id uuid references public.member_accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_members_auth_user_id on public.members(auth_user_id);
create index if not exists idx_members_membership_status on public.members(membership_status);

-- Member Accounts Table
create table if not exists public.member_accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  member_name text not null,
  email text,
  current_units decimal(15,8) default 0,
  total_contributions decimal(15,2) default 0,
  current_value decimal(15,2) default 0,
  ownership_percentage decimal(8,6) default 0,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Transactions Table
create table if not exists public.transactions (
  id bigserial primary key,
  member_account_id uuid not null references public.member_accounts(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('contribution', 'withdrawal', 'unit_adjustment')),
  amount decimal(15,2),
  units decimal(15,8),
  unit_price decimal(10,4),
  transaction_date date not null default current_date,
  description text,
  processed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Education Progress Table
create table if not exists public.education_progress (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  lesson_name text not null,
  completed_at timestamptz,
  score decimal(5,2),
  time_spent_minutes integer,
  created_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);

-- 4) Row Level Security Policies

do $$ begin
  alter table public.profiles enable row level security;
exception when others then null;
end $$;

do $$ begin
  alter table public.orgs enable row level security;
exception when others then null;
end $$;

do $$ begin
  alter table public.org_members enable row level security;
exception when others then null;
end $$;

do $$ begin
  alter table public.audit_log enable row level security;
exception when others then null;
end $$;

do $$ begin
  alter table public.ffa_timeline enable row level security;
exception when others then null;
end $$;

do $$ begin
  alter table public.unit_prices enable row level security;
exception when others then null;
end $$;

do $$ begin
  alter table public.member_accounts enable row level security;
exception when others then null;
end $$;

do $$ begin
  alter table public.transactions enable row level security;
exception when others then null;
end $$;

do $$ begin
  alter table public.education_progress enable row level security;
exception when others then null;
end $$;

do $$ begin
  alter table public.members enable row level security;
exception when others then null;
end $$;

-- Profiles policies
create policy "profiles self view" on public.profiles
for select using (auth.uid() = id);

create policy "profiles self update" on public.profiles
for update using (auth.uid() = id);

create policy "profiles admin view all" on public.profiles
for select using (public.is_admin());

-- Orgs policies
create policy "orgs read member" on public.orgs
for select using (exists (
  select 1 from public.org_members m
  where m.org_id = orgs.id and m.user_id = auth.uid()
));

create policy "orgs insert by user" on public.orgs
for insert with check (created_by = auth.uid());

create policy "orgs update owner_admin" on public.orgs
for update using (exists (
  select 1 from public.org_members m
  where m.org_id = orgs.id and m.user_id = auth.uid() and m.role in ('owner','admin')
));

-- Org members policies
create policy "org_members read self_org" on public.org_members
for select using (exists (
  select 1 from public.org_members m
  where m.org_id = org_members.org_id and m.user_id = auth.uid()
));

create policy "org_members add by owner_admin" on public.org_members
for insert with check (exists (
  select 1 from public.org_members m
  where m.org_id = org_members.org_id and m.user_id = auth.uid() and m.role in ('owner','admin')
));

create policy "org_members update by owner_admin" on public.org_members
for update using (exists (
  select 1 from public.org_members m
  where m.org_id = org_members.org_id and m.user_id = auth.uid() and m.role in ('owner','admin')
));

-- FFA Timeline policies (admin read/write, members read-only)
create policy "ffa_timeline admin select" on public.ffa_timeline
for select using (public.is_admin());

create policy "ffa_timeline admin insert" on public.ffa_timeline
for insert with check (public.is_admin());

create policy "ffa_timeline admin update" on public.ffa_timeline
for update using (public.is_admin())
with check (public.is_admin());

create policy "ffa_timeline admin delete" on public.ffa_timeline
for delete using (public.is_admin());

create policy "ffa_timeline member read" on public.ffa_timeline
for select using (auth.uid() is not null);

-- Unit Prices policies
create policy "unit_prices admin select" on public.unit_prices
for select using (public.is_admin());

create policy "unit_prices admin insert" on public.unit_prices
for insert with check (public.is_admin());

create policy "unit_prices admin update" on public.unit_prices
for update using (public.is_admin())
with check (public.is_admin());

create policy "unit_prices admin delete" on public.unit_prices
for delete using (public.is_admin());

create policy "unit_prices member read" on public.unit_prices
for select using (auth.uid() is not null);

-- Member Accounts policies
create policy "member_accounts admin select" on public.member_accounts
for select using (public.is_admin());

create policy "member_accounts admin insert" on public.member_accounts
for insert with check (public.is_admin());

create policy "member_accounts admin update" on public.member_accounts
for update using (public.is_admin())
with check (public.is_admin());

create policy "member_accounts admin delete" on public.member_accounts
for delete using (public.is_admin());

create policy "member_accounts self read" on public.member_accounts
for select using (user_id = auth.uid());

-- Transactions policies
create policy "transactions admin select" on public.transactions
for select using (public.is_admin());

create policy "transactions admin insert" on public.transactions
for insert with check (public.is_admin());

create policy "transactions admin update" on public.transactions
for update using (public.is_admin())
with check (public.is_admin());

create policy "transactions admin delete" on public.transactions
for delete using (public.is_admin());

create policy "transactions member read own" on public.transactions
for select using (
  exists (
    select 1 from public.member_accounts ma 
    where ma.id = transactions.member_account_id and ma.user_id = auth.uid()
  )
);

-- Education Progress policies
create policy "education_progress self manage" on public.education_progress
for all using (user_id = auth.uid());

create policy "education_progress admin view" on public.education_progress
for select using (public.is_admin());

-- Audit Log policies
create policy "audit_log read self" on public.audit_log
for select using (user_id = auth.uid());

create policy "audit_log admin read all" on public.audit_log
for select using (public.is_admin());

create policy "audit_log insert all" on public.audit_log
for insert with check (auth.uid() is not null);

-- Members policies & claim helpers
revoke update on public.members from anon, authenticated;

drop policy if exists "Members can read all member info" on public.members;
drop policy if exists "Admins can manage members" on public.members;
drop policy if exists "Authenticated users can claim" on public.members;

create policy "Members can read all member info" on public.members
for select using (true);

create policy "Admins can manage members" on public.members
for all using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

create policy "Authenticated users can claim" on public.members
for update using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- 5) Triggers and Functions

-- Auto-update timestamps
create extension if not exists moddatetime schema extensions;

create trigger set_profiles_updated_at before update on public.profiles
for each row execute procedure extensions.moddatetime('updated_at');

create trigger set_ffa_timeline_updated_at before update on public.ffa_timeline
for each row execute procedure extensions.moddatetime('updated_at');

create trigger set_member_accounts_updated_at before update on public.member_accounts
for each row execute procedure extensions.moddatetime('updated_at');

-- Auto-create profile for new users
create or replace function public.handle_new_user()
returns trigger language plpgsql as $$
begin
  insert into public.profiles (id, display_name, avatar_url, role)
  values (
    new.id, 
    split_part(coalesce(new.raw_user_meta_data->>'name', new.email),'@',1), 
    null,
    case 
      when new.email = 'admin@ffa.com' then 'admin'
      when new.email = 'archie.crawford1@gmail.com' then 'admin'
  
    begin
      else 'member'
    end
  )
  on conflict (id) do nothing;
  return new;
end; $$;

create or replace function public.claim_member_for_current_user(member_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_member record;

  if v_user_id is null then
    raise exception using errcode = '42501', message = 'not_authenticated';
  end if;

  select id, email, auth_user_id, claimed_at
    into v_member
  from public.members
  where id = member_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'member_not_found';
  end if;

  if v_member.auth_user_id is not null and v_member.auth_user_id <> v_user_id then
    raise exception using errcode = 'P0001', message = 'already_claimed_by_another';
  end if;

  update public.members
  set auth_user_id = v_user_id,
      claimed_at = now(),
      updated_at = now()
  where id = member_id
  returning id, email, auth_user_id, claimed_at
  into v_member;

  return jsonb_build_object(
    'success', true,
    'member_id', v_member.id,
    'email', v_member.email,
    'claimed_at', v_member.claimed_at
  );
end;
$$;
-- Note: In some Supabase environments, creating triggers on auth.users may be restricted.
-- If the following trigger creation fails, you can:
-- 1. Use Supabase Auth webhooks to call handle_new_user via API
-- 2. Call handle_new_user manually after user creation
-- 3. Use Supabase Database Functions with auth.users events

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Function to recalculate member account values
create or replace function public.recalculate_member_values()
returns void language plpgsql as $$
declare
  latest_unit_price decimal(10,4);
begin
  -- Get the latest unit price
  select unit_price into latest_unit_price 
  from public.unit_prices 
  order by price_date desc 
  limit 1;
  
  if latest_unit_price is null then
    latest_unit_price := 35.68; -- Default from your data
  end if;
  
  -- Update all member account values
  update public.member_accounts 
  set 
    current_value = current_units * latest_unit_price,
    ownership_percentage = case 
      when (select sum(current_units) from public.member_accounts where is_active = true) > 0
      then current_units / (select sum(current_units) from public.member_accounts where is_active = true) * 100
      else 0
    end,
    updated_at = now();
end; $$;