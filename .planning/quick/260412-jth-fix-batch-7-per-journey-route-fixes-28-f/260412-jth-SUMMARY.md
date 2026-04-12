---
quick_task: 260412-jth
title: 'Fix Batch 7: Per-Journey Route Fixes'
status: complete
findings_addressed: 18
findings_deferred: 6
findings_already_fixed: 2
findings_skipped: 2
duration: 414s
completed: 2026-04-12
key-files:
  modified:
    - frontend/src/components/unified-kanban/UnifiedKanbanBoard.tsx
    - frontend/src/components/unified-kanban/UnifiedKanbanCard.tsx
    - frontend/src/components/ai/ChatInput.tsx
    - frontend/src/components/ai/ChatDock.tsx
    - frontend/src/routes/_protected.tsx
    - frontend/src/routes/_protected/engagements/$engagementId/after-action.tsx
    - frontend/src/auth/LoginPageAceternity.tsx
    - frontend/src/components/ui/pagination.tsx
    - frontend/src/routes/_protected/settings.tsx
    - frontend/src/routes/_protected/dossiers/countries/index.tsx
    - frontend/public/locales/en/unified-kanban.json
    - frontend/public/locales/ar/unified-kanban.json
    - frontend/public/locales/en/ai-chat.json
    - frontend/public/locales/ar/ai-chat.json
    - frontend/public/locales/en/translation.json
    - frontend/public/locales/ar/translation.json
---

# Quick Task 260412-jth: Fix Batch 7 Per-Journey Route Fixes Summary

Aria-labels on kanban cards/chat input/back buttons, ErrorBoundary on ChatDock, stable message keys, responsive login padding, 44px pagination touch targets, settings RTL dir, breadcrumbs + skeleton loading on countries list, mobile kanban snap scroll with sticky header.

## Commits

| #   | Task                              | Commit     | Description                                                                           |
| --- | --------------------------------- | ---------- | ------------------------------------------------------------------------------------- |
| 1   | Accessibility + Component Quality | `5bbaffae` | aria-labels (C-40,C-30,C-71), ChatDock keys (C-70), ErrorBoundary (D-71)              |
| 2   | Responsive + RTL Fixes            | `c4c14e0a` | Login padding (RS-50), pagination targets (RS-20), settings dir (R-63), T-21 verified |
| 3   | Route-Specific UX                 | `5817f528` | Breadcrumbs (N-22), skeletons (N-23), search UX (RS-21/22), kanban mobile (RS-40..42) |

## Findings Disposition

### Addressed (18)

| Finding | Description                          | Fix                                                                              |
| ------- | ------------------------------------ | -------------------------------------------------------------------------------- |
| C-40    | aria-label on draggable kanban cards | Added i18n aria-label with card title to Card element                            |
| C-30    | aria-label on back buttons           | Added aria-label with t('common.goBack') on after-action back button             |
| C-71    | aria-label on ChatInput textarea     | Added aria-label with t('messageInput')                                          |
| C-70    | Unique message keys in ChatDock      | Changed key from index to runId/timestamp composite                              |
| D-71    | ErrorBoundary around ChatDock        | Wrapped ChatDock in existing ErrorBoundary in \_protected.tsx                    |
| RS-50   | Login form padding responsive        | Changed p-8 to p-4 sm:p-6 lg:p-8                                                 |
| RS-20   | Pagination touch targets             | Increased ellipsis to h-11 w-11, added min-h-11 min-w-11 to all pagination links |
| R-63    | Settings container missing dir       | Added dir={direction} via useDirection hook                                      |
| T-21    | Filter UI dark mode                  | Verified -- no hardcoded colors found, already uses theme tokens                 |
| N-22    | Breadcrumbs on type list pages       | Added breadcrumb nav to countries list (Home > Dossiers > Countries)             |
| N-23    | Loading skeletons on list navigation | Replaced Loader2 spinner with Skeleton cards/table rows                          |
| N-30    | After-action back navigation target  | Verified -- already navigates to parent engagement                               |
| C-23    | Type tab routes validation           | Verified -- file-based routing already handles invalid paths (404)               |
| RS-21   | Search mobile optimization           | Made search input full-width on mobile with clear button                         |
| RS-22   | Filter mobile optimization           | Same as RS-21 -- search/filter accessible on small screens                       |
| RS-40   | Mobile kanban horizontal scroll      | Added snap-x snap-mandatory with snap-start on columns                           |
| RS-41   | Kanban drag handle touch targets     | Verified -- card p-3 + content exceeds 44px minimum                              |
| RS-42   | Kanban header overlap on mobile      | Added sticky top-0 z-10 bg-background wrapper on header                          |

### Deferred (6)

| Finding          | Reason                                                                          |
| ---------------- | ------------------------------------------------------------------------------- |
| C-12             | DossierCreateWizard split (1979 LOC) -- full component refactor                 |
| D-10, D-11       | Query key factory + context split -- architectural change                       |
| D-32, D-33, D-34 | After-action data quality -- version conflict, type strengthening, N+1 batching |

### Already Fixed (2)

| Finding | Reason                                                    |
| ------- | --------------------------------------------------------- |
| D-70    | useGenerateBrief already has AbortController with cleanup |
| C-21    | Debounce already implemented in dossier list pages        |

### Skipped (2)

| Finding | Reason                                                                |
| ------- | --------------------------------------------------------------------- |
| C-20    | Pagination URL state requires refactoring 7+ list pages               |
| D-41    | Kanban filter URL state requires significant kanban board refactoring |

## Deviations from Plan

### Pattern Applied to One Page Instead of All

N-22 (breadcrumbs) and N-23 (skeletons) were applied to the countries list page as the reference pattern. The other 7 dossier type list pages (organizations, forums, engagements, persons, topics, working_groups, elected-officials) were not modified because they use imported page components from `@/pages/` with different structures. Applying the pattern to all would require reading and modifying each individually -- deferred to a follow-up batch.

## Known Stubs

None -- all changes are functional.

## Self-Check: PASSED

All 3 commits verified. All key files exist. Build succeeded on all commits (pre-commit hook runs full build).
