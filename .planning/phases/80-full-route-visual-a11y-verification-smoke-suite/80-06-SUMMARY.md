---
phase: 80-full-route-visual-a11y-verification-smoke-suite
plan: 06
subsystem: testing
tags: [playwright, rtl, e2e, ci, fouc, calendar, popover, pagination, sidebar]

# Dependency graph
requires:
  - phase: 76-rtl-infrastructure-bridge-shadcn-logical-properties
    provides: direction-portals.spec.ts (the DOM-assertion analog) + the DirectionProvider Radix bridge + SRTL-02 July-2026 calendar seed rows
  - phase: 80 (80-01, 80-05)
    provides: the a11y/visual verification gauntlet the FOUC smokes lock in; test-a11y CI job pattern
provides:
  - rtl-component-smokes.spec.ts — Popover / Pagination / Sidebar RTL smokes (the 3 FOUC-02 gaps direction-portals did not cover)
  - calendar-rtl.spec.ts evergreen fix — constructor-only Date override (Date.now stays real) that defuses the 2026-08-01 seed cliff without triggering a Supabase token-refresh storm
  - test-rtl-smokes ci.yml job (name "RTL Portal + Component Smokes") — green-from-birth, local-dev-server pattern, advisory
affects: [phase-80-close, v8.0-PR, branch-protection-promotion]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Constructor-only Date override for evergreen date-pinned E2E: freeze no-arg new Date() via addInitScript while keeping Date.now() REAL, so the pre-auth storageState token is never seen as expired'
    - 'Screenshot-free RTL portal smoke: computed direction + getBoundingClientRect geometry + computed rotation matrix — runs identically on darwin (local) and ubuntu (CI)'
    - 'Green-from-birth CI job: separate from the pre-existing red visual/a11y jobs; local-dev-server (never e2e.yml deployed-app / E2E_BASE_URL) pattern'

key-files:
  created:
    - frontend/tests/e2e/rtl-component-smokes.spec.ts
  modified:
    - frontend/tests/e2e/calendar-rtl.spec.ts
    - .github/workflows/ci.yml

key-decisions:
  - 'Replace page.clock.setFixedTime/install with a constructor-only Date override — clock APIs that fake Date.now() forward trigger a Supabase token-refresh storm that starves the month query and yields an empty grid (VERIFIED)'
  - 'Branch-protection promotion DEFERRED (not applied) per the overseer/user pre-decision 2026-07-03 — ship the job advisory; promotion is a repo-admin action at v8.0 PR time'
  - 'Popover smoke mounts on /audit-logs AuditLogFilters (unconditional, admin-gated) — the live shell has no ui/popover.tsx consumer in the topbar'

patterns-established:
  - 'Constructor-only Date freeze: the auth-safe alternative to page.clock.* for date-sensitive authenticated E2E'
  - 'aside.appshell-aside is the UNIQUE sidebar-rail selector (plain aside.sidebar also matches the inner nav element)'

requirements-completed: [FOUC-02]

# Metrics
duration: ~40min
completed: 2026-07-04
---

# Phase 80 Plan 06: FOUC-02 — RTL Portal + Component Smokes & Green-from-Birth CI Job Summary

**Popover/Pagination/Sidebar RTL smokes (screenshot-free) + an evergreen constructor-only-clock calendar-rtl smoke, wired into a new advisory `RTL Portal + Component Smokes` ci.yml job — 9/9 green locally. Closes Phase 80 and the v8.0 milestone.**

## Performance

- **Duration:** ~40 min
- **Completed:** 2026-07-04
- **Tasks:** 3 (2 auto-executed, 1 checkpoint recorded DEFERRED)
- **Files modified:** 3 code + 4 planning docs

## Accomplishments

- **rtl-component-smokes.spec.ts (NEW):** the 3 FOUC-02 coverage gaps that `direction-portals.spec.ts` (Phase 76) does not cover, all DOM/computed-style — zero `toHaveScreenshot`:
  - **Popover RTL** — `/audit-logs` AuditLogFilters portal: computed `direction === 'rtl'` on `[data-slot="popover-content"]` + on-viewport box geometry.
  - **Pagination RTL** — `/users` (admin-gated): chevron `svg` computed `rotate: 180deg` / `matrix(-1,0,0,-1,0,0)` under AR + `nav[aria-label="pagination"]` direction `rtl`.
  - **Sidebar RTL** — `aside.appshell-aside` right-edge geometry: `Math.round(box.x + box.width) === viewportWidth` (inline-start rail = physical RIGHT under RTL).
