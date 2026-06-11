# Reports & Analytics Workflow Inspection Report

**Date:** Tue 9 Jun 2026  
**Scope:** Read-only code + contract inspection of `/reports` (index, `$reportId`, `scheduled`) and `/analytics`  
**Branch:** `quick/260608-c9b-country-dossier-workflow-fixes`  
**Constraint:** No source edits; findings only.

---

## Scope

### Routes traced

| URL                  | Route file                                             | Page / component                                                        |
| -------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------- |
| `/reports`           | `frontend/src/routes/_protected/reports/index.tsx`     | `frontend/src/pages/reports/ReportsPage.tsx`                            |
| `/reports/$reportId` | `frontend/src/routes/_protected/reports/$reportId.tsx` | `frontend/src/components/report-builder/ReportBuilder.tsx`              |
| `/reports/scheduled` | `frontend/src/routes/_protected/reports/scheduled.tsx` | `frontend/src/components/scheduled-reports/ScheduledReportsManager.tsx` |
| `/analytics`         | `frontend/src/routes/_protected/analytics.tsx`         | `frontend/src/pages/analytics/AnalyticsDashboardPage.tsx`               |

Parent layout: `frontend/src/routes/_protected/reports.tsx` (passthrough `<Outlet />` only).

Nav wiring: `frontend/src/components/modern-nav/navigationData.ts` links `/reports` and `/analytics` under the Reports category. **`/reports/scheduled` is not linked in nav** (route exists in `routeTree.gen.ts` only).

### Child components & hooks (by route)

**`/reports` (template generator)**

- UI: `ReportsPage.tsx` only (inline template catalog, no child feature components).
- Data: `useMutation` → `supabase.functions.invoke('reports', { body: { template, format, parameters } })` (`ReportsPage.tsx:182-207`).
- i18n: default namespace `useTranslation()` → keys under `common.reports.*`, `navigation.reports`, `mous.*`, `intelligence.*`, `organizations.*`.

**`/reports/$reportId` (custom report builder)**

- `ReportBuilder.tsx` + `EntitySelector`, `FieldList`, `ColumnBuilder`, `FilterBuilder`, `GroupingBuilder`, `SortingBuilder`, `VisualizationSelector`, `ReportPreview`, `SaveReportDialog`, `ScheduleReportDialog`, `SavedReportsList`.
- Hooks (re-exported from `frontend/src/hooks/useReportBuilder.ts` → `domains/misc/hooks/useReportBuilder.ts`): `useReportBuilderState`, `useReports`, `useCreateReport`, `useUpdateReport`, `useDeleteReport`, `useToggleFavorite`, `useReportPreview`, `useCreateSchedule`.
- **All builder/query/mutation hooks in `useReportBuilder.ts` are stubs** (empty state, no-op setters, `Promise.resolve` mutations) — lines 120-218.
- Real custom-report backend exists at `supabase/functions/custom-reports/index.ts` but is **not wired** from these hooks.

**`/reports/scheduled`**

- `ScheduledReportsManager.tsx`, `ScheduleFormDialog.tsx`, `RecipientsManager.tsx`, `ConditionsManager.tsx`, `ExecutionHistoryDialog.tsx`.
- Hooks: `frontend/src/hooks/useScheduledReports.ts` (Supabase tables + `scheduled-report-processor` edge invoke).
- Query keys: `['scheduled-reports']`, `['scheduled-reports', id]`, `['scheduled-reports', scheduleId, 'recipients'|'conditions'|'executions']`, `['custom-reports']`.

**`/analytics`**

- `AnalyticsDashboardPage.tsx` → `SummaryCard`, chart components (`EngagementMetricsChart`, `RelationshipHealthChart`, `CommitmentFulfillmentChart`, `WorkloadDistributionChart`), `AnalyticsPreviewOverlay`.
- Sample generators: `frontend/src/components/analytics/sample-data.ts` (`Math.random()` in trend generation).
- Hooks: `domains/analytics/hooks/useAnalyticsDashboard.ts` → `analytics.repository.ts` `apiGet('/analytics-dashboard?...', { baseUrl: 'express' })`; export via stub `useAnalyticsExport()` (lines 41-44).
- Query key: `['analytics', 'dashboard', params]`.
- i18n namespace: `analytics` (EN + AR JSON registered in `frontend/src/i18n/index.ts`).

