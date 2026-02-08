-- ============================================================================
-- Migration: Organization Contacts
-- Date: 2026-02-06
-- Feature: use-case-repository
-- Description: Organization contact directory and focal point management
-- Covers: UC-013, UC-034
-- ============================================================================

-- ============================================================================
-- PART 1: Create organization_contacts table
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Contact type classification
  contact_type TEXT NOT NULL CHECK (contact_type IN (
    'focal_point',    -- نقطة الاتصال - Primary contact for specific matters
    'general',        -- General inquiries
    'protocol',       -- Protocol/diplomatic matters
    'technical',      -- Technical support
    'administrative', -- Administrative matters
    'media',          -- Press/media relations
    'legal',          -- Legal affairs
    'financial',      -- Financial/billing
    'emergency'       -- Emergency contact
  )),

  -- Contact person details
  person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  -- For external contacts not in persons table
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  title_en TEXT,
  title_ar TEXT,
  department_en TEXT,
  department_ar TEXT,

  -- Contact information
  email TEXT,
  email_secondary TEXT,
  phone TEXT,
  phone_secondary TEXT,
  mobile TEXT,
  fax TEXT,
  address_en TEXT,
  address_ar TEXT,

  -- Availability and scope
  is_primary BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true, -- Can be shared externally
  available_hours TEXT, -- e.g., "Sun-Thu 8:00-16:00"
  languages TEXT[] DEFAULT '{}'::TEXT[], -- Languages spoken

  -- Subject matter expertise (for focal points)
  expertise_areas TEXT[] DEFAULT '{}'::TEXT[],
  topics TEXT[] DEFAULT '{}'::TEXT[], -- Specific topics they handle

  -- Validity period
  valid_from DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true,

  -- Notes
  notes TEXT,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  _version INTEGER DEFAULT 1,

  -- Constraints
  CONSTRAINT valid_contact_dates CHECK (valid_until IS NULL OR valid_until >= valid_from),
  CONSTRAINT active_not_expired CHECK (is_active = FALSE OR valid_until IS NULL OR valid_until >= CURRENT_DATE)
);

-- ============================================================================
-- PART 2: Create contact_topics junction for detailed topic tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS contact_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES organization_contacts(id) ON DELETE CASCADE,
  topic_en TEXT NOT NULL,
  topic_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PART 3: Create indexes for performance
-- ============================================================================

-- Primary lookups
CREATE INDEX idx_org_contacts_org ON organization_contacts(organization_id);
CREATE INDEX idx_org_contacts_person ON organization_contacts(person_id)
  WHERE person_id IS NOT NULL;
CREATE INDEX idx_org_contacts_type ON organization_contacts(organization_id, contact_type);

-- Primary contacts per organization
CREATE INDEX idx_org_contacts_primary ON organization_contacts(organization_id, contact_type)
  WHERE is_primary = true AND is_active = true AND deleted_at IS NULL;

-- Active contacts
CREATE INDEX idx_org_contacts_active ON organization_contacts(organization_id)
  WHERE is_active = true AND deleted_at IS NULL;

-- Focal points specifically
CREATE INDEX idx_org_contacts_focal_points ON organization_contacts(organization_id)
  WHERE contact_type = 'focal_point' AND is_active = true AND deleted_at IS NULL;

-- Search indexes
CREATE INDEX idx_org_contacts_email ON organization_contacts(email)
  WHERE email IS NOT NULL;
CREATE INDEX idx_org_contacts_search ON organization_contacts
  USING gin(to_tsvector('simple', name_en || ' ' || COALESCE(name_ar, '') || ' ' || COALESCE(title_en, '')));

-- Expertise areas
CREATE INDEX idx_org_contacts_expertise ON organization_contacts USING gin(expertise_areas);
CREATE INDEX idx_org_contacts_topics ON organization_contacts USING gin(topics);

-- Contact topics indexes
CREATE INDEX idx_contact_topics_contact ON contact_topics(contact_id);

-- ============================================================================
-- PART 4: Triggers
-- ============================================================================

-- Update timestamp trigger
CREATE TRIGGER update_org_contacts_updated_at
  BEFORE UPDATE ON organization_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Version increment trigger
