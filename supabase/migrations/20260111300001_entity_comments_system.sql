-- =====================================================================
-- Entity Comments System with Threading, @Mentions, and Markdown Support
-- Migration: 20260111300001_entity_comments_system.sql
-- Description: Rich commenting system for entities and tickets with
--              @mentions, threaded replies, markdown, and role-based visibility
-- =====================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================================
-- ENUM TYPES
-- =====================================================================

-- Entity types that can have comments
CREATE TYPE commentable_entity_type AS ENUM (
  'dossier',
  'country',
  'organization',
  'forum',
  'mou',
  'event',
  'position',
  'intake_ticket',
  'engagement',
  'working_group',
  'document',
  'brief'
);

-- Visibility levels for comments
CREATE TYPE comment_visibility AS ENUM (
  'public',      -- Visible to all users with entity access
  'internal',    -- Visible to internal staff only
  'team',        -- Visible to team members assigned to entity
  'private'      -- Visible only to author and mentioned users
);

-- =====================================================================
-- ENTITY COMMENTS TABLE (Root comments and replies)
-- =====================================================================

CREATE TABLE IF NOT EXISTS entity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Polymorphic association to any entity type
  entity_type commentable_entity_type NOT NULL,
  entity_id UUID NOT NULL,

  -- Threading support (NULL for root comments)
  parent_id UUID REFERENCES entity_comments(id) ON DELETE CASCADE,
  thread_root_id UUID REFERENCES entity_comments(id) ON DELETE CASCADE,
  thread_depth INTEGER NOT NULL DEFAULT 0 CHECK (thread_depth >= 0 AND thread_depth <= 5),

  -- Comment content (supports markdown)
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 10000),
  content_html TEXT, -- Pre-rendered HTML for performance

  -- Author information
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Visibility and permissions
  visibility comment_visibility NOT NULL DEFAULT 'public',

  -- Edit tracking
  is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  edit_count INTEGER NOT NULL DEFAULT 0,

  -- Soft delete support
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),

  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add constraint for thread consistency
ALTER TABLE entity_comments ADD CONSTRAINT check_thread_root
  CHECK (
    (parent_id IS NULL AND thread_root_id IS NULL AND thread_depth = 0) OR
    (parent_id IS NOT NULL AND thread_root_id IS NOT NULL AND thread_depth > 0)
  );

-- =====================================================================
-- COMMENT MENTIONS TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS comment_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES entity_comments(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Position in text for highlighting
  start_position INTEGER NOT NULL CHECK (start_position >= 0),
  end_position INTEGER NOT NULL CHECK (end_position > start_position),
  mention_text TEXT NOT NULL, -- The @username text

  -- Notification tracking
  notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
  notification_sent_at TIMESTAMPTZ,
  notification_read BOOLEAN NOT NULL DEFAULT FALSE,
  notification_read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate mentions in same comment
  CONSTRAINT unique_mention_per_comment UNIQUE (comment_id, mentioned_user_id)
);

-- =====================================================================
-- COMMENT REACTIONS TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES entity_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Reaction emoji (whitelist for consistency)
  emoji TEXT NOT NULL CHECK (emoji IN ('👍', '👎', '❤️', '🎉', '😄', '😕', '🚀', '👀', '✅', '❓', '💡', '🔥')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One reaction type per user per comment
  CONSTRAINT unique_reaction_per_user UNIQUE (comment_id, user_id, emoji)
);

-- =====================================================================
-- COMMENT ATTACHMENTS TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS comment_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES entity_comments(id) ON DELETE CASCADE,

  -- File information
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 10485760), -- Max 10MB
  storage_path TEXT NOT NULL,

  -- Optional thumbnail for images
  thumbnail_path TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- COMMENT NOTIFICATIONS TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS comment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Notification target
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES entity_comments(id) ON DELETE CASCADE,

  -- Notification type
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'mention',         -- User was @mentioned
    'reply',           -- Reply to user's comment
    'reaction',        -- Reaction to user's comment
    'thread_update'    -- Update in a thread user participated in
  )),

  -- Related entities
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type commentable_entity_type NOT NULL,
  entity_id UUID NOT NULL,

  -- Status
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Email notification tracking
  email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate notifications
  CONSTRAINT unique_notification UNIQUE (user_id, comment_id, notification_type, actor_id)
);

