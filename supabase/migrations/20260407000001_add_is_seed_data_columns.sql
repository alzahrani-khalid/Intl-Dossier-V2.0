-- Phase 17 — Seed Data & First Run
-- Plan 17-01: Add is_seed_data tagging columns and partial indexes
--
-- Rationale (D-14): Every row inserted by the populate_diplomatic_seed RPC
-- (Plan 17-02) is tagged with is_seed_data = true so that:
--   1. Idempotency checks can be index-backed and fast
--      (e.g. EXISTS (SELECT 1 FROM countries WHERE is_seed_data = true))
--   2. Seed rows can be identified / purged later without touching production data.
--
-- Default is false so all existing rows remain untouched. Partial indexes
-- (WHERE is_seed_data = true) keep storage cost near zero in production where
-- no seed rows exist.
--
-- Tables covered (per 17-RESEARCH §2):
--   - dossiers                (central entity)
--   - countries               (dossier extension)
--   - organizations           (dossier extension)
--   - forums                  (dossier extension)
--   - engagements             (dossier extension)
--   - working_groups          (dossier extension)
--   - persons                 (dossier extension; covers individuals)
--   - elected_officials       (separate entity table, still seedable)
--   - topics                  (policy areas)
--   - dossier_relationships   (graph edges between dossiers)
--   - work_items              (unified work tracking table)
--   - work_item_dossiers      (work_item ↔ dossier junction)
--
-- Idempotent: ADD COLUMN IF NOT EXISTS + CREATE INDEX IF NOT EXISTS.

BEGIN;

-- dossiers
ALTER TABLE public.dossiers
  ADD COLUMN IF NOT EXISTS is_seed_data BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_dossiers_is_seed_data
  ON public.dossiers (is_seed_data)
  WHERE is_seed_data = true;
COMMENT ON COLUMN public.dossiers.is_seed_data IS
  'Phase 17: marks rows inserted by populate_diplomatic_seed RPC for idempotency.';

-- countries
ALTER TABLE public.countries
  ADD COLUMN IF NOT EXISTS is_seed_data BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_countries_is_seed_data
  ON public.countries (is_seed_data)
  WHERE is_seed_data = true;
COMMENT ON COLUMN public.countries.is_seed_data IS
  'Phase 17: marks rows inserted by populate_diplomatic_seed RPC for idempotency.';

-- organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS is_seed_data BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_organizations_is_seed_data
  ON public.organizations (is_seed_data)
  WHERE is_seed_data = true;
COMMENT ON COLUMN public.organizations.is_seed_data IS
  'Phase 17: marks rows inserted by populate_diplomatic_seed RPC for idempotency.';

-- forums
ALTER TABLE public.forums
  ADD COLUMN IF NOT EXISTS is_seed_data BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_forums_is_seed_data
  ON public.forums (is_seed_data)
  WHERE is_seed_data = true;
COMMENT ON COLUMN public.forums.is_seed_data IS
  'Phase 17: marks rows inserted by populate_diplomatic_seed RPC for idempotency.';

-- engagements
ALTER TABLE public.engagements
  ADD COLUMN IF NOT EXISTS is_seed_data BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_engagements_is_seed_data
  ON public.engagements (is_seed_data)
  WHERE is_seed_data = true;
COMMENT ON COLUMN public.engagements.is_seed_data IS
  'Phase 17: marks rows inserted by populate_diplomatic_seed RPC for idempotency.';

-- working_groups
ALTER TABLE public.working_groups
  ADD COLUMN IF NOT EXISTS is_seed_data BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_working_groups_is_seed_data
  ON public.working_groups (is_seed_data)
  WHERE is_seed_data = true;
COMMENT ON COLUMN public.working_groups.is_seed_data IS
  'Phase 17: marks rows inserted by populate_diplomatic_seed RPC for idempotency.';

-- persons
ALTER TABLE public.persons
  ADD COLUMN IF NOT EXISTS is_seed_data BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_persons_is_seed_data
  ON public.persons (is_seed_data)
  WHERE is_seed_data = true;
COMMENT ON COLUMN public.persons.is_seed_data IS
  'Phase 17: marks rows inserted by populate_diplomatic_seed RPC for idempotency.';

-- NOTE: elected_officials is NOT a separate table on this deployment.
-- Elected officials are stored as persons with person_subtype='elected_official'
-- (see 17-SCHEMA-RECONCILIATION.md §5). The persons table above covers them.

-- topics
ALTER TABLE public.topics
  ADD COLUMN IF NOT EXISTS is_seed_data BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_topics_is_seed_data
  ON public.topics (is_seed_data)
  WHERE is_seed_data = true;
COMMENT ON COLUMN public.topics.is_seed_data IS
  'Phase 17: marks rows inserted by populate_diplomatic_seed RPC for idempotency.';

-- dossier_relationships
ALTER TABLE public.dossier_relationships
  ADD COLUMN IF NOT EXISTS is_seed_data BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_dossier_relationships_is_seed_data
  ON public.dossier_relationships (is_seed_data)
  WHERE is_seed_data = true;
COMMENT ON COLUMN public.dossier_relationships.is_seed_data IS
  'Phase 17: marks rows inserted by populate_diplomatic_seed RPC for idempotency.';

-- tasks (canonical work-item storage; work_items does not exist on this deployment)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS is_seed_data BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_tasks_is_seed_data
  ON public.tasks (is_seed_data)
  WHERE is_seed_data = true;
COMMENT ON COLUMN public.tasks.is_seed_data IS
  'Phase 17: marks rows inserted by populate_diplomatic_seed RPC for idempotency.';

-- work_item_dossiers
ALTER TABLE public.work_item_dossiers
  ADD COLUMN IF NOT EXISTS is_seed_data BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_work_item_dossiers_is_seed_data
  ON public.work_item_dossiers (is_seed_data)
  WHERE is_seed_data = true;
COMMENT ON COLUMN public.work_item_dossiers.is_seed_data IS
  'Phase 17: marks rows inserted by populate_diplomatic_seed RPC for idempotency.';

COMMIT;
