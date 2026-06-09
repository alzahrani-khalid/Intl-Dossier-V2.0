# Positions + Approval Chain Workflow Inspection

**Date:** 2026-06-09  
**Scope:** Positions library → create/edit/detail routes → `ApprovalChain` → approval actions → `position_dossier_links` → briefing packs → analytics/suggestions → related edge functions and hooks  
**Mode:** Read-only code inspection (no source edits)  
**Stack verified against:** `frontend/`, `supabase/functions/`, `supabase/migrations/` (local migrations; staging may differ on `unpublished` status)

---

## Workflow trace (as implemented)

| Step                     | Entry                                                                                                                | Data / UI                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Library                  | `frontend/src/routes/_protected/positions.tsx`                                                                       | `usePositions` → `positions-list` edge function                                          |
| Editor (primary)         | `frontend/src/routes/_protected/positions/$id.tsx`                                                                   | `usePosition` → `positions-get`; `PositionEditor`, `ApprovalChain`, `AttachmentUploader` |
| Detail (alternate)       | `frontend/src/routes/_protected/positions/$positionId.tsx`                                                           | Same `positions-get`; `PositionAnalyticsCard`, hardcoded dossier link                    |
| Approvals sub-route      | `frontend/src/routes/_protected/positions/$id/approvals.tsx`                                                         | Raw fetch to `positions-get` (wrong query param)                                         |
| Admin reassignment       | `frontend/src/routes/_protected/admin/approvals.tsx`                                                                 | `positions-list?status=under_review`; `approvals-reassign` (stub)                        |
| Dossier linking (editor) | `PositionDossierLinker` in `PositionEditor`                                                                          | `usePositionDossierLinks` / `useCreatePositionDossierLink` → `positions-dossiers-*`      |
| Dossier tab              | `DossierPositionsTab`                                                                                                | Direct PostgREST on `position_dossier_links` (correct columns)                           |
| Engagement section       | `EngagementPositionsSection`                                                                                         | Attached positions + `PositionSuggestionsPanel` + `BriefingPackGenerator`                |
| Analytics                | `PositionAnalyticsCard`                                                                                              | `usePositionAnalytics` → broken repository URL                                           |
| Suggestions              | `PositionSuggestionsPanel`                                                                                           | `usePositionSuggestions` → broken repository URL                                         |
| Briefing packs           | `BriefingPackGenerator`                                                                                              | `briefings.repository` → broken repository URLs                                          |
| Approval actions (edge)  | `positions-approve`, `positions-delegate`, `positions-request-revisions`, `positions-publish`, `positions-unpublish` | **No frontend callers found**                                                            |

**API client pattern:** `frontend/src/lib/api-client.ts` resolves paths to `VITE_SUPABASE_URL + '/functions/v1' + path`. The first path segment must be the deployed function name (e.g. `positions-get`), not a REST resource path.

---

## Findings

### 1. CRITICAL — `submitPosition` sends empty body; edge requires `position_id` in JSON

**Location:** `frontend/src/domains/positions/repositories/positions.repository.ts` lines 93–95; `supabase/functions/positions-submit/index.ts` lines 11–17

**Why it is a real bug:** The repository calls `apiPut('/positions-submit?id=${id}', {})` with an empty JSON body. The edge function parses `const { position_id } = await req.json()` and returns 400 when `position_id` is missing. The query-string `id` is never read. Submit-for-review from `$id.tsx` (`handleSubmit` → `useSubmitPosition`) therefore always fails at runtime.

**Recommended fix:** Send `{ position_id: id }` in the PUT body (drop the unused query param), or teach the edge function to accept `position_id` from query params. Align with other position mutations.

---

### 2. CRITICAL — `updatePosition` omits required `position_id` in request body

**Location:** `frontend/src/domains/positions/repositories/positions.repository.ts` lines 82–84; `frontend/src/routes/_protected/positions/$id.tsx` lines 63–70; `supabase/functions/positions-update/index.ts` lines 34–44, 86–91

