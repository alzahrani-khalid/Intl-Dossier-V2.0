# SLA Monitoring Workflow Inspection Report

**Date:** Wed 10 Jun 2026  
**Scope:** Read-only code + contract inspection of `/sla-monitoring`; active Sidebar discoverability; route file, page, tabs, child components, hooks, repository layer; SLA dashboard, policies, escalation list, acknowledge/resolve flows; SLA data origin; Supabase table/RPC/edge references validated against generated frontend database types; i18n EN+AR registration/parity; RTL/design-token compliance; honest-UI checks  
**Branch:** `quick/260608-c9b-country-dossier-workflow-fixes`  
**Constraint:** No source edits; findings only. The only file write is this report.  
**Inspector:** codex (substituting for cursor-agent — monthly quota exhausted)

Prior coverage note: `reports/task-queue-escalations-workflow-inspection-2026-06-09.md` already inspected `/tasks/queue` and `/tasks/escalations`, including the assignment `escalation_events`/`sla_escalations` distinction, the existing `sla_escalations` enum, `SLADashboardPage` acknowledge/resolve actions, and the contract-broken `escalations-report` edge function. This report focuses on `/sla-monitoring` as its own surface and does not re-audit those task routes.

---

## Scope

### Routes traced

| URL               | Nav source                                                                                                                                                                                                                         | Route file                                               | Page / component                                                                                    | Result                                                                                                                                                                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/sla-monitoring` | Not in active Sidebar groups from `frontend/src/components/layout/navigation-config.ts:69-117,166-219`. Available through Command Palette quick action at `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:797-800`. | `frontend/src/routes/_protected/sla-monitoring.tsx:1-10` | `SLADashboardPage` -> `useSLAMonitoring` -> work-items repository -> Edge Function `sla-monitoring` | Mounted in generated route tree (`frontend/src/routeTree.gen.ts:26,290-294,2707-2711`). The page renders dashboard, policies, and escalations tabs over the SLA edge function, but key backend origin contracts are incomplete or unverifiable. |

Nav wiring notes:

- The active protected shell renders `Sidebar` from `frontend/src/components/layout/AppShell.tsx:182-193`.
- `Sidebar` consumes `createNavigationGroups` from `frontend/src/components/layout/Sidebar.tsx:58-65`.
- The active Operations group includes `/dashboard`, `/engagements`, `/after-actions`, `/my-work`, `/calendar`, `/briefs`, and `/activity` at `frontend/src/components/layout/navigation-config.ts:69-117`; it does not include `/sla-monitoring`.
- EN+AR labels for `navigation.slaMonitoring` exist at `frontend/src/i18n/en/common.json:180-193` and `frontend/src/i18n/ar/common.json:180-193`, but the active Sidebar never consumes them for this route.

### Child components & hooks

| Surface                        | Files                                                                           | Role                                                                | Current wiring                                                                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route wrapper                  | `frontend/src/routes/_protected/sla-monitoring.tsx:1-10`                        | TanStack route wrapper                                              | Mounts `SLADashboardPage`.                                                                                                                                                              |
| Page shell                     | `frontend/src/pages/sla-monitoring/SLADashboardPage.tsx:87-381`                 | Header filters, tabs, policy dialog, action handlers                | Uses `useTranslation('sla')`, `useDirection`, SLA query hooks, and acknowledge/resolve/policy mutations.                                                                                |
| Compatibility hook             | `frontend/src/hooks/useSLAMonitoring.ts:1-25`                                   | Backward-compatible re-export                                       | Re-exports the domain hook from `@/domains/work-items`.                                                                                                                                 |
| Domain hook                    | `frontend/src/domains/work-items/hooks/useSLAMonitoring.ts:41-271`              | TanStack Query wrappers + realtime invalidation                     | Calls repository functions for dashboard, compliance, at-risk items, policies, escalations, acknowledge/resolve, manual breach check, and subscribes to `sla_events`/`sla_escalations`. |
| Repository layer               | `frontend/src/domains/work-items/repositories/work-items.repository.ts:141-260` | Edge-function client adapter                                        | Builds `/functions/v1/sla-monitoring/...` paths through `apiGet/apiPost/apiPut/apiDelete` (`frontend/src/lib/api-client.ts:36-54,69-92`).                                               |
| Overview cards                 | `frontend/src/components/sla-monitoring/SLAOverviewCards.tsx:23-167`            | Compliance, totals, at-risk, breached, average resolution cards     | Consumes dashboard RPC response. Uses token classes except threshold labels are English/Arabic constants, not i18n keys.                                                                |
| Compliance chart               | `frontend/src/components/sla-monitoring/SLAComplianceChart.tsx:57-203`          | Trend chart with line/area tabs                                     | Consumes dashboard `trend_data`; uses LTR isolation and RTL axis reversal, but hard-codes chart green hex values.                                                                       |
| Compliance table               | `frontend/src/components/sla-monitoring/SLAComplianceTable.tsx:45-218`          | Breakdown by request type and assignee                              | Consumes compliance RPC responses; request type labels depend on `sla.types.*` keys.                                                                                                    |
| At-risk list                   | `frontend/src/components/sla-monitoring/SLAAtRiskList.tsx:30-179`               | Items approaching breach                                            | Receives data and refresh handler from the page; row/detail click affordances are not wired by `SLADashboardPage`.                                                                      |
| Escalations list               | `frontend/src/components/sla-monitoring/SLAEscalationsList.tsx:69-298`          | Status filter, escalation cards, acknowledge/resolve UI             | Reads `sla_escalations`; actions call page handlers, which call mutation hooks.                                                                                                         |
| Policy form                    | `frontend/src/components/sla-monitoring/SLAPolicyForm.tsx:45-50,52-487`         | Create/edit policy form                                             | Submits matching criteria, targets, escalation levels, notification channels, and active flag; does not expose/write `entity_type`, `applies_to_units`, or `excluded_assignees`.        |
| Edge Function `sla-monitoring` | `supabase/functions/sla-monitoring/index.ts:54-187,193-501`                     | Dashboard, policies, escalations, acknowledge/resolve, breach check | Wired from the repository, but several RPCs are absent from generated DB types and escalation-row origin is missing in source.                                                          |

### Backend / Supabase surfaces

| Surface                                     | Role                                                     | Type validation against `database.types.ts`                                                                                                                                                                                                                    | Wired from workflow?                                                                                            |
| ------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Edge Function `sla-monitoring`              | Endpoint backing all `/sla-monitoring` data/actions      | Source calls generated tables and several ungenerated RPCs. API path is reached through the edge base in `frontend/src/lib/api-client.ts:36-54`.                                                                                                               | Yes, all page queries/mutations route through it.                                                               |
| Table `sla_policies`                        | Policy CRUD and matching configuration                   | Exists with `entity_type`, `request_type`, `sensitivity`, `urgency`, `priority`, targets, escalation config, channels, and scope fields at `frontend/src/types/database.types.ts:24821-24896`.                                                                 | Yes, policy list/create/update/soft-delete. Entity type/scope fields are not exposed by the form or edge input. |
| Table `sla_escalations`                     | Escalation list and lifecycle actions                    | Exists with `pending/triggered/acknowledged/resolved/dismissed` status and relationships to `sla_policies`/`sla_events` at `frontend/src/types/database.types.ts:24686-24765`.                                                                                 | Read/update yes. Source writer not found; **VERIFY vs live** for any deployed external writer.                  |
| Table `sla_events`                          | SLA lifecycle events and realtime dashboard invalidation | Exists with `ticket_id`, `policy_id`, `event_type`, timing fields, breach flag, and `created_by` at `frontend/src/types/database.types.ts:24767-24820`.                                                                                                        | Yes for realtime invalidation and breach metrics; not directly listed by `/sla-monitoring`.                     |
| Table `sla_compliance_snapshots`            | Trend data source for dashboard chart                    | Exists at `frontend/src/types/database.types.ts:24599-24657`.                                                                                                                                                                                                  | Indirectly via migration-only `get_sla_dashboard_overview`; live snapshot cron is **VERIFY vs live**.           |
| View `sla_compliance_by_assignee`           | Existing generated assignee metric view                  | Exists with `full_name`, `full_name_ar`, totals, compliance, and `unit_id` at `frontend/src/types/database.types.ts:31323-31345`.                                                                                                                              | Not used by the edge function; the migration-only RPC queries `staff_profiles` directly instead.                |
| RPC `get_sla_dashboard_overview`            | Dashboard card metrics and trend JSON                    | Defined only in migration source at `supabase/migrations/20260111600001_enhanced_sla_monitoring.sql:263-320`; exact name is absent from generated `frontend/src/types/database.types.ts` Functions.                                                            | Yes, called by edge function at `supabase/functions/sla-monitoring/index.ts:193-209`; **VERIFY vs live**.       |
| RPC `get_sla_compliance_by_type`            | Compliance breakdown by request type                     | Defined only in migration source at `supabase/migrations/20260111600001_enhanced_sla_monitoring.sql:323-359`; exact name is absent from generated frontend DB types.                                                                                           | Yes, called by edge function at `supabase/functions/sla-monitoring/index.ts:211-227`; **VERIFY vs live**.       |
| RPC `get_sla_compliance_by_assignee`        | Compliance breakdown by assignee                         | Defined only in migration source at `supabase/migrations/20260111600001_enhanced_sla_monitoring.sql:362-411`; exact name is absent from generated frontend DB types and references absent `staff_profiles` names.                                              | Yes, called by edge function at `supabase/functions/sla-monitoring/index.ts:229-245`; **VERIFY vs live**.       |
| RPC `get_sla_at_risk_items`                 | At-risk item list                                        | Defined only in migration source at `supabase/migrations/20260111600001_enhanced_sla_monitoring.sql:414-457`; exact name is absent from generated frontend DB types and returns ticket rows only.                                                              | Yes, called by edge function at `supabase/functions/sla-monitoring/index.ts:247-263`; **VERIFY vs live**.       |
| RPC `check_sla_breaches`                    | Manual breach-event creation                             | Generated at `frontend/src/types/database.types.ts:32380-32385`, but generated return is an array of `{ breach_count, ticket_count }`; edge wraps returned `data` as if it were a scalar/count.                                                                | Hook exported, edge endpoint exists, but not mounted by `SLADashboardPage`. Contract is **VERIFY vs live**.     |
| RPC `get_sla_breached_tickets`              | Breached ticket list                                     | Generated at `frontend/src/types/database.types.ts:34736-34747`.                                                                                                                                                                                               | Hook exported by `useSLAMonitoring`; not mounted by `SLADashboardPage`.                                         |
| RPC `sla_check_and_escalate` + pg_cron      | Assignment SLA cron from older assignment workflow       | Generated as `Returns: undefined` at `frontend/src/types/database.types.ts:36646`; migration source returns a table and inserts into `escalation_events`, not `sla_escalations`, at `supabase/migrations/20251002015_create_sla_monitoring_function.sql:6-63`. | Not wired to `/sla-monitoring` escalation list; cron deployment is **VERIFY vs live**.                          |
| Trigger/RPC `start_sla_tracking`/SLA events | Intake ticket SLA origin                                 | `start_sla_tracking` generated at `frontend/src/types/database.types.ts:36755`; trigger/function source writes `sla_events` at `supabase/migrations/20250129004_create_sla_tables.sql:97-215`.                                                                 | Origin for `sla_events`, not for `sla_escalations`. Prior intake SLA RPC findings are not duplicated here.      |

### i18n namespaces

| Namespace / key group                           | Routes / components                         | EN                                                   | AR                                                   | Registered in `i18n/index.ts`                                                    | Notes                                                                                                                                                  |
| ----------------------------------------------- | ------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sla`                                           | `/sla-monitoring` page and all SLA children | `frontend/src/i18n/en/sla.json:1-199`                | `frontend/src/i18n/ar/sla.json:1-199`                | Imports at `frontend/src/i18n/index.ts:69-70`; resources at `:289,:415`          | EN+AR key parity verified with a flattened key diff: 146 EN keys, 146 AR keys, no missing keys on either side.                                         |
| `sla.common.*`                                  | Policy table and dialogs                    | `frontend/src/i18n/en/sla.json:163-170`              | `frontend/src/i18n/ar/sla.json:163-170`              | Same `sla` namespace registration                                                | `SLADashboardPage` asks for `common.status`, `common.actions`, `common.active`, and `common.inactive`, but those keys are not present in `sla.common`. |
| `keyboard-shortcuts.quickActions.slaMonitoring` | Command Palette route discovery             | `frontend/src/i18n/en/keyboard-shortcuts.json:37-56` | `frontend/src/i18n/ar/keyboard-shortcuts.json:37-56` | Imports/resources at `frontend/src/i18n/index.ts:103-104,306,432`                | Command Palette can navigate to `/sla-monitoring` and has EN+AR labels.                                                                                |
| Default/common `navigation.slaMonitoring`       | Potential active Sidebar label              | `frontend/src/i18n/en/common.json:180-193`           | `frontend/src/i18n/ar/common.json:180-193`           | `translation`/`common` resources at `frontend/src/i18n/index.ts:255-257,381-383` | Labels exist, but active Sidebar config does not include an item that uses them.                                                                       |

