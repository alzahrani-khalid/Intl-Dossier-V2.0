-- ============================================================================
-- Migration: Government Decisions
-- Date: 2026-02-06
-- Feature: use-case-repository
-- Description: Track cabinet resolutions, royal decrees, and ministerial orders
-- Covers: UC-004, UC-005, UC-032
-- ============================================================================

-- ============================================================================
-- PART 1: Create government_decisions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS government_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Decision type classification
  decision_type TEXT NOT NULL CHECK (decision_type IN (
    'cabinet_resolution',   -- قرار مجلس الوزراء
    'royal_decree',         -- مرسوم ملكي
    'royal_order',          -- أمر ملكي
    'ministerial_order',    -- قرار وزاري
    'ministerial_circular', -- تعميم وزاري
    'council_decision'      -- قرار مجلس (other councils)
  )),

  -- Reference information
  reference_number TEXT NOT NULL,
  reference_number_ar TEXT, -- Arabic reference if different

  -- Titles (bilingual)
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,

  -- Decision dates (both calendars)
  decision_date DATE NOT NULL,
  decision_date_hijri TEXT, -- e.g., "1447-06-15"

  -- Publication dates if applicable
  published_date DATE,
  published_date_hijri TEXT,
  gazette_reference TEXT, -- Official gazette reference

  -- Content
  summary_en TEXT,
  summary_ar TEXT,
  full_text_en TEXT,
  full_text_ar TEXT,

  -- Linked entities (polymorphic relationships)
  related_mou_id UUID REFERENCES mous(id) ON DELETE SET NULL,
  related_dossier_id UUID REFERENCES dossiers(id) ON DELETE SET NULL,
  related_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Document storage
  document_url TEXT,
  document_url_ar TEXT, -- Arabic version if separate

  -- Status and classification
  status TEXT DEFAULT 'active' CHECK (status IN (
    'draft',      -- Not yet finalized
    'active',     -- Currently in effect
    'amended',    -- Modified by later decision
    'superseded', -- Replaced by newer decision
    'revoked'     -- Explicitly cancelled
  )),
  sensitivity_level TEXT DEFAULT 'internal' CHECK (sensitivity_level IN (
    'public',
    'internal',
    'confidential',
    'secret'
  )),

  -- Amendment tracking
  superseded_by_id UUID REFERENCES government_decisions(id) ON DELETE SET NULL,
  amends_id UUID REFERENCES government_decisions(id) ON DELETE SET NULL,

  -- Metadata
  issuing_authority_en TEXT,
  issuing_authority_ar TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  _version INTEGER DEFAULT 1,

  -- Ensure unique reference per type
  CONSTRAINT unique_decision_reference UNIQUE (decision_type, reference_number)
);

-- ============================================================================
-- PART 2: Create decision_affected_entities junction table
-- ============================================================================

-- For tracking multiple entities affected by a decision
CREATE TABLE IF NOT EXISTS decision_affected_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES government_decisions(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'country',
    'organization',
    'mou',
    'dossier',
    'person'
  )),
  entity_id UUID NOT NULL,
  effect_type TEXT CHECK (effect_type IN (
    'authorized',   -- Grants authorization
    'implemented',  -- Implementation required
    'ratified',     -- Ratifies/approves
    'amended',      -- Modifies existing
    'terminated',   -- Ends/cancels
    'referenced'    -- Simply referenced
  )),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_decision_entity UNIQUE (decision_id, entity_type, entity_id)
);

-- ============================================================================
-- PART 3: Create indexes for performance
-- ============================================================================

-- Primary indexes
CREATE INDEX idx_govt_decisions_type ON government_decisions(decision_type);
CREATE INDEX idx_govt_decisions_date ON government_decisions(decision_date DESC);
CREATE INDEX idx_govt_decisions_reference ON government_decisions(reference_number);
CREATE INDEX idx_govt_decisions_status ON government_decisions(status) WHERE status = 'active';

-- Related entity indexes
CREATE INDEX idx_govt_decisions_mou ON government_decisions(related_mou_id)
  WHERE related_mou_id IS NOT NULL;
