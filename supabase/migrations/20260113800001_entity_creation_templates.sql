-- ============================================================================
-- Feature: Entity Creation Templates
-- Description: Pre-fill entity creation forms with common fields and relationships
-- Supports: Context-aware suggestions, keyboard-driven quick entry for power users
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Template target entity types
CREATE TYPE template_entity_type AS ENUM (
  'dossier',
  'engagement',
  'commitment',
  'task',
  'intake',
  'position',
  'contact',
  'calendar_event'
);

-- Template status
CREATE TYPE template_status AS ENUM (
  'draft',
  'published',
  'archived'
);

-- Template scope (who can use it)
CREATE TYPE template_scope AS ENUM (
  'system',    -- Built-in templates available to everyone
  'team',      -- Shared within a team/unit
  'personal'   -- User's private templates
);

-- ============================================================================
-- MAIN TABLES
-- ============================================================================

-- Entity Creation Templates
CREATE TABLE entity_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Template identification
  name_en VARCHAR(200) NOT NULL,
  name_ar VARCHAR(200) NOT NULL,
  description_en TEXT,
  description_ar TEXT,

  -- Classification
  entity_type template_entity_type NOT NULL,
  scope template_scope NOT NULL DEFAULT 'personal',
  status template_status NOT NULL DEFAULT 'draft',

  -- Visual
  icon VARCHAR(50) DEFAULT 'FileText',
  color VARCHAR(50) DEFAULT 'blue',

  -- The default values to pre-fill (JSONB for flexibility)
  default_values JSONB NOT NULL DEFAULT '{}',

  -- Suggested relationships to auto-link
  suggested_relationships JSONB DEFAULT '[]',

  -- Context conditions: when to suggest this template
  -- e.g., {"dossier_type": "country", "route_contains": "/engagements"}
  context_conditions JSONB DEFAULT '{}',

  -- Keyboard shortcut (for power users)
  keyboard_shortcut VARCHAR(20),

  -- Usage statistics
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Ownership & metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  team_id UUID, -- For team-scoped templates
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Template tags for categorization and filtering
CREATE TABLE entity_template_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES entity_templates(id) ON DELETE CASCADE,
  tag VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(template_id, tag)
);

-- Recent templates per user (for quick access)
CREATE TABLE user_recent_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES entity_templates(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  use_count INTEGER NOT NULL DEFAULT 1,

  UNIQUE(user_id, template_id)
);

