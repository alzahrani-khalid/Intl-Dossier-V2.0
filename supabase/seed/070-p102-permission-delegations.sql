-- Stable delegation examples for the delegation-management page.
DO $$
DECLARE
  v_test_user UUID;
  v_analyst UUID;
  v_admin UUID;
  v_country_dossier UUID;
  v_mou UUID;
  v_seed_ids UUID[] := ARRAY[
    '7a61d7f8-5d29-4d8c-92b3-a012d6fd1e31'::UUID,
    '83ff63e0-f9b5-4a66-87ce-caf624bad922'::UUID,
    'b3ea1d69-38e3-4ea5-91aa-e65b04d54e8f'::UUID
  ];
BEGIN
  SELECT id INTO v_test_user FROM auth.users WHERE email = 'kazahrani@stats.gov.sa';
  SELECT id INTO v_analyst FROM auth.users WHERE email = 'analyst@e2e.test';
  SELECT id INTO v_admin FROM auth.users WHERE email = 'admin@e2e.test';
  SELECT id INTO v_country_dossier
  FROM public.dossiers
  WHERE type = 'country'
  ORDER BY created_at, id
  LIMIT 1;
  SELECT id INTO v_mou FROM public.mous ORDER BY created_at, id LIMIT 1;

  IF v_test_user IS NULL OR v_analyst IS NULL OR v_admin IS NULL THEN
    RAISE EXCEPTION 'Required delegation identities are missing';
  END IF;
  IF v_country_dossier IS NULL OR v_mou IS NULL THEN
    RAISE EXCEPTION 'Required country dossier or memorandum is missing';
  END IF;

  DELETE FROM public.permission_delegations WHERE id = ANY(v_seed_ids);

  INSERT INTO public.permission_delegations (
    id, grantor_id, grantee_id, resource_type, resource_id, permissions,
    reason, valid_from, valid_until, revoked, revoked_at, revoked_by
  ) VALUES
    (
      v_seed_ids[1], v_test_user, v_analyst, 'dossier', v_country_dossier, ARRAY['read'],
      'Covering the ESCWA consultation during leave', now() - interval '1 day',
      now() + interval '30 days', false, NULL, NULL
    ),
    (
      v_seed_ids[2], v_admin, v_test_user, 'all', NULL, ARRAY['read'],
      'Supporting the regional policy review', now() - interval '1 day',
      now() + interval '30 days', false, NULL, NULL
    ),
    (
      v_seed_ids[3], v_test_user, v_analyst, 'mou', v_mou, ARRAY['read'],
      'Concluded coordination for the bilateral memorandum', now() - interval '10 days',
      now() + interval '20 days', true, now(), v_test_user
    );
END
$$;
