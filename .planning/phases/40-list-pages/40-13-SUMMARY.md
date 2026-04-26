---
plan_id: 40-13
phase: 40
phase_name: list-pages
status: SUCCESS
gaps_addressed: [G3, G7]
date: 2026-04-26
---

# Plan 40-13 Summary: Primitive Fixes for G3 Chevron + G7 data-loading Marker

## Objective

Two primitive-level fixes:

1. **G3:** Replace Tailwind `rotate-180` with inline `scaleX(-1)` transform on row chevrons so the computed transform matches `matrix(-1, 0, 0, 1, 0, 0)` and add `data-testid="row-chevron"` for spec selectors.
2. **G7-marker:** Add `data-loading` attribute on the `ListPageShell` root that flips `'true' → 'false'` when `isLoading` settles, enabling deterministic visual-spec waits.

## Outcome

SUCCESS. Both primitives landed; all list-page unit tests green (30/30).

## Files Modified

| File                                                    | Change                                                                                                                |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/components/list-page/DossierTable.tsx`    | Row chevron: `rotate-180` className → inline `style={{ transform: 'scaleX(-1)' }}`; added `data-testid="row-chevron"` |
| `frontend/src/components/list-page/GenericListPage.tsx` | Same pattern as DossierTable (in-scope per task1 sweep across `frontend/src/components/list-page/`)                   |
| `frontend/src/components/list-page/ListPageShell.tsx`   | Added `data-loading={isLoading ? 'true' : 'false'}` to outer `<section>` root                                         |

`frontend/tailwind.config.ts` was NOT modified — no config change was needed because we removed the `rotate-180` utility usage entirely from the list-page primitives.

## Verification

- ✅ `grep -rn "rotate-180" frontend/src/components/list-page/` → no matches (removed from both DossierTable and GenericListPage)
- ✅ `grep -rn "scaleX(-1)" frontend/src/components/list-page/` → 2 matches (DossierTable.tsx:110, GenericListPage.tsx:129)
- ✅ `grep -n "data-loading" frontend/src/components/list-page/ListPageShell.tsx` → 1 match at line 37
- ✅ Vitest list-page suite: **30/30 passed** (DossierTable 5, EngagementsList 7, GenericListPage 5, ListPageShell 6, PersonsGrid 7) in 1.05s
- ✅ Type-check: no errors in `list-page/*` files (pre-existing repo-wide TS6133/TS6196 unused-symbol warnings in `types/`, `utils/` are unrelated baseline noise)
- ✅ Lint: clean on all 3 modified files

## Truth Markers (must_haves)

- ✅ `Computed transform on row chevron is matrix(-1, 0, 0, 1, 0, 0) on RTL runs (scaleX(-1))` — inline style produces this matrix in computed CSS
- ✅ `ListPageShell root exposes data-loading='true' while loading, 'false' when ready` — wired directly to `isLoading` prop

## Downstream Unblocks

- **Wave 4 RTL E2E** (`list-pages-rtl.spec.ts`): G3 selector `[data-testid='row-chevron']` resolves; assertion `matrix(-1, 0, 0, 1, 0, 0)` will match.
- **Plan 40-17** (visual-baseline determinism): G7 marker enables `page.waitForSelector('[data-loading="false"]')` strategy.

## Deviations

None. Plan executed exactly as written. The task allowed extending the chevron pattern across all list-page components if `rotate-180` was found — `GenericListPage.tsx` was the only additional match and was updated using the same inline `scaleX(-1)` pattern.

## Blockers

None.