---

## Environment

| Check                            | Result                                                                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Backend health                   | `GET http://127.0.0.1:5001/health` -> **200** `{"status":"ok","timestamp":"2026-06-09T21:04:23.372Z","environment":"development"}` |
| Frontend `/sla-monitoring` shell | `HEAD http://127.0.0.1:5175/sla-monitoring` -> **200** SPA HTML (`Content-Type: text/html`)                                        |
| Authenticated browser UAT        | Not performed; inspection stayed source/read-only and sent no write requests.                                                      |
| Live Supabase DB/RPC/schema      | Not probed with auth; migration/RPC/cron deployment claims are **VERIFY vs live**.                                                 |
| Typecheck / tests                | Not run; avoided toolchain commands that may write build/cache artifacts under the hard write constraint.                          |

---

## Findings

### 1. [SLA] Escalation list/actions are wired to `sla_escalations`, but source contains no writer for that table

**Severity:** CRITICAL  
**Location:** `frontend/src/pages/sla-monitoring/SLADashboardPage.tsx:126-157,348-356`, `frontend/src/components/sla-monitoring/SLAEscalationsList.tsx:151-292`, `supabase/functions/sla-monitoring/index.ts:407-475`, `supabase/migrations/20260111600001_enhanced_sla_monitoring.sql:65-108`, `supabase/migrations/20251002015_create_sla_monitoring_function.sql:24-63`, `supabase/migrations/20250129014_create_sla_tracking_functions.sql:162-238`

