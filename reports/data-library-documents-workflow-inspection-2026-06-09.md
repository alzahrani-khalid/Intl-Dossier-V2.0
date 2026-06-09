# Data Library & Documents Workflow Inspection Report

**Date:** Tue 9 Jun 2026  
**Scope:** Read-only code + contract inspection of `/data-library`, dossier Documents tabs (`/dossiers/*/$id/docs`), engagement workspace Docs tab, and shared document services  
**Branch:** `quick/260608-c9b-country-dossier-workflow-fixes`  
**Constraint:** No source edits; findings only.

---

## Scope

### Routes traced

| URL                                    | Route file                                                               | Page / component                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `/data-library`                        | `frontend/src/routes/_protected/data-library.tsx`                        | `frontend/src/pages/DataLibrary.tsx` → `frontend/src/pages/data-library/DataLibraryPage.tsx` |
| `/dossiers/countries/$id/docs`         | `frontend/src/routes/_protected/dossiers/countries/$id/docs.tsx`         | Lazy `DossierDocumentsTab`                                                                   |
| `/dossiers/organizations/$id/docs`     | `frontend/src/routes/_protected/dossiers/organizations/$id/docs.tsx`     | Lazy `DossierDocumentsTab`                                                                   |
| `/dossiers/forums/$id/docs`            | `frontend/src/routes/_protected/dossiers/forums/$id/docs.tsx`            | Lazy `DossierDocumentsTab`                                                                   |
| `/dossiers/topics/$id/docs`            | `frontend/src/routes/_protected/dossiers/topics/$id/docs.tsx`            | Lazy `DossierDocumentsTab`                                                                   |
| `/dossiers/persons/$id/docs`           | `frontend/src/routes/_protected/dossiers/persons/$id/docs.tsx`           | Lazy `DossierDocumentsTab`                                                                   |
| `/dossiers/working_groups/$id/docs`    | `frontend/src/routes/_protected/dossiers/working_groups/$id/docs.tsx`    | Lazy `DossierDocumentsTab`                                                                   |
| `/dossiers/elected-officials/$id/docs` | `frontend/src/routes/_protected/dossiers/elected-officials/$id/docs.tsx` | Lazy `DossierDocumentsTab`                                                                   |
| `/dossiers/engagements/$id`            | `frontend/src/routes/_protected/dossiers/engagements/$id.tsx`            | Redirect → `/engagements/$engagementId/overview` (no dossier-style docs route)               |
| `/engagements/$engagementId/docs`      | `frontend/src/routes/_protected/engagements/$engagementId/docs.tsx`      | Lazy `frontend/src/pages/engagements/workspace/DocsTab.tsx`                                  |

Nav wiring: `frontend/src/components/modern-nav/navigationData.ts:274-278` (`navigation.dataLibrary` → `/data-library`). Also linked from `ExpandedPanel/ProjectList.tsx:63`.

Dossier tab nav: `DossierTabNav` (`frontend/src/components/dossier/DossierTabNav.tsx:36`) exposes `docs` for all dossier types; engagement dossier IDs redirect to the engagement workspace instead of `/dossiers/engagements/$id/docs`.

### Child components & hooks (by surface)

**`/data-library`**

- UI: `DataLibraryPage.tsx` only (inline upload grid, filters, stats cards).
- Data: `useQuery` → direct Supabase `data_library_items` select with `uploaded_by:users!uploaded_by(full_name)` (`DataLibraryPage.tsx:52-83`).
- Upload: `useMutation` → `supabase.storage.from('data-library').upload` + `data_library_items.insert` (`DataLibraryPage.tsx:86-157`).
- Query key: `['data-library', searchTerm, filterCategory, selectedTags]`.
- i18n: `useTranslation()` default namespace (`translation` / `common` alias) — keys `navigation.dataLibrary`, `dataLibrary.*`, `common.*`.
- RTL: `useDirection().isRTL` for title display only; **no `dir` on page root**.

