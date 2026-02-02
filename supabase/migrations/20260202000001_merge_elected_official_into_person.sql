-- ============================================================================
-- Migration: Merge Elected Official into Person Dossier
-- Date: 2026-02-02
-- Feature: Consolidate elected_official dossier type into person with subtype
-- Description: Add person_subtype discriminator to persons table, migrate
--              elected official data, and update all related objects
-- ============================================================================

-- ============================================================================
-- PART 1: Add Person Subtype & Elected Official Columns to Persons
-- ============================================================================

-- Add person subtype discriminator
ALTER TABLE persons ADD COLUMN IF NOT EXISTS person_subtype TEXT DEFAULT 'standard'
  CHECK (person_subtype IN ('standard', 'elected_official'));

-- Add elected official specific columns (all nullable for standard persons)
ALTER TABLE persons ADD COLUMN IF NOT EXISTS office_name_en TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS office_name_ar TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS office_type TEXT CHECK (office_type IS NULL OR office_type IN (
  'head_of_state', 'head_of_government', 'cabinet_minister',
  'legislature_upper', 'legislature_lower', 'regional_executive',
  'regional_legislature', 'local_executive', 'local_legislature',
  'judiciary', 'ambassador', 'international_org', 'other'
));
ALTER TABLE persons ADD COLUMN IF NOT EXISTS district_en TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS district_ar TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS party_en TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS party_ar TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS party_abbreviation TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS party_ideology TEXT CHECK (party_ideology IS NULL OR party_ideology IN (
  'conservative', 'liberal', 'centrist', 'socialist', 'green',
  'nationalist', 'libertarian', 'independent', 'other'
));
ALTER TABLE persons ADD COLUMN IF NOT EXISTS term_start DATE;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS term_end DATE;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS is_current_term BOOLEAN DEFAULT TRUE;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS term_number INTEGER CHECK (term_number IS NULL OR term_number > 0);
ALTER TABLE persons ADD COLUMN IF NOT EXISTS committee_assignments JSONB DEFAULT '[]';
ALTER TABLE persons ADD COLUMN IF NOT EXISTS contact_preferences JSONB DEFAULT '{}';
ALTER TABLE persons ADD COLUMN IF NOT EXISTS email_official TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS email_personal TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS phone_office TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS phone_mobile TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS address_office_en TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS address_office_ar TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS website_official TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS website_campaign TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}';
ALTER TABLE persons ADD COLUMN IF NOT EXISTS staff_contacts JSONB DEFAULT '[]';
ALTER TABLE persons ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES countries(id) ON DELETE SET NULL;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS policy_priorities JSONB DEFAULT '[]';
ALTER TABLE persons ADD COLUMN IF NOT EXISTS notes_en TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS notes_ar TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS data_source TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS data_source_url TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS last_refresh_at TIMESTAMPTZ;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS refresh_frequency_days INTEGER DEFAULT 30;

-- Add constraints
DO $$
BEGIN
  -- Add valid_term_dates constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'persons_valid_term_dates'
  ) THEN
    ALTER TABLE persons ADD CONSTRAINT persons_valid_term_dates
      CHECK (term_end IS NULL OR term_end >= term_start);
  END IF;

  -- Add elected_official_requires_office constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'persons_elected_official_requires_office'
  ) THEN
    ALTER TABLE persons ADD CONSTRAINT persons_elected_official_requires_office
      CHECK (person_subtype != 'elected_official' OR office_name_en IS NOT NULL);
  END IF;
END $$;

-- Add indexes for elected official queries
CREATE INDEX IF NOT EXISTS idx_persons_subtype ON persons(person_subtype);
CREATE INDEX IF NOT EXISTS idx_persons_office_type ON persons(office_type) WHERE office_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_persons_current_term ON persons(is_current_term) WHERE is_current_term = TRUE;
CREATE INDEX IF NOT EXISTS idx_persons_country ON persons(country_id) WHERE country_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_persons_term_dates ON persons(term_start, term_end);
CREATE INDEX IF NOT EXISTS idx_persons_party ON persons(party_en) WHERE party_en IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_persons_district ON persons(district_en) WHERE district_en IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_persons_data_refresh ON persons(last_refresh_at, refresh_frequency_days);

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_persons_committees ON persons USING GIN(committee_assignments);
CREATE INDEX IF NOT EXISTS idx_persons_policy_priorities ON persons USING GIN(policy_priorities);
CREATE INDEX IF NOT EXISTS idx_persons_social_media ON persons USING GIN(social_media);
CREATE INDEX IF NOT EXISTS idx_persons_staff ON persons USING GIN(staff_contacts);

