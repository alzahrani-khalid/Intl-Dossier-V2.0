-- ============================================================================
-- Migration: Persons Entity Management Enhancement
-- Date: 2026-01-10
-- Feature: persons-entity-management
-- Description: Enhance person dossiers with roles, relationships, and engagement tracking
-- ============================================================================

-- ============================================================================
-- PART 1: Enhance persons extension table
-- ============================================================================

-- Add new columns to persons table for comprehensive contact management
ALTER TABLE persons ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS twitter_url TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS expertise_areas TEXT[] DEFAULT '{}';
ALTER TABLE persons ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';
ALTER TABLE persons ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS importance_level INTEGER DEFAULT 1 CHECK (importance_level BETWEEN 1 AND 5);
-- 1 = Regular contact, 2 = Important, 3 = Key contact, 4 = VIP, 5 = Critical

-- Add search vector for full-text search on persons
ALTER TABLE persons ADD COLUMN IF NOT EXISTS search_vector TSVECTOR GENERATED ALWAYS AS (
  setweight(to_tsvector('simple', coalesce(title_en, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(title_ar, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(biography_en, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(biography_ar, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(email, '')), 'C')
) STORED;

CREATE INDEX IF NOT EXISTS idx_persons_search_vector ON persons USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_persons_organization ON persons(organization_id);
CREATE INDEX IF NOT EXISTS idx_persons_nationality ON persons(nationality_country_id);
CREATE INDEX IF NOT EXISTS idx_persons_importance ON persons(importance_level);

-- ============================================================================
-- PART 2: Person Roles (Career History)
-- ============================================================================

CREATE TABLE IF NOT EXISTS person_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  organization_name_en TEXT, -- For external orgs not in our system
  organization_name_ar TEXT,
  role_title_en TEXT NOT NULL,
  role_title_ar TEXT,
  department_en TEXT,
  department_ar TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  description_en TEXT,
  description_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT current_has_no_end CHECK (is_current = FALSE OR end_date IS NULL)
);

CREATE INDEX idx_person_roles_person_id ON person_roles(person_id);
CREATE INDEX idx_person_roles_organization ON person_roles(organization_id);
CREATE INDEX idx_person_roles_dates ON person_roles(start_date DESC, end_date);
CREATE INDEX idx_person_roles_current ON person_roles(person_id) WHERE is_current = TRUE;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_person_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_person_roles_updated_at
  BEFORE UPDATE ON person_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_person_roles_updated_at();

-- RLS Policies for person_roles
ALTER TABLE person_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view person roles"
  ON person_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM persons p
      JOIN dossiers d ON d.id = p.id
      WHERE p.id = person_roles.person_id
      AND d.status != 'archived'
    )
  );

CREATE POLICY "Users can create person roles"
  ON person_roles FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own person roles"
  ON person_roles FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own person roles"
  ON person_roles FOR DELETE
  USING (created_by = auth.uid());

-- ============================================================================
-- PART 3: Person-to-Person Relationships
-- ============================================================================

CREATE TABLE IF NOT EXISTS person_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  to_person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'reports_to',      -- Hierarchical
    'supervises',      -- Hierarchical
    'colleague',       -- Peer
    'collaborates_with', -- Working together
    'mentors',         -- Professional development
    'knows',           -- General acquaintance
    'former_colleague', -- Historical
    'referral'         -- Introduction/referral
  )),
  strength INTEGER DEFAULT 3 CHECK (strength BETWEEN 1 AND 5),
  -- 1 = Weak, 2 = Casual, 3 = Normal, 4 = Strong, 5 = Very Strong
  notes TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT no_self_relationship CHECK (from_person_id != to_person_id),
  CONSTRAINT valid_relationship_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE UNIQUE INDEX idx_person_relationships_unique
  ON person_relationships(from_person_id, to_person_id, relationship_type);
