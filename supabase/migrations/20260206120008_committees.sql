-- ============================================================================
-- Migration: Committees & Nominations
-- Date: 2026-02-06
-- Feature: use-case-repository
-- Description: Committee tracking with nominations and membership workflow
-- Covers: UC-006, UC-007, UC-008, UC-037
-- ============================================================================

-- ============================================================================
-- PART 1: Create committees table
-- ============================================================================

CREATE TABLE IF NOT EXISTS committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent association (forum or organization)
  forum_id UUID REFERENCES forums(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Committee type
  committee_type TEXT NOT NULL CHECK (committee_type IN (
    'jury',           -- Award jury/selection committee
    'steering',       -- Steering committee
    'technical',      -- Technical committee
    'advisory',       -- Advisory board
    'executive',      -- Executive committee
    'working',        -- Working committee
    'drafting',       -- Document drafting committee
    'credentials',    -- Credentials committee
    'budget',         -- Budget/finance committee
    'nominations',    -- Nominations committee
    'ethics',         -- Ethics committee
    'audit',          -- Audit committee
    'other'           -- Other type
  )),

  -- Committee details (bilingual)
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  mandate_en TEXT, -- Committee's mandate/terms of reference
  mandate_ar TEXT,

  -- Membership details
  member_count INTEGER, -- Target/max number of members
  current_member_count INTEGER DEFAULT 0,
  min_members INTEGER,
  max_members INTEGER,

  -- Term information
  term_start DATE,
  term_end DATE,
  term_duration_months INTEGER,
  is_renewable BOOLEAN DEFAULT true,

  -- Meeting schedule
  meeting_frequency TEXT CHECK (meeting_frequency IN (
    'weekly', 'biweekly', 'monthly', 'quarterly', 'biannual', 'annual', 'ad_hoc'
  )),
  next_meeting_date DATE,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN (
    'forming',        -- Being formed
    'active',         -- Currently active
    'suspended',      -- Temporarily suspended
    'dissolved',      -- Permanently dissolved
    'reconstituting'  -- Being reconstituted
  )),

  -- Documents
  charter_url TEXT,
  documents JSONB DEFAULT '[]',

  -- Contact
  secretariat_email TEXT,
  secretariat_contact TEXT,

  -- Metadata
  is_standing BOOLEAN DEFAULT true, -- Standing vs ad-hoc committee
  is_public BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  _version INTEGER DEFAULT 1,

  -- Ensure parent association
  CONSTRAINT has_parent CHECK (forum_id IS NOT NULL OR organization_id IS NOT NULL)
);

-- ============================================================================
-- PART 2: Create committee_nominations table
-- ============================================================================

CREATE TABLE IF NOT EXISTS committee_nominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,

  -- Nominee (person in system or external)
  nominated_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  nominee_name_en TEXT,
  nominee_name_ar TEXT,
  nominee_title_en TEXT,
  nominee_title_ar TEXT,
  nominee_bio_en TEXT,
  nominee_bio_ar TEXT,
  nominee_email TEXT,
  nominee_phone TEXT,

  -- Nominating entity
  nominated_by_type TEXT NOT NULL CHECK (nominated_by_type IN ('organization', 'country', 'person', 'self')),
  nominated_by_id UUID,
  nominated_by_name_en TEXT,
  nominated_by_name_ar TEXT,

  -- Nomination details
  nomination_date DATE NOT NULL,
  nomination_letter_url TEXT,
  justification_en TEXT,
  justification_ar TEXT,

  -- Role being nominated for
  role TEXT DEFAULT 'member' CHECK (role IN (
    'chair',          -- Committee chair
    'vice_chair',     -- Vice chair
    'member',         -- Regular member
    'alternate',      -- Alternate member
    'observer',       -- Observer (non-voting)
    'secretary',      -- Committee secretary
    'rapporteur'      -- Rapporteur
  )),

  -- Term requested
  requested_term_start DATE,
  requested_term_end DATE,

  -- Status workflow
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',        -- Awaiting review
    'under_review',   -- Being reviewed
    'shortlisted',    -- Shortlisted for final selection
    'approved',       -- Approved
    'rejected',       -- Rejected
    'withdrawn',      -- Withdrawn by nominator
    'expired'         -- Deadline passed without decision
  )),
  status_reason TEXT, -- Reason for status (especially rejection)
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,

  -- If approved, actual membership record
  membership_id UUID, -- Will reference committee_members

  -- Supporting documents
  cv_url TEXT,
  supporting_documents JSONB DEFAULT '[]',

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================================
-- PART 3: Create committee_members table
-- ============================================================================

