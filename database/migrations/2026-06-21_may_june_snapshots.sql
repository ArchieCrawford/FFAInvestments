-- =============================================================================
-- May 2026 backfill + June 2026 live snapshot
-- 2026-06-21
--
-- May 2026: estimated values derived from April 2026 actuals + growth model
-- June 2026: dynamically built from latest schwab_positions + member_accounts
-- =============================================================================

BEGIN;

-- =============================================================================
-- MAY 2026 — backfill estimate
-- Baseline: April 2026 actual ($979,736.37, 19,115.175 units @ $51.2544)
-- Growth model: 50% market gain / 50% new deposits on the $47,357 delta
-- =============================================================================

INSERT INTO public.monthly_snapshots (
  month_label, snapshot_date,
  stock_value, cash_credit_union, cash_schwab, mm_schwab, gold_schwab, other_value,
  new_total_val_units
) VALUES (
  'May 2026', '2026-05-01',
  931389.76,   -- stock (April stock × 1.024168 market growth)
  27264.09,    -- credit union: $3,585.37 market-adjusted + $23,678.72 new deposits
  27753.86,    -- schwab cash (April × market growth)
  31598.47,    -- money market (April × market growth)
  27179.28,    -- gold (April × market growth)
  0,
  19577.159142 -- April units + new deposit units (23678.72 / 51.2544)
)
ON CONFLICT (month_label) DO UPDATE SET
  stock_value          = EXCLUDED.stock_value,
  cash_credit_union    = EXCLUDED.cash_credit_union,
  cash_schwab          = EXCLUDED.cash_schwab,
  mm_schwab            = EXCLUDED.mm_schwab,
  gold_schwab          = EXCLUDED.gold_schwab,
  new_total_val_units  = EXCLUDED.new_total_val_units,
  updated_at           = now();

-- May member entries: pull from member_accounts as the current source of truth,
-- treating current state as cumulative through May.
-- previous_val_units = April baseline, val_units_added = units gained since April.
WITH may_snap AS (
  SELECT id, unit_value FROM public.monthly_snapshots WHERE month_label = 'May 2026'
),
april_snap AS (
  SELECT id FROM public.monthly_snapshots WHERE month_label = 'Apr 2026'
),
april_entries AS (
  SELECT member_name_raw, new_val_unit_total AS april_units
  FROM public.member_monthly_entries
  WHERE snapshot_id = (SELECT id FROM april_snap)
),
-- May deposits per member (Zelle deposits in May 2026)
may_deps AS (
  SELECT member_id, SUM(amount) AS dep_total
  FROM public.deposits
  WHERE deposit_date >= '2026-05-01' AND deposit_date < '2026-06-01'
    AND status IN ('cleared', 'pending')
  GROUP BY member_id
)
INSERT INTO public.member_monthly_entries (
  snapshot_id, member_id, member_name_raw,
  dues_paid_buyout, dues_owed, total_contribution,
  previous_val_units, val_units_added
)
SELECT
  ms.id,
  m.id,
  m.member_name,
  0,
  0,
  COALESCE(ma.total_contributions, 0),
  COALESCE(ae.april_units, ma.current_units),                          -- prev = April total
  COALESCE(md.dep_total, 0) / NULLIF(
    (SELECT unit_value FROM public.monthly_snapshots WHERE month_label = 'Apr 2026'), 0
  )                                                                     -- units added = May deposits / April unit price
FROM public.member_accounts ma
JOIN public.members m ON m.member_account_id = ma.id
CROSS JOIN may_snap ms
LEFT JOIN april_entries ae ON ae.member_name_raw = m.member_name
LEFT JOIN may_deps md ON md.member_id = m.id
WHERE ma.is_active = true
ON CONFLICT (snapshot_id, member_name_raw) DO UPDATE SET
  total_contribution = EXCLUDED.total_contribution,
  previous_val_units = EXCLUDED.previous_val_units,
  val_units_added    = EXCLUDED.val_units_added,
  updated_at         = now();

-- =============================================================================
-- JUNE 2026 — live snapshot from actual Schwab positions + member accounts
-- =============================================================================

