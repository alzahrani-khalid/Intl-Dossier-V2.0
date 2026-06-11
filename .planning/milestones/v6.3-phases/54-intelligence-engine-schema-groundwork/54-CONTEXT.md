# Phase 54: Intelligence Engine Schema Groundwork - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the PostgreSQL data layer for the v7.0 Intelligence Engine on the **staging** Supabase project (`zkrcjzdemdmwhearhfgg`, eu-west-2). This phase ships:

1. `intelligence_event` table (raw ingest layer; renamed from spec's `intelligence_signal` due to a collision with the existing `intelligence_signals` analyst-curated table).
2. `intelligence_digest` table (period-bounded per-dossier digest; the existing Phase-45 `intelligence_digest` is renamed to `dashboard_digest` and its single frontend caller updated in the same wave).
3. `intelligence_event_dossiers` polymorphic many-to-many junction with a `dossier_type` CHECK matching the **7** canonical dossier types currently allowed by `dossiers_type_check`.
4. `signal_source_type` enum (`publication`, `feed`, `human_entered`, `ai_generated`) applied to `intelligence_event.source_type`.
5. `severity` value constraint reusing the work-item priority vocabulary (`low`, `medium`, `high`, `urgent`).
6. Regenerated `database.types.ts` (backend + frontend) with `pnpm type-check` exiting 0 on both workspaces.
7. REQUIREMENTS.md updates: INTEL-01 / INTEL-03 renames + dossier-type count correction (8 → 7).

**Schema only.** No API endpoints, no UI, no ingestion jobs, no Edge Functions. v7.0 feature surface lands in later phases that depend on this groundwork.

</domain>

<decisions>
## Implementation Decisions

### Naming collisions (existing tables)

- **D-01:** Rename existing Phase-45 `intelligence_digest` → `dashboard_digest` in the same migration that creates the new spec-compliant `intelligence_digest`. The Phase-45 table is in fact a dashboard headline feed (cols: `organization_id`, `headline_en/ar`, `summary_en/ar`, `source_publication`, `occurred_at`, `dossier_id`) — the new name reflects its actual purpose, freeing the canonical `intelligence_digest` name for the v7.0 period-bounded per-dossier digest.
- **D-02:** Phase-45 callsite update is part of Phase 54 scope (single hook + test): `frontend/src/hooks/useIntelligenceDigest.ts`, `frontend/src/hooks/__tests__/useIntelligenceDigest.test.ts`. Update the `.from('intelligence_digest')` call to `.from('dashboard_digest')` and rename the hook to `useDashboardDigest` (file + test rename included).
- **D-03:** Update seed `supabase/seed/060-dashboard-demo.sql` and its parent migration `20260507210000_phase45_intelligence_digest_seed.sql` description so the rename is reflected in seed/demo paths. The Phase-45 migration itself is historical and must NOT be retro-edited — the rename happens in a new Phase-54 migration.
- **D-04:** Rename the v7.0 spec ingest table from `intelligence_signal` (per REQUIREMENTS) to **`intelligence_event`** to avoid side-by-side singular/plural confusion with the load-bearing existing `intelligence_signals` (plural, analyst-curated, referenced by `entity-search.service.ts`, `link.service.ts`, `timeline_view`, `entity_preview_layouts`, `multilingual_content_system`, i18n entries). Existing `intelligence_signals` is untouched.
- **D-05:** Junction table follows the renamed event: **`intelligence_event_dossiers`** (NOT `intelligence_signal_dossiers`).

### Dossier-type enum on the junction

- **D-06:** Junction `dossier_type` column is `TEXT` with a `CHECK` constraint matching the **current 7** values of `dossiers_type_check` (set by migration `20260202000001_merge_elected_official_into_person.sql`):
  `country, organization, forum, engagement, topic, working_group, person`.
- **D-07:** REQUIREMENTS.md INTEL-03 will be updated by Phase 54 to drop `elected_official` from the listed types (it was merged into `person` and is no longer a valid `dossiers.type` value). ROADMAP.md success-criterion #3 needs the same correction (7 types, not 8).

### Tenant column convention

- **D-08:** Both `intelligence_event` and the new `intelligence_digest` use **`organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE`** — NOT `tenant_id`. Reuses existing `tenant_isolation.rls_select_policy(organization_id)` / `rls_insert_policy(organization_id)` / `rls_update_policy(organization_id)` helpers (defined in `supabase/migrations/20260113500001_tenant_isolation_layer.sql`) and matches the Phase-45 `intelligence_digest` precedent. REQUIREMENTS.md `tenant_id` wording is treated as a semantic alias — update REQUIREMENTS to say `organization_id` (column) / "tenant-scoped via organization_id" (semantics) as part of Phase 54.

### `signal_source_type` enum (D-09 .. D-10)

- **D-09:** Create as a real PostgreSQL `CREATE TYPE signal_source_type AS ENUM (...)` with values `publication`, `feed`, `human_entered`, `ai_generated` and apply to `intelligence_event.source_type` (not TEXT + CHECK). Pure enum gives smaller storage, faster comparisons, and clearer Supabase type generation.
- **D-10:** The enum is named `signal_source_type` per spec — even though the table is now `intelligence_event` — so REQUIREMENTS-INTEL-04 verbatim type name stays. Future renames are out of scope.

### Severity vocabulary

- **D-11:** `intelligence_event.severity` uses `TEXT NOT NULL CHECK (severity IN ('low','medium','high','urgent'))` — reuses CLAUDE.md work-item Priority enum so badges, filters, and analyst vocabulary stay consistent across the system. Default `medium`.

### RLS policies (mirrors Phase-45 intelligence_digest precedent)

- **D-12:** Both new tables (`intelligence_event`, `intelligence_digest`) get the same four-policy pattern as Phase-45 `intelligence_digest`:
  - `SELECT` → `tenant_isolation.rls_select_policy(organization_id)`
  - `INSERT` → `tenant_isolation.rls_insert_policy(organization_id) AND public.auth_has_any_role(ARRAY['admin','editor'])`
  - `UPDATE` → `tenant_isolation.rls_update_policy(organization_id) AND public.auth_has_any_role(ARRAY['admin','editor'])` (USING + WITH CHECK)
  - `DELETE` → `tenant_isolation.rls_*_policy(organization_id) AND public.auth_has_any_role(ARRAY['admin'])`
- **D-13:** The junction `intelligence_event_dossiers` derives tenancy from its parent `intelligence_event.organization_id`. RLS policies enforce membership via a subquery: `EXISTS (SELECT 1 FROM intelligence_event ie WHERE ie.id = intelligence_event_dossiers.event_id AND tenant_isolation.rls_select_policy(ie.organization_id))`. Cascade behavior: `ON DELETE CASCADE` on the `event_id` FK; `dossier_id` cascade-deletes too (no orphan junction rows). Junction has NO `organization_id` column of its own — single source of truth.

### TypeScript regen flow (INTEL-05)

- **D-14:** Use the Supabase MCP `generate_typescript_types` against staging project id `zkrcjzdemdmwhearhfgg`. Write output to **both** `backend/src/types/database.types.ts` and `frontend/src/types/database.types.ts` (current convention — files are kept in sync by manual copy after each schema change). Run `pnpm --filter backend type-check` and `pnpm --filter frontend type-check`; both must exit 0 in the same wave as the migration. Type files are committed in the same plan as the migration (NOT a follow-up plan).

### Migration application

- **D-15:** All migrations applied to the staging Supabase project (`zkrcjzdemdmwhearhfgg`) via the Supabase MCP `apply_migration` tool, NOT via local CLI. Per project CLAUDE.md and user instruction "when you need to apply migration to supabase, use the supabase mcp to do it your self". Each migration is a single SQL file under `supabase/migrations/` with a Phase-54 timestamp prefix.

### Claude's Discretion

The planner has discretion on:

- Exact migration file timestamps and split (one file vs multiple — see code_context guidance: prior phases have split per-table for reviewability, e.g., separate migration per concern).
- Specific index choice details beyond the spec's "required indexes" (recommended starting set: `(organization_id, occurred_at DESC)`, `(organization_id, severity)`, `(source_type)` on event; `(organization_id, dossier_id, period_end DESC)` on digest; junction PK = composite `(event_id, dossier_type, dossier_id)` with secondary index on `(dossier_type, dossier_id)`).
- Junction PK shape (recommended: composite `(event_id, dossier_type, dossier_id)`; alternative: surrogate UUID PK + unique constraint on the triple — planner may pick).
- Whether the rename of Phase-45 hook to `useDashboardDigest` ships as one plan or two waves (recommendation: same wave as the rename migration so type-check stays green).

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements

- `.planning/REQUIREMENTS.md` § Intelligence Engine schema groundwork (INTEL) — INTEL-01..05; note the Phase-54 renames captured in D-04, D-05, D-08, and dossier-type correction D-07.
- `.planning/ROADMAP.md` § Phase 54: Intelligence Engine Schema Groundwork — success criteria 1..5; note the dossier-type count correction (7 not 8).

### Existing tables to keep / rename / not touch

- `supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql` — defines existing `intelligence_digest` (to be renamed `dashboard_digest`) and its 4-policy RLS pattern (template for new tables per D-12).
- `supabase/seed/060-dashboard-demo.sql` — seed source for the renamed `dashboard_digest`.
- `frontend/src/hooks/useIntelligenceDigest.ts` — single frontend caller of existing `intelligence_digest`; renames to `useDashboardDigest`.
- `frontend/src/hooks/__tests__/useIntelligenceDigest.test.ts` — pinned test for the read path; rename in lockstep.
- `supabase/migrations/20250930006_create_timeline_view.sql` § L122 — `JOIN intelligence_signals i ON i.dossier_id = d.id`; the **plural** existing curated-signals table stays untouched.
- `backend/src/services/entity-search.service.ts` § ~L284 — uses `table: 'intelligence_signals'`; untouched.
- `backend/src/services/link.service.ts` § ~L456 — uses `table: 'intelligence_signals'`; untouched.

### Tenant-scoped RLS plumbing

- `supabase/migrations/20260113500001_tenant_isolation_layer.sql` — defines `tenant_isolation.rls_select_policy(organization_id)`, `rls_insert_policy`, `rls_update_policy`, `is_tenant_member`, `get_user_tenant_ids`. Reused as-is.
- `tenant_isolation.rls_*_policy(organization_id)` signature locks D-08: column name must be `organization_id` to use these helpers.

### Canonical dossier-type list

- `supabase/migrations/20260202000001_merge_elected_official_into_person.sql` § "ADD CONSTRAINT dossiers_type_check" — defines the 7 canonical types the junction's `dossier_type` CHECK must match.

### Deployment

- `CLAUDE.md` § "Deployment Configuration" — staging project name `Intl-Dossier`, id `zkrcjzdemdmwhearhfgg`, region `eu-west-2`, host `db.zkrcjzdemdmwhearhfgg.supabase.co`. Migrations go via Supabase MCP.

### Conventions

- `CLAUDE.md` § "Work Management Terminology" — Priority enum (`low, medium, high, urgent`) reused for `severity` per D-11.
- `.planning/codebase/CONVENTIONS.md` — file naming, naming patterns, code style baseline.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`tenant_isolation` schema** (`20260113500001_tenant_isolation_layer.sql`) — Five helper functions already in production. Phase 54 reuses unchanged: `rls_select_policy`, `rls_insert_policy`, `rls_update_policy`, `is_tenant_member`, `get_user_tenant_ids`.
- **`public.auth_has_any_role(roles TEXT[])`** — already used by Phase-45 RLS policies; reused for `INSERT`/`UPDATE`/`DELETE` policies in D-12.
- **Phase-45 RLS template** — the 4-policy block (`SELECT`/`INSERT`/`UPDATE`/`DELETE` with `DROP POLICY IF EXISTS` guards) is the verbatim template for both new tables.

### Established Patterns

- **`CREATE TABLE IF NOT EXISTS`** — Phase-45 uses idempotent guards. Phase 54 should too, so re-runs against the same staging environment are safe.
- **Indexes attached in the same migration as table creation** — `idx_<table>_<purpose>` naming, partial WHERE clauses for nullable FKs (e.g., `WHERE dossier_id IS NOT NULL`).
- **`organization_id` is always `NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE`** — Phase-45 sets this precedent; followed in D-08.
- **`source_type` already appears in `dynamic_embeddings` and `intelligence_reports`** — but as `TEXT`. Phase 54 introduces the first **enum** form of source typing in this codebase. Worth noting for downstream agents that the existing `intelligence_signals.source TEXT` and the new `intelligence_event.source_type signal_source_type` ARE NOT the same column on the same table.

### Integration Points

- **Supabase MCP `apply_migration`** — execution path for all schema changes (per D-15).
- **Supabase MCP `generate_typescript_types`** — execution path for D-14.
- **Phase-45 dashboard read path** — the renamed `dashboard_digest` keeps its existing read path working via the in-phase rename of `useIntelligenceDigest` → `useDashboardDigest`.

</code_context>

<specifics>
## Specific Ideas

- Spec column `source_ref` on `intelligence_event` is treated as a free-form `TEXT` (URL, internal ID, citation string). It is NOT a FK. Concrete shape will firm up when v7.0 ingest jobs land.
- `intelligence_event.content` is `TEXT NOT NULL` for now (no `_en`/`_ar` split). Localization, if needed, is deferred to v7.0 API/UI phases — schema must not pre-commit to a bilingual shape.
- `intelligence_digest.summary` is `TEXT NOT NULL`. Same localization deferral as above.
- `ingested_at` defaults `NOW()`; `occurred_at` is required and analyst-provided.
- `period_start` / `period_end` are `TIMESTAMPTZ NOT NULL`; add a `CHECK (period_end > period_start)`.

</specifics>

<deferred>
## Deferred Ideas

- **v7.0 ingest jobs** (RSS, public API, manual paste) — deferred to v7.0 / v7.1 per REQUIREMENTS.md "Future Requirements".
- **API endpoints + UI for signal triage / digest pipeline / alerting** — explicit v7.0 future-requirement; not in Phase 54.
- **Multi-dossier AI correlation + analytic graph queries** — depends on this schema; lands later.
- **Localization (`content_en/ar`, `summary_en/ar`) on the new tables** — schema stays bilingual-neutral; revisit when consumer surface is built.
- **Migrating existing `intelligence_signals` (plural, curated) into the new `intelligence_event` ingest table** — semantically different (curated vs raw). If unification is wanted, it's a separate later phase with explicit consolidation plan.
- **Junction tenant column** — could add a denormalized `organization_id` on `intelligence_event_dossiers` for hotter RLS, but D-13 keeps tenancy parent-derived. Revisit if RLS becomes a perf hot spot.
- **GitHub `phase-54-base` signed tag** — follow the standard signed-tag flow per CLAUDE.md § "Tag signing setup" at phase open; not a deferred decision, just a procedural reminder for the planner.

</deferred>

---

_Phase: 54-intelligence-engine-schema-groundwork_
_Context gathered: 2026-05-16_
