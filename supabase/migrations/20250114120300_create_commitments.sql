-- Migration: Create commitments table
-- Purpose: Action items and deliverables from engagements
-- Feature: After-Action Structured Documentation
-- Date: 2025-01-14

-- Create ENUM types for commitments
CREATE TYPE public.commitment_owner_type AS ENUM ('internal', 'external');
CREATE TYPE public.commitment_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.commitment_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'overdue');
CREATE TYPE public.commitment_tracking_type AS ENUM ('automatic', 'manual');

CREATE TABLE IF NOT EXISTS public.commitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    after_action_id UUID NOT NULL REFERENCES public.after_action_records(id) ON DELETE CASCADE,
    dossier_id UUID NOT NULL REFERENCES public.dossiers(id) ON DELETE RESTRICT, -- Denormalized for queries
    description TEXT NOT NULL CHECK (char_length(description) >= 10 AND char_length(description) <= 2000),

    -- Owner (internal OR external, not both)
    owner_type public.commitment_owner_type NOT NULL,
    owner_internal_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
    owner_external_id UUID REFERENCES public.external_contacts(id) ON DELETE RESTRICT,

    -- Commitment details
    due_date DATE NOT NULL,
    priority public.commitment_priority NOT NULL DEFAULT 'medium',
    status public.commitment_status NOT NULL DEFAULT 'pending',
    tracking_type public.commitment_tracking_type NOT NULL,
    completion_notes TEXT,
    completed_at TIMESTAMPTZ,

    -- AI extraction metadata
    ai_extracted BOOLEAN NOT NULL DEFAULT false,
    confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT check_owner_exclusivity CHECK (
        (owner_type = 'internal' AND owner_internal_id IS NOT NULL AND owner_external_id IS NULL) OR
        (owner_type = 'external' AND owner_external_id IS NOT NULL AND owner_internal_id IS NULL)
    ),
    CONSTRAINT check_tracking_type_for_internal CHECK (
        (owner_type = 'internal') OR
        (owner_type = 'external' AND tracking_type = 'manual')
    ),
    CONSTRAINT check_completed_at_when_completed CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status != 'completed')
    ),
    CONSTRAINT check_confidence_score_required CHECK (
        (ai_extracted = true AND confidence_score IS NOT NULL) OR
        (ai_extracted = false)
    )
);

-- Create indexes
CREATE INDEX idx_commitments_after_action ON public.commitments (after_action_id);
CREATE INDEX idx_commitments_dossier ON public.commitments (dossier_id);
CREATE INDEX idx_commitments_internal_owner ON public.commitments (owner_internal_id) WHERE owner_type='internal';
CREATE INDEX idx_commitments_external_owner ON public.commitments (owner_external_id) WHERE owner_type='external';
CREATE INDEX idx_commitments_due_date ON public.commitments (due_date);
CREATE INDEX idx_commitments_status ON public.commitments (status);
CREATE INDEX idx_commitments_priority ON public.commitments (priority);
CREATE INDEX idx_commitments_updated_at ON public.commitments (updated_at); -- For sync

-- Add trigger to auto-update updated_at
CREATE TRIGGER trigger_update_updated_at_commitments
    BEFORE UPDATE ON public.commitments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to auto-mark overdue commitments
CREATE OR REPLACE FUNCTION update_overdue_commitments()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.due_date < CURRENT_DATE AND NEW.status IN ('pending', 'in_progress') THEN
        NEW.status = 'overdue';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_overdue_commitments
    BEFORE INSERT OR UPDATE ON public.commitments
    FOR EACH ROW
    EXECUTE FUNCTION update_overdue_commitments();

-- Add comments
COMMENT ON TABLE public.commitments IS 'Action items and deliverables agreed upon during engagement';
COMMENT ON COLUMN public.commitments.owner_type IS 'Whether owner is internal (system user) or external (non-system contact)';
COMMENT ON COLUMN public.commitments.tracking_type IS 'automatic (internal users with task sync) or manual (external contacts)';
COMMENT ON COLUMN public.commitments.dossier_id IS 'Denormalized from after_action_record for efficient queries';
COMMENT ON COLUMN public.commitments.status IS 'Auto-updates to overdue when due_date < current_date AND status IN (pending, in_progress)';
