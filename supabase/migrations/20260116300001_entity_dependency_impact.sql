-- Migration: Entity Dependency Visualization and Impact Assessment
-- Feature: entity-dependency-impact
-- Date: 2026-01-16
-- Description: Tables and functions for analyzing dependencies between entities
-- and generating impact assessment reports when entities are modified

-- ============================================================================
-- DEPENDENCY TYPES ENUM
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dependency_type') THEN
    CREATE TYPE dependency_type AS ENUM (
      'direct',           -- Direct relationship
      'transitive',       -- Through other entities
      'commitment',       -- Via commitments
      'working_group',    -- Through working group membership
      'document',         -- Through shared documents
      'position',         -- Via position assignments
      'event'             -- Through event participation
    );
  END IF;
END $$;

-- ============================================================================
-- IMPACT SEVERITY ENUM
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'impact_severity') THEN
    CREATE TYPE impact_severity AS ENUM (
      'critical',   -- Major disruption, immediate attention required
      'high',       -- Significant impact, action needed soon
      'medium',     -- Moderate impact, should be addressed
      'low',        -- Minor impact, informational
      'none'        -- No measurable impact
    );
  END IF;
END $$;

-- ============================================================================
-- IMPACT CATEGORY ENUM
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'impact_category') THEN
    CREATE TYPE impact_category AS ENUM (
      'stakeholder',      -- Affects people/contacts
      'commitment',       -- Affects commitments/deliverables
      'working_group',    -- Affects working group operations
      'relationship',     -- Affects bilateral/multilateral relations
      'document',         -- Affects document validity
      'event',            -- Affects scheduled events
      'policy',           -- Affects policy implementation
      'operational'       -- Affects day-to-day operations
    );
  END IF;
END $$;

-- ============================================================================
-- ENTITY DEPENDENCY SNAPSHOTS TABLE
-- ============================================================================
-- Stores computed dependency graphs for entities at specific points in time

CREATE TABLE IF NOT EXISTS entity_dependency_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  source_entity_type TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Dependency data
  dependency_graph JSONB NOT NULL DEFAULT '{}',
  total_dependencies INT NOT NULL DEFAULT 0,
  max_depth INT NOT NULL DEFAULT 0,

  -- Stats by type
  direct_count INT NOT NULL DEFAULT 0,
  transitive_count INT NOT NULL DEFAULT 0,
  commitment_count INT NOT NULL DEFAULT 0,
  working_group_count INT NOT NULL DEFAULT 0,

  -- Metadata
  computation_time_ms INT,
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT valid_dependency_graph CHECK (jsonb_typeof(dependency_graph) = 'object')
);

CREATE INDEX idx_dep_snapshots_source ON entity_dependency_snapshots(source_entity_id);
CREATE INDEX idx_dep_snapshots_computed_at ON entity_dependency_snapshots(computed_at DESC);
CREATE INDEX idx_dep_snapshots_type ON entity_dependency_snapshots(source_entity_type);

COMMENT ON TABLE entity_dependency_snapshots IS 'Cached dependency graph snapshots for performance';
COMMENT ON COLUMN entity_dependency_snapshots.dependency_graph IS 'JSON graph structure with nodes and edges';

-- ============================================================================
-- IMPACT ASSESSMENTS TABLE
-- ============================================================================
-- Records impact assessment reports when entities are modified

CREATE TABLE IF NOT EXISTS impact_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source of the change
  source_entity_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  source_entity_type TEXT NOT NULL,

  -- Change details
  change_type TEXT NOT NULL CHECK (change_type IN (
    'create', 'update', 'delete', 'archive',
    'relationship_add', 'relationship_remove',
    'status_change', 'ownership_change'
  )),
  change_description_en TEXT,
  change_description_ar TEXT,
  changed_fields JSONB DEFAULT '[]',

  -- Assessment results
  overall_severity impact_severity NOT NULL DEFAULT 'none',
  total_affected_entities INT NOT NULL DEFAULT 0,
  assessment_summary_en TEXT,
  assessment_summary_ar TEXT,

  -- Detailed impacts
  impacts JSONB NOT NULL DEFAULT '[]',
  recommendations_en TEXT[] DEFAULT '{}',
  recommendations_ar TEXT[] DEFAULT '{}',

  -- Timestamps and audit
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'acknowledged', 'actioned')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  CONSTRAINT valid_impacts CHECK (jsonb_typeof(impacts) = 'array'),
  CONSTRAINT valid_changed_fields CHECK (jsonb_typeof(changed_fields) = 'array')
);

