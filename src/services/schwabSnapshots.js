/**
 * Schwab Snapshots Service
 * 
 * This service captures snapshots of Schwab account data and stores them in Supabase
 * for historical analytics and tracking.
 * 
 * Tables:
 * - schwab_accounts: Account registry (one row per unique Schwab account)
 * - schwab_account_snapshots: Time-series data (historical balance snapshots)
 */

import { supabase } from '../lib/supabase'
import schwabApi from './schwabApi'

/**
 * Capture a snapshot of all Schwab accounts and store in Supabase
 * 
 * Process:
 * 1. Fetch all accounts from Schwab API
 * 2. For each account:
 *    - Upsert into schwab_accounts table (ensures registry is up-to-date)
 *    - Fetch detailed account data (balances, positions)
 *    - Insert snapshot into schwab_account_snapshots table
 * 
 * @returns {Promise<Object>} Snapshot summary with counts and latest data
 * @throws {Error} If snapshot capture fails
 */
export async function captureSchwabSnapshot() {
  try {
    console.log('📸 [captureSchwabSnapshot] Starting Schwab snapshot capture...')
    
    // 1. Fetch all accounts from Schwab
    console.log('📸 [captureSchwabSnapshot] Calling schwabApi.getAccounts()...')
    const accounts = await schwabApi.getAccounts()
    console.log('📸 [captureSchwabSnapshot] Accounts fetched:', accounts)
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No Schwab accounts found')
    }
    
    console.log(`✅ [captureSchwabSnapshot] Found ${accounts.length} Schwab account(s)`)
    
    const snapshots = []
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD format for date column
    
    // 2. Process each account
    for (const account of accounts) {
      const accountNumber = account.securitiesAccount?.accountNumber ?? account.accountNumber ?? account.accountId
      const accountType = account.securitiesAccount?.type ?? account.type
      const accountHash = account.hashValue ?? null
      
      console.log('📸 [captureSchwabSnapshot] Resolving accountNumber from account:', { 
        securitiesAccount: account.securitiesAccount?.accountNumber,
        accountNumber: account.accountNumber,
        accountId: account.accountId,
        resolved: accountNumber
      })
      
      if (!accountNumber) {
        console.warn('⚠️ [captureSchwabSnapshot] Skipping account with missing accountNumber:', account)
        continue
      }
      
      console.log(`📊 [captureSchwabSnapshot] Processing account: ${accountNumber}`)
      
      // 2a. Upsert into schwab_accounts (update registry)
  console.log(`📊 [captureSchwabSnapshot] Upserting account ${accountNumber} into schwab_accounts...`)
      const { data: accountRecord, error: upsertError } = await supabase
        .from('schwab_accounts')
        .upsert(
          {
            account_number: accountNumber,
            account_type: accountType,
            display_name: accountNumber
          },
          {
            onConflict: 'account_number',
            ignoreDuplicates: false
          }
        )
        .select()
        .single()
      
  console.log(`📊 [captureSchwabSnapshot] Upsert result for ${accountNumber}:`, { data: accountRecord, error: upsertError })
      
      if (upsertError) {
        console.error(`❌ Failed to upsert account ${accountNumber}:`, upsertError)
        throw new Error(`Failed to upsert account: ${upsertError.message}`)
      }
      
      console.log(`✅ Account ${accountNumber} registered (ID: ${accountRecord.id})`)
      
      // 2b. Fetch detailed account data using new API (avoids 400 errors)
      console.log(`📞 [captureSchwabSnapshot] Calling getPositionsForAccount`)
      console.log(`📞 [captureSchwabSnapshot]   - Account number: ${accountNumber}`)
      const accountDetails = await schwabApi.getPositionsForAccount(accountNumber)
      
      if (!accountDetails) {
        console.warn(`⚠️ [captureSchwabSnapshot] Account ${accountNumber} not found, skipping`)
        continue
      }
      
      console.log(`✅ [captureSchwabSnapshot] Received account details for ${accountNumber}`)
      
      // Extract balance fields from Schwab API response
      const currentBalances = accountDetails.securitiesAccount?.currentBalances ?? {}
      const { data: snapshotRecord, error: snapshotError } = await supabase
    .from('schwab_account_snapshots')
    .insert({
      account_id: accountRecord.id,
      account_number: accountNumber,
      snapshot_date: today,
      liquidation_value: currentBalances.liquidationValue ?? null,
      current_liquidation_value: currentBalances.liquidationValue ?? null,
      cash_balance: currentBalances.cashBalance ?? null,
      money_market_fund: currentBalances.moneyMarketFund ?? null,
      long_stock_value: null,
      long_option_value: currentBalances.longOptionMarketValue ?? null,
      mutual_fund_value: currentBalances.mutualFundValue ?? null,
      long_marginable_value: null,
      long_non_marginable_value: currentBalances.longNonMarginableMarketValue ?? null,
      total_cash: currentBalances.totalCash ?? null,
      raw_json: accountDetails
    })
    .select()
    .single()

      
      console.log(`📊 [captureSchwabSnapshot] Insert snapshot result for ${accountNumber}:`, { data: snapshotRecord, error: snapshotError })
      
      if (snapshotError) {
        // If unique constraint violation (duplicate snapshot for same account/date), log and continue
        if (snapshotError.code === '23505') {
          console.warn(`⚠️ Snapshot already exists for account ${accountNumber} at this timestamp`)
        } else {
          console.error(`❌ Failed to insert snapshot for ${accountNumber}:`, snapshotError)
          throw new Error(`Failed to insert snapshot: ${snapshotError.message}`)
        }
      } else {
        console.log(`✅ Snapshot captured for account ${accountNumber} (Snapshot ID: ${snapshotRecord.id})`)
        snapshots.push({
          accountNumber,
          accountId: accountRecord.id,
          snapshotId: snapshotRecord.id,
          liquidationValue: currentBalances.liquidationValue,
          timestamp: snapshotRecord.snapshot_date
        })
      }
    }
    
    console.log(`🎉 Snapshot capture complete! Processed ${snapshots.length} account(s)`)
    
    return {
      success: true,
      accountCount: accounts.length,
      snapshotCount: snapshots.length,
      snapshots,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('❌ Snapshot capture failed:', error)
    throw error
  }
}