**Dossier Documents tab (7 dossier types)**

- `DossierDocumentsTab.tsx` → `fetchDossierOverview({ include_sections: ['documents'] })` (`DossierDocumentsTab.tsx:25-28`).
- Render: `DocumentsSection.tsx` (tabs: all / positions / mous / briefs / attachments).
- Query key: `['dossier-tab', 'documents', dossierId]`.
- i18n namespace: `dossier-overview` (`DocumentsSection.tsx:60-61`, `DossierDocumentsTab` sets `dir` on wrapper).
- **No upload/delete** on this tab; aggregation only.

**`fetchDocuments` (shared service)**

- `frontend/src/services/dossier-overview.service.ts:467-587`.
- Sources: `position_dossier_links` → `positions` embed (`position:positions(...)` — branch fix noted), `mous` (signatory_1/2, `lifecycle_state`), `briefs` (`dossier_id`).
- Attachments: hard-coded empty array with comment that no dossier-level attachments table exists (`dossier-overview.service.ts:526-528`).
- Does **not** query `documents` table or call `documents-get` edge function.

**Engagement workspace Docs tab**

- `DocsTab.tsx` → `useEngagementBriefs`, `useGenerateEngagementBrief` (briefs only).
- Upload button is a **placeholder** (no `onClick`, `DocsTab.tsx:159-162`).
- i18n namespace: `workspace` (registered EN + AR).

**Parallel document stack (not used by dossier docs tab)**

- `frontend/src/domains/documents/hooks/useDocuments.ts` → `documents.repository.ts` → edge `GET /functions/v1/documents-get`.
- Used by `TopicDossierDetail` `KeyDocuments` section (`TopicDossierDetail.tsx:232-235`).
- Upload hook: `frontend/src/hooks/useUploadDocument.ts` → `POST /functions/v1/documents-create` (FormData).
- Express CRUD: `backend/src/api/documents.ts` → `DocumentService` (`documents` storage bucket, `documents` table) — **not called** from data-library or dossier docs tab.

### Backend / Supabase surfaces

| Surface                                                        | Role                                                                            | Wired from workflow?                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Table `data_library_items`                                     | Data library metadata                                                           | `DataLibraryPage.tsx:56,123` — **column set mismatches `database.types.ts`**                                             |
| Storage bucket `data-library`                                  | Data library file blobs                                                         | `DataLibraryPage.tsx:102,120` — **bucket not in `supabase/seed.sql` or storage migrations**                              |
| RLS `025_data_library_rls.sql`                                 | `access_level`, `uploaded_by = auth.uid()` on insert                            | Policies assume canonical schema (`access_level`) — **VERIFY vs live**                                                   |
| Table `documents`                                              | Canonical document registry (`title`, `type`, `file_info`, `classification`, …) | `database.types.ts:8815-8900` — **not used** by data library or dossier docs tab                                         |
| Storage bucket `documents`                                     | General document files                                                          | `supabase/seed.sql:95`, `DocumentService` — wired only to Express `/api/documents`                                       |
| Edge `documents-get`                                           | List by `owner_type` / `owner_id`                                               | `documents.repository.ts:45`, `useDocuments` — **not** dossier docs tab; columns **mismatch** generated `documents` type |
| Edge `documents-create`                                        | Insert document row                                                             | `useUploadDocument.ts:92` — FormData vs JSON contract mismatch                                                           |
| Edge `documents-delete`                                        | Soft/hard delete                                                                | Contract tests only — **no frontend consumer** in this workflow                                                          |
| Tables `positions`, `mous`, `briefs`, `position_dossier_links` | Dossier docs aggregation                                                        | `fetchDocuments` in `dossier-overview.service.ts`                                                                        |
| Table `attachments`                                            | After-action attachments                                                        | Commented as not dossier-linked (`dossier-overview.service.ts:526-528`)                                                  |
| Express `GET/POST/DELETE /api/documents`                       | Backend document CRUD                                                           | `backend/src/api/documents.ts` — **not wired** to inspected UI paths                                                     |
| MSW `GET /api/v1/data-library`                                 | Test mock (name, access_level schema)                                           | `frontend/tests/mocks/handlers.ts:134-153` — page bypasses API                                                           |

