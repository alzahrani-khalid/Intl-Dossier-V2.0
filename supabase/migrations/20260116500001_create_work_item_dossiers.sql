-- Migration: Create work_item_dossiers junction table
-- Feature: 035-dossier-context (Smart Dossier Context Inheritance)
-- Date: 2026-01-16
-- Description: Junction table linking work items (tasks, commitments, intakes) to dossiers
--              with inheritance tracking for context resolution

-- ============================================================================
-- T007: Create work_item_dossiers table
-- ============================================================================

CREATE TABLE work_item_dossiers (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Polymorphic Work Item Reference
  work_item_type TEXT NOT NULL
    CHECK (work_item_type IN ('task', 'commitment', 'intake')),
  work_item_id UUID NOT NULL,

  -- Dossier Reference
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,

  -- Inheritance Tracking
  inheritance_source TEXT NOT NULL DEFAULT 'direct'
    CHECK (inheritance_source IN ('direct', 'engagement', 'after_action', 'position', 'mou')),
  inherited_from_type TEXT
    CHECK (inherited_from_type IS NULL OR inherited_from_type IN ('engagement', 'after_action', 'position', 'mou')),
  inherited_from_id UUID,
  inheritance_path JSONB DEFAULT '[]'::jsonb,

  -- Multi-Dossier Support
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,

  -- Audit Fields
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Soft Delete
  deleted_at TIMESTAMPTZ,

  -- Optimistic Locking
  _version INTEGER NOT NULL DEFAULT 1,

  -- Constraints
  CONSTRAINT valid_inheritance_metadata CHECK (
    (inheritance_source = 'direct' AND inherited_from_type IS NULL AND inherited_from_id IS NULL) OR
    (inheritance_source != 'direct' AND inherited_from_type IS NOT NULL AND inherited_from_id IS NOT NULL)
  )
);

-- Unique constraint: Each work item can only be linked to each dossier once (excluding soft-deleted)
CREATE UNIQUE INDEX idx_work_item_dossiers_unique_active
  ON work_item_dossiers (work_item_type, work_item_id, dossier_id)
  WHERE deleted_at IS NULL;

-- Unique constraint: Only one primary dossier per work item
CREATE UNIQUE INDEX idx_work_item_dossiers_unique_primary
  ON work_item_dossiers (work_item_type, work_item_id)
  WHERE is_primary = true AND deleted_at IS NULL;

-- Table and column comments
COMMENT ON TABLE work_item_dossiers IS
  'Junction table linking work items to dossiers with inheritance source tracking for context inheritance';
COMMENT ON COLUMN work_item_dossiers.work_item_type IS
  'Type of work item: task, commitment, or intake';
COMMENT ON COLUMN work_item_dossiers.inheritance_source IS
  'How link was established: direct, engagement, after_action, position, mou';
COMMENT ON COLUMN work_item_dossiers.inheritance_path IS
  'JSONB array tracking resolution chain: [{type, id, name_en, name_ar}]';
COMMENT ON COLUMN work_item_dossiers.is_primary IS
  'Primary dossier for UI display. Only one per work_item.';

-- ============================================================================
-- T008: Create indexes for performance
-- ============================================================================

