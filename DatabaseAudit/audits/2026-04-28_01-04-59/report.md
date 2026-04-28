# Database Audit

- **Database**: `postgres`
- **Connected as**: `postgres`
- **Server time**: 2026-04-28T01:05:00.747Z
- **Postgres**: PostgreSQL 17.6 on aarch64-unknown-linux-gnu
- **Schemas audited**: `public`
- **Row sample size**: 25 rows/table
- **Generated**: 2026-04-28_01-04-59

## Table sizes

| Schema | Table | Est. Rows | Total | Table | Indexes |
|---|---|---:|---:|---:|---:|
| public | `schwab_positions` | 1,858 | 992 kB | 696 kB | 256 kB |
| public | `schwab_account_snapshots` | 18 | 328 kB | 16 kB | 80 kB |
| public | `meeting_report_members` | 417 | 320 kB | 128 kB | 152 kB |
| public | `members` | 22 | 128 kB | 8192 bytes | 80 kB |
| public | `schwab_tokens` | 51 | 120 kB | 40 kB | 48 kB |
| public | `deposits` | -1 | 96 kB | 8192 bytes | 80 kB |
| public | `schwab_accounts` | 1 | 96 kB | 8192 bytes | 48 kB |
| public | `staging_ffa_timeline` | 403 | 96 kB | 48 kB | 16 kB |
| public | `meeting_report_members_import` | 417 | 80 kB | 48 kB | 0 bytes |
| public | `org_balance_history` | 4 | 80 kB | 8192 bytes | 64 kB |
| public | `club_unit_valuations` | -1 | 64 kB | 8192 bytes | 48 kB |
| public | `member_accounts` | 23 | 64 kB | 8192 bytes | 48 kB |
| public | `security_master` | 28 | 64 kB | 8192 bytes | 16 kB |
| public | `org_documents` | -1 | 64 kB | 8192 bytes | 48 kB |
| public | `meeting_reports` | 21 | 56 kB | 8192 bytes | 48 kB |
| public | `staging_member_monthly_balances` | 385 | 48 kB | 24 kB | 0 bytes |
| public | `member_dues` | -1 | 48 kB | 8192 bytes | 32 kB |
| public | `member_to_auth` | -1 | 48 kB | 8192 bytes | 32 kB |
| public | `member_name_aliases` | -1 | 48 kB | 8192 bytes | 32 kB |
| public | `member_post_likes` | -1 | 40 kB | 8192 bytes | 32 kB |
| public | `member_invite_logs` | -1 | 32 kB | 0 bytes | 24 kB |
| public | `member_post_comments` | -1 | 32 kB | 8192 bytes | 16 kB |
| public | `payment_history` | -1 | 32 kB | 0 bytes | 24 kB |
| public | `unit_prices` | -1 | 32 kB | 0 bytes | 24 kB |
| public | `user` | -1 | 32 kB | 8192 bytes | 16 kB |
| public | `member_posts` | -1 | 32 kB | 8192 bytes | 16 kB |
| public | `token_meta` | -1 | 32 kB | 8192 bytes | 16 kB |
| public | `profiles` | -1 | 32 kB | 8192 bytes | 16 kB |
| public | `club_settings` | -1 | 32 kB | 8192 bytes | 16 kB |
| public | `member_portfolio_data` | -1 | 24 kB | 0 bytes | 24 kB |
| public | `member_personal_data` | -1 | 24 kB | 0 bytes | 16 kB |
| public | `member_unit_transactions` | -1 | 24 kB | 0 bytes | 16 kB |
| public | `staging_member_dues` | -1 | 16 kB | 8192 bytes | 0 bytes |
| public | `email_queue` | -1 | 16 kB | 0 bytes | 8192 bytes |
| public | `schwab_raw_account_responses` | -1 | 16 kB | 0 bytes | 8192 bytes |
| public | `schwab_accounts_import` | -1 | 16 kB | 8192 bytes | 0 bytes |
| public | `members_backup` | -1 | 16 kB | 8192 bytes | 0 bytes |
| public | `schwab_positions_import` | -1 | 16 kB | 8192 bytes | 0 bytes |
| public | `member_login_logs` | -1 | 16 kB | 0 bytes | 8192 bytes |
| public | `tickers` | -1 | 16 kB | 0 bytes | 8192 bytes |
| public | `prices_daily` | -1 | 16 kB | 0 bytes | 8192 bytes |
| public | `financials_annual` | -1 | 16 kB | 0 bytes | 8192 bytes |
| public | `ratios_annual` | -1 | 16 kB | 0 bytes | 8192 bytes |
| public | `groups` | -1 | 16 kB | 0 bytes | 8192 bytes |
| public | `group_members` | -1 | 16 kB | 0 bytes | 8192 bytes |
| public | `ffa_timeline` | -1 | 16 kB | 0 bytes | 8192 bytes |
| public | `watchlists` | -1 | 16 kB | 0 bytes | 8192 bytes |
| public | `watchlist_items` | -1 | 16 kB | 0 bytes | 8192 bytes |
| public | `notes` | -1 | 16 kB | 0 bytes | 8192 bytes |

## Exact row counts (public schema)

| Table | Rows |
|---|---:|
| `schwab_positions` | 1,936 |
| `meeting_report_members` | 417 |
| `meeting_report_members_import` | 417 |
| `staging_ffa_timeline` | 403 |
| `staging_member_monthly_balances` | 385 |
| `schwab_tokens` | 105 |
| `schwab_positions_import` | 30 |
| `org_balance_history` | 28 |
| `security_master` | 28 |
| `deposits` | 26 |
| `member_name_aliases` | 25 |
| `member_accounts` | 23 |
| `members` | 22 |
| `members_backup` | 22 |
| `meeting_reports` | 21 |
| `user` | 21 |
| `profiles` | 21 |
| `member_dues` | 20 |
| `staging_member_dues` | 20 |
| `schwab_account_snapshots` | 19 |
| `member_to_auth` | 18 |
| `org_documents` | 2 |
| `member_posts` | 2 |
| `token_meta` | 2 |
| `schwab_accounts` | 1 |
| `club_unit_valuations` | 1 |
| `member_post_likes` | 1 |
| `member_post_comments` | 1 |
| `club_settings` | 1 |
| `schwab_accounts_import` | 1 |
| `member_invite_logs` | 0 |
| `payment_history` | 0 |
| `unit_prices` | 0 |
| `member_portfolio_data` | 0 |
| `member_personal_data` | 0 |
| `member_unit_transactions` | 0 |
| `email_queue` | 0 |
| `schwab_raw_account_responses` | 0 |
| `member_login_logs` | 0 |
| `tickers` | 0 |
| `prices_daily` | 0 |
| `financials_annual` | 0 |
| `ratios_annual` | 0 |
| `groups` | 0 |
| `group_members` | 0 |
| `ffa_timeline` | 0 |
| `watchlists` | 0 |
| `watchlist_items` | 0 |
| `notes` | 0 |

## Schema details

### `public.schwab_positions`

- **Rows (est.)**: 1,858 • **Total size**: 992 kB
- **Primary key**: `{id}`
- **RLS enabled**: ✅ yes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint(64,0) | NO | `nextval('schwab_positions_id_seq'::regclass)` |
| `balance_date` | date | YES |  |
| `account_number` | text | NO |  |
| `symbol` | text | NO |  |
| `cusip` | text | YES |  |
| `asset_type` | text | YES |  |
| `quantity` | numeric(18,6) | YES |  |
| `market_value` | numeric(18,2) | YES |  |
| `average_price` | numeric(18,6) | YES |  |
| `current_day_profit_loss` | numeric(18,2) | YES |  |
| `current_day_profit_loss_pct` | numeric(9,4) | YES |  |
| `created_at` | timestamp with time zone | YES | `now()` |
| `as_of_date` | date | YES |  |
| `raw_json` | jsonb | YES |  |
| `snapshot_date` | timestamp with time zone | YES |  |
| `description` | text | YES |  |
| `long_quantity` | numeric | YES |  |
| `short_quantity` | numeric | YES |  |
| `current_day_pl` | numeric | YES |  |
| `current_day_pl_pct` | numeric | YES |  |
| `cost_basis` | numeric | YES |  |

