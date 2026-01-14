-- ============================================================================
-- Scenario Sandbox Infrastructure
-- Feature: Scenario Planning and What-If Analysis
--
-- Creates sandbox scenarios to model potential outcomes of engagement
-- strategies or policy changes without affecting production data.
-- ============================================================================

-- ============================================================================
-- Enums
-- ============================================================================

-- Scenario status
CREATE TYPE scenario_status AS ENUM (
  'draft',        -- Initial creation, being configured
  'active',       -- Actively being worked on
  'completed',    -- Scenario analysis complete
  'archived'      -- No longer active
);

-- Scenario type
CREATE TYPE scenario_type AS ENUM (
  'stakeholder_engagement',  -- What-if we engage specific stakeholders
  'policy_change',           -- What-if this policy is implemented
  'relationship_impact',     -- Model relationship changes
  'resource_allocation',     -- Forecast resource needs
  'strategic_planning'       -- General strategic scenario
);

-- Variable change type
CREATE TYPE variable_change_type AS ENUM (
  'relationship_health',     -- Change relationship health score
  'stakeholder_influence',   -- Modify influence level
  'engagement_frequency',    -- Adjust engagement rate
  'resource_level',          -- Modify resource allocation
  'policy_status',           -- Change policy/commitment status
  'custom_metric'            -- Custom user-defined metric
);

-- Impact level
CREATE TYPE impact_level AS ENUM (
  'minimal',       -- Little to no impact
  'low',           -- Minor impact
  'moderate',      -- Noticeable impact
  'high',          -- Significant impact
  'critical'       -- Major/critical impact
);

-- ============================================================================
-- Tables
-- ============================================================================

-- Main scenarios table
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  type scenario_type NOT NULL,
  status scenario_status NOT NULL DEFAULT 'draft',

  -- Scenario scope
  base_date TIMESTAMPTZ DEFAULT NOW(),
  projection_period_days INTEGER DEFAULT 90,

  -- Metadata
  tags TEXT[] DEFAULT '{}',

  -- Owner and collaboration
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scenario variables (what-if changes)
CREATE TABLE scenario_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,

  -- Variable definition
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  change_type variable_change_type NOT NULL,

  -- Target entity (polymorphic reference)
  target_entity_type TEXT NOT NULL,  -- 'dossier', 'relationship', 'commitment', etc.
  target_entity_id UUID,

  -- Value changes
  original_value JSONB,        -- Captured from production at scenario creation
  modified_value JSONB NOT NULL,

  -- Ordering
  sort_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scenario outcomes (predicted results)
CREATE TABLE scenario_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,

  -- Outcome details
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,

  -- Impact assessment
  impact_level impact_level NOT NULL DEFAULT 'moderate',
  probability_score DECIMAL(5,2) CHECK (probability_score >= 0 AND probability_score <= 100),

  -- Affected entities
  affected_entity_type TEXT,
  affected_entity_id UUID,

  -- Quantitative projections
  projected_metrics JSONB,  -- {"metric_name": value, ...}

  -- Risk/opportunity
  is_positive BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scenario comparisons (side-by-side analysis)
CREATE TABLE scenario_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Comparison metadata
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,

  -- Scenarios being compared
  scenario_ids UUID[] NOT NULL,

  -- Comparison criteria
  comparison_metrics TEXT[] DEFAULT '{}',

  -- Owner
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scenario snapshots (for versioning)
CREATE TABLE scenario_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,

  -- Snapshot metadata
  version INTEGER NOT NULL,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,

  -- Full state snapshot
  snapshot_data JSONB NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scenario collaborators
CREATE TABLE scenario_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'viewer',  -- 'owner', 'editor', 'viewer'

  -- Timestamps
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(scenario_id, user_id)
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Scenarios indexes
CREATE INDEX idx_scenarios_created_by ON scenarios(created_by);
CREATE INDEX idx_scenarios_type ON scenarios(type);
CREATE INDEX idx_scenarios_status ON scenarios(status);
CREATE INDEX idx_scenarios_created_at ON scenarios(created_at DESC);
CREATE INDEX idx_scenarios_tags ON scenarios USING GIN(tags);