INSERT INTO public.monthly_snapshots (
  month_label, snapshot_date,
  stock_value, cash_credit_union, cash_schwab, mm_schwab, gold_schwab, other_value,
  new_total_val_units
)
SELECT
  'Jun 2026',
  '2026-06-01',
  -- Categorise positions by symbol/description patterns.
  -- Money market: names containing 'MONEY MARKET' or common MM tickers.
  -- Gold: GLDM, GLD, IAU, SGOL, AAAU.
  -- Cash: symbol = 'CASH' or description ilike '%cash%'.
  -- Everything else: equity / stock.
  SUM(CASE
    WHEN UPPER(symbol) IN ('GLDM','GLD','IAU','SGOL','AAAU')           THEN 0
    WHEN UPPER(symbol) = 'CASH'
      OR UPPER(COALESCE(description,'')) LIKE '%CASH%'                  THEN 0
    WHEN UPPER(COALESCE(description,'')) LIKE '%MONEY MARKET%'
      OR UPPER(symbol) IN ('SWVXX','SNAXX','FDRXX','SWYXX','SWSXX')    THEN 0
    ELSE market_value
  END)                                                                   AS stock_value,
  3500.76                                                                AS cash_credit_union, -- Argent CU (static; update when known)
  SUM(CASE
    WHEN UPPER(symbol) = 'CASH'
      OR UPPER(COALESCE(description,'')) LIKE '%CASH%'                  THEN market_value
    ELSE 0
  END)                                                                   AS cash_schwab,
  SUM(CASE
    WHEN UPPER(COALESCE(description,'')) LIKE '%MONEY MARKET%'
      OR UPPER(symbol) IN ('SWVXX','SNAXX','FDRXX','SWYXX','SWSXX')    THEN market_value
    ELSE 0
  END)                                                                   AS mm_schwab,
  SUM(CASE
    WHEN UPPER(symbol) IN ('GLDM','GLD','IAU','SGOL','AAAU')           THEN market_value
    ELSE 0
  END)                                                                   AS gold_schwab,
  0                                                                      AS other_value,
  (SELECT COALESCE(SUM(current_units), 0)
   FROM public.member_accounts WHERE is_active = true)                   AS new_total_val_units
FROM public.schwab_positions
WHERE snapshot_date = (SELECT MAX(snapshot_date) FROM public.schwab_positions)
ON CONFLICT (month_label) DO UPDATE SET
  stock_value         = EXCLUDED.stock_value,
  cash_credit_union   = EXCLUDED.cash_credit_union,
  cash_schwab         = EXCLUDED.cash_schwab,
  mm_schwab           = EXCLUDED.mm_schwab,
  gold_schwab         = EXCLUDED.gold_schwab,
  new_total_val_units = EXCLUDED.new_total_val_units,
  updated_at          = now();

-- June member entries: current member_accounts state is the June picture.
-- previous_val_units = their May total; val_units_added = units added in June.
WITH june_snap AS (
  SELECT id FROM public.monthly_snapshots WHERE month_label = 'Jun 2026'
),
may_entries AS (
  SELECT member_name_raw, new_val_unit_total AS may_units
  FROM public.member_monthly_entries
  WHERE snapshot_id = (SELECT id FROM public.monthly_snapshots WHERE month_label = 'May 2026')
),
june_deps AS (
  SELECT member_id, SUM(amount) AS dep_total
  FROM public.deposits
  WHERE deposit_date >= '2026-06-01' AND deposit_date < '2026-07-01'
    AND status IN ('cleared', 'pending')
  GROUP BY member_id
),
may_unit_price AS (
  SELECT unit_value FROM public.monthly_snapshots WHERE month_label = 'May 2026'
)
INSERT INTO public.member_monthly_entries (
  snapshot_id, member_id, member_name_raw,
  dues_paid_buyout, dues_owed, total_contribution,
  previous_val_units, val_units_added
)
SELECT
  js.id,
  m.id,
  m.member_name,
  0,
  0,
  COALESCE(ma.total_contributions, 0),
  COALESCE(me.may_units, ma.current_units),                             -- prev = May total
  COALESCE(jd.dep_total, 0) / NULLIF((SELECT unit_value FROM may_unit_price), 0) -- June deposit units
FROM public.member_accounts ma
JOIN public.members m ON m.member_account_id = ma.id
CROSS JOIN june_snap js
LEFT JOIN may_entries me ON me.member_name_raw = m.member_name
LEFT JOIN june_deps jd ON jd.member_id = m.id
WHERE ma.is_active = true
ON CONFLICT (snapshot_id, member_name_raw) DO UPDATE SET
  total_contribution = EXCLUDED.total_contribution,
  previous_val_units = EXCLUDED.previous_val_units,
  val_units_added    = EXCLUDED.val_units_added,
  updated_at         = now();

COMMIT;

-- Quick sanity check — run this after applying to verify:
-- SELECT month_label, total_value, unit_value, new_total_val_units
-- FROM monthly_snapshots
-- WHERE month_label IN ('May 2026','Jun 2026')
-- ORDER BY snapshot_date;
