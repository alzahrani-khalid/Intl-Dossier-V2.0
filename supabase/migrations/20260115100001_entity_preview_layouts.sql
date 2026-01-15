-- ============================================================================
-- Feature: Entity Preview Card Layout Configuration
-- Description: Allow administrators to define custom preview card layouts for
--              each entity type, controlling which fields, relationships, and
--              metadata appear in hover previews, search results, and embedded
--              references.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Entity types that can have custom preview layouts
CREATE TYPE preview_entity_type AS ENUM (
  'dossier',
  'organization',
  'country',
  'forum',
  'position',
  'mou',
  'engagement',
  'commitment',
  'assignment',
  'intelligence_signal',
  'working_group',
  'topic'
);

-- Preview contexts where layouts apply
CREATE TYPE preview_context AS ENUM (
  'hover',           -- Quick hover preview
  'search_result',   -- Search results list
  'embedded',        -- Embedded in another view
  'compact',         -- Minimal compact view
  'expanded'         -- Expanded detail view
);

-- Field types for preview cards
CREATE TYPE preview_field_type AS ENUM (
  'text',            -- Plain text field
  'date',            -- Date/datetime field
  'status',          -- Status badge
  'badge',           -- Generic badge
  'tags',            -- Tags list
  'avatar',          -- Photo/avatar
  'relationship',    -- Related entity reference
  'activity',        -- Recent activity
  'metric',          -- Numeric metric
  'priority',        -- Priority indicator
  'custom'           -- Custom rendered field
);

-- ============================================================================
-- MAIN TABLES
-- ============================================================================

-- Entity Preview Layouts - defines layout configuration per entity type
CREATE TABLE entity_preview_layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Target entity type
  entity_type preview_entity_type NOT NULL,

  -- Context where this layout applies
  context preview_context NOT NULL DEFAULT 'hover',

  -- Display name for this layout
  name_en VARCHAR(200) NOT NULL,
  name_ar VARCHAR(200) NOT NULL,

  -- Description
  description_en TEXT,
  description_ar TEXT,

  -- Is this the default layout for this entity type + context?
  is_default BOOLEAN NOT NULL DEFAULT FALSE,

  -- Layout configuration (order, visibility, etc.)
  -- Stored as JSONB for flexibility
  layout_config JSONB NOT NULL DEFAULT '{
    "showAvatar": true,
    "showStatus": true,
    "showEntityType": true,
    "showLastUpdated": true,
    "maxKeyDetails": 3,
    "maxTags": 3,
    "showRecentActivity": true,
    "showMatchScore": false
  }',

  -- Organization scope (null = system-wide default)
  organization_id UUID,

  -- Audit fields
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one default per entity type + context + organization
  UNIQUE(entity_type, context, organization_id) WHERE is_default = TRUE
);

-- Preview Layout Fields - defines which fields appear in a layout
CREATE TABLE preview_layout_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Parent layout
  layout_id UUID NOT NULL REFERENCES entity_preview_layouts(id) ON DELETE CASCADE,

  -- Field identification
  field_key VARCHAR(100) NOT NULL,  -- Internal key (e.g., 'sensitivity_level', 'deadline')
  field_type preview_field_type NOT NULL DEFAULT 'text',

  -- Display labels
  label_en VARCHAR(200) NOT NULL,
  label_ar VARCHAR(200) NOT NULL,

  -- Field source configuration
  source_config JSONB NOT NULL DEFAULT '{}',
  -- Examples:
  -- { "column": "sensitivity_level" }  -- direct column
  -- { "path": "related_org.name_en" }  -- nested relationship
  -- { "computed": "deadline_days" }    -- computed field

  -- Display configuration
  display_config JSONB NOT NULL DEFAULT '{}',
  -- Examples:
  -- { "format": "date", "relative": true }
  -- { "colorMap": { "high": "red", "medium": "yellow", "low": "green" } }
  -- { "maxLength": 50, "truncate": true }

  -- Visibility rules
  visibility_rules JSONB DEFAULT NULL,
  -- Examples:
  -- { "conditions": [{ "field": "status", "equals": "active" }] }
  -- null = always visible

  -- Position in layout
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Is this field visible by default?
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,

  -- Is this field required (cannot be hidden)?
  is_required BOOLEAN NOT NULL DEFAULT FALSE,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(layout_id, field_key)
);

