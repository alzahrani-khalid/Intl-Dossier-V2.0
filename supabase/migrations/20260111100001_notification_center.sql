-- =====================================================================================
-- Migration: Notification Center Enhancement
-- Description: Extends notification infrastructure with categories, push device tokens,
--              notification digests, and enhanced preferences for a centralized hub
-- Author: Claude Code
-- Date: 2026-01-11
-- Feature: notification-center
-- =====================================================================================

-- ===========================================
-- ENUM TYPES
-- ===========================================

-- Notification categories for filtering
CREATE TYPE notification_category AS ENUM (
    'assignments',      -- New dossier/task assignments
    'intake',           -- Service request updates
    'calendar',         -- Meeting reminders
    'signals',          -- Critical intelligence alerts
    'mentions',         -- User mentions in comments/discussions
    'deadlines',        -- Deadline warnings and SLA alerts
    'system',           -- App updates, sync conflicts
    'workflow'          -- Workflow state changes
);

-- Device platform types
CREATE TYPE device_platform AS ENUM ('ios', 'android', 'web');

-- ===========================================
-- PUSH DEVICE TOKENS TABLE
-- ===========================================
-- Stores device tokens for push notifications

CREATE TABLE IF NOT EXISTS public.push_device_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- User relationship
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Device identification
    device_token TEXT NOT NULL,
    platform device_platform NOT NULL,
    device_name TEXT,  -- e.g., "iPhone 15 Pro", "Chrome on Windows"

    -- Push provider info
    provider TEXT DEFAULT 'expo' CHECK (provider IN ('expo', 'fcm', 'apns', 'web_push')),

    -- Token status
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,
    failed_attempts INTEGER DEFAULT 0,
    last_error TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Unique constraint per user/token combination
    CONSTRAINT unique_user_device_token UNIQUE (user_id, device_token)
);

-- Create indexes
CREATE INDEX idx_push_device_tokens_user_id ON public.push_device_tokens(user_id);
CREATE INDEX idx_push_device_tokens_platform ON public.push_device_tokens(platform);
CREATE INDEX idx_push_device_tokens_active ON public.push_device_tokens(is_active) WHERE is_active = TRUE;

-- ===========================================
-- NOTIFICATION CATEGORY PREFERENCES TABLE
-- ===========================================
-- User preferences per notification category

CREATE TABLE IF NOT EXISTS public.notification_category_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- User relationship
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Category
    category notification_category NOT NULL,

    -- Channel preferences (which channels to use for this category)
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,

    -- Priority override (optional - affects urgency of delivery)
    priority_override TEXT CHECK (priority_override IN ('low', 'normal', 'high', 'urgent')),

    -- Sound settings (for mobile)
    sound_enabled BOOLEAN DEFAULT TRUE,
    custom_sound TEXT,  -- Reference to custom sound file

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Unique constraint per user/category
    CONSTRAINT unique_user_category_preference UNIQUE (user_id, category)
);

-- Create indexes
CREATE INDEX idx_notification_category_preferences_user_id ON public.notification_category_preferences(user_id);

-- ===========================================
-- NOTIFICATION DIGESTS TABLE
-- ===========================================
-- Tracks scheduled digest emails

