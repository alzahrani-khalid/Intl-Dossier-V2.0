# Intelligence Workflow Inspection Report

**Date:** Tue 9 Jun 2026  
**Scope:** Read-only code + contract inspection of `/intelligence`, dossier intelligence surfaces, vector/similarity search, edge functions, Express intelligence routes, and `/monitoring` (nav sibling)  
**Branch:** `quick/260608-c9b-country-dossier-workflow-fixes`  
**Constraint:** No source edits; findings only.

---

## Scope

### Routes traced

| URL                              | Route file                                                                     | Page / component                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `/intelligence`                  | `frontend/src/routes/_protected/intelligence.tsx`                              | `frontend/src/pages/Intelligence.tsx` → `frontend/src/pages/intelligence/IntelligencePage.tsx`                                                |
| `/monitoring`                    | `frontend/src/routes/_protected/monitoring.tsx`                                | `frontend/src/pages/monitoring/Dashboard.tsx` (**separate ops stack; not intelligence**)                                                      |
| `/dossiers/countries/$id/*`      | `frontend/src/routes/_protected/dossiers/countries/$id.tsx` + child tab routes | `DossierShell` + tab outlets (`overview`, `engagements`, `docs`, `tasks`, `timeline`, `audit`, `positions`) — **no `intelligence` tab route** |
| Country intelligence UI (legacy) | _(not mounted in route tree)_                                                  | `frontend/src/pages/dossiers/CountryDossierPage.tsx` → `CountryDossierDetail.tsx` → lazy `IntelligenceTabContent`                             |

Nav wiring: `frontend/src/components/modern-nav/navigationData.ts:252-265` — `navigation.intelligence` → `/intelligence`; `navigation.monitoring` → `/monitoring`.

### Child components & hooks (by surface)

**`/intelligence` (global reports list)**

- UI: `IntelligencePage.tsx` — KPI cards, text filters, vector search input, `DataTable` of reports.
- Data: `useQuery` → direct Supabase `intelligence_reports.select('*')` (`IntelligencePage.tsx:152-158`).
- Vector search: `useMutation` → `supabase.rpc('search_intelligence_by_similarity', { query_text, match_threshold, match_count })` (`IntelligencePage.tsx:258-268`).
- Query key: `['intelligence', searchTerm, filterConfidence, filterClassification]`.
- i18n: `useTranslation()` default namespace (`common` / `translation`) — keys under `intelligence.*` and `navigation.intelligence`.
- RTL: `useDirection().isRTL` for title column only (`IntelligencePage.tsx:282`); **no `dir` on page root**.
- Actions: Create Report button (`IntelligencePage.tsx:390-393`), Download per row (`376-378`), row click TODO (`529-531`) — **no handlers**.

**Country dossier AI intelligence (Feature 029 — orphaned)**

- `IntelligenceTabContent.tsx` → `useAllIntelligence` / `useRefreshIntelligence` (`useIntelligence.ts`).
- Sub-panels: `EconomicDashboard`, `PoliticalAnalysis`, `SecurityAssessment`, `BilateralOpportunities`, `RefreshButton`.
- API client: `intelligence-api.ts` → edge `GET …/intelligence-get`, `POST …/intelligence-refresh-v2` (`intelligence-api.ts:198,248`).
- Auto-refresh on empty/stale data (`IntelligenceTabContent.tsx:51-115`).
- i18n namespace: `dossier` (`IntelligenceTabContent.tsx:40`).
- **Only consumer:** `CountryDossierDetail.tsx:180` — but `CountryDossierPage` is **not referenced by any route file** (grep: only self-import).

**`/monitoring` (not intelligence)**

- `Dashboard.tsx` — `useQuery` → `fetch('/monitoring/health')`, `fetch('/monitoring/alerts')`.
- Inline `style={{ padding: 16 }}`; no design tokens, no i18n, no RTL.
- Backend: `backend/src/index.ts:78` mounts `monitoringContractRouter` at `/monitoring`.
- Vite proxy (`frontend/vite.config.ts:91-113`) proxies `/api`, `/ai`, etc. — **no `/monitoring` proxy entry**.

