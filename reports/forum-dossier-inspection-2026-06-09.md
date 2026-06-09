# Forum Dossier Workflow Inspection

**Date:** 2026-06-09  
**Scope:** End-to-end FORUM dossier workflow — list route (`useForums`), detail shell (`DossierShell`), tabs, overview cards (`ForumMetadataCard`, `ForumSessionsCard`, `MeetingScheduleCard`, `MemberListCard`), `DossierGlyph`, activity timeline edge function  
**Method:** Static code trace against `frontend/src/types/database.types.ts`, TanStack Router routes, hooks, `dossier-overview.service.ts`, `supabase/functions/engagement-dossiers`, `supabase/functions/dossier-activity-timeline`, and `frontend/src/i18n/{en,ar}/*.json`. No live browser or staging API calls were executed.

---

## Workflow Map (Verified Live Path)

| Stage            | Entry                   | Primary implementation                                                                                                                                                   |
| ---------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| List             | `/dossiers/forums`      | `frontend/src/routes/_protected/dossiers/forums/index.tsx` → `useForums` → `ListPageShell` + `GenericListPage` + `DossierGlyph`                                          |
| Detail shell     | `/dossiers/forums/$id`  | `frontend/src/routes/_protected/dossiers/forums/$id.tsx` → `DossierShell` (`dossierType="forum"`) + nested `<Outlet />`                                                  |
| Default tab      | `/dossiers/forums/$id/` | Redirects to `overview`                                                                                                                                                  |
| Tabs             | URL segments            | `DossierTabNav` base tabs only (no forum `extraTabs`): `overview`, `engagements`, `docs`, `tasks`, `timeline`, `audit` — **no dedicated `sessions` or `members` routes** |
| Overview         | `overview`              | `ForumOverviewTab` → `SharedSummaryStatsCard`, `DossierAnalyticsCard`, `ForumMetadataCard`, `ForumSessionsCard`, `SharedRecentActivityCard`                              |
| Engagements      | `engagements`           | `DossierEngagementsTab` → `fetchDossierOverview` `related_dossiers` + `calendar_events`                                                                                  |
| Timeline         | `timeline`              | `DossierActivityTimeline` → `useDossierActivityTimeline` → edge function `dossier-activity-timeline`                                                                     |
| Session creation | —                       | `ForumSessionCreator` + `createForumSession` exist but are **only imported from dead** `ForumDossierDetail.tsx`                                                          |

**Superseded (not routed):** `ForumDossierPage`, `ForumDossierDetail`, `frontend/src/pages/forums/ForumsPage.tsx` — no imports from current forum dossier routes.

**Glyphs:** List rows use `DossierGlyph` with `type="forum"` (Unicode `◇`, `\u25C7`) per `DossierGlyph.symbols.test.tsx`. No defect found in glyph rendering.

**RTL (active path):** No `ml-*` / `mr-*` / `pl-*` / `pr-*` / physical `left`/`right` in `forums/index.tsx`, `ForumOverviewTab.tsx`, `ForumMetadataCard.tsx`, or `ForumSessionsCard.tsx`.

---

## Findings

### 1. CRITICAL — Forum sessions created via lifecycle engine are invisible across the live UI

**Location:**

- `frontend/src/domains/engagements/repositories/engagements.repository.ts` lines 437–456 (`createForumSession` sets `parent_forum_id` only)
- `supabase/functions/engagement-dossiers/index.ts` lines 472–498 (persists `parent_forum_id` on `engagement_dossiers`, no `dossier_relationships` row)
- `frontend/src/pages/dossiers/overview-cards/ForumSessionsCard.tsx` lines 44–49
- `frontend/src/components/dossier/tabs/DossierEngagementsTab.tsx` lines 53–54

