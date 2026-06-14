-- P68 / REMED-02 + REMED-04 (search half): clearance-gated semantic search.
--
-- Replaces the prior security-definer search_entities_semantic (which bypasses
-- RLS for all callers) with a SECURITY INVOKER RPC that enforces
-- sensitivity_level <= clearance_level at the DB layer under the caller's JWT.
-- Parameter is vector(1024) to match ai_embeddings.embedding exactly — no
-- pad/truncate (REMED-04 query-path half).
--
-- NOTE (forward v7.0 work, not this phase): ai_embeddings is currently empty and
-- its embedding_owner_type enum is {ticket, artifact}. The owner_id -> dossiers.id
-- join below is the query CONTRACT; populating dossier-content embeddings (and
-- reconciling owner_type) is a later phase. The security property here
-- (INVOKER + clearance gate) holds regardless of data shape.

-- BLOCK 1: SECURITY INVOKER clearance-gated semantic RPC.
CREATE OR REPLACE FUNCTION search_semantic_clearance_gated(
  p_query_embedding vector(1024),
  p_entity_types text[],
  p_similarity_threshold float DEFAULT 0.6,
  p_limit int DEFAULT 20
)
RETURNS TABLE (entity_id uuid, owner_type text, similarity_score float, sensitivity_level int)
LANGUAGE sql
SECURITY INVOKER  -- CRITICAL: never DEFINER — v7.0 cross-cutting guarantee
STABLE
AS $$
  SELECT ae.owner_id, ae.owner_type::text,
    (1 - (ae.embedding <=> p_query_embedding))::float,
    d.sensitivity_level
  FROM ai_embeddings ae
  JOIN dossiers d ON d.id = ae.owner_id
  WHERE ae.owner_type::text = ANY(p_entity_types)
    AND (1 - (ae.embedding <=> p_query_embedding)) >= p_similarity_threshold
    AND d.sensitivity_level <= (SELECT clearance_level FROM profiles WHERE user_id = auth.uid())
    AND d.is_active = true
  ORDER BY ae.embedding <=> p_query_embedding
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION search_semantic_clearance_gated(vector, text[], float, int) IS
  'P68 SECURITY INVOKER replacement for search_entities_semantic. '
  'NEVER change to DEFINER — v7.0 cross-cutting guarantee. '
  'Enforces sensitivity_level <= clearance_level under the caller RLS.';

-- BLOCK 2: HNSW index on ai_embeddings.embedding (cosine). Idempotent.
CREATE INDEX IF NOT EXISTS idx_ai_embeddings_hnsw
ON ai_embeddings USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- BLOCK 3: catalog-introspection helper used by the REMED-02 integration test
-- (PostgREST cannot read pg_catalog directly). Reports a function's security
-- mode. INVOKER + reads only world-readable pg_proc metadata.
CREATE OR REPLACE FUNCTION get_function_security(p_proname text)
RETURNS TABLE (proname text, prosecdef boolean)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT p.proname::text, p.prosecdef
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE p.proname = p_proname
    AND n.nspname = 'public';
$$;

COMMENT ON FUNCTION get_function_security(text) IS
  'P68 test helper: returns prosecdef (security mode) for a public function by name.';
