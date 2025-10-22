-- Migration: Create after_action_records table
-- Purpose: Core entity for after-action documentation
-- Feature: After-Action Structured Documentation
-- Date: 2025-01-14

-- Create ENUM types for after_action_records
CREATE TYPE public.confidentiality_level AS ENUM ('public', 'internal', 'confidential', 'secret');
CREATE TYPE public.after_action_status AS ENUM ('draft', 'published', 'edit_pending');

-- Create after_action_records table
CREATE TABLE IF NOT EXISTS public.after_action_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE RESTRICT,
    dossier_id UUID NOT NULL REFERENCES public.dossiers(id) ON DELETE RESTRICT,
    title TEXT NOT NULL CHECK (char_length(title) >= 5 AND char_length(title) <= 200),
    description TEXT,
    confidentiality_level public.confidentiality_level NOT NULL DEFAULT 'internal',
    status public.after_action_status NOT NULL DEFAULT 'draft',
    attendance_list JSONB NOT NULL DEFAULT '[]',

    -- Audit fields
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
    updated_at TIMESTAMPTZ,

    -- Publication tracking
    published_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
    published_at TIMESTAMPTZ,

    -- Edit workflow tracking
    edit_requested_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
    edit_requested_at TIMESTAMPTZ,
    edit_request_reason TEXT,
    edit_approved_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
    edit_approved_at TIMESTAMPTZ,
    edit_rejection_reason TEXT,

    -- Optimistic locking
    _version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT check_published_fields CHECK (
        (status = 'draft' AND published_at IS NULL AND published_by IS NULL) OR
        (status IN ('published', 'edit_pending') AND published_at IS NOT NULL AND published_by IS NOT NULL)
    ),
    CONSTRAINT check_edit_request_fields CHECK (
        (status = 'edit_pending' AND edit_requested_by IS NOT NULL AND edit_requested_at IS NOT NULL) OR
        (status IN ('draft', 'published') AND edit_requested_by IS NULL AND edit_requested_at IS NULL)
    )
);

-- Create indexes
CREATE INDEX idx_after_action_engagement ON public.after_action_records (engagement_id);
CREATE INDEX idx_after_action_dossier ON public.after_action_records (dossier_id);
CREATE INDEX idx_after_action_status ON public.after_action_records (status);
CREATE INDEX idx_after_action_created_by ON public.after_action_records (created_by);
CREATE INDEX idx_after_action_published_at ON public.after_action_records (published_at) WHERE published_at IS NOT NULL;
CREATE INDEX idx_after_action_updated_at ON public.after_action_records (updated_at); -- For incremental sync

-- Add trigger to auto-update updated_at
CREATE TRIGGER trigger_update_updated_at_after_action_records
    BEFORE UPDATE ON public.after_action_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to increment _version on update
CREATE OR REPLACE FUNCTION increment_version_after_action()
RETURNS TRIGGER AS $$
BEGIN
    NEW._version = OLD._version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_version_after_action
    BEFORE UPDATE ON public.after_action_records
    FOR EACH ROW
    EXECUTE FUNCTION increment_version_after_action();

-- Add comments
COMMENT ON TABLE public.after_action_records IS 'Core entity for after-action documentation of engagements';
COMMENT ON COLUMN public.after_action_records.attendance_list IS 'JSONB array of {name, role, organization} objects';
COMMENT ON COLUMN public.after_action_records.status IS 'Workflow status: draft → published → edit_pending → published';
COMMENT ON COLUMN public.after_action_records._version IS 'Optimistic locking version number, increments on each update';