-- User Preview Preferences - per-user customizations
CREATE TABLE user_preview_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Entity type
  entity_type preview_entity_type NOT NULL,

  -- Context
  context preview_context NOT NULL DEFAULT 'hover',

  -- Custom layout ID (if using a custom layout)
  custom_layout_id UUID REFERENCES entity_preview_layouts(id) ON DELETE SET NULL,

  -- Field visibility overrides
  -- { "field_key": true/false }
  field_visibility JSONB DEFAULT '{}',

  -- Field order overrides
  -- { "field_key": sort_order }
  field_order JSONB DEFAULT '{}',

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, entity_type, context)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Preview layouts
CREATE INDEX idx_entity_preview_layouts_entity_type ON entity_preview_layouts(entity_type);
CREATE INDEX idx_entity_preview_layouts_context ON entity_preview_layouts(context);
CREATE INDEX idx_entity_preview_layouts_default ON entity_preview_layouts(entity_type, context) WHERE is_default = TRUE;
CREATE INDEX idx_entity_preview_layouts_org ON entity_preview_layouts(organization_id) WHERE organization_id IS NOT NULL;

-- Layout fields
CREATE INDEX idx_preview_layout_fields_layout ON preview_layout_fields(layout_id);
CREATE INDEX idx_preview_layout_fields_order ON preview_layout_fields(layout_id, sort_order);

-- User preferences
CREATE INDEX idx_user_preview_preferences_user ON user_preview_preferences(user_id);
CREATE INDEX idx_user_preview_preferences_entity ON user_preview_preferences(user_id, entity_type);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp for layouts
CREATE OR REPLACE FUNCTION update_preview_layout_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_entity_preview_layouts_updated
  BEFORE UPDATE ON entity_preview_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_preview_layout_timestamp();

CREATE TRIGGER tr_preview_layout_fields_updated
  BEFORE UPDATE ON preview_layout_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_preview_layout_timestamp();

CREATE TRIGGER tr_user_preview_preferences_updated
  BEFORE UPDATE ON user_preview_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_preview_layout_timestamp();

-- Ensure only one default per entity type + context + organization
CREATE OR REPLACE FUNCTION enforce_single_default_layout()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    -- Unset previous default for same entity_type + context + organization
    UPDATE entity_preview_layouts
    SET is_default = FALSE, updated_at = NOW()
    WHERE entity_type = NEW.entity_type
      AND context = NEW.context
      AND (
        (organization_id IS NULL AND NEW.organization_id IS NULL) OR
        (organization_id = NEW.organization_id)
      )
      AND id != NEW.id
      AND is_default = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_enforce_single_default_layout
  BEFORE INSERT OR UPDATE ON entity_preview_layouts
  FOR EACH ROW
  EXECUTE FUNCTION enforce_single_default_layout();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE entity_preview_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE preview_layout_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preview_preferences ENABLE ROW LEVEL SECURITY;

-- Layouts: Everyone can read system defaults and their organization's layouts
CREATE POLICY preview_layouts_select ON entity_preview_layouts
  FOR SELECT
  USING (
    organization_id IS NULL OR  -- System defaults
    organization_id IN (
      SELECT (user_metadata->>'organization_id')::UUID
      FROM auth.users
      WHERE id = auth.uid()
    )
  );

-- Layouts: Only admins can create/update/delete layouts
CREATE POLICY preview_layouts_admin_all ON entity_preview_layouts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (
        user_metadata->>'role' = 'admin' OR
        raw_app_meta_data->>'role' = 'admin'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (
        user_metadata->>'role' = 'admin' OR
        raw_app_meta_data->>'role' = 'admin'
      )
    )
  );

-- Layout fields: Follow parent layout access
CREATE POLICY preview_layout_fields_select ON preview_layout_fields
  FOR SELECT
  USING (
    layout_id IN (SELECT id FROM entity_preview_layouts)
  );

CREATE POLICY preview_layout_fields_admin_all ON preview_layout_fields
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (
        user_metadata->>'role' = 'admin' OR
        raw_app_meta_data->>'role' = 'admin'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (
        user_metadata->>'role' = 'admin' OR
        raw_app_meta_data->>'role' = 'admin'
      )
    )
  );