CREATE INDEX idx_impact_source ON impact_assessments(source_entity_id);
CREATE INDEX idx_impact_severity ON impact_assessments(overall_severity);
CREATE INDEX idx_impact_status ON impact_assessments(status);
CREATE INDEX idx_impact_assessed_at ON impact_assessments(assessed_at DESC);
CREATE INDEX idx_impact_change_type ON impact_assessments(change_type);

COMMENT ON TABLE impact_assessments IS 'Impact assessment reports for entity changes';

-- ============================================================================
-- IMPACT AFFECTED ENTITIES TABLE
-- ============================================================================
-- Detailed list of entities affected by each impact assessment

CREATE TABLE IF NOT EXISTS impact_affected_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  impact_assessment_id UUID NOT NULL REFERENCES impact_assessments(id) ON DELETE CASCADE,

  -- Affected entity
  affected_entity_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  affected_entity_type TEXT NOT NULL,
  affected_entity_name_en TEXT NOT NULL,
  affected_entity_name_ar TEXT,

  -- Impact details
  dependency_type dependency_type NOT NULL,
  dependency_path JSONB DEFAULT '[]',
  depth INT NOT NULL DEFAULT 1,

  -- Categorized impact
  impact_category impact_category NOT NULL,
  impact_severity impact_severity NOT NULL DEFAULT 'low',
  impact_description_en TEXT,
  impact_description_ar TEXT,

  -- Action required
  action_required BOOLEAN DEFAULT false,
  suggested_action_en TEXT,
  suggested_action_ar TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_dependency_path CHECK (jsonb_typeof(dependency_path) = 'array')
);

CREATE INDEX idx_affected_assessment ON impact_affected_entities(impact_assessment_id);
CREATE INDEX idx_affected_entity ON impact_affected_entities(affected_entity_id);
CREATE INDEX idx_affected_severity ON impact_affected_entities(impact_severity);
CREATE INDEX idx_affected_category ON impact_affected_entities(impact_category);

COMMENT ON TABLE impact_affected_entities IS 'Detailed list of entities affected by an impact assessment';

-- ============================================================================
-- DEPENDENCY RULES TABLE
-- ============================================================================
-- Configurable rules for determining dependency relationships

CREATE TABLE IF NOT EXISTS dependency_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Rule identification
  name_en TEXT NOT NULL,
  name_ar TEXT,
  description_en TEXT,
  description_ar TEXT,

  -- Rule configuration
  source_entity_types TEXT[] NOT NULL DEFAULT '{}',
  target_entity_types TEXT[] NOT NULL DEFAULT '{}',
  relationship_types TEXT[] NOT NULL DEFAULT '{}',
  dependency_type dependency_type NOT NULL,

  -- Impact calculation
  base_severity impact_severity NOT NULL DEFAULT 'medium',
  severity_multiplier DECIMAL(3,2) DEFAULT 1.0,
  impact_categories impact_category[] NOT NULL DEFAULT '{}',

  -- Rule conditions (JSONB for flexibility)
  conditions JSONB DEFAULT '{}',

  -- Rule management
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INT NOT NULL DEFAULT 100,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT valid_conditions CHECK (jsonb_typeof(conditions) = 'object')
);

CREATE INDEX idx_dep_rules_active ON dependency_rules(is_active) WHERE is_active = true;
CREATE INDEX idx_dep_rules_priority ON dependency_rules(priority);

COMMENT ON TABLE dependency_rules IS 'Configurable rules for dependency analysis';

-- ============================================================================
-- IMPACT NOTIFICATIONS TABLE
-- ============================================================================
-- Notifications sent to stakeholders about impacts

CREATE TABLE IF NOT EXISTS impact_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  impact_assessment_id UUID NOT NULL REFERENCES impact_assessments(id) ON DELETE CASCADE,

  -- Recipient
  user_id UUID NOT NULL REFERENCES auth.users(id),
  entity_id UUID REFERENCES dossiers(id),

  -- Notification content
  title_en TEXT NOT NULL,
  title_ar TEXT,
  message_en TEXT NOT NULL,
  message_ar TEXT,
  severity impact_severity NOT NULL,

  -- Status
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,

  -- Delivery
  delivery_channels TEXT[] DEFAULT '{in_app}',
  email_sent BOOLEAN DEFAULT false,
  push_sent BOOLEAN DEFAULT false
);

