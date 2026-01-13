-- Migration: Collaborative Editing System
-- Description: Real-time collaborative editing with track changes, suggestions, and inline comments
-- Google Docs-style collaboration with accept/reject workflows

-- =====================================================
-- ENUM TYPES
-- =====================================================

-- Suggestion status enum
CREATE TYPE suggestion_status AS ENUM (
  'pending',
  'accepted',
  'rejected',
  'resolved'
);

-- Change type enum
CREATE TYPE track_change_type AS ENUM (
  'insertion',
  'deletion',
  'replacement',
  'formatting'
);

-- Edit session status
CREATE TYPE edit_session_status AS ENUM (
  'active',
  'idle',
  'disconnected',
  'closed'
);

-- Inline comment status
CREATE TYPE inline_comment_status AS ENUM (
  'open',
  'resolved',
  'dismissed'
);

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Document edit sessions: tracks who is currently editing
CREATE TABLE document_edit_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  document_version_id UUID,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status edit_session_status NOT NULL DEFAULT 'active',
  cursor_position JSONB, -- { line: number, column: number, selection?: { start: Position, end: Position } }
  viewport JSONB, -- { scrollTop: number, scrollLeft: number, visibleRange: { start: number, end: number } }
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  disconnected_at TIMESTAMPTZ,
  session_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document suggestions: proposed changes from collaborators
CREATE TABLE document_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  document_version_id UUID,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content location
  start_position JSONB NOT NULL, -- { line: number, column: number, offset: number }
  end_position JSONB NOT NULL, -- { line: number, column: number, offset: number }

  -- Suggested change
  original_text TEXT NOT NULL,
  suggested_text TEXT NOT NULL,
  change_type track_change_type NOT NULL,

  -- Status and resolution
  status suggestion_status NOT NULL DEFAULT 'pending',
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_comment TEXT,

  -- Collaboration
  comment TEXT, -- Author's explanation of the suggestion
  thread_id UUID, -- Links to entity_comments for discussion

  -- Metadata
  suggestion_metadata JSONB DEFAULT '{}'::jsonb, -- formatting info, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Track changes: records all changes with authorship
CREATE TABLE document_track_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  document_version_id UUID,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES document_edit_sessions(id) ON DELETE SET NULL,

  -- Change location
  start_position JSONB NOT NULL,
  end_position JSONB NOT NULL,

  -- Change content
  original_text TEXT,
  new_text TEXT,
  change_type track_change_type NOT NULL,

  -- Status tracking
  is_accepted BOOLEAN DEFAULT NULL, -- NULL = pending, TRUE = accepted, FALSE = rejected
  accepted_by UUID REFERENCES auth.users(id),
  accepted_at TIMESTAMPTZ,

  -- Grouping related changes
  change_group_id UUID, -- Groups related changes together (e.g., find/replace all)
  sequence_number INTEGER, -- Order within a group

  -- Metadata
  change_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inline comments: comments anchored to specific text positions
CREATE TABLE document_inline_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  document_version_id UUID,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Anchored position
  anchor_start JSONB NOT NULL, -- { line: number, column: number, offset: number }
  anchor_end JSONB NOT NULL,
  highlighted_text TEXT NOT NULL,

  -- Comment content
  content TEXT NOT NULL,
  content_html TEXT, -- Rendered HTML for display

  -- Threading
  parent_id UUID REFERENCES document_inline_comments(id) ON DELETE CASCADE,
  thread_root_id UUID REFERENCES document_inline_comments(id) ON DELETE CASCADE,
  thread_depth INTEGER NOT NULL DEFAULT 0,

  -- Status
  status inline_comment_status NOT NULL DEFAULT 'open',
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,

  -- Mentions
  mentioned_users UUID[] DEFAULT '{}',

  -- Edit tracking
  is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  edit_count INTEGER NOT NULL DEFAULT 0,

  -- Soft delete
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_thread_depth CHECK (thread_depth <= 5)
);

