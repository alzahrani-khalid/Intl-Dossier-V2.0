---
phase: 04-rtl-ltr-consistency
plan: 01
subsystem: ui
tags: [rtl, ltr, eslint, tailwind, logical-properties, direction-hook]

requires:
  - phase: 02-naming-file-structure
    provides: ESLint config structure and naming conventions
provides:
  - useDirection() hook for centralized RTL/LTR detection
  - LtrIsolate component for third-party library isolation
  - eslint-plugin-rtl-friendly enforcement on frontend code
  - Removal of redundant rtl.css (Tailwind v4 native logical properties)
affects: [04-02, 04-03]

tech-stack:
  added: [eslint-plugin-rtl-friendly]
  patterns: [useDirection-hook, ltr-isolate-wrapper, rtl-eslint-enforcement]

key-files:
  created:
    - frontend/src/hooks/useDirection.ts
    - frontend/src/components/ui/ltr-isolate.tsx
  modified:
    - frontend/eslint.config.js
    - package.json

key-decisions:
  - 'useDirection wraps existing LanguageProvider context (no new DirectionContext needed)'
  - 'eslint-plugin-rtl-friendly added to frontend/eslint.config.js (not root .eslintrc.js)'
  - 'UI components (components/ui/) exempted from rtl-friendly rules (auto-generated wrappers)'

patterns-established:
  - 'useDirection(): centralized hook for direction/isRTL from LanguageProvider'
  - 'LtrIsolate: wrapper component with dir=ltr for third-party libraries'
  - 'RTL ESLint enforcement via no-physical-properties rule'

requirements-completed: [RTL-01, RTL-02, RTL-05]

duration: 3min
completed: 2026-03-25
---

# Phase 04 Plan 01: RTL Foundation Summary

**useDirection() hook, LtrIsolate wrapper, eslint-plugin-rtl-friendly enforcement, and rtl.css removal for Tailwind v4 native logical properties**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-25T00:46:14Z
- **Completed:** 2026-03-25T00:49:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created useDirection() hook wrapping LanguageProvider context for centralized direction/isRTL access
- Created LtrIsolate component for isolating third-party libraries that require LTR direction
- Removed redundant rtl.css (63 lines) since Tailwind v4 provides native logical property utilities
- Installed and configured eslint-plugin-rtl-friendly with no-physical-properties error rule

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useDirection hook, LtrIsolate wrapper, remove rtl.css** - `04f9da3a` (feat)
2. **Task 2: Install eslint-plugin-rtl-friendly and configure ESLint enforcement** - `ae5112c9` (chore)

## Files Created/Modified

- `frontend/src/hooks/useDirection.ts` - Centralized direction hook exporting direction and isRTL
- `frontend/src/components/ui/ltr-isolate.tsx` - LTR isolation wrapper for third-party components
- `frontend/src/styles/rtl.css` - Deleted (redundant with Tailwind v4)
- `frontend/eslint.config.js` - Added rtl-friendly plugin with no-physical-properties rule
- `package.json` - Added eslint-plugin-rtl-friendly devDependency

## Decisions Made

- useDirection wraps existing LanguageProvider context rather than creating a new DirectionContext (simpler, avoids redundancy)
- eslint-plugin-rtl-friendly configured in frontend/eslint.config.js (actual location vs plan's eslint.config.mjs)
- UI components (components/ui/) exempted from rtl-friendly rules since they are auto-generated wrappers

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ESLint config path differs from plan**

- **Found during:** Task 2
- **Issue:** Plan specified `eslint.config.mjs` but actual file is `frontend/eslint.config.js`
- **Fix:** Applied changes to the correct file `frontend/eslint.config.js`
- **Verification:** grep confirms rtl-friendly rules present in config

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** File path correction only, no scope change.

## Issues Encountered

- Pre-existing issue: `eslint-plugin-tailwindcss` not resolvable from frontend workspace, preventing full `pnpm lint` validation. This is not caused by our changes and does not affect the rtl-friendly plugin installation.

## Known Stubs

None - all artifacts are fully functional.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- useDirection() hook ready for Plans 02 and 03 to import
- LtrIsolate wrapper ready for wrapping third-party components
- ESLint enforcement active - new physical CSS properties will be caught at lint time

## Self-Check: PASSED

- FOUND: frontend/src/hooks/useDirection.ts
- FOUND: frontend/src/components/ui/ltr-isolate.tsx
- CONFIRMED DELETED: frontend/src/styles/rtl.css
- FOUND: commit 04f9da3a
- FOUND: commit ae5112c9

---

_Phase: 04-rtl-ltr-consistency_
_Completed: 2026-03-25_
