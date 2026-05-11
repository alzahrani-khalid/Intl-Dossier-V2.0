# Phase 45: Schema & Seed Closure - Research

**Date:** 2026-05-07
**Phase:** 45 - Schema & Seed Closure
**Status:** Complete

## Research Question

What does the executor need to know to plan Phase 45 well?

Phase 45 is a surgical schema, hook, RPC, seed, and verification phase. It
must close the v6.0 dashboard data debt without pulling in the v7 intelligence
engine, visual-baseline regeneration, or broad dashboard redesign.

## Sources Read

- `.planning/ROADMAP.md` - Phase 45 goal, dependency, success criteria, and
  DATA-01..DATA-04 mapping.
- `.planning/REQUIREMENTS.md` - DATA requirement definitions.
- `.planning/STATE.md` - Phase 38 Digest/VipVisits compromise notes and Phase
  41 seed-dependent drawer gap history.
- `.planning/phases/45-schema-seed-closure/45-CONTEXT.md` - locked decisions
  D-01..D-16 and canonical references.
- `.planning/milestones/v6.0-MILESTONE-AUDIT.md` - source of
  DIGEST-SOURCE-COMPROMISE, VIP-PERSON-ISO-JOIN, and BLOCKED-BY-SEED debt.
- `CLAUDE.md` - Supabase MCP staging deployment rule.
- `supabase/migrations/20260330000001_operations_hub_rpcs.sql` - current
  `get_upcoming_events` RPC shape.
- `supabase/migrations/20260110000006_create_engagement_dossiers.sql` -
  engagement/participant schema and allowed values.
- `supabase/migrations/20260110000003_persons_entity_management.sql` and
  `supabase/migrations/20260202000001_merge_elected_official_into_person.sql`
  - person nationality/country fields.
- `supabase/migrations/20260113500001_tenant_isolation_layer.sql` - reusable
  org-scoped RLS helper functions.
- `supabase/seed/060-dashboard-demo.sql` - canonical dashboard seed.
- `frontend/src/pages/Dashboard/widgets/Digest.tsx` and
  `frontend/src/pages/Dashboard/widgets/__tests__/Digest.test.tsx` - current
  activity-feed compromise.
- `frontend/src/hooks/useVipVisits.ts`,
  `frontend/src/pages/Dashboard/widgets/VipVisits.tsx`,
  `frontend/src/hooks/__tests__/useVipVisits.test.ts`, and
  `frontend/src/pages/Dashboard/widgets/__tests__/VipVisits.test.tsx` -
  current VIP mapping and test coverage.
- `frontend/src/domains/operations-hub/repositories/operations-hub.repository.ts`,
  `frontend/src/domains/operations-hub/hooks/useUpcomingEvents.ts`, and
  `frontend/src/domains/operations-hub/types/operations-hub.types.ts` -
  frontend RPC wrapper chain.
- `frontend/src/components/signature-visuals/DossierGlyph.tsx` - flag
  rendering contract.
- `frontend/tests/e2e/support/dossier-drawer-fixture.ts` and the
  `dossier-drawer-*` Playwright specs - seed-dependent Phase 41 coverage.

## Key Findings

### Digest Data Path

`Digest.tsx` still imports `useActivityFeed` and maps:

```text
source <- actor_name
headline <- description_en / description_ar
tag <- entity_type
timestamp <- created_at
```

That is the exact Phase 38 compromise DATA-02 must close. There is no existing
`intelligence_digest` table, no `useIntelligenceDigest` hook, and no generated
database type for that table in `frontend/src/types/database.types.ts`.

The least disruptive plan is:

1. Add the Supabase table and RLS in a new migration.
2. Add a typed frontend hook that reads `intelligence_digest` directly through
   the shared Supabase client and returns display-ready rows.
3. Swap `Digest.tsx` to the hook and preserve the existing widget structure,
   refresh spinner, empty/error states, i18n language fallback, and logical
   Tailwind classes.
4. Update the unit test to mock `useIntelligenceDigest` and add a negative
   source-path assertion for `actor_name` / `useActivityFeed`.

### intelligence_digest Schema Boundary

DATA-01 names display columns only:

```text
id, headline_en, headline_ar, summary_en, summary_ar, source_publication,
occurred_at, dossier_id nullable FK, created_at
```

