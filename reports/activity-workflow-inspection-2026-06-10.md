# Activity Workflow Inspection Report

**Date:** Wed 10 Jun 2026  
**Scope:** Read-only code + contract inspection of the global `/activity` route; active Sidebar Operations discoverability; route, page, feed components, hooks, `activity-feed` edge function, generated Supabase table/RPC contracts, actor/entity name resolution, pagination/realtime behavior, i18n EN+AR registration/parity, RTL/design-token compliance, and honest-UI checks  
**Branch:** `quick/260608-c9b-country-dossier-workflow-fixes`  
**Constraint:** No source edits; findings only. The only file write is this report.  
**Inspector:** codex (substituting for cursor-agent — monthly quota exhausted)

Prior coverage note: per-dossier activity timelines and the `dossier-activity-timeline` edge function were inspected in earlier dossier rounds. This report intentionally focuses on the global `/activity` surface in the active Sidebar Operations group, not dossier timeline tabs.

---

## Scope

### Routes traced

| URL                                       | Nav source                                                                                                                      | Route file                                                                 | Page / component                                                                                 | Result                                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `/activity`                               | Active Sidebar Operations secondary item at `frontend/src/components/layout/navigation-config.ts:111-115`; rendered by Sidebar. | `frontend/src/routes/_protected/activity.tsx:1-5`                          | `ActivityPage` -> `useActivityFeed` -> edge function `activity-feed` -> table `activity_stream`  | Mounted and discoverable. It renders All/Following tabs and the Wave-style `ActivityList`. |
| `/audit-logs`                             | Administration item, not Operations.                                                                                            | `frontend/src/routes/_protected/audit-logs.tsx`                            | `AuditLogsPage` -> audit domain hooks -> `audit-logs-viewer` edge function -> table `audit_logs` | Separate admin audit-trail workflow; not wired into global `/activity`.                    |
| Dossier `*/audit` and `*/timeline` routes | Dossier tabs.                                                                                                                   | Multiple dossier routes under `frontend/src/routes/_protected/dossiers/**` | Dossier tab stubs or `DossierActivityTimeline` depending on dossier type                         | Out of scope except to confirm they are not the global `/activity` implementation.         |

### Child components & hooks

| Surface              | Files                                                                                                                                            | Role                                                                                                             | Current wiring                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Page shell           | `frontend/src/pages/activity/ActivityPage.tsx:26-91`                                                                                             | Sets page direction, All/Following tab state, loading/error/empty states, and renders `ActivityList`.            | Active. Uses `useActivityFeed({ followed_only: tab === 'following' })`.                         |
| List presentation    | `frontend/src/components/activity-feed/ActivityList.tsx:90-176`                                                                                  | Renders timeline rows using denormalized actor/entity fields and `activity-feed.events.{action_type}` templates. | Active. Rows navigate only when `metadata.navigation_url` is an in-app relative path.           |
| Feed hook            | `frontend/src/hooks/useActivityFeed.ts:72-139`                                                                                                   | TanStack infinite query wrapper for `activity-feed` with cursor, filters, 30s stale time, and 60s polling.       | Active, but the page ignores `hasNextPage` and `fetchNextPage`.                                 |
| Follow hook          | `frontend/src/hooks/useActivityFeed.ts:145-236`                                                                                                  | Fetches/mutates `entity_follows`.                                                                                | Not used by active `/activity`; only used by legacy `EnhancedActivityFeed`.                     |
| Preferences hook     | `frontend/src/hooks/useActivityFeed.ts:243-295`                                                                                                  | Fetches/mutates `activity_feed_preferences`.                                                                     | Not used by active `/activity`; only used by unmounted `ActivitySettingsSheet`.                 |
| Legacy enhanced feed | `frontend/src/components/activity-feed/EnhancedActivityFeed.tsx:378-568`                                                                         | Old filter/follow/infinite-scroll UI.                                                                            | Not mounted by any route/component in `frontend/src` in this branch.                            |
| Legacy filters       | `frontend/src/components/activity-feed/ActivityFeedFilters.tsx:284-760`                                                                          | Search, entity/action/date/user/followed-only filters.                                                           | Not active because only `EnhancedActivityFeed` imports it.                                      |
| Statistics/settings  | `frontend/src/pages/activity/components/ActivityStatistics.tsx:22-80`, `frontend/src/pages/activity/components/ActivitySettingsSheet.tsx:37-132` | Older stats/settings surfaces.                                                                                   | Not mounted by `ActivityPage`. Placeholder stats are therefore not visible on the active route. |

### Backend / Supabase surfaces

