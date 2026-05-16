# Phase 54: Intelligence Engine Schema Groundwork - Research

**Researched:** 2026-05-16
**Domain:** PostgreSQL schema migration on Supabase (staging `zkrcjzdemdmwhearhfgg`, eu-west-2)
**Confidence:** HIGH (all findings verified against on-disk migrations + Phase-45 RLS template; CONTEXT.md decisions are the contract)

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions (D-01..D-15 — do NOT re-decide)

- **D-01:** Rename existing Phase-45 `intelligence_digest` → `dashboard_digest` in the same migration that creates the new spec-compliant `intelligence_digest`. [VERIFIED: 54-CONTEXT.md L28]
- **D-02:** Phase-45 callsite update in Phase-54 scope: `frontend/src/hooks/useIntelligenceDigest.ts` + its test rename to `useDashboardDigest`; `.from('intelligence_digest')` → `.from('dashboard_digest')`. [VERIFIED: 54-CONTEXT.md L29]
- **D-03:** Update seed `supabase/seed/060-dashboard-demo.sql` to reference renamed table. Phase-45 migration itself is historical — NOT retro-edited. Rename happens in a NEW Phase-54 migration. [VERIFIED: 54-CONTEXT.md L30]
- **D-04:** Rename spec ingest table from `intelligence_signal` → **`intelligence_event`**. Existing `intelligence_signals` (plural, curated) untouched. [VERIFIED: 54-CONTEXT.md L31]
- **D-05:** Junction → **`intelligence_event_dossiers`**. [VERIFIED: 54-CONTEXT.md L32]
- **D-06:** Junction `dossier_type` is `TEXT CHECK (... 7 values ...)`: `country, organization, forum, engagement, topic, working_group, person`. [VERIFIED: 54-CONTEXT.md L36-37]
- **D-07:** Phase 54 patches REQUIREMENTS.md INTEL-03 + ROADMAP success-criterion #3 to drop `elected_official` (7 not 8). [VERIFIED: 54-CONTEXT.md L38]
- **D-08:** Tenant column = `organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE`. Reuses `tenant_isolation.rls_*_policy(organization_id)`. NOT `tenant_id`. REQUIREMENTS.md `tenant_id` wording is updated by Phase 54 to `organization_id`. [VERIFIED: 54-CONTEXT.md L42]
- **D-09:** Real PG enum `CREATE TYPE signal_source_type AS ENUM ('publication','feed','human_entered','ai_generated')` applied to `intelligence_event.source_type`. [VERIFIED: 54-CONTEXT.md L46]
- **D-10:** Enum keeps spec name `signal_source_type` even though table is `intelligence_event`. [VERIFIED: 54-CONTEXT.md L47]
- **D-11:** `intelligence_event.severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','urgent')) DEFAULT 'medium'`. [VERIFIED: 54-CONTEXT.md L51]
- **D-12:** Both new tables get the Phase-45 four-policy RLS pattern (SELECT/INSERT/UPDATE/DELETE) using `tenant_isolation.rls_*_policy(organization_id)` + `public.auth_has_any_role(...)`. [VERIFIED: 54-CONTEXT.md L55-59]
- **D-13:** Junction `intelligence_event_dossiers` has NO `organization_id` column; tenancy derived via `EXISTS (SELECT 1 FROM intelligence_event ie WHERE ie.id = event_id AND tenant_isolation.rls_select_policy(ie.organization_id))`. Cascade: `ON DELETE CASCADE` on both FKs. [VERIFIED: 54-CONTEXT.md L60]
- **D-14:** Supabase MCP `generate_typescript_types` for project `zkrcjzdemdmwhearhfgg`. Output written to BOTH `backend/src/types/database.types.ts` AND `frontend/src/types/database.types.ts` (manual copy). `pnpm --filter backend type-check` + `pnpm --filter frontend type-check` exit 0 in the same wave. Type files commit in the same plan as the migration. [VERIFIED: 54-CONTEXT.md L64]
- **D-15:** All migrations applied via Supabase MCP `apply_migration` against `zkrcjzdemdmwhearhfgg`. Each migration is a single SQL file under `supabase/migrations/` with a Phase-54 timestamp prefix. [VERIFIED: 54-CONTEXT.md L68]

### Claude's Discretion (planner decides)

- Exact migration file count and split (CONTEXT recommends per-table for reviewability).
- Index choice details beyond the recommended starting set.
- Junction PK shape (composite vs surrogate UUID + UNIQUE).
- Whether the Phase-45 hook rename ships in same plan as the table rename or a follow-up (CONTEXT recommends same plan for type-check greenness).

### Deferred Ideas (OUT OF SCOPE)

- v7.0 ingest jobs (RSS, public APIs, manual paste).
- API endpoints + UI for signal triage, digest pipeline, alerting.
- Multi-dossier AI correlation, analytic graph queries.
- Bilingual `content_en/ar` and `summary_en/ar` columns on new tables.
- Unifying existing curated `intelligence_signals` (plural) into new `intelligence_event` (ingest).
- Denormalized `organization_id` on the junction (deferred unless RLS becomes a hot spot).

— `phase-54-base` signed tag is **NOT deferred** — it's a procedural reminder for the planner per CONTEXT § Deferred.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID           | Description (post-Phase-54 rewording)                                                                                                                                                                                            | Research Support                                                                                                                                                                                                                                                                                                                                           |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **INTEL-01** | `intelligence_event` table on staging with full column set (id, source_type, source_ref, content, occurred_at, ingested_at, severity, organization_id, created_by), required indexes, tenant-scoped RLS                          | Phase-45 RLS template § `20260507210000_phase45_intelligence_digest_seed.sql` L8-67 (verbatim reusable); `tenant_isolation.rls_*_policy(organization_id)` helpers § `20260113500001_tenant_isolation_layer.sql` L185-284                                                                                                                                   |
| **INTEL-02** | `intelligence_digest` (new spec-shape) table on staging with full column set (id, dossier_type, dossier_id, period_start, period_end, summary, generated_by, organization_id, generated_at), required indexes, tenant-scoped RLS | Same RLS template; CHECK `(period_end > period_start)` per CONTEXT.md § specifics                                                                                                                                                                                                                                                                          |
| **INTEL-03** | `intelligence_event_dossiers` polymorphic junction enforcing `dossier_type` CHECK over the **7** canonical types matching `dossiers_type_check`                                                                                  | Canonical 7-value CHECK source: `20260202000001_merge_elected_official_into_person.sql` L194-204; polymorphic-junction precedent: `work_item_dossiers` § `20260116500001_create_work_item_dossiers.sql`                                                                                                                                                    |
| **INTEL-04** | `signal_source_type` PostgreSQL enum (`publication`, `feed`, `human_entered`, `ai_generated`) applied to `intelligence_event.source_type`                                                                                        | `CREATE TYPE ... AS ENUM` first-of-its-kind for source typing in this codebase (CONTEXT § code_context L137); Supabase auto-regenerates TS union type in `Database['public']['Enums']`                                                                                                                                                                     |
| **INTEL-05** | `database.types.ts` regenerated; `pnpm type-check` exits 0 on backend + frontend in the same wave                                                                                                                                | MCP call `mcp__claude_ai_Supabase__generate_typescript_types` + manual copy to `backend/src/types/database.types.ts` and `frontend/src/types/database.types.ts`. Workspace scripts: `backend/package.json:16 "type-check": "tsc --noEmit"`, `frontend/package.json:19 "type-check": "tsc --noEmit"`, `package.json:28 "typecheck": "turbo run type-check"` |

</phase_requirements>

---

## Summary

Phase 54 is a **schema-only** Postgres migration delivered to Supabase staging via the Supabase MCP. The work splits cleanly into three groups: (a) one rename migration that lifts the Phase-45 dashboard-feed table out of the way (`intelligence_digest` → `dashboard_digest`) and updates one frontend hook + one test in lockstep so `pnpm type-check` stays green; (b) one structural migration that creates the v7.0 ingest layer (`intelligence_event` + `intelligence_digest` + `intelligence_event_dossiers` junction + `signal_source_type` enum) with the verbatim Phase-45 four-policy RLS pattern; (c) text-only patches to REQUIREMENTS.md + ROADMAP.md so the spec wording matches the on-disk reality (7 dossier types, `organization_id`, table names). A `phase-54-base` annotated + SSH-signed tag must anchor the diff at phase open, per the BUNDLE-06 precedent.

Every load-bearing primitive already exists in the codebase. `tenant_isolation.rls_select_policy(organization_id)` and its INSERT/UPDATE/DELETE siblings are reused as-is. `public.auth_has_any_role(ARRAY['admin','editor'])` is already wired. The Phase-45 migration (`20260507210000_phase45_intelligence_digest_seed.sql` L8-67) is a copy-pasteable template — substitute table name, column list, and policy names; the structure is identical. The `signal_source_type` enum is the only first-of-its-kind primitive (no other table in the codebase uses a real PG enum for source typing — the existing `intelligence_signals.source` is `TEXT`).

