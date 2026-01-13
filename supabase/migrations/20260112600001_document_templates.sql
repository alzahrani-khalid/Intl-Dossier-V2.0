-- Migration: Document Templates Feature
-- Feature: document-templates
-- Description: Pre-built templates for common document types with guided wizards

-- Document template category enum
CREATE TYPE document_template_category AS ENUM (
  'country_profile',
  'policy_brief',
  'engagement_report',
  'meeting_notes',
  'position_paper',
  'mou_summary',
  'strategic_analysis',
  'custom'
);

-- Template field type enum
CREATE TYPE template_field_type AS ENUM (
  'text',
  'textarea',
  'rich_text',
  'date',
  'date_range',
  'select',
  'multiselect',
  'entity_reference',
  'file_attachment',
  'number',
  'currency',
  'percentage',
  'boolean',
  'tags',
  'url'
);

-- Document template status
CREATE TYPE document_template_status AS ENUM (
  'draft',
  'published',
  'archived'
);

-- Main document templates table
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template identification
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,

  -- Template categorization
  category document_template_category NOT NULL,
  icon TEXT DEFAULT 'file-text',
  color TEXT DEFAULT 'blue',

  -- Target entity types (which dossier types can use this template)
  target_entity_types TEXT[] NOT NULL DEFAULT '{}',

  -- Template status
  status document_template_status NOT NULL DEFAULT 'published',

  -- System template flag
  is_system_template BOOLEAN NOT NULL DEFAULT false,

  -- Version tracking
  version INTEGER NOT NULL DEFAULT 1,

  -- Output configuration
  default_classification document_classification DEFAULT 'internal',
  output_format TEXT DEFAULT 'docx' CHECK (output_format IN ('docx', 'pdf', 'html', 'markdown')),

  -- Audit fields
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Template sections (wizard steps)
CREATE TABLE document_template_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES document_templates(id) ON DELETE CASCADE,

  -- Section identification
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,

  -- Section order (wizard step number)
  section_order INTEGER NOT NULL,

  -- Optional section (can be skipped)
  is_optional BOOLEAN NOT NULL DEFAULT false,

  -- Section icon for wizard UI
  icon TEXT,

  -- Conditional display (show only if condition met)
  display_condition JSONB DEFAULT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Template fields within sections
CREATE TABLE document_template_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES document_template_sections(id) ON DELETE CASCADE,

  -- Field identification
  field_key TEXT NOT NULL,
  label_en TEXT NOT NULL,
  label_ar TEXT NOT NULL,
  placeholder_en TEXT,
  placeholder_ar TEXT,
  help_text_en TEXT,
  help_text_ar TEXT,

  -- Field configuration
  field_type template_field_type NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  field_order INTEGER NOT NULL,

  -- Validation rules (JSON schema)
  validation_rules JSONB DEFAULT NULL,

  -- Default value
  default_value JSONB DEFAULT NULL,

  -- Options for select/multiselect fields
  options JSONB DEFAULT NULL,

  -- Entity reference configuration (for entity_reference type)
  entity_reference_config JSONB DEFAULT NULL,

  -- Conditional display
  display_condition JSONB DEFAULT NULL,

  -- Width in grid (1-12 columns)
  grid_width INTEGER NOT NULL DEFAULT 12 CHECK (grid_width BETWEEN 1 AND 12),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(section_id, field_key)
);

-- Entity suggestions for templates
CREATE TABLE document_template_entity_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES document_templates(id) ON DELETE CASCADE,

  -- Suggestion configuration
  entity_type TEXT NOT NULL,
  relationship_type TEXT,
  suggestion_label_en TEXT NOT NULL,
  suggestion_label_ar TEXT NOT NULL,

  -- How to find suggestions (e.g., related entities, recent interactions)
  suggestion_query JSONB NOT NULL,

  -- Maximum number of suggestions
  max_suggestions INTEGER NOT NULL DEFAULT 5,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User-created documents from templates
