---
phase: 12-enriched-dossier-pages
plan: 01
subsystem: ui
tags: [react, tanstack-router, i18n, dossier, sidebar, tabs, rtl]

requires:
  - phase: 11-engagement-workspace
    provides: WorkspaceShell and WorkspaceTabNav patterns to mirror

provides:
  - DossierShell layout wrapper for all 8 dossier type detail pages
  - DossierTabNav URL-driven tab navigation with 6 base tabs and extraTabs support
  - RelationshipSidebar with tier grouping, collapse toggle, quick-add, and mobile sheet
  - dossier-shell i18n namespace (en/ar) with tab, sidebar, empty state, and error keys
  - elected_official route mapping in dossier-routes.ts
  - Wave 0 test stubs for 4 core Phase 12 components (25 todo tests)

affects: [12-02, 12-03, 12-04, 12-05]

tech-stack:
  added: []
  patterns:
    - DossierShell mirrors WorkspaceShell sticky header + tab + sidebar pattern
    - Tier-grouped relationship sidebar with Strategic/Operational/Informational classification
    - localStorage-persisted sidebar open/closed state

key-files:
  created:
    - frontend/src/components/dossier/DossierShell.tsx
    - frontend/src/components/dossier/DossierTabNav.tsx
    - frontend/src/components/dossier/RelationshipSidebar.tsx
    - frontend/src/i18n/en/dossier-shell.json
    - frontend/src/i18n/ar/dossier-shell.json
    - frontend/src/components/dossier/__tests__/DossierShell.test.tsx
    - frontend/src/components/dossier/__tests__/DossierTabNav.test.tsx
    - frontend/src/components/dossier/__tests__/RelationshipSidebar.test.tsx
    - frontend/src/components/elected-officials/__tests__/ElectedOfficialListTable.test.tsx
  modified:
    - frontend/src/i18n/index.ts
    - frontend/src/lib/dossier-routes.ts

key-decisions:
  - "Used AdaptiveDialog (not AlertDialog) for remove confirmation -- project has no AlertDialog component"
  - "Used BottomSheet (vaul-based) for mobile sidebar -- project has no Sheet component"
  - "Relationship tier classification maps all 20+ relationship types to 3 tiers"
  - "DossierShell accepts mobileOpen/onMobileClose props for RelationshipSidebar sheet control"

patterns-established:
  - "DossierShell pattern: sticky header + DossierTabNav + flex content area + RelationshipSidebar"
  - "DossierTabConfig type: {key, labelKey, path} for type-specific extra tabs"
  - "Tier classification: Strategic (bilateral, partnership, cooperation), Operational (member, participant, host), Informational (related, discusses, affiliate)"

requirements-completed: [DOSS-01, DOSS-02, DOSS-09, DOSS-10]

duration: 11min
completed: 2026-04-01
---

# Phase 12 Plan 01: Shared Dossier Shell Components Summary

**DossierShell, DossierTabNav, and RelationshipSidebar with tier grouping, collapse toggle, quick-add popover, mobile bottom sheet, i18n namespace, and elected_official route mapping**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-31T20:58:54Z
- **Completed:** 2026-03-31T21:10:16Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- DossierShell layout wrapper with sticky header, breadcrumbs, presence indicators, export, AddToDossierMenu, and mobile relationships trigger
- DossierTabNav with 6 base tabs (overview, engagements, docs, tasks, timeline, audit), extraTabs prop, URL-driven active state via useMatchRoute, auto-scroll, and ARIA roles
- RelationshipSidebar with 3-tier grouping (Strategic/Operational/Informational), expand/collapse toggle with icon strip, quick-add popover via DossierSelector, remove confirmation dialog, and mobile BottomSheet
- Wave 0 test stubs: 25 todo tests across 4 files ensuring Nyquist compliance

## Task Commits

Each task was committed atomically:

1. **Task 0: Wave 0 test stubs** - `02b224d1` (test)
2. **Task 1: DossierShell + DossierTabNav + i18n + dossier-routes** - `2d76af34` (feat)
3. **Task 2: RelationshipSidebar** - `53e48df9` (feat)

## Files Created/Modified

- `frontend/src/components/dossier/DossierShell.tsx` - Layout wrapper for dossier detail pages
- `frontend/src/components/dossier/DossierTabNav.tsx` - URL-driven tab navigation with 6 base tabs
- `frontend/src/components/dossier/RelationshipSidebar.tsx` - Tier-grouped sidebar with collapse, quick-add, mobile sheet
- `frontend/src/i18n/en/dossier-shell.json` - English i18n strings for dossier shell
- `frontend/src/i18n/ar/dossier-shell.json` - Arabic i18n strings for dossier shell
- `frontend/src/i18n/index.ts` - Registered dossier-shell namespace
- `frontend/src/lib/dossier-routes.ts` - Added elected_official mapping, exported isValidDossierType
- `frontend/src/components/dossier/__tests__/DossierShell.test.tsx` - 7 todo test stubs
- `frontend/src/components/dossier/__tests__/DossierTabNav.test.tsx` - 6 todo test stubs
- `frontend/src/components/dossier/__tests__/RelationshipSidebar.test.tsx` - 6 todo test stubs
- `frontend/src/components/elected-officials/__tests__/ElectedOfficialListTable.test.tsx` - 6 todo test stubs

## Decisions Made

- Used AdaptiveDialog instead of AlertDialog for remove confirmation (project has no AlertDialog component)
- Used BottomSheet (vaul-based drawer) for mobile relationship sidebar (project has no Sheet component)
- Relationship tier classification maps 20+ relationship types into 3 tiers (Strategic, Operational, Informational) for grouping
- DossierShell manages mobile sheet state and passes mobileOpen/onMobileClose props to RelationshipSidebar

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used AdaptiveDialog instead of AlertDialog**
- **Found during:** Task 2 (RelationshipSidebar)
- **Issue:** Plan specified AlertDialog import, but project has no AlertDialog component
- **Fix:** Used AdaptiveDialog which exists in components/ui/ and provides equivalent functionality
- **Files modified:** frontend/src/components/dossier/RelationshipSidebar.tsx
- **Verification:** TypeScript compiles without errors

**2. [Rule 3 - Blocking] Used BottomSheet instead of Sheet**
- **Found during:** Task 2 (RelationshipSidebar)
- **Issue:** Plan specified Sheet from components/ui/sheet.tsx, but project has BottomSheet (vaul-based)
- **Fix:** Used BottomSheet with BottomSheetContent/Header/Title/Description subcomponents
- **Files modified:** frontend/src/components/dossier/RelationshipSidebar.tsx
- **Verification:** TypeScript compiles without errors

---

**Total deviations:** 2 auto-fixed (2 blocking -- component substitution)
**Impact on plan:** Both substitutions use equivalent project components. No scope creep.

## Issues Encountered

- DossierWithExtension type does not have a `.dossier` property -- it IS the dossier directly. Fixed by removing nested access.
- ExportDossierDialog requires `DossierType` (not `string`) for `dossierType` prop -- fixed with type cast.

## Known Stubs

None -- all components are fully implemented with real data hooks. Test stubs are intentional Wave 0 `.todo()` placeholders.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- DossierShell, DossierTabNav, and RelationshipSidebar are ready for consumption by Plans 02-05
- All 8 dossier type routes can now import DossierShell and pass type-specific tabConfig
- DossierTabConfig type exported for use in route layout files
- i18n namespace registered with all tab, sidebar, empty state, and error keys

---
*Phase: 12-enriched-dossier-pages*
*Completed: 2026-04-01*
