import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  getMemberFeed,
  createMemberPost,
  likeMemberPost,
  unlikeMemberPost,
  getPostComments,
  createPostComment,
  deleteMemberPost,
  deletePostComment,
} from '../../lib/ffaApi'
import { supabase } from '../../lib/supabase'
import { Trash, Heart, MessageSquare, Image, Link as LinkIcon } from 'lucide-react'

const PostComposer = ({ onCreate, currentUserId }) => {
  const [content, setContent] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(imageFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0]
    if (f) {
      setImageFile(f)
      setUploadError(null)
    }
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!content.trim() && !imageFile && !linkUrl) return
    setSubmitting(true)
    setUploadError(null)
    try {
      let imageUrl = null
      if (imageFile) {
        if (!currentUserId) {
          throw new Error('Missing current user id for image upload')
        }
        setUploading(true)
        const filePath = `${currentUserId}/${Date.now()}-${imageFile.name}`
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('member-post-images')
          .upload(filePath, imageFile, { cacheControl: '3600', upsert: false, metadata: { uploader: currentUserId, 'content-type': imageFile.type } })
        if (uploadErr) {
          setUploadError(uploadErr.message || 'Upload failed')
          setUploading(false)
          setSubmitting(false)
          return
        }
        const { data: publicUrlData } = supabase.storage.from('member-post-images').getPublicUrl(filePath)
        imageUrl = publicUrlData?.publicUrl || null
        setUploading(false)
      }

      const post = await createMemberPost({ content: content.trim(), imageUrl, linkUrl: linkUrl || null })
      setContent('')
      setLinkUrl('')
      setImageFile(null)
      setPreviewUrl(null)
      onCreate && onCreate(post)
    } catch (err) {
      console.error('Create post error', err)
      setUploadError(err.message || String(err))
      alert(err.message || 'Unable to create post')
    } finally {
      setUploading(false)
      setSubmitting(false)
    }
  }

  return (
    <div className="app-card">
      <form onSubmit={handleSubmit}>
        <textarea
          className="app-input w-full bg-transparent placeholder:text-slate-500 p-2 rounded-md border"
          rows={4}
          placeholder="Share an update, link, or photo with the club..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex gap-2 mt-2 items-center">
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <input className="app-input" placeholder="Link URL (optional)" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
        </div>
        {previewUrl && (
          <div className="mt-2">
            <img src={previewUrl} alt="preview" className="max-h-40 object-cover rounded-md" />
            <div className="text-xs text-slate-400">{imageFile?.name}</div>
          </div>
        )}
        {uploadError && <div className="text-red-400 mt-2">{uploadError}</div>}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="flex items-center gap-1"><Image size={16} /> Image</div>
            <div className="flex items-center gap-1"><LinkIcon size={16} /> Link</div>
          </div>
          <button className="app-btn app-btn-primary app-btn-sm" type="submit" disabled={submitting || uploading || (!content.trim() && !imageFile && !linkUrl)}>
            {uploading ? 'Uploading…' : submitting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  )
}

