# Task Queue + Escalations Workflow Inspection Report

**Date:** Tue 9 Jun 2026  
**Scope:** Read-only code + contract inspection of `/tasks/queue` and `/tasks/escalations`; dormant modern-nav items `task-queue` and `task-escalations`; active Sidebar discoverability; route files, pages, hooks, child components; assignment queue, task escalation, waiting-queue escalation, and SLA escalation backend/Supabase surfaces; generated database type validation; i18n EN+AR registration/parity; RTL/design-token compliance; honest-UI checks  
**Branch:** `quick/260608-c9b-country-dossier-workflow-fixes`  
**Constraint:** No source edits; findings only. The only file write is this report.  
**Inspector:** codex (substituting for cursor-agent — monthly quota exhausted)

Prior coverage note: `reports/work-items-kanban-workflow-inspection-2026-06-09.md` already inspected the unified work-items KANBAN (`/tasks`, `WorkBoard`, unified kanban edge functions, `work_item_dossiers`). This report does not re-audit that board. It treats `/tasks/queue` as the older assignment-capacity queue over `assignment_queue`, not the unified tasks kanban and not an SLA deadline queue.

---

## Scope

### Routes traced

| URL                  | Nav source                                                                                                                                   | Route file                                                 | Page / component                                                                   | Result                                                                                                                                                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/tasks/queue`       | Dormant modern-nav workflow item `task-queue` at `frontend/src/components/modern-nav/navigationData.ts:169-175`; not in active Sidebar       | `frontend/src/routes/_protected/tasks/queue.tsx:1-5`       | `AssignmentQueuePage` -> `useAssignmentQueue` -> Edge Function `assignments-queue` | Mounted in generated route tree (`frontend/src/routeTree.gen.ts:89,619-627,3148-3159`). Reads assignment-capacity queue rows from `assignment_queue`. The visible Assign action is not wired.                            |
| `/tasks/escalations` | Dormant modern-nav workflow item `task-escalations` at `frontend/src/components/modern-nav/navigationData.ts:184-189`; not in active Sidebar | `frontend/src/routes/_protected/tasks/escalations.tsx:1-5` | `EscalationsPage` -> `EscalationDashboard` -> Edge Function `escalations-report`   | Mounted in generated route tree (`frontend/src/routeTree.gen.ts:89-90,619-627,3155-3159`). Displays escalation analytics over assignment escalation history; it is not an actionable acknowledge/resolve/reassign queue. |

Nav wiring notes:

- The active protected shell renders `Sidebar` from `frontend/src/components/layout/AppShell.tsx:182-193`.
- `Sidebar` consumes `createNavigationGroups` from `frontend/src/components/layout/navigation-config.ts:58-64`.
- The active Sidebar Operations group includes `/dashboard`, `/engagements`, `/after-actions`, `/my-work`, `/calendar`, `/briefs`, and `/activity` at `frontend/src/components/layout/navigation-config.ts:69-117`; it does not include `/tasks/queue` or `/tasks/escalations`.
- The older modern-nav dataset contains both requested items at `frontend/src/components/modern-nav/navigationData.ts:155-190`, but that dataset is dormant for the active shell.

### Child components & hooks

| Surface                          | Files                                                                                                                                       | Role                                                                        | Current wiring                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Queue route                      | `frontend/src/routes/_protected/tasks/queue.tsx:1-5`                                                                                        | TanStack route wrapper                                                      | Mounts `AssignmentQueuePage`.                                                                                                                      |
| Queue page                       | `frontend/src/pages/AssignmentQueue.tsx:16-205`                                                                                             | Summary cards, priority/type filters, queue cards, Assign button            | Calls `useAssignmentQueue`; renders raw queue IDs and a visual Assign button with no handler.                                                      |
| Queue hook                       | `frontend/src/hooks/useAssignmentQueue.ts:46-70`                                                                                            | React Query fetcher                                                         | Invokes `assignments-queue` with method `GET`; filter params are built but not appended to the function URL.                                       |
| Queue backend read               | `supabase/functions/assignments-queue/index.ts:118-186`                                                                                     | Reads `assignment_queue`, filters by role/unit, calculates `queue_position` | Wired from `/tasks/queue`, but its response shape does not match the frontend hook/page contract.                                                  |
| Auto-assign enqueue path         | `supabase/functions/assignments-auto-assign/index.ts:86-126`                                                                                | Enqueues items when staff capacity is exhausted                             | Not called from `/tasks/queue`; included as queue model context. Live deployment is **VERIFY vs live**.                                            |
| Manual override path             | `supabase/functions/assignments-manual-override/index.ts:15-21,204-218`                                                                     | Intended manual assignment override                                         | Not called from `/tasks/queue`; also writes fields not present in generated `assignments` types. Live deployment is **VERIFY vs live**.            |
| Queue processor                  | `supabase/functions/queue-processor/index.ts:1-11,97-110`                                                                                   | Intended assignment queue drain after capacity frees                        | Not called from the page. Source imports a missing `backend/src/services/queue.service.ts`; live deployment is **VERIFY vs live**.                 |
| Escalations route                | `frontend/src/routes/_protected/tasks/escalations.tsx:1-5`                                                                                  | TanStack route wrapper                                                      | Mounts `EscalationsPage`.                                                                                                                          |
| Escalations page                 | `frontend/src/pages/Escalations.tsx:6-27`                                                                                                   | Header, info alert, analytics dashboard                                     | Uses default i18n namespace for `assignments.*` keys and has no action list.                                                                       |
| Escalation dashboard             | `frontend/src/components/assignments/EscalationDashboard.tsx:78-453`                                                                        | Date/group filters, summary cards, timeline/unit/staff/work-type tabs       | Fetches `/functions/v1/escalations-report`; no acknowledge, resolve, reassign, or row-level escalation action is rendered.                         |
| SLA escalation actions           | `frontend/src/pages/sla-monitoring/SLADashboardPage.tsx:126-157`                                                                            | Acknowledge/resolve actions for SLA escalations                             | Separate `/sla-monitoring` workflow over `sla_escalations`; not wired from `/tasks/escalations`.                                                   |
| Waiting-queue escalation actions | `frontend/src/domains/intake/hooks/useWaitingQueueActions.ts:132-174`, `frontend/src/components/waiting-queue/EscalationDialog.tsx:128-179` | Escalate/acknowledge/resolve hooks and dialog for waiting queue             | Not mounted by `/tasks/queue` or `/tasks/escalations`; `WaitingQueue.tsx` renders reminders but not `EscalationDialog` in the inspected page body. |

### Backend / Supabase surfaces

| Surface                                       | Role                                                                         | Type validation against `database.types.ts`                                                                                                                                                                                                            | Wired from workflow?                                                                |
| --------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Table `assignment_queue`                      | Capacity queue for work items waiting for staff capacity                     | Exists with `id`, `work_item_id`, `work_item_type`, `required_skills`, `target_unit_id`, `priority`, `created_at`, `attempts`, `last_attempt_at`, `notes` at `frontend/src/types/database.types.ts:2709-2720`.                                         | Yes, read by `/tasks/queue` through `assignments-queue`.                            |
| Edge Function `assignments-queue`             | GET queue list, role/unit filtering, queue positions                         | Reads valid `assignment_queue` fields, but returns `id`, `created_at`, `queue_position`, and raw `required_skills`; frontend expects `queue_id`, `queued_at`, `position`, and skill objects.                                                           | Yes.                                                                                |
| Edge Function `assignments-auto-assign`       | Creates `assignments` or enqueues `assignment_queue` when no capacity exists | Queue insert fields align with `assignment_queue`; assignment insert omits generated required `sla_deadline` unless a live trigger fills it. Trigger/deployment is **VERIFY vs live**.                                                                 | No direct `/tasks/queue` call.                                                      |
| Edge Function `assignments-manual-override`   | Manual assign override by supervisor/admin                                   | Inserts `override_reason` and `is_manual_override` into `assignments` at `supabase/functions/assignments-manual-override/index.ts:204-218`; those columns are absent from generated `assignments` at `frontend/src/types/database.types.ts:2858-2928`. | No. The `/tasks/queue` Assign button is not wired to it.                            |
| DB trigger `process_queue_on_capacity_change` | Emits `pg_notify('queue_process_needed')` when assignment capacity frees     | Defined in migration at `supabase/migrations/20251002014_create_queue_processing_trigger.sql:6-42`; trigger functions are not exposed in generated `Functions`. Live webhook/listener is **VERIFY vs live**.                                           | Indirect backend only.                                                              |
| RPC `process_stale_queue_items`               | Fallback queue processor cron                                                | Generated as `process_stale_queue_items` at `frontend/src/types/database.types.ts:35800`, but migration returns zero and only sends a notification (`supabase/migrations/20251002019_setup_queue_fallback_cron.sql:11-26`).                            | No frontend wiring.                                                                 |
| Table `escalation_events`                     | Assignment escalation audit/report table                                     | Exists at `frontend/src/types/database.types.ts:12328-12340`; references `assignments`.                                                                                                                                                                | Yes, via `escalations-report`.                                                      |
| Edge Function `escalations-report`            | Analytics for `/tasks/escalations`                                           | Queries generated tables, but uses absent columns/relations: `assignments.organizational_unit_id`, `organizational_units.name`, and `staff_profiles.full_name`.                                                                                        | Yes, called by `EscalationDashboard`.                                               |
| Table `escalation_records`                    | Waiting-queue escalation record model                                        | Exists at `frontend/src/types/database.types.ts:12382-12404` with `escalation_reason`, `status`, `acknowledged_at`, `resolved_at`; no `reason`, `notes`, `acknowledged_by`, `resolved_by`, or `resolution`.                                            | No from `/tasks/escalations`; used by dormant waiting-queue escalation action code. |
| Edge Function `waiting-queue-escalation`      | Escalate, bulk escalate, acknowledge, resolve assignment escalations         | Uses valid RPC `get_escalation_path` (`frontend/src/types/database.types.ts:33825-33835`) but writes columns absent from `escalation_records`. Live deployment is **VERIFY vs live**.                                                                  | No from inspected routes.                                                           |
| Table `sla_escalations`                       | SLA monitoring escalation lifecycle                                          | Exists at `frontend/src/types/database.types.ts:24686-24707` with `pending/triggered/acknowledged/resolved/dismissed` status enum at `frontend/src/types/database.types.ts:37848-37854`.                                                               | No from `/tasks/escalations`; used by `/sla-monitoring`.                            |
| Edge Function `sla-monitoring`                | SLA dashboard, policies, escalations, acknowledge/resolve                    | Reads/updates `sla_escalations` at `supabase/functions/sla-monitoring/index.ts:413-473`.                                                                                                                                                               | No from `/tasks/escalations`.                                                       |

### i18n namespaces

| Namespace / key group                                       | Routes / components                              | EN                                                    | AR                                              | Registered in `i18n/index.ts`                      | Notes                                                                                                                               |
| ----------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `assignments`                                               | `EscalationDashboard`                            | `frontend/src/i18n/en/assignments.json:25-29,184-214` | `frontend/src/i18n/ar/assignments.json:155-185` | `frontend/src/i18n/index.ts:17-18,262-264,388-390` | Dashboard uses `useTranslation('assignments')`, but page wrapper does not.                                                          |
| Default namespace `translation` / `common` `navigation.*`   | Active Sidebar and dormant modern-nav label keys | `frontend/src/i18n/en/common.json:140-212`            | `frontend/src/i18n/ar/common.json:140-212`      | `frontend/src/i18n/index.ts:255-257,381-383`       | `navigation.taskQueue` and `navigation.taskEscalations` are not present, while dormant modern-nav references them.                  |
| Default namespace `translation` / `common` `waitingQueue.*` | Waiting queue components, not `/tasks/queue`     | `frontend/src/i18n/en/common.json:831-1030`           | `frontend/src/i18n/ar/common.json:831-1030`     | `frontend/src/i18n/index.ts:255-257,381-383`       | EN+AR waiting queue keys exist under common, but `/tasks/queue` hardcodes English instead of using them.                            |
| Missing route-local queue namespace                         | `/tasks/queue`                                   | Not applicable                                        | Not applicable                                  | Not registered                                     | `AssignmentQueuePage` imports no `useTranslation` and renders hardcoded English labels.                                             |
| Default namespace dot-form leak                             | `/tasks/escalations` wrapper                     | Keys live in `assignments`, not default               | Keys live in `assignments`, not default         | Not applicable                                     | `EscalationsPage` calls `useTranslation()` and then `t('assignments.escalations.*')`, so the page header/alert can render raw keys. |

---

## Environment

| Check                               | Result                                                                                                                             |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Backend health                      | `GET http://127.0.0.1:5001/health` -> **200** `{"status":"ok","timestamp":"2026-06-09T20:53:47.434Z","environment":"development"}` |
| Frontend `/tasks/queue` shell       | `HEAD http://127.0.0.1:5175/tasks/queue` -> **200** SPA HTML                                                                       |
| Frontend `/tasks/escalations` shell | `HEAD http://127.0.0.1:5175/tasks/escalations` -> **200** SPA HTML                                                                 |
| Authenticated browser UAT           | Not performed; inspection stayed source/read-only and sent no write requests.                                                      |
| Live Supabase DB/RPC/schema         | Not probed with auth; DB/RPC/view deployment claims are **VERIFY vs live**.                                                        |
| Typecheck / tests                   | Not run; avoided toolchain commands that may write build/cache artifacts under the hard write constraint.                          |