**Schema note:** Two conflicting migrations exist for `data_library_items`:

- `supabase/migrations/009_create_data_library_items.sql` — `name`, `file_path`, `file_hash`, `access_level` (matches `frontend/src/types/database.types.ts:6914-6971`).
- `supabase/migrations/009_data_library.sql` — `title_en`, `file_url`, `category`, `is_public`, `download_count` (matches `DataLibraryPage.tsx` field names).

RLS in `025_data_library_rls.sql` references `access_level`, aligning with the **create** migration. **VERIFY vs live** which migration was applied on staging/production.

### i18n namespaces

| Namespace                        | Routes / components                  | EN                                 | AR                                 | Registered in `i18n/index.ts`  |
| -------------------------------- | ------------------------------------ | ---------------------------------- | ---------------------------------- | ------------------------------ |
| `translation` / `common` (alias) | `/data-library` (`useTranslation()`) | `frontend/src/i18n/en/common.json` | `frontend/src/i18n/ar/common.json` | Yes (`translation` + `common`) |
| `dossier-overview`               | `DocumentsSection`, dossier docs tab | `en/dossier-overview.json`         | `ar/dossier-overview.json`         | Yes (`index.ts:338,464`)       |
| `dossier-shell`                  | `DossierTabNav` docs label           | `en/dossier-shell.json`            | `ar/dossier-shell.json`            | Yes (`index.ts:349,475`)       |
| `workspace`                      | Engagement `DocsTab`                 | `en/workspace.json`                | `ar/workspace.json`                | Yes (`index.ts:348,474`)       |
| `dossier`                        | `TopicDossierDetail` key documents   | `en/dossier.json`                  | `ar/dossier.json`                  | Yes                            |

**Missing / silent-fallback keys (data library):** `dataLibrary.dragDropFiles`, `dataLibrary.or`, `dataLibrary.browseFiles`, `dataLibrary.maxFileSize`, `dataLibrary.fileTooLarge`, `dataLibrary.totalFiles`, `dataLibrary.categories.*`, `dataLibrary.searchPlaceholder`, `dataLibrary.category`, `dataLibrary.tags`, `dataLibrary.downloads` — none exist under a `dataLibrary` object in `common.json` (only `navigation.dataLibrary` at `common.json:181`). Dot-form `t('dataLibrary.*')` will render raw keys or fall back.

**Partial keys:** `t('common.completed')` and `t('common.error')` (`DataLibraryPage.tsx:299-300`) — no `completed` / `error` under nested `common.common` (`common.json:37-97`).

---

## Environment

| Check                                     | Result                                                                                              |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Backend health                            | `GET http://127.0.0.1:5001/health` → **200** `{"status":"ok",...}`                                  |
| Express documents API                     | `GET http://127.0.0.1:5001/api/documents` → **401** (auth required; route exists)                   |
| Frontend dev server                       | `GET http://127.0.0.1:5175/data-library` → **200**                                                  |
| Edge `documents-get` / `documents-create` | **Not probed** (would require auth token; contract tests in `tests/contract/documents-get.test.ts`) |
| Login / UAT                               | **Not attempted** — findings are code + schema + contract inspection                                |

---

## Findings

### 1. Data library page queries and inserts columns that do not match generated `data_library_items` schema

**Severity:** CRITICAL  
**Location:** `frontend/src/pages/data-library/DataLibraryPage.tsx:13-31,57-63,123-133`, `frontend/src/types/database.types.ts:6914-6971`

**Root cause:** Page expects `title_en`, `title_ar`, `file_url`, `file_type`, `file_size_bytes`, `category`, `is_public`, `download_count`. Generated types (and `009_create_data_library_items.sql` + `025_data_library_rls.sql`) define `name`, `description`, `file_path`, `file_size`, `file_hash`, `access_level`, `tags` (Json). PostgREST will reject unknown columns or return errors on select/insert.