-- ============================================================================
-- PART 2: Migrate Existing Elected Officials Data
-- ============================================================================

-- Migrate elected officials to persons table
-- First, we need to insert into dossiers if they don't exist, then update persons
DO $$
DECLARE
  eo_record RECORD;
BEGIN
  -- For each elected official, check if the dossier already exists in persons
  FOR eo_record IN SELECT * FROM elected_officials LOOP
    -- If the person already exists in persons table (unlikely but safe check)
    IF EXISTS (SELECT 1 FROM persons WHERE id = eo_record.id) THEN
      -- Update existing person with elected official data
      UPDATE persons SET
        person_subtype = 'elected_official',
        title_en = COALESCE(eo_record.title_en, persons.title_en),
        title_ar = COALESCE(eo_record.title_ar, persons.title_ar),
        photo_url = COALESCE(eo_record.photo_url, persons.photo_url),
        biography_en = COALESCE(eo_record.biography_en, persons.biography_en),
        biography_ar = COALESCE(eo_record.biography_ar, persons.biography_ar),
        organization_id = COALESCE(eo_record.organization_id, persons.organization_id),
        importance_level = COALESCE(eo_record.importance_level, persons.importance_level),
        office_name_en = eo_record.office_name_en,
        office_name_ar = eo_record.office_name_ar,
        office_type = eo_record.office_type,
        district_en = eo_record.district_en,
        district_ar = eo_record.district_ar,
        party_en = eo_record.party_en,
        party_ar = eo_record.party_ar,
        party_abbreviation = eo_record.party_abbreviation,
        party_ideology = eo_record.party_ideology,
        term_start = eo_record.term_start,
        term_end = eo_record.term_end,
        is_current_term = eo_record.is_current_term,
        term_number = eo_record.term_number,
        committee_assignments = eo_record.committee_assignments,
        contact_preferences = eo_record.contact_preferences,
        email_official = eo_record.email_official,
        email_personal = eo_record.email_personal,
        phone_office = eo_record.phone_office,
        phone_mobile = eo_record.phone_mobile,
        address_office_en = eo_record.address_office_en,
        address_office_ar = eo_record.address_office_ar,
        website_official = eo_record.website_official,
        website_campaign = eo_record.website_campaign,
        social_media = eo_record.social_media,
        staff_contacts = eo_record.staff_contacts,
        country_id = eo_record.country_id,
        policy_priorities = eo_record.policy_priorities,
        notes_en = eo_record.notes_en,
        notes_ar = eo_record.notes_ar,
        data_source = eo_record.data_source,
        data_source_url = eo_record.data_source_url,
        last_verified_at = eo_record.last_verified_at,
        last_refresh_at = eo_record.last_refresh_at,
        refresh_frequency_days = eo_record.refresh_frequency_days
      WHERE id = eo_record.id;
    ELSE
      -- Insert new person from elected official
      INSERT INTO persons (
        id, person_subtype, title_en, title_ar, photo_url, biography_en, biography_ar,
        organization_id, importance_level, office_name_en, office_name_ar, office_type,
        district_en, district_ar, party_en, party_ar, party_abbreviation, party_ideology,
        term_start, term_end, is_current_term, term_number, committee_assignments,
        contact_preferences, email_official, email_personal, phone_office, phone_mobile,
        address_office_en, address_office_ar, website_official, website_campaign,
        social_media, staff_contacts, country_id, policy_priorities, notes_en, notes_ar,
        data_source, data_source_url, last_verified_at, last_refresh_at, refresh_frequency_days
      )
      VALUES (
        eo_record.id, 'elected_official', eo_record.title_en, eo_record.title_ar,
        eo_record.photo_url, eo_record.biography_en, eo_record.biography_ar,
        eo_record.organization_id, eo_record.importance_level,
        eo_record.office_name_en, eo_record.office_name_ar, eo_record.office_type,
        eo_record.district_en, eo_record.district_ar,
        eo_record.party_en, eo_record.party_ar, eo_record.party_abbreviation, eo_record.party_ideology,
        eo_record.term_start, eo_record.term_end, eo_record.is_current_term, eo_record.term_number,
        eo_record.committee_assignments, eo_record.contact_preferences,
        eo_record.email_official, eo_record.email_personal, eo_record.phone_office, eo_record.phone_mobile,
        eo_record.address_office_en, eo_record.address_office_ar,
        eo_record.website_official, eo_record.website_campaign,
        eo_record.social_media, eo_record.staff_contacts, eo_record.country_id,
        eo_record.policy_priorities, eo_record.notes_en, eo_record.notes_ar,
        eo_record.data_source, eo_record.data_source_url,
        eo_record.last_verified_at, eo_record.last_refresh_at, eo_record.refresh_frequency_days
      );
    END IF;
  END LOOP;
