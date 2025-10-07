-- Migration: 002_create_intake_attachments_table
-- Description: Create table for file attachments linked to intake tickets
-- Date: 2025-01-29

-- Create enum for scan status
CREATE TYPE scan_status AS ENUM ('pending', 'clean', 'infected', 'error');

-- Create the intake_attachments table
CREATE TABLE IF NOT EXISTS intake_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES intake_tickets(id) ON DELETE CASCADE,
    
    -- File Information
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    mime_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    
    -- Security
    scan_status scan_status NOT NULL DEFAULT 'pending',
    scan_result JSONB,
    
    -- Metadata
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    uploaded_by UUID NOT NULL,
    deleted_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT file_size_limit CHECK (file_size <= 26214400), -- 25MB in bytes
    CONSTRAINT valid_mime_type CHECK (
        mime_type IN (
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/msword',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'text/plain',
            'text/csv'
        )
    )
);

-- Create function to check total attachment size per ticket
CREATE OR REPLACE FUNCTION check_total_attachment_size()
RETURNS TRIGGER AS $$
DECLARE
    total_size BIGINT;
    max_total_size CONSTANT BIGINT := 104857600; -- 100MB in bytes
BEGIN
    -- Calculate total size including the new attachment
    SELECT COALESCE(SUM(file_size), 0) + NEW.file_size
    INTO total_size
    FROM intake_attachments
    WHERE ticket_id = NEW.ticket_id
    AND deleted_at IS NULL;
    
    IF total_size > max_total_size THEN
        RAISE EXCEPTION 'Total attachment size for ticket exceeds 100MB limit';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce total size limit
CREATE TRIGGER check_attachment_total_size
    BEFORE INSERT ON intake_attachments
    FOR EACH ROW
    EXECUTE FUNCTION check_total_attachment_size();

-- Create function to generate storage path
CREATE OR REPLACE FUNCTION generate_storage_path(p_ticket_id UUID, p_file_name TEXT)
RETURNS TEXT AS $$
DECLARE
    year_month TEXT;
    sanitized_name TEXT;
    unique_suffix TEXT;
BEGIN
    year_month := TO_CHAR(NOW(), 'YYYY-MM');
    -- Sanitize filename
    sanitized_name := regexp_replace(p_file_name, '[^a-zA-Z0-9._-]', '_', 'g');
    -- Add unique suffix to prevent collisions
    unique_suffix := substring(gen_random_uuid()::TEXT FROM 1 FOR 8);
    
    RETURN format('intake-attachments/%s/%s/%s_%s', 
                  year_month, 
                  p_ticket_id, 
                  unique_suffix,
                  sanitized_name);
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE intake_attachments IS 'Files attached to intake tickets with virus scanning';
COMMENT ON COLUMN intake_attachments.storage_path IS 'Path in Supabase Storage bucket';
COMMENT ON COLUMN intake_attachments.scan_status IS 'Virus scan status from scanning service';
COMMENT ON COLUMN intake_attachments.scan_result IS 'Detailed scan results including threat information';
COMMENT ON COLUMN intake_attachments.deleted_at IS 'Soft delete timestamp';