**Primary recommendation:** Split into **3 migration files** (rename + new-tables + junction) with one wave per migration so each step verifies cleanly, plus a 4th plan that patches docs and regenerates types. Wave-0 creates `phase-54-base`. Total: 4 plans across 4 waves. Use surrogate UUID PK on the junction (matches `work_item_dossiers` precedent and survives a future requirement for soft-delete or per-link metadata).

## Architectural Responsibility Map

| Capability                                                             | Primary Tier            | Secondary Tier         | Rationale                                                                                                      |
| ---------------------------------------------------------------------- | ----------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| New schema (`intelligence_event`, new `intelligence_digest`, junction) | Database / Storage      | —                      | Schema only; no API, no UI, no Edge Function.                                                                  |
| `signal_source_type` enum                                              | Database / Storage      | —                      | First-class PG enum, regenerated into TS via Supabase MCP.                                                     |
| RLS enforcement                                                        | Database / Storage      | —                      | All enforcement at the row level via `tenant_isolation.rls_*_policy(organization_id)` + `auth_has_any_role()`. |
| Phase-45 `intelligence_digest` → `dashboard_digest` rename             | Database / Storage      | Frontend (hook + test) | DB rename is the source of truth; one frontend caller updated in lockstep to keep type-check green.            |
| TypeScript regeneration                                                | Frontend Server (build) | Backend Server (build) | `tsc --noEmit` on both workspaces is the gate.                                                                 |
| REQUIREMENTS.md + ROADMAP.md text patches                              | Docs                    | —                      | No code impact.                                                                                                |
| `phase-54-base` signed tag                                             | Repo provenance         | —                      | Local git ref + origin push; not a tier owner of any runtime behavior.                                         |

## Standard Stack

This phase introduces no new dependencies. Every primitive is already in the codebase.

### Core (all reused as-is)

| Library / Primitive                      | Version              | Purpose                                                                                                                                    | Source                                                                                               |
| ---------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Supabase PostgreSQL                      | 17.6.1.008 (staging) | Schema host                                                                                                                                | [CITED: CLAUDE.md § Staging Environment]                                                             |
| `tenant_isolation` schema                | created 2026-01-13   | RLS helpers: `rls_select_policy`, `rls_insert_policy`, `rls_update_policy`, `rls_delete_policy`, `is_tenant_member`, `get_user_tenant_ids` | [VERIFIED: `supabase/migrations/20260113500001_tenant_isolation_layer.sql` L185-284]                 |
| `public.auth_has_any_role(roles TEXT[])` | created 2026         | Role-gate inside RLS WITH CHECK / USING                                                                                                    | [VERIFIED: `supabase/migrations/011_rls_policies.sql` L198-208]                                      |
| `@supabase/supabase-js`                  | `^2.100.1`           | TS client (frontend + backend)                                                                                                             | [VERIFIED: `frontend/package.json:68`, `backend/package.json:27`]                                    |
| Vitest                                   | already in use       | RLS integration test runner                                                                                                                | [VERIFIED: `tests/integration/polymorphic-document-rls.test.ts`, `tests/security/rls-audit.test.ts`] |

### Supporting (build/tooling, all already present)

| Tool                                     | Purpose                                             |
| ---------------------------------------- | --------------------------------------------------- |
| Supabase MCP `apply_migration`           | Apply each Phase-54 SQL file to staging             |
| Supabase MCP `generate_typescript_types` | Regenerate `database.types.ts` after schema changes |
| Supabase MCP `list_tables`               | Pre-migration sanity check before each apply        |
| Supabase MCP `get_advisors`              | Post-migration check for missing indexes / RLS gaps |
| `pnpm --filter backend type-check`       | TS gate (backend)                                   |
| `pnpm --filter frontend type-check`      | TS gate (frontend)                                  |
| `pnpm typecheck` (root, turbo)           | Combined gate                                       |

### Alternatives Considered (rejected by CONTEXT)

| Instead of                                                   | Could Use                                  | Why Rejected                                                                                                                       |
| ------------------------------------------------------------ | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `tenant_isolation.rls_*_policy(organization_id)`             | Hand-rolled `auth.uid() IN (...)` policies | D-08 locks the helper; consistency with Phase-45 + every other tenant-scoped table                                                 |
| `intelligence_signal` (singular, per spec)                   | The spec wording verbatim                  | D-04 — collides with existing `intelligence_signals` (plural, curated). Renamed `intelligence_event`                               |
| `tenant_id` column                                           | The spec wording verbatim                  | D-08 — existing convention is `organization_id`; helpers' signatures lock the column name                                          |
| `severity smallint` (1-5) or `confidence_level` enum         | Numeric or alternate vocab                 | D-11 — CLAUDE.md work-item Priority vocabulary picked for UI badge/filter consistency                                              |
| Composite junction PK `(event_id, dossier_type, dossier_id)` | Per CONTEXT discretion                     | Surrogate UUID PK recommended (matches `work_item_dossiers`; future-proofs for per-link metadata, soft-delete, optimistic locking) |

**Installation:** None — no new packages.

## Package Legitimacy Audit

Not applicable — this phase installs zero new packages. All schema work uses Supabase MCP tools already configured for the project; all TypeScript verification uses existing `tsc` setups. The Package Legitimacy Gate protocol is therefore not invoked.

## Architecture Patterns

### System Architecture Diagram (Phase-54 scope)

```
                      ┌──────────────────────────────┐
                      │  Phase 54 PLAN files         │
                      │  (no API / no UI / no jobs)  │
                      └─────────────┬────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────────────┐
              │                     │                             │
              ▼                     ▼                             ▼
      ┌──────────────┐     ┌──────────────────┐         ┌─────────────────┐
      │ SQL migr 1   │     │ SQL migr 2 (new) │         │ SQL migr 3 (new)│
      │ RENAME table │     │ intelligence_    │         │ intelligence_   │
      │ intelligence │     │ event +          │         │ event_dossiers  │
      │ _digest →    │     │ intelligence_    │         │ (junction,      │
      │ dashboard_   │     │ digest (new) +   │         │ EXISTS-based    │
      │ digest       │     │ enum             │         │ RLS via parent) │
      └──────┬───────┘     └────────┬─────────┘         └────────┬────────┘
             │                      │                            │
             │ via Supabase MCP `apply_migration`                │
             ▼                      ▼                            ▼
      ╔══════════════════════════════════════════════════════════╗
      ║   Supabase staging  (zkrcjzdemdmwhearhfgg, eu-west-2)    ║
      ║   – RLS via tenant_isolation.rls_*_policy(organization_id)║
      ║   – Role gate via public.auth_has_any_role(...)          ║
      ╚════════════════════════════╤═════════════════════════════╝
                                   │  MCP `generate_typescript_types`
                                   ▼
                      ┌────────────────────────────────┐
                      │ backend/src/types/             │
                      │   database.types.ts (regen)    │  ← `pnpm --filter backend type-check`
                      │ frontend/src/types/            │
                      │   database.types.ts (regen)    │  ← `pnpm --filter frontend type-check`
                      └─────────────┬──────────────────┘
                                    │
                                    ▼
              ┌─────────────────────────────────────────┐
              │ Lockstep frontend rename                │
              │   useIntelligenceDigest.ts ─→           │
              │   useDashboardDigest.ts                 │
              │   (.from('intelligence_digest') ─→      │
              │    .from('dashboard_digest'))           │
              │   + test rename + Digest.tsx import +   │
              │     Digest.test.tsx readFileSync path   │
              └─────────────────────────────────────────┘
```

Data flow follows the standard pattern: SQL is the source of truth; TS types are regenerated from it; consumer code adapts.

### Recommended Project Structure (delta only — no folders created)

```
supabase/
└── migrations/
    ├── 20260516xxxxxx_phase54_rename_phase45_intelligence_digest.sql   # plan 1
    ├── 20260516xxxxxy_phase54_intelligence_event_and_digest.sql        # plan 2
    └── 20260516xxxxxz_phase54_intelligence_event_dossiers.sql          # plan 3

supabase/seed/
└── 060-dashboard-demo.sql                # update INSERT INTO / DELETE FROM
                                          # `intelligence_digest` → `dashboard_digest`

frontend/src/hooks/
├── useDashboardDigest.ts                 # renamed from useIntelligenceDigest.ts
│                                         #   – .from('dashboard_digest')
│                                         #   – exported symbol renamed
└── __tests__/useDashboardDigest.test.ts  # renamed from useIntelligenceDigest.test.ts
                                          #   – string assertions updated
                                          #   – `import` source updated

frontend/src/pages/Dashboard/widgets/
├── Digest.tsx                            # import path updated
└── __tests__/Digest.test.tsx             # `readFileSync('src/hooks/useDashboardDigest.ts', ...)`
                                          # AND vi.mock('@/hooks/useDashboardDigest', ...)

backend/src/types/database.types.ts        # regenerated, committed in same plan
frontend/src/types/database.types.ts       # regenerated, committed in same plan

.planning/
├── REQUIREMENTS.md                        # INTEL-01..05 text patches (plan 4)
└── ROADMAP.md                             # Phase 54 success criteria + dependency graph
```

### Migration File Split Strategy (Claude's discretion → recommendation)

**Recommendation: 3 migration files**, one per concern, applied in strict order. Each gets its own plan.