### Backend / Supabase surfaces

| Surface                                                                                                    | Role                                                                                                                                                | Wired from workflow?                                                           |
| ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Express `GET /analytics-dashboard`                                                                         | Intended proxy target (`vite.config.ts:102-105`)                                                                                                    | Called by `analytics.repository.ts:12` — **route does not exist on backend**   |
| Express `POST /analytics/cluster`                                                                          | `backend/src/api/contract/analytics.ts`                                                                                                             | Unrelated to dashboard; not used by `/analytics` page                          |
| Edge `analytics-dashboard`                                                                                 | RPCs `get_analytics_summary`, `get_engagement_metrics`, `get_relationship_health_trends`, `get_commitment_fulfillment`, `get_workload_distribution` | **Not called** by current frontend (wrong query params + missing proxy)        |
| Edge `reports`                                                                                             | GET by `type` / POST async job                                                                                                                      | `/reports` invokes with **wrong body shape**; POST returns `job_id`, not `url` |
| Edge `custom-reports`                                                                                      | CRUD + preview for saved reports                                                                                                                    | Not wired to report-builder hooks                                              |
| Edge `scheduled-report-processor`                                                                          | Manual/scheduled run                                                                                                                                | `useRunScheduleNow` (`useScheduledReports.ts:333-337`)                         |
| Tables `report_schedules`, `report_schedule_recipients`, `report_delivery_conditions`, `report_executions` | Scheduled reports CRUD                                                                                                                              | `useScheduledReports.ts` — **VERIFY vs live**                                  |
| Table `custom_reports`                                                                                     | Schedule form report picker                                                                                                                         | `useAvailableReports` — **VERIFY vs live**                                     |
| SQL migrations `20260111600001_analytics_dashboard_views.sql`, RPC defs                                    | Analytics aggregates                                                                                                                                | **VERIFY vs live** (edge function references RPC names)                        |

### i18n namespaces

| Namespace                                                  | Routes               | EN                                            | AR                                            |
| ---------------------------------------------------------- | -------------------- | --------------------------------------------- | --------------------------------------------- |
| `common` (`reports`, `mous`, `intelligence`, `navigation`) | `/reports`           | `frontend/src/i18n/en/common.json`            | `frontend/src/i18n/ar/common.json`            |
| `analytics`                                                | `/analytics`         | `frontend/src/i18n/en/analytics.json`         | `frontend/src/i18n/ar/analytics.json`         |
| `scheduled-reports`                                        | `/reports/scheduled` | `frontend/src/i18n/en/scheduled-reports.json` | `frontend/src/i18n/ar/scheduled-reports.json` |
| `report-builder`                                           | `/reports/$reportId` | `frontend/src/i18n/en/report-builder.json`    | `frontend/src/i18n/ar/report-builder.json`    |

---

## Environment

| Check                 | Result                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| Backend health        | `GET http://127.0.0.1:5001/health` → **200**                                                         |
| Analytics proxy route | `GET http://127.0.0.1:5001/analytics-dashboard?time_range=30d` → **404** `{"error":"Not Found",...}` |
| Frontend dev server   | Assumed running at `http://127.0.0.1:5175` (not browser-tested)                                      |
| Login / UAT           | **Not attempted** — findings are code + contract + single API probe                                  |

---

## Findings

### 1. Analytics dashboard API path missing on Express; repository swallows 404 as empty data

**Severity:** CRITICAL  
**Location:** `frontend/src/domains/analytics/repositories/analytics.repository.ts:10-19`, `backend/src/index.ts:76-85`, `frontend/vite.config.ts:102-105`

**Root cause:** Frontend calls `GET /analytics-dashboard?time_range=...` via Express (`baseUrl: 'express'`). Backend mounts only `/analytics` (cluster POST) and has **no** `/analytics-dashboard` handler. On failure the repository returns `{ data: null }` instead of throwing, so TanStack Query reports success with empty payload.