CREATE INDEX idx_impact_notif_user ON impact_notifications(user_id);
CREATE INDEX idx_impact_notif_assessment ON impact_notifications(impact_assessment_id);
CREATE INDEX idx_impact_notif_unread ON impact_notifications(user_id, read_at) WHERE read_at IS NULL;

COMMENT ON TABLE impact_notifications IS 'Notifications to stakeholders about impacts';

-- ============================================================================
-- FUNCTIONS: Compute Entity Dependencies
-- ============================================================================

CREATE OR REPLACE FUNCTION compute_entity_dependencies(
  p_entity_id UUID,
  p_max_depth INT DEFAULT 3,
  p_include_transitive BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_nodes JSONB := '[]';
  v_edges JSONB := '[]';
  v_visited UUID[] := ARRAY[]::UUID[];
  v_current_level UUID[];
  v_next_level UUID[];
  v_depth INT := 0;
  v_entity RECORD;
  v_rel RECORD;
  v_source_type TEXT;
BEGIN
  -- Get source entity type
  SELECT type INTO v_source_type FROM dossiers WHERE id = p_entity_id;

  IF v_source_type IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'Entity not found',
      'entity_id', p_entity_id
    );
  END IF;

  -- Initialize with source entity
  v_current_level := ARRAY[p_entity_id];
  v_visited := ARRAY[p_entity_id];

  -- Add source node
  SELECT jsonb_build_object(
    'id', d.id,
    'name_en', d.name_en,
    'name_ar', d.name_ar,
    'type', d.type,
    'depth', 0,
    'is_source', true
  ) INTO v_entity FROM dossiers d WHERE d.id = p_entity_id;

  v_nodes := v_nodes || v_entity;

  -- BFS traversal for dependencies
  WHILE array_length(v_current_level, 1) > 0 AND v_depth < p_max_depth LOOP
    v_depth := v_depth + 1;
    v_next_level := ARRAY[]::UUID[];

    -- Process current level
    FOR v_rel IN
      SELECT
        dr.id as rel_id,
        dr.relationship_type,
        dr.status as rel_status,
        CASE
          WHEN dr.source_dossier_id = ANY(v_current_level) THEN dr.target_dossier_id
          ELSE dr.source_dossier_id
        END as connected_id,
        CASE
          WHEN dr.source_dossier_id = ANY(v_current_level) THEN dr.source_dossier_id
          ELSE dr.target_dossier_id
        END as from_id,
        d.id as entity_id,
        d.name_en,
        d.name_ar,
        d.type,
        d.status
      FROM dossier_relationships dr
      JOIN dossiers d ON d.id = CASE
        WHEN dr.source_dossier_id = ANY(v_current_level) THEN dr.target_dossier_id
        ELSE dr.source_dossier_id
      END
      WHERE (dr.source_dossier_id = ANY(v_current_level) OR dr.target_dossier_id = ANY(v_current_level))
        AND dr.status = 'active'
        AND d.status = 'active'
        AND d.id != ALL(v_visited)
    LOOP
      -- Add node if not visited
      IF NOT v_rel.entity_id = ANY(v_visited) THEN
        v_visited := array_append(v_visited, v_rel.entity_id);

        IF p_include_transitive THEN
          v_next_level := array_append(v_next_level, v_rel.entity_id);
        END IF;

        v_nodes := v_nodes || jsonb_build_object(
          'id', v_rel.entity_id,
          'name_en', v_rel.name_en,
          'name_ar', v_rel.name_ar,
          'type', v_rel.type,
          'status', v_rel.status,
          'depth', v_depth,
          'dependency_type', CASE
            WHEN v_depth = 1 THEN 'direct'
            ELSE 'transitive'
          END
        );
      END IF;

      -- Add edge
      v_edges := v_edges || jsonb_build_object(
        'id', v_rel.rel_id,
        'source', v_rel.from_id,
        'target', v_rel.connected_id,
        'relationship_type', v_rel.relationship_type,
        'depth', v_depth
      );
    END LOOP;

    v_current_level := v_next_level;
  END LOOP;

  -- Add commitment dependencies
  FOR v_entity IN
    SELECT
      c.id,
      c.title as name_en,
      c.title as name_ar,
      'commitment' as type,
      c.status,
      1 as depth
    FROM commitments c
    WHERE c.dossier_id = p_entity_id
      AND c.status NOT IN ('completed', 'cancelled')
  LOOP
    IF NOT v_entity.id = ANY(v_visited) THEN
      v_nodes := v_nodes || jsonb_build_object(
        'id', v_entity.id,
        'name_en', v_entity.name_en,
        'name_ar', v_entity.name_ar,
        'type', v_entity.type,
        'status', v_entity.status,
        'depth', v_entity.depth,
        'dependency_type', 'commitment'
      );

      v_edges := v_edges || jsonb_build_object(
        'source', p_entity_id,
        'target', v_entity.id,
        'relationship_type', 'has_commitment',
        'depth', 1
      );
    END IF;
  END LOOP;

  -- Build result
  v_result := jsonb_build_object(
    'source_entity_id', p_entity_id,
    'source_entity_type', v_source_type,
    'computed_at', now(),
    'max_depth_searched', p_max_depth,
    'actual_depth', v_depth,
    'total_nodes', jsonb_array_length(v_nodes),
    'total_edges', jsonb_array_length(v_edges),
    'nodes', v_nodes,
    'edges', v_edges,
    'stats', jsonb_build_object(
      'direct_dependencies', (SELECT count(*) FROM jsonb_array_elements(v_nodes) n WHERE n->>'dependency_type' = 'direct'),
      'transitive_dependencies', (SELECT count(*) FROM jsonb_array_elements(v_nodes) n WHERE n->>'dependency_type' = 'transitive'),
      'commitment_dependencies', (SELECT count(*) FROM jsonb_array_elements(v_nodes) n WHERE n->>'dependency_type' = 'commitment'),
      'by_type', (
        SELECT jsonb_object_agg(type, cnt)
        FROM (
          SELECT n->>'type' as type, count(*) as cnt
          FROM jsonb_array_elements(v_nodes) n
          GROUP BY n->>'type'
        ) sub
      )
    )
  );

  RETURN v_result;
