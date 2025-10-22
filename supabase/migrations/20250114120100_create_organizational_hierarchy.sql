-- Migration: Create organizational hierarchy table
-- Feature: Waiting Queue Actions (023-specs-waiting-queue)
-- Purpose: Define organizational reporting structure for escalation path resolution

-- Create organizational_hierarchy table
CREATE TABLE IF NOT EXISTS organizational_hierarchy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    reports_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    role TEXT NOT NULL,
    department TEXT NULL,
    escalation_level INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT escalation_level_range CHECK (escalation_level > 0 AND escalation_level <= 10),
    CONSTRAINT no_self_reporting CHECK (user_id != reports_to_user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_hierarchy_user ON organizational_hierarchy(user_id);
CREATE INDEX IF NOT EXISTS idx_org_hierarchy_manager ON organizational_hierarchy(reports_to_user_id);
CREATE INDEX IF NOT EXISTS idx_org_hierarchy_level ON organizational_hierarchy(escalation_level);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_organizational_hierarchy_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizational_hierarchy_updated_at
    BEFORE UPDATE ON organizational_hierarchy
    FOR EACH ROW
    EXECUTE FUNCTION update_organizational_hierarchy_updated_at();

-- RLS Policies
ALTER TABLE organizational_hierarchy ENABLE ROW LEVEL SECURITY;

-- Read: All authenticated users can view organizational hierarchy
CREATE POLICY "organizational_hierarchy_read" ON organizational_hierarchy
    FOR SELECT
    TO authenticated
    USING (true);

-- Insert: Only users with 'manage_hierarchy' permission
CREATE POLICY "organizational_hierarchy_insert" ON organizational_hierarchy
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_permissions
            WHERE user_id = auth.uid() AND permission = 'manage_hierarchy'
        )
    );

-- Update: Only users with 'manage_hierarchy' permission
CREATE POLICY "organizational_hierarchy_update" ON organizational_hierarchy
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_permissions
            WHERE user_id = auth.uid() AND permission = 'manage_hierarchy'
        )
    );

-- Delete: Only users with 'manage_hierarchy' permission
CREATE POLICY "organizational_hierarchy_delete" ON organizational_hierarchy
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_permissions
            WHERE user_id = auth.uid() AND permission = 'manage_hierarchy'
        )
    );

-- Add comments
COMMENT ON TABLE organizational_hierarchy IS 'Defines organizational reporting structure for escalation path resolution';
COMMENT ON COLUMN organizational_hierarchy.user_id IS 'User in the hierarchy (unique - one hierarchy record per user)';
COMMENT ON COLUMN organizational_hierarchy.reports_to_user_id IS 'Manager this user reports to (null for CEO/top level)';
COMMENT ON COLUMN organizational_hierarchy.role IS 'Job role/title (e.g., "Team Lead", "Department Manager")';
COMMENT ON COLUMN organizational_hierarchy.escalation_level IS 'Numeric escalation level (1 = lowest, higher = more senior)';
