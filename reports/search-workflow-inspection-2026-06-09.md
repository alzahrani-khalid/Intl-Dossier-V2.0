# Global Search Workflow Inspection

**Date:** 2026-06-09  
**Scope:** End-to-end global search (command palette, `/search` page, edge functions, hooks, i18n, RTL)  
**Mode:** Read-only inspection — no source files modified

**Runtime context:** Frontend `http://localhost:5173`, backend `http://localhost:5001`, Supabase staging `zkrcjzdemdmwhearhfgg`. The frontend `apiGet` client targets **Supabase Edge Functions** (`VITE_SUPABASE_URL/functions/v1`), not Express. The Express `/api/search` router is commented out in `backend/src/api/index.ts`.

---

## 1. Workflow map

### Entry points

| Entry                | File                                                                                     | Behavior                                                                |
| -------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Header search button | `frontend/src/components/layout/header/Search.tsx`                                       | Opens command palette (Cmd/Ctrl+K)                                      |
| Sidebar search       | `frontend/src/components/layout/SidebarSearch.tsx`                                       | Enter → `/search?q=…`; collapsed icon → command palette                 |
| Command palette      | `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx`                          | Mounted from `frontend/src/routes/__root.tsx`; primary global search UI |
| Search results page  | `frontend/src/routes/_protected/search.tsx` → `frontend/src/pages/DossierSearchPage.tsx` | Full-page dossier-first search                                          |
| Advanced search      | `frontend/src/routes/_protected/advanced-search.tsx`                                     | **Redirects to `/dashboard`** — dead route                              |

### Data flow (two parallel paths)

```
Command palette / quick switcher
  CommandPalette.tsx
    → useQuickSwitcherSearch (frontend/src/domains/dossiers/hooks/useQuickSwitcherSearch.ts)
    → getQuickSwitcherSearch (frontend/src/domains/dossiers/repositories/dossiers.repository.ts:203-208)
    → GET /functions/v1/quickswitcher-search?q=&limit=
    → supabase/functions/quickswitcher-search/index.ts

Search page (/search)
  DossierSearchPage.tsx
    → useDossierFirstSearch (frontend/src/domains/dossiers/hooks/useDossierFirstSearch.ts)
    → getDossierFirstSearch (frontend/src/domains/dossiers/repositories/dossiers.repository.ts:133-155)
    → GET /functions/v1/search?q=&dossier_first=true&page=&page_size=&types=&status=&my_dossiers=
    → supabase/functions/search/index.ts
```

### Secondary / legacy paths (not main global search)

- **Dossier picker autocomplete:** `frontend/src/services/search-api.ts` → `search-suggest` edge function (`autocompleteDossiers`).
- **Entity linking search:** `frontend/src/hooks/useEntitySearch.ts` → Express `/api/entities/search` (intake linking, not global search).
- **Enhanced search UI:** `frontend/src/domains/search/` + `EnhancedSearchInput.tsx` — only reachable via redirected advanced-search route.

### Rendering

- Search page results: `frontend/src/components/search/DossierFirstSearchResults.tsx`
- Search page filters: `frontend/src/components/search/DossierSearchFilters.tsx`
- Types contract: `frontend/src/types/dossier-search.types.ts`

### i18n

- Search page namespace: `dossier-search` (`frontend/src/i18n/en|ar/dossier-search.json`) — keys appear complete in both locales.
- Command palette namespace: `quickswitcher` (`frontend/src/i18n/en|ar/quickswitcher.json`) — keys appear complete in both locales.

### RTL

Search UI components inspected (`DossierSearchPage.tsx`, `DossierSearchFilters.tsx`, `DossierFirstSearchResults.tsx`, `CommandPalette.tsx`, `SidebarSearch.tsx`) use logical properties (`ms-*`, `me-*`, `start-*`, `text-start`). **No physical `ml/mr/pl/pr` or `left/right` violations found** in `frontend/src/components/search/`.

---

## 2. Findings summary

