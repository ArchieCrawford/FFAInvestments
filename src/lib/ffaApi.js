import { supabase } from './supabase.js'

// API module for the normalized schema (JS version)

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
    .select('id, external_short_id, member_name, email, status')
    .order('member_name', { ascending: true })
  if (error) throw error
  return data
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
  // Fetch posts, then fetch likes/comments counts in bulk
  const fetchLimit = limit + 1 // fetch one extra to compute nextCursor
  let query = supabase.from('member_posts').select('*').order('created_at', { ascending: false }).limit(fetchLimit)
  if (cursor) {
    // expect cursor to be an ISO date string
    query = query.lt('created_at', cursor)
  }

  const { data: posts, error: postsError } = await query
  if (postsError) throw postsError

  const sliced = posts || []
  let nextCursor = null
  if (sliced.length > limit) {
    // more pages available
    const nextItem = sliced[limit]
    nextCursor = nextItem?.created_at || null
    sliced.splice(limit)
  }

  const postIds = sliced.map((p) => p.id).filter(Boolean)

  // Fetch likes for these posts in one call
  let likes = []
  if (postIds.length > 0) {
    const { data: likeRows, error: likesErr } = await supabase
      .from('member_post_likes')
      .select('post_id')
      .in('post_id', postIds)
    if (likesErr) throw likesErr
    likes = likeRows || []
  }

  // Fetch comments for these posts in one call
  let comments = []
  if (postIds.length > 0) {
    const { data: commentRows, error: commentsErr } = await supabase
      .from('member_post_comments')
      .select('post_id')
      .in('post_id', postIds)
    if (commentsErr) throw commentsErr
    comments = commentRows || []
  }

  // Build map of counts
  const likeCountMap = {}
  likes.forEach((r) => { likeCountMap[r.post_id] = (likeCountMap[r.post_id] || 0) + 1 })
  const commentCountMap = {}
  comments.forEach((r) => { commentCountMap[r.post_id] = (commentCountMap[r.post_id] || 0) + 1 })

  const postsOut = sliced.map((p) => ({
    id: p.id,
    author_id: p.author_id,
    content: p.content,
    image_url: p.image_url,
    link_url: p.link_url,
    created_at: p.created_at,
    like_count: likeCountMap[p.id] || 0,
    comment_count: commentCountMap[p.id] || 0,
  }))

  return { posts: postsOut, nextCursor }
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