The locked context allows `organization_id` for RLS because nullable
`dossier_id` cannot prove org access. The repo already has
`tenant_isolation.rls_select_policy`, `rls_insert_policy`,
`rls_update_policy`, and `rls_delete_policy`, which are a better match for an
org-scoped table than copying the old clearance-only dossier RLS.

Recommended migration contents:

- `CREATE TABLE IF NOT EXISTS public.intelligence_digest`
- Required display columns from DATA-01.
- `organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE`
- `dossier_id UUID REFERENCES public.dossiers(id) ON DELETE SET NULL`
- `created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL`
- indexes on `(organization_id, occurred_at DESC)`, `dossier_id`, and
  `source_publication`
- RLS enabled with select/insert/update/delete policies using
  `tenant_isolation.*` helpers.
- Grants for `authenticated` on table access as needed by the frontend read
  hook.

Do not add `intelligence_signal`, subscriptions, alerting, scheduled
briefings, external feed ingestion, or cross-dossier aggregation.

### VIP ISO Enrichment

`get_upcoming_events` currently returns engagement events and calendar entries
with this shared shape:

```text
id, title, title_ar, start_date, end_date, event_type, engagement_id,
engagement_name, engagement_name_ar, lifecycle_stage
```

`useVipVisits` filters `event_type === 'vip_visit'`, but current seed and
schema comments say `vip_visit` is not allowed by existing check constraints.
The safer closure path is not to add a new enum/check value. Extend
`get_upcoming_events` with nullable person fields and let `useVipVisits`
recognize VIP rows when person metadata is present.

Recommended nullable additions:

```text
person_id, person_name, person_name_ar, person_role, person_iso
```

The ISO join should use current repo schema, not the stale
`country_iso_codes` name from requirements:

```text
persons.nationality_country_id -> countries.iso_code_2
fallback persons.country_id -> countries.iso_code_2
```

`DossierGlyph` renders flags only for `type="country"` with a known `iso`.
`VipVisits.tsx` currently passes `type="person"`, so DATA-03 requires changing
the glyph call to `type="country" iso={visit.personFlag}` while retaining a
fallback name for unknown/missing ISO.

### Seed Application

The canonical seed file is `supabase/seed/060-dashboard-demo.sql`; active
ROADMAP/REQUIREMENTS references to `frontend/seeds/060-dashboard-demo.sql` are
stale.

The seed is deterministic and idempotent around `b00000xx-*` UUIDs, but it
currently deletes/reinserts dashboard fixtures without inserting
`intelligence_digest` or VIP person participant data. Phase 45 should update
the seed source and, if the staging apply needs a committed artifact, add a
new migration that carries the idempotent Phase 45 fixture deltas with a
header pointing back to `supabase/seed/060-dashboard-demo.sql`.

The execution plan must include a blocking Supabase MCP apply step for staging
project `zkrcjzdemdmwhearhfgg` per `CLAUDE.md`. Direct one-off `psql` is out
of bounds.

### Phase 41 Playwright Specs

The four seed-dependent Phase 41 specs are represented by the drawer fixture
flow around `frontend/tests/e2e/support/dossier-drawer-fixture.ts`. The
fixture expects:

```text
b0000001-0000-0000-0000-000000000004
```

as a seeded China country dossier with commitments/upcoming/activity sections.
The most relevant specs to run after staging seed application are:

```text
frontend/tests/e2e/dossier-drawer-trigger-recent.spec.ts
frontend/tests/e2e/dossier-drawer-commitment-click.spec.ts
frontend/tests/e2e/dossier-drawer-rtl.spec.ts
frontend/tests/e2e/dossier-drawer-mobile.spec.ts
```

Keep visual snapshot regeneration out of this phase. Phase 46 owns visual
baseline updates.

## Validation Architecture

Validation should sample four independent feedback channels:

1. Schema and staging channel:
   - `supabase/migrations/` contains a new Phase 45 migration with
     `CREATE TABLE IF NOT EXISTS public.intelligence_digest`.
   - The migration contains `ALTER TABLE public.intelligence_digest ENABLE ROW LEVEL SECURITY`.
   - The migration contains all DATA-01 display columns and `organization_id`.
   - Supabase MCP apply against staging project `zkrcjzdemdmwhearhfgg` returns
     success.

