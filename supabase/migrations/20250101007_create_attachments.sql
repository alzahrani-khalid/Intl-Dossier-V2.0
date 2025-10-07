-- Migration: Create attachments table
-- Feature: 011-positions-talking-points
-- Task: T007

-- Create attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL REFERENCES positions(id) ON DELETE CASCADE,

  -- File metadata
  file_name text NOT NULL,
  file_size bigint NOT NULL CHECK (file_size > 0 AND file_size <= 52428800), -- 50MB limit
  file_type text NOT NULL,
  storage_path text NOT NULL,

  -- Audit
  uploader_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT check_file_name_not_empty CHECK (char_length(trim(file_name)) > 0),
  CONSTRAINT check_storage_path_not_empty CHECK (char_length(trim(storage_path)) > 0),
  CONSTRAINT check_file_type_allowed CHECK (
    file_type IN (
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', -- DOCX
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', -- XLSX
      'image/png',
      'image/jpeg'
    )
  )
);

-- Add comments
COMMENT ON TABLE attachments IS 'Supporting documents attached to positions';
COMMENT ON COLUMN attachments.file_name IS 'Original filename';
COMMENT ON COLUMN attachments.file_size IS 'Size in bytes (max 50MB)';
COMMENT ON COLUMN attachments.file_type IS 'MIME type';
COMMENT ON COLUMN attachments.storage_path IS 'Path in Supabase Storage bucket';
COMMENT ON COLUMN attachments.uploader_id IS 'User who uploaded the file';

-- Create indexes
CREATE INDEX idx_attachments_position_id ON attachments(position_id);
CREATE INDEX idx_attachments_uploader_id ON attachments(uploader_id);
CREATE INDEX idx_attachments_created_at ON attachments(created_at DESC);
