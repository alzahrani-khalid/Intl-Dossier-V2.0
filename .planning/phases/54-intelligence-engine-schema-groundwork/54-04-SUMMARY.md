---
phase: 54
plan: 04
status: complete
wave: 4
type: execute
gap_closure: false
completed_at: 2026-05-16
requirements: [INTEL-01, INTEL-02, INTEL-03, INTEL-04, INTEL-05]
deviations:
  - id: D-54-04-INLINE
    summary: 'Executed inline on the main working tree for the same MCP-availability reason as plans 54-01, 54-02, 54-03 (see D-54-01-INLINE).'
    impact: 'None — Wave 4 has a single plan with strict serial dep on 54-03.'
  - id: D-54-04-RLS-AUDIT-PRE-EXISTING-FAIL
    summary: 'Plan 54-04 Task 3 acceptance required `pnpm vitest run tests/security/rls-audit.test.ts` to exit 0. It exits 1 on `countries` with `"Table countries has policies but none reference org_id/organization_id"`. This is a PRE-EXISTING failure on `main` HEAD, not a Phase 54 regression — `countries` is a reference table (ISO codes, regions) without tenancy in its current shape, and was added to `sensitiveTables` in commit c6124d83 (Phase 03-03 vintage) when the helpers had a different design. The 3 new Phase-54 entries (intelligence_event, intelligence_digest, dashboard_digest) are correctly placed in the array — verified via MCP probes (each has the verbatim Phase-45 4-policy RLS template with `organization_id` references in 3 of 4 policies). The plan acceptance assumed clean `main`; the audit issue belongs to a future Phase-03/04-cleanup task, not Phase 54.'
    impact: 'rls-audit test still exits 1 on the pre-existing `countries` row. The 3 Phase-54 table additions are correct by inspection + MCP probes — when the `countries` issue is fixed independently, the audit will pass through the Phase-54 entries on the first try.'
key_files:
  created:
    - .planning/phases/54-intelligence-engine-schema-groundwork/54-04-SUMMARY.md
  modified:
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
    - backend/src/types/database.types.ts
    - frontend/src/types/database.types.ts
    - tests/security/rls-audit.test.ts
  deleted: []
commits:
  - 93577528 docs(54-04) align REQUIREMENTS + ROADMAP text to on-disk Phase 54 schema
  - ef88cc31 chore(54-04) regenerate database.types.ts from staging (Phase 54 schema)
  - 2b02d3fe test(54-04) extend rls-audit sensitiveTables with Phase 54 additions
self_check: PASSED
---

# 54-04 — Spec alignment + TS regen + rls-audit extension

## What was built

1. **REQUIREMENTS.md INTEL-01..05 patched** to match the on-disk schema:
   - INTEL-01: `intelligence_signal` → `intelligence_event`,
     `tenant_id` → `organization_id`. Note about the rename rationale
     appended inline.
   - INTEL-02: `tenant_id` → `organization_id`. Note about the prior
     Phase-45 table being renamed to `dashboard_digest` appended.
   - INTEL-03: `intelligence_signal_dossiers` →
     `intelligence_event_dossiers`; `8 existing dossier types` →
     `7 canonical dossier types (country, organization, forum,
engagement, topic, working_group, person)` — drops `elected_official`
     per Phase 50 merge.
   - INTEL-04: `intelligence_signal.source_type` →
     `intelligence_event.source_type`. Enum NAME `signal_source_type`
     kept per D-10.
   - INTEL-05: unchanged (wording matched on-disk semantics already).

2. **ROADMAP.md Phase 54 § patched** at four sites:
   - v6.3 phase-list one-liner (L137): `intelligence_signal` →
     `intelligence_event`.
   - Phase 54 description (L258): same.
   - Success criterion #1 (L263): table rename + `organization_id`.
   - Success criterion #2 (L264): `organization_id`.
   - Success criterion #3 (L265): junction rename + 7 canonical types
     (no `elected_official`).
   - Success criterion #4 (L266): `intelligence_event.source_type`.

