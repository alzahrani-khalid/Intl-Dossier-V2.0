---
phase: 11-engagement-workspace
verified: 2026-03-31T00:00:00Z
status: passed
score: 5/5 must-haves verified
gaps:
  - truth: "LifecycleBar at the top of the workspace shows all 6 stages with the current stage highlighted; clicking completed stages shows their summary"
    status: resolved
    reason: "WorkspaceShell renders LifecycleStepperBar but omits the required engagementId prop. LifecycleStepperBarProps requires engagementId (for useLifecycleHistory and useLifecycleTransition calls inside the component), but WorkspaceShell passes only currentStage, transitions={[]}, onTransition, and disabled. This means the popover history data and transition mutation are called with undefined, breaking WORK-02 and WORK-03."
    artifacts:
      - path: "frontend/src/components/workspace/WorkspaceShell.tsx"
        issue: "Line 118-124: <LifecycleStepperBar currentStage={currentStage} transitions={[]} onTransition={...} disabled={isLoading} /> — missing engagementId prop. Also passes transitions={[]} hardcoded empty array which overrides any data fetched internally."
    missing:
      - "Add engagementId={engagementId} prop to the LifecycleStepperBar render in WorkspaceShell.tsx line 118"
      - "Remove the transitions={[]} hardcoded prop — LifecycleStepperBar fetches its own history internally via useLifecycleHistory(engagementId)"
  - truth: "Each tab (Tasks, Calendar, Docs, Audit) shows content scoped to this engagement only, not global data"
    status: partial
    reason: "Tasks, Docs, and Audit tabs are fully scoped to engagementId. Calendar tab shows only engagement's own dates and lifecycle history (no external events API) — this is acceptable per plan (WORK-07 known blocker in research). However, REQUIREMENTS.md marks WORK-06 Pending (tasks scoped kanban) and WORK-07 Pending (calendar events with conflict detection). The kanban IS scoped correctly (useEngagementKanban(engagementId)) but REQUIREMENTS.md status has not been updated to Complete."
    artifacts:
      - path: ".planning/REQUIREMENTS.md"
        issue: "WORK-06, WORK-07, WORK-08, WORK-09 still marked Pending in traceability table, but the implementations exist and are scoped correctly. Status should be updated."
    missing:
      - "Update REQUIREMENTS.md traceability table: WORK-06, WORK-07, WORK-08, WORK-09 → Complete (implementations exist and are engagement-scoped)"
human_verification:
  - test: "Navigate to /engagements/{id} — confirm redirect to /engagements/{id}/overview"
    expected: "URL changes to /overview, WorkspaceShell renders with engagement name and 6 tabs"
    why_human: "TanStack Router redirects require runtime to verify"
  - test: "Click each of the 6 tabs in sequence"
    expected: "URL updates to /overview, /context, /tasks, /calendar, /docs, /audit. Active tab has bottom-border highlight. Shell persists (header + LifecycleBar stay fixed)."
    why_human: "Tab active state and URL update require browser verification"
  - test: "Copy /engagements/{id}/tasks URL, open in new tab"
    expected: "Opens directly to Tasks tab showing kanban board"
    why_human: "Deep-linking requires browser verification"
  - test: "After fixing engagementId prop: click a completed lifecycle stage"
    expected: "Popover appears showing who transitioned, when, optional note, time in stage"
    why_human: "Popover interaction requires browser with real engagement data"
  - test: "Navigate to /dossiers/engagements/{id}"
    expected: "Immediately redirects to /engagements/{id}/overview"
    why_human: "Route redirect requires browser verification"
  - test: "Mobile (viewport < 640px): scroll through tab bar"
    expected: "Tabs scroll horizontally, active tab auto-scrolls into view"
    why_human: "Mobile scroll behavior requires device/responsive mode testing"
---

# Phase 11: Engagement Workspace Verification Report