**RLS policies**
- `insert_schwab_positions_for_authenticated` (INSERT) — using: `—` with check: `true`
- `read_schwab_positions_for_authenticated` (SELECT) — using: `true` 
- `schwab_positions_delete_admin_only` (DELETE) — using: `is_admin()` 
- `schwab_positions_insert_admin_only` (INSERT) — using: `—` with check: `is_admin()`
- `schwab_positions_read_all` (SELECT) — using: `true` 
- `schwab_positions_update_admin_only` (UPDATE) — using: `is_admin()` with check: `is_admin()`
- `select_authenticated_all_public_schwab_positions` (SELECT) — using: `true` 
- `select_public_all_public_schwab_positions` (SELECT) — using: `true` 

### `public.schwab_account_snapshots`

- **Rows (est.)**: 18 • **Total size**: 328 kB
- **Primary key**: `{id}`
- **RLS enabled**: ❌ no

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `account_id` | uuid | YES |  |
| `snapshot_date` | date | NO |  |
| `liquidation_value` | numeric | YES |  |
| `cash_balance` | numeric | YES |  |
| `raw_json` | jsonb | YES |  |
| `created_at` | timestamp with time zone | NO | `now()` |
| `account_number` | text | YES |  |
| `money_market_fund` | numeric | YES |  |
| `long_stock_value` | numeric | YES |  |
| `long_option_value` | numeric | YES |  |
| `mutual_fund_value` | numeric | YES |  |
| `long_marginable_value` | numeric | YES |  |
| `long_non_marginable_value` | numeric | YES |  |
| `total_cash` | numeric | YES |  |
| `current_liquidation_value` | numeric | YES |  |

**Foreign keys**
- `account_id` → `public.schwab_accounts.id` _(constraint `schwab_account_snapshots_account_id_fkey`)_

**RLS policies**
- `insert_schwab_snapshots_for_authenticated` (INSERT) — using: `—` with check: `true`
- `read_schwab_snapshots_for_authenticated` (SELECT) — using: `true` 

### `public.meeting_report_members`

- **Rows (est.)**: 417 • **Total size**: 320 kB
- **Primary key**: `{id}`
- **RLS enabled**: ❌ no

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `meeting_report_id` | uuid | NO |  |
| `member_id` | uuid | YES |  |
| `member_name` | text | NO |  |
| `dues_paid_buyout` | numeric(18,2) | YES |  |
| `dues_owed` | numeric(18,2) | YES |  |
| `total_contribution` | numeric(18,2) | YES |  |
| `previous_units` | numeric(18,8) | YES |  |
| `units_added` | numeric(18,8) | YES |  |
| `total_units` | numeric(18,8) | YES |  |
| `portfolio_value` | numeric(18,2) | YES |  |
| `ownership_pct_of_club` | numeric(18,8) | YES |  |
| `created_at` | timestamp with time zone | YES | `now()` |

**Foreign keys**
- `meeting_report_id` → `public.meeting_reports.id` _(constraint `meeting_report_members_meeting_report_id_fkey`)_
- `member_id` → `public.members.id` _(constraint `meeting_report_members_member_id_fkey`)_

### `public.members`

- **Rows (est.)**: 22 • **Total size**: 128 kB
- **Primary key**: `{id}`
- **RLS enabled**: ✅ yes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `external_short_id` | integer(32,0) | YES |  |
| `member_name` | text | NO |  |
| `email` | text | YES |  |
| `status` | text | YES |  |
| `phone` | text | YES |  |
| `preferred_email` | text | YES |  |
| `email_opt_in` | boolean | YES |  |
| `join_date` | date | YES |  |
| `notes` | text | YES |  |
| `created_at` | timestamp with time zone | YES | `now()` |
| `role` | text | YES | `'member'::text` |
| `auth_user_id` | uuid | YES |  |
| `claimed_at` | timestamp with time zone | YES |  |
| `is_active` | boolean | YES | `true` |
| `deleted_at` | timestamp with time zone | YES |  |

**RLS policies**
- `members_admin_all` (ALL) — using: `is_admin()` with check: `is_admin()`
- `members_read_self` (SELECT) — using: `(auth_user_id = auth.uid())` 
- `members_select_authenticated_all` (SELECT) — using: `true` 
- `members_select_public_all` (SELECT) — using: `true` 
- `members_self_select` (SELECT) — using: `((auth.uid() IS NOT NULL) AND (auth.uid() = auth_user_id))` 
- `select_authenticated_all_public_members` (SELECT) — using: `true` 
- `select_public_all_public_members` (SELECT) — using: `true` 

### `public.schwab_tokens`

- **Rows (est.)**: 51 • **Total size**: 120 kB
- **Primary key**: `{id}`
- **RLS enabled**: ✅ yes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint(64,0) | NO | `nextval('schwab_tokens_id_seq'::regclass)` |
| `access_token` | text | YES |  |
| `refresh_token` | text | YES |  |
| `expires_in` | integer(32,0) | YES |  |
| `scope` | text | YES |  |
| `token_type` | text | YES |  |
| `received_at` | timestamp with time zone | NO | `now()` |
| `state` | text | YES |  |

**RLS policies**
- `allow_service_role_only` (ALL) — using: `(auth.role() = 'service_role'::text)` with check: `(auth.role() = 'service_role'::text)`

### `public.deposits`

- **Rows (est.)**: -1 • **Total size**: 96 kB
- **Primary key**: `{id}`
- **RLS enabled**: ✅ yes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `member_id` | uuid | YES |  |
| `sender_name` | text | NO |  |
| `amount` | numeric(12,2) | NO |  |
| `confirmation_number` | text | YES |  |
| `deposit_date` | date | NO |  |
| `deposit_at` | timestamp with time zone | YES |  |
| `source` | text | NO | `'zelle'::text` |
| `notes` | text | YES |  |
| `created_at` | timestamp with time zone | NO | `now()` |
| `updated_at` | timestamp with time zone | NO | `now()` |

**Foreign keys**
- `member_id` → `public.members.id` _(constraint `deposits_member_id_fkey`)_

**RLS policies**
- `deposits admin all` (ALL) — using: `(EXISTS ( SELECT 1
   FROM members m
  WHERE ((m.auth_user_id = auth.uid()) AND (m.role = 'admin'::text))))` with check: `(EXISTS ( SELECT 1
   FROM members m
  WHERE ((m.auth_user_id = auth.uid()) AND (m.role = 'admin'::text))))`
- `deposits member read own` (SELECT) — using: `(member_id IN ( SELECT members.id
   FROM members
  WHERE (members.auth_user_id = auth.uid())))` 

### `public.schwab_accounts`

- **Rows (est.)**: 1 • **Total size**: 96 kB
- **Primary key**: `{id}`
- **RLS enabled**: ❌ no

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `account_number` | text | NO |  |
| `account_type` | text | YES |  |
| `display_name` | text | YES |  |
| `created_at` | timestamp with time zone | NO | `now()` |
| `account_hash` | text | YES |  |
| `last_updated_at` | timestamp with time zone | YES | `now()` |

**RLS policies**
- `insert_schwab_accounts_for_authenticated` (INSERT) — using: `—` with check: `true`
- `read_schwab_accounts_for_authenticated` (SELECT) — using: `true` 

### `public.staging_ffa_timeline`

- **Rows (est.)**: 403 • **Total size**: 96 kB
- **Primary key**: `{id}`
- **RLS enabled**: ❌ no

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint(64,0) | NO | `nextval('staging_ffa_timeline_id_seq'::regclass)` |
| `member_name` | text | YES |  |
| `report_month` | text | YES |  |
| `report_date` | text | YES |  |
| `portfolio_value` | text | YES |  |
| `total_units` | text | YES |  |
| `total_contribution` | text | YES |  |
| `ownership_pct` | text | YES |  |
| `portfolio_growth` | text | YES |  |
| `portfolio_growth_amount` | text | YES |  |
| `imported_at` | timestamp with time zone | YES | `now()` |

### `public.meeting_report_members_import`