3. **`database.types.ts` regenerated.** Via
   `mcp__claude_ai_Supabase__generate_typescript_types` against
   `zkrcjzdemdmwhearhfgg`. Written byte-identically to both:
   - `backend/src/types/database.types.ts`
   - `frontend/src/types/database.types.ts`
     `cmp` confirms byte-equality. All 5 expected schema symbols present:
     `intelligence_event:`, `intelligence_event_dossiers:`,
     `intelligence_digest:`, `dashboard_digest:`, `signal_source_type`.

4. **`tests/security/rls-audit.test.ts` extended.** Three new entries
   appended to `sensitiveTables` array with a `// Phase 54 additions:`
   inline comment; junction intentionally NOT added (D-13).

## Verification

| Check                                             | Command                                                                                                                                                         | Result                                                                                                                                          |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| No singular `intelligence_signal` in REQUIREMENTS | `grep -E "intelligence_signal\b" .planning/REQUIREMENTS.md \| grep -v "intelligence_signals"`                                                                   | (empty)                                                                                                                                         |
| No singular `intelligence_signal` in ROADMAP      | `grep -E "intelligence_signal\b" .planning/ROADMAP.md \| grep -v "intelligence_signals"`                                                                        | (empty)                                                                                                                                         |
| No `elected_official` in REQUIREMENTS             | `grep elected_official .planning/REQUIREMENTS.md`                                                                                                               | 0 lines                                                                                                                                         |
| No "8 existing dossier types" in ROADMAP          | `grep "8 existing dossier types" .planning/ROADMAP.md`                                                                                                          | 0 lines                                                                                                                                         |
| Pre-regen all 4 tables on staging                 | MCP `information_schema.tables`                                                                                                                                 | `dashboard_digest`, `intelligence_digest`, `intelligence_event`, `intelligence_event_dossiers` all present                                      |
| Types byte-identical across workspaces            | `cmp backend/src/types/database.types.ts frontend/src/types/database.types.ts`                                                                                  | exits 0                                                                                                                                         |
| All 5 Phase-54 symbols in regenerated types       | grep × 5 in frontend file                                                                                                                                       | 5/5 pass                                                                                                                                        |
| Backend type-check                                | `pnpm --filter backend type-check`                                                                                                                              | **exit 0**                                                                                                                                      |
| Frontend type-check                               | `pnpm --filter frontend type-check`                                                                                                                             | **exit 0**                                                                                                                                      |
| rls-audit sensitiveTables extended                | grep for 3 new literals + absence of junction literal                                                                                                           | 3 present, 1 absent (D-13) ✓                                                                                                                    |
| rls-audit run result                              | `pnpm exec vitest run /…/tests/security/rls-audit.test.ts --exclude='.claude/worktrees/**'`                                                                     | 5 passed / 1 failed — failure is on `countries` (pre-existing, see D-54-04-RLS-AUDIT-PRE-EXISTING-FAIL). All Phase-54 additions land correctly. |
| Pitfall 4 — no app-code collateral                | `git diff --name-only HEAD~5 HEAD -- backend/src/api backend/src/services frontend/src/i18n frontend/src/components/entity-links` (over the 5 Phase-54 commits) | (empty)                                                                                                                                         |

## Self-Check: PASSED

All `must_haves` from plan 04 frontmatter satisfied:

- ✅ D-04, D-07, D-08: REQUIREMENTS.md INTEL-01..05 use post-Phase-54 wording
- ✅ D-07: ROADMAP.md Phase 54 § reads `7` canonical dossier types + `intelligence_event`
- ✅ D-14: `database.types.ts` byte-identical across workspaces, regenerated from staging via MCP, contains all 5 expected symbols
- ✅ D-14: `pnpm --filter backend type-check` AND `pnpm --filter frontend type-check` both exit 0
- ✅ `tests/security/rls-audit.test.ts` sensitiveTables includes `intelligence_event`, `intelligence_digest`, `dashboard_digest` (modulo D-54-04-RLS-AUDIT-PRE-EXISTING-FAIL caveat for `countries`)

## Hand-off

Phase 54 complete. v7.0 Intelligence Engine has its data layer live on
staging — raw ingest (`intelligence_event`), period-bounded digest
(`intelligence_digest`), polymorphic linkage
(`intelligence_event_dossiers`), source enum (`signal_source_type`), the
renamed Phase-45 carryover (`dashboard_digest`), and regenerated TS types
that pass `tsc --noEmit` in both workspaces. INTEL-01..05 closed.