CREATE TABLE IF NOT EXISTS public.notification_digests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- User relationship
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Digest type
    digest_type TEXT NOT NULL CHECK (digest_type IN ('daily', 'weekly')),

    -- Delivery info
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'skipped')),

    -- Content tracking
    notification_count INTEGER DEFAULT 0,
    notification_ids UUID[] DEFAULT '{}',

    -- Email details
    email_id UUID,  -- Reference to email_queue entry
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_notification_digests_user_id ON public.notification_digests(user_id);
CREATE INDEX idx_notification_digests_scheduled ON public.notification_digests(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_notification_digests_status ON public.notification_digests(status);

-- ===========================================
-- ADD CATEGORY TO EXISTING NOTIFICATIONS TABLE
-- ===========================================

ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS category notification_category DEFAULT 'system';

ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS source_type TEXT;  -- 'commitment', 'task', 'intake', 'calendar', etc.

ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS source_id UUID;  -- ID of the source entity

ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS push_sent BOOLEAN DEFAULT FALSE;

ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE;

ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS digest_included BOOLEAN DEFAULT FALSE;

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_notifications_category ON public.notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_source ON public.notifications(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_notifications_push_sent ON public.notifications(push_sent);

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_center_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create default category preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_category_preferences()
RETURNS TRIGGER AS $$
DECLARE
    cat notification_category;
BEGIN
    -- Create default preferences for each category
    FOREACH cat IN ARRAY ARRAY['assignments', 'intake', 'calendar', 'signals', 'mentions', 'deadlines', 'system', 'workflow']::notification_category[]
    LOOP
        INSERT INTO public.notification_category_preferences (user_id, category)
        VALUES (NEW.id, cat)
        ON CONFLICT (user_id, category) DO NOTHING;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread notification count by category
CREATE OR REPLACE FUNCTION get_notification_counts(p_user_id UUID)
RETURNS TABLE (
    category notification_category,
    total_count BIGINT,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.category,
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE n.read = FALSE) as unread_count
    FROM public.notifications n
    WHERE n.user_id = p_user_id
      AND (n.expires_at IS NULL OR n.expires_at > NOW())
    GROUP BY n.category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for a category
CREATE OR REPLACE FUNCTION mark_category_as_read(
    p_user_id UUID,
    p_category notification_category DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    IF p_category IS NULL THEN
        -- Mark all notifications as read
        UPDATE public.notifications
        SET read = TRUE, read_at = NOW()
        WHERE user_id = p_user_id AND read = FALSE;
    ELSE
        -- Mark specific category as read
        UPDATE public.notifications
        SET read = TRUE, read_at = NOW()
        WHERE user_id = p_user_id
          AND category = p_category
          AND read = FALSE;
    END IF;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification with category
CREATE OR REPLACE FUNCTION create_categorized_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_category notification_category DEFAULT 'system',
    p_data JSONB DEFAULT '{}'::jsonb,
    p_priority TEXT DEFAULT 'normal',
    p_action_url TEXT DEFAULT NULL,
    p_source_type TEXT DEFAULT NULL,
    p_source_id UUID DEFAULT NULL,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        category,
        data,
        priority,
        action_url,
        source_type,
        source_id,
        expires_at
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_message,
        p_category,
        p_data,
        p_priority,
        p_action_url,
        p_source_type,
        p_source_id,
        p_expires_at
    ) RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get paginated notifications with filters
CREATE OR REPLACE FUNCTION get_notifications_paginated(
    p_user_id UUID,
    p_category notification_category DEFAULT NULL,
    p_unread_only BOOLEAN DEFAULT FALSE,
    p_cursor TIMESTAMPTZ DEFAULT NULL,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    title TEXT,
    message TEXT,
    category notification_category,
    data JSONB,
    read BOOLEAN,
    read_at TIMESTAMPTZ,
    priority TEXT,
    action_url TEXT,
    source_type TEXT,
    source_id UUID,
    created_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.id,
        n.type,
        n.title,
        n.message,
        n.category,
        n.data,
        n.read,
        n.read_at,
        n.priority,
        n.action_url,
        n.source_type,
        n.source_id,
        n.created_at,
        n.expires_at
    FROM public.notifications n
    WHERE n.user_id = p_user_id
      AND (n.expires_at IS NULL OR n.expires_at > NOW())
      AND (p_category IS NULL OR n.category = p_category)
      AND (p_unread_only = FALSE OR n.read = FALSE)
      AND (p_cursor IS NULL OR n.created_at < p_cursor)
    ORDER BY n.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- TRIGGERS
-- ===========================================

-- Updated at triggers
CREATE TRIGGER update_push_device_tokens_updated_at
    BEFORE UPDATE ON public.push_device_tokens
    FOR EACH ROW EXECUTE FUNCTION update_notification_center_updated_at();

CREATE TRIGGER update_notification_category_preferences_updated_at
    BEFORE UPDATE ON public.notification_category_preferences
    FOR EACH ROW EXECUTE FUNCTION update_notification_center_updated_at();

CREATE TRIGGER update_notification_digests_updated_at
    BEFORE UPDATE ON public.notification_digests
    FOR EACH ROW EXECUTE FUNCTION update_notification_center_updated_at();

-- Default preferences trigger for new users
CREATE TRIGGER create_category_preferences_for_new_user
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION create_default_notification_category_preferences();

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE public.push_device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_category_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_digests ENABLE ROW LEVEL SECURITY;

-- Push device tokens: Users manage their own
CREATE POLICY "Users can manage own device tokens"
    ON public.push_device_tokens FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Notification category preferences: Users manage their own
CREATE POLICY "Users can view own category preferences"
    ON public.notification_category_preferences FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update own category preferences"
    ON public.notification_category_preferences FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own category preferences"
    ON public.notification_category_preferences FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Notification digests: Users view their own, system manages
CREATE POLICY "Users can view own digests"
    ON public.notification_digests FOR SELECT
    USING (user_id = auth.uid());

-- Add policy for notifications table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'notifications'
        AND policyname = 'Users can view own notifications'
    ) THEN
        CREATE POLICY "Users can view own notifications"
            ON public.notifications FOR SELECT
            USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'notifications'
        AND policyname = 'Users can update own notifications'
    ) THEN
        CREATE POLICY "Users can update own notifications"
            ON public.notifications FOR UPDATE
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- ===========================================
-- GRANTS
-- ===========================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_device_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notification_category_preferences TO authenticated;
GRANT SELECT ON public.notification_digests TO authenticated;

-- Service role needs full access for Edge Functions
GRANT ALL ON public.push_device_tokens TO service_role;
GRANT ALL ON public.notification_category_preferences TO service_role;
GRANT ALL ON public.notification_digests TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_notification_counts TO authenticated;
GRANT EXECUTE ON FUNCTION mark_category_as_read TO authenticated;
GRANT EXECUTE ON FUNCTION create_categorized_notification TO service_role;
GRANT EXECUTE ON FUNCTION get_notifications_paginated TO authenticated;

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON TABLE public.push_device_tokens IS 'Stores device tokens for push notifications (iOS, Android, Web)';
COMMENT ON TABLE public.notification_category_preferences IS 'User preferences per notification category for channel selection';
COMMENT ON TABLE public.notification_digests IS 'Tracks scheduled and sent notification digest emails';

COMMENT ON FUNCTION get_notification_counts IS 'Returns notification counts by category for a user';
COMMENT ON FUNCTION mark_category_as_read IS 'Marks all notifications as read, optionally by category';
COMMENT ON FUNCTION create_categorized_notification IS 'Creates a notification with category and source tracking';
COMMENT ON FUNCTION get_notifications_paginated IS 'Returns paginated notifications with optional filters';

-- ===========================================
-- ENABLE REALTIME FOR NOTIFICATIONS
-- ===========================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
