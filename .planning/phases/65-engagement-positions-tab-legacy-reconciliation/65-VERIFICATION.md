---
phase: 65-engagement-positions-tab-legacy-reconciliation
verified: 2026-06-13T00:00:00Z
status: human_needed
score: 3/3 must-haves verified (automated); live staging criteria accepted from 65-06-SUMMARY.md recorded evidence
overrides_applied: 0
human_verification:
  - test: 'Navigate to an engagement workspace, confirm the Positions tab label reads المواقف in AR locale and Positions in EN'
    expected: 'Tab label matches workspace.json values; tab body renders DossierPositionsTab between Context and Tasks'
    why_human: 'Visual tab placement and AR font rendering (Tajawal) cannot be verified by grep'
  - test: 'Attach an existing position to an engagement via the Positions tab; verify the card renders without page reload'
    expected: 'Success toast fires; position card appears in-tab immediately; position_dossier_links row written with dossier_id = engagementId and link_type related_to'
    why_human: "TanStack Query cache-invalidation render behavior (the 'without reload' criterion of ENGPOS-02) requires a live browser session"
  - test: 'From CalendarTab, click Add event, submit a title and date; verify the Scheduled events section renders the row without reload'
    expected: 'calendar_entries row written (dossier_id = engagement id); Scheduled events section updates immediately without page reload'
    why_human: 'EventDialog invalidation → useEngagementCalendarEntries refetch render path requires a live browser session'
  - test: 'From OverviewTab and TasksTab, click Create task; verify task dialog opens with engagement context badge and success creates a task with engagement_id IS NULL plus a work_item_dossiers row'
    expected: "Dialog shows 'Will be linked to <engagement name> · Direct'; created row has no engagement_id; work_item_dossiers row links task to engagementId"
    why_human: 'Dialog badge display and DB column values require live session + Supabase MCP; kanban caveat (board shows empty) also needs live observation'
---

# Phase 65: Engagement Positions Tab + Legacy Reconciliation — Verification Report

**Phase Goal:** The engagement workspace has a working Positions surface on canonical tables, with no inert CTAs left behind
**Verified:** 2026-06-13
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                                              | Status                                    | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The engagement workspace shows a routed Positions tab reading position_dossier_links (ENGPOS-01 decision recorded and implemented) | ✓ VERIFIED                                | Route file exists at `frontend/src/routes/_protected/engagements/$engagementId/positions.tsx` with ENGPOS-01 decision header comment; route registered in `routeTree.gen.ts` at `/_protected/engagements/$engagementId/positions`; `WORKSPACE_TABS` entry `{ key: 'positions', labelKey: 'tabs.positions', path: 'positions' }` found at WorkspaceTabNav.tsx:29; tab body lazy-imports `DossierPositionsTab` with `dossierId={engagementId}`                                                                                                                     |
| 2   | Attaching a position to an engagement persists, renders in the tab, and invalidates queries — live-verified on staging             | ✓ VERIFIED (recorded evidence)            | 65-06-SUMMARY.md Task 1 records: attach row `1f1e2657…` SQL-verified (dossier_id = engagement id, link_type related_to); create-new row `0ea48c56…` SQL-verified (status draft, applies_to link); both rendered without reload; live-caught routeTree bug fixed inline as commit `36199591`; unit test in `EngagementPositionsTab.test.tsx` (248 lines) pins the invalidate/attach/partial-toast contract                                                                                                                                                        |
| 3   | No inert buttons remain: every round-15-disabled CTA is re-enabled and functional, or removed                                      | ✓ VERIFIED (code) + human_needed (render) | CTAs 1/2/8/9 (transitionStage ×2, linkDossier ×2, docs.upload): grep confirms zero occurrences in WorkspaceShell, ContextTab, DocsTab, OverviewTab; CTAs 3/4/5 (Create task ×3): TaskDialog imported and mounted with readiness guard in OverviewTab and TasksTab; no `engagement_id` in either tab; CTAs 6/7 (Add event ×2): EventDialog imported and mounted in CalendarTab with `addEventDisabled = dossierContext === null \|\| dossier === undefined`; `useEngagementCalendarEntries` provides the render path; live render pass requires human observation |

**Score:** 3/3 truths verified (truth 3 has a human-needed render-path component)