**Why it is a real bug:** `updatePosition` PUTs only the spread `data` object to `/positions-update?id=${id}`. The edge function requires `body.position_id` and `body.version` in JSON and uses `body.position_id` for the DB lookup—not the query string. `handleSave` includes `version` in `data` but never `position_id`, so every save returns 400 (`position_id is required`).

**Recommended fix:** Change the repository to `apiPut('/positions-update', { position_id: id, version: data.version, ...fields })` or equivalent. Remove the misleading `?id=` query param.

---

### 3. CRITICAL — Approvals sub-route fetches position with wrong query parameter

**Location:** `frontend/src/routes/_protected/positions/$id/approvals.tsx` lines 37–38; `supabase/functions/positions-get/index.ts` lines 23–33

**Why it is a real bug:** `fetchApprovals` calls `positions-get?id=${positionId}`. The edge function reads `url.searchParams.get('position_id')` and returns 400 when absent. The approvals tracking page never loads position data.

**Recommended fix:** Use `positions-get?position_id=${positionId}` (same as `getPosition` in the repository at line 61).

---

### 4. CRITICAL — Repository uses non-existent Supabase function paths for analytics, suggestions, top positions, and briefing packs

**Location:**

- `frontend/src/domains/positions/repositories/positions.repository.ts` lines 108–110, 121, 129–131
- `frontend/src/domains/briefings/repositories/briefings.repository.ts` lines 14–16, 22–26

**Why it is a real bug:** The api client calls paths like `/positions/${id}/analytics`, `/engagements/${id}/positions/suggestions`, `/positions/analytics/top`, `/engagements/${id}/briefing-packs`, and `/briefing-packs/jobs/${jobId}/status`. Supabase exposes flat function names (`position-analytics-get`, `position-suggestions-get`, `position-analytics-top`, `briefing-packs-generate`, `briefing-pack-job-status`). These requests hit non-existent routes (404) before any business logic runs. `PositionAnalyticsCard`, `PositionSuggestionsPanel`, `BriefingPackGenerator`, and library analytics features are non-functional.

**Recommended fix:** Point each repository method at the correct function name with query/body params, e.g. `position-analytics-get?position_id=…`, `position-suggestions-get?engagement_id=…` (after fixing edge parsers—see finding 5). Mirror the working pattern used by `getPosition` (`/positions-get?position_id=`).

---

### 5. CRITICAL — Analytics and suggestions edge functions parse REST-style paths that never exist on Supabase

**Location:**

- `supabase/functions/position-analytics-get/index.ts` lines 12–22
- `supabase/functions/position-suggestions-get/index.ts` lines 61–71
- `supabase/functions/briefing-packs-generate/index.ts` lines 52–62
- `supabase/functions/briefing-pack-job-status/index.ts` lines 42–52

**Why it is a real bug:** Each function extracts IDs from `url.pathname` segments after `positions`, `engagements`, or `jobs`. Invoked as `/functions/v1/position-analytics-get`, the pathname is `/functions/v1/position-analytics-get`—there is no `positions/{id}` segment, so `positionId` / `engagementId` / `jobId` resolve to `undefined` and the handler returns 400. Even after fixing repository URLs (finding 4), the edges must accept `position_id`, `engagement_id`, and `job_id` query parameters (or JSON body).

**Recommended fix:** Add query-param parsing with path parsing as fallback, e.g. `url.searchParams.get('position_id') ?? pathParts[…]`.

---

### 6. CRITICAL — `position-analytics-get` selects nonexistent `title` column on `positions`

**Location:** `supabase/functions/position-analytics-get/index.ts` lines 44–48

**Why it is a real bug:** The existence check uses `.select('id, title')`. The `positions` table has `title_en` / `title_ar` (see `20250101003_create_positions.sql`), not `title`. PostgREST returns an error for the bad column; the function responds 404/500 and analytics never load even if the URL issue were fixed.

**Recommended fix:** Select `id, title_en, title_ar` or `id` only.

---

### 7. CRITICAL — `position-suggestions-get` keyword fallback queries invalid `positions` columns

**Location:** `supabase/functions/position-suggestions-get/index.ts` lines 173–178

