-- Canonical members table for the club roster + claim metadata
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
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

-- Keep this table deterministic by revoking direct write access from client roles
revoke update on public.members from anon, authenticated;

-- Insert the member data you provided
INSERT INTO members (email, full_name, first_name, last_name, membership_status) VALUES
  ('pkirby@kirbycpa.com', 'Phillip Kirby', 'Phillip', 'Kirby', 'active'),
  ('lequan.hylton@gmail.com', 'LeQuan Hylton', 'LeQuan', 'Hylton', 'active'),
  ('james.erodgers@yahoo.com', 'James Rodgers', 'James', 'Rodgers', 'active'),
  ('rgwalt6145@aol.com', 'rgwalt6145', NULL, NULL, 'active'),
  ('faburrell1@verizon.net', 'Felecia Burrell', 'Felecia', 'Burrell', 'active'),
  ('beulenner@aol.com', 'beulenner', NULL, NULL, 'active'),
  ('foursharpes@yahoo.com', 'FAMILY SHARPE', 'FAMILY', 'SHARPE', 'active'),
  ('2000nupsi07@gmail.com', 'Dante Jackson', 'Dante', 'Jackson', 'active'),
  ('mnichols818@hotmail.com', 'Milton Nichols', 'Milton', 'Nichols', 'active'),
  ('jessewalker318@gmail.com', 'jessewalker318', NULL, NULL, 'active'),
  ('luther.robinson1@gmail.com', 'Luther Robinson', 'Luther', 'Robinson', 'active'),
  ('davybeave@aol.com', 'davybeave', NULL, NULL, 'active'),
  ('clifftaylor20@gmail.com', 'clifftaylor20', NULL, NULL, 'active'),
  ('kristenkirby22@gmail.com', 'Kristen Greene', 'Kristen', 'Greene', 'active'),
  ('kadih1@msn.com', 'Kofi Adih', 'Kofi', 'Adih', 'active'),
  ('shedrickmccall@gmail.com', 'Shedrick McCall', 'Shedrick', 'McCall', 'active'),
  ('abck115@aol.com', 'abck115', NULL, NULL, 'active'),
  ('joeljean86@hotmail.com', 'Joel Jean', 'Joel', 'Jean', 'active'),
  ('miltonmnichols2@gmail.com', 'Milton Nichols', 'Milton', 'Nichols', 'active'),
  ('donotreply.resumebuilder@asamra.hoffman.army.mil', 'Asamra Hoffman Army Donotreply.resumebuilder', 'Asamra', 'Hoffman', 'active'),
  ('archie.crawford1@gmail.com', 'archie.crawford1', NULL, NULL, 'active'),
  ('chillman38@aol.com', 'chillman38', NULL, NULL, 'active')
ON CONFLICT (email) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Create policies for member access
drop policy if exists "Members can read all member info" on public.members;
drop policy if exists "Admins can manage members" on public.members;
drop policy if exists "Members can claim themselves" on public.members;

create policy "Members can read all member info" on public.members
  for select using (true);

create policy "Admins can manage members" on public.members
  for all using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() 
        and profiles.role = 'admin'
    )
  );

create policy "Authenticated users can claim" on public.members
  for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');