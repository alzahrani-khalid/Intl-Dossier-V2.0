# Word Assistant / Export Workflow Inspection Report

**Date:** Tue 9 Jun 2026  
**Scope:** Read-only code + contract inspection of Reports navigation routes `/word-assistant` and `/export`; route files, pages, reachable components/hooks; assistant behavior and backend contract; export formats/scopes, job polling/download behavior, and backend/Supabase surfaces; i18n EN+AR registration; RTL/design-token compliance; honest-UI checks  
**Branch:** `quick/260608-c9b-country-dossier-workflow-fixes`  
**Constraint:** No source edits; findings only. The only file write is this report.  
**Inspector:** codex (substituting for cursor-agent — monthly quota exhausted)

---

## Scope

### Routes traced

| URL               | Nav source                                                     | Route file                                              | Page / component    | Result                                                                                                                                                                  |
| ----------------- | -------------------------------------------------------------- | ------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/word-assistant` | `frontend/src/components/modern-nav/navigationData.ts:281-285` | `frontend/src/routes/_protected/word-assistant.tsx:1-6` | `WordAssistantPage` | Route is mounted and renders a chat-style assistant UI. By default it returns local fallback text; Supabase edge is used only when `VITE_WORD_ASSISTANT_MODE=supabase`. |
| `/export`         | `frontend/src/components/modern-nav/navigationData.ts:267-272` | `frontend/src/routes/_protected/export.tsx:1-7`         | None                | Route is mounted but immediately redirects to `/dossiers`; no export page, format picker, job polling, or download UI is reachable from this nav route.                 |

Nav wiring notes:

- The requested Reports category is defined in `frontend/src/components/modern-nav/navigationData.ts:224-286`.
- The current protected app shell renders `Sidebar`, not the modern-nav `NavigationShell`, via `frontend/src/components/layout/AppShell.tsx:172-225`; `Sidebar` is built from `frontend/src/components/layout/navigation-config.ts`, whose visible groups do not include the requested Reports category.
- Generated route typing includes both routes in `frontend/src/routeTree.gen.ts:260-261,427-428,2665-2668,2889-2892`; that file is already modified in the worktree and was not touched.

### Child components & hooks

| Surface                      | Files                                                                                                                                                                      | Role                                                                    | Current wiring                                                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Word Assistant route         | `frontend/src/routes/_protected/word-assistant.tsx`                                                                                                                        | Protected file route                                                    | Directly mounts `WordAssistantPage`.                                                                                                                   |
| Word Assistant page          | `frontend/src/pages/word-assistant/WordAssistantPage.tsx`                                                                                                                  | Chat UI, suggested prompts, local fallback generator, Supabase mutation | Sends only `action: "complete"` from the visible input. Suggested prompts populate text but do not select backend actions such as translate/summarize. |
| Word Assistant backend call  | `frontend/src/pages/word-assistant/WordAssistantPage.tsx:98-170,259-292`                                                                                                   | Optional Supabase edge call                                             | Default mode is `fallback`; edge call happens only when `VITE_WORD_ASSISTANT_MODE=supabase`.                                                           |
| Word Assistant saving/export | `frontend/src/pages/word-assistant/WordAssistantPage.tsx:247-249,388-400`                                                                                                  | Copy and feedback affordances                                           | Copy works through `navigator.clipboard`; thumbs up/down have no handlers; no saved draft, DOCX export, or output persistence is exposed by the page.  |
| Export route                 | `frontend/src/routes/_protected/export.tsx`                                                                                                                                | Protected file route                                                    | Redirects to `/dossiers`; no child component/hook runs.                                                                                                |
| Orphan Express export dialog | `frontend/src/components/export/ExportDialog.tsx`                                                                                                                          | Polling UI for root Express `/export` contract                          | Not imported by `/export`; uses hard-coded `Bearer test-auth-token` if mounted.                                                                        |
| Orphan export/import page    | `frontend/src/pages/export-import/ExportImportPage.tsx`, `frontend/src/components/export-import/ExportDialog.tsx`, `frontend/src/domains/documents/hooks/useExportData.ts` | CSV/XLSX/JSON export-import demo                                        | Route `/export-import` also redirects to `/dossiers`; not reachable from `/export`.                                                                    |
| Dossier export pack          | `frontend/src/components/dossier/ExportDossierDialog.tsx`, `frontend/src/hooks/useDossierExport.ts`, `frontend/src/services/dossier-export.service.ts`                     | PDF/DOCX briefing pack export from dossier shell                        | Wired from dossier detail surfaces, not from `/export`.                                                                                                |

### Backend / Supabase surfaces

| Surface                                                                  | Role                                                                                                             | Wired from workflow?                                                                                                                                                                                     |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase Edge `word-assistant`                                           | AnythingLLM-backed text actions and embeddings                                                                   | Yes, but only when `VITE_WORD_ASSISTANT_MODE=supabase`; default UI bypasses it. Deployment is **VERIFY vs live**.                                                                                        |
| AnythingLLM `/api/v1/workspace/{workspace}/chat`                         | Backend model call used by the edge function                                                                     | Indirectly wired through `word-assistant`; frontend does not call AnythingLLM or Express AI routes directly.                                                                                             |
| Table `word_assistant_logs`                                              | Intended edge-function interaction log                                                                           | Edge function writes it, but generated DB types contain no `word_assistant_logs` entry; **VERIFY vs live**.                                                                                              |
| Express `/api/ai/chat`, `/api/ai/briefs`, `/api/ai/dossier-field-assist` | Express AI routes                                                                                                | Not wired from `/word-assistant`.                                                                                                                                                                        |
| Supabase Edge `data-export`                                              | Immediate CSV/XLSX-as-CSV/JSON content export for dossier/person/engagement/working-group/commitment/deliverable | Not wired from `/export`; only reachable through orphan export-import hook if that route/component is mounted elsewhere. Several query/table refs are stale against generated types; **VERIFY vs live**. |
| Express root `/export`                                                   | Contract-test friendly async export mock with poll/download endpoints                                            | Not wired from `/export`; orphan `components/export/ExportDialog` would call it with a hard-coded test token.                                                                                            |
| Table `export_jobs`                                                      | Possible job-backed export table                                                                                 | No generated DB type entry and no `/export` workflow reference found; **VERIFY vs live**.                                                                                                                |
| Supabase Edge `dossier-export-pack`                                      | Dossier briefing pack HTML upload and signed URL; frontend asks for PDF/DOCX                                     | Not wired from `/export`; wired from dossier detail export dialog. Deployment/storage bucket `briefing-packs` is **VERIFY vs live**.                                                                     |
| Supabase Edge `contacts-export`                                          | CSV/vCard contact export expected by `frontend/src/services/export-api.ts`                                       | Not wired from `/export`; no `supabase/functions/contacts-export` directory found.                                                                                                                       |
| Supabase Edge `graph-export`                                             | Knowledge-graph export                                                                                           | Not wired from `/export`.                                                                                                                                                                                |

### i18n namespaces

| Namespace                | Routes / components                                  | EN                                         | AR                                         | Registered in `i18n/index.ts`                | Notes                                                                                                                                                               |
| ------------------------ | ---------------------------------------------------- | ------------------------------------------ | ------------------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `translation` / `common` | Nav labels and `WordAssistantPage` default namespace | `frontend/src/i18n/en/common.json`         | `frontend/src/i18n/ar/common.json`         | `frontend/src/i18n/index.ts:255-257,381-383` | `navigation.export` and `navigation.wordAssistant` exist in EN+AR, but `wordAssistant.*` page keys are missing. Common parity has unrelated `dossierLinks.*` drift. |
| `word-assistant`         | None                                                 | No file                                    | No file                                    | Not registered                               | Page uses dot-form `wordAssistant.*` keys against default namespace, so most page copy leaks raw keys.                                                              |
| `export-import`          | Orphan export/import demo components                 | `frontend/src/i18n/en/export-import.json`  | `frontend/src/i18n/ar/export-import.json`  | `frontend/src/i18n/index.ts:284,410`         | EN/AR key parity passed; not used by `/export` because route redirects.                                                                                             |
| `dossier-export`         | Dossier detail export dialog                         | `frontend/src/i18n/en/dossier-export.json` | `frontend/src/i18n/ar/dossier-export.json` | `frontend/src/i18n/index.ts:342,468`         | EN/AR key parity passed; not used by `/export`.                                                                                                                     |

Parity probe: `export-import` and `dossier-export` returned `missingAr=0 missingEn=0`. `common` returned unrelated `dossierLinks.dossierTypes.*` vs `dossierLinks.entityTypes.*` drift; the scoped nav keys exist, while scoped `wordAssistant.*` page keys do not.

---

## Environment

| Check                            | Result                                                                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Backend health                   | `GET http://127.0.0.1:5001/health` -> **200** `{"status":"ok","timestamp":"2026-06-09T20:21:52.623Z","environment":"development"}` |
| Frontend `/word-assistant` shell | `GET http://127.0.0.1:5175/word-assistant` -> **200** SPA HTML                                                                     |
| Frontend `/export` shell         | `GET http://127.0.0.1:5175/export` -> **200** SPA HTML; client route redirects to `/dossiers`                                      |
| Backend root `/export`           | `GET http://127.0.0.1:5001/export` -> **404**; `GET /export/test-id` -> **401** without auth                                       |
| Authenticated browser UAT        | Not performed; inspection stayed source/read-only and sent no write requests                                                       |
| Live Supabase DB/RPC/schema      | Not probed with auth; DB/RPC/storage deployment claims are **VERIFY vs live**                                                      |
| Typecheck / tests                | Not run; avoided toolchain commands that may write build/cache artifacts under the hard write constraint                           |

