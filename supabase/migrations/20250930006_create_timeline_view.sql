-- Migration: Create Dossier Timeline Materialized View
-- Date: 2025-09-30
-- Task: T010

-- Create materialized view aggregating all event types
CREATE MATERIALIZED VIEW dossier_timeline AS
SELECT
  d.id as dossier_id,
  'engagement' as event_type,
  e.id::text as source_id,
  e.date as event_date,
  e.title_en as event_title_en,
  e.title_ar as event_title_ar,
  e.summary_en as event_description_en,
  e.summary_ar as event_description_ar,
  jsonb_build_object(
    'type', e.engagement_type, 
    'location', e.location,
    'participants', e.participants
  ) as metadata
FROM dossiers d
JOIN engagements e ON e.dossier_id = d.id
WHERE NOT d.archived

UNION ALL

SELECT
  d.id,
  'position' as event_type,
  p.id::text,
  p.created_at,
  p.title_en,
  p.title_ar,
  p.description_en,
  p.description_ar,
  jsonb_build_object(
    'stance', p.stance, 
    'priority', p.priority,
    'status', p.status
  ) as metadata
FROM dossiers d
JOIN positions p ON p.dossier_id = d.id
WHERE NOT d.archived

UNION ALL

SELECT
  d.id,
  'mou' as event_type,
  m.id::text,
  COALESCE(m.signed_date, m.created_at),
  m.title_en,
  m.title_ar,
  m.summary_en,
  m.summary_ar,
  jsonb_build_object(
    'status', m.status, 
    'expiry_date', m.expiry_date,
    'counterparty', m.counterparty
  ) as metadata
FROM dossiers d
JOIN mous m ON m.dossier_id = d.id
WHERE NOT d.archived

UNION ALL

SELECT
  d.id,
  'commitment' as event_type,
  c.id::text,
  COALESCE(c.due_date, c.created_at),
  c.title_en,
  c.title_ar,
  c.description_en,
  c.description_ar,
  jsonb_build_object(
    'status', c.status, 
    'assignee', c.assignee_id,
    'due_date', c.due_date
  ) as metadata
FROM dossiers d
JOIN commitments c ON c.dossier_id = d.id
WHERE NOT d.archived

UNION ALL

SELECT
  d.id,
  'document' as event_type,
  doc.id::text,
  doc.uploaded_at,
  doc.name_en,
  doc.name_ar,
  doc.description_en,
  doc.description_ar,
  jsonb_build_object(
    'file_type', doc.file_type, 
    'size', doc.file_size,
    'path', doc.storage_path
  ) as metadata
FROM dossiers d
JOIN documents doc ON doc.dossier_id = d.id
WHERE NOT d.archived

UNION ALL

SELECT
  d.id,
  'intelligence' as event_type,
  i.id::text,
  i.logged_at,
  i.title_en,
  i.title_ar,
  i.content_en,
  i.content_ar,
  jsonb_build_object(
    'source', i.source, 
    'confidence', i.confidence_level,
    'category', i.category
  ) as metadata
FROM dossiers d
JOIN intelligence_signals i ON i.dossier_id = d.id
WHERE NOT d.archived;

-- Indexes for cursor-based pagination (critical for performance)
CREATE UNIQUE INDEX idx_timeline_cursor 
ON dossier_timeline(dossier_id, event_date DESC, event_type, source_id);

CREATE INDEX idx_timeline_dossier 
ON dossier_timeline(dossier_id);

CREATE INDEX idx_timeline_type 
ON dossier_timeline(event_type);

CREATE INDEX idx_timeline_date 
ON dossier_timeline(event_date DESC);

-- Function to refresh timeline view
CREATE OR REPLACE FUNCTION refresh_dossier_timeline()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dossier_timeline;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON MATERIALIZED VIEW dossier_timeline IS 'Aggregated timeline of all events related to dossiers from multiple source tables';
COMMENT ON COLUMN dossier_timeline.event_type IS 'Type of event: engagement, position, mou, commitment, document, or intelligence';
COMMENT ON COLUMN dossier_timeline.source_id IS 'ID of the source record in the originating table';
COMMENT ON COLUMN dossier_timeline.metadata IS 'Event-type specific metadata as JSONB';

-- Note: Initial population happens automatically
-- For incremental updates, schedule: SELECT refresh_dossier_timeline();
-- Recommended: Set up pg_cron job or trigger-based refresh strategy
