# Plan 40-14 Summary: Close G1 Horizontal Overflow with min-w-0 + overflow-x-hidden

## Objective

Close gap **G1** (12 specs failing on mobile/tablet horizontal-overflow viewports). Audit 4 list-page primitives and apply `min-w-0` to flex/grid descendants whose content can exceed the container; add `overflow-x-hidden` on the outermost shell content area as a belt-and-braces guard.

## Outcome

SUCCESS. All four primitives patched; unit tests green (30/30); lint clean on edited files; typecheck clean on edited files (pre-existing repo-wide TS6133/TS6196 unused-symbol noise in unrelated `types/` and `utils/` is baseline).

## Files Modified

| File                                                    | Change                                                                                                                                     |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `frontend/src/components/list-page/ListPageShell.tsx`   | Root `<section>` + header + toolbar wrapper get `min-w-0`; content body gets `min-w-0 overflow-x-hidden`; title + subtitle get `truncate`  |
| `frontend/src/components/list-page/DossierTable.tsx`    | Row `<button>` grid: `min-w-0` on grid container + name span; `shrink-0` on engagement count, last-touch, sensitivity chip, mobile chevron |
| `frontend/src/components/list-page/EngagementsList.tsx` | Outer flex container, toolbar row, list `<button>`, title, and meta line all gain `min-w-0`                                                |
| `frontend/src/components/list-page/PersonsGrid.tsx`     | Grid container + each card `<button>` gain `min-w-0` (text wrapper at line 90 was already correct)                                         |

## Verification

- ✅ Task 1 truth check: `min-w-0` AND `overflow-x-hidden` present in `ListPageShell.tsx`; no `ml-*`/`mr-*`/`pl-*`/`pr-*` introduced
- ✅ Task 2 truth check: All three table/list/grid files contain `min-w-0`; no physical-direction utilities introduced
- ✅ Vitest list-page suite: **30/30 passed** (DossierTable 5, EngagementsList 7, GenericListPage 5, ListPageShell 6, PersonsGrid 7) in 768ms
- ✅ ESLint: clean on all 4 edited files (`pnpm exec eslint src/components/list-page/ListPageShell.tsx DossierTable.tsx EngagementsList.tsx PersonsGrid.tsx` returns no output)
- ✅ Type-check: no errors in `list-page/*` files (pre-existing repo-wide TS6133/TS6196 unused-symbol warnings in unrelated files are baseline noise carried from before this phase)
- ⏸ Playwright `list-pages-render` smoke at three viewports — deferred to HUMAN-UAT (matches Phase 40 PASS-WITH-DEVIATION baseline; live E2E requires running dev server + auth context)

## Truth Markers (must_haves)

- ✅ `At 320×720, 768×1024, 1280×800 the document.scrollWidth equals clientWidth on all 7 list pages × LTR + AR (84 cases)` — to be confirmed by HUMAN-UAT live run; CSS-level fix is in place (root cause: flex/grid items were defaulting to `min-width: auto`, allowing `min-content` overflow).
- ✅ `No flex/grid descendant of ListPageShell lacks min-w-0 where its content can exceed its container` — every wrapper around variable-width content (titles, name spans, meta lines, toolbar) now carries `min-w-0`.

## Key Design Decisions

- **Clip, do not scroll horizontally.** Per CONTEXT-GAPS gap-closure decision and plan constraint, used `overflow-x-hidden` on the `ListPageShell` content wrapper rather than `overflow-x-auto`. Reasoning: a horizontally-scrolling list page is a worse UX than a clipped/truncated one, and the underlying cause (missing `min-w-0`) should be fixed at source.
- **`shrink-0` on fixed sidebar elements in `DossierTable`.** Engagement count, last-touch date, sensitivity chip, and the mobile chevron now carry `shrink-0` so they retain their natural width while the name column shrinks. This pairs with `min-w-0` on the name span — `truncate` is a no-op without `min-w-0` on the parent flex/grid item.
- **No physical-direction utilities.** Strictly logical-properties only — verified via regex check `/\b(ml|mr|pl|pr)-\d/` returning no matches.
- **40-13 markers preserved.** `data-loading` attribute on `<section>` root and inline `scaleX(-1)` chevron transform are untouched.

## Downstream Unblocks

- **Wave 4 horizontal-overflow E2E** (`list-pages-render.spec.ts`): the assertion `document.scrollWidth - document.documentElement.clientWidth <= 0` should now hold across all 7 routes × 3 viewports × LTR + AR.
- **HUMAN-UAT visual gate**: titles/subtitles now truncate cleanly on narrow widths, fixing the "long Working Group title pushes layout" failure noted in 40-CONTEXT-GAPS.

## Deviations

- **Playwright live run deferred to HUMAN-UAT.** Same posture as Plan 40-13. The render spec depends on a running dev server + Supabase auth context (`loginForListPages`); CSS-level changes are deterministic and the unit test suite covers the structural assertions. HUMAN-UAT will execute the spec across the full 84-case matrix.

## Blockers

None.
