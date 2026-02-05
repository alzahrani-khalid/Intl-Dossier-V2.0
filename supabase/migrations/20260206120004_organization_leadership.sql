-- ============================================================================
-- Migration: Organization Leadership
-- Date: 2026-02-06
-- Feature: use-case-repository
-- Description: Track leadership changes and history for organizations
-- Covers: UC-011, UC-012, UC-033
-- ============================================================================

-- ============================================================================
-- PART 1: Create organization_leadership table
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_leadership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- The leader (can be a person in our system or external)
  person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  -- For external leaders not in our persons table
  external_name_en TEXT,
  external_name_ar TEXT,

  -- Position details
  position_title_en TEXT NOT NULL,
  position_title_ar TEXT NOT NULL,
  position_level TEXT DEFAULT 'executive' CHECK (position_level IN (
    'head',           -- Top leader (CEO, Minister, President)
    'deputy',         -- Deputy/Vice leader
    'executive',      -- C-level / Director General
    'director',       -- Department head
    'manager',        -- Middle management
    'coordinator'     -- Program/project lead
  )),

  -- Tenure dates
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT true,

  -- Appointment details
  appointment_type TEXT CHECK (appointment_type IN (
    'permanent',
    'acting',
    'interim',
    'elected',
    'appointed',
    'designated'
  )),
  appointment_date DATE,
  appointment_authority_en TEXT, -- Who appointed them
  appointment_authority_ar TEXT,
  appointment_reference TEXT, -- Reference number/decree

  -- Announcement tracking
  announcement_date DATE,
  announcement_source TEXT,
  announcement_url TEXT,

  -- Additional info
  notes_en TEXT,
  notes_ar TEXT,
  achievements TEXT[], -- Key achievements during tenure

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  _version INTEGER DEFAULT 1,

  -- Constraints
  CONSTRAINT valid_leadership_dates CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT current_has_no_end CHECK (is_current = FALSE OR end_date IS NULL),
  CONSTRAINT has_leader CHECK (person_id IS NOT NULL OR external_name_en IS NOT NULL)
);

-- ============================================================================
-- PART 2: Create indexes for performance
-- ============================================================================

-- Primary lookups
CREATE INDEX idx_org_leadership_org ON organization_leadership(organization_id);
CREATE INDEX idx_org_leadership_person ON organization_leadership(person_id)
  WHERE person_id IS NOT NULL;
CREATE INDEX idx_org_leadership_current ON organization_leadership(organization_id)
  WHERE is_current = true AND deleted_at IS NULL;

-- Date-based queries
CREATE INDEX idx_org_leadership_dates ON organization_leadership(start_date DESC, end_date);
CREATE INDEX idx_org_leadership_appointment ON organization_leadership(appointment_date DESC)
  WHERE appointment_date IS NOT NULL;

-- Position level queries
CREATE INDEX idx_org_leadership_level ON organization_leadership(organization_id, position_level);

-- Active leadership view
CREATE INDEX idx_org_leadership_active
  ON organization_leadership(organization_id, position_level, start_date DESC)
  WHERE is_current = true AND deleted_at IS NULL;

-- ============================================================================
-- PART 3: Triggers
-- ============================================================================

-- Update timestamp trigger
CREATE TRIGGER update_org_leadership_updated_at
  BEFORE UPDATE ON organization_leadership
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Version increment trigger
CREATE OR REPLACE FUNCTION increment_org_leadership_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW._version = OLD._version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_org_leadership_version
  BEFORE UPDATE ON organization_leadership
  FOR EACH ROW
  EXECUTE FUNCTION increment_org_leadership_version();

-- Auto-set is_current = false when end_date is set
CREATE OR REPLACE FUNCTION update_leadership_current_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date IS NOT NULL AND OLD.end_date IS NULL THEN
    NEW.is_current = FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_leadership_current_status
  BEFORE UPDATE OF end_date ON organization_leadership
  FOR EACH ROW
  EXECUTE FUNCTION update_leadership_current_status();

-- ============================================================================
-- PART 4: RLS Policies
-- ============================================================================

ALTER TABLE organization_leadership ENABLE ROW LEVEL SECURITY;

-- View policy: Anyone can view non-deleted leadership records
CREATE POLICY "Users can view organization leadership"
  ON organization_leadership FOR SELECT
  USING (deleted_at IS NULL);

