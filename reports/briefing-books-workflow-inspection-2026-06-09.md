# Briefing Books Workflow Inspection Report

**Date:** Tue 9 Jun 2026  
**Scope:** Read-only code + contract inspection of `/briefing-books`, `BriefingBooksPage`, `frontend/src/components/briefing-books/*`, `frontend/src/hooks/useBriefingBooks.ts`, `frontend/src/types/briefing-book.types.ts`, briefing-book Supabase tables, edge function, nav, i18n, RTL, and design-token usage  
**Branch:** `quick/260608-c9b-country-dossier-workflow-fixes`  
**Constraint:** No source edits; findings only.  
**Inspector:** codex (substituting for cursor-agent — monthly quota exhausted)

---

## Scope

### Routes traced

| URL               | Route file                                          | Page / component                                                                                                    | Result                                        |
| ----------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `/briefing-books` | `frontend/src/routes/_protected/briefing-books.tsx` | Intended page exists at `frontend/src/pages/briefing-books/BriefingBooksPage.tsx`, but is not imported by the route | **Disabled:** route redirects to `/dashboard` |

Nav wiring: `frontend/src/components/modern-nav/navigationData.ts:224-287` has the Reports category but no `/briefing-books` item. The only other UI reference found is a route-local FAB mapping in `frontend/src/hooks/useContextAwareFAB.ts:259-269`, which is only useful after the route is already active.

### Child components & hooks

| Surface    | Files                                                            | Role                                                                        | Current wiring                                                                   |
| ---------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Page shell | `frontend/src/pages/briefing-books/BriefingBooksPage.tsx`        | List/builder mode switch, header, back button                               | Not mounted by route                                                             |
| List       | `frontend/src/components/briefing-books/BriefingBooksList.tsx`   | List, client-side status filter, download, delete, menu actions             | Depends on `useBriefingBooks()`                                                  |
| Builder    | `frontend/src/components/briefing-books/BriefingBookBuilder.tsx` | 4-step wizard: entities, sections/topics, options, review/generate          | Depends on `useBriefingBooks()`, `useBriefingBookTemplates()`, `useDossiers({})` |
| Hook       | `frontend/src/hooks/useBriefingBooks.ts`                         | Supabase Edge Function list/detail/templates/create/delete/download wrapper | Calls `briefing-books` edge function                                             |
| Types      | `frontend/src/types/briefing-book.types.ts`                      | Frontend DTOs for config, entity, book, template, progress                  | Does not match raw edge response shape                                           |

Implemented workflow actions:

- List: load, local status filter, delete, direct signed-URL download when `fileUrl` exists.
- Create: builder creates a new book via edge `POST`.
- Sections/entries management: sections can be toggled/reordered; entities can be selected from `/dossiers-list`.
- Edit: no edit route/modal found.
- Export/PDF: UI exposes PDF/DOCX/HTML, but edge function always generates and uploads HTML.
- View/duplicate/regenerate: menu labels exist, but handlers are not implemented.

### Backend / Supabase surfaces

| Surface                                                                            | Role                                                                           | Wired from workflow?                                                                |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Edge `briefing-books`                                                              | List/detail/templates/create/delete; generates document and storage signed URL | Yes, via `useBriefingBooks.ts`                                                      |
| Table `briefing_books`                                                             | Stores selected config and generated file metadata                             | Yes, edge list/detail/create/update/delete                                          |
| Table `briefing_book_entities`                                                     | Junction table for selected entities and included sections                     | Yes, edge create insert                                                             |
| Table `briefing_book_templates`                                                    | Default/user templates                                                         | Hook fetches it, but builder ignores returned data; edge select is schema-invalid   |
| Storage bucket `briefing-books`                                                    | Stores generated files, private bucket + signed URL                            | Yes, edge upload/delete                                                             |
| Express routes                                                                     | None found for briefing-books                                                  | No                                                                                  |
| RPCs                                                                               | None found for briefing-books                                                  | No                                                                                  |
| `dossiers` / `key_contacts` / `engagements` / `positions` / `mous` / `commitments` | Source data for generated book content                                         | Edge reads them directly; several selected columns do not match `database.types.ts` |

