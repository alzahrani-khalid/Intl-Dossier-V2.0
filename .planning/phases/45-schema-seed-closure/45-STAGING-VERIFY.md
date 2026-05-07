# Phase 45 Staging Verification

**Date:** 2026-05-08
**Staging project:** zkrcjzdemdmwhearhfgg

## Source Gates

| Gate                        | Command                                                                                                                                                                                      | Status | Evidence                                                                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Digest table schema         | `rg "CREATE TABLE IF NOT EXISTS public.intelligence_digest" supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql`                                                         | PASS   | Found `CREATE TABLE IF NOT EXISTS public.intelligence_digest (`.                                                                                   |
| Digest RLS enabled          | `rg "ALTER TABLE public.intelligence_digest ENABLE ROW LEVEL SECURITY" supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql`                                              | PASS   | Found RLS enable statement.                                                                                                                        |
| Seed and migration fixtures | `rg "source_publication\|b0000010\|v_p_indonesia_delegate\|head_of_delegation" supabase/seed/060-dashboard-demo.sql supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql` | PASS   | Found digest `b0000010-*` rows, `source_publication`, `v_p_indonesia_delegate`, and `head_of_delegation` in canonical seed and migration artifact. |
| VIP person ISO RPC fields   | `rg "person_iso TEXT\|LEFT JOIN LATERAL\|nationality.iso_code_2\|represented.iso_code_2" supabase/migrations/20260507211000_phase45_vip_iso_events.sql`                                      | PASS   | Found `person_iso TEXT`, lateral VIP join, and nationality/represented ISO fallback.                                                               |
| Digest source guard         | `! rg "actor_name\|useActivityFeed" frontend/src/pages/Dashboard/widgets/Digest.tsx frontend/src/hooks/useIntelligenceDigest.ts`                                                             | PASS   | No forbidden legacy source dependency found.                                                                                                       |
| VIP glyph country rendering | `rg 'type="country"' frontend/src/pages/Dashboard/widgets/VipVisits.tsx`                                                                                                                     | PASS   | Found `DossierGlyph type="country"`.                                                                                                               |

## Supabase MCP Apply

| Step                                                  | Status  | Evidence                                                                                                                                                                                                                                              |
| ----------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MCP authentication check                              | BLOCKED | `mcp__supabase__.list_migrations` against project `zkrcjzdemdmwhearhfgg` returned `Unauthorized. Please provide a valid access token to the MCP server via the --access-token flag or SUPABASE_ACCESS_TOKEN.` Local `SUPABASE_ACCESS_TOKEN` is unset. |
| `20260507210000_phase45_intelligence_digest_seed.sql` | NOT RUN | Blocked before apply because Supabase MCP is unavailable. Direct `psql` and ad hoc SQL console edits are disallowed by Plan 45-04.                                                                                                                    |
| `20260507211000_phase45_vip_iso_events.sql`           | NOT RUN | Blocked before apply because Supabase MCP is unavailable.                                                                                                                                                                                             |
| `digest_exists`                                       | NOT RUN | Blocked until Supabase MCP migration apply succeeds.                                                                                                                                                                                                  |
| `digest_seeded`                                       | NOT RUN | Blocked until Supabase MCP migration apply succeeds.                                                                                                                                                                                                  |
| `vip_participant_seeded`                              | NOT RUN | Blocked until Supabase MCP migration apply succeeds.                                                                                                                                                                                                  |

BLOCKED: Supabase MCP unavailable.

## Unit Tests

| Gate                       | Command                                                                                                                                    | Status | Evidence                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------ | -------------------------------- |
| Digest hook and widget     | `pnpm -C frontend exec vitest run src/hooks/__tests__/useIntelligenceDigest.test.ts src/pages/Dashboard/widgets/__tests__/Digest.test.tsx` | PASS   | 2 files passed, 9 tests passed.  |
| VIP Visits hook and widget | `pnpm -C frontend exec vitest run src/hooks/__tests__/useVipVisits.test.ts src/pages/Dashboard/widgets/__tests__/VipVisits.test.tsx`       | PASS   | 2 files passed, 19 tests passed. |

## Playwright Seed Specs

NOT RUN. The seed-dependent Playwright command is intentionally blocked until the Supabase MCP apply succeeds:

```bash
doppler run -- pnpm --filter frontend exec playwright test frontend/tests/e2e/dossier-drawer-trigger-recent.spec.ts frontend/tests/e2e/dossier-drawer-commitment-click.spec.ts frontend/tests/e2e/dossier-drawer-rtl.spec.ts frontend/tests/e2e/dossier-drawer-mobile.spec.ts
```

No snapshot update command was run.

## Verdict

BLOCKED.

| Requirement | Status  | Evidence                                                                                                                                                                                                |
| ----------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DATA-01     | PARTIAL | Source migration and source gates pass, but staging apply is blocked by missing Supabase MCP authentication.                                                                                            |
| DATA-02     | PASS    | Digest reads `intelligence_digest` through `useIntelligenceDigest`; source/unit gates pass.                                                                                                             |
| DATA-03     | PASS    | `get_upcoming_events` source migration exposes nullable person ISO fields; `useVipVisits` maps `person_iso` to `personFlag`; `VipVisits` renders `DossierGlyph type="country"`; source/unit gates pass. |
| DATA-04     | BLOCKED | Staging seed apply and the four seed-dependent Playwright specs are blocked until Supabase MCP authentication is available.                                                                             |

Full `pnpm build` passed during the Wave 2 post-merge gate. Full `pnpm test` failed in backend integration suites because local Supabase/env prerequisites were unavailable (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`; `ECONNREFUSED 127.0.0.1:54321`). Focused Phase 45 unit gates pass.