- **Rows (est.)**: 417 • **Total size**: 80 kB
- **RLS enabled**: ❌ no

| Column | Type | Nullable | Default |
|---|---|---|---|
| `report_month` | date | YES |  |
| `member_name` | text | YES |  |
| `dues_paid_buyout` | numeric | YES |  |
| `dues_owed` | numeric | YES |  |
| `total_contribution` | numeric | YES |  |
| `previous_units` | numeric | YES |  |
| `units_added` | numeric | YES |  |
| `total_units` | numeric | YES |  |
| `portfolio_value` | numeric | YES |  |
| `ownership_pct_of_club` | numeric | YES |  |

### `public.org_balance_history`

- **Rows (est.)**: 4 • **Total size**: 80 kB
- **Primary key**: `{id}`
- **RLS enabled**: ✅ yes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint(64,0) | NO | `nextval('org_balance_history_id_seq'::regclass)` |
| `balance_date` | date | NO |  |
| `stock_value` | numeric(18,2) | YES |  |
| `schwab_cash` | numeric(18,2) | YES |  |
| `schwab_mm` | numeric(18,2) | YES |  |
| `credit_union_cash` | numeric(18,2) | YES |  |
| `total_value` | numeric(18,2) | YES |  |
| `created_at` | timestamp with time zone | YES | `now()` |
| `source` | text | YES |  |
| `cash_value` | numeric | YES |  |
| `positions_value` | numeric | YES |  |
| `metadata` | jsonb | YES |  |

**RLS policies**
- `orgbal_admin_all` (ALL) — using: `is_admin()` with check: `is_admin()`
- `select_authenticated_all_public_org_balance_history` (SELECT) — using: `true` 
- `select_public_all_public_org_balance_history` (SELECT) — using: `true` 

### `public.club_unit_valuations`

- **Rows (est.)**: -1 • **Total size**: 64 kB
- **Primary key**: `{id}`
- **RLS enabled**: ❌ no

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `valuation_date` | date | NO |  |
| `total_value` | numeric | NO |  |
| `total_units_outstanding` | numeric | NO |  |
| `unit_value` | numeric | NO |  |
| `created_at` | timestamp with time zone | YES | `now()` |

### `public.member_accounts`

- **Rows (est.)**: 23 • **Total size**: 64 kB
- **Primary key**: `{id}`
- **RLS enabled**: ✅ yes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `member_id` | uuid | YES |  |
| `member_name` | text | NO |  |
| `email` | text | YES |  |
| `current_units` | numeric(15,8) | YES | `0` |
| `total_contributions` | numeric(15,2) | YES | `0` |
| `current_value` | numeric(15,2) | YES | `0` |
| `ownership_percentage` | numeric(8,6) | YES | `0` |
| `is_active` | boolean | YES | `true` |
| `created_at` | timestamp with time zone | NO | `now()` |
| `updated_at` | timestamp with time zone | NO | `now()` |

**RLS policies**
- `member_accounts admin delete` (DELETE) — using: `is_admin()` 
- `member_accounts admin full access` (ALL) — using: `(EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text))))` 
- `member_accounts admin insert` (INSERT) — using: `—` with check: `is_admin()`
- `member_accounts admin select` (SELECT) — using: `is_admin()` 
- `member_accounts admin update` (UPDATE) — using: `is_admin()` with check: `is_admin()`
- `member_accounts self read` (SELECT) — using: `(member_id = auth.uid())` 
- `select_authenticated_all_public_member_accounts` (SELECT) — using: `true` 
- `select_public_all_public_member_accounts` (SELECT) — using: `true` 

### `public.security_master`

- **Rows (est.)**: 28 • **Total size**: 64 kB
- **Primary key**: `{symbol}`
- **RLS enabled**: ❌ no

| Column | Type | Nullable | Default |
|---|---|---|---|
| `symbol` | text | NO |  |
| `name` | text | YES |  |
| `last_checked_at` | timestamp with time zone | YES | `now()` |

### `public.org_documents`

- **Rows (est.)**: -1 • **Total size**: 64 kB
- **Primary key**: `{id}`
- **RLS enabled**: ✅ yes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `bucket` | text | NO |  |
| `path` | text | NO |  |
| `file_name` | text | NO |  |
| `mime_type` | text | YES |  |
| `size` | bigint(64,0) | YES |  |
| `uploaded_by` | uuid | YES |  |
| `org_id` | uuid | YES |  |
| `created_at` | timestamp with time zone | NO | `now()` |

**RLS policies**
- `Org docs insert (admins)` (INSERT) — using: `—` with check: `(EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text))))`
- `Org docs select (admins)` (SELECT) — using: `(EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text))))` 

### `public.meeting_reports`

- **Rows (est.)**: 21 • **Total size**: 56 kB
- **Primary key**: `{id}`
- **RLS enabled**: ❌ no

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `report_month` | date | NO |  |
| `stock_value` | numeric(18,2) | YES |  |
| `cash_credit_union` | numeric(18,2) | YES |  |
| `cash_schwab` | numeric(18,2) | YES |  |
| `cash_schwab_mm` | numeric(18,2) | YES |  |
| `cash_total_value` | numeric(18,2) | YES |  |
| `portfolio_total_value` | numeric(18,2) | YES |  |
| `total_units_outstanding` | numeric(18,8) | YES |  |
| `unit_value` | numeric(18,8) | YES |  |
| `total_dues_paid` | numeric(18,2) | YES |  |
| `total_dues_owed` | numeric(18,2) | YES |  |
| `total_member_contribution` | numeric(18,2) | YES |  |
| `total_member_previous_units` | numeric(18,8) | YES |  |
| `total_member_units_added` | numeric(18,8) | YES |  |
| `total_member_units` | numeric(18,8) | YES |  |
| `total_member_portfolio_value` | numeric(18,2) | YES |  |
| `created_at` | timestamp with time zone | YES | `now()` |

### `public.staging_member_monthly_balances`

- **Rows (est.)**: 385 • **Total size**: 48 kB
- **RLS enabled**: ❌ no

| Column | Type | Nullable | Default |
|---|---|---|---|
| `external_short_id` | integer(32,0) | YES |  |
| `report_date` | date | YES |  |
| `portfolio_value` | numeric(18,2) | YES |  |
| `total_units` | numeric(18,8) | YES |  |
| `total_contribution` | numeric(18,2) | YES |  |
| `growth_amount` | numeric(18,2) | YES |  |
| `growth_pct` | numeric(9,6) | YES |  |

### `public.member_dues`

- **Rows (est.)**: -1 • **Total size**: 48 kB
- **Primary key**: `{id}`
- **RLS enabled**: ✅ yes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint(64,0) | NO | `nextval('member_dues_id_seq'::regclass)` |
| `member_id` | uuid | NO |  |
| `dues_paid_buyout` | numeric(18,2) | NO |  |
| `dues_owed_oct_25` | numeric(18,2) | NO |  |
| `total_contribution` | numeric(18,2) | YES |  |
| `notes` | text | YES |  |
| `created_at` | timestamp with time zone | YES | `now()` |

**Foreign keys**
- `member_id` → `public.members.id` _(constraint `member_dues_member_id_fkey`)_

**RLS policies**
- `dues_admin_all` (ALL) — using: `is_admin()` with check: `is_admin()`
- `dues_self_select` (SELECT) — using: `((auth.uid() IS NOT NULL) AND (member_id IN ( SELECT members.id
   FROM members
  WHERE (members.auth_user_id = auth.uid()))))` 
- `select_authenticated_all_public_member_dues` (SELECT) — using: `true` 
- `select_public_all_public_member_dues` (SELECT) — using: `true` 

### `public.member_to_auth`

- **Rows (est.)**: -1 • **Total size**: 48 kB
- **Primary key**: `{id}`
- **RLS enabled**: ❌ no

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `member_id` | uuid | NO |  |
| `auth_user_id` | uuid | YES |  |
| `email` | text | YES |  |
| `status` | text | YES |  |
| `created_at` | timestamp with time zone | YES | `now()` |
| `updated_at` | timestamp with time zone | YES | `now()` |

**Foreign keys**
- `member_id` → `public.members.id` _(constraint `member_to_auth_member_id_fkey`)_