**Suggested fix:** Add an Express proxy route (e.g. forward to `functions/v1/analytics-dashboard` with auth) **or** change `getAnalyticsDashboard` to call the edge function directly with correct params; remove silent `{ data: null }` fallback so the page can show error state.

---

### 2. Analytics query parameters and response shape do not match edge function contract

**Severity:** CRITICAL  
**Location:** `frontend/src/domains/analytics/hooks/useAnalyticsDashboard.ts:25-28`, `supabase/functions/analytics-dashboard/index.ts:46-55`, `frontend/src/pages/analytics/AnalyticsDashboardPage.tsx:90-98`

**Root cause:**

- Frontend sends `time_range`, `entity_type`, `metric`.
- Edge function expects `endpoint` (`summary` \| `engagements` \| `relationships` \| `commitments` \| `workload`) and optional `startDate` / `endDate`.
- Edge returns `{ success: true, data: { summary?, engagements?, ... } }` per endpoint (one section per request).
- Page casts `query.data` directly to `{ summary, engagements, ... }` without unwrapping `.data` or merging multiple endpoint responses.

**Suggested fix:** Map `timeRange` → `startDate`/`endDate`; fan out parallel requests per section (or extend edge function with `endpoint=all`); parse `response.data` in the hook before returning to the page.

---

### 3. Analytics KPI strip shows zeros when API fails instead of empty/error state

**Severity:** HIGH  
**Location:** `frontend/src/pages/analytics/AnalyticsDashboardPage.tsx:358-389`

**Root cause:** Summary cards use `displayData.summary?.totalEngagements || 0` (and similar). When the API returns `{ data: null }` or missing `summary`, charts correctly show preview overlays (`!data` branch in chart components), but KPI cards render **0** with no “no data” indicator — misleading vs live analytics.

**Suggested fix:** Gate summary cards on `displayData.summary` presence (same as charts), or treat `{ data: null }` as error in the repository.

---

### 4. `useAnalyticsExport` is a no-op stub; download button exports empty JSON

**Severity:** HIGH  
**Location:** `frontend/src/domains/analytics/hooks/useAnalyticsDashboard.ts:41-44`, `frontend/src/pages/analytics/AnalyticsDashboardPage.tsx:198-211`

**Root cause:** `useAnalyticsExport` resolves `{ url: '', success: true }`. Page stringifies that into a downloadable `.json` file — not real analytics export.

**Suggested fix:** Wire to edge/backend export endpoint (or remove/disable button until implemented); align with `analytics.json` `export.*` copy.

---

### 5. Reports template page invokes edge function with wrong request contract; expects `data.url` that is never returned

**Severity:** CRITICAL  
**Location:** `frontend/src/pages/reports/ReportsPage.tsx:182-207`, `supabase/functions/reports/index.ts:253-283`

**Root cause:**

- Page POST body: `{ template, format, parameters }`.
- Edge POST expects `{ type, format, filters?, language?, ... }` where `type` is e.g. `countries` \| `mous` \| `comprehensive` (`reports/index.ts:5-18`, `256-261`).
- Successful POST returns `{ job_id, status, check_status_url }` (202), not `{ url }`.
- `onSuccess` sets `url: data.url` for download link (`ReportsPage.tsx:202`) — always undefined; download anchor is broken.

**Suggested fix:** Map template IDs to edge `type`; poll `check_status_url` or use GET download path; handle `word` format (page allows `word`, edge allows `pdf` \| `excel` \| `json` only).

---

### 6. Reports edge function status/download paths return mock/fabricated payloads

**Severity:** HIGH  
**Location:** `supabase/functions/reports/index.ts:56-97`, `218-244`

**Root cause:** `GET .../status` returns a hardcoded completed job; `GET .../download` returns static summary counts (`total_countries: 195`, etc.). Not tied to user filters or generated output.

**Suggested fix:** Replace mock handlers with real job store + generated files in Storage, or clearly label UI as preview-only until backend exists.