DB/RPC note: local generated types confirm the `briefing_books`, `briefing_book_entities`, and `briefing_book_templates` columns. Actual hosted Supabase deployment, storage bucket existence, and edge deployment status remain **VERIFY vs live**.

### i18n namespaces

| Namespace        | Routes / components                                                                 | EN                                         | AR                                         | Registered in `i18n/index.ts`                                     |
| ---------------- | ----------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------ | ----------------------------------------------------------------- |
| `briefing-books` | `BriefingBooksPage`, `BriefingBookBuilder`, `BriefingBooksList`, `useBriefingBooks` | `frontend/src/i18n/en/briefing-books.json` | `frontend/src/i18n/ar/briefing-books.json` | Yes: imports at `index.ts:27-28`, resources at `index.ts:268,394` |

Key parity: EN and AR files both contain 210 flattened keys; no EN/AR drift found. Missing-key issues are component usage gaps, not locale-file parity gaps.

---

## Environment

| Check                            | Result                                                                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Backend health                   | `GET http://127.0.0.1:5001/health` -> **200** `{"status":"ok","timestamp":"2026-06-09T19:54:01.985Z","environment":"development"}` |
| Frontend `/briefing-books` shell | `GET http://127.0.0.1:5175/briefing-books` -> **200** SPA HTML                                                                     |
| Client route behavior            | Source-confirmed redirect to `/dashboard` in `frontend/src/routes/_protected/briefing-books.tsx:3-6`; not UAT-clicked              |
| Edge `briefing-books`            | Not probed; no write requests, auth required                                                                                       |
| Storage bucket `briefing-books`  | Not probed; **VERIFY vs live**                                                                                                     |
| Typecheck / tests                | Not run; avoided toolchain commands that may write build/cache artifacts under the hard write constraint                           |

---

## Findings

### 1. `/briefing-books` route is disabled and the page is not mounted

**Severity:** CRITICAL  
**Location:** `frontend/src/routes/_protected/briefing-books.tsx:3-6`, `frontend/src/pages/briefing-books/BriefingBooksPage.tsx:21-103`

**Root cause:** The file route exists, but `beforeLoad` always throws `redirect({ to: '/dashboard' })`. The route file never imports or renders `BriefingBooksPage`, so the entire list/create/export surface is unreachable through `/briefing-books`.

**Suggested fix:** Replace the redirect route with a component route that renders `BriefingBooksPage`; keep any feature flag/auth gating explicit. Re-run route generation after the source route changes.

---

### 2. `/briefing-books` is not discoverable from the modern navigation

**Severity:** HIGH  
**Location:** `frontend/src/components/modern-nav/navigationData.ts:224-287`, `frontend/src/hooks/useContextAwareFAB.ts:259-269`

**Root cause:** The Reports nav category includes reports, analytics, intelligence, monitoring, export, data library, and word assistant, but no briefing-books item. The only `/briefing-books` UI mapping is the context-aware FAB for the same route, which cannot help users discover the route before they are already there.

**Suggested fix:** Add a real nav item for `/briefing-books` under the appropriate category, with `navigation.*` i18n keys in EN+AR. Decide whether it belongs under Reports, Dossiers, or Briefs before exposing it.

---

### 3. Edge list/detail responses are raw DB rows, but the UI expects hydrated `BriefingBook` DTOs

**Severity:** CRITICAL  
**Location:** `frontend/src/hooks/useBriefingBooks.ts:54-67,72-82,225-227`, `frontend/src/types/briefing-book.types.ts:147-174`, `frontend/src/components/briefing-books/BriefingBooksList.tsx:227-243,255-267`, `supabase/functions/briefing-books/index.ts:920-934,945-979`