### Backend / Supabase surfaces

| Surface                                 | Role                                                                                                                              | Wired from workflow?                                                                                      |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Table `intelligence_reports`            | Canonical per `database.types.ts` (`title`, `content`, `entity_id`, `intelligence_type`, `refresh_status`, `vector_embedding`, …) | Dossier tab via edge `intelligence-get` / refresh-v2; `/intelligence` page via direct Supabase select     |
| Table `intelligence_signals`            | Curated signals (`title_en/ar`, `signal_type`, `dossier_id`, `validated_*`, …) — `database.types.ts:15589-15651`                  | Entity search / preview layouts only; **no dossier tab or `/intelligence` UI**                            |
| Table `intelligence_event`              | Phase 54 raw ingest — `database.types.ts:15072+`                                                                                  | **No frontend consumer**                                                                                  |
| Table `intelligence_digest`             | Phase 54 period-bounded digest — `database.types.ts:14986+`                                                                       | **No frontend consumer**                                                                                  |
| Table `intelligence_event_dossiers`     | Phase 54 junction — `database.types.ts:15119+`                                                                                    | **No frontend consumer**                                                                                  |
| Table `dashboard_digest`                | Renamed Phase-45 feed — `database.types.ts:6822+`                                                                                 | `useDashboardDigest.ts` (dashboard, not intelligence route)                                               |
| Table `intelligence_sources`            | Source scanning config — `database.types.ts:15652+`                                                                               | **No frontend consumer**                                                                                  |
| RPC `search_intelligence_by_similarity` | pgvector similarity — `008_intelligence.sql:133-167`                                                                              | Called from `IntelligencePage.tsx:260` — **param contract mismatch**                                      |
| Edge `intelligence-get`                 | Fetch cached entity intelligence                                                                                                  | `intelligence-api.ts:198` — dossier tab only (orphaned)                                                   |
| Edge `intelligence-refresh`             | Manual AnythingLLM refresh                                                                                                        | Spec/docs; **not called from frontend**                                                                   |
| Edge `intelligence-refresh-v2`          | Temporary refresh path                                                                                                            | `intelligence-api.ts:247-248` — dossier tab only (orphaned)                                               |
| Edge `intelligence-batch-update`        | Batch refresh                                                                                                                     | **No frontend consumer**                                                                                  |
| Express `GET/POST /api/intelligence/*`  | Insights, signals, opportunities, trends, feedback                                                                                | `backend/src/api/intelligence.ts`, mounted `api/index.ts:87` — **no frontend fetch**                      |
| Express `/api/intelligence-reports/*`   | CRUD + search + embedding (contract tests)                                                                                        | **No router in `backend/src`** — tests only (`backend/tests/integration/vector-fallback.test.ts`)         |
| Legacy migration `008_intelligence.sql` | Alternate `intelligence_reports` shape (`report_number`, `title_en`, `executive_summary_en`, `author_id`, …)                      | UI normalization in `IntelligencePage.tsx:165-233` assumes this shape; **conflicts with generated types** |
| AnythingLLM                             | RAG workspace for refresh                                                                                                         | Edge refresh functions — **VERIFY vs live** deployment                                                    |

### i18n namespaces

| Namespace                | Routes / components                            | EN                                                | AR                      | Registered in `i18n/index.ts` |
| ------------------------ | ---------------------------------------------- | ------------------------------------------------- | ----------------------- | ----------------------------- |
| `translation` / `common` | `/intelligence` (`IntelligencePage`)           | `en/common.json` (`intelligence` block `369-415`) | `ar/common.json`        | Yes                           |
| `dossier`                | `IntelligenceTabContent`, dashboard sub-panels | `en/dossier.json` (`intelligence` `562-594`)      | `ar/dossier.json`       | Yes (`index.ts:261`)          |
| `dossier-shell`          | `DossierTabNav` (no intelligence tab)          | `en/dossier-shell.json`                           | `ar/dossier-shell.json` | Yes                           |
| `common` (entity types)  | `EntitySearchDialog`, preview layouts          | `entityTypes.intelligence_signal`                 | AR mirror               | Yes                           |

