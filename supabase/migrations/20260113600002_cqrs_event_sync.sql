-- ============================================================================
-- CQRS Event Sync: Triggers to sync write models to read models
-- ============================================================================
-- This migration creates triggers that automatically update read models
-- when the underlying write models change, maintaining eventual consistency.
-- ============================================================================

-- ============================================================================
-- TIMELINE SYNC: Calendar Entries
-- ============================================================================

CREATE OR REPLACE FUNCTION read_models.sync_calendar_entry()
RETURNS TRIGGER AS $$
DECLARE
  v_dossier_type TEXT;
  v_event_datetime TIMESTAMPTZ;
  v_end_datetime TIMESTAMPTZ;
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM read_models.delete_timeline_event('calendar_entries', OLD.id);
    RETURN OLD;
  END IF;

  -- Get dossier type
  SELECT type INTO v_dossier_type FROM dossiers WHERE id = NEW.dossier_id;

  -- Combine date and time
  v_event_datetime := CASE
    WHEN NEW.event_time IS NOT NULL
    THEN NEW.event_date + NEW.event_time
    ELSE NEW.event_date::TIMESTAMPTZ
  END;

  -- Calculate end time
  v_end_datetime := CASE
    WHEN NEW.duration_minutes IS NOT NULL
    THEN v_event_datetime + (NEW.duration_minutes || ' minutes')::INTERVAL
    ELSE NULL
  END;

  PERFORM read_models.sync_timeline_event(
    'calendar_entries',
    NEW.id,
    NEW.dossier_id,
    COALESCE(v_dossier_type, 'unknown'),
    'calendar',
    NEW.title_en,
    NEW.title_ar,
    NEW.description_en,
    NEW.description_ar,
    v_event_datetime,
    v_end_datetime,
    'medium',
    NEW.status,
    jsonb_build_object(
      'icon', 'Calendar',
      'color', 'blue',
      'badge_text_en', NEW.entry_type,
      'badge_text_ar', NEW.entry_type,
      'location', NEW.location,
      'is_virtual', NEW.is_virtual,
      'meeting_link', NEW.meeting_link,
      'all_day', NEW.all_day,
      'navigation_url', '/calendar/' || NEW.id
    ),
    NEW.created_by
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_calendar_to_timeline
  AFTER INSERT OR UPDATE OR DELETE ON calendar_entries
  FOR EACH ROW EXECUTE FUNCTION read_models.sync_calendar_entry();

-- ============================================================================
-- TIMELINE SYNC: Dossier Interactions
-- ============================================================================

CREATE OR REPLACE FUNCTION read_models.sync_dossier_interaction()
RETURNS TRIGGER AS $$
DECLARE
  v_dossier_type TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM read_models.delete_timeline_event('dossier_interactions', OLD.id);
    RETURN OLD;
  END IF;

  -- Get dossier type
  SELECT type INTO v_dossier_type FROM dossiers WHERE id = NEW.dossier_id;

  PERFORM read_models.sync_timeline_event(
    'dossier_interactions',
    NEW.id,
    NEW.dossier_id,
    COALESCE(v_dossier_type, 'unknown'),
    'interaction',
    NEW.interaction_type || ' Interaction',
    'تفاعل ' || NEW.interaction_type,
    NEW.details,
    NEW.details,
    NEW.interaction_date::TIMESTAMPTZ,
    NULL,
    'medium',
    NULL,
    jsonb_build_object(
      'icon', 'Users',
      'color', 'purple',
      'interaction_type', NEW.interaction_type,
      'navigation_url', '/dossiers/' || NEW.dossier_id || '?tab=interactions'
    ),
    NEW.created_by
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_interaction_to_timeline
  AFTER INSERT OR UPDATE OR DELETE ON dossier_interactions
  FOR EACH ROW EXECUTE FUNCTION read_models.sync_dossier_interaction();

-- ============================================================================
-- TIMELINE SYNC: Intelligence Reports
-- ============================================================================

CREATE OR REPLACE FUNCTION read_models.sync_intelligence_report()
RETURNS TRIGGER AS $$
DECLARE
  v_dossier_type TEXT;
  v_priority TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM read_models.delete_timeline_event('intelligence_reports', OLD.id);
    RETURN OLD;
  END IF;

  -- Get dossier type
  SELECT type INTO v_dossier_type FROM dossiers WHERE id = NEW.entity_id;

  -- Determine priority from confidence score
  v_priority := CASE
    WHEN NEW.confidence_score >= 80 THEN 'high'
    WHEN NEW.confidence_score >= 50 THEN 'medium'
    ELSE 'low'
  END;

  PERFORM read_models.sync_timeline_event(
    'intelligence_reports',
    NEW.id,
    NEW.entity_id,
    COALESCE(v_dossier_type, 'country'),
    'intelligence',
    COALESCE(NEW.title, NEW.intelligence_type || ' Report'),
    COALESCE(NEW.title_ar, 'تقرير ' || COALESCE(NEW.intelligence_type, 'استخباراتي')),
    NEW.content,
    NEW.content_ar,
    NEW.created_at,
    NULL,
    v_priority,
    NULL,
    jsonb_build_object(
      'icon', 'TrendingUp',
      'color', CASE WHEN v_priority = 'high' THEN 'red' ELSE 'orange' END,
      'confidence_score', NEW.confidence_score,
      'intelligence_type', NEW.intelligence_type,
      'navigation_url', '/dossiers/' || NEW.entity_id || '?tab=intelligence'
    ),
    NULL
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if intelligence_reports table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'intelligence_reports') THEN
    EXECUTE 'CREATE TRIGGER trg_sync_intelligence_to_timeline
      AFTER INSERT OR UPDATE OR DELETE ON intelligence_reports
      FOR EACH ROW EXECUTE FUNCTION read_models.sync_intelligence_report()';
  END IF;
END $$;

-- ============================================================================
-- TIMELINE SYNC: MOUs
-- ============================================================================

CREATE OR REPLACE FUNCTION read_models.sync_mou()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM read_models.delete_timeline_event('mous', OLD.id);
    RETURN OLD;
  END IF;

  -- Sync for country if exists
  IF NEW.country_id IS NOT NULL THEN
    PERFORM read_models.sync_timeline_event(
      'mous',
      NEW.id,
      NEW.country_id,
      'Country',
      'mou',
      NEW.title,
      NEW.title_ar,
      'MoU ' || NEW.lifecycle_state,
      'مذكرة تفاهم ' || NEW.lifecycle_state,
      NEW.effective_date::TIMESTAMPTZ,
      NEW.expiry_date::TIMESTAMPTZ,
      'high',
      NEW.lifecycle_state,
      jsonb_build_object(
        'icon', 'Briefcase',
        'color', 'green',
        'navigation_url', '/mous/' || NEW.id
      ),
      NEW.created_by
    );
  END IF;

  -- Sync for organization if exists
  IF NEW.organization_id IS NOT NULL THEN
    PERFORM read_models.sync_timeline_event(
      'mous',
      NEW.id,
      NEW.organization_id,
      'Organization',
      'mou',
      NEW.title,
      NEW.title_ar,
      'MoU ' || NEW.lifecycle_state,
      'مذكرة تفاهم ' || NEW.lifecycle_state,
      NEW.effective_date::TIMESTAMPTZ,
      NEW.expiry_date::TIMESTAMPTZ,
      'high',
      NEW.lifecycle_state,
      jsonb_build_object(
        'icon', 'Briefcase',
        'color', 'green',
        'navigation_url', '/mous/' || NEW.id
      ),
      NEW.created_by
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_mou_to_timeline
  AFTER INSERT OR UPDATE OR DELETE ON mous
  FOR EACH ROW EXECUTE FUNCTION read_models.sync_mou();

-- ============================================================================
-- RELATIONSHIP GRAPH SYNC
-- ============================================================================

CREATE OR REPLACE FUNCTION read_models.sync_dossier_relationship()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM read_models.delete_relationship(OLD.id);
    RETURN OLD;
  END IF;

  PERFORM read_models.sync_relationship(
    NEW.id,
    NEW.source_dossier_id,
    NEW.target_dossier_id,
    NEW.relationship_type,
    NEW.relationship_subtype,
    COALESCE(NEW.strength, 50),
    COALESCE(NEW.is_bidirectional, false),
    COALESCE(NEW.metadata, '{}'::JSONB)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if dossier_relationships table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dossier_relationships') THEN
    EXECUTE 'CREATE TRIGGER trg_sync_relationship_to_graph
      AFTER INSERT OR UPDATE OR DELETE ON dossier_relationships
      FOR EACH ROW EXECUTE FUNCTION read_models.sync_dossier_relationship()';
  END IF;
END $$;

-- ============================================================================
-- DOSSIER SUMMARY SYNC
-- ============================================================================

CREATE OR REPLACE FUNCTION read_models.sync_dossier_on_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM read_models.dossier_summaries WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  PERFORM read_models.sync_dossier_summary(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_dossier_summary
  AFTER INSERT OR UPDATE ON dossiers
  FOR EACH ROW EXECUTE FUNCTION read_models.sync_dossier_on_change();

-- Also sync when timeline or relationships change
CREATE OR REPLACE FUNCTION read_models.sync_related_dossier_summary()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'timeline_events' THEN
      PERFORM read_models.sync_dossier_summary(OLD.dossier_id);
    ELSIF TG_TABLE_NAME = 'relationship_graph' THEN
      PERFORM read_models.sync_dossier_summary(OLD.source_dossier_id);
      PERFORM read_models.sync_dossier_summary(OLD.target_dossier_id);
    END IF;
    RETURN OLD;
  END IF;

  IF TG_TABLE_NAME = 'timeline_events' THEN
    PERFORM read_models.sync_dossier_summary(NEW.dossier_id);
  ELSIF TG_TABLE_NAME = 'relationship_graph' THEN
    PERFORM read_models.sync_dossier_summary(NEW.source_dossier_id);
    PERFORM read_models.sync_dossier_summary(NEW.target_dossier_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_summary_on_timeline
  AFTER INSERT OR UPDATE OR DELETE ON read_models.timeline_events
  FOR EACH ROW EXECUTE FUNCTION read_models.sync_related_dossier_summary();

CREATE TRIGGER trg_sync_summary_on_graph
  AFTER INSERT OR UPDATE OR DELETE ON read_models.relationship_graph
  FOR EACH ROW EXECUTE FUNCTION read_models.sync_related_dossier_summary();

-- ============================================================================
-- EVENT SOURCING INTEGRATION: Sync from domain events
-- ============================================================================

CREATE OR REPLACE FUNCTION read_models.handle_domain_event()
RETURNS TRIGGER AS $$
DECLARE
  v_dossier_type TEXT;
BEGIN
  -- Handle different event types
  CASE NEW.aggregate_type::TEXT
    WHEN 'relationship' THEN
      IF NEW.event_type = 'RelationshipCreated' THEN
        -- Sync new relationship to graph
        PERFORM read_models.sync_relationship(
          NEW.aggregate_id,
          (NEW.payload->>'source_id')::UUID,
          (NEW.payload->>'target_id')::UUID,
          NEW.payload->>'relationship_type',
          NEW.payload->>'relationship_subtype',
          COALESCE((NEW.payload->>'strength')::INTEGER, 50),
          COALESCE((NEW.payload->>'is_bidirectional')::BOOLEAN, false),
          COALESCE(NEW.payload - 'source_id' - 'target_id' - 'relationship_type', '{}'::JSONB)
        );
      ELSIF NEW.event_type LIKE '%Deleted' OR NEW.event_type LIKE '%Archived' THEN
        PERFORM read_models.delete_relationship(NEW.aggregate_id);
      END IF;

    WHEN 'person', 'engagement', 'organization', 'country', 'forum', 'working_group' THEN
      -- Sync dossier summary on any dossier event
      PERFORM read_models.sync_dossier_summary(NEW.aggregate_id);

      -- For lifecycle events, also emit to timeline
      IF NEW.event_category::TEXT = 'lifecycle' THEN
        SELECT type INTO v_dossier_type FROM dossiers WHERE id = NEW.aggregate_id;

        PERFORM read_models.sync_timeline_event(
          'events',
          NEW.id,
          NEW.aggregate_id,
          COALESCE(v_dossier_type, NEW.aggregate_type::TEXT),
          'event',
          NEW.event_type,
          NEW.event_type,
          COALESCE(NEW.payload->>'description', NEW.event_type || ' occurred'),
          COALESCE(NEW.payload->>'description_ar', 'حدث ' || NEW.event_type),
          NEW.created_at,
          NULL,
          'medium',
          NULL,
          jsonb_build_object(
            'icon', 'Activity',
            'color', 'gray',
            'event_category', NEW.event_category,
            'navigation_url', '/dossiers/' || NEW.aggregate_id
          ),
          NEW.actor_id
        );
      END IF;

    ELSE
      -- For other aggregate types, just update summary if applicable
      NULL;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_from_domain_events
  AFTER INSERT ON events.domain_events
  FOR EACH ROW EXECUTE FUNCTION read_models.handle_domain_event();

-- ============================================================================
-- BATCH SYNC: Initial population of read models
-- ============================================================================

-- Populate timeline from existing calendar entries
CREATE OR REPLACE FUNCTION read_models.populate_timeline_from_calendar()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_record RECORD;
BEGIN
  FOR v_record IN
    SELECT
      ce.id,
      ce.dossier_id,
      d.type as dossier_type,
      ce.entry_type,
      ce.title_en,
      ce.title_ar,
      ce.description_en,
      ce.description_ar,
      ce.event_date,
      ce.event_time,
      ce.duration_minutes,
      ce.status,
      ce.location,
      ce.is_virtual,
      ce.meeting_link,
      ce.all_day,
      ce.created_by
    FROM calendar_entries ce
    JOIN dossiers d ON d.id = ce.dossier_id
  LOOP
    PERFORM read_models.sync_timeline_event(
      'calendar_entries',
      v_record.id,
      v_record.dossier_id,
      v_record.dossier_type,
      'calendar',
      v_record.title_en,
      v_record.title_ar,
      v_record.description_en,
      v_record.description_ar,
      CASE
        WHEN v_record.event_time IS NOT NULL
        THEN v_record.event_date + v_record.event_time
        ELSE v_record.event_date::TIMESTAMPTZ
      END,
      CASE
        WHEN v_record.duration_minutes IS NOT NULL
        THEN (v_record.event_date + COALESCE(v_record.event_time, '00:00:00'::TIME)) +
             (v_record.duration_minutes || ' minutes')::INTERVAL
        ELSE NULL
      END,
      'medium',
      v_record.status,
      jsonb_build_object(
        'icon', 'Calendar',
        'color', 'blue',
        'badge_text_en', v_record.entry_type,
        'badge_text_ar', v_record.entry_type,
        'location', v_record.location,
        'is_virtual', v_record.is_virtual,
        'meeting_link', v_record.meeting_link,
        'all_day', v_record.all_day,
        'navigation_url', '/calendar/' || v_record.id
      ),
      v_record.created_by
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Populate relationship graph from existing relationships
CREATE OR REPLACE FUNCTION read_models.populate_relationship_graph()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_record RECORD;
BEGIN
  -- Only run if dossier_relationships exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dossier_relationships') THEN
    RETURN 0;
  END IF;

  FOR v_record IN
    SELECT
      dr.id,
      dr.source_dossier_id,
      dr.target_dossier_id,
      dr.relationship_type,
      dr.relationship_subtype,
      COALESCE(dr.strength, 50) as strength,
      COALESCE(dr.is_bidirectional, false) as is_bidirectional,
      COALESCE(dr.metadata, '{}'::JSONB) as metadata
    FROM dossier_relationships dr
  LOOP
    PERFORM read_models.sync_relationship(
      v_record.id,
      v_record.source_dossier_id,
      v_record.target_dossier_id,
      v_record.relationship_type,
      v_record.relationship_subtype,
      v_record.strength,
      v_record.is_bidirectional,
      v_record.metadata
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Populate dossier summaries
CREATE OR REPLACE FUNCTION read_models.populate_dossier_summaries()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_dossier_id UUID;
BEGIN
  FOR v_dossier_id IN SELECT id FROM dossiers
  LOOP
    PERFORM read_models.sync_dossier_summary(v_dossier_id);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Master function to populate all read models
CREATE OR REPLACE FUNCTION read_models.populate_all()
RETURNS TABLE (
  model_name TEXT,
  records_synced INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'timeline_from_calendar'::TEXT, read_models.populate_timeline_from_calendar()
  UNION ALL
  SELECT 'relationship_graph'::TEXT, read_models.populate_relationship_graph()
  UNION ALL
  SELECT 'dossier_summaries'::TEXT, read_models.populate_dossier_summaries();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION read_models.sync_calendar_entry IS 'Trigger function to sync calendar entries to timeline';
COMMENT ON FUNCTION read_models.sync_dossier_interaction IS 'Trigger function to sync interactions to timeline';
COMMENT ON FUNCTION read_models.sync_mou IS 'Trigger function to sync MOUs to timeline';
COMMENT ON FUNCTION read_models.sync_dossier_relationship IS 'Trigger function to sync relationships to graph';
COMMENT ON FUNCTION read_models.sync_dossier_on_change IS 'Trigger function to sync dossier summaries';
COMMENT ON FUNCTION read_models.handle_domain_event IS 'Event handler to sync domain events to read models';
COMMENT ON FUNCTION read_models.populate_all IS 'Batch function to populate all read models from existing data';
