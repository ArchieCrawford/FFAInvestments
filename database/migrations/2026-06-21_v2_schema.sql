-- =============================================================================
-- v2 Schema Migration
-- 2026-06-21
--
-- Changes:
--   1. Fix schwab_positions column names to match Google Script output
--   2. Add status + audit columns to deposits
--   3. Create portfolio_valuations view (computed from schwab_positions)
--   4. Create trigger: mint units automatically when deposit is cleared
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. Fix schwab_positions column names
--    Google Script writes: long_quantity, average_price, snapshot_date
--    DB had:               quantity,      price,         as_of_date
-- =============================================================================
ALTER TABLE public.schwab_positions
  RENAME COLUMN quantity  TO long_quantity;

ALTER TABLE public.schwab_positions
  RENAME COLUMN price     TO average_price;

ALTER TABLE public.schwab_positions
  RENAME COLUMN as_of_date TO snapshot_date;

-- =============================================================================
-- 2. Add status + audit columns to deposits
--    Zelle script inserts rows as 'pending'; admin approves → 'cleared'
--    Audit columns (units_minted, unit_price_at_clearing, cleared_at) are
--    stamped by the trigger so there is always a record of what price was used.
-- =============================================================================
ALTER TABLE public.deposits
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'cleared', 'rejected')),
  ADD COLUMN IF NOT EXISTS units_minted           numeric(16,8),
  ADD COLUMN IF NOT EXISTS unit_price_at_clearing numeric(14,4),
  ADD COLUMN IF NOT EXISTS cleared_at             timestamptz;

CREATE INDEX IF NOT EXISTS deposits_status_idx ON public.deposits(status);

-- =============================================================================
-- 3. portfolio_valuations view
--    Computes total AUM per snapshot date from schwab_positions.
--    Latest row = current portfolio value used for unit price calculation.
--    No separate table needed — the Google Script keeps schwab_positions fresh.
-- =============================================================================
CREATE OR REPLACE VIEW public.portfolio_valuations AS
SELECT
  snapshot_date,
  SUM(market_value)       AS total_value,
  COUNT(DISTINCT symbol)  AS position_count
FROM public.schwab_positions
GROUP BY snapshot_date;

-- =============================================================================
-- 4. Trigger: mint units when deposit status transitions to 'cleared'
--
-- Flow:
--   a) Get latest total portfolio value from schwab_positions
--   b) Get current total units from member_accounts
--   c) unit_price = total_value / total_units
--   d) units_minted = deposit.amount / unit_price
--   e) INSERT into transactions (ledger record)
--   f) UPDATE member_accounts (running totals)
--   g) Stamp audit fields onto the deposit row
--
-- Safety guards:
--   - Raises if no Schwab position data exists (force a sync first)
--   - Raises if total units = 0 (accounts not initialised)
--   - Raises if member has no linked member_account
--   - Only fires on status: * → 'cleared'; ignores all other updates
-- =============================================================================
CREATE OR REPLACE FUNCTION public.fn_on_deposit_cleared()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_total_value       numeric;
  v_total_units       numeric;
  v_unit_price        numeric;
  v_units_minted      numeric;
  v_member_account_id uuid;
BEGIN
  -- Guard: only act on transitions TO 'cleared'
  IF NEW.status <> 'cleared' OR OLD.status = 'cleared' THEN
    RETURN NEW;
  END IF;

  -- 1. Latest Schwab portfolio value
  SELECT SUM(market_value) INTO v_total_value
  FROM public.schwab_positions
  WHERE snapshot_date = (SELECT MAX(snapshot_date) FROM public.schwab_positions);

  IF v_total_value IS NULL OR v_total_value = 0 THEN
    RAISE EXCEPTION
      'Cannot clear deposit: no Schwab position data found. '
      'Run the weekly Schwab sync before approving deposits.';
  END IF;

  -- 2. Total units outstanding across all active members
  SELECT COALESCE(SUM(current_units), 0) INTO v_total_units
  FROM public.member_accounts
  WHERE is_active = true;

  IF v_total_units = 0 THEN
    RAISE EXCEPTION
      'Cannot clear deposit: total units outstanding is zero. '
      'Initialise member accounts before approving deposits.';
  END IF;

  -- 3. Derive unit price and units to mint
  v_unit_price   := v_total_value / v_total_units;
  v_units_minted := NEW.amount   / v_unit_price;

  -- 4. Resolve member → member_account
  SELECT member_account_id INTO v_member_account_id
  FROM public.members
  WHERE id = NEW.member_id;

  IF v_member_account_id IS NULL THEN
    RAISE EXCEPTION
      'Cannot clear deposit: member_id % has no linked member_account. '
      'Link the account before approving.', NEW.member_id;
  END IF;

  -- 5. Ledger entry
  INSERT INTO public.transactions (
    member_account_id,
    transaction_type,
    amount,
    units,
    unit_price,
    transaction_date,
    description
  ) VALUES (
    v_member_account_id,
    'contribution',
    NEW.amount,
    v_units_minted,
    v_unit_price,
    NEW.deposit_date,
    'Zelle deposit — conf ' || COALESCE(NEW.confirmation_number, 'N/A')
  );

  -- 6. Update member running totals
  --    Note: right-hand current_units references the PRE-update value (SQL semantics),
  --    so (current_units + v_units_minted) correctly equals the new total.
  UPDATE public.member_accounts
  SET
    current_units       = current_units + v_units_minted,
    total_contributions = total_contributions + NEW.amount,
    current_value       = (current_units + v_units_minted) * v_unit_price,
    updated_at          = now()
  WHERE id = v_member_account_id;

  -- 7. Stamp audit fields onto the deposit row (BEFORE trigger, so NEW is returned)
  NEW.units_minted           := v_units_minted;
  NEW.unit_price_at_clearing := v_unit_price;
  NEW.cleared_at             := now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deposit_cleared ON public.deposits;
CREATE TRIGGER trg_deposit_cleared
  BEFORE UPDATE ON public.deposits
  FOR EACH ROW EXECUTE FUNCTION public.fn_on_deposit_cleared();

-- =============================================================================
-- After this migration, also update the Zelle Google Script payload to include:
--   status: 'pending'
-- (It will default to 'pending' without this, but being explicit is safer.)
--
-- ownership_percentage in member_accounts is NOT updated by the trigger
-- (recomputing it for all members on every deposit would be expensive).
-- Call recalculate_member_values() periodically or after bulk approvals.
-- =============================================================================

COMMIT;
