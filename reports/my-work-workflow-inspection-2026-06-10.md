# My Work Workflow Inspection Report

**Date:** Wed 10 Jun 2026  
**Scope:** Read-only code + contract inspection of `/my-work`; active Sidebar Operations discoverability; route files, page, tabs/views, child components, hooks, `unified-work-list` edge function, generated Supabase view/RPC/table contracts, URL state, counts, detail navigation, i18n EN+AR registration/parity, RTL/design-token compliance, and honest-UI checks  
**Branch:** `quick/260608-c9b-country-dossier-workflow-fixes`  
**Constraint:** No source edits; findings only. The only file write is this report.  
**Inspector:** codex (substituting for cursor-agent — monthly quota exhausted)

Prior coverage note: `reports/work-items-kanban-workflow-inspection-2026-06-09.md` already inspected the unified work-items Kanban board and `WorkBoard` internals, including commitment column resolution, DnD, `KCard` i18n, dossier intake fetch, stale intake columns, Kanban migration drift, and board realtime. This report focuses on the `/my-work` route surface itself: personal aggregation across tasks, commitments, and intake; URL filters; counts; and source-detail handoff.

---

## Scope

### Routes traced

| URL                    | Nav source                                                                                                                  | Route file                                                                                                 | Page / component                                                                                                       | Result                                                                                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/my-work`             | Active Sidebar Operations item `tasks` points to `/my-work` at `frontend/src/components/layout/navigation-config.ts:90-96`. | `frontend/src/routes/_protected/my-work.tsx:1-9`, `frontend/src/routes/_protected/my-work/index.tsx:24-38` | `MyWorkDashboard` -> `useMyWorkDashboard` -> `unified-work.service` -> Edge Function `unified-work-list` -> RPCs/views | Mounted and discoverable. The page renders summary cards, productivity metrics, optional team workload, source tabs, filters, virtualized list, and source-specific detail links. |
| `/my-work/board`       | Header button from `/my-work` at `frontend/src/pages/my-work/MyWorkDashboard.tsx:171-180`.                                  | `frontend/src/routes/_protected/my-work/board.tsx:1-8`                                                     | Redirect to `/kanban`                                                                                                  | Legacy redirect only. WorkBoard internals were not re-audited here.                                                                                                               |
| `/my-work/intake`      | Command Palette create-intake action and legacy intake redirect.                                                            | `frontend/src/routes/_protected/my-work/intake.tsx:13-18`                                                  | `IntakeQueuePage`                                                                                                      | Child queue route exists. Intake submission/triage/detail were covered by `reports/intake-workflow-inspection-2026-06-09.md`; not re-audited here.                                |
| `/my-work/waiting`     | Child route under My Work.                                                                                                  | `frontend/src/routes/_protected/my-work/waiting.tsx:13-18`                                                 | `WaitingQueuePage`                                                                                                     | Separate waiting queue surface; not part of unified personal aggregation on `/my-work`.                                                                                           |
| `/my-work/assignments` | Child route under My Work.                                                                                                  | `frontend/src/routes/_protected/my-work/assignments.tsx:12-17`                                             | `MyAssignmentsPage`                                                                                                    | Separate assignments surface; not part of unified personal aggregation on `/my-work`.                                                                                             |

### Child components & hooks

| Surface              | Files                                                                  | Role                                                                                                | Current wiring                                                                                                      |
| -------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Route search schema  | `frontend/src/routes/_protected/my-work/index.tsx:24-38`               | Defines `tab`, `filter`, `trackingType`, `search`, `sortBy`, `sortOrder`, and `assignee` URL params | `assignee` exists in route schema but not in exported `MyWorkUrlState`.                                             |
| Page shell           | `frontend/src/pages/my-work/MyWorkDashboard.tsx:29-240`                | Builds filters from URL, fetches summary/metrics/items/team workload, renders page sections         | Attempts source, tracking, overdue, search, and assignee filters. Due-window filters are accepted but not applied.  |
| Summary cards        | `frontend/src/pages/my-work/components/WorkSummaryHeader.tsx:29-94`    | Total active, overdue, due today, due week quick filters                                            | Counts come from summary endpoint; cards write `filter` URL state.                                                  |
| Productivity metrics | `frontend/src/pages/my-work/components/ProductivityMetrics.tsx:46-116` | Completed count, on-time rate, average completion                                                   | Uses `my-work` labels but hard-codes `%`, `h`, and `d` formatting.                                                  |
| Team workload        | `frontend/src/pages/my-work/components/TeamWorkloadPanel.tsx:64-156`   | Manager-only team cards and drill-down click                                                        | Click writes `assignee` URL state, but the edge function drops the filter. Workload bar assumes max capacity of 20. |
| Source tabs          | `frontend/src/pages/my-work/components/WorkItemTabs.tsx:23-87`         | All/Commitments/Tasks/Intake tabs and counts                                                        | Tab state is persisted in URL; counts come from current-user summary only.                                          |
| Filter bar           | `frontend/src/pages/my-work/components/WorkItemFiltersBar.tsx:35-180`  | Search, tracking-type filter, sort menu                                                             | Search/tracking/sort are URL-backed and sent to the list endpoint.                                                  |
| Virtualized list     | `frontend/src/pages/my-work/components/WorkItemList.tsx:33-214`        | Pull-to-refresh, sync status, infinite scroll                                                       | Renders `UnifiedWorkItem` rows; no local detail panel.                                                              |
| Work item card       | `frontend/src/pages/my-work/components/WorkItemCard.tsx:29-225`        | Source badges, deadline badges, source detail links                                                 | Commitments route to `/commitments?id=...`, tasks to `/tasks/{id}`, intake to `/intake/tickets/{id}`.               |
| Query hooks          | `frontend/src/hooks/useUnifiedWork.ts:34-149`                          | TanStack Query wrappers for list, summary, metrics, team workload                                   | List receives filters; summary and metrics are always current authenticated user.                                   |
| Realtime hook        | `frontend/src/hooks/useUnifiedWorkRealtime.ts:80-118`                  | Invalidates unified-work queries on source table changes                                            | Visible filters: commitments `owner_user_id`, tasks `assignee_id`, intake `assigned_to`.                            |
| Frontend service     | `frontend/src/services/unified-work.service.ts:57-149`                 | Builds Edge Function query strings and auth headers                                                 | Sends `assigneeId`, but the edge function does not consume it.                                                      |
| Edge Function        | `supabase/functions/unified-work-list/index.ts:44-225`                 | Handles `summary`, `metrics`, `team`, and `list` endpoints                                          | Calls generated RPCs. For list, always sets `p_user_id` to authenticated user id.                                   |

### Backend / Supabase surfaces

| Surface                             | Role                                     | Type validation against `database.types.ts`                                                                                                                                                                                                                                         | Wired from workflow?                                                                                                                                                                             |
| ----------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Edge Function `unified-work-list`   | `/my-work` list/summary/metrics/team API | Source calls generated RPC names; no table columns selected directly in the edge function.                                                                                                                                                                                          | Yes, all `/my-work` dashboard data goes through it.                                                                                                                                              |
| RPC `get_unified_work_items`        | Cursor-paginated personal list           | Generated with args/returns at `frontend/src/types/database.types.ts:35020-35054`. Args include `p_user_id`, `p_sources`, `p_tracking_types`, `p_statuses`, `p_priorities`, `p_is_overdue`, `p_dossier_id`, search, cursor, sort, and limit. No `p_assignee_id` or due-window args. | Yes, called at `supabase/functions/unified-work-list/index.ts:191-193` and `:250-251`. Actual SQL definition is not present in repo migrations; source-specific scoping is **VERIFY vs live**.   |
| RPC `get_user_work_summary`         | Header/source counts                     | Generated at `frontend/src/types/database.types.ts:35185-35200`; summary view row exists at `frontend/src/types/database.types.ts:31702-31716`.                                                                                                                                     | Yes, called with `{ p_user_id: user.id }` at `supabase/functions/unified-work-list/index.ts:50-53`. SQL source is **VERIFY vs live**.                                                            |
| RPC `get_user_productivity_metrics` | Productivity panel                       | Generated at `frontend/src/types/database.types.ts:35155-35169`; materialized view row exists at `frontend/src/types/database.types.ts:31684-31699`.                                                                                                                                | Yes, called with `{ p_user_id: user.id }` at `supabase/functions/unified-work-list/index.ts:81-84`. SQL source/refresh cadence is **VERIFY vs live**.                                            |
| RPC `get_team_workload`             | Team workload cards                      | Generated at `frontend/src/types/database.types.ts:34878-34892`. Repo has a later function patch at `supabase/migrations/20260531120000_fix_get_team_workload_email_text_cast.sql:1-16`.                                                                                            | Yes, called at `supabase/functions/unified-work-list/index.ts:110-113`.                                                                                                                          |
| View `unified_work_items`           | Generated unified source view            | Generated row shape at `frontend/src/types/database.types.ts:31518-31536`; includes unified `assigned_to`, `deadline`, `source`, `status`, `priority`, `tracking_type`, and `is_overdue`.                                                                                           | Indirectly via RPC. View SQL source is not present in repo migrations; **VERIFY vs live**.                                                                                                       |
| Table `tasks`                       | Task source                              | Generated columns include `assignee_id`, `sla_deadline`, `status`, and `workflow_stage` at `frontend/src/types/database.types.ts:25878-25910`.                                                                                                                                      | Visible realtime scoping uses `assignee_id` at `frontend/src/hooks/useUnifiedWorkRealtime.ts:93-104`; RPC source SQL is **VERIFY vs live**.                                                      |
| Table `aa_commitments`              | Commitment source                        | Generated columns include `due_date`, `owner_type`, `owner_user_id`, `owner_contact_id`, `created_by`, and `tracking_mode` at `frontend/src/types/database.types.ts:187-216`.                                                                                                       | Visible realtime scoping uses `owner_user_id` at `frontend/src/hooks/useUnifiedWorkRealtime.ts:80-91`; whether list scoping also includes `created_by` or external owners is **VERIFY vs live**. |
| Table `intake_tickets`              | Intake source                            | Generated columns include `assigned_to`, `status`, `priority`, `urgency`, and `external_deadline` at `frontend/src/types/database.types.ts:14783-14824`; no generated `sla_deadline` column on this table.                                                                          | Visible realtime scoping uses `assigned_to` at `frontend/src/hooks/useUnifiedWorkRealtime.ts:106-118`; RPC source SQL is **VERIFY vs live**.                                                     |

Migration/source note: exact-name search found generated types and docs/spec references for `get_unified_work_items`, `get_user_work_summary`, `get_user_productivity_metrics`, and `unified_work_items`, but no repo migration defining the core view/RPC SQL. The only `get_team_workload` migration hit is the later email-cast patch cited above.

### i18n namespaces

| Namespace / key group         | Routes / components                                                     | EN                                                           | AR                                       | Registered in `i18n/index.ts`                                             | Notes                                                                                                                    |
| ----------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `my-work`                     | `/my-work` page and child components under `frontend/src/pages/my-work` | `frontend/src/i18n/en/my-work.json:1-99`                     | `frontend/src/i18n/ar/my-work.json:1-99` | Imports at `frontend/src/i18n/index.ts:181-182`; resources at `:345,:471` | Flattened key diff verified: 54 EN keys, 54 AR keys, no missing keys on either side.                                     |
| `navigation.tasks`            | Active Sidebar item pointing to `/my-work`                              | `frontend/src/i18n/en/common.json`                           | `frontend/src/i18n/ar/common.json`       | Common namespace registered as default app translations                   | Sidebar is active, but its item id/label remain `tasks`; page title itself uses `my-work:title`.                         |
| Source/status/priority labels | `WorkItemCard`, `WorkItemFiltersBar`, `WorkItemTabs`                    | `my-work.source.*`, `priority.*`, `trackingType.*`, `tabs.*` | Same keys present                        | Same `my-work` namespace                                                  | No dot-form leaks found in inspected `/my-work` components. Numeric/unit formatting has AR parity issues; see finding 4. |

---

## Environment

| Check                       | Result                                                                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Backend health              | `GET http://127.0.0.1:5001/health` -> **200** `{"status":"ok","timestamp":"2026-06-09T21:14:00.344Z","environment":"development"}` |
| Frontend `/my-work` shell   | `HEAD http://127.0.0.1:5175/my-work` -> **200** SPA HTML (`Content-Type: text/html`)                                               |
| Authenticated browser UAT   | Not performed; inspection stayed source/read-only and sent no write requests.                                                      |
| Live Supabase DB/RPC/schema | Not probed with auth; source-specific aggregation SQL and deployed cron/materialized-view refresh behavior are **VERIFY vs live**. |
| Typecheck / tests           | Not run; avoided toolchain commands that may write build/cache artifacts under the hard write constraint.                          |

