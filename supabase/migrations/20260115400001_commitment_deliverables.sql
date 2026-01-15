-- Migration: Create commitment deliverables table
-- Feature: Interactive timeline for breaking commitments into trackable milestones
-- Date: 2026-01-15

-- Create deliverable type enum
DO $$ BEGIN
    CREATE TYPE public.commitment_deliverable_type AS ENUM (
        'milestone',          -- General progress milestone
        'document',          -- Document to be prepared/submitted
        'meeting',           -- Meeting or engagement
        'review',            -- Review or approval checkpoint
        'follow_up',         -- Follow-up action
        'report',            -- Report or deliverable submission
        'custom'             -- Custom deliverable type
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create deliverable status enum
DO $$ BEGIN
    CREATE TYPE public.commitment_deliverable_status AS ENUM (
        'not_started',
        'in_progress',
        'completed',
        'blocked',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create commitment deliverables table
CREATE TABLE IF NOT EXISTS public.commitment_deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commitment_id UUID NOT NULL REFERENCES public.commitments(id) ON DELETE CASCADE,

    -- Core fields (bilingual support)
    title_en VARCHAR(200) NOT NULL,
    title_ar VARCHAR(200),
    description_en TEXT,
    description_ar TEXT,

    -- Type and status
    deliverable_type public.commitment_deliverable_type NOT NULL DEFAULT 'milestone',
    status public.commitment_deliverable_status NOT NULL DEFAULT 'not_started',

    -- Timeline
    due_date DATE NOT NULL,
    completed_at TIMESTAMPTZ,

    -- Progress tracking (0-100)
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),

    -- Weight for overall commitment progress calculation
    weight INTEGER NOT NULL DEFAULT 1 CHECK (weight >= 1 AND weight <= 10),

    -- Display order
    sort_order INTEGER NOT NULL DEFAULT 0,

    -- Notes
    notes TEXT,

    -- Audit (using tenant_id from commitments table)
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT check_completed_at CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status != 'completed' AND completed_at IS NULL)
    )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_commitment_deliverables_commitment ON public.commitment_deliverables(commitment_id);
CREATE INDEX IF NOT EXISTS idx_commitment_deliverables_status ON public.commitment_deliverables(status);
CREATE INDEX IF NOT EXISTS idx_commitment_deliverables_due_date ON public.commitment_deliverables(due_date);
CREATE INDEX IF NOT EXISTS idx_commitment_deliverables_sort_order ON public.commitment_deliverables(commitment_id, sort_order);

-- Auto-update updated_at trigger
CREATE TRIGGER trigger_commitment_deliverables_updated_at
    BEFORE UPDATE ON public.commitment_deliverables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate commitment progress from deliverables
CREATE OR REPLACE FUNCTION calculate_commitment_progress(p_commitment_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_weight INTEGER;
    weighted_progress INTEGER;
BEGIN
    SELECT
        COALESCE(SUM(weight), 0),
        COALESCE(SUM(weight * progress), 0)
    INTO total_weight, weighted_progress
    FROM public.commitment_deliverables
    WHERE commitment_id = p_commitment_id
    AND status != 'cancelled';

    IF total_weight = 0 THEN
        RETURN 0;
    END IF;

    RETURN ROUND(weighted_progress::NUMERIC / total_weight);
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.commitment_deliverables ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view deliverables for commitments they can access
-- Uses tenant_id from commitments table for RLS
CREATE POLICY "Users can view commitment deliverables"
    ON public.commitment_deliverables
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.commitments c
            WHERE c.id = commitment_id
            AND c.is_deleted = false
            AND (
                c.created_by = auth.uid()
                OR (c.responsible->>'user_id')::uuid = auth.uid()
            )
        )
    );

-- Policy: Users can insert deliverables for their commitments
CREATE POLICY "Users can create commitment deliverables"
    ON public.commitment_deliverables
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.commitments c
            WHERE c.id = commitment_id
            AND c.is_deleted = false
            AND (
                c.created_by = auth.uid()
                OR (c.responsible->>'user_id')::uuid = auth.uid()
            )
        )
    );

-- Policy: Users can update deliverables for their commitments
CREATE POLICY "Users can update commitment deliverables"
    ON public.commitment_deliverables
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.commitments c
            WHERE c.id = commitment_id
            AND c.is_deleted = false
            AND (
                c.created_by = auth.uid()
                OR (c.responsible->>'user_id')::uuid = auth.uid()
            )
        )
    );

-- Policy: Users can delete deliverables for their commitments
CREATE POLICY "Users can delete commitment deliverables"
    ON public.commitment_deliverables
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.commitments c
            WHERE c.id = commitment_id
            AND c.is_deleted = false
            AND (
                c.created_by = auth.uid()
                OR (c.responsible->>'user_id')::uuid = auth.uid()
            )
        )
    );

-- Comments
COMMENT ON TABLE public.commitment_deliverables IS 'Trackable milestones and deliverables for commitments';
COMMENT ON COLUMN public.commitment_deliverables.deliverable_type IS 'Type of deliverable: milestone, document, meeting, review, follow_up, report, custom';
COMMENT ON COLUMN public.commitment_deliverables.weight IS 'Weight for progress calculation (1-10), higher weight = more impact on overall progress';
COMMENT ON COLUMN public.commitment_deliverables.progress IS 'Progress percentage (0-100)';