- **calendar-rtl.spec.ts evergreen fix:** replaced `page.clock.setFixedTime` with a constructor-only `Date` override; the calendar renders July 2026 with the SRTL-02 seed rows and every Arabic-dow / Arabic-Indic-digit assertion still passes.
- **test-rtl-smokes ci.yml job:** verbatim `test-a11y` copy + exactly 3 deltas (name, admin creds, smoke-run command) + a distinct `rtl-smokes-report` artifact — green-from-birth, on the proven local-dev-server pattern.
- **Local green proof:** `direction-portals + calendar-rtl + rtl-component-smokes --project=chromium` = **9/9 pass** (13.8s) — the exact command the CI job runs.

## Task Commits

1. **Task 1 + Task 2: RTL smokes + calendar clock fix + CI job** — `7014fdba1` (test)
   - `frontend/tests/e2e/rtl-component-smokes.spec.ts` (new, 130 lines)
   - `frontend/tests/e2e/calendar-rtl.spec.ts` (modified — constructor-only Date override)
   - `.github/workflows/ci.yml` (modified — +47 lines, pure insertion)
2. **Task 3: branch-protection promotion** — no commit (checkpoint recorded DEFERRED; see Deviations)

**Plan metadata:** closeout commit (this SUMMARY + STATE + ROADMAP + REQUIREMENTS)

## Files Created/Modified

- `frontend/tests/e2e/rtl-component-smokes.spec.ts` — Popover/Pagination/Sidebar RTL smokes, DOM/computed-style assertions only.
- `frontend/tests/e2e/calendar-rtl.spec.ts` — constructor-only `Date` freeze (Date.now real) so the July SRTL-02 grid renders without a token-refresh storm; assertions unchanged in substance.
- `.github/workflows/ci.yml` — new `test-rtl-smokes` job (`name: RTL Portal + Component Smokes`), 47-line pure insertion after `test-a11y`; `e2e.yml` untouched.

## Decisions Made

- **Constructor-only `Date` override over `page.clock.*`** — see Deviations #1. This is the load-bearing decision of the plan.
- **Popover surface = `/audit-logs` AuditLogFilters** — the live shell's topbar bell is a stub with no `ui/popover.tsx` consumer; AuditLogFilters renders its 4 Popover triggers unconditionally above the loading/error boundary, and the route is admin-gated (matching the admin creds the pagination smoke already needs).
- **`aside.appshell-aside` as the sidebar selector** — more specific than the patterns-file `aside.sidebar` (which also matches the inner nav element); the live rail is `layout/Sidebar.tsx` wrapped by AppShell's 16rem grid column, not the unmounted `ui/sidebar.tsx`.
- **Branch-protection promotion DEFERRED, not applied** — pre-decided by the overseer/user 2026-07-03.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] calendar-rtl clock mechanism replaced (page.clock.\* → constructor-only Date override)**

- **Found during:** Task 1 (calendar clock-freeze), building on the prior executor's empirical probe.
- **Issue:** The plan's `must_haves` (truth "page.clock.install pins the displayed month" + artifact check `contains: 'clock.install'`) and the prior executor's interim `page.clock.setFixedTime` both fake `Date.now()` forward. VERIFIED empirically: any Playwright clock API that moves `Date.now()` forward makes the Supabase client treat the pre-authenticated storageState token as **expired** → a token-refresh storm → the month event query starves → `CalendarEmptyWizard` ("التقويم فارغ") renders and `.cal-dow` is 0 (empty grid).
- **Fix:** A constructor-only `Date` override registered via `addInitScript` before navigation — it freezes ONLY the no-arg `new Date()` (what `UnifiedCalendar.tsx:48 useState(new Date())` reads for "current month") to `2026-07-15T12:00:00Z`, while `Date.now()` stays REAL so the auth token is never seen as expired and the July fetch completes. Mid-month freeze avoids a GST/UTC month-boundary flip.
- **Files modified:** `frontend/tests/e2e/calendar-rtl.spec.ts`
- **Verification:** `rtl-component-smokes + calendar-rtl --project=chromium` = 4/4 pass; full trio 9/9 pass. The grid renders July 2026 with the SRTL-02 rows and all Arabic-dow/Indic-digit assertions hold.
- **Committed in:** `7014fdba1`
- **Note:** Because the working mechanism is NOT `page.clock.*`, the plan's literal `grep -q "clock.install"` verify no longer applies — the spec header documents the clock rationale in its place. The FOUC-02 intent (evergreen, August-cliff defused) is fully satisfied.