**Root cause:** The edge function returns raw snake_case rows (`title_en`, `file_url`, `created_at`, `entity_ids`, `sections`) from `briefing_books`. The hook passes them through as `BriefingBook[]`. The list dereferences `book.config.title_en`, `book.config.entities`, `book.fileUrl`, and `book.createdAt`, which do not exist on the raw rows. Any non-empty list can render-crash on `book.config`.

**Suggested fix:** Add a shared mapper at the edge or hook boundary: raw DB row -> `{ id, config: { title_en, title_ar, entities, sections, ... }, fileUrl, createdAt, ... }`. Include entity details by joining `briefing_book_entities` or storing enough metadata in `sections/config`; otherwise update frontend types/components to use the raw row model.

---

### 4. Briefing-book generation reads multiple columns that are absent from local generated DB types

**Severity:** CRITICAL  
**Location:** `supabase/functions/briefing-books/index.ts:757-837`, `frontend/src/types/database.types.ts:9388-9417,11008-11016,18854-18896,21683-21716,5364-5385`

**Root cause:** `fetchEntityData()` selects fields that do not exist in `frontend/src/types/database.types.ts`:

- `dossiers.summary_en`, `dossiers.summary_ar` are selected, but generated `dossiers.Row` has `description_en`, `description_ar`, not summaries.
- `engagements.title`, `date`, `description`, and `dossier_ids` are selected/filtered, but generated `engagements.Row` only has `id`, `engagement_category`, `engagement_type`, `location_*`, and `is_seed_data`.
- `positions.title`, `content`, `type`, and `dossier_ids` are selected/filtered, but generated `positions.Row` has `title_en/ar`, `content_en/ar`, `position_type_id`, and no `dossier_ids`.
- `mous.status`, `signing_date`, and `dossier_id` are selected/filtered, but generated `mous.Row` uses `lifecycle_state`, `dates`, `country_id`, `signatory_*_dossier_id`, etc.
- `commitments.deadline` and `dossier_id` are selected/filtered, but generated `commitments.Row` uses `timeline` JSON and has no dossier FK column.

The first failing PostgREST select/filter will abort generation.

**Suggested fix:** Rebuild `fetchEntityData()` against the current schema and domain relationships. For any live-only view/RPC expected to supply these shapes, mark and verify it explicitly against hosted Supabase before coding. **VERIFY vs live** whether staging has compatibility views not present in generated types.

---

### 5. Sensitivity-level contract is numeric in the UI but string/enum in the edge/database path

**Severity:** HIGH  
**Location:** `frontend/src/components/briefing-books/BriefingBookBuilder.tsx:253,855-861`, `frontend/src/types/briefing-book.types.ts:136-137`, `supabase/functions/briefing-books/index.ts:52,769-775,1017`, `frontend/src/types/database.types.ts:4247,4281,4315`

**Root cause:** The builder initializes and submits `maxSensitivityLevel` as numbers `1 | 2 | 3`. The edge function type expects `'low' | 'medium' | 'high'`, compares strings through `sensitivityOrder`, and inserts the value into `briefing_books.max_sensitivity_level`, which generated types expose as `string | null`. `dossiers.sensitivity_level` is also numeric locally, so `sensitivityOrder[dossier.sensitivity_level]` evaluates through an undefined map key.

**Suggested fix:** Pick one sensitivity model for this workflow. Prefer the current dossier numeric model if the rest of the app uses `1-4`, then convert labels only at the UI boundary and make edge/database validation numeric. If the DB enum is live, convert the UI value before insert and before filtering. **VERIFY vs live** exact column type before migration.

---

### 6. Template fetch is schema-invalid and its result is unused