CREATE TABLE templated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to template
  template_id UUID NOT NULL REFERENCES document_templates(id),

  -- Link to entity (polymorphic)
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,

  -- Document info
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,

  -- Field values (filled in by wizard)
  field_values JSONB NOT NULL DEFAULT '{}',

  -- Wizard progress tracking
  current_section_order INTEGER NOT NULL DEFAULT 1,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,

  -- Generated document reference
  generated_document_id UUID REFERENCES documents(id),
  generated_file_path TEXT,

  -- Classification (inherited from template or overridden)
  classification document_classification NOT NULL DEFAULT 'internal',

  -- Audit fields
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_document_templates_category ON document_templates(category);
CREATE INDEX idx_document_templates_status ON document_templates(status);
CREATE INDEX idx_document_templates_system ON document_templates(is_system_template);
CREATE INDEX idx_document_templates_target_types ON document_templates USING GIN(target_entity_types);

CREATE INDEX idx_template_sections_template ON document_template_sections(template_id);
CREATE INDEX idx_template_sections_order ON document_template_sections(template_id, section_order);

CREATE INDEX idx_template_fields_section ON document_template_fields(section_id);
CREATE INDEX idx_template_fields_order ON document_template_fields(section_id, field_order);

CREATE INDEX idx_template_entity_suggestions_template ON document_template_entity_suggestions(template_id);

CREATE INDEX idx_templated_documents_template ON templated_documents(template_id);
CREATE INDEX idx_templated_documents_entity ON templated_documents(entity_type, entity_id);
CREATE INDEX idx_templated_documents_user ON templated_documents(created_by);
CREATE INDEX idx_templated_documents_complete ON templated_documents(is_complete) WHERE is_complete = true;

-- Enable RLS
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_template_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_template_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_template_entity_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE templated_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_templates

-- Everyone can view published templates
CREATE POLICY document_templates_select_published ON document_templates
  FOR SELECT USING (status = 'published');

-- Users can view their own templates
CREATE POLICY document_templates_select_own ON document_templates
  FOR SELECT USING (created_by = auth.uid());

-- Users can insert their own templates (non-system)
CREATE POLICY document_templates_insert_own ON document_templates
  FOR INSERT WITH CHECK (created_by = auth.uid() AND is_system_template = false);

-- Users can update their own templates (non-system)
CREATE POLICY document_templates_update_own ON document_templates
  FOR UPDATE USING (created_by = auth.uid() AND is_system_template = false);

-- Users can delete their own templates (non-system)
CREATE POLICY document_templates_delete_own ON document_templates
  FOR DELETE USING (created_by = auth.uid() AND is_system_template = false);

-- Service role can do everything
CREATE POLICY document_templates_service ON document_templates
  FOR ALL USING (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- RLS Policies for document_template_sections

-- Everyone can view sections of published templates
CREATE POLICY template_sections_select_published ON document_template_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM document_templates dt
      WHERE dt.id = document_template_sections.template_id
      AND (dt.status = 'published' OR dt.created_by = auth.uid())
    )
  );

-- Users can manage sections of their own templates
CREATE POLICY template_sections_insert_own ON document_template_sections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM document_templates dt
      WHERE dt.id = document_template_sections.template_id
      AND dt.created_by = auth.uid()
      AND dt.is_system_template = false
    )
  );

CREATE POLICY template_sections_update_own ON document_template_sections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM document_templates dt
      WHERE dt.id = document_template_sections.template_id
      AND dt.created_by = auth.uid()
      AND dt.is_system_template = false
    )
  );

CREATE POLICY template_sections_delete_own ON document_template_sections
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM document_templates dt
      WHERE dt.id = document_template_sections.template_id
      AND dt.created_by = auth.uid()
      AND dt.is_system_template = false
    )
  );

CREATE POLICY template_sections_service ON document_template_sections
  FOR ALL USING (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- RLS Policies for document_template_fields

-- Everyone can view fields of published templates
CREATE POLICY template_fields_select_published ON document_template_fields
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM document_template_sections dts
      JOIN document_templates dt ON dt.id = dts.template_id
      WHERE dts.id = document_template_fields.section_id
      AND (dt.status = 'published' OR dt.created_by = auth.uid())
    )
  );

-- Users can manage fields of their own templates
CREATE POLICY template_fields_insert_own ON document_template_fields
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM document_template_sections dts
      JOIN document_templates dt ON dt.id = dts.template_id
      WHERE dts.id = document_template_fields.section_id
      AND dt.created_by = auth.uid()
      AND dt.is_system_template = false
    )
  );

CREATE POLICY template_fields_update_own ON document_template_fields
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM document_template_sections dts
      JOIN document_templates dt ON dt.id = dts.template_id
      WHERE dts.id = document_template_fields.section_id
      AND dt.created_by = auth.uid()
      AND dt.is_system_template = false
    )
  );