| #   | Severity     | Area                   | One-line issue                                                                                                                            |
| --- | ------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | **CRITICAL** | `/search` page         | Frontend expects `DossierFirstSearchResponse`; edge returns `{ data, count, … }` — page always shows zero dossiers                        |
| F2  | **CRITICAL** | `/search` edge         | `dossier_first`, `related_work`, dossier stats, and grouped pagination are not implemented                                                |
| F3  | **HIGH**     | `/search` API          | `types` sent as JSON string; edge expects comma-separated values → 400 on type filter                                                     |
| F4  | **HIGH**     | `/search` API          | `page` / `page_size` ignored; edge uses `limit` / `offset` only                                                                           |
| F5  | **HIGH**     | `/search` UI           | Load-more increments page in query key but does not append results                                                                        |
| F6  | **HIGH**     | `/search` UI           | No error state — API failures look like “no results”                                                                                      |
| F7  | **CRITICAL** | Quick switcher         | Dossier query selects/filters `is_archived` — column does not exist on `dossiers`                                                         |
| F8  | **CRITICAL** | Quick switcher         | Positions query uses `summary_*`, `dossier_id`, and `dossiers:dossier_id` embed — schema mismatch                                         |
| F9  | **CRITICAL** | Quick switcher         | Tasks query uses `title_en`, `title_ar`, `deadline` — actual columns are `title`, `description`, `sla_deadline`                           |
| F10 | **CRITICAL** | Quick switcher         | Queries `commitments` with `title_en` / `deadline` — diplomatic commitments live in `aa_commitments` with `title`, `title_ar`, `due_date` |
| F11 | **HIGH**     | Quick switcher         | Sub-query errors swallowed (`if (!error && data)`) — failures become empty sections                                                       |
| F12 | **HIGH**     | Command palette        | Broken work-item URLs for commitments and intake                                                                                          |
| F13 | **HIGH**     | Search page            | Broken work-item URLs for tasks, commitments, intake, documents, MoUs                                                                     |
| F14 | **MEDIUM**   | `/search` API          | `my_dossiers=true` sent by repository; edge function never reads it                                                                       |
| F15 | **MEDIUM**   | `/search` edge         | `validTypes` lists `theme` instead of canonical `topic`                                                                                   |
| F16 | **MEDIUM**   | `/search` UI           | Type filter counts derived from current page slice, not server totals                                                                     |
| F17 | **MEDIUM**   | Command palette        | `isError` from hook never surfaced — errors look like empty search                                                                        |
| F18 | **HIGH**     | Search results UI      | `DossierCard` reads `dossier.stats.*` — absent from edge payload; will throw if F1 is fixed without adding stats                          |
| F19 | **LOW**      | Legacy `search-api.ts` | `searchDossiers` sends `query=`; edge expects `q=` (function unused in app)                                                               |
| F20 | **LOW**      | Dead code              | Express `searchRouter` commented out; `advanced-search` redirects; `quickswitcher_search_v2` RPC unused                                   |

---

## 3. Detailed findings

### F1 — CRITICAL: Dossier-first response shape mismatch (`/search` page always empty)

**Files:**

- `frontend/src/domains/dossiers/repositories/dossiers.repository.ts` lines 133–155
- `frontend/src/domains/dossiers/hooks/useDossierFirstSearch.ts` lines 172–177
- `supabase/functions/search/index.ts` lines 272–292

**Why it is a real bug:**  
`getDossierFirstSearch` types the response as `DossierFirstSearchResponse` (`dossiers`, `related_work`, `dossiers_total`, etc.). The edge function returns `{ data: results, count, limit, offset, query, took_ms, metadata }` and never populates `dossiers`. The hook maps `searchQuery.data?.dossiers || []`, so a successful HTTP 200 with matches in `data` still renders **zero results** on `/search`. This is not surfaced as an error.

**Recommended fix:**  
Either (a) extend `supabase/functions/search/index.ts` to honor `dossier_first=true` and return the full `DossierFirstSearchResponse` shape (including `related_work`, stats, pagination flags), or (b) add a response adapter in `getDossierFirstSearch` that maps `data` → `dossiers` and computes totals from `count`/`metadata.has_more` until the edge function is fully implemented. Prefer (a) for related-work and stats.

