-- convert_ticket_to_artifact: assign the converting user as owner of the new
-- artifact dossier (and backfill already-converted artifacts).
--
-- The function created dossier/engagement/position artifacts with NO dossier_owners
-- row, leaving every converted artifact ownerless. That blocked owner-gated flows
-- (after-action creation requires dossier ownership) and hid converted artifacts
-- from "my dossiers". Add an idempotent owner insert before the ticket-status
-- update, preserving the rest of the function verbatim.

CREATE OR REPLACE FUNCTION public.convert_ticket_to_artifact(
  p_ticket_id uuid,
  p_target_type text,
  p_additional_data jsonb DEFAULT '{}'::jsonb,
  p_user_id uuid DEFAULT NULL::uuid,
  p_correlation_id text DEFAULT NULL::text,
  p_mfa_verified boolean DEFAULT false
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_ticket RECORD;
  v_artifact_id UUID;
  v_default_position_type_id UUID;
  v_effective_user_id UUID;
BEGIN
  -- Resolve effective user ID
  v_effective_user_id := COALESCE(p_user_id, auth.uid());

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

  -- Handle each type with its specific schema
  CASE p_target_type
    WHEN 'dossier' THEN
      -- Generic dossier (topic type by default)
      INSERT INTO dossiers (
        id, type, name_en, name_ar,
        description_en, description_ar,
        status, sensitivity_level,
        metadata, created_by, created_at, updated_at
      ) VALUES (
        v_artifact_id,
        COALESCE(p_additional_data->>'dossier_type', 'topic'),
        COALESCE(v_ticket.title, 'Converted from ticket'),
        COALESCE(v_ticket.title_ar, v_ticket.title, ''),
        COALESCE(v_ticket.description, ''),
        COALESCE(v_ticket.description_ar, ''),
        'active',
        COALESCE((p_additional_data->>'sensitivity_level')::int, 1),
        jsonb_build_object(
          'source_ticket_id', p_ticket_id,
          'correlation_id', p_correlation_id,
          'converted_at', NOW()
        ),
        v_effective_user_id,
        NOW(), NOW()
      );

    WHEN 'engagement' THEN
      -- Step 1: Create parent dossier with type='engagement'
      INSERT INTO dossiers (
        id, type, name_en, name_ar,
        description_en, description_ar,
        status, sensitivity_level,
        metadata, created_by, created_at, updated_at
      ) VALUES (
        v_artifact_id,
        'engagement',
        COALESCE(v_ticket.title, 'Converted from ticket'),
        COALESCE(v_ticket.title_ar, v_ticket.title, ''),
        COALESCE(v_ticket.description, ''),
        COALESCE(v_ticket.description_ar, ''),
        'active',
        COALESCE((p_additional_data->>'sensitivity_level')::int, 1),
        jsonb_build_object(
          'source_ticket_id', p_ticket_id,
          'correlation_id', p_correlation_id,
          'converted_at', NOW()
        ),
        v_effective_user_id,
        NOW(), NOW()
      );

      -- Step 2: Create engagement extension with same ID
      INSERT INTO engagements (
        id, engagement_type, engagement_category,
        location_en, location_ar
      ) VALUES (
        v_artifact_id,
        COALESCE(p_additional_data->>'engagement_type', 'meeting'),
        COALESCE(p_additional_data->>'engagement_category', 'bilateral'),
        COALESCE(p_additional_data->>'location_en', ''),
        COALESCE(p_additional_data->>'location_ar', '')
      );

    WHEN 'position' THEN
      -- Get default position type
      SELECT id INTO v_default_position_type_id
      FROM position_types
      WHERE name_en = 'Standard Position'
      LIMIT 1;

      -- Fallback to first position type if not found
      IF v_default_position_type_id IS NULL THEN
        SELECT id INTO v_default_position_type_id
        FROM position_types
        LIMIT 1;
      END IF;

      INSERT INTO positions (
        id, position_type_id, title_en, title_ar,
        content_en, content_ar, status, current_stage,
        approval_chain_config, author_id, created_at, updated_at, version
      ) VALUES (
        v_artifact_id,
        COALESCE((p_additional_data->>'position_type_id')::uuid, v_default_position_type_id),
        COALESCE(v_ticket.title, 'Converted from ticket'),
        COALESCE(v_ticket.title_ar, v_ticket.title, ''),
        COALESCE(v_ticket.description, ''),
        COALESCE(v_ticket.description_ar, ''),
        'draft',
        1,
        '{"stages": [{"name": "draft", "approvers": []}]}'::jsonb,
        v_effective_user_id,
        NOW(), NOW(), 1
      );

    WHEN 'mou_action' THEN
      RAISE EXCEPTION 'MOU action conversion not yet implemented. Please create MOU manually.';

    WHEN 'foresight' THEN
      RAISE EXCEPTION 'Foresight conversion not yet implemented. Please create foresight item manually.';

    ELSE
      RAISE EXCEPTION 'Invalid target type: %', p_target_type;
  END CASE;

  -- Assign the converting user as owner of the new artifact dossier so that
  -- owner-gated downstream flows (e.g. after-action creation) work. Idempotent.
  IF v_effective_user_id IS NOT NULL THEN
    INSERT INTO dossier_owners (dossier_id, user_id, role_type)
    VALUES (v_artifact_id, v_effective_user_id, 'owner')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Update ticket status
  UPDATE intake_tickets
  SET
    status = 'converted',
    converted_to_type = p_target_type::request_type,
    converted_to_id = v_artifact_id,
    resolved_at = NOW(),
    updated_at = NOW(),
    updated_by = v_effective_user_id
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
    RAISE EXCEPTION 'Conversion failed: %', SQLERRM;
END;
$function$;

-- Backfill owners for already-converted artifacts that have none (e.g. the ONS
-- engagement converted before this fix). Uses the ticket's converter (updated_by).
INSERT INTO dossier_owners (dossier_id, user_id, role_type)
SELECT t.converted_to_id, t.updated_by, 'owner'
FROM intake_tickets t
WHERE t.converted_to_id IS NOT NULL
  AND t.updated_by IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM dossier_owners o WHERE o.dossier_id = t.converted_to_id)
ON CONFLICT DO NOTHING;
