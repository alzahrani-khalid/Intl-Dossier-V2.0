-- Create user_preferences table for theme selection system
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  theme TEXT NOT NULL CHECK (theme IN ('gastat', 'blueSky')),
  color_mode TEXT NOT NULL CHECK (color_mode IN ('light', 'dark', 'system')),
  language TEXT NOT NULL CHECK (language IN ('en', 'ar')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_updated ON user_preferences(user_id, updated_at);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users cannot delete preferences (soft delete via updated_at)
-- No DELETE policy created intentionally

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Add comment for documentation
COMMENT ON TABLE user_preferences IS 'Stores user theme, color mode, and language preferences for the application';
COMMENT ON COLUMN user_preferences.theme IS 'Visual theme: gastat or blueSky';
COMMENT ON COLUMN user_preferences.color_mode IS 'Color mode: light, dark, or system';
COMMENT ON COLUMN user_preferences.language IS 'Interface language: en or ar';