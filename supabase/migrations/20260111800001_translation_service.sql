-- Migration: Translation Service
-- Feature: translation-service
-- Description: Creates tables and functions for automatic Arabic/English translation

-- Create translation history table
CREATE TABLE IF NOT EXISTS translation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  source_language TEXT NOT NULL CHECK (source_language IN ('en', 'ar')),
  target_language TEXT NOT NULL CHECK (target_language IN ('en', 'ar')),
  original_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  confidence NUMERIC(3, 2) NOT NULL DEFAULT 0.0 CHECK (confidence >= 0 AND confidence <= 1),
  model_used TEXT NOT NULL DEFAULT 'anythingllm',
  translated_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  approved BOOLEAN DEFAULT FALSE,
  approved_by_user_id UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  edited_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_translation_history_entity
  ON translation_history(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_translation_history_user
  ON translation_history(translated_by_user_id);

CREATE INDEX IF NOT EXISTS idx_translation_history_created
  ON translation_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_translation_history_field
  ON translation_history(entity_type, entity_id, field_name);

-- Create translation preferences table
CREATE TABLE IF NOT EXISTS translation_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  auto_translate BOOLEAN NOT NULL DEFAULT FALSE,
  preferred_source_language TEXT CHECK (preferred_source_language IN ('en', 'ar')),
  show_confidence_indicators BOOLEAN NOT NULL DEFAULT TRUE,
  save_translation_history BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for user preferences lookup
CREATE INDEX IF NOT EXISTS idx_translation_preferences_user
  ON translation_preferences(user_id);

-- Create translation glossary table for consistent terminology
CREATE TABLE IF NOT EXISTS translation_glossary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_en TEXT NOT NULL,
  term_ar TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  context TEXT,
  is_proper_noun BOOLEAN NOT NULL DEFAULT FALSE,
  priority INTEGER NOT NULL DEFAULT 0,
  created_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(term_en, term_ar, category)
);

-- Create indexes for glossary lookup
CREATE INDEX IF NOT EXISTS idx_translation_glossary_en
  ON translation_glossary(term_en);

CREATE INDEX IF NOT EXISTS idx_translation_glossary_ar
  ON translation_glossary(term_ar);

CREATE INDEX IF NOT EXISTS idx_translation_glossary_category
  ON translation_glossary(category);

-- Insert common diplomatic/government terminology
INSERT INTO translation_glossary (term_en, term_ar, category, is_proper_noun, priority) VALUES
  ('Ministry of Foreign Affairs', 'وزارة الخارجية', 'government', TRUE, 100),
  ('Memorandum of Understanding', 'مذكرة تفاهم', 'legal', FALSE, 90),
  ('Bilateral Agreement', 'اتفاقية ثنائية', 'legal', FALSE, 90),
  ('Ambassador', 'سفير', 'diplomatic', FALSE, 85),
  ('Embassy', 'سفارة', 'diplomatic', FALSE, 85),
  ('Consulate', 'قنصلية', 'diplomatic', FALSE, 85),
  ('Protocol', 'البروتوكول', 'diplomatic', FALSE, 80),
  ('Summit', 'قمة', 'diplomatic', FALSE, 80),
  ('High-Level Meeting', 'اجتماع رفيع المستوى', 'diplomatic', FALSE, 75),
  ('Official Visit', 'زيارة رسمية', 'diplomatic', FALSE, 75),
  ('Working Group', 'مجموعة العمل', 'organization', FALSE, 70),
  ('Committee', 'لجنة', 'organization', FALSE, 70),
  ('Resolution', 'قرار', 'legal', FALSE, 70),
  ('Commitment', 'التزام', 'legal', FALSE, 70),
  ('Engagement', 'ارتباط', 'diplomatic', FALSE, 65),
  ('Position', 'موقف', 'diplomatic', FALSE, 65),
  ('Dossier', 'ملف', 'documentation', FALSE, 65),
  ('Brief', 'موجز', 'documentation', FALSE, 60),
  ('Agenda', 'جدول الأعمال', 'documentation', FALSE, 60),
  ('Minutes', 'محضر', 'documentation', FALSE, 60)
