# Phase 45 Staging Verification

**Date:** 2026-05-08
**Staging project:** zkrcjzdemdmwhearhfgg

## Source Gates

| Gate | Command | Status | Evidence |
| --- | --- | --- | --- |
| Digest table schema | `rg "CREATE TABLE IF NOT EXISTS public.intelligence_digest" supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql` | PASS | Found `CREATE TABLE IF NOT EXISTS public.intelligence_digest (`. |
| Digest RLS enabled | `rg "ALTER TABLE public.intelligence_digest ENABLE ROW LEVEL SECURITY" supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql` | PASS | Found RLS enable statement. |
| Seed and migration fixtures | `rg "source_publication\|b0000010\|v_p_indonesia_delegate\|head_of_delegation" supabase/seed/060-dashboard-demo.sql supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql` | PASS | Found digest `b0000010-*` rows, `source_publication`, `v_p_indonesia_delegate`, and `head_of_delegation`. |
| VIP person ISO RPC fields | `rg "person_iso TEXT\|LEFT JOIN LATERAL\|nationality.iso_code_2\|represented.iso_code_2" supabase/migrations/20260507211000_phase45_vip_iso_events.sql` | PASS | Found `person_iso TEXT`, lateral VIP join, and nationality/represented ISO fallback. |
| Digest source guard | `! rg "actor_name\|useActivityFeed" frontend/src/pages/Dashboard/widgets/Digest.tsx frontend/src/hooks/useIntelligenceDigest.ts` | PASS | No forbidden legacy source dependency found. |
| VIP glyph country rendering | `rg 'type="country"' frontend/src/pages/Dashboard/widgets/VipVisits.tsx` | PASS | Found `DossierGlyph type="country"`. |

## Supabase MCP Apply

| Step | Status | Evidence |
| --- | --- | --- |
| MCP migration list | PASS | `mcp__supabase__.list_migrations` succeeded for project `zkrcjzdemdmwhearhfgg`. |
| `20260507210000_phase45_intelligence_digest_seed` first apply | FAIL-THEN-FIXED | `mcp__supabase__.apply_migration` first returned `Seed 060 requires an organization membership for user de2734cf-f962-4e05-bf62-bc9e92efff96`. Investigation through MCP SQL showed the auth user existed but staging had no organization, membership, or country extension rows for the deterministic fixture tenant. |
| Source-controlled seed bootstrap fix | PASS | Updated `supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql` and `supabase/seed/060-dashboard-demo.sql` to seed the deterministic organization, membership, default organization, and Indonesia/China country extension rows before `tenant_isolation.resolve_user_tenant`. No direct database shell or ad hoc console edits were used. |
| `20260507210000_phase45_intelligence_digest_seed` re-apply | PASS | `mcp__supabase__.apply_migration` succeeded for project `zkrcjzdemdmwhearhfgg`. |
| `20260507211000_phase45_vip_iso_events` apply | PASS | `mcp__supabase__.apply_migration` succeeded for project `zkrcjzdemdmwhearhfgg`. |
| `digest_exists` | PASS | MCP SQL returned `digest_exists: true`. |
| `digest_seeded` | PASS | MCP SQL returned `digest_seeded: true`, `digest_count: 4`. |
| `vip_participant_seeded` | PASS | MCP SQL returned `vip_participant_seeded: true`, `vip_participant_count: 1`. |
| Tenant fixture sanity | PASS | MCP SQL returned `resolved_tenant: b0000000-0000-0000-0000-00000000aaaa` and `phase45_country_extension_count: 2`. |

## Unit Tests

| Gate | Command | Status | Evidence |
| --- | --- | --- | --- |
| Digest hook and widget | `pnpm -C frontend exec vitest run src/hooks/__tests__/useIntelligenceDigest.test.ts src/pages/Dashboard/widgets/__tests__/Digest.test.tsx` | PASS | 2 files passed, 9 tests passed. |
| VIP Visits hook and widget | `pnpm -C frontend exec vitest run src/hooks/__tests__/useVipVisits.test.ts src/pages/Dashboard/widgets/__tests__/VipVisits.test.tsx` | PASS | 2 files passed, 19 tests passed. |
| Commitment drawer navigation regression | `pnpm -C frontend exec vitest run src/components/dossier/DossierDrawer/__tests__/OpenCommitmentsSection.test.tsx` | PASS | 1 file passed, 12 tests passed. |

## Playwright Seed Specs

Plan command:

```bash
doppler run -- pnpm --filter frontend exec playwright test frontend/tests/e2e/dossier-drawer-trigger-recent.spec.ts frontend/tests/e2e/dossier-drawer-commitment-click.spec.ts frontend/tests/e2e/dossier-drawer-rtl.spec.ts frontend/tests/e2e/dossier-drawer-mobile.spec.ts
```

Result: NOT ACCEPTED AS A GATE. The command exited 0 but printed `No projects matched the filters` because this workspace package is named `intake-frontend`, not `frontend`.

Corrected verification command:

```bash
doppler run -- pnpm --filter intake-frontend exec playwright test frontend/tests/e2e/dossier-drawer-trigger-recent.spec.ts frontend/tests/e2e/dossier-drawer-commitment-click.spec.ts frontend/tests/e2e/dossier-drawer-rtl.spec.ts frontend/tests/e2e/dossier-drawer-mobile.spec.ts
```

Status: PASS.

Evidence: 5 browser tests passed across:

- `frontend/tests/e2e/dossier-drawer-trigger-recent.spec.ts`
- `frontend/tests/e2e/dossier-drawer-commitment-click.spec.ts`
- `frontend/tests/e2e/dossier-drawer-rtl.spec.ts` (2 tests)
- `frontend/tests/e2e/dossier-drawer-mobile.spec.ts`

No visual snapshot regeneration command was run.

## Verdict

PASS.

| Requirement | Status | Evidence |
| --- | --- | --- |
| DATA-01 | PASS | Staging project `zkrcjzdemdmwhearhfgg` now has `public.intelligence_digest` applied with RLS and seeded digest rows verified through Supabase MCP SQL. |
| DATA-02 | PASS | Digest source and unit gates pass; Digest reads `intelligence_digest` and no longer renders from legacy actor fields. |
| DATA-03 | PASS | VIP ISO source and unit gates pass; `get_upcoming_events` projects person ISO and `VipVisits` renders country glyphs. |
| DATA-04 | PASS | MCP apply plus the four seed-dependent dossier drawer specs pass against the deterministic staging seed fixture. |