**Why it is a real bug:** The canonical session model (Phase 9 lifecycle) links child engagements through `engagement_dossiers.parent_forum_id`. The active overview card and engagements tab both read **only** `related_dossiers` from `dossier_relationships` (`by_dossier_type.engagement` / `by_relationship_type.child`). Creating a forum session never inserts a matching relationship, so sessions stored with `parent_forum_id` do not appear on the overview **Sessions** card or the **Engagements** tab unless someone manually adds a graph edge. Analysts see “No sessions recorded” while valid session rows exist in `engagement_dossiers`.

**Recommended fix:** Pick one source of truth and align all readers. Preferred: extend `fetchRelatedDossiers` (or add a `fetchForumSessions` section) to union engagements where `engagement_dossiers.parent_forum_id = dossierId`, and use that in `ForumSessionsCard`, `DossierEngagementsTab`, and analytics. Alternatively, on session create, also insert `dossier_relationships` (`parent_of` / `child`) between forum and session dossiers.

---

### 2. HIGH — `ForumMetadataCard` binds wrong fields for all four metadata rows

**Location:** `frontend/src/pages/dossiers/overview-cards/ForumMetadataCard.tsx` lines 46–73

**Why it is a real bug:**

- **Forum Type** renders `data.dossier.description_en` (free-text description), not any forum classification. The `forums` table has no `forum_type` column (see comment in `ForumDetailsStep.tsx` lines 7–10); the card should either omit this row or read an agreed field (e.g. tags / metadata key) once defined.
- **Frequency** reads `dossier.metadata.frequency`, which is not a `forums` column and is never set by `forumWizardConfig` or `useCreateForum`.
- **Host Organization** uses the first related organization from `related_dossiers.by_dossier_type.organization[0]`, ignoring `forums.organizing_body` / `organizing_body_id` written by the create wizard (`forum.config.ts` line 31). A forum can have a host in the extension table but show “-” if no relationship row exists.
- **Participants** uses `related_dossiers.total_count` (all relationship types), not member/participant relationships (`has_member`, `partner`, etc.) or participant tables.

**Recommended fix:** Load forum extension via `getDossier(id, ['extension'])` or an overview section that joins `forums` and resolves `organizing_body` to the organization dossier name. Map participants from `by_relationship_type.has_member` (and related types) or a dedicated participant source. Remove or relabel “Forum Type” until a real column exists.

---

### 3. HIGH — Forum analytics “Sessions” metric counts calendar events, not forum sessions

**Location:** `frontend/src/domains/analytics/hooks/useAnalyticsForDossier.ts` lines 86–97; stats source `frontend/src/services/dossier-overview.service.ts` line 913 (`upcoming_events_count`)

**Why it is a real bug:** For `dossierType === 'forum'`, the first metric is labeled “Sessions” (`analytics.sessionCount`) but the value is `stats.upcoming_events_count`, which is derived from calendar events in the overview service—not `engagement_dossiers` rows with `engagement_type = 'forum_session'` or `forums.number_of_sessions`. Forums with real sessions but no calendar entries show `0`; forums with unrelated upcoming calendar items inflate the session count.

**Recommended fix:** Add `forum_session_count` (query `engagement_dossiers` where `parent_forum_id = dossierId`) to overview stats and map the forum analytics metric to that field.

---

### 4. HIGH — `ForumSessionsCard` displays dossier lifecycle fields instead of session schedule/status

**Location:** `frontend/src/pages/dossiers/overview-cards/ForumSessionsCard.tsx` lines 89–108

**Why it is a real bug:** For each related engagement dossier, the card shows `session.created_at` as the date and `session.status` as the badge. `RelatedDossier.status` is the **dossier** status (`active`, `archived`, etc. from `dossier-overview.types.ts` lines 56–69), not `engagement_dossiers.engagement_status` or `start_date`. Users see archive/active chips and link creation dates instead of session dates and planned/confirmed/in_progress states. Status strings are rendered raw with no i18n (`t('forums:status.*')` or engagement status labels).

