-- Migration: Activity Feed Enhanced
-- Description: Create tables for enhanced activity feed with filters and entity following
-- Date: 2026-01-10

-- =============================================
-- ACTIVITY STREAM TABLE
-- =============================================
-- Main table for activity feed (denormalized for fast querying)
CREATE TABLE IF NOT EXISTS activity_stream (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Action Context
    action_type TEXT NOT NULL CHECK (action_type IN (
        'create', 'update', 'delete', 'comment', 'status_change',
        'upload', 'download', 'view', 'share', 'assign', 'mention',
        'approval', 'rejection', 'archive', 'restore'
    )),

    -- Entity Context
    entity_type TEXT NOT NULL CHECK (entity_type IN (
        'country', 'organization', 'person', 'engagement', 'forum',
        'working_group', 'theme', 'mou', 'document', 'event',
        'contact', 'task', 'brief', 'commitment', 'deliverable',
        'position', 'relationship', 'intelligence', 'intake_ticket'
    )),
    entity_id UUID NOT NULL,
    entity_name_en TEXT NOT NULL,
    entity_name_ar TEXT,

    -- Actor Context
    actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    actor_name TEXT NOT NULL,
    actor_email TEXT,
    actor_avatar_url TEXT,

    -- Description (bilingual)
    description_en TEXT NOT NULL,
    description_ar TEXT,

    -- Related Entity (for relationship activities)
    related_entity_type TEXT,
    related_entity_id UUID,
    related_entity_name_en TEXT,
    related_entity_name_ar TEXT,

    -- Target User (for mentions, assignments)
    target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    target_user_name TEXT,

    -- Metadata (flexible for type-specific data)
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Visibility & Privacy
    is_public BOOLEAN DEFAULT true,
    visibility_scope TEXT DEFAULT 'all' CHECK (visibility_scope IN (
        'all', 'team', 'managers', 'private'
    )),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_related_entity CHECK (
        (related_entity_type IS NULL AND related_entity_id IS NULL) OR
        (related_entity_type IS NOT NULL AND related_entity_id IS NOT NULL)
    )
);

-- =============================================
-- ENTITY FOLLOWS TABLE
-- =============================================
-- Track which entities users are following for targeted notifications
CREATE TABLE IF NOT EXISTS entity_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User following
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Entity being followed
    entity_type TEXT NOT NULL CHECK (entity_type IN (
        'country', 'organization', 'person', 'engagement', 'forum',
        'working_group', 'theme', 'mou', 'document', 'commitment',
        'deliverable', 'intake_ticket'
    )),
    entity_id UUID NOT NULL,
    entity_name_en TEXT NOT NULL,
    entity_name_ar TEXT,

    -- Notification preferences
    notify_on_update BOOLEAN DEFAULT true,
    notify_on_comment BOOLEAN DEFAULT true,
    notify_on_status_change BOOLEAN DEFAULT true,
    notify_on_mention BOOLEAN DEFAULT true,

    -- Metadata
    follow_reason TEXT CHECK (follow_reason IN (
        'manual', 'auto_creator', 'auto_assignee', 'auto_mention', 'auto_team'
    )) DEFAULT 'manual',

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint (user can only follow an entity once)
    CONSTRAINT unique_user_entity_follow UNIQUE (user_id, entity_type, entity_id)
);

-- =============================================
-- ACTIVITY FEED PREFERENCES TABLE
-- =============================================
-- User preferences for activity feed filtering and display
CREATE TABLE IF NOT EXISTS activity_feed_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

    -- Default filter preferences
    default_entity_types TEXT[] DEFAULT ARRAY[]::TEXT[],
    default_action_types TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Display preferences
    items_per_page INTEGER DEFAULT 20 CHECK (items_per_page BETWEEN 10 AND 100),
    show_own_activities BOOLEAN DEFAULT true,
    compact_view BOOLEAN DEFAULT false,

    -- Notification preferences
    email_digest_frequency TEXT DEFAULT 'daily' CHECK (email_digest_frequency IN (
        'realtime', 'hourly', 'daily', 'weekly', 'never'
    )),
    push_notifications_enabled BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Activity stream indexes