CREATE INDEX idx_govt_decisions_dossier ON government_decisions(related_dossier_id)
  WHERE related_dossier_id IS NOT NULL;
CREATE INDEX idx_govt_decisions_org ON government_decisions(related_organization_id)
  WHERE related_organization_id IS NOT NULL;

-- Amendment chain indexes
CREATE INDEX idx_govt_decisions_superseded ON government_decisions(superseded_by_id)
  WHERE superseded_by_id IS NOT NULL;
CREATE INDEX idx_govt_decisions_amends ON government_decisions(amends_id)
  WHERE amends_id IS NOT NULL;

-- Full-text search indexes
CREATE INDEX idx_govt_decisions_search_en ON government_decisions
  USING gin(to_tsvector('english', COALESCE(title_en, '') || ' ' || COALESCE(summary_en, '')));
CREATE INDEX idx_govt_decisions_search_ar ON government_decisions
  USING gin(to_tsvector('arabic', COALESCE(title_ar, '') || ' ' || COALESCE(summary_ar, '')));

-- Tags index
CREATE INDEX idx_govt_decisions_tags ON government_decisions USING gin(tags);

-- Affected entities indexes
CREATE INDEX idx_decision_affected_decision ON decision_affected_entities(decision_id);
CREATE INDEX idx_decision_affected_entity ON decision_affected_entities(entity_type, entity_id);

-- ============================================================================
-- PART 4: Triggers
-- ============================================================================

-- Update timestamp trigger
CREATE TRIGGER update_govt_decisions_updated_at
  BEFORE UPDATE ON government_decisions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Version increment trigger
CREATE OR REPLACE FUNCTION increment_govt_decision_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW._version = OLD._version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_govt_decision_version
  BEFORE UPDATE ON government_decisions
  FOR EACH ROW
  EXECUTE FUNCTION increment_govt_decision_version();

-- ============================================================================
-- PART 5: RLS Policies
-- ============================================================================

ALTER TABLE government_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_affected_entities ENABLE ROW LEVEL SECURITY;

-- View policy based on sensitivity level
CREATE POLICY "Users can view government decisions based on clearance"
  ON government_decisions FOR SELECT
  USING (
    sensitivity_level = 'public'
    OR (
      auth.uid() IS NOT NULL
      AND deleted_at IS NULL
    )
  );

-- Insert policy: Authenticated users
CREATE POLICY "Authenticated users can create decisions"
  ON government_decisions FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
  );

-- Update policy: Creator can update
CREATE POLICY "Creator can update decisions"
  ON government_decisions FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Soft delete policy: Creator can soft delete
CREATE POLICY "Creator can soft delete decisions"
  ON government_decisions FOR UPDATE
  USING (
    created_by = auth.uid()
    AND deleted_at IS NULL
  );

-- Affected entities policies
CREATE POLICY "Users can view affected entities"
  ON decision_affected_entities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM government_decisions gd
      WHERE gd.id = decision_affected_entities.decision_id
      AND gd.deleted_at IS NULL
    )
  );

CREATE POLICY "Authenticated users can manage affected entities"
  ON decision_affected_entities FOR ALL
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PART 6: Helper Functions
-- ============================================================================

