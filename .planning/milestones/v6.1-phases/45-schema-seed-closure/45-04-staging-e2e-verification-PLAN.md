---
phase: 45-schema-seed-closure
plan: 04
type: execute
wave: 3
depends_on: [45-02, 45-03]
files_modified:
  - .planning/phases/45-schema-seed-closure/45-STAGING-VERIFY.md
autonomous: false
requirements: [DATA-01, DATA-02, DATA-03, DATA-04]
must_haves:
  truths:
    - 'D-12: Apply Phase 45 schema and seed changes to staging through Supabase MCP against project zkrcjzdemdmwhearhfgg; do not use direct psql or one-off DB edits.'
    - 'D-15: Phase 45 unblocks the four Phase 41 BLOCKED-BY-SEED drawer specs plus targeted Digest/VipVisits widget checks.'
    - 'Visual snapshot regeneration remains deferred to Phase 46 and is not part of this verification plan.'
    - '[BLOCKING] Supabase MCP apply must run after all migration and seed modifications and before Playwright verification.'
  artifacts:
    - path: '.planning/phases/45-schema-seed-closure/45-STAGING-VERIFY.md'
      provides: 'staging apply and test evidence for Phase 45'
  key_links:
    - from: 'supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql'
      to: 'staging Supabase project zkrcjzdemdmwhearhfgg'
      via: 'Supabase MCP apply'
    - from: 'frontend/tests/e2e/dossier-drawer-*.spec.ts'
      to: 'supabase/seed/060-dashboard-demo.sql'
      via: 'deterministic fixture b0000001-0000-0000-0000-000000000004'
---

# Plan 45-04: Staging And E2E Verification

**Phase:** 45 (schema-seed-closure)
**Wave:** 3
**Depends on:** 45-02, 45-03
**Type:** verification
**TDD:** false (operator/staging verification)
**Estimated effort:** M (2-4 h, environment dependent)

## Goal

Apply the finalized Phase 45 migration/seed artifacts to staging through
Supabase MCP, then run the focused unit and Playwright gates that prove the
Digest and VIP seed debt is closed.

<execution_context>
@$HOME/.codex/get-shit-done/workflows/execute-plan.md
@$HOME/.codex/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/45-schema-seed-closure/45-CONTEXT.md
@.planning/phases/45-schema-seed-closure/45-RESEARCH.md
@.planning/phases/45-schema-seed-closure/45-VALIDATION.md
@.planning/phases/45-schema-seed-closure/45-PATTERNS.md
@CLAUDE.md
@supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql
@supabase/migrations/20260507211000_phase45_vip_iso_events.sql
@supabase/seed/060-dashboard-demo.sql
@frontend/tests/e2e/support/dossier-drawer-fixture.ts
</context>

<schema_push_requirement>
**[BLOCKING] Schema Push Required**

This phase modifies Supabase schema-relevant files under `supabase/migrations/`.
The executor MUST apply the Phase 45 migrations to staging through Supabase MCP
after Plans 45-01 and 45-03 are complete and before any final verification is
claimed.

- ORM detected: Supabase
- Staging project: `zkrcjzdemdmwhearhfgg`
- Required apply path: Supabase MCP migration apply
- Disallowed path: direct `psql`, ad hoc SQL console edits, or local-only seed
- If Supabase MCP credentials are unavailable, stop at a manual checkpoint and
  do not mark DATA-01 or DATA-04 complete.
  </schema_push_requirement>

<threat_model>
T-45-09 false-positive verification: mitigated by requiring Supabase MCP apply
evidence before Playwright.
T-45-10 stale fixture verification: mitigated by running the four Phase 41
drawer specs against the seeded staging database.
T-45-11 visual scope creep: mitigated by excluding snapshot updates; Phase 46
owns visual baseline regeneration.
Block on high severity: if MCP apply or Playwright seed-dependent specs fail,
stop and record the failure in `45-STAGING-VERIFY.md`.
</threat_model>

## Files to create / modify

| Path                                                           | Action | Notes                                                    |
| -------------------------------------------------------------- | ------ | -------------------------------------------------------- |
| `.planning/phases/45-schema-seed-closure/45-STAGING-VERIFY.md` | create | Evidence log for source gates, MCP apply, and Playwright |

<tasks>
<task id="45-04-01" type="execute">
<name>Run source and unit verification gates</name>
<read_first>
- .planning/phases/45-schema-seed-closure/45-VALIDATION.md
- .planning/phases/45-schema-seed-closure/45-01-schema-seed-foundation-PLAN.md
- .planning/phases/45-schema-seed-closure/45-02-digest-widget-closure-PLAN.md
- .planning/phases/45-schema-seed-closure/45-03-vip-iso-closure-PLAN.md
</read_first>
<files>
- create: .planning/phases/45-schema-seed-closure/45-STAGING-VERIFY.md
</files>
<action>
Create `.planning/phases/45-schema-seed-closure/45-STAGING-VERIFY.md` with
sections:

