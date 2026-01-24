import { supabase } from '../lib/supabase'

async function readJson(response) {
  try {
    const text = await response.text()
    if (!text) return null
    return JSON.parse(text)
  } catch (error) {
    return { error: 'Unable to parse JSON response' }
  }
}

/**
 * Trigger a server-side Schwab positions sync (service role handles DB writes).
 * Idempotent per account + date on the backend.
 */
export async function syncSchwabPositionsForToday() {
  const today = new Date().toISOString().slice(0, 10)

  const response = await fetch('/api/schwab/sync-positions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: today }),
  })

  const data = await readJson(response)
  if (!response.ok) {
    const message = data?.error || data?.message || 'Failed to sync Schwab positions'
    throw new Error(message)
  }

  return data
}

/**
 * Get latest positions for an account on a given date
 */
export async function getPositionsForAccountDate(accountNumber, dateISO) {
  console.warn('getPositionsForAccountDate is deprecated; using latest_schwab_positions view')
  return getLatestPositionsForAccount(accountNumber)
}

export async function getLatestPositionsForAccount(accountNumber) {
  let query = supabase
    .from('latest_schwab_positions')
    .select('*')
    .order('market_value', { ascending: false })

  if (accountNumber) {
    query = query.eq('account_number', accountNumber)
  }

  const { data, error } = await query
  if (error) {
    throw new Error(`Failed to fetch latest Schwab positions: ${error.message}`)
  }

  return data || []
}

export default {
  syncSchwabPositionsForToday,
  getLatestPositionsForAccount,
  getPositionsForAccountDate
}