**Suggested fix:** Align page with live schema from `database.types.ts` (or regenerate types after confirming live DB). Map UI categories to `access_level` / mime-derived tags; store `file_path` not `file_url`. **VERIFY vs live** if `009_data_library.sql` schema exists on any environment.

---

### 2. `data-library` storage bucket is not provisioned in repo seed/migrations

**Severity:** CRITICAL  
**Location:** `frontend/src/pages/data-library/DataLibraryPage.tsx:102-120`, `supabase/seed.sql:93-97`

**Root cause:** Upload targets `supabase.storage.from('data-library')`. Seed creates only `documents`, `images`, `briefs` buckets. No migration inserts a `data-library` bucket. Upload fails at storage layer even if DB insert were fixed.

**Suggested fix:** Add storage bucket migration (private, size/mime limits) and RLS policies; or reuse an existing bucket name consistently. **VERIFY vs live** Supabase dashboard for bucket presence.

---

### 3. Data library insert violates RLS and NOT NULL constraints on canonical schema

**Severity:** CRITICAL  
**Location:** `frontend/src/pages/data-library/DataLibraryPage.tsx:123-133`, `supabase/migrations/025_data_library_rls.sql:30-35`, `009_create_data_library_items.sql:12-17,40-46`

**Root cause:** Insert omits `uploaded_by`, but RLS `data_library_insert` requires `uploaded_by = auth.uid()`. Canonical schema requires `file_hash` (SHA-256, NOT NULL) and `name` / `file_path` — none are supplied. Insert cannot succeed under current policies and constraints.

**Suggested fix:** Set `uploaded_by` from `supabase.auth.getUser()`; compute SHA-256 client- or server-side; map fields to `name`, `file_path`, `file_size`, `mime_type`, `access_level`.

---

### 4. `documents-get` edge function filters columns absent from generated `documents` table

**Severity:** CRITICAL  
**Location:** `supabase/functions/documents-get/index.ts:46-59`, `frontend/src/types/database.types.ts:8815-8841`

**Root cause:** Edge function queries `.eq('owner_type', ownerType).eq('owner_id', ownerId)` and returns rows from `documents`. Generated `documents.Row` has `title`, `type`, `file_info`, `tenant_id`, `created_by` — **no** `owner_type`, `owner_id`, `document_type`, `title_en`, or `storage_path`. `useDocuments` (`domains/documents/hooks/useDocuments.ts:49-55`) depends on this edge function.

**Suggested fix:** Rewrite edge function against live `documents` schema (e.g. filter via `related_entities` JSON or a junction table), or add missing columns via migration and regenerate types. **VERIFY vs live**.

---

### 5. `useUploadDocument` sends multipart FormData; `documents-create` expects JSON

**Severity:** CRITICAL  
**Location:** `frontend/src/hooks/useUploadDocument.ts:40-100`, `supabase/functions/documents-create/index.ts:25-36`

**Root cause:** Hook POSTs `FormData` with `file` via XHR. Edge function does `await req.json()` and expects `owner_type`, `owner_id`, `document_type`, `storage_path` (no file upload handling). Request body parse fails or returns 400. Auth header uses `localStorage.getItem('supabase.auth.token')` (`useUploadDocument.ts:95-97`) — not the Supabase session helper used elsewhere.

**Suggested fix:** Either implement multipart upload in the edge function (storage upload + DB insert) or two-step: upload to storage, then JSON create. Use `supabase.auth.getSession()` for the bearer token.

---

### 6. Data library download and delete controls are non-functional

**Severity:** HIGH  
**Location:** `frontend/src/pages/data-library/DataLibraryPage.tsx:410-415`

**Root cause:** `Download` and `Trash2` buttons render with no `onClick`, no link to `file_url`/`file_path`, no call to `increment_download_count` (defined in `009_data_library.sql`), no soft-delete. UI implies actions that do nothing.