---

### 7. Custom report builder (`/reports/$reportId`) is entirely stubbed — non-functional UI

**Severity:** CRITICAL  
**Location:** `frontend/src/domains/misc/hooks/useReportBuilder.ts:120-218`, `frontend/src/components/report-builder/ReportBuilder.tsx:56-96`

**Root cause:** `useReportBuilderState` returns frozen empty configuration and no-op mutators; `useReports` always `{ data: [] }`; create/update/delete/preview/schedule mutations resolve fake success. Drag-and-drop and save/schedule actions have no persistence despite full UI surface.

**Suggested fix:** Wire hooks to `supabase/functions/custom-reports` (or Express API) matching `report-builder.types.ts`; implement `loadConfiguration` for `initialReportId` route param.

---

### 8. Report builder scheduling hook is a separate stub from real scheduled-reports flow

**Severity:** HIGH  
**Location:** `frontend/src/domains/misc/hooks/useReportBuilder.ts:215-218`, `frontend/src/hooks/useScheduledReports.ts:237-258`

**Root cause:** `ReportBuilder` imports `useCreateSchedule` from `useReportBuilder` (stub). The working implementation is `useCreateSchedule` in `useScheduledReports.ts` (inserts into `report_schedules`). Two disconnected code paths; builder “Schedule” dialog cannot create real schedules.

**Suggested fix:** Re-export/use `useScheduledReports` mutations from the builder; map `reportId` → `report_id` in insert payload.

---

### 9. Scheduled reports route exists but is undiscoverable in navigation

**Severity:** MEDIUM  
**Location:** `frontend/src/routes/_protected/reports/scheduled.tsx`, `frontend/src/components/modern-nav/navigationData.ts:230-244`

**Root cause:** TanStack route `/reports/scheduled` is registered; nav category lists `/reports` and `/analytics` only. Users cannot reach scheduled reports without direct URL.

**Suggested fix:** Add nav item (e.g. `navigation.scheduledReports` → `/reports/scheduled`) and optional link from `/reports` index.

---

### 10. Scheduled reports list never shows linked report name (`schedule.report` always undefined)

**Severity:** MEDIUM  
**Location:** `frontend/src/hooks/useScheduledReports.ts:142-147`, `frontend/src/components/scheduled-reports/ScheduledReportsManager.tsx:307-315`

**Root cause:** Comment documents intentional omission of `custom_reports` join (“RLS infinite recursion”). `select('*')` only — `schedule.report` relation is never populated, so report name block in cards never renders.

**Suggested fix:** Secondary query keyed by `report_id` (batch fetch names from `custom_reports` or a safe view) without recursive RLS join.

---

### 11. Missing i18n key `reports.parametersTitle` in active locale files

**Severity:** MEDIUM  
**Location:** `frontend/src/pages/reports/ReportsPage.tsx:278`, `frontend/src/i18n/en/common.json:413-455` (absent), legacy `frontend/public/locales/en/translation.json:880` (present only in unused bundle)

**Root cause:** Page calls `t('reports.parametersTitle')` on default namespace; key exists only in deprecated `public/locales` files, not `src/i18n/en|ar/common.json`. EN/AR UI shows raw key or fallback string.

**Suggested fix:** Add `"parametersTitle"` under `reports` in both `frontend/src/i18n/en/common.json` and `frontend/src/i18n/ar/common.json`.

---

### 12. Wrong i18n paths for intelligence filter labels on reports page

**Severity:** MEDIUM  
**Location:** `frontend/src/pages/reports/ReportsPage.tsx:126-137`, `frontend/src/i18n/en/common.json:387-397`

**Root cause:** Page uses `t('intelligence.confidence.high')` and `t('intelligence.classification.public')`. Actual keys are `intelligence.confidenceLevels.*` and `intelligence.classifications.*`. Keys leak as literal text in EN and AR.

**Suggested fix:** Update `ReportsPage.tsx` to use `intelligence.confidenceLevels.high`, `intelligence.confidenceLevels.verified`, `intelligence.classifications.public`, `intelligence.classifications.internal`.

