-- Simplified RLS policies for MoUs to allow authenticated reads
BEGIN;

DROP POLICY IF EXISTS mous_select_authenticated ON public.mous;
DROP POLICY IF EXISTS mous_select_service_role ON public.mous;

CREATE POLICY mous_select_authenticated ON public.mous
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY mous_select_service_role ON public.mous
  FOR SELECT
  USING (auth.role() = 'service_role');

COMMIT;
