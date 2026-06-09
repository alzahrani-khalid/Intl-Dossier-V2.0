# Working Group Dossier Workflow Inspection

**Date:** 2026-06-09  
**Scope:** End-to-end `working_group` dossier workflow — list route (`useWorkingGroups`), detail shell (`DossierShell`), tabs, overview cards (`WorkingGroupOverviewTab`, `MemberListCard`, `MeetingScheduleCard`, `DeliverablesTrackerCard`), `working-group.types.ts`, member/deliverable/meeting data sources, `DossierGlyph`, activity timeline edge function  
**Method:** Static code trace against `frontend/src/types/database.types.ts`, TanStack Router routes, hooks, `dossier-overview.service.ts`, `supabase/migrations/20260110000006_working_groups_entity.sql`, `supabase/functions/dossiers-get`, `supabase/functions/dossier-activity-timeline`, and `frontend/src/i18n/{en,ar}/*.json`. No live staging RPC calls were executed.

---

## Workflow Map (Verified Live Path)

| Stage           | Entry                           | Primary implementation                                                                                                                                                       |
| --------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| List            | `/dossiers/working_groups`      | `frontend/src/routes/_protected/dossiers/working_groups/index.tsx` → `useWorkingGroups` → `search_working_groups` RPC → `ListPageShell` + `GenericListPage` + `DossierGlyph` |
| Legacy redirect | `/working-groups`               | `frontend/src/routes/_protected/working-groups.tsx` → redirects to `/dossiers/working_groups`                                                                                |
| Detail shell    | `/dossiers/working_groups/$id`  | `frontend/src/routes/_protected/dossiers/working_groups/$id.tsx` → `DossierShell` (`dossierType="working_group"`) + nested `<Outlet />`                                      |
| Default tab     | `/dossiers/working_groups/$id/` | Redirects to `overview`                                                                                                                                                      |
| Tabs (routed)   | URL segments                    | `DossierTabNav` base tabs only (no `extraTabs`): `overview`, `engagements`, `docs`, `tasks`, `timeline`, `audit` — **no `members`, `meetings`, or `deliverables` routes**    |
| Overview        | `overview`                      | `WorkingGroupOverviewTab` → `SharedSummaryStatsCard`, `DossierAnalyticsCard`, `MemberListCard`, `MeetingScheduleCard`, `DeliverablesTrackerCard`, `SharedRecentActivityCard` |
| Timeline        | `timeline`                      | `DossierActivityTimeline` → `useDossierActivityTimeline` → edge function `dossier-activity-timeline` (work items only)                                                       |
| Extension load  | Detail fetch                    | `dossiers-get` edge function selects `working_groups.*` by dossier id — **no embedded members/deliverables/meetings**                                                        |

**Superseded (not routed):** `WorkingGroupDossierPage`, `WorkingGroupDossierDetail`, `frontend/src/pages/WorkingGroupsPage.tsx` — no imports from current working-group dossier routes.

**Glyphs:** List and shell use `DossierGlyph` with `type="working_group"`. Per `DossierGlyph.tsx` lines 183–190, `working_group` intentionally falls back to initials (not a defect).

**RTL (active path):** No `ml-*` / `mr-*` / `pl-*` / `pr-*` / physical `left`/`right` in the inspected working-group list, overview tab, or overview cards. Directional icons use `rotate-180` under RTL where applicable.

---

## Findings

### 1. CRITICAL — `search_working_groups` and `get_working_group_full` reference nonexistent `dossiers.summary_*` columns

**Location:**

- `supabase/migrations/20260110000006_working_groups_entity.sql` lines 297–298, 442–443, 467–468 (`d.summary_en`, `d.summary_ar`)
- `frontend/src/hooks/useWorkingGroups.ts` lines 71–79 (list calls `search_working_groups`), lines 272–274 (update refetches via `get_working_group_full`)
- `frontend/src/types/database.types.ts` lines 9388–9417 (`dossiers` row has `description_en` / `description_ar` only)

**Why it is a real bug:** Migration `20251022000001_create_unified_dossiers.sql` recreated `dossiers` with `description_en` / `description_ar` and no `summary_en` / `summary_ar`. The working-group RPCs still SELECT and ILIKE `d.summary_en`. PostgreSQL will raise `column d.summary_en does not exist` when these functions execute. The list hook surfaces this as a query error, so `/dossiers/working_groups` cannot load rows. Updates that refetch through `get_working_group_full` fail after a successful partial write.

**Recommended fix:** Add a migration that replaces both functions to use `d.description_en AS summary_en` and `d.description_ar AS summary_ar` (or rename return fields to `description_*` and update `WorkingGroup` types + UI). Re-deploy RPCs to staging and regenerate `database.types.ts`.

