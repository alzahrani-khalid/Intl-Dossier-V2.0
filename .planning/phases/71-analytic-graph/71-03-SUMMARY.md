---
phase: 71-analytic-graph
plan: 03
subsystem: intelligence-graph
tags: [supabase, migration, edge-function, integration-tests, staging, clearance, query_graph]

# Dependency graph
requires:
  - plan: 71-02
    provides: query_graph migration SQL + analytic-graph edge fn (authored as files; this plan applies + deploys them)
  - plan: 71-01
    provides: GRAPH-01/03/04 RED integration tests + RF-7 seed fixture (turned GREEN here)
provides:
  - query_graph RPC LIVE on staging zkrcjzdemdmwhearhfgg (SECURITY INVOKER, anon-REVOKEd / authenticated-GRANTed)
  - analytic-graph edge function DEPLOYED to staging (v1, verify_jwt=true)
  - GRAPH-01/03/04 verifiable — the false-positive gap (build/types pass without the live migration) is closed
affects:
  [
    71-04 FE Analyze surfaces (useAnalyticGraph targets the now-live /functions/v1/analytic-graph),
    71-05 Cmd+K + live UAT (runs against the live RPC + edge fn),
    72 Mastra query_graph tool (wraps the live RPC under the caller JWT),
  ]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Orchestrator-applied migration via Supabase MCP apply_migration (executor lacks Supabase MCP — operator/orchestrator checkpoint, 64-01/67-06/69 precedent)'
    - 'Edge fn deployed via Supabase MCP deploy_edge_function with verify_jwt=true, matching the graph-traversal sibling (defense-in-depth: gateway JWT + in-fn getUser(token))'
    - 'Backend integration suites run serially (one vitest invocation per file) so the fixed-name RF-7 fixture never seeds in parallel workers'

# Key files
key-files:
  created:
    - .planning/phases/71-analytic-graph/71-03-SUMMARY.md
  modified:
    - supabase/migrations/20260617_phase71_query_graph.sql
---

# 71-03 — Apply query_graph migration + deploy analytic-graph edge fn + tests GREEN on staging

Checkpoint plan executed inline by the orchestrator (all three tasks require Supabase MCP / live-staging tooling the gsd-executor does not hold).

## What was done

### Task 1 — query_graph migration APPLIED to staging

- Applied `supabase/migrations/20260617_phase71_query_graph.sql` to project `zkrcjzdemdmwhearhfgg` via Supabase MCP `apply_migration` (migration `phase71_query_graph`).
- Pre-flight verified: `query_graph` absent before apply; `profiles.user_id`, `profiles.clearance_level`, `dossiers.sensitivity_level`, and all four participation tables (`dossier_relationships`, `working_group_members`, `engagement_participants`, `engagement_dossiers`) present.
- Post-apply verified live:
  - `pg_proc`: `query_graph(text,uuid,uuid,integer)` exists, `prosecdef = false` (SECURITY INVOKER).
  - Least-privilege: `anon` EXECUTE = **false**, `authenticated` EXECUTE = **true**.
  - Smoke invoke `query_graph('forum_membership', <real dossier>)` → shaped `{nodes, edges, stats}` JSONB, no error.

### Task 2 — analytic-graph edge function DEPLOYED to staging

- Deployed via Supabase MCP `deploy_edge_function` → **version 1, ACTIVE, verify_jwt=true** (id `adeef2cb-6d47-4bf4-a174-6d356cdf44e1`). `verify_jwt=true` matches the deployed `graph-traversal` sibling; the function also performs its own `getUser(token)` (defense-in-depth). Reuses existing `SUPABASE_URL` / `SUPABASE_ANON_KEY` — no new secrets.
- Verified live (sign-in via anon key + staging test creds):
  - Unauthenticated → **401**.
  - Authenticated (Bearer user JWT) → **200** with body keys `[edges, entity_id, nodes, query_type, stats]`.
  - Invalid `queryType` → **400** (whitelist enforced).