**Suggested fix:** Wire download via signed URL or storage `download()`; increment counter; soft-delete with `deleted_at` / confirm dialog.

---

### 7. Data library uses `getPublicUrl` for storage objects

**Severity:** HIGH  
**Location:** `frontend/src/pages/data-library/DataLibraryPage.tsx:117-126`

**Root cause:** After upload, page stores `getPublicUrl(fileName)` in `file_url`. Seed buckets are `public: false`. Public URLs will not grant access to private objects; stored URLs are misleading for download.

**Suggested fix:** Store `file_path` only; generate signed URLs at download time; set `access_level` appropriately.

---

### 8. Dossier Documents tab never surfaces file paths; action buttons are inert

**Severity:** HIGH  
**Location:** `frontend/src/services/dossier-overview.service.ts:530-576`, `frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx:114-121`

**Root cause:** `fetchDocuments` maps positions, MOUs, and briefs with `file_path: null`, `file_name: null`. `DocumentCard` renders Download only when `document.file_path` is truthy; Eye button has no handler regardless. Users see linked **entities**, not downloadable files.

**Suggested fix:** Product decision: either link cards to entity detail routes (`/positions/$id`, `/mous/$id`, brief viewer) or join file metadata from `documents` / attachment tables. Implement navigation on Eye/Download.

---

### 9. Parallel document fetch paths — dossier docs tab vs `useDocuments` — only aggregation is wired on tabs

**Severity:** HIGH  
**Location:** `frontend/src/components/dossier/tabs/DossierDocumentsTab.tsx:25-28`, `frontend/src/components/dossier/TopicDossierDetail.tsx:232-235`, `frontend/src/domains/documents/repositories/documents.repository.ts:35-46`

**Root cause:** Dossier `/docs` routes use `fetchDossierOverview` aggregation. Topic dossier detail embeds `useDocuments` → broken `documents-get` path (Finding 4). Two stacks show different “documents” with no shared upload entry on the docs tab. Express `/api/documents` is a third stack.

**Suggested fix:** Single document read model per dossier: extend `fetchDocuments` or fix edge function and point all consumers at one hook/service.

---

### 10. Attachments tab is permanently empty

**Severity:** HIGH  
**Location:** `frontend/src/services/dossier-overview.service.ts:526-528,579`, `DocumentsSection.tsx:249-252`

**Root cause:** `attachments` is always `[]` with explicit comment that attachments link to after_action_records, not dossiers. UI still shows an “Attachments” tab counting zero.

**Suggested fix:** Hide tab when unsupported, or implement dossier-level attachment query (e.g. via `work_item_dossiers` → after_action → attachments). **VERIFY vs live** for intended product behavior.

---

### 11. Missing i18n keys for entire data library page copy

**Severity:** MEDIUM  
**Location:** `frontend/src/pages/data-library/DataLibraryPage.tsx:224-283,317-432`, `frontend/src/i18n/en/common.json:181`

**Root cause:** Page calls `t('dataLibrary.*')` throughout, but `common.json` only defines `navigation.dataLibrary`. No dedicated `dataLibrary` object or namespace file. EN/AR UIs show missing-key strings for drag-drop, categories, search, etc.

**Suggested fix:** Add `dataLibrary` section to `en/common.json` and `ar/common.json` (or new `data-library.json` namespace registered in `i18n/index.ts`).

---

### 12. Wrong i18n paths for upload status labels on data library

**Severity:** MEDIUM  
**Location:** `frontend/src/pages/data-library/DataLibraryPage.tsx:299-300`, `frontend/src/i18n/en/common.json:37-97`

**Root cause:** `t('common.completed')` and `t('common.error')` — nested `common` object has no top-level `completed` or `error` keys (`loading` and `noData` exist; `error` lives under `accessibility` and other nested sections).

**Suggested fix:** Use existing keys (e.g. `accessibility.error`) or add `common.completed` / `common.error` under nested `common`.

