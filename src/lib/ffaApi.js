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
  const { data, error } = await supabase.rpc('api_get_dashboard', {
    as_of_date: asOfDate,
  })
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

export async function getMemberAccounts() {
  const { data, error } = await supabase
    .from('member_accounts')
    .select(MEMBER_ACCOUNT_FIELDS)
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
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

export async function getMemberTimeline(memberId) {
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
    .from('unit_prices')
    .select('id, price_date, unit_price')
    .order('price_date', { ascending: true })
  if (error) throw error
  return data || []
}

export async function getMemberDues(memberId) {
  let query = supabase
    .from('ffa_timeline')
    .select(`
      id,
      member_name,
      report_month,
      report_date,
      portfolio_value,
      total_units,
      total_contribution,
      ownership_pct,
      portfolio_growth,
      portfolio_growth_amount
    `)
    .order('report_date', { ascending: true })

  if (memberId) {
    query = query.eq('member_id', memberId)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

// ----------------------------
// Member Feed helpers
// ----------------------------

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
    // Treat the Supabase "Auth session missing" as a not-authenticated case
    if (userErr) {
      const isSessionMissing = (userErr.message || '').toLowerCase().includes('session missing')
      if (isSessionMissing) {
        throw new Error('Not authenticated')
      }
      throw userErr
    }
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
  getMemberAccounts,
  getCurrentMemberAccount,
  getMemberTimeline,
  getOrgBalanceHistory,
  getUnitPriceHistory,
  getMemberDues,
  getMemberFeed,
  createMemberPost,
  deleteMemberPost,
  likeMemberPost,
  unlikeMemberPost,
  getPostComments,
  createPostComment,
  deletePostComment,
}
