-- Add RLS policies to org_balance_history for authenticated users
-- Allows SELECT and INSERT on all rows for any authenticated user

create policy if not exists org_balance_history_select_auth
on public.org_balance_history
for select
to authenticated
using (true);

create policy if not exists org_balance_history_insert_auth
on public.org_balance_history
for insert
to authenticated
with check (true);