---

## Findings

### 1. [QUEUE] Queue rows returned by the edge function do not match the frontend contract

**Severity:** HIGH  
**Location:** `frontend/src/hooks/useAssignmentQueue.ts:15-28`, `frontend/src/pages/AssignmentQueue.tsx:153-164`, `supabase/functions/assignments-queue/index.ts:42-62,175-186`, `frontend/src/types/database.types.ts:2709-2720`

**Root cause:** `AssignmentQueuePage` renders `item.queue_id`, `item.position`, `item.queued_at`, and `item.required_skills[].skill_name_en`. The hook declares those same fields. The wired edge function returns the database row fields plus `queue_position`: `id`, `created_at`, and `required_skills` as UUID strings. The generated type confirms `assignment_queue.required_skills` is `string[]`, not an array of skill label objects.

**Suggested fix:** Normalize the `assignments-queue` response to the frontend contract, or update the hook/page to consume the actual response (`id`, `queue_position`, `created_at`, raw skill UUIDs). If skill names are required, join a real skill table in the function and type the response explicitly.

---

### 2. [QUEUE] Queue filters are not sent as query params, and "All" becomes an invalid filter value

**Severity:** HIGH  
**Location:** `frontend/src/hooks/useAssignmentQueue.ts:50-59`, `frontend/src/pages/AssignmentQueue.tsx:101-127`, `supabase/functions/assignments-queue/index.ts:118-140`, `frontend/src/types/database.types.ts:37764-37770`