**Recommended fix:** Join `engagement_dossiers` for related engagement IDs (or use the parent_forum_id query from finding 1) and display `start_date` / `engagement_status` with `ENGAGEMENT_STATUS_LABELS` and locale-aware formatting.

---

### 5. HIGH — No sessions/members tabs or session creation in the routed forum shell

**Location:**

- `frontend/src/components/dossier/DossierTabNav.tsx` lines 33–40 (base tabs only)
- `frontend/src/routes/_protected/dossiers/forums/$id.tsx` lines 16–21 (no `extraTabs`)
- `frontend/src/components/engagements/ForumSessionCreator.tsx` (only referenced from `ForumDossierDetail.tsx` lines 59, 323)

**Why it is a real bug:** The superseded `ForumDossierDetail` exposed **Sessions** and **Members** tabs plus **New Session** (`ForumSessionCreator`). The live `DossierShell` forum layout exposes only the shared six tabs. There is no routed path to create or manage forum sessions from the UI analysts actually use, despite `createForumSession` and `ForumSessionCreator` being implemented.

**Recommended fix:** Add forum `extraTabs` (`sessions`, `members`) to `DossierShell` for `dossierType="forum"`, with routes under `$id/sessions.tsx` and `$id/members.tsx` that call `getForumSessions` / member relationship views, and mount `ForumSessionCreator` on the sessions tab.

---

### 6. HIGH — `MemberListCard` and `MeetingScheduleCard` omitted from forum overview

**Location:**

- `frontend/src/pages/dossiers/ForumOverviewTab.tsx` lines 32–36 (cards rendered)
- `frontend/src/pages/dossiers/WorkingGroupOverviewTab.tsx` lines 36–37 (only WG tab includes these cards)

**Why it is a real bug:** Both cards exist and are production-ready (`MemberListCard` reads `has_member` / `partner` relationships; `MeetingScheduleCard` reads `calendar_events.upcoming`). They are wired only to working-group overview, not forum overview. Legacy `ForumDossierDetail` had a **Members** tab (`MemberOrganizations` reading `extension.member_organizations`, which is not in the live `forums` schema). The current forum overview therefore lacks member and meeting schedule surfaces that the product previously exposed and that the user workflow expects.

**Recommended fix:** Add `MemberListCard` and `MeetingScheduleCard` to `ForumOverviewTab` (or dedicated tabs per finding 5). For members, prefer `related_dossiers` relationship types over phantom `extension.member_organizations` from `dossier-type-guards.ts`.

---

### 7. HIGH — `parent_forum_id` list API response shape does not match `EngagementListResponse`

**Location:**

- `supabase/functions/engagement-dossiers/index.ts` lines 313–340
- `frontend/src/types/engagement.types.ts` lines 407–437 (`EngagementListItem` expects top-level `name_en`, `engagement_status`, `start_date`)
- `frontend/src/domains/engagements/repositories/engagements.repository.ts` lines 461–466 (`getForumSessions` types response as `EngagementListResponse`)

**Why it is a real bug:** When `parent_forum_id` is set, the edge function returns raw `engagement_dossiers` rows with nested `dossier: { name_en, ... }`, not flattened `EngagementListItem` objects. Consumers expecting `session.name_en` (e.g. dead `ForumDossierDetail.tsx` lines 285–286) receive `undefined` at the top level. Pagination `total` is set to `sessionData?.length` (current page size), not a count query—so `totalPages` and `has_more` are wrong when more than one page of sessions exists.

**Recommended fix:** Map rows to `EngagementListItem` (lift `dossier.name_en` / `name_ar`, map `engagement_status`, `start_date`, etc.) and run a separate `count` query on `engagement_dossiers` for `parent_forum_id`.

---

### 8. MEDIUM — Activity timeline edge function rejects archived forum dossiers

**Location:** `supabase/functions/dossier-activity-timeline/index.ts` lines 128–147

