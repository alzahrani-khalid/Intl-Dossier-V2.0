-- Migration: Create Dossiers Table
-- Date: 2025-09-30
-- Task: T006

-- Create dossiers table
CREATE TABLE dossiers (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Bilingual names
  name_en TEXT NOT NULL CHECK (length(name_en) <= 200),
  name_ar TEXT NOT NULL CHECK (length(name_ar) <= 200),

  -- Classification
  type TEXT NOT NULL CHECK (type IN ('country', 'organization', 'forum', 'theme')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  sensitivity_level TEXT NOT NULL DEFAULT 'low' CHECK (sensitivity_level IN ('low', 'medium', 'high')),

  -- Content (bilingual)
  summary_en TEXT,
  summary_ar TEXT,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  review_cadence INTERVAL, -- e.g., '90 days', NULL for no cadence
  last_review_date TIMESTAMP WITH TIME ZONE,

  -- Optimistic locking
  version INTEGER NOT NULL DEFAULT 1,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  archived BOOLEAN NOT NULL DEFAULT FALSE,

  -- Search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name_en, '')), 'A') ||
    setweight(to_tsvector('arabic', coalesce(name_ar, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary_en, '')), 'B') ||
    setweight(to_tsvector('arabic', coalesce(summary_ar, '')), 'B')
  ) STORED
);

-- Indexes for performance
CREATE INDEX idx_dossiers_type ON dossiers(type);
CREATE INDEX idx_dossiers_status ON dossiers(status);
CREATE INDEX idx_dossiers_sensitivity ON dossiers(sensitivity_level);
CREATE INDEX idx_dossiers_search ON dossiers USING GIN(search_vector);
CREATE INDEX idx_dossiers_tags ON dossiers USING GIN(tags);
CREATE INDEX idx_dossiers_type_status ON dossiers(type, status) WHERE NOT archived;
CREATE INDEX idx_dossiers_created_at ON dossiers(created_at DESC);
CREATE INDEX idx_dossiers_updated_at ON dossiers(updated_at DESC);

-- Triggers
CREATE TRIGGER set_dossiers_updated_at
  BEFORE UPDATE ON dossiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER dossiers_version_trigger
  BEFORE UPDATE ON dossiers
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

-- Enable RLS
ALTER TABLE dossiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- View: Based on sensitivity and user clearance
CREATE POLICY "view_dossiers_by_clearance"
ON dossiers FOR SELECT
USING (
  get_user_clearance_level(auth.uid()) >=
  CASE sensitivity_level
    WHEN 'low' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'high' THEN 3
  END
);

-- Insert: Authenticated users can create
CREATE POLICY "insert_dossiers_authenticated"
ON dossiers FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- Update: Hybrid permission (owner + admin/manager)
CREATE POLICY "update_dossiers_hybrid_permissions"
ON dossiers FOR UPDATE
TO authenticated
USING (can_edit_dossier(id))
WITH CHECK (
  can_edit_dossier(id) AND 
  version = (SELECT version FROM dossiers WHERE dossiers.id = dossiers.id FOR UPDATE)
);

-- Delete/Archive: Same as update
CREATE POLICY "archive_dossiers_hybrid_permissions"
ON dossiers FOR DELETE
TO authenticated
USING (can_edit_dossier(id));

-- Comments
COMMENT ON TABLE dossiers IS 'Core table for diplomatic dossiers (countries, organizations, forums, themes)';
COMMENT ON COLUMN dossiers.version IS 'Optimistic locking version - auto-incremented on updates';
COMMENT ON COLUMN dossiers.search_vector IS 'Full-text search index for bilingual names and summaries';
COMMENT ON COLUMN dossiers.sensitivity_level IS 'Access control: low=1, medium=2, high=3';
COMMENT ON COLUMN dossiers.archived IS 'Soft delete flag - archived dossiers excluded from normal queries';
