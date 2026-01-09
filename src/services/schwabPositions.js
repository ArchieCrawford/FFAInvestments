import { supabase } from '../lib/supabase'
import schwabApi from './schwabApi'

function normalizeAccountNumber(account) {
  return (
    account?.securitiesAccount?.accountNumber ??
    account?.accountNumber ??
    account?.accountId ??
    null
  )
}

function mapPositionsToNewSchema({ accountNumber, asOfDate, positions }) {
  const rows = []

  for (const pos of positions || []) {
    const instrument = pos.instrument || {}
    const longQty = pos.longQuantity ?? null
    const shortQty = pos.shortQuantity ?? null

    if (longQty !== null && Number(longQty) !== 0) {
      rows.push({
        account_number: accountNumber,
        as_of_date: asOfDate,
        symbol: instrument.symbol || null,
        description: instrument.description || null,
        asset_type: instrument.assetType || instrument.type || null,
        quantity: longQty,
        price: pos.averagePrice ?? null,
        market_value: pos.marketValue ?? null,
        cost_basis: pos.averagePrice ?? null,
        side: 'LONG',
        raw_json: pos,
      })
    }

    if (shortQty !== null && Number(shortQty) !== 0) {
      rows.push({
        account_number: accountNumber,
        as_of_date: asOfDate,
        symbol: instrument.symbol || null,
        description: instrument.description || null,
        asset_type: instrument.assetType || instrument.type || null,
        quantity: shortQty,
        price: pos.averagePrice ?? null,
        market_value: pos.marketValue ?? null,
        cost_basis: pos.averagePrice ?? null,
        side: 'SHORT',
        raw_json: pos,
      })
    }

    // If Schwab payload doesn't provide long/short quantities, fall back to a single row
    if ((longQty === null || Number(longQty) === 0) && (shortQty === null || Number(shortQty) === 0)) {
      rows.push({
        account_number: accountNumber,
        as_of_date: asOfDate,
        symbol: instrument.symbol || null,
        description: instrument.description || null,
        asset_type: instrument.assetType || instrument.type || null,
        quantity: pos.quantity ?? null,
        price: pos.averagePrice ?? null,
        market_value: pos.marketValue ?? null,
        cost_basis: pos.averagePrice ?? null,
        side: null,
        raw_json: pos,
      })
    }
  }

  return rows
}

function mapPositionsToLegacySchema({ accountNumber, snapshotDate, positions }) {
  return (positions || []).map((pos) => {
    const instrument = pos.instrument || {}
    return {
      snapshot_date: snapshotDate,
      account_number: accountNumber,
      symbol: instrument.symbol || null,
      description: instrument.description || null,
      long_quantity: pos.longQuantity ?? null,
      short_quantity: pos.shortQuantity ?? null,
      average_price: pos.averagePrice ?? null,
      market_value: pos.marketValue ?? null,
      current_day_pl: pos.currentDayProfitLoss ?? null,
      current_day_pl_pct: pos.currentDayProfitLossPercentage ?? null,
      raw_json: pos,
    }
  })
}

async function deleteExistingPositionsForDate({ accountNumber, dateISO }) {
  // Try new schema first (as_of_date)
  const attemptNew = await supabase
    .from('schwab_positions')
    .delete()
    .eq('account_number', accountNumber)
    .eq('as_of_date', dateISO)

  if (!attemptNew.error) return

  // Fallback to legacy schema (snapshot_date)
  const attemptLegacy = await supabase
    .from('schwab_positions')
    .delete()
    .eq('account_number', accountNumber)
    .eq('snapshot_date', dateISO)

  if (attemptLegacy.error) {
    throw new Error(`Failed to delete existing Schwab positions: ${attemptLegacy.error.message}`)
  }
}

async function insertPositionsRows({ newRows, legacyRows }) {
  // Prefer the new schema if available
  const attemptNew = await supabase.from('schwab_positions').insert(newRows)
  if (!attemptNew.error) return

  const attemptLegacy = await supabase.from('schwab_positions').insert(legacyRows)
  if (attemptLegacy.error) {
    throw new Error(`Failed to insert Schwab positions: ${attemptLegacy.error.message}`)
  }
}