**Why it is a real bug:** The fallback query selects `title`, `type`, filters `.eq('dossier_id', engagement.dossier_id)`, and searches `content`. Real columns are `title_en`/`title_ar`, `position_type_id`, `content_en`/`content_ar`; `positions` has no `dossier_id` (links go through `position_dossier_links`). When the AI path fails and the circuit breaker opens, fallback always errors or returns empty—suggestions silently degrade.

**Recommended fix:** Join `position_dossier_links` on `engagement.dossier_id`, select bilingual title/content columns, map `position_type_id` for display.

---

### 8. HIGH — No frontend integration for approve / delegate / request-revisions / publish

**Location:** Grep across `frontend/` shows zero references to `positions-approve`, `positions-delegate`, or `positions-request-revisions`. Publish button at `frontend/src/routes/_protected/positions/$id.tsx` lines 115–119 has no `onClick` handler.

**Why it is a real bug:** Edge functions exist for the approval lifecycle, but the UI never calls them. Approvers cannot approve, reject, delegate, or request changes from the app. Approved positions cannot be published from the editor despite the visible Publish button.

**Recommended fix:** Add repository methods + hooks for each edge function; wire `ApprovalChain` or a sibling action bar with role-gated buttons and step-up verification when required. Connect Publish to `positions-publish`.

---

### 9. HIGH — Main editor passes empty approval history to `ApprovalChain`

**Location:** `frontend/src/routes/_protected/positions/$id.tsx` lines 227–234, 243–250; `supabase/functions/positions-get/index.ts` lines 95–103

**Why it is a real bug:** Both editor sidebar and Approvals tab pass `approvals={[]}`. `positions-get` returns the position row only—no join on `approvals` table. The chain shows stage configuration but no action badges, delegation indicators, comments, or history regardless of database state.

**Recommended fix:** Extend `positions-get` (or add `positions-approvals-get`) to return approval rows for the position; pass them into `ApprovalChain`. Alternatively query `approvals` directly in the route with RLS.

---

### 10. HIGH — `ApprovalChain` double-prefixes i18n keys (Arabic shows raw key paths)

**Location:** `frontend/src/components/approval-chain/ApprovalChain.tsx` lines 124, 214, 340, 423; keys defined at `frontend/src/i18n/en/positions.json` lines 206–236 (`approval.actions.*`, `status.*`)

**Why it is a real bug:** The component uses `useTranslation('positions')` but calls `t('positions.approval.actions.${action}')` and `t('positions.status.${status}')`. With the `positions` namespace active, resolved keys become `positions.positions.approval.actions.approve`, which do not exist. Arabic and English users see literal strings like `positions.approval.actions.approve` on action badges and the summary status chip.

**Recommended fix:** Use `t(\`approval.actions.${action}\`)` and `t(\`status.${status}\`)`to match`positions.json`structure (other strings in the same file already use`t('approval.stepUpVerified')` correctly).

---

### 11. HIGH — Library status filter uses `review` and `archived` instead of DB enum values

**Location:** `frontend/src/routes/_protected/positions.tsx` lines 209–213, 153; `supabase/functions/positions-list/index.ts` lines 18–19; `frontend/src/types/position.ts` line 8

**Why it is a real bug:** The filter sends `status=review` to `positions-list`, but the DB/API enum is `under_review`. `archived` is not a position status at all (`draft`, `under_review`, `approved`, `published`, `unpublished` in types/i18n). Filtering by “Under Review” or “Archived” returns zero rows. Stats cards read `stats.byStatus?.review` (line 153), which is never populated (finding 13), so the in-review count is always 0.

**Recommended fix:** Change filter values to `under_review` and `unpublished` (or remove archived). Use `positions:status.under_review` i18n keys. Map stats from API aggregates if available.

---

### 12. HIGH — `link_type` values site-wide disagree with `position_dossier_links` CHECK constraint

**Location:**

- DB: `supabase/migrations/20251022000009_update_polymorphic_refs.sql` lines 21–26 (`applies_to`, `related_to`, `endorsed_by`, `opposed_by`)
- Frontend: `frontend/src/components/positions/PositionDossierLinker.tsx` line 30; `frontend/src/domains/positions/types/index.ts` lines 112, 138; `frontend/src/components/positions/DossierPositionsTab.tsx` lines 31–32, 98+; `frontend/src/hooks/useDossierPositionLinks.ts` lines 43, 52, 66