-- User preferences: Users manage their own
CREATE POLICY user_preview_preferences_own ON user_preview_preferences
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- Get preview layout for an entity type + context
CREATE OR REPLACE FUNCTION get_preview_layout(
  p_entity_type preview_entity_type,
  p_context preview_context DEFAULT 'hover'
)
RETURNS TABLE (
  layout_id UUID,
  name_en VARCHAR(200),
  name_ar VARCHAR(200),
  layout_config JSONB,
  fields JSONB
) AS $$
DECLARE
  v_user_org_id UUID;
  v_layout_id UUID;
BEGIN
  -- Get user's organization
  SELECT (user_metadata->>'organization_id')::UUID INTO v_user_org_id
  FROM auth.users WHERE id = auth.uid();

  -- Find the appropriate layout (org default > system default)
  SELECT epl.id INTO v_layout_id
  FROM entity_preview_layouts epl
  WHERE epl.entity_type = p_entity_type
    AND epl.context = p_context
    AND epl.is_default = TRUE
    AND (
      epl.organization_id = v_user_org_id OR
      (epl.organization_id IS NULL AND NOT EXISTS (
        SELECT 1 FROM entity_preview_layouts org_layout
        WHERE org_layout.entity_type = p_entity_type
          AND org_layout.context = p_context
          AND org_layout.organization_id = v_user_org_id
          AND org_layout.is_default = TRUE
      ))
    )
  ORDER BY epl.organization_id NULLS LAST
  LIMIT 1;

  RETURN QUERY
  SELECT
    epl.id AS layout_id,
    epl.name_en,
    epl.name_ar,
    epl.layout_config,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'field_key', plf.field_key,
          'field_type', plf.field_type,
          'label_en', plf.label_en,
          'label_ar', plf.label_ar,
          'source_config', plf.source_config,
          'display_config', plf.display_config,
          'visibility_rules', plf.visibility_rules,
          'sort_order', plf.sort_order,
          'is_visible', plf.is_visible,
          'is_required', plf.is_required
        ) ORDER BY plf.sort_order
      ) FILTER (WHERE plf.id IS NOT NULL),
      '[]'::JSONB
    ) AS fields
  FROM entity_preview_layouts epl
  LEFT JOIN preview_layout_fields plf ON plf.layout_id = epl.id
  WHERE epl.id = v_layout_id
  GROUP BY epl.id, epl.name_en, epl.name_ar, epl.layout_config;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all layouts for an entity type
