-- ============================================================================
-- Migration: Terminology Glossary
-- Date: 2026-02-06
-- Feature: use-case-repository
-- Description: Bilingual terminology glossary for diplomatic and technical terms
-- Covers: UC-040, UC-041
-- ============================================================================

-- ============================================================================
-- PART 1: Create terminology table
-- ============================================================================

CREATE TABLE IF NOT EXISTS terminology (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Term (bilingual)
  term_en TEXT NOT NULL,
  term_ar TEXT NOT NULL,

  -- Abbreviation/Acronym
  abbreviation_en TEXT,
  abbreviation_ar TEXT,

  -- Definition (bilingual)
  definition_en TEXT,
  definition_ar TEXT,

  -- Domain/Category
  domain TEXT NOT NULL CHECK (domain IN (
    'diplomatic',       -- Diplomatic terms (protocol, negotiations)
    'legal',            -- Legal terminology
    'technical',        -- Technical terms
    'organizational',   -- Organizational terms
    'un_system',        -- UN-specific terminology
    'oic_system',       -- OIC-specific terminology
    'gcc_system',       -- GCC-specific terminology
    'government',       -- Government/ministerial terms
    'correspondence',   -- Correspondence types and terms
    'document_type',    -- Document classification
    'priority',         -- Priority levels
    'role',             -- Roles and positions
    'status',           -- Status terms
    'process',          -- Process/workflow terms
    'general'           -- General terms
  )),

  -- Subdomain for more specific categorization
  subdomain TEXT,

  -- Usage context
  usage_notes_en TEXT,
  usage_notes_ar TEXT,
  example_sentence_en TEXT,
  example_sentence_ar TEXT,

  -- Source and authority
  source TEXT, -- Where term is defined (e.g., "UN Charter", "Vienna Convention")
  source_url TEXT,

  -- Relationships
  parent_term_id UUID REFERENCES terminology(id) ON DELETE SET NULL,
  related_terms UUID[] DEFAULT '{}', -- Array of related term IDs

  -- Synonyms
  synonyms_en TEXT[] DEFAULT '{}',
  synonyms_ar TEXT[] DEFAULT '{}',

  -- Status
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  frequency_of_use TEXT DEFAULT 'common' CHECK (frequency_of_use IN (
    'rare', 'uncommon', 'common', 'frequent', 'very_frequent'
  )),

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Ensure unique term per domain
  CONSTRAINT unique_term_domain UNIQUE (term_en, domain)
);

-- ============================================================================
-- PART 2: Create term_translations table for additional languages
-- ============================================================================

CREATE TABLE IF NOT EXISTS term_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  terminology_id UUID NOT NULL REFERENCES terminology(id) ON DELETE CASCADE,

  -- Language
  language_code TEXT NOT NULL, -- ISO 639-1 (fr, es, etc.)
  language_name TEXT NOT NULL,

  -- Translation
  term TEXT NOT NULL,
  abbreviation TEXT,
  definition TEXT,
  usage_notes TEXT,

  -- Status
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Unique translation per term per language
  CONSTRAINT unique_term_language UNIQUE (terminology_id, language_code)
);

-- ============================================================================
-- PART 3: Create term_usage_log for tracking how terms are used
-- ============================================================================

CREATE TABLE IF NOT EXISTS term_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  terminology_id UUID NOT NULL REFERENCES terminology(id) ON DELETE CASCADE,

  -- Where the term was used
  entity_type TEXT NOT NULL, -- 'correspondence', 'document', 'brief', etc.
  entity_id UUID NOT NULL,

  -- Usage context
  context_snippet TEXT, -- Surrounding text where term was found
  language TEXT DEFAULT 'en', -- Which language version was used

  -- Timestamp
  used_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PART 4: Create indexes for performance
-- ============================================================================

-- Terminology indexes
CREATE INDEX idx_terminology_domain ON terminology(domain);
CREATE INDEX idx_terminology_subdomain ON terminology(domain, subdomain)
  WHERE subdomain IS NOT NULL;
CREATE INDEX idx_terminology_approved ON terminology(domain)
  WHERE is_approved = true AND is_active = true;
CREATE INDEX idx_terminology_abbrev_en ON terminology(abbreviation_en)
  WHERE abbreviation_en IS NOT NULL;
CREATE INDEX idx_terminology_abbrev_ar ON terminology(abbreviation_ar)
  WHERE abbreviation_ar IS NOT NULL;
CREATE INDEX idx_terminology_parent ON terminology(parent_term_id)
  WHERE parent_term_id IS NOT NULL;
