# Topic Dossier Workflow Inspection

**Date:** 2026-06-09  
**Scope:** Topics list → `DossierShell` (type `topic`) → tabs (overview, positions, engagements, docs, tasks, timeline) → overview cards → `position_dossier_links` → `DossierGlyph` → activity timeline  
**Mode:** Read-only code inspection (no source edits)

---

## Workflow trace (as implemented)

| Step             | Entry                                                                              | Data / UI                                                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| List             | `frontend/src/routes/_protected/dossiers/topics/index.tsx` → `-TopicsListPage.tsx` | `useTopics` → `useDossiersByType('topic')` → `dossiers-list` edge function                                                  |
| Detail shell     | `frontend/src/routes/_protected/dossiers/topics/$id.tsx`                           | `DossierShell` + `DossierTabNav`; bare `/topics/$id` redirects to `overview`                                                |
| Tabs             | Nested routes under `$id/`                                                         | `overview`, `positions`, `engagements`, `docs`, `tasks`, `timeline`, `audit`                                                |
| Overview         | `TopicOverviewTab.tsx`                                                             | `SharedSummaryStatsCard`, `DossierAnalyticsCard`, `ConnectedAnchorsCard`, `PositionTrackerCard`, `SharedRecentActivityCard` |
| Positions        | `DossierPositionsTab`                                                              | `useDossierPositionLinks` → PostgREST on `position_dossier_links` + `positions` embed                                       |
| Timeline         | `DossierActivityTimeline`                                                          | `useDossierActivityTimeline` → `dossier-activity-timeline` edge function → view `dossier_activity_timeline`                 |
| Legacy (unwired) | `TopicDossierPage` / `TopicDossierDetail`                                          | Not referenced by any route                                                                                                 |

---

## Findings

### 1. CRITICAL — Attach-position action is a no-op on the Positions tab

**Location:** `frontend/src/components/positions/DossierPositionsTab.tsx` lines 179–187

**Why it is a real bug:** `AttachPositionDialog` does not persist links itself; it calls `onAttach(selectedIds)` and expects the parent to create `position_dossier_links` rows (the working pattern lives in `PositionDossierLinker` via `useCreatePositionDossierLink`). On the topic Positions tab, `onAttach` ignores `positionIds` and only closes the dialog. Users cannot attach positions to a topic dossier from this tab despite the primary CTA.

**Recommended fix:** Implement `onAttach` with `useCreatePositionDossierLink` (or a bulk variant) for `dossierId`, then `refetch()` / invalidate `['dossier-position-links', dossierId]`. Mirror the mutation pattern in `frontend/src/components/positions/PositionDossierLinker.tsx` lines 37–45.

---

### 2. HIGH — Topics list search is wired in the UI but dropped in the hook

**Location:** `frontend/src/hooks/useTopics.ts` lines 23–34; consumer `frontend/src/routes/_protected/dossiers/topics/-TopicsListPage.tsx` line 34

**Why it is a real bug:** `-TopicsListPage` reads `search` from the URL and passes `{ page, limit: 20, search }` into `useTopics`, but `useTopics` only forwards `page` and `limit` to `useDossiersByType`. The `dossiers-list` function supports `search` (full-text on `search_vector`), so the toolbar search never affects results. Forums list works because `useForums` applies `search` in its query function (`frontend/src/hooks/useForums.ts` lines 28–42).

**Recommended fix:** Destructure `search` from params and call `useDossiersByType('topic', page, limit, search)`.

---

### 3. HIGH — Position status filter values do not match the `positions.status` CHECK constraint

**Location:** `frontend/src/components/positions/DossierPositionsTab.tsx` lines 129–134; DB `supabase/migrations/20250101003_create_positions.sql` line 22

**Why it is a real bug:** The status `<Select>` offers `review` and `archived`, but `positions.status` is constrained to `draft`, `under_review`, `approved`, `published` (later migrations add `unpublished`, not `archived`). `useDossierPositionLinks` filters with strict equality (`link.position?.status === filters.status`), so choosing “Under Review” (`review`) never matches rows stored as `under_review`, and “archived” can never match any row.

