---
phase: 87-linear-affordances
plan: 01
subsystem: ui
tags: [react, zustand, tanstack-router, i18n, peek-drawer, rtl, vitest]

# Dependency graph
requires:
  - phase: 41-dossier-drawer
    provides: DossierDrawer shell + DrawerHead + useDossierDrawer URL-param mounting
provides:
  - peekStore — ephemeral Zustand cross-tree peek registry (ordered id window + full total + pageOffset + fetchPage)
  - usePeekPaging — param-agnostic cross-page paging hook (position/total/canPrev/canNext/goPrev/goNext, edge prefetch)
  - useDossierDrawer.pageDossier — replace:true sibling swap (no history spam per step)
  - DrawerHead peek counter (mono, dir=ltr) + chevron-up/down buttons
  - dossier-drawer:peek.{counter,prev,next} i18n keys (en+ar, Latin digits)
affects: [87-06, 87-07, 87-08, 87-09, list-page-peek-wiring, commitment-drawer-peek]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Cross-tree pub-sub via a tiny ephemeral Zustand store (peekStore) — the _protected-mount coordination channel, mirrors useCopilotDrawer'
    - 'Param-agnostic paging hook: navigateToId injected so the same hook serves ?dossier= and (later) ?commitment='
    - 'Per-page promise-map dedup so a background prefetch and a click never double-fetch'

key-files:
  created:
    - frontend/src/store/peekStore.ts
    - frontend/src/store/__tests__/peekStore.test.ts
    - frontend/src/hooks/usePeekPaging.ts
    - frontend/src/hooks/__tests__/usePeekPaging.test.tsx
  modified:
    - frontend/src/hooks/useDossierDrawer.ts
    - frontend/src/hooks/__tests__/useDossierDrawer.test.tsx
    - frontend/src/components/dossier/DossierDrawer/DrawerHead.tsx
    - frontend/src/components/dossier/DossierDrawer/DossierDrawer.tsx
    - frontend/src/components/dossier/DossierDrawer/__tests__/DrawerHead.test.tsx
    - frontend/src/i18n/en/dossier-drawer.json
    - frontend/src/i18n/ar/dossier-drawer.json

key-decisions:
  - 'Cross-page paging (RESEARCH Open Q1): counter total is the FULL filtered count; goNext at the loaded edge fetches the neighbor page + prefetches within 2 rows — NOT page-bounded chevrons'
  - 'peekStore is ephemeral (NO persist) and cleared by DossierDrawer on close so a non-list open (dashboard widget, deep link) shows no counter'
  - 'DrawerHead extracts the close button into a local element so the no-peek head is byte-identical to pre-87 rendering'

patterns-established:
  - 'Peek registry channel: list page register({ids,type,total,pageOffset,fetchPage,pageSize}); drawer reads via usePeekPaging'
  - "Icon-button recipe reused verbatim for chevrons: plain <button className='btn-ghost'> + i18n aria-label + data-testid (HeroUI Button banned — filterDOMProps drops aria)"

requirements-completed: [AFF-01]

# Metrics
duration: 17 min
completed: 2026-07-07
---

# Phase 87 Plan 01: Peek-paging foundation Summary

**A cross-tree Zustand peek registry + a param-agnostic cross-page paging hook + a DrawerHead mono `3 / 15` counter with chevron-up/down paging — the DossierDrawer is now peek-capable with zero behavior change when no list registered a window.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-07-07T09:48:31Z
- **Completed:** 2026-07-07T10:05:51Z
- **Tasks:** 3
- **Files modified:** 11 (4 created, 7 modified)

## Accomplishments