END $$;

-- Update dossiers table: change type from 'elected_official' to 'person'
UPDATE dossiers SET type = 'person' WHERE type = 'elected_official';

-- Update CHECK constraint to remove 'elected_official'
ALTER TABLE dossiers DROP CONSTRAINT IF EXISTS dossiers_type_check;
ALTER TABLE dossiers ADD CONSTRAINT dossiers_type_check CHECK (
  type = ANY (ARRAY[
    'country'::text,
    'organization'::text,
    'forum'::text,
    'engagement'::text,
    'topic'::text,
    'working_group'::text,
    'person'::text
  ])
);

-- ============================================================================
-- PART 3: Update Materialized View
-- ============================================================================

-- Drop and recreate the materialized view without elected_official references
DROP MATERIALIZED VIEW IF EXISTS dossier_list_mv CASCADE;

-- Create materialized view that joins dossiers with all extension tables
-- Updated to handle person subtypes instead of separate elected_official type
CREATE MATERIALIZED VIEW dossier_list_mv AS
SELECT
  -- Base dossier fields
  d.id,
  d.name_en,
  d.name_ar,
  d.type,
  d.status,
  d.sensitivity_level,
  d.description_en,
  d.description_ar,
  d.tags,
  d.metadata,
  d.is_active,
  d.created_at,
  d.updated_at,
  d.created_by,
  d.search_vector,

  -- Extension data as JSONB (null-safe, only includes non-null extension data)
  CASE d.type
    WHEN 'country' THEN jsonb_build_object(
      'iso_code_2', c.iso_code_2,
      'iso_code_3', c.iso_code_3,
      'capital_en', c.capital_en,
      'capital_ar', c.capital_ar,
      'region', c.region,
      'subregion', c.subregion,
      'population', c.population,
      'area_sq_km', c.area_sq_km,
      'flag_url', c.flag_url
    )
    WHEN 'organization' THEN jsonb_build_object(
      'org_code', o.org_code,
      'org_type', o.org_type,
      'headquarters_country_id', o.headquarters_country_id,
      'parent_org_id', o.parent_org_id,
      'website', o.website,
      'email', o.email,
      'phone', o.phone,
      'address_en', o.address_en,
      'address_ar', o.address_ar,
      'logo_url', o.logo_url,
      'established_date', o.established_date
    )
    WHEN 'forum' THEN jsonb_build_object(
      'number_of_sessions', f.number_of_sessions,
      'keynote_speakers', f.keynote_speakers,
      'sponsors', f.sponsors,
      'registration_fee', f.registration_fee,
      'currency', f.currency,
      'agenda_url', f.agenda_url,
      'live_stream_url', f.live_stream_url
    )
    WHEN 'engagement' THEN jsonb_build_object(
      'engagement_type', e.engagement_type,
      'engagement_category', e.engagement_category,
      'location_en', e.location_en,
      'location_ar', e.location_ar
    )
    WHEN 'topic' THEN jsonb_build_object(
      'theme_category', tp.theme_category,
      'parent_theme_id', tp.parent_theme_id
    )
    WHEN 'working_group' THEN jsonb_build_object(
      'mandate_en', wg.mandate_en,
      'mandate_ar', wg.mandate_ar,
      'lead_org_id', wg.lead_org_id,
      'wg_status', wg.wg_status,
      'established_date', wg.established_date,
      'disbandment_date', wg.disbandment_date
    )
    WHEN 'person' THEN jsonb_build_object(
      'person_subtype', p.person_subtype,
      'title_en', p.title_en,
      'title_ar', p.title_ar,
      'organization_id', p.organization_id,
      'nationality_country_id', p.nationality_country_id,
      'email', p.email,
      'phone', p.phone,
      'biography_en', p.biography_en,
      'biography_ar', p.biography_ar,
      'photo_url', p.photo_url,
      'importance_level', p.importance_level,
      -- Elected official specific fields (null for standard persons)
      'office_name_en', p.office_name_en,
      'office_name_ar', p.office_name_ar,
      'office_type', p.office_type,
      'district_en', p.district_en,
      'district_ar', p.district_ar,
      'party_en', p.party_en,
      'party_ar', p.party_ar,
      'party_abbreviation', p.party_abbreviation,
      'party_ideology', p.party_ideology,
      'term_start', p.term_start,
      'term_end', p.term_end,
      'is_current_term', p.is_current_term,
      'term_number', p.term_number,
      'committee_assignments', p.committee_assignments,
      'contact_preferences', p.contact_preferences,
      'email_official', p.email_official,
      'email_personal', p.email_personal,
      'phone_office', p.phone_office,
      'phone_mobile', p.phone_mobile,
      'address_office_en', p.address_office_en,
      'address_office_ar', p.address_office_ar,
      'website_official', p.website_official,
      'website_campaign', p.website_campaign,
      'social_media', p.social_media,
      'staff_contacts', p.staff_contacts,
      'country_id', p.country_id,
      'policy_priorities', p.policy_priorities,
      'notes_en', p.notes_en,
      'notes_ar', p.notes_ar,
      'data_source', p.data_source,
      'data_source_url', p.data_source_url,
      'last_verified_at', p.last_verified_at,
      'last_refresh_at', p.last_refresh_at,
      'refresh_frequency_days', p.refresh_frequency_days
    )
    ELSE NULL
  END AS extension_data

