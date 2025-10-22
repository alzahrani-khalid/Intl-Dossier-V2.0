-- Migration: Create version_snapshots table
-- Purpose: Historical versions for audit trail and rollback
-- Feature: After-Action Structured Documentation
-- Date: 2025-01-14

CREATE TABLE IF NOT EXISTS public.version_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    after_action_id UUID NOT NULL REFERENCES public.after_action_records(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL CHECK (version_number > 0),
    snapshot_data JSONB NOT NULL, -- Full record content + related entities
    change_diff JSONB, -- Field-level changes from previous version
    version_reason TEXT,

    -- Audit (immutable)
    created_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    approved_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
    approved_at TIMESTAMPTZ,

    -- Unique version number per after_action
    CONSTRAINT uq_version_snapshots_version UNIQUE (after_action_id, version_number)
);

-- Create indexes
CREATE INDEX idx_version_snapshots_after_action ON public.version_snapshots (after_action_id);
CREATE INDEX idx_version_snapshots_created_at ON public.version_snapshots (created_at);

-- Prevent updates and deletes (immutable audit trail)
CREATE OR REPLACE FUNCTION prevent_version_snapshot_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Version snapshots are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_version_snapshot_update
    BEFORE UPDATE ON public.version_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION prevent_version_snapshot_modification();

CREATE TRIGGER trigger_prevent_version_snapshot_delete
    BEFORE DELETE ON public.version_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION prevent_version_snapshot_modification();

-- Add comments
COMMENT ON TABLE public.version_snapshots IS 'Historical versions for audit trail and rollback (immutable)';
COMMENT ON COLUMN public.version_snapshots.snapshot_data IS 'Full record content including all related entities (decisions, commitments, risks, follow_ups)';
COMMENT ON COLUMN public.version_snapshots.change_diff IS 'Field-level changes from previous version (calculated on insert)';
COMMENT ON COLUMN public.version_snapshots.version_number IS 'Sequential version number (1, 2, 3, ...) per after_action_id';