---

### F2 — CRITICAL: `dossier_first` mode not implemented on edge

**Files:**

- `frontend/src/domains/dossiers/repositories/dossiers.repository.ts` line 143
- `supabase/functions/search/index.ts` (entire handler — no `dossier_first` branch)
- `frontend/src/types/dossier-search.types.ts` lines 114–137

**Why it is a real bug:**  
The search page product spec (two sections: DOSSIERS + RELATED WORK, dossier stats on cards, separate work pagination) depends on `dossier_first=true`. The edge function only runs a flat `dossiers` FTS query. `related_work`, `related_work_total`, `has_more_work`, and per-dossier `stats` are never produced, so **Section 2 and stat chips cannot work** regardless of F1 mapping.

**Recommended fix:**  
Implement dossier-first mode in the edge function (or a dedicated function/RPC such as an extended `quickswitcher_search_v2`) that: (1) FTS-searches dossiers, (2) joins/fetches related work via `work_item_dossiers`, `position_dossier_links`, etc., (3) aggregates `DossierStats`, (4) returns the typed response.

---

### F3 — HIGH: Type filter encoding mismatch (filtered search returns 400)

**Files:**

- `frontend/src/domains/dossiers/repositories/dossiers.repository.ts` lines 145–146
- `supabase/functions/search/index.ts` lines 96–109

**Why it is a real bug:**  
When the user picks a dossier type, the repository sets `types` to `JSON.stringify(['country'])` (e.g. `types=["country"]`). The edge parses with `typesParam.split(',')`, yielding `['["country"]']`, which fails `validTypes.includes(t)` and returns **400 Invalid dossier types**. Any filtered search on `/search` fails while “All Types” may appear to work (no `types` param).

**Recommended fix:**  
Send comma-separated types: `params.set('types', filters.types.join(','))`. Align validation with DB types (`topic`, not `theme` — see F15).

---

### F4 — HIGH: Pagination parameters ignored

**Files:**

- `frontend/src/domains/dossiers/repositories/dossiers.repository.ts` lines 141–142
- `supabase/functions/search/index.ts` lines 40–41, 177–178

**Why it is a real bug:**  
The repository sends `page` and `page_size`. The edge only reads `limit` and `offset` (defaults 50 and 0). Page changes from the hook never affect the query, so pagination UI is non-functional even after F1 is fixed.

**Recommended fix:**  
Map `page`/`page_size` to `offset = (page-1)*page_size` and `limit = page_size` in either the repository or the edge function.

---

### F5 — HIGH: Load-more replaces results instead of appending

**Files:**

- `frontend/src/domains/dossiers/hooks/useDossierFirstSearch.ts` lines 71–72, 116–127, 172–173

**Why it is a real bug:**  
`loadMoreDossiers` increments `dossierPage` in the React Query key, but the hook returns `searchQuery.data?.dossiers` directly with no merge. TanStack Query replaces the cached page data, so “Load more” shows **only the latest page**, not an accumulated list. `workPage` is tracked but never passed to `getDossierFirstSearch`.

**Recommended fix:**  
Use `useInfiniteQuery` with `getNextPageParam`, or manually concatenate prior pages in the hook before returning `dossiers` / `relatedWork`. Pass `workPage` (or separate endpoints) when implementing work-item pagination.

---

### F6 — HIGH: Search page hides API errors

**Files:**

- `frontend/src/domains/dossiers/hooks/useDossierFirstSearch.ts` lines 187–188 (exposes `isError`)
- `frontend/src/pages/DossierSearchPage.tsx` lines 241–273 (never uses `isError` / `error`)
- `frontend/src/components/search/DossierFirstSearchResults.tsx` lines 544–552

**Why it is a real bug:**  
On 400/500 responses, `apiGet` throws, `isError` is true, but the page still passes empty arrays to results and shows the **“No results found”** empty state (F3 filter errors included). Users cannot distinguish failure from a genuine empty index.

**Recommended fix:**  
Destructure `isError` and `error` in `DossierSearchPage` and render a dedicated error panel (reuse i18n keys or add `empty.error` / `error.title` to `dossier-search.json`).

