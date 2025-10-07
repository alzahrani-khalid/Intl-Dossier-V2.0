-- Migration: Create SLA tracking functions and triggers with Realtime support
-- Created: 2025-01-29
-- Feature: 008-front-door-intake

-- Function to get SLA-breached tickets
CREATE OR REPLACE FUNCTION get_sla_breached_tickets()
RETURNS TABLE (
  ticket_id UUID,
  ticket_number TEXT,
  title TEXT,
  priority TEXT,
  status TEXT,
  sla_type TEXT,
  breach_time TIMESTAMPTZ,
  minutes_overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH ticket_slas AS (
    SELECT
      t.id,
      t.ticket_number,
      t.title,
      t.priority,
      t.status,
      t.submitted_at,
      p.acknowledgment_target,
      p.resolution_target,
      EXTRACT(EPOCH FROM (NOW() - COALESCE(t.submitted_at, t.created_at))) / 60 AS elapsed_minutes
    FROM intake_tickets t
    LEFT JOIN sla_policies p
      ON p.priority = t.priority
      AND p.is_active = TRUE
    WHERE t.status NOT IN ('closed', 'merged', 'converted')
  )
  -- Acknowledgment breaches
  SELECT
    ts.id AS ticket_id,
    ts.ticket_number,
    ts.title,
    ts.priority,
    ts.status,
    'acknowledgment'::TEXT AS sla_type,
    (COALESCE(ts.submitted_at, NOW()) + (ts.acknowledgment_target * INTERVAL '1 minute'))::TIMESTAMPTZ AS breach_time,
    (ts.elapsed_minutes - ts.acknowledgment_target)::INTEGER AS minutes_overdue
  FROM ticket_slas ts
  WHERE ts.elapsed_minutes > ts.acknowledgment_target
    AND ts.status = 'submitted'

  UNION ALL

  -- Resolution breaches
  SELECT
    ts.id AS ticket_id,
    ts.ticket_number,
    ts.title,
    ts.priority,
    ts.status,
    'resolution'::TEXT AS sla_type,
    (COALESCE(ts.submitted_at, NOW()) + (ts.resolution_target * INTERVAL '1 minute'))::TIMESTAMPTZ AS breach_time,
    (ts.elapsed_minutes - ts.resolution_target)::INTEGER AS minutes_overdue
  FROM ticket_slas ts
  WHERE ts.elapsed_minutes > ts.resolution_target

  ORDER BY minutes_overdue DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to automatically create SLA events on ticket status changes
CREATE OR REPLACE FUNCTION handle_ticket_sla_events()
RETURNS TRIGGER AS $$
DECLARE
  v_policy RECORD;
  v_elapsed_minutes INTEGER;
BEGIN
  -- Get SLA policy
  SELECT * INTO v_policy
  FROM sla_policies
  WHERE priority = NEW.priority
    AND is_active = TRUE
  LIMIT 1;

  -- Calculate elapsed minutes
  v_elapsed_minutes := EXTRACT(EPOCH FROM (NOW() - COALESCE(NEW.submitted_at, NEW.created_at))) / 60;

  -- Handle status transitions
  CASE
    -- Ticket submitted → Start SLA tracking
    WHEN NEW.status = 'submitted' AND (OLD.status IS NULL OR OLD.status = 'draft') THEN
      INSERT INTO sla_events (ticket_id, policy_id, event_type, event_timestamp, elapsed_minutes, remaining_minutes, is_breached, created_by)
      VALUES (
        NEW.id,
        v_policy.id,
        'started',
        NOW(),
        0,
        v_policy.acknowledgment_target,
        FALSE,
        'system'
      );

    -- Ticket assigned → Acknowledgment met
    WHEN NEW.status = 'assigned' AND OLD.status = 'triaged' THEN
      INSERT INTO sla_events (ticket_id, policy_id, event_type, event_timestamp, elapsed_minutes, remaining_minutes, is_breached, created_by)
      VALUES (
        NEW.id,
        v_policy.id,
        'met',
        NOW(),
        v_elapsed_minutes,
        GREATEST(0, v_policy.resolution_target - v_elapsed_minutes),
        v_elapsed_minutes > v_policy.acknowledgment_target,
        'system'
      );

    -- Ticket closed/converted → Resolution met or breached
    WHEN NEW.status IN ('closed', 'converted') AND OLD.status NOT IN ('closed', 'converted') THEN
      INSERT INTO sla_events (ticket_id, policy_id, event_type, event_timestamp, elapsed_minutes, remaining_minutes, is_breached, created_by)
      VALUES (
        NEW.id,
        v_policy.id,
        CASE WHEN v_elapsed_minutes <= v_policy.resolution_target THEN 'met' ELSE 'breached' END,
        NOW(),
        v_elapsed_minutes,
        GREATEST(0, v_policy.resolution_target - v_elapsed_minutes),
        v_elapsed_minutes > v_policy.resolution_target,
        'system'
      );

    -- Ticket merged → Cancel SLA
    WHEN NEW.status = 'merged' THEN
      INSERT INTO sla_events (ticket_id, policy_id, event_type, event_timestamp, elapsed_minutes, remaining_minutes, is_breached, created_by, reason)
      VALUES (
        NEW.id,
        v_policy.id,
        'cancelled',
        NOW(),
        v_elapsed_minutes,
        GREATEST(0, v_policy.resolution_target - v_elapsed_minutes),
        FALSE,
        'system',
        'Ticket merged'
      );

    ELSE
      -- No SLA event needed for other transitions
      NULL;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on intake_tickets
DROP TRIGGER IF EXISTS trigger_ticket_sla_events ON intake_tickets;
CREATE TRIGGER trigger_ticket_sla_events
  AFTER INSERT OR UPDATE OF status
  ON intake_tickets
  FOR EACH ROW
  EXECUTE FUNCTION handle_ticket_sla_events();

-- Function to check and record SLA breaches (to be called by scheduled job)
CREATE OR REPLACE FUNCTION check_sla_breaches()
RETURNS INTEGER AS $$
DECLARE
  v_breach_count INTEGER := 0;
  v_ticket RECORD;
BEGIN
  -- Find tickets with breached acknowledgment SLA
  FOR v_ticket IN
    SELECT
      t.id,
      t.priority,
      p.id AS policy_id,
      p.acknowledgment_target,
      EXTRACT(EPOCH FROM (NOW() - COALESCE(t.submitted_at, t.created_at))) / 60 AS elapsed_minutes
    FROM intake_tickets t
    INNER JOIN sla_policies p ON p.priority = t.priority AND p.is_active = TRUE
    WHERE t.status = 'submitted'
      AND EXTRACT(EPOCH FROM (NOW() - COALESCE(t.submitted_at, t.created_at))) / 60 > p.acknowledgment_target
      AND NOT EXISTS (
        SELECT 1 FROM sla_events
        WHERE ticket_id = t.id
          AND event_type = 'breached'
          AND reason = 'acknowledgment'
      )
  LOOP
    INSERT INTO sla_events (ticket_id, policy_id, event_type, event_timestamp, elapsed_minutes, remaining_minutes, is_breached, created_by, reason)
    VALUES (
      v_ticket.id,
      v_ticket.policy_id,
      'breached',
      NOW(),
      v_ticket.elapsed_minutes,
      0,
      TRUE,
      'system',
      'acknowledgment'
    );
    v_breach_count := v_breach_count + 1;
  END LOOP;

  -- Find tickets with breached resolution SLA
  FOR v_ticket IN
    SELECT
      t.id,
      t.priority,
      p.id AS policy_id,
      p.resolution_target,
      EXTRACT(EPOCH FROM (NOW() - COALESCE(t.submitted_at, t.created_at))) / 60 AS elapsed_minutes
    FROM intake_tickets t
    INNER JOIN sla_policies p ON p.priority = t.priority AND p.is_active = TRUE
    WHERE t.status NOT IN ('closed', 'merged', 'converted')
      AND EXTRACT(EPOCH FROM (NOW() - COALESCE(t.submitted_at, t.created_at))) / 60 > p.resolution_target
      AND NOT EXISTS (
        SELECT 1 FROM sla_events
        WHERE ticket_id = t.id
          AND event_type = 'breached'
          AND reason = 'resolution'
      )
  LOOP
    INSERT INTO sla_events (ticket_id, policy_id, event_type, event_timestamp, elapsed_minutes, remaining_minutes, is_breached, created_by, reason)
    VALUES (
      v_ticket.id,
      v_ticket.policy_id,
      'breached',
      NOW(),
      v_ticket.elapsed_minutes,
      0,
      TRUE,
      'system',
      'resolution'
    );
    v_breach_count := v_breach_count + 1;
  END LOOP;

  RETURN v_breach_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_sla_breached_tickets TO authenticated;
GRANT EXECUTE ON FUNCTION check_sla_breaches TO authenticated;

-- Enable Realtime for SLA events (for live countdown updates)
ALTER PUBLICATION supabase_realtime ADD TABLE sla_events;

-- Add comments
COMMENT ON FUNCTION get_sla_breached_tickets IS 'Get all tickets with breached SLAs for monitoring';
COMMENT ON FUNCTION check_sla_breaches IS 'Check and record SLA breaches (should be called by scheduled job every 5 minutes)';
COMMENT ON FUNCTION handle_ticket_sla_events IS 'Automatically create SLA events based on ticket status transitions';