/**
 * Get all snapshots for a specific account
 * 
 * @param {string} accountNumber - Schwab account number
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of snapshots to return (default: 100)
 * @param {string} options.orderBy - Sort order: 'asc' or 'desc' (default: 'desc')
 * @returns {Promise<Array>} Array of snapshots
 */
export async function getAccountSnapshots(accountNumber, options = {}) {
  const { limit = 100, orderBy = 'desc' } = options
  
  try {
    // First, get the account ID
    const { data: account, error: accountError } = await supabase
      .from('schwab_accounts')
      .select('id')
      .eq('account_number', accountNumber)
      .single()
    
    if (accountError) {
      throw new Error(`Failed to find account ${accountNumber}: ${accountError.message}`)
    }
    
    // Fetch snapshots
    const { data: snapshots, error: snapshotsError } = await supabase
      .from('schwab_account_snapshots')
      .select('*')
      .eq('account_id', account.id)
      .order('snapshot_date', { ascending: orderBy === 'asc' })
      .limit(limit)
    
    if (snapshotsError) {
      throw new Error(`Failed to fetch snapshots: ${snapshotsError.message}`)
    }
    
    return snapshots || []
  } catch (error) {
    console.error('❌ Failed to get account snapshots:', error)
    throw error
  }
}

/**
 * Get all accounts from Supabase registry
 * 
 * @returns {Promise<Array>} Array of registered accounts
 */
export async function getRegisteredAccounts() {
  try {
    const { data: accounts, error } = await supabase
      .from('schwab_accounts')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(`Failed to fetch accounts: ${error.message}`)
    }
    
    return accounts || []
  } catch (error) {
    console.error('❌ Failed to get registered accounts:', error)
    throw error
  }
}

/**
 * Get latest snapshot for each account
 * 
 * @returns {Promise<Array>} Array of latest snapshots
 */
export async function getLatestSnapshots() {
  try {
    // Use a raw SQL query to get the latest snapshot for each account
    const { data: snapshots, error } = await supabase
      .from('schwab_account_snapshots')
      .select(`
        *,
        schwab_accounts (
          account_number,
          account_type,
          account_hash
        )
      `)
      .order('snapshot_date', { ascending: false })
    
    if (error) {
      throw new Error(`Failed to fetch latest snapshots: ${error.message}`)
    }
    
    // Group by account_id and return only the latest for each
    const latestByAccount = {}
    for (const snapshot of snapshots || []) {
      if (!latestByAccount[snapshot.account_id]) {
        latestByAccount[snapshot.account_id] = snapshot
      }
    }
    
    return Object.values(latestByAccount)
  } catch (error) {
    console.error('❌ Failed to get latest snapshots:', error)
    throw error
  }
}

/**
 * Get snapshot count for an account
 * 
 * @param {string} accountNumber - Schwab account number
 * @returns {Promise<number>} Number of snapshots
 */
export async function getSnapshotCount(accountNumber) {
  try {
    // Get account ID
    const { data: account, error: accountError } = await supabase
      .from('schwab_accounts')
      .select('id')
      .eq('account_number', accountNumber)
      .single()
    
    if (accountError) {
      throw new Error(`Failed to find account ${accountNumber}: ${accountError.message}`)
    }
    
    // Count snapshots
    const { count, error: countError } = await supabase
      .from('schwab_account_snapshots')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', account.id)
    
    if (countError) {
      throw new Error(`Failed to count snapshots: ${countError.message}`)
    }
    
    return count || 0
  } catch (error) {
    console.error('❌ Failed to get snapshot count:', error)
    throw error
  }
}

export default {
  captureSchwabSnapshot,
  getAccountSnapshots,
  getRegisteredAccounts,
  getLatestSnapshots,
  getSnapshotCount
}