CREATE INDEX idx_person_relationships_from ON person_relationships(from_person_id);
CREATE INDEX idx_person_relationships_to ON person_relationships(to_person_id);
CREATE INDEX idx_person_relationships_type ON person_relationships(relationship_type);

-- RLS Policies for person_relationships
ALTER TABLE person_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view person relationships"
  ON person_relationships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM persons p
      JOIN dossiers d ON d.id = p.id
      WHERE p.id IN (person_relationships.from_person_id, person_relationships.to_person_id)
      AND d.status != 'archived'
    )
  );

CREATE POLICY "Users can create person relationships"
  ON person_relationships FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own person relationships"
  ON person_relationships FOR DELETE
  USING (created_by = auth.uid());

-- ============================================================================
-- PART 4: Person Engagement History (Person-to-Engagement Links)
-- ============================================================================

CREATE TABLE IF NOT EXISTS person_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN (
    'organizer',
    'presenter',
    'attendee',
    'speaker',
    'moderator',
    'observer',
    'delegate',
    'advisor',
    'guest'
  )),
  notes TEXT,
  attended BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT unique_person_engagement_role UNIQUE (person_id, engagement_id, role)
);

CREATE INDEX idx_person_engagements_person ON person_engagements(person_id);
CREATE INDEX idx_person_engagements_engagement ON person_engagements(engagement_id);
CREATE INDEX idx_person_engagements_role ON person_engagements(role);

-- RLS Policies for person_engagements
ALTER TABLE person_engagements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view person engagements"
  ON person_engagements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM persons p
      JOIN dossiers d ON d.id = p.id
      WHERE p.id = person_engagements.person_id
      AND d.status != 'archived'
    )
  );

CREATE POLICY "Users can create person engagements"
  ON person_engagements FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own person engagements"
  ON person_engagements FOR DELETE
  USING (created_by = auth.uid());

-- ============================================================================
-- PART 5: Person Organization Affiliations (beyond primary org)
-- ============================================================================

CREATE TABLE IF NOT EXISTS person_affiliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  organization_name_en TEXT, -- For external orgs
  organization_name_ar TEXT,
  affiliation_type TEXT NOT NULL CHECK (affiliation_type IN (
    'member',
    'board_member',
    'advisor',
    'consultant',
    'representative',
    'delegate',
    'liaison',
    'partner',
    'volunteer',
    'alumni'
  )),
  position_title_en TEXT,
  position_title_ar TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT valid_affiliation_dates CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT active_has_no_end CHECK (is_active = FALSE OR end_date IS NULL)
);

CREATE INDEX idx_person_affiliations_person ON person_affiliations(person_id);
CREATE INDEX idx_person_affiliations_organization ON person_affiliations(organization_id);
CREATE INDEX idx_person_affiliations_type ON person_affiliations(affiliation_type);
CREATE INDEX idx_person_affiliations_active ON person_affiliations(person_id) WHERE is_active = TRUE;

-- Trigger to update updated_at
CREATE TRIGGER trigger_update_person_affiliations_updated_at
  BEFORE UPDATE ON person_affiliations
  FOR EACH ROW
  EXECUTE FUNCTION update_person_roles_updated_at();

-- RLS Policies for person_affiliations
ALTER TABLE person_affiliations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view person affiliations"
  ON person_affiliations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM persons p
      JOIN dossiers d ON d.id = p.id
      WHERE p.id = person_affiliations.person_id
      AND d.status != 'archived'
    )
  );

CREATE POLICY "Users can create person affiliations"
  ON person_affiliations FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own person affiliations"
  ON person_affiliations FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own person affiliations"
  ON person_affiliations FOR DELETE
  USING (created_by = auth.uid());

-- ============================================================================
-- PART 6: Helper Functions
-- ============================================================================

