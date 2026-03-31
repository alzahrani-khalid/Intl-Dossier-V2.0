---
phase: 12-enriched-dossier-pages
plan: 03
subsystem: api, ui
tags: [express, tanstack-query, tanstack-router, supabase-rpc, i18n, elected-officials, dossier-shell]

requires:
  - phase: 12-01
    provides: DossierShell, DossierTabNav, RelationshipSidebar, dossier-shell i18n, elected_official route segment

provides:
  - Express API router for elected officials CRUD via persons table
  - Elected official domain types, TanStack Query hooks
  - Elected officials list page with filterable data table
  - Detail page using DossierShell with 7 tabs (6 shared + Committees)
  - i18n namespace (en/ar) for elected officials
  - Navigation config entry for elected officials

affects: [12-04, 12-05, dossier-hub]

tech-stack:
  added: []
  patterns:
    - "persons-based elected official API — no separate table, uses person_subtype filter"
    - "search_persons_advanced RPC for list, get_person_full RPC for detail"
    - "DossierShell nested routes pattern with $id/ sub-routes for tabs"

key-files:
  created:
    - backend/src/api/elected-officials.ts
    - frontend/src/domains/elected-officials/types/elected-official.types.ts
    - frontend/src/domains/elected-officials/hooks/useElectedOfficials.ts
    - frontend/src/components/elected-officials/ElectedOfficialListTable.tsx
    - frontend/src/routes/_protected/dossiers/elected-officials/index.tsx
    - frontend/src/routes/_protected/dossiers/elected-officials/$id.tsx
    - frontend/src/routes/_protected/dossiers/elected-officials/$id/overview.tsx
    - frontend/src/routes/_protected/dossiers/elected-officials/$id/committees.tsx
    - frontend/src/routes/_protected/dossiers/elected-officials/$id/engagements.tsx
    - frontend/src/routes/_protected/dossiers/elected-officials/$id/docs.tsx
    - frontend/src/routes/_protected/dossiers/elected-officials/$id/tasks.tsx
    - frontend/src/routes/_protected/dossiers/elected-officials/$id/timeline.tsx
    - frontend/src/routes/_protected/dossiers/elected-officials/$id/audit.tsx
    - frontend/src/routes/_protected/dossiers/elected-officials/$id/index.tsx
    - frontend/src/i18n/en/elected-officials.json
    - frontend/src/i18n/ar/elected-officials.json
  modified:
    - backend/src/api/index.ts
    - frontend/src/components/layout/navigation-config.ts
    - frontend/src/i18n/index.ts

key-decisions:
  - "Backend queries persons table with person_subtype='elected_official' -- no separate elected_officials table"
  - "POST creates dossier with type='person' (not 'elected_official') per DB CHECK constraint"
  - "Detail layout passes dossierType='elected_official' for routing (maps to 'elected-officials' segment)"
  - "Used search_persons_advanced RPC for list queries (already supports p_person_subtype filter)"

patterns-established:
  - "Elected official as UI-first domain backed by persons table with subtype filter"

requirements-completed: [DOSS-08]

duration: 9min
completed: 2026-03-31
---

# Phase 12 Plan 03: Elected Officials Domain Summary

**Full elected officials domain with Express API querying persons table, list page with office/party/term filters, and DossierShell detail with 7 tabs including Committees**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-31T21:13:45Z
- **Completed:** 2026-03-31T21:23:01Z
- **Tasks:** 2
- **Files modified:** 19

## Accomplishments
- Backend Express router with CRUD for elected officials via persons table (search_persons_advanced + get_person_full RPCs)
- List page with filterable data table (office type, party, term status) and mobile card view
- Detail page using DossierShell with Committees extra tab rendering committee_assignments JSONB
- Domain types reflecting persons-based schema (type='person', person_subtype='elected_official')

## Task Commits

Each task was committed atomically:

1. **Task 1: Backend API + frontend domain (types, hooks, i18n) + navigation config** - `be581607` (feat)
2. **Task 2: Elected Officials list page + detail routes with Committees tab** - `99818247` (feat)

## Files Created/Modified
- `backend/src/api/elected-officials.ts` - Express router with GET list/detail, POST create, PATCH update
- `backend/src/api/index.ts` - Registered elected-officials router
- `frontend/src/domains/elected-officials/types/elected-official.types.ts` - Domain types with OfficeType, PartyIdeology, CommitteeAssignment
- `frontend/src/domains/elected-officials/hooks/useElectedOfficials.ts` - TanStack Query hooks (useElectedOfficials, useElectedOfficial)
- `frontend/src/components/elected-officials/ElectedOfficialListTable.tsx` - Data table with filters and pagination
- `frontend/src/routes/_protected/dossiers/elected-officials/index.tsx` - List page route
- `frontend/src/routes/_protected/dossiers/elected-officials/$id.tsx` - Detail layout with DossierShell
- `frontend/src/routes/_protected/dossiers/elected-officials/$id/overview.tsx` - Office, term, contact sections
- `frontend/src/routes/_protected/dossiers/elected-officials/$id/committees.tsx` - Committee assignments table
- `frontend/src/routes/_protected/dossiers/elected-officials/$id/{engagements,docs,tasks,timeline,audit}.tsx` - Shared tab stubs
- `frontend/src/i18n/en/elected-officials.json` - English translations
- `frontend/src/i18n/ar/elected-officials.json` - Arabic translations
- `frontend/src/components/layout/navigation-config.ts` - Added Elected Officials nav item
- `frontend/src/i18n/index.ts` - Registered elected-officials namespace

## Decisions Made
- Backend queries persons table with person_subtype='elected_official' -- there is no separate elected_officials table
- POST /api/elected-officials creates dossier with type='person' (per DB CHECK constraint) and person with person_subtype='elected_official'
- Detail layout passes dossierType='elected_official' to DossierShell for routing (getDossierRouteSegment maps to 'elected-officials')
- Used search_persons_advanced RPC for list queries (already supports p_person_subtype, p_office_type, p_party, p_is_current_term, p_country_id filters)

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

The shared tab routes (engagements, docs, tasks, timeline, audit) render placeholder text. These are intentional stubs that will be wired to real data when generic tab content components are built in later plans. The overview tab renders real data from the elected official's person record.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Elected officials domain is fully navigable with list and detail pages
- Ready for Wave 2 plans 04-05 (other enriched dossier pages)
- When merged with Plan 12-01 (DossierShell), all imports will resolve correctly

---
*Phase: 12-enriched-dossier-pages*
*Completed: 2026-03-31*