---

### 13. Hardcoded English country names in report template options (bilingual gap)

**Severity:** MEDIUM  
**Location:** `frontend/src/pages/reports/ReportsPage.tsx:54-56`

**Root cause:** Country select options use literal `'Saudi Arabia'`, `'UAE'`, `'Egypt'` instead of i18n or dossier country list.

**Suggested fix:** Load countries from API or use `t()` keys under `reports.parameters.countries.*` in EN/AR JSON.

---

### 14. Sample analytics data uses `Math.random()` and raw hex colors; can be mistaken for live metrics

**Severity:** MEDIUM  
**Location:** `frontend/src/components/analytics/sample-data.ts:48-64`, `127-132`, `285-288`; `frontend/src/pages/analytics/AnalyticsDashboardPage.tsx:164-196`

**Root cause:** “See example with sample data” fills KPI deltas and charts with fabricated numbers; trend lines use `Math.random()`. Sample health/priority colors use raw hex (`#10B981`, etc.) despite token policy elsewhere. Banner exists when sample mode on (`AnalyticsPreviewOverlay`), but KPI cards do not change styling to distinguish sample vs real.

**Suggested fix:** When `showingSampleData`, add visual badge on summary cards; replace hex in sample-data with `var(--*)` tokens; seed RNG for deterministic demos.

---

### 15. Analytics preview overlay violates IntelDossier design rules (gradients, Tailwind color literals, card shadow)

**Severity:** MEDIUM  
**Location:** `frontend/src/components/analytics/AnalyticsPreviewOverlay.tsx:55-85`, `137`, `144`, `386-411`

**Root cause:** Uses `bg-gradient-to-br`, `text-blue-600`, `from-emerald-50`, raw SVG stroke `#3B82F6` / `#10B981`, and `shadow-sm` on inner icon container. Conflicts with project rule: flat surfaces, token colors only, no card shadows.

**Suggested fix:** Restyle with `bg-surface`, `border-line`, `text-accent` / token utilities; remove gradients from preview placeholders.

---

### 16. Engagement chart uses hardcoded hex stroke colors (not design tokens)

**Severity:** LOW  
**Location:** `frontend/src/components/analytics/EngagementMetricsChart.tsx:84-88`, `213`

**Root cause:** `OUTCOME_COLORS` and line `stroke="#3B82F6"` bypass `DEFAULT_CHART_COLORS` / CSS variables used elsewhere in `analytics.types.ts`.

**Suggested fix:** Use `var(--color-accent)` / `HEALTH_LEVEL_COLORS` pattern consistently.

---

### 17. Reports page template cards use banned hover shadow

**Severity:** LOW  
**Location:** `frontend/src/pages/reports/ReportsPage.tsx:240-241`

**Root cause:** `hover:shadow-md` on selectable cards violates “no drop-shadows on cards” rule.

**Suggested fix:** Use border accent on hover (`border-accent` / `ring-1 ring-line`) instead of shadow.

---

### 18. Recent reports list is session-only; no persistence or error handling on generate failure

**Severity:** MEDIUM  
**Location:** `frontend/src/pages/reports/ReportsPage.tsx:39`, `195-207`

**Root cause:** `generatedReports` is React state only — lost on refresh. Mutation has no `onError`; failed invoke gives no user feedback. No loading/error UI beyond button disabled state.

**Suggested fix:** Persist to `report_executions` or user history table; add toast on error; optionally use `useReportHistory` from misc domain when wired.

---

### 19. `useScheduleRecipients` embeds `user:users(...)` join — may fail if FK/view differs in live DB

**Severity:** MEDIUM  
**Location:** `frontend/src/hooks/useScheduledReports.ts:164-168`

**Root cause:** PostgREST join assumes `users` table exposure and FK from `report_schedule_recipients.user_id`. Migration references `public.users` — **VERIFY vs live** that RLS and relationship name match Supabase schema (often `profiles` in other features).

**Suggested fix:** Confirm FK name in generated `database.types.ts`; adjust select to match live relationship or fetch users separately.

---