-- Timeline fetch (hot path) - dossier activities ordered by time
CREATE INDEX idx_work_item_dossiers_dossier_active
  ON work_item_dossiers (dossier_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Context resolution (reverse lookup) - find dossiers for a work item
CREATE INDEX idx_work_item_dossiers_work_item_active
  ON work_item_dossiers (work_item_type, work_item_id)
  WHERE deleted_at IS NULL;

-- Inheritance filtering for analytics
CREATE INDEX idx_work_item_dossiers_inheritance
  ON work_item_dossiers (dossier_id, inheritance_source, created_at DESC)
  WHERE deleted_at IS NULL;

-- Primary dossier lookup (fast single dossier fetch)
CREATE INDEX idx_work_item_dossiers_primary
  ON work_item_dossiers (work_item_type, work_item_id)
  WHERE deleted_at IS NULL AND is_primary = true;

-- Cursor pagination for timeline
CREATE INDEX idx_work_item_dossiers_cursor
  ON work_item_dossiers (dossier_id, created_at DESC, id)
  WHERE deleted_at IS NULL;

-- Incremental sync support (mobile apps)
CREATE INDEX idx_work_item_dossiers_sync
  ON work_item_dossiers (updated_at DESC)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- T009: RLS Policies
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE work_item_dossiers ENABLE ROW LEVEL SECURITY;

-- SELECT: User can view links for accessible dossiers + work items
CREATE POLICY work_item_dossiers_select ON work_item_dossiers
FOR SELECT USING (
  -- Dossier access (sensitivity-based)
  EXISTS (
    SELECT 1 FROM dossiers d
    WHERE d.id = dossier_id
    AND d.status != 'deleted'
    AND get_user_clearance_level(auth.uid()) >= d.sensitivity_level
  )
  AND
  -- Work item access (polymorphic)
  CASE work_item_type
    WHEN 'task' THEN work_item_id IN (
      SELECT id FROM tasks
      WHERE (assignee_id = auth.uid() OR created_by = auth.uid())
      AND is_deleted = false
    )
    WHEN 'commitment' THEN work_item_id IN (
      SELECT id FROM commitments
      WHERE created_by = auth.uid()
        OR (responsible->>'userId')::uuid = auth.uid()
    )
    WHEN 'intake' THEN work_item_id IN (
      SELECT id FROM intake_tickets
      WHERE (created_by = auth.uid() OR assigned_to = auth.uid())
    )
    ELSE false
  END
);

-- INSERT: User can link work items they own to dossiers they can access
CREATE POLICY work_item_dossiers_insert ON work_item_dossiers
FOR INSERT WITH CHECK (
  -- User must be able to access the dossier
  EXISTS (
    SELECT 1 FROM dossiers d
    WHERE d.id = dossier_id
    AND d.status != 'deleted'
    AND get_user_clearance_level(auth.uid()) >= d.sensitivity_level
  )
  AND
  -- User must own/create the work item
  CASE work_item_type
    WHEN 'task' THEN work_item_id IN (
      SELECT id FROM tasks
      WHERE created_by = auth.uid() AND is_deleted = false
    )
    WHEN 'commitment' THEN work_item_id IN (
      SELECT id FROM commitments
      WHERE created_by = auth.uid()
        OR (responsible->>'userId')::uuid = auth.uid()
    )
    WHEN 'intake' THEN work_item_id IN (
      SELECT id FROM intake_tickets
      WHERE created_by = auth.uid()
    )
    ELSE false
  END
  AND
  -- Ensure created_by matches current user
  created_by = auth.uid()
);

-- UPDATE: Link creator or dossier admin can update
CREATE POLICY work_item_dossiers_update ON work_item_dossiers
FOR UPDATE USING (
  created_by = auth.uid()
  OR can_edit_dossier(dossier_id)
);

-- DELETE: Link creator or dossier admin can delete
CREATE POLICY work_item_dossiers_delete ON work_item_dossiers
FOR DELETE USING (
  created_by = auth.uid()
  OR can_edit_dossier(dossier_id)
);

-- ============================================================================
-- T010: Create dossier_activity_timeline VIEW
-- ============================================================================

CREATE OR REPLACE VIEW dossier_activity_timeline AS
SELECT
  wid.id as link_id,
  wid.work_item_id,
  wid.work_item_type,
  wid.dossier_id,
  wid.inheritance_source,
  wid.inheritance_path,
  wid.created_at as activity_timestamp,

  -- Polymorphic title extraction
  COALESCE(t.title, c.title, it.title) as activity_title,

  -- Polymorphic status extraction
  CASE wid.work_item_type
    WHEN 'task' THEN t.status::TEXT
    WHEN 'commitment' THEN c.status::TEXT
    WHEN 'intake' THEN it.status::TEXT
  END as status,

  -- Polymorphic priority extraction
  CASE wid.work_item_type
    WHEN 'task' THEN t.priority::TEXT
    WHEN 'commitment' THEN c.priority::TEXT
    WHEN 'intake' THEN it.priority::TEXT
  END as priority,

  -- Polymorphic assignee extraction
  CASE wid.work_item_type
    WHEN 'task' THEN t.assignee_id
    WHEN 'commitment' THEN (c.responsible->>'userId')::uuid
    WHEN 'intake' THEN it.assigned_to
  END as assignee_id,

  -- UI icon type
  CASE wid.work_item_type
    WHEN 'task' THEN 'checklist'
    WHEN 'commitment' THEN 'handshake'
    WHEN 'intake' THEN 'inbox'
  END as icon_type,

  -- Inheritance label for badges
  CASE wid.inheritance_source
    WHEN 'direct' THEN NULL
    WHEN 'engagement' THEN 'via Engagement'
    WHEN 'after_action' THEN 'via After-Action'
    WHEN 'position' THEN 'via Position'
    WHEN 'mou' THEN 'via MOU'
  END as inheritance_label

FROM work_item_dossiers wid
LEFT JOIN tasks t ON wid.work_item_type = 'task'
  AND t.id = wid.work_item_id
  AND t.is_deleted = false
LEFT JOIN commitments c ON wid.work_item_type = 'commitment'
  AND c.id = wid.work_item_id
LEFT JOIN intake_tickets it ON wid.work_item_type = 'intake'
  AND it.id = wid.work_item_id
WHERE wid.deleted_at IS NULL;

COMMENT ON VIEW dossier_activity_timeline IS
  'Aggregated view of all activities linked to dossiers for timeline display';

-- ============================================================================
-- T011: Create resolve_dossier_context RPC function
-- ============================================================================

CREATE OR REPLACE FUNCTION resolve_dossier_context(
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS TABLE (
  dossier_id UUID,
  dossier_name_en TEXT,
  dossier_name_ar TEXT,
  dossier_type TEXT,
  dossier_status TEXT,
  inheritance_source TEXT,
  resolution_path UUID[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  -- Validate entity_type
  IF p_entity_type NOT IN ('dossier', 'engagement', 'after_action', 'position') THEN
    RAISE EXCEPTION 'Invalid entity_type: %. Must be one of: dossier, engagement, after_action, position', p_entity_type;
  END IF;

  -- Direct dossier reference
  IF p_entity_type = 'dossier' THEN
    RETURN QUERY
    SELECT
      d.id,
      d.name_en,
      d.name_ar,
      d.type,
      d.status,
      'direct'::TEXT,
      ARRAY[d.id]
    FROM dossiers d
    WHERE d.id = p_entity_id
      AND d.status != 'archived'
      AND d.status != 'deleted'
      AND get_user_clearance_level(auth.uid()) >= d.sensitivity_level;

  -- Engagement → Dossier (direct relationship)
  ELSIF p_entity_type = 'engagement' THEN
    RETURN QUERY
    SELECT
      d.id,
      d.name_en,
      d.name_ar,
      d.type,
      d.status,
      'engagement'::TEXT,
      ARRAY[p_entity_id, d.id]
    FROM engagements e
    JOIN dossiers d ON e.dossier_id = d.id
    WHERE e.id = p_entity_id
      AND d.status != 'archived'
      AND d.status != 'deleted'
      AND get_user_clearance_level(auth.uid()) >= d.sensitivity_level;

  -- After-Action → Engagement → Dossier (chained relationship)
  ELSIF p_entity_type = 'after_action' THEN
    RETURN QUERY
    SELECT
      d.id,
      d.name_en,
      d.name_ar,
      d.type,
      d.status,
      'after_action'::TEXT,
      ARRAY[p_entity_id, e.id, d.id]
    FROM after_action_records aa
    JOIN engagements e ON aa.engagement_id = e.id
    JOIN dossiers d ON e.dossier_id = d.id
    WHERE aa.id = p_entity_id
      AND d.status != 'archived'
      AND d.status != 'deleted'
      AND get_user_clearance_level(auth.uid()) >= d.sensitivity_level;

  -- Position → Dossier (via position_dossier_links)
  ELSIF p_entity_type = 'position' THEN
    RETURN QUERY
    SELECT
      d.id,
      d.name_en,
      d.name_ar,
      d.type,
      d.status,
      'position'::TEXT,
      ARRAY[p_entity_id, d.id]
    FROM position_dossier_links pdl
    JOIN dossiers d ON pdl.dossier_id = d.id
    WHERE pdl.position_id = p_entity_id
      AND d.status != 'archived'
      AND d.status != 'deleted'
      AND get_user_clearance_level(auth.uid()) >= d.sensitivity_level;
  END IF;
END;
$$;

COMMENT ON FUNCTION resolve_dossier_context IS
  'Resolves dossier context from entity type and ID by following relationship chains. Returns empty if entity not found or user lacks access.';

-- ============================================================================
-- Trigger for updated_at
-- ============================================================================

CREATE TRIGGER update_work_item_dossiers_updated_at
  BEFORE UPDATE ON work_item_dossiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON work_item_dossiers TO authenticated;
GRANT SELECT ON dossier_activity_timeline TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_dossier_context TO authenticated;
