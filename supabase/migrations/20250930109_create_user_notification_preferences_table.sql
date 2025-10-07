-- Migration: Create user_notification_preferences table
-- Feature: 010-after-action-notes
-- Task: T010

CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  commitment_assigned_in_app BOOLEAN DEFAULT true,
  commitment_assigned_email BOOLEAN DEFAULT true,
  commitment_due_soon_in_app BOOLEAN DEFAULT true,
  commitment_due_soon_email BOOLEAN DEFAULT false,
  language_preference TEXT CHECK (language_preference IN ('en', 'ar')) DEFAULT 'en',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update timestamp trigger
CREATE TRIGGER update_user_notification_preferences_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_prefs()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default preferences on user creation
CREATE TRIGGER on_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION create_default_notification_prefs();
