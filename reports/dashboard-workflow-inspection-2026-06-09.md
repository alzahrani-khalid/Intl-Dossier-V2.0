# Dashboard Workflow Inspection Report

**Date:** Tue 9 Jun 2026  
**Scope:** Read-only code + schema contract inspection of `/dashboard` (analyst home)  
**Branch:** `quick/260608-c9b-country-dossier-workflow-fixes`  
**Constraint:** No source edits; findings only.

---

## Scope

Traced the full render tree and data plane for the global analyst dashboard.

### Route entry

| Layer         | Path                                                                                                            |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| Route         | `frontend/src/routes/_protected/dashboard.tsx` → URL `/dashboard`                                               |
| Page composer | `frontend/src/pages/Dashboard/index.tsx`                                                                        |
| Layout shell  | `frontend/src/routes/_protected.tsx` → `AppShell`, `OnboardingTourTrigger`, `DossierDrawer`, `CommitmentDrawer` |

### Widgets mounted on `/dashboard` (Phase 38 composer)

| Widget               | File                             | Primary data hook(s)                                               |
| -------------------- | -------------------------------- | ------------------------------------------------------------------ |
| `DashboardHero`      | `components/DashboardHero.tsx`   | `useAuth` (no query)                                               |
| `KpiStrip`           | `widgets/KpiStrip.tsx`           | `useDashboardStats`                                                |
| `WeekAhead`          | `widgets/WeekAhead.tsx`          | `useWeekAhead` → `useUpcomingEvents`                               |
| `RecentDossiers`     | `widgets/RecentDossiers.tsx`     | `useDossierStore` (local Zustand)                                  |
| `OverdueCommitments` | `widgets/OverdueCommitments.tsx` | `usePersonalCommitments` → `useCommitments` + dossier lookup query |
| `SlaHealth`          | `widgets/SlaHealth.tsx`          | `useDashboardStats` + `useDashboardTrends`                         |
| `Digest`             | `widgets/Digest.tsx`             | `useDashboardDigest`                                               |
| `ForumsStrip`        | `widgets/ForumsStrip.tsx`        | `useForums`                                                        |
| `VipVisits`          | `widgets/VipVisits.tsx`          | `useVipVisits` → `useUpcomingEvents`                               |
| `MyTasks`            | `widgets/MyTasks.tsx`            | `useTasks` + `useUpdateTask`                                       |

### Route-level siblings (not in grid)

| Component                | File                                    | Data                                                |
| ------------------------ | --------------------------------------- | --------------------------------------------------- |
| `FirstRunModal`          | `components/FirstRun/FirstRunModal.tsx` | `useFirstRunCheck` + `populate_diplomatic_seed` RPC |
| Lazy `Suspense` fallback | `dashboard.tsx:102-107`                 | —                                                   |

### TanStack Query keys observed

| Key prefix                                 | Hook / consumer                            |
| ------------------------------------------ | ------------------------------------------ |
| `['first-run-check']`                      | `useFirstRunCheck`                         |
| `['operations-hub', 'stats', userId]`      | `useDashboardStats` → KpiStrip, SlaHealth  |
| `['operations-hub', 'timeline', userId]`   | `useUpcomingEvents` → WeekAhead, VipVisits |
| `['dashboard-trends', range]`              | `useDashboardTrends` → SlaHealth           |
| `['dashboard', 'dashboard-digest', limit]` | `useDashboardDigest`                       |
| `['forums', filters]`                      | `useForums`                                |
| `commitmentKeys.list(filters)`             | `useCommitments` → OverdueCommitments      |
| `['dossiers-for-commitments', dossierIds]` | `usePersonalCommitments` (batched lookup)  |
| `tasksKeys.list(filters)`                  | `useTasks` → MyTasks                       |

### Backend / Supabase surfaces

| Surface                        | Used by                                                      |
| ------------------------------ | ------------------------------------------------------------ |
| RPC `check_first_run`          | `useFirstRunCheck` (`20260407000003_check_first_run.sql`)    |
| RPC `populate_diplomatic_seed` | `FirstRunModal`                                              |
| RPC `get_dashboard_stats`      | `getDashboardStats` / KpiStrip, SlaHealth                    |
| RPC `get_upcoming_events`      | `getUpcomingEvents` / WeekAhead, VipVisits                   |
| Table `dashboard_digest`       | `useDashboardDigest`                                         |
| View `unified_work_items`      | `useDashboardTrends` (client-side bucketing)                 |
| View `unified_work_items_view` | `get_dashboard_stats` RPC only (**not** used by trends hook) |
| Tables `dossiers`, `forums`    | `useForums`                                                  |
| Table `aa_commitments`         | `useCommitments`                                             |
| Edge function `tasks-get`      | `tasksAPI.getTasks` / MyTasks                                |

