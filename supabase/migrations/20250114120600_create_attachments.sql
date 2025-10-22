-- Migration: Create attachments table
-- Purpose: Supporting documents and evidence for after-action records
-- Feature: After-Action Structured Documentation
-- Date: 2025-01-14

-- Create ENUM for virus scan status
CREATE TYPE public.attachment_scan_status AS ENUM ('pending', 'clean', 'infected', 'failed');

CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    after_action_id UUID NOT NULL REFERENCES public.after_action_records(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 104857600), -- Max 100MB
    file_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    storage_url TEXT, -- Signed URL (generated on-demand, not stored for security)

    -- Virus scanning
    scan_status public.attachment_scan_status NOT NULL DEFAULT 'pending',
    scan_result TEXT,

    -- Audit
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT check_file_type_allowed CHECK (
        file_type IN (
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', -- DOCX
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', -- XLSX
            'application/vnd.openxmlformats-officedocument.presentationml.presentation', -- PPTX
            'image/png',
            'image/jpeg',
            'text/plain',
            'text/csv'
        )
    )
);

-- Create indexes
CREATE INDEX idx_attachments_after_action ON public.attachments (after_action_id);
CREATE INDEX idx_attachments_scan_status ON public.attachments (scan_status) WHERE scan_status='pending';
CREATE INDEX idx_attachments_uploaded_by ON public.attachments (uploaded_by);
CREATE INDEX idx_attachments_uploaded_at ON public.attachments (uploaded_at);

-- Create function to check attachment count limit
CREATE OR REPLACE FUNCTION check_attachment_count_limit()
RETURNS TRIGGER AS $$
DECLARE
    attachment_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO attachment_count
    FROM public.attachments
    WHERE after_action_id = NEW.after_action_id;

    IF attachment_count >= 10 THEN
        RAISE EXCEPTION 'Maximum 10 attachments allowed per after-action record';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_attachment_count_limit
    BEFORE INSERT ON public.attachments
    FOR EACH ROW
    EXECUTE FUNCTION check_attachment_count_limit();

-- Add comments
COMMENT ON TABLE public.attachments IS 'Supporting documents and evidence for after-action records';
COMMENT ON COLUMN public.attachments.file_size IS 'File size in bytes (max 100MB = 104857600 bytes)';
COMMENT ON COLUMN public.attachments.storage_url IS 'Signed URL with 24h expiry (generated on-demand, not stored)';
COMMENT ON COLUMN public.attachments.scan_status IS 'ClamAV virus scan status: pending → clean/infected/failed';
COMMENT ON COLUMN public.attachments.file_type IS 'Allowed: PDF, DOCX, XLSX, PPTX, PNG, JPG, TXT, CSV';