### 20. Analytics edge function fetches one endpoint per HTTP call; page needs five sections on overview tab

**Severity:** MEDIUM  
**Location:** `supabase/functions/analytics-dashboard/index.ts:62-183`, `AnalyticsDashboardPage.tsx:458-485`

**Root cause:** Even after proxy/param fixes, overview tab needs summary + four chart datasets. Current hook issues a single GET with `metric=overview` (ignored by edge). Requires multi-fetch or aggregated endpoint.

**Suggested fix:** Parallel `useQueries` for each `endpoint`, or extend edge function with combined response for dashboard load.

---

### 21. Duplicate JSON key `relationships.trends` in EN analytics locale (parser keeps last only)

**Severity:** LOW  
**Location:** `frontend/src/i18n/en/analytics.json:108-125`

**Root cause:** `"trends"` object declared twice under `relationships`. JSON parsers typically keep the second block; redundant and risks accidental drift.

**Suggested fix:** Remove duplicate `trends` / consolidate `healthLevels` vs `levels`.

---

### 22. Report template MOU status values may not match domain enums

**Severity:** LOW  
**Location:** `frontend/src/pages/reports/ReportsPage.tsx:78-80`, `frontend/src/i18n/en/common.json:290-298`

**Root cause:** Template uses `active` / `expired` / `draft` as MOU filter values. `common.mous.statuses` lists workflow states (`signed`, `negotiation`, etc.). Filter values sent to edge are unlikely to match `mous.workflow_state` — **VERIFY vs live** when wiring real generation.

**Suggested fix:** Align option values with DB enum; map labels via i18n.

---

## Safe-to-auto-fix vs Needs-planned-phase

### (A) Safe to auto-fix — small, localized, no schema deploy

| ID    | Item                                                                          |
| ----- | ----------------------------------------------------------------------------- | --- | --- |
| 11    | Add `reports.parametersTitle` to EN/AR `common.json`                          |
| 12    | Fix intelligence i18n key paths on `ReportsPage.tsx`                          |
| 13    | i18n or API-driven country labels                                             |
| 15–17 | Token/logical-prop/design fixes on analytics preview + charts + reports cards |
| 3     | KPI empty state when `summary` missing (guard `                               |     | 0`) |
| 21    | Remove duplicate `trends` key in `analytics.json`                             |
| 9     | Nav link to `/reports/scheduled`                                              |

### (B) Needs planned phase — API, edge deploy, routing, or RPC work

| ID      | Item                                                                                                       |
| ------- | ---------------------------------------------------------------------------------------------------------- |
| 1–2, 20 | Express proxy or edge client for analytics-dashboard; param mapping; multi-endpoint fetch; unwrap response |
| 4       | Real analytics export API                                                                                  |
| 5–6     | Reports generation contract + replace mock job/download                                                    |
| 7–8     | Wire report builder to `custom-reports` edge; unify scheduling hooks                                       |
| 10, 19  | Scheduled reports report-name fetch + recipient user join verification — **VERIFY vs live**                |
| 18      | Persistent report history                                                                                  |
| 14      | Sample data policy (product decision: demo vs production)                                                  |

---

## Summary

The **scheduled reports** sub-route (`/reports/scheduled`) is the most complete vertical: real Supabase tables, hooks, and `scheduled-report-processor` edge function — but it is **hidden from navigation** and cannot show report titles without a follow-up query.

The **`/analytics`** page has polished UI, bilingual `analytics` namespace, and RTL-aware charts, but **live data is effectively disconnected**: Express returns 404, the repository hides the failure, query params do not match the edge function, and export is stubbed. Users see **zero KPIs** or must opt into **explicitly labeled** sample data.

The **`/reports`** index and **`/reports/$reportId`** builder are **not production-ready**: template generation uses the wrong edge contract and mock backends; the drag-and-drop builder hooks are placeholders despite a large UI investment.

**Recommended phase order:** (1) analytics proxy + contract fix, (2) reports invoke contract + job polling, (3) custom-reports hook wiring, (4) scheduled reports nav + report name resolution, (5) i18n/design polish from bucket (A).