CREATE INDEX idx_terminology_tags ON terminology USING gin(tags);
CREATE INDEX idx_terminology_related ON terminology USING gin(related_terms);

-- Full-text search indexes
CREATE INDEX idx_terminology_search_en ON terminology
  USING gin(to_tsvector('english',
    COALESCE(term_en, '') || ' ' ||
    COALESCE(abbreviation_en, '') || ' ' ||
    COALESCE(definition_en, '') || ' ' ||
    COALESCE(array_to_string(synonyms_en, ' '), '')
  ));

CREATE INDEX idx_terminology_search_ar ON terminology
  USING gin(to_tsvector('arabic',
    COALESCE(term_ar, '') || ' ' ||
    COALESCE(abbreviation_ar, '') || ' ' ||
    COALESCE(definition_ar, '')
  ));

-- Translations indexes
CREATE INDEX idx_term_translations_term ON term_translations(terminology_id);
CREATE INDEX idx_term_translations_lang ON term_translations(language_code);

-- Usage log indexes
CREATE INDEX idx_term_usage_term ON term_usage_log(terminology_id);
CREATE INDEX idx_term_usage_entity ON term_usage_log(entity_type, entity_id);
CREATE INDEX idx_term_usage_time ON term_usage_log(used_at DESC);

-- ============================================================================
-- PART 5: Triggers
-- ============================================================================

-- Update timestamp trigger
CREATE TRIGGER update_terminology_updated_at
  BEFORE UPDATE ON terminology
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 6: RLS Policies
-- ============================================================================

ALTER TABLE terminology ENABLE ROW LEVEL SECURITY;
ALTER TABLE term_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE term_usage_log ENABLE ROW LEVEL SECURITY;

-- Terminology policies
CREATE POLICY "Anyone can view approved terminology"
  ON terminology FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can create terminology"
  ON terminology FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Creator or approver can update terminology"
  ON terminology FOR UPDATE
  USING (created_by = auth.uid() OR approved_by = auth.uid());

-- Translations policies
CREATE POLICY "Anyone can view translations"
  ON term_translations FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can manage translations"
  ON term_translations FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Usage log policies
CREATE POLICY "Authenticated users can view usage"
  ON term_usage_log FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can log usage"
  ON term_usage_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- PART 7: Helper Functions
-- ============================================================================