**Recommended fix:** Change filter values to `under_review` and `unpublished` (or whatever the live enum is), and use i18n keys `positions:status.under_review` / `positions:status.unpublished` (already present in `positions.json`).

---

### 4. HIGH — Documents fetch uses an invalid PostgREST embed for linked positions

**Location:** `frontend/src/services/dossier-overview.service.ts` lines 469–476; duplicate constant `frontend/src/lib/query-columns.ts` lines 185–187

**Why it is a real bug:** The select embed is `position:position_id(...)`, treating `position_id` as a related table. PostgREST expects the related table name with an optional FK hint, e.g. `positions!position_id(...)` or the working pattern already used in `useDossierPositionLinks`: `position:positions (...)`. The query does not read `error`, so a 400 embed failure yields an empty positions list with no surfaced error. This breaks the **Docs** tab (`DossierDocumentsTab` → `fetchDossierOverview` → `fetchDocuments`) for topic dossiers and all other types.

**Recommended fix:** Align with `useDossierPositionLinks.ts` line 134: `position:positions (id, title_en, title_ar, status, created_at, updated_at)`. Destructure and log `error`; update `POSITION_DOSSIER_LINKS_COLUMNS.WITH_POSITION` similarly.

---

### 5. MEDIUM — Position Tracker “View / Add Positions” links use obsolete tab search params

**Location:** `frontend/src/pages/dossiers/overview-cards/PositionTrackerCard.tsx` lines 70–78 and 140–148

**Why it is a real bug:** Links navigate to `/dossiers/topics/$id` with `search={{ tab: 'positions' }}`, but topic tabs are path-based (`/dossiers/topics/$id/positions`) and `$id/index` always redirects to `overview` with no `tab` search handling. Users land on Overview, not Positions.

**Recommended fix:** Use `to="/dossiers/topics/$id/positions"` with `params={{ id: dossierId }}` (same pattern as `DossierTabNav`).

---

### 6. MEDIUM — Topic overview i18n keys missing from `dossier` bundles (Arabic shows English fallbacks)

**Location:**

- `frontend/src/pages/dossiers/overview-cards/PositionTrackerCard.tsx` — keys `overview.positions.*`
- `frontend/src/pages/dossiers/overview-cards/ConnectedAnchorsCard.tsx` — keys `overview.anchors.*`
- Bundles: `frontend/src/i18n/en/dossier.json` and `frontend/src/i18n/ar/dossier.json` (`overview` section ends ~line 1066 with no `positions` or `anchors` objects)

**Why it is a real bug:** Components rely on `defaultValue` English strings. In Arabic (`i18n.language === 'ar'`), i18next returns those English defaults for missing keys, so the Position Tracker and Connected Anchors cards render English copy in an Arabic session.

**Recommended fix:** Add mirrored `overview.positions` and `overview.anchors` objects to both `en/dossier.json` and `ar/dossier.json` (titles, empty states, CTA labels).

---

### 7. MEDIUM — Position Tracker never shows position summaries (wrong field names)

**Location:** `frontend/src/pages/dossiers/overview-cards/PositionTrackerCard.tsx` lines 100–104 and 127–131; `frontend/src/types/position.ts` (no `summary_en` / `summary_ar`)

**Why it is a real bug:** The card gates body text on `pos.summary_en` / `pos.summary_ar`, but `Position` and the `positions` table expose `content_en` / `content_ar` (selected in `useDossierPositionLinks`). Titles can appear, but summary snippets never render.

**Recommended fix:** Use `content_en` / `content_ar` (truncated), or map a short excerpt from `content_*` in the hook.

---

### 8. MEDIUM — Link-type filter labels hardcoded in English on Positions tab

**Location:** `frontend/src/components/positions/DossierPositionsTab.tsx` lines 106–114

**Why it is a real bug:** “All Link Types”, “Primary”, “Related”, “Reference” are literal strings with no `t()` calls, while adjacent status filters use `positions` namespace keys. Arabic users see English filter chrome on a core topic workflow tab.

**Recommended fix:** Add keys under `positions:dossier_tab.link_type_*` in `en/ar/positions.json` and translate the select items.

---

### 9. LOW — Topics list omits `DossierGlyph` (visual identity inconsistency)

