import { supabase } from './supabase.js' 

const MEMBER_ACCOUNT_FIELDS = `
  id,
  member_name,
  email,
  member_id,
  current_units,
  total_contributions,
  current_value,
  ownership_percentage,
  is_active,
  created_at,
  updated_at
`

export async function getDashboard(asOfDate) {
  const { data, error } = await supabase.rpc('api_get_dashboard')
  if (error) throw error
  return data
}

export async function getMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('member_name', { ascending: true })
  if (error) throw error
  return data || []
}

export async function getCompleteMemberProfiles() {
  const { data, error } = await supabase
    .from('members')
    .select(`
      *,
      member_accounts (
        current_units,
        current_value,
        total_contributions
      )
    `)
  if (error) throw error
  return data || []
}

export async function getLatestSchwabSnapshot() {
  const { data, error } = await supabase
    .from('schwab_account_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: false })
    .limit(1)
  if (error) throw error
  return data && data.length > 0 ? data[0] : null
}

export async function getSchwabPositionsForDate(dateStr) {
  const { data, error } = await supabase
    .from('schwab_positions')
    .select('*')
    .eq('as_of_date', dateStr)
  if (error) throw error
  return data || []
}

export async function getMemberAccounts() {
  const { data, error } = await supabase
    .from('member_accounts')
    .select(MEMBER_ACCOUNT_FIELDS)
    .eq('is_active', true)
    .order('member_name', { ascending: true })
  if (error) throw error
  return data || []
}

export async function getCurrentMemberAccount() {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  const user = authData?.user
  if (!user) return null

  const { data, error } = await supabase
    .from('member_accounts')
    .select(MEMBER_ACCOUNT_FIELDS)
    .eq('email', user.email)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

export async function getMemberTimelineByName(memberName) {
  const { data, error } = await supabase
    .from('ffa_timeline')
    .select('*')
    .eq('member_name', memberName)
    .order('report_date', { ascending: true })
  if (error) throw error
  return data || []
}

export const getMemberTimeline = getMemberTimelineByName;

export async function getMemberAccountByEmail(email) {
  const { data, error } = await supabase
    .from('member_accounts')
    .select(MEMBER_ACCOUNT_FIELDS)
    .eq('email', email)
    .eq('is_active', true)
    .maybeSingle()
  if (error && error.code !== 'PGRST116') throw error
  return data || null
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

export async function logMemberLogin({
  userId,
  email,
  ip,
  userAgent,
  isActive,
  memberAccountId,
  city,
  region,
  country,
}) {
  try {
    const { error } = await supabase.from('member_login_logs').insert([{
      user_id: userId,
      email,
      ip_address: ip,
      user_agent: userAgent,
      is_active_member: isActive,
      member_account_id: memberAccountId,
      was_successful: true,
      failure_reason: null,
      city,
      region,
      country,
    }])
    if (error) {
      console.warn('Login logging failed', error)
    }
  } catch (err) {
    console.warn('Login logging failed', err)
  }
}

export async function logFailedMemberLogin({
  email,
  failureReason,
  ip,
  userAgent,
}) {
  try {
    const { error } = await supabase.from('member_login_logs').insert([{
      user_id: null,
      email,
      ip_address: ip,
      user_agent: userAgent,
      is_active_member: null,
      member_account_id: null,
      was_successful: false,
      failure_reason: failureReason,
      city: null,
      region: null,
      country: null,
    }])
    if (error) {
      console.warn('Login logging failed', error)
    }
  } catch (err) {
    console.warn('Login logging failed', err)
  }
}

export async function getUnitPriceHistory() {
  const { data, error } = await supabase
    .from('unit_prices')
    .select('*')
    .order('price_date', { ascending: true })
  if (error) throw error
  return data || []
}

export async function getLatestUnitPrice() {
  const { data, error } = await supabase
    .from('unit_prices')
    .select('*')
    .order('price_date', { ascending: false })
    .limit(1)
  if (error) throw error
  return data && data.length > 0 ? data[0] : null
}

export const getLatestUnitValuation = getLatestUnitPrice;

export async function createMemberUnitTransaction(params) {
  const insertObj = {
    member_id: params.member_id,
    tx_date: params.tx_date,
    tx_type: params.tx_type,
    cash_amount: params.cash_amount,
    unit_value_at_tx: params.unit_value_at_tx ?? null,
    units_delta: params.units_delta ?? null,
    notes: params.notes ?? null,
    created_at: new Date().toISOString()
  };
  const { data, error } = await supabase
    .from('member_unit_transactions')
    .insert(insertObj)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data;
}



export async function getMemberFeed({ limit = 20, cursor = null } = {}) {
  const { data, error } = await supabase.rpc('api_get_member_feed', {
    limit_count: limit,
    cursor_timestamp: cursor || null,
  })
  if (error) throw error

  const posts = data || []
  const nextCursor = posts.length > 0 ? posts[posts.length - 1].next_cursor_timestamp || null : null
  return { posts, nextCursor }
}

export async function createMemberPost({ content, imageUrl = null, linkUrl = null, visibility = 'members', authorId }) {
  let resolvedAuthor = authorId
  if (!resolvedAuthor) {
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr) throw userErr
    const user = userData?.user
    if (!user) throw new Error('Not authenticated')
    resolvedAuthor = user.id
  }

  const insertObj = {
    author_id: resolvedAuthor,
    content,
    image_url: imageUrl,
    link_url: linkUrl,
    visibility,
  }

  const { data, error } = await supabase
    .from('member_posts')
    .insert([insertObj])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteMemberPost(postId) {
  const { data, error } = await supabase
    .from('member_posts')
    .delete()
    .eq('id', postId)
  if (error) throw error
  return data
}

export async function likeMemberPost(postId) {
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr) throw userErr
  const user = userData?.user
  if (!user) throw new Error('Not authenticated')

  const likeObj = { post_id: postId, member_id: user.id }
  try {
    const { data, error } = await supabase
      .from('member_post_likes')
      .insert(likeObj)
      .select()
      .single()
    if (error) {
      if (error?.code === '23505' || (error?.details && error.details.includes('already exists'))) {
        return { success: true }
      }
      throw error
    }
    return data
  } catch (err) {
    if (err?.code === '23505') return { success: true }
    throw err
  }
}

export async function unlikeMemberPost(postId) {
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr) throw userErr
  const user = userData?.user
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('member_post_likes')
    .delete()
    .match({ post_id: postId, member_id: user.id })
  if (error) throw error
  return data
}

export async function getPostComments(postId) {
  const { data, error } = await supabase
    .from('member_post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createPostComment({ postId, content }) {
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr) throw userErr
  const user = userData?.user
  if (!user) throw new Error('Not authenticated')

  const insertObj = { post_id: postId, author_id: user.id, content }
  const { data, error } = await supabase
    .from('member_post_comments')
    .insert(insertObj)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePostComment(commentId) {
  const { data, error } = await supabase
    .from('member_post_comments')
    .delete()
    .eq('id', commentId)
  if (error) throw error
  return data
}

export default {
  getDashboard,
  getMembers,
  getCompleteMemberProfiles,
  getMemberAccounts,
  getCurrentMemberAccount,
  getMemberTimelineByName,
  getMemberTimeline,
  getMemberAccountByEmail,
  getOrgBalanceHistory,
  getUnitPriceHistory,
  getLatestUnitPrice,
  getLatestUnitValuation,
  getLatestSchwabSnapshot,
  getSchwabPositionsForDate,
  getMemberFeed,
  createMemberPost,
  deleteMemberPost,
  likeMemberPost,
  unlikeMemberPost,
  getPostComments,
  createPostComment,
  deletePostComment,
}
