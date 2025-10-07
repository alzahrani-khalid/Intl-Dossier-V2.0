-- Migration: Create attachments table
-- Feature: 010-after-action-notes
-- Task: T008

CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  after_action_id UUID NOT NULL REFERENCES after_action_records(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL CHECK (char_length(file_name) BETWEEN 1 AND 255),
  file_key TEXT NOT NULL UNIQUE,
  file_size BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 104857600), -- 100MB
  mime_type TEXT NOT NULL CHECK (mime_type IN (
    'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/png', 'image/jpeg', 'text/plain', 'text/csv'
  )),
  scan_status TEXT NOT NULL DEFAULT 'pending' CHECK (scan_status IN ('pending', 'clean', 'infected', 'scan_failed')),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attachments_after_action ON attachments(after_action_id);
CREATE INDEX IF NOT EXISTS idx_attachments_scan_status ON attachments(scan_status);

-- Function to check attachment limit
CREATE OR REPLACE FUNCTION check_attachment_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM attachments WHERE after_action_id = NEW.after_action_id) >= 10 THEN
    RAISE EXCEPTION 'Maximum 10 attachments per after-action record';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce attachment limit
CREATE TRIGGER enforce_attachment_limit
BEFORE INSERT ON attachments
FOR EACH ROW EXECUTE FUNCTION check_attachment_limit();