-- =====================================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================================

-- Entity comments indexes
CREATE INDEX IF NOT EXISTS idx_entity_comments_entity
  ON entity_comments(entity_type, entity_id, created_at DESC)
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_entity_comments_author
  ON entity_comments(author_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_entity_comments_thread
  ON entity_comments(thread_root_id, thread_depth, created_at ASC)
  WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_entity_comments_parent
  ON entity_comments(parent_id)
  WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_entity_comments_visibility
  ON entity_comments(visibility);

-- Full-text search on content
CREATE INDEX IF NOT EXISTS idx_entity_comments_content_search
  ON entity_comments USING gin(to_tsvector('english', content));

-- Mentions indexes
CREATE INDEX IF NOT EXISTS idx_comment_mentions_user
  ON comment_mentions(mentioned_user_id, notification_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comment_mentions_comment
  ON comment_mentions(comment_id);

-- Reactions indexes
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment
  ON comment_reactions(comment_id);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_user
  ON comment_reactions(user_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_comment_notifications_user_unread
  ON comment_notifications(user_id, created_at DESC)
  WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_comment_notifications_entity
  ON comment_notifications(entity_type, entity_id);

-- =====================================================================
-- HELPER FUNCTIONS
-- =====================================================================

-- Function to get reply count for a comment
CREATE OR REPLACE FUNCTION get_comment_reply_count(p_comment_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM entity_comments
  WHERE thread_root_id = p_comment_id
    AND is_deleted = FALSE;
$$;

-- Function to get reaction summary for a comment
CREATE OR REPLACE FUNCTION get_comment_reactions_summary(p_comment_id UUID)
RETURNS JSONB
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    jsonb_object_agg(emoji, count),
    '{}'::JSONB
  )
  FROM (
    SELECT emoji, COUNT(*)::INTEGER as count
    FROM comment_reactions
    WHERE comment_id = p_comment_id
    GROUP BY emoji
  ) reactions;
$$;

-- Function to check if user can view comment based on visibility
CREATE OR REPLACE FUNCTION can_view_comment(
  p_comment_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_comment RECORD;
  v_is_team_member BOOLEAN;
  v_is_mentioned BOOLEAN;
BEGIN
  -- Get comment details
  SELECT * INTO v_comment
  FROM entity_comments
  WHERE id = p_comment_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Author can always see their own comments
  IF v_comment.author_id = p_user_id THEN
    RETURN TRUE;
  END IF;

  -- Check visibility level
  CASE v_comment.visibility
    WHEN 'public' THEN
      RETURN TRUE;
    WHEN 'internal' THEN
      -- Check if user is internal staff (has any role)
      RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = p_user_id
          AND role IS NOT NULL
      );
    WHEN 'team' THEN
      -- Check if user is assigned to the entity
      -- This needs to be entity-type specific
      RETURN TRUE; -- Simplified for now, implement per entity type
    WHEN 'private' THEN
      -- Check if user is mentioned
      RETURN EXISTS (
        SELECT 1 FROM comment_mentions
        WHERE comment_id = p_comment_id
          AND mentioned_user_id = p_user_id
      );
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$;

-- Function to extract mentions from text
CREATE OR REPLACE FUNCTION extract_mentions(p_content TEXT)
RETURNS TABLE (
  username TEXT,
  start_pos INTEGER,
  end_pos INTEGER
)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_pattern TEXT := '@([a-zA-Z0-9_.-]+)';
  v_match RECORD;
BEGIN
  FOR v_match IN
    SELECT
      (regexp_matches(p_content, v_pattern, 'g'))[1] as username,
      position('@' || (regexp_matches(p_content, v_pattern, 'g'))[1] in p_content) - 1 as start_pos
  LOOP
    username := v_match.username;
    start_pos := v_match.start_pos;
    end_pos := v_match.start_pos + length('@' || v_match.username);
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Function to render markdown to HTML (simplified - actual rendering done in Edge Function)
CREATE OR REPLACE FUNCTION render_comment_markdown(p_content TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT p_content; -- Actual rendering in Edge Function
$$;

-- =====================================================================
-- TRIGGER: Auto-update timestamps
-- =====================================================================

CREATE OR REPLACE FUNCTION update_comment_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  IF TG_OP = 'UPDATE' AND OLD.content != NEW.content THEN
    NEW.is_edited = TRUE;
    NEW.edited_at = NOW();
    NEW.edit_count = OLD.edit_count + 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_entity_comments_timestamp
  BEFORE UPDATE ON entity_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_timestamp();

-- =====================================================================
-- TRIGGER: Set thread_root_id for replies
-- =====================================================================

CREATE OR REPLACE FUNCTION set_comment_thread_root()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_parent RECORD;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    -- Get parent comment
    SELECT * INTO v_parent
    FROM entity_comments
    WHERE id = NEW.parent_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Parent comment not found';
    END IF;

    -- Check depth limit
    IF v_parent.thread_depth >= 5 THEN
      RAISE EXCEPTION 'Maximum thread depth reached';
    END IF;

    -- Set thread root (either parent's root or parent if it's root)
    NEW.thread_root_id := COALESCE(v_parent.thread_root_id, v_parent.id);
    NEW.thread_depth := v_parent.thread_depth + 1;

    -- Inherit entity type and ID from parent
    NEW.entity_type := v_parent.entity_type;
    NEW.entity_id := v_parent.entity_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_comment_thread_root
  BEFORE INSERT ON entity_comments
  FOR EACH ROW
  EXECUTE FUNCTION set_comment_thread_root();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

ALTER TABLE entity_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_notifications ENABLE ROW LEVEL SECURITY;

-- Entity Comments Policies
CREATE POLICY entity_comments_select ON entity_comments
  FOR SELECT
  USING (
    is_deleted = FALSE
    AND can_view_comment(id, auth.uid())
  );

CREATE POLICY entity_comments_insert ON entity_comments
  FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
  );

CREATE POLICY entity_comments_update ON entity_comments
  FOR UPDATE
  USING (
    author_id = auth.uid()
    AND is_deleted = FALSE
  );

CREATE POLICY entity_comments_delete ON entity_comments
  FOR DELETE
  USING (
    author_id = auth.uid()
  );

-- Comment Mentions Policies
CREATE POLICY comment_mentions_select ON comment_mentions
  FOR SELECT
  USING (
    mentioned_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM entity_comments
      WHERE id = comment_id AND author_id = auth.uid()
    )
  );

CREATE POLICY comment_mentions_insert ON comment_mentions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entity_comments
      WHERE id = comment_id AND author_id = auth.uid()
    )
  );

