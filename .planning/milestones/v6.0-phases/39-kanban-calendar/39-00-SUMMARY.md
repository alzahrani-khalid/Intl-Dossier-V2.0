---
phase: 39-kanban-calendar
plan: 00
subsystem: frontend/i18n + frontend/pages + frontend/tests + scripts
tags: [scaffold, infrastructure, wave-0, i18n, e2e-stubs, ci-gate, toArDigits]
requirements: [BOARD-01, BOARD-02, BOARD-03]
dependency_graph:
  requires: []
  provides:
    - 'frontend/src/pages/WorkBoard barrel + 4 placeholder components'
    - 'frontend/src/lib/i18n/toArDigits utility (Arabic-Indic digit transformer)'
    - 'unified-kanban + calendar i18n key set for Wave 1 widgets'
    - '13 skipped Playwright E2E spec stubs (target files for Wave 1+2 plans)'
    - 'Commented Phase 39 CI gate block in scripts/check-deleted-components.sh'
  affects:
    - 'Wave 1 plans 39-01..39-07 can now run in parallel against stable file targets'
    - 'Wave 2 plan 39-09 has CI gate scaffold ready to uncomment'
tech_stack:
  added: []
  patterns:
    - 'verbatim port from /tmp/inteldossier-handoff/inteldossier/project/src/data.jsx (toArDigits)'
    - 'placeholder-component pattern (export const X = (): null => null) so barrel typechecks before Wave 1 ships real impls'
    - 'Phase 38 D-09 wave structure (Wave 0 infra → Wave 1 widgets → Wave 2 E2E + cut)'
    - 'CI gate scaffolded commented (Phase 34/36 precedent), uncommented during legacy-cut wave'
key_files:
  created:
    - frontend/src/pages/WorkBoard/index.ts
    - frontend/src/pages/WorkBoard/WorkBoard.tsx
    - frontend/src/pages/WorkBoard/KCard.tsx
    - frontend/src/pages/WorkBoard/BoardColumn.tsx
    - frontend/src/pages/WorkBoard/BoardToolbar.tsx
    - frontend/src/lib/i18n/toArDigits.ts
    - frontend/src/lib/i18n/__tests__/toArDigits.test.ts
    - frontend/tests/e2e/kanban-render.spec.ts
    - frontend/tests/e2e/kanban-rtl.spec.ts
    - frontend/tests/e2e/kanban-visual.spec.ts
    - frontend/tests/e2e/kanban-search.spec.ts
    - frontend/tests/e2e/kanban-filters.spec.ts
    - frontend/tests/e2e/kanban-responsive.spec.ts
    - frontend/tests/e2e/kanban-a11y.spec.ts
    - frontend/tests/e2e/kanban-dnd.spec.ts
    - frontend/tests/e2e/calendar-render.spec.ts
    - frontend/tests/e2e/calendar-rtl.spec.ts
    - frontend/tests/e2e/calendar-visual.spec.ts
    - frontend/tests/e2e/calendar-mobile.spec.ts
    - frontend/tests/e2e/calendar-a11y.spec.ts
  modified:
    - frontend/public/locales/en/unified-kanban.json
    - frontend/public/locales/ar/unified-kanban.json
    - frontend/public/locales/en/calendar.json
    - frontend/public/locales/ar/calendar.json
    - scripts/check-deleted-components.sh
decisions:
  - 'Inserted new keys inline within existing filters.* and actions.* blocks (vs appending separate sibling blocks) to keep namespace ergonomic for downstream useTranslation consumers'
  - 'Added kanban-dnd.spec.ts SUPERSEDES marker pointing at kanban-drag-drop.spec.ts so 39-09 has a clear cleanup target'
  - 'Included frontend/src/routes/_protected/my-work/board.tsx in PHASE_39_DELETED_FILES per researcher recommendation A1 (consolidate onto /kanban per D-01) — block stays commented until 39-09'
  - 'Pre-existing frontend/playwright.config.ts ESM __dirname bug noted but NOT fixed (out of scope per Rule SCOPE BOUNDARY — pre-existing, unrelated to Wave 0 scaffold)'
metrics:
  duration: '~12 minutes'
  tasks_completed: 3
  files_created: 21
  files_modified: 5
  commits: 3
  unit_tests_added: 10
  unit_tests_passing: 10
  completed_date: '2026-04-25'
---

# Phase 39 Plan 00: Wave 0 Infrastructure Scaffold — Summary

WorkBoard folder + barrel, toArDigits Arabic-Indic digit utility (10 passing vitest tests), Phase 39 i18n key extensions for unified-kanban and calendar in EN+AR, 13 skipped Playwright E2E spec stubs, and a commented Phase 39 CI gate block — all the stable targets Wave 1 plans (39-01..39-07) need to run in parallel without race conditions.

## Tasks Executed

### Task 1: WorkBoard barrel + toArDigits utility — commit `f5822860`

- Created `frontend/src/pages/WorkBoard/index.ts` with 4 named exports
- Created 4 placeholder components (`WorkBoard.tsx`, `KCard.tsx`, `BoardColumn.tsx`, `BoardToolbar.tsx`) each `export const X = (): null => null` with `// PLACEHOLDER: replaced in 39-XX` comment so barrel typechecks before real impls land
- Ported `toArDigits(input, lang)` from handoff `data.jsx#L8` to `frontend/src/lib/i18n/toArDigits.ts` with explicit return type and inline landmine note (do not double-convert with `toLocaleString('ar')`)
- Authored 10 vitest unit tests covering: en/ar locales, numeric input, mixed alphanumeric strings, empty string, all 10 digits — all passing in 598ms

