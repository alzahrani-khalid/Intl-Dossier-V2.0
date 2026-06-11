---
phase: 54
plan: 01
status: complete
wave: 1
type: execute
gap_closure: false
completed_at: 2026-05-16
requirements: []
deviations:
  - id: D-54-01-PK
    summary: 'Added explicit PK index rename (intelligence_digest_pkey → dashboard_digest_pkey) to the migration, not enumerated by 54-RESEARCH § Pattern 3. Required because ALTER TABLE...RENAME does NOT rename the auto-derived PK constraint name, which would have collided with plan 54-02 new intelligence_digest PK.'
    impact: 'None — strictly additive defensive ALTER INDEX; staging applied cleanly. Plan 54-02 unblocked.'
  - id: D-54-01-INLINE
    summary: 'Wave 1 executed inline on the main working tree rather than via parallel worktree executor. Cause: D-15 mandates Supabase MCP for migration application, but the spawned `gsd-executor` subagent does not have `mcp__claude_ai_Supabase__*` tools in its function schema (upstream Claude Code bug anthropics/claude-code#13898 — MCP tools stripped from agents with `tools:` frontmatter restriction). Orchestrator applied the migration via MCP, then completed Task 2 + Task 3 inline. Two locked checkpoint worktrees (agent-a53185ad31eeffd6d, agent-a453394944c376493) remain at base SHA b174815e with zero commits; they will be reaped by the Claude Code harness on next session reset.'
    impact: 'No semantic deviation from plan output. Every acceptance criterion verified inline. Subsequent waves (54-02, 54-03, 54-04) will also execute inline for the same MCP-availability reason. Phase 54 still single-plan-per-wave with strict serial dependencies, so zero parallelism benefit was lost.'
key_files:
  created:
    - supabase/migrations/20260516000001_phase54_rename_phase45_intelligence_digest.sql
    - frontend/src/hooks/useDashboardDigest.ts
    - frontend/src/hooks/__tests__/useDashboardDigest.test.ts
    - .planning/phases/54-intelligence-engine-schema-groundwork/54-01-SUMMARY.md
  modified:
    - supabase/seed/060-dashboard-demo.sql
    - frontend/src/pages/Dashboard/widgets/Digest.tsx
    - frontend/src/pages/Dashboard/widgets/__tests__/Digest.test.tsx
  deleted:
    - frontend/src/hooks/useIntelligenceDigest.ts
    - frontend/src/hooks/__tests__/useIntelligenceDigest.test.ts
commits:
  - 91f9d22c feat(54-01) rename Phase-45 intelligence_digest → dashboard_digest
  - cffd0bd9 refactor(54-01) rename useIntelligenceDigest → useDashboardDigest
tag_created: phase-54-base
tag_sha: 02fe6eb19ce6d799efee8c1e88bef63123203efb
tag_target: b174815e342885662e476d00bebd6283bb08b373
self_check: PASSED
---

# 54-01 — Rename Phase-45 intelligence_digest → dashboard_digest

## What was built

1. **Phase provenance anchor.** Created annotated + SSH-signed git tag `phase-54-base`
   at commit `b174815e` (operator action via local key). Verified with
   `git tag -v phase-54-base` → `Good "git" signature for alzahrani.khalid@gmail.com
with ED25519 key SHA256:YlslD6LyamDvzTWDXBCQSNo8pgwNzO/oCYL9Zw6VwcM`. Pushed to
   `origin` as SHA `02fe6eb19ce6d799efee8c1e88bef63123203efb`.

2. **Phase-45 table renamed on staging.** The migration
   `supabase/migrations/20260516000001_phase54_rename_phase45_intelligence_digest.sql`
   applied via Supabase MCP `apply_migration` against project `zkrcjzdemdmwhearhfgg`
   (D-15). It:
   - Renames `public.intelligence_digest` to `public.dashboard_digest` via
     `ALTER TABLE`. RLS policies, FKs, GRANTs, and triggers follow the table
     automatically per Postgres semantics.
   - Renames the 3 secondary indexes (`idx_intelligence_digest_*` →
     `idx_dashboard_digest_*`) and the PK index (`intelligence_digest_pkey` →
     `dashboard_digest_pkey`) for clarity and to free the default PK constraint
     name for plan 54-02 (D-54-01-PK).
   - Renames the 4 RLS policies (`intelligence_digest_select_org` /
     `_insert_editor` / `_update_editor` / `_delete_admin` →
     `dashboard_digest_*`) so post-rename policy names match the new table.
   - Adds a `COMMENT ON TABLE` documenting the rename rationale.

3. **Seed file retargeted.** `supabase/seed/060-dashboard-demo.sql` now references
   `dashboard_digest` at all three sites: the dev-reset `DELETE` (L104), the
   `INSERT` statement + section heading (L342), and the closing `RAISE NOTICE`
   (L367). The historical Phase-45 migration
   `20260507210000_phase45_intelligence_digest_seed.sql` is intentionally **not**
   retro-edited (D-03).

