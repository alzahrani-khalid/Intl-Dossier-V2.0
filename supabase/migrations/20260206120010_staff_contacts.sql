-- ============================================================================
-- Migration: Staff Contacts
-- Date: 2026-02-06
-- Feature: use-case-repository
-- Description: Internal staff contact directory for coordination
-- Covers: UC-024, UC-025, UC-039
-- ============================================================================

-- ============================================================================
-- PART 1: Create departments table (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Department details (bilingual)
  code TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,

  -- Hierarchy
  parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  level INTEGER DEFAULT 1,

  -- Head of department
  head_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  head_name_en TEXT,
  head_name_ar TEXT,
  head_title_en TEXT,
  head_title_ar TEXT,

  -- Contact information
  email TEXT,
  phone TEXT,
  extension TEXT,
  location_en TEXT,
  location_ar TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  responsibilities_en TEXT,
  responsibilities_ar TEXT,
  specializations TEXT[] DEFAULT '{}',

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================================
-- PART 2: Create staff_contacts table
-- ============================================================================

CREATE TABLE IF NOT EXISTS staff_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Department association
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,

  -- User link (if staff member has system account)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Staff details (bilingual)
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  title_en TEXT,
  title_ar TEXT,

  -- Position in department
  position_level TEXT DEFAULT 'staff' CHECK (position_level IN (
    'head',           -- Department head
    'deputy',         -- Deputy/vice
    'director',       -- Director
    'manager',        -- Manager
    'supervisor',     -- Supervisor
    'senior',         -- Senior staff
    'staff',          -- Regular staff
    'assistant',      -- Assistant
    'intern'          -- Intern/trainee
  )),

  -- Contact information
  email TEXT NOT NULL,
  email_secondary TEXT,
  phone TEXT,
  phone_secondary TEXT,
  mobile TEXT,
  extension TEXT,
  fax TEXT,

  -- Office location
  building_en TEXT,
  building_ar TEXT,
  floor TEXT,
  office_number TEXT,

  -- Availability
  working_hours_en TEXT, -- e.g., "Sun-Thu 8:00-16:00"
  working_hours_ar TEXT,
  timezone TEXT DEFAULT 'Asia/Riyadh',
  is_available BOOLEAN DEFAULT true,
  availability_notes TEXT,

  -- Expertise and specializations
  specializations TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}'::TEXT[],
  expertise_areas TEXT[] DEFAULT '{}',

  -- Delegation handling
  delegates_to_id UUID REFERENCES staff_contacts(id) ON DELETE SET NULL,
  delegation_start DATE,
  delegation_end DATE,
  delegation_reason TEXT,

  -- Photo
  photo_url TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,

  -- Metadata
  notes TEXT,
  linkedin_url TEXT,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================================
-- PART 3: Create staff_topic_assignments table
-- ============================================================================

-- Track which staff members handle which topics/dossiers
CREATE TABLE IF NOT EXISTS staff_topic_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff_contacts(id) ON DELETE CASCADE,

  -- Assignment type
  assignment_type TEXT NOT NULL CHECK (assignment_type IN (
    'country',          -- Country dossier
    'organization',     -- Organization
    'forum',            -- Forum
    'topic',            -- Subject area/topic
    'dossier',          -- Specific dossier
    'mou',              -- MoU management
    'correspondence',   -- Correspondence type
    'other'             -- Other assignment
  )),

  -- Reference (could be country_id, org_id, dossier_id, or topic name)
  reference_id UUID,
  reference_name_en TEXT NOT NULL,
  reference_name_ar TEXT NOT NULL,

  -- Role
  role TEXT DEFAULT 'primary' CHECK (role IN (
    'primary',          -- Primary point of contact
    'secondary',        -- Backup/secondary
    'backup',           -- Backup only
    'expert',           -- Subject matter expert
    'coordinator'       -- Coordination role
  )),

  -- Assignment period
  assigned_from DATE,
  assigned_until DATE,
  is_active BOOLEAN DEFAULT true,

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Unique primary assignment per topic
  CONSTRAINT unique_primary_assignment UNIQUE (assignment_type, reference_id, role)
    WHERE role = 'primary' AND is_active = true
);

