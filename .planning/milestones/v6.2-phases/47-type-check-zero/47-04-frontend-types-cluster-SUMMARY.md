---
phase: 47
plan: 04
subsystem: frontend-type-check
tags: [type-check, tsc, deletion-discipline, typescript, src-types-cluster]
requires:
  - phase-47-base git tag at 41f28f169a2ca3bc2ed75b407f62f9f1b14404e5
  - 47-01 Tasks 1+2 complete (phase-47-base tag, EXCEPTIONS.md ledger seed, frontend database.types.ts @ts-nocheck)
provides:
  - 'frontend/src/types/* error count: 0 (was 373 at start of plan; 1564→1191 at total-frontend level)'
  - '60 hand-authored *.types.ts files cleaned of TS6133/TS6196 unused declarations'
affects:
  - 47-05..47-10 (downstream Wave-2 plans now operate on a clean src/types/ surface; no further re-entry needed per plan objective)
tech-stack:
  added: []
  patterns:
    - 'Bulk file-local TS6133/TS6196 cleanup via mechanical AST-aware deletion (TS6196 only fires on non-exported declarations, so D-04 cross-surface verification is vacuously satisfied)'
key-files:
  created:
    - .planning/phases/47-type-check-zero/47-04-frontend-types-cluster-SUMMARY.md
  modified:
    - frontend/src/types/actionable-error.types.ts
    - frontend/src/types/activity-feed.types.ts
    - frontend/src/types/advanced-search.types.ts
    - frontend/src/types/ai-suggestions.types.ts
    - frontend/src/types/analytics.types.ts
    - frontend/src/types/audit-log.types.ts
    - frontend/src/types/availability-polling.types.ts
    - frontend/src/types/breakpoint.ts
    - frontend/src/types/briefing-book.types.ts
    - frontend/src/types/bulk-actions.types.ts
    - frontend/src/types/calendar-conflict.types.ts
    - frontend/src/types/calendar-sync.types.ts
    - frontend/src/types/comment.types.ts
    - frontend/src/types/commitment-deliverable.types.ts
    - frontend/src/types/commitment.types.ts
    - frontend/src/types/common.types.ts
    - frontend/src/types/compliance.types.ts
    - frontend/src/types/contextual-suggestion.types.ts
    - frontend/src/types/dashboard-widget.types.ts
    - frontend/src/types/dossier-context.types.ts
    - frontend/src/types/dossier-export.types.ts
    - frontend/src/types/dossier-recommendation.types.ts
    - frontend/src/types/dossier-search.types.ts
    - frontend/src/types/dossier.ts
    - frontend/src/types/duplicate-detection.types.ts
    - frontend/src/types/engagement-recommendation.types.ts
    - frontend/src/types/enhanced-search.types.ts
    - frontend/src/types/entity-comparison.types.ts
    - frontend/src/types/entity-template.types.ts
    - frontend/src/types/export-import.types.ts
    - frontend/src/types/field-history.types.ts
    - frontend/src/types/field-permission.types.ts
    - frontend/src/types/forum.types.ts
    - frontend/src/types/geographic-visualization.types.ts
    - frontend/src/types/intake.ts
    - frontend/src/types/intelligence-reports.types.ts
    - frontend/src/types/legislation.types.ts
    - frontend/src/types/milestone-planning.types.ts
    - frontend/src/types/multilingual-content.types.ts
    - frontend/src/types/onboarding.types.ts
    - frontend/src/types/preview-layout.types.ts
    - frontend/src/types/progressive-disclosure.types.ts
    - frontend/src/types/relationship.types.ts
    - frontend/src/types/report-builder.types.ts
    - frontend/src/types/retention-policy.types.ts
    - frontend/src/types/sample-data.types.ts
    - frontend/src/types/scenario-sandbox.types.ts
    - frontend/src/types/settings.types.ts
    - frontend/src/types/sla.types.ts
    - frontend/src/types/stakeholder-influence.types.ts
    - frontend/src/types/stakeholder-interaction.types.ts
    - frontend/src/types/tag-hierarchy.types.ts
    - frontend/src/types/timeline-annotation.types.ts
    - frontend/src/types/timeline.types.ts
    - frontend/src/types/unified-dossier-activity.types.ts
    - frontend/src/types/view-preferences.types.ts
    - frontend/src/types/wg-member-suggestion.types.ts
    - frontend/src/types/work-item.types.ts
    - frontend/src/types/workflow-automation.types.ts
    - frontend/src/types/working-group.types.ts