| Surface                                                          | Role                                                                           | Type validation against `database.types.ts`                                                                                                                                                                                                                               | Wired from workflow?                                                                                                    |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Edge Function `activity-feed`                                    | Lists activities, followed feed, following list, follow/unfollow, preferences. | Uses `activity_stream`, `entity_follows`, and `activity_feed_preferences`, all present in generated types.                                                                                                                                                                | Yes for list/following tab reads. Follow/preferences mutations are not reachable from active `/activity`.               |
| Table `activity_stream`                                          | Global feed source.                                                            | Generated row at `frontend/src/types/database.types.ts:702-775` includes selected/filter columns: `action_type`, `entity_type`, `entity_id`, names, actor fields, descriptions, related fields, target fields, `metadata`, `is_public`, `visibility_scope`, `created_at`. | Yes. Edge function calls `.from('activity_stream').select('*')` at `supabase/functions/activity-feed/index.ts:165-170`. |
| Table `entity_follows`                                           | Stores followed entities.                                                      | Generated row at `frontend/src/types/database.types.ts:11819-11862` includes `user_id`, entity ids/names, notification flags, and `follow_reason`.                                                                                                                        | Read by Following tab through `followed_only`; active route has no follow/unfollow UI.                                  |
| Table `activity_feed_preferences`                                | Stores feed defaults/notification preferences.                                 | Generated row at `frontend/src/types/database.types.ts:612-652` includes default filters, item count, compact view, email digest, push toggle, timestamps.                                                                                                                | Edge function supports it; active route does not mount settings.                                                        |
| RPC `log_activity`                                               | Inserts an activity row with actor snapshot.                                   | Generated at `frontend/src/types/database.types.ts:35558-35577`; SQL source in `supabase/migrations/20260110100000_activity_feed_enhanced.sql:211-306`.                                                                                                                   | Not called from frontend or edge functions found in this branch. Producer coverage is **VERIFY vs live**.               |
| RPCs `follow_entity`, `unfollow_entity`, `get_followed_entities` | DB-level follow helpers.                                                       | Generated at `frontend/src/types/database.types.ts:32881-32890`, `:33967-33981`, `:36838-36840`.                                                                                                                                                                          | Edge function uses direct table operations instead of these RPCs.                                                       |
| Table `audit_logs`                                               | Compliance/security audit trail.                                               | Generated at `frontend/src/types/database.types.ts:3090-3146`; served by separate `audit-logs-viewer`.                                                                                                                                                                    | Not used by `/activity`.                                                                                                |

Producer/source note: repo search found `activity_stream` inserts in the activity migration and demo seed, plus `log_activity` SQL, but no active frontend/edge call to `log_activity`. Which production workflows populate global activity rows is **VERIFY vs live**.

### Actor / entity resolution

| Field group             | How it resolves today                                                                                                                                                                              | Verification                                                                                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Actor name/email/avatar | `log_activity` snapshots `profiles.full_name`, `auth.users.email`, and `profiles.avatar_url` into `activity_stream` at insert time. The global feed later displays `activity.actor_name` directly. | SQL at `supabase/migrations/20260110100000_activity_feed_enhanced.sql:243-251`; display at `frontend/src/components/activity-feed/ActivityList.tsx:157-168`. |
| Entity title            | Stored denormalized as `entity_name_en` / `entity_name_ar`; active list selects locale-specific value with fallback to the other language, then `—`.                                               | `frontend/src/components/activity-feed/ActivityList.tsx:117-124`.                                                                                            |
| Related location/title  | Stored denormalized as `related_entity_name_en` / `related_entity_name_ar`; active list renders this as the `where` phrase.                                                                        | `frontend/src/components/activity-feed/ActivityList.tsx:121-124,165-166`.                                                                                    |
| Raw IDs                 | The active `ActivityList` does not render raw actor/entity ids. It only uses ids for React keys and optional row navigation metadata.                                                              | `frontend/src/components/activity-feed/ActivityList.tsx:141-150`.                                                                                            |

### i18n namespaces

| Namespace / key group        | Routes / components                                     | EN                                              | AR                                              | Registered in `i18n/index.ts`                                           | Notes                                                                                            |
| ---------------------------- | ------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `activity-feed`              | `/activity`, `ActivityList`, legacy activity components | `frontend/src/i18n/en/activity-feed.json:1-204` | `frontend/src/i18n/ar/activity-feed.json:1-204` | Imports at `frontend/src/i18n/index.ts:37-38`; resources at `:273,:399` | Flattened key diff verified: 154 EN keys, 154 AR keys, no missing keys on either side.           |
| `common.navigation.activity` | Sidebar item label                                      | `frontend/src/i18n/en/common.json:203-205`      | `frontend/src/i18n/ar/common.json:203-205`      | Common namespace registered as default app translations                 | Operations group label and Activity item both have EN+AR labels.                                 |
| `activity-feed.events.*`     | Active row sentence templates                           | `frontend/src/i18n/en/activity-feed.json:10-27` | `frontend/src/i18n/ar/activity-feed.json:10-27` | Same namespace                                                          | Uses imperative DB action values (`create`, `update`, etc.), not stale `created`/`updated` keys. |