-- ============================================================================
-- PART 4: Create indexes for performance
-- ============================================================================

-- Departments indexes
CREATE INDEX idx_departments_parent ON departments(parent_department_id)
  WHERE parent_department_id IS NOT NULL;
CREATE INDEX idx_departments_active ON departments(id) WHERE is_active = true;
CREATE INDEX idx_departments_code ON departments(code);

-- Staff contacts indexes
CREATE INDEX idx_staff_contacts_department ON staff_contacts(department_id);
CREATE INDEX idx_staff_contacts_user ON staff_contacts(user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX idx_staff_contacts_email ON staff_contacts(email);
CREATE INDEX idx_staff_contacts_active ON staff_contacts(department_id)
  WHERE is_active = true;
CREATE INDEX idx_staff_contacts_level ON staff_contacts(department_id, position_level);
CREATE INDEX idx_staff_contacts_delegates ON staff_contacts(delegates_to_id)
  WHERE delegates_to_id IS NOT NULL;

-- Specializations/expertise search
CREATE INDEX idx_staff_contacts_specializations ON staff_contacts USING gin(specializations);
CREATE INDEX idx_staff_contacts_expertise ON staff_contacts USING gin(expertise_areas);
CREATE INDEX idx_staff_contacts_languages ON staff_contacts USING gin(languages);

-- Full-text search
CREATE INDEX idx_staff_contacts_search ON staff_contacts
  USING gin(to_tsvector('simple', name_en || ' ' || COALESCE(name_ar, '') || ' ' || COALESCE(title_en, '')));

-- Topic assignments indexes
CREATE INDEX idx_staff_topic_assignments_staff ON staff_topic_assignments(staff_id);
CREATE INDEX idx_staff_topic_assignments_type ON staff_topic_assignments(assignment_type);
CREATE INDEX idx_staff_topic_assignments_ref ON staff_topic_assignments(assignment_type, reference_id);
CREATE INDEX idx_staff_topic_assignments_active ON staff_topic_assignments(staff_id)
  WHERE is_active = true;

-- ============================================================================
-- PART 5: Triggers
-- ============================================================================

-- Update timestamp triggers
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_contacts_updated_at
  BEFORE UPDATE ON staff_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-set department level based on parent
CREATE OR REPLACE FUNCTION set_department_level()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_department_id IS NULL THEN
    NEW.level = 1;
  ELSE
    SELECT level + 1 INTO NEW.level
    FROM departments
    WHERE id = NEW.parent_department_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_department_level
  BEFORE INSERT OR UPDATE OF parent_department_id ON departments
  FOR EACH ROW
  EXECUTE FUNCTION set_department_level();

-- ============================================================================
-- PART 6: RLS Policies
-- ============================================================================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_topic_assignments ENABLE ROW LEVEL SECURITY;

-- Departments policies (internal visibility)
CREATE POLICY "Authenticated users can view departments"
  ON departments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage departments"
  ON departments FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Staff contacts policies
CREATE POLICY "Authenticated users can view staff contacts"
  ON staff_contacts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage staff contacts"
  ON staff_contacts FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Topic assignments policies
CREATE POLICY "Authenticated users can view topic assignments"
  ON staff_topic_assignments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage topic assignments"
  ON staff_topic_assignments FOR ALL
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- PART 7: Helper Functions
-- ============================================================================

-- Function: Get department with staff
CREATE OR REPLACE FUNCTION get_department_staff(
  p_department_id UUID,
  p_include_inactive BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  name_en TEXT,
  name_ar TEXT,
  title_en TEXT,
  position_level TEXT,
  email TEXT,
  phone TEXT,
  extension TEXT,
  is_available BOOLEAN,
  specializations TEXT[],
  is_delegating BOOLEAN,
  delegates_to_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.id,
    sc.name_en,
    sc.name_ar,
    sc.title_en,
    sc.position_level,
    sc.email,
    sc.phone,
    sc.extension,
    sc.is_available,
    sc.specializations,
    (sc.delegates_to_id IS NOT NULL AND sc.delegation_end >= CURRENT_DATE) as is_delegating,
    (SELECT delegate.name_en FROM staff_contacts delegate WHERE delegate.id = sc.delegates_to_id) as delegates_to_name
  FROM staff_contacts sc
  WHERE sc.department_id = p_department_id
    AND (p_include_inactive = true OR sc.is_active = true)
  ORDER BY
    CASE sc.position_level
      WHEN 'head' THEN 1
      WHEN 'deputy' THEN 2
      WHEN 'director' THEN 3
      WHEN 'manager' THEN 4
      WHEN 'supervisor' THEN 5
      WHEN 'senior' THEN 6
      ELSE 7
    END,
    sc.name_en;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Find staff by topic/expertise
CREATE OR REPLACE FUNCTION find_staff_by_topic(
  p_topic TEXT,
  p_department_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name_en TEXT,
  name_ar TEXT,
  title_en TEXT,
  department_id UUID,
  department_name_en TEXT,
  email TEXT,
  phone TEXT,
  assignment_role TEXT,
  match_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- First: Direct topic assignments
  SELECT DISTINCT
    sc.id,
    sc.name_en,
    sc.name_ar,
    sc.title_en,
    sc.department_id,
    d.name_en as department_name_en,
    sc.email,
    sc.phone,
    sta.role as assignment_role,
    'assigned' as match_type
  FROM staff_contacts sc
  JOIN departments d ON sc.department_id = d.id
  JOIN staff_topic_assignments sta ON sta.staff_id = sc.id
  WHERE sc.is_active = true
    AND sta.is_active = true
    AND sta.reference_name_en ILIKE '%' || p_topic || '%'
    AND (p_department_id IS NULL OR sc.department_id = p_department_id)

  UNION

  -- Second: Expertise match
  SELECT DISTINCT
    sc.id,
    sc.name_en,
    sc.name_ar,
    sc.title_en,
    sc.department_id,
    d.name_en as department_name_en,
    sc.email,
    sc.phone,
    'expert' as assignment_role,
    'expertise' as match_type
  FROM staff_contacts sc
  JOIN departments d ON sc.department_id = d.id
  WHERE sc.is_active = true
    AND (
      p_topic = ANY(sc.expertise_areas)
      OR p_topic = ANY(sc.specializations)
    )
    AND (p_department_id IS NULL OR sc.department_id = p_department_id)

  ORDER BY
    CASE match_type WHEN 'assigned' THEN 1 ELSE 2 END,
    CASE assignment_role WHEN 'primary' THEN 1 WHEN 'expert' THEN 2 ELSE 3 END;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get contact for a specific topic
CREATE OR REPLACE FUNCTION get_topic_contact(
  p_assignment_type TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_reference_name TEXT DEFAULT NULL
)
RETURNS TABLE (
  staff_id UUID,
  name_en TEXT,
  name_ar TEXT,
  title_en TEXT,
  email TEXT,
  phone TEXT,
  department_name_en TEXT,
  role TEXT,
  effective_contact_id UUID,
  effective_contact_name TEXT,
  is_delegated BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH assigned_staff AS (
    SELECT
      sc.id as staff_id,
      sc.name_en,
      sc.name_ar,
      sc.title_en,
      sc.email,
      sc.phone,
      d.name_en as department_name_en,
      sta.role,
      sc.delegates_to_id,
      sc.delegation_end
    FROM staff_topic_assignments sta
    JOIN staff_contacts sc ON sta.staff_id = sc.id
    JOIN departments d ON sc.department_id = d.id
    WHERE sta.assignment_type = p_assignment_type
      AND sta.is_active = true
      AND sc.is_active = true
      AND (
        (p_reference_id IS NOT NULL AND sta.reference_id = p_reference_id)
        OR (p_reference_name IS NOT NULL AND sta.reference_name_en ILIKE '%' || p_reference_name || '%')
      )
    ORDER BY
      CASE sta.role WHEN 'primary' THEN 1 WHEN 'secondary' THEN 2 ELSE 3 END
    LIMIT 1
  )
  SELECT
    a.staff_id,
    a.name_en,
    a.name_ar,
    a.title_en,
    COALESCE(delegate.email, a.email) as email,
    COALESCE(delegate.phone, a.phone) as phone,
    a.department_name_en,
    a.role,
    COALESCE(delegate.id, a.staff_id) as effective_contact_id,
    COALESCE(delegate.name_en, a.name_en) as effective_contact_name,
    (a.delegates_to_id IS NOT NULL AND a.delegation_end >= CURRENT_DATE) as is_delegated
  FROM assigned_staff a
  LEFT JOIN staff_contacts delegate ON
    a.delegates_to_id = delegate.id
    AND a.delegation_end >= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get staff directory (full listing)
CREATE OR REPLACE FUNCTION get_staff_directory(
  p_department_id UUID DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name_en TEXT,
  name_ar TEXT,
  title_en TEXT,
  title_ar TEXT,
  department_id UUID,
  department_name_en TEXT,
  department_name_ar TEXT,
  position_level TEXT,
  email TEXT,
  phone TEXT,
  extension TEXT,
  is_available BOOLEAN,
  photo_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.id,
    sc.name_en,
    sc.name_ar,
    sc.title_en,
    sc.title_ar,
    sc.department_id,
    d.name_en as department_name_en,
    d.name_ar as department_name_ar,
    sc.position_level,
    sc.email,
    sc.phone,
    sc.extension,
    sc.is_available,
    sc.photo_url
  FROM staff_contacts sc
  JOIN departments d ON sc.department_id = d.id
  WHERE sc.is_active = true
    AND (p_department_id IS NULL OR sc.department_id = p_department_id)
    AND (
      p_search IS NULL
      OR sc.name_en ILIKE '%' || p_search || '%'
      OR sc.name_ar ILIKE '%' || p_search || '%'
      OR sc.email ILIKE '%' || p_search || '%'
      OR sc.title_en ILIKE '%' || p_search || '%'
    )
  ORDER BY d.name_en, sc.position_level, sc.name_en
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PART 8: Grants
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON departments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON staff_contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON staff_topic_assignments TO authenticated;
GRANT EXECUTE ON FUNCTION get_department_staff(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION find_staff_by_topic(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_topic_contact(TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_staff_directory(UUID, TEXT, INTEGER, INTEGER) TO authenticated;

-- ============================================================================
-- PART 9: Comments
-- ============================================================================

COMMENT ON TABLE departments IS 'Internal department structure for staff organization';
COMMENT ON TABLE staff_contacts IS 'Internal staff contact directory';
COMMENT ON TABLE staff_topic_assignments IS 'Assignment of staff to specific topics, countries, or dossiers';
COMMENT ON COLUMN staff_contacts.position_level IS 'Position hierarchy: head, deputy, director, manager, supervisor, senior, staff, assistant, intern';
COMMENT ON COLUMN staff_contacts.delegates_to_id IS 'Staff member handling this persons work during delegation';
COMMENT ON COLUMN staff_topic_assignments.assignment_type IS 'Type: country, organization, forum, topic, dossier, mou, correspondence, other';
COMMENT ON FUNCTION get_department_staff IS 'Get all staff in a department with delegation info';
COMMENT ON FUNCTION find_staff_by_topic IS 'Find staff who handle a specific topic by assignment or expertise';
COMMENT ON FUNCTION get_topic_contact IS 'Get the contact person for a specific topic/country/dossier with delegation handling';
COMMENT ON FUNCTION get_staff_directory IS 'Get full staff directory with optional department and search filters';

-- ============================================================================
-- Migration Complete
-- ============================================================================
