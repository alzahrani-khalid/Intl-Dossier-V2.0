---
phase: 85-linear-taste-refinements-f16-f21
plan: 02
subsystem: ui
tags: [settings, navigation, rtl, i18n, tanstack-router, linear-design]

# Dependency graph
requires:
  - phase: 77-linear-migration
    provides: Linear token ladder (--ink-faint, --surface-raised) + single-direction engine
  - phase: 84-copy-marketing-voice
    provides: sentence-case / no-marketing-voice copy rules honored by new i18n strings
provides:
  - F18 — global Sidebar suppressed on /settings so the settings sub-nav is the single nav column
  - F18 — "Back to app" return link atop SettingsNavigation with RTL-flipping chevron
  - F20 — settings sections grouped under three muted uppercase headers (Account / Privacy & access / Connected)
affects: [settings, app-shell, settings-render-signoff]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Route-conditional shell chrome via the existing useRouterState pathname (no new hook)
    - Collapse a freed grid rail to 0px (lg:grid-cols-[0px_1fr]) rather than restructuring the grid
    - Grouped nav constant (NAV_GROUPS) with a flatMap'd backward-compat export (NAV_ITEMS)

key-files:
  created: []
  modified:
    - frontend/src/components/layout/AppShell.tsx
    - frontend/src/components/settings/SettingsNavigation.tsx
    - frontend/src/i18n/en/settings.json
    - frontend/src/i18n/ar/settings.json
    - frontend/src/components/settings/__tests__/SettingsLayout.test.tsx

key-decisions:
  - 'Suppressed BOTH Sidebar mounts (desktop aside + mobile drawer) off one isSettingsRoute flag and collapsed the desktop rail to 0px so content fills the freed space'
  - 'Used TanStack useNavigate for the back link (real SPA nav) over a full-reload <a href>, and stubbed useNavigate in the bare-render settings test to keep it router-agnostic'
  - 'Default buckets Account / Privacy & access / Connected (4/3/2) — pending user confirmation at the consolidated render sign-off'

patterns-established:
  - "Route-conditional chrome: derive isSettingsRoute = pathname.startsWith('/settings') from the existing useRouterState read; gate mounts off it"
  - 'Grouped sub-nav: NAV_GROUPS source of truth + NAV_ITEMS = NAV_GROUPS.flatMap(g => g.sections) for legacy consumers'

requirements-completed: [TASTE-03, TASTE-05]

# Metrics
duration: ~10min
completed: 2026-07-05
---

# Phase 85 Plan 02: Settings single-nav + grouped sub-nav Summary

**F18 suppresses the global sidebar on /settings (single nav column + RTL-correct "Back to app" link) and F20 groups the nine settings sections under three muted Linear-style headers.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-07-05T08:09Z
- **Completed:** 2026-07-05T08:15Z
- **Tasks:** 2 auto (of 3; Task 3 is an orchestrator-deferred human-verify gate)
- **Files modified:** 5

## Accomplishments

- On /settings the global `<Sidebar/>` no longer mounts (desktop aside + mobile drawer both gated), leaving the SettingsLayout 240px sub-nav as the single nav column; the freed 16rem desktop rail collapses to 0px so content fills it.
- A ghost "Back to app" `Button` sits atop `SettingsNavigation`, navigating to `/` via TanStack `useNavigate`; its chevron points inline-start and flips in RTL (`!isRTL && 'rotate-180'`, logical `ms-*`/`me-*`).
- The flat 9-section list is regrouped into `NAV_GROUPS` under three muted headers (`text-[10px] font-semibold tracking-[0.1em] uppercase text-[var(--ink-faint)]`) — Account (4) / Privacy & access (3) / Connected (2) — preserving canonical R-02 order and the `NAV_ITEMS` export.
- New `backToApp` + `navGroups.*` keys added to both en and ar `settings.json` (no EN-fallback leakage).

## Task Commits

Each task was committed atomically:

1. **Task 1: F18 — suppress global Sidebar on /settings** - `8ae4b2a6` (fix)
2. **Task 2: F18+F20 — back-to-app link + grouped sections** - `6d8ac4ed` (fix)

**Plan metadata:** committed separately (docs: complete plan)

## Files Created/Modified

