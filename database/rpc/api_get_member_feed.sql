-- Drop existing function if present
DROP FUNCTION IF EXISTS public.api_get_member_feed(integer, timestamptz);

-- Create enriched member feed RPC
CREATE OR REPLACE FUNCTION public.api_get_member_feed(
  limit_count integer DEFAULT 20,
  cursor_timestamp timestamptz DEFAULT NULL
)
RETURNS TABLE(
  post_id uuid,
  author_id uuid,
  author_name text,
  content text,
  image_url text,
  link_url text,
  visibility text,
  created_at timestamptz,
  like_count bigint,
  comment_count bigint,
  liked_by_me boolean,
  next_cursor_timestamp timestamptz
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  has_more boolean;
BEGIN
  -- Fetch limit_count + 1 rows to detect whether there is a next page
  WITH feed_raw AS (
    SELECT mp.*
    FROM member_posts mp
    WHERE (
      mp.visibility = 'club'
      OR (mp.visibility = 'admin' AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
    )
    AND (cursor_timestamp IS NULL OR mp.created_at < cursor_timestamp)
    ORDER BY mp.created_at DESC
    LIMIT (limit_count + 1)
  ),
  marked AS (
    SELECT fr.*, ROW_NUMBER() OVER (ORDER BY fr.created_at DESC) AS rn
    FROM feed_raw fr
  ),
  sliced AS (
    SELECT * FROM marked WHERE rn <= limit_count
  ),
  feed_count AS (
    SELECT COUNT(*) AS cnt FROM feed_raw
  )

  SELECT (cnt > limit_count) INTO has_more FROM feed_count;

  -- Return the sliced rows joined with aggregates
  RETURN QUERY
  SELECT
    s.id::uuid AS post_id,
    s.author_id::uuid AS author_id,
    COALESCE(p.display_name, p.full_name, p.name, s.author_id::text) AS author_name,
    s.content,
    s.image_url,
    s.link_url,
    s.visibility,
    s.created_at,
    COALESCE((SELECT COUNT(*) FROM member_post_likes l WHERE l.post_id = s.id), 0)::bigint AS like_count,
    COALESCE((SELECT COUNT(*) FROM member_post_comments c WHERE c.post_id = s.id), 0)::bigint AS comment_count,
    COALESCE((SELECT EXISTS(SELECT 1 FROM member_post_likes l2 WHERE l2.post_id = s.id AND l2.member_id = auth.uid())), false) AS liked_by_me,
    CASE WHEN has_more THEN (SELECT MIN(created_at) FROM sliced) ELSE NULL END AS next_cursor_timestamp
  FROM sliced s
  LEFT JOIN profiles p ON p.id = s.author_id
  ORDER BY s.created_at DESC;
END;
$$;

-- Notes:
-- - This function uses auth.uid() to determine the current authenticated user when computing liked_by_me
--   and when checking whether the caller is an admin (via profiles.role).
-- - It returns up to `limit_count` rows ordered by created_at DESC and sets next_cursor_timestamp to the
--   created_at of the last returned row when there are more rows available (otherwise NULL).