### Task 3 — backend integration tests GREEN against live staging

- Provisioned `backend/.env.test` (gitignored) from the root `.env.test` keys — `backend/tests/setup.ts` loads `backend/.env.test`, which did not exist (flagged by 71-01).
- Ran the three suites **serially** (`pnpm exec vitest run tests/intelligence/<file> --config ./vitest.config.ts`):
  - `query-graph.integration.test.ts` (GRAPH-01) — **4 passed**.
  - `query-graph.clearance.integration.test.ts` (GRAPH-03) — **2 passed** (strictly-increasing counts clearance-1 < clearance-4; indistinguishable-empty).
  - `query-graph.invoker.integration.test.ts` (GRAPH-04) — **2 passed** (zero above-clearance nodes under clearance-1; the sensitivity-3 forum appears under clearance-3).
- Post-run DB verification: `dossiers WHERE name_en LIKE 'TEST %'` = **0** (fixture restored), test-edge residue = **0**, admin `clearance_level` restored to **3** (original).

## Deviations (Rule 3 — blocking issue, resolved per plan directive)

**Removed `clearance_level` from `query_graph`'s `stats` JSONB.** The first live run of GRAPH-03's "indistinguishable-empty" assertion failed:
`expect(JSON.stringify(data)).not.toMatch(/clearance|filtered|restricted/i)` — the response carried `stats.clearance_level`, whose key contains the substring `clearance`. The 71-03 plan pre-declares test failure here = migration SQL defect ("fix the SQL there, re-apply, re-run"), and the indistinguishable-empty copy contract (D-09) is LOCKED. Removed `clearance_level` from all five `stats` builders (the 4 query branches + the empty fallback) in `supabase/migrations/20260617_phase71_query_graph.sql`. Re-applied as follow-on migration `phase71_query_graph_fix_indistinguishable_empty` (idempotent `CREATE OR REPLACE` + re-asserted REVOKE/GRANT). Verified across all 3 backend test files that none assert on `stats.clearance_level` (GRAPH-04 asserts on node `sensitivity_level`); clearance ENFORCEMENT is unchanged — `v_clearance` still filters every `dossiers` join, and the strictly-increasing GRAPH-03 counts still prove the gate works.

**Test-isolation note (not a code defect):** the first run used `pnpm test -- <file>` which did NOT filter to one file (ran all 25 backend suites). The 3 query-graph suites then seeded the same fixed-name RF-7 fixture in parallel workers → `duplicate key on idx_dossiers_unique_name_type`. The `(name,type)` unique constraint made each collision fail on the first insert (the anchor), so the losing worker leaked nothing and the winner's `afterAll` restored. Resolved by running each file in its own `vitest run <path>` invocation, serially. No residue resulted (verified 0).

## Verification evidence

- migration applied: `phase71_query_graph` + fix `phase71_query_graph_fix_indistinguishable_empty` (both via Supabase MCP).
- `query_graph`: `prosecdef=false`; anon EXECUTE=false / authenticated EXECUTE=true; smoke returns `{nodes,edges,stats}`; payload no longer matches `/clearance|filtered|restricted/i`.
- `analytic-graph` edge fn: v1 ACTIVE, 401 unauth / 200 authed + `{nodes,edges,stats}` / 400 bad queryType.
- backend tests: GRAPH-01 (4), GRAPH-03 (2), GRAPH-04 (2) all GREEN; fixture restored (0 TEST rows); admin clearance restored (3).

## Self-Check: PASSED

- [x] query_graph live on staging, INVOKER, least-privilege (anon denied / authenticated granted)
- [x] analytic-graph edge fn deployed and reachable under a caller JWT (401 / 200 / 400)
- [x] GRAPH-01/03/04 integration tests GREEN against live staging
- [x] RF-7 fixture restored — no `TEST ` rows remain; admin clearance restored
- [x] migration version + edge-fn version recorded above
