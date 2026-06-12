---
phase: 64-new-position-from-dossier
plan: 05
subsystem: positions
tags: [react, tanstack-query, i18n, dialog, positions, rtl, dossier-context]

# Dependency graph
requires:
  - phase: 64-new-position-from-dossier
    provides: NewPositionDialog form layer + NewPositionDialogProps contract (64-03)
  - phase: 64-new-position-from-dossier
    provides: dossier_tab.create_position relabel + dossier_tab.attach_existing key (64-02)
provides:
  - DossierPositionsTab D-13 rewire — primary "Create position" opens NewPositionDialog; secondary "Attach existing position" opens AttachPositionDialog
  - The live surface where POSNEW-02 "renders without refresh" is exercised (verification lands in 64-06)
affects:
  [
    64-06-PLAN (live verification of the create → invalidate → render-without-refresh path through this tab),
  ]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Cache-hit dossier context: useDossier(dossierId) reads the already-loaded dossierKeys.detail entry (zero extra network) to build DossierContextForAction with inheritance_source "direct"'
    - 'Conditional dialog render guard: NewPositionDialog mounts only once the dossier row is cached, so the context badge always has names/type'
    - 'Side-by-side honest actions (UI-SPEC recorded decision): default primary + outline secondary, not a dropdown menu'

key-files:
  created:
    - .planning/phases/64-new-position-from-dossier/64-05-SUMMARY.md
  modified:
    - frontend/src/components/positions/DossierPositionsTab.tsx

key-decisions:
  - 'dossier_type passed verbatim from useDossier (dossier-api DossierType) into DossierContextForAction (dossier-context.types DossierType) — the two unions are structurally identical (7 members), so the assignment is sound without a cast'
  - 'name_ar passed straight through: the dossiers Row types name_ar as non-null string, which is assignable to DossierContextForAction.dossier_name_ar (string | null)'
  - 'Both header buttons forced min-h-11 (touch-target floor + UI-SPEC parity) rather than relying on the Button size variant default'

requirements-completed: [POSNEW-02]

# Metrics
duration: ~12min
completed: 2026-06-12
---

# Phase 64 Plan 05: Positions Tab D-13 Rewire Summary

**The Positions tab's primary "Create position" button now opens `NewPositionDialog` instead of the mislabeled attach-existing dialog; attach-existing is demoted to a labeled secondary outline button. The create-dialog's dossier context is built from a `useDossier(dossierId)` cache hit (zero extra network) with `inheritance_source: 'direct'`, and the existing Promise.allSettled attach flow is preserved byte-for-byte.**

## Performance

- **Duration:** ~12 min
- **Tasks:** 2 (1 implementation, 1 verification gate)
- **Files:** 1 modified

## Accomplishments

