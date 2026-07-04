---
phase: 83-token-debt-consolidation
plan: 01
subsystem: frontend
tags: [dead-code, deletion, token-debt, DEBT-07, DEBT-01, DEBT-02, DEBT-05]
requires: []
provides:
  - dead-ui-files-removed
  - timeline-dir-removed
  - vertical-timeline-dep-removed
  - debt-07-important-gate-closed
affects:
  - frontend/src/components/ui
  - frontend/src/components/timeline
  - frontend/package.json
tech-stack:
  added: []
  removed:
    - react-vertical-timeline-component
    - '@types/react-vertical-timeline-component'
  patterns:
    - 'per-file liveness re-grep before git rm'
    - 'per-phase regression guard block in check-deleted-components.sh'
key-files:
  deleted:
    - frontend/src/components/ui/background-boxes.tsx
    - frontend/src/components/ui/floating-dock.tsx
    - frontend/src/components/ui/animated-tooltip.tsx
    - frontend/src/components/ui/moving-border.tsx
    - frontend/src/components/ui/placeholders-and-vanish-input.tsx
    - frontend/src/components/ui/related-entity-carousel.tsx
    - frontend/src/components/ui/enhanced-progress.tsx
    - frontend/src/components/ui/chart.tsx
    - frontend/src/components/timeline/ (8 components + __tests__ + index.ts)
    - frontend/src/styles/vertical-timeline.css
    - frontend/src/App.css
  modified:
    - frontend/src/components/ui/COMPONENT_REGISTRY.md
    - scripts/check-deleted-components.sh
    - frontend/package.json
    - pnpm-lock.yaml
  kept-live:
    - frontend/src/components/ui/world-map.tsx
    - frontend/src/components/geographic-visualization/WorldMapVisualization.tsx
decisions:
  - "world-map chain is LIVE (routed via /geographic-visualization) — RESEARCH assumption was wrong; left in place per plan's STOP-on-real-importer rule"
  - 'Added a Phase-83 regression-guard block to check-deleted-components.sh (repo convention from Phases 34/36/39/52) to keep deletions durable'
metrics:
  tasks_completed: 2
  files_deleted: 20
  files_modified: 4
  files_kept_live: 2
  lines_removed: 5314
  duration_minutes: 18
  completed: 2026-07-04
---

# Phase 83 Plan 01: Dead-Code Deletion (Token-Debt Consolidation) Summary

Deleted 20 verified-dead frontend files (8 aceternity/shadcn `ui/` orphans + the entire `components/timeline/` dir + `vertical-timeline.css` + `App.css`) and dropped the `react-vertical-timeline-component` dependency — closing DEBT-07's `!important` row-height debt entirely via deletion and stripping ~35 hex / ~25 Tailwind literals / ~8 gradients out of the DEBT-01/02/05 inventories with zero render change. The `world-map` chain, which RESEARCH listed as dead, was found LIVE and preserved.

## What Was Built

### Task 1 — delete dead UI + timeline dir + registry bookkeeping (commit `ca13490a`)

Per-file liveness re-grep (`src` + `frontend/tests` + `tests` + `e2e`) run before every `git rm`. Confirmed zero-importer and deleted:

- 8 `components/ui/` files: `background-boxes`, `floating-dock`, `animated-tooltip`, `moving-border`, `placeholders-and-vanish-input`, `related-entity-carousel`, `enhanced-progress`, `chart`
- `components/timeline/` as a whole directory: 8 components + `__tests__/TimelineEventCard.test.tsx` + `index.ts` (partial-delete pitfall avoided — no test left importing a deleted component)
- `styles/vertical-timeline.css` (imported only by the deleted timeline components)
- `App.css` (Vite scaffold leftover, zero importers)

Bookkeeping: removed the 5 deleted aceternity rows + 2 deleted custom rows from `COMPONENT_REGISTRY.md` (kept `world-map` and the live look-alikes); added a Phase-83 regression-guard block to `scripts/check-deleted-components.sh` (import-pattern grep + file/dir presence checks) so the deletions cannot silently reappear.

### Task 2 — drop the npm dependency + full verification (commit `d7002b96`)