-- Favorite templates per user
CREATE TABLE user_favorite_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES entity_templates(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, template_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Entity templates
CREATE INDEX idx_entity_templates_entity_type ON entity_templates(entity_type);
CREATE INDEX idx_entity_templates_scope ON entity_templates(scope);
CREATE INDEX idx_entity_templates_status ON entity_templates(status);
CREATE INDEX idx_entity_templates_created_by ON entity_templates(created_by);
CREATE INDEX idx_entity_templates_keyboard_shortcut ON entity_templates(keyboard_shortcut) WHERE keyboard_shortcut IS NOT NULL;
CREATE INDEX idx_entity_templates_usage ON entity_templates(usage_count DESC);

-- Tags
CREATE INDEX idx_entity_template_tags_tag ON entity_template_tags(tag);

-- User recent templates
CREATE INDEX idx_user_recent_templates_user ON user_recent_templates(user_id);
CREATE INDEX idx_user_recent_templates_recent ON user_recent_templates(user_id, used_at DESC);

-- User favorite templates
CREATE INDEX idx_user_favorite_templates_user ON user_favorite_templates(user_id, sort_order);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_entity_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_entity_templates_updated
  BEFORE UPDATE ON entity_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_entity_template_timestamp();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE entity_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_template_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorite_templates ENABLE ROW LEVEL SECURITY;

-- Templates: Read access based on scope
CREATE POLICY entity_templates_select ON entity_templates
  FOR SELECT
  USING (
    status = 'published' AND (
      scope = 'system' OR
      (scope = 'personal' AND created_by = auth.uid()) OR
      (scope = 'team' AND team_id IN (
        SELECT team_id FROM user_team_memberships WHERE user_id = auth.uid()
      ))
    )
  );

-- Templates: Users can view their own drafts
CREATE POLICY entity_templates_select_drafts ON entity_templates
  FOR SELECT
  USING (created_by = auth.uid());

-- Templates: Users can create their own templates
CREATE POLICY entity_templates_insert ON entity_templates
  FOR INSERT
  WITH CHECK (created_by = auth.uid() AND scope IN ('personal', 'team'));

-- Templates: Users can update their own templates
CREATE POLICY entity_templates_update ON entity_templates
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Templates: Users can delete their own templates
CREATE POLICY entity_templates_delete ON entity_templates
  FOR DELETE
  USING (created_by = auth.uid() AND scope != 'system');

-- Tags: Follow template access
CREATE POLICY entity_template_tags_select ON entity_template_tags
  FOR SELECT
  USING (
    template_id IN (SELECT id FROM entity_templates)
  );

CREATE POLICY entity_template_tags_insert ON entity_template_tags
  FOR INSERT
  WITH CHECK (
    template_id IN (SELECT id FROM entity_templates WHERE created_by = auth.uid())
  );

CREATE POLICY entity_template_tags_delete ON entity_template_tags
  FOR DELETE
  USING (
    template_id IN (SELECT id FROM entity_templates WHERE created_by = auth.uid())
  );

-- User recent templates: Users manage their own
CREATE POLICY user_recent_templates_all ON user_recent_templates
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- User favorite templates: Users manage their own
CREATE POLICY user_favorite_templates_all ON user_favorite_templates
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- Get templates for an entity type with context-aware filtering
CREATE OR REPLACE FUNCTION get_entity_templates(
  p_entity_type template_entity_type,
  p_context JSONB DEFAULT '{}',
  p_include_recent BOOLEAN DEFAULT TRUE,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name_en VARCHAR(200),
  name_ar VARCHAR(200),
  description_en TEXT,
  description_ar TEXT,
  entity_type template_entity_type,
  scope template_scope,
  icon VARCHAR(50),
  color VARCHAR(50),
  default_values JSONB,
  suggested_relationships JSONB,
  keyboard_shortcut VARCHAR(20),
  usage_count INTEGER,
  is_favorite BOOLEAN,
  is_recent BOOLEAN,
  last_used_at TIMESTAMPTZ,
  tags TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    et.id,
    et.name_en,
    et.name_ar,
    et.description_en,
    et.description_ar,
    et.entity_type,
    et.scope,
    et.icon,
    et.color,
    et.default_values,
    et.suggested_relationships,
    et.keyboard_shortcut,
    et.usage_count,
    (uf.id IS NOT NULL) AS is_favorite,
    (ur.id IS NOT NULL) AS is_recent,
    ur.used_at AS last_used_at,
    COALESCE(
      (SELECT array_agg(tag) FROM entity_template_tags WHERE template_id = et.id),
      ARRAY[]::TEXT[]
    ) AS tags
  FROM entity_templates et
  LEFT JOIN user_favorite_templates uf ON uf.template_id = et.id AND uf.user_id = auth.uid()
  LEFT JOIN user_recent_templates ur ON ur.template_id = et.id AND ur.user_id = auth.uid()
  WHERE et.entity_type = p_entity_type
    AND et.status = 'published'
    AND (
      et.scope = 'system' OR
      (et.scope = 'personal' AND et.created_by = auth.uid()) OR
      (et.scope = 'team' AND et.team_id IN (
        SELECT team_id FROM user_team_memberships WHERE user_id = auth.uid()
      ))
    )
    -- Context matching (simple JSON containment for now)
    AND (
      p_context = '{}' OR
      et.context_conditions @> p_context OR
      et.context_conditions = '{}'
    )
  ORDER BY
    -- Favorites first
    (uf.id IS NOT NULL) DESC,
    -- Then recently used (if enabled)
    CASE WHEN p_include_recent THEN ur.used_at END DESC NULLS LAST,
    -- Then by usage count
    et.usage_count DESC,
    -- Then by name
    et.name_en ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Track template usage
CREATE OR REPLACE FUNCTION track_template_usage(p_template_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update template usage count
  UPDATE entity_templates
  SET usage_count = usage_count + 1, last_used_at = NOW()
  WHERE id = p_template_id;

  -- Upsert into user_recent_templates
  INSERT INTO user_recent_templates (user_id, template_id, used_at, use_count)
  VALUES (auth.uid(), p_template_id, NOW(), 1)
  ON CONFLICT (user_id, template_id)
  DO UPDATE SET
    used_at = NOW(),
    use_count = user_recent_templates.use_count + 1;

  -- Keep only last 20 recent templates per user
  DELETE FROM user_recent_templates
  WHERE user_id = auth.uid()
    AND id NOT IN (
      SELECT id FROM user_recent_templates
      WHERE user_id = auth.uid()
      ORDER BY used_at DESC
      LIMIT 20
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle favorite template
CREATE OR REPLACE FUNCTION toggle_favorite_template(p_template_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_favorite BOOLEAN;
BEGIN
  -- Check if already favorited
  SELECT EXISTS(
    SELECT 1 FROM user_favorite_templates
    WHERE user_id = auth.uid() AND template_id = p_template_id
  ) INTO v_is_favorite;

  IF v_is_favorite THEN
    -- Remove from favorites
    DELETE FROM user_favorite_templates
    WHERE user_id = auth.uid() AND template_id = p_template_id;
    RETURN FALSE;
  ELSE
    -- Add to favorites
    INSERT INTO user_favorite_templates (user_id, template_id, sort_order)
    VALUES (auth.uid(), p_template_id, (
      SELECT COALESCE(MAX(sort_order), 0) + 1
      FROM user_favorite_templates
      WHERE user_id = auth.uid()
    ));
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEED DATA: System Templates
-- ============================================================================

-- Engagement Templates
INSERT INTO entity_templates (name_en, name_ar, description_en, description_ar, entity_type, scope, status, icon, color, default_values, context_conditions, keyboard_shortcut)
VALUES
(
  'Bilateral Meeting',
  'اجتماع ثنائي',
  'Standard bilateral meeting with key counterparts',
  'اجتماع ثنائي قياسي مع الأطراف الرئيسية',
  'engagement',
  'system',
  'published',
  'Users',
  'blue',
  '{
    "type": "meeting",
    "category": "bilateral",
    "sensitivity_level": "medium"
  }',
  '{"dossier_type": "country"}',
  'Alt+B'
),
(
  'Conference Participation',
  'المشاركة في مؤتمر',
  'International conference or forum participation',
  'المشاركة في مؤتمر أو منتدى دولي',
  'engagement',
  'system',
  'published',
  'Globe',
  'purple',
  '{
    "type": "conference",
    "category": "multilateral",
    "sensitivity_level": "low"
  }',
  '{"dossier_type": "forum"}',
  'Alt+C'
),
(
  'Official Visit',
  'زيارة رسمية',
  'Diplomatic visit with protocol requirements',
  'زيارة دبلوماسية مع متطلبات البروتوكول',
  'engagement',
  'system',
  'published',
  'Plane',
  'amber',
  '{
    "type": "visit",
    "category": "diplomatic",
    "sensitivity_level": "high"
  }',
  '{}',
  'Alt+V'
);

-- Commitment Templates
INSERT INTO entity_templates (name_en, name_ar, description_en, description_ar, entity_type, scope, status, icon, color, default_values, context_conditions, keyboard_shortcut)
VALUES
(
  'Follow-up Deliverable',
  'متابعة التسليم',
  'Standard deliverable commitment from engagement',
  'التزام تسليم قياسي من المشاركة',
  'commitment',
  'system',
  'published',
  'CheckCircle',
  'green',
  '{
    "owner_type": "internal",
    "tracking_mode": "manual",
    "proof_required": true,
    "priority": "medium"
  }',
  '{"route_contains": "/after-action"}',
  'Alt+D'
),
(
  'External Party Follow-up',
  'متابعة الطرف الخارجي',
  'Track external party delivery promise',
  'تتبع وعد تسليم الطرف الخارجي',
  'commitment',
  'system',
  'published',
  'UserCheck',
  'orange',
  '{
    "owner_type": "external",
    "tracking_mode": "manual",
    "proof_required": false,
    "priority": "medium"
  }',
  '{}',
  'Alt+E'
),
(
  'Urgent Action Item',
  'بند عمل عاجل',
  'Time-sensitive action requiring immediate attention',
  'إجراء حساس للوقت يتطلب اهتماماً فورياً',
  'commitment',
  'system',
  'published',
  'AlertTriangle',
  'red',
  '{
    "owner_type": "internal",
    "tracking_mode": "manual",
    "proof_required": true,
    "priority": "urgent"
  }',
  '{}',
  'Alt+U'
);