### Required Artifacts

| Artifact                                                                      | Expected                                                                                | Status     | Details                                                                                                                                                         |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/routes/_protected/engagements/$engagementId/positions.tsx`      | Routed lazy tab with ENGPOS-01 header                                                   | ✓ VERIFIED | 35 lines; contains ENGPOS-01 decision comment; lazy DossierPositionsTab; param engagementId                                                                     |
| `frontend/src/routeTree.gen.ts`                                               | Contains new route id                                                                   | ✓ VERIFIED | Route id `/_protected/engagements/$engagementId/positions` present at 6 locations including the type map and route definition                                   |
| `frontend/src/components/workspace/WorkspaceTabNav.tsx`                       | positions entry with labelKey tabs.positions                                            | ✓ VERIFIED | Line 29: `{ key: 'positions', labelKey: 'tabs.positions', path: 'positions' }`                                                                                  |
| `frontend/src/i18n/en/workspace.json`                                         | tabs.positions = "Positions" + calendar.\* keys                                         | ✓ VERIFIED | EN tabs.positions = "Positions"; all three calendar.\* keys present                                                                                             |
| `frontend/src/i18n/ar/workspace.json`                                         | tabs.positions = "المواقف" + calendar.\* keys in AR                                     | ✓ VERIFIED | AR tabs.positions = "المواقف"; all three calendar.\* keys present in Arabic                                                                                     |
| `frontend/src/components/positions/__tests__/EngagementPositionsTab.test.tsx` | ENGPOS-01/-02 unit tests ≥60 lines                                                      | ✓ VERIFIED | 248 lines; covers nav-entry placement, i18n parity, reader-id pin, attach/invalidate/partial-toast contract                                                     |
| `frontend/src/components/workspace/WorkspaceShell.tsx`                        | No transitionStage button; LifecycleStepperBar + logAfterAction survive                 | ✓ VERIFIED | grep: transitionStage NOT_FOUND; logAfterAction at line 99; LifecycleStepperBar imported and rendered at line 112                                               |
| `frontend/src/pages/engagements/workspace/ContextTab.tsx`                     | No linkDossier or empty.context.action button                                           | ✓ VERIFIED | grep: NOT_FOUND for both keys                                                                                                                                   |
| `frontend/src/pages/engagements/workspace/DocsTab.tsx`                        | No docs.upload button; generateBriefing survives                                        | ✓ VERIFIED | docs.upload NOT_FOUND; handleGenerateBriefing at lines 78, 115, 121                                                                                             |
| `frontend/src/pages/engagements/workspace/__tests__/RemovedCtas.test.tsx`     | Removal assertions ≥50 lines                                                            | ✓ VERIFIED | 172 lines; covers transitionStage/linkDossier/docs.upload absence + logAfterAction/LifecycleStepperBar/generateBriefing survival                                |
| `frontend/src/components/dossier/EngagementDossierDetail.tsx`                 | DELETED                                                                                 | ✓ VERIFIED | File absent from disk; zero surviving references in frontend/src                                                                                                |
| `frontend/src/components/positions/EngagementPositionsSection.tsx`            | DELETED                                                                                 | ✓ VERIFIED | File absent from disk                                                                                                                                           |
| `frontend/src/hooks/useEngagementPositions.ts`                                | DELETED                                                                                 | ✓ VERIFIED | File absent from disk                                                                                                                                           |
| `frontend/src/components/positions/PositionSuggestionsPanel.tsx`              | DELETED                                                                                 | ✓ VERIFIED | File absent from disk                                                                                                                                           |
| `frontend/src/components/positions/BriefingPackGenerator.tsx`                 | DELETED                                                                                 | ✓ VERIFIED | File absent from disk                                                                                                                                           |
| `supabase/functions/engagements-positions-attach/index.ts`                    | DEPRECATED header with positions-dossiers-create pointer                                | ✓ VERIFIED | Line 1: DEPRECATED header; line 5: `positions-dossiers-create` canonical pointer                                                                                |
| `supabase/functions/engagements-positions-list/index.ts`                      | DEPRECATED header                                                                       | ✓ VERIFIED | Line 1: DEPRECATED header                                                                                                                                       |
| `supabase/functions/engagements-positions-detach/index.ts`                    | DEPRECATED header                                                                       | ✓ VERIFIED | Line 1: DEPRECATED header                                                                                                                                       |
| `frontend/src/components/dossier/AddToDossierDialogs.tsx`                     | export function TaskDialog + export function EventDialog + both workspace invalidations | ✓ VERIFIED | Line 319: `export function TaskDialog`; line 637: `export function EventDialog`; lines 369/693: engagement-kanban and engagement-calendar-entries invalidations |
| `frontend/src/pages/engagements/workspace/OverviewTab.tsx`                    | TaskDialog wired; no transitionStage; readiness guard                                   | ✓ VERIFIED | TaskDialog imported at line 26; readiness guard `dossierContext === null \|\| dossier === undefined` at line 362; no engagement_id; no transitionStage          |
| `frontend/src/pages/engagements/workspace/TasksTab.tsx`                       | TaskDialog wired in both render paths; header min-h-11                                  | ✓ VERIFIED | TaskDialog at line 34; lines 166/223: min-h-11; no engagement_id                                                                                                |
| `frontend/src/pages/engagements/workspace/__tests__/CreateTaskCtas.test.tsx`  | CTA wiring assertions ≥70 lines                                                         | ✓ VERIFIED | 294 lines; covers dispositions #2-#5, payload no-engagement_id, work_item_dossiers link, kanban invalidation                                                    |
| `frontend/src/hooks/useEngagementCalendarEntries.ts`                          | Typed reader with engagement-calendar-entries key and eq('dossier_id')                  | ✓ VERIFIED | 81 lines; queryKey ['engagement-calendar-entries', engagementId]; .eq('dossier_id', engagementId); ascending order; no service_role usage                       |
| `frontend/src/pages/engagements/workspace/CalendarTab.tsx`                    | EventDialog wired; useEngagementCalendarEntries consumed; no dead disabled              | ✓ VERIFIED | EventDialog at line 20; hook at line 17; addEventDisabled = readiness guard (line 64), not static true; no min-h-8 on CTA buttons                               |
| `frontend/src/pages/engagements/workspace/__tests__/CalendarTabCtas.test.tsx` | Reader + wiring assertions ≥70 lines                                                    | ✓ VERIFIED | 417 lines; 12 cases covering reader shape, section placement, locale dates, interplay, CTA wiring                                                               |

### Key Link Verification

| From                                                      | To                                                          | Via                                            | Status  | Details                                                       |
| --------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------- | ------- | ------------------------------------------------------------- |
| `WorkspaceTabNav.tsx`                                     | `routes/_protected/engagements/$engagementId/positions.tsx` | `WORKSPACE_TABS path 'positions'`              | ✓ WIRED | Key `positions` at line 29 maps to the route file             |
| `positions.tsx` route                                     | `DossierPositionsTab`                                       | lazy import + `dossierId={engagementId}`       | ✓ WIRED | Lazy import and prop wiring present in the 35-line route file |
| `AddToDossierDialogs.tsx` TaskDialog success              | `['engagement-kanban', engagementId]`                       | `queryClient.invalidateQueries`                | ✓ WIRED | Line 369 in AddToDossierDialogs.tsx                           |
| `AddToDossierDialogs.tsx` EventDialog success             | `['engagement-calendar-entries', engagementId]`             | `queryClient.invalidateQueries`                | ✓ WIRED | Line 693 in AddToDossierDialogs.tsx                           |
| `CalendarTab.tsx`                                         | `useEngagementCalendarEntries`                              | direct import + consumption                    | ✓ WIRED | Lines 17/71                                                   |
| `CalendarTab.tsx`                                         | `EventDialog`                                               | named import from AddToDossierDialogs          | ✓ WIRED | Lines 20/194                                                  |
| `OverviewTab.tsx`                                         | `TaskDialog`                                                | named import + engagement-typed dossierContext | ✓ WIRED | Lines 26/375                                                  |
| `TasksTab.tsx`                                            | `TaskDialog`                                                | named import + dual render-path mount          | ✓ WIRED | Lines 34/71                                                   |
| `engagements-positions-attach/index.ts` DEPRECATED header | `positions-dossiers-create` canonical plane                 | comment pointer                                | ✓ WIRED | Line 5                                                        |

### Data-Flow Trace (Level 4)

| Artifact                                      | Data Variable    | Source                                                               | Produces Real Data                                                | Status    |
| --------------------------------------------- | ---------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------- | --------- |
| `positions.tsx` route → `DossierPositionsTab` | `dossierId` prop | `Route.useParams().engagementId`                                     | Yes — param from URL                                              | ✓ FLOWING |
| `useEngagementCalendarEntries.ts`             | `entries`        | PostgREST `.from('calendar_entries').eq('dossier_id', engagementId)` | Yes — live DB query, ascending order, no static fallback          | ✓ FLOWING |
| `CalendarTab.tsx` Scheduled events section    | `entries`        | `useEngagementCalendarEntries(engagementId)`                         | Yes — keyed to the EventDialog invalidation contract              | ✓ FLOWING |
| `OverviewTab.tsx` TaskDialog                  | `dossierContext` | `useEngagement(engagementId)` profile + `useDossier(engagementId)`   | Yes — real fetches; readiness guard prevents mount until resolved | ✓ FLOWING |
| `TasksTab.tsx` TaskDialog                     | `dossierContext` | same pattern as OverviewTab                                          | Yes                                                               | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior                                 | Command                                                                                                                                                | Result                                                                               | Status |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ------ |
| Route id present in routeTree            | `grep 'engagements/$engagementId/positions' routeTree.gen.ts`                                                                                          | Found at 6 locations                                                                 | ✓ PASS |
| ENGPOS-01 decision comment in route file | `grep 'ENGPOS-01' positions.tsx`                                                                                                                       | Found in header                                                                      | ✓ PASS |
| TaskDialog exported                      | `grep '^export function TaskDialog' AddToDossierDialogs.tsx`                                                                                           | Line 319                                                                             | ✓ PASS |
| EventDialog exported                     | `grep '^export function EventDialog' AddToDossierDialogs.tsx`                                                                                          | Line 637                                                                             | ✓ PASS |
| Zero legacy module references            | `grep -rq 'useEngagementPositions\|EngagementPositionsSection\|EngagementDossierDetail\|PositionSuggestionsPanel\|BriefingPackGenerator' frontend/src` | ZERO_REFS_OK                                                                         | ✓ PASS |
| engagement_section swept from i18n       | `grep 'engagement_section' en/positions.json ar/positions.json`                                                                                        | REMOVED_OK                                                                           | ✓ PASS |
| No engagement_id in wired tabs           | `grep 'engagement_id' OverviewTab.tsx TasksTab.tsx`                                                                                                    | NO_ENGAGEMENT_ID_OK                                                                  | ✓ PASS |
| addEventDisabled is a readiness guard    | `grep 'addEventDisabled' CalendarTab.tsx`                                                                                                              | `dossierContext === null \|\| dossier === undefined`                                 | ✓ PASS |
| Full TDD commit sequence present         | `git log --oneline`                                                                                                                                    | RED+GREEN commits for all 4 test files; fix(65-01) routeTree commit 36199591 present | ✓ PASS |

### Probe Execution

No declared probes in PLAN files. Step 7c: SKIPPED (no probe-\*.sh files declared for this phase; live staging pass is recorded in 65-06-SUMMARY.md as the phase gate, not as a repo-local probe script).

### Requirements Coverage

| Requirement | Source Plan         | Description                                                                  | Status                                                       | Evidence                                                                                                                                                                     |
| ----------- | ------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ENGPOS-01   | 65-01, 65-03        | Routed Positions tab on canonical tables; canonical source decision recorded | ✓ SATISFIED                                                  | Route file with ENGPOS-01 header; routeTree registered; legacy stack deleted; edges deprecated; 65-06-SUMMARY live pass recorded                                             |
| ENGPOS-02   | 65-01               | Attach persists, renders, invalidates                                        | ✓ SATISFIED (unit) + human_needed (live render)              | Unit test pins reader-id + onAttach + invalidate + toast contract; 65-06-SUMMARY records SQL-verified attach row + no-reload screenshots                                     |
| ENGPOS-03   | 65-02, 65-04, 65-05 | No inert buttons remain — all re-enabled and functional or removed           | ✓ SATISFIED (code) + human_needed (live render for CTAs 3-7) | grep confirms 4 CTAs removed; code confirms 5 CTAs wired with real dialog mounts and readiness guards; 65-06-SUMMARY nine-CTA disposition matrix recorded with live evidence |

All three requirement IDs declared across plans (ENGPOS-01, ENGPOS-02, ENGPOS-03) are accounted for. No orphaned requirements.

### Anti-Patterns Found

| File              | Line     | Pattern                                                        | Severity | Impact                                                                                                                                                                                         |
| ----------------- | -------- | -------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| —                 | —        | No TBD/FIXME/XXX debt markers found in any phase-modified file | —        | —                                                                                                                                                                                              |
| `CalendarTab.tsx` | 233, 271 | `disabled={addEventDisabled}`                                  | ℹ Info   | NOT a dead no-op — `addEventDisabled = dossierContext === null \|\| dossier === undefined` is a readiness guard that resolves in milliseconds on page load. This is the correct WR-03 pattern. |

No blockers found.

### Human Verification Required

#### 1. Positions Tab Visual + AR Locale

**Test:** Navigate to an engagement workspace (e.g., `/engagements/b0000002-0000-0000-0000-000000000001`). Check the tab strip shows a Positions tab between Context and Tasks. Switch to AR locale via the topbar ع button and verify the tab label reads المواقف with Tajawal font and no horizontal overflow at 1280px and 1024px.
**Expected:** Tab label "Positions" (EN) / "المواقف" (AR); correct tab position; no overflow; Tajawal rendered.
**Why human:** Visual tab placement, Arabic font rendering, and overflow are not verifiable by grep. The 65-06-SUMMARY records this pass with screenshots (uat65-17/18/19/20), so this is a confirmation check, not a discovery.

#### 2. Attach position + no-reload render (ENGPOS-02 live)

**Test:** From the engagement Positions tab, open Attach existing position, select a published position, confirm.
**Expected:** Success toast; position card appears in the tab without any page reload; `position_dossier_links` row exists with `dossier_id = engagementId` and `link_type = related_to`.
**Why human:** TanStack Query cache-invalidation render behavior (the "without reload" criterion) and RLS enforcement require a live browser session and optional Supabase MCP verification. The 65-06-SUMMARY records this pass with SQL evidence and screenshots.

#### 3. Create task — engagement_id NULL + work_item_dossiers (ENGPOS-03 CTA #3)

**Test:** From OverviewTab, click Create task; fill a title; submit.
**Expected:** TaskDialog opens with engagement context badge; task created with `engagement_id IS NULL`; `work_item_dossiers` row links the task to the engagement `dossiers.id`; kanban board stays empty (expected — legacy assignments plane caveat).
**Why human:** Dialog badge rendering, DB column value (`engagement_id IS NULL`), and the honest kanban-empty observation require a live session. The 65-06-SUMMARY records this pass (task `c1a2b10f…` with `engagement_id NULL`, `wid_rows=1`).

#### 4. Add event + Scheduled events in-tab render (ENGPOS-03 CTAs #6/#7)

**Test:** From CalendarTab header, click Add event; submit an event with a title and date.
**Expected:** EventDialog submits successfully; the Scheduled events section renders the new row WITHOUT reload; day-first date format; entry-type badge present; AR locale shows Arabic month names and Arabic-Indic digits.
**Why human:** EventDialog → invalidation → useEngagementCalendarEntries refetch render path and AR date digit format require a live browser session. The 65-06-SUMMARY records this pass (calendar_entries row `9870d2ba…`, "rendered WITHOUT reload", AR date "الأحد، ١٤ يونيو 10:00").

### Gaps Summary

No gaps blocking goal achievement. All code artifacts are present, substantive, wired, and data-flowing. The four human verification items above are live-render confirmations — the 65-06-SUMMARY.md records all of them as observed and passing during the orchestrator-run plan 06 with SQL evidence and screenshot references. The status is `human_needed` because the roadmap success criteria explicitly require "live-verified on staging" (criterion 2) and "re-enabled and functional" (criterion 3), which are visual/behavioral claims that automated grep cannot independently confirm.

The one integration bug caught during live verification (routeTree.gen.ts missing the new route after the 65-01 executor reverted its own regeneration) was fixed inline as commit `36199591` and is verified present in the git log.

---

_Verified: 2026-06-13_
_Verifier: Claude (gsd-verifier)_
