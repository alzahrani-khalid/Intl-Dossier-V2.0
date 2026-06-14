-- P68 / REMED-02 (fulltext half): close the T-EoP-DEFINER-FT clearance leak.
--
-- A1 (plan 68-01) confirmed search_entities_fulltext is SECURITY DEFINER, so the
-- keyword-search fallback bypasses caller RLS — a low-clearance user could see
-- above-clearance keyword hits.
--
-- DEVIATION FROM PLAN TASK 4: the planned new RPC joined ai_embeddings (currently
-- EMPTY) and returned a dossier-shaped result, which would have BROKEN the keyword
-- fallback (must-have D-07: "fallback path unchanged and intact") and changed the
-- edge-fn result shape. Instead we flip the EXISTING function to SECURITY INVOKER
-- so it runs under the caller's RLS. This:
--   * preserves the fallback's exact body, signature, and return shape (D-07),
--   * closes the leak for EVERY user-JWT caller of fulltext (broader than one edge fn),
--   * is a no-op for service-role callers (service_role bypasses RLS regardless),
-- and is paired (plan 68-03 Task 2) with moving the edge-fn fulltext call onto an
-- anon-key + user-JWT client so the INVOKER mode actually takes effect.

ALTER FUNCTION search_entities_fulltext(text, text, text, integer, integer)
  SECURITY INVOKER;

COMMENT ON FUNCTION search_entities_fulltext(text, text, text, integer, integer) IS
  'P68: flipped to SECURITY INVOKER (was DEFINER) to enforce caller RLS on keyword '
  'search. NEVER change back to DEFINER — v7.0 cross-cutting guarantee.';
