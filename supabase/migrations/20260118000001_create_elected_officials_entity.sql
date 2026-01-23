-- ============================================================================
-- Migration: Create Elected Officials Entity Type
-- Date: 2026-01-18
-- Feature: Elected officials and government contacts tracking
-- Description: Add dedicated entity type for elected officials with fields for
--              office, district, party affiliation, committee assignments, and
--              contact preferences
-- ============================================================================

-- ============================================================================
-- PART 1: Add elected_official to dossier types
-- ============================================================================

-- Drop and recreate the type check constraint to include elected_official
ALTER TABLE dossiers DROP CONSTRAINT IF EXISTS dossiers_type_check;

ALTER TABLE dossiers ADD CONSTRAINT dossiers_type_check CHECK (
  type = ANY (ARRAY[
    'country'::text,
    'organization'::text,
    'forum'::text,
    'engagement'::text,
    'topic'::text,
    'working_group'::text,
    'person'::text,
    'elected_official'::text
  ])
);

-- ============================================================================
-- PART 2: Create elected_officials extension table
-- ============================================================================

CREATE TABLE IF NOT EXISTS elected_officials (
  -- Primary key references dossiers (Class Table Inheritance pattern)
  id UUID PRIMARY KEY REFERENCES dossiers(id) ON DELETE CASCADE,

  -- Personal & Professional Info
  title_en TEXT,                                    -- e.g., "Senator", "Minister"
  title_ar TEXT,
  photo_url TEXT,

  -- Office Information
  office_name_en TEXT NOT NULL,                     -- e.g., "United States Senate"
  office_name_ar TEXT,
  office_type TEXT NOT NULL CHECK (office_type IN (
    'head_of_state',                                -- President, King, etc.
    'head_of_government',                           -- Prime Minister, Chancellor
    'cabinet_minister',                             -- Minister of Foreign Affairs, etc.
    'legislature_upper',                            -- Senator, Member of Lords
    'legislature_lower',                            -- Representative, MP
    'regional_executive',                           -- Governor, Premier
    'regional_legislature',                         -- State Senator, Provincial MP
    'local_executive',                              -- Mayor, City Manager
    'local_legislature',                            -- City Council, Alderman
    'judiciary',                                    -- Judge, Justice
    'ambassador',                                   -- Ambassador, Consul
    'international_org',                            -- UN Representative, etc.
    'other'
  )),

  -- District/Constituency
  district_en TEXT,                                 -- e.g., "California 12th District"
  district_ar TEXT,

  -- Political Affiliation
  party_en TEXT,                                    -- e.g., "Democratic Party"
  party_ar TEXT,
  party_abbreviation TEXT,                          -- e.g., "DEM", "REP"
  party_ideology TEXT CHECK (party_ideology IS NULL OR party_ideology IN (
    'conservative',
    'liberal',
    'centrist',
    'socialist',
    'green',
    'nationalist',
    'libertarian',
    'independent',
    'other'
  )),

  -- Term Information
  term_start DATE,
  term_end DATE,
  is_current_term BOOLEAN DEFAULT TRUE,
  term_number INTEGER CHECK (term_number IS NULL OR term_number > 0), -- e.g., 2nd term

  -- Committee Assignments (JSONB for flexibility)
  -- Structure: [{ "name_en": "...", "name_ar": "...", "role": "chair|vice_chair|member", "is_active": true }]
  committee_assignments JSONB DEFAULT '[]',

  -- Contact Preferences (JSONB for flexibility)
  -- Structure: { "preferred_channel": "email|phone|in_person|formal_letter",
  --              "best_time": "morning|afternoon|evening",
  --              "scheduling_notes_en": "...", "scheduling_notes_ar": "...",
  --              "protocol_notes_en": "...", "protocol_notes_ar": "..." }
  contact_preferences JSONB DEFAULT '{}',

  -- Contact Information
  email_official TEXT,                              -- Official government email
  email_personal TEXT,                              -- Personal/campaign email
  phone_office TEXT,
  phone_mobile TEXT,
  address_office_en TEXT,
  address_office_ar TEXT,
  website_official TEXT,
  website_campaign TEXT,

  -- Social Media Handles
  social_media JSONB DEFAULT '{}',                  -- { "twitter": "@...", "linkedin": "...", etc. }

  -- Staff/Assistants (key contacts for scheduling)
  -- Structure: [{ "name": "...", "role": "chief_of_staff|scheduler|policy_advisor|press_secretary",
  --               "email": "...", "phone": "...", "notes": "..." }]
  staff_contacts JSONB DEFAULT '[]',

  -- Linked Entities
  country_id UUID REFERENCES countries(id) ON DELETE SET NULL,         -- Country they represent
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL, -- Government body

  -- Background & Notes
  biography_en TEXT,
  biography_ar TEXT,
  policy_priorities JSONB DEFAULT '[]',             -- Array of policy area tags
  notes_en TEXT,                                    -- Internal notes
  notes_ar TEXT,

  -- Data Source Information (for automated refresh)
  data_source TEXT,                                 -- e.g., "official_website", "api_gov", "manual"
  data_source_url TEXT,
  last_verified_at TIMESTAMPTZ,
  last_refresh_at TIMESTAMPTZ,
  refresh_frequency_days INTEGER DEFAULT 30,

  -- Importance & Priority
  importance_level INTEGER DEFAULT 2 CHECK (importance_level BETWEEN 1 AND 5),
  -- 1 = Regular contact, 2 = Important, 3 = Key contact, 4 = VIP, 5 = Critical

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_term_dates CHECK (term_end IS NULL OR term_end >= term_start),
  CONSTRAINT valid_email_official CHECK (email_official IS NULL OR email_official ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_email_personal CHECK (email_personal IS NULL OR email_personal ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Trigger to validate dossier type
CREATE TRIGGER validate_elected_official_type
  BEFORE INSERT OR UPDATE ON elected_officials
  FOR EACH ROW EXECUTE FUNCTION validate_dossier_type('elected_official');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_elected_officials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_elected_officials_updated_at
  BEFORE UPDATE ON elected_officials
  FOR EACH ROW
  EXECUTE FUNCTION update_elected_officials_updated_at();

-- ============================================================================
-- PART 3: Create indexes for performance
-- ============================================================================

CREATE INDEX idx_elected_officials_office_type ON elected_officials(office_type);
CREATE INDEX idx_elected_officials_country ON elected_officials(country_id);
CREATE INDEX idx_elected_officials_organization ON elected_officials(organization_id);
CREATE INDEX idx_elected_officials_importance ON elected_officials(importance_level);
CREATE INDEX idx_elected_officials_current_term ON elected_officials(is_current_term) WHERE is_current_term = TRUE;
CREATE INDEX idx_elected_officials_term_dates ON elected_officials(term_start, term_end);
CREATE INDEX idx_elected_officials_party ON elected_officials(party_en);
CREATE INDEX idx_elected_officials_district ON elected_officials(district_en);
CREATE INDEX idx_elected_officials_data_refresh ON elected_officials(last_refresh_at, refresh_frequency_days);

-- GIN indexes for JSONB columns
CREATE INDEX idx_elected_officials_committees ON elected_officials USING GIN(committee_assignments);
CREATE INDEX idx_elected_officials_policy_priorities ON elected_officials USING GIN(policy_priorities);
CREATE INDEX idx_elected_officials_social_media ON elected_officials USING GIN(social_media);
CREATE INDEX idx_elected_officials_staff ON elected_officials USING GIN(staff_contacts);

-- Full-text search vector
ALTER TABLE elected_officials ADD COLUMN IF NOT EXISTS search_vector TSVECTOR GENERATED ALWAYS AS (
  setweight(to_tsvector('simple', coalesce(title_en, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(title_ar, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(office_name_en, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(office_name_ar, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(party_en, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(district_en, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(biography_en, '')), 'C') ||
  setweight(to_tsvector('simple', coalesce(biography_ar, '')), 'C')
) STORED;

CREATE INDEX idx_elected_officials_search_vector ON elected_officials USING GIN(search_vector);

-- ============================================================================
-- PART 4: Row Level Security
-- ============================================================================

ALTER TABLE elected_officials ENABLE ROW LEVEL SECURITY;

-- Users can view elected officials based on dossier sensitivity
CREATE POLICY "Users can view elected officials"
  ON elected_officials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = elected_officials.id
      AND d.status != 'archived'
    )
  );

-- Users can create elected officials
CREATE POLICY "Users can create elected officials"
  ON elected_officials FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = elected_officials.id
      AND d.type = 'elected_official'
    )
  );

-- Users can update elected officials they created or are assigned to
CREATE POLICY "Users can update elected officials"
  ON elected_officials FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = elected_officials.id
      AND (d.created_by = auth.uid() OR d.status != 'archived')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = elected_officials.id
    )
  );

-- Users can delete elected officials they created
CREATE POLICY "Users can delete elected officials"
  ON elected_officials FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = elected_officials.id
      AND d.created_by = auth.uid()
    )
  );

-- ============================================================================
-- PART 5: Helper Functions
-- ============================================================================

-- Function: Get elected official with full dossier data
CREATE OR REPLACE FUNCTION get_elected_official_full(p_official_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'official', (
      SELECT row_to_json(o)
      FROM (
        SELECT eo.*,
               d.name_en, d.name_ar, d.description_en, d.description_ar,
               d.status, d.sensitivity_level, d.tags, d.created_at as dossier_created_at,
               d.updated_at as dossier_updated_at,
               c_d.name_en as country_name_en, c_d.name_ar as country_name_ar,
               org_d.name_en as organization_name_en, org_d.name_ar as organization_name_ar
        FROM elected_officials eo
        JOIN dossiers d ON d.id = eo.id
        LEFT JOIN countries c ON c.id = eo.country_id
        LEFT JOIN dossiers c_d ON c_d.id = c.id
        LEFT JOIN organizations org ON org.id = eo.organization_id
        LEFT JOIN dossiers org_d ON org_d.id = org.id
        WHERE eo.id = p_official_id
      ) o
    ),
    'active_committees', (
      SELECT jsonb_agg(elem)
      FROM elected_officials eo,
           jsonb_array_elements(eo.committee_assignments) elem
      WHERE eo.id = p_official_id
        AND (elem->>'is_active')::boolean = true
    ),
    'key_staff', (
      SELECT jsonb_agg(elem)
      FROM elected_officials eo,
           jsonb_array_elements(eo.staff_contacts) elem
      WHERE eo.id = p_official_id
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Search elected officials with filters
CREATE OR REPLACE FUNCTION search_elected_officials(
  p_search_term TEXT DEFAULT NULL,
  p_office_type TEXT DEFAULT NULL,
  p_country_id UUID DEFAULT NULL,
  p_party TEXT DEFAULT NULL,
  p_is_current_term BOOLEAN DEFAULT NULL,
  p_importance_level INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name_en TEXT,
  name_ar TEXT,
  title_en TEXT,
  title_ar TEXT,
  office_name_en TEXT,
  office_type TEXT,
  party_en TEXT,
  district_en TEXT,
  country_name_en TEXT,
  importance_level INTEGER,
  is_current_term BOOLEAN,
  photo_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    eo.id,
    d.name_en,
    d.name_ar,
    eo.title_en,
    eo.title_ar,
    eo.office_name_en,
    eo.office_type,
    eo.party_en,
    eo.district_en,
    c_d.name_en as country_name_en,
    eo.importance_level,
    eo.is_current_term,
    eo.photo_url
  FROM elected_officials eo
  JOIN dossiers d ON d.id = eo.id
  LEFT JOIN countries c ON c.id = eo.country_id
  LEFT JOIN dossiers c_d ON c_d.id = c.id
  WHERE d.status != 'archived'
    AND d.type = 'elected_official'
    AND (p_search_term IS NULL OR (
      d.name_en ILIKE '%' || p_search_term || '%'
      OR d.name_ar ILIKE '%' || p_search_term || '%'
      OR eo.title_en ILIKE '%' || p_search_term || '%'
      OR eo.office_name_en ILIKE '%' || p_search_term || '%'
      OR eo.party_en ILIKE '%' || p_search_term || '%'
      OR eo.district_en ILIKE '%' || p_search_term || '%'
    ))
    AND (p_office_type IS NULL OR eo.office_type = p_office_type)
    AND (p_country_id IS NULL OR eo.country_id = p_country_id)
    AND (p_party IS NULL OR eo.party_en ILIKE '%' || p_party || '%')
    AND (p_is_current_term IS NULL OR eo.is_current_term = p_is_current_term)
    AND (p_importance_level IS NULL OR eo.importance_level >= p_importance_level)
  ORDER BY eo.importance_level DESC, d.name_en
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get officials needing data refresh
CREATE OR REPLACE FUNCTION get_officials_needing_refresh(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  id UUID,
  name_en TEXT,
  data_source TEXT,
  data_source_url TEXT,
  last_refresh_at TIMESTAMPTZ,
  days_since_refresh INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    eo.id,
    d.name_en,
    eo.data_source,
    eo.data_source_url,
    eo.last_refresh_at,
    EXTRACT(DAY FROM NOW() - COALESCE(eo.last_refresh_at, eo.created_at))::INTEGER as days_since_refresh
  FROM elected_officials eo
  JOIN dossiers d ON d.id = eo.id
  WHERE d.status = 'active'
    AND (
      eo.last_refresh_at IS NULL
      OR (NOW() - eo.last_refresh_at) > (eo.refresh_frequency_days || ' days')::INTERVAL
    )
  ORDER BY
    COALESCE(eo.last_refresh_at, eo.created_at) ASC,
    eo.importance_level DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Update data refresh timestamp
CREATE OR REPLACE FUNCTION mark_official_refreshed(
  p_official_id UUID,
  p_verified BOOLEAN DEFAULT TRUE
)
RETURNS VOID AS $$
BEGIN
  UPDATE elected_officials
  SET
    last_refresh_at = NOW(),
    last_verified_at = CASE WHEN p_verified THEN NOW() ELSE last_verified_at END
  WHERE id = p_official_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 6: Documentation Comments
-- ============================================================================

COMMENT ON TABLE elected_officials IS 'Extension table for elected officials and government contacts dossiers';
COMMENT ON COLUMN elected_officials.office_type IS 'Type of governmental office: head_of_state, cabinet_minister, legislature_upper, legislature_lower, etc.';
COMMENT ON COLUMN elected_officials.committee_assignments IS 'JSONB array of committee assignments with name, role, and active status';
COMMENT ON COLUMN elected_officials.contact_preferences IS 'JSONB object with preferred contact channel, best time, and protocol notes';
COMMENT ON COLUMN elected_officials.staff_contacts IS 'JSONB array of key staff members for scheduling and contact';
COMMENT ON COLUMN elected_officials.policy_priorities IS 'JSONB array of policy area tags for this official';
COMMENT ON COLUMN elected_officials.importance_level IS '1=Regular, 2=Important, 3=Key contact, 4=VIP, 5=Critical';
COMMENT ON COLUMN elected_officials.data_source IS 'Source of data for automated refresh: official_website, api_gov, manual';
COMMENT ON FUNCTION get_elected_official_full(UUID) IS 'Get complete elected official profile with dossier and related data';
COMMENT ON FUNCTION search_elected_officials IS 'Search elected officials with multiple filter options';
COMMENT ON FUNCTION get_officials_needing_refresh IS 'Get list of officials whose data needs to be refreshed';
COMMENT ON FUNCTION mark_official_refreshed IS 'Mark an official as refreshed after automated data update';

-- ============================================================================
-- Migration Complete
-- ============================================================================
