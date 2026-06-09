# Audit Logs Workflow Inspection Report

**Date:** Wed 10 Jun 2026  
**Scope:** Read-only code + contract inspection of the admin `/audit-logs` route; Administration nav discoverability and gating; page, filters, table, detail affordance, export, statistics components; audit domain hooks/repository; `audit-logs-viewer` edge function; generated Supabase table/view contracts for `audit_log`, `audit_logs`, and `audit_statistics`; audit-log producers; i18n EN+AR registration/parity, RTL/design-token compliance, and honest-UI checks  
**Branch:** `quick/260608-c9b-country-dossier-workflow-fixes`  
**Constraint:** No source edits; findings only. The only file write is this report.  
**Inspector:** codex (substituting for cursor-agent — monthly quota exhausted)

Prior coverage note: the global `/activity` feed (`activity_stream`, `activity-feed`) was inspected separately in `reports/activity-workflow-inspection-2026-06-10.md`. This report focuses on the admin audit-log viewer and its audit-trail contracts. Per-dossier `*/audit` tab routes are noted only to confirm they are separate mostly-stub surfaces, not the admin `/audit-logs` implementation.

---

## Scope

### Routes traced

| URL                    | Nav source                                                                                                                                                                         | Route file                                                                                                                                                                                                                                  | Page / component                                                                       | Result                                                                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/audit-logs`          | Administration item at `frontend/src/components/layout/navigation-config.ts:200-203`; Administration group emitted only when `createNavigationGroups(..., isAdmin)` receives true. | `frontend/src/routes/_protected/audit-logs.tsx:1-5`                                                                                                                                                                                         | `AuditLogsPage` -> audit domain hooks -> `audit-logs-viewer` edge function.            | Mounted, but route has no route-local admin guard beyond `_protected`; data contract defects below prevent reliable filtering/pagination/export/statistics. |
| `/admin/*` examples    | Administration group.                                                                                                                                                              | `frontend/src/routes/_protected/admin/field-permissions.tsx:89-101`, `frontend/src/routes/_protected/admin/system.tsx:28-41`                                                                                                                | Route-local `beforeLoad` admin gates.                                                  | Uses auth metadata role source, not the `users` table role source used by Sidebar and `audit-logs-viewer`.                                                  |
| Dossier `*/audit` tabs | Dossier tab navigation.                                                                                                                                                            | Country/person/org/forum/topic/working-group/elected-official route files under `frontend/src/routes/_protected/dossiers/**/$id/audit.tsx`; engagement audit at `frontend/src/routes/_protected/engagements/$engagementId/audit.tsx:14-22`. | Mostly `dossier-shell` coming-soon stubs; engagement audit uses lifecycle transitions. | Separate from admin `/audit-logs`; most dossier audit tabs are not wired to `audit_log` or `audit_logs`.                                                    |

### Child components & hooks

| Surface              | Files                                                                                                             | Role                                                                                                      | Current wiring                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Page shell / adapter | `frontend/src/pages/audit-logs/AuditLogsPage.tsx:62-137,143-334`                                                  | Holds filters/pagination state, renders header actions, statistics panel, filters, table, and pagination. | Active, but adapter sends stale query parameter names and reads stale response fields.                              |
| Filters              | `frontend/src/components/audit-logs/AuditLogFilters.tsx:93-534`                                                   | Search, table, operation, date, IP filters, active chips.                                                 | Active UI, but table options come from a stub hook and most filter state is not forwarded to the edge function.     |
| Table                | `frontend/src/components/audit-logs/AuditLogTable.tsx:75-407`                                                     | Audit row rendering, sort buttons, expandable change details, related-log action.                         | Active, but sort state is not forwarded by the page/hook contract; row detail click has no detail surface.          |
| Export               | `frontend/src/components/audit-logs/AuditLogExport.tsx:37-75`                                                     | CSV/JSON export dropdown.                                                                                 | Active UI but calls stub `useAuditLogExport`, so no network export is performed.                                    |
| Statistics           | `frontend/src/components/audit-logs/AuditLogStatistics.tsx:51-209`                                                | Operation/table totals panel.                                                                             | Active UI but calls stub `useAuditLogStatistics`, so it renders empty/zero statistics instead of the edge function. |
| Domain hooks         | `frontend/src/domains/audit/hooks/useAuditLogs.ts:24-101`; re-export at `frontend/src/hooks/useAuditLogs.ts:1-14` | TanStack Query wrappers for list/detail/stats/export/distinct.                                            | List/detail real; distinct/statistics/export hooks used by active components are stubs.                             |
| Repository           | `frontend/src/domains/audit/repositories/audit.repository.ts:14-29`                                               | Edge API calls.                                                                                           | List/detail real; stats path and export method do not match `audit-logs-viewer`.                                    |

### Backend / Supabase surfaces

| Surface                           | Role                                                                                                                                  | Type validation against `database.types.ts`                                                                                                                                                                                                                                                                           | Wired from workflow?                                                                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Edge Function `audit-logs-viewer` | Lists, details, export, statistics, distinct values for audit entries.                                                                | Selects `audit_log.table_name`, `operation`, `row_id`, `old_data`, `new_data`, `changed_fields`, `user_email`, `user_role`, `request_id` at `supabase/functions/audit-logs-viewer/index.ts:55-75`, but generated `audit_log` type at `frontend/src/types/database.types.ts:3042-3057` does not include those columns. | Yes, active `/audit-logs` list calls this function. Contract is not generated-type-safe.                                                                     |
| Table `audit_log`                 | Generic DB-trigger audit table per `supabase/migrations/010_audit.sql:4-20`; trigger helper enabled on critical tables at `:188-198`. | Generated type does not match the migration/edge selection. Live schema is **VERIFY vs live**.                                                                                                                                                                                                                        | This is what `audit-logs-viewer` reads, despite the route/page naming.                                                                                       |
| View `audit_statistics`           | Stats view over `audit_log` at `supabase/migrations/010_audit.sql:274-287`.                                                           | Not found as a generated view in inspected `database.types.ts`; edge references it at `supabase/functions/audit-logs-viewer/index.ts:282-287`.                                                                                                                                                                        | Edge can fallback to direct `audit_log`, but active UI never calls this edge route.                                                                          |
| Table `audit_logs`                | Admin/compliance trail table in generated types at `frontend/src/types/database.types.ts:3090-3146`; many edge functions write to it. | Generated columns validate the intake-style writer shape (`entity_type`, `entity_id`, `action`, `old_values`, `new_values`, `user_id`, `user_role`, etc.), but not role-management writer columns like `event_type`, `target_user_id`, `resource_type`, `changes`.                                                    | Not read by active `/audit-logs`; separate edge functions write/read it directly.                                                                            |
| `audit_logs` producers            | Direct edge writes found across auth, role, intake, assignment, engagement-position, commitment, export, and access-review flows.     | Mixed writer schemas are present. Examples: intake-style write at `supabase/functions/intake-tickets-create/index.ts:219-233`; role-management write at `supabase/functions/assign-role/index.ts:239-248,341-348`; intake-specific read at `supabase/functions/intake-audit-logs/index.ts:81-105`.                    | The trail is not schema-only, but the admin viewer does not surface the main `audit_logs` producer set. Coverage and deployed schema are **VERIFY vs live**. |

### i18n namespaces

| Namespace / key group                                | Routes / components                                  | EN                                                   | AR                                                   | Registered in `i18n/index.ts`                                           | Notes                                                                                           |
| ---------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `audit-logs`                                         | `/audit-logs`, audit filters/table/export/statistics | `frontend/src/i18n/en/audit-logs.json:1-134`         | `frontend/src/i18n/ar/audit-logs.json:1-134`         | Imports at `frontend/src/i18n/index.ts:45-46`; resources at `:277,:403` | Flattened key diff verified: 104 EN keys, 104 AR keys, no missing keys on either side.          |
| `common.navigation.auditLogs`                        | Sidebar Administration item                          | `frontend/src/i18n/en/common.json:203-212`           | `frontend/src/i18n/ar/common.json:203-212`           | Common namespace registered as default app translations                 | EN+AR labels exist.                                                                             |
| `dossier-shell.tabs.audit` / `emptyState.comingSoon` | Per-dossier audit tab stubs                          | `frontend/src/i18n/en/dossier-shell.json:2-12,76-78` | `frontend/src/i18n/ar/dossier-shell.json:2-12,76-78` | Registered dossier-shell namespace                                      | Most dossier audit routes use these keys; elected-official audit has a hard-coded English body. |

Active-route dot-form check: the `audit-logs` namespace itself has EN/AR parity. Component-level dynamic table labels intentionally fall back to table names for unknown tables. Component-level hard-coded EN/AR branches and one hard-coded English fallback remain findings below.

---

## Environment

| Check                        | Result                                                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Backend health               | `GET http://127.0.0.1:5001/health` -> **200** `{"status":"ok","timestamp":"2026-06-09T21:33:36.264Z","environment":"development"}` |
| Frontend `/audit-logs` shell | `HEAD http://127.0.0.1:5175/audit-logs` -> **200** SPA HTML (`Content-Type: text/html`)                                            |
| Authenticated browser UAT    | Not performed; inspection stayed read-only and did not send write requests.                                                        |
| Live Supabase DB/RLS/schema  | Not probed with auth. Deployed table shapes, RLS behavior, trigger coverage, and producer coverage are **VERIFY vs live**.         |
| Typecheck / tests            | Not run; avoided toolchain commands that may write build/cache artifacts under the hard write constraint.                          |
| Worktree note                | Existing modified file observed: `frontend/src/routeTree.gen.ts`. It was not touched.                                              |