-- Insert policy: Authenticated users
CREATE POLICY "Authenticated users can create leadership records"
  ON organization_leadership FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
  );

-- Update policy: Creator can update
CREATE POLICY "Creator can update leadership records"
  ON organization_leadership FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Soft delete policy
CREATE POLICY "Creator can soft delete leadership records"
  ON organization_leadership FOR UPDATE
  USING (created_by = auth.uid());

-- ============================================================================
-- PART 5: Helper Functions
-- ============================================================================

-- Function: Get current leadership for an organization
CREATE OR REPLACE FUNCTION get_current_leadership(p_organization_id UUID)
RETURNS TABLE (
  id UUID,
  person_id UUID,
  leader_name_en TEXT,
  leader_name_ar TEXT,
  position_title_en TEXT,
  position_title_ar TEXT,
  position_level TEXT,
  start_date DATE,
  appointment_type TEXT,
  photo_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ol.id,
    ol.person_id,
    COALESCE(d.name_en, ol.external_name_en) as leader_name_en,
    COALESCE(d.name_ar, ol.external_name_ar) as leader_name_ar,
    ol.position_title_en,
    ol.position_title_ar,
    ol.position_level,
    ol.start_date,
    ol.appointment_type,
    p.photo_url
  FROM organization_leadership ol
  LEFT JOIN persons p ON ol.person_id = p.id
  LEFT JOIN dossiers d ON p.id = d.id
  WHERE ol.organization_id = p_organization_id
    AND ol.is_current = true
    AND ol.deleted_at IS NULL
  ORDER BY
    CASE ol.position_level
      WHEN 'head' THEN 1
      WHEN 'deputy' THEN 2
      WHEN 'executive' THEN 3
      WHEN 'director' THEN 4
      WHEN 'manager' THEN 5
      WHEN 'coordinator' THEN 6
      ELSE 7
    END,
    ol.start_date DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get leadership history for an organization
CREATE OR REPLACE FUNCTION get_leadership_history(
  p_organization_id UUID,
  p_position_level TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  person_id UUID,
  leader_name_en TEXT,
  leader_name_ar TEXT,
  position_title_en TEXT,
  position_title_ar TEXT,
  position_level TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN,
  appointment_type TEXT,
  tenure_days INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ol.id,
    ol.person_id,
    COALESCE(d.name_en, ol.external_name_en) as leader_name_en,
    COALESCE(d.name_ar, ol.external_name_ar) as leader_name_ar,
    ol.position_title_en,
    ol.position_title_ar,
    ol.position_level,
    ol.start_date,
    ol.end_date,
    ol.is_current,
    ol.appointment_type,
    CASE
      WHEN ol.end_date IS NOT NULL THEN (ol.end_date - ol.start_date)
      ELSE (CURRENT_DATE - ol.start_date)
    END as tenure_days
  FROM organization_leadership ol
  LEFT JOIN persons p ON ol.person_id = p.id
  LEFT JOIN dossiers d ON p.id = d.id
  WHERE ol.organization_id = p_organization_id
    AND ol.deleted_at IS NULL
    AND (p_position_level IS NULL OR ol.position_level = p_position_level)
  ORDER BY ol.start_date DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get person's leadership positions across organizations
CREATE OR REPLACE FUNCTION get_person_leadership_positions(
  p_person_id UUID,
  p_include_past BOOLEAN DEFAULT true
)
RETURNS TABLE (
  leadership_id UUID,
  organization_id UUID,
  organization_name_en TEXT,
  organization_name_ar TEXT,
  position_title_en TEXT,
  position_title_ar TEXT,
  position_level TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ol.id as leadership_id,
    ol.organization_id,
    o.name_en as organization_name_en,
    o.name_ar as organization_name_ar,
    ol.position_title_en,
    ol.position_title_ar,
    ol.position_level,
    ol.start_date,
    ol.end_date,
    ol.is_current
  FROM organization_leadership ol
  JOIN organizations o ON ol.organization_id = o.id
  WHERE ol.person_id = p_person_id
    AND ol.deleted_at IS NULL
    AND (p_include_past = true OR ol.is_current = true)
  ORDER BY ol.is_current DESC, ol.start_date DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Find recent leadership changes across all organizations
CREATE OR REPLACE FUNCTION get_recent_leadership_changes(
  p_days INTEGER DEFAULT 90,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  leadership_id UUID,
  organization_id UUID,
  organization_name_en TEXT,
  organization_name_ar TEXT,
  leader_name_en TEXT,
  leader_name_ar TEXT,
  position_title_en TEXT,
  position_level TEXT,
  change_type TEXT,
  change_date DATE
) AS $$
BEGIN
  RETURN QUERY
  -- New appointments
  SELECT
    ol.id as leadership_id,
    ol.organization_id,
    o.name_en as organization_name_en,
    o.name_ar as organization_name_ar,
    COALESCE(d.name_en, ol.external_name_en) as leader_name_en,
    COALESCE(d.name_ar, ol.external_name_ar) as leader_name_ar,
    ol.position_title_en,
    ol.position_level,
    'appointed' as change_type,
    ol.start_date as change_date
  FROM organization_leadership ol
  JOIN organizations o ON ol.organization_id = o.id
  LEFT JOIN persons p ON ol.person_id = p.id
  LEFT JOIN dossiers d ON p.id = d.id
  WHERE ol.start_date >= CURRENT_DATE - p_days
    AND ol.deleted_at IS NULL

  UNION ALL

  -- Departures
  SELECT
    ol.id as leadership_id,
    ol.organization_id,
    o.name_en as organization_name_en,
    o.name_ar as organization_name_ar,
    COALESCE(d.name_en, ol.external_name_en) as leader_name_en,
    COALESCE(d.name_ar, ol.external_name_ar) as leader_name_ar,
    ol.position_title_en,
    ol.position_level,
    'departed' as change_type,
    ol.end_date as change_date
  FROM organization_leadership ol
  JOIN organizations o ON ol.organization_id = o.id
  LEFT JOIN persons p ON ol.person_id = p.id
  LEFT JOIN dossiers d ON p.id = d.id
  WHERE ol.end_date >= CURRENT_DATE - p_days
    AND ol.deleted_at IS NULL

  ORDER BY change_date DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PART 6: View for current organization leadership
-- ============================================================================

CREATE OR REPLACE VIEW current_organization_leadership AS
SELECT
  ol.id,
  ol.organization_id,
  o.name_en as organization_name_en,
  o.name_ar as organization_name_ar,
  o.type as organization_type,
  ol.person_id,
  COALESCE(d.name_en, ol.external_name_en) as leader_name_en,
  COALESCE(d.name_ar, ol.external_name_ar) as leader_name_ar,
  ol.position_title_en,
  ol.position_title_ar,
  ol.position_level,
  ol.start_date,
  ol.appointment_type,
  p.photo_url,
  p.email as leader_email,
  (CURRENT_DATE - ol.start_date) as tenure_days
FROM organization_leadership ol
JOIN organizations o ON ol.organization_id = o.id
LEFT JOIN persons p ON ol.person_id = p.id
LEFT JOIN dossiers d ON p.id = d.id
WHERE ol.is_current = true
  AND ol.deleted_at IS NULL;

-- ============================================================================
-- PART 7: Grants
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON organization_leadership TO authenticated;
GRANT SELECT ON current_organization_leadership TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_leadership(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_leadership_history(UUID, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_person_leadership_positions(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_leadership_changes(INTEGER, INTEGER) TO authenticated;

-- ============================================================================
-- PART 8: Comments
-- ============================================================================

COMMENT ON TABLE organization_leadership IS 'Tracks leadership positions and their history for organizations';
COMMENT ON VIEW current_organization_leadership IS 'View of current leadership positions across all organizations';
COMMENT ON COLUMN organization_leadership.position_level IS 'Hierarchy level: head, deputy, executive, director, manager, coordinator';
COMMENT ON COLUMN organization_leadership.appointment_type IS 'How the leader was appointed: permanent, acting, interim, elected, appointed, designated';
COMMENT ON FUNCTION get_current_leadership(UUID) IS 'Get all current leaders for an organization sorted by position level';
COMMENT ON FUNCTION get_leadership_history IS 'Get leadership history with tenure calculation';
COMMENT ON FUNCTION get_person_leadership_positions IS 'Get all leadership positions held by a person';
COMMENT ON FUNCTION get_recent_leadership_changes IS 'Find recent leadership appointments and departures across all organizations';

-- ============================================================================
-- Migration Complete
-- ============================================================================
