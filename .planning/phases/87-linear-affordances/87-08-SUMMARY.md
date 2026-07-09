---
phase: 87-linear-affordances
plan: 08
subsystem: ui
tags:
  [
    react,
    tanstack-router,
    tanstack-query,
    zustand,
    i18n,
    peek-drawer,
    filter,
    display,
    empty-states,
    rtl,
    vitest,
  ]

requires:
  - phase: 87-linear-affordances
    provides: 87-01 peekStore/usePeekPaging; 87-02 useListControls/FilterPopover/DisplayPopover/FilterChipsRow; 87-04 ListEmptyState; 87-05 URL seams
provides:
  - Persons list wired with peek registration, Filter/Display popovers, chips, URL persistence, and rich filtered empty states
  - Engagements list wired with peek registration over the infinite window, exact head-count total, popover-folded type filter, and rich filtered empty states
  - Elected officials list wired with peek registration over the loaded client dataset, existing-dimension popovers, chips, URL persistence, and rich filtered empty states
  - useEngagementsInfinite total field backed by a count:'exact' head query plus bucket-aware typed pages
affects: [87-09-kanban, 87-10-consolidated-signoff]

tech-stack:
  added: []
  patterns:
    - 'Bespoke surfaces compose parseListControlsSearch in validateSearch, then feed useListControls through the route URL seam.'
    - 'Peek registrations use drawer URL params, with persons using queryClient.fetchQuery for neighbor pages and engagements adapting fetchNextPage.'
    - 'Engagement type buckets fetch typed Supabase pages only when the type filter is active; the unfiltered legacy repository path remains unchanged.'
---

# 87-08 - Bespoke surfaces F23/F24/F26 wiring

## What shipped

- **Persons**: added the honestly-scoped `importance` filter plus Display property toggles for role, organization, and VIP. Route row clicks register the loaded person window with `usePeekStore`, attach a `fetchPage` adapter through the existing persons query key, and open the shared drawer as `person`. The old bare empty text is now `ListEmptyState` with a filtered-empty branch and create CTA.
- **Engagements**: folded the old inline type pills into the Filter popover for the dossier route while preserving the primitive's legacy toolbar for direct tests. `useEngagementsInfinite` now exposes `total` from a parallel exact head-count query. When a type bucket is active, the hook fetches contiguous typed pages from Supabase so the peek counter and edge paging stay aligned with the filtered window. The page registers every loaded row across infinite pages and uses `fetchNextPage` at the loaded edge.
- **Elected officials**: replaced the local selects with route-owned ToolbarSearch, FilterPopover, DisplayPopover, and FilterChipsRow for the existing URL dimensions (`office_type`, `term`) and table properties (`party`, `district`, `country`). Desktop rows and mobile cards now open the shared drawer as `elected_official`; the table uses `ListEmptyState` for true-empty and filtered-empty states.
- **Support edits**: `EngagementsList` gained `showToolbar` and `visibleProperties` props so the route can fold the FilterPill row into the popover without breaking older direct usage. `list-controls` English/Arabic labels were extended for the new field and property names.

## Deviations from file scope

- `frontend/src/components/list-page/EngagementsList.tsx` - required to suppress the old inline engagement filter row on the dossier route and bind Display property visibility.
- `frontend/src/i18n/en/list-controls.json` - required to avoid raw list-control keys in the new popovers/chips.
- `frontend/src/i18n/ar/list-controls.json` - Arabic counterpart for the same visible labels.
- `.planning/phases/87-linear-affordances/87-08-SUMMARY.md` - required plan output.

## Verification

- `pnpm --dir frontend exec vitest run src/routes/_protected/dossiers/persons/__tests__/index.test.tsx` - 4 tests passed.
- `pnpm --dir frontend exec vitest run src/pages/engagements/__tests__/EngagementsListPage.test.tsx src/hooks/__tests__/useEngagementsInfinite.test.ts` - 13 tests passed.
- `pnpm --dir frontend exec vitest run src/routes/_protected/dossiers/persons src/pages/engagements src/components/elected-officials src/hooks` - 17 files passed, 1 skipped; 103 tests passed, 6 todo.
- `pnpm --dir frontend exec tsc --noEmit` - passed.
- `pnpm --dir frontend lint` - passed.
- Source checks: no `FilterPill` remains in `EngagementsListPage.tsx`; `count: 'exact', head: true` is present in `useEngagementsInfinite.ts`; `ListEmptyState` is wired on all three surfaces.

## Notes

- The elected-official drawer type was already accepted by the protected route validator and `useDossierDrawer`, so no validator expansion was needed.
- Facet counts were not added to these bespoke popovers because the available list-control surface renders correctly without them and the scoped data-layer capabilities differ by surface.

---

_Phase: 87-linear-affordances_
_Completed: 2026-07-09_