-- Task Templates
INSERT INTO entity_templates (name_en, name_ar, description_en, description_ar, entity_type, scope, status, icon, color, default_values, context_conditions, keyboard_shortcut)
VALUES
(
  'Research Task',
  'مهمة بحث',
  'Background research and analysis task',
  'مهمة البحث والتحليل في الخلفية',
  'task',
  'system',
  'published',
  'Search',
  'indigo',
  '{
    "type": "research",
    "priority": "medium"
  }',
  '{"dossier_type": "theme"}',
  'Alt+R'
),
(
  'Document Review',
  'مراجعة المستند',
  'Review and provide feedback on document',
  'مراجعة وتقديم ملاحظات على المستند',
  'task',
  'system',
  'published',
  'FileSearch',
  'cyan',
  '{
    "type": "review",
    "priority": "medium"
  }',
  '{}',
  'Alt+W'
),
(
  'Briefing Preparation',
  'إعداد الإحاطة',
  'Prepare briefing materials for leadership',
  'إعداد مواد الإحاطة للقيادة',
  'task',
  'system',
  'published',
  'FileText',
  'violet',
  '{
    "type": "briefing",
    "priority": "high"
  }',
  '{}',
  'Alt+P'
);

-- Dossier Templates
INSERT INTO entity_templates (name_en, name_ar, description_en, description_ar, entity_type, scope, status, icon, color, default_values, context_conditions, keyboard_shortcut)
VALUES
(
  'Country Dossier',
  'ملف الدولة',
  'Comprehensive country profile dossier',
  'ملف شامل لملف الدولة',
  'dossier',
  'system',
  'published',
  'Flag',
  'blue',
  '{
    "type": "country",
    "sensitivity_level": "medium",
    "tags": ["bilateral", "diplomatic"]
  }',
  '{}',
  'Alt+1'
),
(
  'Organization Dossier',
  'ملف المنظمة',
  'International organization profile dossier',
  'ملف منظمة دولية',
  'dossier',
  'system',
  'published',
  'Building',
  'purple',
  '{
    "type": "organization",
    "sensitivity_level": "low",
    "tags": ["multilateral", "institutional"]
  }',
  '{}',
  'Alt+2'
),
(
  'Forum Dossier',
  'ملف المنتدى',
  'Multilateral forum tracking dossier',
  'ملف تتبع المنتدى متعدد الأطراف',
  'dossier',
  'system',
  'published',
  'Users',
  'amber',
  '{
    "type": "forum",
    "sensitivity_level": "low",
    "tags": ["multilateral", "conference"]
  }',
  '{}',
  'Alt+3'
),
(
  'Theme Dossier',
  'ملف الموضوع',
  'Thematic policy area dossier',
  'ملف منطقة السياسة الموضوعية',
  'dossier',
  'system',
  'published',
  'Lightbulb',
  'green',
  '{
    "type": "theme",
    "sensitivity_level": "medium",
    "tags": ["policy", "thematic"]
  }',
  '{}',
  'Alt+4'
);