### i18n namespaces

| Namespace           | Consumers on this route            |
| ------------------- | ---------------------------------- |
| `dashboard-widgets` | All grid widgets + `DashboardHero` |
| `sample-data`       | `FirstRunModal`                    |

Both namespaces are registered in `frontend/src/i18n/index.ts` (EN + AR JSON present).

### Legacy / unrouted code (same folder, not mounted by Phase 38 composer)

`pages/Dashboard/components/`: `AttentionZone`, `TimelineZone`, `EngagementsZone`, `ActivityFeed`, `QuickStatsBar`, `RoleSwitcher`, `ActionBar`, `AnalyticsWidget`, etc. — Phase 10 Operations Hub zones replaced by widget grid but files remain exported from `components/index.ts`.

---

## Environment

| Service           | URL                            | Status (this pass) |
| ----------------- | ------------------------------ | ------------------ |
| Frontend (Vite)   | `http://127.0.0.1:5175`        | HTTP 200           |
| Backend (Express) | `http://127.0.0.1:5001/health` | HTTP 200           |

**Browser / login:** Not performed. Inspection is code + schema-contract only (per instruction when headless login is impractical). Test credentials exist in `.env.test` but were not used.

**Onboarding interaction:** `_protected.tsx` mounts `OnboardingTourTrigger` (same `intl-dossier-onboarding-seen` key as `dashboard.tsx`). `FirstRunModal` is intentionally gated until the tour completes — by design, not a bug.

---

## Findings

### 1. **HIGH** — “View all” VIP link targets a non-existent route

**Location:** `frontend/src/pages/Dashboard/widgets/VipVisits.tsx:128`

**Root cause:** Plain `<a href="/vip-visits">` is used. No matching file under `frontend/src/routes/` (grep across routes returns zero hits).

**Suggested fix:** Replace with TanStack Router navigation to a real route (e.g. engagements list filtered to VIP, or a new `/vip-visits` route). Example:

```tsx
import { Link } from '@tanstack/react-router'
// ...
<Link to="/engagements" search={{ vip: true }} className="text-xs text-ink-soft inline-flex items-center gap-1">
```

(Exact search params depend on engagements index support.)

---

### 2. **HIGH** — KPI deltas are hardcoded fiction, not derived from data

**Location:** `frontend/src/pages/Dashboard/widgets/KpiStrip.tsx:64-96` (especially `delta` / `trend` literals on lines 71-94)

**Root cause:** Comment admits Phase 42 deferred work: `useDashboardStats` returns counts only; widget always renders `+2`, `−4`, `+2`, `+1` regardless of API payload. Tests encode this as expected behavior (`KpiStrip.test.tsx:54`).

**Suggested fix:** Either remove delta chips until `get_dashboard_stats` (or a new RPC) returns week-over-week deltas, or compute deltas client-side from a trends query. Minimal honest fix:

```tsx
// Remove delta/trend from cards until real data exists
const cards: ReadonlyArray<KpiCard> = [
  { label: t('kpi.activeEngagements'), value: data.active_engagements, meta: t('kpi.activeMeta') },
  // ...
]
```

---

### 3. **HIGH** — KPI subtitle meta strings are static marketing copy, not live metrics

**Location:** `frontend/src/i18n/en/dashboard-widgets.json:21-24` (and AR mirror `ar/dashboard-widgets.json:21-24`); consumed at `KpiStrip.tsx:70,77,84,92`

**Root cause:** Strings like `"5 this week · 3 travel"` and `"4 breached · 5 amber"` are fixed i18n text while numeric KPI values come from `get_dashboard_stats`. Arabic copies use Eastern Arabic numerals for the same static fiction.

**Suggested fix:** Drive meta from RPC (extend `get_dashboard_stats` return type) or drop meta lines until available:

```json
"activeMeta": "{{weekCount}} this week · {{travelCount}} travel"
```

```tsx
meta: t('kpi.activeMeta', {
  weekCount: data.week_engagements ?? 0,
  travelCount: data.travel_count ?? 0,
})
```

