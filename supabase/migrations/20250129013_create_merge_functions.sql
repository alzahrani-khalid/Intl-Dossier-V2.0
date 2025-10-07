-- Migration: Create merge functions with history preservation
-- Created: 2025-01-29
-- Feature: 008-front-door-intake

-- Function to merge tickets while preserving history
CREATE OR REPLACE FUNCTION merge_tickets(
  p_primary_ticket_id UUID,
  p_ticket_ids_to_merge UUID[],
  p_merge_reason TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_correlation_id TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_ticket_id UUID;
  v_merged_count INTEGER := 0;
BEGIN
  -- Start transaction (implicit in function)

  -- Lock primary ticket
  PERFORM id FROM intake_tickets
  WHERE id = p_primary_ticket_id
  FOR UPDATE;

  -- Validate primary ticket exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Primary ticket not found: %', p_primary_ticket_id;
  END IF;

  -- Process each ticket to merge
  FOREACH v_ticket_id IN ARRAY p_ticket_ids_to_merge LOOP
    -- Lock and validate ticket
    PERFORM id FROM intake_tickets
    WHERE id = v_ticket_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Ticket not found: %', v_ticket_id;
    END IF;

    -- Transfer attachments to primary ticket
    UPDATE intake_attachments
    SET ticket_id = p_primary_ticket_id,
        updated_at = NOW()
    WHERE ticket_id = v_ticket_id
      AND deleted_at IS NULL;

    -- Transfer triage decisions
    UPDATE triage_decisions
    SET ticket_id = p_primary_ticket_id,
        created_at = NOW()
    WHERE ticket_id = v_ticket_id;

    -- Transfer SLA events
    UPDATE sla_events
    SET ticket_id = p_primary_ticket_id,
        event_timestamp = NOW()
    WHERE ticket_id = v_ticket_id;

    -- Copy duplicate candidate relationships
    INSERT INTO duplicate_candidates (
      source_ticket_id,
      target_ticket_id,
      overall_score,
      title_similarity,
      content_similarity,
      metadata_similarity,
      status,
      detected_at,
      detected_by
    )
    SELECT
      p_primary_ticket_id,
      target_ticket_id,
      overall_score,
      title_similarity,
      content_similarity,
      metadata_similarity,
      'merged',
      NOW(),
      'system'
    FROM duplicate_candidates
    WHERE source_ticket_id = v_ticket_id
    ON CONFLICT (source_ticket_id, target_ticket_id) DO NOTHING;

    -- Update ticket status to merged
    UPDATE intake_tickets
    SET
      status = 'merged',
      parent_ticket_id = p_primary_ticket_id,
      updated_at = NOW(),
      updated_by = COALESCE(p_user_id::text, auth.uid()::text),
      resolution = COALESCE(
        resolution,
        format('Merged into ticket %s. Reason: %s',
          (SELECT ticket_number FROM intake_tickets WHERE id = p_primary_ticket_id),
          COALESCE(p_merge_reason, 'Duplicate')
        )
      )
    WHERE id = v_ticket_id;

    v_merged_count := v_merged_count + 1;
  END LOOP;

  -- Update primary ticket metadata
  UPDATE intake_tickets
  SET
    updated_at = NOW(),
    updated_by = COALESCE(p_user_id::text, auth.uid()::text)
  WHERE id = p_primary_ticket_id;

  -- Return result
  RETURN jsonb_build_object(
    'success', TRUE,
    'primary_ticket_id', p_primary_ticket_id,
    'merged_count', v_merged_count,
    'correlation_id', p_correlation_id
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback is automatic on exception
    RAISE EXCEPTION 'Merge failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get complete merge history for a ticket
CREATE OR REPLACE FUNCTION get_merge_history(
  p_ticket_id UUID
) RETURNS TABLE (
  ticket_id UUID,
  ticket_number TEXT,
  title TEXT,
  merge_type TEXT,
  merged_at TIMESTAMPTZ,
  merged_by TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Get tickets merged into this ticket
  SELECT
    t.id AS ticket_id,
    t.ticket_number,
    t.title,
    'merged_into'::TEXT AS merge_type,
    t.updated_at AS merged_at,
    t.updated_by AS merged_by
  FROM intake_tickets t
  WHERE t.parent_ticket_id = p_ticket_id
    AND t.status = 'merged'

  UNION ALL

  -- If this ticket was merged into another
  SELECT
    pt.id AS ticket_id,
    pt.ticket_number,
    pt.title,
    'merged_from'::TEXT AS merge_type,
    t.updated_at AS merged_at,
    t.updated_by AS merged_by
  FROM intake_tickets t
  INNER JOIN intake_tickets pt ON pt.id = t.parent_ticket_id
  WHERE t.id = p_ticket_id
    AND t.status = 'merged'

  ORDER BY merged_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION merge_tickets TO authenticated;
GRANT EXECUTE ON FUNCTION get_merge_history TO authenticated;

-- Add comments
COMMENT ON FUNCTION merge_tickets IS 'Merge multiple tickets into a primary ticket while preserving all history';
COMMENT ON FUNCTION get_merge_history IS 'Get complete merge history for a ticket including both merged-in and merged-from relationships';