# Tags Workflow Inspection Report

**Date:** Tue 9 Jun 2026  
**Scope:** Read-only code + contract inspection of `/tags`; route file, page, reachable tag components/hooks; tag CRUD, color/label management, merge/rename/history/analytics; main tag consumption surfaces for dossiers and Data Library; backend/Supabase tables, RPCs, and edge functions; navigation discoverability; i18n EN+AR registration/parity; RTL/design-token compliance; honest-UI checks  
**Branch:** `quick/260608-c9b-country-dossier-workflow-fixes`  
**Constraint:** No source edits; findings only. The only file write is this report.  
**Inspector:** codex (substituting for cursor-agent — monthly quota exhausted)

---

## Scope

### Routes traced

| URL     | Nav source                                           | Route file                                      | Page / component                                                                | Result                                                                                                                                                        |
| ------- | ---------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/tags` | No visible current sidebar or modern-nav entry found | `frontend/src/routes/_protected/tags.tsx:26-28` | `TagsPage` -> `TagHierarchyManager`, `TagAnalytics`, merge/rename history cards | Route is mounted in generated route tree, but the main hierarchy tab is contract-broken against the edge response shape; analytics/history/merge are stubbed. |

Nav wiring notes:

- The route is generated in `frontend/src/routeTree.gen.ts:279-283` and `frontend/src/routeTree.gen.ts:2693-2697`; this generated file was already modified in the worktree and was not touched.
- The protected shell renders `Sidebar` from `frontend/src/components/layout/AppShell.tsx:172-193`; `Sidebar` consumes `createNavigationGroups` from `frontend/src/components/layout/navigation-config.ts:58-216`, which has no `/tags` item.
- The older modern-nav dataset also has no `/tags` item in its Reports/System groups (`frontend/src/components/modern-nav/navigationData.ts:224-335`).

### Child components & hooks

| Surface                   | Files                                                             | Role                                                                 | Current wiring                                                                                                                                          |
| ------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tags route                | `frontend/src/routes/_protected/tags.tsx:30-90`                   | Page shell with Hierarchy, Analytics, History tabs                   | Uses `tags` namespace and mounts tag components, but delegates all behavior to hook/component layers.                                                   |
| Hierarchy manager         | `frontend/src/components/tags/TagHierarchyManager.tsx:100-780`    | Tree display, create/edit/delete dialogs, color picker, merge dialog | Calls hook API for CRUD/merge, but reads query data as arrays while the edge returns `{ data, total }`; edit/delete path IDs do not match edge parsing. |
| Tag analytics             | `frontend/src/components/tags/TagAnalytics.tsx:69-405`            | Usage overview, entity breakdown, top/unused tags                    | Component expects `{ data: TagAnalyticsRow[] }`, but current hook returns a stub object without `data`, so the tab renders an error state.              |
| History cards             | `frontend/src/routes/_protected/tags.tsx:93-204`                  | Merge and rename history                                             | Hooks return `Promise.resolve([])`, so live history never displays; merge card hardcodes target label.                                                  |
| Compatibility hook export | `frontend/src/hooks/useTagHierarchy.ts:1-19`                      | Legacy import surface                                                | Re-exports `@/domains/tags`; route/components use this compatibility path.                                                                              |
| Domain hooks              | `frontend/src/domains/tags/hooks/useTagHierarchy.ts:22-170`       | React Query wrappers and mutations                                   | CRUD read/create call repository; merge/history/analytics/entity assignment are currently local stubs/no-ops.                                           |
| Domain repository         | `frontend/src/domains/tags/repositories/tags.repository.ts:14-29` | API-client calls to tag hierarchy edge function                      | Uses `apiGet('/tag-hierarchy')`, `apiPost('/tag-hierarchy')`, `apiPut('/tag-hierarchy/{id}')`, `apiDelete('/tag-hierarchy/{id}')`.                      |
| Tag selector/display      | `frontend/src/components/tags/TagSelector.tsx:50-419`             | Reusable assignment/display component                                | Discards `entityType`/`entityId`; assignment/unassignment hook is a no-op. No primary traced surface imports it.                                        |

### Backend / Supabase surfaces

| Surface                                                          | Role                                                                               | Wired from workflow?                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Supabase Edge `tag-hierarchy`                                    | CRUD, search, suggestions, entity tag assignments, analytics, merge/rename/history | Partially. `/tags` hierarchy read/create call it through `api-client`; update/delete path contract is broken. Merge/history/analytics are not wired from current hooks. Deployment is **VERIFY vs live**.                                                                |
| Table `tag_categories`                                           | Canonical taxonomy tags with `name_en`, `name_ar`, `color`, hierarchy, status      | Partially. Edge read/create targets it; update/delete are unreachable from the current frontend path contract. Generated type exists at `frontend/src/types/database.types.ts:25584-25661`; live RLS/schema is **VERIFY vs live**.                                       |
| Table `entity_tag_assignments`                                   | Junction table from entity type/id to taxonomy tag id                              | Not wired from main consumers. Edge supports assign/unassign, but `TagSelector` no-ops and dossier/Data Library surfaces use independent tag arrays. Generated type exists at `frontend/src/types/database.types.ts:12144-12194`; live RLS/schema is **VERIFY vs live**. |
| Tables `tag_merge_history`, `tag_rename_history`, `tag_synonyms` | Audit trail and synonyms                                                           | Edge can read/write some paths, but current frontend hooks return local empty arrays and expose no live rename UI. Generated types exist at `frontend/src/types/database.types.ts:25662-25805`; **VERIFY vs live**.                                                      |
| View `mv_tag_usage_analytics`                                    | Aggregated tag counts by entity type                                               | Edge `analytics` GET reads it, but frontend analytics hook is a stub. Generated type exists at `frontend/src/types/database.types.ts:30895-30930`; **VERIFY vs live**.                                                                                                   |
| RPC `get_tag_hierarchy_tree`                                     | Returns hierarchical tag rows                                                      | Indirectly used by Edge `GET /tag-hierarchy`, but the frontend does not unwrap the `{ data, total }` response. Generated signature exists at `frontend/src/types/database.types.ts:34847-34869`; **VERIFY vs live**.                                                     |
| RPC `merge_tags` / `rename_tag`                                  | Merge and rename operations                                                        | Edge supports them, but current frontend merge hook is a no-op and no rename dialog is wired. Generated signatures exist at `frontend/src/types/database.types.ts:35759-35767` and `frontend/src/types/database.types.ts:35944-35952`; **VERIFY vs live**.               |
| `dossiers.tags`                                                  | Legacy/simple `string[]` tags on dossiers                                          | Wired from dossier create/list/display, separate from taxonomy. Generated type is `string[]                                                                                                                                                                              | null`at`frontend/src/types/database.types.ts:9413-9442`.                                               |
| `data_library_items.tags`                                        | Data Library tag column                                                            | Used by Data Library page as `string[]`, but generated type is `Json                                                                                                                                                                                                     | null` and surrounding page/function field names are stale against generated types; **VERIFY vs live**. |

### i18n namespaces

| Namespace                | Routes / components                                           | EN                                     | AR                                     | Registered in `i18n/index.ts`                                                                    | Notes                                                                                |
| ------------------------ | ------------------------------------------------------------- | -------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `tags`                   | `/tags`, `TagHierarchyManager`, `TagAnalytics`, `TagSelector` | `frontend/src/i18n/en/tags.json:1-193` | `frontend/src/i18n/ar/tags.json:1-193` | Imports at `frontend/src/i18n/index.ts:71-72`; resources at `frontend/src/i18n/index.ts:290,416` | Parity probe returned `missingAr=0 missingEn=0`.                                     |
| `common` / `translation` | Common buttons and Data Library default namespace             | `frontend/src/i18n/en/common.json`     | `frontend/src/i18n/ar/common.json`     | `frontend/src/i18n/index.ts:255-257,381-383`                                                     | `common:cancel` and `common:save` are registered. Data Library keys exist in common. |
| `dossier`                | Dossier tag input labels/placeholders in create wizard        | `frontend/src/i18n/en/dossier.json`    | `frontend/src/i18n/ar/dossier.json`    | `frontend/src/i18n/index.ts:261,387`                                                             | `dossier:form.tags`, `tagsPlaceholder`, and `tagsDescription` exist in EN+AR.        |

Parity probe: `tags` returned `en=151 ar=151 missingAr=[] missingEn=[]`. Scoped issue is not missing namespace registration; it is hardcoded literals inside the tag UI.

---

## Environment

| Check                       | Result                                                                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Backend health              | `GET http://127.0.0.1:5001/health` -> **200** `{"status":"ok","timestamp":"2026-06-09T20:30:12.382Z","environment":"development"}` |
| Frontend `/tags` shell      | `HEAD http://127.0.0.1:5175/tags` -> **200** SPA HTML                                                                              |
| Authenticated browser UAT   | Not performed; inspection stayed source/read-only and sent no write requests.                                                      |
| Live Supabase DB/RPC/schema | Not probed with auth; DB/RPC/storage deployment claims are **VERIFY vs live**.                                                     |
| Typecheck / tests           | Not run; avoided toolchain commands that may write build/cache artifacts under the hard write constraint.                          |