FROM dossiers d
LEFT JOIN countries c ON d.id = c.id AND d.type = 'country'
LEFT JOIN organizations o ON d.id = o.id AND d.type = 'organization'
LEFT JOIN forums f ON d.id = f.id AND d.type = 'forum'
LEFT JOIN engagements e ON d.id = e.id AND d.type = 'engagement'
LEFT JOIN topics tp ON d.id = tp.id AND d.type = 'topic'
LEFT JOIN working_groups wg ON d.id = wg.id AND d.type = 'working_group'
LEFT JOIN persons p ON d.id = p.id AND d.type = 'person';

-- Create unique index on id for efficient lookups and concurrent refresh
CREATE UNIQUE INDEX idx_dossier_list_mv_id ON dossier_list_mv(id);

-- Create indexes for common query patterns
CREATE INDEX idx_dossier_list_mv_type ON dossier_list_mv(type);
CREATE INDEX idx_dossier_list_mv_status ON dossier_list_mv(status);
CREATE INDEX idx_dossier_list_mv_sensitivity ON dossier_list_mv(sensitivity_level);
CREATE INDEX idx_dossier_list_mv_created_at ON dossier_list_mv(created_at DESC);
CREATE INDEX idx_dossier_list_mv_type_status ON dossier_list_mv(type, status) WHERE is_active = TRUE;
CREATE INDEX idx_dossier_list_mv_search ON dossier_list_mv USING GIN(search_vector);
CREATE INDEX idx_dossier_list_mv_tags ON dossier_list_mv USING GIN(tags);

-- Composite index for cursor pagination (created_at DESC, id DESC)
CREATE INDEX idx_dossier_list_mv_cursor ON dossier_list_mv(created_at DESC, id DESC);

-- Index for person_subtype filtering within extension_data
CREATE INDEX idx_dossier_list_mv_person_subtype ON dossier_list_mv((extension_data->>'person_subtype'))
  WHERE type = 'person';

-- ============================================================================
-- PART 4: Recreate Triggers for MV Refresh (without elected_officials)
-- ============================================================================

-- Drop the old trigger on elected_officials
DROP TRIGGER IF EXISTS trg_elected_officials_refresh_mv ON elected_officials;

-- Recreate triggers on dossiers table
DROP TRIGGER IF EXISTS trg_dossiers_refresh_mv ON dossiers;
CREATE TRIGGER trg_dossiers_refresh_mv
  AFTER INSERT OR UPDATE OR DELETE ON dossiers
  FOR EACH STATEMENT
  EXECUTE FUNCTION queue_dossier_list_mv_refresh();