---

## Findings

### 1. [EXP] `/export` is a dead navigation target

**Severity:** CRITICAL  
**Location:** `frontend/src/components/modern-nav/navigationData.ts:267-272`, `frontend/src/routes/_protected/export.tsx:1-7`

**Root cause:** The Reports nav advertises `Export` at `/export`, but the only route implementation throws a redirect to `/dossiers`. No page component mounts, so no export formats/scopes are offered and no job polling/download code runs from the scoped workflow. This also means the requested validation target cannot exercise any export backend from `/export`.

**Suggested fix:** Decide the canonical export experience, then mount it at `/export` instead of redirecting. If the intended destination is dossier-list export, route to a real export-capable page and make the nav label explicit; otherwise mount a dedicated export page with typed format/scope selection and backend wiring.

---

### 2. [WA] Default Word Assistant mode does not call an AI backend but still appears connected

**Severity:** HIGH  
**Location:** `frontend/src/pages/word-assistant/WordAssistantPage.tsx:98-139,196-207,259-292,301-309`

**Root cause:** `assistantMode` defaults to `fallback`, not `supabase`. In fallback mode, `generateLocalAssistantResponse` builds a canned local response and the connection check sets `isConnected` to `true` without probing a backend. The visible status can therefore show "connected" while no edge function, Express AI route, or AnythingLLM backend is used.