---

## Findings

### 1. [TAG] `/tags` hierarchy tab is contract-broken against the edge response shape

**Severity:** CRITICAL  
**Location:** `frontend/src/components/tags/TagHierarchyManager.tsx:123-134,142-161,480-529`, `frontend/src/domains/tags/hooks/useTagHierarchy.ts:22-36,70-75`, `frontend/src/domains/tags/repositories/tags.repository.ts:14-17`, `supabase/functions/tag-hierarchy/index.ts:145-160`

**Root cause:** `GET /functions/v1/tag-hierarchy` returns `{ data, total }`, but `useTagHierarchyTree()` exposes that raw object and `TagHierarchyManager` casts `data` directly to `TagCategory[]`. The component then checks `filteredTree.length` and calls `filteredTree.map(...)`. With a normal edge response, `filteredTree` is an object, not an array, so the main hierarchy tab can throw `filteredTree.map is not a function`. The same shape mismatch affects `flatTags?.filter(...)` in parent/merge selectors.

**Suggested fix:** Make the repository or hook return a typed `TagCategory[]` by unwrapping `response.data`, and keep a separate typed response for consumers that need `total`. Add a component/hook test that feeds the actual edge response shape.

---

### 2. [TAG] Edit and delete requests cannot pass the tag id to the edge function