CREATE POLICY template_fields_delete_own ON document_template_fields
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM document_template_sections dts
      JOIN document_templates dt ON dt.id = dts.template_id
      WHERE dts.id = document_template_fields.section_id
      AND dt.created_by = auth.uid()
      AND dt.is_system_template = false
    )
  );

CREATE POLICY template_fields_service ON document_template_fields
  FOR ALL USING (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- RLS Policies for document_template_entity_suggestions

CREATE POLICY entity_suggestions_select ON document_template_entity_suggestions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM document_templates dt
      WHERE dt.id = document_template_entity_suggestions.template_id
      AND (dt.status = 'published' OR dt.created_by = auth.uid())
    )
  );

CREATE POLICY entity_suggestions_insert_own ON document_template_entity_suggestions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM document_templates dt
      WHERE dt.id = document_template_entity_suggestions.template_id
      AND dt.created_by = auth.uid()
      AND dt.is_system_template = false
    )
  );

CREATE POLICY entity_suggestions_update_own ON document_template_entity_suggestions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM document_templates dt
      WHERE dt.id = document_template_entity_suggestions.template_id
      AND dt.created_by = auth.uid()
      AND dt.is_system_template = false
    )
  );

CREATE POLICY entity_suggestions_delete_own ON document_template_entity_suggestions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM document_templates dt
      WHERE dt.id = document_template_entity_suggestions.template_id
      AND dt.created_by = auth.uid()
      AND dt.is_system_template = false
    )
  );

