DROP POLICY IF EXISTS users_select_platform_admin ON public.users;

CREATE POLICY users_select_platform_admin
  ON public.users
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));