**Missing / silent-fallback keys:**

- `useRefreshIntelligence` toasts: `t('intelligence.refresh.loading')`, `.success`, `.conflict`, `.serviceUnavailable`, `.error` (`useIntelligence.ts:171-238`) — **no `intelligence.refresh` object** in `common.json` or `dossier.json`.
- `IntelligenceTabContent`: `intelligence.loadingDashboard`, `generating`, `generatingDescription`, `noData`, `generateButton`, `dashboardTitle`, `geographic.*`, etc. — use **English `defaultValue` fallbacks**; `dossier.json` `intelligence` block lacks these keys.
- `geographic.*` keys used in `IntelligenceTabContent.tsx:336-391` — **not present** in `dossier.json` (only unrelated `geographic` in `enhanced-search.json`).

---

## Environment

| Check                                               | Result                                                               |
| --------------------------------------------------- | -------------------------------------------------------------------- |
| Backend health                                      | `GET http://127.0.0.1:5001/health` → **200** `{"status":"ok",...}`   |
| Express `/api/intelligence/signals/mou`             | **401** (auth required; route exists)                                |
| Frontend `/intelligence`                            | `GET http://127.0.0.1:5175/intelligence` → **200**                   |
| Frontend `/monitoring`                              | `GET http://127.0.0.1:5175/monitoring` → **200**                     |
| Edge `intelligence-get` / `intelligence-refresh-v2` | **Not probed** (requires auth JWT)                                   |
| RPC `search_intelligence_by_similarity`             | **Not probed** (requires auth + embedding)                           |
| Login / UAT                                         | **Not attempted** — findings are code + schema + contract inspection |

---

## Findings

### 1. Country dossier AI intelligence tab is disconnected from routing

**Severity:** CRITICAL  
**Location:** `frontend/src/components/dossier/CountryDossierDetail.tsx:27-180`, `frontend/src/pages/dossiers/CountryDossierPage.tsx:18-21`, `frontend/src/routes/_protected/dossiers/countries/$id.tsx:13-27`, `frontend/src/components/dossier/DossierTabNav.tsx:33-40`

**Root cause:** Feature 029 UI (`IntelligenceTabContent`, edge `intelligence-get` / `intelligence-refresh-v2`) mounts only inside `CountryDossierDetail`. Country routes now use `DossierShell` with tabs `overview | engagements | docs | tasks | timeline | audit | positions` — no `intelligence` tab or child route. `CountryDossierPage` is not imported by any route file.

**Suggested fix:** Add `/dossiers/countries/$id/intelligence` (and product decision for other dossier types) wired to `IntelligenceTabContent`, or remove orphaned `CountryDossierDetail` path. Register tab in `DossierTabNav` / `dossier-shell` i18n.

---

### 2. `/intelligence` page and dossier tab target different `intelligence_reports` semantics

**Severity:** CRITICAL  
**Location:** `frontend/src/pages/intelligence/IntelligencePage.tsx:87-233,155-157`, `frontend/src/services/intelligence-api.ts:35-59`, `frontend/src/types/database.types.ts:15340-15382`

**Root cause:** Global page treats rows as analytical reports (`report_number`, `title_en`, `executive_summary_en`, `analysis_type[]`, `author`, `reviewed_by`, `published_at`). Generated schema uses dynamic-country model (`title`, `content`, `entity_id`, `intelligence_type`, `refresh_status`, `confidence_score`). Page runs `.select('*')` with client-side normalization mapping missing columns to defaults — two product concepts share one table name.

**Suggested fix:** Product split: (A) global analytical reports UI aligned to one schema, or (B) `/intelligence` lists entity-linked cache rows with `entity_id` / `intelligence_type` columns. Regenerate types after migration choice. **VERIFY vs live** which migration lineage is authoritative.

---

### 3. Vector similarity RPC contract does not match frontend call; results never rendered

**Severity:** CRITICAL  
**Location:** `frontend/src/pages/intelligence/IntelligencePage.tsx:258-268,457-468`, `supabase/migrations/008_intelligence.sql:133-167`