---

## Findings

### 1. [AUDIT-DATA] Admin viewer reads `audit_log`, while the real compliance producers write `audit_logs`

**Severity:** HIGH  
**Location:** `supabase/functions/audit-logs-viewer/index.ts:55-75,195-225,270-360`, `frontend/src/types/database.types.ts:3042-3057,3090-3146`, `supabase/migrations/010_audit.sql:4-20,188-198`, `supabase/functions/intake-tickets-create/index.ts:219-233`, `supabase/functions/assign-role/index.ts:239-248,341-348`, `supabase/functions/intake-audit-logs/index.ts:81-105`

**Root cause:** The route is named `/audit-logs`, but the edge function powering it queries `audit_log` singular. The generated Supabase type for `audit_log` does not include the columns selected by the edge function (`table_name`, `operation`, `row_id`, `changed_fields`, `user_email`, `request_id`), while the generated `audit_logs` table has a different compliance shape. Repo search found many direct `audit_logs` writers, including intake/auth/role/admin flows, but those rows are invisible to `audit-logs-viewer`. There is also historical schema drift inside `audit_logs`: intake writers use generated fields like `old_values`/`new_values`, while role-management writers use fields such as `event_type`, `target_user_id`, `resource_type`, and `changes` that are absent from the checked-in generated type.