---

### F7 — CRITICAL: Quick switcher dossier query uses nonexistent `is_archived`

**Files:**

- `supabase/functions/quickswitcher-search/index.ts` lines 217–233
- `frontend/src/types/database.types.ts` lines 9388–9416 (`dossiers.Row` has `status`, no `is_archived`)

**Why it is a real bug:**  
The select list includes `is_archived` and `.eq('is_archived', false)`. PostgREST returns an error for unknown columns. The handler uses `if (!dossierError && dossiers)`, so **command-palette dossier search silently returns no dossiers** for every query.

**Recommended fix:**  
Remove `is_archived` from select/filter. Use `status` (e.g. `.neq('status', 'deleted')` or `.in('status', ['active','inactive'])`) and map archived via `status === 'archived'`.

---

### F8 — CRITICAL: Positions query schema mismatch

**Files:**

- `supabase/functions/quickswitcher-search/index.ts` lines 283–306
- `frontend/src/types/database.types.ts` lines 21683–21715, 21258–21276

**Why it is a real bug:**  
The query selects `summary_en`, `summary_ar`, and `dossier_id` and embeds `dossiers:dossier_id`. The `positions` table has `content_en`/`content_ar` and `rationale_en`/`rationale_ar`, **no `dossier_id`**, and links to dossiers through `position_dossier_links`. This query fails at PostgREST; errors are swallowed, so **positions never appear** in quick switcher results.

**Recommended fix:**  
Select `title_en`, `title_ar`, `content_en`, `content_ar`, `status`, `updated_at`. Join dossier context via `position_dossier_links` → `dossiers`, or use `quickswitcher_search_v2` if it already encapsulates this.

---

### F9 — CRITICAL: Tasks query column mismatch

**Files:**

- `supabase/functions/quickswitcher-search/index.ts` lines 345–363
- `frontend/src/types/database.types.ts` lines 25876–25910

**Why it is a real bug:**  
The query selects `title_en`, `title_ar`, `description_en`, `description_ar`, `deadline`. The `tasks` table has a single `title`, `description`, and `sla_deadline`. The query fails; swallowed error → **no tasks in command palette**.

**Recommended fix:**  
Select `title`, `description`, `sla_deadline`, `status`, `priority`, `workflow_stage`, `updated_at`. Map `title` into both `title_en` and `title_ar` in the response mapper (or add bilingual columns only if they exist). Filter cancelled/done via `workflow_stage` or `status` per DB enums.

---

### F10 — CRITICAL: Commitments query uses wrong table and columns

**Files:**

- `supabase/functions/quickswitcher-search/index.ts` lines 395–420
- `frontend/src/types/database.types.ts` lines 187–215 (`aa_commitments`), 5364–5383 (`commitments` — different domain entity)

**Why it is a real bug:**  
The handler queries `commitments` with `title_en`, `title_ar`, `deadline`, `dossier_id`. Diplomatic after-action commitments shown in My Work use **`aa_commitments`** (`title`, `title_ar`, `due_date`, `dossier_id`). The `commitments` table is a separate tenant-scoped entity with `title` only. Query fails or searches the wrong dataset; errors swallowed → **no commitments in palette**.

**Recommended fix:**  
Query `aa_commitments` with correct column names. Map `due_date` → `deadline` in the API response for frontend compatibility.

---

### F11 — HIGH: Quick switcher swallows database errors

**Files:**

- `supabase/functions/quickswitcher-search/index.ts` lines 237, 308, 365, 422 (pattern `if (!error && data)`)

**Why it is a real bug:**  
Schema mismatches (F7–F10) produce PostgREST errors that are discarded. The function returns HTTP 200 with empty `dossiers` / `related_work`, so the UI and monitors cannot detect broken queries.

**Recommended fix:**  
Log errors server-side; aggregate partial failures into a `warnings` array; return 500 if all sub-queries fail; optionally surface per-section errors to the client.

---

### F12 — HIGH: Command palette work-item navigation URLs incorrect

**Files:**