### `public.member_name_aliases`

- **Rows (est.)**: -1 • **Total size**: 48 kB
- **Primary key**: `{id}`
- **RLS enabled**: ❌ no

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint(64,0) | NO | `nextval('member_name_aliases_id_seq'::regclass)` |
| `canonical_member_id` | uuid | YES |  |
| `canonical_member_name` | text | YES |  |
| `alias` | text | NO |  |
| `created_at` | timestamp with time zone | YES | `now()` |

### `public.member_post_likes`

- **Rows (est.)**: -1 • **Total size**: 40 kB
- **Primary key**: `{id}`
- **RLS enabled**: ✅ yes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `post_id` | uuid | NO |  |
| `member_id` | uuid | NO |  |
| `created_at` | timestamp with time zone | YES | `now()` |

**Foreign keys**
- `post_id` → `public.member_posts.id` _(constraint `member_post_likes_post_id_fkey`)_

**RLS policies**
- `member_post_likes_delete_own_or_admin` (DELETE) — using: `((member_id = auth.uid()) OR is_admin())` 
- `member_post_likes_insert_own` (INSERT) — using: `—` with check: `(member_id = auth.uid())`
- `member_post_likes_select_all` (SELECT) — using: `true` 
- `select_authenticated_all_public_member_post_likes` (SELECT) — using: `true` 
- `select_public_all_public_member_post_likes` (SELECT) — using: `true` 

### `public.member_invite_logs`

- **Rows (est.)**: -1 • **Total size**: 32 kB
- **Primary key**: `{id}`
- **RLS enabled**: ❌ no

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `member_id` | uuid | YES |  |
| `email` | text | NO |  |
| `claim_link` | text | NO |  |
| `status` | text | NO |  |
| `http_status` | integer(32,0) | YES |  |
| `error_message` | text | YES |  |
| `sent_at` | timestamp with time zone | NO | `now()` |

**Foreign keys**
- `member_id` → `public.members.id` _(constraint `member_invite_logs_member_id_fkey`)_

### `public.member_post_comments`

- **Rows (est.)**: -1 • **Total size**: 32 kB
- **Primary key**: `{id}`
- **RLS enabled**: ✅ yes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `post_id` | uuid | NO |  |
| `author_id` | uuid | NO |  |
| `content` | text | YES |  |
| `created_at` | timestamp with time zone | YES | `now()` |

**Foreign keys**
- `author_id` → `public.profiles.id` _(constraint `member_post_comments_author_id_fkey`)_
- `post_id` → `public.member_posts.id` _(constraint `member_post_comments_post_id_fkey`)_

**RLS policies**
- `member_post_comments_delete_own_or_admin` (DELETE) — using: `((author_id = auth.uid()) OR is_admin())` 
- `member_post_comments_insert_own` (INSERT) — using: `—` with check: `(author_id = auth.uid())`
- `member_post_comments_select_all` (SELECT) — using: `true` 
- `select_authenticated_all_public_member_post_comments` (SELECT) — using: `true` 
- `select_public_all_public_member_post_comments` (SELECT) — using: `true` 

### `public.payment_history`

- **Rows (est.)**: -1 • **Total size**: 32 kB
- **Primary key**: `{id}`
- **RLS enabled**: ✅ yes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `member_id` | uuid | YES |  |
| `amount` | numeric(12,2) | NO |  |
| `payment_type` | character varying(50) | NO |  |
| `payment_method` | character varying(50) | YES |  |
| `payment_date` | date | NO |  |
| `description` | text | YES |  |
| `processed_by` | character varying(255) | YES |  |
| `created_at` | timestamp with time zone | YES | `now()` |

**RLS policies**
- `Admins can manage payment history` (ALL) — using: `((auth.jwt() ->> 'role'::text) = 'admin'::text)` 
- `Users can view all payment history` (SELECT) — using: `true` 
- `select_authenticated_all_public_payment_history` (SELECT) — using: `true` 

### `public.unit_prices`

- **Rows (est.)**: -1 • **Total size**: 32 kB
- **Primary key**: `{id}`
- **RLS enabled**: ❌ no

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `price_date` | date | NO |  |
| `unit_price` | numeric | NO |  |
| `created_at` | timestamp with time zone | NO | `now()` |

### `public.user`

- **Rows (est.)**: -1 • **Total size**: 32 kB
- **Primary key**: `{uid}`
- **RLS enabled**: ❌ no

| Column | Type | Nullable | Default |
|---|---|---|---|
| `uid` | uuid | NO |  |
| `email` | text | YES |  |
| `displayName` | text | YES |  |
| `photoURL` | text | YES |  |
| `avatar_path` | text | YES |  |
| `bio` | text | YES |  |
| `username` | text | YES |  |
| `followingCount` | integer(32,0) | YES | `0` |
| `followersCount` | integer(32,0) | YES | `0` |
| `likesCount` | integer(32,0) | YES | `0` |
| `created_at` | timestamp with time zone | YES | `now()` |

### `public.member_posts`

- **Rows (est.)**: -1 • **Total size**: 32 kB
- **Primary key**: `{id}`
- **RLS enabled**: ✅ yes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `author_id` | uuid | NO |  |
| `content` | text | YES |  |
| `image_url` | text | YES |  |
| `link_url` | text | YES |  |
| `visibility` | text | NO | `'club'::text` |
| `created_at` | timestamp with time zone | YES | `now()` |
| `updated_at` | timestamp with time zone | YES | `now()` |

**Foreign keys**
- `author_id` → `public.profiles.id` _(constraint `member_posts_author_id_fkey`)_

**RLS policies**
- `Users can insert their own posts` (INSERT) — using: `—` with check: `(auth.uid() = author_id)`
- `member_posts_delete_own_or_admin` (DELETE) — using: `((author_id = auth.uid()) OR is_admin())` 
- `member_posts_insert_own` (INSERT) — using: `—` with check: `(author_id = auth.uid())`
- `member_posts_own_author_only` (INSERT) — using: `—` with check: `(author_id = auth.uid())`
- `member_posts_read_all` (SELECT) — using: `true` 
- `member_posts_select_visible` (SELECT) — using: `((visibility = ANY (ARRAY['public'::text, 'club'::text])) OR ((visibility = 'admin'::text) AND is_admin()))` 
- `member_posts_update_own_or_admin` (UPDATE) — using: `((author_id = auth.uid()) OR is_admin())` with check: `((author_id = auth.uid()) OR is_admin())`
- `select_authenticated_all_public_member_posts` (SELECT) — using: `true` 
- `select_public_all_public_member_posts` (SELECT) — using: `true` 

### `public.token_meta`

- **Rows (est.)**: -1 • **Total size**: 32 kB
- **Primary key**: `{address}`
- **RLS enabled**: ❌ no

| Column | Type | Nullable | Default |
|---|---|---|---|
| `address` | text | NO |  |
| `symbol` | text | YES |  |
| `decimals` | integer(32,0) | NO |  |
| `updated_at` | timestamp with time zone | YES | `now()` |

### `public.profiles`

- **Rows (est.)**: -1 • **Total size**: 32 kB
- **Primary key**: `{id}`
- **RLS enabled**: ✅ yes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO |  |
| `display_name` | text | YES |  |
| `avatar_url` | text | YES |  |
| `role` | text | YES | `'member'::text` |
| `settings` | jsonb | NO | `'{}'::jsonb` |
| `created_at` | timestamp with time zone | NO | `now()` |
| `updated_at` | timestamp with time zone | NO | `now()` |

**RLS policies**
- `profiles admin view all` (SELECT) — using: `is_admin()` 
- `profiles self update` (UPDATE) — using: `(auth.uid() = id)` 
- `profiles self view` (SELECT) — using: `(auth.uid() = id)` 
- `select_authenticated_all_public_profiles` (SELECT) — using: `true` 
- `select_public_all_public_profiles` (SELECT) — using: `true` 

### `public.club_settings`