**Suggested fix:** Pick a canonical admin compliance source. If the admin page is intended to show `audit_logs`, rewire `audit-logs-viewer`, types, filters, stats, and export to `audit_logs` columns and migrate/normalize stale writer schemas. If the page is intended to show the generic trigger stream `audit_log`, rename the surface and add a separate `audit_logs` compliance viewer. Regenerate database types from the live schema and mark deployed trigger/writer coverage **VERIFY vs live** before closing.

---

### 2. [AUDIT-CONTRACT] List filters and pagination speak a different contract than the edge function

**Severity:** HIGH  
**Location:** `frontend/src/pages/audit-logs/AuditLogsPage.tsx:81-99,171-182,263-323`, `frontend/src/domains/audit/hooks/useAuditLogs.ts:24-48`, `frontend/src/components/audit-logs/AuditLogFilters.tsx:122-128,258-276,417-439`, `frontend/src/components/audit-logs/AuditLogTable.tsx:100-107`, `supabase/functions/audit-logs-viewer/index.ts:160-191,417-432`, `supabase/functions/_shared/utils.ts:53-63`

**Root cause:** The active page adapter converts filter state into `{ page, limit, action, entity_type, user_id, from, to }`. The hook forwards those names as query parameters. The edge function expects `{ limit, offset, operation, table_name, user_id, user_email, date_from, date_to, ip_address, search, row_id, sort_by, sort_order }`. As a result, operation/table/date filters are sent under names the edge ignores; search, IP, user email, row id, and sort are not forwarded at all; and page changes never change `offset`, so pagination keeps fetching the first page. The edge returns pagination under `metadata.total` and `metadata.has_more`, but the page reads `data.total` and `data.hasMore`, so the UI also believes there are zero total rows and no next page.