CREATE TABLE IF NOT EXISTS committee_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,

  -- Member details
  person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  member_name_en TEXT NOT NULL,
  member_name_ar TEXT NOT NULL,
  member_title_en TEXT,
  member_title_ar TEXT,

  -- Representing entity
  representing_type TEXT CHECK (representing_type IN ('organization', 'country', 'self')),
  representing_id UUID,
  representing_name_en TEXT,
  representing_name_ar TEXT,

  -- Role and position
  role TEXT DEFAULT 'member' CHECK (role IN (
    'chair', 'vice_chair', 'member', 'alternate', 'observer', 'secretary', 'rapporteur'
  )),

  -- Term
  term_start DATE NOT NULL,
  term_end DATE,
  is_current BOOLEAN DEFAULT true,

  -- Nomination reference
  nomination_id UUID REFERENCES committee_nominations(id) ON DELETE SET NULL,

  -- Participation tracking
  meetings_attended INTEGER DEFAULT 0,
  meetings_total INTEGER DEFAULT 0,
  last_attendance DATE,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active',         -- Active member
    'on_leave',       -- On leave
    'suspended',      -- Membership suspended
    'resigned',       -- Resigned
    'removed',        -- Removed
    'term_ended'      -- Term completed
  )),
  status_reason TEXT,
  status_effective_date DATE,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Ensure unique active membership per committee
  CONSTRAINT unique_active_member UNIQUE (committee_id, person_id) WHERE is_current = true
);

-- ============================================================================
-- PART 4: Create indexes for performance
-- ============================================================================