CREATE OR REPLACE FUNCTION get_entity_layouts(
  p_entity_type preview_entity_type
)
RETURNS TABLE (
  layout_id UUID,
  context preview_context,
  name_en VARCHAR(200),
  name_ar VARCHAR(200),
  description_en TEXT,
  description_ar TEXT,
  is_default BOOLEAN,
  layout_config JSONB,
  field_count BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    epl.id AS layout_id,
    epl.context,
    epl.name_en,
    epl.name_ar,
    epl.description_en,
    epl.description_ar,
    epl.is_default,
    epl.layout_config,
    (SELECT COUNT(*) FROM preview_layout_fields WHERE layout_id = epl.id) AS field_count,
    epl.created_at,
    epl.updated_at
  FROM entity_preview_layouts epl
  WHERE epl.entity_type = p_entity_type
  ORDER BY epl.context, epl.is_default DESC, epl.name_en;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set default layout
CREATE OR REPLACE FUNCTION set_default_layout(p_layout_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_entity_type preview_entity_type;
  v_context preview_context;
  v_org_id UUID;
BEGIN
  -- Get layout details
  SELECT entity_type, context, organization_id
  INTO v_entity_type, v_context, v_org_id
  FROM entity_preview_layouts
  WHERE id = p_layout_id;

  IF v_entity_type IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Set as default (trigger will unset previous default)
  UPDATE entity_preview_layouts
  SET is_default = TRUE, updated_at = NOW()
  WHERE id = p_layout_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEED DATA: Default Layouts for All Entity Types
-- ============================================================================

-- Dossier default layout
INSERT INTO entity_preview_layouts (entity_type, context, name_en, name_ar, is_default, layout_config)
VALUES (
  'dossier', 'hover', 'Default Dossier Preview', 'معاينة الملف الافتراضية', TRUE,
  '{"showAvatar": false, "showStatus": true, "showEntityType": true, "showLastUpdated": true, "maxKeyDetails": 3, "maxTags": 3, "showRecentActivity": true, "showMatchScore": true}'
);

INSERT INTO preview_layout_fields (layout_id, field_key, field_type, label_en, label_ar, source_config, display_config, sort_order, is_required)
SELECT id, 'type', 'badge', 'Type', 'النوع', '{"column": "type"}', '{"colorMap": {"country": "blue", "organization": "purple", "forum": "amber", "theme": "green"}}', 1, TRUE
FROM entity_preview_layouts WHERE entity_type = 'dossier' AND context = 'hover' AND is_default = TRUE;

INSERT INTO preview_layout_fields (layout_id, field_key, field_type, label_en, label_ar, source_config, display_config, sort_order)
SELECT id, 'sensitivity_level', 'badge', 'Sensitivity', 'الحساسية', '{"column": "sensitivity_level"}', '{"colorMap": {"high": "red", "medium": "yellow", "low": "green"}}', 2
FROM entity_preview_layouts WHERE entity_type = 'dossier' AND context = 'hover' AND is_default = TRUE;

INSERT INTO preview_layout_fields (layout_id, field_key, field_type, label_en, label_ar, source_config, display_config, sort_order)
SELECT id, 'tags', 'tags', 'Tags', 'الوسوم', '{"column": "tags"}', '{"maxItems": 3}', 3
FROM entity_preview_layouts WHERE entity_type = 'dossier' AND context = 'hover' AND is_default = TRUE;

-- Organization default layout
INSERT INTO entity_preview_layouts (entity_type, context, name_en, name_ar, is_default, layout_config)
VALUES (
  'organization', 'hover', 'Default Organization Preview', 'معاينة المنظمة الافتراضية', TRUE,
  '{"showAvatar": true, "showStatus": true, "showEntityType": true, "showLastUpdated": true, "maxKeyDetails": 3, "maxTags": 2, "showRecentActivity": false, "showMatchScore": true}'
);

INSERT INTO preview_layout_fields (layout_id, field_key, field_type, label_en, label_ar, source_config, display_config, sort_order, is_required)
SELECT id, 'org_type', 'badge', 'Type', 'النوع', '{"column": "org_type"}', '{}', 1, TRUE
FROM entity_preview_layouts WHERE entity_type = 'organization' AND context = 'hover' AND is_default = TRUE;

INSERT INTO preview_layout_fields (layout_id, field_key, field_type, label_en, label_ar, source_config, display_config, sort_order)
SELECT id, 'country', 'relationship', 'Country', 'الدولة', '{"path": "country.name"}', '{}', 2
FROM entity_preview_layouts WHERE entity_type = 'organization' AND context = 'hover' AND is_default = TRUE;

-- Country default layout
INSERT INTO entity_preview_layouts (entity_type, context, name_en, name_ar, is_default, layout_config)
VALUES (
  'country', 'hover', 'Default Country Preview', 'معاينة الدولة الافتراضية', TRUE,
  '{"showAvatar": true, "showStatus": true, "showEntityType": true, "showLastUpdated": false, "maxKeyDetails": 2, "maxTags": 0, "showRecentActivity": false, "showMatchScore": true}'
);

INSERT INTO preview_layout_fields (layout_id, field_key, field_type, label_en, label_ar, source_config, display_config, sort_order, is_required)
SELECT id, 'region', 'text', 'Region', 'المنطقة', '{"column": "region"}', '{}', 1, TRUE
FROM entity_preview_layouts WHERE entity_type = 'country' AND context = 'hover' AND is_default = TRUE;

INSERT INTO preview_layout_fields (layout_id, field_key, field_type, label_en, label_ar, source_config, display_config, sort_order)
SELECT id, 'iso_code', 'text', 'ISO Code', 'رمز ISO', '{"column": "iso_code"}', '{"uppercase": true}', 2
FROM entity_preview_layouts WHERE entity_type = 'country' AND context = 'hover' AND is_default = TRUE;

-- Forum default layout
INSERT INTO entity_preview_layouts (entity_type, context, name_en, name_ar, is_default, layout_config)
VALUES (
  'forum', 'hover', 'Default Forum Preview', 'معاينة المنتدى الافتراضية', TRUE,
  '{"showAvatar": false, "showStatus": true, "showEntityType": true, "showLastUpdated": true, "maxKeyDetails": 2, "maxTags": 2, "showRecentActivity": false, "showMatchScore": true}'
);

INSERT INTO preview_layout_fields (layout_id, field_key, field_type, label_en, label_ar, source_config, display_config, sort_order, is_required)
SELECT id, 'forum_type', 'badge', 'Type', 'النوع', '{"column": "forum_type"}', '{}', 1, TRUE
FROM entity_preview_layouts WHERE entity_type = 'forum' AND context = 'hover' AND is_default = TRUE;

INSERT INTO preview_layout_fields (layout_id, field_key, field_type, label_en, label_ar, source_config, display_config, sort_order)
SELECT id, 'member_count', 'metric', 'Members', 'الأعضاء', '{"column": "member_count"}', '{"suffix": " members"}', 2
FROM entity_preview_layouts WHERE entity_type = 'forum' AND context = 'hover' AND is_default = TRUE;

-- Position default layout
INSERT INTO entity_preview_layouts (entity_type, context, name_en, name_ar, is_default, layout_config)
VALUES (
  'position', 'hover', 'Default Position Preview', 'معاينة المنصب الافتراضية', TRUE,
  '{"showAvatar": true, "showStatus": true, "showEntityType": true, "showLastUpdated": false, "maxKeyDetails": 2, "maxTags": 0, "showRecentActivity": false, "showMatchScore": true}'
);

INSERT INTO preview_layout_fields (layout_id, field_key, field_type, label_en, label_ar, source_config, display_config, sort_order, is_required)
SELECT id, 'person_name', 'text', 'Person', 'الشخص', '{"path": "person.name"}', '{}', 1, TRUE
FROM entity_preview_layouts WHERE entity_type = 'position' AND context = 'hover' AND is_default = TRUE;

INSERT INTO preview_layout_fields (layout_id, field_key, field_type, label_en, label_ar, source_config, display_config, sort_order)
SELECT id, 'start_date', 'date', 'Since', 'منذ', '{"column": "start_date"}', '{"format": "relative"}', 2
FROM entity_preview_layouts WHERE entity_type = 'position' AND context = 'hover' AND is_default = TRUE;

-- MOU default layout
INSERT INTO entity_preview_layouts (entity_type, context, name_en, name_ar, is_default, layout_config)
VALUES (
  'mou', 'hover', 'Default MOU Preview', 'معاينة مذكرة التفاهم الافتراضية', TRUE,
  '{"showAvatar": false, "showStatus": true, "showEntityType": true, "showLastUpdated": true, "maxKeyDetails": 2, "maxTags": 2, "showRecentActivity": false, "showMatchScore": true}'
);

INSERT INTO preview_layout_fields (layout_id, field_key, field_type, label_en, label_ar, source_config, display_config, sort_order, is_required)
SELECT id, 'signed_date', 'date', 'Signed', 'التوقيع', '{"column": "signed_date"}', '{"format": "date"}', 1, TRUE
FROM entity_preview_layouts WHERE entity_type = 'mou' AND context = 'hover' AND is_default = TRUE;

INSERT INTO preview_layout_fields (layout_id, field_key, field_type, label_en, label_ar, source_config, display_config, sort_order)
SELECT id, 'expiry_date', 'date', 'Expires', 'انتهاء الصلاحية', '{"column": "expiry_date"}', '{"format": "date", "highlightOverdue": true}', 2
FROM entity_preview_layouts WHERE entity_type = 'mou' AND context = 'hover' AND is_default = TRUE;

-- Engagement default layout
INSERT INTO entity_preview_layouts (entity_type, context, name_en, name_ar, is_default, layout_config)
VALUES (
  'engagement', 'hover', 'Default Engagement Preview', 'معاينة المشاركة الافتراضية', TRUE,
  '{"showAvatar": false, "showStatus": true, "showEntityType": true, "showLastUpdated": false, "maxKeyDetails": 3, "maxTags": 2, "showRecentActivity": false, "showMatchScore": true}'
);

INSERT INTO preview_layout_fields (layout_id, field_key, field_type, label_en, label_ar, source_config, display_config, sort_order, is_required)
SELECT id, 'engagement_type', 'badge', 'Type', 'النوع', '{"column": "engagement_type"}', '{}', 1, TRUE
FROM entity_preview_layouts WHERE entity_type = 'engagement' AND context = 'hover' AND is_default = TRUE;

INSERT INTO preview_layout_fields (layout_id, field_key, field_type, label_en, label_ar, source_config, display_config, sort_order, is_required)
SELECT id, 'start_date', 'date', 'Date', 'التاريخ', '{"column": "start_date"}', '{"format": "date"}', 2, TRUE
FROM entity_preview_layouts WHERE entity_type = 'engagement' AND context = 'hover' AND is_default = TRUE;

INSERT INTO preview_layout_fields (layout_id, field_key, field_type, label_en, label_ar, source_config, display_config, sort_order)
SELECT id, 'location', 'text', 'Location', 'الموقع', '{"column": "location"}', '{}', 3
FROM entity_preview_layouts WHERE entity_type = 'engagement' AND context = 'hover' AND is_default = TRUE;

-- Commitment default layout
INSERT INTO entity_preview_layouts (entity_type, context, name_en, name_ar, is_default, layout_config)
VALUES (
  'commitment', 'hover', 'Default Commitment Preview', 'معاينة الالتزام الافتراضية', TRUE,
  '{"showAvatar": false, "showStatus": true, "showEntityType": true, "showLastUpdated": true, "maxKeyDetails": 2, "maxTags": 2, "showRecentActivity": false, "showMatchScore": true}'
);

INSERT INTO preview_layout_fields (layout_id, field_key, field_type, label_en, label_ar, source_config, display_config, sort_order, is_required)
SELECT id, 'deadline', 'date', 'Deadline', 'الموعد النهائي', '{"column": "deadline"}', '{"format": "relative", "highlightOverdue": true}', 1, TRUE
FROM entity_preview_layouts WHERE entity_type = 'commitment' AND context = 'hover' AND is_default = TRUE;

INSERT INTO preview_layout_fields (layout_id, field_key, field_type, label_en, label_ar, source_config, display_config, sort_order, is_required)
SELECT id, 'priority', 'priority', 'Priority', 'الأولوية', '{"column": "priority"}', '{"colorMap": {"urgent": "red", "high": "orange", "medium": "yellow", "low": "green"}}', 2, TRUE
FROM entity_preview_layouts WHERE entity_type = 'commitment' AND context = 'hover' AND is_default = TRUE;

-- Working Group default layout
INSERT INTO entity_preview_layouts (entity_type, context, name_en, name_ar, is_default, layout_config)
VALUES (
  'working_group', 'hover', 'Default Working Group Preview', 'معاينة مجموعة العمل الافتراضية', TRUE,
  '{"showAvatar": false, "showStatus": true, "showEntityType": true, "showLastUpdated": true, "maxKeyDetails": 2, "maxTags": 2, "showRecentActivity": false, "showMatchScore": true}'
);

INSERT INTO preview_layout_fields (layout_id, field_key, field_type, label_en, label_ar, source_config, display_config, sort_order)
SELECT id, 'chair_name', 'text', 'Chair', 'الرئيس', '{"path": "chair.name"}', '{}', 1
FROM entity_preview_layouts WHERE entity_type = 'working_group' AND context = 'hover' AND is_default = TRUE;

INSERT INTO preview_layout_fields (layout_id, field_key, field_type, label_en, label_ar, source_config, display_config, sort_order)
SELECT id, 'member_count', 'metric', 'Members', 'الأعضاء', '{"column": "member_count"}', '{"suffix": " members"}', 2
FROM entity_preview_layouts WHERE entity_type = 'working_group' AND context = 'hover' AND is_default = TRUE;

-- Topic default layout
INSERT INTO entity_preview_layouts (entity_type, context, name_en, name_ar, is_default, layout_config)
VALUES (
  'topic', 'hover', 'Default Topic Preview', 'معاينة الموضوع الافتراضية', TRUE,
  '{"showAvatar": false, "showStatus": true, "showEntityType": true, "showLastUpdated": true, "maxKeyDetails": 1, "maxTags": 3, "showRecentActivity": false, "showMatchScore": true}'
);

INSERT INTO preview_layout_fields (layout_id, field_key, field_type, label_en, label_ar, source_config, display_config, sort_order, is_required)
SELECT id, 'category', 'badge', 'Category', 'الفئة', '{"column": "category"}', '{}', 1, TRUE
FROM entity_preview_layouts WHERE entity_type = 'topic' AND context = 'hover' AND is_default = TRUE;

-- Assignment default layout
INSERT INTO entity_preview_layouts (entity_type, context, name_en, name_ar, is_default, layout_config)
VALUES (
  'assignment', 'hover', 'Default Assignment Preview', 'معاينة المهمة الافتراضية', TRUE,
  '{"showAvatar": true, "showStatus": true, "showEntityType": true, "showLastUpdated": true, "maxKeyDetails": 2, "maxTags": 0, "showRecentActivity": false, "showMatchScore": true}'
);

INSERT INTO preview_layout_fields (layout_id, field_key, field_type, label_en, label_ar, source_config, display_config, sort_order, is_required)
SELECT id, 'assignee', 'relationship', 'Assignee', 'المكلف', '{"path": "assignee.name"}', '{}', 1, TRUE
FROM entity_preview_layouts WHERE entity_type = 'assignment' AND context = 'hover' AND is_default = TRUE;

INSERT INTO preview_layout_fields (layout_id, field_key, field_type, label_en, label_ar, source_config, display_config, sort_order)
SELECT id, 'deadline', 'date', 'Due', 'الاستحقاق', '{"column": "deadline"}', '{"format": "relative", "highlightOverdue": true}', 2
FROM entity_preview_layouts WHERE entity_type = 'assignment' AND context = 'hover' AND is_default = TRUE;

-- Intelligence Signal default layout
INSERT INTO entity_preview_layouts (entity_type, context, name_en, name_ar, is_default, layout_config)
VALUES (
  'intelligence_signal', 'hover', 'Default Signal Preview', 'معاينة الإشارة الافتراضية', TRUE,
  '{"showAvatar": false, "showStatus": true, "showEntityType": true, "showLastUpdated": true, "maxKeyDetails": 2, "maxTags": 2, "showRecentActivity": false, "showMatchScore": true}'
);

INSERT INTO preview_layout_fields (layout_id, field_key, field_type, label_en, label_ar, source_config, display_config, sort_order, is_required)
SELECT id, 'signal_type', 'badge', 'Type', 'النوع', '{"column": "signal_type"}', '{}', 1, TRUE
FROM entity_preview_layouts WHERE entity_type = 'intelligence_signal' AND context = 'hover' AND is_default = TRUE;

INSERT INTO preview_layout_fields (layout_id, field_key, field_type, label_en, label_ar, source_config, display_config, sort_order)
SELECT id, 'classification', 'badge', 'Classification', 'التصنيف', '{"column": "classification_level"}', '{"colorMap": {"1": "green", "2": "yellow", "3": "orange", "4": "red"}}', 2
FROM entity_preview_layouts WHERE entity_type = 'intelligence_signal' AND context = 'hover' AND is_default = TRUE;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_preview_layout TO authenticated;
GRANT EXECUTE ON FUNCTION get_entity_layouts TO authenticated;
GRANT EXECUTE ON FUNCTION set_default_layout TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE entity_preview_layouts IS 'Defines preview card layout configurations for each entity type';
COMMENT ON TABLE preview_layout_fields IS 'Defines which fields appear in a preview layout and how they are displayed';
COMMENT ON TABLE user_preview_preferences IS 'User-specific customizations to preview layouts';
COMMENT ON FUNCTION get_preview_layout IS 'Gets the effective preview layout for an entity type and context';
COMMENT ON FUNCTION get_entity_layouts IS 'Lists all layouts for an entity type for admin management';
COMMENT ON FUNCTION set_default_layout IS 'Sets a layout as the default for its entity type and context';