**Suggested fix:** Make the UI state honest: either default to the real backend when configured, or show an explicit local/degraded mode and disable AI-specific status language. Treat fallback responses as degraded placeholders, not successful assistant output.

---

### 3. [WA] Most Word Assistant i18n keys are missing and will render as dot-form keys

**Severity:** HIGH  
**Location:** `frontend/src/pages/word-assistant/WordAssistantPage.tsx:63-90,167,206,225,298-326,424,444-467`, `frontend/src/i18n/en/common.json:136-186`, `frontend/src/i18n/ar/common.json:136-186`, `frontend/src/i18n/index.ts:255-257,381-383`

**Root cause:** `WordAssistantPage` calls `useTranslation()` and uses keys such as `wordAssistant.description`, `wordAssistant.prompts.briefTitle`, `wordAssistant.connected`, `wordAssistant.capability1`, and `wordAssistant.tip1`. The registered default/common namespace only contains `navigation.wordAssistant`; no `wordAssistant` object or dedicated `word-assistant` namespace exists in EN or AR.

**Suggested fix:** Add a page-scoped `word-assistant` namespace with EN+AR parity and call `useTranslation('word-assistant')`, or add the complete `wordAssistant.*` tree to common in both languages. Include prompts, status, fallback/error text, capabilities, tips, and input placeholder.

---

### 4. [WA] Edge fallback and embedding behavior can present mock output as successful AI work

**Severity:** HIGH  
**Location:** `supabase/functions/word-assistant/index.ts:55-76,79-101,104-135,241-251`

**Root cause:** When AnythingLLM returns an HTTP error or connection error, the edge function returns fallback text as a normal response and only changes `model` to `fallback`. For embeddings, missing API key or failed embed calls return random 1536-dimension vectors and `Embeddings generated successfully`. If the frontend is in Supabase mode, a fallback model response can be displayed as a successful assistant answer unless the UI explicitly inspects `model`.

**Suggested fix:** Return a structured degraded/error state and make the frontend render it distinctly. Do not generate random embeddings for production behavior; fail closed or return a deterministic unavailable response. Include provider status in the response contract.

---

### 5. [WA] Assistant feedback buttons and output persistence are incomplete

**Severity:** MEDIUM  
**Location:** `frontend/src/pages/word-assistant/WordAssistantPage.tsx:247-249,388-400`

**Root cause:** Assistant responses can be copied to clipboard, but thumbs up/down buttons have no `onClick` handlers, no telemetry call, and no visible disabled state. The workflow has no save/export path for generated output; edge logging is server-side only and the page does not expose saved drafts or document generation.

**Suggested fix:** Either wire feedback to a real endpoint/table or remove the inert buttons. If output saving/export is part of the workflow, add an explicit save/export contract; otherwise label the surface as transient chat plus copy only.

---

### 6. [EXP] Orphan Express polling dialog has a hard-coded test token and does not match the mounted route

