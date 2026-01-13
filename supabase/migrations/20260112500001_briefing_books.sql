-- Migration: Briefing Books Feature
-- Feature: briefing-book-generator
-- Description: Tables for storing briefing book configurations, generated documents, and templates

-- Briefing book format enum
CREATE TYPE briefing_book_format AS ENUM ('pdf', 'docx', 'html');

-- Briefing book status enum
CREATE TYPE briefing_book_status AS ENUM ('draft', 'generating', 'ready', 'expired', 'failed');

-- Briefing book section types enum
CREATE TYPE briefing_book_section_type AS ENUM (
  'executive_summary',
  'entity_overview',
  'key_contacts',
  'recent_engagements',
  'positions',
  'mou_agreements',
  'commitments',
  'timeline',
  'documents',
  'relationship_map',
  'intelligence',
  'custom'
);

-- Briefing book topic categories enum
CREATE TYPE briefing_book_topic AS ENUM (
  'statistics',
  'economy',
  'trade',
  'technology',
  'environment',
  'health',
  'education',
  'governance',
  'cooperation',
  'other'
);

-- Main briefing books table
CREATE TABLE briefing_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Configuration
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,

  -- Selected entities (array of UUIDs)
  entity_ids UUID[] NOT NULL DEFAULT '{}',

  -- Date range filter
  date_range_start TIMESTAMPTZ,
  date_range_end TIMESTAMPTZ,

  -- Topics filter
  topics briefing_book_topic[] DEFAULT '{}',

  -- Section configuration (JSON array with order and enabled status)
  sections JSONB NOT NULL DEFAULT '[]',

  -- Export options
  format briefing_book_format NOT NULL DEFAULT 'pdf',
  primary_language VARCHAR(2) NOT NULL DEFAULT 'en' CHECK (primary_language IN ('en', 'ar')),
  include_bilingual BOOLEAN NOT NULL DEFAULT true,
  include_table_of_contents BOOLEAN NOT NULL DEFAULT true,
  include_page_numbers BOOLEAN NOT NULL DEFAULT true,
  include_bookmarks BOOLEAN NOT NULL DEFAULT true,
  include_cover_page BOOLEAN NOT NULL DEFAULT true,
  include_executive_summary BOOLEAN NOT NULL DEFAULT true,
  max_sensitivity_level sensitivity_level DEFAULT 'high',
  header_text TEXT,
  footer_text TEXT,

  -- Generation status
  status briefing_book_status NOT NULL DEFAULT 'draft',
  error_message TEXT,

  -- Generated file info
  file_url TEXT,
  file_size_bytes BIGINT,
  page_count INT,
  word_count INT,

  -- Audit fields
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Briefing book templates table
CREATE TABLE briefing_book_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template info
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,

  -- Template configuration (excludes entities, title, dateRange)
  sections JSONB NOT NULL DEFAULT '[]',
  format briefing_book_format NOT NULL DEFAULT 'pdf',
  primary_language VARCHAR(2) NOT NULL DEFAULT 'en' CHECK (primary_language IN ('en', 'ar')),
  include_bilingual BOOLEAN NOT NULL DEFAULT true,
  include_table_of_contents BOOLEAN NOT NULL DEFAULT true,
  include_page_numbers BOOLEAN NOT NULL DEFAULT true,
  include_bookmarks BOOLEAN NOT NULL DEFAULT true,
  include_cover_page BOOLEAN NOT NULL DEFAULT true,
  include_executive_summary BOOLEAN NOT NULL DEFAULT true,
  max_sensitivity_level sensitivity_level DEFAULT 'high',

  -- System default or user-created
  is_default BOOLEAN NOT NULL DEFAULT false,

  -- Audit fields
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Briefing book entity junction table (for better querying)
CREATE TABLE briefing_book_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_book_id UUID NOT NULL REFERENCES briefing_books(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  entity_type dossier_type NOT NULL,
  included_sections briefing_book_section_type[] NOT NULL DEFAULT '{}',
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_briefing_books_created_by ON briefing_books(created_by);
CREATE INDEX idx_briefing_books_status ON briefing_books(status);
CREATE INDEX idx_briefing_books_created_at ON briefing_books(created_at DESC);
CREATE INDEX idx_briefing_books_expires_at ON briefing_books(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_briefing_book_entities_book ON briefing_book_entities(briefing_book_id);
CREATE INDEX idx_briefing_book_entities_entity ON briefing_book_entities(entity_id);
CREATE INDEX idx_briefing_book_templates_default ON briefing_book_templates(is_default) WHERE is_default = true;

-- Enable RLS
ALTER TABLE briefing_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefing_book_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefing_book_entities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for briefing_books

-- Users can view their own briefing books
CREATE POLICY briefing_books_select_own ON briefing_books
  FOR SELECT USING (created_by = auth.uid());

-- Users can insert their own briefing books
CREATE POLICY briefing_books_insert_own ON briefing_books
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Users can update their own briefing books
CREATE POLICY briefing_books_update_own ON briefing_books
  FOR UPDATE USING (created_by = auth.uid());

-- Users can delete their own briefing books
CREATE POLICY briefing_books_delete_own ON briefing_books
  FOR DELETE USING (created_by = auth.uid());

-- Service role can do everything (for edge functions)
CREATE POLICY briefing_books_service ON briefing_books
  FOR ALL USING (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- RLS Policies for briefing_book_templates

-- Everyone can view default templates
CREATE POLICY briefing_book_templates_select_default ON briefing_book_templates
  FOR SELECT USING (is_default = true);

-- Users can view their own templates
CREATE POLICY briefing_book_templates_select_own ON briefing_book_templates
  FOR SELECT USING (created_by = auth.uid());

-- Users can insert their own templates
CREATE POLICY briefing_book_templates_insert_own ON briefing_book_templates
  FOR INSERT WITH CHECK (created_by = auth.uid() AND is_default = false);

-- Users can update their own templates
CREATE POLICY briefing_book_templates_update_own ON briefing_book_templates
  FOR UPDATE USING (created_by = auth.uid() AND is_default = false);

-- Users can delete their own templates
CREATE POLICY briefing_book_templates_delete_own ON briefing_book_templates
  FOR DELETE USING (created_by = auth.uid() AND is_default = false);

-- Service role can do everything (for edge functions)
CREATE POLICY briefing_book_templates_service ON briefing_book_templates
  FOR ALL USING (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- RLS Policies for briefing_book_entities

-- Users can view entities for their own briefing books
CREATE POLICY briefing_book_entities_select ON briefing_book_entities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM briefing_books bb
      WHERE bb.id = briefing_book_entities.briefing_book_id
      AND bb.created_by = auth.uid()
    )
  );

-- Users can insert entities for their own briefing books
CREATE POLICY briefing_book_entities_insert ON briefing_book_entities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM briefing_books bb
      WHERE bb.id = briefing_book_entities.briefing_book_id
      AND bb.created_by = auth.uid()
    )
  );

