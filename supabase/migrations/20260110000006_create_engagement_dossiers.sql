-- ============================================================================
-- Migration: Engagement Dossiers Entity Management
-- Date: 2026-01-10
-- Feature: engagements-entity-management
-- Description: Create engagement dossiers for bilateral meetings, missions,
--              and delegations. Engagements are first-class dossier entities
--              that link to participants, briefs, and outcomes.
-- ============================================================================

-- ============================================================================
-- PART 1: Create engagement_dossiers extension table
-- ============================================================================

-- Note: The base dossier already exists. This extension table stores
-- engagement-specific fields for dossiers with type='engagement_dossier'
-- Using 'engagement_dossier' to distinguish from existing 'engagements' table

CREATE TABLE IF NOT EXISTS engagement_dossiers (
  id UUID PRIMARY KEY REFERENCES dossiers(id) ON DELETE CASCADE,

  -- Engagement classification
  engagement_type TEXT NOT NULL CHECK (engagement_type IN (
    'bilateral_meeting',    -- One-on-one between countries/organizations
    'mission',              -- Official visit/mission
    'delegation',           -- Group delegation visit
    'summit',               -- High-level summit
    'working_group',        -- Working group meeting
    'roundtable',           -- Roundtable discussion
    'official_visit',       -- Official state visit
    'consultation',         -- Consultation meeting
    'other'
  )),

  engagement_category TEXT NOT NULL CHECK (engagement_category IN (
    'diplomatic',           -- Diplomatic engagement
    'statistical',          -- Statistical cooperation
    'technical',            -- Technical cooperation
    'economic',             -- Economic/trade matters
    'cultural',             -- Cultural exchange
    'educational',          -- Educational cooperation
    'research',             -- Research collaboration
    'other'
  )),

  -- Temporal fields
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Riyadh',

  -- Location
  location_en TEXT,
  location_ar TEXT,
  venue_en TEXT,
  venue_ar TEXT,
  is_virtual BOOLEAN DEFAULT FALSE,
  virtual_link TEXT,

  -- Related entities (stored as references)
  host_country_id UUID REFERENCES dossiers(id) ON DELETE SET NULL,
  host_organization_id UUID REFERENCES dossiers(id) ON DELETE SET NULL,

  -- Delegation info
  delegation_size INTEGER,
  delegation_level TEXT CHECK (delegation_level IN (
    'head_of_state',
    'ministerial',
    'senior_official',
    'director',
    'expert',
    'technical'
  )),

  -- Outcomes and notes
  objectives_en TEXT,
  objectives_ar TEXT,
  outcomes_en TEXT,
  outcomes_ar TEXT,
  notes_en TEXT,
  notes_ar TEXT,

  -- Status tracking
  engagement_status TEXT NOT NULL DEFAULT 'planned' CHECK (engagement_status IN (
    'planned',        -- Future engagement
    'confirmed',      -- Confirmed/scheduled
    'in_progress',    -- Currently happening
    'completed',      -- Successfully completed
    'postponed',      -- Postponed to later date
    'cancelled'       -- Cancelled
  )),

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE engagement_dossiers IS 'Extension table for engagement dossiers - bilateral meetings, missions, delegations';

-- ============================================================================
-- PART 2: Create engagement participants table
-- ============================================================================

CREATE TABLE IF NOT EXISTS engagement_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagement_dossiers(id) ON DELETE CASCADE,

  -- Participant can be a person dossier, organization, or country
  participant_type TEXT NOT NULL CHECK (participant_type IN (
    'person',           -- Person dossier
    'organization',     -- Organization dossier
    'country',          -- Country dossier
    'external'          -- External participant (not in system)
  )),

  -- Reference to dossier (for person, org, country)
  participant_dossier_id UUID REFERENCES dossiers(id) ON DELETE CASCADE,

  -- For external participants (name stored directly)
  external_name_en TEXT,
  external_name_ar TEXT,
  external_title_en TEXT,
  external_title_ar TEXT,
  external_organization_en TEXT,
  external_organization_ar TEXT,

  -- Role in the engagement
  role TEXT NOT NULL CHECK (role IN (
    'host',             -- Host of the engagement
    'guest',            -- Guest/visitor
    'delegate',         -- Delegation member
    'head_of_delegation', -- Head of delegation
    'speaker',          -- Speaker/presenter
    'observer',         -- Observer
    'organizer',        -- Organizer
    'support_staff',    -- Support staff
    'interpreter',      -- Interpreter/translator
    'other'
  )),

  -- Attendance tracking
  attendance_status TEXT NOT NULL DEFAULT 'expected' CHECK (attendance_status IN (
    'expected',         -- Expected to attend
    'confirmed',        -- Confirmed attendance
    'attended',         -- Actually attended
    'no_show',          -- Did not show up
    'cancelled',        -- Cancelled participation
    'tentative'         -- Tentative/uncertain
  )),

  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Ensure either dossier reference or external name is provided
  CONSTRAINT valid_participant CHECK (
    (participant_dossier_id IS NOT NULL) OR
    (external_name_en IS NOT NULL OR external_name_ar IS NOT NULL)
  )
);