### Recorded Decisions (not code changes)

**2. [Task 3 — checkpoint:human-verify] Branch-protection promotion DEFERRED**

- The plan's Task 3 is a repo-admin checkpoint to add the context `RTL Portal + Component Smokes` to `main`'s required status checks. Per the overseer/user pre-decision (2026-07-03): **do NOT promote to branch protection.** The job ships **advisory** (green-from-birth); promotion is a repo-admin action to be executed at v8.0 PR time (the job can only be observed green on GitHub once v8.0 pushes — `main` is local-ahead).
- **Honest gating record:** `gh api …/branches/main/protection` currently lists 8 required contexts (`type-check`, `Security Scan`, `Lint`, `Bundle Size Check (size-limit)`, `Tests (frontend)`, `Tests (backend)`, `Design Token Check`, `react-i18next Factory Check`) — `RTL Portal + Component Smokes` is **NOT** among them. The job exists + is advisory; gating is NOT silently claimed.

---

**Total deviations:** 1 auto-fixed (Rule 1 bug — clock mechanism), 1 recorded decision (branch-protection deferral).
**Impact on plan:** The clock fix is essential for correctness (the planned mechanism produced an empty grid). No scope creep. The deferral is the honest V14-configuration-control outcome the plan's truth #4 requires.

## Issues Encountered

- **CI green-from-birth W2 contingency (ADVISORY, non-blocking):** The SRTL-02 July-2026 `calendar_entries` organizer is `de2734cf-f962-4e05-bf62-bc9e92efff96` = `kazahrani@stats.gov.sa` (admin) = the LOCAL test user, so the local calendar-rtl smoke (authenticated as the organizer) renders the rows and the green-proof holds. CI green-from-birth requires the CI `E2E_ADMIN_*` account to be this same kazahrani admin; if it differs, calendar-rtl reds in CI under organizer-scoped RLS (empty-grid signature "التقويم فارغ"). Resolution path (checkpoint how-to-verify): the orchestrator re-seeds the SRTL-02 rows with the CI account as organizer via Supabase MCP, then re-runs. Non-blocking because promotion is deferred.

## User Setup Required

None — no new packages, no environment changes. `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` already exist as repo secrets (consumed by e2e.yml today).

## Next Phase Readiness

- **Phase 80 CLOSED (6/6) — v8.0 (Linear Design System Migration) milestone complete.** All three requirements (VERIFY-01, VERIFY-02, FOUC-02) delivered.
- **Deferred to the v8.0 PR:** the CI birth-certificate (the job's first green GitHub run) and the branch-protection promotion (repo-admin). Local 9/9 green is the phase-exit proof.
- No blockers for closing the milestone.

## Self-Check: PASSED

- `frontend/tests/e2e/rtl-component-smokes.spec.ts` — FOUND (committed `7014fdba1`); actual `toHaveScreenshot()` calls = 0 (1 comment mention only).
- `frontend/tests/e2e/calendar-rtl.spec.ts` — FOUND (committed `7014fdba1`); actual `page.clock.*` calls = 0 (1 comment mention only); `FakeDate` constructor override present.
- `.github/workflows/ci.yml` — FOUND (committed `7014fdba1`); `test-rtl-smokes` job present, `grep -c E2E_BASE_URL` = 0, YAML parses (18 jobs).
- Commit `7014fdba1` — FOUND in git log.
- Local green proof: 9/9 (direction-portals 5 + calendar-rtl 1 + rtl-component-smokes 3).

---

_Phase: 80-full-route-visual-a11y-verification-smoke-suite_
_Completed: 2026-07-04_