END;
$$;

-- ============================================================================
-- FUNCTIONS: Calculate Impact Assessment
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_impact_assessment(
  p_entity_id UUID,
  p_change_type TEXT,
  p_changed_fields JSONB DEFAULT '[]',
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assessment_id UUID;
  v_dependencies JSONB;
  v_node JSONB;
  v_overall_severity impact_severity := 'none';
  v_severity_scores INT := 0;
  v_total_affected INT := 0;
  v_entity RECORD;
  v_impact_category impact_category;
  v_node_severity impact_severity;
  v_depth INT;
BEGIN
  -- Get entity info
  SELECT * INTO v_entity FROM dossiers WHERE id = p_entity_id;

  IF v_entity IS NULL THEN
    RAISE EXCEPTION 'Entity not found: %', p_entity_id;
  END IF;

  -- Compute dependencies
  v_dependencies := compute_entity_dependencies(p_entity_id, 3, true);

  -- Create assessment record
  INSERT INTO impact_assessments (
    source_entity_id,
    source_entity_type,
    change_type,
    change_description_en,
    change_description_ar,
    changed_fields,
    created_by
  ) VALUES (
    p_entity_id,
    v_entity.type,
    p_change_type,
    format('%s: %s - %s', initcap(p_change_type), v_entity.type, v_entity.name_en),
    format('%s: %s - %s', initcap(p_change_type), v_entity.type, COALESCE(v_entity.name_ar, v_entity.name_en)),
    p_changed_fields,
    p_user_id
  )
  RETURNING id INTO v_assessment_id;

  -- Process each dependency node
  FOR v_node IN SELECT * FROM jsonb_array_elements(v_dependencies->'nodes')
  LOOP
    -- Skip source entity
    IF (v_node->>'is_source')::boolean = true THEN
      CONTINUE;
    END IF;

    v_total_affected := v_total_affected + 1;
    v_depth := (v_node->>'depth')::int;

    -- Determine impact category based on entity type
    v_impact_category := CASE v_node->>'type'
      WHEN 'person' THEN 'stakeholder'
      WHEN 'working_group' THEN 'working_group'
      WHEN 'commitment' THEN 'commitment'
      WHEN 'country' THEN 'relationship'
      WHEN 'organization' THEN 'relationship'
      WHEN 'forum' THEN 'policy'
      ELSE 'operational'
    END;

    -- Calculate severity based on depth and change type
    v_node_severity := CASE
      WHEN p_change_type = 'delete' AND v_depth = 1 THEN 'critical'
      WHEN p_change_type = 'delete' AND v_depth = 2 THEN 'high'
      WHEN p_change_type = 'delete' THEN 'medium'
      WHEN p_change_type IN ('relationship_remove', 'status_change') AND v_depth = 1 THEN 'high'
      WHEN p_change_type IN ('relationship_remove', 'status_change') THEN 'medium'
      WHEN p_change_type = 'archive' AND v_depth = 1 THEN 'medium'
      WHEN p_change_type = 'update' AND v_depth = 1 THEN 'low'
      ELSE 'none'
    END;

    -- Track severity for overall calculation
    v_severity_scores := v_severity_scores + CASE v_node_severity
      WHEN 'critical' THEN 4
      WHEN 'high' THEN 3
      WHEN 'medium' THEN 2
      WHEN 'low' THEN 1
      ELSE 0
    END;

    -- Insert affected entity record
    INSERT INTO impact_affected_entities (
      impact_assessment_id,
      affected_entity_id,
      affected_entity_type,
      affected_entity_name_en,
      affected_entity_name_ar,
      dependency_type,
      dependency_path,
      depth,
      impact_category,
      impact_severity,
      impact_description_en,
      impact_description_ar,
      action_required,
      suggested_action_en,
      suggested_action_ar
    ) VALUES (
      v_assessment_id,
      (v_node->>'id')::uuid,
      v_node->>'type',
      v_node->>'name_en',
      COALESCE(v_node->>'name_ar', v_node->>'name_en'),
      (v_node->>'dependency_type')::dependency_type,
      '[]'::jsonb,
      v_depth,
      v_impact_category,
      v_node_severity,
      format('This %s may be affected by changes to %s', v_node->>'type', v_entity.name_en),
      format('قد يتأثر %s هذا بالتغييرات على %s', v_node->>'type', COALESCE(v_entity.name_ar, v_entity.name_en)),
      v_node_severity IN ('critical', 'high'),
      CASE WHEN v_node_severity IN ('critical', 'high')
        THEN format('Review and update %s after the change', v_node->>'type')
        ELSE NULL
      END,
      CASE WHEN v_node_severity IN ('critical', 'high')
        THEN format('مراجعة وتحديث %s بعد التغيير', v_node->>'type')
        ELSE NULL
      END
    );
  END LOOP;

  -- Calculate overall severity
  IF v_total_affected > 0 THEN
    v_overall_severity := CASE
      WHEN v_severity_scores / v_total_affected >= 3 THEN 'critical'
      WHEN v_severity_scores / v_total_affected >= 2 THEN 'high'
      WHEN v_severity_scores / v_total_affected >= 1 THEN 'medium'
      WHEN v_severity_scores > 0 THEN 'low'
      ELSE 'none'
    END;
  END IF;

  -- Update assessment with totals
  UPDATE impact_assessments SET
    overall_severity = v_overall_severity,
    total_affected_entities = v_total_affected,
    assessment_summary_en = format(
      'This change affects %s entities. Overall impact severity: %s.',
      v_total_affected,
      v_overall_severity
    ),
    assessment_summary_ar = format(
      'يؤثر هذا التغيير على %s كيانات. مستوى التأثير الإجمالي: %s.',
      v_total_affected,
      v_overall_severity
    ),
    impacts = v_dependencies,
    recommendations_en = CASE
      WHEN v_overall_severity IN ('critical', 'high') THEN
        ARRAY[
          'Review all affected stakeholders before proceeding',
          'Consider notifying affected parties',
          'Document the change rationale'
        ]
      WHEN v_overall_severity = 'medium' THEN
        ARRAY[
          'Review key dependencies',
          'Update related documentation'
        ]
      ELSE
        ARRAY['No immediate action required']
    END,
    recommendations_ar = CASE
      WHEN v_overall_severity IN ('critical', 'high') THEN
        ARRAY[
          'مراجعة جميع أصحاب المصلحة المتأثرين قبل المتابعة',
          'النظر في إخطار الأطراف المتأثرة',
          'توثيق سبب التغيير'
        ]
      WHEN v_overall_severity = 'medium' THEN
        ARRAY[
          'مراجعة التبعيات الرئيسية',
          'تحديث الوثائق ذات الصلة'
        ]
      ELSE
        ARRAY['لا يلزم اتخاذ إجراء فوري']
    END
  WHERE id = v_assessment_id;

  RETURN v_assessment_id;
END;
$$;

-- ============================================================================
-- FUNCTION: Get Impact Summary for Entity
-- ============================================================================

CREATE OR REPLACE FUNCTION get_entity_impact_summary(p_entity_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'entity_id', p_entity_id,
    'total_dependencies', (
      SELECT jsonb_array_length(
        compute_entity_dependencies(p_entity_id, 2, true)->'nodes'
      ) - 1
    ),
    'recent_assessments', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', ia.id,
        'change_type', ia.change_type,
        'overall_severity', ia.overall_severity,
        'total_affected', ia.total_affected_entities,
        'assessed_at', ia.assessed_at,
        'status', ia.status
      ) ORDER BY ia.assessed_at DESC), '[]'::jsonb)
      FROM impact_assessments ia
      WHERE ia.source_entity_id = p_entity_id
      LIMIT 5
    ),
    'pending_reviews', (
      SELECT count(*)
      FROM impact_assessments ia
      WHERE ia.source_entity_id = p_entity_id
        AND ia.status = 'pending'
    ),
    'critical_impacts', (
      SELECT count(*)
      FROM impact_assessments ia
      WHERE ia.source_entity_id = p_entity_id
        AND ia.overall_severity IN ('critical', 'high')
        AND ia.status NOT IN ('acknowledged', 'actioned')
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- SEED DEFAULT DEPENDENCY RULES
-- ============================================================================

INSERT INTO dependency_rules (
  name_en, name_ar,
  source_entity_types, target_entity_types, relationship_types,
  dependency_type, base_severity, impact_categories, priority
) VALUES
  (
    'Direct Relationship Impact',
    'تأثير العلاقة المباشرة',
    ARRAY['country', 'organization', 'forum', 'person'],
    ARRAY['country', 'organization', 'forum', 'person'],
    ARRAY['bilateral_relation', 'partnership', 'member_of', 'cooperates_with'],
    'direct',
    'high',
    ARRAY['relationship', 'stakeholder']::impact_category[],
    100
  ),
  (
    'Working Group Membership Impact',
    'تأثير عضوية مجموعة العمل',
    ARRAY['working_group'],
    ARRAY['person', 'organization'],
    ARRAY['member_of', 'participates_in'],
    'working_group',
    'medium',
    ARRAY['working_group', 'stakeholder']::impact_category[],
    90
  ),
  (
    'Commitment Chain Impact',
    'تأثير سلسلة الالتزامات',
    ARRAY['country', 'organization', 'forum'],
    ARRAY['commitment'],
    ARRAY['involves', 'related_to'],
    'commitment',
    'high',
    ARRAY['commitment', 'operational']::impact_category[],
    95
  ),
  (
    'Event Participation Impact',
    'تأثير المشاركة في الفعاليات',
    ARRAY['forum', 'engagement'],
    ARRAY['person', 'organization', 'country'],
    ARRAY['participates_in', 'hosted_by', 'sponsored_by'],
    'event',
    'medium',
    ARRAY['event', 'stakeholder']::impact_category[],
    80
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE entity_dependency_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_affected_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependency_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_notifications ENABLE ROW LEVEL SECURITY;

-- Dependency snapshots - viewable by authenticated users
CREATE POLICY "snapshots_select" ON entity_dependency_snapshots
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "snapshots_insert" ON entity_dependency_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Impact assessments - viewable by authenticated, editable by creator/admin
CREATE POLICY "assessments_select" ON impact_assessments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "assessments_insert" ON impact_assessments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "assessments_update" ON impact_assessments
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = created_by
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Affected entities - viewable by authenticated
CREATE POLICY "affected_select" ON impact_affected_entities
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "affected_insert" ON impact_affected_entities
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Dependency rules - viewable by all, editable by admin
CREATE POLICY "rules_select" ON dependency_rules
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "rules_modify" ON dependency_rules
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Notifications - users see their own
CREATE POLICY "notifications_select" ON impact_notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update" ON impact_notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT ON entity_dependency_snapshots TO authenticated;
GRANT SELECT, INSERT, UPDATE ON impact_assessments TO authenticated;
GRANT SELECT, INSERT ON impact_affected_entities TO authenticated;
GRANT SELECT ON dependency_rules TO authenticated;
GRANT ALL ON dependency_rules TO service_role;
GRANT SELECT, UPDATE ON impact_notifications TO authenticated;

GRANT EXECUTE ON FUNCTION compute_entity_dependencies TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_impact_assessment TO authenticated;
GRANT EXECUTE ON FUNCTION get_entity_impact_summary TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION compute_entity_dependencies IS 'Computes dependency graph for an entity using BFS traversal';
COMMENT ON FUNCTION calculate_impact_assessment IS 'Creates an impact assessment for an entity change';
COMMENT ON FUNCTION get_entity_impact_summary IS 'Returns summary of impacts for an entity';