-- Scenario variables indexes
CREATE INDEX idx_scenario_variables_scenario_id ON scenario_variables(scenario_id);
CREATE INDEX idx_scenario_variables_target ON scenario_variables(target_entity_type, target_entity_id);
CREATE INDEX idx_scenario_variables_change_type ON scenario_variables(change_type);

-- Scenario outcomes indexes
CREATE INDEX idx_scenario_outcomes_scenario_id ON scenario_outcomes(scenario_id);
CREATE INDEX idx_scenario_outcomes_impact ON scenario_outcomes(impact_level);
CREATE INDEX idx_scenario_outcomes_affected ON scenario_outcomes(affected_entity_type, affected_entity_id);

-- Scenario comparisons indexes
CREATE INDEX idx_scenario_comparisons_created_by ON scenario_comparisons(created_by);
CREATE INDEX idx_scenario_comparisons_scenarios ON scenario_comparisons USING GIN(scenario_ids);

-- Scenario snapshots indexes
CREATE INDEX idx_scenario_snapshots_scenario_id ON scenario_snapshots(scenario_id);
CREATE INDEX idx_scenario_snapshots_version ON scenario_snapshots(scenario_id, version DESC);

-- Scenario collaborators indexes
CREATE INDEX idx_scenario_collaborators_scenario_id ON scenario_collaborators(scenario_id);
CREATE INDEX idx_scenario_collaborators_user_id ON scenario_collaborators(user_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_collaborators ENABLE ROW LEVEL SECURITY;

-- Scenarios policies
CREATE POLICY "scenarios_select_own_or_collaborated"
  ON scenarios FOR SELECT
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM scenario_collaborators
      WHERE scenario_id = scenarios.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "scenarios_insert_authenticated"
  ON scenarios FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "scenarios_update_owner_or_editor"
  ON scenarios FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM scenario_collaborators
      WHERE scenario_id = scenarios.id
        AND user_id = auth.uid()
        AND role IN ('owner', 'editor')
    )
  );

CREATE POLICY "scenarios_delete_owner"
  ON scenarios FOR DELETE
  USING (created_by = auth.uid());

-- Scenario variables policies (inherit from scenario)
CREATE POLICY "scenario_variables_select"
  ON scenario_variables FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scenarios
      WHERE id = scenario_variables.scenario_id
        AND (
          created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM scenario_collaborators
            WHERE scenario_id = scenarios.id AND user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "scenario_variables_insert"
  ON scenario_variables FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scenarios
      WHERE id = scenario_variables.scenario_id
        AND (
          created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM scenario_collaborators
            WHERE scenario_id = scenarios.id
              AND user_id = auth.uid()
              AND role IN ('owner', 'editor')
          )
        )
    )
  );

CREATE POLICY "scenario_variables_update"
  ON scenario_variables FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM scenarios
      WHERE id = scenario_variables.scenario_id
        AND (
          created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM scenario_collaborators
            WHERE scenario_id = scenarios.id
              AND user_id = auth.uid()
              AND role IN ('owner', 'editor')
          )
        )
    )
  );

CREATE POLICY "scenario_variables_delete"
  ON scenario_variables FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM scenarios
      WHERE id = scenario_variables.scenario_id
        AND (
          created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM scenario_collaborators
            WHERE scenario_id = scenarios.id
              AND user_id = auth.uid()
              AND role IN ('owner', 'editor')
          )
        )
    )
  );