-- Add tags for the system templates
INSERT INTO entity_template_tags (template_id, tag)
SELECT et.id, unnest(ARRAY['meeting', 'bilateral', 'diplomatic'])
FROM entity_templates et WHERE et.name_en = 'Bilateral Meeting';

INSERT INTO entity_template_tags (template_id, tag)
SELECT et.id, unnest(ARRAY['conference', 'multilateral', 'international'])
FROM entity_templates et WHERE et.name_en = 'Conference Participation';

INSERT INTO entity_template_tags (template_id, tag)
SELECT et.id, unnest(ARRAY['visit', 'diplomatic', 'protocol'])
FROM entity_templates et WHERE et.name_en = 'Official Visit';

INSERT INTO entity_template_tags (template_id, tag)
SELECT et.id, unnest(ARRAY['deliverable', 'follow-up', 'internal'])
FROM entity_templates et WHERE et.name_en = 'Follow-up Deliverable';

INSERT INTO entity_template_tags (template_id, tag)
SELECT et.id, unnest(ARRAY['external', 'follow-up', 'tracking'])
FROM entity_templates et WHERE et.name_en = 'External Party Follow-up';

INSERT INTO entity_template_tags (template_id, tag)
SELECT et.id, unnest(ARRAY['urgent', 'action', 'priority'])
FROM entity_templates et WHERE et.name_en = 'Urgent Action Item';

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_entity_templates TO authenticated;
GRANT EXECUTE ON FUNCTION track_template_usage TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_favorite_template TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE entity_templates IS 'Pre-configured templates for quick entity creation with default values';
COMMENT ON TABLE entity_template_tags IS 'Tags for categorizing and filtering entity templates';
COMMENT ON TABLE user_recent_templates IS 'Tracks recently used templates per user for quick access';
COMMENT ON TABLE user_favorite_templates IS 'User favorited templates for quick access';
COMMENT ON FUNCTION get_entity_templates IS 'Retrieves templates for an entity type with context-aware filtering';
COMMENT ON FUNCTION track_template_usage IS 'Records template usage for analytics and recent list';
COMMENT ON FUNCTION toggle_favorite_template IS 'Adds or removes a template from user favorites';