-- Function: Get person with all related data
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
               d.status, d.sensitivity_level, d.tags, d.created_at, d.updated_at
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
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get person's network (relationships graph data)
CREATE OR REPLACE FUNCTION get_person_network(
  p_person_id UUID,
  p_depth INTEGER DEFAULT 1
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH RECURSIVE network AS (
    -- Base: the person themselves
    SELECT
      per.id,
      d.name_en,
      d.name_ar,
      per.photo_url,
      0 as depth,
      ARRAY[per.id] as path
    FROM persons per
    JOIN dossiers d ON d.id = per.id
    WHERE per.id = p_person_id

    UNION ALL

    -- Recursive: connected persons
    SELECT
      per.id,
      d.name_en,
      d.name_ar,
      per.photo_url,
      n.depth + 1,
      n.path || per.id
    FROM person_relationships pr
    JOIN network n ON (pr.from_person_id = n.id OR pr.to_person_id = n.id)
    JOIN persons per ON per.id = CASE
      WHEN pr.from_person_id = n.id THEN pr.to_person_id
      ELSE pr.from_person_id
    END
    JOIN dossiers d ON d.id = per.id
    WHERE n.depth < p_depth
      AND per.id != ALL(n.path)
      AND d.status != 'archived'
  )
  SELECT json_build_object(
    'nodes', (
      SELECT json_agg(DISTINCT jsonb_build_object(
        'id', n.id,
        'name_en', n.name_en,
        'name_ar', n.name_ar,
        'photo_url', n.photo_url,
        'depth', n.depth
      ))
      FROM network n
    ),
    'edges', (
      SELECT json_agg(DISTINCT jsonb_build_object(
        'from', pr.from_person_id,
        'to', pr.to_person_id,
        'type', pr.relationship_type,
        'strength', pr.strength
      ))
      FROM person_relationships pr
      WHERE EXISTS (SELECT 1 FROM network n WHERE n.id = pr.from_person_id)
        AND EXISTS (SELECT 1 FROM network n WHERE n.id = pr.to_person_id)
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Search persons with full-text and filters
CREATE OR REPLACE FUNCTION search_persons_advanced(
  p_search_term TEXT DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL,
  p_nationality_id UUID DEFAULT NULL,
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
  photo_url TEXT,
  organization_id UUID,
  organization_name TEXT,
  importance_level INTEGER,
  email TEXT,
  phone TEXT
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
    p.phone
  FROM persons p
  JOIN dossiers d ON d.id = p.id
  LEFT JOIN dossiers org_d ON org_d.id = p.organization_id
  WHERE d.status != 'archived'
    AND d.type = 'person'
    AND (p_search_term IS NULL OR (
      d.name_en ILIKE '%' || p_search_term || '%'
      OR d.name_ar ILIKE '%' || p_search_term || '%'
      OR p.title_en ILIKE '%' || p_search_term || '%'
      OR p.email ILIKE '%' || p_search_term || '%'
    ))
    AND (p_organization_id IS NULL OR p.organization_id = p_organization_id)
    AND (p_nationality_id IS NULL OR p.nationality_country_id = p_nationality_id)
    AND (p_importance_level IS NULL OR p.importance_level >= p_importance_level)
  ORDER BY p.importance_level DESC, d.name_en
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- PART 7: Comments for Documentation
-- ============================================================================

COMMENT ON TABLE person_roles IS 'Career history and positions held by persons over time';
COMMENT ON TABLE person_relationships IS 'Professional and personal relationships between persons';
COMMENT ON TABLE person_engagements IS 'Links between persons and engagement events they participated in';
COMMENT ON TABLE person_affiliations IS 'Secondary organization affiliations beyond primary employment';
COMMENT ON FUNCTION get_person_full(UUID) IS 'Get complete person profile with all related data';
COMMENT ON FUNCTION get_person_network(UUID, INTEGER) IS 'Get relationship network graph data for visualization';
COMMENT ON FUNCTION search_persons_advanced IS 'Advanced person search with multiple filter options';

-- ============================================================================
-- Migration Complete
-- ============================================================================