-- Users can update entities for their own briefing books
CREATE POLICY briefing_book_entities_update ON briefing_book_entities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM briefing_books bb
      WHERE bb.id = briefing_book_entities.briefing_book_id
      AND bb.created_by = auth.uid()
    )
  );

-- Users can delete entities for their own briefing books
CREATE POLICY briefing_book_entities_delete ON briefing_book_entities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM briefing_books bb
      WHERE bb.id = briefing_book_entities.briefing_book_id
      AND bb.created_by = auth.uid()
    )
  );

-- Service role can do everything
CREATE POLICY briefing_book_entities_service ON briefing_book_entities
  FOR ALL USING (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_briefing_books_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER briefing_books_updated_at_trigger
  BEFORE UPDATE ON briefing_books
  FOR EACH ROW
  EXECUTE FUNCTION update_briefing_books_updated_at();

CREATE TRIGGER briefing_book_templates_updated_at_trigger
  BEFORE UPDATE ON briefing_book_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_briefing_books_updated_at();

-- Insert default templates
INSERT INTO briefing_book_templates (
  name_en, name_ar, description_en, description_ar,
  sections, format, primary_language, include_bilingual,
  include_table_of_contents, include_page_numbers, include_bookmarks,
  include_cover_page, include_executive_summary, is_default
) VALUES
(
  'Executive Briefing',
  'إحاطة تنفيذية',
  'High-level overview with key contacts and recent engagements',
  'نظرة عامة عالية المستوى مع جهات الاتصال الرئيسية والتعاملات الأخيرة',
  '[
    {"type": "executive_summary", "title_en": "Executive Summary", "title_ar": "الملخص التنفيذي", "enabled": true, "order": 1},
    {"type": "entity_overview", "title_en": "Entity Overview", "title_ar": "نظرة عامة على الجهة", "enabled": true, "order": 2},
    {"type": "key_contacts", "title_en": "Key Contacts", "title_ar": "جهات الاتصال الرئيسية", "enabled": true, "order": 3},
    {"type": "recent_engagements", "title_en": "Recent Engagements", "title_ar": "التعاملات الأخيرة", "enabled": true, "order": 4},
    {"type": "positions", "title_en": "Positions & Talking Points", "title_ar": "المواقف ونقاط النقاش", "enabled": true, "order": 5}
  ]'::jsonb,
  'pdf', 'en', true, true, true, true, true, true, true
),
(
  'Comprehensive Report',
  'تقرير شامل',
  'Full dossier with all sections and documents',
  'ملف كامل مع جميع الأقسام والمستندات',
  '[
    {"type": "executive_summary", "title_en": "Executive Summary", "title_ar": "الملخص التنفيذي", "enabled": true, "order": 1},
    {"type": "entity_overview", "title_en": "Entity Overview", "title_ar": "نظرة عامة على الجهة", "enabled": true, "order": 2},
    {"type": "key_contacts", "title_en": "Key Contacts", "title_ar": "جهات الاتصال الرئيسية", "enabled": true, "order": 3},
    {"type": "recent_engagements", "title_en": "Recent Engagements", "title_ar": "التعاملات الأخيرة", "enabled": true, "order": 4},
    {"type": "positions", "title_en": "Positions & Talking Points", "title_ar": "المواقف ونقاط النقاش", "enabled": true, "order": 5},
    {"type": "mou_agreements", "title_en": "MoU Agreements", "title_ar": "مذكرات التفاهم", "enabled": true, "order": 6},
    {"type": "commitments", "title_en": "Commitments & Deliverables", "title_ar": "الالتزامات والمخرجات", "enabled": true, "order": 7},
    {"type": "timeline", "title_en": "Timeline", "title_ar": "الجدول الزمني", "enabled": true, "order": 8},
    {"type": "documents", "title_en": "Related Documents", "title_ar": "المستندات ذات الصلة", "enabled": true, "order": 9},
    {"type": "relationship_map", "title_en": "Relationship Map", "title_ar": "خريطة العلاقات", "enabled": true, "order": 10},
    {"type": "intelligence", "title_en": "Intelligence & Signals", "title_ar": "المعلومات والإشارات", "enabled": true, "order": 11}
  ]'::jsonb,
  'pdf', 'en', true, true, true, true, true, true, true
),
(
  'Quick Reference',
  'مرجع سريع',
  'Compact format with essential information only',
  'تنسيق مدمج مع المعلومات الأساسية فقط',
  '[
    {"type": "entity_overview", "title_en": "Entity Overview", "title_ar": "نظرة عامة على الجهة", "enabled": true, "order": 1},
    {"type": "key_contacts", "title_en": "Key Contacts", "title_ar": "جهات الاتصال الرئيسية", "enabled": true, "order": 2},
    {"type": "positions", "title_en": "Positions & Talking Points", "title_ar": "المواقف ونقاط النقاش", "enabled": true, "order": 3}
  ]'::jsonb,
  'pdf', 'en', false, false, true, false, false, false, true
),
(
  'Travel Brief',
  'إحاطة السفر',
  'Key contacts, positions, and upcoming commitments',
  'جهات الاتصال الرئيسية والمواقف والالتزامات القادمة',
  '[
    {"type": "executive_summary", "title_en": "Executive Summary", "title_ar": "الملخص التنفيذي", "enabled": true, "order": 1},
    {"type": "key_contacts", "title_en": "Key Contacts", "title_ar": "جهات الاتصال الرئيسية", "enabled": true, "order": 2},
    {"type": "positions", "title_en": "Positions & Talking Points", "title_ar": "المواقف ونقاط النقاش", "enabled": true, "order": 3},
    {"type": "commitments", "title_en": "Upcoming Commitments", "title_ar": "الالتزامات القادمة", "enabled": true, "order": 4}
  ]'::jsonb,
  'pdf', 'en', true, true, true, true, true, true, true
);

-- Create storage bucket for briefing books
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'briefing-books',
  'briefing-books',
  false,
  52428800, -- 50MB max
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/html']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for briefing-books bucket

-- Users can read their own files
CREATE POLICY briefing_books_storage_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'briefing-books' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can upload their own files
CREATE POLICY briefing_books_storage_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'briefing-books' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own files
CREATE POLICY briefing_books_storage_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'briefing-books' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Service role can do everything
CREATE POLICY briefing_books_storage_service ON storage.objects
  FOR ALL USING (
    bucket_id = 'briefing-books' AND
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

COMMENT ON TABLE briefing_books IS 'Stores briefing book configurations and generated file references';
COMMENT ON TABLE briefing_book_templates IS 'Reusable briefing book configuration templates';
COMMENT ON TABLE briefing_book_entities IS 'Junction table for briefing book to entity relationships';