**Root cause:** `/sla-monitoring` reads and updates `sla_escalations`, and the UI exposes acknowledge/resolve actions for rows from that table. However, a source search found no `INSERT INTO sla_escalations` or `.from('sla_escalations').insert(...)` outside the table-creation migration. The scheduled `sla_check_and_escalate()` path creates assignment `escalation_events`, and `check_sla_breaches()` creates `sla_events`; neither creates `sla_escalations`.

**Suggested fix:** Pick one canonical escalation model for SLA monitoring. Either implement a real `sla_escalations` writer from SLA breach detection using `sla_policies.escalation_levels`, or repoint the page to the actual event/escalation source. Verify any deployed cron or external worker separately (**VERIFY vs live**) before closing this.

---

### 2. [SLA] Dashboard/compliance/at-risk RPCs called by the edge function are absent from generated database types

**Severity:** HIGH  
**Location:** `frontend/src/domains/work-items/repositories/work-items.repository.ts:174-203`, `supabase/functions/sla-monitoring/index.ts:193-255`, `frontend/src/types/database.types.ts:32014,32380-32385,34736-34747,36646,36755`, `supabase/migrations/20260111600001_enhanced_sla_monitoring.sql:263-457`

**Root cause:** The edge function calls `get_sla_dashboard_overview`, `get_sla_compliance_by_type`, `get_sla_compliance_by_assignee`, and `get_sla_at_risk_items`. These functions exist only in migration source; exact-name searches against generated frontend/backend database types found no generated `Functions` entries for them. The generated types do include nearby SLA functions (`check_sla_breaches`, `get_sla_breached_tickets`, `sla_check_and_escalate`, `start_sla_tracking`), so this is not just a broad search miss.