Active-route dot-form check: no missing `activity-feed` keys were found for the mounted `ActivityPage`/`ActivityList` path. Legacy `EnhancedActivityFeed`/`ActivityFeedFilters` still contain hard-coded EN/AR labels, but they are not mounted by the active route.

---

## Environment

| Check                       | Result                                                                                                                                                                                                                                                |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend health              | `GET http://127.0.0.1:5001/health` -> **200** `{"status":"ok","timestamp":"2026-06-09T21:24:39.872Z","environment":"development"}`                                                                                                                    |
| Frontend `/activity` shell  | `HEAD http://127.0.0.1:5175/activity` -> **200** SPA HTML (`Content-Type: text/html`)                                                                                                                                                                 |
| Authenticated browser UAT   | Not performed; inspection stayed source/read-only and sent no write requests.                                                                                                                                                                         |
| Live Supabase DB/RPC/schema | Not probed with auth. Deployed activity producers, RLS publication/realtime behavior, and any live schema drift are **VERIFY vs live**.                                                                                                               |
| Typecheck / tests           | Not run; avoided toolchain commands that may write build/cache artifacts under the hard write constraint. Existing `ActivityList` tests were inspected statically at `frontend/src/components/activity-feed/__tests__/ActivityList.test.tsx:106-219`. |

---

## Findings

### 1. [ACTIVITY-DATA] Global feed trusts denormalized rows that are writable with weak visibility checks

**Severity:** HIGH  
**Location:** `supabase/functions/activity-feed/index.ts:165-170`, `supabase/migrations/20260110100000_activity_feed_enhanced.sql:169-175,243-306`, `frontend/src/components/activity-feed/ActivityList.tsx:117-124,157-168`, `frontend/src/types/database.types.ts:702-775`

**Root cause:** The global route reads `activity_stream` rows wholesale and renders stored `actor_name`, `entity_name_*`, related names, and descriptions without joins or server-side re-resolution. That denormalized model can be valid, but the repo migration allows any authenticated insert with only `auth.role() = 'authenticated'`; it does not require `actor_id = auth.uid()` or force inserts through `log_activity`. The select policy also treats `is_public = true` as sufficient and does not enforce `visibility_scope` values (`team`, `managers`, `private`) unless producers also set `is_public = false`. The demo seed itself inserts `visibility_scope = 'team'` with `is_public = true`.

**Suggested fix:** Make `log_activity` or a service-role edge path the only supported producer, or add RLS `WITH CHECK` constraints that bind `actor_id` to `auth.uid()` and prevent client-supplied actor identity spoofing. Enforce `visibility_scope` in RLS or derive `is_public` from scope so `team`/`managers`/`private` cannot be accidentally public. Keep the global feed read path on explicit selected columns and add read-only tests for actor/entity display. Live deployed policy behavior is **VERIFY vs live**.

---

### 2. [ACTIVITY] Active `/activity` page silently caps the global feed at the first 20 rows

**Severity:** HIGH  
**Location:** `frontend/src/pages/activity/ActivityPage.tsx:31-32,86-89`, `frontend/src/hooks/useActivityFeed.ts:78-114,124-138`, `supabase/functions/activity-feed/index.ts:159-170,244-259`, `frontend/src/components/activity-feed/EnhancedActivityFeed.tsx:406-411,535-549`

**Root cause:** The hook and edge function implement cursor pagination: the hook exposes `hasNextPage` and `fetchNextPage`, and the edge returns `next_cursor` / `has_more`. The active reskinned page destructures only `activities`, `isLoading`, and `error`, then renders `ActivityList` once. The older `EnhancedActivityFeed` still has infinite-scroll/load-more UI, but it is not mounted by `/activity`.

**Suggested fix:** Restore a route-level pagination control using the existing hook contract, either a visible `Load more` button using `activity-feed:loadMore` or an intersection-triggered loader. Keep the feed inside the active tab panel when fixing finding 5.

---

### 3. [ACTIVITY] Following tab is data-backed but the active workflow has no way to follow entities

**Severity:** MEDIUM  
**Location:** `frontend/src/pages/activity/ActivityPage.tsx:24,31,44-57,78-83`, `frontend/src/hooks/useActivityFeed.ts:145-236`, `frontend/src/components/activity-feed/EnhancedActivityFeed.tsx:404,428-443,523-531`, `supabase/functions/activity-feed/index.ts:212-235,327-400`

