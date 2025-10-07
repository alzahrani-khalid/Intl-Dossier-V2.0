-- Migration: T015 - Create SLA monitoring function
-- Description: Function to check SLA status and create escalations (called by pg_cron)
-- Dependencies: T007 (assignments), T009 (escalation_events)

-- Function to check SLA status and escalate breached items
CREATE OR REPLACE FUNCTION sla_check_and_escalate()
RETURNS TABLE(warnings_sent INTEGER, escalations_created INTEGER) AS $$
DECLARE
  warnings_count INTEGER := 0;
  escalations_count INTEGER := 0;
BEGIN
  -- Step 1: Send warnings for assignments at 75% SLA (warning threshold)
  WITH warned AS (
    UPDATE assignments
    SET warning_sent_at = now()
    WHERE status IN ('assigned', 'in_progress')
      AND warning_sent_at IS NULL
      AND (EXTRACT(EPOCH FROM (now() - assigned_at)) /
           EXTRACT(EPOCH FROM (sla_deadline - assigned_at))) >= 0.75
    RETURNING id
  )
  SELECT COUNT(*) INTO warnings_count FROM warned;

  -- Step 2: Create escalation events for SLA breaches (100%)
  WITH escalated_assignments AS (
    SELECT
      a.id AS assignment_id,
      a.assignee_id AS escalated_from_id,
      COALESCE(
        sp.escalation_chain_id, -- Explicit chain
        (SELECT user_id FROM staff_profiles WHERE unit_id = sp.unit_id AND role = 'supervisor' LIMIT 1), -- Unit supervisor
        (SELECT user_id FROM staff_profiles WHERE role = 'admin' LIMIT 1) -- Fallback to admin
      ) AS escalated_to_id
    FROM assignments a
    JOIN staff_profiles sp ON a.assignee_id = sp.user_id
    WHERE a.status IN ('assigned', 'in_progress')
      AND a.escalated_at IS NULL
      AND now() >= a.sla_deadline
      AND COALESCE(
        sp.escalation_chain_id,
        (SELECT user_id FROM staff_profiles WHERE unit_id = sp.unit_id AND role = 'supervisor' LIMIT 1),
        (SELECT user_id FROM staff_profiles WHERE role = 'admin' LIMIT 1)
      ) IS NOT NULL -- Ensure escalation recipient exists
  ),
  inserted_escalations AS (
    INSERT INTO escalation_events (assignment_id, escalated_from_id, escalated_to_id, reason, escalated_at)
    SELECT assignment_id, escalated_from_id, escalated_to_id, 'sla_breach'::escalation_reason, now()
    FROM escalated_assignments
    ON CONFLICT DO NOTHING -- Handle duplicate escalations gracefully
    RETURNING id, assignment_id, escalated_to_id
  ),
  marked_escalated AS (
    UPDATE assignments
    SET escalated_at = now(),
        escalation_recipient_id = ie.escalated_to_id
    FROM inserted_escalations ie
    WHERE assignments.id = ie.assignment_id
    RETURNING assignments.id
  )
  SELECT COUNT(*) INTO escalations_count FROM marked_escalated;

  -- Return summary
  RETURN QUERY SELECT warnings_count, escalations_count;
END;
$$ LANGUAGE plpgsql;

-- Comment
COMMENT ON FUNCTION sla_check_and_escalate IS 'Checks all active assignments for SLA warnings (75%) and breaches (100%), creates escalation events';