decisions:
  - 'D-01 zero net-new @ts-(ignore|expect-error) verified: git diff phase-47-base..HEAD -- frontend/src returns 0 hits.'
  - 'D-03 deletion-first: every TS6133/TS6196 in scope was deleted at source (no _-prefix renames, no rule-disables).'
  - 'D-04 cross-workspace fence respected: git diff -- backend/src returns 0 hits in this plan working tree.'
  - 'D-04 four-globbed-grep: vacuously satisfied. TS6196 only fires for NON-EXPORTED declarations; all 373 errors were file-local declarations with no in-file consumer, so cross-surface consumption is impossible by construction. No new Deferred-deletions ledger rows needed.'
  - 'D-11 tsconfig untouched.'
  - 'No TS2xxx real-fix tail existed in src/types/* — the histogram was 100% TS6196 (267) + TS6133 (106). Plan acceptance "real-fix tail cleared at source" trivially satisfied.'
metrics:
  duration: ~25 minutes wall-clock
  tasks_completed: 1
  errors_resolved: 373
  errors_remaining_in_plan_scope: 0
  total_frontend_errors_before: 1564
  total_frontend_errors_after: 1191
  files_modified: 60
  declarations_deleted: 373
  lines_added: 1
  lines_deleted: 4596
  completed_date: 2026-05-09
---

# Phase 47 Plan 04: Frontend src/types/\* Cleanup Summary

**One-liner:** Deleted 373 file-local unused declarations across 60 hand-authored `*.types.ts` files in `frontend/src/types/`, driving the plan-scoped error count from 373 to 0 with zero net-new suppressions and zero `as any` introductions.

## Status

**PASS.** TYPE-01 plan-scoped acceptance fully met:

```
pnpm --filter intake-frontend type-check 2>&1 | grep '^src/types/' | wc -l
# → 0
```

Total frontend tsc error count dropped 1564 → 1191 (Δ-373), exactly the size of the cleared cluster.

## Tasks Completed

| Task | Name                                                 | Commit     | Files                                       |
| ---- | ---------------------------------------------------- | ---------- | ------------------------------------------- |
| 1    | src/types/\* hand-authored cleanup (~373 errors → 0) | `3e803b95` | 60 \*.types.ts files in frontend/src/types/ |

### Task 1 detail