2. Digest frontend channel:
   - `frontend/src/hooks/useIntelligenceDigest.ts` exists and reads from
     `intelligence_digest`.
   - `Digest.tsx` imports `useIntelligenceDigest` and has no `useActivityFeed`
     import.
   - `Digest.tsx` and the hook path contain zero `actor_name` references.
   - `pnpm -C frontend exec vitest run src/pages/Dashboard/widgets/__tests__/Digest.test.tsx`
     exits 0.

3. VIP ISO channel:
   - `get_upcoming_events` return shape includes nullable `person_iso`.
   - `TimelineEvent` includes optional nullable person fields.
   - `useVipVisits` maps `person_iso` to `personFlag`.
   - `VipVisits.tsx` passes `type="country"` and `iso={visit.personFlag}` to
     `DossierGlyph`.
   - `pnpm -C frontend exec vitest run src/hooks/__tests__/useVipVisits.test.ts src/pages/Dashboard/widgets/__tests__/VipVisits.test.tsx`
     exits 0.

4. Seed/E2E channel:
   - `supabase/seed/060-dashboard-demo.sql` contains intelligence digest rows
     and the minimum VIP person/participant fixture.
   - The committed staging apply artifact references the canonical seed file.
   - `doppler run -- pnpm --filter frontend exec playwright test frontend/tests/e2e/dossier-drawer-trigger-recent.spec.ts frontend/tests/e2e/dossier-drawer-commitment-click.spec.ts frontend/tests/e2e/dossier-drawer-rtl.spec.ts frontend/tests/e2e/dossier-drawer-mobile.spec.ts`
     exits 0 on a developer machine after MCP apply.

## UI-SPEC Gate Assessment

Phase 45 includes frontend/dashboard widget changes and the UI safety gate is
enabled. No `45-UI-SPEC.md` exists at the time of this research. The
plan-phase workflow must stop before writing PLAN.md files unless the user
runs:

```text
$gsd-ui-phase 45
```

or explicitly replans with:

```text
$gsd-plan-phase 45 --skip-ui
```

This is a workflow gate, not a technical blocker. The intended UI work is
behavioral data wiring into existing widget layouts, not a new visual design.

## Security Considerations

Phase 45 adds a new tenant-scoped table and changes a SECURITY DEFINER RPC, so
each PLAN.md must include a threat model. Primary threats:

- Cross-org digest leakage if nullable `dossier_id` is used as the only access
  control.
- Over-broad write policies that let ordinary authenticated users insert or
  mutate dashboard feed rows.
- RPC regression where existing timeline consumers break because new person
  fields are non-null or existing return columns change order/type.
- False-positive verification if migrations are committed but not applied to
  staging.
- Seed data drift if `060-dashboard-demo.sql` and the committed staging apply
  artifact diverge.

Plans should include exact schema checks, RLS policy checks, frontend grep
checks, and Supabase MCP apply evidence.

## Recommended Plan Shape

After the UI-SPEC gate is satisfied or explicitly skipped, use four plans:

1. Schema and seed foundation: create `intelligence_digest`, RLS, seed deltas,
   and staging MCP apply artifact.
2. Digest widget closure: add `useIntelligenceDigest`, rewire `Digest.tsx`,
   and update unit/source-path tests.
3. VIP ISO closure: extend `get_upcoming_events`, frontend timeline types,
   `useVipVisits`, and `VipVisits.tsx` glyph wiring.
4. Seed-dependent E2E verification: apply the canonical seed to staging through
   Supabase MCP and run the four drawer specs plus targeted dashboard widget
   checks.

The schema/seed plan must be wave 1. Digest and VIP frontend plans can follow
after schema migration details exist. E2E verification must be final.

## Open Risks for Execution

- The generated Supabase TypeScript types are stale relative to new migrations.
  If the project does not regenerate them during execution, hook types may need
  a local row interface to avoid blocking on generated type churn.
- `get_upcoming_events` is shared by operations-hub timeline consumers. New
  fields must be nullable and additive.
- Staging MCP apply is an operator/environment dependency. If MCP credentials
  are unavailable, execution must stop at a manual checkpoint rather than
  claiming DATA-01/DATA-04 complete.
- Existing `git status` contains unrelated deleted historical planning files.
  Executors must not restore or commit those deletions as part of Phase 45.

## RESEARCH COMPLETE