**Severity:** HIGH  
**Location:** `frontend/src/domains/tags/repositories/tags.repository.ts:23-28`, `frontend/src/components/tags/TagHierarchyManager.tsx:223-260`, `supabase/functions/tag-hierarchy/index.ts:465-469,530-575`

**Root cause:** The repository sends updates/deletes to `/tag-hierarchy/{id}`. The edge function parses `action` from the last path segment, but its PUT/DELETE handlers look for the tag id in `url.searchParams.get('id')` or `body.id`. `TagHierarchyManager` passes update data without `id`, and DELETE has no body. Result: edit/delete paths reach the edge without an id the handler can read and return `Tag ID is required`.

**Suggested fix:** Align the contract either by calling `/tag-hierarchy?id={id}` / body `{ id, ...data }`, or by updating the edge function to treat the trailing path segment as the id for PUT/DELETE. Cover both edit and delete in a contract test.

---

### 3. [TAG] Merge, history, and analytics are presented as live workflow features but are local stubs

**Severity:** HIGH  
**Location:** `frontend/src/domains/tags/hooks/useTagHierarchy.ts:98-170`, `frontend/src/routes/_protected/tags.tsx:93-204`, `frontend/src/components/tags/TagAnalytics.tsx:72-90,140-147`, `frontend/src/components/tags/TagHierarchyManager.tsx:278-294`