**VERIFY vs live:** Confirm whether `get_dashboard_stats` can be extended without breaking existing RPC consumers on staging.

---

### 4. **HIGH** — SLA sparkline silently shows random mock data on query failure

**Location:** `frontend/src/hooks/useDashboardTrends.ts:117-122`

**Root cause:** `fetchTrends` errors are caught and `generateMockTrends` returns `Math.random()`-based series. `SlaHealth` has no `trends.isError` branch; failed queries look like real SLA load.

**Suggested fix:** Remove mock fallback; surface error/empty state in `SlaHealth`:

```ts
queryFn: () => fetchTrends(range),
// delete generateMockTrends catch
```

```tsx
if (trends.isError) {
  return (/* same error shell as stats.isError */)
}
```

---

### 5. **HIGH** — Overdue commitment owner initials derived from UUID, not user name

**Location:** `frontend/src/hooks/usePersonalCommitments.ts:167`

**Root cause:** `deriveInitials(c.owner_user_id ?? '')` passes a UUID. `deriveInitials` splits on whitespace and takes first letters — for a UUID this yields garbage (e.g. `"8F"` from hex), not assignee initials.

**Suggested fix:** Join `users` (or map from `owner_user_id` batch query) and call `deriveInitials(fullName)`:

```ts
ownerInitials: deriveInitials(ownerNameById.get(c.owner_user_id ?? '') ?? ''),
```

**VERIFY vs live:** Confirm `users.full_name` is populated for commitment owners in staging.

---

### 6. **MEDIUM** — Missing i18n key `overdue.owner`

**Location:** `frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx:181`

**Root cause:** `t('overdue.owner')` is used for `aria-label`, but neither `en/dashboard-widgets.json` nor `ar/dashboard-widgets.json` defines `overdue.owner` (grep returns no matches). i18next will echo the key string in both locales.

**Suggested fix:** Add to both locale files:

```json
"overdue": {
  "title": "...",
  "owner": "Owner",
  ...
}
```

```json
"owner": "المسؤول"
```

---

### 7. **MEDIUM** — Overdue commitments open dossier drawer as `country` for every dossier type

**Location:** `frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx:105-113,145-147`

**Root cause:** `handleHeadClick` falls back to `'country'` when `dossierType` is absent; `DossierGlyph` is always `type="country"`. `usePersonalCommitments` never sets `dossierType` on grouped rows (only optional extension type in widget). Non-country dossiers open the wrong drawer route segment.

**Suggested fix:** Extend dossier lookup select with `type` from `dossiers` and propagate:

```ts
.select('id, name_en, name_ar, metadata, type')
// ...
dossierType: dossierRow?.type ?? 'country',
```

```tsx
<DossierGlyph type={resolvedType} iso={group.dossierFlag} ... />
```

**VERIFY vs live:** `dossiers.type` enum matches `DossierDrawer` allowed types in `_protected.tsx:14-23`.

---

### 8. **MEDIUM** — Overdue widget capped at 20 commitments with no pagination

**Location:** `frontend/src/hooks/usePersonalCommitments.ts:86-93` → `useCommitments` → `getCommitments` default `limit: 20` (`commitments.service.ts:48`)

**Root cause:** Widget groups overdue items client-side but the upstream query only fetches the first page (20 rows, ordered by `due_date`). Additional overdue commitments never appear.

**Suggested fix:** Pass `overdue: true` and a higher `limit`, or use `useInfiniteCommitments`:

```ts
useCommitments({
  ownerId: user?.id,
  ownerType: 'internal',
  overdue: true,
  status: ['pending', 'in_progress', 'overdue'],
  // extend CommitmentFilters + service to accept limit
})
```

---

### 9. **MEDIUM** — First-run seed invalidation misses Operations Hub query keys

**Location:** `frontend/src/components/FirstRun/FirstRunModal.tsx:60-71`

**Root cause:** After `populate_diplomatic_seed`, invalidation lists `['dashboard-trends']`, `['tasks']`, etc., but **not** `['operations-hub', ...]` (`operationsHubKeys` in `useAttentionItems.ts:18-29`). KpiStrip / WeekAhead / VipVisits / SlaHealth stats can show stale zeros until `staleTime` (5 min) or manual refresh.

**Suggested fix:**

```ts
void queryClient.invalidateQueries({ queryKey: ['operations-hub'] })
void queryClient.invalidateQueries({ queryKey: ['dashboard', 'dashboard-digest'] })
void queryClient.invalidateQueries({ queryKey: ['first-run-check'] })
```

