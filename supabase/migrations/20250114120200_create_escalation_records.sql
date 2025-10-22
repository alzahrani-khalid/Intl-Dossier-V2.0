-- Migration: Create escalation records table
-- Feature: Waiting Queue Actions (023-specs-waiting-queue)
-- Purpose: Track escalation events when assignments are escalated to higher management

-- Create escalation_records table
CREATE TABLE IF NOT EXISTS escalation_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    escalated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    escalated_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    escalation_reason TEXT NULL,
    escalated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending',
    acknowledged_at TIMESTAMPTZ NULL,
    resolved_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT escalation_status_check CHECK (status IN ('pending', 'acknowledged', 'resolved')),
    CONSTRAINT acknowledged_after_escalated CHECK (acknowledged_at IS NULL OR acknowledged_at >= escalated_at),
    CONSTRAINT resolved_after_acknowledged CHECK (resolved_at IS NULL OR resolved_at >= COALESCE(acknowledged_at, escalated_at))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_escalation_records_assignment
ON escalation_records(assignment_id, escalated_at DESC);

CREATE INDEX IF NOT EXISTS idx_escalation_records_recipient
ON escalation_records(escalated_to, status)
WHERE status = 'pending';

-- RLS Policies
ALTER TABLE escalation_records ENABLE ROW LEVEL SECURITY;

-- Read: Users can view escalations where they are escalated_by OR escalated_to OR have permission
CREATE POLICY "escalation_records_read" ON escalation_records
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = escalated_by
        OR auth.uid() = escalated_to
        OR EXISTS (
            SELECT 1 FROM user_permissions
            WHERE user_id = auth.uid() AND permission = 'view_all_escalations'
        )
    );

-- Insert: Users with 'escalate_assignments' permission can create escalation records
CREATE POLICY "escalation_records_insert" ON escalation_records
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = escalated_by
        AND EXISTS (
            SELECT 1 FROM user_permissions
            WHERE user_id = auth.uid() AND permission = 'escalate_assignments'
        )
    );

-- Update: Users can update escalations where they are escalated_to (for acknowledging/resolving) OR have permission
CREATE POLICY "escalation_records_update" ON escalation_records
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = escalated_to
        OR EXISTS (
            SELECT 1 FROM user_permissions
            WHERE user_id = auth.uid() AND permission = 'manage_escalations'
        )
    );

-- Delete: No delete allowed (immutable audit trail)
-- No delete policy = no one can delete

-- Add comments
COMMENT ON TABLE escalation_records IS 'Immutable audit trail of escalation events for assignments';
COMMENT ON COLUMN escalation_records.assignment_id IS 'Assignment being escalated';
COMMENT ON COLUMN escalation_records.escalated_by IS 'User who initiated escalation';
COMMENT ON COLUMN escalation_records.escalated_to IS 'Recipient of escalation (manager)';
COMMENT ON COLUMN escalation_records.status IS 'Escalation status: pending (sent) → acknowledged (manager aware) → resolved (issue fixed)';