**Phase Goal:** Users work within a persistent, tabbed engagement workspace with lifecycle awareness, scoped views, and deep-linkable tabs
**Verified:** 2026-03-31
**Status:** gaps_found — 1 critical prop missing, 1 informational (REQUIREMENTS.md status)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User sees WorkspaceShell with persistent tab navigation (Overview, Context, Tasks, Calendar, Docs, Audit) when viewing any engagement | ✓ VERIFIED | `$engagementId.tsx` is a layout route rendering `WorkspaceShell` + `Outlet`. `WorkspaceTabNav` defines all 6 tabs with TanStack Router `Link` elements. |
| 2 | LifecycleBar at the top of the workspace shows all 6 stages with the current stage highlighted; clicking completed stages shows their summary | ✗ FAILED | `LifecycleStepperBar` is rendered in `WorkspaceShell` but `engagementId` prop is missing. The component signature requires `engagementId: string` to call `useLifecycleHistory` and `useLifecycleTransition` — both will receive `undefined`, breaking popover data and transitions. |
| 3 | Each tab (Tasks, Calendar, Docs, Audit) shows content scoped to this engagement only, not global data | ✓ VERIFIED | All 4 tabs call their hooks with `engagementId` from `useParams({ from: '/_protected/engagements/$engagementId' })`. TasksTab → `useEngagementKanban(engagementId)`, CalendarTab → `useEngagement(engagementId)` + `useLifecycleHistory(engagementId)`, DocsTab → `useEngagementBriefs(engagementId)`, AuditTab → `useLifecycleHistory(engagementId)`. |
| 4 | Workspace tabs are URL-driven via nested routes — sharing a URL like /engagements/123/tasks opens directly to the Tasks tab | ✓ VERIFIED | All 6 tab routes exist under `$engagementId/` directory. `WorkspaceTabNav` uses `Link` elements (not `useState`). Index route throws redirect to `/overview`. Dossier redirect route `/dossiers/engagements/$id` maps `params.id → engagementId`. |
| 5 | All workspace tabs are lazy-loaded via route-based code splitting (no tab renders until visited) | ✓ VERIFIED | All 6 tab routes (`overview.tsx`, `context.tsx`, `tasks.tsx`, `calendar.tsx`, `docs.tsx`, `audit.tsx`) use `React.lazy()` with `Suspense` + `TabSkeleton` fallback. Grep confirmed count of 1 lazy call per file. |

