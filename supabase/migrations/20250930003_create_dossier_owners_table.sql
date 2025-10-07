-- Migration: Create Dossier Owners Table
-- Date: 2025-09-30
-- Task: T007

-- Create dossier_owners table
CREATE TABLE dossier_owners (
  -- Composite PK
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Metadata
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  role_type TEXT DEFAULT 'owner' CHECK (role_type IN ('owner', 'co-owner', 'reviewer')),

  PRIMARY KEY (dossier_id, user_id)
);

-- Indexes
CREATE INDEX idx_dossier_owners_user ON dossier_owners(user_id);
CREATE INDEX idx_dossier_owners_dossier ON dossier_owners(dossier_id);
CREATE INDEX idx_dossier_owners_role ON dossier_owners(role_type);

-- Enable RLS
ALTER TABLE dossier_owners ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- View: Users see assignments for dossiers they can access
CREATE POLICY "view_dossier_owners"
ON dossier_owners FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dossiers
    WHERE id = dossier_id
    AND get_user_clearance_level(auth.uid()) >=
      CASE sensitivity_level 
        WHEN 'low' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'high' THEN 3 
      END
  )
);

-- Manage: Only admins/managers can assign owners
CREATE POLICY "manage_dossier_owners_admins_only"
ON dossier_owners FOR ALL
TO authenticated
USING (is_admin_or_manager(auth.uid()))
WITH CHECK (is_admin_or_manager(auth.uid()));

-- Comments
COMMENT ON TABLE dossier_owners IS 'Many-to-many relationship between dossiers and user owners';
COMMENT ON COLUMN dossier_owners.role_type IS 'Type of ownership: owner (primary), co-owner, or reviewer';
COMMENT ON COLUMN dossier_owners.assigned_at IS 'Timestamp when user was assigned as owner';