-- Recreate triggers on extension tables
DROP TRIGGER IF EXISTS trg_countries_refresh_mv ON countries;
CREATE TRIGGER trg_countries_refresh_mv
  AFTER INSERT OR UPDATE OR DELETE ON countries
  FOR EACH STATEMENT
  EXECUTE FUNCTION queue_dossier_list_mv_refresh();

DROP TRIGGER IF EXISTS trg_organizations_refresh_mv ON organizations;
CREATE TRIGGER trg_organizations_refresh_mv
  AFTER INSERT OR UPDATE OR DELETE ON organizations
  FOR EACH STATEMENT
  EXECUTE FUNCTION queue_dossier_list_mv_refresh();

DROP TRIGGER IF EXISTS trg_forums_refresh_mv ON forums;
CREATE TRIGGER trg_forums_refresh_mv
  AFTER INSERT OR UPDATE OR DELETE ON forums
  FOR EACH STATEMENT
  EXECUTE FUNCTION queue_dossier_list_mv_refresh();

DROP TRIGGER IF EXISTS trg_engagements_refresh_mv ON engagements;
CREATE TRIGGER trg_engagements_refresh_mv
  AFTER INSERT OR UPDATE OR DELETE ON engagements
  FOR EACH STATEMENT
  EXECUTE FUNCTION queue_dossier_list_mv_refresh();

DROP TRIGGER IF EXISTS trg_topics_refresh_mv ON topics;
CREATE TRIGGER trg_topics_refresh_mv
  AFTER INSERT OR UPDATE OR DELETE ON topics
  FOR EACH STATEMENT
  EXECUTE FUNCTION queue_dossier_list_mv_refresh();

DROP TRIGGER IF EXISTS trg_working_groups_refresh_mv ON working_groups;
CREATE TRIGGER trg_working_groups_refresh_mv
  AFTER INSERT OR UPDATE OR DELETE ON working_groups
  FOR EACH STATEMENT
  EXECUTE FUNCTION queue_dossier_list_mv_refresh();

DROP TRIGGER IF EXISTS trg_persons_refresh_mv ON persons;
CREATE TRIGGER trg_persons_refresh_mv
  AFTER INSERT OR UPDATE OR DELETE ON persons
  FOR EACH STATEMENT
  EXECUTE FUNCTION queue_dossier_list_mv_refresh();

-- ============================================================================
-- PART 5: Update Helper Functions
-- ============================================================================

