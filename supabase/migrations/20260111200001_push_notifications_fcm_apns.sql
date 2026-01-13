-- =====================================================================================
-- Migration: Push Notifications FCM/APNS Integration
-- Description: Enhanced push notification infrastructure with FCM/APNS support,
--              notification history tracking, and failed delivery management
-- Author: Claude Code
-- Date: 2026-01-11
-- Feature: mobile-push-notifications
-- =====================================================================================

-- ===========================================
-- NOTIFICATION HISTORY TABLE
-- ===========================================
-- Tracks all sent push notifications for analytics and debugging

CREATE TABLE IF NOT EXISTS public.notification_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Notification content
    title TEXT NOT NULL,
    title_ar TEXT,  -- Arabic title for RTL users
    body TEXT NOT NULL,
    body_ar TEXT,   -- Arabic body for RTL users

    -- Categorization
    category notification_category NOT NULL DEFAULT 'system',
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),

    -- Deep linking
    deep_link TEXT,
    entity_type TEXT,  -- dossier, intake, calendar, etc.
    entity_id UUID,

    -- Custom data payload
    data JSONB DEFAULT '{}'::jsonb,

    -- Delivery statistics
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    skipped_count INTEGER DEFAULT 0,

    -- Detailed delivery results per device
    delivery_results JSONB DEFAULT '[]'::jsonb,

    -- Audit trail
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Indexes for common queries
    CONSTRAINT valid_priority CHECK (priority IN ('urgent', 'high', 'normal', 'low'))
);

-- Create indexes for notification history
CREATE INDEX idx_notification_history_category ON public.notification_history(category);
CREATE INDEX idx_notification_history_priority ON public.notification_history(priority);
CREATE INDEX idx_notification_history_entity ON public.notification_history(entity_type, entity_id);
CREATE INDEX idx_notification_history_created_at ON public.notification_history(created_at DESC);
CREATE INDEX idx_notification_history_created_by ON public.notification_history(created_by);

-- ===========================================
-- ENHANCE PUSH_DEVICE_TOKENS TABLE
-- ===========================================
-- Add columns for failed attempt tracking and locale

-- Add failed_attempts column if not exists
ALTER TABLE public.push_device_tokens
ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0;

-- Add device_id column for unique device identification
ALTER TABLE public.push_device_tokens
ADD COLUMN IF NOT EXISTS device_id TEXT;

-- Add locale column for localized notifications
ALTER TABLE public.push_device_tokens
ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en';

-- Add app_version column for version tracking
ALTER TABLE public.push_device_tokens
ADD COLUMN IF NOT EXISTS app_version TEXT;

-- Add os_version column
ALTER TABLE public.push_device_tokens
ADD COLUMN IF NOT EXISTS os_version TEXT;

-- Add device_model column
ALTER TABLE public.push_device_tokens
ADD COLUMN IF NOT EXISTS device_model TEXT;