**Root cause:** The active page exposes an All/Following tab and sends `followed_only=true` for the Following tab. The edge function can filter by `entity_follows`, and hooks exist to follow/unfollow entities, but `ActivityPage` only renders `ActivityList`; it never mounts `useEntityFollow`, follow buttons, or the legacy `EnhancedActivityFeed` that contained follow controls. Repo-wide search found the follow mutation path only in the legacy enhanced feed. Users can reach a Following tab that tells them to follow entities, but this workflow provides no active follow affordance.

**Suggested fix:** Either restore follow/unfollow controls on active activity rows/detail surfaces, or remove/hide the Following tab until a follow creation path is live. If following is intended to be created elsewhere, add a visible handoff and verify that those mounted surfaces call the same `entity_follows` contract.

---

### 4. [ACTIVITY] Realtime is not implemented on the global activity feed; it is polling-only

**Severity:** MEDIUM  
**Location:** `frontend/src/hooks/useActivityFeed.ts:78-114`, `frontend/src/components/activity-feed/EnhancedActivityFeed.tsx:6-8`, `supabase/functions/activity-feed/index.ts:165-170`

**Root cause:** The active feed uses TanStack Query polling with `refetchInterval: 60 * 1000`. No `supabase.channel(...).on('postgres_changes', ...)` subscription exists for `activity_stream` in `useActivityFeed`; repo search only found realtime subscriptions for other workflows such as unified work, kanban, notifications, SLA, and waiting queue. The legacy enhanced component comment still claims real-time updates, but the active implementation updates on polling/refocus only.

**Suggested fix:** If the global activity feed is expected to be live, add an `activity_stream` realtime subscription that invalidates the `['activity-feed']` query keys with the same visibility/follow filters. If polling is the intended contract, remove realtime claims from component comments/specs and document the 60-second refresh behavior. Supabase Realtime publication for `activity_stream` is **VERIFY vs live**.

---

### 5. [I18N/A11Y] Activity tabs have empty panels and an English-only region label

**Severity:** LOW  
**Location:** `frontend/src/pages/activity/ActivityPage.tsx:35-38,44-57,86-89`, `frontend/src/i18n/en/activity-feed.json:2,6-9`, `frontend/src/i18n/ar/activity-feed.json:2,6-9`

**Root cause:** `ActivityPage` hard-codes `aria-label="Activity"` even though the page title is localized with `activity-feed:title`. The Tabs structure also renders empty `TabsContent` elements only to keep `aria-controls` valid, while the actual feed content is outside the tab panels. Visually this works, but assistive technology sees tabs whose controlled panels are empty and a region label that stays English in Arabic.

**Suggested fix:** Localize the region label with `t('title')` and render the feed/loading/error/empty content inside the active `TabsContent` panel, or use non-tab segmented controls if the content is intentionally outside tab-panel semantics.

---

## Final

### (A) Safe to auto-fix

| Finding ID | Scope                             | Why                                                                                |
| ---------- | --------------------------------- | ---------------------------------------------------------------------------------- |
| 2          | Page-level pagination / load-more | Backend and hook already expose cursor pagination; the active page dropped the UI. |
| 5          | Local i18n/a11y cleanup           | Small route-local change: localized region label and proper tab panel placement.   |

### (B) Needs planned phase

| Finding ID | Scope                                                  | Why                                                                                                                  |
| ---------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| 1          | Activity stream trust, visibility, and producer policy | Requires RLS/producer contract decisions, possible migration work, type regeneration, and live policy verification.  |
| 3          | Following workflow                                     | Requires product decision on where follows are created and whether active rows/detail pages expose follow controls.  |
| 4          | Realtime behavior                                      | Requires Supabase Realtime publication/RLS verification and careful query invalidation across All/Following filters. |

Summary: `/activity` is mounted and reachable from the active Sidebar Operations group. It renders `activity_stream`, not `audit_logs` or the per-dossier unified timeline. The generated DB types validate the table/column references used by the edge function, and the active `activity-feed` namespace has exact EN/AR key parity with no mounted dot-form leaks. The main defects are at the workflow contract boundaries: the global feed trusts denormalized activity rows under weak insert/visibility policies, the active page discards the existing cursor pagination contract, the Following tab has no active follow affordance, and realtime is polling-only.

Recommended phase order: first harden the `activity_stream` producer/RLS/visibility model; then restore route-level pagination; then decide and implement the follow workflow; then add realtime if product requires live updates; finally land the local i18n/a11y cleanup.