**Timestamp scheme** follows the most recent in-repo cadence (`20260507210000_phase45_intelligence_digest_seed.sql`, `20260508110346_phase46_fix_upcoming_events_rpc.sql`). For Phase 54, use a single date stamp (`20260516`) with HH:MM:SS suffixes to guarantee strict ordering inside the phase:

| Plan | Filename                                                        | Order | What it does                                                                                                                                                                                                                                                                                                                                           |
| ---- | --------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | `20260516000001_phase54_rename_phase45_intelligence_digest.sql` | 1st   | `ALTER TABLE public.intelligence_digest RENAME TO dashboard_digest;` — runs alone in its own migration so the rename is atomic and reversible. RLS policies, indexes, FKs, and GRANTs follow the table automatically (see "Dashboard_digest rename mechanics" below). Update seed `060-dashboard-demo.sql` and frontend hook + tests in the same plan. |
| 2    | `20260516000002_phase54_intelligence_event_and_digest.sql`      | 2nd   | `CREATE TYPE signal_source_type AS ENUM (...)`; `CREATE TABLE intelligence_event (...)`; `CREATE TABLE intelligence_digest (...)` (the new shape; safe because plan 1 freed the name); both with indexes + 4-policy RLS + GRANTs.                                                                                                                      |
| 3    | `20260516000003_phase54_intelligence_event_dossiers.sql`        | 3rd   | `CREATE TABLE intelligence_event_dossiers (...)` with EXISTS-based polymorphic RLS, dossier_type CHECK on the 7 canonical values, and indexes. Lands last because it FKs to `intelligence_event` from plan 2.                                                                                                                                          |
| 4    | (docs + types)                                                  | 4th   | Patch REQUIREMENTS.md + ROADMAP.md text. Regenerate TS types via MCP. Commit `database.types.ts` on both workspaces. Run `pnpm typecheck` (root, turbo) — must exit 0.                                                                                                                                                                                 |

This split matches the "per-table for reviewability" pattern called out in CONTEXT.md L74. It also lets the planner gate each plan on the previous one without entangling concerns.

**Alternative considered:** single mega-migration. Rejected — harder to roll back, harder to MCP-apply (one failed CREATE leaves an inconsistent intermediate state), and obscures review.

### Index Design (refinement of CONTEXT recommendation)

| Table                         | Index                                                                                                             | Why                                                                                                                                                                                 | Phase-45 precedent                                                 |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `intelligence_event`          | `idx_intelligence_event_org_occurred_at ON (organization_id, occurred_at DESC)`                                   | Hot path: list signals per org by recency.                                                                                                                                          | `idx_intelligence_digest_org_occurred_at`                          |
| `intelligence_event`          | `idx_intelligence_event_org_severity ON (organization_id, severity) WHERE severity IN ('high','urgent')`          | Triage queries filter by severity within org. **Partial WHERE** narrows index to the rows analysts care about (Phase-45 partial-index pattern with `WHERE dossier_id IS NOT NULL`). | `idx_intelligence_digest_dossier ... WHERE dossier_id IS NOT NULL` |
| `intelligence_event`          | `idx_intelligence_event_source_type ON (source_type)`                                                             | Source-type filtering at table scale; cheap.                                                                                                                                        | New                                                                |
| `intelligence_event`          | `idx_intelligence_event_created_by ON (created_by) WHERE created_by IS NOT NULL`                                  | Audit / "my signals" query path; partial since column is nullable.                                                                                                                  | New                                                                |
| `intelligence_digest` (new)   | `idx_intelligence_digest_org_dossier_period ON (organization_id, dossier_id, period_end DESC)`                    | Primary read shape: per-org per-dossier most-recent digest first.                                                                                                                   | New                                                                |
| `intelligence_digest` (new)   | `idx_intelligence_digest_dossier_type ON (dossier_type)`                                                          | Optional analytics filter; cheap.                                                                                                                                                   | New                                                                |
| `intelligence_event_dossiers` | UNIQUE `(event_id, dossier_type, dossier_id) WHERE deleted_at IS NULL` if soft-delete; else UNIQUE on the triple. | Prevents duplicate links — matches `work_item_dossiers` `idx_work_item_dossiers_unique_active` pattern.                                                                             | `work_item_dossiers` L55-57                                        |
| `intelligence_event_dossiers` | `idx_intelligence_event_dossiers_dossier ON (dossier_type, dossier_id)`                                           | Reverse lookup: "all signals linked to this dossier".                                                                                                                               | `work_item_dossiers` L86-88                                        |

**Naming convention:** `idx_<table>_<purpose>` (snake*case), matching Phase-45 (`idx_intelligence_digest*\*`).
**Partial WHERE convention:** mirror Phase-45 `WHERE dossier_id IS NOT NULL`.
**Idempotent guards:** `CREATE INDEX IF NOT EXISTS`so re-runs against staging are safe (Phase-45 pattern verified in`20260507210000_phase45_intelligence_digest_seed.sql` L22-28).

### Pattern 1: Phase-45 RLS template (verbatim reusable)

**What:** four-policy block (SELECT/INSERT/UPDATE/DELETE) with `DROP POLICY IF EXISTS` guards.
**When to use:** every new tenant-scoped table in Phase 54.
**Example:**

```sql
-- Source: supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql L30-67
ALTER TABLE public.intelligence_event ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS intelligence_event_select_org ON public.intelligence_event;
CREATE POLICY intelligence_event_select_org
  ON public.intelligence_event FOR SELECT
  TO authenticated
  USING (tenant_isolation.rls_select_policy(organization_id));

DROP POLICY IF EXISTS intelligence_event_insert_editor ON public.intelligence_event;
CREATE POLICY intelligence_event_insert_editor
  ON public.intelligence_event FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_isolation.rls_insert_policy(organization_id)
    AND public.auth_has_any_role(ARRAY['admin', 'editor'])
  );

DROP POLICY IF EXISTS intelligence_event_update_editor ON public.intelligence_event;
CREATE POLICY intelligence_event_update_editor
  ON public.intelligence_event FOR UPDATE
  TO authenticated
  USING (
    tenant_isolation.rls_update_policy(organization_id)
    AND public.auth_has_any_role(ARRAY['admin', 'editor'])
  )
  WITH CHECK (
    tenant_isolation.rls_update_policy(organization_id)
    AND public.auth_has_any_role(ARRAY['admin', 'editor'])
  );

DROP POLICY IF EXISTS intelligence_event_delete_admin ON public.intelligence_event;
CREATE POLICY intelligence_event_delete_admin
  ON public.intelligence_event FOR DELETE
  TO authenticated
  USING (tenant_isolation.rls_delete_policy(organization_id));

GRANT SELECT ON public.intelligence_event TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.intelligence_event TO authenticated;
```

Note Phase-45's DELETE policy on `intelligence_digest` uses `rls_delete_policy` (admin-only via the helper — see `tenant_isolation.rls_delete_policy` L262-284: it returns true only for `auth_has_role('admin')` AND tenant member). The role gate is therefore **embedded in the helper itself**; the CONTEXT D-12 line `AND public.auth_has_any_role(ARRAY['admin'])` is redundant but harmless. Recommend matching Phase-45 verbatim (helper-only, no extra `auth_has_any_role` on DELETE) to keep the template byte-identical.

### Pattern 2: Polymorphic junction with EXISTS-based RLS (D-13)

**What:** child table derives tenancy from parent via subquery in RLS USING/WITH CHECK clauses.
**When to use:** `intelligence_event_dossiers` (D-13).
**Why no precedent reuse:** the existing `work_item_dossiers` polymorphic junction (`20260116500001_create_work_item_dossiers.sql`) uses **clearance-level + ownership** for RLS, not tenancy-via-parent — different problem. The EXISTS-via-parent pattern is **new for this codebase** in this junction shape, but it is a well-established Postgres pattern and the query cost is negligible at expected scale (event-row count × link-count-per-event will be in the low-thousands range for the foreseeable future — no need for the denormalized `organization_id` column called out in CONTEXT § Deferred).

**Example:**

```sql
ALTER TABLE public.intelligence_event_dossiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS intelligence_event_dossiers_select ON public.intelligence_event_dossiers;
CREATE POLICY intelligence_event_dossiers_select
  ON public.intelligence_event_dossiers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_select_policy(ie.organization_id)
    )
  );

-- INSERT/UPDATE mirror with rls_insert/update_policy and the editor role gate.
-- DELETE mirrors with rls_delete_policy (admin-only via helper).
```

**Performance note:** the subquery hits `intelligence_event(id)` (PK lookup, O(1)) once per row evaluated. The `EXISTS` short-circuits. At expected scale (low-thousands of events, low-tens of links per event), this is well under any noticeable threshold. CONTEXT § Deferred is correct to keep denormalization as a future-only optimization.

### Pattern 3: `dashboard_digest` rename mechanics (D-01)

**What follows the table automatically when you `ALTER TABLE ... RENAME TO ...`:**

- ✅ Columns, data, types, defaults
- ✅ Constraints (PK, FK, CHECK, NOT NULL)
- ✅ Indexes (names stay — `idx_intelligence_digest_org_occurred_at` keeps that name even though the table is now `dashboard_digest`; rename for clarity is recommended but not required)
- ✅ Row-level security policies (policy `intelligence_digest_select_org` still exists, still applies — Postgres tracks policies by `pg_policy.polrelid`)
- ✅ Triggers
- ✅ GRANTs
- ✅ Foreign keys pointing AT the table (`dossier_id` REFERENCES, `created_by` REFERENCES, the rename does not break them)

