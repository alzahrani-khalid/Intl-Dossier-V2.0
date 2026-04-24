# Phase 38: dashboard-verbatim — Research

**Researched:** 2026-04-24
**Domain:** Dashboard verbatim port — 8 widgets, real data wiring, pixel-exact RTL/LTR × light/dark
**Confidence:** HIGH (handoff bundle verified restored; all upstream artifacts verified; hook inventory complete)

## Summary

Phase 38 is a **verbatim visual port** of `/tmp/inteldossier-handoff/inteldossier/project/src/dashboard.jsx` + `reference/dashboard.png` into the `/dashboard` route, replacing the existing `OperationsHub` wholesale. The handoff bundle **is restored** (verified: 11 source files + reference PNGs present). Phase 37's signature-visuals barrel ships all required primitives (`GlobeSpinner`, `Donut`, `Sparkline`, `DossierGlyph`, `GlobeLoader`, `FullscreenLoader`). Phase 36's AppShell + Phase 33's token engine handle direction/mode/hue/density inheritance — widgets only render; no theming logic inside widgets.

Three of the seven hooks referenced by Success Criteria **do not exist** (`useMyTasks`, `useRecentDossiers`, `useWeekAhead`, `usePersonalCommitments`). Per D-07, two adapter hooks (`useWeekAhead`, `usePersonalCommitments`) ship in Wave 0. The other two resolve to existing sources: `useTasks` (filtered to current user) replaces `useMyTasks`; `dossierStore.recentDossiers` replaces `useRecentDossiers`.

**Primary recommendation:** Execute 10 plans — Wave 0 infra (adapters + scaffold + baseline capture), Wave 1 with 8 parallel widget plans, Wave 2 E2E + OperationsHub deletion. All handoff CSS (`app.css` grid/spacing/chip rules) ports verbatim into `frontend/src/pages/Dashboard/widgets/dashboard.css` or equivalent token-mapped Tailwind.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01** Handoff bundle at `/tmp/inteldossier-handoff/inteldossier/` must be restored before planning runs. **VERIFIED RESTORED** by researcher: `project/src/dashboard.jsx`, `project/reference/dashboard.png`, `project/IntelDossier Redesign.html`, `project/src/app.css` all present.
- **D-02** Verbatim visual port: CSS grid, spacing, border radii, chips, widget ordering copied 1:1. Data wiring + RTL/a11y are additive only — no visual reinterpretation.
- **D-03** Replace `OperationsHub` outright. Rewrite `frontend/src/routes/_protected/dashboard.tsx` to mount new 8-widget dashboard. Preserve existing `FirstRunModal` + `useFirstRunCheck` + `useTourComplete` wiring verbatim at the route level.
- **D-04** Delete `frontend/src/pages/Dashboard/OperationsHub.tsx` and its `components/` subtree during Phase 38 cleanup. No `legacy/` archive — git history is archive.
- **D-05** All 8 widgets live in single `frontend/src/pages/Dashboard/widgets/` folder with barrel `index.ts`. File names: `KpiStrip.tsx`, `WeekAhead.tsx`, `OverdueCommitments.tsx`, `Digest.tsx`, `SlaHealth.tsx`, `VipVisits.tsx`, `MyTasks.tsx`, `RecentDossiers.tsx`, `ForumsStrip.tsx`.
- **D-06** Widgets import signature visuals from Phase 37 barrel `@/components/signature-visuals`.
- **D-07** Create two thin adapter hooks in Phase 38 scope:
  - `useWeekAhead` — derives day-grouped upcoming engagements for next 7 days.
  - `usePersonalCommitments` — thin wrapper over `useCommitments`, filtered to current user, grouped by dossier.
  - Both live in `frontend/src/hooks/`. Wave 0 infra.
- **D-08** Remaining widget data from existing hooks: `useDashboardStats`, `useDashboardTrends`, `useTasks`, `useForums`, `dossierStore.recentDossiers`. No mock data anywhere.
- **D-09** One plan per widget, ~10 plans: Wave 0 (`38-00-infra`), Wave 1 parallel (`38-01` through `38-08`), Wave 2 (`38-09-e2e`).
- **D-10** Wave 1 widget plans depend on `38-00` only; parallelizable.
- **D-11** Per-widget `<Skeleton>` placeholders that match each widget's shape. No global refetch spinner.
- **D-12** Empty states port verbatim when handoff specifies; otherwise fall back to existing `DashboardEmptyState.tsx` with per-widget copy keys.
- **D-13** Port handoff CSS grid rules verbatim for responsive reflow at 320 / 768 / 1280 px. No grid-template-columns improvisation.
- **D-14** Logical properties only (`ms-*`/`me-*`/`ps-*`/`pe-*`/`start-*`/`end-*`). Chevrons + directional glyphs mirror via existing Phase 34/37 RTL patterns. Arabic uses Tajawal cascade from Phase 35.
- **D-15** Heavier E2E: per-widget render + hooks-wiring (no mock strings in HTML) + axe-core WCAG AA + RTL smoke + reduced-motion GlobeSpinner + 8 visual regression baselines (4 directions × 2 modes) at 1280 px.
- **D-16** Playwright `toHaveScreenshot()` with `maxDiffPixelRatio: 0.02`. Baselines captured Wave 0.

### Claude's Discretion

- Widget ARIA landmarks & heading levels — follow Phase 37 `<section aria-labelledby>` pattern unless handoff dictates.
- Realtime subscriptions — existing 1s debounce on tasks/transitions is sufficient; add no new subscriptions in Phase 38.
- Digest "source" field — if handoff ships mock copy, researcher confirms real source (likely activity feed or intelligence digest table); document choice in plan.
- KpiStrip accent top-bar (DASH-01, card 3) — use Phase 33 `--accent` token; no custom color.

### Deferred Ideas (OUT OF SCOPE)