4. **Frontend hook + test renamed in lockstep with the DB.** Created
   `frontend/src/hooks/useDashboardDigest.ts` (and its Vitest spec) by
   copying the old `useIntelligenceDigest.ts` verbatim and swapping six identifier/literal
   pairs: `IntelligenceDigestRow` → `DashboardDigestRow`,
   `INTELLIGENCE_DIGEST_SELECT` → `DASHBOARD_DIGEST_SELECT`,
   `useIntelligenceDigest` → `useDashboardDigest`,
   `queryKey ['dashboard', 'intelligence-digest', limit]` →
   `['dashboard', 'dashboard-digest', limit]`,
   `.from('intelligence_digest')` → `.from('dashboard_digest')`, and
   `'Failed to fetch intelligence digest:'` → `'Failed to fetch dashboard digest:'`.
   Column list and React Query options are byte-identical with the prior hook.
   The old files are deleted via `git rm`.

5. **Single consumer updated in lockstep.** `Digest.tsx` swaps its import,
   `mapDigestToRow` parameter type, and call site to the renamed hook (three
   sites). `Digest.test.tsx` swaps the `vi.mock` path, the named import, the
   `Partial<ReturnType<typeof …>>` annotation, all `vi.mocked(…)` sites, the
   `readFileSync('src/hooks/useDashboardDigest.ts')` path assertion, and the
   `describe`-name update. Pitfall 4 respected — no bulk find/replace; only
   the six in-scope files plus the seed touched.

## Verification

| Check                                   | Command                                                                                                                             | Result                                                                |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Signed tag exists                       | `git cat-file -t phase-54-base`                                                                                                     | `tag` (annotated)                                                     |
| Tag signature verifies                  | `git tag -v phase-54-base`                                                                                                          | `Good "git" signature ... ED25519`                                    |
| Tag pushed to origin                    | `git ls-remote --tags origin phase-54-base`                                                                                         | one line with SHA                                                     |
| Renamed table on staging                | MCP `execute_sql` "SELECT table_name FROM information_schema.tables WHERE table_name IN ('intelligence_digest','dashboard_digest')" | returns only `dashboard_digest`                                       |
| Indexes renamed                         | MCP `execute_sql` "SELECT indexname FROM pg_indexes WHERE tablename='dashboard_digest'"                                             | 4 rows, all `dashboard_digest_*` (PK + 3 secondary)                   |
| Policies renamed                        | MCP `execute_sql` "SELECT polname FROM pg_policy WHERE polrelid='public.dashboard_digest'::regclass"                                | 4 rows, all `dashboard_digest_*`                                      |
| Advisor scan                            | MCP `get_advisors(type=security)`                                                                                                   | zero findings referencing `dashboard_digest` or `intelligence_digest` |
| New hook spec                           | `pnpm exec vitest run src/hooks/__tests__/useDashboardDigest.test.ts`                                                               | 2/2 PASS                                                              |
| Widget spec                             | `pnpm exec vitest run src/pages/Dashboard/widgets/__tests__/Digest.test.tsx`                                                        | 7/7 PASS                                                              |
| Old hook deleted                        | `test -e frontend/src/hooks/useIntelligenceDigest.ts`                                                                               | non-zero exit                                                         |
| Old hook test deleted                   | `test -e frontend/src/hooks/__tests__/useIntelligenceDigest.test.ts`                                                                | non-zero exit                                                         |
| Widget free of old hook                 | `grep -c useIntelligenceDigest frontend/src/pages/Dashboard/widgets/Digest.tsx`                                                     | 0                                                                     |
| Widget test free of old hook            | `grep -c useIntelligenceDigest frontend/src/pages/Dashboard/widgets/__tests__/Digest.test.tsx`                                      | 0                                                                     |
| Pitfall 4 — no collateral               | `git diff --name-only HEAD~2 HEAD -- backend/src frontend/src/i18n frontend/src/components/entity-links`                            | (empty — no out-of-scope edits)                                       |
| Phase-45 historical migration untouched | `git diff HEAD~2 HEAD -- supabase/migrations/20260507210000_*`                                                                      | (empty)                                                               |

One acceptance-criterion observation: the plan said
`grep -c "useDashboardDigest" frontend/src/pages/Dashboard/widgets/Digest.tsx` should return ≥3
(documented as "import + type + call"). The actual count is 2 lines (import +
call) because the type identifier is `DashboardDigestRow`, not
`useDashboardDigest`, so it does not match the grep pattern. Functional state
is identical to the plan's intent — type is renamed, import has the new
identifier, hook is invoked under the new name — and the underlying
behavioral assertions (Vitest specs, zero-old-references grep) all hold.
Reporting for transparency, not as a defect.

## Self-Check: PASSED

All must-haves from the plan frontmatter satisfied:

- ✅ `phase-54-base` signed tag exists locally + pushed; `git tag -v` exits 0 with `Good "git" signature`
- ✅ D-01: `intelligence_digest` renamed to `dashboard_digest` on staging via Supabase MCP; indexes + RLS policies follow
- ✅ D-02: Single frontend caller reads via `useDashboardDigest()` against `.from('dashboard_digest')`
- ✅ D-03: Seed file retargeted at the renamed table; Phase-45 historical migration not retro-edited
- ✅ Old hook + test deleted from disk
- ✅ D-15: Schema change applied via Supabase MCP `apply_migration`, not local CLI

## Hand-off to plan 54-02

The canonical name `intelligence_digest` is now free in the `public` schema
of staging (`zkrcjzdemdmwhearhfgg`). The default PK constraint name
`intelligence_digest_pkey` is also free. Plan 54-02 can create the new
spec-shape `intelligence_digest` table (alongside `signal_source_type` enum
and `intelligence_event`) without hitting SQLSTATE 42P07 (`duplicate_table`)
or constraint-name collisions.