Removed `react-vertical-timeline-component` and `@types/react-vertical-timeline-component` from `frontend/package.json`; `pnpm install` regenerated `pnpm-lock.yaml` (47 lines removed, vertical-timeline entries gone). The full verification battery proves no dangling reference survived the deletion (Assumption A4 confirmed).

## Verification Results

- `pnpm --dir frontend type-check` — exit 0
- `pnpm --dir frontend build` — exit 0 (11.9s, no dangling-import failure)
- `pnpm --dir frontend exec vitest run` — 194 files passed / 4 skipped; 1452 tests passed / 1 skipped / 25 todo; exit 0
- `bash scripts/check-deleted-components.sh` — exit 0
- DEBT-07 gate `rg -n '(min-)?height:\s*[0-9]+px\s*!important' frontend/src/styles/` — 0 matches (vertical-timeline half CLOSED)
- Carve-out check `git diff --name-only | grep -E 'list-pages\.css|design-system/tokens|bootstrap\.js|src/types/'` — empty (D-83-09 carve-outs byte-untouched)
- `grep -c vertical-timeline frontend/package.json` / `pnpm-lock.yaml` — 0 / 0

## Deviations from Plan

### 1. [Rule 1 / plan STOP-directive] world-map chain is LIVE — not deleted

- **Found during:** Task 1 liveness re-grep (before any `git rm`)
- **Issue:** The plan's dead-list and RESEARCH §Dead Code Discovery marked `components/ui/world-map.tsx` + `components/geographic-visualization/WorldMapVisualization.tsx` as dead, asserting the live `/geographic-visualization` route "imports GeographicVisualizationPage, NOT this chain." The re-grep proved the opposite: `routes/_protected/geographic-visualization.tsx` (a real route in `routeTree.gen.ts`) renders `GeographicVisualizationPage`, which imports and renders `WorldMapVisualization` (line 15 + 114), which lazy-imports `@/components/ui/world-map` (line 18). The chain is fully live.
- **Action:** Per the plan's explicit rule ("If any liveness re-grep finds a REAL importer, STOP for that file, leave it in place, and record the deviation"), both files were left untouched. Not migrated here — token debt in this chain falls to the Wave-2 slice that owns `components/geographic-visualization/` and `components/ui/`.
- **Impact:** `world-map.tsx`'s hex/gradient/mask debt (RESEARCH row 2) is NOT closed by this plan; it remains for the owning Wave-2 slice. The task-1 automated verify command as written (`! rg ... WorldMapVisualization ...`) assumed this file was gone, so it was superseded by the corrected reality-based verification above.
- **Files kept:** `frontend/src/components/ui/world-map.tsx`, `frontend/src/components/geographic-visualization/WorldMapVisualization.tsx`
- **Commit:** n/a (no change made)

### 2. [Rule 2 / convention] Phase-83 regression guard added to check-deleted-components.sh

- **Found during:** Task 1 bookkeeping
- **Issue:** The plan asked to follow the check-deleted-components.sh convention if it requires deleted names to be registered. Phases 34/36/39/52 each add a per-phase block (import-pattern grep + file-presence guard); Phase 79 does not appear in the script.
- **Action:** Added a `PHASE_83_PATTERNS` / `PHASE_83_DELETED_FILES` block + a `components/timeline/` dir-presence guard, deliberately excluding `world-map` (kept live). Makes the deletions durable against reappearance via merge/regeneration.
- **Files modified:** `scripts/check-deleted-components.sh`
- **Commit:** `ca13490a`

## Known Stubs

None. This plan is pure deletion of unreferenced code — no new components, data sources, or placeholders introduced.

## Threat Flags

None. No new trust boundary, endpoint, auth path, file access, or schema change. Supply-chain surface shrank by one runtime + one types dependency (T-83-SC: accept — removal only).

## Self-Check: PASSED

- Deleted files confirmed absent: `ls frontend/src/components/timeline` errors; `App.css`, `vertical-timeline.css`, and all 8 ui files absent from disk.
- Kept-live files confirmed present: `world-map.tsx`, `WorldMapVisualization.tsx` on disk.
- Commits confirmed in `git log`: `ca13490a` (Task 1), `d7002b96` (Task 2).
- Carve-out paths byte-untouched (grep empty).