**Root cause:** `useTagMergeHistory()` and `useTagRenameHistory()` always resolve empty arrays; `useTagAnalytics()` returns `{ totalTags: 0, categories: [], usage: [] }` instead of the `{ data: [...] }` shape `TagAnalytics` expects; `useRefreshTagAnalytics()` resolves without calling the edge; and `useMergeTags()` resolves the source/target ids locally without calling `merge_tags`. The UI can show merge success and history/analytics tabs, but no merge, history read, analytics refresh, or rename history read actually reaches Supabase.

**Suggested fix:** Wire these hooks to the existing edge paths (`/tag-hierarchy/merge`, `/tag-hierarchy/merge-history`, `/tag-hierarchy/rename-history`, `/tag-hierarchy/analytics`, `/tag-hierarchy/refresh-analytics`) and normalize response shapes. Until then, hide or disable the tabs/actions instead of showing successful no-op behavior.

---

### 4. [TAG] Managed taxonomy tags are not attached to primary entity surfaces

**Severity:** HIGH  
**Location:** `frontend/src/components/tags/TagSelector.tsx:79-91,116-145`, `frontend/src/domains/tags/hooks/useTagHierarchy.ts:118-141`, `frontend/src/components/dossier/wizard/SharedBasicInfoStep.tsx:199-224`, `frontend/src/components/dossier/wizard/hooks/useCreateDossierWizard.ts:80-90`, `frontend/src/types/database.types.ts:12144-12155,9413-9442`

**Root cause:** The taxonomy assignment component discards `entityType` and `entityId`, and its hook returns empty assigned tags plus no-op assign/unassign functions. Meanwhile, dossier create/edit/display surfaces still use a comma-separated string-array field stored on `dossiers.tags`, not `entity_tag_assignments`. A user can manage taxonomy tags in `/tags`, but those managed tags are not the tags users attach to dossiers.

**Suggested fix:** Decide the canonical tag model. If taxonomy/junction tags are the product direction, replace dossier string inputs and displays with a wired `TagSelector`/`TagDisplay` path backed by `entity_tag_assignments`. If legacy `dossiers.tags` remains canonical, rename `/tags` to make clear it manages a separate taxonomy and remove nonfunctional assignment affordances.

---

### 5. [DL] Data Library tag consumption is stale against generated DB types and has inert item actions

**Severity:** HIGH  
**Location:** `frontend/src/pages/data-library/DataLibraryPage.tsx:13-31,55-82,123-132,414-420,441-449`, `frontend/src/types/database.types.ts:6914-6929`, `supabase/functions/data-library/index.ts:5-14,142-163,253-265`

**Root cause:** The Data Library page and edge function assume fields such as `title_en`, `title_ar`, `file_url`, `file_type`, `file_size_bytes`, `category`, `is_public`, and `download_count`; generated types for `data_library_items` expose `name`, `description`, `file_path`, `file_size`, `access_level`, and `tags: Json | null` instead. The page also renders Download/Delete icon buttons without handlers. Tag filtering/display is therefore tied to a stale and only partially typed contract. Hosted schema remains **VERIFY vs live**.

**Suggested fix:** Regenerate or verify live DB types, then align the Data Library page and edge function to the actual `data_library_items` schema. Type `tags` explicitly as a JSON string array if that is the intended contract, and either wire or remove the Download/Delete controls.

---

### 6. [NAV] `/tags` is mounted but not discoverable from the current protected navigation

**Severity:** MEDIUM  
**Location:** `frontend/src/routeTree.gen.ts:279-283,2693-2697`, `frontend/src/components/layout/AppShell.tsx:172-193`, `frontend/src/components/layout/navigation-config.ts:58-216`, `frontend/src/components/modern-nav/navigationData.ts:224-335`