**Suggested fix:** Define one typed `AuditLogListParams` contract and use it end-to-end. Forward `offset`, `table_name`, `operation`, `date_from`, `date_to`, `ip_address`, `search`, `sort_by`, and `sort_order`; unwrap `metadata.total` and `metadata.has_more`; add a focused test around filter serialization and response adaptation.

---

### 3. [AUDIT-EXPORT-STATS] Export and statistics are advertised but currently stubbed or routed to nonexistent contracts

**Severity:** HIGH  
**Location:** `frontend/src/components/audit-logs/AuditLogExport.tsx:37-45`, `frontend/src/components/audit-logs/AuditLogStatistics.tsx:51-66,117-207`, `frontend/src/domains/audit/hooks/useAuditLogs.ts:59-77,90-101`, `frontend/src/domains/audit/repositories/audit.repository.ts:22-29`, `supabase/functions/audit-logs-viewer/index.ts:228-268,270-340,435-445`

**Root cause:** `AuditLogExport` calls `useAuditLogExport`, which is a stub returning `{ url: '', success: true }` without network I/O. The real-looking `useExportAuditLogs` hook exists, but the active component does not import it. Even if it did, the repository sends `POST /audit-logs-viewer/export`, while the edge function only handles `GET /audit-logs-viewer/export`. Statistics have the same split: `AuditLogStatistics` calls stub `useAuditLogStatistics`, which resolves `{}`; the non-stub `useAuditLogStats` calls `/audit-logs-viewer/stats`, while the edge function exposes `/audit-logs-viewer/statistics`. The UI can therefore show a statistics card and export dropdown without actually exporting or loading statistics.

**Suggested fix:** Remove the stub hooks from active imports or make them call the repository. Align repository paths/methods with the edge function (`GET /export?format=...` and `GET /statistics?...`, or add matching POST/stats aliases server-side). Add success/error toasts and a download path that handles non-JSON CSV responses instead of relying on `api-client` JSON parsing.

---

### 4. [AUDIT-AUTH] Admin gating is inconsistent across route, nav, and edge

**Severity:** MEDIUM  
**Location:** `frontend/src/routes/_protected/audit-logs.tsx:1-5`, `frontend/src/routes/_protected.tsx:39-52`, `frontend/src/components/layout/Sidebar.tsx:58-64`, `frontend/src/components/layout/navigation-config.ts:166-204`, `supabase/functions/audit-logs-viewer/index.ts:398-407`, `frontend/src/routes/_protected/admin/field-permissions.tsx:91-99`, `frontend/src/routes/_protected/admin/system.tsx:30-39`

**Root cause:** `/audit-logs` has only the parent authenticated route guard; it has no route-local admin guard. The Sidebar hides the Administration group using `useAuthStore().user?.role`, which is sourced from the `users` table. The edge function also checks the `users` table, but allows `admin`, `editor`, and `supervisor`. Other `/admin/*` routes gate with auth `user_metadata` / `app_metadata` and generally only allow `admin` or `super_admin`. This creates a direct-link split: an editor/supervisor may be blocked from navigation but allowed by the edge, while users with auth metadata admin but stale `users.role` may pass some `/admin/*` routes and fail this viewer.

**Suggested fix:** Define the role policy for audit-log viewing once and enforce it consistently in nav, route `beforeLoad`, edge function, and RLS. Prefer one role source (`users.role` or auth claims) and document any migration/sync requirement between them.

---

### 5. [AUDIT-DETAIL] Row/detail affordance is a placeholder despite a detail endpoint existing