**Root cause:** RPC signature is `search_intelligence_by_similarity(query_embedding vector(1536), limit_count, min_similarity, classification_filter)`. Frontend passes `{ query_text, match_threshold, match_count }` — wrong parameter names and types (text vs embedding). No client step generates an embedding. `similaritySearchMutation` data is never read in JSX (no results panel; errors not surfaced).

**Suggested fix:** Add text→embedding step (edge function or Express) then call RPC with `query_embedding`, or replace RPC with text search. Render results and error states. Align RPC columns (`report_number`, `title_en`) with live schema or update RPC. **VERIFY vs live** RPC definition on staging.

---

### 4. `intelligence_signals` table has no dossier or `/intelligence` workflow UI

**Severity:** HIGH  
**Location:** `frontend/src/types/database.types.ts:15589-15651`, `frontend/src/components/entity-links/EntitySearchDialog.tsx:53`, `backend/src/api/entity-search.ts:28`

**Root cause:** Curated `intelligence_signals` (plural) is referenced in entity-search, preview layouts, multilingual content, and intake links — but no `SignalsList`, dossier tab, or `/intelligence` query reads/writes this table. Nav label says "Intelligence Signals" (`navigationData.ts:254`) while `/intelligence` lists `intelligence_reports`.

**Suggested fix:** Either wire signals CRUD/list to dossiers and `/intelligence`, or rename nav copy to match reports. Phase 54 `intelligence_event` is the planned ingest layer — keep `intelligence_signals` curated per Phase 54 docs.

---

### 5. Phase 54 intelligence engine tables are schema-only in the frontend

**Severity:** HIGH  
**Location:** `supabase/migrations/20260516000002_phase54_intelligence_event_and_digest.sql`, `frontend/src/types/database.types.ts:14986-15188`

**Root cause:** `intelligence_event`, `intelligence_digest`, `intelligence_event_dossiers` exist in generated types with RLS tests (`tests/integration/intelligence-event-rls.test.ts`) but **zero** `frontend/src` imports query them. Dashboard uses renamed `dashboard_digest` via `useDashboardDigest.ts`, not the new `intelligence_digest`.

**Suggested fix:** Planned phase to build ingest/digest UI on Phase 54 schema, or document as backend-only until v7.0 engine ships.

---

### 6. Frontend calls `intelligence-refresh-v2` instead of documented `intelligence-refresh`

**Severity:** HIGH  
**Location:** `frontend/src/services/intelligence-api.ts:247-248`, `supabase/functions/intelligence-refresh/index.ts`, `supabase/functions/intelligence-refresh-v2/index.ts`

**Root cause:** Comment says "TEMPORARY: Using intelligence-refresh-v2 to bypass caching issues". Spec, quickstart, and tests reference `intelligence-refresh`. Two parallel edge implementations increase deploy drift risk.

**Suggested fix:** Merge fixes into `intelligence-refresh`, redeploy, remove v2 call. **VERIFY vs live** which function is deployed on staging.

---

### 7. Express `/api/intelligence/*` routes are not consumed by the intelligence UI

**Severity:** HIGH  
**Location:** `backend/src/api/intelligence.ts:20-93`, `backend/src/api/index.ts:87`, `backend/src/services/intelligence.service.ts:5-74`

**Root cause:** Router exposes insights, signals, opportunities, trends, feedback. No `frontend/src` fetch to `/api/intelligence`. `IntelligenceService.detectSignals` signature is `(entityType, timeframe)` but route passes only `type` as first arg (`intelligence.ts:42-45` vs `intelligence.service.ts:5`). Partial overlap with `ai.ts` for suggestions/sentiment only.

**Suggested fix:** Either wire monitoring/analytics consumers or deprecate routes. Fix `detectSignals` arity if kept.

---

### 8. `/api/intelligence-reports` contract tests reference non-existent Express router

**Severity:** HIGH  
**Location:** `backend/tests/integration/vector-fallback.test.ts:27+`, grep `backend/src` for `intelligence-reports` → **no matches**