**Severity:** MEDIUM  
**Location:** `frontend/src/components/briefing-books/BriefingBookBuilder.tsx:151`, `frontend/src/hooks/useBriefingBooks.ts:87-97,241-245`, `supabase/functions/briefing-books/index.ts:895-912`, `frontend/src/types/database.types.ts:4157-4178`

**Root cause:** The builder always starts `useBriefingBookTemplates()`, but stores the result in `_templates` and never renders templates. The edge function selects `name`, `description`, and `format_options` from `briefing_book_templates`; generated types define `name_en`, `name_ar`, `description_en`, `description_ar`, `sections`, `format`, `primary_language`, and boolean option columns instead. Template requests will fail even though the UI silently ignores the result.

**Suggested fix:** Either remove the unused template query until templates are implemented, or fix the edge select/DTO mapper and add actual template UI. Keep `BriefingBookTemplate.config` aligned with table columns.

---

### 7. PDF/DOCX options are advertised but generation always uploads HTML

**Severity:** HIGH  
**Location:** `frontend/src/components/briefing-books/BriefingBookBuilder.tsx:245,756-775`, `frontend/src/i18n/en/briefing-books.json:102-109`, `supabase/functions/briefing-books/index.ts:5,96-97,1071-1090`

**Root cause:** The UI offers `pdf`, `docx`, and `html` formats with PDF/DOCX descriptions. The edge function only calls `generateHTMLDocument()`, names the file `*.html`, uploads it with `contentType: 'text/html'`, and creates a signed URL to that HTML file regardless of `config.format`.

**Suggested fix:** Implement real PDF/DOCX renderers or restrict the UI/schema to HTML until export conversion exists. If PDF is produced by browser print, label it honestly and do not store rows as PDF-ready output.

---

### 8. View, duplicate, and regenerate actions are rendered but have no handlers

**Severity:** MEDIUM  
**Location:** `frontend/src/components/briefing-books/BriefingBooksList.tsx:313-325`

**Root cause:** The dropdown renders `View`, `Duplicate`, and conditional `Regenerate` menu items, but only the delete item has `onClick`. Users see commands that do nothing.

**Suggested fix:** Add handlers for view/detail, duplicate-from-config, and regenerate-from-existing-config, or hide the menu items until those flows are implemented.

---

### 9. Generated HTML interpolates user/database strings without escaping

**Severity:** HIGH  
**Location:** `supabase/functions/briefing-books/index.ts:184-192,213-215,265-270,337-341,445-452,690-713`

**Root cause:** The document generator injects titles, descriptions, entity names, contacts, positions, custom content, header text, and footer text directly into HTML/CSS template strings. A malicious or malformed dossier/contact/custom value can break the generated document or execute script when the signed HTML is opened.

**Suggested fix:** Escape all text content and CSS string values by default. Allow rich/custom HTML only through an explicit sanitizer allowlist, or store custom sections as markdown and render through a sanitizer.

---

### 10. i18n namespace is registered, but several component keys still leak raw keys or English fallbacks

**Severity:** MEDIUM  
**Location:** `frontend/src/i18n/index.ts:27-28,268,394`, `frontend/src/components/briefing-books/BriefingBooksList.tsx:144,355`, `frontend/src/components/briefing-books/BriefingBookBuilder.tsx:943,1165-1179`, `frontend/src/i18n/en/briefing-books.json:1-280`, `frontend/src/i18n/ar/briefing-books.json:1-280`

**Root cause:** `briefing-books` EN+AR files are registered and have parity, but components reference keys/text that the namespace does not define:

- `t('actions.retry') || 'Retry'` returns the missing-key string `actions.retry`, so the fallback is not used.
- Filtered empty state is hardcoded English: `No briefing books match the selected filter.`
- Review language output is hardcoded `Arabic` / `English`.
- Discard dialog uses missing `builder.discard.*` keys with English `defaultValue`, so Arabic displays English.

**Suggested fix:** Add the missing keys to EN+AR and replace hardcoded strings with `t()`. Avoid `t(key) || fallback`; use `defaultValue` only for developer-safe temporary text, not production Arabic UI.