---

### 10. **MEDIUM** — SlaHealth donut mixes incompatible domains (intake SLA vs unified work items)

**Location:** `frontend/src/pages/Dashboard/widgets/SlaHealth.tsx:74-78`; RPC `get_dashboard_stats` (`supabase/migrations/20260330000001_operations_hub_rpcs.sql:303-320`)

**Root cause:** `sla_at_risk` counts `intake_tickets` with SLA tracking; `open_tasks` counts `unified_work_items_view` rows. Widget computes `ok = open_tasks - sla_at_risk`, which subtracts intake SLA rows from all work-item rows — not a coherent SLA health model. `bad` is hardcoded `0` (line 76).

**Suggested fix:** Align widget with a single RPC that returns `{ ok, risk, bad }` bands for the same population, or relabel legend to match intake-only SLA scope.

**VERIFY vs live:** Confirm product intent for “SLA Health” on analyst home (intake-only vs all work items).

---

### 11. **MEDIUM** — KPI label “Open Commitments” displays unified work-item count

**Location:** `frontend/src/pages/Dashboard/widgets/KpiStrip.tsx:75-76`; RPC column `open_tasks` (`operations_hub_rpcs.sql:303-309`)

**Root cause:** UI copy says commitments; RPC counts all non-completed items in `unified_work_items_view` (tasks, commitments, intake, etc.). Misleading for analysts.

**Suggested fix:** Rename key to `kpi.openWorkItems` or add a separate RPC field for commitment-only count.

---

### 12. **MEDIUM** — MyTasks may fetch before assignee is known

**Location:** `frontend/src/pages/Dashboard/widgets/MyTasks.tsx:77-78`

**Root cause:** `const userId = user?.id ?? ''` and `useTasks({ assignee_id: userId })` with no `enabled: !!user?.id`. Edge function defaults `filter` to `'all'` (`tasks-get/index.ts:78-109`). Empty `assignee_id` is ignored (`tasks-get/index.ts:113-115`), so the first fetch can return all RLS-visible tasks (up to `page_size` 50).

**Suggested fix:**

```tsx
const { data, isLoading, isError } = useTasks(
  { assignee_id: user!.id, filter: 'assigned' },
  { enabled: Boolean(user?.id) },
)
```

(Adjust `useTasks` signature if needed to accept TanStack `enabled`.)

---

### 13. **MEDIUM** — `useDashboardTrends` pulls full row sets client-side (performance)

**Location:** `frontend/src/hooks/useDashboardTrends.ts:40-50`

**Root cause:** Two `select('created_at')` / `select('completed_at')` queries over `unified_work_items` for 30 or 90 days with no server-side `count` aggregation or limit. Large tenants transfer every row to the browser for bucketing.

**Suggested fix:** Add SQL RPC `get_work_item_trends(p_days int)` returning daily counts, or use Supabase `.rpc()` with grouped date truncation.

**VERIFY vs live:** Check row counts in `unified_work_items` on staging for realistic payload size.

---

### 14. **MEDIUM** — Bureau KPI cards use drop-shadow (design-system violation)

**Location:** `frontend/src/pages/Dashboard/widgets/dashboard.css:830-835`

**Root cause:** `.dir-bureau .kpi { box-shadow: 0 1px 2px rgba(60, 40, 20, 0.04); }` violates IntelDossier rule: flat cards, no card shadows (shadow reserved for drawers / hovered rows).

**Suggested fix:** Remove `box-shadow` from `.dir-bureau .kpi` and `.dir-bureau .kcard` (lines 905-908).

---

### 15. **LOW** — Legacy Operations Hub zone components are dead on `/dashboard`

**Location:** `frontend/src/pages/Dashboard/components/*.tsx` (exported via `components/index.ts`)

**Root cause:** Phase 38 `Dashboard/index.tsx` no longer imports `AttentionZone`, `TimelineZone`, `EngagementsZone`, `ActivityFeed`, or `QuickStatsBar`. ~15 component files remain maintained but unrouted on the analyst home path.

**Suggested fix:** Archive behind `/dashboard/project-management` or delete after confirming no other imports (planned phase).

---

### 16. **LOW** — WeekAhead always renders country glyph for engagements

**Location:** `frontend/src/pages/Dashboard/widgets/WeekAhead.tsx:86`

**Root cause:** `DossierGlyph type="country"` regardless of `event_type` / engagement type.

