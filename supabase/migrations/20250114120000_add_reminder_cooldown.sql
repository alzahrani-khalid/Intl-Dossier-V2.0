-- Migration: Add reminder cooldown tracking to assignments table
-- Feature: Waiting Queue Actions (023-specs-waiting-queue)
-- Purpose: Add last_reminder_sent_at column to track reminder cooldown period

-- Add last_reminder_sent_at column to assignments table
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ NULL;

-- Add comment for documentation
COMMENT ON COLUMN assignments.last_reminder_sent_at IS 'Timestamp of last follow-up reminder sent. Used to enforce cooldown period (default: 24 hours).';

-- Create index for cooldown checks (used by reminder service)
CREATE INDEX IF NOT EXISTS idx_assignments_reminder_cooldown
ON assignments(last_reminder_sent_at)
WHERE status IN ('pending', 'assigned');

-- Grant necessary permissions (if RLS enabled)
-- Users with 'send_reminders' permission can update this column
-- This is handled by RLS policies on assignments table (already exists)