CREATE OR REPLACE FUNCTION increment_org_contacts_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW._version = OLD._version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_org_contacts_version
  BEFORE UPDATE ON organization_contacts
  FOR EACH ROW
  EXECUTE FUNCTION increment_org_contacts_version();

-- Ensure only one primary contact per type per organization
CREATE OR REPLACE FUNCTION ensure_single_primary_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE organization_contacts
    SET is_primary = false
    WHERE organization_id = NEW.organization_id
      AND contact_type = NEW.contact_type
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_primary_contact
  BEFORE INSERT OR UPDATE OF is_primary ON organization_contacts
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION ensure_single_primary_contact();

-- ============================================================================
-- PART 5: RLS Policies
-- ============================================================================

ALTER TABLE organization_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_topics ENABLE ROW LEVEL SECURITY;

-- View policy: Public contacts visible to all, non-public to authenticated only
CREATE POLICY "Users can view organization contacts"
  ON organization_contacts FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      is_public = true
      OR auth.uid() IS NOT NULL
    )
  );

-- Insert policy: Authenticated users
CREATE POLICY "Authenticated users can create contacts"
  ON organization_contacts FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
  );

-- Update policy: Creator can update
CREATE POLICY "Creator can update contacts"
  ON organization_contacts FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Soft delete policy
CREATE POLICY "Creator can soft delete contacts"
  ON organization_contacts FOR UPDATE
  USING (created_by = auth.uid());

-- Contact topics policies
CREATE POLICY "Users can view contact topics"
  ON contact_topics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_contacts oc
      WHERE oc.id = contact_topics.contact_id
      AND oc.deleted_at IS NULL
    )
  );

CREATE POLICY "Authenticated users can manage contact topics"
  ON contact_topics FOR ALL
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PART 6: Helper Functions
-- ============================================================================

