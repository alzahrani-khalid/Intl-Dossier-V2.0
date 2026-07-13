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

## Final state — review fixes + operator-directed salvage (2026-07-09)

Three review findings from the drover review gate were fixed on top of the wiring
commits (`96666b3b` engagements peek head-count, `13aaed28` persons visible-Set memo +
debounced search, `56903e9b` EO server total + fetchPage), and one remaining finding was
fixed during the salvage:

- **`fix(87-08)` — type-filtered engagements now route through `search_engagements_advanced`.**
  The bucketed type filter used a direct PostgREST query whose `dossier:id (...)` embed is
  invalid (`id` is the FK column, not the `dossiers` relation), so PostgREST **400s** as soon
  as `type=meeting|travel|event` is selected. It also bypassed the RPC's archived-dossier
  exclusion and dossier-name search, so the peek total could disagree with the visible rows.
  The RPC's `p_engagement_type` is a single equality and **cannot express a bucket**
  (`meeting` = 4 `engagement_type` values), so migration
  `20260709180000_add_p_engagement_types_to_search_engagements_advanced.sql` adds
  `p_engagement_types TEXT[]` as a **strict superset** (`NULL` reproduces prior behavior;
  `p_engagement_type` retained — the `engagement-dossiers` edge function passes it).
  Both the bucketed rows **and** the exact head-count now come from that one RPC — a single
  predicate path, so the counter can never disagree with the rows. Deleted the divergent
  path: `fetchBucketedEngagementsPage`, the PostgREST query, `quoteOrValue`, `escapeLike`,
  and the `EngagementJoinedRow` embed shape.

### Migration verification (staging, via Supabase MCP)

- `fn_count = 1` after the atomic DROP+CREATE — no overload ambiguity.
- ACL unchanged (`anon`/`authenticated`/`service_role` EXECUTE); owner `postgres`; `STABLE`.
- Legacy 9-named-arg call (the edge function's shape) returns rows unaffected.
- `p_engagement_type := 'meeting'` → **0 rows** (reproduces the reported bug);
  `p_engagement_types := ARRAY[...meeting bucket...]` → rows returned.

### Gates (hand-run in the task worktree)

- `pnpm --dir frontend exec tsc --noEmit` → exit 0
- `pnpm --dir frontend lint --max-warnings 0` → exit 0 (incl. i18n, RTL, bootstrap-parity, date-format)
- `pnpm --dir frontend exec vitest run` over engagements/persons/EO/kanban + `useEngagementsInfinite.test.ts`
  → **10 files passed, 1 skipped; 82 tests passed, 6 todo**
- New hook tests pin the fix: they **pass on the fix and fail (2/5) on the pre-fix hook**.

### Provenance (honest)

P87-08 was **not** completed by a drover `task-done`. Two drover runs parked it `human`
(harness defects, not code): a consult-parse failure under `visibility.llm: pane`, and a
worker that ended trailer-less without committing. Each attempt's worktree reset destroyed
the prior attempt's work. This deliverable was recovered from dangling git objects
(`b895c430` codex chain → a3 fixes `96666b3b`/`13aaed28`/`56903e9b`) and completed manually
under an operator-directed salvage brief. The last review finding (`dossier:id` embed) was
re-implemented from scratch — the a4 fix that once existed was destroyed by a worktree reset.

---

_Phase: 87-linear-affordances_
_Completed: 2026-07-09_