CREATE POLICY entity_suggestions_service ON document_template_entity_suggestions
  FOR ALL USING (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- RLS Policies for templated_documents

-- Users can view their own templated documents
CREATE POLICY templated_documents_select_own ON templated_documents
  FOR SELECT USING (created_by = auth.uid());

-- Users can insert their own templated documents
CREATE POLICY templated_documents_insert_own ON templated_documents
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Users can update their own templated documents
CREATE POLICY templated_documents_update_own ON templated_documents
  FOR UPDATE USING (created_by = auth.uid());

-- Users can delete their own templated documents
CREATE POLICY templated_documents_delete_own ON templated_documents
  FOR DELETE USING (created_by = auth.uid());

-- Service role can do everything
CREATE POLICY templated_documents_service ON templated_documents
  FOR ALL USING (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_document_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_templates_updated_at_trigger
  BEFORE UPDATE ON document_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_document_templates_updated_at();

CREATE TRIGGER templated_documents_updated_at_trigger
  BEFORE UPDATE ON templated_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_document_templates_updated_at();

-- Insert default system templates

-- Country Profile Template
WITH country_profile AS (
  INSERT INTO document_templates (
    name_en, name_ar, description_en, description_ar,
    category, icon, color, target_entity_types,
    status, is_system_template, default_classification, output_format
  ) VALUES (
    'Country Profile',
    'ملف تعريف الدولة',
    'Comprehensive country profile document with key facts, diplomatic relations, and economic overview',
    'وثيقة ملف تعريفي شامل للدولة تتضمن الحقائق الرئيسية والعلاقات الدبلوماسية والنظرة الاقتصادية',
    'country_profile',
    'globe',
    'blue',
    ARRAY['country'],
    'published',
    true,
    'internal',
    'docx'
  ) RETURNING id
),
-- Country Profile Sections
s1 AS (
  INSERT INTO document_template_sections (template_id, name_en, name_ar, description_en, description_ar, section_order, is_optional, icon)
  SELECT id, 'Basic Information', 'المعلومات الأساسية', 'Country identification and key facts', 'تعريف الدولة والحقائق الرئيسية', 1, false, 'info'
  FROM country_profile RETURNING id, template_id
),
s2 AS (
  INSERT INTO document_template_sections (template_id, name_en, name_ar, description_en, description_ar, section_order, is_optional, icon)
  SELECT (SELECT id FROM country_profile), 'Diplomatic Relations', 'العلاقات الدبلوماسية', 'Bilateral relations and key contacts', 'العلاقات الثنائية وجهات الاتصال الرئيسية', 2, false, 'users'
  RETURNING id, template_id
),
s3 AS (
  INSERT INTO document_template_sections (template_id, name_en, name_ar, description_en, description_ar, section_order, is_optional, icon)
  SELECT (SELECT id FROM country_profile), 'Economic Overview', 'النظرة الاقتصادية', 'Economic indicators and trade relations', 'المؤشرات الاقتصادية والعلاقات التجارية', 3, true, 'trending-up'
  RETURNING id, template_id
),
s4 AS (
  INSERT INTO document_template_sections (template_id, name_en, name_ar, description_en, description_ar, section_order, is_optional, icon)
  SELECT (SELECT id FROM country_profile), 'Statistical Cooperation', 'التعاون الإحصائي', 'Areas of statistical cooperation and MOUs', 'مجالات التعاون الإحصائي ومذكرات التفاهم', 4, true, 'bar-chart-2'
  RETURNING id, template_id
),
-- Insert fields for section 1 (Basic Information)
f1 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, placeholder_en, placeholder_ar)
  SELECT id, 'country_name', 'Country Name', 'اسم الدولة', 'text', true, 1, 6, 'Enter country name', 'أدخل اسم الدولة'
  FROM s1
),
f2 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, placeholder_en, placeholder_ar)
  SELECT id, 'capital', 'Capital City', 'العاصمة', 'text', true, 2, 6, 'Enter capital city', 'أدخل العاصمة'
  FROM s1
),
f3 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, options)
  SELECT id, 'region', 'Region', 'المنطقة', 'select', true, 3, 6,
    '{"options": [
      {"value": "africa", "label_en": "Africa", "label_ar": "أفريقيا"},
      {"value": "asia", "label_en": "Asia", "label_ar": "آسيا"},
      {"value": "europe", "label_en": "Europe", "label_ar": "أوروبا"},
      {"value": "north_america", "label_en": "North America", "label_ar": "أمريكا الشمالية"},
      {"value": "south_america", "label_en": "South America", "label_ar": "أمريكا الجنوبية"},
      {"value": "oceania", "label_en": "Oceania", "label_ar": "أوقيانوسيا"},
      {"value": "middle_east", "label_en": "Middle East", "label_ar": "الشرق الأوسط"}
    ]}'::jsonb
  FROM s1
),
f4 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, placeholder_en, placeholder_ar)
  SELECT id, 'population', 'Population', 'عدد السكان', 'number', false, 4, 6, 'Enter population', 'أدخل عدد السكان'
  FROM s1
),
f5 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, placeholder_en, placeholder_ar, help_text_en, help_text_ar)
  SELECT id, 'overview', 'Country Overview', 'نظرة عامة على الدولة', 'rich_text', true, 5, 12,
    'Write a brief overview of the country...', 'اكتب نظرة موجزة عن الدولة...',
    'Include key facts about geography, government, and culture', 'قم بتضمين حقائق رئيسية عن الجغرافيا والحكومة والثقافة'
  FROM s1
),
-- Insert fields for section 2 (Diplomatic Relations)
f6 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, placeholder_en, placeholder_ar)
  SELECT id, 'diplomatic_status', 'Diplomatic Status', 'الحالة الدبلوماسية', 'textarea', true, 1, 12,
    'Describe the current state of bilateral relations...', 'صف الحالة الراهنة للعلاقات الثنائية...'
  FROM s2
),
f7 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, entity_reference_config, help_text_en, help_text_ar)
  SELECT id, 'key_contacts', 'Key Contacts', 'جهات الاتصال الرئيسية', 'entity_reference', false, 2, 12,
    '{"entity_type": "person", "multiple": true, "max_selections": 10}'::jsonb,
    'Select key diplomatic contacts', 'اختر جهات الاتصال الدبلوماسية الرئيسية'
  FROM s2
),
f8 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, placeholder_en, placeholder_ar)
  SELECT id, 'recent_visits', 'Recent High-Level Visits', 'الزيارات الرفيعة الأخيرة', 'textarea', false, 3, 12,
    'List recent diplomatic visits and their outcomes...', 'اذكر الزيارات الدبلوماسية الأخيرة ونتائجها...'
  FROM s2
),
-- Insert fields for section 3 (Economic Overview)
f9 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, placeholder_en, placeholder_ar)
  SELECT id, 'gdp', 'GDP (USD Billions)', 'الناتج المحلي الإجمالي (مليار دولار)', 'currency', false, 1, 6,
    'Enter GDP', 'أدخل الناتج المحلي الإجمالي'
  FROM s3
),
f10 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, placeholder_en, placeholder_ar)
  SELECT id, 'gdp_growth', 'GDP Growth Rate (%)', 'معدل نمو الناتج المحلي (%)', 'percentage', false, 2, 6,
    'Enter growth rate', 'أدخل معدل النمو'
  FROM s3
),
f11 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, placeholder_en, placeholder_ar)
  SELECT id, 'trade_volume', 'Bilateral Trade Volume', 'حجم التبادل التجاري الثنائي', 'textarea', false, 3, 12,
    'Describe trade relationships and volumes...', 'صف العلاقات التجارية وأحجامها...'
  FROM s3
),
-- Insert fields for section 4 (Statistical Cooperation)
f12 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, options)
  SELECT id, 'cooperation_areas', 'Cooperation Areas', 'مجالات التعاون', 'multiselect', false, 1, 12,
    '{"options": [
      {"value": "census", "label_en": "Census & Population", "label_ar": "التعداد والسكان"},
      {"value": "economic", "label_en": "Economic Statistics", "label_ar": "الإحصاءات الاقتصادية"},
      {"value": "trade", "label_en": "Trade Statistics", "label_ar": "إحصاءات التجارة"},
      {"value": "social", "label_en": "Social Statistics", "label_ar": "الإحصاءات الاجتماعية"},
      {"value": "environmental", "label_en": "Environmental Statistics", "label_ar": "الإحصاءات البيئية"},
      {"value": "capacity_building", "label_en": "Capacity Building", "label_ar": "بناء القدرات"},
      {"value": "technology", "label_en": "Statistical Technology", "label_ar": "التقنية الإحصائية"}
    ]}'::jsonb
  FROM s4
),
f13 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, entity_reference_config, help_text_en, help_text_ar)
  SELECT id, 'active_mous', 'Active MOUs', 'مذكرات التفاهم النشطة', 'entity_reference', false, 2, 12,
    '{"entity_type": "mou", "multiple": true, "filter": {"status": "active"}}'::jsonb,
    'Select related MOUs', 'اختر مذكرات التفاهم ذات الصلة'
  FROM s4
),
f14 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, placeholder_en, placeholder_ar)
  SELECT id, 'future_opportunities', 'Future Cooperation Opportunities', 'فرص التعاون المستقبلية', 'rich_text', false, 3, 12,
    'Describe potential areas for future cooperation...', 'صف المجالات المحتملة للتعاون المستقبلي...'
  FROM s4
)
SELECT 1;

