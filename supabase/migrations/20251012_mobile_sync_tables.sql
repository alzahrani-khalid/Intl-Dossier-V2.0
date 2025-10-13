-- Migration for mobile sync, auth, and notification tables

-- Create biometric_credentials table
CREATE TABLE IF NOT EXISTS biometric_credentials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  device_name text NOT NULL,
  platform text CHECK (platform IN ('ios', 'android')) NOT NULL,
  biometric_type text CHECK (biometric_type IN ('fingerprint', 'face', 'iris')) NOT NULL,
  public_key text NOT NULL,
  device_model text,
  os_version text,
  status text CHECK (status IN ('active', 'pending', 'inactive')) DEFAULT 'pending',
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, device_id)
);

-- Create refresh_tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  device_id text,
  is_active boolean DEFAULT true,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  INDEX idx_refresh_tokens_user_device (user_id, device_id),
  INDEX idx_refresh_tokens_hash (token_hash)
);

-- Create device_tokens table for push notifications
CREATE TABLE IF NOT EXISTS device_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  device_token text NOT NULL,
  platform text CHECK (platform IN ('ios', 'android')) NOT NULL,
  device_name text,
  device_model text,
  os_version text,
  app_version text,
  notification_preferences jsonb DEFAULT '{
    "assignments": true,
    "intake_updates": true,
    "role_changes": true,
    "kanban_updates": true,
    "task_reminders": true,
    "system_alerts": true
  }'::jsonb,
  status text CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  deactivated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, device_id)
);

-- Create notification_history table
CREATE TABLE IF NOT EXISTS notification_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  device_id text,
  title text NOT NULL,
  body text NOT NULL,
  category text NOT NULL,
  priority text CHECK (priority IN ('urgent', 'high', 'normal', 'low')) DEFAULT 'normal',
  data jsonb,
  status text CHECK (status IN ('sent', 'failed', 'pending')) DEFAULT 'pending',
  message_id text,
  error text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Add version column to all syncable tables if not exists
DO $$
BEGIN
  -- Add to dossiers
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name = 'dossiers' AND column_name = 'version') THEN
    ALTER TABLE dossiers ADD COLUMN version integer DEFAULT 1;
  END IF;

  -- Add to positions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name = 'positions' AND column_name = 'version') THEN
    ALTER TABLE positions ADD COLUMN version integer DEFAULT 1;
  END IF;

  -- Add to documents
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name = 'documents' AND column_name = 'version') THEN
    ALTER TABLE documents ADD COLUMN version integer DEFAULT 1;
  END IF;

  -- Add to calendar_entries
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name = 'calendar_entries' AND column_name = 'version') THEN
    ALTER TABLE calendar_entries ADD COLUMN version integer DEFAULT 1;
  END IF;

  -- Add to tasks
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name = 'tasks' AND column_name = 'version') THEN
    ALTER TABLE tasks ADD COLUMN version integer DEFAULT 1;
  END IF;

  -- Add to intake_tickets
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name = 'intake_tickets' AND column_name = 'version') THEN
    ALTER TABLE intake_tickets ADD COLUMN version integer DEFAULT 1;
  END IF;
END $$;

-- Add biometric fields to users table if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name = 'users' AND column_name = 'has_biometric_auth') THEN
    ALTER TABLE users ADD COLUMN has_biometric_auth boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name = 'users' AND column_name = 'biometric_setup_at') THEN
    ALTER TABLE users ADD COLUMN biometric_setup_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name = 'users' AND column_name = 'last_login_device') THEN
    ALTER TABLE users ADD COLUMN last_login_device text;
  END IF;
END $$;

-- Create indexes for efficient sync queries
CREATE INDEX IF NOT EXISTS idx_dossiers_updated_at ON dossiers(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_positions_updated_at ON positions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_entries_updated_at ON calendar_entries(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_intake_tickets_updated_at ON intake_tickets(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_dossier_relationships_updated_at ON dossier_relationships(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_position_dossier_links_updated_at ON position_dossier_links(updated_at DESC);

-- Create indexes for auth tables
CREATE INDEX IF NOT EXISTS idx_biometric_credentials_user ON biometric_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_credentials_device ON biometric_credentials(device_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_status ON device_tokens(status);
CREATE INDEX IF NOT EXISTS idx_notification_history_user ON notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_sent ON notification_history(sent_at DESC);

-- RLS policies for biometric_credentials
ALTER TABLE biometric_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own biometric credentials"
  ON biometric_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own biometric credentials"
  ON biometric_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own biometric credentials"
  ON biometric_credentials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own biometric credentials"
  ON biometric_credentials FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for refresh_tokens
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own refresh tokens"
  ON refresh_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own refresh tokens"
  ON refresh_tokens FOR ALL
  USING (auth.uid() = user_id);

-- RLS policies for device_tokens
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own device tokens"
  ON device_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own device tokens"
  ON device_tokens FOR ALL
  USING (auth.uid() = user_id);

-- RLS policies for notification_history
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification history"
  ON notification_history FOR SELECT
  USING (auth.uid() = user_id);

-- Function to update version on modification
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = COALESCE(OLD.version, 0) + 1;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-increment version
CREATE TRIGGER increment_dossiers_version
  BEFORE UPDATE ON dossiers
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

CREATE TRIGGER increment_positions_version
  BEFORE UPDATE ON positions
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

CREATE TRIGGER increment_documents_version
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

CREATE TRIGGER increment_calendar_entries_version
  BEFORE UPDATE ON calendar_entries
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

CREATE TRIGGER increment_tasks_version
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

CREATE TRIGGER increment_intake_tickets_version
  BEFORE UPDATE ON intake_tickets
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();