- **peekStore** (`store/peekStore.ts`): ephemeral Zustand registry — ordered id window, FULL filtered `total`, `pageOffset`, optional `fetchPage`/`pageSize`, with `register` (wholesale replace), `extendWindow` (append/prepend + pageOffset shift), `clear`, and null-safe `positionOf`/`canPrev`/`canNext` where `canNext` is TRUE across the loaded window edge (cross-page). No persist middleware — the Wave-0 VALIDATION.md gap is closed.
- **usePeekPaging** (`hooks/usePeekPaging.ts`): 1-based `position` + `total` + `canPrev`/`canNext` derived from the registry; `goNext`/`goPrev` navigate in-window synchronously, fetch+extend+navigate across the page edge, and background-prefetch within 2 rows of the edge — all deduped through a per-page promise map. Param-agnostic via an injected `navigateToId` (87-09 reuses it for CommitmentDrawer's `?commitment=`).
- **useDossierDrawer.pageDossier**: the `openDossier` reducer with `replace: true` (no history entry per peek step). `openDossier` (replace:false) and `closeDossier` semantics untouched.
- **DrawerHead**: mono, `dir="ltr"`, Latin-digit counter (inline span, not the block-level LtrIsolate) + `ChevronUp`/`ChevronDown` `.btn-ghost` buttons with i18n aria-labels, boundary `disabled`+`aria-disabled`, rendered only when a pageable window exists. **DossierDrawer** feeds it `usePeekPaging` and clears the registry on close.
- **i18n**: `peek.counter`/`peek.prev`/`peek.next` added to both `en` and `ar` `dossier-drawer.json` (counter identical Latin-digit template both locales per digit policy D).

## Task Commits

Each task committed atomically:

1. **Task 1: peekStore registry with position math + tests** — `b2b3d99c` (feat, TDD)
2. **Task 2: useDossierDrawer.pageDossier + usePeekPaging cross-page hook** — `f6ef813d` (feat, TDD)
3. **Task 3: DrawerHead counter + chevrons, DossierDrawer wiring, peek i18n** — `d7d6ef15` (feat)

## Files Created/Modified

- `store/peekStore.ts` — cross-tree peek registry (created)
- `store/__tests__/peekStore.test.ts` — 6 cases: position math, boundary + cross-page disable, window extension, clear, wholesale replace (created)
- `hooks/usePeekPaging.ts` — cross-page paging hook + edge prefetch (created)
- `hooks/__tests__/usePeekPaging.test.tsx` — 7 cases incl. fetch-once prefetch + rejection safety (created)
- `hooks/useDossierDrawer.ts` — added `pageDossier` (replace:true) to the interface + return
- `hooks/__tests__/useDossierDrawer.test.tsx` — additive `pageDossier` case; existing open/close cases unchanged
- `components/dossier/DossierDrawer/DrawerHead.tsx` — optional peek props + counter/chevron render
- `components/dossier/DossierDrawer/DossierDrawer.tsx` — usePeekPaging wiring + clear-on-close effect
- `components/dossier/DossierDrawer/__tests__/DrawerHead.test.tsx` — 3 additive peek cases; mock `t` interpolates `peek.counter`
- `i18n/en/dossier-drawer.json`, `i18n/ar/dossier-drawer.json` — `peek.*` keys

## Decisions Made

- **Cross-page over page-bounded** (RESEARCH Open Q1, per recommendation): the counter denominator is the full filtered count and the neighbor page is fetched on demand + prefetched at the edge. Page-bounded chevrons were explicitly not acceptable.
- **canPrev/canNext live on the store** (not duplicated in the hook): the store owns the global position→boundary math, the hook subscribes — keeps the Task-1 test the single lock on boundary logic and avoids DRY drift.
- **Byte-identical no-peek head**: the close button is extracted to a local element and rendered directly (not wrapped) when `position == null`, so the pre-87 DrawerHead DOM is preserved when no list registered a window.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Guarded in-window index access for `noUncheckedIndexedAccess`**

- **Found during:** Task 2 (usePeekPaging)
- **Issue:** `navigateToId(store.ids[targetGlobal - store.pageOffset])` failed `tsc --noEmit` (TS2345) — under `noUncheckedIndexedAccess` the indexed access is `string | undefined`.
- **Fix:** Captured into `const inWindowId` and guarded `if (inWindowId !== undefined)` in both `goNext` and `goPrev` in-window branches (the cross-page branch already had the equivalent guard).
- **Files modified:** frontend/src/hooks/usePeekPaging.ts
- **Verification:** `tsc --noEmit` exit 0; all 7 usePeekPaging cases still green.
- **Committed in:** `f6ef813d` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — strict-index typing).
**Impact on plan:** Type-safety fix internal to the hook; no behavior or scope change.

## Issues Encountered

- **`replace: true` grep nuance (Task 2 acceptance):** `useDossierDrawer.ts` now contains two `replace: true` occurrences — the pre-existing `closeDossier` and the new `pageDossier`. The plan's acceptance ("exactly one `replace: true` reducer **for paging**") is satisfied: the paging reducer is exactly one (`pageDossier`), `openDossier` stays `replace: false`, and `closeDossier`'s `replace: true` is pre-existing and is not a paging reducer. A naive `grep -c "replace: true"` returns 2 by design.
- **AFF-01 left Pending, NOT marked complete:** the plan frontmatter declares `requirements: [AFF-01]` and `gsd-sdk requirements.mark-complete AFF-01` initially flipped it to Complete, but AFF-01 is the end-to-end user capability ("open a list row … page … without leaving the list"). This plan only builds the drawer-side foundation — the plan objective explicitly states list pages register during Wave 2 (87-06..09). AFF-01 is a multi-plan requirement (declared by 87-01/05/06/07/08/09/10); the flip was reverted so the ledger stays truthful, and a downstream list-wiring plan (or phase verification) will mark it complete when the capability actually ships.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The drawer is peek-capable but **inert until Wave-2 list pages call `usePeekStore.register(...)` on row-click** (87-06..87-09). No list behavior changed this plan.
- `usePeekPaging` is param-agnostic — 87-09 can reuse it for the CommitmentDrawer by injecting a `?commitment=`-writing `navigateToId`.
- Verification: `tsc --noEmit` exit 0, `pnpm --dir frontend lint` exit 0 (eslint + i18n parity + rtl + bootstrap + date guards), 12 test files / 108 tests green.

## Self-Check: PASSED

- Key files exist on disk: `peekStore.ts`, `usePeekPaging.ts`, both test files — confirmed.
- `git log --grep="87-01"` returns 3 task commits (b2b3d99c, f6ef813d, d7d6ef15).
- All task `<acceptance_criteria>` re-run and pass (vitest per-task, no `persist(`, tsc 0, lint 0, i18n parity, 9/9 DossierDrawer suite files).
- Plan `<verification>` re-run: combined vitest (12 files / 108 tests) exit 0, tsc exit 0, lint exit 0.

---

_Phase: 87-linear-affordances_
_Completed: 2026-07-07_
