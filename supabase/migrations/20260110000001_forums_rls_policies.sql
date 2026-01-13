-- Migration: Enable RLS and Create Policies for Forums Extension Table
-- Feature: forums-entity-management
-- Date: 2026-01-10
-- Description: Clearance-based access control for forums extension table (inherits from dossiers)

-- Enable RLS on forums table
ALTER TABLE forums ENABLE ROW LEVEL SECURITY;

-- FORUMS RLS POLICIES
-- Access is inherited from the parent dossier's sensitivity level

-- SELECT: Users can view forum extensions if they can view the parent dossier
DROP POLICY IF EXISTS "Users can view forums within clearance" ON forums;
CREATE POLICY "Users can view forums within clearance"
ON forums FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM dossiers
    WHERE dossiers.id = forums.id
      AND dossiers.type = 'forum'
      AND dossiers.sensitivity_level <= (
        SELECT COALESCE(clearance_level, 1) FROM profiles WHERE id = auth.uid()
      )
  )
);

-- INSERT: Users can create forum extensions if they have appropriate clearance
DROP POLICY IF EXISTS "Users can create forums within clearance" ON forums;
CREATE POLICY "Users can create forums within clearance"
ON forums FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM dossiers
    WHERE dossiers.id = forums.id
      AND dossiers.type = 'forum'
      AND dossiers.sensitivity_level <= (
        SELECT COALESCE(clearance_level, 1) FROM profiles WHERE id = auth.uid()
      )
  )
);

-- UPDATE: Users can update forum extensions if they have appropriate clearance
DROP POLICY IF EXISTS "Users can update forums within clearance" ON forums;
CREATE POLICY "Users can update forums within clearance"
ON forums FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM dossiers
    WHERE dossiers.id = forums.id
      AND dossiers.type = 'forum'
      AND dossiers.sensitivity_level <= (
        SELECT COALESCE(clearance_level, 1) FROM profiles WHERE id = auth.uid()
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM dossiers
    WHERE dossiers.id = forums.id
      AND dossiers.type = 'forum'
      AND dossiers.sensitivity_level <= (
        SELECT COALESCE(clearance_level, 1) FROM profiles WHERE id = auth.uid()
      )
  )
);

-- DELETE: Users can delete forum extensions if they have appropriate clearance
DROP POLICY IF EXISTS "Users can delete forums within clearance" ON forums;
CREATE POLICY "Users can delete forums within clearance"
ON forums FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM dossiers
    WHERE dossiers.id = forums.id
      AND dossiers.type = 'forum'
      AND dossiers.sensitivity_level <= (
        SELECT COALESCE(clearance_level, 1) FROM profiles WHERE id = auth.uid()
      )
  )
);

-- Add index for common forum queries
CREATE INDEX IF NOT EXISTS idx_forums_id ON forums(id);

-- Add comment for documentation
COMMENT ON TABLE forums IS 'Extension table for forum-specific data (keynote speakers, sponsors, sessions). Inherits access control from parent dossier.';
