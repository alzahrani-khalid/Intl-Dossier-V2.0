-- Fix users table RLS recursion and simplify policies
BEGIN;

DROP POLICY IF EXISTS users_select_admin ON public.users;
DROP POLICY IF EXISTS users_select_active ON public.users;
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_update_admin ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;
DROP POLICY IF EXISTS users_delete_admin ON public.users;

-- Allow authenticated users to read their own profile
CREATE POLICY users_select_self ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Allow authenticated users to read other active profiles (for collaboration lists)
CREATE POLICY users_select_active_authenticated ON public.users
  FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- Allow service role (backend) unrestricted access
CREATE POLICY users_select_service_role ON public.users
  FOR SELECT
  USING (auth.role() = 'service_role');

-- Allow users to update only their own record
CREATE POLICY users_update_self ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow service role to update any record
CREATE POLICY users_update_service_role ON public.users
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow service role to delete when needed (administrative clean up)
CREATE POLICY users_delete_service_role ON public.users
  FOR DELETE
  USING (auth.role() = 'service_role');

COMMIT;