-- Similar policies for outcomes
CREATE POLICY "scenario_outcomes_select"
  ON scenario_outcomes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scenarios
      WHERE id = scenario_outcomes.scenario_id
        AND (
          created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM scenario_collaborators
            WHERE scenario_id = scenarios.id AND user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "scenario_outcomes_insert"
  ON scenario_outcomes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scenarios
      WHERE id = scenario_outcomes.scenario_id
        AND (
          created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM scenario_collaborators
            WHERE scenario_id = scenarios.id
              AND user_id = auth.uid()
              AND role IN ('owner', 'editor')
          )
        )
    )
  );

CREATE POLICY "scenario_outcomes_update"
  ON scenario_outcomes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM scenarios
      WHERE id = scenario_outcomes.scenario_id
        AND (
          created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM scenario_collaborators
            WHERE scenario_id = scenarios.id
              AND user_id = auth.uid()
              AND role IN ('owner', 'editor')
          )
        )
    )
  );

CREATE POLICY "scenario_outcomes_delete"
  ON scenario_outcomes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM scenarios
      WHERE id = scenario_outcomes.scenario_id
        AND (
          created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM scenario_collaborators
            WHERE scenario_id = scenarios.id
              AND user_id = auth.uid()
              AND role IN ('owner', 'editor')
          )
        )
    )
  );

-- Scenario comparisons policies
CREATE POLICY "scenario_comparisons_select"
  ON scenario_comparisons FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "scenario_comparisons_insert"
  ON scenario_comparisons FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "scenario_comparisons_update"
  ON scenario_comparisons FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "scenario_comparisons_delete"
  ON scenario_comparisons FOR DELETE
  USING (created_by = auth.uid());

-- Scenario snapshots policies (inherit from scenario)
CREATE POLICY "scenario_snapshots_select"
  ON scenario_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scenarios
      WHERE id = scenario_snapshots.scenario_id
        AND (
          created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM scenario_collaborators
            WHERE scenario_id = scenarios.id AND user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "scenario_snapshots_insert"
  ON scenario_snapshots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scenarios
      WHERE id = scenario_snapshots.scenario_id
        AND (
          created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM scenario_collaborators
            WHERE scenario_id = scenarios.id
              AND user_id = auth.uid()
              AND role IN ('owner', 'editor')
          )
        )
    )
  );

-- Scenario collaborators policies
CREATE POLICY "scenario_collaborators_select"
  ON scenario_collaborators FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM scenarios
      WHERE id = scenario_collaborators.scenario_id
        AND created_by = auth.uid()
    )
  );

CREATE POLICY "scenario_collaborators_insert"
  ON scenario_collaborators FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scenarios
      WHERE id = scenario_collaborators.scenario_id
        AND created_by = auth.uid()
    )
  );

CREATE POLICY "scenario_collaborators_delete"
  ON scenario_collaborators FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM scenarios
      WHERE id = scenario_collaborators.scenario_id
        AND created_by = auth.uid()
    )
  );

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to get scenario with all related data
CREATE OR REPLACE FUNCTION get_scenario_full(p_scenario_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'scenario', row_to_json(s),
    'variables', COALESCE(
      (SELECT jsonb_agg(row_to_json(v) ORDER BY v.sort_order)
       FROM scenario_variables v WHERE v.scenario_id = s.id),
      '[]'::jsonb
    ),
    'outcomes', COALESCE(
      (SELECT jsonb_agg(row_to_json(o) ORDER BY o.created_at)
       FROM scenario_outcomes o WHERE o.scenario_id = s.id),
      '[]'::jsonb
    ),
    'collaborators', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', sc.id,
        'user_id', sc.user_id,
        'role', sc.role,
        'email', u.email,
        'added_at', sc.added_at
      ))
       FROM scenario_collaborators sc
       JOIN auth.users u ON u.id = sc.user_id
       WHERE sc.scenario_id = s.id),
      '[]'::jsonb
    )
  ) INTO v_result
  FROM scenarios s
  WHERE s.id = p_scenario_id;

  RETURN v_result;
END;
$$;