-- Collaborative editing permissions
CREATE TABLE document_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Permissions
  can_edit BOOLEAN NOT NULL DEFAULT FALSE,
  can_suggest BOOLEAN NOT NULL DEFAULT TRUE,
  can_comment BOOLEAN NOT NULL DEFAULT TRUE,
  can_resolve BOOLEAN NOT NULL DEFAULT FALSE, -- Can accept/reject suggestions
  can_manage BOOLEAN NOT NULL DEFAULT FALSE, -- Can manage other collaborators

  -- Invitation tracking
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,

  -- Access control
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(document_id, user_id)
);

-- =====================================================
-- REAL-TIME OPERATIONS LOG
-- =====================================================

-- Operations log for conflict resolution and undo/redo
CREATE TABLE document_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  session_id UUID REFERENCES document_edit_sessions(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Operation type (insert, delete, replace, format, cursor_move, selection_change)
  operation_type TEXT NOT NULL,

  -- Operation data (OT-style operation)
  operation_data JSONB NOT NULL,

  -- Version vector for conflict resolution
  base_version INTEGER NOT NULL,
  resulting_version INTEGER NOT NULL,

  -- Timestamps for ordering
  client_timestamp TIMESTAMPTZ NOT NULL,
  server_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Undo/redo support
  is_undone BOOLEAN NOT NULL DEFAULT FALSE,
  undone_by UUID REFERENCES document_operations(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document version for OT (Operational Transformation)
CREATE TABLE document_collaborative_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL UNIQUE,

  -- Current document content
  content TEXT NOT NULL DEFAULT '',
  content_html TEXT,

  -- Version tracking
  current_version INTEGER NOT NULL DEFAULT 0,
  last_operation_id UUID REFERENCES document_operations(id),

  -- Editing mode
  track_changes_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  suggestions_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  -- Lock status
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  locked_by UUID REFERENCES auth.users(id),
  locked_at TIMESTAMPTZ,
  lock_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Edit sessions
CREATE INDEX idx_edit_sessions_document ON document_edit_sessions(document_id, status)
  WHERE status IN ('active', 'idle');
CREATE INDEX idx_edit_sessions_user ON document_edit_sessions(user_id, status);
CREATE INDEX idx_edit_sessions_activity ON document_edit_sessions(last_activity_at DESC)
  WHERE status = 'active';

-- Suggestions
CREATE INDEX idx_suggestions_document ON document_suggestions(document_id, status, created_at DESC);
CREATE INDEX idx_suggestions_author ON document_suggestions(author_id, created_at DESC);
CREATE INDEX idx_suggestions_pending ON document_suggestions(document_id, created_at DESC)
  WHERE status = 'pending';
CREATE INDEX idx_suggestions_position ON document_suggestions USING GIN (start_position, end_position);

-- Track changes
CREATE INDEX idx_track_changes_document ON document_track_changes(document_id, created_at DESC);
CREATE INDEX idx_track_changes_author ON document_track_changes(author_id, created_at DESC);
CREATE INDEX idx_track_changes_pending ON document_track_changes(document_id, created_at DESC)
  WHERE is_accepted IS NULL;
CREATE INDEX idx_track_changes_group ON document_track_changes(change_group_id, sequence_number);

-- Inline comments
CREATE INDEX idx_inline_comments_document ON document_inline_comments(document_id, status, created_at DESC)
  WHERE is_deleted = FALSE;
CREATE INDEX idx_inline_comments_thread ON document_inline_comments(thread_root_id, thread_depth, created_at ASC);
CREATE INDEX idx_inline_comments_author ON document_inline_comments(author_id, created_at DESC);
CREATE INDEX idx_inline_comments_mentioned ON document_inline_comments USING GIN (mentioned_users);

-- Collaborators
CREATE INDEX idx_collaborators_document ON document_collaborators(document_id) WHERE is_active = TRUE;
CREATE INDEX idx_collaborators_user ON document_collaborators(user_id, is_active);

-- Operations
CREATE INDEX idx_operations_document ON document_operations(document_id, server_timestamp DESC);
CREATE INDEX idx_operations_session ON document_operations(session_id, server_timestamp DESC);
CREATE INDEX idx_operations_version ON document_operations(document_id, base_version, resulting_version);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Get active editors for a document
CREATE OR REPLACE FUNCTION get_active_editors(p_document_id UUID)
RETURNS TABLE (
  session_id UUID,
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  avatar_url TEXT,
  cursor_position JSONB,
  status edit_session_status,
  last_activity_at TIMESTAMPTZ,
  color TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  colors TEXT[] := ARRAY['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
  color_index INTEGER := 0;
BEGIN
  RETURN QUERY
  SELECT
    s.id AS session_id,
    s.user_id,
    COALESCE(u.raw_user_meta_data->>'name', u.email) AS user_name,
    u.email AS user_email,
    u.raw_user_meta_data->>'avatar_url' AS avatar_url,
    s.cursor_position,
    s.status,
    s.last_activity_at,
    colors[(ROW_NUMBER() OVER (ORDER BY s.connected_at) - 1) % array_length(colors, 1) + 1] AS color
  FROM document_edit_sessions s
  JOIN auth.users u ON u.id = s.user_id
  WHERE s.document_id = p_document_id
    AND s.status IN ('active', 'idle')
    AND s.last_activity_at > NOW() - INTERVAL '5 minutes'
  ORDER BY s.connected_at;
END;
$$;

-- Get document suggestions with author info
CREATE OR REPLACE FUNCTION get_document_suggestions(
  p_document_id UUID,
  p_status suggestion_status DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  author_id UUID,
  author_name TEXT,
  author_email TEXT,
  author_avatar TEXT,
  start_position JSONB,
  end_position JSONB,
  original_text TEXT,
  suggested_text TEXT,
  change_type track_change_type,
  status suggestion_status,
  comment TEXT,
  resolved_by_id UUID,
  resolved_by_name TEXT,
  resolved_at TIMESTAMPTZ,
  resolution_comment TEXT,
  created_at TIMESTAMPTZ,
  reply_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.author_id,
    COALESCE(u.raw_user_meta_data->>'name', u.email) AS author_name,
    u.email AS author_email,
    u.raw_user_meta_data->>'avatar_url' AS author_avatar,
    s.start_position,
    s.end_position,
    s.original_text,
    s.suggested_text,
    s.change_type,
    s.status,
    s.comment,
    s.resolved_by AS resolved_by_id,
    COALESCE(r.raw_user_meta_data->>'name', r.email) AS resolved_by_name,
    s.resolved_at,
    s.resolution_comment,
    s.created_at,
    (SELECT COUNT(*) FROM entity_comments ec
     WHERE ec.entity_type = 'document_suggestion'
       AND ec.entity_id = s.id
       AND ec.is_deleted = FALSE) AS reply_count
  FROM document_suggestions s
  JOIN auth.users u ON u.id = s.author_id
  LEFT JOIN auth.users r ON r.id = s.resolved_by
  WHERE s.document_id = p_document_id
    AND (p_status IS NULL OR s.status = p_status)
  ORDER BY s.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Get track changes with author info
CREATE OR REPLACE FUNCTION get_document_track_changes(
  p_document_id UUID,
  p_show_pending_only BOOLEAN DEFAULT FALSE,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  author_id UUID,
  author_name TEXT,
  author_email TEXT,
  author_avatar TEXT,
  start_position JSONB,
  end_position JSONB,
  original_text TEXT,
  new_text TEXT,
  change_type track_change_type,
  is_accepted BOOLEAN,
  accepted_by_id UUID,
  accepted_by_name TEXT,
  accepted_at TIMESTAMPTZ,
  change_group_id UUID,
  sequence_number INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.id,
    tc.author_id,
    COALESCE(u.raw_user_meta_data->>'name', u.email) AS author_name,
    u.email AS author_email,
    u.raw_user_meta_data->>'avatar_url' AS author_avatar,
    tc.start_position,
    tc.end_position,
    tc.original_text,
    tc.new_text,
    tc.change_type,
    tc.is_accepted,
    tc.accepted_by AS accepted_by_id,
    COALESCE(a.raw_user_meta_data->>'name', a.email) AS accepted_by_name,
    tc.accepted_at,
    tc.change_group_id,
    tc.sequence_number,
    tc.created_at
  FROM document_track_changes tc
  JOIN auth.users u ON u.id = tc.author_id
  LEFT JOIN auth.users a ON a.id = tc.accepted_by
  WHERE tc.document_id = p_document_id
    AND (NOT p_show_pending_only OR tc.is_accepted IS NULL)
  ORDER BY tc.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Get inline comments with threading
CREATE OR REPLACE FUNCTION get_document_inline_comments(
  p_document_id UUID,
  p_status inline_comment_status DEFAULT NULL,
  p_thread_root_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  author_id UUID,
  author_name TEXT,
  author_email TEXT,
  author_avatar TEXT,
  anchor_start JSONB,
  anchor_end JSONB,
  highlighted_text TEXT,
  content TEXT,
  content_html TEXT,
  parent_id UUID,
  thread_root_id UUID,
  thread_depth INTEGER,
  status inline_comment_status,
  resolved_by_id UUID,
  resolved_by_name TEXT,
  resolved_at TIMESTAMPTZ,
  mentioned_users UUID[],
  is_edited BOOLEAN,
  edit_count INTEGER,
  created_at TIMESTAMPTZ,
  reply_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.author_id,
    COALESCE(u.raw_user_meta_data->>'name', u.email) AS author_name,
    u.email AS author_email,
    u.raw_user_meta_data->>'avatar_url' AS author_avatar,
    c.anchor_start,
    c.anchor_end,
    c.highlighted_text,
    c.content,
    c.content_html,
    c.parent_id,
    c.thread_root_id,
    c.thread_depth,
    c.status,
    c.resolved_by AS resolved_by_id,
    COALESCE(r.raw_user_meta_data->>'name', r.email) AS resolved_by_name,
    c.resolved_at,
    c.mentioned_users,
    c.is_edited,
    c.edit_count,
    c.created_at,
    (SELECT COUNT(*) FROM document_inline_comments ic
     WHERE ic.thread_root_id = c.id
       AND ic.is_deleted = FALSE) AS reply_count
  FROM document_inline_comments c
  JOIN auth.users u ON u.id = c.author_id
  LEFT JOIN auth.users r ON r.id = c.resolved_by
  WHERE c.document_id = p_document_id
    AND c.is_deleted = FALSE
    AND (p_status IS NULL OR c.status = p_status)
    AND (p_thread_root_id IS NULL OR c.thread_root_id = p_thread_root_id OR c.id = p_thread_root_id)
  ORDER BY
    CASE WHEN c.parent_id IS NULL THEN c.created_at END DESC,
    c.thread_depth ASC,
    c.created_at ASC;
END;
$$;

-- Accept or reject a suggestion
CREATE OR REPLACE FUNCTION resolve_suggestion(
  p_suggestion_id UUID,
  p_accept BOOLEAN,
  p_comment TEXT DEFAULT NULL
)
RETURNS document_suggestions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_suggestion document_suggestions;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  -- Check permission
  IF NOT EXISTS (
    SELECT 1 FROM document_collaborators dc
    JOIN document_suggestions s ON s.document_id = dc.document_id
    WHERE s.id = p_suggestion_id
      AND dc.user_id = v_user_id
      AND dc.can_resolve = TRUE
      AND dc.is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'User does not have permission to resolve suggestions';
  END IF;

  UPDATE document_suggestions
  SET
    status = CASE WHEN p_accept THEN 'accepted'::suggestion_status ELSE 'rejected'::suggestion_status END,
    resolved_by = v_user_id,
    resolved_at = NOW(),
    resolution_comment = p_comment,
    updated_at = NOW()
  WHERE id = p_suggestion_id
    AND status = 'pending'
  RETURNING * INTO v_suggestion;

  IF v_suggestion.id IS NULL THEN
    RAISE EXCEPTION 'Suggestion not found or already resolved';
  END IF;

  RETURN v_suggestion;
END;
$$;

-- Accept or reject a track change
CREATE OR REPLACE FUNCTION resolve_track_change(
  p_change_id UUID,
  p_accept BOOLEAN
)
RETURNS document_track_changes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_change document_track_changes;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  -- Check permission
  IF NOT EXISTS (
    SELECT 1 FROM document_collaborators dc
    JOIN document_track_changes tc ON tc.document_id = dc.document_id
    WHERE tc.id = p_change_id
      AND dc.user_id = v_user_id
      AND dc.can_resolve = TRUE
      AND dc.is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'User does not have permission to resolve track changes';
  END IF;

  UPDATE document_track_changes
  SET
    is_accepted = p_accept,
    accepted_by = v_user_id,
    accepted_at = NOW()
  WHERE id = p_change_id
    AND is_accepted IS NULL
  RETURNING * INTO v_change;

  IF v_change.id IS NULL THEN
    RAISE EXCEPTION 'Track change not found or already resolved';
  END IF;

  RETURN v_change;
END;
$$;

-- Accept or reject all pending changes in a group
CREATE OR REPLACE FUNCTION resolve_change_group(
  p_group_id UUID,
  p_accept BOOLEAN
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  UPDATE document_track_changes
  SET
    is_accepted = p_accept,
    accepted_by = v_user_id,
    accepted_at = NOW()
  WHERE change_group_id = p_group_id
    AND is_accepted IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN v_count;
END;
$$;

-- Resolve inline comment thread
CREATE OR REPLACE FUNCTION resolve_inline_comment(
  p_comment_id UUID,
  p_status inline_comment_status
)
RETURNS document_inline_comments
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_comment document_inline_comments;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  -- Update the comment and all replies in the thread
  UPDATE document_inline_comments
  SET
    status = p_status,
    resolved_by = CASE WHEN p_status IN ('resolved', 'dismissed') THEN v_user_id ELSE NULL END,
    resolved_at = CASE WHEN p_status IN ('resolved', 'dismissed') THEN NOW() ELSE NULL END,
    updated_at = NOW()
  WHERE (id = p_comment_id OR thread_root_id = p_comment_id)
    AND is_deleted = FALSE
  RETURNING * INTO v_comment;

  RETURN v_comment;
END;
$$;

-- Update cursor position for presence
CREATE OR REPLACE FUNCTION update_cursor_position(
  p_session_id UUID,
  p_cursor_position JSONB,
  p_viewport JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE document_edit_sessions
  SET
    cursor_position = p_cursor_position,
    viewport = COALESCE(p_viewport, viewport),
    last_activity_at = NOW(),
    status = 'active'
  WHERE id = p_session_id
    AND user_id = auth.uid();
END;
$$;

-- Join editing session
CREATE OR REPLACE FUNCTION join_edit_session(
  p_document_id UUID,
  p_document_version_id UUID DEFAULT NULL
)
RETURNS document_edit_sessions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session document_edit_sessions;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  -- Check if user already has an active session
  SELECT * INTO v_session
  FROM document_edit_sessions
  WHERE document_id = p_document_id
    AND user_id = v_user_id
    AND status IN ('active', 'idle');

  IF v_session.id IS NOT NULL THEN
    -- Reactivate existing session
    UPDATE document_edit_sessions
    SET
      status = 'active',
      last_activity_at = NOW()
    WHERE id = v_session.id
    RETURNING * INTO v_session;
  ELSE
    -- Create new session
    INSERT INTO document_edit_sessions (
      document_id,
      document_version_id,
      user_id,
      status
    ) VALUES (
      p_document_id,
      p_document_version_id,
      v_user_id,
      'active'
    )
    RETURNING * INTO v_session;
  END IF;

  RETURN v_session;
END;
$$;

-- Leave editing session
CREATE OR REPLACE FUNCTION leave_edit_session(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE document_edit_sessions
  SET
    status = 'closed',
    disconnected_at = NOW(),
    updated_at = NOW()
  WHERE id = p_session_id
    AND user_id = auth.uid();
END;
$$;

-- Get collaboration summary for a document
CREATE OR REPLACE FUNCTION get_collaboration_summary(p_document_id UUID)
RETURNS TABLE (
  active_editors INTEGER,
  pending_suggestions INTEGER,
  pending_changes INTEGER,
  open_comments INTEGER,
  track_changes_enabled BOOLEAN,
  suggestions_enabled BOOLEAN,
  is_locked BOOLEAN,
  locked_by_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM document_edit_sessions
     WHERE document_id = p_document_id
       AND status IN ('active', 'idle')
       AND last_activity_at > NOW() - INTERVAL '5 minutes'),
    (SELECT COUNT(*)::INTEGER FROM document_suggestions
     WHERE document_id = p_document_id AND status = 'pending'),
    (SELECT COUNT(*)::INTEGER FROM document_track_changes
     WHERE document_id = p_document_id AND is_accepted IS NULL),
    (SELECT COUNT(*)::INTEGER FROM document_inline_comments
     WHERE document_id = p_document_id AND status = 'open' AND is_deleted = FALSE),
    COALESCE(cs.track_changes_enabled, TRUE),
    COALESCE(cs.suggestions_enabled, TRUE),
    COALESCE(cs.is_locked, FALSE),
    CASE WHEN cs.is_locked THEN COALESCE(u.raw_user_meta_data->>'name', u.email) ELSE NULL END
  FROM (SELECT 1) AS dummy
  LEFT JOIN document_collaborative_state cs ON cs.document_id = p_document_id
  LEFT JOIN auth.users u ON u.id = cs.locked_by;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_collab_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_edit_sessions_updated_at
  BEFORE UPDATE ON document_edit_sessions
  FOR EACH ROW EXECUTE FUNCTION update_collab_updated_at();

CREATE TRIGGER update_suggestions_updated_at
  BEFORE UPDATE ON document_suggestions
  FOR EACH ROW EXECUTE FUNCTION update_collab_updated_at();

CREATE TRIGGER update_inline_comments_updated_at
  BEFORE UPDATE ON document_inline_comments
  FOR EACH ROW EXECUTE FUNCTION update_collab_updated_at();

CREATE TRIGGER update_collaborators_updated_at
  BEFORE UPDATE ON document_collaborators
  FOR EACH ROW EXECUTE FUNCTION update_collab_updated_at();

CREATE TRIGGER update_collaborative_state_updated_at
  BEFORE UPDATE ON document_collaborative_state
  FOR EACH ROW EXECUTE FUNCTION update_collab_updated_at();

-- Auto-set thread_root_id for inline comments
CREATE OR REPLACE FUNCTION set_inline_comment_thread_root()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT thread_root_id, thread_depth + 1
    INTO NEW.thread_root_id, NEW.thread_depth
    FROM document_inline_comments
    WHERE id = NEW.parent_id;

    IF NEW.thread_root_id IS NULL THEN
      NEW.thread_root_id := NEW.parent_id;
      NEW.thread_depth := 1;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_inline_comment_thread_root_trigger
  BEFORE INSERT ON document_inline_comments
  FOR EACH ROW EXECUTE FUNCTION set_inline_comment_thread_root();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE document_edit_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_track_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_inline_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_collaborative_state ENABLE ROW LEVEL SECURITY;

-- Helper function to check document access
CREATE OR REPLACE FUNCTION has_document_collab_access(p_document_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM document_collaborators
    WHERE document_id = p_document_id
      AND user_id = auth.uid()
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$;

-- Edit sessions policies
CREATE POLICY "Users can view sessions for accessible documents"
  ON document_edit_sessions FOR SELECT
  USING (has_document_collab_access(document_id));

CREATE POLICY "Users can manage their own sessions"
  ON document_edit_sessions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Suggestions policies
CREATE POLICY "Users can view suggestions for accessible documents"
  ON document_suggestions FOR SELECT
  USING (has_document_collab_access(document_id));

CREATE POLICY "Users can create suggestions if they have suggest permission"
  ON document_suggestions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM document_collaborators
      WHERE document_id = document_suggestions.document_id
        AND user_id = auth.uid()
        AND can_suggest = TRUE
        AND is_active = TRUE
    )
  );

CREATE POLICY "Authors can update their pending suggestions"
  ON document_suggestions FOR UPDATE
  USING (author_id = auth.uid() AND status = 'pending')
  WITH CHECK (author_id = auth.uid());

-- Track changes policies
CREATE POLICY "Users can view track changes for accessible documents"
  ON document_track_changes FOR SELECT
  USING (has_document_collab_access(document_id));

CREATE POLICY "Users can create track changes if they have edit permission"
  ON document_track_changes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM document_collaborators
      WHERE document_id = document_track_changes.document_id
        AND user_id = auth.uid()
        AND can_edit = TRUE
        AND is_active = TRUE
    )
  );

-- Inline comments policies
CREATE POLICY "Users can view inline comments for accessible documents"
  ON document_inline_comments FOR SELECT
  USING (has_document_collab_access(document_id) AND is_deleted = FALSE);

CREATE POLICY "Users can create inline comments if they have comment permission"
  ON document_inline_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM document_collaborators
      WHERE document_id = document_inline_comments.document_id
        AND user_id = auth.uid()
        AND can_comment = TRUE
        AND is_active = TRUE
    )
  );

CREATE POLICY "Authors can update their comments"
  ON document_inline_comments FOR UPDATE
  USING (author_id = auth.uid() AND is_deleted = FALSE)
  WITH CHECK (author_id = auth.uid());

-- Collaborators policies
CREATE POLICY "Users can view their own collaborator records"
  ON document_collaborators FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Managers can view all collaborators for their documents"
  ON document_collaborators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM document_collaborators dc
      WHERE dc.document_id = document_collaborators.document_id
        AND dc.user_id = auth.uid()
        AND dc.can_manage = TRUE
        AND dc.is_active = TRUE
    )
  );

CREATE POLICY "Managers can manage collaborators"
  ON document_collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM document_collaborators dc
      WHERE dc.document_id = document_collaborators.document_id
        AND dc.user_id = auth.uid()
        AND dc.can_manage = TRUE
        AND dc.is_active = TRUE
    )
  );

-- Operations policies
CREATE POLICY "Users can view operations for accessible documents"
  ON document_operations FOR SELECT
  USING (has_document_collab_access(document_id));

CREATE POLICY "Users can insert their own operations"
  ON document_operations FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- Collaborative state policies
CREATE POLICY "Users can view state for accessible documents"
  ON document_collaborative_state FOR SELECT
  USING (has_document_collab_access(document_id));

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- =====================================================

-- Enable realtime for collaborative editing tables
ALTER PUBLICATION supabase_realtime ADD TABLE document_edit_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE document_suggestions;
ALTER PUBLICATION supabase_realtime ADD TABLE document_track_changes;
ALTER PUBLICATION supabase_realtime ADD TABLE document_inline_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE document_collaborative_state;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE document_edit_sessions IS 'Tracks active editing sessions for real-time presence';
COMMENT ON TABLE document_suggestions IS 'Google Docs-style suggestions with accept/reject workflow';
COMMENT ON TABLE document_track_changes IS 'Track changes with authorship for collaborative editing';
COMMENT ON TABLE document_inline_comments IS 'Inline comments anchored to specific text positions';
COMMENT ON TABLE document_collaborators IS 'Document collaboration permissions per user';
COMMENT ON TABLE document_operations IS 'Operation log for OT-based conflict resolution';
COMMENT ON TABLE document_collaborative_state IS 'Current document state for collaborative editing';
