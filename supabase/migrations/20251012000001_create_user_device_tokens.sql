-- =====================================================================================
-- Migration: Create User Device Tokens Table for Push Notifications
-- Description: Stores device tokens for push notifications with platform-specific settings
-- Author: Database Architect
-- Date: 2025-10-12
-- =====================================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing table if needed (for idempotency)
DROP TABLE IF EXISTS public.user_device_tokens CASCADE;

-- Create user_device_tokens table for push notification management
CREATE TABLE public.user_device_tokens (
    -- Primary key
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Foreign key to users table
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Device identification
    device_id TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),

    -- Push notification token (Expo Push Token or native token)
    token TEXT NOT NULL,

    -- Token status
    is_active BOOLEAN DEFAULT true NOT NULL,

    -- Notification preferences (JSON structure for flexibility)
    notification_preferences JSONB DEFAULT '{
        "enabled": true,
        "dossier_updates": true,
        "intake_assignments": true,
        "mentions": true,
        "calendar_reminders": true,
        "system_alerts": true,
        "quiet_hours": {
            "enabled": false,
            "start": "22:00",
            "end": "08:00"
        },
        "sound": true,
        "vibration": true,
        "badge": true
    }'::jsonb NOT NULL,

    -- Device metadata
    device_name TEXT,
    device_model TEXT,
    os_version TEXT,
    app_version TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX idx_device_tokens_user_id
    ON public.user_device_tokens(user_id);

CREATE INDEX idx_device_tokens_device_id
    ON public.user_device_tokens(device_id);

CREATE UNIQUE INDEX idx_device_tokens_unique_token
    ON public.user_device_tokens(token)
    WHERE is_active = true;

CREATE INDEX idx_device_tokens_platform
    ON public.user_device_tokens(platform);

CREATE INDEX idx_device_tokens_active
    ON public.user_device_tokens(is_active)
    WHERE is_active = true;

CREATE INDEX idx_device_tokens_user_device
    ON public.user_device_tokens(user_id, device_id);

-- Create updated_at trigger
CREATE TRIGGER update_device_tokens_updated_at
    BEFORE UPDATE ON public.user_device_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_device_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own device tokens

-- Policy for SELECT: Users can view their own device tokens
CREATE POLICY "Users can view own device tokens"
    ON public.user_device_tokens
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy for INSERT: Users can register their own devices
CREATE POLICY "Users can insert own device tokens"
    ON public.user_device_tokens
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE: Users can update their own device tokens
CREATE POLICY "Users can update own device tokens"
    ON public.user_device_tokens
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE: Users can remove their own device tokens
CREATE POLICY "Users can delete own device tokens"
    ON public.user_device_tokens
    FOR DELETE
    USING (auth.uid() = user_id);

-- Admin policy: Admins can access all device tokens
CREATE POLICY "Admins can manage all device tokens"
    ON public.user_device_tokens
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Grant necessary permissions
GRANT ALL ON public.user_device_tokens TO authenticated;
GRANT SELECT ON public.user_device_tokens TO anon;

-- Add helpful comments for documentation
COMMENT ON TABLE public.user_device_tokens IS 'Stores device tokens for push notifications with platform-specific settings';
COMMENT ON COLUMN public.user_device_tokens.user_id IS 'Reference to the user who owns this device';
COMMENT ON COLUMN public.user_device_tokens.device_id IS 'Unique identifier for the device (e.g., Expo Device ID)';
COMMENT ON COLUMN public.user_device_tokens.platform IS 'Mobile platform: ios or android';
COMMENT ON COLUMN public.user_device_tokens.token IS 'Push notification token (Expo Push Token or native FCM/APNs token)';
COMMENT ON COLUMN public.user_device_tokens.is_active IS 'Whether this token is currently active and should receive notifications';
COMMENT ON COLUMN public.user_device_tokens.notification_preferences IS 'JSON object containing user notification preferences per device';
COMMENT ON COLUMN public.user_device_tokens.last_used_at IS 'Last time this device token was used to send a notification';

-- Function to clean up old inactive tokens (optional, for maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_device_tokens()
RETURNS void AS $$
BEGIN
    -- Delete inactive tokens older than 90 days
    DELETE FROM public.user_device_tokens
    WHERE is_active = false
    AND updated_at < NOW() - INTERVAL '90 days';

    -- Deactivate tokens not used in the last 180 days
    UPDATE public.user_device_tokens
    SET is_active = false
    WHERE last_used_at < NOW() - INTERVAL '180 days'
    AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a scheduled job to clean up old tokens (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-device-tokens', '0 2 * * *', 'SELECT public.cleanup_old_device_tokens();');

-- =====================================================================================
-- Rollback Script (commented out for safety)
-- =====================================================================================
-- DROP TABLE IF EXISTS public.user_device_tokens CASCADE;
-- DROP FUNCTION IF EXISTS public.cleanup_old_device_tokens();