**Root cause:** The hook builds `URLSearchParams`, but calls `supabase.functions.invoke('assignments-queue', { method: 'GET', body: ... })` instead of appending the query string to the function URL. The edge function reads `new URL(req.url).searchParams`, so the filters/page/page_size never arrive as implemented. The UI also stores `<SelectItem value="all">`, which the hook forwards as `priority=all` / `work_item_type=all` instead of clearing the filter. Finally, the generated `priority_level` enum includes `critical` and `medium` in addition to `urgent/high/normal/low`, but the queue UI and function docs only expose four values. Live enum history is **VERIFY vs live**.

**Suggested fix:** Send GET filters in the URL (or change the function to POST and read JSON consistently), map `all` to `undefined`, and align queue priority choices with the generated `priority_level` contract after confirming the live enum.

---

### 3. [QUEUE] The visible Assign action is inert and the manual override path is not contract-safe

**Severity:** HIGH  
**Location:** `frontend/src/pages/AssignmentQueue.tsx:179-183`, `supabase/functions/assignments-manual-override/index.ts:15-21,204-218`, `frontend/src/types/database.types.ts:2858-2928`

**Root cause:** Queue cards render an enabled "Assign" button with no `onClick`, dialog, mutation, link, or disabled state. The likely backend action, `assignments-manual-override`, is not called from this page. If wired as-is, that function inserts `override_reason` and `is_manual_override` into `assignments`, but those columns are absent from the generated `assignments` type.

