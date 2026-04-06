-- Add push prompt dismissal tracking to user_preferences
-- Per D-11: store dismissal in database, not localStorage

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS push_prompt_dismissed_at TIMESTAMPTZ;

COMMENT ON COLUMN user_preferences.push_prompt_dismissed_at
IS 'Timestamp when user dismissed the push notification opt-in banner. NULL means not dismissed.';
