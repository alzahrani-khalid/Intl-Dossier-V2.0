---
phase: 13-feature-absorption
plan: 01
subsystem: ui
tags: [analytics, kpi, dashboard, dossier-overview, react, i18n]

requires:
  - phase: 12-enriched-dossier-pages
    provides: Overview tabs with SharedSummaryStatsCard grid pattern
  - phase: 10-operations-hub
    provides: OperationsHub with ZoneCollapsible layout and role-adaptive zones
provides:
  - KpiCard reusable component for metric display
  - AnalyticsWidget dashboard zone with 4 KPI cards
  - DossierAnalyticsCard with type-specific metrics for all 7 dossier overview tabs
  - useAnalyticsForDossier hook for per-dossier analytics
affects: [13-02, 13-03, 13-04, 13-05]

tech-stack:
  added: []
  patterns: [KPI card pattern with trend indicators, per-dossier-type analytics extraction]

key-files:
  created:
    - frontend/src/components/analytics/KpiCard.tsx
    - frontend/src/pages/Dashboard/components/AnalyticsWidget.tsx
    - frontend/src/components/analytics/DossierAnalyticsCard.tsx
    - frontend/src/domains/analytics/hooks/useAnalyticsForDossier.ts
  modified:
    - frontend/src/pages/Dashboard/OperationsHub.tsx
    - frontend/src/pages/dossiers/CountryOverviewTab.tsx
    - frontend/src/pages/dossiers/OrganizationOverviewTab.tsx
    - frontend/src/pages/dossiers/TopicOverviewTab.tsx
    - frontend/src/pages/dossiers/ForumOverviewTab.tsx
    - frontend/src/pages/dossiers/WorkingGroupOverviewTab.tsx
    - frontend/src/pages/dossiers/PersonOverviewTab.tsx
    - frontend/src/pages/dossiers/ElectedOfficialOverviewTab.tsx
    - frontend/public/locales/en/operations-hub.json
    - frontend/public/locales/ar/operations-hub.json
    - frontend/public/locales/en/dossier.json
    - frontend/public/locales/ar/dossier.json

key-decisions:
  - "Used operations-hub i18n namespace for dashboard KPI keys instead of creating new dashboard.json (follows existing namespace pattern)"
  - "Used existing useDossierOverview hook for DossierAnalyticsCard data instead of creating new API endpoint (avoids backend changes)"
  - "Placed AnalyticsWidget as standalone zone above role-ordered zones for consistent visibility across all roles"

patterns-established:
  - "KpiCard: reusable metric card with value + label + optional trend arrow"
  - "DossierAnalyticsCard: type-switched analytics extraction from shared overview data"

requirements-completed: [ABSORB-01]

duration: 7min
completed: 2026-04-02
---

# Phase 13 Plan 01: Analytics Absorption Summary

**KPI summary widgets on dashboard (4-card grid) and type-specific analytics cards on all 7 dossier overview tabs, replacing standalone analytics page**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-02T18:15:33Z
- **Completed:** 2026-04-02T18:22:48Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments
- Dashboard shows KPI overview zone (Total Dossiers, Active Engagements, Upcoming Deadlines, Open Work Items) as first zone in OperationsHub
- All 7 dossier overview tabs display type-tailored analytics cards with metrics relevant to each dossier type
- Full i18n coverage for both EN and AR in operations-hub and dossier namespaces
- Loading, error, and empty states handled for all analytics components

## Task Commits

Each task was committed atomically:

1. **Task 1: Create KpiCard and AnalyticsWidget components for dashboard** - `3cf8475d` (feat)
2. **Task 2: Add context-specific analytics cards to all 7 dossier overview tabs** - `f4e74e61` (feat)

## Files Created/Modified
- `frontend/src/components/analytics/KpiCard.tsx` - Single KPI metric card with value, label, trend indicator
- `frontend/src/pages/Dashboard/components/AnalyticsWidget.tsx` - 4 KPI cards in responsive 2/4-col grid
- `frontend/src/components/analytics/DossierAnalyticsCard.tsx` - Per-type analytics card for overview tabs
- `frontend/src/domains/analytics/hooks/useAnalyticsForDossier.ts` - Hook extracting type-specific metrics from dossier overview data
- `frontend/src/pages/Dashboard/OperationsHub.tsx` - Added AnalyticsWidget as first ZoneCollapsible zone
- `frontend/src/pages/dossiers/CountryOverviewTab.tsx` - Added DossierAnalyticsCard (country)
- `frontend/src/pages/dossiers/OrganizationOverviewTab.tsx` - Added DossierAnalyticsCard (organization)
- `frontend/src/pages/dossiers/TopicOverviewTab.tsx` - Added DossierAnalyticsCard (topic)
- `frontend/src/pages/dossiers/ForumOverviewTab.tsx` - Added DossierAnalyticsCard (forum)
- `frontend/src/pages/dossiers/WorkingGroupOverviewTab.tsx` - Added DossierAnalyticsCard (working_group)
- `frontend/src/pages/dossiers/PersonOverviewTab.tsx` - Added DossierAnalyticsCard (person)
- `frontend/src/pages/dossiers/ElectedOfficialOverviewTab.tsx` - Added DossierAnalyticsCard (elected_official)
- `frontend/public/locales/en/operations-hub.json` - KPI labels and analytics states
- `frontend/public/locales/ar/operations-hub.json` - Arabic KPI labels and analytics states
- `frontend/public/locales/en/dossier.json` - Analytics metric labels for all dossier types
- `frontend/public/locales/ar/dossier.json` - Arabic analytics metric labels

## Decisions Made
- Used operations-hub i18n namespace for dashboard KPI keys instead of creating new dashboard.json files (plan referenced non-existent files; this follows the existing namespace pattern)
- Used existing useDossierOverview hook data for DossierAnalyticsCard instead of creating a new API endpoint (avoids backend changes; data already available from shared hook)
- Placed AnalyticsWidget as standalone zone above role-ordered zones for consistent visibility across all roles

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] i18n file paths corrected**
- **Found during:** Task 1 (KPI widget creation)
- **Issue:** Plan referenced `frontend/src/i18n/locales/en/dashboard.json` and `frontend/src/i18n/locales/ar/dashboard.json` -- these paths do not exist. i18n files are at `frontend/public/locales/{lang}/`
- **Fix:** Added KPI and analytics keys to existing `operations-hub.json` namespace (used by OperationsHub) instead of creating non-existent dashboard.json files
- **Files modified:** `frontend/public/locales/en/operations-hub.json`, `frontend/public/locales/ar/operations-hub.json`
- **Committed in:** `3cf8475d` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Corrected file path to match actual project structure. No scope creep.

## Issues Encountered
- TypeScript compilation could not be verified (tsc not available in worktree -- dependencies not installed). Code follows existing patterns exactly and uses typed props throughout.

## Known Stubs
None -- all components are wired to real data sources via useAnalyticsDashboard and useAnalyticsForDossier hooks.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Analytics absorption complete -- dashboard and dossier overview tabs now surface analytics in context
- Ready for Plan 02 (AI briefing absorption) and other Wave 1 plans
- KpiCard component reusable for future dashboard enhancements

## Self-Check: PASSED

- All 4 created files verified on disk
- Both task commits (3cf8475d, f4e74e61) verified in git log

---
*Phase: 13-feature-absorption*
*Completed: 2026-04-02*