COMMENT ON TABLE engagement_participants IS 'Participants in engagement dossiers with roles and attendance';

-- ============================================================================
-- PART 3: Create engagement agenda items table
-- ============================================================================

CREATE TABLE IF NOT EXISTS engagement_agenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagement_dossiers(id) ON DELETE CASCADE,

  -- Agenda item details
  order_number INTEGER NOT NULL DEFAULT 1,
  title_en TEXT NOT NULL,
  title_ar TEXT,
  description_en TEXT,
  description_ar TEXT,

  -- Timing
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,

  -- Status
  item_status TEXT NOT NULL DEFAULT 'planned' CHECK (item_status IN (
    'planned',
    'in_progress',
    'completed',
    'skipped',
    'postponed'
  )),

  -- Notes and outcomes
  notes_en TEXT,
  notes_ar TEXT,
  outcome_en TEXT,
  outcome_ar TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE engagement_agenda IS 'Agenda items for engagement dossiers';

-- ============================================================================
-- PART 4: Create indexes
-- ============================================================================

-- Engagement dossiers indexes
CREATE INDEX IF NOT EXISTS idx_engagement_dossiers_type ON engagement_dossiers(engagement_type);
CREATE INDEX IF NOT EXISTS idx_engagement_dossiers_category ON engagement_dossiers(engagement_category);
CREATE INDEX IF NOT EXISTS idx_engagement_dossiers_dates ON engagement_dossiers(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_engagement_dossiers_status ON engagement_dossiers(engagement_status);
CREATE INDEX IF NOT EXISTS idx_engagement_dossiers_host_country ON engagement_dossiers(host_country_id);
CREATE INDEX IF NOT EXISTS idx_engagement_dossiers_host_org ON engagement_dossiers(host_organization_id);

-- Participants indexes
CREATE INDEX IF NOT EXISTS idx_engagement_participants_engagement ON engagement_participants(engagement_id);
CREATE INDEX IF NOT EXISTS idx_engagement_participants_dossier ON engagement_participants(participant_dossier_id);
CREATE INDEX IF NOT EXISTS idx_engagement_participants_type ON engagement_participants(participant_type);
CREATE INDEX IF NOT EXISTS idx_engagement_participants_role ON engagement_participants(role);

-- Agenda indexes
CREATE INDEX IF NOT EXISTS idx_engagement_agenda_engagement ON engagement_agenda(engagement_id);
CREATE INDEX IF NOT EXISTS idx_engagement_agenda_order ON engagement_agenda(engagement_id, order_number);

-- ============================================================================
-- PART 5: Create triggers for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_engagement_dossiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_engagement_dossiers_updated_at
  BEFORE UPDATE ON engagement_dossiers
  FOR EACH ROW
  EXECUTE FUNCTION update_engagement_dossiers_updated_at();

CREATE TRIGGER trigger_update_engagement_agenda_updated_at
  BEFORE UPDATE ON engagement_agenda
  FOR EACH ROW
  EXECUTE FUNCTION update_engagement_dossiers_updated_at();

-- ============================================================================
-- PART 6: Enable RLS
-- ============================================================================

ALTER TABLE engagement_dossiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_agenda ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 7: RLS Policies for engagement_dossiers
-- ============================================================================

-- Select: Users can view engagements linked to non-archived dossiers
CREATE POLICY "Users can view engagement dossiers"
  ON engagement_dossiers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = engagement_dossiers.id
      AND d.status != 'archived'
    )
  );

-- Insert: Authenticated users can create
CREATE POLICY "Authenticated users can create engagement dossiers"
  ON engagement_dossiers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = engagement_dossiers.id
      AND d.created_by = auth.uid()
    )
  );

-- Update: Users can update engagements they created
CREATE POLICY "Users can update own engagement dossiers"
  ON engagement_dossiers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = engagement_dossiers.id
      AND d.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = engagement_dossiers.id
      AND d.created_by = auth.uid()
    )
  );

-- Delete: Users can delete engagements they created
CREATE POLICY "Users can delete own engagement dossiers"
  ON engagement_dossiers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = engagement_dossiers.id
      AND d.created_by = auth.uid()
    )
  );

-- ============================================================================
-- PART 8: RLS Policies for engagement_participants
-- ============================================================================

CREATE POLICY "Users can view engagement participants"
  ON engagement_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM engagement_dossiers ed
      JOIN dossiers d ON d.id = ed.id
      WHERE ed.id = engagement_participants.engagement_id
      AND d.status != 'archived'
    )
  );

CREATE POLICY "Users can create engagement participants"
  ON engagement_participants FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own engagement participants"
  ON engagement_participants FOR DELETE
  USING (created_by = auth.uid());

-- ============================================================================
-- PART 9: RLS Policies for engagement_agenda
-- ============================================================================