- **Task 1 (`63d06442`, feat):** Rewired `DossierPositionsTab.tsx` per D-13 and the UI-SPEC §Positions tab header contract:
  - Imported `NewPositionDialog` (same-directory relative import, matching the file's style), `useDossier` (`../../domains/dossiers/hooks/useDossier`), and the `DossierContextForAction` type.
  - Added `showNewPositionDialog` state alongside the existing `showAttachDialog`; `handleCreatePosition` now sets `showNewPositionDialog(true)`. Added `handleAttachExisting` (sets `showAttachDialog(true)`) for the secondary action.
  - Built `dossierContext: DossierContextForAction | null` from the cached `useDossier(dossierId)` row — `dossier_id`, `dossier_type` (= `dossier.type`), `dossier_name_en`, `dossier_name_ar`, `inheritance_source: 'direct'`. The dialog renders only when `dossierContext` is non-null (the cache hit makes this practically immediate).
  - Extended the `useTranslation(['positions','common'])` destructure to include `i18n`; derived `isRTL = i18n.language === 'ar'` and passed it to the dialog.
  - Header: primary `Button` (default variant → `.btn-primary`) keeps `positions:dossier_tab.create_position` (now "Create position" via 64-02) and sits closest to reading start; added a secondary `Button variant="outline"` labeled `positions:dossier_tab.attach_existing` with an `aria-label`. Both `min-h-11`; wrapped in a logical `flex flex-col sm:flex-row gap-2` (no `ml/mr/pl/pr`).
  - Rendered `<NewPositionDialog isOpen onClose dossierContext isRTL />` near the existing `AttachPositionDialog`.
  - The `onAttach` Promise.allSettled block (partial-error toast + `['dossier-position-links', dossierId]` invalidation) is unchanged — `git diff` shows zero added/removed lines inside it.
- **Task 2 (verification gate, no commit):** Ran the wave-3 shared-surface gates — full frontend unit suite and CI-grade ESLint on the touched file. Both green.

## Task Commits

1. **Task 1: D-13 rewire (primary creates, secondary attaches; context from cache)** — `63d06442` (feat)
2. **Task 2: wave gate (full suite + targeted lint)** — no commit (verification only)

## Files Created/Modified

- `frontend/src/components/positions/DossierPositionsTab.tsx` (modified, +57 / -10) — D-13 rewire: two honest header buttons, `useDossier`-derived dossier context, `NewPositionDialog` render. The attach-existing flow is untouched.

## Decisions Made

- **`dossier_type` passed without a cast.** `useDossier` returns the `dossier-api` `DossierType`; `DossierContextForAction.dossier_type` expects the `dossier-context.types` `DossierType`. Both unions are structurally identical (country | organization | forum | engagement | topic | working_group | person), so the assignment type-checks cleanly without an `as` cast — verified by a green `pnpm type-check`.
- **`name_ar` passed straight through.** The `dossiers` table Row types `name_ar` as a non-null `string` (confirmed against `database.types.ts`), which is assignable to `DossierContextForAction.dossier_name_ar` (`string | null`). No null-coalescing needed.
- **Both buttons forced `min-h-11`.** Per the UI-SPEC touch-target floor and to match the sibling-button precedent, rather than depending on the `Button` size variant's `sm:`-conditional min-height.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restored the worktree dependency tree (`node_modules`)**

- **Found during:** Pre-execution environment check.
- **Issue:** The Claude Code worktree was spawned without `node_modules`, so `tsc`, `vitest`, `eslint`, and the pre-commit hook (build + lint-staged + knip) could not run.
- **Fix:** Ran `pnpm install --frozen-lockfile` at the worktree root — restored the EXISTING dependency tree from the committed lockfile (~14s, mostly hardlinked from the shared pnpm store, zero lockfile drift). This is explicitly distinct from the prohibited package-manager install of a NEW dependency; no new package name was introduced, so no human-verify checkpoint applies.
- **Files modified:** None tracked (worktree-local `node_modules` only; lockfile unchanged).
- **Committed in:** N/A (environment fix, no tracked file change).

**Total deviations:** 1 auto-fixed (1 blocking). No source or scope change beyond restoring the toolchain.

## Threat Surface

No new security surface. Per the plan threat model: the dossier context (id/type/names) comes from the RLS-filtered `dossierKeys.detail` cache, not user input, and renders via auto-escaped React text nodes (T-64-13, accept). The tab adds no write path of its own — all create/link writes go through `NewPositionDialog`'s edge functions with server-side validation + RLS (T-64-14, mitigate; satisfied by routing all writes through the dialog rather than adding a tab-local write). No package installs (T-64-SC, accept).

## Verification Results

- **Task 1 grep guards:** `NewPositionDialog`, `attach_existing`, `inheritance_source: 'direct'`, and `Promise.allSettled` all present in `DossierPositionsTab.tsx`. The onAttach flow is byte-identical (diff shows no added/removed lines inside it).
- **Task 1 type-check:** `cd frontend && pnpm type-check` → exit 0.
- **Task 1 dialog regression:** `vitest run …NewPositionDialog.test.tsx` → 3 passed / 3 skipped (the 3 skips are the staged 64-04 submit-flow cases; the imported component still mounts cleanly).
- **Task 2 full suite (wave-merge gate):** `pnpm exec vitest run` → **170 files passed / 4 skipped; 1280 tests passed / 3 skipped / 25 todo** — matches the 64-03 baseline exactly, zero regressions.
- **Task 2 targeted ESLint (CI-grade):** `pnpm exec eslint src/components/positions/DossierPositionsTab.tsx --max-warnings 0` → exit 0, clean.
- **Design-token / RTL grep:** no `ml-/mr-/pl-/pr-/text-left/text-right` added; header uses logical `flex`/`gap` only; no raw hex; no new button variant (default + outline are existing `Button` variants).

## Next Phase Readiness

- Plan 64-06 can now drive the live POSNEW-02 verification through this tab: open the dossier Positions tab → "Create position" → fill `NewPositionDialog` → on submit, the dialog's dossier-scoped invalidation (`['dossier-position-links', dossierId]`) makes the new position render without a manual refresh.
- No blockers. The attach-existing path is unchanged and continues to work.

## Self-Check: PASSED

- File: `frontend/src/components/positions/DossierPositionsTab.tsx` present on disk with the D-13 rewire.
- Commit: `63d06442` (feat) verified in `git log`.

---

_Phase: 64-new-position-from-dossier_
_Completed: 2026-06-12_