**Suggested fix:** Map `event.engagement_type` or dossier type when RPC exposes it; default `engagement`.

---

### 17. **LOW** — MyTasks uncheck resets status to `pending` always

**Location:** `frontend/src/pages/Dashboard/widgets/MyTasks.tsx:106-110`

**Root cause:** Toggle off sends `{ status: 'pending' }` even if task was `in_progress` or `review`.

**Suggested fix:** Track prior status or send `workflow_stage: 'todo'` + matching `status` per tasks table conventions (`tasks-api.ts:471-472` sets both on complete).

---

### 18. **LOW** — `usePersonalCommitments` loading ignores dossier lookup query

**Location:** `frontend/src/hooks/usePersonalCommitments.ts:176-179`

**Root cause:** `isLoading` reflects only `useCommitments`, not `dossiersQuery.isLoading`. Widget can render groups with `dossierName` fallback to raw `dossier_id` briefly.

**Suggested fix:** `isLoading: query.isLoading || dossiersQuery.isLoading`

---

### 19. **LOW** — Route Suspense spinner uses `border-primary` token

**Location:** `frontend/src/routes/_protected/dashboard.tsx:105`

**Root cause:** Spinner uses shadcn/Tailwind `border-primary` rather than documented accent token utilities (`border-accent` / `var(--accent)`).

**Suggested fix:** `className="... border-accent border-t-transparent"` or shared `GlobeSpinner` from design system.

---

### 20. **LOW** — Forums status badge can leak raw English enum

**Location:** `frontend/src/pages/Dashboard/widgets/ForumsStrip.tsx:103`

**Root cause:** `t(\`forums.status.${status}\`, status)`falls back to raw`status`string when enum value is not in JSON (only`active`, `scheduled`, `archived` defined).

**Suggested fix:** Add missing status keys or use `defaultValue: t('forums.status.unknown')` without English enum fallback.

---

## Safe-to-auto-fix vs Needs-planned-phase

### (A) Safe small fixes (can apply now)

1. Add missing `overdue.owner` i18n key (EN + AR) — Finding 6
2. Remove or gate KPI hardcoded deltas until data exists — Finding 2
3. Remove `useDashboardTrends` mock fallback; show error/empty in SlaHealth — Finding 4
4. Fix `deriveInitials` to use owner display name — Finding 5
5. Add `enabled: !!user?.id` + `filter: 'assigned'` on MyTasks — Finding 12
6. Extend FirstRunModal invalidation with `['operations-hub']` and digest keys — Finding 9
7. Fix VipVisits link to existing TanStack route — Finding 1
8. Merge `dossiersQuery.isLoading` into `usePersonalCommitments` — Finding 18
9. Remove bureau KPI `box-shadow` in `dashboard.css` — Finding 14
10. Replace `border-primary` in dashboard Suspense fallback — Finding 19
11. Forums status unknown-key handling — Finding 20

### (B) Needs planned phase (schema, RPC, routing, or product decisions)

1. Extend `get_dashboard_stats` (or new RPC) for KPI meta + deltas — Findings 2, 3
2. SlaHealth semantic model / `bad` band / single-domain counts — Finding 10
3. Rename or split “Open Commitments” vs `open_tasks` — Finding 11
4. Propagate dossier `type` into overdue groups + glyph — Finding 7
5. Overdue commitments pagination / `overdue: true` server filter — Finding 8
6. `get_work_item_trends` RPC to replace client-side full-table scan — Finding 13
7. Create `/vip-visits` route or engagements VIP filter UX — Finding 1 (if no suitable route exists)
8. Remove or repurpose legacy `pages/Dashboard/components/*` Operations Hub zones — Finding 15
9. WeekAhead dossier-type-aware glyphs — Finding 16
10. MyTasks status restore on uncheck — Finding 17

---

## Summary

The Phase 38 dashboard composer is wired and mostly uses real Supabase RPCs/views with reasonable loading/error empty states per widget. The highest-impact issues for analyst trust are **fabricated KPI deltas/meta**, **random SLA sparkline fallback**, the **broken VIP “view all” link**, and **incorrect overdue owner initials**. Data-contract drift appears between KPI labels (`open_tasks` vs “commitments”), SlaHealth’s mixed intake/work-item math, and overdue dossier typing defaulting to `country`. No CRITICAL runtime crash paths were found in static review; most failures degrade to empty/error states except the trends mock path (Finding 4).