CREATE INDEX idx_activity_stream_created_at ON activity_stream(created_at DESC);
CREATE INDEX idx_activity_stream_actor ON activity_stream(actor_id, created_at DESC);
CREATE INDEX idx_activity_stream_entity ON activity_stream(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_activity_stream_action_type ON activity_stream(action_type, created_at DESC);
CREATE INDEX idx_activity_stream_entity_type ON activity_stream(entity_type, created_at DESC);
CREATE INDEX idx_activity_stream_target_user ON activity_stream(target_user_id, created_at DESC) WHERE target_user_id IS NOT NULL;
CREATE INDEX idx_activity_stream_related ON activity_stream(related_entity_type, related_entity_id) WHERE related_entity_id IS NOT NULL;
CREATE INDEX idx_activity_stream_visibility ON activity_stream(visibility_scope, is_public, created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_activity_stream_feed ON activity_stream(is_public, created_at DESC) WHERE is_public = true;
CREATE INDEX idx_activity_stream_user_feed ON activity_stream(actor_id, entity_type, created_at DESC);

-- Entity follows indexes
CREATE INDEX idx_entity_follows_user ON entity_follows(user_id);
CREATE INDEX idx_entity_follows_entity ON entity_follows(entity_type, entity_id);
CREATE INDEX idx_entity_follows_user_entity_type ON entity_follows(user_id, entity_type);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS
ALTER TABLE activity_stream ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed_preferences ENABLE ROW LEVEL SECURITY;

-- Activity stream policies
CREATE POLICY "activity_stream_select_public" ON activity_stream
    FOR SELECT
    USING (is_public = true OR actor_id = auth.uid() OR target_user_id = auth.uid());

CREATE POLICY "activity_stream_insert_authenticated" ON activity_stream
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Entity follows policies
CREATE POLICY "entity_follows_select_own" ON entity_follows
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "entity_follows_insert_own" ON entity_follows
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "entity_follows_update_own" ON entity_follows
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "entity_follows_delete_own" ON entity_follows
    FOR DELETE
    USING (user_id = auth.uid());

-- Activity feed preferences policies
CREATE POLICY "activity_feed_preferences_select_own" ON activity_feed_preferences
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "activity_feed_preferences_insert_own" ON activity_feed_preferences
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "activity_feed_preferences_update_own" ON activity_feed_preferences
    FOR UPDATE
    USING (user_id = auth.uid());

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
    p_action_type TEXT,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_entity_name_en TEXT,
    p_entity_name_ar TEXT DEFAULT NULL,
    p_description_en TEXT DEFAULT NULL,
    p_description_ar TEXT DEFAULT NULL,
    p_related_entity_type TEXT DEFAULT NULL,
    p_related_entity_id UUID DEFAULT NULL,
    p_related_entity_name_en TEXT DEFAULT NULL,
    p_related_entity_name_ar TEXT DEFAULT NULL,
    p_target_user_id UUID DEFAULT NULL,
    p_target_user_name TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_is_public BOOLEAN DEFAULT true,
    p_visibility_scope TEXT DEFAULT 'all'
) RETURNS UUID AS $$
DECLARE
    v_activity_id UUID;
    v_actor_id UUID;
    v_actor_name TEXT;
    v_actor_email TEXT;
    v_actor_avatar TEXT;
BEGIN
    -- Get current user info
    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to log activity';
    END IF;

    -- Get actor details from profiles or auth.users
    SELECT
        COALESCE(p.full_name, u.email) as name,
        u.email,
        p.avatar_url
    INTO v_actor_name, v_actor_email, v_actor_avatar
    FROM auth.users u
    LEFT JOIN profiles p ON p.id = u.id
    WHERE u.id = v_actor_id;

    -- Generate description if not provided
    IF p_description_en IS NULL THEN
        p_description_en := p_action_type || ' ' || p_entity_type;
    END IF;

    -- Insert activity
    INSERT INTO activity_stream (
        action_type,
        entity_type,
        entity_id,
        entity_name_en,
        entity_name_ar,
        actor_id,
        actor_name,
        actor_email,
        actor_avatar_url,
        description_en,
        description_ar,
        related_entity_type,
        related_entity_id,
        related_entity_name_en,
        related_entity_name_ar,
        target_user_id,
        target_user_name,
        metadata,
        is_public,
        visibility_scope
    ) VALUES (
        p_action_type,
        p_entity_type,
        p_entity_id,
        p_entity_name_en,
        p_entity_name_ar,
        v_actor_id,
        v_actor_name,
        v_actor_email,
        v_actor_avatar,
        p_description_en,
        p_description_ar,
        p_related_entity_type,
        p_related_entity_id,
        p_related_entity_name_en,
        p_related_entity_name_ar,
        p_target_user_id,
        p_target_user_name,
        p_metadata,
        p_is_public,
        p_visibility_scope
    )
    RETURNING id INTO v_activity_id;

    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to follow an entity
CREATE OR REPLACE FUNCTION follow_entity(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_entity_name_en TEXT,
    p_entity_name_ar TEXT DEFAULT NULL,
    p_follow_reason TEXT DEFAULT 'manual'
) RETURNS UUID AS $$
DECLARE
    v_follow_id UUID;
BEGIN
    INSERT INTO entity_follows (
        user_id,
        entity_type,
        entity_id,
        entity_name_en,
        entity_name_ar,
        follow_reason
    ) VALUES (
        auth.uid(),
        p_entity_type,
        p_entity_id,
        p_entity_name_en,
        p_entity_name_ar,
        p_follow_reason
    )
    ON CONFLICT (user_id, entity_type, entity_id) DO UPDATE
    SET follow_reason = EXCLUDED.follow_reason
    RETURNING id INTO v_follow_id;

    RETURN v_follow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unfollow an entity
CREATE OR REPLACE FUNCTION unfollow_entity(
    p_entity_type TEXT,
    p_entity_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM entity_follows
    WHERE user_id = auth.uid()
    AND entity_type = p_entity_type
    AND entity_id = p_entity_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's followed entities
CREATE OR REPLACE FUNCTION get_followed_entities(
    p_entity_type TEXT DEFAULT NULL
) RETURNS TABLE (
    id UUID,
    entity_type TEXT,
    entity_id UUID,
    entity_name_en TEXT,
    entity_name_ar TEXT,
    notify_on_update BOOLEAN,
    notify_on_comment BOOLEAN,
    notify_on_status_change BOOLEAN,
    notify_on_mention BOOLEAN,
    follow_reason TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ef.id,
        ef.entity_type,
        ef.entity_id,
        ef.entity_name_en,
        ef.entity_name_ar,
        ef.notify_on_update,
        ef.notify_on_comment,
        ef.notify_on_status_change,
        ef.notify_on_mention,
        ef.follow_reason,
        ef.created_at
    FROM entity_follows ef
    WHERE ef.user_id = auth.uid()
    AND (p_entity_type IS NULL OR ef.entity_type = p_entity_type)
    ORDER BY ef.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE activity_stream IS 'Denormalized activity stream for fast feed queries';
COMMENT ON TABLE entity_follows IS 'User entity follow subscriptions for targeted notifications';
COMMENT ON TABLE activity_feed_preferences IS 'User preferences for activity feed display and notifications';
COMMENT ON FUNCTION log_activity IS 'Log a new activity to the activity stream';
COMMENT ON FUNCTION follow_entity IS 'Follow an entity to receive activity notifications';
COMMENT ON FUNCTION unfollow_entity IS 'Unfollow an entity to stop receiving notifications';