**Location:** `frontend/src/routes/_protected/dossiers/topics/-TopicsListPage.tsx` line 79 vs `frontend/src/routes/_protected/dossiers/forums/index.tsx` line 84

**Why it is a real bug:** Forums list uses `<DossierGlyph type="forum" />` per the Phase 37 glyph spec; topics use a generic `BookOpen` Lucide icon. `DossierGlyph` correctly maps `topic` → `◆` (`frontend/src/components/signature-visuals/DossierGlyph.tsx` line 34). Not a data bug, but topic rows do not match the dossier glyph system used elsewhere.

**Recommended fix:** Replace `BookOpen` with `<DossierGlyph type="topic" name={primary} size={20} />`.

---

### 10. LOW — `page` search param has no effect on topics list API

**Location:** `frontend/src/hooks/useTopics.ts` + `supabase/functions/dossiers-list/index.ts` (cursor/limit only, no `page`); `-TopicsListPage.tsx` validates `page` but provides no pagination UI

**Why it is a real bug:** `listDossiers` forwards `page` in the query string, but the edge function never reads it—only `cursor` and `limit`. Changing `?page=2` in the URL does not change results. Impact is limited today because there is no pagination control, but the URL contract is misleading.

**Recommended fix:** Either implement offset/cursor pagination in the list page (as forums might need later) or remove unused `page` from topic list search until supported.

---

### 11. LOW — Dead code: legacy topic detail page stack

**Location:** `frontend/src/pages/dossiers/TopicDossierPage.tsx`, `frontend/src/components/dossier/TopicDossierDetail.tsx` (grep shows no imports outside these files)

**Why it matters:** The live workflow uses `DossierShell` + tab routes. The legacy detail component (subtopics via `useTopicSubtopics`, policy sections) is unreachable, increasing maintenance risk.

**Recommended fix:** Delete or re-home useful sections into `TopicOverviewTab` / routes; drop unused hooks if subtopics are not product-required.

---

### 12. LOW — `topics` edge function subtopics route parsing is incorrect for Supabase URL shape

**Location:** `supabase/functions/topics/index.ts` lines 83–87

**Why it is a real bug (latent):** Path parsing assumes `/topics/:id/subtopics` (`pathParts[1]` = id), but invoked URLs are `/functions/v1/topics/:id/subtopics`, so `pathParts[1]` is `v1` and `pathParts[2]` is `topics`—the subtopics branch never runs. Currently low impact because only dead `TopicDossierDetail` calls `GET /topics/:id/subtopics` via `topics.repository.ts`.

**Recommended fix:** Parse with `pathParts.indexOf('topics')` (same pattern as `engagement-briefs` function) before routing.

---

## Areas verified without defects (within scope)

- **Tab routing:** All six required tabs have dedicated route files under `topics/$id/`; `DossierTabNav` builds paths from `getDossierRouteSegment('topic')` → `topics`.
- **`DossierGlyph` for `topic`:** Symbol `◆` (`\u25C6`) is implemented and covered by `DossierGlyph.symbols.test.tsx`.
- **Activity timeline contract:** `useDossierActivityTimeline` paginates on `next_cursor`; edge function returns `activities`, `next_cursor`, `total_count` consistent with the hook. `ActivityTimelineItem` uses `activity_title_ar` when RTL.
- **Core i18n namespaces:** `topics.json` (en/ar) and `dossier-shell.json` `tabs.positions` are present in both locales.
- **`useDossierPositionLinks` embed:** Uses valid `position:positions (...)` column list matching `positions` table columns in `database.types.ts`.
- **`DossierAnalyticsCard` for topic:** `useAnalyticsForDossier` has a `topic` branch; `analytics.connectedAnchors` / `analytics.openWorkItems` exist in en/ar `dossier.json`.

---

## Suggested fix priority

1. **CRITICAL / HIGH:** Attach flow (#1), list search (#2), status filter (#3), documents embed (#4).
2. **MEDIUM:** Overview links (#5), i18n (#6), summary fields (#7), filter i18n (#8).
3. **LOW:** Glyph parity (#9), pagination (#10), dead code (#11), edge function routing (#12).

---

_End of report._