- `frontend/src/components/layout/AppShell.tsx` - Derives `isSettingsRoute` from the existing pathname; gates both Sidebar mounts and collapses the desktop grid rail to 0px on /settings.
- `frontend/src/components/settings/SettingsNavigation.tsx` - Adds the `useNavigate`-driven back link and restructures `SECTIONS` into `NAV_GROUPS` with muted headers; `NAV_ITEMS` now flatMaps the groups.
- `frontend/src/i18n/en/settings.json` - Adds `backToApp` + `navGroups.{account,privacyAccess,connected}`.
- `frontend/src/i18n/ar/settings.json` - Arabic parity for the same keys.
- `frontend/src/components/settings/__tests__/SettingsLayout.test.tsx` - Stubs `useNavigate` so the bare (routerless) renders stay green.

## Decisions Made

- **Grid-rail collapse over restructure:** rather than rework the AppShell grid or the children's `col-start-2` offsets, `lg:grid-cols-[16rem_1fr]` swaps to `lg:grid-cols-[0px_1fr]` on /settings — content fills the freed space with zero churn to topbar/classif/main.
- **Real SPA nav for the back link:** `useNavigate({ to: '/' })` (matching the `TaskDetailPage` idiom) instead of a full-reload `<a href="/">`, which would re-run auth + refetch — a quality regression in a taste phase.
- **Default buckets (4/3/2):** Account / Privacy & access / Connected, per the plan default. User bucket/label confirmation belongs to the deferred render sign-off.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Stubbed useNavigate in the settings test**

- **Found during:** Task 2 (back-to-app link)
- **Issue:** `SettingsNavigation` now calls `useNavigate`, which throws without a RouterProvider; the existing `SettingsLayout.test.tsx` renders the component bare, so all 8 tests would have failed.
- **Fix:** Added a hoisted `vi.mock('@tanstack/react-router', …)` that spreads the real module and overrides `useNavigate` with a `vi.fn()` stub. The section-list assertions are router-agnostic, so behavior coverage is unchanged.
- **Files modified:** frontend/src/components/settings/**tests**/SettingsLayout.test.tsx
- **Verification:** `pnpm test --run src/components/settings` → 8/8 pass.
- **Committed in:** `6d8ac4ed` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The test stub was required to keep the touched-area suite green after introducing router-based navigation; no scope creep, no production-behavior change.

## Issues Encountered

- **Prettier hook reformatted the test file** on the Task 2 commit (collapsed multi-line `render(...)` calls to single lines) — cosmetic, committed as-is.
- The `check-i18n-namespaces.mjs` script lives at repo root (`scripts/`), not `frontend/scripts/`; ran it from the repo root — exit 0 (1676 files scanned, 126 namespaces).

## Automated Verification (honest results)

- `cd frontend && pnpm type-check` → **exit 0**
- `pnpm test --run src/components/settings` → **8/8 pass** (1 file)
- `node scripts/check-i18n-namespaces.mjs` (from repo root) → **exit 0**
- `pnpm exec eslint <3 touched files> --max-warnings 0` → **clean** (0 physical-direction classes, 0 raw hex)
- `cd frontend && pnpm build` → **✓ built in 11.39s** (pre-existing chunk-size warning only, unrelated)

Acceptance greps: `backToApp` present in nav.tsx + both settings.json (1/1/1); `navGroups` present in both; `rotate-180` gated on `isRTL`; physical-direction utilities = 0; `var(--ink-faint)` present on the group header; single `startsWith('/settings')` derivation site referenced by both gates.

## Human-Verify Task (Task 3) — DEFERRED

Task 3 is a `checkpoint:human-verify` blocking gate (settings render-parity sign-off, EN/AR × 1024/1400, dark/light, plus bucket-label confirmation). **Not executed by this subagent** — deferred to the orchestrator's single consolidated post-merge render sign-off across all Phase-85 plans, run on the assembled running app. Bucket labels (Account / Privacy & access / Connected) ship as the default pending that confirmation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- F18 + F20 shipped; ready for the orchestrator's consolidated render-parity walk.
- No blockers. Note for the sign-off: below `lg` on /settings the Topbar hamburger is a no-op (the drawer is intentionally unmounted; Topbar left untouched per plan) — expected, not a defect.

## Self-Check: PASSED

- Commit `8ae4b2a6` (Task 1) — FOUND in git log
- Commit `6d8ac4ed` (Task 2) — FOUND in git log
- `frontend/src/components/layout/AppShell.tsx` — FOUND
- `frontend/src/components/settings/SettingsNavigation.tsx` — FOUND
- `frontend/src/i18n/en/settings.json` — FOUND
- `frontend/src/i18n/ar/settings.json` — FOUND

---

_Phase: 85-linear-taste-refinements-f16-f21_
_Completed: 2026-07-05_
