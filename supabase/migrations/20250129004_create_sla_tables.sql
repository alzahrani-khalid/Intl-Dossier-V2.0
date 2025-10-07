-- Migration: 004_create_sla_tables
-- Description: Create tables for SLA policies and event tracking
-- Date: 2025-01-29

-- Create enum for SLA event types
CREATE TYPE sla_event_type AS ENUM ('started', 'paused', 'resumed', 'met', 'breached', 'cancelled');

-- Create the sla_policies table
CREATE TABLE IF NOT EXISTS sla_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Matching Criteria (all optional for flexible matching)
    request_type request_type,
    sensitivity sensitivity_level,
    urgency urgency_level,
    priority priority_level,
    
    -- SLA Targets (in minutes)
    acknowledgment_target INTEGER NOT NULL CHECK (acknowledgment_target > 0),
    resolution_target INTEGER NOT NULL CHECK (resolution_target > 0),
    
    -- Business Hours
    business_hours_only BOOLEAN NOT NULL DEFAULT true,
    timezone TEXT NOT NULL DEFAULT 'Asia/Riyadh',
    
    -- Metadata
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure reasonable SLA targets
    CONSTRAINT reasonable_targets CHECK (
        acknowledgment_target <= resolution_target AND
        acknowledgment_target <= 10080 AND -- Max 1 week
        resolution_target <= 43200 -- Max 30 days
    )
);

-- Create the sla_events table
CREATE TABLE IF NOT EXISTS sla_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES intake_tickets(id) ON DELETE CASCADE,
    policy_id UUID NOT NULL REFERENCES sla_policies(id),
    
    -- Event Details
    event_type sla_event_type NOT NULL,
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- State at Event
    elapsed_minutes INTEGER NOT NULL DEFAULT 0,
    remaining_minutes INTEGER NOT NULL,
    is_breached BOOLEAN NOT NULL DEFAULT false,
    
    -- Metadata
    created_by UUID NOT NULL,
    reason TEXT,
    
    -- Prevent duplicate active SLA tracking
    CONSTRAINT one_active_sla UNIQUE (ticket_id, policy_id) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Function to find best matching SLA policy
CREATE OR REPLACE FUNCTION find_matching_sla_policy(
    p_request_type request_type,
    p_sensitivity sensitivity_level,
    p_urgency urgency_level,
    p_priority priority_level
) RETURNS UUID AS $$
DECLARE
    v_policy_id UUID;
BEGIN
    -- Find the most specific matching policy
    -- Priority order: exact match > partial match > default
    SELECT id INTO v_policy_id
    FROM sla_policies
    WHERE is_active = true
    AND (request_type = p_request_type OR request_type IS NULL)
    AND (sensitivity = p_sensitivity OR sensitivity IS NULL)
    AND (urgency = p_urgency OR urgency IS NULL)
    AND (priority = p_priority OR priority IS NULL)
    ORDER BY 
        -- Score based on number of matching criteria
        (CASE WHEN request_type = p_request_type THEN 1 ELSE 0 END) +
        (CASE WHEN sensitivity = p_sensitivity THEN 1 ELSE 0 END) +
        (CASE WHEN urgency = p_urgency THEN 1 ELSE 0 END) +
        (CASE WHEN priority = p_priority THEN 1 ELSE 0 END) DESC,
        -- Tie-breaker: most restrictive first
        acknowledgment_target ASC
    LIMIT 1;
    
    RETURN v_policy_id;
END;
$$ LANGUAGE plpgsql;

-- Function to start SLA tracking for a ticket
CREATE OR REPLACE FUNCTION start_sla_tracking(
    p_ticket_id UUID
) RETURNS UUID AS $$
DECLARE
    v_ticket RECORD;
    v_policy_id UUID;
    v_event_id UUID;
