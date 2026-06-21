-- =============================================================================
-- Fix May 2026 + June 2026 member_monthly_entries
-- 2026-06-21
--
-- Problem: previous entries used member_accounts.total_contributions which
-- didn't match the dues page. The dues page uses member_latest_dues as the
-- base and adds cumulative deposits on top. This script does the same.
--
-- Logic (mirrors AdminDues.jsx exactly):
--   dues_paid_buyout   = mld.dues_paid_buyout + SUM(deposits through month-end)
--   dues_owed          = mld.dues_owed_oct_25 - SUM(deposits through month-end)
--   total_contribution = mld.total_contribution + SUM(deposits through month-end)
--   previous_val_units = prior month snapshot entry's new_val_unit_total
--   val_units_added    = SUM(deposits in month) / prior month unit_value
-- =============================================================================

BEGIN;

-- =============================================================================
-- MAY 2026 member entries
-- Deposits through 2026-05-31; prior snapshot = Apr 2026
-- =============================================================================
DELETE FROM public.member_monthly_entries
WHERE snapshot_id = (SELECT id FROM public.monthly_snapshots WHERE month_label = 'May 2026');

WITH
apr_snap AS (
  SELECT id, unit_value
  FROM public.monthly_snapshots
  WHERE month_label = 'Apr 2026'
),
apr_entries AS (
  SELECT member_id, member_name_raw, new_val_unit_total AS april_units
  FROM public.member_monthly_entries
  WHERE snapshot_id = (SELECT id FROM apr_snap)
),
may_snap AS (
  SELECT id FROM public.monthly_snapshots WHERE month_label = 'May 2026'
),
-- All deposits through end of May (cumulative from dues baseline)
may_cumulative_deps AS (
  SELECT
    member_id,
    SUM(amount) AS dep_total
  FROM public.deposits
  WHERE deposit_date <= '2026-05-31'
  GROUP BY member_id
),
-- Deposits in May only (for units minted this month)
may_only_deps AS (
  SELECT
    member_id,
    SUM(amount) AS dep_total
  FROM public.deposits
  WHERE deposit_date >= '2026-05-01' AND deposit_date <= '2026-05-31'
  GROUP BY member_id
)
INSERT INTO public.member_monthly_entries (
  snapshot_id, member_id, member_name_raw,
  dues_paid_buyout, dues_owed, total_contribution,
  previous_val_units, val_units_added
)
SELECT DISTINCT ON (m.member_name)
  (SELECT id FROM may_snap),
  m.id,
  m.member_name,
  COALESCE(mld.dues_paid_buyout, 0) + COALESCE(cd.dep_total, 0),
  COALESCE(mld.dues_owed_oct_25, 0) - COALESCE(cd.dep_total, 0),
  COALESCE(mld.total_contribution, 0) + COALESCE(cd.dep_total, 0),
  COALESCE(ae.april_units, 0),
  COALESCE(od.dep_total, 0) / NULLIF((SELECT unit_value FROM apr_snap), 0)
FROM public.members m
LEFT JOIN public.member_latest_dues mld ON mld.member_id = m.id
LEFT JOIN apr_entries ae ON ae.member_id = m.id
LEFT JOIN may_cumulative_deps cd ON cd.member_id = m.id
LEFT JOIN may_only_deps od ON od.member_id = m.id
WHERE m.is_active = true AND (m.deleted_at IS NULL OR m.deleted_at > now())
ORDER BY m.member_name, m.created_at;

-- =============================================================================
-- JUNE 2026 member entries
-- Deposits through today; prior snapshot = May 2026
-- =============================================================================
DELETE FROM public.member_monthly_entries
WHERE snapshot_id = (SELECT id FROM public.monthly_snapshots WHERE month_label = 'Jun 2026');

WITH
may_snap AS (
  SELECT id, unit_value
  FROM public.monthly_snapshots
  WHERE month_label = 'May 2026'
),
may_entries AS (
  SELECT member_id, member_name_raw, new_val_unit_total AS may_units
  FROM public.member_monthly_entries
  WHERE snapshot_id = (SELECT id FROM may_snap)
),
june_snap AS (
  SELECT id FROM public.monthly_snapshots WHERE month_label = 'Jun 2026'
),
-- All deposits through today (cumulative from dues baseline)
june_cumulative_deps AS (
  SELECT
    member_id,
    SUM(amount) AS dep_total
  FROM public.deposits
  WHERE deposit_date <= CURRENT_DATE
  GROUP BY member_id
),
-- Deposits in June only (for units minted this month)
june_only_deps AS (
  SELECT
    member_id,
    SUM(amount) AS dep_total
  FROM public.deposits
  WHERE deposit_date >= '2026-06-01' AND deposit_date <= CURRENT_DATE
  GROUP BY member_id
)
INSERT INTO public.member_monthly_entries (
  snapshot_id, member_id, member_name_raw,
  dues_paid_buyout, dues_owed, total_contribution,
  previous_val_units, val_units_added
)
SELECT DISTINCT ON (m.member_name)
  (SELECT id FROM june_snap),
  m.id,
  m.member_name,
  COALESCE(mld.dues_paid_buyout, 0) + COALESCE(cd.dep_total, 0),
  COALESCE(mld.dues_owed_oct_25, 0) - COALESCE(cd.dep_total, 0),
  COALESCE(mld.total_contribution, 0) + COALESCE(cd.dep_total, 0),
  COALESCE(me.may_units, 0),
  COALESCE(od.dep_total, 0) / NULLIF((SELECT unit_value FROM may_snap), 0)
FROM public.members m
LEFT JOIN public.member_latest_dues mld ON mld.member_id = m.id
LEFT JOIN may_entries me ON me.member_id = m.id
LEFT JOIN june_cumulative_deps cd ON cd.member_id = m.id
LEFT JOIN june_only_deps od ON od.member_id = m.id
WHERE m.is_active = true AND (m.deleted_at IS NULL OR m.deleted_at > now())
ORDER BY m.member_name, m.created_at;

COMMIT;

-- Sanity check — run after applying:
-- SELECT
--   m.member_name,
--   e.dues_paid_buyout,
--   e.dues_owed,
--   e.total_contribution,
--   e.previous_val_units,
--   e.val_units_added,
--   e.new_val_unit_total
-- FROM member_monthly_entries e
-- JOIN members m ON m.id = e.member_id
-- WHERE snapshot_id = (SELECT id FROM monthly_snapshots WHERE month_label = 'Jun 2026')
-- ORDER BY m.member_name;
