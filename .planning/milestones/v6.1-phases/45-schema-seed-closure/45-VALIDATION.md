---
phase: 45
slug: schema-seed-closure
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-07
---

# Phase 45 - Validation Strategy

> Per-phase validation contract for schema, seed, dashboard Digest, and VIP ISO
> closure.

## Test Infrastructure

| Property           | Value                                                                                                                                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | Supabase migrations, vitest, Playwright, grep/source checks                                                                                                                                                                                                                     |
| Config file        | `supabase/config.toml`, `frontend/vitest.config.ts`, `frontend/playwright.config.ts`                                                                                                                                                                                            |
| Quick run command  | `pnpm -C frontend exec vitest run src/pages/Dashboard/widgets/__tests__/Digest.test.tsx src/hooks/__tests__/useVipVisits.test.ts src/pages/Dashboard/widgets/__tests__/VipVisits.test.tsx`                                                                                      |
| Full suite command | `doppler run -- pnpm --filter frontend exec playwright test frontend/tests/e2e/dossier-drawer-trigger-recent.spec.ts frontend/tests/e2e/dossier-drawer-commitment-click.spec.ts frontend/tests/e2e/dossier-drawer-rtl.spec.ts frontend/tests/e2e/dossier-drawer-mobile.spec.ts` |
| Estimated runtime  | 2-12 minutes depending on Supabase MCP and browser setup                                                                                                                                                                                                                        |

## Sampling Rate

- After every migration/seed task: run exact `rg` checks for schema columns,
  RLS, and seed fixture rows before any frontend task starts.
- After every dashboard hook/widget task: run the targeted vitest command.
- After the staging apply task: capture Supabase MCP success output before
  Playwright runs.
- Before `$gsd-verify-work`: run all plan-level verification commands and the
  four seed-dependent Playwright specs on a developer machine with Doppler.
- Max feedback latency: one plan wave.

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement      | Threat Ref | Secure Behavior                                                       | Test Type | Automated Command                                                                                                                                                                                                                                                               | File Exists                                                                                                   | Status                                                                                                                                                               |
| -------- | ---- | ---- | ---------------- | ---------- | --------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------- |
| 45-01-01 | 01   | 1    | DATA-01, DATA-04 | T-45-01    | Digest rows are tenant-scoped and staging has the migration applied   | schema    | `rg "CREATE TABLE IF NOT EXISTS public.intelligence_digest                                                                                                                                                                                                                      | ALTER TABLE public.intelligence_digest ENABLE ROW LEVEL SECURITY                                              | tenant_isolation.rls_select_policy" supabase/migrations`                                                                                                             | yes     | pending |
| 45-01-02 | 01   | 1    | DATA-01, DATA-04 | T-45-02    | Seed fixtures are deterministic and source-aligned                    | seed      | `rg "intelligence_digest                                                                                                                                                                                                                                                        | source_publication                                                                                            | b00000" supabase/seed/060-dashboard-demo.sql supabase/migrations`                                                                                                    | yes     | pending |
| 45-02-01 | 02   | 2    | DATA-02          | T-45-03    | Digest source comes from publication rows, not internal users         | unit      | `pnpm -C frontend exec vitest run src/pages/Dashboard/widgets/__tests__/Digest.test.tsx`                                                                                                                                                                                        | yes                                                                                                           | pending                                                                                                                                                              |
| 45-02-02 | 02   | 2    | DATA-02          | T-45-04    | Widget render path has no actor-name dependency                       | source    | `! rg "actor_name                                                                                                                                                                                                                                                               | useActivityFeed" frontend/src/pages/Dashboard/widgets/Digest.tsx frontend/src/hooks/useIntelligenceDigest.ts` | yes                                                                                                                                                                  | pending |
| 45-03-01 | 03   | 2    | DATA-03          | T-45-05    | VIP rows carry nullable ISO without breaking timeline consumers       | unit      | `pnpm -C frontend exec vitest run src/hooks/__tests__/useVipVisits.test.ts src/pages/Dashboard/widgets/__tests__/VipVisits.test.tsx`                                                                                                                                            | yes                                                                                                           | pending                                                                                                                                                              |
| 45-03-02 | 03   | 2    | DATA-03          | T-45-06    | `DossierGlyph` receives `type="country"` plus ISO for real flags      | source    | `rg 'type="country"                                                                                                                                                                                                                                                             | person_iso                                                                                                    | personFlag' frontend/src/pages/Dashboard/widgets/VipVisits.tsx frontend/src/hooks/useVipVisits.ts frontend/src/domains/operations-hub/types/operations-hub.types.ts` | yes     | pending |
| 45-04-01 | 04   | 3    | DATA-04          | T-45-07    | Phase 41 seed-dependent drawer specs pass against seeded staging data | e2e       | `doppler run -- pnpm --filter frontend exec playwright test frontend/tests/e2e/dossier-drawer-trigger-recent.spec.ts frontend/tests/e2e/dossier-drawer-commitment-click.spec.ts frontend/tests/e2e/dossier-drawer-rtl.spec.ts frontend/tests/e2e/dossier-drawer-mobile.spec.ts` | yes                                                                                                           | pending                                                                                                                                                              |

## Wave 0 Requirements

Existing infrastructure covers all phase requirements:

- `supabase/migrations/`
- `supabase/seed/060-dashboard-demo.sql`
- `frontend/src/pages/Dashboard/widgets/__tests__/Digest.test.tsx`
- `frontend/src/hooks/__tests__/useVipVisits.test.ts`
- `frontend/src/pages/Dashboard/widgets/__tests__/VipVisits.test.tsx`
- `frontend/tests/e2e/support/dossier-drawer-fixture.ts`
- `frontend/tests/e2e/dossier-drawer-trigger-recent.spec.ts`
- `frontend/tests/e2e/dossier-drawer-commitment-click.spec.ts`
- `frontend/tests/e2e/dossier-drawer-rtl.spec.ts`
- `frontend/tests/e2e/dossier-drawer-mobile.spec.ts`

## Manual-Only Verifications

| Behavior                                                     | Requirement      | Why Manual                                                | Test Instructions                                                                                                                           |
| ------------------------------------------------------------ | ---------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase MCP apply to staging project `zkrcjzdemdmwhearhfgg` | DATA-01, DATA-04 | Requires live Supabase MCP credentials and staging access | Apply the Phase 45 migration/seed artifact through Supabase MCP, capture success output, and verify `intelligence_digest` exists in staging |
| Full drawer Playwright execution with Doppler env            | DATA-04          | Requires developer-machine env and browser auth secrets   | Run the full suite command after MCP apply and record pass/fail output in the plan summary                                                  |

## Validation Sign-Off

- [ ] All tasks have automated verify commands or explicit manual
      instructions.
- [ ] Sampling continuity: no three consecutive tasks lack automated
      verification.
- [ ] Wave 0 covers all referenced test files.
- [ ] No watch-mode flags.
- [ ] Feedback latency stays within one plan wave.
- [ ] `nyquist_compliant: true` set in frontmatter.

**Approval:** pending
