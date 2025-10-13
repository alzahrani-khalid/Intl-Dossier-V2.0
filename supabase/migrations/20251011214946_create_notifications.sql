-- Migration: Create notifications table
-- Feature: 019-user-management-access
-- Task: T011
-- Date: 2025-10-11

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,  -- 'delegation_expiring', 'role_changed', 'account_activated', 'approval_pending', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,  -- Additional notification data
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'normal',  -- 'low', 'normal', 'high', 'urgent'
  action_url TEXT,  -- URL for notification action
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.read = true AND OLD.read = false THEN
    NEW.read_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Helper function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}'::jsonb,
  p_priority TEXT DEFAULT 'normal',
  p_action_url TEXT DEFAULT NULL,
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
    data,
    priority,
    action_url,
    expires_at
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_data,
    p_priority,
    p_action_url,
    p_expires_at
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to send delegation expiry notifications (called by cron)
CREATE OR REPLACE FUNCTION notify_delegation_expired()
RETURNS void AS $$
DECLARE
  delegation_record RECORD;
  notification_id UUID;
BEGIN
  -- Find delegations expiring in next 7 days
  FOR delegation_record IN
    SELECT d.id, d.grantor_id, d.grantee_id, d.expires_at,
           u1.full_name as grantor_name,
           u2.full_name as grantee_name
    FROM delegations d
    JOIN auth.users u1 ON d.grantor_id = u1.id
    JOIN auth.users u2 ON d.grantee_id = u2.id
    WHERE d.revoked_at IS NULL
      AND d.expires_at > now()
      AND d.expires_at <= now() + interval '7 days'
      AND NOT EXISTS (
        -- Check if notification already sent for this delegation
        SELECT 1 FROM notifications
        WHERE user_id = d.grantor_id
          AND type = 'delegation_expiring'
          AND (data->>'delegation_id')::uuid = d.id
          AND created_at > now() - interval '7 days'
      )
  LOOP
    -- Notify grantor
    SELECT create_notification(
      delegation_record.grantor_id,
      'delegation_expiring',
      'Delegation Expiring Soon',
      format('Your delegation to %s will expire on %s',
        delegation_record.grantee_name,
        to_char(delegation_record.expires_at, 'YYYY-MM-DD HH24:MI')),
      jsonb_build_object(
        'delegation_id', delegation_record.id,
        'grantee_id', delegation_record.grantee_id,
        'expires_at', delegation_record.expires_at
      ),
      'high',
      '/delegations/' || delegation_record.id::text,
      delegation_record.expires_at
    ) INTO notification_id;

    -- Notify grantee
    SELECT create_notification(
      delegation_record.grantee_id,
      'delegation_expiring',
      'Delegated Access Expiring Soon',
      format('Your delegated access from %s will expire on %s',
        delegation_record.grantor_name,
        to_char(delegation_record.expires_at, 'YYYY-MM-DD HH24:MI')),
      jsonb_build_object(
        'delegation_id', delegation_record.id,
        'grantor_id', delegation_record.grantor_id,
        'expires_at', delegation_record.expires_at
      ),
      'high',
      '/delegations/' || delegation_record.id::text,
      delegation_record.expires_at
    ) INTO notification_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE notifications IS 'User notifications for delegation expiry, role changes, and system events';
COMMENT ON COLUMN notifications.user_id IS 'User receiving the notification';
COMMENT ON COLUMN notifications.type IS 'Notification type (delegation_expiring, role_changed, etc.)';
COMMENT ON COLUMN notifications.title IS 'Notification title';
COMMENT ON COLUMN notifications.message IS 'Notification message';
COMMENT ON COLUMN notifications.data IS 'Additional notification data (delegation_id, etc.)';
COMMENT ON COLUMN notifications.read IS 'Whether notification has been read';
COMMENT ON COLUMN notifications.priority IS 'Notification priority (low, normal, high, urgent)';
COMMENT ON COLUMN notifications.action_url IS 'URL for notification action';
COMMENT ON COLUMN notifications.expires_at IS 'Notification expiration timestamp';