### Task 2: i18n namespace extensions — commit `17daca6c`

- `unified-kanban.json` (EN+AR): added `filters.byStatus / byDossier / byOwner / comingSoon / search`, top-level `overdueChip` ("{{count}} overdue" / "{{count}} متأخر"), and `actions.newItem / listView / addToColumn`
- `calendar.json` (EN+AR): added top-level `weeklist.previousWeek / nextWeek / today` and `actions.newEvent`
- Inserted new keys inline within existing `filters.*` and `actions.*` blocks (vs sibling blocks) — preserves ergonomic single-namespace lookup for downstream `useTranslation('unified-kanban')` consumers
- All pre-existing keys preserved (verified: only additions, no overwrites; all 4 files parse as valid JSON)
- Arabic strings match handoff verbatim per CONTEXT.md D-13

### Task 3: 13 E2E spec stubs + commented CI gate — commit `f14cd1e8`

- Created 8 kanban-_.spec.ts + 5 calendar-_.spec.ts (all `test.describe.skip()` placeholders pointing at the activating Wave 1/2 plan)
- `kanban-dnd.spec.ts` includes `// SUPERSEDES kanban-drag-drop.spec.ts in 39-09 cleanup` per plan instruction
- Appended `PHASE_39_PATTERNS` (8 import patterns) + `PHASE_39_DELETED_FILES` (9 files including `my-work/board.tsx` per researcher A1) to `scripts/check-deleted-components.sh` as a fully-commented block — script still exits 0 today
- All 13 specs validated as parseable TypeScript via the tsc compiler API

## Verification Results

| Check                                                                                                                                                                                     | Result                             |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `pnpm test --run src/lib/i18n/__tests__/toArDigits.test.ts`                                                                                                                               | 10/10 passed in 598ms              |
| All 4 locale JSON files `JSON.parse` round-trip                                                                                                                                           | OK                                 |
| `bash scripts/check-deleted-components.sh`                                                                                                                                                | exits 0 (Phase 39 block commented) |
| TypeScript parse of 13 new specs (via `ts.createSourceFile`)                                                                                                                              | All 13 parse cleanly               |
| Required grep markers (`byStatus`, `بالحالة`, `{{count}} overdue`, `{{count}} متأخر`, `previousWeek`, `الأسبوع السابق`, `39-09 ACTIVATES`, `PHASE_39_DELETED_FILES`, `my-work/board.tsx`) | All present                        |

## Deviations from Plan

### Rule 3 (blocking-issue, auto-fixed)

**1. [Rule 3 - Blocking] pnpm filter `--filter frontend` did not match — workspace package is named `intake-frontend`**

- **Found during:** Task 1 verify step
- **Issue:** `pnpm --filter frontend test ...` returned "No projects matched the filters". Frontend `package.json` declares `"name": "intake-frontend"`, not `"frontend"`.
- **Fix:** Switched to `cd frontend && pnpm test ...` — runs the same vitest invocation against the workspace package. Test result was 10/10 pass.
- **Files modified:** None (test invocation strategy only)
- **Commit:** N/A (verification-only adjustment)

### Pre-existing issue logged for later (out of scope per SCOPE BOUNDARY rule)

**2. `frontend/playwright.config.ts` has an ESM `__dirname` reference bug**

- Running `pnpm exec playwright test --list` fails with `ReferenceError: __dirname is not defined in ES module scope at file://.../playwright.config.ts:21:36`
- This is a pre-existing bug, NOT caused by this plan's spec stubs. Verified the 13 new spec files themselves parse as valid TypeScript via the tsc compiler API.
- **Action:** Logged as deferred; should be fixed before plan 39-08/39-09 try to run E2E specs at scale. Recommend using `import.meta.url` + `fileURLToPath` to derive the directory in ESM context.

## Authentication Gates

None — Wave 0 is pure scaffold (no network, no auth surface).

## Threat Surface

No new trust boundaries introduced. T-39-00-MERGE-CORRUPT mitigation (parse + add keys + verify round-trip) was honored — JSON files were edited via inline merges into existing structured blocks, never via string concatenation, and validity was verified post-edit.

## Self-Check: PASSED

**Files verified to exist:**

- FOUND: frontend/src/pages/WorkBoard/index.ts
- FOUND: frontend/src/pages/WorkBoard/WorkBoard.tsx
- FOUND: frontend/src/pages/WorkBoard/KCard.tsx
- FOUND: frontend/src/pages/WorkBoard/BoardColumn.tsx
- FOUND: frontend/src/pages/WorkBoard/BoardToolbar.tsx
- FOUND: frontend/src/lib/i18n/toArDigits.ts
- FOUND: frontend/src/lib/i18n/**tests**/toArDigits.test.ts
- FOUND: 13 frontend/tests/e2e/{kanban,calendar}-\*.spec.ts
- FOUND: scripts/check-deleted-components.sh (with 39-09 ACTIVATES block)

**Commits verified to exist (`git log --oneline`):**

- FOUND: f5822860 — feat(39-00): scaffold WorkBoard barrel + toArDigits utility
- FOUND: 17daca6c — feat(39-00): extend unified-kanban + calendar i18n for Phase 39
- FOUND: f14cd1e8 — test(39-00): scaffold 13 skipped E2E specs + commented Phase 39 CI gate
