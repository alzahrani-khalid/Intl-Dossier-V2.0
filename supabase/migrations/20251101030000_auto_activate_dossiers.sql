-- Auto-activate dossiers when they get related records
-- This ensures only dossiers with actual data show as "active"

-- Function to check if dossier has any related records
CREATE OR REPLACE FUNCTION check_dossier_has_records(dossier_uuid uuid)
RETURNS boolean AS $$
DECLARE
  has_records boolean;
BEGIN
  -- Check if dossier has any of these related records
  SELECT EXISTS (
    -- Contacts
    SELECT 1 FROM contacts WHERE dossier_id = dossier_uuid
    UNION ALL
    -- Events
    SELECT 1 FROM events WHERE dossier_id = dossier_uuid
    UNION ALL
    -- MOUs
    SELECT 1 FROM mous WHERE dossier_id = dossier_uuid
    UNION ALL
    -- Positions
    SELECT 1 FROM positions WHERE dossier_id = dossier_uuid
    UNION ALL
    -- Documents
    SELECT 1 FROM documents WHERE dossier_id = dossier_uuid
    UNION ALL
    -- Intelligence reports
    SELECT 1 FROM intelligence_reports WHERE entity_id = dossier_uuid
    LIMIT 1
  ) INTO has_records;
  
  RETURN has_records;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-activate dossier
CREATE OR REPLACE FUNCTION auto_activate_dossier()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the dossier_id from NEW record
  -- Different tables use different column names
  DECLARE
    target_dossier_id uuid;
    current_status text;
  BEGIN
    -- Determine which column contains the dossier reference
    IF TG_TABLE_NAME IN ('contacts', 'events', 'mous', 'positions', 'documents') THEN
      target_dossier_id := NEW.dossier_id;
    ELSIF TG_TABLE_NAME = 'intelligence_reports' THEN
      target_dossier_id := NEW.entity_id;
    ELSE
      RETURN NEW; -- Unknown table, skip
    END IF;

    -- Get current status
    SELECT status INTO current_status
    FROM dossiers
    WHERE id = target_dossier_id;

    -- If dossier is draft or inactive, activate it
    IF current_status IN ('draft', 'inactive') THEN
      UPDATE dossiers
      SET 
        status = 'active',
        updated_at = now()
      WHERE id = target_dossier_id;
      
      RAISE NOTICE 'Auto-activated dossier % due to new record in %', target_dossier_id, TG_TABLE_NAME;
    END IF;

    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

-- Create triggers on relevant tables
DROP TRIGGER IF EXISTS trigger_auto_activate_dossier_contacts ON contacts;
CREATE TRIGGER trigger_auto_activate_dossier_contacts
  AFTER INSERT ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION auto_activate_dossier();

DROP TRIGGER IF EXISTS trigger_auto_activate_dossier_events ON events;
CREATE TRIGGER trigger_auto_activate_dossier_events
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION auto_activate_dossier();

DROP TRIGGER IF EXISTS trigger_auto_activate_dossier_mous ON mous;
CREATE TRIGGER trigger_auto_activate_dossier_mous
  AFTER INSERT ON mous
  FOR EACH ROW
  EXECUTE FUNCTION auto_activate_dossier();

DROP TRIGGER IF EXISTS trigger_auto_activate_dossier_positions ON positions;
CREATE TRIGGER trigger_auto_activate_dossier_positions
  AFTER INSERT ON positions
  FOR EACH ROW
  EXECUTE FUNCTION auto_activate_dossier();

DROP TRIGGER IF EXISTS trigger_auto_activate_dossier_documents ON documents;
CREATE TRIGGER trigger_auto_activate_dossier_documents
  AFTER INSERT ON documents
  FOR EACH ROW
  EXECUTE FUNCTION auto_activate_dossier();

DROP TRIGGER IF EXISTS trigger_auto_activate_dossier_intelligence ON intelligence_reports;
CREATE TRIGGER trigger_auto_activate_dossier_intelligence
  AFTER INSERT ON intelligence_reports
  FOR EACH ROW
  EXECUTE FUNCTION auto_activate_dossier();

-- Add helpful comment
COMMENT ON FUNCTION auto_activate_dossier() IS 'Automatically activates draft/inactive dossiers when they receive related records (contacts, events, etc.)';
COMMENT ON FUNCTION check_dossier_has_records(uuid) IS 'Checks if a dossier has any related records across multiple tables';

