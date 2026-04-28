-- Add deposits table to track Zelle/wire deposits made by members.
-- Source: Argent Credit Union deposit notification emails.
--
-- Apply via Supabase SQL editor or `supabase db push`.

begin;

create table if not exists public.deposits (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete set null,
  sender_name text not null,
  amount numeric(12,2) not null check (amount >= 0),
  confirmation_number text unique,
  deposit_date date not null,
  deposit_at timestamptz,
  source text not null default 'zelle',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists deposits_member_id_idx on public.deposits(member_id);
create index if not exists deposits_deposit_date_idx on public.deposits(deposit_date desc);
create index if not exists deposits_sender_name_idx on public.deposits(lower(sender_name));

-- Keep updated_at fresh
create or replace function public.set_deposits_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_deposits_updated_at on public.deposits;
create trigger set_deposits_updated_at
  before update on public.deposits
  for each row execute function public.set_deposits_updated_at();

-- Row level security
alter table public.deposits enable row level security;

-- Admin: full access
drop policy if exists "deposits admin all" on public.deposits;
create policy "deposits admin all" on public.deposits
  for all
  using (
    exists (
      select 1 from public.members m
      where m.auth_user_id = auth.uid()
        and m.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.members m
      where m.auth_user_id = auth.uid()
        and m.role = 'admin'
    )
  );

-- Member: read only their own deposits
drop policy if exists "deposits member read own" on public.deposits;
create policy "deposits member read own" on public.deposits
  for select
  using (
    member_id in (
      select id from public.members where auth_user_id = auth.uid()
    )
  );

commit;
