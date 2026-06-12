---
phase: 64-new-position-from-dossier
plan: 04
subsystem: positions
tags: [react, tanstack-query, tanstack-router, sonner, tdd, dialog, positions, dossier-link]

# Dependency graph
requires:
  - phase: 64-new-position-from-dossier
    provides: NewPositionDialog form layer + skipped submit-flow tests d/e/f (64-03)
  - phase: 64-new-position-from-dossier
    provides: restored positions INSERT RLS policy — live creates return 201 on staging (64-01)
  - phase: 64-new-position-from-dossier
    provides: create_dialog + validation i18n keys, lookups, translateContent wrapper (64-02)
provides:
  - Complete two-step create→link submit in NewPositionDialog (positions-create, then applies_to dossier link)
  - Three honest outcome states — full success (close + dossier-scoped invalidations + success toast), partial failure (10s warning + Retry link), total failure (dialog stays open, input intact, error toast)
  - PositionDialog in AddToDossierDialogs.tsx as a thin NewPositionDialog wrapper — entry point 1 (Add-to-Dossier menu → Position) now works; broken payload eliminated
affects: [64-05-PLAN (DossierPositionsTab D-13 header rewire opens the same NewPositionDialog)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Two-step client submit with independent try/catch per step: create failure ≠ link failure (D-11 honesty — partial failure is a warning, never a clean success toast)'
    - 'Shared link helper (linkToDossier) carries the single link_type: applies_to literal, reused by both the initial step-2 path and the retry action — never an omitted link_type (the edge defaults to related_to)'
    - 'Dossier-scoped cache invalidation at the dialog (the original bug class): the mutation hooks only know global/inverse keys, so the tab (dossier-position-links) and overview (dossierOverviewKeys.detail) are invalidated here (R12-04 EventDialog precedent)'
    - 'Gut-to-wrapper: a broken in-file dialog is replaced by a thin render of the extracted component, keeping the original function name + props signature so the parent wiring stays untouched'

key-files:
  created: []
  modified:
    - frontend/src/components/positions/NewPositionDialog.tsx
    - frontend/src/components/positions/__tests__/NewPositionDialog.test.tsx
    - frontend/src/components/dossier/AddToDossierDialogs.tsx

key-decisions:
  - 'Single link_type: applies_to literal lives in a shared linkToDossier helper reused by both the submit step-2 and the retry action — satisfies the acceptance criterion (exactly one literal, both paths covered) and keeps the explicit link_type guarantee in one place'
  - 'Navigate target is /positions/$id with params { id } per the UI-SPEC/plan (the canonical detail/editor route); the route param is id, matching $id.tsx'
  - "EventDialog's own title_ar: '' (calendar-event payload) is left intact — it predates this plan, belongs to a sibling dialog, and is a legitimate empty-AR-title for calendar entries; only the position payload's broken title_ar: '' was removed"

requirements-completed: [POSNEW-01, POSNEW-02]

# Metrics
duration: ~14min
completed: 2026-06-12
---

# Phase 64 Plan 04: NewPositionDialog Submit Flow + Add-to-Dossier Rewire Summary

**Unskipped and implemented the two-step create→link submit in `NewPositionDialog` (positions-create, then the explicit `applies_to` dossier link), wired dossier-scoped cache invalidation and the three honest outcome states, then gutted the broken `PositionDialog` in `AddToDossierDialogs.tsx` into a thin `NewPositionDialog` wrapper — all six dialog tests GREEN, full frontend suite green, the broken payload eliminated.**

## Performance

- **Duration:** ~14 min
- **Tasks:** 2 (Task 1 TDD: RED unskip → GREEN implement; Task 2 gut-to-wrapper)
- **Files:** 0 created, 3 modified

## Accomplishments

- **Task 1 RED (`72ca87ff`):** Unskipped tests d/e/f and removed the 64-04 handoff comments. The file ran **3 failed / 3 passed / 0 skipped** against the `onSubmit` no-op stub — the submit-flow contract failing for the right reason.
- **Task 1 GREEN (`5b41557a`):** Implemented `onSubmit` as a two-step flow:
  - **Step 1:** `await createPosition.mutateAsync(values)` (the `@/domains/positions/hooks/useCreatePosition` mutation, which already invalidates `['positions','list']`). On throw: generic localized `toast.error(toast_error)`, dialog stays open with input intact, `submitting` reset, return (UI-SPEC state 10).
  - **Step 2 (own try/catch):** `linkToDossier(positionId)` → `createPositionDossierLink(positionId, { dossier_id, link_type: 'applies_to' })` — the single `applies_to` literal, never omitted (D-09/D-10, Pitfall 2).
  - **Full success:** `finishSuccess` awaits invalidation of `['dossier-position-links', dossierId]` (prefix), `dossierOverviewKeys.detail(dossierId)`, and the inverse `['position-dossier-links', positionId]` — with the R12-04-style comment explaining why the mutation hooks alone leave the tab + overview stale — then resets the form, calls `onClose`, and fires `toast.success(toast_success)` with an **Open position** action navigating to `/positions/$id`.
  - **Partial failure:** `form.reset()` + `onClose()` (re-submit would duplicate the position — UI-SPEC state 9), then `toast.warning(toast_partial_failure, { duration: 10000, action: { Retry link } })`; the retry re-calls `linkToDossier` → on success runs `finishSuccess`, on failure re-shows the same warning. Warning is never `toast.success`.
  - **In-flight:** submit shows `Loader2 me-2 animate-spin` while `submitting`; Cancel disabled; a `submitting` re-entrancy guard blocks double-submit.
  - Result: **6/6 GREEN**, `type-check` exit 0, ESLint clean.
- **Task 2 (`f73503ea`):** Replaced the entire `PositionDialog` form body in `AddToDossierDialogs.tsx` with a thin `return <NewPositionDialog isOpen onClose dossierContext isRTL />`. Kept the `PositionDialog` function name + `ActionDialogProps` signature (so the main-export wiring is untouched; `dossier` is now `_dossier`). Added the `NewPositionDialog` import; removed the two orphaned imports (`useCreatePosition` shim from `@/hooks/useCreatePosition`, `MessageSquare` icon). The broken payload (`position_type_id: dossierContext.dossier_id`, position `title_ar: ''`, `audience_groups: []`, no link write) is gone. Diff confined to the import block + the PositionDialog body (13 insertions / 84 deletions). `type-check` exit 0, ESLint clean, dialog tests still 6/6.

## Task Commits

1. **Task 1 RED: unskip submit-flow tests** — `72ca87ff` (test)
2. **Task 1 GREEN: implement two-step create→link submit** — `5b41557a` (feat)
3. **Task 2: gut PositionDialog into NewPositionDialog wrapper** — `f73503ea` (feat)

## Files Modified

- `frontend/src/components/positions/NewPositionDialog.tsx` — Added `useQueryClient`/`useNavigate`/`useCreatePosition` + repository link import + `dossierOverviewKeys`; replaced the `onSubmit` stub with the full two-step flow (`finishSuccess`, `linkToDossier`, `showPartialFailure`, `onSubmit`) and a `submitting` guard; submit button now renders the in-flight spinner.
- `frontend/src/components/positions/__tests__/NewPositionDialog.test.tsx` — Unskipped tests d/e/f, removed handoff comments (zero `it.skip`).
- `frontend/src/components/dossier/AddToDossierDialogs.tsx` — `PositionDialog` reduced to a thin `NewPositionDialog` wrapper; orphaned `useCreatePosition` + `MessageSquare` imports removed; `NewPositionDialog` import added.

## Decisions Made

- **One `applies_to` literal in a shared helper.** Both the initial step-2 link write and the retry action go through `linkToDossier`, which holds the single `link_type: 'applies_to'`. This satisfies the acceptance criterion (exactly one literal, both paths covered) and centralizes the explicit-link-type guarantee — there is no code path that calls `createPositionDossierLink` without it.
- **Navigate target `/positions/$id`.** Per the UI-SPEC and plan, the success toast's Open-position action navigates to `/positions/$id` with `params: { id: position.id }` — the canonical detail/editor route (`$id.tsx`, param `id`). `useNavigate` is mocked in the test, so only the type shape is exercised in CI; it type-checks against the route tree.
- **EventDialog `title_ar: ''` left intact.** The plan's `! grep -q "title_ar: ''"` gate is broader than its intent: the base commit had two such literals — the broken PositionDialog payload (L630, removed) and EventDialog's calendar-event payload (L737, a legitimate empty AR title for calendar entries). EventDialog is a sibling the plan forbids touching, so its line stays; the substantive criterion (the broken **position** payload is gone) is met.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restored the worktree dependency tree (`node_modules`)**

- **Found during:** Pre-execution environment check.
- **Issue:** The Claude Code worktree was spawned without `node_modules`, so `vitest`, `tsc`, `eslint`, and the pre-commit hook could not run.
- **Fix:** Ran `pnpm install --frozen-lockfile` at the worktree root — restored the EXISTING dependency tree from the committed lockfile (no new package, zero lockfile drift). Explicitly distinct from the prohibited install of a new dependency; no human-verify checkpoint applies.
- **Files modified:** None tracked (worktree-local `node_modules` only).
- **Committed in:** N/A (environment fix, no tracked file change).

**2. [Rule 3 - Blocking] Removed the orphaned `MessageSquare` import (Task 2)**

- **Found during:** Task 2 gutting.
- **Issue:** Replacing the PositionDialog form body removed the dialog's `<MessageSquare />` title icon — `MessageSquare` had no other usage in the file, so leaving the import would fail the no-unused-vars ESLint rule (error-level) and break the pre-commit lint-staged gate.
- **Fix:** Removed `MessageSquare` from the lucide-react import block. Verified `Loader2`/`Label`/`Input`/`Textarea` remain used by sibling dialogs (left untouched). This is within the plan's instruction to remove imports that gutting orphans.
- **Files modified:** `AddToDossierDialogs.tsx`.
- **Committed in:** `f73503ea`.

**Total deviations:** 2 auto-fixed (both blocking/cleanup). No architectural or design-direction change.

## Threat Surface

No new security surface. Per the plan threat model: the `applies_to` link write crosses to `positions-dossiers-create` v11, which enforces RLS + clearance server-side (403 on denial — round-12 battle-tested, T-64-10); the client only ever passes the context `dossier_id`. Partial failure is reported honestly as a warning with retry, never masked as success (T-64-11, test-pinned by test f). Server error bodies are stripped by the shared api-client, so the UI shows only generic localized copy (T-64-12). No package installs (T-64-SC).

## Verification Results

- **Task 1 RED:** `vitest run …NewPositionDialog.test.tsx` → **3 failed / 3 passed / 0 skipped** (submit-flow tests failing against the stub). `RED_CONFIRMED`.
- **Task 1 GREEN:** full file → **6 passed / 0 failed / 0 skipped**; zero `it.skip`. `pnpm type-check` exit 0; ESLint clean.
- **Acceptance grep:** exactly one `link_type: 'applies_to'` literal (shared helper); the single `createPositionDossierLink` call uses it; all three dossier-scoped invalidations present (`['dossier-position-links', dossierId]`, `dossierOverviewKeys.detail`, `['position-dossier-links', positionId]`); `toast.warning` present for partial failure.
- **Task 2:** `NewPositionDialog` imported + rendered; `position_type_id: dossierContext.dossier_id` gone; `@/hooks/useCreatePosition` shim import gone; main-export `<PositionDialog>` wiring unchanged (commonProps/isOpen/onClose intact). `pnpm type-check` exit 0; ESLint clean; diff confined to imports + PositionDialog body (13 ins / 84 del). Dialog tests still 6/6.
- **Wave-merge gate:** full frontend unit suite `pnpm exec vitest run` → **170 files passed / 4 skipped; 1283 tests passed / 0 failed / 25 todo**. The previously-skipped 3 submit-flow cases now pass (1280 → 1283). No regressions.

## Next Phase Readiness

- Plan 64-05 can open the same `NewPositionDialog` from `DossierPositionsTab` (D-13 header rewire — primary "Create position" → this dialog, secondary "Attach existing position" → existing `AttachPositionDialog`).
- The two-step create→link flow, dossier-scoped invalidation, and honest failure states are complete and unit-pinned; POSNEW-01/POSNEW-02 client contract done.
- No blockers.

## Self-Check: PASSED

- Files: `NewPositionDialog.tsx`, `__tests__/NewPositionDialog.test.tsx`, and `AddToDossierDialogs.tsx` all present on disk with the changes.
- Commits: `72ca87ff` (test), `5b41557a` (feat), `f73503ea` (feat) all verified in `git log`.

---

_Phase: 64-new-position-from-dossier_
_Completed: 2026-06-12_
