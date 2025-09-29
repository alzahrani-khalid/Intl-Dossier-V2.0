-- Create user_preferences table for storing theme, language, and color mode preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  theme TEXT NOT NULL DEFAULT 'gastat' CHECK (theme IN ('gastat', 'blue-sky')),
  color_mode TEXT NOT NULL DEFAULT 'light' CHECK (color_mode IN ('light', 'dark')),
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'ar')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy: Users can only read their own preferences
CREATE POLICY "Users can read own preferences"
  ON user_preferences
  FOR SELECT
  USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- Policy: Users can only insert their own preferences
CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- Policy: Users can only update their own preferences
CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  USING (auth.uid()::text = user_id OR auth.role() = 'service_role')
  WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- Policy: Users can only delete their own preferences
CREATE POLICY "Users can delete own preferences"
  ON user_preferences
  FOR DELETE
  USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON user_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_preferences TO service_role;

-- Add comment to table
COMMENT ON TABLE user_preferences IS 'Stores user theme, language, and color mode preferences for the application';
COMMENT ON COLUMN user_preferences.user_id IS 'Unique identifier for the user';
COMMENT ON COLUMN user_preferences.theme IS 'Selected theme: gastat or blue-sky';
COMMENT ON COLUMN user_preferences.color_mode IS 'Color mode: light or dark';
COMMENT ON COLUMN user_preferences.language IS 'Selected language: en (English) or ar (Arabic)';