-- Function: Get all contacts for an organization
CREATE OR REPLACE FUNCTION get_organization_contacts(
  p_organization_id UUID,
  p_contact_type TEXT DEFAULT NULL,
  p_active_only BOOLEAN DEFAULT true
)
RETURNS TABLE (
  id UUID,
  contact_type TEXT,
  person_id UUID,
  name_en TEXT,
  name_ar TEXT,
  title_en TEXT,
  title_ar TEXT,
  department_en TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  is_primary BOOLEAN,
  is_public BOOLEAN,
  expertise_areas TEXT[],
  languages TEXT[],
  valid_until DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    oc.id,
    oc.contact_type,
    oc.person_id,
    oc.name_en,
    oc.name_ar,
    oc.title_en,
    oc.title_ar,
    oc.department_en,
    oc.email,
    oc.phone,
    oc.mobile,
    oc.is_primary,
    oc.is_public,
    oc.expertise_areas,
    oc.languages,
    oc.valid_until
  FROM organization_contacts oc
  WHERE oc.organization_id = p_organization_id
    AND oc.deleted_at IS NULL
    AND (p_contact_type IS NULL OR oc.contact_type = p_contact_type)
    AND (p_active_only = false OR oc.is_active = true)
  ORDER BY
    oc.is_primary DESC,
    CASE oc.contact_type
      WHEN 'focal_point' THEN 1
      WHEN 'general' THEN 2
      WHEN 'protocol' THEN 3
      ELSE 4
    END,
    oc.name_en;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get focal points for an organization by topic
CREATE OR REPLACE FUNCTION get_focal_points_by_topic(
  p_organization_id UUID,
  p_topic TEXT
)
RETURNS TABLE (
  id UUID,
  name_en TEXT,
  name_ar TEXT,
  title_en TEXT,
  email TEXT,
  phone TEXT,
  expertise_areas TEXT[],
  match_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    oc.id,
    oc.name_en,
    oc.name_ar,
    oc.title_en,
    oc.email,
    oc.phone,
    oc.expertise_areas,
    ts_rank(
      to_tsvector('simple', COALESCE(array_to_string(oc.expertise_areas, ' '), '') || ' ' || COALESCE(array_to_string(oc.topics, ' '), '')),
      plainto_tsquery('simple', p_topic)
    ) as match_score
  FROM organization_contacts oc
  WHERE oc.organization_id = p_organization_id
    AND oc.contact_type = 'focal_point'
    AND oc.is_active = true
    AND oc.deleted_at IS NULL
    AND (
      p_topic = ANY(oc.expertise_areas)
      OR p_topic = ANY(oc.topics)
      OR to_tsvector('simple', COALESCE(array_to_string(oc.expertise_areas, ' '), '') || ' ' || COALESCE(array_to_string(oc.topics, ' '), ''))
         @@ plainto_tsquery('simple', p_topic)
    )
  ORDER BY match_score DESC, oc.is_primary DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Find contacts by email across organizations
CREATE OR REPLACE FUNCTION find_contacts_by_email(p_email TEXT)
RETURNS TABLE (
  contact_id UUID,
  organization_id UUID,
  organization_name_en TEXT,
  name_en TEXT,
  title_en TEXT,
  contact_type TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    oc.id as contact_id,
    oc.organization_id,
    o.name_en as organization_name_en,
    oc.name_en,
    oc.title_en,
    oc.contact_type,
    oc.is_active
  FROM organization_contacts oc
  JOIN organizations o ON oc.organization_id = o.id
  WHERE (oc.email ILIKE p_email OR oc.email_secondary ILIKE p_email)
    AND oc.deleted_at IS NULL
  ORDER BY oc.is_active DESC, oc.is_primary DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get primary contact for each type for an organization
CREATE OR REPLACE FUNCTION get_primary_contacts(p_organization_id UUID)
RETURNS TABLE (
  contact_type TEXT,
  id UUID,
  name_en TEXT,
  name_ar TEXT,
  title_en TEXT,
  email TEXT,
  phone TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (oc.contact_type)
    oc.contact_type,
    oc.id,
    oc.name_en,
    oc.name_ar,
    oc.title_en,
    oc.email,
    oc.phone
  FROM organization_contacts oc
  WHERE oc.organization_id = p_organization_id
    AND oc.is_active = true
    AND oc.deleted_at IS NULL
  ORDER BY oc.contact_type, oc.is_primary DESC, oc.created_at;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PART 7: View for easy access to active contacts
-- ============================================================================

CREATE OR REPLACE VIEW active_organization_contacts AS
SELECT
  oc.id,
  oc.organization_id,
  o.name_en as organization_name_en,
  o.name_ar as organization_name_ar,
  oc.contact_type,
  oc.name_en,
  oc.name_ar,
  oc.title_en,
  oc.title_ar,
  oc.department_en,
  oc.email,
  oc.phone,
  oc.mobile,
  oc.is_primary,
  oc.expertise_areas,
  oc.languages
FROM organization_contacts oc
JOIN organizations o ON oc.organization_id = o.id
WHERE oc.is_active = true
  AND oc.deleted_at IS NULL
  AND (oc.valid_until IS NULL OR oc.valid_until >= CURRENT_DATE);

-- ============================================================================
-- PART 8: Grants
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON organization_contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON contact_topics TO authenticated;
GRANT SELECT ON active_organization_contacts TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_contacts(UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_focal_points_by_topic(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION find_contacts_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_primary_contacts(UUID) TO authenticated;

-- ============================================================================
-- PART 9: Comments
-- ============================================================================

COMMENT ON TABLE organization_contacts IS 'Contact directory for organizations including focal points, general contacts, and specialized contacts';
COMMENT ON TABLE contact_topics IS 'Topics/subjects that a contact handles (for focal point matching)';
COMMENT ON COLUMN organization_contacts.contact_type IS 'Type of contact: focal_point, general, protocol, technical, administrative, media, legal, financial, emergency';
COMMENT ON COLUMN organization_contacts.expertise_areas IS 'Array of expertise areas for this contact';
COMMENT ON COLUMN organization_contacts.topics IS 'Specific topics this contact handles';
COMMENT ON VIEW active_organization_contacts IS 'View of all currently active organization contacts';
COMMENT ON FUNCTION get_organization_contacts IS 'Get all contacts for an organization with optional type filter';
COMMENT ON FUNCTION get_focal_points_by_topic IS 'Find focal points for an organization that handle a specific topic';
COMMENT ON FUNCTION find_contacts_by_email IS 'Find contacts across organizations by email address';
COMMENT ON FUNCTION get_primary_contacts IS 'Get the primary contact for each contact type for an organization';

-- ============================================================================
-- Migration Complete
-- ============================================================================