**Why it is a real bug:** Access check uses `.neq('status', 'archived')` on `dossiers`. `useDeleteForum` archives forums (`frontend/src/hooks/useForums.ts` lines 180–184), but `DossierShell` can still load archived dossiers via `getDossier`. The **Timeline** tab and `SharedRecentActivityCard` then receive 403 “Dossier not found or access denied” while other tabs may still render—broken read-only review for archived forums.

**Recommended fix:** Allow `archived` dossiers for read-only timeline fetch (retain `deleted` exclusion), or block navigation to archived forum detail pages consistently in the shell.

---

### 9. MEDIUM — Missing i18n keys for forums list empty state

**Location:** `frontend/src/routes/_protected/dossiers/forums/index.tsx` lines 126–127

**Why it is a real bug:** The route calls `t('forums:empty.title')` and `t('forums:empty.description')`. Neither key exists in `frontend/src/i18n/en/forums.json` or `frontend/src/i18n/ar/forums.json` (file has `noForumsFound` / `noForumsDescription` instead). i18next falls back to the key string or missing translation, so Arabic and English empty states show raw keys or English fallbacks.

**Recommended fix:** Add an `empty.title` / `empty.description` block to both locale files, or change the route to use existing keys `noForumsFound` and `noForumsDescription`.

---

### 10. MEDIUM — Missing i18n keys for forum overview cards (Arabic falls back to English `defaultValue`)

**Location:**

- `frontend/src/pages/dossiers/overview-cards/ForumMetadataCard.tsx` lines 54–81
- `frontend/src/pages/dossiers/overview-cards/ForumSessionsCard.tsx` lines 79–85

**Why it is a real bug:** Keys `overview.forum.*` and `overview.sessions.*` are absent from `frontend/src/i18n/en/dossier.json` and `frontend/src/i18n/ar/dossier.json` (grep returns no matches). Components pass English `defaultValue` strings; in Arabic locale, i18next uses those English defaults for titles and labels (“Forum Details”, “Sessions”, “No sessions recorded”, etc.), violating bilingual requirements.

**Recommended fix:** Add full `overview.forum` and `overview.sessions` trees to `en/dossier.json` and `ar/dossier.json`, then remove inline English `defaultValue` where keys exist.

---

### 11. MEDIUM — Forums list ignores query errors and pagination UI

**Location:** `frontend/src/routes/_protected/dossiers/forums/index.tsx` lines 60–62, 123–135

**Why it is a real bug:** `page` is validated in the URL and passed to `useForums({ page, limit: 20 })`, but the component never renders pagination controls (contrast `countries/index.tsx`, which passes `page` into `DossierTable`). When `query.isError` is true, the UI still renders `GenericListPage` with `items=[]`, which can show the empty state instead of an error—masking PostgREST or auth failures as “no forums”.

**Recommended fix:** Handle `query.isError` with an error banner; wire `query.data.pagination` to `ListPageShell` pagination props (mirror countries list pattern).

---

### 12. MEDIUM — Forum wizard writes `organizing_body` but not `organizing_body_id`

**Location:** `frontend/src/components/dossier/wizard/config/forum.config.ts` lines 30–31; `frontend/src/types/database.types.ts` lines 13717–13719 (`organizing_body` and `organizing_body_id` both exist)

**Why it is a real bug:** `filterExtensionData` maps the picker value into `organizing_body` only. The schema also exposes `organizing_body_id` (FK via `fk_forums_organizing_body`). Any code path that reads `organizing_body_id` gets `null` even after a successful wizard submit. Today `ForumMetadataCard` does not read either column (finding 2), so the host is invisible end-to-end.

**Recommended fix:** Set `organizing_body_id: data.organizing_body_id` in `filterExtensionData` (and stop duplicating UUID into `organizing_body` unless that legacy column is still required). Update overview cards to resolve host from extension.

---

### 13. LOW — Duplicate / divergent forum session hooks and legacy `engagements` table reference

