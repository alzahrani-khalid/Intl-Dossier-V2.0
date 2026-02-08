-- ============================================================================
-- Migration: MoU Multi-Party Support
-- Date: 2026-02-06
-- Feature: use-case-repository
-- Description: Support multiple parties in MoUs and track lifecycle stages
-- Covers: UC-003, UC-004, UC-030, UC-031
-- ============================================================================

-- ============================================================================
-- PART 1: Add lifecycle stage and government approval fields to mous
-- ============================================================================

-- Add lifecycle stage for comprehensive tracking
ALTER TABLE mous ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'draft'
  CHECK (lifecycle_stage IN (
    'draft',            -- Initial creation
    'negotiation',      -- Under negotiation
    'legal_review',     -- Legal department review
    'signed',           -- Signed by parties
    'cabinet_pending',  -- Awaiting cabinet approval
    'cabinet_approved', -- Cabinet has approved
    'ratification',     -- In ratification process
    'ratified',         -- Officially ratified
    'in_force',         -- Currently active/binding
    'expired',          -- Passed expiry date
    'terminated',       -- Explicitly terminated
    'superseded'        -- Replaced by newer agreement
  ));

-- Government approval references
ALTER TABLE mous ADD COLUMN IF NOT EXISTS cabinet_decision_ref TEXT;
ALTER TABLE mous ADD COLUMN IF NOT EXISTS cabinet_decision_date DATE;
ALTER TABLE mous ADD COLUMN IF NOT EXISTS royal_decree_ref TEXT;
ALTER TABLE mous ADD COLUMN IF NOT EXISTS royal_decree_date DATE;
ALTER TABLE mous ADD COLUMN IF NOT EXISTS royal_decree_date_hijri TEXT;

-- Superseded by tracking
ALTER TABLE mous ADD COLUMN IF NOT EXISTS superseded_by_id UUID REFERENCES mous(id) ON DELETE SET NULL;
ALTER TABLE mous ADD COLUMN IF NOT EXISTS supersedes_id UUID REFERENCES mous(id) ON DELETE SET NULL;

COMMENT ON COLUMN mous.lifecycle_stage IS 'Current stage in MoU lifecycle from draft to in_force/terminated';
COMMENT ON COLUMN mous.cabinet_decision_ref IS 'Reference number of cabinet decision approving MoU';
COMMENT ON COLUMN mous.cabinet_decision_date IS 'Date of cabinet approval';
COMMENT ON COLUMN mous.royal_decree_ref IS 'Reference number of royal decree (for treaties requiring ratification)';
COMMENT ON COLUMN mous.royal_decree_date IS 'Date of royal decree (Gregorian)';
COMMENT ON COLUMN mous.royal_decree_date_hijri IS 'Date of royal decree (Hijri calendar)';
COMMENT ON COLUMN mous.superseded_by_id IS 'ID of newer MoU that supersedes this one';
COMMENT ON COLUMN mous.supersedes_id IS 'ID of older MoU that this one supersedes';

-- ============================================================================
-- PART 2: Create mou_parties table for multi-party agreements
-- ============================================================================

CREATE TABLE IF NOT EXISTS mou_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mou_id UUID NOT NULL REFERENCES mous(id) ON DELETE CASCADE,
  -- Party can be a country or organization
  party_type TEXT NOT NULL CHECK (party_type IN ('country', 'organization')),
  party_id UUID NOT NULL,
  -- Role in the agreement
  role TEXT DEFAULT 'signatory' CHECK (role IN (
    'signatory',      -- Full party to the agreement
    'witness',        -- Witnessing party
    'guarantor',      -- Guarantor of the agreement
    'observer',       -- Observer (not bound)
    'implementing'    -- Implementation partner
  )),
  -- Signing details
  signed_at TIMESTAMPTZ,
  signed_at_hijri TEXT,
  signed_by_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  signed_by_name TEXT, -- For external signatories not in system
  signed_by_title_en TEXT,
  signed_by_title_ar TEXT,
  -- Status tracking
  party_status TEXT DEFAULT 'pending' CHECK (party_status IN (
    'pending',    -- Not yet signed
    'signed',     -- Has signed
    'ratified',   -- Has ratified (if required)
    'withdrawn'   -- Has withdrawn from agreement
  )),
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Ensure unique party per MoU per role
  CONSTRAINT unique_mou_party_role UNIQUE (mou_id, party_type, party_id, role)
);

-- ============================================================================
-- PART 3: Create indexes for performance
-- ============================================================================

CREATE INDEX idx_mou_parties_mou ON mou_parties(mou_id);
CREATE INDEX idx_mou_parties_party ON mou_parties(party_type, party_id);
CREATE INDEX idx_mou_parties_status ON mou_parties(party_status);
CREATE INDEX idx_mou_parties_signed_by ON mou_parties(signed_by_person_id)
  WHERE signed_by_person_id IS NOT NULL;

-- Indexes on mous new columns
CREATE INDEX idx_mous_lifecycle_stage ON mous(lifecycle_stage);
CREATE INDEX idx_mous_cabinet_decision ON mous(cabinet_decision_ref)
  WHERE cabinet_decision_ref IS NOT NULL;
CREATE INDEX idx_mous_royal_decree ON mous(royal_decree_ref)
  WHERE royal_decree_ref IS NOT NULL;
CREATE INDEX idx_mous_superseded_by ON mous(superseded_by_id)
  WHERE superseded_by_id IS NOT NULL;

-- ============================================================================
-- PART 4: Trigger to update updated_at
-- ============================================================================

CREATE TRIGGER update_mou_parties_updated_at
  BEFORE UPDATE ON mou_parties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 5: RLS Policies
-- ============================================================================

ALTER TABLE mou_parties ENABLE ROW LEVEL SECURITY;