-- Comment Reactions Policies
CREATE POLICY comment_reactions_select ON comment_reactions
  FOR SELECT
  USING (TRUE); -- All users can see reactions

CREATE POLICY comment_reactions_insert ON comment_reactions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY comment_reactions_delete ON comment_reactions
  FOR DELETE
  USING (user_id = auth.uid());

-- Comment Attachments Policies
CREATE POLICY comment_attachments_select ON comment_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM entity_comments
      WHERE id = comment_id
        AND is_deleted = FALSE
        AND can_view_comment(id, auth.uid())
    )
  );

CREATE POLICY comment_attachments_insert ON comment_attachments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entity_comments
      WHERE id = comment_id AND author_id = auth.uid()
    )
  );

-- Comment Notifications Policies
CREATE POLICY comment_notifications_select ON comment_notifications
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY comment_notifications_update ON comment_notifications
  FOR UPDATE
  USING (user_id = auth.uid());

-- =====================================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================================

-- Comments with author info and aggregates
CREATE OR REPLACE VIEW entity_comments_with_details AS
SELECT
  ec.id,
  ec.entity_type,
  ec.entity_id,
  ec.parent_id,
  ec.thread_root_id,
  ec.thread_depth,
  ec.content,
  ec.content_html,
  ec.visibility,
  ec.is_edited,
  ec.edited_at,
  ec.edit_count,
  ec.created_at,
  ec.updated_at,
  ec.author_id,
  u.email AS author_email,
  u.raw_user_meta_data->>'full_name' AS author_name,
  u.raw_user_meta_data->>'avatar_url' AS author_avatar,
  get_comment_reply_count(ec.id) AS reply_count,
  get_comment_reactions_summary(ec.id) AS reactions,
  (
    SELECT jsonb_agg(jsonb_build_object(
      'id', cm.id,
      'user_id', cm.mentioned_user_id,
      'username', um.raw_user_meta_data->>'username',
      'name', um.raw_user_meta_data->>'full_name',
      'start_position', cm.start_position,
      'end_position', cm.end_position
    ))
    FROM comment_mentions cm
    JOIN auth.users um ON um.id = cm.mentioned_user_id
    WHERE cm.comment_id = ec.id
  ) AS mentions
