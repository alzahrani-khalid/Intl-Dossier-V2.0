-- Migration: Create Unified Dossiers Base Table
-- Feature: 026-unified-dossier-architecture
-- Date: 2025-01-22
-- Description: Universal base table for all diplomatic entities using Class Table Inheritance pattern

-- Drop table if exists (clean slate migration)
DROP TABLE IF EXISTS dossiers CASCADE;

-- Create universal dossiers table
CREATE TABLE dossiers (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN (
    'country',
    'organization',
    'forum',
    'engagement',
    'theme',
    'working_group',
    'person'
  )),

  -- Core Information (Bilingual)
  name_en TEXT NOT NULL CHECK (name_en <> ''),
  name_ar TEXT NOT NULL CHECK (name_ar <> ''),
  description_en TEXT,
  description_ar TEXT,

  -- Status & Classification
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',
    'inactive',
    'archived',
    'deleted'
  )),
  sensitivity_level INTEGER NOT NULL DEFAULT 1 CHECK (sensitivity_level BETWEEN 1 AND 4),
  -- 1 = Public, 2 = Internal, 3 = Confidential, 4 = Secret

  -- Flexible Data
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',

  -- Full-Text Search
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name_en, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(name_ar, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description_en, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description_ar, '')), 'B')
  ) STORED,

  -- Audit Trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add comment for documentation
COMMENT ON TABLE dossiers IS 'Universal base table for all diplomatic entities (countries, organizations, forums, engagements, themes, working groups, persons)';
COMMENT ON COLUMN dossiers.type IS 'Entity type - immutable after creation';
COMMENT ON COLUMN dossiers.sensitivity_level IS '1=Public, 2=Internal, 3=Confidential, 4=Secret - determines access control';
COMMENT ON COLUMN dossiers.search_vector IS 'Full-text search vector - automatically generated from name/description fields';

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to dossiers table
CREATE TRIGGER update_dossiers_updated_at
  BEFORE UPDATE ON dossiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
