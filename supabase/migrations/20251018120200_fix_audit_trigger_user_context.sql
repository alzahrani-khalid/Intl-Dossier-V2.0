-- Fix audit trigger to use linked_by/updated_by instead of auth.uid()
-- Feature: 024-intake-entity-linking
-- Issue: auth.uid() returns NULL when service_role client is used (Edge Functions)

-- ========================================
-- Function: log_link_operation (Audit Logging) - FIXED
-- ========================================

CREATE OR REPLACE FUNCTION log_link_operation()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  details_json JSONB;
  user_id UUID;
BEGIN
  -- Determine action type and user_id
  IF TG_OP = 'INSERT' THEN
    action_type := 'created';
    user_id := NEW.linked_by;  -- Use linked_by for INSERT
    details_json := jsonb_build_object(
      'link_type', NEW.link_type,
      'source', NEW.source,
      'confidence', NEW.confidence
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    action_type := 'deleted';
    user_id := COALESCE(NEW.linked_by, OLD.linked_by);  -- Fallback to OLD if NEW is NULL
    details_json := jsonb_build_object(
      'link_type', OLD.link_type
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
    action_type := 'restored';
    user_id := COALESCE(NEW.linked_by, OLD.linked_by);
    details_json := jsonb_build_object(
      'deleted_at', OLD.deleted_at
    );
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'updated';
    user_id := COALESCE(NEW.linked_by, OLD.linked_by);
    details_json := jsonb_build_object(
      'old_values', jsonb_build_object(
        'notes', OLD.notes,
        'link_order', OLD.link_order
      ),
      'new_values', jsonb_build_object(
        'notes', NEW.notes,
        'link_order', NEW.link_order
      )
    );
  ELSE
    RETURN NULL; -- Ignore DELETE operations
  END IF;

  -- Insert audit log with user_id from link record instead of auth.uid()
  INSERT INTO link_audit_logs (
    link_id,
    intake_id,
    entity_type,
    entity_id,
    action,
    performed_by,
    details
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.intake_id, OLD.intake_id),
    COALESCE(NEW.entity_type, OLD.entity_type),
    COALESCE(NEW.entity_id, OLD.entity_id),
    action_type,
    user_id,  -- Use user_id from link record, not auth.uid()
    details_json
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_link_operation() IS 'Logs all link operations to link_audit_logs table using linked_by field instead of auth.uid() (compatible with service_role context)';
