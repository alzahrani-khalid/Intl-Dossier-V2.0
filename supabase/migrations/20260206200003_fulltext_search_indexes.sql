-- Fix 7: Full-Text Search Indexes
-- GIN tsvector indexes for tasks, aa_commitments, and intake_tickets
-- GIN pg_trgm indexes for fuzzy title matching

-- Ensure pg_trgm extension is available
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Tasks: tsvector index for full-text search on title + description
CREATE INDEX IF NOT EXISTS idx_tasks_fulltext
  ON tasks
  USING GIN (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '')))
  WHERE is_deleted = false;

-- Tasks: trigram index for fuzzy title matching
CREATE INDEX IF NOT EXISTS idx_tasks_title_trgm
  ON tasks
  USING GIN (title gin_trgm_ops)
  WHERE is_deleted = false;

-- Commitments: tsvector index (title + description are the actual column names)
CREATE INDEX IF NOT EXISTS idx_commitments_fulltext
  ON aa_commitments
  USING GIN (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '')));

-- Commitments: trigram index on title
CREATE INDEX IF NOT EXISTS idx_commitments_text_trgm
  ON aa_commitments
  USING GIN (title gin_trgm_ops);

-- Intake tickets: tsvector index
CREATE INDEX IF NOT EXISTS idx_intake_tickets_fulltext
  ON intake_tickets
  USING GIN (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '')));

-- Intake tickets: trigram index
CREATE INDEX IF NOT EXISTS idx_intake_tickets_title_trgm
  ON intake_tickets
  USING GIN (title gin_trgm_ops);

-- Analyze tables to update statistics after index creation
ANALYZE tasks;
ANALYZE aa_commitments;
ANALYZE intake_tickets;