**Why it is a real bug:** UI uses `primary` / `related` / `reference`. Inserts and filters with these values violate the CHECK constraint or match zero rows. `positions-dossiers-create` defaults to `link_type: link_type || 'related'` (line 82), which is not in the allowed set—inserts fail with a constraint error.

**Recommended fix:** Align TypeScript types, selects, and edge defaults with DB enums (map UI labels to `applies_to` / `related_to` / etc.). Add a migration only if product intent truly differs from the schema.

---

### 13. HIGH — `positions-dossiers-create` inserts `linked_by` and embeds nonexistent `reference_type`

**Location:** `supabase/functions/positions-dossiers-create/index.ts` lines 77–88; schema `created_by` at migration lines 32–33

**Why it is a real bug:** Insert payload uses `linked_by: user.id` but the column is `created_by`. PostgREST ignores unknown columns or errors depending on configuration; `created_by` stays null. The `.select()` embed requests `dossiers.reference_type`; the `dossiers` table has `type`, not `reference_type` (`20251022000001_create_unified_dossiers.sql` line 13)—the embed returns 400 and link creation fails after insert.

**Recommended fix:** Use `created_by: user.id`. Change embed to `dossiers(id, name_en, name_ar, type, status)` matching `positions-dossiers-get`.

---

### 14. HIGH — Alternate detail page assumes `position.dossier_id` column

**Location:** `frontend/src/routes/_protected/positions/$positionId.tsx` lines 245–258

**Why it is a real bug:** Positions link to dossiers only via `position_dossier_links` (no `dossier_id` on `positions`). The cast `(position as any).dossier_id` is always undefined, so “View dossier” never appears even when links exist. Library navigation routes here (`positions.tsx` line 306), so many users hit this broken detail view instead of `$id` editor.

**Recommended fix:** Fetch `position_dossier_links` (reuse `usePositionDossierLinks`) and list linked dossiers, or redirect library clicks to `/positions/$id`.

---

### 15. HIGH — Library “Create position” opens `AttachPositionDialog` with empty context

**Location:** `frontend/src/routes/_protected/positions.tsx` lines 320–327

**Why it is a real bug:** `AttachPositionDialog` requires `engagementId` and `dossierId` to attach existing positions; it does not create standalone positions. Opening it with `engagementId=""` and `dossierId=""` cannot produce a new library position. Users expect a create flow (`positions-create`).

**Recommended fix:** Replace with a create dialog/route that calls `createPosition` / navigates to `/positions/$id` after creation.

---

### 16. HIGH — `approvals-reassign` edge function is an unimplemented stub

**Location:** `supabase/functions/approvals-reassign/index.ts` lines 8–12; caller `frontend/src/routes/_protected/admin/approvals.tsx` lines 74–94

**Why it is a real bug:** The function always returns HTTP 501 (`Function stub - implementation needed`). The admin reassignment UI calls it on submit; reassignment always fails.

**Recommended fix:** Implement per contract tests / `approvals` table schema, or hide the admin UI until the function is ready.

---

### 17. HIGH — Suggestions API response shape does not match frontend `PositionSuggestion` type

**Location:**

- Edge response: `supabase/functions/position-suggestions-get/index.ts` lines 215–220 (`suggestions`, `fallback_mode`, `total`; items lack nested `position`)
- Frontend type: `frontend/src/domains/positions/types/index.ts` lines 29–48 (`position: { title, content, type }`, `meta.fallback_mode`)
- Consumer: `frontend/src/components/positions/PositionSuggestionsPanel.tsx` lines 106–114, 207–217

**Why it is a real bug:** Even with a correct URL, the hook returns suggestions without a `position` object. `getPositionTitle(suggestion.position)` throws or renders blank. `meta` is undefined because the API exposes `fallback_mode` at the top level, not under `meta`—`isFallbackMode` in the panel never activates.