**Suggested fix:** Confirm whether the four RPCs are actually deployed (**VERIFY vs live**). If they are intended, apply the migration and regenerate database types; if not, rewrite the edge function to use generated views/RPCs. Add an edge-function contract smoke test that fails when an RPC is missing from generated types.

---

### 3. [SLA] Metric SQL is ticket-only while the UI advertises ticket, commitment, and task SLA monitoring

**Severity:** HIGH  
**Location:** `frontend/src/pages/sla-monitoring/SLADashboardPage.tsx:93,102-130,208-216`, `frontend/src/domains/work-items/repositories/work-items.repository.ts:174-203,237-242`, `supabase/migrations/20260111600001_enhanced_sla_monitoring.sql:291-294,352-356,401-455`, `frontend/src/components/sla-monitoring/SLAPolicyForm.tsx:45-49,197-265`, `supabase/functions/sla-monitoring/index.ts:306-327,344-370`, `frontend/src/types/database.types.ts:24829,24854,37848`

**Root cause:** The page exposes an `entityType` filter with `ticket`, `commitment`, and `task`, and `sla_policies.entity_type` exists in generated types. The dashboard/compliance/at-risk SQL shown in migration source reads `intake_tickets` only, `get_sla_at_risk_items` returns `'ticket'::sla_entity_type`, and the policy form/edge create-update payloads do not expose or write `entity_type`. Selecting commitment/task therefore cannot produce real non-ticket metrics or policies from the inspected source.