**Location:**

- `frontend/src/hooks/useForumSessions.ts` (relationship + legacy `engagements` table, lines 99–101)
- `frontend/src/domains/engagements/hooks/useLifecycle.ts` lines 200–211 (`getForumSessions` via API / `parent_forum_id`)

**Why it is a real bug:** Two hooks share the name `useForumSessions` with different query strategies and response shapes. The hooks-file version queries `engagements` extension table, but live engagement data lives in `engagement_dossiers` (per migrations and `database.types.ts`). Neither hook is used by the routed forum UI today; re-wiring without consolidation will resurrect silent empty extension data.

**Recommended fix:** Delete or deprecate `frontend/src/hooks/useForumSessions.ts`; standardize on `domains/engagements` `getForumSessions` after fixing the edge function response (finding 7).

---

### 14. LOW — Dead forum UI modules still present in tree

**Location:**

- `frontend/src/pages/dossiers/ForumDossierPage.tsx`
- `frontend/src/components/dossier/ForumDossierDetail.tsx`
- `frontend/src/pages/forums/ForumsPage.tsx`

**Why it is a real bug:** These modules implement tabs (sessions, members, deliverables), `ForumSessionCreator`, and list columns using `extension.member_organizations` / `forum_type` from `dossier-type-guards.ts` `ForumExtension` (lines 273–283)—fields **not** in the live `forums` table (`supabase/migrations/20251022000002_create_extension_tables.sql` lines 62–71). They are not imported by TanStack Router forum routes, so they mislead maintainers and duplicate behavior already split across `DossierShell` and `ForumOverviewTab`.

**Recommended fix:** Remove or archive behind a explicit `legacy/` path after porting any still-needed behavior (session creator, members) into routed components (findings 5–6).

---

### 15. LOW — `dossier-type-guards` `ForumExtension` does not match database schema

**Location:** `frontend/src/lib/dossier-type-guards.ts` lines 273–283 vs `frontend/src/types/forum.types.ts` lines 34–43 and `forums` table in `database.types.ts`

**Why it is a real bug:** `ForumExtension` in type-guards defines `forum_type`, `member_organizations`, `meeting_frequency`, and `deliverables`, which are not columns on `forums`. Dead `ForumDossierDetail` and `MemberOrganizations` read these phantom fields. Active types (`forum.types.ts`) correctly mirror the DB. Mixed imports can cause TypeScript to lie about runtime shape.

**Recommended fix:** Align `dossier-type-guards.ts` `ForumExtension` with `forum.types.ts` / generated schema; update or remove `MemberOrganizations` dependency on `member_organizations`.

---

## Components Verified (No Defect Reported)

| Component                         | Result                                                                       |
| --------------------------------- | ---------------------------------------------------------------------------- |
| `DossierGlyph` (`type="forum"`)   | Correct `◇` symbol and token-based tint (test-backed)                        |
| `useForums` list query            | Selects `dossiers` + `forums.*` extension; no invalid column names in select |
| `useDossierActivityTimeline` hook | Uses `next_cursor` pagination; compatible with edge function response        |
| RTL in active forum overview/list | Logical properties only; no physical left/right violations found             |
| `dossier_activity_timeline` view  | Referenced by edge function; view exists in migrations                       |

---

## Summary

| Severity | Count |
| -------- | ----: |
| CRITICAL |     1 |
| HIGH     |     6 |
| MEDIUM   |     5 |
| LOW      |     3 |

The highest-impact issue is the **split session model**: `parent_forum_id` on `engagement_dossiers` is written by the lifecycle API but never read by the routed overview, engagements tab, or analytics. Secondary issues are **wrong metadata bindings** on `ForumMetadataCard`, **missing forum-specific tabs and cards** compared to legacy UI, **i18n gaps** on list empty state and overview cards, and **API/type drift** on `parent_forum_id` list responses.