**Severity:** MEDIUM  
**Location:** `frontend/src/pages/audit-logs/AuditLogsPage.tsx:147,166-169`, `frontend/src/components/audit-logs/AuditLogTable.tsx:322-333`, `frontend/src/domains/audit/hooks/useAuditLogs.ts:51-56`, `frontend/src/domains/audit/repositories/audit.repository.ts:18-20`, `supabase/functions/audit-logs-viewer/index.ts:195-225`

**Root cause:** The page stores `_selectedLog` and `handleLogClick` sets it, but no modal/drawer/detail panel renders it. Expanded rows show a `View Related Logs` button when `onLogClick` exists, yet clicking it only updates hidden state. The hook, repository, and edge function already provide a single-log detail path with related logs, but the active page never calls `useAuditLogDetail`.

**Suggested fix:** Either implement a read-only detail drawer/modal wired to `useAuditLogDetail`, or remove the row click and `View Related Logs` affordance until detail viewing exists. Keep detail copy and empty/error states in the `audit-logs` namespace.

---

### 6. [I18N-A11Y] Namespace parity is good, but mounted UI still has hard-coded strings and unnamed icon buttons

**Severity:** LOW  
**Location:** `frontend/src/components/audit-logs/AuditLogFilters.tsx:54-76,363-410,443-455`, `frontend/src/components/audit-logs/AuditLogTable.tsx:259-264,299-310`, `frontend/src/pages/audit-logs/AuditLogsPage.tsx:192-208`, `frontend/src/routes/_protected/dossiers/elected-officials/$id/audit.tsx:17-22`

**Root cause:** The `audit-logs` JSON namespace has exact EN/AR parity and is registered, but several mounted strings still bypass it: filter operation/date labels use inline `label_en`/`label_ar` pairs, custom date labels and clear actions branch on `isRTL`, and the table falls back to hard-coded English `System`. Several icon-only controls also lack explicit accessible names, including refresh, filter-chip clear buttons, search clear, and row expand/collapse. The elected-official dossier audit stub has a hard-coded English body.

**Suggested fix:** Move remaining visible strings into `audit-logs` or `dossier-shell` keys, keep table-name fallbacks only for unknown dynamic table ids, and add `aria-label`/visually hidden text for icon-only controls. RTL class usage in the audited active components is otherwise mostly logical (`start/end`, `ms/me`, `text-start`), with no major directional-layout violation found.

---

## Final

### (A) Safe to auto-fix

| Finding ID | Scope                                          | Why                                                                                              |
| ---------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 2          | Query parameter and response adapter alignment | The edge contract already exposes the needed filters/pagination; the page/hook adapter is stale. |
| 3          | Export/statistics hook and repository wiring   | Existing edge routes exist; active components are using stubs or wrong method/path.              |
| 5          | Detail drawer/modal or affordance removal      | Local UI behavior can be fixed using the existing detail hook/repository/edge path.              |
| 6          | i18n/a11y cleanup                              | Localized string moves and icon accessible names are route/component-local.                      |

### (B) Needs planned phase

| Finding ID | Scope                                              | Why                                                                                                                                                                            |
| ---------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1          | Canonical audit trail table/schema/writer contract | Requires deciding `audit_log` vs `audit_logs`, reconciling historical schemas, regenerating types, and verifying deployed DB/RLS/trigger coverage.                             |
| 4          | Audit-viewer role policy                           | Requires product/security decision on `admin` vs `editor`/`supervisor` access and a single role source across auth metadata, `users.role`, route guards, edge checks, and RLS. |

Summary: `/audit-logs` is mounted and discoverable through the admin Sidebar for profile-role admins/super-admins, but the workflow is not a reliable admin compliance trail today. The active viewer reads `audit_log` while the broader compliance producers write `audit_logs`; list filters/pagination do not match the edge query contract; export/statistics are visible but stubbed or routed to nonexistent method/path combinations; and row detail affordances do not open detail data. EN/AR namespace parity is clean, and RTL class usage is mostly logical, but hard-coded strings and missing accessible names remain.

Recommended phase order: first decide and normalize the canonical audit-trail source (`audit_log` vs `audit_logs`) and regenerate types; then align list filters/pagination response handling; then wire export/statistics/detail to real edge contracts; then standardize route/nav/edge/RLS role gating; finally land i18n/a11y cleanup.