- **Rows (est.)**: -1 • **Total size**: 32 kB
- **Primary key**: `{id}`
- **RLS enabled**: ✅ yes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `club_name` | text | NO | `'FFA Investments'::text` |
| `tagline` | text | YES |  |
| `homepage_message` | text | YES |  |
| `welcome_message` | text | YES |  |
| `dues_info` | text | YES |  |
| `contact_email` | text | YES |  |
| `meeting_schedule` | text | YES |  |
| `announcements` | text | YES |  |
| `created_at` | timestamp with time zone | YES | `now()` |
| `updated_at` | timestamp with time zone | YES | `now()` |

**RLS policies**
- `Admins can manage club settings` (ALL) — using: `(EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))` 
- `Members can read club settings` (SELECT) — using: `true` 
- `select_authenticated_all_public_club_settings` (SELECT) — using: `true` 
- `select_public_all_public_club_settings` (SELECT) — using: `true` 

### `public.member_portfolio_data`

- **Rows (est.)**: -1 • **Total size**: 24 kB
- **Primary key**: `{id}`
- **RLS enabled**: ✅ yes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `member_id` | uuid | YES |  |
| `symbol` | character varying(20) | NO |  |
| `company_name` | character varying(255) | YES |  |
| `shares` | numeric(12,4) | YES | `0` |
| `purchase_price` | numeric(12,4) | YES |  |
| `current_price` | numeric(12,4) | YES |  |
| `market_value` | numeric(12,2) | YES |  |
| `gain_loss` | numeric(12,2) | YES |  |
| `gain_loss_percent` | numeric(8,4) | YES |  |
| `purchase_date` | date | YES |  |
| `last_updated` | timestamp with time zone | YES | `now()` |
| `created_at` | timestamp with time zone | YES | `now()` |

**RLS policies**
- `Admins can manage portfolio data` (ALL) — using: `((auth.jwt() ->> 'role'::text) = 'admin'::text)` 
- `Users can view all portfolio data` (SELECT) — using: `true` 
- `select_authenticated_all_public_member_portfolio_data` (SELECT) — using: `true` 
- `select_public_all_public_member_portfolio_data` (SELECT) — using: `true` 

### `public.member_personal_data`

- **Rows (est.)**: -1 • **Total size**: 24 kB
- **Primary key**: `{id}`
- **RLS enabled**: ✅ yes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `member_id` | uuid | YES |  |
| `address_line1` | character varying(255) | YES |  |
| `address_line2` | character varying(255) | YES |  |
| `city` | character varying(100) | YES |  |
| `state` | character varying(50) | YES |  |
| `zip_code` | character varying(20) | YES |  |
| `date_of_birth` | date | YES |  |
| `emergency_contact_name` | character varying(255) | YES |  |
| `emergency_contact_phone` | character varying(50) | YES |  |
| `investment_experience` | character varying(100) | YES |  |
| `risk_tolerance` | character varying(50) | YES |  |
| `created_at` | timestamp with time zone | YES | `now()` |
| `updated_at` | timestamp with time zone | YES | `now()` |

**RLS policies**
- `Admins can manage personal data` (ALL) — using: `((auth.jwt() ->> 'role'::text) = 'admin'::text)` 
- `Users can view all personal data` (SELECT) — using: `true` 
- `select_authenticated_all_public_member_personal_data` (SELECT) — using: `true` 

### `public.member_unit_transactions`

- **Rows (est.)**: -1 • **Total size**: 24 kB
- **Primary key**: `{id}`
- **RLS enabled**: ❌ no

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `member_id` | uuid | NO |  |
| `tx_date` | date | NO |  |
| `tx_type` | text | NO |  |
| `cash_amount` | numeric | NO |  |
| `unit_value_at_tx` | numeric | NO |  |
| `units_delta` | numeric | NO |  |
| `notes` | text | YES |  |
| `created_at` | timestamp with time zone | YES | `now()` |

**Foreign keys**
- `member_id` → `public.members.id` _(constraint `member_unit_transactions_member_id_fkey`)_

### `public.staging_member_dues`

- **Rows (est.)**: -1 • **Total size**: 16 kB
- **RLS enabled**: ❌ no

| Column | Type | Nullable | Default |
|---|---|---|---|
| `external_short_id` | integer(32,0) | YES |  |
| `dues_paid_buyout` | numeric(18,2) | YES |  |
| `dues_owed_oct_25` | numeric(18,2) | YES |  |
| `total_contribution` | numeric(18,2) | YES |  |
| `notes` | text | YES |  |

### `public.email_queue`

- **Rows (est.)**: -1 • **Total size**: 16 kB
- **Primary key**: `{id}`
- **RLS enabled**: ✅ yes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `to_email` | text | NO |  |
| `from_email` | text | NO |  |
| `subject` | text | NO |  |
| `html_body` | text | YES |  |
| `text_body` | text | YES |  |
| `status` | text | NO | `'queued'::text` |
| `attempts` | integer(32,0) | NO | `0` |
| `last_error` | text | YES |  |
| `created_at` | timestamp with time zone | NO | `now()` |
| `last_attempt_at` | timestamp with time zone | YES |  |
| `sent_at` | timestamp with time zone | YES |  |

**RLS policies**
- `select_authenticated_all_public_email_queue` (SELECT) — using: `true` 
- `select_public_all_public_email_queue` (SELECT) — using: `true` 

### `public.schwab_raw_account_responses`

- **Rows (est.)**: -1 • **Total size**: 16 kB
- **Primary key**: `{id}`
- **RLS enabled**: ✅ yes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `fetched_at` | timestamp with time zone | NO | `now()` |
| `source` | text | YES |  |
| `payload` | jsonb | NO |  |

**RLS policies**
- `schwab_raw_account_responses_select_admin` (SELECT) — using: `is_admin()` 
- `schwab_raw_account_responses_write_admin` (ALL) — using: `is_admin()` with check: `is_admin()`

### `public.schwab_accounts_import`

- **Rows (est.)**: -1 • **Total size**: 16 kB
- **RLS enabled**: ❌ no

| Column | Type | Nullable | Default |
|---|---|---|---|
| `balance_date` | date | YES |  |
| `account_number` | text | YES |  |
| `account_type` | text | YES |  |
| `current_liquidation_value` | numeric | YES |  |
| `liquidation_value` | numeric | YES |  |
| `long_market_value` | numeric | YES |  |
| `mutual_fund_value` | numeric | YES |  |
| `cash_balance` | numeric | YES |  |
| `total_cash` | numeric | YES |  |

### `public.members_backup`

- **Rows (est.)**: -1 • **Total size**: 16 kB
- **RLS enabled**: ❌ no

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | YES |  |
| `external_short_id` | integer(32,0) | YES |  |
| `member_name` | text | YES |  |
| `email` | text | YES |  |
| `status` | text | YES |  |
| `phone` | text | YES |  |
| `preferred_email` | text | YES |  |
| `email_opt_in` | boolean | YES |  |
| `join_date` | date | YES |  |
| `notes` | text | YES |  |
| `created_at` | timestamp with time zone | YES |  |
| `role` | text | YES |  |
| `auth_user_id` | uuid | YES |  |
| `claimed_at` | timestamp with time zone | YES |  |
| `is_active` | boolean | YES |  |
| `deleted_at` | timestamp with time zone | YES |  |
| `backup_at` | timestamp with time zone | YES |  |

### `public.schwab_positions_import`

- **Rows (est.)**: -1 • **Total size**: 16 kB
- **RLS enabled**: ✅ yes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `symbol` | text | YES |  |
| `cusip` | text | YES |  |
| `assetType` | text | YES |  |
| `quantity` | numeric | YES |  |
| `marketValue` | numeric | YES |  |
| `averageLongPrice` | numeric | YES |  |
| `averagePrice` | numeric | YES |  |
| `currentDayProfitLoss` | numeric | YES |  |
| `currentDayProfitLossPercentage` | numeric | YES |  |

**RLS policies**
- `schwab_positions_import_read_admin_only` (SELECT) — using: `is_admin()` 
- `schwab_positions_import_write_admin_only` (ALL) — using: `is_admin()` with check: `is_admin()`
- `select_authenticated_all_public_schwab_positions_import` (SELECT) — using: `true` 

### `public.member_login_logs`