**Root cause:** Integration tests expect REST CRUD/search/embedding at `/api/intelligence-reports`. No matching router in `backend/src/api`. Suggests removed or never-merged API surface parallel to Supabase + edge path.

**Suggested fix:** Restore router or delete/stale tests; pick one search/embedding stack (Express vs RPC vs edge).

---

### 9. `/intelligence` page actions are non-functional

**Severity:** MEDIUM  
**Location:** `frontend/src/pages/intelligence/IntelligencePage.tsx:390-393,376-378,529-531`

**Root cause:** "Create Report" button has no `onClick`. Download buttons per row have no handler. `onRowClick` is empty TODO. Users see controls that do nothing.

**Suggested fix:** Wire create flow (modal + insert), download/export, and detail route — or remove until implemented.

---

### 10. Missing i18n for refresh toasts in `useRefreshIntelligence`

**Severity:** MEDIUM  
**Location:** `frontend/src/hooks/useIntelligence.ts:171-238`, `frontend/src/i18n/en/dossier.json:562-594`, `frontend/src/i18n/en/common.json:369-415`

**Root cause:** Hook uses default namespace `t('intelligence.refresh.loading')` etc. Neither `common` nor `dossier` defines `intelligence.refresh.*`. Toasts show raw keys or English fallbacks depending on i18n config.

**Suggested fix:** Add `intelligence.refresh` block to `dossier.json` (EN+AR) or pass `useTranslation('dossier')` explicitly in the hook.

---

### 11. `IntelligenceTabContent` relies on English fallbacks for most copy

**Severity:** MEDIUM  
**Location:** `frontend/src/components/intelligence/IntelligenceTabContent.tsx:153-408`, `frontend/src/i18n/en/dossier.json:562-594`

**Root cause:** Keys like `intelligence.generating`, `intelligence.dashboardTitle`, `intelligence.showingReports`, `geographic.isoCode` use `t(key, 'English default')` but are absent from `dossier.json` AR/EN. Arabic dossier intelligence UI will show English defaults.

**Suggested fix:** Add full `intelligence.*` and `geographic.*` blocks to `en/dossier.json` and `ar/dossier.json`.

---

### 12. `/monitoring` does not share the intelligence stack and likely fails health fetches in dev

**Severity:** MEDIUM  
**Location:** `frontend/src/pages/monitoring/Dashboard.tsx:31-41`, `frontend/vite.config.ts:91-113`, `backend/src/index.ts:78`

**Root cause:** Monitoring page fetches same-origin `/monitoring/health` and `/monitoring/alerts`. Vite dev proxy does not forward `/monitoring` to Express (only `/api`, `/ai`, …). Page uses inline styles, no i18n/RTL — separate ops placeholder, not intelligence signals.

**Suggested fix:** Add Vite proxy for `/monitoring` or fetch via `/api` prefix; rebuild with design tokens if product wants this nav item live.

---

### 13. `IntelligencePage` does not set document direction for RTL

**Severity:** LOW  
**Location:** `frontend/src/pages/intelligence/IntelligencePage.tsx:386-538`

**Root cause:** Page uses `isRTL` for column text selection only. Root `<div className="container …">` has no `dir={isRTL ? 'rtl' : 'ltr'}`. Filter button rows may not mirror correctly in Arabic.

**Suggested fix:** Set `dir` on page root; audit filter layouts with `logical` spacing (page already uses `me-*` in places).

---

### 14. Decorative checkmarks in intelligence generating state

**Severity:** LOW  
**Location:** `frontend/src/components/intelligence/IntelligenceTabContent.tsx:224-229`

**Root cause:** User-visible copy includes literal `✓` prefix characters in four spans. IntelDossier copy rules discourage emoji/decorative symbols in UI copy (checkmarks are not data).

**Suggested fix:** Replace with icon components or plain list without ✓.

---

### 15. E2E coverage for intelligence is a no-op placeholder

**Severity:** LOW  
**Location:** `e2e/tests/intelligence-report.spec.ts:4-8`

**Root cause:** Test clicks optional `nav-intelligence` and asserts `true`. No assertion on reports table, vector search, or dossier intelligence.

**Suggested fix:** Add real E2E after routing fix (Finding 1).