-- View policy: Users can view parties of MoUs they can access
CREATE POLICY "Users can view MoU parties"
  ON mou_parties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mous m
      WHERE m.id = mou_parties.mou_id
    )
  );

-- Insert policy: Authenticated users can add parties
CREATE POLICY "Authenticated users can add MoU parties"
  ON mou_parties FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
  );

-- Update policy: Creator or MoU owner can update
CREATE POLICY "MoU owner can update parties"
  ON mou_parties FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM mous m
      WHERE m.id = mou_parties.mou_id
      AND m.owner_id = auth.uid()
    )
  );

-- Delete policy: Creator or MoU owner can delete
CREATE POLICY "MoU owner can delete parties"
  ON mou_parties FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM mous m
      WHERE m.id = mou_parties.mou_id
      AND m.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- PART 6: Helper Functions
-- ============================================================================

-- Function: Get all parties for an MoU with entity details
CREATE OR REPLACE FUNCTION get_mou_parties(p_mou_id UUID)
RETURNS TABLE (
  party_id UUID,
  party_type TEXT,
  entity_id UUID,
  entity_name_en TEXT,
  entity_name_ar TEXT,
  role TEXT,
  party_status TEXT,
  signed_at TIMESTAMPTZ,
  signed_by_name TEXT,
  signed_by_title_en TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mp.id as party_id,
    mp.party_type,
    mp.party_id as entity_id,
    CASE
      WHEN mp.party_type = 'country' THEN c.name_en
      WHEN mp.party_type = 'organization' THEN o.name_en
      ELSE NULL
    END as entity_name_en,
    CASE
      WHEN mp.party_type = 'country' THEN c.name_ar
      WHEN mp.party_type = 'organization' THEN o.name_ar
      ELSE NULL
    END as entity_name_ar,
    mp.role,
    mp.party_status,
    mp.signed_at,
    COALESCE(mp.signed_by_name, d.name_en) as signed_by_name,
    mp.signed_by_title_en
  FROM mou_parties mp
  LEFT JOIN countries c ON mp.party_type = 'country' AND mp.party_id = c.id
  LEFT JOIN organizations o ON mp.party_type = 'organization' AND mp.party_id = o.id
  LEFT JOIN persons p ON mp.signed_by_person_id = p.id
  LEFT JOIN dossiers d ON p.id = d.id
  WHERE mp.mou_id = p_mou_id
  ORDER BY
    CASE mp.role WHEN 'signatory' THEN 1 WHEN 'witness' THEN 2 WHEN 'guarantor' THEN 3 ELSE 4 END,
    mp.created_at;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Find MoUs by party (country or organization)
CREATE OR REPLACE FUNCTION find_mous_by_party(
  p_party_type TEXT,
  p_party_id UUID,
  p_lifecycle_stage TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  mou_id UUID,
  reference_number TEXT,
  title_en TEXT,
  title_ar TEXT,
  lifecycle_stage TEXT,
  role TEXT,
  party_status TEXT,
  effective_date DATE,
  expiry_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id as mou_id,
    m.reference_number,
    m.title_en,
    m.title_ar,
    m.lifecycle_stage,
    mp.role,
    mp.party_status,
    m.effective_date,
    m.expiry_date
  FROM mou_parties mp
  JOIN mous m ON m.id = mp.mou_id
  WHERE mp.party_type = p_party_type
    AND mp.party_id = p_party_id
    AND (p_lifecycle_stage IS NULL OR m.lifecycle_stage = p_lifecycle_stage)
  ORDER BY m.effective_date DESC NULLS LAST, m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Update MoU lifecycle stage with validation
CREATE OR REPLACE FUNCTION update_mou_lifecycle(
  p_mou_id UUID,
  p_new_stage TEXT,
  p_cabinet_ref TEXT DEFAULT NULL,
  p_cabinet_date DATE DEFAULT NULL,
  p_royal_ref TEXT DEFAULT NULL,
  p_royal_date DATE DEFAULT NULL,
  p_royal_date_hijri TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_stage TEXT;
BEGIN
  -- Get current stage
  SELECT lifecycle_stage INTO v_current_stage
  FROM mous WHERE id = p_mou_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'MoU not found: %', p_mou_id;
  END IF;

  -- Update with new stage and optional government references
  UPDATE mous SET
    lifecycle_stage = p_new_stage,
    cabinet_decision_ref = COALESCE(p_cabinet_ref, cabinet_decision_ref),
    cabinet_decision_date = COALESCE(p_cabinet_date, cabinet_decision_date),
    royal_decree_ref = COALESCE(p_royal_ref, royal_decree_ref),
    royal_decree_date = COALESCE(p_royal_date, royal_decree_date),
    royal_decree_date_hijri = COALESCE(p_royal_date_hijri, royal_decree_date_hijri)
  WHERE id = p_mou_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 7: Grants
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON mou_parties TO authenticated;
GRANT EXECUTE ON FUNCTION get_mou_parties(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION find_mous_by_party(TEXT, UUID, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_mou_lifecycle(UUID, TEXT, TEXT, DATE, TEXT, DATE, TEXT) TO authenticated;

-- ============================================================================
-- PART 8: Comments
-- ============================================================================

COMMENT ON TABLE mou_parties IS 'Tracks multiple parties (countries/organizations) in MoU agreements with signing status';
COMMENT ON FUNCTION get_mou_parties(UUID) IS 'Get all parties for an MoU with entity details and signing status';
COMMENT ON FUNCTION find_mous_by_party IS 'Find all MoUs where a country/organization is a party';
COMMENT ON FUNCTION update_mou_lifecycle IS 'Update MoU lifecycle stage with optional government approval references';

-- ============================================================================
-- Migration Complete
-- ============================================================================