**What does NOT follow automatically:**

- ❌ Views, materialized views, or functions that hard-code the table name (`SELECT * FROM intelligence_digest`) — must be re-declared. **None exist** for `intelligence_digest` (verified via repo-wide grep — only the seed migration + frontend hook reference it).
- ❌ Application code (`.from('intelligence_digest')`) — handled by lockstep frontend rename (D-02).
- ❌ Seed migration text comments — semantically stale but functionally inert. Seed file `060-dashboard-demo.sql` has both `DELETE FROM intelligence_digest` (L104) and `INSERT INTO intelligence_digest` (L342) — both must change.

**Recommended SQL (plan 1):**

```sql
-- Phase 54 plan 1: free the canonical name for the v7.0 spec
ALTER TABLE IF EXISTS public.intelligence_digest RENAME TO dashboard_digest;

-- Optional: rename the indexes for clarity (post-rename their names are still idx_intelligence_digest_*)
ALTER INDEX IF EXISTS public.idx_intelligence_digest_org_occurred_at
  RENAME TO idx_dashboard_digest_org_occurred_at;
ALTER INDEX IF EXISTS public.idx_intelligence_digest_dossier
  RENAME TO idx_dashboard_digest_dossier;
ALTER INDEX IF EXISTS public.idx_intelligence_digest_source_publication
  RENAME TO idx_dashboard_digest_source_publication;

-- Optional: rename the RLS policies for clarity (policies still apply by polrelid even if names are stale)
ALTER POLICY intelligence_digest_select_org ON public.dashboard_digest
  RENAME TO dashboard_digest_select_org;
ALTER POLICY intelligence_digest_insert_editor ON public.dashboard_digest
  RENAME TO dashboard_digest_insert_editor;
ALTER POLICY intelligence_digest_update_editor ON public.dashboard_digest
  RENAME TO dashboard_digest_update_editor;
ALTER POLICY intelligence_digest_delete_admin ON public.dashboard_digest
  RENAME TO dashboard_digest_delete_admin;

COMMENT ON TABLE public.dashboard_digest IS
  'Dashboard headline feed (Phase 45). Renamed from intelligence_digest in Phase 54 '
  'to free the canonical name for the v7.0 spec-compliant intelligence_digest.';
```

### Pattern 4: TypeScript regeneration workflow (D-14)

**Sequence (plan 4):**

1. After plans 1-3 are all applied to staging, call the MCP:
   ```
   mcp__claude_ai_Supabase__generate_typescript_types(project_id="zkrcjzdemdmwhearhfgg")
   ```
2. The MCP returns a TypeScript module. **Write it to both files**:
   - `backend/src/types/database.types.ts`
   - `frontend/src/types/database.types.ts`
3. There is no automated sync between the two — manual copy is current convention. The contents must be byte-identical (Supabase generates one file from one project; both workspaces consume the same schema).
4. Run `pnpm --filter backend type-check` → must exit 0.
   - Backend script: `tsc --noEmit` (from `backend/package.json:16`).
5. Run `pnpm --filter frontend type-check` → must exit 0.
   - Frontend script: `tsc --noEmit` (from `frontend/package.json:19`).
6. Equivalent root: `pnpm typecheck` → `turbo run type-check` (from `package.json:28`) — runs both in parallel; same gate.

**There is no CI step that auto-catches drift between the two type files** (verified via repo grep — no `diff` check, no pre-commit hook). Drift can only be caught by `type-check` failing on the workspace that has the stale file. Recommendation: planner should include both `backend/src/types/database.types.ts` AND `frontend/src/types/database.types.ts` in the plan-4 `<files>` block to make the dual-write explicit.

**Sanity check that the MCP output includes Phase-54 additions:** after regen, grep for `intelligence_event:`, `signal_source_type`, and `dashboard_digest` in each file. Three positive grep hits = regen succeeded against the post-Phase-54 schema. Zero hits = regen ran against a stale snapshot or a different project.

### Anti-Patterns to Avoid