- **Rows (est.)**: -1 • **Total size**: 16 kB
- **Primary key**: `{id}`
- **RLS enabled**: ❌ no

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint(64,0) | NO | `nextval('member_login_logs_id_seq'::regclass)` |
| `login_timestamp` | timestamp with time zone | NO | `now()` |
| `email` | text | YES |  |
| `was_successful` | boolean | NO |  |
| `failure_reason` | text | YES |  |
| `ip_address` | text | YES |  |
| `city` | text | YES |  |
| `region` | text | YES |  |
| `country` | text | YES |  |
| `is_active_member` | boolean | YES |  |
| `member_account_id` | uuid | YES |  |
| `created_at` | timestamp with time zone | NO | `now()` |

**RLS policies**
- `admin_login_logs_read_all` (SELECT) — using: `true` 
- `member_login_logs_insert_authenticated` (INSERT) — using: `—` with check: `true`
- `member_login_logs_select_authenticated` (SELECT) — using: `true` 
- `member_login_logs_update_authenticated` (UPDATE) — using: `true` with check: `true`

### `public.tickers`

- **Rows (est.)**: -1 • **Total size**: 16 kB
- **Primary key**: `{symbol}`
- **RLS enabled**: ❌ no

| Column | Type | Nullable | Default |
|---|---|---|---|
| `symbol` | text | NO |  |
| `name` | text | YES |  |
| `exchange` | text | YES |  |
| `sector` | text | YES |  |
| `industry` | text | YES |  |
| `market_cap` | numeric | YES |  |
| `updated_at` | timestamp with time zone | NO | `now()` |

### `public.prices_daily`

- **Rows (est.)**: -1 • **Total size**: 16 kB
- **Primary key**: `{symbol,date}`
- **RLS enabled**: ❌ no

| Column | Type | Nullable | Default |
|---|---|---|---|
| `symbol` | text | NO |  |
| `date` | date | NO |  |
| `open` | numeric | YES |  |
| `high` | numeric | YES |  |
| `low` | numeric | YES |  |
| `close` | numeric | YES |  |
| `volume` | numeric | YES |  |

**Foreign keys**
- `symbol` → `public.tickers.symbol` _(constraint `prices_daily_symbol_fkey`)_

### `public.financials_annual`

- **Rows (est.)**: -1 • **Total size**: 16 kB
- **Primary key**: `{symbol,statement_type,fiscal_date_ending}`
- **RLS enabled**: ❌ no

| Column | Type | Nullable | Default |
|---|---|---|---|
| `symbol` | text | NO |  |
| `statement_type` | text | NO |  |
| `fiscal_date_ending` | date | NO |  |
| `payload` | jsonb | NO |  |

**Foreign keys**
- `symbol` → `public.tickers.symbol` _(constraint `financials_annual_symbol_fkey`)_

### `public.ratios_annual`

- **Rows (est.)**: -1 • **Total size**: 16 kB
- **Primary key**: `{symbol,fiscal_date_ending}`
- **RLS enabled**: ❌ no

| Column | Type | Nullable | Default |
|---|---|---|---|
| `symbol` | text | NO |  |
| `fiscal_date_ending` | date | NO |  |
| `payload` | jsonb | NO |  |

**Foreign keys**
- `symbol` → `public.tickers.symbol` _(constraint `ratios_annual_symbol_fkey`)_

### `public.groups`

- **Rows (est.)**: -1 • **Total size**: 16 kB
- **Primary key**: `{id}`
- **RLS enabled**: ✅ yes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `name` | text | NO |  |
| `created_at` | timestamp with time zone | NO | `now()` |

**RLS policies**
- `members can read groups` (SELECT) — using: `(EXISTS ( SELECT 1
   FROM group_members gm
  WHERE ((gm.group_id = groups.id) AND (gm.user_id = auth.uid()))))` 

### `public.group_members`

- **Rows (est.)**: -1 • **Total size**: 16 kB
- **Primary key**: `{group_id,user_id}`
- **RLS enabled**: ✅ yes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `group_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `role` | text | NO | `'member'::text` |
| `created_at` | timestamp with time zone | NO | `now()` |

**Foreign keys**
- `group_id` → `public.groups.id` _(constraint `group_members_group_id_fkey`)_

### `public.ffa_timeline`

- **Rows (est.)**: -1 • **Total size**: 16 kB
- **Primary key**: `{id}`
- **RLS enabled**: ✅ yes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint(64,0) | NO | `nextval('ffa_timeline_id_seq'::regclass)` |
| `member_id` | uuid | YES | `uuid_generate_v4()` |
| `member_name` | text | NO |  |
| `report_month` | text | NO |  |
| `report_date` | date | NO |  |
| `portfolio_value` | numeric(15,2) | YES |  |
| `total_units` | numeric(15,8) | YES |  |
| `total_contribution` | numeric(15,2) | YES |  |
| `ownership_pct` | numeric(8,6) | YES |  |
| `portfolio_growth` | numeric(8,9) | YES |  |
| `portfolio_growth_amount` | numeric(15,2) | YES |  |
| `created_at` | timestamp with time zone | NO | `now()` |
| `updated_at` | timestamp with time zone | NO | `now()` |

**RLS policies**
- `ffa_timeline_insert_any` (INSERT) — using: `—` with check: `true`
- `ffa_timeline_select_all` (SELECT) — using: `true` 
- `select_authenticated_all_public_ffa_timeline` (SELECT) — using: `true` 
- `select_public_all_public_ffa_timeline` (SELECT) — using: `true` 

### `public.watchlists`

- **Rows (est.)**: -1 • **Total size**: 16 kB
- **Primary key**: `{id}`
- **RLS enabled**: ✅ yes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `group_id` | uuid | YES |  |
| `name` | text | NO |  |
| `created_at` | timestamp with time zone | NO | `now()` |

**Foreign keys**
- `group_id` → `public.groups.id` _(constraint `watchlists_group_id_fkey`)_

**RLS policies**
- `members manage watchlists` (ALL) — using: `(EXISTS ( SELECT 1
   FROM group_members gm
  WHERE ((gm.group_id = watchlists.group_id) AND (gm.user_id = auth.uid()))))` with check: `(EXISTS ( SELECT 1
   FROM group_members gm
  WHERE ((gm.group_id = watchlists.group_id) AND (gm.user_id = auth.uid()))))`

### `public.watchlist_items`

- **Rows (est.)**: -1 • **Total size**: 16 kB
- **Primary key**: `{watchlist_id,symbol}`
- **RLS enabled**: ✅ yes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `watchlist_id` | uuid | NO |  |
| `symbol` | text | NO |  |
| `created_at` | timestamp with time zone | NO | `now()` |

**Foreign keys**
- `watchlist_id` → `public.watchlists.id` _(constraint `watchlist_items_watchlist_id_fkey`)_

**RLS policies**
- `members manage watchlist items` (ALL) — using: `(EXISTS ( SELECT 1
   FROM (watchlists w
     JOIN group_members gm ON ((gm.group_id = w.group_id)))
  WHERE ((w.id = watchlist_items.watchlist_id) AND (gm.user_id = auth.uid()))))` with check: `(EXISTS ( SELECT 1
   FROM (watchlists w
     JOIN group_members gm ON ((gm.group_id = w.group_id)))
  WHERE ((w.id = watchlist_items.watchlist_id) AND (gm.user_id = auth.uid()))))`

### `public.notes`

- **Rows (est.)**: -1 • **Total size**: 16 kB
- **Primary key**: `{id}`
- **RLS enabled**: ✅ yes

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `group_id` | uuid | YES |  |
| `symbol` | text | NO |  |
| `title` | text | NO |  |
| `body` | text | NO |  |
| `created_by` | uuid | NO |  |
| `created_at` | timestamp with time zone | NO | `now()` |

**Foreign keys**
- `group_id` → `public.groups.id` _(constraint `notes_group_id_fkey`)_

**RLS policies**
- `members manage notes` (ALL) — using: `(EXISTS ( SELECT 1
   FROM group_members gm
  WHERE ((gm.group_id = notes.group_id) AND (gm.user_id = auth.uid()))))` with check: `(EXISTS ( SELECT 1
   FROM group_members gm
  WHERE ((gm.group_id = notes.group_id) AND (gm.user_id = auth.uid()))))`

## Views

### `public.admin_members_overview`
```sql
SELECT mem.id,
    mem.member_name,
    mem.email,
    mem.is_active,
    mls.report_month,
    mls.portfolio_value,
    mls.total_units,
    mls.total_contribution,
    mls.ownership_pct_of_club
   FROM (members mem
     LEFT JOIN member_latest_snapshot mls ON ((mls.member_id = mem.id)))
  WHERE (mem.deleted_at IS NULL);