**Suggested fix:** Either remove/disable the button until manual assignment exists, or wire it to a typed manual-assignment flow. Before wiring `assignments-manual-override`, reconcile its insert payload against the current `assignments` schema and add a queue-row removal/update step.

---

### 4. [QUEUE] Queue auto-drain source is incomplete: processor imports a missing service and fallback cron is a placeholder

**Severity:** HIGH  
**Location:** `supabase/functions/queue-processor/index.ts:1-11,97-110`, `supabase/migrations/20251002019_setup_queue_fallback_cron.sql:11-26`, `frontend/src/types/database.types.ts:35800`

**Root cause:** `queue-processor` imports `processQueue` from `../../../backend/src/services/queue.service.ts`, but no `backend/src/services/queue.service.ts` exists in this checkout. The fallback RPC `process_stale_queue_items` is present in generated types, but the migration implementation only emits a notification and returns `0`; it does not process or assign queued items.

**Suggested fix:** Implement the missing queue service or move processing logic into a deployable edge function/RPC. Replace the fallback placeholder with real processing or remove the cron until the actual processor is configured. Verify the deployed queue processor separately (**VERIFY vs live**).

---

### 5. [ESC] `/tasks/escalations` report queries columns absent from generated DB types

**Severity:** CRITICAL  
**Location:** `frontend/src/components/assignments/EscalationDashboard.tsx:107-126`, `supabase/functions/escalations-report/index.ts:109-124,210-242`, `frontend/src/types/database.types.ts:2858-2928,19822-19831,25019-25038`