---

### 2. HIGH — `useUpdateWorkingGroup` writes `summary_en` / `summary_ar` to `dossiers` (column mismatch)

**Location:** `frontend/src/hooks/useWorkingGroups.ts` lines 228–242

**Why it is a real bug:** Create correctly maps summaries to `description_en` / `description_ar` (lines 144–145), but update sets `dossierUpdates.summary_en` and `dossierUpdates.summary_ar` on the `dossiers` table. PostgREST rejects unknown columns or silently drops them depending on configuration; either way summary edits from the update mutation do not persist. This contradicts the live schema in `database.types.ts`.

**Recommended fix:** Mirror create: map `data.summary_en` → `description_en`, `data.summary_ar` → `description_ar` in `dossierUpdates`. Align `WorkingGroup` TypeScript fields with one naming convention (`description_*` or aliased `summary_*` at the API boundary only).

---

### 3. HIGH — List page displays dossier lifecycle status instead of working-group operational status

**Location:** `frontend/src/routes/_protected/dossiers/working_groups/index.tsx` lines 63–69

**Why it is a real bug:** The RPC returns both `status` (dossier: `active` / `inactive` / `archived` / `deleted`) and `wg_status` (`active` / `suspended` / `disbanded`). The list binds `wg.status` for chip class and `working-groups:status.${statusKey}` labels. New working groups are created with dossier `status: 'active'` while operational state lives in `wg_status`. A suspended or disbanded group still shows “Active” on the list unless someone also changed dossier status. `WG_STATUS_TONE` keys (`completed`, `on_hold`) do not match either enum, so tone mapping is misleading for real values.

**Recommended fix:** Use `wg.wg_status` (fallback `wg.status`) for label and chip. Extend `WG_STATUS_TONE` to `active`, `suspended`, `disbanded`, and dossier statuses if needed. Pass `wg_status` (not dossier `status`) to `p_status` or add `p_wg_status` to the RPC filter.

---

### 4. HIGH — `MemberListCard` reads dossier relationships, not `working_group_members`

**Location:**

- `frontend/src/pages/dossiers/overview-cards/MemberListCard.tsx` lines 30–55
- DB: `working_group_members` table (`database.types.ts` ~29779)

**Why it is a real bug:** Working-group membership is stored in `working_group_members` (organization/person ids, roles, status). The card loads `useDossierOverview` with `related_dossiers` only and merges `by_relationship_type.has_member` and `partner`. Unless analysts manually create matching `dossier_relationships`, the card shows “No members linked” while the WG member table may contain rows. Role badges display raw relationship type strings, not `MemberRole` from the WG schema.

**Recommended fix:** Add an overview section (or hook) that queries `working_group_members` with org/person name joins, or call `get_working_group_full` and map its `members` array. Use `working-groups:memberRoles.*` for role labels.

---

### 5. HIGH — `MeetingScheduleCard` reads `calendar_events`, not `working_group_meetings`

**Location:**

- `frontend/src/pages/dossiers/overview-cards/MeetingScheduleCard.tsx` lines 27–44
- `search_working_groups` RPC lines 454–455 (computes `next_meeting_date` from `working_group_meetings`)

**Why it is a real bug:** WG meetings live in `working_group_meetings` (`meeting_date`, `status`, agenda fields). The card only reads `calendar_events.upcoming` from the generic overview service. Unless every WG meeting is duplicated into `calendar_events`, the card stays empty while the RPC and `working_group_stats` view already aggregate real meeting data.

**Recommended fix:** Fetch upcoming rows from `working_group_meetings` where `working_group_id = dossierId` and `meeting_date > now()`, or expose meetings via `get_working_group_full` / a dedicated overview section.

---

### 6. HIGH — `DeliverablesTrackerCard` counts work items, not `working_group_deliverables`

**Location:**

- `frontend/src/pages/dossiers/overview-cards/DeliverablesTrackerCard.tsx` lines 30–64
- `working_group_deliverables` table and stats in `working_group_stats` view (migration lines 260–263)

**Why it is a real bug:** The card title says “Deliverables” but uses `work_items.status_breakdown` from `work_item_dossiers`. WG deliverables are a separate entity with their own status enum (`review`, `deferred`, etc.). Linked tasks and WG deliverables are not the same dataset; counts misrepresent WG output tracking.

**Recommended fix:** Query `working_group_deliverables` grouped by `status`, or use counts from `get_working_group_full` / `working_group_stats`. Keep work items on the Tasks tab only.

---

### 7. HIGH — `DossierAnalyticsCard` WG metrics map to unrelated overview stats

**Location:** `frontend/src/domains/analytics/hooks/useAnalyticsForDossier.ts` lines 112–123