---

### 16. `text-primary` used in intelligence sub-panels

**Severity:** LOW  
**Location:** `frontend/src/components/intelligence/EconomicDashboard.tsx:159`, `PoliticalAnalysis.tsx:158`, `SecurityAssessment.tsx:163`, `BilateralOpportunities.tsx:158`, `IntelligenceTabContent.tsx:209`

**Root cause:** Uses `text-primary` (shadcn/HeroUI legacy) rather than token utilities (`text-accent`, `text-ink`). May still resolve via theme mapping — verify against Bureau token checklist.

**Suggested fix:** Map to `var(--*)` Tailwind utilities per design system.

---

## Safe-to-auto-fix vs Needs-planned-phase

### (A) Safe to auto-fix — small, localized, no schema deploy

| ID  | Item                                                                                             |
| --- | ------------------------------------------------------------------------------------------------ |
| 10  | Add `intelligence.refresh.*` keys to `dossier.json` EN+AR; fix namespace in `useIntelligence.ts` |
| 11  | Add missing `intelligence.*` / `geographic.*` keys to dossier i18n                               |
| 13  | RTL `dir` on `IntelligencePage` root                                                             |
| 14  | Remove ✓ decorative copy in generating state                                                     |
| 16  | Replace `text-primary` with design tokens in intelligence components                             |
| 12  | Add Vite `/monitoring` proxy (if monitoring nav stays)                                           |
| 15  | Strengthen E2E after route wiring                                                                |

### (B) Needs planned phase — schema, routing, edge deploy, or product decisions

| ID  | Item                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------- |
| 1   | Reconnect dossier intelligence tab to `DossierShell` routes                                             |
| 2   | Unify `intelligence_reports` product model (global reports vs entity cache) — **VERIFY vs live** schema |
| 3   | Fix vector search pipeline (embedding + RPC contract + results UI)                                      |
| 4   | Wire `intelligence_signals` UI or rename nav                                                            |
| 5   | Phase 54 `intelligence_event` / `intelligence_digest` frontend                                          |
| 6   | Consolidate `intelligence-refresh` vs v2 edge functions — **VERIFY vs live** deploy                     |
| 7   | Express `/api/intelligence` — wire or retire                                                            |
| 8   | `/api/intelligence-reports` router vs stale tests                                                       |
| 9   | Create/download/detail flows on `/intelligence` page                                                    |

---

## Summary

The intelligence workflow is **split across three disconnected stacks** that do not share a single user journey:

1. **`/intelligence`** — nav-visible global page that queries `intelligence_reports` directly via Supabase and assumes a legacy analytical-report column shape (`report_number`, `executive_summary_*`) that **does not match** `database.types.ts` (Feature 029 `title` / `content` / `entity_id` model). Vector search calls `search_intelligence_by_similarity` with **wrong RPC parameters** and never displays results.

2. **Country dossier AI dashboard (Feature 029)** — fully implemented (`IntelligenceTabContent`, four section panels, `useIntelligence` hooks, edge `intelligence-get` + `intelligence-refresh-v2`) but **orphaned**: country routes use `DossierShell` without an intelligence tab; `CountryDossierDetail` is not mounted.

3. **Curated signals & Phase 54 engine** — `intelligence_signals` exists in DB and entity-search vocabulary but has **no list/edit UI** on dossiers or `/intelligence`. Phase 54 `intelligence_event`, `intelligence_digest`, and junction tables are **schema-only** in the frontend.

**`/monitoring`** is a separate ops health dashboard (not intelligence); its relative `/monitoring/*` fetches are not proxied in Vite dev.

**Recommended phase order:** (1) **VERIFY vs live** `intelligence_reports` schema and edge function deploy; (2) reconnect dossier intelligence tab to country (and other) routes; (3) reconcile `/intelligence` page with chosen data model; (4) fix or remove vector similarity search; (5) plan Phase 54 / `intelligence_signals` UI; (6) i18n + RTL polish from bucket (A); (7) retire or wire orphaned Express `/api/intelligence*` and test-only `/api/intelligence-reports` paths.