---

## Findings

### 1. [MY-WORK] Manager assignee drill-down is dropped before the RPC

**Severity:** HIGH  
**Location:** `frontend/src/pages/my-work/MyWorkDashboard.tsx:79-82,151-156,195-214`, `frontend/src/services/unified-work.service.ts:64-79`, `supabase/functions/unified-work-list/index.ts:6-21,135-193,229-251`, `frontend/src/types/work-item.types.ts:409-417`

**Root cause:** The page treats team-member clicks as a manager drill-down: it writes `assignee=<memberId>` to the URL and maps that to `filters.assigneeId`. The service sends `assigneeId` to `unified-work-list`, but the edge function interface and GET/POST parsers never read `assigneeId`; the list RPC call always uses `p_user_id: user.id`. The exported `MyWorkUrlState` also omits `assignee`, so the route schema, page behavior, and shared URL-state type disagree. Summary/tab counts and metrics are always current-user values as well.

**Suggested fix:** Add an authorized manager drill-down contract end-to-end. Either pass a validated `p_user_id` override only after a manager/team-membership check, or add a dedicated `p_assignee_id` RPC arg with server-side authorization. Apply the same selected-user context to list, summary, metrics, tab counts, and realtime invalidation, or clearly mark the team click as a non-filtering highlight. Update `MyWorkUrlState` to include `assignee`.

