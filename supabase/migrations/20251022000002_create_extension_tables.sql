-- Migration: Create Extension Tables for 7 Dossier Types
-- Feature: 026-unified-dossier-architecture
-- Date: 2025-01-22
-- Description: Type-specific extension tables using Class Table Inheritance

-- Create validation function for type matching
CREATE OR REPLACE FUNCTION validate_dossier_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM dossiers
    WHERE id = NEW.id AND type = TG_ARGV[0]
  ) THEN
    RAISE EXCEPTION 'Dossier % must have type=%', NEW.id, TG_ARGV[0];
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. COUNTRIES Extension Table
DROP TABLE IF EXISTS countries CASCADE;
CREATE TABLE countries (
  id UUID PRIMARY KEY REFERENCES dossiers(id) ON DELETE CASCADE,
  iso_code_2 CHAR(2) UNIQUE NOT NULL,
  iso_code_3 CHAR(3) UNIQUE NOT NULL,
  capital_en TEXT,
  capital_ar TEXT,
  region TEXT,
  subregion TEXT,
  population BIGINT CHECK (population >= 0),
  area_sq_km NUMERIC(15,2) CHECK (area_sq_km >= 0),
  flag_url TEXT
);

CREATE TRIGGER validate_country_type
  BEFORE INSERT OR UPDATE ON countries
  FOR EACH ROW EXECUTE FUNCTION validate_dossier_type('country');

-- 2. ORGANIZATIONS Extension Table
DROP TABLE IF EXISTS organizations CASCADE;
CREATE TABLE organizations (
  id UUID PRIMARY KEY REFERENCES dossiers(id) ON DELETE CASCADE,
  org_code TEXT UNIQUE,
  org_type TEXT NOT NULL CHECK (org_type IN ('government', 'ngo', 'private', 'international', 'academic')),
  headquarters_country_id UUID REFERENCES countries(id),
  parent_org_id UUID REFERENCES organizations(id) CHECK (parent_org_id != id),
  website TEXT,
  email TEXT,
  phone TEXT,
  address_en TEXT,
  address_ar TEXT,
  logo_url TEXT,
  established_date DATE
);

CREATE TRIGGER validate_organization_type
  BEFORE INSERT OR UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION validate_dossier_type('organization');

-- 3. FORUMS Extension Table
DROP TABLE IF EXISTS forums CASCADE;
CREATE TABLE forums (
  id UUID PRIMARY KEY REFERENCES dossiers(id) ON DELETE CASCADE,
  number_of_sessions INTEGER CHECK (number_of_sessions > 0),
  keynote_speakers JSONB DEFAULT '[]',
  sponsors JSONB DEFAULT '[]',
  registration_fee NUMERIC(10,2) CHECK (registration_fee >= 0),
  currency CHAR(3),
  agenda_url TEXT,
  live_stream_url TEXT
);

CREATE TRIGGER validate_forum_type
  BEFORE INSERT OR UPDATE ON forums
  FOR EACH ROW EXECUTE FUNCTION validate_dossier_type('forum');

-- 4. ENGAGEMENTS Extension Table
DROP TABLE IF EXISTS engagements CASCADE;
CREATE TABLE engagements (
  id UUID PRIMARY KEY REFERENCES dossiers(id) ON DELETE CASCADE,
  engagement_type TEXT NOT NULL CHECK (engagement_type IN ('meeting', 'consultation', 'coordination', 'workshop', 'conference', 'site_visit', 'ceremony')),
  engagement_category TEXT NOT NULL CHECK (engagement_category IN ('bilateral', 'multilateral', 'regional', 'internal')),
  location_en TEXT,
  location_ar TEXT
);

CREATE TRIGGER validate_engagement_type
  BEFORE INSERT OR UPDATE ON engagements
  FOR EACH ROW EXECUTE FUNCTION validate_dossier_type('engagement');

-- 5. THEMES Extension Table
DROP TABLE IF EXISTS themes CASCADE;
CREATE TABLE themes (
  id UUID PRIMARY KEY REFERENCES dossiers(id) ON DELETE CASCADE,
  theme_category TEXT NOT NULL CHECK (theme_category IN ('policy', 'technical', 'strategic', 'operational')),
  parent_theme_id UUID REFERENCES themes(id) CHECK (parent_theme_id != id)
);

CREATE TRIGGER validate_theme_type
  BEFORE INSERT OR UPDATE ON themes
  FOR EACH ROW EXECUTE FUNCTION validate_dossier_type('theme');

-- 6. WORKING_GROUPS Extension Table
DROP TABLE IF EXISTS working_groups CASCADE;
CREATE TABLE working_groups (
  id UUID PRIMARY KEY REFERENCES dossiers(id) ON DELETE CASCADE,
  mandate_en TEXT,
  mandate_ar TEXT,
  lead_org_id UUID REFERENCES organizations(id),
  wg_status TEXT NOT NULL DEFAULT 'active' CHECK (wg_status IN ('active', 'suspended', 'disbanded')),
  established_date DATE,
  disbandment_date DATE CHECK (disbandment_date IS NULL OR disbandment_date >= established_date)
);

CREATE TRIGGER validate_working_group_type
  BEFORE INSERT OR UPDATE ON working_groups
  FOR EACH ROW EXECUTE FUNCTION validate_dossier_type('working_group');

-- 7. PERSONS Extension Table
DROP TABLE IF EXISTS persons CASCADE;
CREATE TABLE persons (
  id UUID PRIMARY KEY REFERENCES dossiers(id) ON DELETE CASCADE,
  title_en TEXT,
  title_ar TEXT,
  organization_id UUID REFERENCES organizations(id),
  nationality_country_id UUID REFERENCES countries(id),
  email TEXT,
  phone TEXT,
  biography_en TEXT,
  biography_ar TEXT,
  photo_url TEXT
);

CREATE TRIGGER validate_person_type
  BEFORE INSERT OR UPDATE ON persons
  FOR EACH ROW EXECUTE FUNCTION validate_dossier_type('person');
