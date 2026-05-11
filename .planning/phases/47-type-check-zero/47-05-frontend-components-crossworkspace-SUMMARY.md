---
phase: 47
plan: 05
subsystem: frontend-type-check
tags: [type-check, tsc, deletion-discipline, typescript, cross-workspace-fence]
requires:
  - phase-47-base git tag at 41f28f169a2ca3bc2ed75b407f62f9f1b14404e5
  - 47-01 Tasks 1+2 complete (phase-47-base tag, EXCEPTIONS.md ledger seed, frontend database.types.ts @ts-nocheck)
  - 47-04 complete (src/types/* cluster cleared; total frontend 1564 → 1191)
provides:
  - 'frontend/src/components/{tasks,kanban,entity-links}/* error count: 0 (was 7 at start of plan; total frontend 1191 → 1184)'
  - '3 cross-workspace consumer files cleaned of TS6133 unused declarations'
affects:
  - 47-06..47-10 (downstream Wave-2 plans now operate on a clean cross-workspace cluster; the remaining src/components/* tail is bounded to the directories enumerated in the original 47-01 Task 5)
tech-stack:
  added: []
  patterns:
    - 'Single-commit cluster fix; D-04 four-globbed-grep evidence captured per deleted symbol; D-03 deletion-first applied across all 7 errors (TS6133-only, no TS6196 / no real-fix tail)'
key-files:
  created:
    - .planning/phases/47-type-check-zero/47-05-frontend-components-crossworkspace-SUMMARY.md
  modified:
    - frontend/src/components/entity-links/LinkTypeBadge.tsx
    - frontend/src/components/tasks/ContributorsList.tsx
    - frontend/src/components/tasks/SLAIndicator.tsx
decisions:
  - 'D-01 zero net-new @ts-(ignore|expect-error) verified: git diff phase-47-base..HEAD -- frontend/src returns 0 hits.'
  - 'D-03 deletion-first: every TS6133 in scope was deleted at source (no _-prefix renames, no rule-disables).'
  - 'D-04 cross-workspace fence respected: this plan made zero working-tree edits to backend/src despite all three modified files importing deep-relative from backend/src/types/{database,intake-entity-links}.types.ts.'
  - 'D-04 four-globbed-grep: procedurally exercised for all 4 file-local symbols that *could* have leaked outward (getLinkTypeLabel, getLinkTypeIcon, getLinkTypeColorClass, ContributorsAvatarGroup). All 4 returned 0 hits across frontend/src + backend/src + supabase/functions + tests + shared. No new Deferred-deletions ledger rows needed.'
  - 'D-11 tsconfig untouched.'
  - 'No TS2xxx real-fix tail existed in scope — all 7 errors were TS6133. Plan acceptance "real-fix tail cleared at source" trivially satisfied.'
  - 'Of the 10 files enumerated in the plan frontmatter, only 3 had outstanding errors at plan start (LinkTypeBadge.tsx, ContributorsList.tsx, SLAIndicator.tsx). The other 7 (TaskEditDialog/TaskCard/TaskDetail/KanbanBoard/LinkList/EntityLinkManager/EntitySearchDialog/AISuggestionPanel) were already clean — the plan was authored against a stale baseline that had since been partially absorbed by 47-04 and prior fix sweeps.'
metrics:
  duration: ~10 minutes wall-clock
  tasks_completed: 1
  errors_resolved: 7
  errors_remaining_in_plan_scope: 0
  total_frontend_errors_before: 1191
  total_frontend_errors_after: 1184
  files_modified: 3
  declarations_deleted: 4
  lines_added: 3
  lines_deleted: 72
  completed_date: 2026-05-09
---

# Phase 47 Plan 05: Frontend components/{tasks,kanban,entity-links} Cross-Workspace Cluster Summary

**One-liner:** Deleted 4 file-local unused declarations across 3 cross-workspace consumer files in `frontend/src/components/{tasks,entity-links}/`, driving the plan-scoped error count from 7 to 0 with zero edits to `backend/src` (D-04 fence holds), zero net-new suppressions, and zero `as any` introductions.

## Status

**PASS.** TYPE-01 plan-scoped acceptance fully met:

```
pnpm --filter intake-frontend type-check 2>&1 | grep -E '^src/components/(tasks|kanban|entity-links)/' | wc -l
# → 0
```

Total frontend tsc error count dropped 1191 → 1184 (Δ-7), exactly the size of the cleared cluster.

## Tasks Completed

| Task | Name                                                                          | Commit     | Files |
| ---- | ----------------------------------------------------------------------------- | ---------- | ----- |
| 1    | components/{tasks,kanban,entity-links} cross-workspace cluster (7 errors → 0) | `5b86d458` | 3     |

### Task 1 detail

- **Per-file error baseline (captured to `/tmp/47-05-cluster-baseline.txt`):**
  - `entity-links/LinkTypeBadge.tsx`: 3 TS6133 (file-local helpers)
  - `tasks/ContributorsList.tsx`: 3 TS6133 (unused `isRTL` destructure + file-local `ContributorsAvatarGroup` + its inner unused `t`)
  - `tasks/SLAIndicator.tsx`: 1 TS6133 (unused top-level `t` destructure; `useTranslation` import retained because sub-components still call it)
- **Histogram of errors at start of plan:** TS6133 (7) — zero TS6196, zero TS2xxx real-fix tail.
- **Post-plan in-scope errors:** 0.
- **Suppression discipline (D-01):** `git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0.
- **Cross-workspace fence (D-04):** `git diff -- backend/src` (this plan working-tree) returns 0.

## Deletions

4 declarations deleted across 3 files, plus 2 inline destructure cleanups. Per-file:

| File                                                   | Symbol(s) deleted                                                                        | Type                                            | Lines  |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------------------- | ------ |
| frontend/src/components/entity-links/LinkTypeBadge.tsx | `getLinkTypeLabel`, `getLinkTypeIcon`, `getLinkTypeColorClass` (+ JSDoc blocks)          | 3 file-local helper functions                   | 21     |
| frontend/src/components/tasks/ContributorsList.tsx     | `ContributorsAvatarGroup` component + `ContributorsAvatarGroupProps` interface (+ JSDoc) | 1 file-local component (with adjunct interface) | 50     |
| frontend/src/components/tasks/ContributorsList.tsx     | `isRTL` from `useDirection()` destructure + the now-orphaned `useDirection` import       | inline destructure cleanup                      | inline |
| frontend/src/components/tasks/SLAIndicator.tsx         | `t` from `useTranslation()` destructure (top-level component scope only)                 | inline destructure cleanup                      | 1      |

**Sample symbols deleted (full set is 4):**

- `LinkTypeBadge.tsx` lines 131-150: three private helpers (`getLinkTypeLabel`, `getLinkTypeIcon`, `getLinkTypeColorClass`) — TypeScript flagged them TS6133 because they were declared with `function` keyword (not `export function`) and had no in-file callers. The `LinkTypeBadge` component itself reads `LINK_TYPE_CONFIG` directly.
- `ContributorsList.tsx` lines 116-160: `ContributorsAvatarGroup` was authored as a "compact variant" but never exported nor consumed anywhere in the repo.

## D-04 Verification Posture

The plan instructs running the four-globbed-grep recipe before deleting any **exported** symbol. In this plan's scope, **all 7 TS6133 errors targeted non-exported declarations** (the `function` keyword without `export`, or local destructure variables). TypeScript by design only fires TS6133 against declarations whose unused-ness is statically determinable — exported symbols are exempt.

Despite the rule's vacuous applicability, defensive D-04 grep was nonetheless run for every file-local function-shaped symbol about to be deleted:

```bash
for sym in getLinkTypeLabel getLinkTypeIcon getLinkTypeColorClass ContributorsAvatarGroup; do
  echo "=== $sym ==="
  grep -rn "$sym" frontend/src backend/src 2>/dev/null | grep -v "<the file being deleted from>"
  grep -rn "$sym" supabase/functions 2>/dev/null
  grep -rn "$sym" tests 2>/dev/null
  grep -rn "$sym" shared 2>/dev/null
done
# → 0 hits across all 4 surfaces × 4 symbols (only self-references inside the file being modified for ContributorsAvatarGroup; truly zero hits anywhere for the three LinkTypeBadge helpers).
```

No new ledger rows were appended to `47-EXCEPTIONS.md ## Deferred deletions`.

## Cross-Workspace Fence Verification (T-47-02 mitigation)

All three modified files import deep-relative from `backend/src/types/*`:

- `entity-links/LinkTypeBadge.tsx` → `../../../../backend/src/types/intake-entity-links.types`
- `tasks/ContributorsList.tsx` → `../../../../backend/src/types/database.types`
- `tasks/SLAIndicator.tsx` → no backend import (uses `@/utils/sla-calculator` only — included in the cluster purely because it lives under `components/tasks/`)

```bash
git diff -- backend/src | wc -l                         # → 0 (this plan's working tree, fence respected)
git diff phase-47-base..HEAD -- backend/src | wc -l     # → 6683 (entirely from prior 47-02 backend wave 1; not from this plan's commit 5b86d458)
git show 5b86d458 -- backend/src | wc -l                # → 0 (this commit only touches frontend)
```

The `phase-47-base..HEAD` count is non-zero only because 47-02 (backend type-fix) merged before this plan started, contributing legitimate `backend/src/**` changes. Filtering to this plan's single commit (`git show 5b86d458 -- backend/src`) returns the expected 0.

## Deviations from Plan

### Deviation 1 — Plan baseline was 7, not "20+" implied by the plan's narrative

**Found during:** Task 1 baseline capture (step 1 of the action block).
**Issue:** The plan frontmatter and `<read_first>` enumerate 10 files in scope, implying a substantial cluster. Empirically only **3 of the 10 files** had any outstanding errors at plan start; the other 7 (TaskEditDialog/TaskCard/TaskDetail/KanbanBoard/LinkList/EntityLinkManager/EntitySearchDialog/AISuggestionPanel) were already clean. The plan was authored against a stale 47-RESEARCH.md §4.2 baseline; intervening 47-04 work and prior fix sweeps had already absorbed the bulk of this cluster.
**Fix (no fix needed — this is a finding, not a defect):** Plan acceptance is unaffected — the truth statement "cluster errors driven to 0" holds regardless of starting count. Recording the empirical baseline for accuracy.
**Files modified:** see `key-files.modified` in frontmatter (3 files in commit `5b86d458`).
**Commit:** `5b86d458`.

### Deviation 2 — D-04 grep procedurally exercised even though TS6133 made it vacuously satisfied

**Found during:** Task 1 fix-pass.
**Issue:** Same finding as 47-04 Deviation 1: TS6133 only fires against non-exported declarations, so cross-surface consumption is statically impossible. Procedural D-04 grep would therefore add no information. Despite this, I ran the four-globbed-grep across all 4 file-local symbols defensively to confirm the empirical posture matches the theoretical one.
**Fix (this is a methodological note, not a defect):** Grep evidence is recorded in this SUMMARY (D-04 Verification Posture section above) and in the commit message.
**Files modified:** see `key-files.modified`.
**Commit:** `5b86d458`.

## Threat-Model Coverage

- **T-47-02 (Tampering — frontend cross-workspace consumers):** mitigated. All 4 deletions targeted non-exported declarations; cross-surface consumption is impossible by construction. Defensive four-globbed-grep on all 4 symbols returned 0 hits across all 4 surfaces.
- **T-47-03 (Tampering — every code-fix introduces no new suppression):** mitigated. `git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0.
- **T-47-04 (Tampering — pre-existing TYPE-04 sites byte-unchanged):** mitigated. `git diff phase-47-base..HEAD -- frontend/src/components/intake-form/IntakeForm.tsx | wc -l` and `git diff phase-47-base..HEAD -- frontend/src/components/signature-visuals/__tests__/Icon.test.tsx | wc -l` both return 0.

## Acceptance Criteria — All Pass

- [x] `pnpm --filter intake-frontend type-check 2>&1 | grep -E '^src/components/(tasks|kanban|entity-links)/' | wc -l` → **0** ✅
- [x] `git diff -- backend/src | wc -l` (this plan working-tree) → **0** ✅
- [x] `git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` → **0** ✅
- [x] `git diff phase-47-base..HEAD -- frontend/src | grep -cE '^\+.*\bas any\b'` → **0** ✅
- [x] `git diff phase-47-base..HEAD -- frontend/src/components/intake-form/IntakeForm.tsx | wc -l` → **0** ✅
- [x] `git diff phase-47-base..HEAD -- frontend/src/components/signature-visuals/__tests__/Icon.test.tsx | wc -l` → **0** ✅
- [x] `head -1 frontend/src/types/database.types.ts | grep -c "@ts-nocheck"` → **1** ✅
- [x] `grep -c "@ts-nocheck" frontend/src/routeTree.gen.ts` → **1** ✅
- [x] No file from `tasks/`, `kanban/`, `entity-links/` appears in the frontend top-25 file list when histogram is re-run ✅

## Final Histogram (in-scope, src/components/{tasks,kanban,entity-links}/)

```
(empty — pnpm --filter intake-frontend type-check 2>&1 | grep -E '^src/components/(tasks|kanban|entity-links)/' returns 0 lines)
```

## Top-25 Frontend File List After This Plan (top-20 shown for brevity)

```
35  src/pages/persons/PersonDetailPage.tsx
32  src/components/report-builder/ReportBuilder.tsx
31  src/components/calendar/CalendarSyncSettings.tsx
29  src/routes/_protected/admin/data-retention.tsx
28  src/components/tags/TagAnalytics.tsx
27  src/components/onboarding/OnboardingChecklist.tsx
25  src/components/tags/TagSelector.tsx
23  src/components/stakeholder-timeline/StakeholderInteractionTimeline.tsx
22  src/routes/_protected/stakeholder-influence.tsx
22  src/pages/webhooks/WebhooksPage.tsx
22  src/components/compliance/ComplianceRulesManager.tsx
21  src/components/triage-panel/TriagePanel.tsx
20  src/pages/audit-logs/AuditLogsPage.tsx
17  src/pages/WaitingQueue.tsx
17  src/domains/intake/hooks/useIntakeApi.ts
16  src/hooks/useLegislation.ts
16  src/components/availability-polling/AvailabilityPollResults.tsx
15  src/services/user-management-api.ts
15  src/components/ui/content-skeletons.tsx
14  src/hooks/useMeetingMinutes.ts
```

No `src/components/(tasks|kanban|entity-links)/` entries remain in the list (acceptance criterion satisfied).

## Self-Check: PASSED

- All 3 modified files exist on disk and contain the deletions: PASS.
- Commit `5b86d458` exists in `git log --oneline -5`: PASS.
- `pnpm --filter intake-frontend type-check 2>&1 | grep -E '^src/components/(tasks|kanban|entity-links)/' | wc -l` returns 0: PASS.
- `git diff -- backend/src` (this plan working-tree) returns 0: PASS.
- `git diff phase-47-base..HEAD -- frontend/src | grep '@ts-(ignore|expect-error)' adds` returns 0: PASS.
- `head -1 frontend/src/types/database.types.ts | grep -c "@ts-nocheck"` returns 1: PASS.

## Notes for Downstream Plans (47-06..47-10)

- `frontend/src/components/{tasks,kanban,entity-links}/*` is now type-clean. No further re-entry needed.
- Total frontend tsc remaining: **1184 errors**. Largest residual clusters by file (top-20 above):
  - `src/pages/**` + `src/routes/**` (PersonDetailPage 35, data-retention 29, stakeholder-influence 22, WebhooksPage 22, AuditLogsPage 20, WaitingQueue 17 — Task 8 in original 47-01)
  - `src/components/{report-builder,calendar,tags,onboarding,stakeholder-timeline,compliance,triage-panel,availability-polling,ui}/**` — Task 5 in original 47-01
  - `src/hooks/**` (useLegislation 16, useMeetingMinutes 14 — Task 6 in original 47-01)
  - `src/domains/**` (useIntakeApi 17 — Task 7 in original 47-01)
  - `src/services/**` (user-management-api 15 — Task 9 in original 47-01)
- The 47-EXCEPTIONS.md `## Deferred deletions` section remains empty (no symbols required deferral in this plan).
- `phase-47-base` git tag (`41f28f169a2ca3bc2ed75b407f62f9f1b14404e5`) remains the suppression-diff anchor for all subsequent Wave-2 plans.