**Recommended fix:** Either hydrate suggestions server-side (join `positions` for bilingual fields) or map in the repository to `PositionSuggestion`. Wrap `fallback_mode` into `meta: { fallback_mode, ai_service_status, generated_at }`.

---

### 18. MEDIUM — Library type filter sends slug values as `thematic_category`

**Location:** `frontend/src/routes/_protected/positions.tsx` lines 71–75, 218–235; `positions-list` filters `thematic_category` not `position_type_id`

**Why it is a real bug:** Filter values like `talking_point` / `statement` are passed as `thematic_category`. Position types are UUID FKs (`position_type_id`). Type filtering returns incorrect or empty results.

**Recommended fix:** Filter by `position_type_id` (resolve slugs to IDs) or rename UI to match actual `thematic_category` values in data.

---

### 19. MEDIUM — Library stats cards always show zero for status breakdown

**Location:** `frontend/src/routes/_protected/positions.tsx` lines 79–83, 141–164

**Why it is a real bug:** `stats.byStatus` is initialized `{}` and never computed from `positions-list` or a dedicated aggregate endpoint. Published / in-review / draft counts are always 0 except total.

**Recommended fix:** Request counts from the API (group-by status) or derive from the loaded page with a clear “on this page” label.

---

### 20. MEDIUM — `positions-unpublish` sets status to `draft`, not `unpublished`

**Location:** `supabase/functions/positions-unpublish/index.ts` lines 140–147; UI/i18n `unpublished` at `frontend/src/i18n/en/positions.json` lines 235, 205; `$positionId.tsx` lines 158–168

**Why it is a real bug:** Unpublishing resets to `draft` with `current_stage: 0`. The alternate detail page and types expect an `unpublished` state with restore/archive copy. Users lose the semantic distinction between never-submitted drafts and withdrawn publications; filters for `unpublished` never match.

**Recommended fix:** Set `status: 'unpublished'` if the DB CHECK allows it (add migration if missing locally). Align edge, types, and filters.

---

### 21. MEDIUM — Detail page type badge uses UUID as i18n key

**Location:** `frontend/src/routes/_protected/positions/$positionId.tsx` line 138

**Why it is a real bug:** `t(\`positions:type.${position.position_type_id}\`)` passes a UUID. No translation keys exist for UUIDs; the badge shows the raw key or UUID string.

**Recommended fix:** Join `position_types` (or embed in `positions-get`) and display `name_en` / `name_ar`.

---

### 22. MEDIUM — `briefing-packs-generate` embeds `dossiers(id, title)`

**Location:** `supabase/functions/briefing-packs-generate/index.ts` line 85

**Why it is a real bug:** `dossiers` has `name_en` / `name_ar`, not `title`. The engagement fetch fails or omits dossier names, breaking PDF generation context.

**Recommended fix:** `.select('*, dossiers(id, name_en, name_ar)')` and update generator templates accordingly.

---

### 23. MEDIUM — Missing or wrong i18n keys in positions workflow UI

**Location:**

- `positions.approvals.*` vs `approval.*`: `frontend/src/routes/_protected/positions/$id/approvals.tsx` lines 95–125 (falls back to English default strings)
- `positions:status.archived`: `positions.tsx` line 213 — key absent from `positions.json`
- `common:clear_filters`: `DossierPositionsTab.tsx` line 148 — absent from `common.json`
- `common.loading`: `PositionDossierLinker.tsx` line 71 — should be `common:common.loading` (nested under `common.common` in `common.json` line 73)

**Why it is a real bug:** Arabic locale shows English fallbacks or raw key paths for approvals page titles, archived filter label, clear-filters button, and linker loading state.

**Recommended fix:** Add missing keys to `en`/`ar` bundles; fix namespace prefixes (`positions:approval.*`, `common:common.loading`).

---

### 24. MEDIUM — Editor status banners are hardcoded English (not i18n / RTL copy)

**Location:** `frontend/src/routes/_protected/positions/$id.tsx` lines 152–174

**Why it is a real bug:** Read-only and draft banners are literal English sentences. Arabic analysts see English instructions on a bilingual product surface.