- Flag-switch / parallel rollout of new dashboard
- Co-located widgets per domain
- Grouped plans by data source (~5 plans)
- Lighter E2E (smoke + a11y only)
- Legacy OperationsHub archive folder
- Per-widget Supabase realtime subscriptions
- Custom/user-configurable dashboards (`pages/custom-dashboard/`)
- Kanban / Calendar / Lists / Dossier Drawer (Phases 39, 40, 41)

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                   | Research Support                                                                                                                  |
| ------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| DASH-01 | KpiStrip of 4 cards, third card has accent top-bar                            | Handoff dashboard.jsx L42–L64. Data: `useDashboardStats` returns `DashboardStats` with 4 counts — delta field TBD (assumption A1) |
| DASH-02 | WeekAhead grouped by day/date/time                                            | Handoff L66–L109. Data: new `useWeekAhead` adapter over `useUpcomingEvents` + `groupEventsByDay`                                  |
| DASH-03 | OverdueCommitments grouped by dossier, expand, severity dots, mono days       | Handoff L111–L149. Data: new `usePersonalCommitments` adapter over `useCommitments({ ownerId, ownerType:'internal' })`            |
| DASH-04 | Digest — tag + headline + source + animated refresh with GlobeSpinner overlay | Handoff L72–L110. GlobeSpinner from Phase 37 barrel. Source hook TBD (discretion / open question)                                 |
| DASH-05 | SlaHealth — Donut + legend + 14-day Sparkline                                 | Handoff L151–L187. Donut + Sparkline from Phase 37 barrel. Hook `useDashboardTrends` ships `7d/30d/90d` — adapter slices 14       |
| DASH-06 | VipVisits — T−N countdown + name + role + when                                | Handoff L189–L207. No dedicated hook; recommendation: filter `useUpcomingEvents` by type OR repository extension                  |
| DASH-07 | MyTasks — checkbox + glyph + title + due chip                                 | Handoff tail L47-L70. Data: `useTasks({ assignee_id: user.id })`; `tasksKeys.myTasks` already exists                              |
| DASH-08 | RecentDossiers + ForumsStrip (4 of 8 forums with monogram chips)              | Handoff tail L112–L161. Data: `dossierStore.recentDossiers` + `useForums({ limit: 4 })`                                           |
| DASH-09 | All widgets real data + layout at 320/768/1280 px + RTL                       | E2E wiring-asserts + 8 VR snapshots + breakpoint asserts                                                                          |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- HeroUI v3 first, then Aceternity → Kibo-UI → shadcn. Use `frontend/src/components/ui/heroui-*.tsx` wrappers (button, card, chip, skeleton, modal, forms).
- Mobile-first: base → sm → md → lg → xl. Min touch target 44×44 (`min-h-11 min-w-11`).
- Logical properties only: `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`, `text-end`, `rounded-s-*`, `rounded-e-*`. NEVER `ml-*/mr-*/pl-*/pr-*/left-*/right-*/text-left/text-right`.
- RTL directional icons: flip via `className={isRTL ? 'rotate-180' : ''}` or `scaleX(-1)` for SVGs.
- Work-item terminology: `assignee_id`, `deadline`, priority `low|medium|high|urgent` (NOT `critical`).
- Dossier-centric: use `getDossierRouteSegment`, `DossierContextBadge`, `isValidDossierType`.
- TS strict: explicit return types; no floating promises; no `any`; single quotes; no semicolons; 100 char line width.

## Architectural Responsibility Map

| Capability                                | Primary Tier                               | Secondary Tier           | Rationale                                            |
| ----------------------------------------- | ------------------------------------------ | ------------------------ | ---------------------------------------------------- |
| Route & Suspense/first-run gating         | Frontend SSR (TanStack Router)             | —                        | Route-level orchestration                            |
| Widget rendering & layout                 | Browser / Client                           | —                        | Client components consume React Query data           |
| Data fetching (hooks)                     | Browser / Client                           | API (Supabase PostgREST) | TanStack Query → Supabase SDK; no new backend routes |
| Data aggregation (group by day / dossier) | Browser / Client                           | —                        | Client-side; no new SQL views                        |
| Realtime invalidation                     | Browser / Client                           | DB (Supabase Realtime)   | Existing 1s debounce covers                          |
| Visual regression baselines               | CI (Playwright)                            | —                        | 8 baselines at 1280 px in repo                       |
| i18n (AR/EN copy)                         | Browser / Client                           | —                        | `dashboard-widgets.json` extension                   |
| Token/theme resolution                    | Browser / Client (DesignProvider CSS vars) | —                        | Phase 33 owns; widgets read `var(--accent)` etc.     |

## Standard Stack

| Library                 | Version | Purpose                         | Source                                |
| ----------------------- | ------- | ------------------------------- | ------------------------------------- |
| React                   | 19.x    | Runtime                         | [CITED: CLAUDE.md]                    |
| @tanstack/react-router  | v5      | Route layer                     | [CITED]                               |
| @tanstack/react-query   | v5      | All widget data                 | [VERIFIED: hook sigs]                 |
| @heroui/react           | v3 beta | Card/Chip/Skeleton/Button/Modal | [CITED: CLAUDE.md mandate]            |
| tailwindcss             | v4      | Logical-property styling        | [CITED]                               |
| i18next + react-i18next | latest  | AR/EN copy                      | [VERIFIED: files]                     |
| zustand                 | latest  | `dossierStore.recentDossiers`   | [VERIFIED]                            |
| date-fns                | latest  | Day grouping                    | [VERIFIED: used by useUpcomingEvents] |
| @playwright/test        | latest  | E2E + VR                        | [VERIFIED: Phase 37 used]             |
| @axe-core/playwright    | latest  | WCAG AA                         | [VERIFIED: Phase 37 used]             |

**No new dependencies required.** d3-geo/topojson/world-atlas already added Phase 37.

### Alternatives Considered

| Instead of                                    | Could Use                                  | Tradeoff                               |
| --------------------------------------------- | ------------------------------------------ | -------------------------------------- |
| Playwright toHaveScreenshot                   | Percy / Chromatic                          | External cost; rejected                |
| Client-side group in `usePersonalCommitments` | Server-side RPC                            | Migration cost; client-side sufficient |
| New `useMyTasks` hook                         | Thin filter over `useTasks({assignee_id})` | D-08 says use existing hook            |

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    /_protected/dashboard.tsx                        │
│  (ROUTE — preserves FirstRunModal + useFirstRunCheck +             │
│   useTourComplete wiring verbatim per D-03)                         │
│                                                                     │
│    <Suspense fallback={spinner}>                                    │
│      <Dashboard/>  ← NEW BODY (pages/Dashboard/index.tsx)           │
│        <PageHead/>                                                  │
│        <KpiStrip/>           ← useDashboardStats                   │
│        .dash-grid (handoff CSS verbatim):                          │
│          col-1:                                                     │
│            <WeekAhead/>          ← useWeekAhead     [ADAPTER]      │
│            <OverdueCommitments/> ← usePersonalCommitments [ADAPTER]│
│            <Digest/>             ← TBD (open question)             │
│          col-2:                                                     │
│            <SlaHealth/>          ← useDashboardTrends              │
│            <VipVisits/>          ← useUpcomingEvents (filtered)    │
│            <MyTasks/>            ← useTasks({ assignee_id })       │
│            <RecentDossiers/>     ← dossierStore selector           │
│            <ForumsStrip/>        ← useForums({ limit: 4 })         │
│    </Suspense>                                                      │
│    <FirstRunModal/>                                                 │
└─────────────────────────────────────────────────────────────────────┘