**Severity:** HIGH  
**Location:** `frontend/src/components/export/ExportDialog.tsx:12-16,28-39,41-58,75-79`, `backend/src/index.ts:76-80`, `backend/src/api/contract/export.ts:18-65`

**Root cause:** An unmounted export dialog posts to relative `/export`, polls `/export/{id}`, and downloads `/export/{id}/download`, but it always sends `Authorization: Bearer test-auth-token`. The Express backend does mount root `/export`, but the scoped frontend route never renders this component. If the component were mounted under the Vite frontend origin without a proxy, it would also target the frontend server path rather than `http://127.0.0.1:5001/export`.

**Suggested fix:** Delete the orphan dialog or rework it through the shared API client with `baseUrl: 'express'`, real Supabase auth, and an explicit `/export` route page. Keep the contract-test mock separate from production UI unless it is intentionally productized.

---

### 7. [EXP] `data-export` backend templates and queries are stale against generated DB types

**Severity:** HIGH  
**Location:** `supabase/functions/data-export/index.ts:17-150,152-739,866-1006`, `frontend/src/types/database.types.ts:5364-5385,9388-9417,10297-10326,17915-17942,20400-20465,29896-29918`

**Root cause:** The `data-export` edge function is not wired from `/export`, but it is the closest Supabase export surface. Its templates/queries do not match generated table contracts in several places: `persons` query selects `dossier:dossier_id` while `persons` has no `dossier_id`; `engagement_dossiers` selects `dossier:dossier_id` and filters `status`, while generated columns include `engagement_status` and no `dossier_id`; `working_groups` orders by `created_at` and filters `status`, while generated columns include `wg_status`, `established_date`, and no `created_at`; `commitments` expects fields like `title_en`, `commitment_type`, `deadline`, `completion_percentage`, and `assignee_id`, while generated columns are `title`, `type`, `timeline`, `tracking`, and `responsible`; `mou_deliverables` expects `assignee_id`/`completion_percentage` aliases not present in generated rows. Hosted schema remains **VERIFY vs live**.

**Suggested fix:** Rebuild export templates and queries from `frontend/src/types/database.types.ts` or regenerate types from the live schema before wiring `/export`. Add contract tests that instantiate each entity export request against typed table/column names.

---

### 8. [WA] Scoped design-token and accessibility gaps remain in the Word Assistant page

**Severity:** LOW  
**Location:** `frontend/src/pages/word-assistant/WordAssistantPage.tsx:295-317,330-333,364-370,396-400`

**Root cause:** The page mostly uses semantic tokens, but it still uses a hover card shadow (`hover:shadow-md`) in a scoped surface where card shadows are disallowed. Suggested prompts are clickable `Card` elements with `onClick` rather than keyboard-native buttons/links. Thumbs up/down icon buttons have no accessible label and no handler.

**Suggested fix:** Replace clickable cards with accessible buttons or links styled through the design system, remove hover shadows, and add `aria-label`s plus real handlers or disabled states for icon-only controls.

---

## Final

### (A) Safe to auto-fix

| Finding ID | Scope                                       | Why                                                                           |
| ---------- | ------------------------------------------- | ----------------------------------------------------------------------------- |
| 3          | Word Assistant i18n                         | Local namespace/key addition with EN+AR parity; no backend decision required. |
| 5          | Word Assistant feedback affordances         | Small UI cleanup if product accepts removing or disabling inert buttons.      |
| 8          | Word Assistant design/accessibility cleanup | Mechanical component/class cleanup with low blast radius.                     |

### (B) Needs planned phase

| Finding ID | Scope                                   | Why                                                                                        |
| ---------- | --------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1          | `/export` route/page                    | Requires product decision on canonical export workflow and route destination.              |
| 2          | Word Assistant backend mode             | Requires environment/backend availability decision and honest degraded-state contract.     |
| 4          | Word Assistant edge fallback/embeddings | Requires backend response contract changes and provider-failure policy.                    |
| 6          | Express export polling dialog           | Requires deciding whether root Express `/export` is production UI, test-only, or replaced. |
| 7          | `data-export` schema alignment          | Requires schema/type verification, query rewrites, and export contract tests.              |

Summary: `/word-assistant` is mounted, but by default it is a local fallback chat surface, not a real AI/document-generation workflow. Its Supabase edge path exists but has degraded-output and schema/logging concerns that need a contract pass before users should trust results. `/export` is currently a dead nav target: it redirects to `/dossiers`, while several export implementations exist elsewhere but are not wired to that route and some are stale against generated DB types. Recommended phase order: first define the canonical `/export` product contract, then align the export backend/schema, then fix Word Assistant backend/degraded-state behavior, and finish with i18n and design/accessibility cleanup.
