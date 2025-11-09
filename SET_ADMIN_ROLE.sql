-- ============================================================================
-- Set Admin Role for kazahrani@stats.gov.sa
-- 
-- Run this in Supabase Dashboard > SQL Editor
-- After running, log out and log back in to see the Admin section
-- ============================================================================

-- Check current role
SELECT 
  id,
  email,
  role,
  created_at,
  updated_at
FROM profiles
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'kazahrani@stats.gov.sa'
);

-- Set role to admin
UPDATE profiles 
SET 
  role = 'admin',
  updated_at = NOW()
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'kazahrani@stats.gov.sa'
);

-- Verify the change
SELECT 
  id,
  email,
  role,
  created_at,
  updated_at
FROM profiles
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'kazahrani@stats.gov.sa'
);

-- Expected result:
-- email: kazahrani@stats.gov.sa
-- role: admin
-- ✅ Admin section will now be visible in the sidebar!

