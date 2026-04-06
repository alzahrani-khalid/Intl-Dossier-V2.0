---
phase: 11-engagement-workspace
plan: 02
subsystem: ui
tags: [react, popover, lifecycle, stepper, i18n, radix]

# Dependency graph
requires:
  - phase: 09-lifecycle-engine
    provides: lifecycle types, useLifecycleHistory/useLifecycleTransition hooks, transition API
provides:
  - Enhanced LifecycleStepperBar with popover summaries on completed stages
  - Transition interactions (immediate adjacent, note prompt non-adjacent)
  - Backward transition via revert button in popover
  - Loading state during mutation with spinner
affects: [11-engagement-workspace, engagement-detail-page]

# Tech tracking
tech-stack:
  added: []
  patterns: [popover-on-completed-stages, inline-note-prompt, revert-via-popover]

key-files:
  created: []
  modified:
    - frontend/src/components/engagements/LifecycleStepperBar.tsx
    - frontend/src/i18n/en/lifecycle.json
    - frontend/src/i18n/ar/lifecycle.json

key-decisions:
  - "Completed stages use Popover (not Tooltip) for rich transition summaries with revert action"
  - "Backward transitions accessible via Revert button inside completed stage popover, not via direct click"
  - "Adjacent forward transitions are immediate (no note), non-adjacent show inline note prompt"

patterns-established:
  - "Popover summary pattern: completed lifecycle stages show who/when/note/duration in a w-64 popover"
  - "Inline transition prompt: non-adjacent and backward transitions use an animated inline note area below the stepper"

requirements-completed: [WORK-02, WORK-03]

# Metrics
duration: 3min
completed: 2026-03-31
---

# Phase 11 Plan 02: Lifecycle Stepper Bar Enhancement Summary

**Interactive lifecycle stepper with popover summaries on completed stages and mutation-backed transition interactions for forward and backward stage changes**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-31T05:24:05Z
- **Completed:** 2026-03-31T05:27:19Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments
- Replaced Tooltip with Popover on completed stages showing transition details (who transitioned, when, note, time in stage)
- Added useLifecycleHistory and useLifecycleTransition hook integration for data fetching and mutations
- Adjacent forward transitions trigger immediately; non-adjacent show inline note prompt with cancel/confirm
- Backward transitions accessible via "Revert to this stage" button inside completed stage popover with destructive warning
- Loading spinner on confirm button during mutation via isPending state
- Added 6 new i18n keys in both English and Arabic (transitionedBy, timeInStage, revertToStage, transitionNote, confirmTransition, backwardWarning)

## Task Commits

Each task was committed atomically:

1. **Task 1: Enhance LifecycleStepperBar with popover summaries for completed stages** - `1c6c71ae` (feat)

## Files Created/Modified
- `frontend/src/components/engagements/LifecycleStepperBar.tsx` - Enhanced stepper with popovers for completed stages and transition dialogs for upcoming stages (283 lines)
- `frontend/src/i18n/en/lifecycle.json` - Added 6 new stepper i18n keys (English)
- `frontend/src/i18n/ar/lifecycle.json` - Added 6 new stepper i18n keys (Arabic)

## Decisions Made
- Used Popover (not Tooltip) for completed stages to allow rich content and interactive revert button inside
- Backward transitions require explicit "Revert to this stage" button click inside the popover rather than direct stage click, preventing accidental regression
- Adjacent forward transitions (1 step) are immediate without note prompt for faster workflow; non-adjacent transitions require explicit note prompt
- Used `transitionMutation.isPending` for loading state on confirm button with a CSS spinner (no external spinner component needed)
- Added `isRevert` state flag to differentiate backward from forward transitions, enabling destructive styling on confirm button

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added engagementId prop and hook-based data fetching**
- **Found during:** Task 1
- **Issue:** Plan specified `engagementId` prop but original component used `transitions` prop passed externally. Enhanced version needs to fetch data internally via hooks.
- **Fix:** Changed props interface to accept `engagementId` and call `useLifecycleHistory(engagementId)` and `useLifecycleTransition(engagementId)` internally, building a `transitionMap` via `useMemo`
- **Files modified:** frontend/src/components/engagements/LifecycleStepperBar.tsx
- **Verification:** Component properly imports and calls hooks, builds lookup map
- **Committed in:** 1c6c71ae

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Props interface change aligns with plan's specified interface. No scope creep.

## Issues Encountered
None

## Known Stubs
None - all data sources are wired to real hooks (useLifecycleHistory, useLifecycleTransition).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- LifecycleStepperBar is fully interactive and ready for integration into the Engagement Workspace layout (Plan 03+)
- Component accepts `engagementId` and manages its own data fetching and mutations
- All i18n keys present for bilingual support

---
*Phase: 11-engagement-workspace*
*Completed: 2026-03-31*