BEGIN
    -- Get ticket details
    SELECT request_type, sensitivity, urgency, priority, created_by
    INTO v_ticket
    FROM intake_tickets
    WHERE id = p_ticket_id;
    
    -- Find matching policy
    v_policy_id := find_matching_sla_policy(
        v_ticket.request_type,
        v_ticket.sensitivity,
        v_ticket.urgency,
        v_ticket.priority
    );
    
    IF v_policy_id IS NULL THEN
        RAISE EXCEPTION 'No matching SLA policy found for ticket %', p_ticket_id;
    END IF;
    
    -- Create SLA start event
    INSERT INTO sla_events (
        ticket_id,
        policy_id,
        event_type,
        elapsed_minutes,
        remaining_minutes,
        created_by
    )
    SELECT
        p_ticket_id,
        v_policy_id,
        'started'::sla_event_type,
        0,
        p.acknowledgment_target,
        v_ticket.created_by
    FROM sla_policies p
    WHERE p.id = v_policy_id
    RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate elapsed time considering business hours
CREATE OR REPLACE FUNCTION calculate_sla_elapsed_minutes(
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_business_hours_only BOOLEAN,
    p_timezone TEXT DEFAULT 'Asia/Riyadh'
) RETURNS INTEGER AS $$
DECLARE
    v_elapsed_minutes INTEGER;
    v_current_time TIMESTAMPTZ;
    v_day_start TIME;
    v_day_end TIME;
    v_total_minutes INTEGER := 0;
BEGIN
    -- If not business hours only, return simple difference
    IF NOT p_business_hours_only THEN
        RETURN EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 60;
    END IF;
    
    -- Business hours: 8 AM to 6 PM in specified timezone
    v_day_start := '08:00:00'::TIME;
    v_day_end := '18:00:00'::TIME;
    v_current_time := p_start_time AT TIME ZONE p_timezone;
    
    -- Calculate business hours between dates
    WHILE v_current_time < p_end_time AT TIME ZONE p_timezone LOOP
        -- Skip weekends (Friday and Saturday in Saudi Arabia)
        IF EXTRACT(DOW FROM v_current_time) NOT IN (5, 6) THEN
            -- Calculate minutes for this day
            IF v_current_time::DATE = (p_end_time AT TIME ZONE p_timezone)::DATE THEN
                -- Same day
                v_total_minutes := v_total_minutes + 
                    GREATEST(0, EXTRACT(EPOCH FROM (
                        LEAST(v_day_end, (p_end_time AT TIME ZONE p_timezone)::TIME) - 
                        GREATEST(v_day_start, v_current_time::TIME)
                    )) / 60);
            ELSE
                -- Full business day or partial
                v_total_minutes := v_total_minutes + 
                    GREATEST(0, EXTRACT(EPOCH FROM (
                        v_day_end - GREATEST(v_day_start, v_current_time::TIME)
                    )) / 60);
            END IF;
        END IF;
        
        -- Move to next day
        v_current_time := (v_current_time::DATE + INTERVAL '1 day')::TIMESTAMPTZ + v_day_start;
    END LOOP;
    
    RETURN v_total_minutes;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-start SLA when ticket is submitted
CREATE OR REPLACE FUNCTION auto_start_sla()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'submitted' AND OLD.status = 'draft' THEN
        PERFORM start_sla_tracking(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_start_sla
    AFTER UPDATE OF status ON intake_tickets
    FOR EACH ROW
    WHEN (NEW.status = 'submitted' AND OLD.status = 'draft')
    EXECUTE FUNCTION auto_start_sla();

-- Add indexes
CREATE INDEX idx_sla_policies_matching ON sla_policies(request_type, sensitivity, urgency, priority) 
    WHERE is_active = true;
CREATE INDEX idx_sla_events_ticket ON sla_events(ticket_id, event_timestamp DESC);
CREATE INDEX idx_sla_events_active ON sla_events(ticket_id, event_type) 
    WHERE event_type IN ('started', 'resumed');

-- Add comments
COMMENT ON TABLE sla_policies IS 'Configuration for SLA targets based on ticket attributes';
COMMENT ON TABLE sla_events IS 'Tracking SLA lifecycle events for reporting';
COMMENT ON COLUMN sla_policies.business_hours_only IS 'Whether to count only business hours for SLA calculation';
COMMENT ON FUNCTION calculate_sla_elapsed_minutes IS 'Calculate elapsed time considering business hours and timezone';