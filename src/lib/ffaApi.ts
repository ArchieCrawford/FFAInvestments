import { supabase } from './supabase.js'

// API module for the new normalized schema

export async function getDashboard(asOfDate: string) {
  const { data, error } = await supabase.rpc('api_get_dashboard', {
    as_of_date: asOfDate,
  })
  if (error) throw error
  return data
}

export async function getMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('id, external_short_id, member_name, email, status')
    .order('member_name', { ascending: true })
  if (error) throw error
  return data
}

export async function getMemberTimeline(memberId: string) {
  const { data, error } = await supabase.rpc('api_get_member_timeline', {
    member_id_in: memberId,
  })
  if (error) throw error
  return data
}

export async function getOrgBalanceHistory() {
  const { data, error } = await supabase
    .from('org_balance_history')
    .select(
      'balance_date, stock_value, schwab_cash, schwab_mm, credit_union_cash, total_value'
    )
    .order('balance_date', { ascending: true })
  if (error) throw error
  return data
}

export async function getUnitPriceHistory() {
  const { data, error } = await supabase
    .from('member_monthly_balances')
    .select('report_date, portfolio_value, total_units')
    .order('report_date', { ascending: true })
  if (error) throw error
  return data
}

export async function getMemberDues(memberId: string) {
  const { data, error } = await supabase
    .from('member_dues')
    .select('dues_paid_buyout, dues_owed_oct_25, total_contribution, notes')
    .eq('member_id', memberId)
  if (error) throw error
  return data
}

export default {
  getDashboard,
  getMembers,
  getMemberTimeline,
  getOrgBalanceHistory,
  getUnitPriceHistory,
  getMemberDues
}
