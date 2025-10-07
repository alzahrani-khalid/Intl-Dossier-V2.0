-- Migration: Create external_contacts table
-- Feature: 010-after-action-notes
-- Task: T003

CREATE TABLE IF NOT EXISTS external_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 200),
  organization TEXT CHECK (char_length(organization) <= 200),
  notification_preference TEXT NOT NULL DEFAULT 'email' CHECK (notification_preference IN ('email', 'none')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_external_contacts_email ON external_contacts(email);

-- Update timestamp trigger
CREATE TRIGGER update_external_contacts_updated_at
  BEFORE UPDATE ON external_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