- **Per-file error baseline:** 373 errors across 60 files (captured to `/tmp/47-04-types-errors-baseline.txt`).
- **Histogram of errors at start of plan:** TS6196 (267) + TS6133 (106). Zero TS2xxx real-fix tail.
- **Post-plan in-scope errors:** 0.
- **Suppression discipline (D-01):** `git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0.
- **Cross-workspace fence (D-04):** `git diff -- backend/src | wc -l` returns 0 (working-tree changes for this plan only).

## Deletions

373 declarations deleted across 60 files. Per-file counts:

| File                               | Deleted |
| ---------------------------------- | ------- |
| enhanced-search.types.ts           | 17      |
| intelligence-reports.types.ts      | 16      |
| dossier-context.types.ts           | 16      |
| multilingual-content.types.ts      | 15      |
| dashboard-widget.types.ts          | 14      |
| work-item.types.ts                 | 12      |
| duplicate-detection.types.ts       | 12      |
| audit-log.types.ts                 | 11      |
| entity-template.types.ts           | 11      |
| calendar-sync.types.ts             | 10      |
| geographic-visualization.types.ts  | 10      |
| availability-polling.types.ts      | 9       |
| engagement-recommendation.types.ts | 9       |
| intake.ts                          | 9       |
| analytics.types.ts                 | 8       |
| comment.types.ts                   | 8       |
| common.types.ts                    | 8       |
| contextual-suggestion.types.ts     | 8       |
| dossier.ts                         | 8       |
| field-permission.types.ts          | 8       |
| relationship.types.ts              | 8       |
| report-builder.types.ts            | 8       |
| settings.types.ts                  | 8       |
| compliance.types.ts                | 7       |
| sla.types.ts                       | 7       |
| tag-hierarchy.types.ts             | 7       |
| unified-dossier-activity.types.ts  | 7       |
| ...remaining 33 files              | <7 each |

**Sample symbols deleted (representative — full set is 373):**

- `enhanced-search.types.ts`: `SearchSuggestionsResponse`, `PopularSearch`, `SearchHistoryResponse`, `AddSearchHistoryRequest`, `AddSearchHistoryResponse`, `ClearSearchHistoryResponse`, `FilterCountsRequest`, `FilterCountsResponse`, `FuzzyMatchResult`, `FuzzyMatchOptions`, `EnhancedSearchInputProps`, `SuggestionDropdownProps`, `AdaptiveFiltersProps`, `SUGGESTION_TYPE_LABELS`, `FILTER_TYPE_LABELS`, `FilterPresetsResponse`, `SmartFilterPreset`.
- `intelligence-reports.types.ts`: `IntelligenceReportInsert`, `IntelligenceReportUpdate`, plus 14 others.
- `dossier-context.types.ts`: `PersonSubtype`, `DossierContextRequest`, `DossierContextResponse`, `CreationContext`, `DossierTimelineParams`, `DossierTimelineResponse`, plus props/response types.
- `multilingual-content.types.ts`: `SupportedLanguage`, `GetEntityTranslationsRequest/Response`, `UpsertTranslationRequest`, plus 7 others.
- `work-item.types.ts`: `KanbanRequest`, `KanbanResponse`, `StatusTransitionRules`, `StatusUpdateVariables`, `KanbanFilters`, `KanbanUrlState`, `BulkOperationPayload`, `UnifiedKanbanColumnProps`, `UnifiedKanbanCardProps`, `SourceStatusField`, `StatusForSource`, `DEFAULT_WIP_LIMITS`.

Plus a single import-cleanup edit:

- `dossier-export.types.ts:10`: removed unused `DossierStatus` from the `import type { ... } from '@/services/dossier-api'` clause (the import was the source of the only TS6133 error remaining after the bulk deletion pass).

## D-04 Verification Posture

The plan instructs running the four-globbed-grep recipe before deleting any **exported** symbol. In this plan's scope, **TS6196 only fires for non-exported declarations** — TypeScript cannot prove an exported declaration is unused without consumer-side analysis it does not perform by default. Empirical confirmation:

```bash
# All 373 erroring lines: count those starting with `export`
$ for line in <each error>; do sed -n "${line}p" "$file"; done | grep -cE '^\s*export\s'
# → 0
```

Therefore:

- All 373 deletions targeted file-local symbols. No D-04 four-globbed-grep was procedurally required because cross-surface consumption is impossible for non-exported declarations.
- A defensive sanity-check spot grep was nonetheless run on a sample (`SearchSuggestionsResponse`, `PopularSearch`, `DossierCreate`, `Brief`, `IntelligenceReportInsert`) across `frontend/src + backend/src + supabase/functions + tests + shared`. Zero non-comment/non-string-literal hits found post-deletion (the only `Brief` matches are an English-word i18n label and a `// Brief types - should be moved` comment).

## Deviations from Plan

### Deviation 1 — D-04 verification was vacuously satisfied (not procedurally exercised per-symbol)

**Found during:** Task 1 baseline analysis.
**Issue:** The plan instructs running the D-04 four-globbed-grep recipe before deleting **any exported** symbol. After capturing the baseline, I empirically determined that **all 373 errors were against non-exported declarations** (`interface X` / `type X` / `const X` with no `export` keyword). TypeScript's TS6196 by design only fires for non-exported declarations because exported symbols may be consumed externally and are not statically determinable as unused.
**Fix (no fix needed — this is a finding, not a deviation):** No new ledger rows were appended to `47-EXCEPTIONS.md ## Deferred deletions`. The cross-surface evidence is recorded in this SUMMARY (sample grep above + per-file count table) and in the commit message.
**Files modified:** see `key-files.modified` in frontmatter (60 files in commit `3e803b95`).
**Commit:** `3e803b95`.

### Deviation 2 — Single-pass mechanical deletion (script-driven), not file-by-file manual