**Root cause:** The dashboard calls `escalations-report`, and the function joins `escalation_events` to `assignments` while selecting/filtering `assignments.organizational_unit_id`. The generated `assignments` table has no `organizational_unit_id` and no relationship entry to `organizational_units`. The same function fetches `organizational_units.name`, but the generated table has `name_en` and `name_ar`; it also fetches `staff_profiles.full_name`, but generated `staff_profiles` has no `full_name`.

**Suggested fix:** Rewrite `escalations-report` against the generated contract: derive unit through `staff_profiles.unit_id` or another typed relation, select `organizational_units.name_en/name_ar`, and resolve display names through the repo's actual user/profile pattern. Add an edge-function contract test using generated types or a live schema smoke test.

---

### 6. [ESC] `/tasks/escalations` claims management but exposes only analytics

**Severity:** HIGH  
**Location:** `frontend/src/pages/Escalations.tsx:14-26`, `frontend/src/components/assignments/EscalationDashboard.tsx:291-450`, `frontend/src/pages/sla-monitoring/SLADashboardPage.tsx:126-157`

**Root cause:** The route copy says users can "Monitor and manage escalated assignments requiring immediate attention", but the mounted dashboard only renders aggregate analytics tabs. There is no escalation list with acknowledge, resolve, reassign, or assignment detail actions. Acknowledge/resolve mutations exist in the separate `/sla-monitoring` workflow over `sla_escalations`, not in `/tasks/escalations`.

**Suggested fix:** Decide whether `/tasks/escalations` is an analytics report or an operations queue. If analytics, rename/copy it honestly and remove "manage" language. If operations, add a typed escalation list and wire explicit acknowledge/resolve/reassign actions to one canonical escalation model.

---

### 7. [ESC] Dormant waiting-queue escalation actions use an `escalation_records` shape that does not exist

**Severity:** MEDIUM  
**Location:** `supabase/functions/waiting-queue-escalation/index.ts:210-221,343-351,441-449,514-522`, `frontend/src/types/database.types.ts:12382-12404`

**Root cause:** The waiting-queue escalation function writes `reason`, `notes`, `acknowledged_by`, `resolved_by`, and `resolution` on `escalation_records`. The generated `escalation_records` table exposes `escalation_reason`, `status`, `acknowledged_at`, and `resolved_at`, but none of those write columns. This function is not mounted by `/tasks/escalations`, but it is the only inspected source that contains assignment escalation acknowledge/resolve handlers.

**Suggested fix:** Do not reuse this action path for `/tasks/escalations` until its payload matches the generated schema or the schema is intentionally migrated. Prefer consolidating assignment escalation actions around one typed model.

---

### 8. [ESC] Escalations page wrapper leaks default-namespace keys

**Severity:** MEDIUM  
**Location:** `frontend/src/pages/Escalations.tsx:7,14-22`, `frontend/src/components/assignments/EscalationDashboard.tsx:79,309-312,350-351,382-383,426-428`, `frontend/src/i18n/en/assignments.json:25-29,184-214`, `frontend/src/i18n/ar/assignments.json:155-185`, `frontend/src/i18n/index.ts:262-264,388-390`

**Root cause:** `EscalationsPage` calls `useTranslation()` with the default namespace and then requests `assignments.escalations.*`. Those keys are registered under the `assignments` namespace, not under `translation/common`, so the header and info alert can render raw dot-form keys. Inside `EscalationDashboard`, `useTranslation('assignments')` is correct for dashboard keys, but loading states call `t('common.loading')` inside the `assignments` namespace, which is another dot-form leak.

**Suggested fix:** Use `useTranslation('assignments')` in `EscalationsPage` and request `escalations.title/description/info`. For dashboard loading text, either add `loading` under `assignments` or request the real common namespace with `t('loading', { ns: 'common' })`.