FROM entity_comments ec
JOIN auth.users u ON u.id = ec.author_id
WHERE ec.is_deleted = FALSE;

-- Unread mention notifications count
CREATE OR REPLACE VIEW user_unread_mention_count AS
SELECT
  user_id,
  COUNT(*) AS unread_count
FROM comment_notifications
WHERE is_read = FALSE
  AND notification_type = 'mention'
GROUP BY user_id;

-- =====================================================================
-- RPC FUNCTIONS FOR EDGE FUNCTIONS
-- =====================================================================

-- Get comments for an entity with pagination
CREATE OR REPLACE FUNCTION get_entity_comments(
  p_entity_type commentable_entity_type,
  p_entity_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_include_replies BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  id UUID,
  parent_id UUID,
  thread_root_id UUID,
  thread_depth INTEGER,
  content TEXT,
  content_html TEXT,
  visibility comment_visibility,
  is_edited BOOLEAN,
  edit_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  author JSONB,
  reply_count INTEGER,
  reactions JSONB,
  mentions JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ec.id,
    ec.parent_id,
    ec.thread_root_id,
    ec.thread_depth,
    ec.content,
    ec.content_html,
    ec.visibility,
    ec.is_edited,
    ec.edit_count,
    ec.created_at,
    ec.updated_at,
    jsonb_build_object(
      'id', u.id,
      'email', u.email,
      'name', u.raw_user_meta_data->>'full_name',
      'avatar', u.raw_user_meta_data->>'avatar_url'
    ) AS author,
    get_comment_reply_count(ec.id) AS reply_count,
    get_comment_reactions_summary(ec.id) AS reactions,
    (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'user_id', cm.mentioned_user_id,
        'username', um.raw_user_meta_data->>'username',
        'name', um.raw_user_meta_data->>'full_name',
        'start_position', cm.start_position,
        'end_position', cm.end_position
      )), '[]'::JSONB)
      FROM comment_mentions cm
      JOIN auth.users um ON um.id = cm.mentioned_user_id
      WHERE cm.comment_id = ec.id
    ) AS mentions
  FROM entity_comments ec
  JOIN auth.users u ON u.id = ec.author_id
  WHERE ec.entity_type = p_entity_type
    AND ec.entity_id = p_entity_id
    AND ec.is_deleted = FALSE
    AND (p_include_replies OR ec.parent_id IS NULL)
    AND can_view_comment(ec.id, auth.uid())
  ORDER BY
    CASE WHEN ec.parent_id IS NULL THEN ec.created_at ELSE NULL END DESC,
    CASE WHEN ec.parent_id IS NOT NULL THEN ec.created_at ELSE NULL END ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Get thread replies