-- Policy Brief Template
WITH policy_brief AS (
  INSERT INTO document_templates (
    name_en, name_ar, description_en, description_ar,
    category, icon, color, target_entity_types,
    status, is_system_template, default_classification, output_format
  ) VALUES (
    'Policy Brief',
    'موجز السياسات',
    'Concise document summarizing a policy issue with recommendations',
    'وثيقة موجزة تلخص قضية سياسية مع التوصيات',
    'policy_brief',
    'file-text',
    'purple',
    ARRAY['country', 'organization', 'theme'],
    'published',
    true,
    'internal',
    'docx'
  ) RETURNING id
),
s1 AS (
  INSERT INTO document_template_sections (template_id, name_en, name_ar, description_en, description_ar, section_order, is_optional, icon)
  SELECT id, 'Executive Summary', 'الملخص التنفيذي', 'Brief overview and key recommendations', 'نظرة موجزة والتوصيات الرئيسية', 1, false, 'file-text'
  FROM policy_brief RETURNING id
),
s2 AS (
  INSERT INTO document_template_sections (template_id, name_en, name_ar, description_en, description_ar, section_order, is_optional, icon)
  SELECT (SELECT id FROM policy_brief), 'Issue Analysis', 'تحليل القضية', 'Detailed analysis of the policy issue', 'تحليل مفصل لقضية السياسة', 2, false, 'search'
  RETURNING id
),
s3 AS (
  INSERT INTO document_template_sections (template_id, name_en, name_ar, description_en, description_ar, section_order, is_optional, icon)
  SELECT (SELECT id FROM policy_brief), 'Recommendations', 'التوصيات', 'Proposed actions and recommendations', 'الإجراءات والتوصيات المقترحة', 3, false, 'check-circle'
  RETURNING id
),
-- Insert fields for section 1 (Executive Summary)
f1 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, placeholder_en, placeholder_ar)
  SELECT id, 'title', 'Policy Brief Title', 'عنوان موجز السياسات', 'text', true, 1, 12,
    'Enter a descriptive title...', 'أدخل عنوانا وصفيا...'
  FROM s1
),
f2 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, placeholder_en, placeholder_ar)
  SELECT id, 'date', 'Date', 'التاريخ', 'date', true, 2, 6, '', ''
  FROM s1
),
f3 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, options)
  SELECT id, 'priority', 'Priority Level', 'مستوى الأولوية', 'select', true, 3, 6,
    '{"options": [
      {"value": "low", "label_en": "Low", "label_ar": "منخفض"},
      {"value": "medium", "label_en": "Medium", "label_ar": "متوسط"},
      {"value": "high", "label_en": "High", "label_ar": "مرتفع"},
      {"value": "urgent", "label_en": "Urgent", "label_ar": "عاجل"}
    ]}'::jsonb
  FROM s1
),
f4 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, placeholder_en, placeholder_ar, help_text_en, help_text_ar)
  SELECT id, 'executive_summary', 'Executive Summary', 'الملخص التنفيذي', 'rich_text', true, 4, 12,
    'Summarize the key points in 2-3 paragraphs...', 'لخص النقاط الرئيسية في 2-3 فقرات...',
    'This should provide a quick overview for decision makers', 'يجب أن يوفر هذا نظرة سريعة لصناع القرار'
  FROM s1
),
-- Insert fields for section 2 (Issue Analysis)
f5 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, placeholder_en, placeholder_ar)
  SELECT id, 'background', 'Background', 'الخلفية', 'rich_text', true, 1, 12,
    'Provide context and background information...', 'قدم معلومات السياق والخلفية...'
  FROM s2
),
f6 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, placeholder_en, placeholder_ar)
  SELECT id, 'key_issues', 'Key Issues', 'القضايا الرئيسية', 'rich_text', true, 2, 12,
    'List and explain the main issues...', 'اذكر واشرح القضايا الرئيسية...'
  FROM s2
),
f7 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, placeholder_en, placeholder_ar)
  SELECT id, 'stakeholders', 'Stakeholders', 'أصحاب المصلحة', 'textarea', false, 3, 12,
    'Identify key stakeholders and their interests...', 'حدد أصحاب المصلحة الرئيسيين ومصالحهم...'
  FROM s2
),
f8 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, entity_reference_config)
  SELECT id, 'related_entities', 'Related Entities', 'الجهات ذات الصلة', 'entity_reference', false, 4, 12,
    '{"entity_type": "any", "multiple": true, "max_selections": 5}'::jsonb
  FROM s2
),
-- Insert fields for section 3 (Recommendations)
f9 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, placeholder_en, placeholder_ar, help_text_en, help_text_ar)
  SELECT id, 'recommendations', 'Recommendations', 'التوصيات', 'rich_text', true, 1, 12,
    'List specific, actionable recommendations...', 'اذكر توصيات محددة وقابلة للتنفيذ...',
    'Be specific and include timelines where possible', 'كن محددا وأدرج جداول زمنية حيثما أمكن'
  FROM s3
),
f10 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, placeholder_en, placeholder_ar)
  SELECT id, 'next_steps', 'Next Steps', 'الخطوات التالية', 'textarea', true, 2, 12,
    'Outline the immediate next steps...', 'حدد الخطوات التالية الفورية...'
  FROM s3
),
f11 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width)
  SELECT id, 'follow_up_date', 'Follow-up Date', 'تاريخ المتابعة', 'date', false, 3, 6
  FROM s3
)
SELECT 1;

