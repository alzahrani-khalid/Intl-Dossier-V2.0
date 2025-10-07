-- Migration: 003_create_triage_tables
-- Description: Create tables for AI and manual triage decisions
-- Date: 2025-01-29

-- Create enum for decision types
CREATE TYPE decision_type AS ENUM ('ai_suggestion', 'manual_override', 'auto_assignment');

-- Create the triage_decisions table
CREATE TABLE IF NOT EXISTS triage_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES intake_tickets(id) ON DELETE CASCADE,
    
    -- Decision Details
    decision_type decision_type NOT NULL,
    
    -- Suggested Values
    suggested_type request_type,
    suggested_sensitivity sensitivity_level,
    suggested_urgency urgency_level,
    suggested_assignee UUID,
    suggested_unit TEXT,
    
    -- Final Values (after override if applicable)
    final_type request_type,
    final_sensitivity sensitivity_level,
    final_urgency urgency_level,
    final_assignee UUID,
    final_unit TEXT,
    
    -- AI Metadata
    model_name TEXT,
    model_version TEXT,
    confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Override Details
    override_reason TEXT,
    override_reason_ar TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    accepted_at TIMESTAMPTZ,
    accepted_by UUID,
    
    -- Ensure at least one suggestion or final value is present
    CONSTRAINT has_values CHECK (
        suggested_type IS NOT NULL OR 
        suggested_sensitivity IS NOT NULL OR 
        suggested_urgency IS NOT NULL OR 
        suggested_assignee IS NOT NULL OR 
        suggested_unit IS NOT NULL OR
        final_type IS NOT NULL OR 
        final_sensitivity IS NOT NULL OR 
        final_urgency IS NOT NULL OR 
        final_assignee IS NOT NULL OR 
        final_unit IS NOT NULL
    )
);

-- Create function to track triage acceptance
CREATE OR REPLACE FUNCTION accept_triage_decision(
    p_decision_id UUID,
    p_user_id UUID
) RETURNS VOID AS $$
BEGIN
    UPDATE triage_decisions
    SET 
        accepted_at = NOW(),
        accepted_by = p_user_id,
        final_type = COALESCE(final_type, suggested_type),
        final_sensitivity = COALESCE(final_sensitivity, suggested_sensitivity),
        final_urgency = COALESCE(final_urgency, suggested_urgency),
        final_assignee = COALESCE(final_assignee, suggested_assignee),
        final_unit = COALESCE(final_unit, suggested_unit)
    WHERE id = p_decision_id
    AND accepted_at IS NULL;
    
    -- Update the ticket with accepted values
    UPDATE intake_tickets t
    SET
        request_type = COALESCE(d.final_type, t.request_type),
        sensitivity = COALESCE(d.final_sensitivity, t.sensitivity),
        urgency = COALESCE(d.final_urgency, t.urgency),
        assigned_to = COALESCE(d.final_assignee, t.assigned_to),
        assigned_unit = COALESCE(d.final_unit, t.assigned_unit),
        triaged_at = NOW(),
        status = CASE 
            WHEN d.final_assignee IS NOT NULL OR d.final_unit IS NOT NULL 
            THEN 'assigned'::ticket_status 
            ELSE 'triaged'::ticket_status 
        END,
        assigned_at = CASE 
            WHEN d.final_assignee IS NOT NULL OR d.final_unit IS NOT NULL 
            THEN NOW() 
            ELSE assigned_at 
        END
    FROM triage_decisions d
    WHERE d.id = p_decision_id
    AND t.id = d.ticket_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate priority from urgency and sensitivity
CREATE OR REPLACE FUNCTION calculate_priority(
    p_urgency urgency_level,
    p_sensitivity sensitivity_level
) RETURNS priority_level AS $$
BEGIN
    -- Matrix for priority calculation
    IF p_urgency = 'critical' OR p_sensitivity = 'secret' THEN
        RETURN 'urgent'::priority_level;
    ELSIF p_urgency = 'high' OR p_sensitivity = 'confidential' THEN
        RETURN 'high'::priority_level;
    ELSIF p_urgency = 'medium' OR p_sensitivity = 'internal' THEN
        RETURN 'medium'::priority_level;
    ELSE
        RETURN 'low'::priority_level;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to auto-calculate priority
CREATE OR REPLACE FUNCTION update_priority()
RETURNS TRIGGER AS $$
BEGIN
    NEW.priority := calculate_priority(NEW.urgency, NEW.sensitivity);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_ticket_priority
    BEFORE INSERT OR UPDATE OF urgency, sensitivity ON intake_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_priority();

-- Add indexes for performance
CREATE INDEX idx_triage_ticket ON triage_decisions(ticket_id, created_at DESC);
CREATE INDEX idx_triage_pending ON triage_decisions(accepted_at) WHERE accepted_at IS NULL;

-- Add comments
COMMENT ON TABLE triage_decisions IS 'AI and manual triage history for tickets';
COMMENT ON COLUMN triage_decisions.confidence_score IS 'AI confidence score between 0 and 1';
COMMENT ON COLUMN triage_decisions.created_by IS 'User ID or system identifier for AI';
COMMENT ON FUNCTION accept_triage_decision IS 'Accept triage suggestions and update the ticket';