import { supabase } from '../lib/supabase'
import schwabApi from './schwabApi'

/**
 * Fetch positions from Schwab and store them in the schwab_positions table.
 * Idempotent per account + date: deletes existing rows for today before insert.
 */
export async function syncSchwabPositionsForToday() {
  const today = new Date().toISOString().slice(0, 10)

  console.log('🔁 [syncSchwabPositionsForToday] Starting positions sync for date:', today)

  // 1) Get accounts (we already know this works)
  console.log('🔁 [syncSchwabPositionsForToday] Fetching accounts...')
  const accounts = await schwabApi.getAccounts()
  console.log('🔁 [syncSchwabPositionsForToday] Accounts fetched:', accounts)
  
  if (!accounts || accounts.length === 0) {
    throw new Error('No Schwab accounts returned when syncing positions')
  }

  const first = accounts[0]
  const sa = first.securitiesAccount
  const accountNumber = sa?.accountNumber
  
  console.log('🔁 [syncSchwabPositionsForToday] Resolved account number:', accountNumber)
  
  if (!accountNumber) {
    throw new Error('Missing accountNumber in Schwab account payload')
  }

  // 2) Use new API to fetch positions (avoids 400 errors)
  console.log('📞 [syncSchwabPositionsForToday] Calling getPositionsForAccount')
  console.log('📞 [syncSchwabPositionsForToday]   - Account number:', accountNumber)
  const accountData = await schwabApi.getPositionsForAccount(accountNumber)
  
  if (!accountData) {
    throw new Error(`Account ${accountNumber} not found when fetching positions`)
  }
  
  const positions = accountData?.securitiesAccount?.positions || []
  
  console.log('✅ [syncSchwabPositionsForToday] Received', positions.length, 'positions from API for account', accountNumber)

  // 3) Map Schwab positions → rows for schwab_positions
  const rows = positions.map(pos => {
    const instrument = pos.instrument || {}
    const longQty = pos.longQuantity ?? null
    const shortQty = pos.shortQuantity ?? null
    const mv = pos.marketValue ?? null
    const avgPrice = pos.averagePrice ?? null
    const dayPL = pos.currentDayProfitLoss ?? null
    const dayPLPct = pos.currentDayProfitLossPercentage ?? null
    const costBasis = pos.averagePrice ?? null

    return {
      snapshot_date: today,
      account_number: accountNumber,
      symbol: instrument.symbol || null,
      description: instrument.description || null,
      long_quantity: longQty,
      short_quantity: shortQty,
      average_price: avgPrice,
      market_value: mv,
      current_day_pl: dayPL,
      current_day_pl_pct: dayPLPct,
      cost_basis: costBasis
    }
  })

  // 4) Optional: delete existing rows for today before inserting (idempotent sync)
  console.log('🔁 [syncSchwabPositionsForToday] Deleting existing positions for', accountNumber, 'on', today)
  const { error: deleteError } = await supabase
    .from('schwab_positions')
    .delete()
    .eq('account_number', accountNumber)
    .eq('snapshot_date', today)
  
  console.log('🔁 [syncSchwabPositionsForToday] Delete result:', { deleteError })

  if (rows.length === 0) {
    console.warn('⚠️ [syncSchwabPositionsForToday] No positions found for account', accountNumber)
    return { accountNumber, as_of_date: today, positions_count: 0 }
  }

  console.log('🔁 [syncSchwabPositionsForToday] Inserting', rows.length, 'positions into schwab_positions...')
  const { error } = await supabase.from('schwab_positions').insert(rows)
  console.log('🔁 [syncSchwabPositionsForToday] Insert result:', { error, rowCount: rows.length })
  
  if (error) {
    throw new Error(`Failed to insert Schwab positions: ${error.message}`)
  }

  console.log('✅ [syncSchwabPositionsForToday] Successfully synced', rows.length, 'positions')
  return { accountNumber, as_of_date: today, positions_count: rows.length }
}

/**
 * Get latest positions for an account on a given date
 */
export async function getPositionsForAccountDate(accountNumber, dateISO) {
  const { data, error } = await supabase
    .from('schwab_positions')
    .select('*')
    .eq('account_number', accountNumber)
    .eq('snapshot_date', dateISO)
    .order('market_value', { ascending: false })

  if (error) throw new Error(`Failed to fetch Schwab positions: ${error.message}`)
  return data || []
}

export default {
  syncSchwabPositionsForToday,
  getPositionsForAccountDate
}