-- Function: Get decisions by type with pagination
CREATE OR REPLACE FUNCTION get_government_decisions(
  p_decision_type TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'active',
  p_from_date DATE DEFAULT NULL,
  p_to_date DATE DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  decision_type TEXT,
  reference_number TEXT,
  title_en TEXT,
  title_ar TEXT,
  decision_date DATE,
  decision_date_hijri TEXT,
  status TEXT,
  summary_en TEXT,
  summary_ar TEXT,
  affected_entities_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gd.id,
    gd.decision_type,
    gd.reference_number,
    gd.title_en,
    gd.title_ar,
    gd.decision_date,
    gd.decision_date_hijri,
    gd.status,
    gd.summary_en,
    gd.summary_ar,
    (SELECT COUNT(*) FROM decision_affected_entities dae WHERE dae.decision_id = gd.id) as affected_entities_count
  FROM government_decisions gd
  WHERE gd.deleted_at IS NULL
    AND (p_decision_type IS NULL OR gd.decision_type = p_decision_type)
    AND (p_status IS NULL OR gd.status = p_status)
    AND (p_from_date IS NULL OR gd.decision_date >= p_from_date)
    AND (p_to_date IS NULL OR gd.decision_date <= p_to_date)
  ORDER BY gd.decision_date DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Find decisions affecting an entity
CREATE OR REPLACE FUNCTION find_decisions_by_entity(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  decision_id UUID,
  decision_type TEXT,
  reference_number TEXT,
  title_en TEXT,
  title_ar TEXT,
  decision_date DATE,
  effect_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gd.id as decision_id,
    gd.decision_type,
    gd.reference_number,
    gd.title_en,
    gd.title_ar,
    gd.decision_date,
    dae.effect_type
  FROM decision_affected_entities dae
  JOIN government_decisions gd ON gd.id = dae.decision_id
  WHERE dae.entity_type = p_entity_type
    AND dae.entity_id = p_entity_id
    AND gd.deleted_at IS NULL
  ORDER BY gd.decision_date DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get decision amendment chain (history)
CREATE OR REPLACE FUNCTION get_decision_amendment_chain(p_decision_id UUID)
RETURNS TABLE (
  id UUID,
  decision_type TEXT,
  reference_number TEXT,
  title_en TEXT,
  decision_date DATE,
  status TEXT,
  chain_position INTEGER
) AS $$
WITH RECURSIVE chain AS (
  -- Start with the given decision
  SELECT
    gd.id,
    gd.decision_type,
    gd.reference_number,
    gd.title_en,
    gd.decision_date,
    gd.status,
    gd.amends_id,
    gd.superseded_by_id,
    0 as chain_position
  FROM government_decisions gd
  WHERE gd.id = p_decision_id

  UNION ALL

  -- Find predecessors (what this decision amends)
  SELECT
    gd.id,
    gd.decision_type,
    gd.reference_number,
    gd.title_en,
    gd.decision_date,
    gd.status,
    gd.amends_id,
    gd.superseded_by_id,
    c.chain_position - 1
  FROM government_decisions gd
  JOIN chain c ON c.amends_id = gd.id
  WHERE c.chain_position > -10

  UNION ALL

  -- Find successors (what supersedes this decision)
  SELECT
    gd.id,
    gd.decision_type,
    gd.reference_number,
    gd.title_en,
    gd.decision_date,
    gd.status,
    gd.amends_id,
    gd.superseded_by_id,
    c.chain_position + 1
  FROM government_decisions gd
  JOIN chain c ON gd.amends_id = c.id OR c.superseded_by_id = gd.id
  WHERE c.chain_position < 10
)
SELECT DISTINCT
  chain.id,
  chain.decision_type,
  chain.reference_number,
  chain.title_en,
  chain.decision_date,
  chain.status,
  chain.chain_position
FROM chain
ORDER BY chain_position;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- PART 7: Grants
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON government_decisions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON decision_affected_entities TO authenticated;
GRANT EXECUTE ON FUNCTION get_government_decisions(TEXT, TEXT, DATE, DATE, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION find_decisions_by_entity(TEXT, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_decision_amendment_chain(UUID) TO authenticated;

-- ============================================================================
-- PART 8: Comments
-- ============================================================================

COMMENT ON TABLE government_decisions IS 'Cabinet resolutions, royal decrees, ministerial orders and other government decisions';
COMMENT ON TABLE decision_affected_entities IS 'Junction table linking government decisions to affected entities';
COMMENT ON COLUMN government_decisions.decision_date_hijri IS 'Decision date in Hijri calendar format (YYYY-MM-DD)';
COMMENT ON COLUMN government_decisions.gazette_reference IS 'Reference to official gazette where decision was published';
COMMENT ON FUNCTION get_government_decisions IS 'List government decisions with filters and pagination';
COMMENT ON FUNCTION find_decisions_by_entity IS 'Find all government decisions affecting a specific entity';
COMMENT ON FUNCTION get_decision_amendment_chain IS 'Get the full amendment/supersession chain for a decision';

-- ============================================================================
-- Migration Complete
-- ============================================================================
