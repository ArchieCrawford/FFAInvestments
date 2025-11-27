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
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError) {
        setUploadError(authError.message || 'You must be signed in to post.')
        setSubmitting(false)
        return
      }
      const authUser = authData?.user
      if (!authUser) {
        setUploadError('You must be signed in to post.')
        setSubmitting(false)
        return
      }

      let imageUrl = null
      const uploaderId = currentUserId || authUser.id
      if (imageFile) {
        setUploading(true)
        const filePath = `${uploaderId}/${Date.now()}-${imageFile.name}`
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('member-post-images')
          .upload(filePath, imageFile, { cacheControl: '3600', upsert: false, metadata: { uploader: uploaderId, 'content-type': imageFile.type } })
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

      const post = await createMemberPost({
        content: content.trim(),
        imageUrl,
        linkUrl: linkUrl || null,
        authorId: authUser.id,
      })
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
    <div className="card">
      <form onSubmit={handleSubmit}>
        <textarea
          className="input w-full bg-transparent placeholder:text-muted p-2 rounded-md border border-border"
          rows={4}
          placeholder="Share an update, link, or photo with the club..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex gap-2 mt-2 items-center">
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <input className="input" placeholder="Link URL (optional)" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
        </div>
        {previewUrl && (
          <div className="mt-2">
            <img src={previewUrl} alt="preview" className="max-h-40 object-cover rounded-md" />
            <div className="text-xs text-muted">{imageFile?.name}</div>
          </div>
        )}
        {uploadError && <div className="text-muted mt-2">{uploadError}</div>}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3 text-muted">
            <div className="flex items-center gap-1"><Image size={16} /> Image</div>
            <div className="flex items-center gap-1"><LinkIcon size={16} /> Link</div>
          </div>
          <button className="btn-primary btn-sm" type="submit" disabled={submitting || uploading || (!content.trim() && !imageFile && !linkUrl)}>
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

  if (loading) return <div className="py-4 text-muted">Loading comments…</div>
  if (error) return <div className="py-4 text-muted">{error}</div>
  return (
    <div className="mt-2">
      <div className="space-y-2">
        {(comments || []).length === 0 && <div className="text-muted">No comments yet</div>}
        {(comments || []).map(c => (
          <div key={c.id} className="p-2 rounded-md bg-surface border border-border flex justify-between items-start">
            <div>
              <div className="text-xs text-muted">{c.author_id} • {new Date(c.created_at).toLocaleString()}</div>
              <div className="text-default">{c.content}</div>
            </div>
            {canDeleteComment && <button className="btn-primary-soft btn-sm border border-border" onClick={() => handleDelete(c.id)}><Trash size={14} /></button>}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input className="input flex-1" placeholder="Write a comment..." value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn-primary btn-sm" onClick={handleCreate} disabled={!text.trim()}>Reply</button>
      </div>
    </div>
  )
}

const PostCard = ({ post, currentUserId, profile, onDelete }) => {
  const [likes, setLikes] = useState(post.like_count || 0)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [likedByMe, setLikedByMe] = useState(post.liked_by_me || false)

  useEffect(() => {
    setLikes(post.like_count || 0)
  }, [post.like_count])

  useEffect(() => {
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
    <div className="card">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-default font-medium">{post.author_name || post.author_id}</div>
          <div className="text-xs text-muted">{new Date(post.created_at).toLocaleString()}</div>
        </div>
        <div className="flex items-center gap-2">
          {canDelete && <button className="btn-primary-soft btn-sm border border-border" onClick={handleDelete}><Trash size={14} /></button>}
        </div>
      </div>
      <div className="mt-3 text-default whitespace-pre-wrap">{post.content}</div>
      {post.link_url && (
        <a href={post.link_url} target="_blank" rel="noreferrer" className="block mt-3 text-muted underline">{post.link_url}</a>
      )}
      {post.image_url && (
        <div className="mt-3">
          <img src={post.image_url} alt="post" className="w-full max-h-60 object-cover rounded-md" />
        </div>
      )}

      <div className="mt-3 flex items-center gap-3">
        <button className="btn-primary-soft btn-sm border border-border" onClick={toggleLike}><Heart size={14} /> <span className="ml-1">{likes}</span></button>
        <button className="btn-primary-soft btn-sm border border-border" onClick={() => setCommentsOpen(v => !v)}><MessageSquare size={14} /> <span className="ml-1">Comments</span></button>
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
    try {
      const { posts: latest } = await getMemberFeed({ limit: 1 })
      const newPost = (latest && latest[0]) || post
      setPosts(prev => [newPost, ...(prev || [])])
    } catch (err) {
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

  const handleDeleteLocal = (postId) => {
    setPosts(prev => (prev || []).filter(p => p.post_id !== postId))
  }

  if (!profile) return null

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="card">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-default font-semibold text-xl">Member Feed</p>
            <p className="text-muted">Share updates, links, and photos with the club.</p>
          </div>
        </div>
        <div className="mt-3 space-y-4">
          {error && <div className="card bg-primary-soft border border-border text-default p-3 rounded-md">{error}</div>}
          <PostComposer onCreate={handleCreate} currentUserId={profile?.id} />
          {loading ? (
            <div className="py-8 text-center text-muted">Loading feed…</div>
          ) : (
            <div className="space-y-4">
              {(posts || []).length === 0 && <div className="text-muted">No posts yet.</div>}
              {(posts || []).map(post => (
                <PostCard key={post.post_id} post={post} currentUserId={profile.id} profile={profile} onDelete={handleDeleteLocal} />
              ))}
              {nextCursor && (
                <div className="text-center">
                  <button className="btn-primary-soft border border-border" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Load more'}</button>
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