---

### 13. MOU `lifecycle_state` values lack `documentStatus` translations

**Severity:** MEDIUM  
**Location:** `frontend/src/services/dossier-overview.service.ts:555`, `frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx:92-93`, `frontend/src/i18n/en/dossier-overview.json:99-105`

**Root cause:** MOU docs use `status: m.lifecycle_state` (`draft`, `negotiation`, `signed`, `active`, …). `documentStatus` only defines `draft`, `active`, `approved`, `archived`, `template`. Badge falls back to raw enum via `defaultValue`.

**Suggested fix:** Map `mou_state` to labels under `dossier-overview` or reuse `dossiers` MOU status keys.

---

### 14. `fetchDocuments` references `classification` not selected from `positions`

**Severity:** MEDIUM  
**Location:** `frontend/src/services/dossier-overview.service.ts:472-474,540`

**Root cause:** Select lists `id, title_en, title_ar, status, created_at, updated_at` but mapper reads `p.classification`. Field is always `null` in UI; if column were added to select, badge would work.

**Suggested fix:** Add `classification` to embed select if column exists on `positions` — **VERIFY vs live** — or remove dead mapping.

---

### 15. Upload progress UI stuck at 0% until completion

**Severity:** MEDIUM  
**Location:** `frontend/src/pages/data-library/DataLibraryPage.tsx:91-97,151-153,297-303`

**Root cause:** Progress initialized to `0` and only set to `100` on success. Supabase `storage.upload` call does not update intermediate progress (unlike `useUploadDocument` XHR pattern). Users see `0%` for entire upload.

**Suggested fix:** Use upload with progress callback, or indeterminate spinner instead of `Progress` bar.

---

### 16. MSW mock documents different data-library contract than production page

**Severity:** MEDIUM  
**Location:** `frontend/tests/mocks/handlers.ts:134-153`, `frontend/src/pages/data-library/DataLibraryPage.tsx:55-56`

**Root cause:** Mock serves `GET /api/v1/data-library` with `{ name, access_level, file_size }`. Page uses direct Supabase client, not this API. Tests do not guard against schema drift in `DataLibraryPage`.

**Suggested fix:** Align mocks with Supabase client behavior or add integration tests against MSW Supabase layer.

---

### 17. Engagement workspace Docs tab hardcoded English strings

**Severity:** MEDIUM  
**Location:** `frontend/src/pages/engagements/workspace/DocsTab.tsx:161,189`

**Root cause:** Upload button label `"Upload Document"` and count line `` `${n} document/documents` `` are literal English, not `t('workspace.*')` or `engagements` namespace, breaking AR parity.

**Suggested fix:** Add keys to `workspace.json` (EN + AR) and use `t()`.

---

### 18. Card hover shadows violate IntelDossier design rules

**Severity:** LOW  
**Location:** `frontend/src/pages/data-library/DataLibraryPage.tsx:405`, `frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx:78`, `frontend/src/pages/engagements/workspace/DocsTab.tsx:207`

**Root cause:** `hover:shadow-lg` / `hover:shadow-md` on cards. Design system reserves shadow for drawers; cards use flat `1px solid var(--line)` borders.

**Suggested fix:** Replace with border/hover background token transitions (`hover:bg-surface-2` or prototype list-row pattern).

---

### 19. Data library page missing root `dir` for RTL

**Severity:** LOW  
**Location:** `frontend/src/pages/data-library/DataLibraryPage.tsx:249-250`

**Root cause:** Page uses `isRTL` for title/description text only. Container has no `dir={isRTL ? 'rtl' : 'ltr'}`. Layout uses mostly symmetric classes but `justify-between` and icon order may not mirror Arabic expectations.

**Suggested fix:** Wrap page in `dir` from `useDirection()`; audit `me-1` on tag buttons (already logical at line 389).

---

### 20. Date format on data library cards does not match project convention