-- Create index for device_id lookups
CREATE INDEX IF NOT EXISTS idx_push_device_tokens_device_id
ON public.push_device_tokens(device_id);

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Function to increment failed attempts for a device token
CREATE OR REPLACE FUNCTION increment_device_token_failed_attempts(token_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.push_device_tokens
    SET
        failed_attempts = failed_attempts + 1,
        updated_at = NOW()
    WHERE id = token_id;

    -- Deactivate token if too many failures (5+ consecutive failures)
    UPDATE public.push_device_tokens
    SET
        is_active = FALSE,
        last_error = 'Deactivated due to repeated failures',
        updated_at = NOW()
    WHERE id = token_id
      AND failed_attempts >= 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to register or update device token
CREATE OR REPLACE FUNCTION register_device_token(
    p_user_id UUID,
    p_device_token TEXT,
    p_device_id TEXT,
    p_platform device_platform,
    p_provider TEXT DEFAULT 'expo',
    p_device_name TEXT DEFAULT NULL,
    p_device_model TEXT DEFAULT NULL,
    p_os_version TEXT DEFAULT NULL,
    p_app_version TEXT DEFAULT NULL,
    p_locale TEXT DEFAULT 'en'
)
RETURNS TABLE (
    token_id UUID,
    is_new BOOLEAN
) AS $$
DECLARE
    v_existing_id UUID;
    v_is_new BOOLEAN;
BEGIN
    -- Check if token already exists for this user/device combination
    SELECT id INTO v_existing_id
    FROM public.push_device_tokens
    WHERE user_id = p_user_id
      AND (device_id = p_device_id OR device_token = p_device_token)
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        -- Update existing token
        UPDATE public.push_device_tokens
        SET
            device_token = p_device_token,
            device_id = COALESCE(p_device_id, device_id),
            platform = p_platform,
            provider = p_provider,
            device_name = COALESCE(p_device_name, device_name),
            device_model = COALESCE(p_device_model, device_model),
            os_version = COALESCE(p_os_version, os_version),
            app_version = COALESCE(p_app_version, app_version),
            locale = COALESCE(p_locale, locale),
            is_active = TRUE,
            failed_attempts = 0,
            last_error = NULL,
            last_used_at = NOW(),
            updated_at = NOW()
        WHERE id = v_existing_id;

        v_is_new := FALSE;
        RETURN QUERY SELECT v_existing_id, v_is_new;
    ELSE
        -- Insert new token
        INSERT INTO public.push_device_tokens (
            user_id,
            device_token,
            device_id,
            platform,
            provider,
            device_name,
            device_model,
            os_version,
            app_version,
            locale,
            is_active,
            failed_attempts,
            last_used_at,
            created_at,
            updated_at
        ) VALUES (
            p_user_id,
            p_device_token,
            p_device_id,
            p_platform,
            p_provider,
            p_device_name,
            p_device_model,
            p_os_version,
            p_app_version,
            p_locale,
            TRUE,
            0,
            NOW(),
            NOW(),
            NOW()
        )
        RETURNING id INTO v_existing_id;

        v_is_new := TRUE;
        RETURN QUERY SELECT v_existing_id, v_is_new;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active device tokens for users
CREATE OR REPLACE FUNCTION get_active_device_tokens(
    p_user_ids UUID[]
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    device_token TEXT,
    platform device_platform,
    provider TEXT,
    device_name TEXT,
    locale TEXT,
    notification_preferences JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pdt.id,
        pdt.user_id,
        pdt.device_token,
        pdt.platform,
        pdt.provider,
        pdt.device_name,
        pdt.locale,
        COALESCE(
            (SELECT jsonb_object_agg(ncp.category, ncp.push_enabled)
             FROM public.notification_category_preferences ncp
             WHERE ncp.user_id = pdt.user_id),
            '{}'::jsonb
        ) as notification_preferences
    FROM public.push_device_tokens pdt
    WHERE pdt.user_id = ANY(p_user_ids)
      AND pdt.is_active = TRUE
      AND pdt.failed_attempts < 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get notification analytics
CREATE OR REPLACE FUNCTION get_notification_analytics(
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    date DATE,
    category notification_category,
    total_sent BIGINT,
    total_delivered BIGINT,
    total_failed BIGINT,
    delivery_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE(nh.created_at) as date,
        nh.category,
        SUM(nh.sent_count + nh.failed_count + nh.skipped_count)::BIGINT as total_sent,
        SUM(nh.sent_count)::BIGINT as total_delivered,
        SUM(nh.failed_count)::BIGINT as total_failed,
        CASE
            WHEN SUM(nh.sent_count + nh.failed_count) > 0
            THEN ROUND(SUM(nh.sent_count)::NUMERIC / SUM(nh.sent_count + nh.failed_count) * 100, 2)
            ELSE 0
        END as delivery_rate
    FROM public.notification_history nh
    WHERE nh.created_at >= p_start_date
      AND nh.created_at <= p_end_date
    GROUP BY DATE(nh.created_at), nh.category
    ORDER BY date DESC, category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- Service role has full access to notification history
CREATE POLICY "Service role can manage notification history"
    ON public.notification_history FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Admins can view all notification history
CREATE POLICY "Admins can view notification history"
    ON public.notification_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Users can view their own notification history (created_by)
CREATE POLICY "Users can view own notification history"
    ON public.notification_history FOR SELECT
    USING (created_by = auth.uid());

-- ===========================================
-- GRANTS
-- ===========================================

GRANT SELECT, INSERT ON public.notification_history TO service_role;
GRANT SELECT ON public.notification_history TO authenticated;

GRANT EXECUTE ON FUNCTION increment_device_token_failed_attempts TO service_role;
GRANT EXECUTE ON FUNCTION register_device_token TO service_role;
GRANT EXECUTE ON FUNCTION get_active_device_tokens TO service_role;
GRANT EXECUTE ON FUNCTION get_notification_analytics TO authenticated;

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON TABLE public.notification_history IS 'Tracks all sent push notifications for analytics and debugging';
COMMENT ON FUNCTION increment_device_token_failed_attempts IS 'Increments failed attempt counter and deactivates token after 5 failures';
COMMENT ON FUNCTION register_device_token IS 'Registers or updates a device token with upsert logic';
COMMENT ON FUNCTION get_active_device_tokens IS 'Gets active device tokens with user notification preferences';
COMMENT ON FUNCTION get_notification_analytics IS 'Returns notification delivery analytics by date and category';