---

### 2. [MY-WORK] Due Today and Due This Week cards are clickable but do not filter the list

**Severity:** HIGH  
**Location:** `frontend/src/routes/_protected/my-work/index.tsx:24-33`, `frontend/src/pages/my-work/MyWorkDashboard.tsx:67-72`, `frontend/src/pages/my-work/components/WorkSummaryHeader.tsx:47-60,83-92`, `frontend/src/services/unified-work.service.ts:64-79`, `supabase/functions/unified-work-list/index.ts:145-189`, `frontend/src/types/database.types.ts:35020-35035`

**Root cause:** The route accepts `filter=due-today` and `filter=due-week`, and the summary cards write those values to the URL. `MyWorkDashboard` then explicitly does nothing for those values with a comment that they are handled in the query. They are not: `fetchWorkItems` only sends `isOverdue`, and `get_unified_work_items` has no generated due-window args. The visible result is an active-looking due-window filter with an unfiltered list. `filter=active` is also accepted by the route, but no card writes it and the Total Active card only highlights when there is no filter.

**Suggested fix:** Implement due-window filters as first-class URL/API/RPC state, for example `deadlineFrom/deadlineTo` or `dueWindow`, and add tests for all three sources. If the backend change is deferred, make due-today/week cards summary-only and remove the clickable/ring behavior until filtering is real.