-- Engagement Report Template
WITH engagement_report AS (
  INSERT INTO document_templates (
    name_en, name_ar, description_en, description_ar,
    category, icon, color, target_entity_types,
    status, is_system_template, default_classification, output_format
  ) VALUES (
    'Engagement Report',
    'تقرير التفاعل',
    'Detailed report of meetings, consultations, or events with outcomes and action items',
    'تقرير مفصل عن الاجتماعات أو المشاورات أو الفعاليات مع النتائج وبنود العمل',
    'engagement_report',
    'users',
    'green',
    ARRAY['country', 'organization', 'forum', 'engagement'],
    'published',
    true,
    'internal',
    'docx'
  ) RETURNING id
),
s1 AS (
  INSERT INTO document_template_sections (template_id, name_en, name_ar, description_en, description_ar, section_order, is_optional, icon)
  SELECT id, 'Engagement Details', 'تفاصيل التفاعل', 'Basic information about the engagement', 'معلومات أساسية عن التفاعل', 1, false, 'calendar'
  FROM engagement_report RETURNING id
),
s2 AS (
  INSERT INTO document_template_sections (template_id, name_en, name_ar, description_en, description_ar, section_order, is_optional, icon)
  SELECT (SELECT id FROM engagement_report), 'Participants', 'المشاركون', 'List of attendees and their roles', 'قائمة الحضور وأدوارهم', 2, false, 'users'
  RETURNING id
),
s3 AS (
  INSERT INTO document_template_sections (template_id, name_en, name_ar, description_en, description_ar, section_order, is_optional, icon)
  SELECT (SELECT id FROM engagement_report), 'Discussion Summary', 'ملخص المناقشة', 'Key points discussed and outcomes', 'النقاط الرئيسية التي تمت مناقشتها والنتائج', 3, false, 'message-square'
  RETURNING id
),
s4 AS (
  INSERT INTO document_template_sections (template_id, name_en, name_ar, description_en, description_ar, section_order, is_optional, icon)
  SELECT (SELECT id FROM engagement_report), 'Action Items', 'بنود العمل', 'Commitments and follow-up actions', 'الالتزامات وإجراءات المتابعة', 4, false, 'check-square'
  RETURNING id
),
-- Insert fields for section 1 (Engagement Details)
f1 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, placeholder_en, placeholder_ar)
  SELECT id, 'title', 'Engagement Title', 'عنوان التفاعل', 'text', true, 1, 12,
    'Enter a descriptive title...', 'أدخل عنوانا وصفيا...'
  FROM s1
),
f2 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, options)
  SELECT id, 'type', 'Engagement Type', 'نوع التفاعل', 'select', true, 2, 6,
    '{"options": [
      {"value": "meeting", "label_en": "Meeting", "label_ar": "اجتماع"},
      {"value": "conference", "label_en": "Conference", "label_ar": "مؤتمر"},
      {"value": "workshop", "label_en": "Workshop", "label_ar": "ورشة عمل"},
      {"value": "consultation", "label_en": "Consultation", "label_ar": "مشاورة"},
      {"value": "call", "label_en": "Call", "label_ar": "مكالمة"},
      {"value": "visit", "label_en": "Visit", "label_ar": "زيارة"},
      {"value": "other", "label_en": "Other", "label_ar": "أخرى"}
    ]}'::jsonb
  FROM s1
),
f3 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width)
  SELECT id, 'date_range', 'Date & Time', 'التاريخ والوقت', 'date_range', true, 3, 6
  FROM s1
),
f4 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, placeholder_en, placeholder_ar)
  SELECT id, 'location', 'Location', 'الموقع', 'text', false, 4, 6,
    'Enter location or "Virtual"', 'أدخل الموقع أو "افتراضي"'
  FROM s1
),
f5 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, entity_reference_config)
  SELECT id, 'organizing_entity', 'Organizing Entity', 'الجهة المنظمة', 'entity_reference', false, 5, 6,
    '{"entity_type": "organization", "multiple": false}'::jsonb
  FROM s1
),
-- Insert fields for section 2 (Participants)
f6 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, entity_reference_config, help_text_en, help_text_ar)
  SELECT id, 'internal_participants', 'Internal Participants', 'المشاركون الداخليون', 'entity_reference', true, 1, 12,
    '{"entity_type": "person", "multiple": true, "filter": {"is_internal": true}}'::jsonb,
    'Select staff members who attended', 'اختر الموظفين الذين حضروا'
  FROM s2
),
f7 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, entity_reference_config, help_text_en, help_text_ar)
  SELECT id, 'external_participants', 'External Participants', 'المشاركون الخارجيون', 'entity_reference', false, 2, 12,
    '{"entity_type": "person", "multiple": true, "filter": {"is_internal": false}}'::jsonb,
    'Select external attendees', 'اختر الحضور الخارجيين'
  FROM s2
),
f8 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, placeholder_en, placeholder_ar, help_text_en, help_text_ar)
  SELECT id, 'other_participants', 'Other Participants', 'مشاركون آخرون', 'textarea', false, 3, 12,
    'List any participants not in the system...', 'اذكر أي مشاركين غير موجودين في النظام...',
    'Include name, title, and organization', 'أدرج الاسم والمسمى والمنظمة'
  FROM s2
),
-- Insert fields for section 3 (Discussion Summary)
f9 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, placeholder_en, placeholder_ar)
  SELECT id, 'objectives', 'Meeting Objectives', 'أهداف الاجتماع', 'textarea', true, 1, 12,
    'What were the main objectives of this engagement?', 'ما هي الأهداف الرئيسية لهذا التفاعل؟'
  FROM s3
),
f10 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, placeholder_en, placeholder_ar)
  SELECT id, 'discussion_points', 'Key Discussion Points', 'نقاط المناقشة الرئيسية', 'rich_text', true, 2, 12,
    'Summarize the main topics discussed...', 'لخص الموضوعات الرئيسية التي تمت مناقشتها...'
  FROM s3
),
f11 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, placeholder_en, placeholder_ar)
  SELECT id, 'outcomes', 'Key Outcomes', 'النتائج الرئيسية', 'rich_text', true, 3, 12,
    'What were the main outcomes and decisions?', 'ما هي النتائج والقرارات الرئيسية؟'
  FROM s3
),
f12 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width)
  SELECT id, 'attachments', 'Attachments', 'المرفقات', 'file_attachment', false, 4, 12
  FROM s3
),
-- Insert fields for section 4 (Action Items)
f13 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, placeholder_en, placeholder_ar, help_text_en, help_text_ar)
  SELECT id, 'action_items', 'Action Items', 'بنود العمل', 'rich_text', true, 1, 12,
    'List all action items with owners and deadlines...', 'اذكر جميع بنود العمل مع المسؤولين والمواعيد النهائية...',
    'Format: Action item | Owner | Deadline', 'الصيغة: بند العمل | المسؤول | الموعد النهائي'
  FROM s4
),
f14 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width)
  SELECT id, 'follow_up_date', 'Next Follow-up Date', 'تاريخ المتابعة التالي', 'date', false, 2, 6
  FROM s4
),
f15 AS (
  INSERT INTO document_template_fields (section_id, field_key, label_en, label_ar, field_type, is_required, field_order, grid_width, placeholder_en, placeholder_ar)
  SELECT id, 'additional_notes', 'Additional Notes', 'ملاحظات إضافية', 'textarea', false, 3, 12,
    'Any other relevant information...', 'أي معلومات أخرى ذات صلة...'
  FROM s4
)
SELECT 1;

