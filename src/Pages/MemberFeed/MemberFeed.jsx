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
import { Page } from '../../components/Page'

const avatarInitials = (name, fallback) => {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
  }
  return (fallback || '?').toUpperCase().slice(0, 2)
}

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
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false,
            metadata: { uploader: uploaderId, 'content-type': imageFile.type },
          })
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
      setUploadError(err.message || String(err))
      alert(err.message || 'Unable to create post')
    } finally {
      setUploading(false)
      setSubmitting(false)
    }
  }

  const disabled = submitting || uploading || (!content.trim() && !imageFile && !linkUrl)

  return (
    <div className="card border border-border/70 bg-gradient-to-br from-slate-950/80 via-slate-900/80 to-slate-950/80 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
          <Image size={18} className="opacity-80" />
        </div>
        <form onSubmit={handleSubmit} className="flex-1 space-y-3">
          <textarea
            className="input w-full bg-slate-900/80 border border-border/60 rounded-xl px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 resize-none"
            rows={3}
            placeholder="Share an update, link, or photo with the club..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {previewUrl && (
            <div className="rounded-xl overflow-hidden border border-border/60 bg-slate-900/80">
              <img src={previewUrl} alt="preview" className="max-h-60 w-full object-cover" />
              <div className="px-3 py-2 text-xs text-muted border-t border-border/60 flex items-center justify-between">
                <span>{imageFile?.name}</span>
                <span>{(imageFile?.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          )}
          {uploadError && (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-900/60 rounded-lg px-3 py-2">
              {uploadError}
            </div>
          )}
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/60 pt-3">
            <div className="flex items-center gap-2 text-xs text-muted">
              <label className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-900/80 border border-border/60 cursor-pointer hover:border-primary/60 hover:text-primary transition">
                <Image size={14} />
                <span>Image</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-900/80 border border-border/60">
                <LinkIcon size={14} />
                <input
                  className="bg-transparent border-none focus:outline-none text-xs placeholder:text-muted w-40"
                  placeholder="Link URL (optional)"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
              </div>
            </div>
            <button
              className="btn-primary btn-sm px-4 py-2 rounded-full text-xs font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              type="submit"
              disabled={disabled}
            >
              {uploading ? 'Uploading…' : submitting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </form>
      </div>
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

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async () => {
    if (!text.trim()) return
    try {
      const comment = await createPostComment({ postId, content: text.trim() })
      setComments((prev) => [comment, ...(prev || [])])
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
      setComments((prev) => (prev || []).filter((c) => c.id !== commentId))
    } catch (err) {
      alert(err.message || 'Unable to delete comment')
    }
  }

  if (loading) return <div className="py-3 text-xs text-muted">Loading comments…</div>
  if (error) return <div className="py-3 text-xs text-red-400">{error}</div>

  return (
    <div className="mt-3 space-y-3">
      <div className="space-y-2">
        {(comments || []).length === 0 && (
          <div className="text-xs text-muted bg-slate-950/60 border border-dashed border-border/60 rounded-lg px-3 py-2">
            No comments yet. Start the conversation.
          </div>
        )}
        {(comments || []).map((c) => (
          <div
            key={c.id}
            className="flex items-start gap-2 rounded-lg bg-slate-950/80 border border-border/60 px-3 py-2"
          >
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary">
              {avatarInitials(c.author_name, c.author_id)}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[11px] text-default font-medium">
                    {c.author_name || c.author_id}
                  </span>
                  <span className="text-[10px] text-muted">
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                </div>
                {canDeleteComment && (
                  <button
                    className="inline-flex items-center justify-center rounded-full border border-border/60 px-2 py-1 text-[10px] text-muted hover:text-red-400 hover:border-red-500 transition"
                    onClick={() => handleDelete(c.id)}
                  >
                    <Trash size={12} />
                  </button>
                )}
              </div>
              <div className="mt-1 text-xs text-default whitespace-pre-wrap">{c.content}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="input flex-1 bg-slate-950/80 border border-border/60 rounded-full px-3 py-2 text-xs placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60"
          placeholder="Write a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          className="btn-primary btn-sm rounded-full px-3 py-2 text-xs font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={handleCreate}
          disabled={!text.trim()}
        >
          Reply
        </button>
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
        setLikes((l) => Math.max(0, l - 1))
      } else {
        await likeMemberPost(post.post_id)
        setLikedByMe(true)
        setLikes((l) => l + 1)
      }
    } catch (err) {
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
    <div className="card border border-border/70 bg-slate-950/80 shadow-md hover:border-primary/50 transition">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
          {avatarInitials(post.author_name, post.author_id)}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start gap-3">
            <div className="space-y-0.5">
              <div className="text-sm text-default font-semibold">
                {post.author_name || 'Member'}
              </div>
              <div className="text-[11px] text-muted">
                {new Date(post.created_at).toLocaleString()}
              </div>
            </div>
            {canDelete && (
              <button
                className="inline-flex items-center justify-center rounded-full border border-border/60 px-2 py-1 text-[11px] text-muted hover:text-red-400 hover:border-red-500 transition"
                onClick={handleDelete}
              >
                <Trash size={14} />
              </button>
            )}
          </div>
          {post.content && (
            <div className="mt-3 text-sm text-default whitespace-pre-wrap leading-relaxed">
              {post.content}
            </div>
          )}
          {post.link_url && (
            <a
              href={post.link_url}
              target="_blank"
              rel="noreferrer"
              className="block mt-3 text-xs text-primary underline underline-offset-2 break-words hover:text-primary/80"
            >
              {post.link_url}
            </a>
          )}
          {post.image_url && (
            <div className="mt-3 overflow-hidden rounded-xl border border-border/60 bg-slate-900/80">
              <img src={post.image_url} alt="post" className="w-full max-h-72 object-cover" />
            </div>
          )}
          <div className="mt-4 flex items-center gap-3 text-xs">
            <button
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 border text-xs transition ${
                likedByMe
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-slate-950/80 border-border/60 text-muted hover:border-primary/60 hover:text-primary'
              }`}
              onClick={toggleLike}
            >
              <Heart size={14} className={likedByMe ? 'fill-primary' : ''} />
              <span>{likes}</span>
            </button>
            <button
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 border border-border/60 bg-slate-950/80 text-muted text-xs hover:border-primary/60 hover:text-primary transition"
              onClick={() => setCommentsOpen((v) => !v)}
            >
              <MessageSquare size={14} />
              <span>Comments</span>
            </button>
          </div>
          {commentsOpen && (
            <div className="mt-3 border-t border-border/60 pt-3">
              <CommentList
                postId={post.post_id}
                currentUserId={currentUserId}
                canDeleteComment={profile?.role === 'admin'}
              />
            </div>
          )}
        </div>
      </div>
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

  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  const handleCreate = async (post) => {
    try {
      const { posts: latest } = await getMemberFeed({ limit: 1 })
      const newPost = (latest && latest[0]) || post
      setPosts((prev) => [newPost, ...(prev || [])])
    } catch (err) {
      setPosts((prev) => [post, ...(prev || [])])
    }
  }

  const loadMore = async () => {
    if (!nextCursor) return
    setLoadingMore(true)
    try {
      const { posts: p, nextCursor: nc } = await getMemberFeed({ limit: 20, cursor: nextCursor })
      setPosts((prev) => [...(prev || []), ...(p || [])])
      setNextCursor(nc)
    } catch (err) {
      alert(err.message || 'Unable to load more')
    } finally {
      setLoadingMore(false)
    }
  }

  const handleDeleteLocal = (postId) => {
    setPosts((prev) => (prev || []).filter((p) => p.post_id !== postId))
  }

  if (!profile) return null

  return (
    <Page title="Member Feed" subtitle="Share updates, links, and photos with the club">
      <div className="w-full flex justify-center">
        <div className="w-full max-w-2xl space-y-5">
          {error && (
            <div className="rounded-xl border border-red-500/60 bg-red-950/40 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}
          <PostComposer onCreate={handleCreate} currentUserId={profile?.id} />
          {loading ? (
            <div className="py-10 text-center text-muted text-sm">Loading feed…</div>
          ) : (
            <div className="space-y-4">
              {(posts || []).length === 0 && (
                <div className="rounded-xl border border-dashed border-border/70 bg-slate-950/70 px-4 py-6 text-center text-sm text-muted">
                  No posts yet. Be the first to share an update with the club.
                </div>
              )}
              {(posts || []).map((post) => (
                <PostCard
                  key={post.post_id}
                  post={post}
                  currentUserId={profile.id}
                  profile={profile}
                  onDelete={handleDeleteLocal}
                />
              ))}
              {nextCursor && (
                <div className="text-center pt-2">
                  <button
                    className="inline-flex items-center justify-center rounded-full border border-border/70 bg-slate-950/80 px-4 py-2 text-xs text-muted hover:border-primary/60 hover:text-primary transition disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Page>
  )
}

export default MemberFeed