**Suggested fix:** Until commitment/task SLA sources exist, constrain the UI to ticket-only and label it honestly. For full support, add entity-specific metric queries/origin writers, expose `entity_type` in policy CRUD, and add tests showing each entity type returns distinct data.

---

### 4. [SLA] Migration-only assignee/at-risk RPC definitions reference staff columns absent from generated schema

**Severity:** HIGH  
**Location:** `supabase/migrations/20260111600001_enhanced_sla_monitoring.sql:380-407,435-450`, `frontend/src/types/database.types.ts:25019-25038,31323-31336`, `supabase/functions/sla-monitoring/index.ts:229-255`

**Root cause:** The migration definitions for `get_sla_compliance_by_assignee` and `get_sla_at_risk_items` join `staff_profiles` and select `sp.full_name` / `sp.full_name_ar`. Generated `staff_profiles` has no `full_name` or `full_name_ar`; those names exist on the generated `sla_compliance_by_assignee` view, not the table. If these migration functions are deployed as written against the generated schema, the edge function can fail at runtime.

**Suggested fix:** Rewrite the RPCs to use the actual staff/user display-name source, or query the generated `sla_compliance_by_assignee` view where appropriate. Regenerate types and add a live RPC smoke test for the assignee and at-risk endpoints.

---

### 5. [SLA] Policy form/options and translations drift from generated enum contracts

**Severity:** MEDIUM  
**Location:** `frontend/src/components/sla-monitoring/SLAPolicyForm.tsx:45-49,197-265`, `frontend/src/pages/sla-monitoring/SLADashboardPage.tsx:301-306`, `frontend/src/i18n/en/sla.json:121-147`, `frontend/src/i18n/ar/sla.json:121-147`, `frontend/src/types/database.types.ts:37764-37770,37795-37800`

**Root cause:** Generated `priority_level` includes `critical` and `normal`, but the SLA policy form and `sla.priority.*` translations expose only `low/medium/high/urgent`. Generated `request_type` includes `dossier`, but the form and `sla.types.*` translations expose only `engagement/position/mou_action/foresight`. Existing or future policies with omitted enum values can render raw/fallback labels, and users cannot create those valid policy variants through the page.

**Suggested fix:** Derive policy select options from a shared generated-enum map or explicit schema-aligned constants. Add EN+AR labels for every valid enum value, then verify current seed/live policy values before changing user-visible filters.

---

### 6. [SLA] Policy table leaks missing `sla.common.*` keys

**Severity:** MEDIUM  
**Location:** `frontend/src/pages/sla-monitoring/SLADashboardPage.tsx:291-315`, `frontend/src/i18n/en/sla.json:163-170`, `frontend/src/i18n/ar/sla.json:163-170`, `frontend/src/i18n/index.ts:69-70,289,415`

**Root cause:** `SLADashboardPage` uses `useTranslation('sla')`, then renders `t('common.status')`, `t('common.actions')`, `t('common.active')`, and `t('common.inactive')`. The registered `sla` namespace has only `cancel/save/saving/delete/edit/view` under `common`, so these table labels can render raw dot-form keys. EN+AR parity for `sla.json` is otherwise verified: 146 keys in each file, with no missing keys on either side.

**Suggested fix:** Either add the missing keys to `sla.common` in both EN and AR, or request a real common/shared namespace explicitly for those labels.

---

### 7. [SLA] At-risk item cards advertise detail navigation but no handler is wired

**Severity:** MEDIUM  
**Location:** `frontend/src/components/sla-monitoring/SLAAtRiskList.tsx:22-27,116-135`, `frontend/src/pages/sla-monitoring/SLADashboardPage.tsx:245-249`

