-- Migration: Organization Extension Enhancements
-- Feature: Organization Dossier Phase 1
-- Date: 2026-01-27
-- Description: Add missing indexes and complete RLS policies for organizations extension table

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Index on headquarters_country_id for country lookups
CREATE INDEX IF NOT EXISTS idx_organizations_headquarters_country_id
  ON organizations(headquarters_country_id)
  WHERE headquarters_country_id IS NOT NULL;

-- Index on parent_org_id for hierarchy traversal
CREATE INDEX IF NOT EXISTS idx_organizations_parent_org_id
  ON organizations(parent_org_id)
  WHERE parent_org_id IS NOT NULL;

-- Index on org_type for filtering by organization type
CREATE INDEX IF NOT EXISTS idx_organizations_org_type
  ON organizations(org_type);

-- Index on established_date for date-based queries
CREATE INDEX IF NOT EXISTS idx_organizations_established_date
  ON organizations(established_date)
  WHERE established_date IS NOT NULL;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Enable RLS on organizations table if not already enabled
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (for idempotency)
DROP POLICY IF EXISTS "organizations_select_authenticated" ON organizations;
DROP POLICY IF EXISTS "organizations_insert_authenticated" ON organizations;
DROP POLICY IF EXISTS "organizations_update_authenticated" ON organizations;
DROP POLICY IF EXISTS "organizations_delete_authenticated" ON organizations;

-- SELECT: All authenticated users can view organizations
CREATE POLICY "organizations_select_authenticated" ON organizations
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: All authenticated users can create organizations
CREATE POLICY "organizations_insert_authenticated" ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: All authenticated users can update organizations
CREATE POLICY "organizations_update_authenticated" ON organizations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: All authenticated users can delete organizations
CREATE POLICY "organizations_delete_authenticated" ON organizations
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON INDEX idx_organizations_headquarters_country_id IS 'Index for headquarters country lookups';
COMMENT ON INDEX idx_organizations_parent_org_id IS 'Index for organizational hierarchy traversal';
COMMENT ON INDEX idx_organizations_org_type IS 'Index for filtering organizations by type';
COMMENT ON INDEX idx_organizations_established_date IS 'Index for date-based organization queries';