ON CONFLICT (term_en, term_ar, category) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_translation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trg_translation_history_updated_at
  BEFORE UPDATE ON translation_history
  FOR EACH ROW
  EXECUTE FUNCTION update_translation_updated_at();

CREATE TRIGGER trg_translation_preferences_updated_at
  BEFORE UPDATE ON translation_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_translation_updated_at();

CREATE TRIGGER trg_translation_glossary_updated_at
  BEFORE UPDATE ON translation_glossary
  FOR EACH ROW
  EXECUTE FUNCTION update_translation_updated_at();

-- Enable RLS on all tables
ALTER TABLE translation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_glossary ENABLE ROW LEVEL SECURITY;

-- RLS policies for translation_history
CREATE POLICY "Users can view their own translation history"
  ON translation_history
  FOR SELECT
  USING (auth.uid() = translated_by_user_id);

CREATE POLICY "Users can insert their own translations"
  ON translation_history
  FOR INSERT
  WITH CHECK (auth.uid() = translated_by_user_id);

CREATE POLICY "Users can update their own translations"
  ON translation_history
  FOR UPDATE
  USING (auth.uid() = translated_by_user_id);

-- RLS policies for translation_preferences
CREATE POLICY "Users can view their own preferences"
  ON translation_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON translation_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON translation_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for translation_glossary (read-only for all, write for admins)
CREATE POLICY "Everyone can view glossary"
  ON translation_glossary
  FOR SELECT
  USING (TRUE);

-- Create function to get translation suggestions from glossary
CREATE OR REPLACE FUNCTION get_glossary_suggestions(
  p_text TEXT,
  p_source_language TEXT DEFAULT 'en',
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  term_source TEXT,
  term_target TEXT,
  category TEXT,
  is_proper_noun BOOLEAN,
  match_score NUMERIC
) AS $$
BEGIN
  IF p_source_language = 'en' THEN
    RETURN QUERY
    SELECT
      g.term_en AS term_source,
      g.term_ar AS term_target,
      g.category,
      g.is_proper_noun,
      similarity(p_text, g.term_en) AS match_score
    FROM translation_glossary g
    WHERE p_text ILIKE '%' || g.term_en || '%'
       OR similarity(p_text, g.term_en) > 0.3
    ORDER BY g.priority DESC, similarity(p_text, g.term_en) DESC
    LIMIT p_limit;
  ELSE
    RETURN QUERY
    SELECT
      g.term_ar AS term_source,
      g.term_en AS term_target,
      g.category,
      g.is_proper_noun,
      similarity(p_text, g.term_ar) AS match_score
    FROM translation_glossary g
    WHERE p_text ILIKE '%' || g.term_ar || '%'
       OR similarity(p_text, g.term_ar) > 0.3
    ORDER BY g.priority DESC, similarity(p_text, g.term_ar) DESC
    LIMIT p_limit;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to get recent translations for an entity
CREATE OR REPLACE FUNCTION get_entity_translations(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  field_name TEXT,
  source_language TEXT,
  target_language TEXT,
  original_text TEXT,
  translated_text TEXT,
  edited_text TEXT,
  confidence NUMERIC,
  approved BOOLEAN,
  created_at TIMESTAMPTZ,
  translated_by_user_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    th.id,
    th.field_name,
    th.source_language,
    th.target_language,
    th.original_text,
    th.translated_text,
    th.edited_text,
    th.confidence,
    th.approved,
    th.created_at,
    th.translated_by_user_id
  FROM translation_history th
  WHERE th.entity_type = p_entity_type
    AND th.entity_id = p_entity_id
  ORDER BY th.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comments for documentation
COMMENT ON TABLE translation_history IS 'Stores history of all AI-assisted translations for audit and improvement';
COMMENT ON TABLE translation_preferences IS 'User preferences for translation behavior';
COMMENT ON TABLE translation_glossary IS 'Domain-specific terminology for consistent translations';
COMMENT ON FUNCTION get_glossary_suggestions IS 'Returns matching glossary terms for a given text';
COMMENT ON FUNCTION get_entity_translations IS 'Returns translation history for a specific entity';