---

### 9. [QUEUE] `/tasks/queue` has no EN/AR i18n path and weak mobile/RTL treatment

**Severity:** MEDIUM  
**Location:** `frontend/src/pages/AssignmentQueue.tsx:53-58,60-99,101-140,142-199`, `frontend/src/i18n/en/common.json:831-1030`, `frontend/src/i18n/ar/common.json:831-1030`

**Root cause:** `AssignmentQueuePage` imports no `useTranslation` and renders all page text, filter labels, buttons, empty state, date labels, priority labels, and error fallback text in English. Existing EN+AR `waitingQueue.*` keys are registered under common, but this route does not use them. The filter row is a fixed `flex gap-4` with two `w-[180px]` selects and no wrapping/collapse, so it is fragile on narrow screens. Dates use `toLocaleString()` without the app locale/direction context.

**Suggested fix:** Move route copy into a real registered namespace or reuse `common.waitingQueue` keys with explicit EN+AR parity. Use logical spacing/text utilities consistently, pass the active locale to date formatting, and make the filter bar wrap or collapse on mobile.

---

### 10. [QUEUE] `/tasks/queue` and `/tasks/escalations` are not discoverable from the active Sidebar

**Severity:** MEDIUM  
**Location:** `frontend/src/components/layout/AppShell.tsx:182-193`, `frontend/src/components/layout/Sidebar.tsx:58-65`, `frontend/src/components/layout/navigation-config.ts:69-117`, `frontend/src/components/modern-nav/navigationData.ts:155-190`, `frontend/src/i18n/en/common.json:140-212`, `frontend/src/i18n/ar/common.json:140-212`

**Root cause:** The active protected shell renders `Sidebar`, which uses `createNavigationGroups`. That active config does not include `/tasks/queue` or `/tasks/escalations`. The only nav entries for these routes live in dormant modern-nav. Those dormant entries reference `navigation.taskQueue` and `navigation.taskEscalations`, but the active EN/AR common navigation dictionaries do not define those keys.

**Suggested fix:** Add active Sidebar entries only after the queue and escalation semantics are corrected. If the dormant modern-nav dataset is revived, add EN+AR `navigation.taskQueue` and `navigation.taskEscalations` keys or point those entries at existing keys.

---

## Final

### (A) Safe to auto-fix

| Finding ID | Scope                                      | Why                                                               |
| ---------- | ------------------------------------------ | ----------------------------------------------------------------- |
| 8          | Escalations route i18n namespace calls     | Local call-site/key fix with low data risk.                       |
| 9          | Queue page copy/i18n/mobile filter cleanup | Local presentation cleanup once the page contract is kept stable. |

### (B) Needs planned phase

| Finding ID | Scope                                                | Why                                                                                                                        |
| ---------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1          | Queue response contract                              | Requires deciding whether the edge function or frontend hook owns the response adapter and whether skill names are needed. |
| 2          | Queue filter transport and enum alignment            | Requires API contract correction plus live enum verification.                                                              |
| 3          | Manual assignment from queue                         | Requires UX, mutation, schema, and queue-row lifecycle decisions.                                                          |
| 4          | Queue auto-drain processor                           | Requires backend implementation/deployment verification, not a cosmetic frontend patch.                                    |
| 5          | Escalation report schema contract                    | Blocks the analytics backend and needs typed query redesign.                                                               |
| 6          | Escalations operations vs analytics product decision | Requires choosing whether `/tasks/escalations` is a report or an actionable queue.                                         |
| 7          | Waiting-queue escalation record contract             | Requires schema/function consolidation before reuse.                                                                       |
| 10         | Active Sidebar placement                             | Should follow workflow/model decisions so navigation does not promote broken routes.                                       |

Summary: `/tasks/queue` is an assignment-capacity queue over `assignment_queue`, but its frontend contract does not match the edge response, its filters are not transported correctly, its Assign action is inert, and its backend auto-drain path is incomplete in source. `/tasks/escalations` is an analytics page, not a management queue; its reporting function currently references columns absent from generated database types, while acknowledge/resolve behavior lives in separate SLA and waiting-queue paths. Recommended phase order: first repair the assignment queue API contract and filter transport, then decide and implement manual assignment/queue drain semantics, then fix the escalation report query against generated types, then choose analytics vs operations for `/tasks/escalations`, and only then expose these routes in active navigation with EN+AR i18n and responsive/RTL cleanup.