- `frontend/src/domains/dossiers/hooks/useQuickSwitcherSearch.ts` lines 87–103
- `frontend/src/routes/_protected/commitments.tsx` lines 41–42 (`id` search param, no `/$id` route)
- `frontend/src/routes/_protected/intake/tickets.$id.tsx` (path `/intake/tickets/$id`)
- `frontend/src/pages/my-work/components/WorkItemCard.tsx` lines 126–134 (canonical URLs)

**Why it is a real bug:**  
`getWorkItemUrl` returns `/commitments/${id}` but commitments open via `/commitments?id=`. It returns `/intake/${id}` but the ticket route is `/intake/tickets/$id`. Tasks use `/tasks/${id}` which is correct. If F7–F10 are fixed, clicking commitment/intake hits **404 or wrong page**.

**Recommended fix:**  
Align with `WorkItemCard.getItemLink()`: `/commitments?id=`, `/intake/tickets/${id}`, `/tasks/${id}`, `/positions/${id}`.

---

### F13 — HIGH: Search page work-item navigation URLs incorrect

**Files:**

- `frontend/src/pages/DossierSearchPage.tsx` lines 130–153
- `frontend/src/routes/_protected/my-work/index.tsx` lines 25–33 (no `taskId` / `commitmentId` search params)

**Why it is a real bug:**  
Tasks navigate to `/my-work?taskId=` — My Work schema has no `taskId` param (drawer not opened). Commitments use `commitmentId` but `useCommitmentDrawer` expects `commitment`. Intake uses `/intake/${id}` (wrong). `document` → `/documents/${id}` (no route). `mou` → `/mous/${id}` (only list route `/mous` exists).

**Recommended fix:**  
Mirror working patterns: `/tasks/${id}`, `/commitments?id=${id}`, `/intake/tickets/${id}`, `/positions/${id}`, `/engagements/${id}`. Add document/MoU detail routes or navigate to parent dossier context until routes exist.

---

### F14 — MEDIUM: `my_dossiers` filter not implemented

**Files:**

- `frontend/src/domains/dossiers/repositories/dossiers.repository.ts` lines 151–152
- `supabase/functions/search/index.ts` (no `my_dossiers` handling)
- `frontend/src/components/search/DossierSearchFilters.tsx` (toggle exposed in UI)

**Why it is a real bug:**  
Users enabling “My Dossiers” send `my_dossiers=true` but the edge function ignores it, so results are **not scoped** to the user’s dossiers despite the filter appearing active.

**Recommended fix:**  
Filter by dossier membership/RLS view or join `dossier_members` / equivalent access table when `my_dossiers=true`.

---

### F15 — MEDIUM: Edge valid type `theme` vs DB `topic`

**Files:**

- `supabase/functions/search/index.ts` lines 97, 10 (comment)
- `supabase/migrations/20260202100000_fix_theme_to_topic_naming.sql`
- `frontend/src/lib/dossier-type-guards.ts` lines 33–40

**Why it is a real bug:**  
`validTypes` includes `theme` but dossier rows use `type = 'topic'`. Clients sending `types=topic` pass validation, but documentation and any client sending `theme` get 400 or zero rows. The frontend correctly uses `topic`; the edge contract is stale.

**Recommended fix:**  
Replace `theme` with `topic` in `validTypes` and API docs.

---

### F16 — MEDIUM: Misleading type filter counts

**Files:**

- `frontend/src/domains/dossiers/hooks/useDossierFirstSearch.ts` lines 94–114
- `frontend/src/components/search/DossierSearchFilters.tsx` (consumes `typeCounts`)

**Why it is a real bug:**  
`typeCounts.all` uses `dossiers_total` (undefined today), and per-type counts are computed by iterating the **current page** of dossiers only. Filter badges show page-local counts, not global facet totals.

**Recommended fix:**  
Return facet counts from the API (`GROUP BY type`) or compute from `count` + type breakdown in the edge response.

---

### F17 — MEDIUM: Command palette does not show search errors

**Files:**

- `frontend/src/domains/dossiers/hooks/useQuickSwitcherSearch.ts` lines 270–274
- `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx` lines 437–447, 982–989