```markdown
# Phase 45 Staging Verification

**Date:** 2026-05-07
**Staging project:** zkrcjzdemdmwhearhfgg

## Source Gates

## Supabase MCP Apply

## Unit Tests

## Playwright Seed Specs

## Verdict
```

Run and record pass/fail for these source gates:

```bash
rg "CREATE TABLE IF NOT EXISTS public.intelligence_digest" supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql
rg "ALTER TABLE public.intelligence_digest ENABLE ROW LEVEL SECURITY" supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql
rg "source_publication|b0000010|v_p_indonesia_delegate|head_of_delegation" supabase/seed/060-dashboard-demo.sql supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql
rg "person_iso TEXT|LEFT JOIN LATERAL|nationality.iso_code_2|represented.iso_code_2" supabase/migrations/20260507211000_phase45_vip_iso_events.sql
! rg "actor_name|useActivityFeed" frontend/src/pages/Dashboard/widgets/Digest.tsx frontend/src/hooks/useIntelligenceDigest.ts
rg 'type="country"' frontend/src/pages/Dashboard/widgets/VipVisits.tsx
```

Run and record pass/fail for these unit gates:

```bash
pnpm -C frontend exec vitest run src/hooks/__tests__/useIntelligenceDigest.test.ts src/pages/Dashboard/widgets/__tests__/Digest.test.tsx
pnpm -C frontend exec vitest run src/hooks/__tests__/useVipVisits.test.ts src/pages/Dashboard/widgets/__tests__/VipVisits.test.tsx
```

</action>
<verify>
test -f .planning/phases/45-schema-seed-closure/45-STAGING-VERIFY.md
rg "Source Gates|Unit Tests|Supabase MCP Apply|Playwright Seed Specs|Verdict" .planning/phases/45-schema-seed-closure/45-STAGING-VERIFY.md
</verify>
<acceptance_criteria>
- `45-STAGING-VERIFY.md` exists.
- `45-STAGING-VERIFY.md` contains `Staging project: zkrcjzdemdmwhearhfgg`.
- `45-STAGING-VERIFY.md` contains `Source Gates`, `Supabase MCP Apply`, `Unit Tests`, `Playwright Seed Specs`, and `Verdict`.
- The source gates above are copied into `45-STAGING-VERIFY.md` with PASS or FAIL status.
- The two vitest commands above are copied into `45-STAGING-VERIFY.md` with PASS or FAIL status.
</acceptance_criteria>
</task>

<task id="45-04-02" type="execute">
<name>[BLOCKING] Apply Phase 45 migrations through Supabase MCP</name>
<read_first>
- CLAUDE.md
- supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql
- supabase/migrations/20260507211000_phase45_vip_iso_events.sql
- .planning/phases/45-schema-seed-closure/45-STAGING-VERIFY.md
</read_first>
<files>
- modify: .planning/phases/45-schema-seed-closure/45-STAGING-VERIFY.md
</files>
<action>
Use Supabase MCP against project `zkrcjzdemdmwhearhfgg` to apply these files in
order:

1. `supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql`
2. `supabase/migrations/20260507211000_phase45_vip_iso_events.sql`

Record the MCP tool name, project ID, migration names, and success output in
`45-STAGING-VERIFY.md` under `## Supabase MCP Apply`.

After apply, verify through Supabase MCP SQL/read tooling that:

```sql
SELECT to_regclass('public.intelligence_digest') IS NOT NULL AS digest_exists;
SELECT COUNT(*) >= 4 AS digest_seeded
FROM public.intelligence_digest
WHERE id::text LIKE 'b0000010-%';
SELECT COUNT(*) >= 1 AS vip_participant_seeded
FROM public.engagement_participants
WHERE id::text LIKE 'b0000012-%';
```

If Supabase MCP is unavailable, write `BLOCKED: Supabase MCP unavailable` to
`45-STAGING-VERIFY.md`, stop, and surface a manual checkpoint. Do not use
direct `psql`.
</action>
<verify>
rg "Supabase MCP|zkrcjzdemdmwhearhfgg|20260507210000_phase45_intelligence_digest_seed|20260507211000_phase45_vip_iso_events" .planning/phases/45-schema-seed-closure/45-STAGING-VERIFY.md
rg "digest_exists|digest_seeded|vip_participant_seeded" .planning/phases/45-schema-seed-closure/45-STAGING-VERIFY.md
</verify>
<acceptance_criteria>

- `45-STAGING-VERIFY.md` contains `zkrcjzdemdmwhearhfgg`.
- `45-STAGING-VERIFY.md` contains `20260507210000_phase45_intelligence_digest_seed`.
- `45-STAGING-VERIFY.md` contains `20260507211000_phase45_vip_iso_events`.
- `45-STAGING-VERIFY.md` contains `digest_exists`.
- `45-STAGING-VERIFY.md` contains `digest_seeded`.
- `45-STAGING-VERIFY.md` contains `vip_participant_seeded`.
- No command history or verification note uses direct `psql`.
  </acceptance_criteria>
  </task>

