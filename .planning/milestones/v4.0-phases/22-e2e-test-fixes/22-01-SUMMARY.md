---
phase: 22-e2e-test-fixes
plan: 01
subsystem: e2e-tests
tags: [playwright, e2e, notifications, operations-hub, testids]
dependency_graph:
  requires: []
  provides: [test-trigger-endpoint, notification-testids, ops-zone-testids]
  affects: [05-notifications.spec.ts, 10-operations-hub.spec.ts]
tech_stack:
  added: []
  patterns: [test-only-endpoint-gating, data-testid-convention]
key_files:
  created:
    - backend/src/api/notifications.ts
  modified:
    - backend/src/api/index.ts
    - frontend/src/components/notifications/NotificationBadge.tsx
    - frontend/src/components/notifications/NotificationPreferences.tsx
    - frontend/src/pages/Dashboard/OperationsHub.tsx
    - tests/e2e/05-notifications.spec.ts
    - tests/e2e/10-operations-hub.spec.ts
    - tests/e2e/support/pages/NotificationsPage.ts
    - tests/e2e/support/pages/OperationsHubPage.ts
decisions:
  - Used sendInAppNotification service for test-trigger rather than direct DB insert
  - POM NotificationCategory type aligned with actual CATEGORIES constant from NotificationPreferences
  - Operations Hub spec tests zone ORDER per role instead of zone VISIBILITY
metrics:
  duration: 184s
  completed: 2026-04-09
  tasks_completed: 2
  tasks_total: 2
  files_changed: 9
---

# Phase 22 Plan 01: Fix E2E Test Specs (Notifications + Operations Hub) Summary

POST /api/notifications/test-trigger endpoint gated to non-production, data-testid attributes added to NotificationBadge, NotificationPreferences toggles, and OperationsHub zone wrappers, specs and POMs realigned with actual app architecture.

## Task Completion

| Task | Name                                                           | Commit   | Key Changes                                                                                       |
| ---- | -------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| 1    | Create test-trigger endpoint + notification testids + fix spec | edde3395 | New notifications.ts router, badge testid, per-toggle testids, POM category fix                   |
| 2    | Add ops-zone testids + fix Operations Hub spec/POM             | 5ac8c8f5 | Zone wrapper testids, route /operations->/dashboard, zone names realigned, order-based assertions |

## Changes Made

### Task 1: Notifications

- **Created** `backend/src/api/notifications.ts` with POST `/test-trigger` endpoint gated on `NODE_ENV !== 'production'` (threat T-22-01 mitigated)
- **Registered** route in `backend/src/api/index.ts` after `authenticateToken` middleware (threat T-22-02 mitigated)
- **Added** `data-testid="notification-unread-count"` to `NotificationBadge.tsx` span element
- **Added** `data-testid="notification-pref-${category}-${channel}"` to all 4 Switch components per category row in `NotificationPreferences.tsx`
- **Fixed** POM `NotificationCategory` type from `'work_item' | 'mention' | 'system'` to match actual CATEGORIES: `'assignments' | 'intake' | 'calendar' | 'signals' | 'mentions' | 'deadlines' | 'system' | 'workflow'`
- **Fixed** POM `NotificationChannel` type to include `'sound'`
- **Fixed** spec preference test from `'work_item'` to `'assignments'` category

### Task 2: Operations Hub

- **Added** `data-testid={`ops-zone-${zoneKey}`}` to zone wrapper divs in `OperationsHub.tsx`
- **Fixed** POM route from `/operations` to `/dashboard`
- **Fixed** POM `OperationsZone` type from `'intake' | 'queue' | 'in-progress' | 'review' | 'completed'` to `'attention' | 'timeline' | 'engagements' | 'stats' | 'activity'`
- **Fixed** POM `OperationsRole` type from `'admin' | 'analyst' | 'intake'` to `'leadership' | 'officer' | 'analyst'`
- **Added** `ZONE_ORDER` constant and `getZoneOrder()` helper to POM
- **Rewrote** spec to verify all 5 zones visible for all roles, with zone ORDER assertions per role instead of zone VISIBILITY assertions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed POM NotificationCategory mismatch**

- **Found during:** Task 1E
- **Issue:** POM had `'work_item' | 'mention' | 'system'` but actual app CATEGORIES are `'assignments' | 'intake' | 'calendar' | 'signals' | 'mentions' | 'deadlines' | 'system' | 'workflow'`
- **Fix:** Updated POM type and spec to use `'assignments'` instead of `'work_item'`
- **Files modified:** `tests/e2e/support/pages/NotificationsPage.ts`, `tests/e2e/05-notifications.spec.ts`
- **Commit:** edde3395

## Decisions Made

1. **sendInAppNotification over direct insert**: Used the existing service function for the test-trigger endpoint to maintain consistency with the notification pipeline
2. **Order-based assertions over visibility**: All roles see all 5 zones -- the differentiator is zone ordering, not zone visibility
3. **Category alignment**: Used actual CATEGORIES constant values from NotificationPreferences rather than the POM's original guesses

## Known Stubs

None -- all endpoints and testids are wired to real data sources.

## Threat Surface Scan

No new threat surfaces beyond those documented in the plan's threat model. T-22-01 (production gate) and T-22-02 (JWT auth) both mitigated as designed.

## Self-Check: PASSED

- All 9 files: FOUND
- Commit edde3395: FOUND
- Commit 5ac8c8f5: FOUND