```

### `public.club_growth_over_time`
```sql
SELECT report_month,
    stock_value,
    cash_credit_union,
    cash_schwab,
    cash_schwab_mm,
    cash_total_value,
    portfolio_total_value,
    total_units_outstanding,
    unit_value,
    lag(portfolio_total_value) OVER (ORDER BY report_month) AS prev_portfolio_total_value,
    (portfolio_total_value - lag(portfolio_total_value) OVER (ORDER BY report_month)) AS growth_amount,
        CASE
            WHEN (lag(portfolio_total_value) OVER (ORDER BY report_month) > (0)::numeric) THEN ((portfolio_total_value - lag(portfolio_total_value) OVER (ORDER BY report_month)) / lag(portfolio_total_value) OVER (ORDER BY report_month))
            ELSE NULL::numeric
        END AS growth_pct
   FROM meeting_reports mr
  ORDER BY report_month;
```

### `public.latest_schwab_positions`
```sql
WITH latest AS (
         SELECT DISTINCT ON (schwab_positions.account_number, schwab_positions.symbol) schwab_positions.id,
            schwab_positions.snapshot_date,
            schwab_positions.account_number,
            schwab_positions.symbol,
            schwab_positions.cusip,
            schwab_positions.asset_type,
            schwab_positions.quantity,
            schwab_positions.market_value,
            schwab_positions.average_price,
            schwab_positions.current_day_profit_loss,
            schwab_positions.current_day_profit_loss_pct,
            schwab_positions.balance_date,
            schwab_positions.as_of_date,
            schwab_positions.description,
            schwab_positions.long_quantity,
            schwab_positions.short_quantity,
            schwab_positions.current_day_pl,
            schwab_positions.current_day_pl_pct,
            schwab_positions.cost_basis,
            schwab_positions.created_at,
            schwab_positions.raw_json
           FROM schwab_positions
          ORDER BY schwab_positions.account_number, schwab_positions.symbol, schwab_positions.snapshot_date DESC, schwab_positions.created_at DESC, schwab_positions.id DESC
        ), meta AS (
         SELECT schwab_positions.account_number,
            schwab_positions.symbol,
            max(schwab_positions.description) AS description,
            max(schwab_positions.asset_type) AS asset_type
           FROM schwab_positions
          GROUP BY schwab_positions.account_number, schwab_positions.symbol
        )
 SELECT l.id,
    l.snapshot_date,
    l.account_number,
    l.symbol,
    l.cusip,
    COALESCE(l.asset_type, m.asset_type) AS asset_type,
    COALESCE(l.quantity, (l.long_quantity - COALESCE(l.short_quantity, (0)::numeric)), l.long_quantity) AS quantity,
    l.market_value,
    l.average_price,
    l.current_day_profit_loss,
    l.current_day_profit_loss_pct,
    l.balance_date,
    l.as_of_date,
    COALESCE(l.description, m.description) AS description,
    l.long_quantity,
    l.short_quantity,
    l.current_day_pl,
    l.current_day_pl_pct,
    l.cost_basis,
    l.created_at,
    l.raw_json
   FROM (latest l
     LEFT JOIN meta m ON (((m.account_number = l.account_number) AND (m.symbol = l.symbol))));
```

### `public.member_growth_over_time`
```sql
SELECT mrm.member_id,
    mrm.member_name,
    mr.report_month,
    mrm.portfolio_value,
    mrm.total_units,
    mrm.total_contribution,
    mrm.ownership_pct_of_club,
    lag(mrm.portfolio_value) OVER (PARTITION BY mrm.member_name ORDER BY mr.report_month) AS prev_portfolio_value,
    (mrm.portfolio_value - lag(mrm.portfolio_value) OVER (PARTITION BY mrm.member_name ORDER BY mr.report_month)) AS growth_amount,
        CASE
            WHEN (lag(mrm.portfolio_value) OVER (PARTITION BY mrm.member_name ORDER BY mr.report_month) > (0)::numeric) THEN ((mrm.portfolio_value - lag(mrm.portfolio_value) OVER (PARTITION BY mrm.member_name ORDER BY mr.report_month)) / lag(mrm.portfolio_value) OVER (PARTITION BY mrm.member_name ORDER BY mr.report_month))
            ELSE NULL::numeric
        END AS growth_pct
   FROM (meeting_report_members mrm
     JOIN meeting_reports mr ON ((mr.id = mrm.meeting_report_id)));
```

### `public.member_latest_dues`
```sql
SELECT DISTINCT ON (member_id) member_id,
    created_at AS dues_recorded_at,
    dues_paid_buyout,
    dues_owed_oct_25,
    total_contribution
   FROM member_dues
  ORDER BY member_id, created_at DESC;
```

### `public.member_latest_snapshot`
```sql
SELECT DISTINCT ON (COALESCE((mrm.member_id)::text, mrm.member_name)) mrm.member_id,
    mrm.member_name,
    mr.report_month,
    mrm.portfolio_value,
    mrm.total_units,
    mrm.total_contribution,
    mrm.ownership_pct_of_club
   FROM (meeting_report_members mrm
     JOIN meeting_reports mr ON ((mr.id = mrm.meeting_report_id)))
  ORDER BY COALESCE((mrm.member_id)::text, mrm.member_name), mr.report_month DESC;
```

### `public.member_monthly_balances`
```sql
SELECT mrm.member_id,
    mrm.member_name,
    mr.report_month AS report_date,
    mrm.portfolio_value,
    mrm.total_units,
    mrm.total_contribution,
    NULL::numeric AS growth_amount,
    NULL::numeric AS growth_pct
   FROM (meeting_report_members mrm
     JOIN meeting_reports mr ON ((mr.id = mrm.meeting_report_id)));
```

### `public.unit_price_history`
```sql
SELECT report_month,
    unit_value,
    portfolio_total_value,
    total_units_outstanding
   FROM meeting_reports
  ORDER BY report_month;
```

### `public.v_schwab_positions_daily`
```sql
SELECT account_number,
    as_of_date,
    sum(market_value) AS positions_value
   FROM schwab_positions
  GROUP BY account_number, as_of_date;
```

### `public.v_schwab_positions_flat`
```sql
SELECT id,
    balance_date,
    as_of_date,
    account_number,
    symbol,
    cusip,
    asset_type,
    quantity,
    market_value,
    average_price,
    current_day_profit_loss,
    current_day_profit_loss_pct,
    created_at,
    raw_json
   FROM schwab_positions;
