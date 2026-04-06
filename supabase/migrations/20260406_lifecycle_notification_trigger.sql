-- Notify engagement owner when lifecycle stage changes
-- Uses existing create_categorized_notification RPC (from 20260111100001_notification_center.sql)
-- Category: 'workflow' (matches notification_category enum)

CREATE OR REPLACE FUNCTION notify_lifecycle_stage_change()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
  v_dossier_title TEXT;
BEGIN
  IF OLD.lifecycle_stage IS DISTINCT FROM NEW.lifecycle_stage THEN
    -- Get the dossier owner and title from parent dossiers table
    SELECT created_by, title INTO v_owner_id, v_dossier_title
    FROM dossiers WHERE id = NEW.id;

    IF v_owner_id IS NOT NULL THEN
      PERFORM create_categorized_notification(
        v_owner_id,                                                              -- p_user_id
        'lifecycle_transition',                                                  -- p_type
        'Engagement stage changed',                                              -- p_title
        'Engagement "' || COALESCE(v_dossier_title, 'Unknown') || '" moved to ' || NEW.lifecycle_stage, -- p_message
        'workflow',                                                              -- p_category
        jsonb_build_object(
          'old_stage', OLD.lifecycle_stage,
          'new_stage', NEW.lifecycle_stage,
          'engagement_id', NEW.id::text
        ),                                                                       -- p_data
        'normal',                                                                -- p_priority
        '/engagements/' || NEW.id::text,                                         -- p_action_url
        'engagement',                                                            -- p_source_type
        NEW.id,                                                                  -- p_source_id (UUID)
        NULL                                                                     -- p_expires_at
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger fires AFTER UPDATE of lifecycle_stage on engagement_dossiers
CREATE TRIGGER trg_lifecycle_stage_notification
  AFTER UPDATE OF lifecycle_stage ON engagement_dossiers
  FOR EACH ROW
  EXECUTE FUNCTION notify_lifecycle_stage_change();