**Why it is a real bug:**  
The hook exposes `isError` but `CommandPalette` only destructures `isLoading`. On edge failure, users see `CommandEmpty` / “No results” instead of an error state.

**Recommended fix:**  
When `isError`, render an error group with retry; do not use `CommandEmpty` alone for failures.

---

### F18 — HIGH: Dossier result cards require `stats` not returned by API

**Files:**

- `frontend/src/components/search/DossierFirstSearchResults.tsx` lines 301–328
- `frontend/src/types/dossier-search.types.ts` lines 31–44
- `supabase/functions/search/index.ts` lines 240–254 (no `stats`)

**Why it is a real bug:**  
`DossierCard` unconditionally accesses `dossier.stats.total_engagements` (and siblings). Edge results omit `stats`. Fixing F1 by mapping `data` → `dossiers` without adding `stats` will cause **runtime TypeError** when rendering cards.

**Recommended fix:**  
Either populate `stats` in the edge dossier-first implementation or guard in UI: `dossier.stats?.total_engagements` with default empty stats object.

---

### F19 — LOW: Legacy `searchDossiers` uses wrong query parameter

**Files:**

- `frontend/src/services/search-api.ts` lines 180–185
- `supabase/functions/search/index.ts` line 36 (`q` required)

**Why it is a real bug:**  
`searchDossiers` appends `query=` instead of `q=`. Grep shows **no callers** in the frontend except the definition itself, so production impact is low, but the function is incorrect if reused.

**Recommended fix:**  
Rename param to `q` or delete unused export.

---

### F20 — LOW: Dead / duplicate search code paths

**Files:**

- `backend/src/api/index.ts` lines 10, 64 (commented `searchRouter`)
- `frontend/src/routes/_protected/advanced-search.tsx` lines 3–6
- `frontend/src/types/database.types.ts` lines 35836–35838 (`quickswitcher_search_v2` RPC)
- `frontend/src/hooks/useDossierFirstSearch.ts`, `useQuickSwitcherSearch.ts` (re-export shims)

**Why it matters:**  
Maintainers may implement search on Express or the RPC while production uses broken edge handlers. Advanced search UI is unreachable.

**Recommended fix:**  
Document canonical path (edge functions); remove or wire redirects; adopt `quickswitcher_search_v2` if it matches schema, or drop the RPC from types if unused.

---

## 4. What works today (verified)

- **Debounce:** 300ms in both `useDossierFirstSearch` and `useQuickSwitcherSearch`; command palette uses 200ms override.
- **Keyboard navigation:** Command palette uses `cmdk` (`CommandDialog`, arrow keys, Enter, Escape) — standard pattern in `CommandPalette.tsx`.
- **Dossier navigation from dossier rows:** `getDossierRouteSegment` used in `DossierSearchPage.tsx` and `DossierFirstSearchResults.tsx` for dossier clicks.
- **i18n:** `dossier-search` and `quickswitcher` Arabic bundles mirror English keys used in code.
- **RTL:** Logical properties used in search components; no `ml/mr/pl/pr` issues found in search UI folder.
- **Autocomplete for dossier picker:** `autocompleteDossiers` correctly uses `q` and `search-suggest` edge function.

---

## 5. Suggested fix order

1. **Unblock command palette:** F7–F11 (quickswitcher schema fixes + error visibility).
2. **Unblock `/search` page:** F1–F4 + F18 (response contract, dossier-first implementation, pagination params).
3. **UX correctness:** F5–F6, F12–F13 (load-more, errors, navigation).
4. **Filters:** F14–F16 (`my_dossiers`, facets, `topic` naming).
5. **Cleanup:** F19–F20.

---

## 6. Verification notes

- Schema claims verified against `frontend/src/types/database.types.ts` (`dossiers`, `positions`, `tasks`, `aa_commitments`, `commitments`).
- Route claims verified against `frontend/src/routes/_protected/` file tree and `WorkItemCard.tsx` / `useCommitmentDrawer.ts`.
- No browser or live API calls were made in this inspection; behavior inferred from code paths and PostgREST column requirements.
