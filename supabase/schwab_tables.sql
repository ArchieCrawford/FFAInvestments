-- Schwab Account Tables for FFA Investments
-- Run this in your Supabase SQL Editor to create the tables

-- ============================================================================
-- 1. schwab_accounts: Account registry (one row per unique Schwab account)
-- ============================================================================
CREATE TABLE IF NOT EXISTS schwab_accounts (
  id BIGSERIAL PRIMARY KEY,
  account_number TEXT NOT NULL UNIQUE, -- Schwab account number (unique identifier)
  account_type TEXT, -- e.g., "Cash", "Margin", "IRA"
  account_hash TEXT, -- Optional: Schwab hashValue for privacy
  is_active BOOLEAN DEFAULT true,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  raw_account_data JSONB, -- Full Schwab account object for reference
  
  CONSTRAINT schwab_accounts_account_number_check CHECK (account_number <> '')
);

-- Index for faster account lookups
CREATE INDEX IF NOT EXISTS idx_schwab_accounts_account_number ON schwab_accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_schwab_accounts_is_active ON schwab_accounts(is_active);

-- ============================================================================
-- 2. schwab_account_snapshots: Time-series data (historical balance snapshots)
-- ============================================================================
CREATE TABLE IF NOT EXISTS schwab_account_snapshots (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES schwab_accounts(id) ON DELETE CASCADE,
  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Balance fields (from Schwab currentBalances)
  liquidation_value NUMERIC(15, 2),
  cash_balance NUMERIC(15, 2),
  cash_available_for_trading NUMERIC(15, 2),
  cash_available_for_withdrawal NUMERIC(15, 2),
  long_market_value NUMERIC(15, 2),
  short_market_value NUMERIC(15, 2),
  equity NUMERIC(15, 2),
  margin_balance NUMERIC(15, 2),
  buying_power NUMERIC(15, 2),
  
  -- Optional: aggregated balance from Schwab API
  aggregated_balance JSONB,
  
  -- Full snapshot data (positions, details, etc.)
  raw_snapshot_data JSONB,
  
  CONSTRAINT schwab_account_snapshots_account_id_date_unique UNIQUE (account_id, snapshot_date)
);

-- Indexes for efficient time-series queries
CREATE INDEX IF NOT EXISTS idx_schwab_snapshots_account_id ON schwab_account_snapshots(account_id);
CREATE INDEX IF NOT EXISTS idx_schwab_snapshots_snapshot_date ON schwab_account_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_schwab_snapshots_account_date ON schwab_account_snapshots(account_id, snapshot_date DESC);

-- ============================================================================
-- Row-Level Security (RLS) Policies
-- ============================================================================
-- Enable RLS on both tables
ALTER TABLE schwab_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE schwab_account_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access (for backend operations)
CREATE POLICY "Service role has full access to schwab_accounts"
  ON schwab_accounts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to schwab_account_snapshots"
  ON schwab_account_snapshots
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to read their own data
-- Note: You may need to add a user_id column to schwab_accounts if you want per-user RLS
-- For now, allow all authenticated users to read (adjust as needed for your app)
CREATE POLICY "Authenticated users can read schwab_accounts"
  ON schwab_accounts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read schwab_account_snapshots"
  ON schwab_account_snapshots
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- Optional: Function to automatically update last_updated_at on schwab_accounts
-- ============================================================================
CREATE OR REPLACE FUNCTION update_schwab_account_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_schwab_account_timestamp
BEFORE UPDATE ON schwab_accounts
FOR EACH ROW
EXECUTE FUNCTION update_schwab_account_timestamp();

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON TABLE schwab_accounts IS 'Registry of Schwab accounts (one row per account)';
COMMENT ON TABLE schwab_account_snapshots IS 'Historical snapshots of Schwab account balances (time-series data for analytics)';
COMMENT ON COLUMN schwab_accounts.account_number IS 'Unique Schwab account number from securitiesAccount.accountNumber';
COMMENT ON COLUMN schwab_accounts.raw_account_data IS 'Full Schwab API response for reference';
COMMENT ON COLUMN schwab_account_snapshots.raw_snapshot_data IS 'Full snapshot including positions, market data, etc.';