CREATE POLICY "Users can view engagement agenda"
  ON engagement_agenda FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM engagement_dossiers ed
      JOIN dossiers d ON d.id = ed.id
      WHERE ed.id = engagement_agenda.engagement_id
      AND d.status != 'archived'
    )
  );

CREATE POLICY "Users can create engagement agenda"
  ON engagement_agenda FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own engagement agenda"
  ON engagement_agenda FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own engagement agenda"
  ON engagement_agenda FOR DELETE
  USING (created_by = auth.uid());

-- ============================================================================
-- PART 10: Helper Functions
-- ============================================================================

-- Function: Get engagement with all related data
CREATE OR REPLACE FUNCTION get_engagement_full(p_engagement_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'engagement', (
      SELECT row_to_json(e)
      FROM (
        SELECT ed.*, d.name_en, d.name_ar, d.description_en, d.description_ar,
               d.status, d.sensitivity_level, d.tags, d.created_at as dossier_created_at,
               d.updated_at as dossier_updated_at, d.created_by, d.updated_by
        FROM engagement_dossiers ed
        JOIN dossiers d ON d.id = ed.id
        WHERE ed.id = p_engagement_id
      ) e
    ),
    'participants', (
      SELECT json_agg(json_build_object(
        'participant', row_to_json(ep),
        'dossier_info', CASE
          WHEN ep.participant_dossier_id IS NOT NULL THEN (
            SELECT row_to_json(pd)
            FROM (
              SELECT id, name_en, name_ar, type
              FROM dossiers
              WHERE id = ep.participant_dossier_id
            ) pd
          )
          ELSE NULL
        END
      ) ORDER BY ep.role, ep.created_at)
      FROM engagement_participants ep
      WHERE ep.engagement_id = p_engagement_id
    ),
    'agenda', (
      SELECT json_agg(row_to_json(ea) ORDER BY ea.order_number)
      FROM engagement_agenda ea
      WHERE ea.engagement_id = p_engagement_id
    ),
    'host_country', (
      SELECT row_to_json(hc)
      FROM (
        SELECT d.id, d.name_en, d.name_ar
        FROM dossiers d
        JOIN engagement_dossiers ed ON d.id = ed.host_country_id
        WHERE ed.id = p_engagement_id
      ) hc
    ),
    'host_organization', (
      SELECT row_to_json(ho)
      FROM (
        SELECT d.id, d.name_en, d.name_ar
        FROM dossiers d
        JOIN engagement_dossiers ed ON d.id = ed.host_organization_id
        WHERE ed.id = p_engagement_id
      ) ho
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_engagement_full(UUID) IS 'Get complete engagement dossier with participants, agenda, and host info';

-- Function: Search engagements with filters
CREATE OR REPLACE FUNCTION search_engagements_advanced(
  p_search_term TEXT DEFAULT NULL,
  p_engagement_type TEXT DEFAULT NULL,
  p_engagement_category TEXT DEFAULT NULL,
  p_engagement_status TEXT DEFAULT NULL,
  p_host_country_id UUID DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name_en TEXT,
  name_ar TEXT,
  engagement_type TEXT,
  engagement_category TEXT,
  engagement_status TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  location_en TEXT,
  location_ar TEXT,
  is_virtual BOOLEAN,
  host_country_id UUID,
  host_country_name_en TEXT,
  host_country_name_ar TEXT,
  participant_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ed.id,
    d.name_en,
    d.name_ar,
    ed.engagement_type,
    ed.engagement_category,
    ed.engagement_status,
    ed.start_date,
    ed.end_date,
    ed.location_en,
    ed.location_ar,
    ed.is_virtual,
    ed.host_country_id,
    hc.name_en as host_country_name_en,
    hc.name_ar as host_country_name_ar,
    (SELECT COUNT(*) FROM engagement_participants ep WHERE ep.engagement_id = ed.id) as participant_count
  FROM engagement_dossiers ed
  JOIN dossiers d ON d.id = ed.id
  LEFT JOIN dossiers hc ON hc.id = ed.host_country_id
  WHERE d.status != 'archived'
    AND d.type = 'engagement_dossier'
    AND (p_search_term IS NULL OR (
      d.name_en ILIKE '%' || p_search_term || '%'
      OR d.name_ar ILIKE '%' || p_search_term || '%'
      OR ed.location_en ILIKE '%' || p_search_term || '%'
      OR ed.objectives_en ILIKE '%' || p_search_term || '%'
    ))
    AND (p_engagement_type IS NULL OR ed.engagement_type = p_engagement_type)
    AND (p_engagement_category IS NULL OR ed.engagement_category = p_engagement_category)
    AND (p_engagement_status IS NULL OR ed.engagement_status = p_engagement_status)
    AND (p_host_country_id IS NULL OR ed.host_country_id = p_host_country_id)
    AND (p_start_date IS NULL OR ed.start_date >= p_start_date)
    AND (p_end_date IS NULL OR ed.end_date <= p_end_date)
  ORDER BY ed.start_date DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_engagements_advanced IS 'Advanced engagement search with multiple filter options';

-- ============================================================================
-- Migration Complete
-- ============================================================================