-- Committees indexes
CREATE INDEX idx_committees_forum ON committees(forum_id) WHERE forum_id IS NOT NULL;
CREATE INDEX idx_committees_organization ON committees(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_committees_type ON committees(committee_type);
CREATE INDEX idx_committees_status ON committees(status);
CREATE INDEX idx_committees_active ON committees(forum_id, organization_id)
  WHERE status = 'active' AND deleted_at IS NULL;

-- Nominations indexes
CREATE INDEX idx_committee_nominations_committee ON committee_nominations(committee_id);
CREATE INDEX idx_committee_nominations_person ON committee_nominations(nominated_person_id)
  WHERE nominated_person_id IS NOT NULL;
CREATE INDEX idx_committee_nominations_nominator ON committee_nominations(nominated_by_type, nominated_by_id);
CREATE INDEX idx_committee_nominations_status ON committee_nominations(status);
CREATE INDEX idx_committee_nominations_pending ON committee_nominations(committee_id)
  WHERE status = 'pending';

-- Members indexes
CREATE INDEX idx_committee_members_committee ON committee_members(committee_id);
CREATE INDEX idx_committee_members_person ON committee_members(person_id)
  WHERE person_id IS NOT NULL;
CREATE INDEX idx_committee_members_current ON committee_members(committee_id)
  WHERE is_current = true AND status = 'active';
CREATE INDEX idx_committee_members_representing ON committee_members(representing_type, representing_id);

-- ============================================================================
-- PART 5: Triggers
-- ============================================================================

-- Update timestamp triggers
CREATE TRIGGER update_committees_updated_at
  BEFORE UPDATE ON committees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_committee_nominations_updated_at
  BEFORE UPDATE ON committee_nominations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_committee_members_updated_at
  BEFORE UPDATE ON committee_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Version increment for committees
CREATE OR REPLACE FUNCTION increment_committees_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW._version = OLD._version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_committees_version
  BEFORE UPDATE ON committees
  FOR EACH ROW
  EXECUTE FUNCTION increment_committees_version();

-- Update committee member count
CREATE OR REPLACE FUNCTION update_committee_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE committees
    SET current_member_count = (
      SELECT COUNT(*) FROM committee_members
      WHERE committee_id = NEW.committee_id
      AND is_current = true
      AND status = 'active'
    )
    WHERE id = NEW.committee_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    UPDATE committees
    SET current_member_count = (
      SELECT COUNT(*) FROM committee_members
      WHERE committee_id = OLD.committee_id
      AND is_current = true
      AND status = 'active'
    )
    WHERE id = OLD.committee_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_member_count
  AFTER INSERT OR UPDATE OR DELETE ON committee_members
  FOR EACH ROW
  EXECUTE FUNCTION update_committee_member_count();

-- ============================================================================
-- PART 6: RLS Policies
-- ============================================================================

ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;

-- Committees policies
CREATE POLICY "Users can view committees"
  ON committees FOR SELECT
  USING (deleted_at IS NULL AND (is_public = true OR auth.uid() IS NOT NULL));

CREATE POLICY "Authenticated users can create committees"
  ON committees FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Creator can update committees"
  ON committees FOR UPDATE
  USING (created_by = auth.uid());

-- Nominations policies
CREATE POLICY "Users can view nominations"
  ON committee_nominations FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create nominations"
  ON committee_nominations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Creator can update nominations"
  ON committee_nominations FOR UPDATE
  USING (created_by = auth.uid());

-- Members policies
CREATE POLICY "Users can view members"
  ON committee_members FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage members"
  ON committee_members FOR ALL
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PART 7: Helper Functions
-- ============================================================================

-- Function: Get committee with members
CREATE OR REPLACE FUNCTION get_committee_details(p_committee_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'committee', (
      SELECT row_to_json(c)
      FROM committees c
      WHERE c.id = p_committee_id AND c.deleted_at IS NULL
    ),
    'members', (
      SELECT json_agg(row_to_json(m) ORDER BY
        CASE m.role WHEN 'chair' THEN 1 WHEN 'vice_chair' THEN 2 ELSE 3 END,
        m.term_start
      )
      FROM committee_members m
      WHERE m.committee_id = p_committee_id
      AND m.is_current = true
      AND m.status = 'active'
    ),
    'pending_nominations', (
      SELECT COUNT(*)
      FROM committee_nominations n
      WHERE n.committee_id = p_committee_id
      AND n.status = 'pending'
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get pending nominations for a committee
CREATE OR REPLACE FUNCTION get_pending_nominations(
  p_committee_id UUID,
  p_status TEXT DEFAULT 'pending'
)
RETURNS TABLE (
  id UUID,
  nominee_name_en TEXT,
  nominee_name_ar TEXT,
  nominee_title_en TEXT,
  nominated_by_name_en TEXT,
  role TEXT,
  nomination_date DATE,
  status TEXT,
  justification_en TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cn.id,
    COALESCE(d.name_en, cn.nominee_name_en) as nominee_name_en,
    COALESCE(d.name_ar, cn.nominee_name_ar) as nominee_name_ar,
    COALESCE(p.title_en, cn.nominee_title_en) as nominee_title_en,
    cn.nominated_by_name_en,
    cn.role,
    cn.nomination_date,
    cn.status,
    cn.justification_en
  FROM committee_nominations cn
  LEFT JOIN persons p ON cn.nominated_person_id = p.id
  LEFT JOIN dossiers d ON p.id = d.id
  WHERE cn.committee_id = p_committee_id
    AND (p_status IS NULL OR cn.status = p_status)
  ORDER BY cn.nomination_date DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get person's committee memberships
CREATE OR REPLACE FUNCTION get_person_committee_memberships(
  p_person_id UUID,
  p_include_past BOOLEAN DEFAULT false
)
RETURNS TABLE (
  membership_id UUID,
  committee_id UUID,
  committee_name_en TEXT,
  committee_type TEXT,
  role TEXT,
  term_start DATE,
  term_end DATE,
  is_current BOOLEAN,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.id as membership_id,
    cm.committee_id,
    c.name_en as committee_name_en,
    c.committee_type,
    cm.role,
    cm.term_start,
    cm.term_end,
    cm.is_current,
    cm.status
  FROM committee_members cm
  JOIN committees c ON cm.committee_id = c.id
  WHERE cm.person_id = p_person_id
    AND c.deleted_at IS NULL
    AND (p_include_past = true OR cm.is_current = true)
  ORDER BY cm.is_current DESC, cm.term_start DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Approve nomination and create membership
CREATE OR REPLACE FUNCTION approve_nomination(
  p_nomination_id UUID,
  p_term_start DATE DEFAULT CURRENT_DATE,
  p_term_end DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_nomination committee_nominations%ROWTYPE;
  v_membership_id UUID;
BEGIN
  -- Get nomination details
  SELECT * INTO v_nomination
  FROM committee_nominations
  WHERE id = p_nomination_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nomination not found: %', p_nomination_id;
  END IF;

  IF v_nomination.status != 'pending' AND v_nomination.status != 'under_review' AND v_nomination.status != 'shortlisted' THEN
    RAISE EXCEPTION 'Nomination is not in a reviewable status: %', v_nomination.status;
  END IF;

  -- Create membership record
  INSERT INTO committee_members (
    committee_id,
    person_id,
    member_name_en,
    member_name_ar,
    member_title_en,
    member_title_ar,
    representing_type,
    representing_id,
    representing_name_en,
    representing_name_ar,
    role,
    term_start,
    term_end,
    nomination_id,
    created_by
  ) VALUES (
    v_nomination.committee_id,
    v_nomination.nominated_person_id,
    COALESCE(v_nomination.nominee_name_en, ''),
    COALESCE(v_nomination.nominee_name_ar, ''),
    v_nomination.nominee_title_en,
    v_nomination.nominee_title_ar,
    v_nomination.nominated_by_type,
    v_nomination.nominated_by_id,
    v_nomination.nominated_by_name_en,
    v_nomination.nominated_by_name_ar,
    v_nomination.role,
    p_term_start,
    p_term_end,
    p_nomination_id,
    auth.uid()
  )
  RETURNING id INTO v_membership_id;

  -- Update nomination status
  UPDATE committee_nominations
  SET status = 'approved',
      membership_id = v_membership_id,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  WHERE id = p_nomination_id;

  RETURN v_membership_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 8: Grants
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON committees TO authenticated;
GRANT SELECT, INSERT, UPDATE ON committee_nominations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON committee_members TO authenticated;
GRANT EXECUTE ON FUNCTION get_committee_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_nominations(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_person_committee_memberships(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_nomination(UUID, DATE, DATE) TO authenticated;

-- ============================================================================
-- PART 9: Comments
-- ============================================================================

COMMENT ON TABLE committees IS 'Committees, juries, and working groups under forums or organizations';
COMMENT ON TABLE committee_nominations IS 'Nominations for committee membership positions';
COMMENT ON TABLE committee_members IS 'Current and historical committee membership records';
COMMENT ON COLUMN committees.committee_type IS 'Type: jury, steering, technical, advisory, executive, working, etc.';
COMMENT ON COLUMN committee_nominations.status IS 'Status: pending, under_review, shortlisted, approved, rejected, withdrawn, expired';
COMMENT ON COLUMN committee_members.role IS 'Role: chair, vice_chair, member, alternate, observer, secretary, rapporteur';
COMMENT ON FUNCTION get_committee_details IS 'Get committee with current members and pending nominations count';
COMMENT ON FUNCTION get_pending_nominations IS 'Get nominations for a committee filtered by status';
COMMENT ON FUNCTION get_person_committee_memberships IS 'Get all committee memberships for a person';
COMMENT ON FUNCTION approve_nomination IS 'Approve a nomination and create the membership record';

-- ============================================================================
-- Migration Complete
-- ============================================================================