**Score:** 4/5 truths verified (Truth 2 fails on a single missing prop)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `frontend/src/components/workspace/WorkspaceShell.tsx` | Layout shell with engagement header, LifecycleBar, tab nav, Outlet | ✓ VERIFIED | 141 lines. Has sticky header, LtrIsolate-wrapped LifecycleStepperBar, WorkspaceTabNav (hidden on after-action), content main. |
| `frontend/src/components/workspace/WorkspaceTabNav.tsx` | URL-driven tab navigation using TanStack Router Link elements | ✓ VERIFIED | 101 lines. Uses `Link` + `useMatchRoute`, `role="tablist"`, `aria-selected`, `scrollIntoView`, `overflow-x-auto snap-x`. |
| `frontend/src/components/workspace/TabSkeleton.tsx` | Loading skeleton variants (summary, kanban, list, cards) | ✓ VERIFIED | Exists. All 4 type variants present. |
| `frontend/src/routes/_protected/engagements/$engagementId.tsx` | Layout route rendering WorkspaceShell with Outlet | ✓ VERIFIED | Imports `WorkspaceShell`, renders `<WorkspaceShell engagementId={engagementId}><Outlet /></WorkspaceShell>`. No `EngagementDetailPage` import. |
| `frontend/src/routes/_protected/engagements/$engagementId/index.tsx` | Redirect from /engagements/:id to /engagements/:id/overview | ✓ VERIFIED | `beforeLoad` throws `redirect({ to: '/engagements/$engagementId/overview', params: { engagementId: params.engagementId } })`. |
| `frontend/src/components/engagements/LifecycleStepperBar.tsx` | Enhanced stepper with popovers for completed stages and transition dialogs | ✓ VERIFIED (internally) | Imports `Popover`, `useLifecycleHistory`, `useLifecycleTransition`. Has `w-64` PopoverContent, `transitioned_at`, `duration_in_stage_seconds`, `textarea`, `isPending`. BUT: not receiving `engagementId` from WorkspaceShell. |
| `frontend/src/pages/engagements/workspace/OverviewTab.tsx` | Summary dashboard with metrics, participants, recent activity, quick actions | ✓ VERIFIED | Imports `useEngagement`, `useEngagementParticipants`, `useEngagementKanban`, `useLifecycleHistory`. Has `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, two-column section, `/after-action` link. |
| `frontend/src/pages/engagements/workspace/ContextTab.tsx` | Intelligence/prep sheet with linked dossiers, AI recommendations, talking points | ✓ VERIFIED | Imports `useEngagementRecommendations`, `DossierContextBadge`. Has `Anchors` tier label, `space-y-6`, `actions.linkDossier`. |
| `frontend/src/pages/engagements/workspace/TasksTab.tsx` | Inline kanban board using useEngagementKanban with drag-and-drop | ✓ VERIFIED | Imports `useEngagementKanban`, `DragEndEvent` from `@dnd-kit/core`. Has `handleDragEnd`, `min-w-[280px]`, `overflow-x-auto`, empty state, mobile stacked view. |
| `frontend/src/pages/engagements/workspace/CalendarTab.tsx` | Engagement dates and linked events in chronological list | ✓ VERIFIED | Imports `useEngagement`, `useLifecycleHistory`. Shows `start_date`/`end_date`, lifecycle stage dates, `Add Event` placeholder. Note: no external events API (per-plan known limitation). |
| `frontend/src/pages/engagements/workspace/DocsTab.tsx` | Briefs + files organized by lifecycle stage with Generate Briefing action | ✓ VERIFIED | Imports `useEngagementBriefs`, `useGenerateEngagementBrief`. Has `generateBrief.isPending`, Generate Briefing button, empty state. |
| `frontend/src/pages/engagements/workspace/AuditTab.tsx` | Lifecycle transition timeline + activity log | ✓ VERIFIED | Imports `useLifecycleHistory`, `LifecycleTimeline`. Has `useParams`, `empty.audit` keys. |
| `frontend/src/routes/_protected/dossiers/engagements/$id.tsx` | Redirect from dossier route to workspace route | ✓ VERIFIED | `beforeLoad` throws `redirect({ to: '/engagements/$engagementId/overview', params: { engagementId: params.id } })`. Correct param mapping. No component property. |
| `frontend/src/i18n/en/workspace.json` | English workspace translations | ✓ VERIFIED | File exists, registered in `i18n/index.ts` at line 183. |
| `frontend/src/i18n/ar/workspace.json` | Arabic workspace translations | ✓ VERIFIED | File exists, registered at line 184. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `$engagementId.tsx` | `WorkspaceShell.tsx` | `import WorkspaceShell` + renders with Outlet | ✓ WIRED | Confirmed in route file |
| `WorkspaceTabNav.tsx` | `@tanstack/react-router` | `Link` + `useMatchRoute` | ✓ WIRED | Both imports confirmed, `role="tablist"`, `aria-selected` present |
| `overview.tsx` route | `OverviewTab.tsx` | `React.lazy(() => import('@/pages/engagements/workspace/OverviewTab'))` | ✓ WIRED | Lazy import confirmed |
| `tasks.tsx` route | `TasksTab.tsx` | `React.lazy` | ✓ WIRED | All 6 routes confirmed |
| `WorkspaceShell.tsx` | `LifecycleStepperBar.tsx` | renders with props | ✗ PARTIAL | Rendered but missing `engagementId` prop — component receives `undefined` for its required first argument |
| `LifecycleStepperBar.tsx` | `useLifecycleHistory` / `useLifecycleTransition` | hook calls with `engagementId` | ✗ HOLLOW_PROP | Called with `undefined` because `engagementId` not passed from WorkspaceShell |
| `AuditTab.tsx` | `LifecycleTimeline.tsx` | `import LifecycleTimeline` | ✓ WIRED | Confirmed at line 17/64 |
| `$id.tsx` (dossier) | `/engagements/$engagementId/overview` | `redirect` in `beforeLoad` | ✓ WIRED | Correct param mapping `params.id → engagementId` |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| `WorkspaceShell` → `LifecycleStepperBar` | `historyData` (popover summaries) | `useLifecycleHistory(engagementId)` inside component | No — `engagementId` is `undefined` at call site | ✗ HOLLOW_PROP |
| `TasksTab` → kanban columns | `columns` | `useEngagementKanban(engagementId)` | Yes — hooks gets real `engagementId` from `useParams` | ✓ FLOWING |
| `OverviewTab` → metrics | `profile`, `stats`, `participants` | `useEngagement`, `useEngagementKanban`, `useEngagementParticipants` | Yes — all called with real `engagementId` | ✓ FLOWING |
| `CalendarTab` → events list | `events` (derived) | `useEngagement(engagementId)` + `useLifecycleHistory(engagementId)` | Yes — produces start/end/stage dates; no external events API (acceptable per plan) | ✓ FLOWING (limited scope by design) |
| `DocsTab` → briefs | `briefsData` | `useEngagementBriefs(engagementId)` | Yes — DB query via hook | ✓ FLOWING |
| `AuditTab` → transitions | `transitions` | `useLifecycleHistory(engagementId)` | Yes — real `engagementId` from `useParams` | ✓ FLOWING |

---

## Behavioral Spot-Checks

Step 7b: SKIPPED — requires running dev server. Key behaviors routed to human verification.

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| WORK-01 | 11-01 | WorkspaceShell with persistent tab navigation | ✓ SATISFIED | Shell + 6 tabs wired, lazy routes present |
| WORK-02 | 11-02 | LifecycleBar showing all 6 stages with current highlighted | ✗ BLOCKED | `LifecycleStepperBar` rendered but missing `engagementId` prop; hook calls receive `undefined` |
| WORK-03 | 11-02 | Click completed stages to see summary; click current for pending items | ✗ BLOCKED | Same root cause as WORK-02 — popover data from `useLifecycleHistory(undefined)` will fail |
| WORK-04 | 11-03 | Overview tab: summary, participants, decisions, what's next | ✓ SATISFIED | All 4 data hooks wired, metrics grid, participants, quick actions present |
| WORK-05 | 11-03 | Context tab: linked dossiers by tier with Link Dossier action | ✓ SATISFIED | `DossierContextBadge`, tier grouping (Anchors), `useEngagementRecommendations`, `actions.linkDossier` |
| WORK-06 | 11-04 | Tasks tab scoped kanban with lifecycle-stage columns | ✓ SATISFIED | `useEngagementKanban(engagementId)` scoped, 4 workflow columns, drag-and-drop via dnd-kit. REQUIREMENTS.md status stale (Pending). |
| WORK-07 | 11-04 | Calendar tab: engagement events + conflict detection + Add Event | ~ PARTIAL | Shows engagement dates + lifecycle dates. External events API filter not available (documented blocker). REQUIREMENTS.md status stale (Pending). |
| WORK-08 | 11-04 | Docs tab: documents by stage, upload, Generate Briefing | ✓ SATISFIED | `useEngagementBriefs`, `useGenerateEngagementBrief`, `isPending` spinner, empty state. Upload is placeholder (by design). REQUIREMENTS.md status stale (Pending). |
| WORK-09 | 11-05 | Audit tab: activity timeline scoped to engagement | ✓ SATISFIED | `useLifecycleHistory(engagementId)`, `LifecycleTimeline` component. REQUIREMENTS.md status stale (Pending). |
| WORK-10 | 11-01, 11-05 | URL-driven tabs enabling deep-linking | ✓ SATISFIED | All 6 routes exist, `Link` elements, index redirect, dossier redirect all confirmed |

**Orphaned requirements:** None — all WORK-01 through WORK-10 claimed by plans.

**REQUIREMENTS.md stale statuses:** WORK-06, WORK-07, WORK-08, WORK-09 are marked "Pending" in the traceability table but implementations exist. This is an informational issue (not a blocker) — the requirement text checkboxes at the top of the file are also unchecked for WORK-02, WORK-03, WORK-06 through WORK-09.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `WorkspaceShell.tsx` | 118-124 | `<LifecycleStepperBar>` missing `engagementId` prop; `transitions={[]}` hardcoded empty | 🛑 Blocker | WORK-02 and WORK-03 fail — lifecycle popover history and transition mutations broken |
| `CalendarTab.tsx` | 191, 221 | Two `TODO` comments: Add Event link to events API, conflict detection endpoint | ℹ️ Info | Known limitation per plan research; documented intentionally |
| `DocsTab.tsx` | 158 | Upload placeholder comment | ℹ️ Info | Intentional per plan — upload capability deferred |

**Zero RTL violations** found across all workspace components and routes (`ml-*`, `mr-*`, `text-left`, `text-right` absent).

---

## Human Verification Required

### 1. WorkspaceShell → Engagement Loads

**Test:** Navigate to any engagement URL `/engagements/{real-id}/overview`
**Expected:** Engagement name renders in header, LifecycleBar shows 6 stages with current highlighted, 6 tab links visible
**Why human:** Requires real auth session and engagement data

### 2. Tab Navigation Deep-Linking

**Test:** Copy URL `/engagements/{id}/tasks`, open in new browser tab
**Expected:** Opens directly to Tasks tab with kanban board (no redirect to overview)
**Why human:** TanStack Router file-based routing must be verified at runtime

### 3. LifecycleBar After Fix (WORK-02/03)

**Test:** After adding `engagementId` prop: click a completed stage on an engagement with history
**Expected:** Popover shows transition details (user name, date, note if any, time in stage)
**Why human:** Requires engagement with actual lifecycle transition history

### 4. Dossier Redirect

**Test:** Navigate to `/dossiers/engagements/{id}`
**Expected:** Immediate redirect to `/engagements/{id}/overview`
**Why human:** Route redirect verified at runtime only

### 5. Mobile Tabs

**Test:** Resize to 375px width, navigate between tabs
**Expected:** Tab bar scrolls horizontally with snap; active tab auto-scrolls into view
**Why human:** Scroll + snap behavior requires browser responsive mode

### 6. RTL Layout

**Test:** Switch language to Arabic, navigate to any engagement workspace
**Expected:** Tabs flow right-to-left; LifecycleBar stays LTR (inside LtrIsolate); engagement name reads correctly
**Why human:** Visual RTL layout requires browser inspection

---

## Gaps Summary

**One critical gap blocks WORK-02 and WORK-03:**

`WorkspaceShell.tsx` renders `LifecycleStepperBar` without the required `engagementId` prop (line 118–124). The component's internal hooks — `useLifecycleHistory(engagementId)` and `useLifecycleTransition(engagementId)` — will be called with `undefined`. This means:
- Popover summaries on completed stages will have no data (empty history)
- Stage transition mutations will target `undefined` engagement
- The "current stage highlighted" relies on `currentStage` prop (which IS passed), so the visual bar renders — but interactivity is broken

**Fix is a single-line change:** Add `engagementId={engagementId}` to the `LifecycleStepperBar` render, and remove the stale `transitions={[]}` prop (the component fetches its own history internally).

**One informational gap (non-blocking):**

`REQUIREMENTS.md` traceability table shows WORK-06 through WORK-09 as "Pending" and their checkbox entries as unchecked, but all four implementations exist and are correctly scoped. This causes confusion when reading project state. Updating the file to mark these Complete is recommended but does not block phase completion.

---

_Verified: 2026-03-31_
_Verifier: Claude (gsd-verifier)_