-- Function to clone a scenario
CREATE OR REPLACE FUNCTION clone_scenario(
  p_scenario_id UUID,
  p_new_title_en TEXT,
  p_new_title_ar TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  -- Create new scenario
  INSERT INTO scenarios (
    title_en, title_ar, description_en, description_ar,
    type, status, base_date, projection_period_days, tags, created_by
  )
  SELECT
    p_new_title_en, p_new_title_ar, description_en, description_ar,
    type, 'draft', NOW(), projection_period_days, tags, v_user_id
  FROM scenarios
  WHERE id = p_scenario_id
  RETURNING id INTO v_new_id;

  -- Clone variables
  INSERT INTO scenario_variables (
    scenario_id, name_en, name_ar, change_type,
    target_entity_type, target_entity_id,
    original_value, modified_value, sort_order
  )
  SELECT
    v_new_id, name_en, name_ar, change_type,
    target_entity_type, target_entity_id,
    original_value, modified_value, sort_order
  FROM scenario_variables
  WHERE scenario_id = p_scenario_id;

  -- Clone outcomes
  INSERT INTO scenario_outcomes (
    scenario_id, title_en, title_ar, description_en, description_ar,
    impact_level, probability_score,
    affected_entity_type, affected_entity_id,
    projected_metrics, is_positive
  )
  SELECT
    v_new_id, title_en, title_ar, description_en, description_ar,
    impact_level, probability_score,
    affected_entity_type, affected_entity_id,
    projected_metrics, is_positive
  FROM scenario_outcomes
  WHERE scenario_id = p_scenario_id;

  RETURN v_new_id;
END;
$$;

-- Function to compare scenarios
CREATE OR REPLACE FUNCTION compare_scenarios(p_scenario_ids UUID[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'scenarios', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', s.id,
        'title_en', s.title_en,
        'title_ar', s.title_ar,
        'type', s.type,
        'status', s.status,
        'variable_count', (SELECT COUNT(*) FROM scenario_variables WHERE scenario_id = s.id),
        'outcome_count', (SELECT COUNT(*) FROM scenario_outcomes WHERE scenario_id = s.id),
        'positive_outcomes', (SELECT COUNT(*) FROM scenario_outcomes WHERE scenario_id = s.id AND is_positive = true),
        'negative_outcomes', (SELECT COUNT(*) FROM scenario_outcomes WHERE scenario_id = s.id AND is_positive = false),
        'avg_probability', (SELECT AVG(probability_score) FROM scenario_outcomes WHERE scenario_id = s.id)
      ))
      FROM scenarios s
      WHERE s.id = ANY(p_scenario_ids)
    ),
    'total_scenarios', array_length(p_scenario_ids, 1)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scenario_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_scenarios_updated_at
  BEFORE UPDATE ON scenarios
  FOR EACH ROW EXECUTE FUNCTION update_scenario_timestamp();

CREATE TRIGGER trg_scenario_variables_updated_at
  BEFORE UPDATE ON scenario_variables
  FOR EACH ROW EXECUTE FUNCTION update_scenario_timestamp();

CREATE TRIGGER trg_scenario_outcomes_updated_at
  BEFORE UPDATE ON scenario_outcomes
  FOR EACH ROW EXECUTE FUNCTION update_scenario_timestamp();

CREATE TRIGGER trg_scenario_comparisons_updated_at
  BEFORE UPDATE ON scenario_comparisons
  FOR EACH ROW EXECUTE FUNCTION update_scenario_timestamp();

-- Grant permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON scenarios TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON scenario_variables TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON scenario_outcomes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON scenario_comparisons TO authenticated;
GRANT SELECT, INSERT ON scenario_snapshots TO authenticated;
GRANT SELECT, INSERT, DELETE ON scenario_collaborators TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_scenario_full TO authenticated;
GRANT EXECUTE ON FUNCTION clone_scenario TO authenticated;
GRANT EXECUTE ON FUNCTION compare_scenarios TO authenticated;