---

### 11. Design-token and RTL compliance gaps remain in the list and generated template

**Severity:** LOW  
**Location:** `frontend/src/components/briefing-books/BriefingBooksList.tsx:207`, `supabase/functions/briefing-books/index.ts:498-512,558-580,590-619,637-666,678-713`

**Root cause:** The UI card uses `hover:shadow-md`, which violates the no-card-shadows rule. The generated HTML template hardcodes raw hex colors (`#1f2937`, `#1e40af`, `#3b82f6`, etc.) and physical `border-left` / `border-right` construction instead of a tokenized/logical style strategy.

**Suggested fix:** Remove the card shadow and use border/background/token state styles. For export HTML, define a document theme token map and logical properties; if generated files are intentionally print-independent, document that exception and keep app UI token-clean.

---

### 12. List filtering/pagination parameters are not wired to the edge GET query

**Severity:** LOW  
**Location:** `frontend/src/hooks/useBriefingBooks.ts:39-60,145-147`, `supabase/functions/briefing-books/index.ts:939-958`, `frontend/src/components/briefing-books/BriefingBooksList.tsx:82-90,176-188`

**Root cause:** The edge GET handler reads URL query params (`status`, `limit`, `cursor`), but `fetchBriefingBooks()` puts serialized params in a JSON body field named `searchParams`. The main query calls `fetchBriefingBooks({})`, and the visible status filter is applied client-side only. Server-side pagination/filtering is therefore unused.

**Suggested fix:** Pass query params in the invoked function path (or switch to direct fetch for GET with query string), include `statusFilter` in the query key, and implement a real cursor/next-page UI if the dataset can grow.

---

## Safe-to-auto-fix vs Needs-planned-phase

### (A) Safe to auto-fix — small, localized, no schema deploy

| ID  | Item                                                                         |
| --- | ---------------------------------------------------------------------------- |
| 8   | Hide or wire no-op `View`, `Duplicate`, `Regenerate` menu items              |
| 10  | Add missing `briefing-books` i18n keys and replace hardcoded English strings |
| 11  | Remove `hover:shadow-md`; token-clean the app card styling                   |
| 12  | Wire GET query params if keeping server-side filters/pagination              |

### (B) Needs planned phase — routing, schema, edge deploy, export pipeline, or product decisions

| ID  | Item                                                                     |
| --- | ------------------------------------------------------------------------ |
| 1   | Re-enable `/briefing-books` route and mount `BriefingBooksPage`          |
| 2   | Add discoverability in modern nav and product placement                  |
| 3   | Define and implement raw DB row -> `BriefingBook` DTO contract           |
| 4   | Rebuild edge content queries against current schema — **VERIFY vs live** |
| 5   | Unify sensitivity-level contract — **VERIFY vs live**                    |
| 6   | Repair or remove templates flow                                          |
| 7   | Implement real PDF/DOCX export or remove advertised formats              |
| 9   | Sanitize generated HTML and custom/user/database content                 |

---

## Summary

The briefing-books workflow is currently **not user-reachable**: `/briefing-books` redirects to `/dashboard` and the page is absent from the modern nav. Once re-enabled, the next blockers are backend/frontend contract issues: list/detail responses are raw DB rows while the UI expects a nested camelCase DTO, and generation queries several columns that do not exist in local generated Supabase types. Export is also mislabeled: PDF/DOCX are offered, but only HTML is generated.

**Recommended phase order:** (1) decide product placement and re-enable route/nav; (2) define the `BriefingBook` API DTO and map list/detail/create responses; (3) **VERIFY vs live** current Supabase schema, then repair `fetchEntityData()` and sensitivity filtering; (4) decide export scope (HTML-only vs real PDF/DOCX); (5) sanitize generated HTML; (6) finish list actions/templates; (7) close i18n/RTL/design-token polish.