**Root cause:** `SLAAtRiskList` renders each card with `cursor-pointer`, a hover state, and an external-link icon button, but `SLADashboardPage` passes only `data`, `isLoading`, and `onRefresh`; it does not pass `onItemClick`. As mounted by `/sla-monitoring`, the row and icon suggest navigation/details but do nothing.

**Suggested fix:** Wire entity-aware navigation/detail opening from `entity_type` + `entity_id`, or remove the clickable styling and external-link affordance until the detail flow exists.

---

### 8. [NAV] `/sla-monitoring` is absent from the active Sidebar

**Severity:** MEDIUM  
**Location:** `frontend/src/components/layout/AppShell.tsx:182-193`, `frontend/src/components/layout/Sidebar.tsx:58-65`, `frontend/src/components/layout/navigation-config.ts:69-117,166-219`, `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:797-800`, `frontend/src/i18n/en/common.json:180-193`, `frontend/src/i18n/ar/common.json:180-193`

**Root cause:** The route is mounted and discoverable through the Command Palette, and EN+AR `navigation.slaMonitoring` labels already exist. The active Sidebar config does not include an item for `/sla-monitoring`, so normal shell navigation cannot discover this operations surface.

**Suggested fix:** Add an active Sidebar entry only after the backend/origin semantics above are corrected, so navigation does not promote a partially schema-only workflow.

---

### 9. [DESIGN] Compliance chart bypasses design tokens with hard-coded hex colors

**Severity:** LOW  
**Location:** `frontend/src/components/sla-monitoring/SLAComplianceChart.tsx:145-153,182-195`

**Root cause:** The line/area chart hard-codes `#22c55e` for stroke and gradient stops while the surrounding SLA components use semantic classes/tokens such as `text-success`, `text-warning`, and `text-danger`. This makes the chart less themeable and can drift from the design-token palette.

**Suggested fix:** Resolve chart colors from CSS variables or the app chart-token layer, and keep the Recharts stroke/fill values aligned with semantic success/warning/destructive tokens.

---

## Final

### (A) Safe to auto-fix

| Finding ID | Scope                                          | Why                                                                                   |
| ---------- | ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| 6          | Missing `sla.common.*` keys or namespace calls | Local i18n fix with verified EN+AR parity expectations.                               |
| 7          | At-risk card affordance                        | Local presentation/navigation affordance fix once the desired target route is chosen. |
| 9          | Chart design-token colors                      | Local styling cleanup with low data risk.                                             |

### (B) Needs planned phase

| Finding ID | Scope                                | Why                                                                                                                                           |
| ---------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1          | `sla_escalations` origin/writer      | Requires choosing the canonical escalation model and implementing backend/cron/RPC behavior, not just UI changes.                             |
| 2          | Missing generated RPC contracts      | Requires live deployment verification, migration/type regeneration, and edge contract tests.                                                  |
| 3          | Entity-type support honesty          | Requires product/data-model decision: ticket-only UI vs real commitment/task SLA sources and policy support.                                  |
| 4          | Assignee/at-risk RPC schema mismatch | Requires SQL redesign against the actual staff/user schema and live RPC validation.                                                           |
| 5          | Policy enum contract alignment       | Requires checking current seed/live policy values and deciding whether all generated enum variants should be user-creatable in this workflow. |
| 8          | Active Sidebar placement             | Should follow backend/origin correction so the shell does not advertise a partly nonfunctional workflow.                                      |

Summary: `/sla-monitoring` is mounted and has a coherent frontend shell for dashboard, policies, and escalation actions, with EN+AR `sla` namespace parity verified. The blocking issue is backend reality: the page reads and updates `sla_escalations`, but inspected source contains no writer for that table; older cron/breach paths write `escalation_events` or `sla_events` instead. The dashboard also depends on migration-only RPCs absent from generated database types, and the inspected SQL is ticket-only despite UI/entity-policy affordances for commitments and tasks. Recommended phase order: first decide and implement the canonical SLA escalation origin, then reconcile/apply/regenerate the dashboard RPC contracts, then make entity-type support honest (ticket-only or truly multi-entity), then fix policy enum/i18n drift and local UI affordances, and only then expose `/sla-monitoring` in the active Sidebar.
