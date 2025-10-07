-- Migration: Create conversion transaction functions with rollback support
-- Created: 2025-01-29
-- Feature: 008-front-door-intake

-- Function to convert ticket to artifact with transaction safety
CREATE OR REPLACE FUNCTION convert_ticket_to_artifact(
  p_ticket_id UUID,
  p_target_type TEXT,
  p_additional_data JSONB DEFAULT '{}'::jsonb,
  p_user_id UUID DEFAULT NULL,
  p_correlation_id TEXT DEFAULT NULL,
  p_mfa_verified BOOLEAN DEFAULT FALSE
) RETURNS JSONB AS $$
DECLARE
  v_ticket RECORD;
  v_artifact_id UUID;
  v_artifact_table TEXT;
BEGIN
  -- Start transaction (implicit in function)

  -- Lock the ticket row for update
  SELECT * INTO v_ticket
  FROM intake_tickets
  WHERE id = p_ticket_id
  FOR UPDATE;

  -- Validate ticket exists
  IF v_ticket.id IS NULL THEN
    RAISE EXCEPTION 'Ticket not found: %', p_ticket_id;
  END IF;

  -- Check if already converted
  IF v_ticket.converted_to_id IS NOT NULL THEN
    RAISE EXCEPTION 'Ticket already converted to: %', v_ticket.converted_to_type;
  END IF;

  -- Validate status
  IF v_ticket.status NOT IN ('triaged', 'assigned', 'in_progress') THEN
    RAISE EXCEPTION 'Invalid ticket status for conversion: %', v_ticket.status;
  END IF;

  -- Generate artifact ID
  v_artifact_id := gen_random_uuid();

  -- Determine target table based on type
  CASE p_target_type
    WHEN 'engagement' THEN v_artifact_table := 'engagements';
    WHEN 'position' THEN v_artifact_table := 'positions';
    WHEN 'mou_action' THEN v_artifact_table := 'mou_actions';
    WHEN 'foresight' THEN v_artifact_table := 'foresight_items';
    ELSE RAISE EXCEPTION 'Invalid target type: %', p_target_type;
  END CASE;

  -- Create artifact (simplified - actual implementation would vary by type)
  -- This is a placeholder that assumes artifacts tables exist
  EXECUTE format(
    'INSERT INTO %I (id, title, description, source_ticket_id, created_by, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (id) DO NOTHING',
    v_artifact_table
  ) USING
    v_artifact_id,
    COALESCE(v_ticket.title, 'Converted from ticket'),
    COALESCE(v_ticket.description, ''),
    p_ticket_id,
    p_user_id;

  -- Update ticket status
  UPDATE intake_tickets
  SET
    status = 'converted',
    converted_to_type = p_target_type,
    converted_to_id = v_artifact_id,
    resolved_at = NOW(),
    updated_at = NOW(),
    updated_by = COALESCE(p_user_id::text, auth.uid()::text)
  WHERE id = p_ticket_id;

  -- Return result
  RETURN jsonb_build_object(
    'success', TRUE,
    'artifact_id', v_artifact_id,
    'artifact_type', p_target_type,
    'ticket_id', p_ticket_id
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback is automatic on exception
    RAISE EXCEPTION 'Conversion failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to rollback conversion
CREATE OR REPLACE FUNCTION rollback_ticket_conversion(
  p_ticket_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_correlation_id TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_ticket RECORD;
  v_artifact_table TEXT;
BEGIN
  -- Lock the ticket row
  SELECT * INTO v_ticket
  FROM intake_tickets
  WHERE id = p_ticket_id
  FOR UPDATE;

  -- Validate ticket exists
  IF v_ticket.id IS NULL THEN
    RAISE EXCEPTION 'Ticket not found: %', p_ticket_id;
  END IF;

  -- Check if converted
  IF v_ticket.converted_to_id IS NULL THEN
    RAISE EXCEPTION 'Ticket was not converted';
  END IF;

  -- Determine artifact table
  CASE v_ticket.converted_to_type
    WHEN 'engagement' THEN v_artifact_table := 'engagements';
    WHEN 'position' THEN v_artifact_table := 'positions';
    WHEN 'mou_action' THEN v_artifact_table := 'mou_actions';
    WHEN 'foresight' THEN v_artifact_table := 'foresight_items';
    ELSE RAISE EXCEPTION 'Invalid artifact type: %', v_ticket.converted_to_type;
  END CASE;

  -- Delete artifact (soft delete if the table supports it)
  EXECUTE format(
    'UPDATE %I SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2',
    v_artifact_table
  ) USING p_user_id, v_ticket.converted_to_id;

  -- Revert ticket status
  UPDATE intake_tickets
  SET
    status = 'assigned', -- Return to assigned status
    converted_to_type = NULL,
    converted_to_id = NULL,
    resolved_at = NULL,
    updated_at = NOW(),
    updated_by = COALESCE(p_user_id::text, auth.uid()::text)
  WHERE id = p_ticket_id;

  -- Return result
  RETURN jsonb_build_object(
    'success', TRUE,
    'ticket_id', p_ticket_id,
    'message', 'Conversion rolled back successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Rollback failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION convert_ticket_to_artifact TO authenticated;
GRANT EXECUTE ON FUNCTION rollback_ticket_conversion TO authenticated;

-- Add comments
COMMENT ON FUNCTION convert_ticket_to_artifact IS 'Convert an intake ticket to a working artifact with transaction safety';
COMMENT ON FUNCTION rollback_ticket_conversion IS 'Rollback a ticket conversion, reverting both ticket and artifact';