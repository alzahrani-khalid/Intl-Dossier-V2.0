---
phase: 87-linear-affordances
plan: 07
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

# Dependency graph
requires:
  - phase: 87-linear-affordances
    provides: 87-01 peekStore/usePeekPaging; 87-02 useListControls/FilterPopover/DisplayPopover/FilterChipsRow + list-controls i18n; 87-04 ListEmptyState; 87-06 countries/organizations template + lib/dossier-facet-count
provides:
  - Forums list wired with F23 peek + F24 Filter/Display popovers + F26 rich empty states (GenericListPage surface)
  - Working-groups list wired the same way; the working-groups-empty testid contract preserved
  - Topics list wired the same way (config-driven DisplayPopover sections in -TopicsListPage.tsx)
  - GenericListPage showSecondary/showStatus visibility props (default true) — Display-property toggles drive the secondary line + status chip
  - useForums/useWorkingGroups/useTopics threaded orderBy/filter params + facet-count head-count block
affects: [87-08-wiring, 87-09-kanban, 87-10-consolidated-signoff]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'GenericListPage gains showSecondary/showStatus props (default true → all existing consumers byte-identical); Display popover property toggles bind to them'
    - 'Same recipe as 87-06 countries template applied to 3 GenericListPage surfaces: parseListControlsSearch in validateSearch + useListControls + peek-on-click + Filter/Display popovers + ListEmptyState'
    - 'Topics keeps a private -TopicsListPage.tsx presentational component; index.tsx validateSearch threads cols via parseListControlsSearch(topicsListConfig)'
---

# 87-07 — Wire forums / working-groups / topics (F23/F24/F26)

## What shipped

Extended the 87-06 countries/organizations affordance recipe onto the three
`GenericListPage`-backed dossier surfaces (forums, working-groups, topics),
completing 5 of the 9 core list surfaces for Phase 87.

- **GenericListPage** gained `showSecondary` / `showStatus` visibility props
  (default `true` — every existing consumer renders byte-identically), wired so
  the F24 Display popover's property toggles hide/show the secondary line and the
  status chip.
- **Forums** (`forums/index.tsx`) + **working-groups**
  (`working_groups/index.tsx`): row click registers the peek store and opens the
  drawer; toolbar carries Filter + Display popovers with live counts, chips, URL
  persistence; `ListEmptyState` replaces the bare empty hint. The
  `working-groups-empty` testid contract is preserved.
- **Topics** (`topics/index.tsx` + private `-TopicsListPage.tsx`): same wiring;
  `validateSearch` threads `cols` through `parseListControlsSearch(topicsListConfig)`;
  DisplayPopover sections are config-driven (sort omitted where the API repo
  cannot honor it).
- **Hooks** `useForums` / `useWorkingGroups` / `useTopics` threaded
  `orderBy`/filter params into the `.order()` seam and carry the facet-count
  head-count block (working-groups' block is the facet-count precedent noted in
  the plan).

## Commits

- `ad4a4222` — GenericListPage showSecondary/showStatus visibility props (+ test)
- `db6dbc9d` — forums + working-groups F23/F24/F26 surfaces + hooks + i18n
- `644821ef` — topics F23/F24/F26 slice (sync-back completion, this reconciliation)

> Reconciliation note: `ad4a4222` and `db6dbc9d` were committed by the prior
> orchestrator run (workspace wH, now gone) without a SUMMARY, and the topics
> slice was left uncommitted in-flight. This run committed the passing topics
> slice as `644821ef` on `milestone/v9.0-drover` and authored this SUMMARY from
> git evidence — 87-07 was NOT re-executed.

## Self-Check: PASSED

- `openDossier|usePeekStore` present on all 3 surfaces (8 matches each incl. tests) ✓
- `DisplayPopover|FilterPopover` present on forums, working_groups, topics ✓
- `ListEmptyState` present on all 3 surfaces ✓
- `working-groups-empty` testid still emitted (`working_groups/index.tsx:240`) ✓
- GenericListPage `showSecondary`/`showStatus` props default true (lines 20/22/46/47) ✓
- Gates green on the topics completion slice: `tsc --noEmit` 0, `eslint --max-warnings 0` 0, `vitest src/routes/_protected/dossiers/topics` 3/3 ✓

---

_Phase: 87-linear-affordances_
_Completed: 2026-07-07 (topics slice + SUMMARY reconciled 2026-07-09)_