-- Function: Search terminology
CREATE OR REPLACE FUNCTION search_terminology(
  p_query TEXT,
  p_domain TEXT DEFAULT NULL,
  p_language TEXT DEFAULT 'en',
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  term_en TEXT,
  term_ar TEXT,
  abbreviation_en TEXT,
  abbreviation_ar TEXT,
  definition_en TEXT,
  definition_ar TEXT,
  domain TEXT,
  subdomain TEXT,
  match_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.term_en,
    t.term_ar,
    t.abbreviation_en,
    t.abbreviation_ar,
    t.definition_en,
    t.definition_ar,
    t.domain,
    t.subdomain,
    CASE
      WHEN p_language = 'ar' THEN
        ts_rank(
          to_tsvector('arabic', COALESCE(t.term_ar, '') || ' ' || COALESCE(t.abbreviation_ar, '') || ' ' || COALESCE(t.definition_ar, '')),
          plainto_tsquery('arabic', p_query)
        )
      ELSE
        ts_rank(
          to_tsvector('english', COALESCE(t.term_en, '') || ' ' || COALESCE(t.abbreviation_en, '') || ' ' || COALESCE(t.definition_en, '')),
          plainto_tsquery('english', p_query)
        )
    END as match_score
  FROM terminology t
  WHERE t.is_active = true
    AND (p_domain IS NULL OR t.domain = p_domain)
    AND (
      t.term_en ILIKE '%' || p_query || '%'
      OR t.term_ar ILIKE '%' || p_query || '%'
      OR t.abbreviation_en ILIKE '%' || p_query || '%'
      OR t.abbreviation_ar ILIKE '%' || p_query || '%'
      OR t.definition_en ILIKE '%' || p_query || '%'
      OR t.definition_ar ILIKE '%' || p_query || '%'
      OR p_query = ANY(t.synonyms_en)
      OR p_query = ANY(t.synonyms_ar)
    )
  ORDER BY
    -- Exact term match first
    CASE WHEN t.term_en ILIKE p_query OR t.term_ar ILIKE p_query THEN 0 ELSE 1 END,
    -- Then abbreviation match
    CASE WHEN t.abbreviation_en ILIKE p_query OR t.abbreviation_ar ILIKE p_query THEN 0 ELSE 1 END,
    -- Then by relevance score
    match_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get terms by domain
CREATE OR REPLACE FUNCTION get_terms_by_domain(
  p_domain TEXT,
  p_approved_only BOOLEAN DEFAULT true,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  term_en TEXT,
  term_ar TEXT,
  abbreviation_en TEXT,
  abbreviation_ar TEXT,
  definition_en TEXT,
  definition_ar TEXT,
  subdomain TEXT,
  is_approved BOOLEAN,
  usage_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.term_en,
    t.term_ar,
    t.abbreviation_en,
    t.abbreviation_ar,
    t.definition_en,
    t.definition_ar,
    t.subdomain,
    t.is_approved,
    (SELECT COUNT(*) FROM term_usage_log ul WHERE ul.terminology_id = t.id) as usage_count
  FROM terminology t
  WHERE t.domain = p_domain
    AND t.is_active = true
    AND (p_approved_only = false OR t.is_approved = true)
  ORDER BY t.term_en
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get related terms
CREATE OR REPLACE FUNCTION get_related_terms(p_terminology_id UUID)
RETURNS TABLE (
  id UUID,
  term_en TEXT,
  term_ar TEXT,
  abbreviation_en TEXT,
  domain TEXT,
  relation_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Direct related terms
  SELECT
    t.id,
    t.term_en,
    t.term_ar,
    t.abbreviation_en,
    t.domain,
    'related' as relation_type
  FROM terminology t
  WHERE t.id = ANY(
    SELECT unnest(related_terms)
    FROM terminology
    WHERE id = p_terminology_id
  )
  AND t.is_active = true

  UNION

  -- Parent term
  SELECT
    parent.id,
    parent.term_en,
    parent.term_ar,
    parent.abbreviation_en,
    parent.domain,
    'parent' as relation_type
  FROM terminology t
  JOIN terminology parent ON t.parent_term_id = parent.id
  WHERE t.id = p_terminology_id
  AND parent.is_active = true

  UNION

  -- Child terms
  SELECT
    child.id,
    child.term_en,
    child.term_ar,
    child.abbreviation_en,
    child.domain,
    'child' as relation_type
  FROM terminology child
  WHERE child.parent_term_id = p_terminology_id
  AND child.is_active = true;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Log term usage
CREATE OR REPLACE FUNCTION log_term_usage(
  p_terminology_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_context_snippet TEXT DEFAULT NULL,
  p_language TEXT DEFAULT 'en'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO term_usage_log (terminology_id, entity_type, entity_id, context_snippet, language)
  VALUES (p_terminology_id, p_entity_type, p_entity_id, p_context_snippet, p_language);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get most used terms
CREATE OR REPLACE FUNCTION get_most_used_terms(
  p_domain TEXT DEFAULT NULL,
  p_days INTEGER DEFAULT 30,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  term_en TEXT,
  term_ar TEXT,
  abbreviation_en TEXT,
  domain TEXT,
  usage_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.term_en,
    t.term_ar,
    t.abbreviation_en,
    t.domain,
    COUNT(ul.id) as usage_count
  FROM terminology t
  JOIN term_usage_log ul ON ul.terminology_id = t.id
  WHERE t.is_active = true
    AND t.is_approved = true
    AND ul.used_at >= (CURRENT_TIMESTAMP - (p_days || ' days')::INTERVAL)
    AND (p_domain IS NULL OR t.domain = p_domain)
  GROUP BY t.id, t.term_en, t.term_ar, t.abbreviation_en, t.domain
  ORDER BY usage_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PART 8: Seed common diplomatic terminology
-- ============================================================================

INSERT INTO terminology (term_en, term_ar, abbreviation_en, abbreviation_ar, domain, definition_en, definition_ar, is_approved) VALUES
-- Document Types
('Outgoing Telegram', 'برقية صادرة', NULL, NULL, 'document_type', 'Official message sent via diplomatic channels', 'رسالة رسمية ترسل عبر القنوات الدبلوماسية', true),
('Incoming Telegram', 'برقية واردة', NULL, NULL, 'document_type', 'Official message received via diplomatic channels', 'رسالة رسمية واردة عبر القنوات الدبلوماسية', true),
('Note Verbale', 'مذكرة شفوية', NULL, NULL, 'document_type', 'Unsigned diplomatic note written in third person', 'مذكرة دبلوماسية غير موقعة مكتوبة بصيغة الغائب', true),
('Memo', 'مذكرة', NULL, NULL, 'document_type', 'Internal or external memorandum', 'مذكرة داخلية أو خارجية', true),
('Circular', 'تعميم', NULL, NULL, 'document_type', 'Broadcast communication to multiple recipients', 'اتصال يوزع على متلقين متعددين', true),

-- Priority Levels
('Very Urgent', 'عاجلة جداً', NULL, NULL, 'priority', 'Highest priority requiring immediate action', 'أعلى أولوية تتطلب إجراء فوري', true),
('Urgent', 'عاجلة', NULL, NULL, 'priority', 'High priority requiring prompt action', 'أولوية عالية تتطلب إجراء سريع', true),
('Normal', 'عادية', NULL, NULL, 'priority', 'Standard priority for routine matters', 'أولوية عادية للأمور الروتينية', true),

-- Roles
('Focal Point', 'نقطة الاتصال', NULL, NULL, 'role', 'Primary contact person for a specific matter', 'الشخص المسؤول عن التواصل لموضوع معين', true),
('Rapporteur', 'المقرر', NULL, NULL, 'role', 'Person responsible for recording and reporting', 'الشخص المسؤول عن التسجيل والتقرير', true),
('Delegate', 'مندوب', NULL, NULL, 'role', 'Representative of a country or organization', 'ممثل عن دولة أو منظمة', true),

-- UN System
('Quadrennial Comprehensive Policy Review', 'الاستعراض الشامل الرباعي للسياسات', 'QCPR', NULL, 'un_system', 'UN General Assembly mechanism for reviewing UN development activities', 'آلية الجمعية العامة للأمم المتحدة لمراجعة أنشطة التنمية', true),
('Department of Economic and Social Affairs', 'إدارة الشؤون الاقتصادية والاجتماعية', 'DESA', NULL, 'un_system', 'UN department responsible for social and economic issues', 'إدارة الأمم المتحدة المسؤولة عن القضايا الاجتماعية والاقتصادية', true),
('General Assembly', 'الجمعية العامة', 'GA', NULL, 'un_system', 'Main deliberative body of the United Nations', 'الهيئة التداولية الرئيسية للأمم المتحدة', true),
('Economic and Social Council', 'المجلس الاقتصادي والاجتماعي', 'ECOSOC', NULL, 'un_system', 'UN principal body coordinating economic and social work', 'الهيئة الرئيسية في الأمم المتحدة التي تنسق العمل الاقتصادي والاجتماعي', true),

-- Government
('Cabinet Resolution', 'قرار مجلس الوزراء', NULL, NULL, 'government', 'Decision made by the Council of Ministers', 'قرار صادر من مجلس الوزراء', true),
('Royal Decree', 'مرسوم ملكي', NULL, NULL, 'government', 'Formal order issued by the King', 'أمر رسمي صادر من الملك', true),
('Royal Order', 'أمر ملكي', NULL, NULL, 'government', 'Direct order from the King', 'أمر مباشر من الملك', true),
('Ministerial Order', 'قرار وزاري', NULL, NULL, 'government', 'Decision made by a minister', 'قرار صادر من وزير', true)

ON CONFLICT (term_en, domain) DO NOTHING;

-- ============================================================================
-- PART 9: Grants
-- ============================================================================

GRANT SELECT ON terminology TO authenticated;
GRANT INSERT, UPDATE ON terminology TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON term_translations TO authenticated;
GRANT SELECT, INSERT ON term_usage_log TO authenticated;
GRANT EXECUTE ON FUNCTION search_terminology(TEXT, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_terms_by_domain(TEXT, BOOLEAN, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_related_terms(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_term_usage(UUID, TEXT, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_most_used_terms(TEXT, INTEGER, INTEGER) TO authenticated;

-- ============================================================================
-- PART 10: Comments
-- ============================================================================

COMMENT ON TABLE terminology IS 'Bilingual glossary of diplomatic, legal, and technical terminology';
COMMENT ON TABLE term_translations IS 'Additional language translations for terminology';
COMMENT ON TABLE term_usage_log IS 'Log of where and when terms are used in the system';
COMMENT ON COLUMN terminology.domain IS 'Domain: diplomatic, legal, technical, organizational, un_system, oic_system, government, etc.';
COMMENT ON COLUMN terminology.frequency_of_use IS 'How often the term is used: rare, uncommon, common, frequent, very_frequent';
COMMENT ON FUNCTION search_terminology IS 'Full-text search across terminology with language preference';
COMMENT ON FUNCTION get_terms_by_domain IS 'Get all terms in a specific domain with usage counts';
COMMENT ON FUNCTION get_related_terms IS 'Get related, parent, and child terms for a given term';
COMMENT ON FUNCTION log_term_usage IS 'Log when a term is used in a document/entity';
COMMENT ON FUNCTION get_most_used_terms IS 'Get most frequently used terms in recent period';

-- ============================================================================
-- Migration Complete
-- ============================================================================
