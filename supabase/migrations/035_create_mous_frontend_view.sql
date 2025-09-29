-- Create a view that exposes MoU data in the shape expected by the frontend
BEGIN;

CREATE OR REPLACE VIEW public.mous_frontend AS
SELECT
  m.id,
  m.reference_number,
  m.title AS title_en,
  m.title_ar,
  COALESCE(m.lifecycle_state::text, 'draft') AS workflow_state,
  (m.dates->>'signing_date')::date AS signing_date,
  m.effective_date,
  m.expiry_date,
  COALESCE(m.description, '') AS description,
  jsonb_build_object(
    'name_en', COALESCE(m.parties->0->>'name_en', ''),
    'name_ar', COALESCE(m.parties->0->>'name_ar', '')
  ) AS primary_party,
  jsonb_build_object(
    'name_en', COALESCE(m.parties->1->>'name_en', ''),
    'name_ar', COALESCE(m.parties->1->>'name_ar', '')
  ) AS secondary_party
FROM public.mous m;

GRANT SELECT ON public.mous_frontend TO authenticated;
GRANT SELECT ON public.mous_frontend TO service_role;

COMMIT;