**Why it is a real bug:** For `working_group`, “Members” uses `related_dossiers_count` and “Deliverables” uses `pending_work_items`. Those stats count all related dossiers and open work items, not `active_member_count` or deliverable totals from `working_group_stats` / RPC aggregates. Analysts see non-zero member counts from tangential relationships while the member card (finding 4) shows empty.

**Recommended fix:** Extend overview stats with `active_member_count`, `total_deliverables`, and `next_meeting_date` from `working_group_stats` or a WG-specific overview fetch; wire `extractMetrics` for `working_group` to those fields.

---

### 8. HIGH — Expected WG tabs (`members`, `meetings`, `deliverables`) are not routed

**Location:**

- `frontend/src/components/dossier/DossierTabNav.tsx` lines 33–40 (base tabs only)
- `frontend/src/routes/_protected/dossiers/working_groups/$id.tsx` lines 16–21 (no `extraTabs`)
- `frontend/src/i18n/en/working-groups.json` lines 260–266 (`sections.members`, `sections.meetings`, `sections.deliverables`)
- Routed tabs under `$id/`: `overview`, `engagements`, `docs`, `tasks`, `timeline`, `audit` only

**Why it is a real bug:** Product copy and types (`working-group.types.ts`, member/deliverable/meeting CRUD shapes) assume dedicated surfaces for members, meetings, and deliverables. The live shell exposes only shared dossier tabs. Overview cards partially substitute but use wrong data sources (findings 4–6). There is no deep-linkable place to manage WG membership or meeting records from the routed UI.

**Recommended fix:** Add `extraTabs` on `DossierShell` for `working_group` and create `$id/members.tsx`, `$id/meetings.tsx`, `$id/deliverables.tsx` routes wired to `working_group_members`, `working_group_meetings`, and `working_group_deliverables` with the hooks stubbed in `useWorkingGroups.ts`.

---

### 9. MEDIUM — Overview card i18n keys missing from `dossier` bundles (Arabic falls back to English)

**Location:**

- `MemberListCard.tsx` lines 65–71, 92–95
- `MeetingScheduleCard.tsx` lines 51–57, 71
- `DeliverablesTrackerCard.tsx` lines 51–62, 74–80
- `frontend/src/i18n/en/dossier.json` / `ar/dossier.json` — `overview` block has `membership`, `sessions`, etc., but **no** `overview.members`, `overview.meetings`, or `overview.deliverables`

**Why it is a real bug:** All three cards call `t('overview.members.*')`, `t('overview.meetings.*')`, and `t('overview.deliverables.*')` with English `defaultValue` strings. i18next resolves missing keys to those defaults, so Arabic locale renders English titles and empty states on the overview tab.

**Recommended fix:** Add mirrored keys under `overview.members`, `overview.meetings`, and `overview.deliverables` in both `en/dossier.json` and `ar/dossier.json` (or reuse existing `working-groups.json` keys via `useTranslation(['dossier', 'working-groups'])`).

---

### 10. MEDIUM — Activity timeline excludes WG-native events

**Location:**

- `supabase/functions/dossier-activity-timeline/index.ts` (work items via `work_item_dossiers` only)
- `frontend/src/routes/_protected/dossiers/working_groups/$id/timeline.tsx`

**Why it is a real bug:** The timeline tab shows linked tasks/commitments/intake only. It does not surface member joins, meeting schedules/completions, deliverable status changes, or rows from `working_group_decisions`. For working groups, “activity” appears sparse compared to domain tables populated by the WG entity migration.

**Recommended fix:** Extend the edge function (or add `dossier-wg-activity-timeline`) to union WG audit events from member/deliverable/meeting/decision tables, or merge them in a WG-specific timeline hook.

---

### 11. MEDIUM — `useWorkingGroups` ignores `wg_status` filter defined in types

**Location:**

- `frontend/src/types/working-group.types.ts` lines 464–472 (`WorkingGroupFilters.wg_status`)
- `frontend/src/hooks/useWorkingGroups.ts` lines 59–74 (only passes `status` as `p_status`)

**Why it is a real bug:** Filters type documents `wg_status`, but the hook never sends it to the RPC. `search_working_groups` filters `d.status = p_status`, not `wg.wg_status`. Any future UI that sets `wg_status` in filters will not affect results. The unrouted `WorkingGroupsPage` status dropdown uses dossier statuses (`inactive`, `archived`) while badges display `wg.wg_status` — a latent inconsistency if that page is re-linked.

**Recommended fix:** Add `p_wg_status` to the RPC and pass `filters.wg_status` from the hook; keep dossier archive filtering separate.

---

### 12. MEDIUM — Three incompatible `WorkingGroupExtension` contracts

