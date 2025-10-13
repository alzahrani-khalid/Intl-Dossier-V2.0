-- Fix: Allow authenticated users to see low sensitivity dossiers
-- This fixes the sync issue where user_roles table doesn't exist

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "view_dossiers_by_clearance" ON dossiers;

-- Create a simpler policy: authenticated users can see low/medium sensitivity dossiers
CREATE POLICY "view_dossiers_authenticated"
ON dossiers FOR SELECT
TO authenticated
USING (
  sensitivity_level IN ('low', 'medium')
  OR
  -- Admin/manager users can see all (if user_roles table exists in future)
  (
    SELECT COUNT(*) > 0
    FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND role IN ('admin', 'manager')
  )
);
