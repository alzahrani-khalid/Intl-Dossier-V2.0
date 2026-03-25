---
phase: 05-responsive-design
plan: 04
subsystem: frontend-dossier-pages
tags: [responsive, mobile-first, touch-targets, dossier, rtl]
dependency_graph:
  requires: [05-01, 05-02]
  provides: [responsive-dossier-list-pages, responsive-dossier-detail-pages]
  affects: [frontend/src/routes/_protected/dossiers/, frontend/src/components/Dossier/]
tech_stack:
  added: []
  patterns: [min-h-11-touch-targets, flex-col-sm-flex-row-stacking, responsive-padding]
key_files:
  created: []
  modified:
    - frontend/src/routes/_protected/dossiers/countries/index.tsx
    - frontend/src/routes/_protected/dossiers/organizations/index.tsx
    - frontend/src/routes/_protected/dossiers/forums/index.tsx
    - frontend/src/routes/_protected/dossiers/engagements/index.tsx
    - frontend/src/routes/_protected/dossiers/topics/index.tsx
    - frontend/src/routes/_protected/dossiers/persons/index.tsx
    - frontend/src/routes/_protected/dossiers/working_groups/index.tsx
    - frontend/src/components/Dossier/UniversalDossierCard.tsx
    - frontend/src/components/Dossier/DossierDetailLayout.tsx
    - frontend/src/routes/_protected/dossiers/countries/$id.tsx
    - frontend/src/routes/_protected/dossiers/organizations/$id.tsx
    - frontend/src/routes/_protected/dossiers/forums/$id.tsx
    - frontend/src/routes/_protected/dossiers/engagements/$id.tsx
    - frontend/src/routes/_protected/dossiers/topics/$id.tsx
    - frontend/src/routes/_protected/dossiers/persons/$id.tsx
    - frontend/src/routes/_protected/dossiers/working_groups/$id.tsx
decisions:
  - 7 dossier list pages already had table/card responsive split; enhanced with touch targets and stacking
  - elected_official type shares person list page; no separate route exists
metrics:
  duration: 10min
  completed: "2026-03-25T20:11:04Z"
  tasks: 2
  files: 16
---

# Phase 05 Plan 04: Dossier List + Detail Pages Responsive Pass Summary

Touch-target enforcement (min-h-11 44px) and mobile stacking across all 7 dossier list pages, 7 detail routes, shared DossierDetailLayout, and UniversalDossierCard.

## Task Results

### Task 1: Dossier list pages responsive pass (7 types)
**Commit:** bddc595c

All 7 dossier list pages (countries, organizations, forums, engagements, topics, persons, working_groups) updated:
- Create button: `min-h-11 min-w-11 w-full sm:w-auto`
- Search input: `min-h-11`
- View buttons in table rows: `min-h-11 min-w-11`
- Mobile card links: `p-3 sm:p-4 min-h-11`
- Pagination: `flex-col sm:flex-row` stacking with `min-h-11` buttons
- Page titles: `text-lg sm:text-xl lg:text-2xl font-semibold text-start`

UniversalDossierCard updated:
- View/Edit/More buttons: `min-h-11 min-w-11`
- Header padding: `p-3 sm:p-4`

### Task 2: Dossier detail pages responsive pass (7 types + shared layout)
**Commit:** 60102764

DossierDetailLayout (shared wrapper for all detail pages):
- Title: `text-lg sm:text-xl lg:text-2xl font-semibold text-start`
- Header buttons (Overview, Export): `min-h-11 min-w-11`
- Breadcrumb link: `min-h-11`
- Sidebar toggle: `min-h-11 min-w-11`

All 7 detail route error/wrong-type states:
- Action buttons: `min-h-11`
- Type mismatch buttons: `flex-col sm:flex-row` stacking

## Deviations from Plan

### Note: 7 types instead of 8
The plan references 8 dossier types, but `elected_official` does not have a separate list/detail route. It is handled via the person type routes. This is by design, not a gap.

## Known Stubs

None - all changes are CSS class additions to existing functional components.

## Verification

- `pnpm build` passes with zero errors after both tasks
- All 7 list pages contain `min-h-11` touch targets
- All detail pages have responsive layouts via DossierDetailLayout
- No physical CSS properties (`ml-*`, `mr-*`, `pl-*`, `pr-*`, `text-left`, `text-right`) in modified files