**Root cause:** The route exists, but the active protected app shell renders `Sidebar`, and `navigation-config.ts` has no `/tags` entry in Operations, Dossiers, or Administration. The older modern-nav category data also omits `/tags`. Users must know the URL manually.

**Suggested fix:** Add a deliberate `/tags` entry to the appropriate navigation group, likely Administration/System if taxonomy management is admin-owned. Include EN+AR nav labels if a new key is required.

---

### 7. [I18N] Scoped tag UI still contains hardcoded literals outside EN/AR resources

**Severity:** LOW  
**Location:** `frontend/src/routes/_protected/tags.tsx:121-124`, `frontend/src/components/tags/TagHierarchyManager.tsx:557-572,624-639`, `frontend/src/components/tags/TagAnalytics.tsx:287-291`

**Root cause:** The `tags` namespace itself is registered and has EN+AR parity, but several visible strings bypass it: merge history renders hardcoded `Target Tag`, tag form inputs use literal English/Arabic placeholders, and hierarchy distribution appends the literal English word `tags`. These will not localize consistently and can leak English in Arabic mode.

**Suggested fix:** Move these literals into `tags.json` with EN+AR entries, and use interpolation for count text instead of concatenating `" tags"`.

---

### 8. [TOKEN] Tag creation can persist a raw hex fallback color from the edge function

**Severity:** LOW  
**Location:** `supabase/functions/tag-hierarchy/index.ts:340-347`, `frontend/src/components/tags/TagHierarchyManager.tsx:89-95`, `frontend/src/types/tag-hierarchy.types.ts:321-331`

**Root cause:** The frontend palette and default form value now use semantic CSS token values, but the edge function still falls back to `#3B82F6` when `tagData.color` is omitted. Because tag colors are stored and later rendered via inline `backgroundColor`, this reintroduces a raw palette color into the tag system if any client omits color.

**Suggested fix:** Store a semantic color token/id as the backend default, or validate that all writes use an allowed token palette. If live data already contains raw hex values, plan a migration or compatibility display path.

---

## Final

### (A) Safe to auto-fix

| Finding ID | Scope                                  | Why                                                                                      |
| ---------- | -------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1          | Hook/repository response normalization | Local frontend type/shape fix with clear edge response contract.                         |
| 2          | Edit/delete id contract                | Small client/edge alignment once the preferred URL shape is chosen.                      |
| 6          | Navigation entry                       | Straightforward nav config/i18n addition if product confirms placement.                  |
| 7          | Literal i18n cleanup                   | Local key additions with EN+AR parity.                                                   |
| 8          | Backend color fallback                 | Small fallback-value change, with live-data migration only if existing raw hexes matter. |

### (B) Needs planned phase

| Finding ID | Scope                               | Why                                                                                                      |
| ---------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 3          | Merge/history/analytics wiring      | Requires deciding and testing full edge contracts, response shapes, and honest disabled/degraded states. |
| 4          | Canonical tag model across entities | Product/data-model decision: taxonomy junction table vs legacy `tags` arrays.                            |
| 5          | Data Library tag/schema alignment   | Requires live schema verification, page/function rewrite, and possibly data migration.                   |

Summary: `/tags` is mounted but not discoverable, and its primary hierarchy UI is currently broken by an edge response-shape mismatch. Several promoted tag-management capabilities are stubs: merge can show success without a backend write, history is always empty, analytics never calls the analytics surface, and entity assignment no-ops. The larger product issue is model split: `/tags` manages taxonomy tables, while dossiers and Data Library mostly consume independent tag arrays/JSON columns. Recommended phase order: first fix the route-level crash and edit/delete contract, then wire or disable merge/history/analytics honestly, then decide the canonical tag model for dossier/Data Library consumption, and finish with nav, i18n, and color-token cleanup.
