-- =============================================================================
-- 260610-fkn — P2 security pass
-- activity_stream actor-binding INSERT RLS + targeted role backfill
-- =============================================================================
--
-- 1. activity_stream INSERT policy (P2-SEC-ACTIVITY-RLS)
--    The previous policy `activity_stream_insert_authenticated` used
--    `WITH CHECK (auth.role() = 'authenticated')`, which let ANY authenticated
--    client INSERT a row with a FORGED actor_id (spoof feed authorship).
--    Replace it with actor binding: `WITH CHECK (actor_id = auth.uid())`.
--
--    Exempt / unaffected producers (verified: zero direct-client inserts in
--    repo source — frontend, edge fns, backend):
--      * log_activity() — SECURITY DEFINER RPC; sets actor_id := auth.uid()
--        internally and raises if auth.uid() IS NULL. Not subject to client RLS.
--      * service-role / seed writers — bypass RLS entirely.
--    The new policy therefore breaks no current writer; it only blocks a
--    malicious direct client insert with a forged actor — exactly the hole.
--
-- 2. Targeted role backfill (conservative — A1)
--    public.users.role is `text` with CHECK (role IN ('admin','editor','viewer')).
--    Today all 393 rows = 'viewer'; no admin exists in the truth table.
--    Promote ONLY the single known metadata-admin into public.users.role.
--    The 7 metadata-'user' rows are NOT promoted.
--    NOTE: the 1 metadata-'supervisor' account is deliberately left 'viewer'.
--    'supervisor' is NOT a valid value for public.users.role
--    (CHECK constraint = 'admin'/'editor'/'viewer'), so it cannot be written
--    without a product decision on role mapping. Documented; left for product.
--
-- 3. Defensive anon hardening (Phase 60 default-ACL finding)
--    Staging auto-grants new privileges to anon. This migration issues no new
--    GRANT, but a belt-and-suspenders REVOKE keeps anon off the table.
-- =============================================================================

-- 1. RLS policy swap ----------------------------------------------------------
DROP POLICY IF EXISTS "activity_stream_insert_authenticated" ON public.activity_stream;

CREATE POLICY "activity_stream_insert_own_actor" ON public.activity_stream
    FOR INSERT
    TO authenticated
    WITH CHECK (actor_id = auth.uid());

-- 2. Targeted role backfill ---------------------------------------------------
-- Promote ONLY the single metadata-admin. Guarded UPDATE; idempotent.
UPDATE public.users u
SET role = 'admin'
FROM auth.users au
WHERE u.id = au.id
  AND au.raw_user_meta_data->>'role' = 'admin'
  AND u.role IS DISTINCT FROM 'admin';

-- The metadata-'supervisor' account is intentionally NOT promoted here:
-- 'supervisor' is not in the users_role_check taxonomy (admin/editor/viewer),
-- so writing it would violate the CHECK constraint. It stays 'viewer' pending
-- a product decision on how 'supervisor' maps into the app role taxonomy.

-- 3. Defensive anon hardening -------------------------------------------------
REVOKE ALL ON public.activity_stream FROM anon;