-- Function to get template with all sections and fields
CREATE OR REPLACE FUNCTION get_document_template_full(p_template_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'template', row_to_json(dt.*),
    'sections', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'section', row_to_json(dts.*),
          'fields', (
            SELECT jsonb_agg(row_to_json(dtf.*) ORDER BY dtf.field_order)
            FROM document_template_fields dtf
            WHERE dtf.section_id = dts.id
          )
        ) ORDER BY dts.section_order
      )
      FROM document_template_sections dts
      WHERE dts.template_id = dt.id
    )
  ) INTO v_result
  FROM document_templates dt
  WHERE dt.id = p_template_id;

  RETURN v_result;
END;
$$;

-- Function to validate templated document field values
CREATE OR REPLACE FUNCTION validate_templated_document_fields(
  p_template_id UUID,
  p_field_values JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_errors JSONB := '[]'::jsonb;
  v_field RECORD;
  v_value JSONB;
BEGIN
  FOR v_field IN
    SELECT dtf.*, dts.section_order
    FROM document_template_fields dtf
    JOIN document_template_sections dts ON dts.id = dtf.section_id
    WHERE dts.template_id = p_template_id
    ORDER BY dts.section_order, dtf.field_order
  LOOP
    v_value := p_field_values -> v_field.field_key;

    -- Check required fields
    IF v_field.is_required AND (v_value IS NULL OR v_value = 'null'::jsonb OR v_value = '""'::jsonb) THEN
      v_errors := v_errors || jsonb_build_object(
        'field_key', v_field.field_key,
        'error', 'required',
        'label_en', v_field.label_en,
        'label_ar', v_field.label_ar
      );
    END IF;

    -- Add more validation rules based on field_type if needed
  END LOOP;

  RETURN jsonb_build_object(
    'valid', jsonb_array_length(v_errors) = 0,
    'errors', v_errors
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_document_template_full(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_templated_document_fields(UUID, JSONB) TO authenticated;