---

### 3. [DATA] Core My Work aggregation SQL is not reproducible from repo migrations

**Severity:** HIGH  
**Location:** `supabase/functions/unified-work-list/index.ts:50-53,81-84,110-113,191-193`, `frontend/src/types/database.types.ts:31518-31536,35020-35200`, `supabase/migrations/20260531120000_fix_get_team_workload_email_text_cast.sql:1-16`

**Root cause:** `/my-work` depends on generated contracts for `unified_work_items`, `get_unified_work_items`, `get_user_work_summary`, and `get_user_productivity_metrics`, but the repo migrations inspected in this branch do not contain the SQL definitions for those core view/RPCs. The only relevant migration source found is a later `get_team_workload` patch. Generated types prove the contracts exist in the schema snapshot, but they do not show source-specific scoping logic, deadline derivation, status mapping, or due-window count definitions.

**Suggested fix:** Add forward migrations, or otherwise commit the canonical SQL source, for the unified view/RPC/materialized-view definitions. Regenerate frontend/backend database types from that source and add a read-only smoke test that checks the per-source carve-outs: tasks use `assignee_id` + `sla_deadline`/`workflow_stage`; commitments use `due_date` and the intended `owner_*`/`created_by` semantics; intake uses its own `assigned_to`, `status`, `urgency`, and deadline source. Until then, those semantics remain **VERIFY vs live**.

---

### 4. [I18N] Arabic mode still shows English/ASCII metric units and numerals

**Severity:** MEDIUM  
**Location:** `frontend/src/pages/my-work/components/ProductivityMetrics.tsx:46-52,72-88,110-116`, `frontend/src/pages/my-work/components/TeamWorkloadPanel.tsx:70-72,105-110,119-124,138-155`, `frontend/src/pages/my-work/components/WorkItemTabs.tsx:72-80`

