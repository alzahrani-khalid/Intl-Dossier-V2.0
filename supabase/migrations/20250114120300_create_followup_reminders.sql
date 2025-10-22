-- Migration: Create followup reminders audit table
-- Feature: Waiting Queue Actions (023-specs-waiting-queue)
-- Purpose: Audit trail of all follow-up reminders sent for assignments

-- Create followup_reminders table
CREATE TABLE IF NOT EXISTS followup_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    sent_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    notification_type TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivery_status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT notification_type_check CHECK (notification_type IN ('email', 'in_app', 'both')),
    CONSTRAINT delivery_status_check CHECK (delivery_status IN ('pending', 'delivered', 'failed'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_followup_reminders_assignment
ON followup_reminders(assignment_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_followup_reminders_recipient
ON followup_reminders(recipient_id, sent_at DESC);

-- RLS Policies
ALTER TABLE followup_reminders ENABLE ROW LEVEL SECURITY;

-- Read: Users can view reminders for assignments they are assigned to OR sent OR have permission
CREATE POLICY "followup_reminders_read" ON followup_reminders
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = sent_by
        OR auth.uid() = recipient_id
        OR EXISTS (
            SELECT 1 FROM assignments
            WHERE assignments.id = followup_reminders.assignment_id
            AND assignments.assignee_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM user_permissions
            WHERE user_id = auth.uid() AND permission = 'view_all_reminders'
        )
    );

-- Insert: Users with 'send_reminders' permission can create reminder records
CREATE POLICY "followup_reminders_insert" ON followup_reminders
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = sent_by
        AND EXISTS (
            SELECT 1 FROM user_permissions
            WHERE user_id = auth.uid() AND permission = 'send_reminders'
        )
    );

-- Update: Only delivery_status and error_message can be updated by notification service (system role)
CREATE POLICY "followup_reminders_update" ON followup_reminders
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_permissions
            WHERE user_id = auth.uid() AND permission = 'manage_notifications'
        )
    );

-- Delete: No delete allowed (immutable audit trail)
-- No delete policy = no one can delete

-- Add comments
COMMENT ON TABLE followup_reminders IS 'Immutable audit trail of all follow-up reminders sent for assignments';
COMMENT ON COLUMN followup_reminders.assignment_id IS 'Assignment for which reminder was sent';
COMMENT ON COLUMN followup_reminders.sent_by IS 'User who sent the reminder';
COMMENT ON COLUMN followup_reminders.recipient_id IS 'Assignee who received reminder (must match assignment.assignee_id)';
COMMENT ON COLUMN followup_reminders.notification_type IS 'Delivery channel(s) used: email, in_app, or both';
COMMENT ON COLUMN followup_reminders.delivery_status IS 'Notification delivery status: pending → delivered or failed';
COMMENT ON COLUMN followup_reminders.error_message IS 'Error details if delivery failed (for debugging)';
