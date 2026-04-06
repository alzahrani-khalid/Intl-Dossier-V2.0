---
phase: 09-lifecycle-engine
plan: 05
subsystem: frontend-integration
tags: [lifecycle, engagement, intake, forum, kanban, integration]
dependency_graph:
  requires: [09-01, 09-02, 09-03, 09-04]
  provides: [lifecycle-page-integration, end-to-end-lifecycle-flows]
  affects: [EngagementDetailPage, TicketDetail, ForumDossierDetail, UnifiedKanbanCard]
tech_stack:
  added: []
  patterns: [component-wiring, hook-integration, lifecycle-stepper, intake-promotion]
key_files:
  created: []
  modified:
    - frontend/src/pages/engagements/EngagementDetailPage.tsx
    - frontend/src/pages/TicketDetail.tsx
    - frontend/src/components/dossier/ForumDossierDetail.tsx
    - frontend/src/components/unified-kanban/UnifiedKanbanCard.tsx
decisions:
  - Used EngagementListResponse.data for forum sessions (matches API response shape)
  - Placed stepper bar between header and tabs for maximum visual prominence
  - Added lifecycle timeline as collapsible section below tabs (collapsed on mobile)
  - Used engagement_status badge on forum session cards (lifecycle_stage not in list response)
metrics:
  duration: 10min
  completed: 2026-03-30
  tasks_completed: 1
  tasks_total: 2
  files_modified: 4
---

# Phase 09 Plan 05: Page Integration and Wiring Summary

Wire all lifecycle components into their host pages for end-to-end lifecycle engine functionality across engagement, intake, and forum flows.

## One-liner

Integrated LifecycleStepperBar + timeline into engagement detail, promotion dialog + banner into intake tickets, forum session creator + list into forums, and stage badge into kanban cards.

## Changes Made

### Task 1: Wire stepper + timeline + promotion + sessions + badge (b3ff9831)

**A. EngagementDetailPage.tsx**
- Imported `LifecycleStepperBar`, `LifecycleTimeline`, `useLifecycleTransition`, `useLifecycleHistory`
- Added lifecycle hooks for transition history and stage mutation
- Added `handleLifecycleTransition` callback wrapping `transitionStage` mutation
- Rendered `LifecycleStepperBar` below the sticky header, above tab navigation (visual anchor)
- Rendered `LifecycleTimeline` as collapsible section below tabs (collapsed on mobile, expanded on desktop)

**B. TicketDetail.tsx**
- Imported `IntakePromotionDialog`, `ConvertedTicketBanner`, `usePromoteIntake`
- Added promotion state (`promoteOpen`) and `handlePromote` callback with navigation to new engagement
- Rendered `ConvertedTicketBanner` at top of page when `ticket.convertedToId` is set
- Added "Promote to Engagement" button (visible when `requestType === 'engagement'` and not converted)
- Rendered `IntakePromotionDialog` connected to the promote mutation

**C. ForumDossierDetail.tsx**
- Imported `ForumSessionCreator`, `useCreateForumSession`, `useForumSessions`
- Added session state/hooks and `handleCreateSession` callback
- Enhanced schedule tab with "New Session" button at top
- Added forum session card list showing session name, status badge, and start date
- Each session card links to `/engagements/$engagementId` for independent lifecycle stepper
- Retained existing `MeetingSchedule` component below session list

**D. UnifiedKanbanCard.tsx**
- Imported `LIFECYCLE_STAGE_LABELS` and `LifecycleStage` type
- Added optional lifecycle stage badge between title and separator
- Badge renders only when `item.lifecycle_stage` is non-null
- Bilingual label using `LIFECYCLE_STAGE_LABELS[stage][isRTL ? 'ar' : 'en']`

### Task 2: Human verification checkpoint (PENDING)

Awaiting human verification of complete lifecycle engine end-to-end flows.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed forum session data access pattern**
- **Found during:** Task 1C
- **Issue:** Plan assumed `useForumSessions` returns `EngagementFullProfile[]` but it returns `EngagementListResponse` with `.data` field
- **Fix:** Used `forumSessionsData?.data ?? []` and accessed `EngagementListItem` fields directly (`name_en`, `name_ar`, `engagement_status`, `start_date`)
- **Files modified:** ForumDossierDetail.tsx
- **Commit:** b3ff9831

**2. [Rule 1 - Bug] Used engagement_status instead of lifecycle_stage on session cards**
- **Found during:** Task 1C
- **Issue:** `EngagementListItem` type does not include `lifecycle_stage` field
- **Fix:** Displayed `engagement_status` badge on forum session cards using existing `ENGAGEMENT_STATUS_LABELS`
- **Files modified:** ForumDossierDetail.tsx
- **Commit:** b3ff9831

## Known Stubs

None - all components are wired to real hooks and mutations that connect to the API layer.

## Verification

- TypeScript: No new errors in modified files (0 errors in EngagementDetailPage, TicketDetail, ForumDossierDetail, UnifiedKanbanCard)
- Pre-existing errors: 1654 (not introduced by this plan)
- Human verification: PENDING (Task 2 checkpoint)

## Self-Check: PASSED

All 4 modified files exist and compile. Commit b3ff9831 verified in git log.