DATA FLOW:
  Supabase -> PostgREST -> service -> repository
       |
       v
  hook (useQuery) returning widget-shaped data
       |
       v
  Widget composes signature-visual primitives
  (GlobeSpinner, Donut, Sparkline, DossierGlyph) + HeroUI wrappers
  + token-driven CSS vars (--accent, --sla-ok, --ink, --pad)

LEGACY CUT (Wave 2):
  pages/Dashboard/OperationsHub.tsx          -> DELETE
  pages/Dashboard/components/*               -> DELETE (8 zone files)
```

### Recommended Project Structure

```
frontend/src/
├── routes/_protected/dashboard.tsx          # REWRITE body; keep FirstRunModal
├── pages/Dashboard/
│   ├── index.tsx                            # NEW — <Dashboard/> composer
│   ├── widgets/                             # NEW (D-05)
│   │   ├── index.ts                         # Barrel
│   │   ├── KpiStrip.tsx
│   │   ├── WeekAhead.tsx
│   │   ├── OverdueCommitments.tsx
│   │   ├── Digest.tsx
│   │   ├── SlaHealth.tsx
│   │   ├── VipVisits.tsx
│   │   ├── MyTasks.tsx
│   │   ├── RecentDossiers.tsx
│   │   ├── ForumsStrip.tsx
│   │   ├── dashboard.css                    # port of handoff grid/chip CSS
│   │   └── __tests__/                       # per-widget unit tests
│   ├── OperationsHub.tsx                    # DELETE Wave 2
│   └── components/                          # DELETE Wave 2
├── hooks/
│   ├── useWeekAhead.ts                      # NEW Wave 0
│   ├── usePersonalCommitments.ts            # NEW Wave 0
│   └── useDashboardTrends.ts                # existing
├── i18n/{en,ar}/
│   └── dashboard-widgets.json               # EXTEND
└── tests/e2e/
    └── dashboard.spec.ts                    # NEW Wave 2
```

### Pattern 1: Widget Shell

Each widget: named export, explicit `ReactElement` return, imports data hook, skeleton on loading, empty-state on empty data, content otherwise. Landmark `<section aria-labelledby>`.

### Pattern 2: Adapter Hook

Thin wrapper over existing hook + `useMemo` transformation. Returns `{ data, isLoading, isError }` shape.

### Anti-Patterns to Avoid

- Fetching inside widgets (no `supabase.from(...)` in widget bodies).
- `textAlign: 'right'` (banned by CLAUDE.md; use `text-start`/`text-end`).
- `ml-*/mr-*` (use logical properties).
- Improvising grid-template-columns (D-13: port verbatim).
- Adding new realtime subscriptions (discretion note says no).
- Wrapping widgets in HeroUI v2 `<Provider>` (v3 doesn't need one).
- `.reverse()` on arrays for RTL (forceRTL handles direction).

## Don't Hand-Roll

| Problem                 | Don't Build      | Use Instead                                             | Why                                      |
| ----------------------- | ---------------- | ------------------------------------------------------- | ---------------------------------------- |
| Day grouping            | Custom date math | `groupEventsByDay` from `useUpcomingEvents`             | Already shipped [VERIFIED]               |
| Donut chart             | Custom SVG       | `<Donut>` from signature-visuals                        | Phase 37 [VERIFIED: VIZ-05]              |
| Sparkline               | Custom polyline  | `<Sparkline>` from signature-visuals                    | RTL auto-flip built in [VERIFIED]        |
| Globe spinner           | Custom animation | `<GlobeSpinner>`                                        | Honors reduced-motion [VERIFIED: VIZ-03] |
| Country flag            | Custom img       | `<DossierGlyph>`                                        | 24 flags + fallbacks [VERIFIED: VIZ-04]  |
| HeroUI v3 Card/Skeleton | Raw divs         | `@/components/ui/*` re-exports                          | Token-driven [CITED: CLAUDE.md]          |
| Visual regression       | Manual review    | Playwright `toHaveScreenshot({maxDiffPixelRatio:0.02})` | Built-in, per direction×mode             |

**Key insight:** Phase 38 is composition. Every primitive, token, shell chrome, and data hook (except two adapters) already exists. Writing more than 8 widgets + 2 adapters + 1 route rewrite + 1 CSS port is a red flag.

## Common Pitfalls

### Pitfall 1: Sparkline double-flip in RTL

Phase 37's Sparkline auto-flips via `useLocale`. Do NOT wrap in `scaleX(-1)`.
**Warning sign:** Trailing dot lands on the left in Arabic.

### Pitfall 2: Donut in RTL

Donut is circular — no mirror transform needed. RTL only affects legend row order.

### Pitfall 3: Chevron icons not mirrored

Use semantic names (`arrow-forward` = visually back in RTL) OR `className={isRTL ? 'rotate-180' : ''}`.

### Pitfall 4: Mock/placeholder leakage

DASH-09 mandates zero mock data. CI grep-gate rejects handoff constants (`WEEK_AHEAD`, `OVERDUE`, `MY_TASKS`, etc.) in widget files. Empty-state renders `<EmptyState/>`, never sample text.

### Pitfall 5: Suspense boundary swallowing widget errors

Wrap widget bodies in React Query's `isError` check; render minimal error card. Do NOT `throw` inside widget body.

### Pitfall 6: Visual regression flakiness from font loading

Playwright test awaits `document.fonts.ready` and injects `prefers-reduced-motion: reduce` stylesheet before `toHaveScreenshot`.

### Pitfall 7: KpiStrip accent card 3 uses hardcoded color

Map to `var(--accent)` per Phase 33 token engine. Never literal color.

### Pitfall 8: Commitments `owner_type` shape mismatch

`useCommitments` filters via `owner_user_id.eq OR owner_contact_id.eq`. For internal-user scope, pass BOTH `ownerId: user.id` AND `ownerType: 'internal'`, else external contacts leak.

### Pitfall 9: `useDashboardTrends` range mismatch for 14-day Sparkline

Hook ships `'7d' | '30d' | '90d'`. Either extend union to `'14d'` OR pass `'30d'` and `.slice(-14)` in widget. Recommend slice.

## Runtime State Inventory

Not applicable — Phase 38 is greenfield widget creation + one route rewrite + legacy file deletion. No renames, no data migrations.

| Category            | Items                                         | Action    |
| ------------------- | --------------------------------------------- | --------- |
| Stored data         | None — no schema changes                      | None      |
| Live service config | None — no edge function changes               | None      |
| OS-registered state | None                                          | None      |
| Secrets/env vars    | None                                          | None      |
| Build artifacts     | Vite rebuilds on `OperationsHub.tsx` deletion | Automatic |

## Code Examples

### KpiStrip verbatim port with real hook

```tsx
// Source: handoff dashboard.jsx L42-L64, adapted for TS strict + HeroUI + real hook
import { type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useDashboardStats } from '@/domains/operations-hub/hooks/useDashboardStats'
import { useAuth } from '@/hooks/useAuth'

export function KpiStrip(): ReactElement {
  const { t } = useTranslation('dashboard-widgets')
  const { user } = useAuth()
  const { data, isLoading } = useDashboardStats(user?.id)

  if (isLoading || !data) return <KpiStripSkeleton />

  const cards = [
    {
      label: t('kpi.activeEngagements'),
      value: data.active_engagements,
      meta: t('kpi.activeMeta'),
    },
    { label: t('kpi.openCommitments'), value: data.open_tasks, meta: t('kpi.openMeta') },
    { label: t('kpi.slaAtRisk'), value: data.sla_at_risk, meta: t('kpi.slaMeta'), accent: true },
    { label: t('kpi.weekAhead'), value: data.upcoming_this_week, meta: t('kpi.weekAheadMeta') },
  ]

  return (
    <div className="kpi-strip" role="group" aria-label={t('kpi.strip')}>
      {cards.map(
        (k, i): ReactElement => (
          <div key={i} className={`kpi ${k.accent ? 'kpi-accent' : ''}`}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-meta">{k.meta}</div>
          </div>
        ),
      )}
    </div>
  )
}
```

### GlobeSpinner overlay pattern (Digest refresh)

```tsx
// handoff dashboard.jsx L72-L110; GlobeSpinner honors prefers-reduced-motion (VIZ-03)
{
  busy && (
    <div
      aria-busy="true"
      className="digest-overlay"
      style={{
        position: 'absolute',
        inset: 0,
        background: 'color-mix(in srgb, var(--surface) 70%, transparent)',
        backdropFilter: 'blur(1px)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 2,
      }}
    >
      <GlobeSpinner size={28} />
    </div>
  )
}
```

## State of the Art

| Old                               | Current                     | Changed  | Impact                                                                      |
| --------------------------------- | --------------------------- | -------- | --------------------------------------------------------------------------- |
| OperationsHub role-adaptive zones | 8 fixed widgets per handoff | Phase 38 | No role adaptivity; revisit post-launch if stakeholders complain (deferred) |
| Per-widget mock fallback          | Real data or skeleton/empty | DASH-09  | Data integrity enforced                                                     |
| Fullscreen spinner on refetch     | Per-widget Skeleton         | D-11     | Better perceived performance                                                |

**Deprecated/to-delete Wave 2:** `pages/Dashboard/OperationsHub.tsx`, `pages/Dashboard/components/{ActionBar,ZoneCollapsible,AttentionZone,TimelineZone,EngagementsZone,QuickStatsBar,ActivityFeed,AnalyticsWidget}.tsx`, plus any `*.test.tsx` siblings.

## Hook Audit (Research Focus #1)

| Hook                     | Exists? | Path                                                             | Shape                                                 | Widget need                                                                | Action                                                                                                                                                                                                                                     |
| ------------------------ | ------- | ---------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | ----------------------------------------------------------------------- |
| `useDashboardStats`      | ✓       | `frontend/src/domains/operations-hub/hooks/useDashboardStats.ts` | `UseQueryResult<DashboardStats>` — 4 counts confirmed | KpiStrip: 4 counts + delta + meta                                          | **Delta field TBD (A1)** — plan `38-01` starts with TS check; if absent, extend repository                                                                                                                                                 |
| `useDashboardTrends`     | ✓       | `frontend/src/hooks/useDashboardTrends.ts`                       | `UseQueryResult<TrendDataPoint[]>`, `range:'7d'       | '30d'                                                                      | '90d'`                                                                                                                                                                                                                                     | 14-day series | Pass `'30d'` and `.slice(-14)` in widget (simpler than union extension) |
| `useWeekAhead`           | ✗       | —                                                                | —                                                     | Day-grouped engagements with title/glyph/counterpart/location/status/brief | **NEW ADAPTER** wraps `useUpcomingEvents` + `groupEventsByDay`. Widget fields `counterpart`/`location`/`status`/`brief` NOT on `TimelineEvent` — planner extends `getUpcomingEvents` repository or composes with `useEngagements`          |
| `usePersonalCommitments` | ✗       | —                                                                | —                                                     | Dossier-grouped overdue commitments + severity + days + owner initials     | **NEW ADAPTER** wraps `useCommitments({ ownerId: user.id, ownerType: 'internal', status: 'open' })`. Severity from `days_overdue`: red>=7, amber 3-6, yellow 1-2. Owner initials from user display_name. Client-side group by `dossier_id` |
| `useMyTasks`             | ✗       | —                                                                | —                                                     | Checkbox rows                                                              | Use `useTasks({ assignee_id: user.id })` directly. `tasksKeys.myTasks()` already exists. No new hook needed                                                                                                                                |
| `useRecentDossiers`      | ✗       | —                                                                | —                                                     | Recent dossier list                                                        | Use `useDossierStore((s) => s.recentDossiers)` — Zustand selector. `DossierEntry` type has `viewedAt`, `color`, `route`. Widget renders top 5-7                                                                                            |
| `useForums`              | ✓       | `frontend/src/hooks/useForums.ts`                                | `UseQueryResult<ForumListResponse>`                   | 4 of 8 forums with monogram + name + role + when + status                  | `useForums({ limit: 4 })`. Monogram derived from name client-side. Status chip from `forum.status`                                                                                                                                         |

**Digest hook (DASH-04):** NOT named in spec. Likely source: `useActivityFeed` (operations-hub) OR new `useIntelligenceDigest` over `intelligence` domain. **Planner raises user Q&A gate on `38-04-digest-PLAN.md`.**

**VipVisits hook (DASH-06):** NOT named. Recommendation: filter `useUpcomingEvents` by `event_type === 'vip_visit'` OR extend `getUpcomingEvents` repository. **Planner raises user Q&A gate on `38-06-vip-visits-PLAN.md`.**

## Phase 37 Upstream Imports (Research Focus #2)

**Barrel:** `@/components/signature-visuals` [VERIFIED: `frontend/src/components/signature-visuals/index.ts`]

Exports used by Phase 38:

- `GlobeSpinner` + `GlobeSpinnerProps` — Digest refresh overlay. `<GlobeSpinner size={28} />` — inherits `currentColor`; honors `prefers-reduced-motion` automatically.
- `Sparkline` + `SparklineProps` — SlaHealth. `<Sparkline data={number[]} w={80} h={22} />`. **RTL auto-flip built-in via `useLocale` + `scaleX(-1)` — do NOT wrap in additional transform.**
- `Donut` + `DonutProps` — SlaHealth. `<Donut segments={Array<{value:number,color:string}>} size={84} stroke={10} />`. Circular — not mirror-sensitive.
- `DossierGlyph` + `DossierGlyphProps` — WeekAhead, OverdueCommitments, MyTasks, VipVisits, RecentDossiers. `<DossierGlyph flag="SA" type="country" size={20} />`. 24 flags: SA, AE, ID, EG, QA, JO, BH, OM, KW, PK, MA, TR, CN, IT, FR, DE, GB, US, JP, KR, IN, BR, EU, UN.
- `FullscreenLoader`, `GlobeLoader`, `showGlobeLoader` — NOT USED by Phase 38 widgets; AppShell already handles initial hydration.

**Phase 37 gotchas:** git log confirms `PASS-WITH-DEVIATION (5/5 VIZ, 94/94 tests, 0 new findings)` and `37-08-04 Sparkline RTL scaleX(-1) flip` landed. **Phase 38 MUST NOT apply its own mirror transform to Sparkline.**

## Current Dashboard Route (Research Focus #3)

**File:** `frontend/src/routes/_protected/dashboard.tsx` (116 lines).

**Preserve verbatim:**

- `useFirstRunCheck()` import + call
- `useTourComplete()` function (polls localStorage `intl-dossier-onboarding-seen` every 500ms)
- `FIRST_RUN_DISMISSED_KEY`, `ONBOARDING_SEEN_KEY`, `TOUR_POLL_INTERVAL_MS` constants
- `handleFirstRunOpenChange` callback
- `<FirstRunModal open={showFirstRun} ... />`
- `<Suspense fallback=...>` structure with the small spinner div fallback

**Replace:**

- `lazy(() => import('@/pages/Dashboard/OperationsHub')...)` → `lazy(() => import('@/pages/Dashboard'))`
- `<OperationsHub />` → `<Dashboard />`

**Suspense fallback:** Keep the small spinner (per-route) — AppShell handles full-screen GlobeLoader at a higher boundary per Phase 37 D-03.

**No mock data in route file** — all mock lives in `OperationsHub.tsx` + `components/*`, deleted Wave 2.

## Widget Decomposition / Wave Strategy (Research Focus #4)

**Validated plan structure (10 plans):**

### Wave 0 — Infra (`38-00-infra-PLAN.md`)

1. Create `frontend/src/pages/Dashboard/widgets/` + empty barrel `index.ts`
2. Create `frontend/src/pages/Dashboard/index.tsx` shell with `.dash-grid` 2-col layout
3. Port `app.css` dashboard rules (kpi-strip, card, .dash-grid, .week-_, .overdue-_, .sla-_, .vip-_, .tasks-_, .recent-_, .forums-\*, chip, label) into `widgets/dashboard.css` — map hardcoded colors to token vars
4. Create `frontend/src/hooks/useWeekAhead.ts` adapter + unit test
5. Create `frontend/src/hooks/usePersonalCommitments.ts` adapter + unit test
6. Rewrite `frontend/src/routes/_protected/dashboard.tsx` — preserve FirstRunModal wiring
7. Extend `i18n/{en,ar}/dashboard-widgets.json` with widget key scaffolds (empty; widget plans fill in)
8. Create `tests/e2e/dashboard.spec.ts` skeleton + Playwright theme-toggle fixture

### Wave 1 — 8 widget plans, parallel (each `Depends on: 38-00`)

Each: one widget file + dashboard.css additions if needed + per-widget vitest + i18n key fill.

- `38-01-kpistrip-PLAN.md` (DASH-01)
- `38-02-weekahead-PLAN.md` (DASH-02)
- `38-03-overdue-commitments-PLAN.md` (DASH-03)
- `38-04-digest-PLAN.md` (DASH-04) — gate on Digest source Q&A
- `38-05-sla-health-PLAN.md` (DASH-05)
- `38-06-vip-visits-PLAN.md` (DASH-06) — gate on VipVisits source Q&A
- `38-07-my-tasks-PLAN.md` (DASH-07)
- `38-08-recent-dossiers-forums-strip-PLAN.md` (DASH-08) — bundles both per spec

### Wave 2 — Integration gate (`38-09-e2e-PLAN.md`)

1. Per-widget render asserts (8 widgets mount)
2. Hooks-wiring asserts: `expect(html).not.toMatch(/lorem|TODO|Permanent Rep|WEEK_AHEAD/i)`
3. axe-core WCAG AA
4. RTL smoke (toggle `documentElement.dir = 'rtl'`; verify logical properties resolve)
5. Reduced-motion GlobeSpinner (inject `prefers-reduced-motion: reduce`; trigger Digest refresh)
6. Visual regression — 8 `toHaveScreenshot` at 1280 px (4 direction × 2 mode)
7. Legacy sweep: `rm frontend/src/pages/Dashboard/OperationsHub.tsx` + `rm -rf frontend/src/pages/Dashboard/components/`
8. Grep-gate: `! grep -rE "OperationsHub|AttentionZone|TimelineZone|EngagementsZone|QuickStatsBar|ActivityFeed|AnalyticsWidget|ActionBar|ZoneCollapsible" frontend/src/`

**Rationale:** Wave 0 blocks on barrel+CSS+adapters (every widget needs); Wave 1 widgets independent → max parallelism; Wave 2 is pixel gate. DASH-08 bundles RecentDossiers+ForumsStrip per spec language; total = 10 plans (matches D-09).

## Pixel-Exact Verification Strategy (Research Focus #5)

**Minimum automatable loop:**

1. Playwright VR — matrix 4 directions × 2 modes at 1280×800. Baselines captured FRESH in Wave 2 (not copied from `reference/dashboard.png`). Handoff PNG = target spec for human review; Playwright baseline = durable assert.
2. `maxDiffPixelRatio: 0.02` per D-16.
3. Responsive asserts at 320 / 768 / 1280 px — NOT snapshots; assert computed `grid-template-columns` per breakpoint.
4. axe-core WCAG AA.
5. Hooks-wiring regex grep on rendered HTML.

**Manual (one-time gate):** Human confirms first Playwright baseline matches `reference/dashboard.png`; all future runs compare against auto-captured baseline.

**Why not direct pixel-diff against handoff PNG:** Handoff PNG rendered from raw HTML; React port has different fonts/antialiasing. Auto-captured baseline is durable assert; handoff PNG is human-review gate.

## RTL Landmines (Research Focus #7)

| Widget             | Concern                     | Guardrail                                                                             |
| ------------------ | --------------------------- | ------------------------------------------------------------------------------------- |
| KpiStrip           | Delta +/− direction         | `dir="ltr"` on `.kpi-delta` (handoff does this)                                       |
| WeekAhead          | `week-time`                 | `dir="ltr"` (handoff does this)                                                       |
| WeekAhead          | Date range numerals         | Use `n(locale,...)` translit per handoff                                              |
| OverdueCommitments | `overdue-days` "3d"         | `dir="ltr"` (handoff does this)                                                       |
| OverdueCommitments | `arrow-up-right` icon       | Keep (locale-neutral) unless handoff visually differs                                 |
| SlaHealth          | Donut                       | Circular — no mirror; only legend row order flips                                     |
| SlaHealth          | Sparkline                   | **Auto-flipped Phase 37** — no double-flip                                            |
| VipVisits          | T−N countdown               | `dir="ltr"` on `.vip-countdown-n` (handoff does this)                                 |
| VipVisits          | `arrow-right` in "All" link | `rotate-180` in RTL                                                                   |
| MyTasks            | Checkbox position           | `flexDirection:"row"` naturally places on start edge (right in RTL) — matches handoff |
| MyTasks            | Due chip "today"            | i18n `t('due.today')` — never hardcoded Arabic                                        |
| RecentDossiers     | Text align                  | `text-start`, never `text-left`                                                       |
| RecentDossiers     | "updated" timestamp         | i18next `formatDistanceToNow` with locale                                             |
| ForumsStrip        | Monogram short-code         | `dir="ltr"` (Latin codes like UN, G20)                                                |
| ForumsStrip        | Status chip                 | i18n `t()`                                                                            |
| All widgets        | Chevrons                    | `className={isRTL ? 'rotate-180' : ''}` OR semantic icon names per global RTL rules   |

## Threats to Flag in Plans (Research Focus #8)

| Threat ID | Name                                                                                                                                                   | Mitigation                                                                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| T-38-01   | Handoff mock constants leak into widget files (`WEEK_AHEAD`, `OVERDUE`, `MY_TASKS`, `DIGEST`, `FORUMS`, `VIP_VISITS`, `RECENT_DOSSIERS`, `SLA_HEALTH`) | CI grep-gate rejects these identifiers in `frontend/src/`                                                                                                    |
| T-38-02   | Hook shape drift vs widget expectation (e.g., `DashboardStats` lacks delta)                                                                            | Wave 0 spike: TS check after stubbing widget with real hook import                                                                                           |
| T-38-03   | Suspense fallback jank during hydration                                                                                                                | Preserve small per-route spinner; AppShell handles first-paint                                                                                               |
| T-38-04   | RTL mirroring breakage (chevrons, Sparkline, countdown)                                                                                                | E2E RTL block (DASH-09 clause 4); CLAUDE.md logical-properties enforcement                                                                                   |
| T-38-05   | Bundle-size regression from 8 widgets + adapters                                                                                                       | `size-limit` gate (Phase 37) after Wave 1; budget <15 KB gz                                                                                                  |
| T-38-06   | VR flakiness (font / animation timing)                                                                                                                 | Disable animations via injected stylesheet; await `document.fonts.ready`                                                                                     |
| T-38-07   | Legacy OperationsHub deletion leaves orphan imports                                                                                                    | Wave 2 grep-gate for `OperationsHub\|AttentionZone\|TimelineZone\|EngagementsZone\|QuickStatsBar\|ActivityFeed\|AnalyticsWidget\|ActionBar\|ZoneCollapsible` |
| T-38-08   | FirstRunModal regression                                                                                                                               | Preserve `useTourComplete` verbatim; E2E smoke: empty tour flag → modal NOT auto-open                                                                        |
| T-38-09   | Commitments external contacts leak into personal list                                                                                                  | `usePersonalCommitments` MUST pass `ownerType: 'internal'`; unit-test asserts                                                                                |
| T-38-10   | Digest/VipVisits source hook discretion bypassed                                                                                                       | Wave 1 plans 38-04 + 38-06 gate on planner→user Q&A                                                                                                          |

## Project Skills Relevant (Research Focus #9)

Available in `.claude/skills/`:

- **heroui-react** — MCP tools for v3 beta docs. Plans cite `get_component_docs` for any HeroUI primitive. Relevant for Card, Chip, Skeleton, Button composition.
- **frontend-design** — consult if discretion emerges on visuals not covered by handoff.
- **kibo-ui-mobile-first** — only if HeroUI/Aceternity lack a component (unlikely).
- **webapp-testing** — relevant for Wave 2 Playwright structure.
- **theme-factory** — not needed (Phase 33 owns tokens).

No project-local `rules/*.md` found. CLAUDE.md rules (RTL, mobile-first, HeroUI hierarchy, work-item terminology, dossier-centric) are binding.

## Deferred Items from Discussion Log (Research Focus #10)

Re-confirming OUT OF SCOPE (stay parked):

- Flag-switch / parallel rollout
- Co-located widgets per domain
- Grouped plans by data needs
- Lighter E2E
- Legacy archive folder
- Per-widget Supabase realtime subscriptions
- Custom/user-configurable dashboards
- Kanban / Calendar / Lists / Dossier Drawer (Phases 39-41)

## PATTERNS.md Seed (Research Focus #11)

| New Widget           | Strongest Analog                                                                                    | Rationale                            |
| -------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `KpiStrip`           | `pages/Dashboard/components/QuickStatsBar.tsx` (read before deletion)                               | Already consumes `useDashboardStats` |
| `WeekAhead`          | `pages/Dashboard/components/TimelineZone.tsx` + `domains/operations-hub/hooks/useUpcomingEvents.ts` | `groupEventsByDay` reusable          |
| `OverdueCommitments` | `pages/Dashboard/components/AttentionZone.tsx` + `hooks/useCommitments.ts`                          | Severity dot + group pattern         |
| `Digest`             | `pages/Dashboard/components/ActivityFeed.tsx` + Phase 37 `GlobeSpinner` E2E                         | Refresh + list pattern               |
| `SlaHealth`          | New composition — see `components/signature-visuals/__tests__/` for Donut/Sparkline usage           | Novel combination                    |
| `VipVisits`          | `components/TimelineZone.tsx` for date math with date-fns `differenceInDays`                        | Countdown new                        |
| `MyTasks`            | `components/tasks/TaskList.tsx` OR `domains/work-items/components/KanbanCard.tsx`                   | Checkbox + title + due chip          |
| `RecentDossiers`     | Existing sidebar components using `dossierStore` (grep `recentDossiers`)                            | Zustand selector pattern             |
| `ForumsStrip`        | `pages/forums/*.tsx` list components                                                                | Status chip row pattern              |

Planner should `grep -l "useDashboardStats\|useCommitments\|useTasks\|useForums\|recentDossiers" frontend/src/` to discover more analogs.

## Environment Availability

| Dependency             | Required By                                     | Available                                                                    | Fallback                                                  |
| ---------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------- |
| Node 20.19+ / pnpm 10+ | Tooling                                         | ✓                                                                            | —                                                         |
| Playwright + axe-core  | E2E / VR / a11y                                 | ✓ (Phase 37)                                                                 | —                                                         |
| Handoff bundle         | Verbatim port source                            | ✓ **VERIFIED RESTORED** at `/tmp/inteldossier-handoff/inteldossier/project/` | BLOCKING if absent (D-01) — researcher confirmed presence |
| Supabase MCP           | If repository extension for WeekAhead/VipVisits | ✓                                                                            | —                                                         |

**No missing dependencies. Phase 38 unblocked.**

## Validation Architecture

### Test Framework

| Property    | Value                                                                        |
| ----------- | ---------------------------------------------------------------------------- |
| Framework   | Vitest 1.x (unit/integration), Playwright (E2E + VR), @testing-library/react |
| Config file | `frontend/vitest.config.ts`, `frontend/playwright.config.ts`                 |
| Quick run   | `pnpm --filter frontend test -- --run <file>`                                |
| Full suite  | `pnpm --filter frontend test && pnpm --filter frontend e2e`                  |

### Phase Requirements → Test Map

| Req ID  | Behavior                                           | Type                                  | Command                                                              | Exists? |
| ------- | -------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------- | ------- |
| DASH-01 | KpiStrip 4 cards + accent card                     | unit                                  | `pnpm --filter frontend test widgets/__tests__/KpiStrip.test.tsx`    | ❌ W1   |
| DASH-01 | Accent card uses `var(--accent)` token             | unit                                  | same file                                                            | ❌ W1   |
| DASH-02 | WeekAhead day grouping                             | unit (mocked hook)                    | `widgets/__tests__/WeekAhead.test.tsx`                               | ❌ W1   |
| DASH-02 | `useWeekAhead` adapter groups correctly            | unit (hook + QueryClientProvider)     | `hooks/__tests__/useWeekAhead.test.ts`                               | ❌ W0   |
| DASH-03 | Overdue grouped by dossier, expand toggle          | unit + user-event                     | `widgets/__tests__/OverdueCommitments.test.tsx`                      | ❌ W1   |
| DASH-03 | `usePersonalCommitments` filters to internal owner | unit                                  | `hooks/__tests__/usePersonalCommitments.test.ts`                     | ❌ W0   |
| DASH-04 | Digest tag+headline+source                         | unit                                  | `widgets/__tests__/Digest.test.tsx`                                  | ❌ W1   |
| DASH-04 | Refresh shows GlobeSpinner overlay                 | unit + user-event                     | same file                                                            | ❌ W1   |
| DASH-04 | Reduced-motion respected                           | e2e                                   | `tests/e2e/dashboard.spec.ts`                                        | ❌ W2   |
| DASH-05 | Donut + legend + 14-day Sparkline compose          | unit                                  | `widgets/__tests__/SlaHealth.test.tsx`                               | ❌ W1   |
| DASH-05 | Sparkline no double-flip in RTL                    | unit (assert no nested scaleX)        | same file                                                            | ❌ W1   |
| DASH-06 | VipVisits T−N + name/role/when                     | unit                                  | `widgets/__tests__/VipVisits.test.tsx`                               | ❌ W1   |
| DASH-07 | MyTasks checkbox + due chip                        | unit (toggle → opacity)               | `widgets/__tests__/MyTasks.test.tsx`                                 | ❌ W1   |
| DASH-08 | RecentDossiers + ForumsStrip render                | unit (2 tests)                        | `widgets/__tests__/RecentDossiers.test.tsx` + `ForumsStrip.test.tsx` | ❌ W1   |
| DASH-08 | Monogram short-code derivation                     | unit                                  | ForumsStrip.test.tsx                                                 | ❌ W1   |
| DASH-09 | 8 widgets render with real hooks, no mock strings  | e2e                                   | `dashboard.spec.ts` wiring block                                     | ❌ W2   |
| DASH-09 | Layout at 320/768/1280                             | e2e (`grid-template-columns` asserts) | same file                                                            | ❌ W2   |
| DASH-09 | RTL direction + logical spacing                    | e2e RTL block                         | same file                                                            | ❌ W2   |
| DASH-09 | WCAG AA                                            | e2e (axe-core)                        | same file                                                            | ❌ W2   |
| DASH-09 | VR 4 dirs × 2 modes                                | e2e (toHaveScreenshot, 8 snapshots)   | same file                                                            | ❌ W2   |

### Sampling Rate

- **Per task commit:** `pnpm --filter frontend test -- --run <widget test>`
- **Per wave merge:** `pnpm --filter frontend test && pnpm --filter frontend e2e -- dashboard.spec.ts`
- **Phase gate:** Full Vitest + full Playwright (incl. 8 VR snapshots) green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `frontend/src/pages/Dashboard/widgets/__tests__/` directory
- [ ] `frontend/src/hooks/__tests__/useWeekAhead.test.ts`
- [ ] `frontend/src/hooks/__tests__/usePersonalCommitments.test.ts`
- [ ] `tests/e2e/dashboard.spec.ts` skeleton
- [ ] Playwright theme-toggle fixture for VR matrix (4 dir × 2 mode)
- [ ] Vitest + Playwright already configured — no install

## Security Domain

### Applicable ASVS Categories

| Category              | Applies | Control                                                   |
| --------------------- | ------- | --------------------------------------------------------- |
| V2 Authentication     | yes     | `useAuth` provides `user.id`; `_protected` route guard    |
| V3 Session Management | no      | No new session handling                                   |
| V4 Access Control     | yes     | Supabase RLS authoritative; adapter filter is convenience |
| V5 Input Validation   | yes     | Existing hook sanitization                                |
| V6 Cryptography       | no      | No new crypto                                             |

### Known Threat Patterns for React + TanStack Query + Supabase

| Pattern                                   | STRIDE                 | Mitigation                                              |
| ----------------------------------------- | ---------------------- | ------------------------------------------------------- |
| XSS from dossier/forum name rendering     | Tampering              | React auto-escapes; never use unsafe raw HTML insertion |
| IDOR on commitment via tampered `ownerId` | Elevation of Privilege | RLS authoritative                                       |
| Timing attack via recent-dossier list     | Information Disclosure | Existing dossier RLS handles                            |
| `localStorage` tour-flag poisoning        | Tampering              | Low-impact; worst case one extra tour view              |

## Assumptions Log

| #   | Claim                                                                | Section             | Risk if Wrong                                                                     |
| --- | -------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------- |
| A1  | `DashboardStats` includes delta fields KpiStrip needs                | Hook Audit, DASH-01 | Medium — may require repo extension; plan `38-01` TS-check first                  |
| A2  | Digest source is `useActivityFeed` or new `useIntelligenceDigest`    | DASH-04             | Medium — user Q&A gate required                                                   |
| A3  | VipVisits data = `useUpcomingEvents` filtered by event_type          | DASH-06             | Medium — may need new hook/repo extension                                         |
| A4  | `useDashboardTrends` 14-day slice (`'30d'.slice(-14)`) acceptable    | DASH-05             | Low                                                                               |
| A5  | `useCommitments.ownerType='internal'` sufficient for personal scope  | Pitfall 8           | Low                                                                               |
| A6  | Handoff `app.css` grid rules cover 320/768/1280                      | D-13                | Medium — Wave 0 reads app.css; if desktop-only, plans add mobile rules explicitly |
| A7  | `dossierStore.recentDossiers` populated in authenticated session     | DASH-08             | Low — empty-state fallback                                                        |
| A8  | GlobeSpinner overlay honors prefers-reduced-motion                   | DASH-04             | Low [VERIFIED: VIZ-03 Phase 37]                                                   |
| A9  | Playwright VR via `page.evaluate` theme/direction toggle is feasible | D-15/D-16           | Medium — may need fixture to seed `localStorage.theme`/`direction` pre-load       |

## Open Questions

1. **DASH-04 Digest source hook** — `useActivityFeed` vs new `useIntelligenceDigest`? Planner Q&A gate on `38-04`.
2. **DASH-01 delta field** — is it on `DashboardStats`? Plan `38-01` begins with full type read.
3. **DASH-06 VipVisits source** — dedicated table or derived from engagements? Planner Q&A gate on `38-06`.
4. **Handoff app.css mobile rules** — does it define 320/768 breakpoints? Wave 0 reads `app.css` in full.

## Sources

### Primary (HIGH)

- `.planning/phases/38-dashboard-verbatim/38-CONTEXT.md` [VERIFIED]
- `.planning/phases/38-dashboard-verbatim/38-DISCUSSION-LOG.md` [VERIFIED]
- `.planning/REQUIREMENTS.md` L57-67 [VERIFIED]
- `.planning/ROADMAP.md` Phase 38 L218-240 [VERIFIED]
- `frontend/src/routes/_protected/dashboard.tsx` (full) [VERIFIED]
- `frontend/src/components/signature-visuals/index.ts` [VERIFIED]
- `frontend/src/domains/operations-hub/hooks/useDashboardStats.ts` [VERIFIED]
- `frontend/src/hooks/useDashboardTrends.ts` [VERIFIED]
- `frontend/src/hooks/useCommitments.ts` + `services/commitments.service.ts` filter usage [VERIFIED]
- `frontend/src/hooks/useTasks.ts` [VERIFIED]
- `frontend/src/hooks/useForums.ts` [VERIFIED]
- `frontend/src/domains/operations-hub/hooks/useUpcomingEvents.ts` (full) [VERIFIED]
- `frontend/src/domains/operations-hub/types/operations-hub.types.ts` (100 lines) [VERIFIED]
- `frontend/src/store/dossierStore.ts` [VERIFIED]
- `/tmp/inteldossier-handoff/inteldossier/project/src/dashboard.jsx` (full) [VERIFIED]
- Git log: Phase 37 PASS-WITH-DEVIATION [VERIFIED]

### Secondary (MEDIUM)

- CLAUDE.md project + global (RTL, mobile-first, HeroUI hierarchy, work-item terminology) [CITED]

### Tertiary (LOW)

- Phase-level 37-SUMMARY.md not present; only per-plan summaries 37-00..08. Phase-level status inferred from git log. Recommend planner reads `.planning/phases/37-signature-visuals/37-PATTERNS.md` before Wave 1.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — zero new deps; all verified
- Architecture: HIGH — route, barrel, hook signatures directly read
- Pitfalls: HIGH — derived from handoff + hook sources + CLAUDE.md
- Hook audit: HIGH for 5 existing hooks; MEDIUM for Digest + VipVisits (open questions)
- Pixel-exact strategy: MEDIUM — Playwright theme-toggle fixture needs one setup step

**Research date:** 2026-04-24
**Valid until:** 2026-05-24 (stable stack; handoff immutable)