/**
 * Fetch positions from Schwab and store them in the schwab_positions table.
 * Idempotent per account + date: deletes existing rows for today before insert.
 */
export async function syncSchwabPositionsForToday() {
  const today = new Date().toISOString().slice(0, 10)

  console.log('🔁 [syncSchwabPositionsForToday] Starting positions sync for date:', today)

  // 1) Get accounts
  console.log('🔁 [syncSchwabPositionsForToday] Fetching accounts...')
  const accounts = await schwabApi.getAccounts()
  console.log('🔁 [syncSchwabPositionsForToday] Accounts fetched:', accounts)

  if (!accounts || accounts.length === 0) {
    throw new Error('No Schwab accounts returned when syncing positions')
  }

  const results = []

  // 2) Sync each account (Admin view expects "across all Schwab accounts")
  for (const acct of accounts) {
    const accountNumber = normalizeAccountNumber(acct)
    if (!accountNumber) {
      console.warn('⚠️ [syncSchwabPositionsForToday] Skipping account with missing accountNumber:', acct)
      continue
    }

    console.log('📞 [syncSchwabPositionsForToday] Calling getPositionsForAccount')
    console.log('📞 [syncSchwabPositionsForToday]   - Account number:', accountNumber)
    const accountData = await schwabApi.getPositionsForAccount(accountNumber)

    if (!accountData) {
      console.warn(`⚠️ [syncSchwabPositionsForToday] Account ${accountNumber} not found when fetching positions`)
      results.push({ accountNumber, as_of_date: today, positions_count: 0, skipped: true })
      continue
    }

    const positions = accountData?.securitiesAccount?.positions || []
    console.log('✅ [syncSchwabPositionsForToday] Received', positions.length, 'positions from API for account', accountNumber)

    const newRows = mapPositionsToNewSchema({
      accountNumber,
      asOfDate: today,
      positions,
    })
    const legacyRows = mapPositionsToLegacySchema({
      accountNumber,
      snapshotDate: today,
      positions,
    })

    console.log('🔁 [syncSchwabPositionsForToday] Deleting existing positions for', accountNumber, 'on', today)
    await deleteExistingPositionsForDate({ accountNumber, dateISO: today })

    if (newRows.length === 0 && legacyRows.length === 0) {
      console.warn('⚠️ [syncSchwabPositionsForToday] No positions found for account', accountNumber)
      results.push({ accountNumber, as_of_date: today, positions_count: 0 })
      continue
    }

    console.log('🔁 [syncSchwabPositionsForToday] Inserting positions into schwab_positions...', {
      accountNumber,
      today,
      newRowCount: newRows.length,
      legacyRowCount: legacyRows.length,
    })

    await insertPositionsRows({ newRows, legacyRows })

    results.push({ accountNumber, as_of_date: today, positions_count: newRows.length || legacyRows.length })
  }

  console.log('✅ [syncSchwabPositionsForToday] Completed sync for', results.length, 'account(s)')
  return { as_of_date: today, accounts_synced: results.length, results }
}

/**
 * Get latest positions for an account on a given date
 */
export async function getPositionsForAccountDate(accountNumber, dateISO) {
  // Try new schema first
  const attemptNew = await supabase
    .from('schwab_positions')
    .select('*')
    .eq('account_number', accountNumber)
    .eq('as_of_date', dateISO)
    .order('market_value', { ascending: false })

  if (!attemptNew.error) return attemptNew.data || []

  // Fallback to legacy schema
  const attemptLegacy = await supabase
    .from('schwab_positions')
    .select('*')
    .eq('account_number', accountNumber)
    .eq('snapshot_date', dateISO)
    .order('market_value', { ascending: false })

  if (attemptLegacy.error) {
    throw new Error(`Failed to fetch Schwab positions: ${attemptLegacy.error.message}`)
  }

  return attemptLegacy.data || []
}

export default {
  syncSchwabPositionsForToday,
  getPositionsForAccountDate
}