**Severity:** LOW  
**Location:** `frontend/src/pages/data-library/DataLibraryPage.tsx:429`

**Root cause:** Uses `format(..., 'dd MMM yyyy')` (e.g. `09 Jun 2026`). Project convention is day-first without comma: `Tue 28 Apr` (`CLAUDE.md` dates section).

**Suggested fix:** Use shared date formatter / `date-fns` pattern aligned with IntelDossier copy rules.

---

### 21. `position:positions` embed fix present; errors still only logged

**Severity:** LOW  
**Location:** `frontend/src/services/dossier-overview.service.ts:467-480,506-508`

**Root cause:** Branch uses singular embed `position:positions(...)` (fixes prior `position:positions` array bug). On query failure, errors are `console.error` only; section returns partial/empty data without user-visible error state.

**Suggested fix:** Surface query errors via TanStack Query `isError` in `DossierDocumentsTab` / `DocumentsSection`.

---

## Safe-to-auto-fix vs Needs-planned-phase

### (A) Safe to auto-fix — small, localized, no schema deploy

| ID    | Item                                                                         |
| ----- | ---------------------------------------------------------------------------- |
| 11–12 | Add `dataLibrary` i18n block + fix `common.completed` / `common.error` paths |
| 13    | MOU status label mapping in `DocumentsSection` or i18n                       |
| 14    | Add `classification` to select or remove dead field                          |
| 17    | Externalize DocsTab hardcoded strings to `workspace.json`                    |
| 18–20 | Design-token / RTL / date-format polish on data library + documents cards    |
| 21    | Error state for failed `fetchDocuments` queries                              |
| 15    | Indeterminate upload indicator (UX-only)                                     |

### (B) Needs planned phase — schema, storage, edge deploy, or product decisions

| ID   | Item                                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------ |
| 1–3  | Reconcile `data_library_items` schema (migrations vs types vs page); RLS + NOT NULL + `uploaded_by`          |
| 2    | Provision `data-library` storage bucket + policies — **VERIFY vs live**                                      |
| 4–5  | Rewrite or replace `documents-get` / `documents-create` against live `documents` schema; fix upload contract |
| 6–7  | Data library download/delete + signed URLs                                                                   |
| 8–10 | Dossier documents: entity links vs files; attachments strategy; unify with `useDocuments`                    |
| 9    | Consolidate three document pipelines (overview, edge, Express)                                               |
| 16   | Test/mock alignment for data library                                                                         |
| 1, 2 | **VERIFY vs live** which `009_*` data library migration is authoritative on staging                          |

---

## Summary

The **`/data-library`** route is nav-visible and renders a full upload/browse UI, but it is **not aligned with the canonical database schema** in `database.types.ts` or with RLS in `025_data_library_rls.sql`. The page targets a superseded column model (`title_en`, `file_url`, `category`), omits required fields (`file_hash`, `uploaded_by`), uses a **storage bucket that is not seeded** in the repo, and exposes **non-functional** download/delete controls. i18n for the page is largely missing beyond the nav label.

The **dossier Documents tab** (seven dossier types) is the more coherent read path: it loads positions, MOUs, and briefs via `fetchDossierOverview`, with the **`position:positions` embed fix** on this branch. It does not surface downloadable files or uploads; attachments are always empty by design. A **parallel stack** (`useDocuments`, `documents-get`, `useUploadDocument`, Express `/api/documents`) exists but is **schema-incompatible** with generated types and is not integrated into the shared docs tab.

**Engagement documents** live at `/engagements/$engagementId/docs` (briefs + generate briefing); dossier engagement IDs redirect there. Upload on that tab remains a placeholder.

**Recommended phase order:** (1) **VERIFY vs live** data library schema + storage bucket, then rewrite `DataLibraryPage` to match; (2) fix `documents-get` / `documents-create` or retire in favor of Express `documents` API; (3) unify dossier document read model and wire card actions; (4) i18n + design polish from bucket (A); (5) attachments product decision and download/delete UX.