-- Function: Get person with all related data (updated for elected official fields)
CREATE OR REPLACE FUNCTION get_person_full(p_person_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'person', (
      SELECT row_to_json(p)
      FROM (
        SELECT per.*, d.name_en, d.name_ar, d.description_en, d.description_ar,
               d.status, d.sensitivity_level, d.tags, d.created_at, d.updated_at,
               -- Include elected official data if applicable
               CASE WHEN per.person_subtype = 'elected_official' THEN
                 json_build_object(
                   'office_name_en', per.office_name_en,
                   'office_name_ar', per.office_name_ar,
                   'office_type', per.office_type,
                   'district_en', per.district_en,
                   'district_ar', per.district_ar,
                   'party_en', per.party_en,
                   'party_ar', per.party_ar,
                   'party_abbreviation', per.party_abbreviation,
                   'party_ideology', per.party_ideology,
                   'term_start', per.term_start,
                   'term_end', per.term_end,
                   'is_current_term', per.is_current_term,
                   'term_number', per.term_number,
                   'committee_assignments', per.committee_assignments,
                   'contact_preferences', per.contact_preferences,
                   'email_official', per.email_official,
                   'email_personal', per.email_personal,
                   'phone_office', per.phone_office,
                   'phone_mobile', per.phone_mobile,
                   'address_office_en', per.address_office_en,
                   'address_office_ar', per.address_office_ar,
                   'website_official', per.website_official,
                   'website_campaign', per.website_campaign,
                   'social_media', per.social_media,
                   'staff_contacts', per.staff_contacts,
                   'country_id', per.country_id,
                   'policy_priorities', per.policy_priorities,
                   'notes_en', per.notes_en,
                   'notes_ar', per.notes_ar,
                   'data_source', per.data_source,
                   'data_source_url', per.data_source_url,
                   'last_verified_at', per.last_verified_at,
                   'last_refresh_at', per.last_refresh_at,
                   'refresh_frequency_days', per.refresh_frequency_days
                 )
               ELSE NULL END as elected_official_data
        FROM persons per
        JOIN dossiers d ON d.id = per.id
        WHERE per.id = p_person_id
      ) p
    ),
    'current_role', (
      SELECT row_to_json(r)
      FROM person_roles r
      WHERE r.person_id = p_person_id AND r.is_current = TRUE
      LIMIT 1
    ),
    'roles', (
      SELECT json_agg(row_to_json(r) ORDER BY r.start_date DESC)
      FROM person_roles r
      WHERE r.person_id = p_person_id
    ),
    'affiliations', (
      SELECT json_agg(row_to_json(a) ORDER BY a.start_date DESC)
      FROM person_affiliations a
      WHERE a.person_id = p_person_id AND a.is_active = TRUE
    ),
    'relationships', (
      SELECT json_agg(json_build_object(
        'relationship', row_to_json(pr),
        'related_person', row_to_json(rp)
      ))
      FROM person_relationships pr
      JOIN persons rp ON rp.id = CASE
        WHEN pr.from_person_id = p_person_id THEN pr.to_person_id
        ELSE pr.from_person_id
      END
      JOIN dossiers d ON d.id = rp.id
      WHERE pr.from_person_id = p_person_id OR pr.to_person_id = p_person_id
    ),
    'recent_engagements', (
      SELECT json_agg(json_build_object(
        'link', row_to_json(pe),
        'engagement', row_to_json(e)
      ) ORDER BY e.id DESC)
      FROM person_engagements pe
      JOIN engagements e ON e.id = pe.engagement_id
      WHERE pe.person_id = p_person_id
      LIMIT 10
    ),
    -- Active committees (for elected officials)
    'active_committees', (
      SELECT jsonb_agg(elem)
      FROM persons per,
           jsonb_array_elements(per.committee_assignments) elem
      WHERE per.id = p_person_id
        AND per.person_subtype = 'elected_official'
        AND (elem->>'is_active')::boolean = true
    ),
    -- Key staff (for elected officials)
    'key_staff', (
      SELECT jsonb_agg(elem)
      FROM persons per,
           jsonb_array_elements(per.staff_contacts) elem
      WHERE per.id = p_person_id
        AND per.person_subtype = 'elected_official'
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Search persons with filters (updated to include person_subtype)
CREATE OR REPLACE FUNCTION search_persons_advanced(
  p_search_term TEXT DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL,
  p_nationality_id UUID DEFAULT NULL,
  p_importance_level INTEGER DEFAULT NULL,
  p_person_subtype TEXT DEFAULT NULL,
  p_office_type TEXT DEFAULT NULL,
  p_country_id UUID DEFAULT NULL,
  p_party TEXT DEFAULT NULL,
  p_is_current_term BOOLEAN DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name_en TEXT,
  name_ar TEXT,
  title_en TEXT,
  title_ar TEXT,
  photo_url TEXT,
  organization_id UUID,
  organization_name TEXT,
  importance_level INTEGER,
  email TEXT,
  phone TEXT,
  person_subtype TEXT,
  office_name_en TEXT,
  office_type TEXT,
  party_en TEXT,
  district_en TEXT,
  country_name_en TEXT,
  is_current_term BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    d.name_en,
    d.name_ar,
    p.title_en,
    p.title_ar,
    p.photo_url,
    p.organization_id,
    org_d.name_en as organization_name,
    p.importance_level,
    p.email,
    p.phone,
    p.person_subtype,
    p.office_name_en,
    p.office_type,
    p.party_en,
    p.district_en,
    c_d.name_en as country_name_en,
    p.is_current_term
  FROM persons p
  JOIN dossiers d ON d.id = p.id
  LEFT JOIN dossiers org_d ON org_d.id = p.organization_id
  LEFT JOIN countries c ON c.id = p.country_id
  LEFT JOIN dossiers c_d ON c_d.id = c.id
  WHERE d.status != 'archived'
    AND d.type = 'person'
    AND (p_search_term IS NULL OR (
      d.name_en ILIKE '%' || p_search_term || '%'
      OR d.name_ar ILIKE '%' || p_search_term || '%'
      OR p.title_en ILIKE '%' || p_search_term || '%'
      OR p.email ILIKE '%' || p_search_term || '%'
      OR p.office_name_en ILIKE '%' || p_search_term || '%'
      OR p.party_en ILIKE '%' || p_search_term || '%'
      OR p.district_en ILIKE '%' || p_search_term || '%'
    ))
    AND (p_organization_id IS NULL OR p.organization_id = p_organization_id)
    AND (p_nationality_id IS NULL OR p.nationality_country_id = p_nationality_id)
    AND (p_importance_level IS NULL OR p.importance_level >= p_importance_level)
    AND (p_person_subtype IS NULL OR p.person_subtype = p_person_subtype)
    AND (p_office_type IS NULL OR p.office_type = p_office_type)
    AND (p_country_id IS NULL OR p.country_id = p_country_id)
    AND (p_party IS NULL OR p.party_en ILIKE '%' || p_party || '%')
    AND (p_is_current_term IS NULL OR p.is_current_term = p_is_current_term)
  ORDER BY p.importance_level DESC, d.name_en
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get persons needing data refresh (elected officials)
CREATE OR REPLACE FUNCTION get_persons_needing_refresh(p_limit INTEGER DEFAULT 100)
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
    p.id,
    d.name_en,
    p.data_source,
    p.data_source_url,
    p.last_refresh_at,
    EXTRACT(DAY FROM NOW() - COALESCE(p.last_refresh_at, d.created_at))::INTEGER as days_since_refresh
  FROM persons p
  JOIN dossiers d ON d.id = p.id
  WHERE d.status = 'active'
    AND p.person_subtype = 'elected_official'
    AND (
      p.last_refresh_at IS NULL
      OR (NOW() - p.last_refresh_at) > (p.refresh_frequency_days || ' days')::INTERVAL
    )
  ORDER BY
    COALESCE(p.last_refresh_at, d.created_at) ASC,
    p.importance_level DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Update data refresh timestamp for person
CREATE OR REPLACE FUNCTION mark_person_refreshed(
  p_person_id UUID,
  p_verified BOOLEAN DEFAULT TRUE
)
RETURNS VOID AS $$
BEGIN
  UPDATE persons
  SET
    last_refresh_at = NOW(),
    last_verified_at = CASE WHEN p_verified THEN NOW() ELSE last_verified_at END
  WHERE id = p_person_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 6: Grant Permissions
-- ============================================================================

-- Grant select on materialized view to authenticated users
GRANT SELECT ON dossier_list_mv TO authenticated;

-- Grant execute on new/updated functions
GRANT EXECUTE ON FUNCTION get_person_full TO authenticated;
GRANT EXECUTE ON FUNCTION search_persons_advanced TO authenticated;
GRANT EXECUTE ON FUNCTION get_persons_needing_refresh TO authenticated;
GRANT EXECUTE ON FUNCTION mark_person_refreshed TO authenticated;

-- ============================================================================
-- PART 7: Documentation
-- ============================================================================

COMMENT ON COLUMN persons.person_subtype IS 'Discriminator for person subtypes: standard (regular person) or elected_official (government contact)';
COMMENT ON COLUMN persons.office_name_en IS 'Office name in English (elected officials only)';
COMMENT ON COLUMN persons.office_type IS 'Type of governmental office: head_of_state, cabinet_minister, legislature_upper, etc.';
COMMENT ON COLUMN persons.committee_assignments IS 'JSONB array of committee assignments with name, role, and active status';
COMMENT ON COLUMN persons.contact_preferences IS 'JSONB object with preferred contact channel, best time, and protocol notes';
COMMENT ON COLUMN persons.staff_contacts IS 'JSONB array of key staff members for scheduling and contact';
COMMENT ON COLUMN persons.policy_priorities IS 'JSONB array of policy area tags for this person';
COMMENT ON COLUMN persons.data_source IS 'Source of data for automated refresh: official_website, api_gov, manual';

COMMENT ON FUNCTION get_persons_needing_refresh IS 'Get list of elected official persons whose data needs to be refreshed';
COMMENT ON FUNCTION mark_person_refreshed IS 'Mark a person as refreshed after automated data update';

-- ============================================================================
-- Migration Complete
-- ============================================================================