<task id="45-04-03" type="execute">
<name>Run seed-dependent Playwright specs</name>
<read_first>
- frontend/tests/e2e/support/dossier-drawer-fixture.ts
- frontend/tests/e2e/dossier-drawer-trigger-recent.spec.ts
- frontend/tests/e2e/dossier-drawer-commitment-click.spec.ts
- frontend/tests/e2e/dossier-drawer-rtl.spec.ts
- frontend/tests/e2e/dossier-drawer-mobile.spec.ts
- .planning/phases/45-schema-seed-closure/45-STAGING-VERIFY.md
</read_first>
<files>
- modify: .planning/phases/45-schema-seed-closure/45-STAGING-VERIFY.md
</files>
<action>
After Task 45-04-02 records a successful Supabase MCP apply, run:

```bash
doppler run -- pnpm --filter frontend exec playwright test frontend/tests/e2e/dossier-drawer-trigger-recent.spec.ts frontend/tests/e2e/dossier-drawer-commitment-click.spec.ts frontend/tests/e2e/dossier-drawer-rtl.spec.ts frontend/tests/e2e/dossier-drawer-mobile.spec.ts
```

Record command, exit status, and the final Playwright summary line in
`45-STAGING-VERIFY.md`.

Do not run `--update-snapshots`; visual baseline regeneration belongs to Phase 46.
</action>
<verify>
rg "dossier-drawer-trigger-recent.spec.ts|dossier-drawer-commitment-click.spec.ts|dossier-drawer-rtl.spec.ts|dossier-drawer-mobile.spec.ts" .planning/phases/45-schema-seed-closure/45-STAGING-VERIFY.md
! rg -- "--update-snapshots" .planning/phases/45-schema-seed-closure/45-STAGING-VERIFY.md
</verify>
<acceptance_criteria>

- `45-STAGING-VERIFY.md` contains the full `doppler run -- pnpm --filter frontend exec playwright test ...` command.
- `45-STAGING-VERIFY.md` contains all four spec filenames.
- `45-STAGING-VERIFY.md` contains PASS or FAIL for the Playwright command.
- `45-STAGING-VERIFY.md` does not contain `--update-snapshots`.
  </acceptance_criteria>
  </task>

<task id="45-04-04" type="execute">
<name>Record final Phase 45 verdict</name>
<read_first>
- .planning/phases/45-schema-seed-closure/45-STAGING-VERIFY.md
- .planning/REQUIREMENTS.md
- .planning/ROADMAP.md
</read_first>
<files>
- modify: .planning/phases/45-schema-seed-closure/45-STAGING-VERIFY.md
</files>
<action>
Set the `## Verdict` section in `45-STAGING-VERIFY.md` to one of:

- `PASS` only if source gates, unit gates, Supabase MCP apply, and Playwright all pass.
- `PASS-WITH-DEFERRAL` only if source/unit gates pass but Supabase MCP or Doppler/browser access is unavailable; include the exact blocked command and operator next step.
- `FAIL` if any source gate, unit gate, MCP apply, or Playwright command fails.

The verdict must explicitly list DATA-01, DATA-02, DATA-03, and DATA-04 with
PASS/FAIL/PASS-WITH-DEFERRAL.
</action>
<verify>
rg "DATA-01|DATA-02|DATA-03|DATA-04" .planning/phases/45-schema-seed-closure/45-STAGING-VERIFY.md
rg "PASS|PASS-WITH-DEFERRAL|FAIL" .planning/phases/45-schema-seed-closure/45-STAGING-VERIFY.md
</verify>
<acceptance_criteria>

- `45-STAGING-VERIFY.md` verdict lists DATA-01.
- `45-STAGING-VERIFY.md` verdict lists DATA-02.
- `45-STAGING-VERIFY.md` verdict lists DATA-03.
- `45-STAGING-VERIFY.md` verdict lists DATA-04.
- The verdict is exactly one of `PASS`, `PASS-WITH-DEFERRAL`, or `FAIL`.
  </acceptance_criteria>
  </task>
  </tasks>

## Verification

```bash
pnpm -C frontend exec vitest run src/hooks/__tests__/useIntelligenceDigest.test.ts src/pages/Dashboard/widgets/__tests__/Digest.test.tsx
pnpm -C frontend exec vitest run src/hooks/__tests__/useVipVisits.test.ts src/pages/Dashboard/widgets/__tests__/VipVisits.test.tsx
doppler run -- pnpm --filter frontend exec playwright test frontend/tests/e2e/dossier-drawer-trigger-recent.spec.ts frontend/tests/e2e/dossier-drawer-commitment-click.spec.ts frontend/tests/e2e/dossier-drawer-rtl.spec.ts frontend/tests/e2e/dossier-drawer-mobile.spec.ts
```

## Requirements satisfied

- DATA-01 final: staging apply proves `intelligence_digest` exists with RLS.
- DATA-02 final: source/unit gates prove Digest uses publication sources.
- DATA-03 final: source/unit gates prove VIP ISO reaches `DossierGlyph`.
- DATA-04 final: Supabase MCP apply plus four drawer specs prove seed closure.
