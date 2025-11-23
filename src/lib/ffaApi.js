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

const shapeMemberRow = (row) => {
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

export async function getDashboard(asOfDate) {
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
    .from('member_monthly_balances')
    .select('report_date, portfolio_value, total_units')
    .order('report_date', { ascending: true })
  if (error) throw error
  return data
}

export async function getMemberDues(memberId) {
  const { data, error } = await supabase
    .from('member_dues')
    .select('dues_paid_buyout, dues_owed_oct_25, total_contribution, notes')
    .eq('member_id', memberId)
  if (error) throw error
  return data
}

// ----------------------------
// Member Feed helpers
// ----------------------------

export async function getMemberFeed({ limit = 20, cursor = null } = {}) {
  // Use server-side RPC that returns enriched feed rows
  const { data, error } = await supabase.rpc('api_get_member_feed', {
    limit_count: limit,
    cursor_timestamp: cursor || null,
  })
  if (error) throw error

  const rows = data || []
  // Map RPC fields to frontend shape
  const posts = rows.map((r) => ({
    id: r.post_id,
    author_id: r.author_id,
    author_name: r.author_name,
    content: r.content,
    image_url: r.image_url,
    link_url: r.link_url,
    visibility: r.visibility,
    created_at: r.created_at,
    like_count: r.like_count || 0,
    comment_count: r.comment_count || 0,
    liked_by_me: !!r.liked_by_me,
  }))

  // RPC returns next_cursor_timestamp (could be on each row or as last field)
  const nextCursor = rows.length > 0 ? rows[rows.length - 1].next_cursor_timestamp || null : null
  return { posts, nextCursor }
}

export async function createMemberPost({ content, imageUrl = null, linkUrl = null, visibility = 'members' }) {
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr) throw userErr
  const user = userData?.user
  if (!user) throw new Error('Not authenticated')

  const insertObj = {
    author_id: user.id,
    content,
    image_url: imageUrl,
    link_url: linkUrl,
    visibility,
  }

  const { data, error } = await supabase
    .from('member_posts')
    .insert(insertObj)
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
      // If duplicate like constraint, ignore
      // Postgres unique violation code 23505
      if (error?.code === '23505' || (error?.details && error.details.includes('already exists'))) {
        return { success: true }
      }
      throw error
    }
    return data
  } catch (err) {
    // Some Supabase errors come through as throwables
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
  getCurrentMemberProfile,
  getMemberTimeline,
  getOrgBalanceHistory,
  getUnitPriceHistory,
  getMemberDues,
  // Member feed exports
  getMemberFeed,
  createMemberPost,
  deleteMemberPost,
  likeMemberPost,
  unlikeMemberPost,
  getPostComments,
  createPostComment,
  deletePostComment,
}