**Recommended fix:** Move strings to `positions.json` (`editor.banners.*`) and use `t()` with RTL-safe layout (already uses logical `me-*` elsewhere).

---

### 25. MEDIUM — `ApprovalChain` status prop excludes `unpublished`

**Location:** `frontend/src/components/approval-chain/ApprovalChain.tsx` line 80; cast at `$id.tsx` lines 233, 249

**Why it is a real bug:** `ApprovalChainProps.status` omits `unpublished` though `PositionStatus` includes it. TypeScript casts hide the gap; unpublished positions get incorrect badge styling/logic in the chain summary.

**Recommended fix:** Extend the union and handle `unpublished` in `getStageStatus` / summary badge variants.

---

### 26. MEDIUM — `getTopPositions` expects `{ data: [] }` but edge returns `{ positions: [] }`

**Location:** `frontend/src/domains/positions/repositories/positions.repository.ts` lines 129–132; `supabase/functions/position-analytics-top/index.ts` lines 119–125

**Why it is a real bug:** Repository reads `result.data`; API returns `positions`. Top-positions widgets always get an empty array even if the URL were fixed.

**Recommended fix:** Return `result.positions` or align edge response to `{ data: topPositions }`.

---

### 27. MEDIUM — `ConsistencyPanel` always receives `null` despite score being present

**Location:** `frontend/src/routes/_protected/positions/$id.tsx` lines 213–219

**Why it is a real bug:** The panel renders when `consistency_score !== undefined` but `consistencyCheck={null}` is hardcoded. Users see an empty consistency UI while the score field exists on the row.

**Recommended fix:** Fetch or compute `ConsistencyCheck` and pass real data, or hide the section until data exists.

---

### 28. LOW — `PositionCard` legacy field fallbacks (`topic`, `rationale`, `approval.status`)

**Location:** `frontend/src/components/positions/PositionCard.tsx` lines 41–45

**Why it is a real bug:** Not breaking when `title_en`/`content_en` are present, but obscures schema drift and could mask bad API shapes if old fields reappear in partial payloads.

**Recommended fix:** Remove legacy casts; rely on `title_en`/`title_ar` and `status` only.

---

### 29. LOW — Duplicate position detail routes (`$id` vs `$positionId`)

**Location:** `frontend/src/routes/_protected/positions/$id.tsx` vs `$positionId.tsx`; library navigates to `$positionId` (`positions.tsx` line 306)

**Why it is a real bug:** Two divergent detail experiences (editor vs read-only stub). Maintenance burden and inconsistent bugs (dossier link, publish, approval chain only on `$id`).

**Recommended fix:** Consolidate on `$id` or redirect `$positionId` → `$id`.

---

### 30. LOW — `ApprovalChainConfig` type in `types/position.ts` uses `stage_number` / `stage_name` vs runtime `order` / `role`

**Location:** `frontend/src/types/position.ts` (ApprovalChainConfig); seed `default_chain_config` in `20250101015_seed_position_types.sql`; component `ApprovalChain.tsx` lines 45–48

**Why it is a real bug:** TypeScript types do not match DB seed or component—developer confusion only; runtime uses `order`/`role` from JSONB correctly.

**Recommended fix:** Align `ApprovalChainConfig` interface with seed and `ApprovalChain` component types.

---

## Summary

| Severity | Count |
| -------- | ----: |
| CRITICAL |     7 |
| HIGH     |    10 |
| MEDIUM   |    10 |
| LOW      |     3 |

**Highest-impact breakages:** submit and update mutations (core editor), broken edge URL routing for analytics/suggestions/briefings, approval action UI missing entirely, `link_type` / dossier-link schema mismatches, and i18n double-prefix in `ApprovalChain`.

**Suggested fix order:** (1) repository ↔ edge contracts for get/update/submit, (2) edge query-param parsing + column fixes, (3) `link_type` alignment, (4) approval history fetch + action hooks, (5) i18n key cleanup.

---

_Inspection performed against repository source only; runtime verification on `localhost:5173` / staging `zkrcjzdemdmwhearhfgg` was not executed in this pass._