CREATE OR REPLACE FUNCTION get_comment_thread(
  p_thread_root_id UUID,
  p_max_depth INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  parent_id UUID,
  thread_depth INTEGER,
  content TEXT,
  content_html TEXT,
  visibility comment_visibility,
  is_edited BOOLEAN,
  created_at TIMESTAMPTZ,
  author JSONB,
  reactions JSONB,
  mentions JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ec.id,
    ec.parent_id,
    ec.thread_depth,
    ec.content,
    ec.content_html,
    ec.visibility,
    ec.is_edited,
    ec.created_at,
    jsonb_build_object(
      'id', u.id,
      'email', u.email,
      'name', u.raw_user_meta_data->>'full_name',
      'avatar', u.raw_user_meta_data->>'avatar_url'
    ) AS author,
    get_comment_reactions_summary(ec.id) AS reactions,
    (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'user_id', cm.mentioned_user_id,
        'username', um.raw_user_meta_data->>'username',
        'name', um.raw_user_meta_data->>'full_name'
      )), '[]'::JSONB)
      FROM comment_mentions cm
      JOIN auth.users um ON um.id = cm.mentioned_user_id
      WHERE cm.comment_id = ec.id
    ) AS mentions
  FROM entity_comments ec
  JOIN auth.users u ON u.id = ec.author_id
  WHERE ec.thread_root_id = p_thread_root_id
    AND ec.thread_depth <= p_max_depth
    AND ec.is_deleted = FALSE
    AND can_view_comment(ec.id, auth.uid())
  ORDER BY ec.thread_depth ASC, ec.created_at ASC;
END;
$$;

-- Search users for mention autocomplete
CREATE OR REPLACE FUNCTION search_users_for_mention(
  p_search_term TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)) AS username,
    u.raw_user_meta_data->>'full_name' AS full_name,
    u.email,
    u.raw_user_meta_data->>'avatar_url' AS avatar_url
  FROM auth.users u
  WHERE (
    u.raw_user_meta_data->>'username' ILIKE p_search_term || '%'
    OR u.raw_user_meta_data->>'full_name' ILIKE '%' || p_search_term || '%'
    OR u.email ILIKE p_search_term || '%'
  )
  ORDER BY
    CASE
      WHEN u.raw_user_meta_data->>'username' ILIKE p_search_term || '%' THEN 1
      WHEN u.raw_user_meta_data->>'full_name' ILIKE p_search_term || '%' THEN 2
      ELSE 3
    END,
    u.raw_user_meta_data->>'full_name'
  LIMIT p_limit;
END;
$$;

-- Mark notifications as read
CREATE OR REPLACE FUNCTION mark_comment_notifications_read(
  p_notification_ids UUID[]
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE comment_notifications
  SET
    is_read = TRUE,
    read_at = NOW()
  WHERE id = ANY(p_notification_ids)
    AND user_id = auth.uid()
    AND is_read = FALSE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- =====================================================================
-- GRANT PERMISSIONS
-- =====================================================================

GRANT USAGE ON TYPE commentable_entity_type TO authenticated;
GRANT USAGE ON TYPE comment_visibility TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON entity_comments TO authenticated;
GRANT SELECT, INSERT, DELETE ON comment_mentions TO authenticated;
GRANT SELECT, INSERT, DELETE ON comment_reactions TO authenticated;
GRANT SELECT, INSERT ON comment_attachments TO authenticated;
GRANT SELECT, UPDATE ON comment_notifications TO authenticated;

GRANT SELECT ON entity_comments_with_details TO authenticated;
GRANT SELECT ON user_unread_mention_count TO authenticated;

GRANT EXECUTE ON FUNCTION get_entity_comments TO authenticated;
GRANT EXECUTE ON FUNCTION get_comment_thread TO authenticated;
GRANT EXECUTE ON FUNCTION search_users_for_mention TO authenticated;
GRANT EXECUTE ON FUNCTION mark_comment_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION can_view_comment TO authenticated;
GRANT EXECUTE ON FUNCTION get_comment_reply_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_comment_reactions_summary TO authenticated;

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON TABLE entity_comments IS 'Rich commenting system for all entity types with threading, @mentions, and markdown support';
COMMENT ON TABLE comment_mentions IS 'Tracks @mentions in comments with notification status';
COMMENT ON TABLE comment_reactions IS 'Emoji reactions on comments';
COMMENT ON TABLE comment_attachments IS 'File attachments on comments';
COMMENT ON TABLE comment_notifications IS 'Notification queue for comment-related events';

COMMENT ON COLUMN entity_comments.visibility IS 'Controls who can see the comment: public (all), internal (staff), team (assigned), private (author + mentioned)';
COMMENT ON COLUMN entity_comments.thread_depth IS 'Nesting level in thread (0 = root, max 5)';
COMMENT ON COLUMN entity_comments.content_html IS 'Pre-rendered markdown HTML for performance';
