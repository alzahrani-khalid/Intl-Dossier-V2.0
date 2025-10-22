-- Migration: Add triggers for intake entity linking system
-- Feature: 024-intake-entity-linking
-- Task: T015

-- ========================================
-- Function: update_updated_at_column
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Function: log_link_operation (Audit Logging)
-- ========================================

CREATE OR REPLACE FUNCTION log_link_operation()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  details_json JSONB;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'created';
    details_json := jsonb_build_object(
      'link_type', NEW.link_type,
      'source', NEW.source,
      'confidence', NEW.confidence
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    action_type := 'deleted';
    details_json := jsonb_build_object(
      'link_type', OLD.link_type
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
    action_type := 'restored';
    details_json := jsonb_build_object(
      'deleted_at', OLD.deleted_at
    );
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'updated';
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

  -- Insert audit log
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
    auth.uid(),
    details_json
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Triggers for intake_entity_links
-- ========================================

-- Trigger: Update updated_at timestamp
CREATE TRIGGER trg_intake_entity_links_updated_at
BEFORE UPDATE ON intake_entity_links
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Create audit log entry
CREATE TRIGGER trg_intake_entity_links_audit
AFTER INSERT OR UPDATE OR DELETE ON intake_entity_links
FOR EACH ROW
EXECUTE FUNCTION log_link_operation();

-- ========================================
-- Triggers for intake_embeddings
-- ========================================

-- Trigger: Update updated_at timestamp
CREATE TRIGGER trg_intake_embeddings_updated_at
BEFORE UPDATE ON intake_embeddings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Triggers for entity_embeddings
-- ========================================

-- Trigger: Update updated_at timestamp
CREATE TRIGGER trg_entity_embeddings_updated_at
BEFORE UPDATE ON entity_embeddings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates the updated_at timestamp on row update';
COMMENT ON FUNCTION log_link_operation() IS 'Logs all link operations to link_audit_logs table (SECURITY DEFINER for bypass RLS)';
COMMENT ON TRIGGER trg_intake_entity_links_audit ON intake_entity_links IS 'Audit trigger for all link operations';