- **Editing the Phase-45 migration** (`20260507210000_phase45_intelligence_digest_seed.sql`) to retroactively reflect the rename. CONTEXT D-03 forbids it; migrations are append-only history. The rename happens in a new Phase-54 migration.
- **Skipping `DROP POLICY IF EXISTS` guards.** Phase-45 uses them everywhere. Re-runs against staging happen — guards keep them safe.
- **Adding `organization_id` to the junction.** CONTEXT D-13 keeps tenancy parent-derived. Adding it would mean a write trigger to keep the two in sync — extra surface area for no read-path win at current scale.
- **Renaming `intelligence_signal` entity-type strings in app code.** The literal string `'intelligence_signal'` (singular) appears in `backend/src/api/entity-search.ts`, `link.service.ts`, `entity-search.service.ts`, `frontend/src/types/preview-layout.types.ts`, `frontend/src/types/multilingual-content.types.ts`, `frontend/src/i18n/{en,ar}/*.json`, etc. **All of these refer to the EXISTING curated `intelligence_signals` (plural) table** via the entity-types vocabulary — they are semantic labels, not table names. Phase 54 must NOT touch them. The grep audit must whitelist these files. (See Pitfall #4 below.)
- **Using `CREATE TABLE` without `IF NOT EXISTS`.** Phase-45 pattern is idempotent — every new table in Phase 54 must follow suit so MCP re-runs are safe.
- **Putting `intelligence_signals` (plural, curated) anywhere in the rewrite path.** It is referenced by `timeline_view`, `entity-search.service.ts`, `link.service.ts`, `entity_preview_layouts`, `multilingual_content_system`, and i18n. The Phase-54 work must not touch it.

## Don't Hand-Roll

| Problem                             | Don't Build                                                             | Use Instead                                                                                                                                               | Why                                                                                                                                                                                                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tenant-scoped RLS SELECT            | `auth.uid() IN (SELECT user_id FROM organization_members WHERE ...)`    | `tenant_isolation.rls_select_policy(organization_id)`                                                                                                     | Helper already handles service-role bypass, admin override, multi-org membership. Helper is SECURITY DEFINER STABLE — query planner caches.                                                                                                          |
| Tenant-scoped RLS INSERT            | `auth.uid() IN (...)` with role check inline                            | `tenant_isolation.rls_insert_policy(organization_id) AND public.auth_has_any_role(ARRAY['admin','editor'])`                                               | Same — consistency with Phase-45 means future RLS audits (already a test in `tests/security/rls-audit.test.ts`) treat it as a known-good pattern.                                                                                                    |
| Role check                          | `EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')` | `public.auth_has_any_role(ARRAY[...])` or `public.auth_has_role(...)`                                                                                     | Already exists, already used by Phase-45, already covered by RLS audit.                                                                                                                                                                              |
| Polymorphic dossier-type constraint | A trigger that validates against `dossiers.type`                        | A static `CHECK (dossier_type IN ('country','organization','forum','engagement','topic','working_group','person'))` matching `dossiers_type_check` (D-06) | CHECK constraint is declarative, immutable across query plans, and faster than a per-row trigger. Drift risk is real but mitigated by Phase 54 also patching REQUIREMENTS so the canon stays at 7.                                                   |
| TS type generation                  | Hand-write `Database['public']['Tables']['intelligence_event']['Row']`  | `mcp__claude_ai_Supabase__generate_typescript_types`                                                                                                      | Hand-rolled types drift; the generator is the source of truth and matches the schema byte-for-byte.                                                                                                                                                  |
| Junction PK shape                   | Composite `(event_id, dossier_type, dossier_id)`                        | Surrogate UUID PK + UNIQUE index on the triple (CONTEXT discretion → recommendation)                                                                      | Matches `work_item_dossiers` precedent (L13: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`; L55-57: UNIQUE INDEX on the polymorphic triple WHERE not soft-deleted). Survives future requirements for per-link metadata, soft delete, audit fields. |

**Key insight:** every primitive Phase 54 needs is already in the codebase and exercised by the existing RLS audit. The only first-of-its-kind primitive is the real PG enum (`signal_source_type`), which is a standard Postgres feature — nothing to hand-roll.

## Runtime State Inventory

> Phase 54 includes one rename (`intelligence_digest` → `dashboard_digest`). Inventory covers the rename's blast radius. The new tables (`intelligence_event`, new `intelligence_digest`, junction) have no pre-existing runtime state — they are net-new.

| Category                                 | Items Found                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Action Required                                                                                                                                                                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stored data**                          | `intelligence_digest` rows seeded by Phase-45 (`b0000010-0000-0000-0000-00000000000{1..4}`). After rename, the rows live in `dashboard_digest` (same physical table, new name). No data migration needed — `ALTER TABLE ... RENAME TO` is a metadata change.                                                                                                                                                                                                                                                                                                                                                                                                                                                  | None for the data itself. Update **seed file** `supabase/seed/060-dashboard-demo.sql` so re-runs target the new name (L94 `DELETE FROM intelligence_digest` → `dashboard_digest`; L342 `INSERT INTO intelligence_digest` → `dashboard_digest`). |
| **Live service config**                  | None. There is no Supabase Realtime publication, no Edge Function, no external service referencing this table by name. (Verified — no `supabase/functions/` references; no `realtime.subscription` entries grep-able in migrations.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | None — verified by repo-wide grep for `intelligence_digest` returning only the migration, the seed, and the frontend hook + test.                                                                                                               |
| **OS-registered state**                  | None. No pm2 process, no Windows Task, no launchd plist references the table.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | None.                                                                                                                                                                                                                                           |
| **Secrets / env vars**                   | None. The Supabase staging connection string is project-scoped (`zkrcjzdemdmwhearhfgg`), not table-scoped.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | None.                                                                                                                                                                                                                                           |
| **Build artifacts / installed packages** | `backend/src/types/database.types.ts` and `frontend/src/types/database.types.ts` are build-time artifacts that capture the schema by table name. After the rename, both files have a stale `intelligence_digest:` block representing the OLD schema, plus (after plans 2-3) the NEW spec-shape `intelligence_digest:` block. **Regenerating in plan 4 replaces the OLD block with `dashboard_digest:` and inserts the NEW `intelligence_digest:` (new shape).** Any consumer code referencing the OLD `Database['public']['Tables']['intelligence_digest']['Row']` shape will start type-checking against the new shape — that's why plan 1 (rename) and the frontend hook rename must ship in the SAME plan. | Type regen in plan 4 captures both. Hook rename in plan 1 prevents `tsc` from failing in between plans 1 and 4.                                                                                                                                 |

**Canonical question:** _After every file in the repo is updated, what runtime systems still have the old string cached, stored, or registered?_ Answer for Phase 54: **none.** The rename is fully contained inside Postgres + 1 frontend hook + 1 test + 1 seed.

## Common Pitfalls

### Pitfall 1: Migration plans 2 and 3 run before plan 1 (name collision)

**What goes wrong:** Plan 2's `CREATE TABLE intelligence_digest (new shape)` fails with `relation "intelligence_digest" already exists` because Phase-45's table still owns the name.
**Why it happens:** Plan ordering bug, or planner runs plans in parallel waves.
**How to avoid:** Plan 1 (rename) MUST be in an earlier wave than plan 2 (create). Plan 2 in an earlier wave than plan 3 (junction FKs `event_id`). The planner should mark plan 2 `depends_on: [plan 1]` and plan 3 `depends_on: [plan 2]`. Plan 4 (types + docs) `depends_on: [plan 1, 2, 3]`.
**Warning signs:** `apply_migration` returns SQLSTATE `42P07` (duplicate_table). MCP tools will surface this immediately — no silent failure.

### Pitfall 2: Type regen captures a partial schema

**What goes wrong:** `database.types.ts` is regenerated after plan 2 but before plan 3 — junction table is missing. Or regen runs after plan 1 but before plan 2 — old `intelligence_digest` block disappears, new one not yet present. Type-check fails on Digest.tsx or other consumers.
**Why it happens:** Plan ordering bug, or attempt to regen mid-phase to "test as you go".
**How to avoid:** Regen happens **once, in plan 4, after plans 1-3 are all applied** to staging. The Phase-45 hook rename in plan 1 keeps consumer code green even while the OLD `intelligence_digest` block is still in the type file — because the rename swaps `'intelligence_digest'` (literal table name in `.from()`) to `'dashboard_digest'` (literal table name) in the source. After plan 1 lands but BEFORE type regen, the old `intelligence_digest` block in `database.types.ts` is dead code that no source references — `tsc` doesn't complain. After plan 4 type regen, the dead block is removed and the new `intelligence_digest` (new shape) + `dashboard_digest` + `intelligence_event` + `intelligence_event_dossiers` + `signal_source_type` enum all appear.
**Warning signs:** `pnpm type-check` failure mentioning `'intelligence_digest'` table type mismatch on a column that doesn't exist in the new shape.

### Pitfall 3: Frontend hook rename lands in a separate wave from the table rename

**What goes wrong:** Plan 1 (DB rename) lands; plan-2 hook-rename is scheduled later; in the gap, the production frontend (still calling `.from('intelligence_digest')`) returns "relation does not exist" because staging no longer has that name.
**Why it happens:** CONTEXT D-02 says the hook rename is part of Phase 54 scope; CONTEXT § Claude's Discretion (L77) flags the question of "same wave vs follow-up". Planner picks "follow-up".
**How to avoid:** Bundle the hook rename, test rename, `Digest.tsx` import update, and `Digest.test.tsx` readFileSync path update into **plan 1 alongside the rename migration**. Per CONTEXT recommendation L77: "same wave as the rename migration so type-check stays green."
**Warning signs:** Manual smoke of `/dashboard` after plan 1 lands but before the hook update shows the Digest widget firing the error path with `permission denied` or `relation does not exist`.

### Pitfall 4: Grep / rename sweep eats the entity-type label `'intelligence_signal'` (singular)

**What goes wrong:** A planner does a bulk find/replace `intelligence_signal` → `intelligence_event` across the repo. It catches the entity-type string in `backend/src/api/entity-search.ts:28`, `backend/src/services/entity-search.service.ts:283`, `backend/src/services/link.service.ts:455`, `frontend/src/types/preview-layout.types.ts:23`, `frontend/src/types/multilingual-content.types.ts:101`, plus `frontend/src/i18n/{en,ar}/*.json` and `frontend/src/components/entity-links/EntitySearchDialog.tsx:44`. These strings refer to the EXISTING curated `intelligence_signals` (plural) table via a semantic vocabulary — they are NOT the new `intelligence_event` table.
**Why it happens:** Naïve string substitution; CONTEXT D-04 says "rename" and the planner overinterprets the scope.
**How to avoid:** Phase 54 does **zero** renames of the literal string `intelligence_signal` outside of `.planning/REQUIREMENTS.md` and `.planning/ROADMAP.md`. Specifically, the planner must instruct task agents:

> The literal string `intelligence_signal` (singular) in `backend/src/` and `frontend/src/` refers to the entity-type vocabulary for the EXISTING curated `intelligence_signals` table. **Do not rename it.** Phase 54 introduces the new table as `intelligence_event` from day 1 — there is no migration of these strings.

The only valid targets for `intelligence_signal` text edits are the two `.planning/*.md` files (REQUIREMENTS L38, L40, L41; ROADMAP L137, L258, L263, L265, L266).
**Warning signs:** `git diff` after plan 1 shows changes in `backend/src/api/entity-search.ts`, `backend/src/services/*.ts`, `frontend/src/i18n/*.json`, or any file under `frontend/src/components/entity-links/`. **Stop. Revert.**

### Pitfall 5: `database.types.ts` files drift between backend and frontend

**What goes wrong:** Plan 4 regen writes the new types to frontend only; backend stays stale. `pnpm --filter backend type-check` passes (still references old shapes), but at runtime the backend gets `intelligence_event` rows from Supabase that don't match its TS types.
**Why it happens:** Manual copy is error-prone; no automated sync.
**How to avoid:** Plan 4's `<files>` block lists both `backend/src/types/database.types.ts` AND `frontend/src/types/database.types.ts` explicitly. The verify step compares both files via SHA256 (`sha256sum frontend/src/types/database.types.ts backend/src/types/database.types.ts` — the two hashes MUST match, since they're regenerated from the same project).
**Warning signs:** SHA hashes differ. Type-check passes on one workspace but fails on the other.

### Pitfall 6: Phase-45 RLS DELETE policy "role gate" interpretation

**What goes wrong:** CONTEXT D-12 says DELETE policy gets `rls_*_policy(organization_id) AND public.auth_has_any_role(ARRAY['admin'])`. But Phase-45's actual DELETE policy is `USING (tenant_isolation.rls_delete_policy(organization_id))` — without the `auth_has_any_role` clause, because `rls_delete_policy` already gates on admin role (verified at `20260113500001_tenant_isolation_layer.sql` L262-284). Adding the extra clause is harmless but inconsistent.
**Why it happens:** CONTEXT D-12 reads as four parallel policies; the helper's internal logic isn't surfaced.
**How to avoid:** Match the Phase-45 template byte-for-byte. The DELETE policy reads:

```sql
CREATE POLICY <table>_delete_admin
  ON public.<table> FOR DELETE
  TO authenticated
  USING (tenant_isolation.rls_delete_policy(organization_id));
```

That is — the helper-only form, no extra `auth_has_any_role`. CONTEXT D-12 should be read as "use the four-policy block; the helper enforces admin for DELETE" rather than literally requiring the extra AND clause.
**Warning signs:** RLS audit (`tests/security/rls-audit.test.ts`) doesn't catch this — it only checks RLS-is-enabled and there-is-at-least-one-policy. The "extra clause" is silent. Recommend planner add this as an explicit instruction to the implementation agent.

## Code Examples

### Full `intelligence_event` table migration (template for plan 2)

```sql
-- supabase/migrations/20260516000002_phase54_intelligence_event_and_digest.sql
-- Source patterns: 20260507210000_phase45_intelligence_digest_seed.sql L8-67

-- ============================================================================
-- 1. Enum for source_type (D-09, D-10)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'signal_source_type') THEN
    CREATE TYPE public.signal_source_type AS ENUM (
      'publication',
      'feed',
      'human_entered',
      'ai_generated'
    );
  END IF;
END$$;

-- ============================================================================
-- 2. intelligence_event table (INTEL-01, D-04, D-08, D-11)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.intelligence_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source_type public.signal_source_type NOT NULL,
  source_ref TEXT,                                          -- free-form per CONTEXT § specifics
  content TEXT NOT NULL,                                    -- no _en/_ar split per CONTEXT
  occurred_at TIMESTAMPTZ NOT NULL,                         -- analyst-provided
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  severity TEXT NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low', 'medium', 'high', 'urgent')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_event_org_occurred_at
  ON public.intelligence_event (organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_event_org_severity
  ON public.intelligence_event (organization_id, severity)
  WHERE severity IN ('high', 'urgent');
CREATE INDEX IF NOT EXISTS idx_intelligence_event_source_type
  ON public.intelligence_event (source_type);
CREATE INDEX IF NOT EXISTS idx_intelligence_event_created_by
  ON public.intelligence_event (created_by)
  WHERE created_by IS NOT NULL;

ALTER TABLE public.intelligence_event ENABLE ROW LEVEL SECURITY;

-- 4-policy block (verbatim Phase-45 template)
-- ... (SELECT/INSERT/UPDATE/DELETE per Pattern 1 above) ...

GRANT SELECT ON public.intelligence_event TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.intelligence_event TO authenticated;

COMMENT ON TABLE public.intelligence_event IS
  'Phase 54: v7.0 Intelligence Engine raw ingest layer. Renamed from spec ''intelligence_signal'' '
  'to avoid collision with existing curated intelligence_signals (plural) table. Tenant-scoped '
  'via organization_id; RLS mirrors Phase-45 intelligence_digest pattern.';

-- ============================================================================
-- 3. intelligence_digest table (NEW spec shape — INTEL-02)
--    Safe to use this name now because plan 1 renamed Phase-45's table to dashboard_digest.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.intelligence_digest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  dossier_type TEXT NOT NULL
    CHECK (dossier_type IN ('country','organization','forum','engagement','topic','working_group','person')),
  dossier_id UUID NOT NULL REFERENCES public.dossiers(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL CHECK (period_end > period_start),
  summary TEXT NOT NULL,
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_digest_org_dossier_period
  ON public.intelligence_digest (organization_id, dossier_id, period_end DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_digest_dossier_type
  ON public.intelligence_digest (dossier_type);

ALTER TABLE public.intelligence_digest ENABLE ROW LEVEL SECURITY;

-- 4-policy block (same template)
-- ... ...

GRANT SELECT ON public.intelligence_digest TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.intelligence_digest TO authenticated;
```

### Junction migration (plan 3)

```sql
-- supabase/migrations/20260516000003_phase54_intelligence_event_dossiers.sql

CREATE TABLE IF NOT EXISTS public.intelligence_event_dossiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.intelligence_event(id) ON DELETE CASCADE,
  dossier_type TEXT NOT NULL
    CHECK (dossier_type IN ('country','organization','forum','engagement','topic','working_group','person')),
  dossier_id UUID NOT NULL REFERENCES public.dossiers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_intelligence_event_dossiers_unique
  ON public.intelligence_event_dossiers (event_id, dossier_type, dossier_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_event_dossiers_dossier
  ON public.intelligence_event_dossiers (dossier_type, dossier_id);

ALTER TABLE public.intelligence_event_dossiers ENABLE ROW LEVEL SECURITY;

-- SELECT: tenancy via parent event
DROP POLICY IF EXISTS intelligence_event_dossiers_select ON public.intelligence_event_dossiers;
CREATE POLICY intelligence_event_dossiers_select
  ON public.intelligence_event_dossiers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_select_policy(ie.organization_id)
    )
  );

-- INSERT: tenancy + editor role via parent event
DROP POLICY IF EXISTS intelligence_event_dossiers_insert ON public.intelligence_event_dossiers;
CREATE POLICY intelligence_event_dossiers_insert
  ON public.intelligence_event_dossiers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_insert_policy(ie.organization_id)
        AND public.auth_has_any_role(ARRAY['admin','editor'])
    )
  );

-- UPDATE: same as INSERT but with rls_update_policy
DROP POLICY IF EXISTS intelligence_event_dossiers_update ON public.intelligence_event_dossiers;
CREATE POLICY intelligence_event_dossiers_update
  ON public.intelligence_event_dossiers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_update_policy(ie.organization_id)
        AND public.auth_has_any_role(ARRAY['admin','editor'])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_update_policy(ie.organization_id)
        AND public.auth_has_any_role(ARRAY['admin','editor'])
    )
  );

-- DELETE: admin only via helper
DROP POLICY IF EXISTS intelligence_event_dossiers_delete ON public.intelligence_event_dossiers;
CREATE POLICY intelligence_event_dossiers_delete
  ON public.intelligence_event_dossiers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_delete_policy(ie.organization_id)
    )
  );

GRANT SELECT ON public.intelligence_event_dossiers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.intelligence_event_dossiers TO authenticated;
```

### Frontend hook rename (plan 1)

```typescript
// frontend/src/hooks/useDashboardDigest.ts  (was useIntelligenceDigest.ts)
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface DashboardDigestRow {
  id: string
  headline_en: string
  headline_ar: string | null
  summary_en: string | null
  summary_ar: string | null
  source_publication: string
  occurred_at: string
  dossier_id: string | null
  created_at: string
}

const DASHBOARD_DIGEST_SELECT =
  'id, headline_en, headline_ar, summary_en, summary_ar, source_publication, occurred_at, dossier_id, created_at'

export function useDashboardDigest(
  limit: number = 6,
): ReturnType<typeof useQuery<DashboardDigestRow[], Error>> {
  return useQuery<DashboardDigestRow[], Error>({
    queryKey: ['dashboard', 'dashboard-digest', limit],
    queryFn: async (): Promise<DashboardDigestRow[]> => {
      const { data, error } = await supabase
        .from('dashboard_digest') // ← was 'intelligence_digest'
        .select(DASHBOARD_DIGEST_SELECT)
        .order('occurred_at', { ascending: false })
        .limit(limit)
      if (error !== null && error !== undefined) {
        throw new Error(`Failed to fetch dashboard digest: ${error.message}`)
      }
      return (data as DashboardDigestRow[]) ?? []
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  })
}
```

### Test rename touch-points (plan 1)

The test file `frontend/src/hooks/__tests__/useIntelligenceDigest.test.ts` renames to `useDashboardDigest.test.ts` and updates:

- L24 `import { useIntelligenceDigest } from '../useIntelligenceDigest'` → `useDashboardDigest from '../useDashboardDigest'`
- L49 `describe('useIntelligenceDigest', ...)` → `'useDashboardDigest'`
- L50 `'queries intelligence_digest with publication source fields...'` → `'queries dashboard_digest ...'`
- L75 `expect(fromMock).toHaveBeenCalledWith('intelligence_digest')` → `'dashboard_digest'`
- L69 `renderHook(() => useIntelligenceDigest(), ...)` → `useDashboardDigest()`
- L88 same as L69

And `frontend/src/pages/Dashboard/widgets/__tests__/Digest.test.tsx` updates:

- L22 `vi.mock('@/hooks/useIntelligenceDigest', ...)` → `'@/hooks/useDashboardDigest'`
- L32 `import { useIntelligenceDigest } from '@/hooks/useIntelligenceDigest'` → `useDashboardDigest from '@/hooks/useDashboardDigest'`
- L61 `Partial<ReturnType<typeof useIntelligenceDigest>>` → `useDashboardDigest`
- L72, L77, L90, L97, L105, L116, L144 `vi.mocked(useIntelligenceDigest)` → `useDashboardDigest` (7 sites)
- L158 `readFileSync('src/hooks/useIntelligenceDigest.ts', 'utf8')` → `'src/hooks/useDashboardDigest.ts'`

And `frontend/src/pages/Dashboard/widgets/Digest.tsx`:

- L25 `import { useIntelligenceDigest, type IntelligenceDigestRow } from '@/hooks/useIntelligenceDigest'` → `useDashboardDigest, type DashboardDigestRow from '@/hooks/useDashboardDigest'`
- L53 `useIntelligenceDigest()` → `useDashboardDigest()`

(Total touch-point count: 4 files, ~15 string changes. None outside this list.)

## State of the Art

| Old Approach                               | Current Approach               | When Changed                                                         | Impact                                                                        |
| ------------------------------------------ | ------------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Spec name `intelligence_signal` (singular) | `intelligence_event` (D-04)    | Phase 54 context                                                     | Avoids collision with existing `intelligence_signals` (plural curated table). |
| 8 dossier types (with `elected_official`)  | 7 dossier types (after merge)  | 2026-02-02 (`20260202000001_merge_elected_official_into_person.sql`) | Junction CHECK and REQUIREMENTS-INTEL-03 list 7 not 8.                        |
| `tenant_id` column name                    | `organization_id` column name  | Established by multi-tenancy work in 2026-01                         | RLS helpers' signatures lock this — spec wording is being corrected to match. |
| `TEXT + CHECK` for source typing           | Real `CREATE TYPE ... AS ENUM` | Phase 54 (first time in this codebase)                               | Smaller storage, faster comparisons, cleaner Supabase TS generation.          |

**Deprecated/outdated:**

- The Phase-45 `intelligence_digest` table name: post-Phase-54 it's `dashboard_digest`. Any new code referencing dashboard headline feed should use the new name.
- Pre-Phase-54 wording in REQUIREMENTS.md L38-42 and ROADMAP.md L137, L258, L263-266: stale after Phase 54 patches them.

## Validation Architecture

> Required per `workflow.nyquist_validation: true` (default). Phase 54 has no `nyquist_validation: false` opt-out in `.planning/config.json`.

### Test Framework

| Property           | Value                                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| Framework          | Vitest 1.x + `@supabase/supabase-js` 2.100.1 for RLS integration tests; `tsc --noEmit` for TS-types gate    |
| Config file        | `backend/vitest.integration.config.ts`, `frontend/vitest.config.ts`, `tsconfig.json` (root + per-workspace) |
| Quick run command  | `pnpm typecheck` (root, runs both workspaces in parallel via turbo)                                         |
| Full suite command | `pnpm typecheck && pnpm --filter backend test:integration && pnpm test`                                     |

### Phase Requirements → Test Map

| Req ID          | Behavior                                                                                                      | Test Type           | Automated Command                                                                                                                                                                                                                                                                            | File Exists?                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------- |
| INTEL-01        | `intelligence_event` table exists on staging with all columns                                                 | smoke (SQL via MCP) | `mcp__claude_ai_Supabase__list_tables(schemas=['public'])` → assert `intelligence_event` is present with expected columns                                                                                                                                                                    | N/A (MCP call)                                   |
| INTEL-01        | RLS enabled on `intelligence_event`                                                                           | smoke (SQL)         | `tests/security/rls-audit.test.ts` (existing) — auto-catches any new table missing RLS via `get_tables_without_rls()` RPC                                                                                                                                                                    | ✅ existing                                      |
| INTEL-01        | RLS policies enforce tenant isolation on `intelligence_event`                                                 | integration         | NEW: `tests/integration/intelligence-event-rls.test.ts` modeled on `tests/integration/polymorphic-document-rls.test.ts` — sign in as user from org A, INSERT event with org_id=A succeeds, SELECT only sees own org rows, attempt INSERT with org_id=B fails                                 | ❌ Wave 0                                        |
| INTEL-02        | `intelligence_digest` (new shape) exists with all columns                                                     | smoke (SQL via MCP) | `list_tables` + column assertion                                                                                                                                                                                                                                                             | N/A (MCP call)                                   |
| INTEL-02        | `period_end > period_start` CHECK rejects bad inserts                                                         | integration         | NEW: same test file, `expect insert with period_end < period_start to fail`                                                                                                                                                                                                                  | ❌ Wave 0                                        |
| INTEL-02        | RLS enforces tenant isolation on `intelligence_digest`                                                        | integration         | Same test file, mirror of INTEL-01 RLS test for `intelligence_digest`                                                                                                                                                                                                                        | ❌ Wave 0                                        |
| INTEL-03        | `intelligence_event_dossiers` enforces `dossier_type` CHECK over 7 values                                     | integration         | NEW: `tests/integration/intelligence-event-dossiers-rls.test.ts` — assert INSERT with `dossier_type='elected_official'` fails; INSERT with each of the 7 valid types succeeds (or returns FK error if dossier_id doesn't match — both prove the CHECK held)                                  | ❌ Wave 0                                        |
| INTEL-03        | Junction RLS derives tenancy from parent `intelligence_event` (no own `organization_id`)                      | integration         | Same junction test file: user from org A inserts event(org=A), inserts junction row → succeeds; user from org B SELECT on junction returns 0 rows for org A's links                                                                                                                          | ❌ Wave 0                                        |
| INTEL-03        | `ON DELETE CASCADE` deletes junction rows when parent event is deleted                                        | integration         | Same test file: insert event + junction row, DELETE event, expect junction row gone                                                                                                                                                                                                          | ❌ Wave 0                                        |
| INTEL-04        | `signal_source_type` enum exists with exactly 4 values                                                        | smoke (SQL)         | `SELECT enum_range(NULL::public.signal_source_type)` → array length 4, values match                                                                                                                                                                                                          | ❌ Wave 0 (1-line script ok)                     |
| INTEL-04        | `intelligence_event.source_type` is typed as enum, not TEXT                                                   | smoke (SQL)         | `\d intelligence_event` shows `source_type signal_source_type` — assertable via `information_schema.columns.udt_name` query                                                                                                                                                                  | ❌ Wave 0                                        |
| INTEL-05        | `pnpm --filter backend type-check` exits 0 after regen                                                        | unit / build gate   | `pnpm --filter backend type-check`                                                                                                                                                                                                                                                           | ✅ existing                                      |
| INTEL-05        | `pnpm --filter frontend type-check` exits 0 after regen                                                       | unit / build gate   | `pnpm --filter frontend type-check`                                                                                                                                                                                                                                                          | ✅ existing                                      |
| INTEL-05        | `database.types.ts` is byte-identical between backend and frontend                                            | smoke (filesystem)  | `cmp backend/src/types/database.types.ts frontend/src/types/database.types.ts` → exit 0                                                                                                                                                                                                      | ❌ Wave 0 (1-line)                               |
| INTEL-05        | Regenerated types include `intelligence_event`, new `intelligence_digest`, junction, and `signal_source_type` | smoke (grep)        | `grep -q "intelligence_event:" frontend/src/types/database.types.ts && grep -q "signal_source_type" frontend/src/types/database.types.ts && grep -q "intelligence_event_dossiers:" frontend/src/types/database.types.ts && grep -q "dashboard_digest:" frontend/src/types/database.types.ts` | N/A (1-line shell)                               |
| Rename lockstep | Frontend hook `useDashboardDigest` exists; `useIntelligenceDigest` does not                                   | smoke (filesystem)  | `test ! -f frontend/src/hooks/useIntelligenceDigest.ts && test -f frontend/src/hooks/useDashboardDigest.ts`                                                                                                                                                                                  | N/A (1-line shell)                               |
| Rename lockstep | Existing `Digest.test.tsx` readFileSync path passes (it asserts `useDashboardDigest.ts` exists post-rename)   | unit                | `pnpm --filter frontend test src/pages/Dashboard/widgets/__tests__/Digest.test.tsx`                                                                                                                                                                                                          | ✅ existing (post-rename)                        |
| Documentation   | REQUIREMENTS.md INTEL-01..05 use post-Phase-54 wording (`intelligence_event`, `organization_id`, 7 types)     | smoke (grep)        | `! grep -E "intelligence_signal                                                                                                                                                                                                                                                              | tenant_id                                        | elected_official" .planning/REQUIREMENTS.md | grep -v 'intelligence_signals'` → exit 0 | N/A (1-line)                                                                       |
| Documentation   | ROADMAP.md Phase 54 § says 7 types, not 8                                                                     | smoke (grep)        | `! grep "elected_official" .planning/ROADMAP.md                                                                                                                                                                                                                                              | grep "8 existing dossier types"` → exit 0        | N/A (1-line)                                |
| Tag provenance  | `phase-54-base` annotated + SSH-signed; `git tag -v phase-54-base` exits 0                                    | smoke (git)         | `git cat-file -t phase-54-base                                                                                                                                                                                                                                                               | grep -q "^tag$" && git tag -v phase-54-base 2>&1 | grep -qE 'Good \"git\" signature            | Good signature'`                         | ✅ existing tooling (CLAUDE.md tag-signing appendix; Phase-53 BUNDLE-06 precedent) |

### Sampling Rate

- **Per task commit:** `pnpm typecheck` (root) — catches type drift immediately.
- **Per wave merge:** `pnpm typecheck && pnpm --filter backend test:integration` (RLS integration suite includes the new files added in Wave 0).
- **Phase gate:** Full suite green BEFORE `/gsd:verify-work`:
  - `pnpm typecheck`
  - `pnpm --filter backend test:integration` (must include `intelligence-event-rls.test.ts` + `intelligence-event-dossiers-rls.test.ts`)
  - `tests/security/rls-audit.test.ts` (catches missing RLS on new tables)
  - `cmp backend/src/types/database.types.ts frontend/src/types/database.types.ts` (zero drift)
  - `git tag -v phase-54-base` (provenance gate)

### Wave 0 Gaps

These files must be **created before plan implementations land** so each migration can be validated immediately:

- [ ] `tests/integration/intelligence-event-rls.test.ts` — INTEL-01 + INTEL-02 RLS coverage (model on `tests/integration/polymorphic-document-rls.test.ts`)
- [ ] `tests/integration/intelligence-event-dossiers-rls.test.ts` — INTEL-03 polymorphic RLS + CHECK constraint + CASCADE coverage
- [ ] No new framework install needed — Vitest, @supabase/supabase-js, and the test scaffolding all exist (see `tests/integration/polymorphic-document-rls.test.ts` for the exact pattern).

The existing `tests/security/rls-audit.test.ts` (L78 lists `intelligence_signals` as a sensitive table) will **automatically catch** any new tenant-scoped table that ships without RLS or without policies. After Phase 54 lands, the planner should update `sensitiveTables` (L66-79) to add `intelligence_event`, `intelligence_digest` (new shape), and `dashboard_digest` (renamed) — small one-plan documentation patch, but **out of Phase 54 scope** unless explicitly included. Recommend adding it as the last action of plan 4.

## Security Domain

> Required per `security_enforcement` defaulting to enabled (no opt-out in `.planning/config.json`).

### Applicable ASVS Categories

| ASVS Category         | Applies      | Standard Control                                                                                                                                                                                       |
| --------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| V2 Authentication     | yes          | Existing Supabase Auth; no Phase-54 change                                                                                                                                                             |
| V3 Session Management | yes          | Existing Supabase JWT; no Phase-54 change                                                                                                                                                              |
| V4 Access Control     | yes (high)   | RLS via `tenant_isolation.rls_*_policy(organization_id)` + `public.auth_has_any_role(...)`. **All Phase-54 RLS** must use these helpers (D-12). Junction tenancy via EXISTS subquery on parent (D-13). |
| V5 Input Validation   | yes (medium) | Postgres CHECK constraints: `severity` enum (D-11), `dossier_type` enum (D-06), `period_end > period_start` (CONTEXT § specifics), `signal_source_type` real enum (D-09).                              |
| V6 Cryptography       | no           | No new crypto. Existing storage encryption at rest (Supabase managed) covers stored content.                                                                                                           |

### Known Threat Patterns for this Stack

| Pattern                                                                                             | STRIDE                     | Standard Mitigation                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cross-tenant read via crafted `organization_id` in client query                                     | Information Disclosure     | RLS USING `tenant_isolation.rls_select_policy(organization_id)` — helper returns false unless caller is member of that org or admin                                                                       |
| Cross-tenant write by spoofing `organization_id` on INSERT                                          | Tampering                  | RLS WITH CHECK `tenant_isolation.rls_insert_policy(organization_id)` — same helper; spoofed org_id rejected                                                                                               |
| Role escalation via INSERT/UPDATE by non-editor user                                                | Elevation of Privilege     | `public.auth_has_any_role(ARRAY['admin','editor'])` in WITH CHECK clauses                                                                                                                                 |
| Cross-tenant data leak via junction table (no own `organization_id`)                                | Information Disclosure     | EXISTS subquery on `intelligence_event` enforces tenancy via the parent (D-13). Cannot SELECT a junction row whose parent is in another org.                                                              |
| Invalid `dossier_type` enum value on junction (forward-compat bug if `dossiers_type_check` changes) | Tampering / data integrity | Static CHECK constraint on the 7 canonical values — if `dossiers_type_check` is ever extended in a future phase, the junction must be ALTERed in lockstep. Add this as a known-debt entry in the SUMMARY. |
| Orphan junction rows after event delete                                                             | Data Integrity             | `ON DELETE CASCADE` on both FKs (D-13).                                                                                                                                                                   |
| Stale enum after schema drift on regen                                                              | Tampering (TS-vs-DB drift) | `cmp` check between backend + frontend `database.types.ts`; grep assertions for known new symbols.                                                                                                        |
| Unverified migration applied to staging                                                             | Tampering (provenance)     | `phase-54-base` annotated + SSH-signed tag at phase open anchors the diff; `git tag -v` verifies.                                                                                                         |

## Environment Availability

| Dependency                                        | Required By                      | Available                                                                                   | Version | Fallback                                                            |
| ------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------- |
| Supabase MCP `apply_migration`                    | plans 1-3 (DB schema)            | ✓ (configured for this project)                                                             | —       | None — required per D-15. If MCP unavailable, plan blocks.          |
| Supabase MCP `generate_typescript_types`          | plan 4 (regen)                   | ✓                                                                                           | —       | None — required per D-14.                                           |
| Supabase MCP `list_tables`                        | sanity checks per plan           | ✓                                                                                           | —       | None                                                                |
| Supabase MCP `get_advisors`                       | post-migration RLS / index check | ✓                                                                                           | —       | None — but advisory only; not gating.                               |
| `pnpm` 10.29.1+                                   | TS gate                          | assumed ✓ (CLAUDE.md § Technology Stack)                                                    | —       | None                                                                |
| `tsc` (via tsconfig)                              | TS gate                          | assumed ✓                                                                                   | —       | None                                                                |
| `git` with SSH-signing config                     | `phase-54-base` tag              | ✓ (configured per Phase-53 BUNDLE-06; user-local `~/.gitconfig` + `~/.ssh/allowed_signers`) | —       | If SSH key not in ssh-agent, prompt for passphrase or run `ssh-add` |
| Vitest test runner                                | RLS integration tests (Wave 0)   | ✓ existing                                                                                  | 1.x     | None                                                                |
| `@supabase/supabase-js` test client               | RLS integration tests            | ✓ existing                                                                                  | 2.100.1 | None                                                                |
| `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` env vars | RLS integration test sign-in     | assumed ✓ (referenced in `polymorphic-document-rls.test.ts` L21-22)                         | —       | If unset, integration tests skip — flag for human                   |

**Missing dependencies with no fallback:** None. All required tooling is present.
**Missing dependencies with fallback:** None (the SSH-key passphrase + TEST_USER env-var cases are operational, not missing).

## Sources

### Primary (HIGH confidence)

- `.planning/phases/54-intelligence-engine-schema-groundwork/54-CONTEXT.md` (decisions D-01..D-15, all locked)
- `.planning/phases/54-intelligence-engine-schema-groundwork/54-DISCUSSION-LOG.md` (alternatives considered, all rejected)
- `supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql` (Phase-45 RLS template — verbatim reuse base)
- `supabase/migrations/20260113500001_tenant_isolation_layer.sql` (RLS helpers, L185-284)
- `supabase/migrations/20260202000001_merge_elected_official_into_person.sql` (canonical 7-value `dossiers_type_check`, L194-204)
- `supabase/migrations/20260116500001_create_work_item_dossiers.sql` (polymorphic junction precedent for surrogate UUID PK + UNIQUE on triple)
- `supabase/migrations/011_rls_policies.sql` (`auth_has_role`, `auth_has_any_role` definitions, L186-208)
- `supabase/seed/060-dashboard-demo.sql` (rename targets: L94, L104, L342-365)
- `frontend/src/hooks/useIntelligenceDigest.ts` + test + `frontend/src/pages/Dashboard/widgets/Digest.tsx` + test (frontend rename touch-points)
- `tests/security/rls-audit.test.ts` (RLS audit auto-catch for new tables)
- `tests/integration/polymorphic-document-rls.test.ts` (template for new RLS integration tests)
- `backend/package.json` (L11-17: test + type-check scripts), `frontend/package.json` (L13-20), `package.json` (L28: turbo typecheck)
- `.planning/REQUIREMENTS.md` (L38-42: INTEL-01..05 text patches), `.planning/ROADMAP.md` (L137, L256-268: Phase 54 success criteria)
- `.planning/phases/53-bundle-tightening-tag-provenance/53-03-PLAN.md` + `53-03-SUMMARY.md` (signed-tag flow, includes D-26 deferred force-push pattern)
- `CLAUDE.md` § Deployment Configuration, § Tag signing setup (staging project + signing config)

### Secondary (MEDIUM confidence)

- PostgreSQL doc behavior on `ALTER TABLE ... RENAME TO` (policies, indexes, FKs follow automatically) — standard behavior, verified by reading `pg_policy` / `pg_index` system catalog semantics in Postgres 15+/17 docs.
- Supabase MCP TypeScript-type generation output format — observed conventionally as `Database['public']['Tables']['<name>']['Row']` shapes plus `Database['public']['Enums']['<name>']` union types; matches existing `database.types.ts` L11939-37315 patterns.

### Tertiary (LOW confidence) — none applicable; every claim cross-references on-disk evidence.

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — every primitive in on-disk migrations (`tenant_isolation`, `auth_has_any_role`, Phase-45 RLS template).
- Architecture (3-migration split, surrogate UUID junction PK, EXISTS-based junction RLS): **HIGH** — matches `work_item_dossiers` precedent (surrogate PK) and is the natural shape for EXISTS-via-parent tenancy.
- Pitfalls (entity-type-string trap, type-regen-mid-phase trap, rename-lockstep trap): **HIGH** — derived from observable code patterns (the entity-type strings live across 14+ files and would cause real harm if swept).
- Validation matrix: **HIGH** — existing `polymorphic-document-rls.test.ts` is a direct, runnable template; existing `rls-audit.test.ts` auto-catches missing RLS on new tables.
- Signed-tag flow: **HIGH** — Phase 53 BUNDLE-06 just shipped this exact pattern; CLAUDE.md appendix captures the prereqs.

**Research date:** 2026-05-16
**Valid until:** 2026-06-16 (30 days; schema groundwork is stable, but if Phase 53 D-26 force-push status changes or new migrations land before Phase 54 executes, re-verify the migration timestamp order in Step 6 / Pattern 3).

---

## RESEARCH COMPLETE