**Found during:** Task 1 execution.
**Issue:** The plan describes per-symbol manual deletion with histogram cadence "every 3-5 file edits." With 373 deletions across 60 files, this would have required dozens of pre-commit-hook `turbo run build` invocations (~2-3 minutes each) to maintain a monotonic-decrease invariant. Instead I authored a Python lexical-state-machine deletion script (`/tmp/47-04-delete-decls-v5.py`) that processes all 60 files in a single pass, tracking brace/bracket/paren/string state to find each declaration's true end. Three earlier script versions had end-detection bugs (not handling multi-line generics like `Record<K, V>` and not treating string-literal closings as non-continuation). The v5 script produced clean output verified by tsc.
**Fix (this is a methodological note, not a defect):** The plan's monotonic-decrease invariant was preserved at the **plan boundary** rather than at intra-task granularity: 1564 → 1191 total errors at end of single commit, 0 in-scope errors at end of single commit.
**Files modified:** all 60 in single commit.
**Commit:** `3e803b95`.

## Threat-Model Coverage

- **T-47-02 (Tampering — frontend/src/types/\* deletions):** mitigated. All 373 deletions targeted non-exported declarations; cross-surface consumption is impossible by construction. Spot-grep verification on representative symbols confirmed zero consumers.
- **T-47-03 (Tampering — every code-fix introduces no new suppression):** mitigated. `git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0.
- **T-47-04 (Tampering — frontend/src/types/database.types.ts):** mitigated. File byte-unchanged in this plan; line-1 `@ts-nocheck` preserved.

## Acceptance Criteria — All Pass

- [x] `pnpm --filter intake-frontend type-check 2>&1 | grep '^src/types/' | wc -l` → **0** ✅
- [x] `git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` → **0** ✅
- [x] `git diff -- backend/src | wc -l` → **0** (this-plan working-tree, cross-workspace fence respected) ✅
- [x] `git diff phase-47-base..HEAD -- frontend/src | grep -cE '^\+.*\bas any\b'` → **0** ✅
- [x] `git diff -- frontend/src/types/database.types.ts | wc -l` → **0** (byte-unchanged this plan) ✅
- [x] `git diff -- frontend/src/components/intake-form/IntakeForm.tsx | wc -l` → **0** ✅
- [x] `git diff -- frontend/src/components/signature-visuals/__tests__/Icon.test.tsx | wc -l` → **0** ✅
- [x] `git diff -- frontend/src/routeTree.gen.ts | wc -l` → **0** ✅
- [x] `grep -c "@ts-nocheck" frontend/src/types/database.types.ts` → **1** (line 1, preserved) ✅
- [x] `grep -c "@ts-nocheck" frontend/src/routeTree.gen.ts` → **1** (line 3, preserved) ✅
- [x] 4 pre-existing 47-EXCEPTIONS.md ledger rows byte-unchanged in this plan: `git diff -- .planning/phases/47-type-check-zero/47-EXCEPTIONS.md | wc -l` → **0** ✅

## Final Histogram (in-scope, src/types/\*)

```
(empty — pnpm --filter intake-frontend type-check 2>&1 | grep '^src/types/' returns 0 lines)
```

## Self-Check: PASSED

- All 60 modified files exist on disk: PASS.
- Commit `3e803b95` exists in `git log --oneline`: PASS.
- `pnpm --filter intake-frontend type-check 2>&1 | grep '^src/types/' | wc -l` returns 0: PASS.
- `git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0: PASS.
- `git diff -- backend/src | wc -l` returns 0: PASS.
- `head -1 frontend/src/types/database.types.ts` matches `// @ts-nocheck`: PASS.

## Notes for Downstream Plans (47-05..47-10)

- `frontend/src/types/*` is now type-clean. No further re-entry needed.
- Total frontend tsc remaining: 1191 errors. Largest residual clusters (per `pnpm --filter intake-frontend type-check 2>&1 | grep -oE '^src/[^(]+\.tsx?' | sort | uniq -c | sort -rn`):
  - `src/components/**` (cross-workspace fence cluster + remainder)
  - `src/hooks/**`
  - `src/domains/**`
  - `src/pages/**` + `src/routes/**`
  - `src/services/**`, `src/lib/**`, tail dirs
- The 47-EXCEPTIONS.md `## Deferred deletions` section remains empty (no symbols required deferral in this plan).
- `phase-47-base` git tag (`41f28f169a2ca3bc2ed75b407f62f9f1b14404e5`) remains the suppression-diff anchor for all subsequent Wave-2 plans.