**Location:**

- `frontend/src/lib/dossier-type-guards.ts` lines 299–309 (`members[]`, `mandate`, `start_date`)
- `frontend/src/services/dossier-api.ts` lines 119–126 (minimal WG fields, no members)
- `supabase/functions/dossiers-get/index.ts` lines 194–208 (raw `working_groups` row)
- `frontend/src/types/working-group.types.ts` (full domain model)

**Why it is a real bug:** `MemberOrganizations` and legacy detail components expect `extension.members` per type-guards, but `dossiers-get` returns DB columns (`mandate_en`, `wg_status`, …) with no embedded members array. TypeScript allows impossible shapes; runtime code reading `extension.members` always gets `undefined` on the live fetch path.

**Recommended fix:** Consolidate on `working-group.types.ts` + raw extension row. Remove or narrow `WorkingGroupExtension` in `dossier-type-guards.ts` to match `working_groups` columns. Populate members via separate query/RPC, not phantom `extension.members`.

---

### 13. MEDIUM — Member/deliverable/meeting hooks declared but not implemented

**Location:** `frontend/src/hooks/useWorkingGroups.ts` lines 320–330 (empty sections); query keys at lines 34–37

**Why it is a real bug:** File header and query-key factory promise CRUD for members, deliverables, meetings, and decisions. No `useWorkingGroupMembers`, `useWorkingGroupDeliverables`, or `useWorkingGroupMeetings` exports exist. `workingGroupKeys.full` is invalidated on update (line 280) but no `useWorkingGroupFull` query hook consumes it. Downstream UI cannot attach to the domain tables without duplicating fetch logic.

**Recommended fix:** Implement hooks against `working_group_members`, `working_group_deliverables`, `working_group_meetings`, and `get_working_group_full`, or delete unused keys and update the file comment to avoid false expectations.

---

### 14. LOW — Legacy WG detail stack is dead code with additional data bugs

**Location:**

- `frontend/src/pages/dossiers/WorkingGroupDossierPage.tsx`, `frontend/src/components/dossier/WorkingGroupDossierDetail.tsx` (no route imports)
- `frontend/src/components/dossier/sections/MeetingSchedule.tsx` lines 266–269 (`WorkingGroupSchedule` reads extension only when `dossier.type === 'forum'`)
- `frontend/src/components/dossier/sections/DeliverablesTracker.tsx` lines 22–24 (deliverables only for `forum`)
- `frontend/src/components/dossier/sections/MemberOrganizations.tsx` lines 29–34 (`extension.members`)
- `frontend/src/pages/WorkingGroupsPage.tsx` (802 lines, no route import)

**Why it is a real bug:** Not on the live path today, but re-wiring these without fixes would resurrect silent empty sections for working groups (schedule, deliverables, members) and an alternate CRUD page whose status filter semantics disagree with displayed `wg_status`.

**Recommended fix:** Delete or archive superseded components after porting any still-needed UX into routed tabs; if kept, fix `WorkingGroupSchedule` to read `working_groups.next_meeting_date` / `meeting_frequency` when `type === 'working_group'`, load deliverables from `working_group_deliverables`, and load members from `get_working_group_full`.

---

### 15. LOW — `DeliverablesTracker` section uses hardcoded English (legacy path)

**Location:** `frontend/src/components/dossier/sections/DeliverablesTracker.tsx` lines 35–38, 49–62

**Why it is a real bug:** Empty state and Kanban column labels are literal English strings, not `t()` calls. Only affects legacy `WorkingGroupDossierDetail`, not `DeliverablesTrackerCard` on the live overview (which uses i18n keys with English defaults per finding 9).

**Recommended fix:** Replace with `dossier` or `working-groups` namespace keys when/if the section is revived on a routed tab.

---

## Summary Counts

| Severity | Count |
| -------- | ----- |
| CRITICAL | 1     |
| HIGH     | 7     |
| MEDIUM   | 5     |
| LOW      | 2     |

**Highest-impact fix order:** (1) repair RPC column references so the list loads; (2) fix update summary column mapping; (3) wire overview cards and analytics to `working_group_*` tables; (4) add routed WG tabs and hooks; (5) add missing i18n keys for Arabic.

---

## Verified Non-Issues

- **DossierGlyph for `working_group`:** Initials fallback is documented and tested behavior, not a rendering defect.
- **RTL on active overview/list components:** Logical properties and `dir` usage are consistent; no physical left/right Tailwind violations found in scoped files.
- **`SharedSummaryStatsCard` / `SharedRecentActivityCard`:** Use generic dossier stats and work-item timeline; behavior is consistent with their shared design (not WG-specific, but not internally inconsistent).