const CommentList = ({ postId, currentUserId, canDeleteComment, onCommentCreated }) => {
  const [loading, setLoading] = useState(false)
  const [comments, setComments] = useState(null)
  const [error, setError] = useState(null)
  const [text, setText] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPostComments(postId)
      setComments(data || [])
      setError(null)
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!text.trim()) return
    try {
      const comment = await createPostComment({ postId, content: text.trim() })
      setComments(prev => [comment, ...(prev || [])])
      setText('')
      onCommentCreated && onCommentCreated(comment)
    } catch (err) {
      alert(err.message || 'Unable to post comment')
    }
  }

  const handleDelete = async (commentId) => {
    if (!confirm('Delete this comment?')) return
    try {
      await deletePostComment(commentId)
      setComments(prev => (prev || []).filter(c => c.id !== commentId))
    } catch (err) {
      alert(err.message || 'Unable to delete comment')
    }
  }

  if (loading) return <div className="py-4 text-slate-400">Loading comments…</div>
  if (error) return <div className="py-4 text-red-500">{error}</div>
  return (
    <div className="mt-2">
      <div className="space-y-2">
        {(comments || []).length === 0 && <div className="text-slate-400">No comments yet</div>}
        {(comments || []).map(c => (
          <div key={c.id} className="p-2 rounded-md bg-slate-800/40 flex justify-between items-start">
            <div>
              <div className="text-xs text-slate-400">{c.author_id} • {new Date(c.created_at).toLocaleString()}</div>
              <div className="text-slate-100">{c.content}</div>
            </div>
            {canDeleteComment && <button className="app-btn app-btn-outline app-btn-sm" onClick={() => handleDelete(c.id)}><Trash size={14} /></button>}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input className="app-input flex-1" placeholder="Write a comment..." value={text} onChange={(e) => setText(e.target.value)} />
        <button className="app-btn app-btn-primary app-btn-sm" onClick={handleCreate} disabled={!text.trim()}>Reply</button>
      </div>
    </div>
  )
}

const PostCard = ({ post, currentUserId, profile, onDelete }) => {
  const [likes, setLikes] = useState(post.like_count || 0)
  const [commentsOpen, setCommentsOpen] = useState(false)
  // initialize liked state from post (enriched by feed loader)
  const [likedByMe, setLikedByMe] = useState(post.liked_by_me || false)

  useEffect(() => {
    setLikes(post.like_count || 0)
  }, [post.like_count])

  useEffect(() => {
    // keep local liked state in sync if post prop changes
    setLikedByMe(Boolean(post.liked_by_me))
  }, [post.liked_by_me])

  const toggleLike = async () => {
    try {
      if (likedByMe) {
        await unlikeMemberPost(post.post_id)
        setLikedByMe(false)
        setLikes(l => Math.max(0, l - 1))
      } else {
        await likeMemberPost(post.post_id)
        setLikedByMe(true)
        setLikes(l => l + 1)
      }
    } catch (err) {
      console.error('Like toggle error', err)
      alert(err.message || 'Unable to toggle like')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return
    try {
      await deleteMemberPost(post.post_id)
      onDelete && onDelete(post.post_id)
    } catch (err) {
      alert(err.message || 'Unable to delete post')
    }
  }

  const canDelete = profile?.role === 'admin' || currentUserId === post.author_id

  return (
    <div className="app-card">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-slate-200 font-medium">{post.author_name || post.author_id}</div>
          <div className="text-xs text-slate-500">{new Date(post.created_at).toLocaleString()}</div>
        </div>
        <div className="flex items-center gap-2">
          {canDelete && <button className="app-btn app-btn-outline app-btn-sm text-red-400" onClick={handleDelete}><Trash size={14} /></button>}
        </div>
      </div>
      <div className="mt-3 text-slate-100 whitespace-pre-wrap">{post.content}</div>
      {post.link_url && (
        <a href={post.link_url} target="_blank" rel="noreferrer" className="block mt-3 text-slate-300 underline">{post.link_url}</a>
      )}
      {post.image_url && (
        <div className="mt-3">
          <img src={post.image_url} alt="post" className="w-full max-h-60 object-cover rounded-md" />
        </div>
      )}

      <div className="mt-3 flex items-center gap-3">
        <button className="app-btn app-btn-outline app-btn-sm" onClick={toggleLike}><Heart size={14} /> <span className="ml-1">{likes}</span></button>
        <button className="app-btn app-btn-outline app-btn-sm" onClick={() => setCommentsOpen(v => !v)}><MessageSquare size={14} /> <span className="ml-1">Comments</span></button>
      </div>

      {commentsOpen && (
        <div className="mt-3">
          <CommentList postId={post.post_id} currentUserId={currentUserId} canDeleteComment={profile?.role === 'admin'} />
        </div>
      )}
    </div>
  )
}

const MemberFeed = () => {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [posts, setPosts] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadInitial = useCallback(async () => {
    setLoading(true)
    try {
      const { posts: p, nextCursor: nc } = await getMemberFeed({ limit: 20 })
      setPosts(p || [])
      setNextCursor(nc)
      setError(null)
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadInitial() }, [loadInitial])

  const handleCreate = async (post) => {
    // After creating a post we fetch the most recent enriched post from the RPC
    try {
      const { posts: latest } = await getMemberFeed({ limit: 1 })
      const newPost = (latest && latest[0]) || post
      setPosts(prev => [newPost, ...(prev || [])])
    } catch (err) {
      // Fallback to raw post if enrichment fails
      setPosts(prev => [post, ...(prev || [])])
    }
  }

  const loadMore = async () => {
    if (!nextCursor) return
    setLoadingMore(true)
    try {
      const { posts: p, nextCursor: nc } = await getMemberFeed({ limit: 20, cursor: nextCursor })
      setPosts(prev => [...(prev || []), ...(p || [])])
      setNextCursor(nc)
    } catch (err) {
      alert(err.message || 'Unable to load more')
    } finally {
      setLoadingMore(false)
    }
  }

  // server-side RPC returns enriched posts; no client-side enrichment needed

  const handleDeleteLocal = (postId) => {
    setPosts(prev => (prev || []).filter(p => p.post_id !== postId))
  }

  if (!profile) return null

  return (
    <div className="app-content">
      <div className="app-card">
        <div className="app-card-header">
          <div>
            <p className="app-heading-lg">Member Feed</p>
            <p className="app-text-muted">Share updates, links, and photos with the club.</p>
          </div>
        </div>
        <div className="app-card-content space-y-4">
          {error && <div className="app-alert">{error}</div>}
          <PostComposer onCreate={handleCreate} currentUserId={profile?.id} />
          {loading ? (
            <div className="py-8 text-center text-slate-400">Loading feed…</div>
          ) : (
            <div className="space-y-4">
              {(posts || []).length === 0 && <div className="text-slate-400">No posts yet.</div>}
              {(posts || []).map(post => (
                <PostCard key={post.post_id} post={post} currentUserId={profile.id} profile={profile} onDelete={handleDeleteLocal} />
              ))}
              {nextCursor && (
                <div className="text-center">
                  <button className="app-btn app-btn-outline" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Load more'}</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MemberFeed
