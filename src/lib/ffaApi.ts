import { supabase } from './supabase.js'

const MEMBER_ACCOUNT_FIELDS = `
  id,
  member_name,
  full_name,
  first_name,
  last_name,
  email,
  phone,
  join_date,
  membership_status,
  dues_status,
  notes,
  profile_user_id,
  account_status,
  user_id,
  user_role
`

const shapeMemberRow = (row: any) => {
  const fullName = row.full_name || row.member_name || row.email || 'Member'
  const membershipStatus = row.membership_status ?? row.status ?? 'active'
  const accountStatus = row.account_status || (row.user_id ? 'registered' : 'not_registered')

  return {
    ...row,
    full_name: fullName,
    member_name: row.member_name || fullName,
    first_name: row.first_name || '',
    last_name: row.last_name || '',
    status: membershipStatus,
    membership_status: membershipStatus,
    account_status: accountStatus,
    role: row.user_role || row.role || 'member'
  }
}

export async function getDashboard(asOfDate: string) {
  const { data, error } = await supabase.rpc('api_get_dashboard', {
    as_of_date: asOfDate,
  })
  if (error) throw error
  return data
}

export async function getMembers() {
  const { data, error } = await supabase
    .from('member_accounts')
    .select(MEMBER_ACCOUNT_FIELDS)
    .order('full_name', { ascending: true })
  if (error) throw error
  return (data || []).map(shapeMemberRow)
}

export async function getCurrentMemberProfile() {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  const user = authData?.user
  if (!user) return null

  const { data, error } = await supabase
    .from('member_accounts')
    .select(MEMBER_ACCOUNT_FIELDS)
    .or(
      `profile_user_id.eq.${user.id},user_id.eq.${user.id}${
        user.email ? `,email.eq.${encodeURIComponent(user.email)}` : ''
      }`
    )
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error
  return data ? shapeMemberRow(data) : null
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
  getCurrentMemberProfile,
  getMemberTimeline,
  getOrgBalanceHistory,
  getUnitPriceHistory,
  getMemberDues
}
