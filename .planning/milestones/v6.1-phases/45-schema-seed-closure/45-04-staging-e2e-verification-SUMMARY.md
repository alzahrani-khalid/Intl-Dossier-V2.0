---
phase: 45-schema-seed-closure
plan: 04
plan_name: staging-e2e-verification
subsystem: staging-verification
tags:
  - supabase
  - staging
  - playwright
  - verification
requirements:
  - DATA-01
  - DATA-02
  - DATA-03
  - DATA-04
dependency_graph:
  requires:
    - 45-01-schema-seed-foundation
    - 45-02-digest-widget-closure
    - 45-03-vip-iso-closure
  provides:
    - staging Supabase apply evidence
    - focused dashboard and drawer verification evidence
  affects:
    - Phase 45 final verdict
tech_stack:
  added: []
  patterns:
    - Supabase MCP migration apply
    - deterministic staging seed verification
    - focused Vitest and Playwright gates
key_files:
  created:
    - .planning/phases/45-schema-seed-closure/45-STAGING-VERIFY.md
  modified:
    - supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql
    - supabase/seed/060-dashboard-demo.sql
    - frontend/src/lib/query-columns.ts
    - frontend/src/services/dossier-overview.service.ts
    - frontend/src/components/dossier/DossierDrawer/OpenCommitmentsSection.tsx
    - frontend/src/components/dossier/DossierDrawer/__tests__/OpenCommitmentsSection.test.tsx
    - frontend/tests/e2e/support/dossier-drawer-fixture.ts
    - frontend/tests/e2e/dossier-drawer-trigger-recent.spec.ts
    - frontend/tests/e2e/dossier-drawer-commitment-click.spec.ts
decisions:
  - Treat the plan's `--filter frontend` command as a no-op because no package matched it; use `--filter intake-frontend` for the real browser gate.
  - Keep staging bootstrap changes in source-controlled migration and seed files before applying through Supabase MCP.
  - Assert dossier drawer closure by URL/search state and dossier drawer selectors, not by a broad dialog count, because `/commitments?id=` legitimately opens the commitments detail drawer.
metrics:
  completed_at: 2026-05-08
  source_gates: 6
  unit_test_files: 5
  unit_tests: 40
  playwright_tests: 5
---

# Phase 45 Plan 04: Staging And E2E Verification Summary

Phase 45 staging verification is complete. The Phase 45 migrations were applied to Supabase staging through MCP, the deterministic fixture rows were verified with MCP SQL, and the focused Digest, VIP visits, and dossier drawer gates pass.

## Completed Tasks

| Task                           | Result                                                                                                                                                                                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 45-04-01 Source and unit gates | Passed all six source gates. Digest gate passed 2 files/9 tests, VIP gate passed 2 files/19 tests, and the added commitment drawer regression passed 1 file/12 tests.                                                                                               |
| 45-04-02 Supabase MCP apply    | Applied `20260507210000_phase45_intelligence_digest_seed` and `20260507211000_phase45_vip_iso_events` to project `zkrcjzdemdmwhearhfgg` through `mcp__supabase__.apply_migration`; MCP SQL verified `digest_exists`, `digest_seeded`, and `vip_participant_seeded`. |
| 45-04-03 Playwright seed specs | Corrected the package filter to `intake-frontend` and passed the four seed-dependent dossier drawer spec files, 5 browser tests total.                                                                                                                              |
| 45-04-04 Verdict               | Recorded `PASS` for DATA-01, DATA-02, DATA-03, and DATA-04 in `45-STAGING-VERIFY.md`.                                                                                                                                                                               |

## Fixes Made During Verification

| Area                      | Fix                                                                                                                                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Staging tenant bootstrap  | Added deterministic organization, organization membership, default organization, and Indonesia/China country extension rows to the Phase 45 migration and canonical seed so staging resolves the fixture tenant. |
| Drawer commitment data    | Switched dossier overview commitments to canonical `aa_commitments`, updated summary columns, and kept support for legacy linked work-item rows.                                                                 |
| Recent dossier E2E setup  | Seeded the persisted `dossier-store` recent dossier state before the RecentDossiers browser spec runs.                                                                                                           |
| Commitment row navigation | Removed drawer search params explicitly when routing to `/commitments?id=...`; narrowed the E2E assertion to the dossier drawer because the commitments page may open its own detail drawer.                     |

## Verification

| Command                                                                                                                                                                                                                                                                                | Result                     |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `pnpm -C frontend exec vitest run src/hooks/__tests__/useIntelligenceDigest.test.ts src/pages/Dashboard/widgets/__tests__/Digest.test.tsx`                                                                                                                                             | Passed: 2 files, 9 tests.  |
| `pnpm -C frontend exec vitest run src/hooks/__tests__/useVipVisits.test.ts src/pages/Dashboard/widgets/__tests__/VipVisits.test.tsx`                                                                                                                                                   | Passed: 2 files, 19 tests. |
| `pnpm -C frontend exec vitest run src/components/dossier/DossierDrawer/__tests__/OpenCommitmentsSection.test.tsx`                                                                                                                                                                      | Passed: 1 file, 12 tests.  |
| `doppler run -- pnpm --filter intake-frontend exec playwright test frontend/tests/e2e/dossier-drawer-trigger-recent.spec.ts frontend/tests/e2e/dossier-drawer-commitment-click.spec.ts frontend/tests/e2e/dossier-drawer-rtl.spec.ts frontend/tests/e2e/dossier-drawer-mobile.spec.ts` | Passed: 5 browser tests.   |

## Deviations From Plan

- The plan's literal Playwright command used `--filter frontend`, which matched no package and ran no tests. The accepted gate used `--filter intake-frontend`.
- Supabase MCP was available despite the local `SUPABASE_ACCESS_TOKEN` environment variable being unset.
- The initial MCP apply found missing tenant bootstrap data in staging; the fix was made in source-controlled seed and migration files, then reapplied through MCP.

## Requirements Satisfied

- DATA-01: `intelligence_digest` exists in staging with RLS and seeded rows.
- DATA-02: Digest uses publication-backed intelligence digest data.
- DATA-03: VIP visits carry person ISO data into country glyph rendering.
- DATA-04: Staging seed closure is verified by MCP SQL and the focused dossier drawer browser specs.