**Root cause:** The `my-work` namespace has EN+AR key parity and no inspected dot-form leaks, but several numbers/units bypass locale formatting. Average completion returns strings like `3h` or `2d`; on-time rate returns `${v}%`; team cards render raw member counts, overdue counts, active counts, and percentages; tab badges render raw numbers and `99+`. In Arabic mode these remain ASCII/English unit fragments even though surrounding labels are translated.

**Suggested fix:** Centralize number/percent/duration formatting for My Work. Use `Intl.NumberFormat` with the current locale for counts and percentages, and i18n duration keys for hours/days instead of hard-coded `h`/`d`.

---

### 5. [HONEST UI] Team workload progress bars use a fabricated max capacity of 20

**Severity:** MEDIUM  
**Location:** `frontend/src/pages/my-work/components/TeamWorkloadPanel.tsx:78-80,126-135`, `frontend/src/types/database.types.ts:34878-34892`

**Root cause:** Team workload rows returned by `get_team_workload` include counts and rates, but no capacity field. The UI still renders a capacity-looking progress bar using `Math.min((member.total_active / 20) * 100, 100)` and a comment that assumes 20 is max capacity. That makes the bar look operationally precise when the threshold is a local constant.

**Suggested fix:** Either remove the progress bar and show the real `total_active` count, or back it with a real capacity source/threshold returned by the API. If a default threshold is a product rule, label and configure it explicitly rather than embedding `20` in the component.

---

### 6. [URL] Dashboard quick action links to an unsupported `/my-work?action=create-task` state

**Severity:** LOW  
**Location:** `frontend/src/components/dashboard-widgets/QuickActionsWidget.tsx:58-65`, `frontend/src/routes/_protected/my-work/index.tsx:24-38`, `frontend/src/pages/my-work/MyWorkDashboard.tsx:29-240`, `frontend/src/hooks/useContextAwareFAB.ts:122-130,219-224`

**Root cause:** The default dashboard quick action for creating a task routes to `/my-work?action=create-task`. The `/my-work` search schema does not include `action`, and `MyWorkDashboard` never reads it, so the URL lands on the dashboard without opening a creation flow. The context-aware FAB for `/my-work` uses a different path: it routes to `/kanban?create=true`.

**Suggested fix:** Point the dashboard quick action at the real create surface, or teach `/my-work` to accept `action=create-task` and open the same Work Creation palette or Kanban create flow. Keep the route schema, QuickActionsWidget, Command Palette, and FAB aligned.

---

## Final

### (A) Safe to auto-fix

| Finding ID | Scope                                      | Why                                                                                         |
| ---------- | ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| 4          | My Work number/percent/duration formatting | Local presentation cleanup with verified EN+AR key parity; no backend dependency.           |
| 5          | Team workload progress bar honesty         | Local UI can remove or relabel the fabricated capacity bar without changing data contracts. |
| 6          | Unsupported dashboard quick-action URL     | Local routing/action cleanup; align with the existing create surface.                       |

### (B) Needs planned phase

| Finding ID | Scope                       | Why                                                                                                                                     |
| ---------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1          | Manager assignee drill-down | Requires backend authorization semantics, RPC/edge contract changes, summary/metrics consistency, and realtime behavior.                |
| 2          | Due-window quick filters    | Requires a real API/RPC filter contract across tasks, commitments, and intake unless the UI is deliberately downgraded to summary-only. |
| 3          | Core aggregation SQL source | Requires DB migration/source-of-truth work, type regeneration, and live verification of source-specific scoping.                        |

Summary: `/my-work` is mounted, active in the Sidebar Operations group, and has clean EN/AR key parity for its own namespace. The highest-risk route-surface defects are URL/filter honesty issues: manager assignee drill-down is visually present but dropped before the RPC, and due-today/week quick filters write URL state without changing the list query. The larger data-layer risk is reproducibility: generated types expose the unified view/RPC contracts, but the core SQL definitions are not in repo migrations, so the exact per-source "my" scoping and deadline derivation remain **VERIFY vs live**.

Recommended phase order: first restore/commit the canonical unified aggregation SQL and regenerate types; then implement authorized assignee and due-window filters end-to-end with summary/count consistency; then clean up local i18n formatting, workload honesty, and inbound create URLs.
