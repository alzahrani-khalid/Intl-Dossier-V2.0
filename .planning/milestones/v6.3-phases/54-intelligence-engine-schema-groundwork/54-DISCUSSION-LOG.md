# Phase 54: Intelligence Engine Schema Groundwork - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-16
**Phase:** 54-intelligence-engine-schema-groundwork
**Areas discussed:** intelligence_digest collision, intelligence_signal naming, Dossier type enum (7 vs 8), Tenant column convention, Severity vocabulary

---

## intelligence_digest collision

Phase-45 migration `20260507210000_phase45_intelligence_digest_seed.sql` had already created an `intelligence_digest` table with a dashboard-feed schema (`organization_id, headline_en/ar, summary_en/ar, source_publication, occurred_at, dossier_id, created_by`). The v7.0 Phase-54 spec wants a different shape on the same name (`dossier_type, period_start/end, summary, tenant_id, generated_*`).

| Option                                     | Description                                                                                                                             | Selected |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Rename Phase-45 → `dashboard_digest`       | Free the canonical name for the v7.0 spec table; update the single frontend caller (`useIntelligenceDigest.ts` + test) in the same wave | ✓        |
| Rename spec → `intelligence_period_digest` | Zero Phase-45 impact, less clean v7.0 name; REQUIREMENTS rename needed                                                                  |          |
| ALTER existing to converge                 | Add new cols to existing table, keep old cols nullable; mixed-purpose schema                                                            |          |
| Drop + recreate per spec                   | Cleanest schema, destroys Phase-45 dashboard data; risky                                                                                |          |

**User's choice:** "you decide" — Claude recommended Rename (Option 1) after verifying Phase-45 blast radius was small (1 hook + 1 test + 1 seed + 1 migration).
**Notes:** The Phase-45 table is semantically a _dashboard headline feed_, not a generic intelligence digest. The new name reflects actual purpose.

---

## intelligence_signal naming

Existing `intelligence_signals` (PLURAL) already exists as a load-bearing table with rich analyst-curated schema (`signal_type, content_en/ar, title_en/ar, source_reliability, validated_*, logged_*`) and is referenced from `entity-search.service.ts`, `link.service.ts`, `timeline_view`, `entity_preview_layouts`, `multilingual_content_system`, and i18n entries. The Phase-54 spec wanted a singular `intelligence_signal` with a different ingest-oriented schema.

| Option                                                | Description                                                                                                    | Selected |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------- |
| Rename v7.0 table → `intelligence_event`              | Zero collision; semantically clearer (ingest event vs curated signal); REQUIREMENTS INTEL-01..05 rename needed | ✓        |
| Keep singular vs plural side-by-side                  | Follows REQUIREMENTS verbatim; high confusion in queries/types/dev workflow                                    |          |
| Extend existing `intelligence_signals` to absorb spec | Single signal table, mixed-purpose schema; large ALTER                                                         |          |
| Rename existing → `curated_signals`                   | Cleanest naming long-term; largest blast radius across services/views/i18n                                     |          |

**User's choice:** Rename v7.0 table → `intelligence_event`
**Notes:** Junction follows the rename → `intelligence_event_dossiers`. Enum keeps the spec name `signal_source_type` (D-10).

---

## Dossier type enum (7 vs 8)

REQUIREMENTS.md INTEL-03 and ROADMAP success-criterion #3 say 8 dossier types including `elected_official`, but migration `20260202000001_merge_elected_official_into_person.sql` already merged `elected_official` INTO `person`, leaving the live `dossiers_type_check` with **7** values.

| Option                                    | Description                                                             | Selected |
| ----------------------------------------- | ----------------------------------------------------------------------- | -------- |
| Use current 7 + update REQUIREMENTS.md    | Junction CHECK matches `dossiers_type_check`; fix REQUIREMENTS in-phase | ✓        |
| Use 8 (include elected_official)          | Dead enum value; FK rows never have that type                           |          |
| Dynamic CHECK referencing `dossiers.type` | Auto-sync at cost of query overhead and non-declarative schema          |          |

**User's choice:** Use current 7 + update REQUIREMENTS.md
**Notes:** Phase 54 will patch both REQUIREMENTS.md INTEL-03 and ROADMAP.md success-criterion #3 to say 7 types.

---

## Tenant column convention

Existing multi-tenant tables (incl. Phase-45 `intelligence_digest`) use `organization_id` + `tenant_isolation.rls_*_policy(organization_id)`. Phase-54 spec text says `tenant_id`.

| Option                            | Description                                                                               | Selected |
| --------------------------------- | ----------------------------------------------------------------------------------------- | -------- |
| Use `organization_id`             | Match existing convention; reuse RLS helpers; treat `tenant_id` in spec as semantic alias | ✓        |
| Use `tenant_id` + new RLS helpers | Two competing conventions; bigger blast radius                                            |          |
| Use both (column + view alias)    | Confusing layering                                                                        |          |

**User's choice:** Use `organization_id` (match existing convention)
**Notes:** REQUIREMENTS will be updated to say "tenant-scoped via organization_id" so spec wording matches the on-disk reality.

---

## Severity vocabulary

REQUIREMENTS lists `severity` on the new event table but does not enumerate values.

| Option                                        | Description                                   | Selected |
| --------------------------------------------- | --------------------------------------------- | -------- |
| Reuse priority enum: `low/medium/high/urgent` | Matches CLAUDE.md work-item terminology       | ✓        |
| Reuse `confidence_level` (`low/medium/high`)  | Same domain but no `urgent` tier              |          |
| Numeric 1–5 scale                             | More granular; maps poorly to UI badges       |          |
| Defer — TEXT with no CHECK                    | Lets schema phase ship, risks dirty seed data |          |

**User's choice:** Reuse priority enum: `low/medium/high/urgent`
**Notes:** Implemented as `TEXT NOT NULL CHECK (severity IN ('low','medium','high','urgent'))` with default `medium`.

---

## Claude's Discretion

- Exact migration file timestamps and per-concern split (single migration vs separate per table).
- Specific index list beyond a recommended starting set (`(organization_id, occurred_at DESC)`, `(organization_id, severity)`, `(source_type)`, junction `(dossier_type, dossier_id)`).
- Junction PK shape — composite `(event_id, dossier_type, dossier_id)` vs surrogate UUID + unique constraint.
- Whether Phase-45 hook rename ships in same plan as the rename migration or a follow-up plan (recommended: same plan).

## Deferred Ideas

- v7.0 ingest jobs (RSS, public API, manual paste) — explicit future requirement.
- API endpoints + UI for signal triage / digest pipeline / alerting — v7.0.
- Multi-dossier AI correlation + analytic graph queries — v7.0+.
- Bilingual columns on the new tables (`content_en/ar`, `summary_en/ar`) — deferred to consumer-surface phase.
- Unification of existing `intelligence_signals` (curated) with new `intelligence_event` (ingest) — separate later phase if pursued.
- Denormalized `organization_id` on the junction for RLS perf — revisit only if RLS hot-spotting.
