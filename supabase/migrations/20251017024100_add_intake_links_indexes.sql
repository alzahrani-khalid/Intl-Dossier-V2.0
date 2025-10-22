-- Migration: Add indexes for intake entity linking system
-- Feature: 024-intake-entity-linking
-- Task: T013

-- Indexes for intake_entity_links (8 indexes total)

-- 1. B-tree index for intake queries (with soft-delete filtering)
CREATE INDEX IF NOT EXISTS idx_intake_entity_links_intake
ON intake_entity_links (intake_id, deleted_at)
WHERE deleted_at IS NULL;

-- 2. B-tree index for reverse lookup (entity -> intakes)
CREATE INDEX IF NOT EXISTS idx_intake_entity_links_reverse
ON intake_entity_links (entity_type, entity_id, deleted_at)
WHERE deleted_at IS NULL;

-- 3. B-tree index for link type filtering
CREATE INDEX IF NOT EXISTS idx_intake_entity_links_type
ON intake_entity_links (intake_id, link_type, deleted_at)
WHERE deleted_at IS NULL;

-- 4. B-tree index for audit queries (time-ordered)
CREATE INDEX IF NOT EXISTS idx_intake_entity_links_audit
ON intake_entity_links (created_at DESC);

-- 5. Partial unique index: only 1 primary link per intake
CREATE UNIQUE INDEX IF NOT EXISTS idx_intake_entity_links_unique_primary
ON intake_entity_links (intake_id, link_type)
WHERE link_type = 'primary' AND deleted_at IS NULL;

-- 6. Partial unique index: only 1 assigned_to per intake
CREATE UNIQUE INDEX IF NOT EXISTS idx_intake_entity_links_unique_assigned_to
ON intake_entity_links (intake_id, link_type)
WHERE link_type = 'assigned_to' AND deleted_at IS NULL;

-- 7. Partial unique index: prevent duplicate active links (same intake + entity + link type)
CREATE UNIQUE INDEX IF NOT EXISTS idx_intake_entity_links_unique_active
ON intake_entity_links (intake_id, entity_type, entity_id, link_type)
WHERE deleted_at IS NULL;

-- 8. HNSW vector index for intake_embeddings (fast similarity search)
CREATE INDEX IF NOT EXISTS idx_intake_embeddings_vector
ON intake_embeddings USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 9. HNSW vector index for entity_embeddings
CREATE INDEX IF NOT EXISTS idx_entity_embeddings_vector
ON entity_embeddings USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 10. GIN index for entity metadata queries
CREATE INDEX IF NOT EXISTS idx_entity_embeddings_metadata
ON entity_embeddings USING GIN (metadata);

-- 11. B-tree index for entity lookups
CREATE INDEX IF NOT EXISTS idx_entity_embeddings_entity
ON entity_embeddings (entity_type, entity_id);

-- Indexes for link_audit_logs

-- 12. B-tree index for link-specific audit queries
CREATE INDEX IF NOT EXISTS idx_link_audit_logs_link
ON link_audit_logs (link_id, timestamp DESC);

-- 13. B-tree index for intake-specific audit queries
CREATE INDEX IF NOT EXISTS idx_link_audit_logs_intake
ON link_audit_logs (intake_id, timestamp DESC);

-- 14. B-tree index for time-ordered queries
CREATE INDEX IF NOT EXISTS idx_link_audit_logs_timestamp
ON link_audit_logs (timestamp DESC);

-- 15. GIN index for JSONB details queries
CREATE INDEX IF NOT EXISTS idx_link_audit_logs_details
ON link_audit_logs USING GIN (details);

-- Indexes for ai_link_suggestions

-- 16. B-tree index for intake + status queries
CREATE INDEX IF NOT EXISTS idx_ai_link_suggestions_intake
ON ai_link_suggestions (intake_id, status, created_at DESC);

-- 17. B-tree index for status queries
CREATE INDEX IF NOT EXISTS idx_ai_link_suggestions_status
ON ai_link_suggestions (status, created_at DESC);

-- 18. B-tree index for cleanup (delete reviewed suggestions >30 days)
CREATE INDEX IF NOT EXISTS idx_ai_link_suggestions_cleanup
ON ai_link_suggestions (reviewed_at)
WHERE status IN ('accepted', 'rejected');

-- Add comments
COMMENT ON INDEX idx_intake_embeddings_vector IS 'HNSW index for <3s vector similarity search (m=16, ef_construction=64)';
COMMENT ON INDEX idx_entity_embeddings_vector IS 'HNSW index for reverse semantic search';