```

## Functions

| Schema | Name | Args | Returns | Lang |
|---|---|---|---|---|
| public | `api_get_dashboard` |  | jsonb | plpgsql |
| public | `api_get_dashboard` | as_of_date date | TABLE(as_of_date_out date, total_portfolio_value numeric, unit_price numeric, member_id uuid, member_name text, total_units numeric, portfolio_value numeric, ownership_pct numeric) | sql |
| public | `api_get_meeting_history` | member_id_in uuid | TABLE(report_month date, stock_value numeric, cash_credit_union numeric, cash_schwab numeric, cash_schwab_mm numeric, cash_total_value numeric, portfolio_total_value numeric, total_units_outstanding numeric, unit_value numeric, total_dues_paid numeric, total_dues_owed numeric, total_member_contribution numeric, total_member_previous_units numeric, total_member_units_added numeric, total_member_units numeric, total_member_portfolio_value numeric, member_id uuid, member_name text, dues_paid_buyout numeric, member_dues_owed numeric, member_total_contribution numeric, member_previous_units numeric, member_units_added numeric, member_total_units numeric, member_portfolio_value numeric, ownership_pct_of_club numeric) | sql |
| public | `api_get_member_feed` | limit_count integer, cursor_timestamp timestamp with time zone | TABLE(post_id uuid, author_id uuid, author_name text, content text, image_url text, link_url text, visibility text, created_at timestamp with time zone, like_count bigint, comment_count bigint, liked_by_me boolean, next_cursor_timestamp timestamp with time zone) | sql |
| public | `api_get_member_timeline` | member_id_in uuid | TABLE(report_date date, portfolio_value numeric, total_units numeric, total_contribution numeric, growth_amount numeric, growth_pct numeric) | sql |
| public | `api_refresh_member_accounts` |  | void | plpgsql |
| public | `api_refresh_member_monthly_balances` |  | void | sql |
| public | `api_roll_schwab_into_org_balance` | p_date date | void | plpgsql |
| public | `claim_member_account` | _member_id uuid | void | plpgsql |
| public | `cleanup_blank_members` |  | void | plpgsql |
| public | `gin_extract_query_trgm` | text, internal, smallint, internal, internal, internal, internal | internal | c |
| public | `gin_extract_value_trgm` | text, internal | internal | c |
| public | `gin_trgm_consistent` | internal, smallint, text, integer, internal, internal, internal, internal | boolean | c |
| public | `gin_trgm_triconsistent` | internal, smallint, text, integer, internal, internal, internal | "char" | c |
| public | `gtrgm_compress` | internal | internal | c |
| public | `gtrgm_consistent` | internal, text, smallint, oid, internal | boolean | c |
| public | `gtrgm_decompress` | internal | internal | c |
| public | `gtrgm_distance` | internal, text, smallint, oid, internal | double precision | c |
| public | `gtrgm_in` | cstring | gtrgm | c |
| public | `gtrgm_options` | internal | void | c |
| public | `gtrgm_out` | gtrgm | cstring | c |
| public | `gtrgm_penalty` | internal, internal, internal | internal | c |
| public | `gtrgm_picksplit` | internal, internal | internal | c |
| public | `gtrgm_same` | gtrgm, gtrgm, internal | internal | c |
| public | `gtrgm_union` | internal, internal | gtrgm | c |
| public | `handle_new_auth_user` |  | trigger | plpgsql |
| public | `handle_new_user` |  | trigger | plpgsql |
| public | `is_admin` |  | boolean | sql |
| public | `link_member_data` |  | void | plpgsql |
| public | `link_member_to_user` |  | trigger | plpgsql |
| public | `load_schwab_positions` | p_balance_date date, p_account_number text | void | sql |
| public | `normalize_member_email` |  | trigger | plpgsql |
| public | `recalculate_member_values` |  | void | plpgsql |
| public | `refresh_org_balance_history_all` |  | void | plpgsql |
| public | `refresh_org_balance_history_for_date` | p_date date | void | plpgsql |
| public | `set_deposits_updated_at` |  | trigger | plpgsql |
| public | `set_limit` | real | real | c |
| public | `show_limit` |  | real | c |
| public | `show_trgm` | text | text[] | c |
| public | `similarity` | text, text | real | c |
| public | `similarity_dist` | text, text | real | c |
| public | `similarity_op` | text, text | boolean | c |
| public | `strict_word_similarity` | text, text | real | c |
| public | `strict_word_similarity_commutator_op` | text, text | boolean | c |
| public | `strict_word_similarity_dist_commutator_op` | text, text | real | c |
| public | `strict_word_similarity_dist_op` | text, text | real | c |
| public | `strict_word_similarity_op` | text, text | boolean | c |
| public | `trigger_link_member_to_user` |  | trigger | plpgsql |
| public | `word_similarity` | text, text | real | c |
| public | `word_similarity_commutator_op` | text, text | boolean | c |
| public | `word_similarity_dist_commutator_op` | text, text | real | c |
| public | `word_similarity_dist_op` | text, text | real | c |
| public | `word_similarity_op` | text, text | boolean | c |

## Domain summary

- **auth.users**: 21
- **members linked to auth user**: 18
- **members unlinked**: 4

### Members (22)

| Name | Email | Role | Active | Auth linked |
|---|---|---|---|---|
| Adih, Kofi | kadih1@msn.com | member | ✅ | ✅ |
| Burrell, Felecia | faburrell1@verizon.net | member | ✅ | — |
| Cheatham, Davy | beulenner@aol.com | member | ✅ | ✅ |
| Crawford, Archie | archie.crawford1@gmail.com | admin | ✅ | ✅ |
| Edmundson, Levone | — | member | ✅ | — |
| Greene, Kristen | kristenkirby22@gmail.com | member | ✅ | ✅ |
| Gwaltney, Rheba | rgwalt6145@aol.com | member | ✅ | ✅ |
| Hylton, Lequan | lequan.hylton@gmail.com | member | ✅ | ✅ |
| Jackson, Dante | 2000nupsi07@gmail.com | member | ✅ | ✅ |
| Jean, Joel | joeljean86@hotmail.com | member | ✅ | ✅ |
| Jean, Joel Sr. | chillman38@aol.com | member | ✅ | ✅ |
| Kirby, Kristen | — | member | ✅ | — |
| Kirby, Phillip Jr. | pkirby@kirbycpa.com | member | ✅ | ✅ |
| Mauney, Larry | — | member | ✅ | — |
| McCall, Anthony | abck115@aol.com | member | ✅ | ✅ |
| McCall, Shedrick | shedrickmccall@gmail.com | member | ✅ | ✅ |
| Nichols, Milton | miltonmnichols2@gmail.com | member | ✅ | ✅ |
| Robinson, Luther Jr. | luther.robinson1@gmail.com | member | ✅ | ✅ |
| Rodgers, James | james.erodgers@yahoo.com | member | ✅ | ✅ |
| Sharpe, Tim | foursharpes@yahoo.com | member | ✅ | ✅ |
| Taylor, Cliffton | clifftaylor20@gmail.com | member | ✅ | ✅ |
| Walker, Jessee | jessewalker318@gmail.com | member | ✅ | ✅ |

### Deposits totals

| Member | Deposits | Total | First | Last |
|---|---:|---:|---|---|
| Jean, Joel Sr. | 5 | $6,150.00 | Wed Jul 23 2025 00:00:00 GMT-0400 (Eastern Daylight Time) | Tue Apr 21 2026 00:00:00 GMT-0400 (Eastern Daylight Time) |
| Kirby, Phillip Jr. | 4 | $2,501.00 | Fri Jun 13 2025 00:00:00 GMT-0400 (Eastern Daylight Time) | Fri Mar 13 2026 00:00:00 GMT-0400 (Eastern Daylight Time) |
| Hylton, Lequan | 5 | $2,200.00 | Wed Aug 20 2025 00:00:00 GMT-0400 (Eastern Daylight Time) | Sat Jan 24 2026 00:00:00 GMT-0500 (Eastern Standard Time) |
| Gwaltney, Rheba | 2 | $1,501.00 | Thu Jun 26 2025 00:00:00 GMT-0400 (Eastern Daylight Time) | Tue Aug 05 2025 00:00:00 GMT-0400 (Eastern Daylight Time) |
| Taylor, Cliffton | 2 | $999.00 | Wed Jul 30 2025 00:00:00 GMT-0400 (Eastern Daylight Time) | Thu Jul 31 2025 00:00:00 GMT-0400 (Eastern Daylight Time) |
| Adih, Kofi | 2 | $450.00 | Sat Sep 27 2025 00:00:00 GMT-0400 (Eastern Daylight Time) | Sat Feb 28 2026 00:00:00 GMT-0500 (Eastern Standard Time) |
| Greene, Kristen | 4 | $400.00 | Sun Jun 22 2025 00:00:00 GMT-0400 (Eastern Daylight Time) | Sun Apr 19 2026 00:00:00 GMT-0400 (Eastern Daylight Time) |
| Robinson, Luther Jr. | 2 | $201.00 | Mon Nov 17 2025 00:00:00 GMT-0500 (Eastern Standard Time) | Fri Feb 27 2026 00:00:00 GMT-0500 (Eastern Standard Time) |
