# Phase 38: dashboard-verbatim — Pattern Map

**Mapped:** 2026-04-24
**Files analyzed:** 23 new/modified files across 10 plans
**Analogs found:** 22 / 23 (one novel composition — SlaHealth Donut+Sparkline)
**Upstream barrels:** `@/components/signature-visuals` (Phase 37), `@/components/ui/*` (Phase 33 HeroUI wrappers)

---

## File Classification

| New / Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------------|------|-----------|----------------|---------------|
| `frontend/src/routes/_protected/dashboard.tsx` (rewrite) | route | Suspense + modal gate | self (preserve lines 26–114 verbatim, swap only `OperationsHub` → `Dashboard`) | exact (self) |
| `frontend/src/pages/Dashboard/index.tsx` | page composer | grid layout | `frontend/src/pages/Dashboard/OperationsHub.tsx` | role-match |
| `frontend/src/pages/Dashboard/widgets/index.ts` | barrel | re-export | `frontend/src/components/signature-visuals/index.ts` | exact |
| `frontend/src/pages/Dashboard/widgets/dashboard.css` | styles | CSS custom props + grid | `frontend/src/components/signature-visuals/globe-loader.css` (Phase 37) | role-match |
| `frontend/src/hooks/useWeekAhead.ts` | adapter hook | useQuery + useMemo transform | `frontend/src/domains/operations-hub/hooks/useUpcomingEvents.ts` (`useGroupedEvents`) | exact |
| `frontend/src/hooks/usePersonalCommitments.ts` | adapter hook | wrap + filter + group | `frontend/src/domains/operations-hub/hooks/useUpcomingEvents.ts` (`useGroupedEvents`) + `useCommitments` | role-match (compose) |
| `frontend/src/pages/Dashboard/widgets/KpiStrip.tsx` | metric widget | 4-card grid | `frontend/src/pages/Dashboard/components/QuickStatsBar.tsx` + `QuickStatCard.tsx` | exact |
| `frontend/src/pages/Dashboard/widgets/WeekAhead.tsx` | list widget (grouped) | day-bucket list | `frontend/src/pages/Dashboard/components/TimelineZone.tsx` | exact |
| `frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx` | list widget (grouped) | severity + expand | `frontend/src/pages/Dashboard/components/AttentionZone.tsx` + `AttentionItem.tsx` | exact |
| `frontend/src/pages/Dashboard/widgets/Digest.tsx` | media/feed widget | tag + headline + refresh overlay | `frontend/src/pages/Dashboard/components/ActivityFeed.tsx` | role-match |
| `frontend/src/pages/Dashboard/widgets/SlaHealth.tsx` | composite visual widget | Donut + Sparkline + legend | `frontend/src/components/signature-visuals/__tests__/` Donut+Sparkline usage | no-exact-analog (novel) |
| `frontend/src/pages/Dashboard/widgets/VipVisits.tsx` | list widget | countdown + role | `frontend/src/pages/Dashboard/components/TimelineEventCard.tsx` | role-match |
| `frontend/src/pages/Dashboard/widgets/MyTasks.tsx` | list widget (interactive) | checkbox toggle + due chip | `frontend/src/pages/Dashboard/components/AttentionItem.tsx` | role-match |
| `frontend/src/pages/Dashboard/widgets/RecentDossiers.tsx` | list widget | Zustand selector | `frontend/src/store/dossierStore.ts` consumers | role-match |
| `frontend/src/pages/Dashboard/widgets/ForumsStrip.tsx` | list widget (horizontal) | monogram + status chip | `frontend/src/pages/Dashboard/components/ActivityFeedItem.tsx` | role-match |
| `frontend/src/pages/Dashboard/widgets/__tests__/*.test.tsx` | unit tests | RTL render + mock hook | `frontend/src/pages/Dashboard/components/__tests__/` (exists) | exact |
| `frontend/src/hooks/__tests__/useWeekAhead.test.ts` | hook unit test | QueryClientProvider | existing `frontend/src/hooks/__tests__/` pattern | exact |
| `frontend/src/hooks/__tests__/usePersonalCommitments.test.ts` | hook unit test | same | same | exact |
| `frontend/tests/e2e/dashboard.spec.ts` | E2E spec | render + wiring + a11y + VR | `frontend/tests/e2e/visual-regression/waiting-queue-visual.spec.ts` + `dossier-rtl-complete.spec.ts` + `dossier-rtl-mobile.spec.ts` | role-match |
| `frontend/src/i18n/{en,ar}/dashboard-widgets.json` (extend) | i18n | JSON | existing file (extend) | exact |

---

## Shared Patterns (applied to every widget)

### SP-1: Widget shell (loading / error / empty / data)

**Source:** `frontend/src/pages/Dashboard/components/AttentionZone.tsx` lines 60–151
**Apply to:** all 8 widget files

```tsx
export function Widget(): React.ReactElement {
  const { t } = useTranslation('dashboard-widgets')
  const { data, isLoading, isError, refetch } = useHook()

  if (isLoading) {
    return (
      <section role="region" aria-label={t('widget.title')} className="widget-skeleton">
        {/* shape-matching Skeleton rows */}
      </section>
    )
  }
  if (isError) {
    return (
      <section role="region" aria-label={t('widget.title')}
        className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm text-destructive mb-2">{t('error.load_failed')}</p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>{t('error.retry')}</Button>
      </section>
    )
  }
  if (!data || data.length === 0) {
    return <EmptyStateFallback copy={t('widget.empty')} />
  }
  return <section role="region" aria-labelledby="widget-heading">{/* data */}</section>
}
```

### SP-2: HeroUI wrapper imports (Phase 33 drop-ins)

**Source:** `frontend/src/pages/Dashboard/components/QuickStatCard.tsx` lines 9–11
**Apply to:** every widget

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'           // aliases heroui-chip
import { LtrIsolate } from '@/components/ui/ltr-isolate' // for numerals/dates in RTL
```

Never import `@heroui/react` directly — always through the `ui/*` re-export shell so the shadcn-compat layer stays intact.

### SP-3: i18n with two-namespace split

**Source:** `frontend/src/pages/Dashboard/components/AttentionItem.tsx` lines 9, 67–74
**Apply to:** every widget

```tsx
import { useTranslation } from 'react-i18next'
const { t, i18n } = useTranslation('dashboard-widgets')
// locale-aware number/date formatting
deadlineDate.toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })
```

### SP-4: RTL landmines — `LtrIsolate` for numerals/short codes

**Source:** `frontend/src/pages/Dashboard/components/QuickStatCard.tsx` line 11, 68–70 and `AttentionItem.tsx` line 124
**Apply to:** KpiStrip values, WeekAhead `.week-time`, OverdueCommitments `.overdue-days`, VipVisits `.vip-countdown-n`, ForumsStrip short codes (UN, G20, etc.)

```tsx
import { LtrIsolate } from '@/components/ui/ltr-isolate'
<LtrIsolate className="inline">{dateRange}</LtrIsolate>
<LtrIsolate className="text-4xl font-semibold leading-tight">{value}</LtrIsolate>
```

Rule: any LTR-direction content (Latin digits, `T−7`, `3d`, `09:00 — 10:00`) must be wrapped in `<LtrIsolate>` per handoff `dir="ltr"` spans.

### SP-5: Keyboard-navigable card (role=button + Enter/Space)

**Source:** `frontend/src/pages/Dashboard/components/QuickStatCard.tsx` lines 36–41, 55–65
**Apply to:** any clickable widget row (MyTasks, RecentDossiers, ForumsStrip items)

```tsx
const handleKeyDown = (e: React.KeyboardEvent): void => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() }
}
<div role="button" tabIndex={0} onClick={onClick} onKeyDown={handleKeyDown}
     aria-label={`${value} ${label}`} className="min-h-11 ...">
```

Min 44×44 touch target (`min-h-11`).

### SP-6: CVA variants for severity / state coloring

**Source:** `frontend/src/pages/Dashboard/components/AttentionItem.tsx` lines 10, 20–34
**Apply to:** OverdueCommitments severity dots (red/amber/yellow per RESEARCH D-07)

```tsx
import { cva, type VariantProps } from 'class-variance-authority'
const commitmentRowVariants = cva('flex items-center gap-3 rounded-lg border p-3', {
  variants: { severity: {
    red:    'border-destructive/50 bg-destructive/5',
    amber:  'border-warning/50 bg-warning/5',
    yellow: 'border-yellow-500/50 bg-yellow-500/5',
  } },
  defaultVariants: { severity: 'yellow' },
})
```

### SP-7: Signature-visual imports (Phase 37)

**Source:** `frontend/src/components/signature-visuals/index.ts`
**Apply to:** Digest, SlaHealth, WeekAhead/OverdueCommitments/MyTasks/RecentDossiers/VipVisits (for DossierGlyph)

```tsx
import { GlobeSpinner, Donut, Sparkline, DossierGlyph } from '@/components/signature-visuals'
```

Never apply your own `scaleX(-1)` to Sparkline — it's already RTL-flipped (Phase 37 plan 37-08-04).

### SP-8: Logical Tailwind classes only (CLAUDE.md mandate)

**Apply to:** every widget file

- `ms-*`/`me-*`/`ps-*`/`pe-*` — never `ml-*`/`mr-*`/`pl-*`/`pr-*`
- `text-start`/`text-end` — never `text-left`/`text-right`
- `rounded-s-*`/`rounded-e-*` — never `rounded-l-*`/`rounded-r-*`
- Directional icons: `className={isRTL ? 'rotate-180' : ''}`

---

## Per-File Pattern Assignments

### Plan 38-00 — Infra (`routes/_protected/dashboard.tsx`, `pages/Dashboard/index.tsx`, `widgets/index.ts`, `widgets/dashboard.css`, adapter hooks)

#### `routes/_protected/dashboard.tsx` (rewrite)
**Analog:** self. 90% of the file is **preserved verbatim**; the only edits are lines 35–38 and 105.

Preserve (lines 26–103):
```tsx
const FIRST_RUN_DISMISSED_KEY = 'intl-dossier:first-run-dismissed'
const ONBOARDING_SEEN_KEY = 'intl-dossier-onboarding-seen'
const TOUR_POLL_INTERVAL_MS = 500
// ...useTourComplete(), useFirstRunCheck(), dismissed state, Suspense fallback
```

Replace (lines 35–38, 105):
```tsx
// BEFORE
const OperationsHub = lazy(() =>
  import('@/pages/Dashboard/OperationsHub').then((m) => ({ default: m.OperationsHub })),
)
// ...
<OperationsHub />

// AFTER
const Dashboard = lazy(() =>
  import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })),
)
// ...
<Dashboard />
```

Suspense fallback stays the small per-route spinner (AppShell handles first-paint).

#### `pages/Dashboard/index.tsx` (new)
**Analog:** `frontend/src/pages/Dashboard/OperationsHub.tsx` (for composer shape only — no zone logic copied).
Export named `Dashboard`. Imports the 8 widgets from `./widgets` barrel and arranges them in the handoff `.dash-grid` CSS grid.

```tsx
import { KpiStrip, WeekAhead, OverdueCommitments, Digest,
         SlaHealth, VipVisits, MyTasks, RecentDossiers, ForumsStrip } from './widgets'
import './widgets/dashboard.css'

export function Dashboard(): React.ReactElement {
  return (
    <div className="dash-root">
      <KpiStrip />
      <div className="dash-grid">
        <div className="dash-col">
          <WeekAhead /><OverdueCommitments /><Digest />
        </div>
        <div className="dash-col">
          <SlaHealth /><VipVisits /><MyTasks /><RecentDossiers /><ForumsStrip />
        </div>
      </div>
    </div>
  )
}
```

#### `pages/Dashboard/widgets/index.ts` (new)
**Analog:** `frontend/src/components/signature-visuals/index.ts` (lines 19–30)

```ts
export { KpiStrip } from './KpiStrip'
export { WeekAhead } from './WeekAhead'
export { OverdueCommitments } from './OverdueCommitments'
export { Digest } from './Digest'
export { SlaHealth } from './SlaHealth'
export { VipVisits } from './VipVisits'
export { MyTasks } from './MyTasks'
export { RecentDossiers } from './RecentDossiers'
export { ForumsStrip } from './ForumsStrip'
```

#### `pages/Dashboard/widgets/dashboard.css` (new)
**Analog:** `frontend/src/components/signature-visuals/globe-loader.css` (Phase 37 verbatim-port precedent).
Port handoff `project/src/app.css` `.dash-grid`, `.kpi-strip`, `.card`, `.week-*`, `.overdue-*`, `.sla-*`, `.vip-*`, `.tasks-*`, `.recent-*`, `.forums-*` rules 1:1. Replace hardcoded colors with Phase 33 tokens (`var(--accent)`, `var(--surface)`, `var(--line)`, `var(--ink)`, `var(--sla-ok)`, `var(--sla-risk)`, `var(--sla-bad)`).

#### `hooks/useWeekAhead.ts` (new)
**Analog:** `frontend/src/domains/operations-hub/hooks/useUpcomingEvents.ts` lines 77–96 (`useGroupedEvents`)

```ts
// Copy this pattern exactly:
export function useWeekAhead(userId?: string): {
  data: GroupedEvents | undefined
  isLoading: boolean
  isError: boolean
} {
  const query = useUpcomingEvents(userId)
  const grouped = useMemo(() => {
    if (query.data == null) return undefined
    return groupEventsByDay(query.data)
  }, [query.data])
  return { data: grouped, isLoading: query.isLoading, isError: query.isError }
}
```

**Reuse don't re-invent:** `groupEventsByDay` is already exported from `useUpcomingEvents.ts` lines 24–50.

#### `hooks/usePersonalCommitments.ts` (new)
**Analog:** same `useGroupedEvents` pattern + `useCommitments` signature from `frontend/src/hooks/useCommitments.ts` lines 67–79.

```ts
import { useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCommitments } from '@/hooks/useCommitments'

export function usePersonalCommitments(): { data: GroupedCommitments | undefined; isLoading: boolean; isError: boolean } {
  const { user } = useAuth()
  const query = useCommitments({
    ownerId: user?.id,
    ownerType: 'internal',    // CRITICAL — Pitfall 8 in RESEARCH.md
    status: 'open',
    enabled: user?.id != null,
  })
  const grouped = useMemo(() => {
    if (!query.data) return undefined
    return groupByDossier(query.data.commitments).map(withSeverity)
  }, [query.data])
  return { data: grouped, isLoading: query.isLoading, isError: query.isError }
}
```

Severity rule (from RESEARCH.md Pitfall 8 + D-07): `days_overdue >= 7` → red, `3–6` → amber, `1–2` → yellow.

---

### Plan 38-01 — KpiStrip

**Analog:** `frontend/src/pages/Dashboard/components/QuickStatsBar.tsx` + `QuickStatCard.tsx` (exact role match — already consumes `useDashboardStats`)

**Imports pattern** (QuickStatsBar lines 9–13):
```tsx
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { Briefcase, CheckSquare, AlertTriangle, CalendarDays } from 'lucide-react'
import type { DashboardStats } from '@/domains/operations-hub/types/operations-hub.types'
```

**Core 4-card layout** (QuickStatsBar lines 32–70) — verbatim shape, but bind values to `data.active_engagements`, `data.open_tasks`, `data.sla_at_risk`, `data.upcoming_this_week` per handoff copy keys, and mark card 3 with `kpi-accent` CSS class (DASH-01).

**Accent bar (discretion):**
```tsx
// card 3 ONLY — uses Phase 33 --accent token
<div className="kpi kpi-accent">  {/* dashboard.css adds ::before { background: var(--accent) } */}
```

**Skeleton** (QuickStatCard lines 43–53):
```tsx
if (isLoading) return (
  <Card className="p-4"><CardContent className="p-0 space-y-2">
    <Skeleton className="h-6 w-6" /><Skeleton className="h-10 w-16" /><Skeleton className="h-4 w-20" />
  </CardContent></Card>
)
```

**LtrIsolate for large numerals** (QuickStatCard lines 68–70):
```tsx
<LtrIsolate className="text-4xl sm:text-[56px] font-semibold leading-tight">{value}</LtrIsolate>
```

**Warning (RESEARCH.md A1):** `DashboardStats` type may not include delta field. Begin with `tsc --noEmit` after stubbing — if missing, extend `DashboardStats` interface + repository query before continuing.

---

### Plan 38-02 — WeekAhead

**Analog:** `frontend/src/pages/Dashboard/components/TimelineZone.tsx` (exact — identical day-grouping + expand semantics)

**Day-grouping iteration** (TimelineZone lines 26, 102–150):
```tsx
const DAY_GROUP_ORDER: TimelineGroup[] = ['today', 'tomorrow', 'this_week', 'next_week']
const MAX_VISIBLE_EVENTS = 5
const nonEmptyGroups = DAY_GROUP_ORDER.filter((g) => (events[g]?.length ?? 0) > 0)

return nonEmptyGroups.map((group, idx) => {
  const groupEvents = events[group] ?? []
  const isExpanded = expandedGroups[group] ?? false
  const visibleEvents = isExpanded ? groupEvents : groupEvents.slice(0, MAX_VISIBLE_EVENTS)
  return (
    <div key={group}>
      {idx > 0 && <Separator className="mb-4" />}
      <h3 className="text-sm font-normal text-muted-foreground mb-2">
        {t(`weekAhead.${group}`)}
      </h3>
      {/* rows with DossierGlyph + title + counterpart + location + status chip */}
    </div>
  )
})
```

**Row composition** — compose `<DossierGlyph flag={e.counterpartFlag} type="country" size={20} />` (Phase 37 barrel) + title + `<LtrIsolate>` time-range + brief chip.

**RTL:** wrap `.week-time` in `dir="ltr"` (handoff does this; RESEARCH RTL Landmines table).

**Data hook:** `useWeekAhead()` from Plan 38-00.

---

### Plan 38-03 — OverdueCommitments

**Analog:** `frontend/src/pages/Dashboard/components/AttentionZone.tsx` + `AttentionItem.tsx` (exact — severity sort + grouping + row variants)

**Severity CVA** — copy `AttentionItem.tsx` lines 20–34 (see SP-6 above) and rename `AttentionSeverity` → 3-tier: `red`/`amber`/`yellow`.

**Severity sort** (AttentionZone lines 25–29, 126–131):
```tsx
const SEVERITY_ORDER: Record<Severity, number> = { red: 0, amber: 1, yellow: 2 }
const sorted = [...items].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
```

**Group-by-dossier expand** — combine `AttentionZone` severity sort with `TimelineZone` per-group `expandedGroups` state (TimelineZone lines 48–52, 108–148).

**`.overdue-days` mono chip** — wrap in `<LtrIsolate>` (SP-4). `arrow-up-right` icon: keep (locale-neutral per RTL Landmines table).

**Data hook:** `usePersonalCommitments()` from Plan 38-00.

---

### Plan 38-04 — Digest (gates on user Q&A for data source)

**Analog:** `frontend/src/pages/Dashboard/components/ActivityFeed.tsx` (role-match — refresh button + list of items with tags)

**Refresh button + GlobeSpinner overlay** (RESEARCH Code Examples, DASH-04):
```tsx
import { GlobeSpinner } from '@/components/signature-visuals'

{busy && (
  <div aria-busy="true" className="digest-overlay"
       style={{ position: 'absolute', inset: 0,
                background: 'color-mix(in srgb, var(--surface) 70%, transparent)',
                backdropFilter: 'blur(1px)',
                display: 'grid', placeItems: 'center', zIndex: 2 }}>
    <GlobeSpinner size={28} />
  </div>
)}
```

The refresh `<button>` itself rotates while busy (DASH-04 "animated"). `GlobeSpinner` honors `prefers-reduced-motion` automatically (Phase 37 VIZ-03).

**List pattern** — mirror `ActivityFeed` lines 85–93 (divide-y, max N items) for digest items. Each row: tag chip + headline + source + timestamp.

**Data source:** `useActivityFeed` vs new `useIntelligenceDigest` — **Q&A gate required** (RESEARCH A2 / Open Question 1). Plan must NOT proceed until answered.

---

### Plan 38-05 — SlaHealth (novel composition)

**Analog (closest):** no single-file analog. Compose Phase 37 primitives from tests in `frontend/src/components/signature-visuals/__tests__/` (Donut, Sparkline tests show prop shapes).

**Donut** (Phase 37 barrel):
```tsx
import { Donut, Sparkline } from '@/components/signature-visuals'
import { useDashboardTrends } from '@/hooks/useDashboardTrends'

const { data: trends } = useDashboardTrends('30d')
const sparkSeries = (trends ?? []).slice(-14).map((d) => d.created - d.completed + 7) // concrete mapping per DASH-05

const segments = [
  { value: stats.sla_ok,   color: 'var(--sla-ok)'   },
  { value: stats.sla_risk, color: 'var(--sla-risk)' },
  { value: stats.sla_bad,  color: 'var(--sla-bad)'  },
]

<Donut segments={segments} size={84} stroke={10} />
<Sparkline data={sparkSeries} w={80} h={22} />
```

**Legend** — simple row with color swatch + label + count. Flex with logical `gap-2`.

**Do NOT apply `scaleX(-1)` to Sparkline** — Phase 37 37-08-04 added the flip internally. Double-flip would land trailing dot on LEFT in Arabic (RESEARCH Pitfall 1).

**Data:** `useDashboardStats` (donut counts) + `useDashboardTrends('30d').slice(-14)` (sparkline) per RESEARCH A4.

---

### Plan 38-06 — VipVisits (gates on user Q&A)

**Analog:** `frontend/src/pages/Dashboard/components/TimelineEventCard.tsx` (for date math with `date-fns differenceInDays`).

**T−N countdown** — compute `differenceInDays(event.start_date, new Date())` and display in `<LtrIsolate>` class `vip-countdown-n` (RTL Landmines: handoff forces `dir="ltr"`).

**Row:** `<DossierGlyph flag={personFlag} type="person" size={20} />` + name + role + when.

**"All" link with `arrow-right`:** `rotate-180` in RTL (RTL Landmines table).

**Data source:** `useUpcomingEvents({ eventType: 'vip_visit' })` (filter) vs new repository extension — **Q&A gate required** (RESEARCH A3 / Open Question 3).

---

### Plan 38-07 — MyTasks

**Analog:** `frontend/src/pages/Dashboard/components/AttentionItem.tsx` (role-match — keyboard-nav row with badge)

**Checkbox + title + due chip row:**
```tsx
import { Checkbox } from '@/components/ui/checkbox'
import { useTasks } from '@/hooks/useTasks'
import { useAuth } from '@/hooks/useAuth'

const { user } = useAuth()
const { data } = useTasks({ assignee_id: user?.id })

// flexDirection:"row" naturally puts checkbox on start edge (right in RTL) — matches handoff
<div className="flex items-center gap-3 min-h-11">
  <Checkbox checked={t.done} onCheckedChange={(v) => toggleTask(t.id, v)} />
  <DossierGlyph flag={t.dossierFlag} type="country" size={20} />
  <span className="text-sm truncate flex-1">{t.title}</span>
  <Badge>{t('due.today')}</Badge>  {/* never hardcoded Arabic */}
</div>
```

**Completed opacity** — on toggle, add `opacity-60 line-through` class (handoff pattern).

**Data:** `useTasks({ assignee_id: user.id })` — no new hook (RESEARCH D-08); `tasksKeys.myTasks()` already exists.

---

### Plan 38-08 — RecentDossiers + ForumsStrip (bundled per DASH-08)

**RecentDossiers analog:** Zustand selector pattern. Grep `frontend/src/` for `useDossierStore` consumers.
```tsx
import { useDossierStore } from '@/store/dossierStore'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

const recentDossiers = useDossierStore((s) => s.recentDossiers)
const localeForFns = i18n.language === 'ar' ? ar : enUS

recentDossiers.slice(0, 7).map((d) => (
  <Link key={d.id} to={d.route} className="flex items-center gap-3 min-h-11">
    <DossierGlyph flag={d.flag} type={d.type} size={20} />
    <span className="text-sm text-start truncate flex-1">{d.name}</span>
    <span className="text-xs text-muted-foreground">
      {formatDistanceToNow(d.viewedAt, { addSuffix: true, locale: localeForFns })}
    </span>
  </Link>
))
```

**Never `text-left`** — RTL Landmines (SP-8).

**ForumsStrip analog:** `frontend/src/pages/Dashboard/components/ActivityFeedItem.tsx` (role-match — horizontal row with chip).

**Monogram short-code** (derived client-side):
```tsx
import { useForums } from '@/hooks/useForums'
const { data } = useForums({ limit: 4 })

function monogram(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 3)
}

// wrap short-code in LtrIsolate (Latin codes like UN, G20)
<LtrIsolate className="font-mono text-xs">{monogram(forum.name)}</LtrIsolate>
```

---

### Plan 38-09 — E2E (`tests/e2e/dashboard.spec.ts`)

**Analog:** `frontend/tests/e2e/visual-regression/waiting-queue-visual.spec.ts` (viewport matrix + VR), `frontend/tests/e2e/dossier-rtl-complete.spec.ts` (RTL smoke), `frontend/tests/e2e/dossier-rtl-mobile.spec.ts` (language toggle).

**Viewport matrix pattern** (waiting-queue-visual.spec.ts lines 16–22):
```ts
const viewports = {
  mobile: { width: 320, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
}
```

**Login + language toggle helper** (lines 25–47):
```ts
async function setupAndNavigate(page: Page, locale: 'en' | 'ar' = 'en') {
  await page.goto('/login')
  await page.fill('[name="email"]', process.env.TEST_USER_EMAIL!)
  await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD!)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 10000 })
  if (locale === 'ar') { /* click language toggle */ }
  await page.waitForLoadState('networkidle')
}
```

**Visual regression screenshot** (lines 58–63):
```ts
await expect(page).toHaveScreenshot('ltr-light-dashboard.png', {
  fullPage: true,
  animations: 'disabled',
  maxDiffPixelRatio: 0.02,  // D-16
})
```

**Matrix:** 4 directions × 2 modes = 8 snapshots at 1280 px only (D-15).

**Hooks-wiring grep assert:**
```ts
const html = await page.content()
expect(html).not.toMatch(/\b(lorem|TODO|WEEK_AHEAD|OVERDUE|MY_TASKS|DIGEST|FORUMS|VIP_VISITS|RECENT_DOSSIERS|SLA_HEALTH)\b/i)
```

**axe-core a11y** — use `@axe-core/playwright` (Phase 37 pattern).

**Reduced-motion fixture:**
```ts
await page.emulateMedia({ reducedMotion: 'reduce' })
// trigger Digest refresh, assert no rotation
```

**Font-ready guard** (RESEARCH Pitfall 6):
```ts
await page.evaluate(() => document.fonts.ready)
```

**Legacy sweep at end of plan:**
```bash
rm frontend/src/pages/Dashboard/OperationsHub.tsx
rm -rf frontend/src/pages/Dashboard/components/
# grep-gate
! grep -rE "OperationsHub|AttentionZone|TimelineZone|EngagementsZone|QuickStatsBar|ActivityFeed|AnalyticsWidget|ActionBar|ZoneCollapsible" frontend/src/
```

---

## Anti-Patterns to Avoid (per-file guardrails)

| File | Anti-Pattern | Correct Pattern |
|------|--------------|-----------------|
| all widgets | `import { Card } from '@heroui/react'` | `import { Card } from '@/components/ui/card'` |
| all widgets | `ml-*/mr-*/pl-*/pr-*` | `ms-*/me-*/ps-*/pe-*` |
| all widgets | `textAlign: 'right'` or `text-right` | `text-end` (and `writingDirection: 'rtl'` only — no `textAlign`) |
| all widgets | `[...items].reverse()` for RTL | drop — `forceRTL` handles direction |
| all widgets | `useEffect(() => { supabase.from(...) })` in widget body | TanStack Query hook via `useHook` module |
| all widgets | Mock constants (`WEEK_AHEAD`, `DIGEST`, etc.) | skeleton → empty-state → data |
| KpiStrip | hardcoded `#color` for accent bar | `var(--accent)` token (Phase 33) |
| SlaHealth | wrap `<Sparkline>` in own `scaleX(-1)` | rely on Phase 37 built-in flip |
| SlaHealth | hardcoded SLA colors | `var(--sla-ok)` / `var(--sla-risk)` / `var(--sla-bad)` |
| WeekAhead / OverdueCommitments | re-implement date bucketing | use `groupEventsByDay` from `useUpcomingEvents.ts` |
| usePersonalCommitments | omit `ownerType: 'internal'` | REQUIRED — external contacts leak otherwise (RESEARCH Pitfall 8) |
| `dashboard.tsx` route | touch `useFirstRunCheck`, `useTourComplete`, `FIRST_RUN_DISMISSED_KEY`, `ONBOARDING_SEEN_KEY`, `TOUR_POLL_INTERVAL_MS` | preserve verbatim (lines 28–103) |
| `dashboard.css` | Tailwind `@apply` for grid | raw CSS `display: grid; grid-template-columns: ...` verbatim from handoff `app.css` |
| E2E spec | snapshots at 320/768 | render asserts only at 320/768; snapshots ONLY at 1280 (D-15) |
| any widget test | mock real data with handoff constants (`WEEK_AHEAD`) | synthesize fixture objects inline, never import handoff names |

---

## No Analog Found

| File | Role | Reason | Fallback |
|------|------|--------|----------|
| `widgets/SlaHealth.tsx` | composite visual | Donut+Sparkline combination is new | Compose per Plan 38-05 using primitives from `@/components/signature-visuals`; test shapes in `components/signature-visuals/__tests__/` |

All other 22 files have an existing analog in `frontend/src/pages/Dashboard/components/` or `frontend/src/components/signature-visuals/`.

---

## Signature-Visual Consumer Gap

**Current state:** Zero files in `frontend/src/pages/Dashboard/` currently import from `@/components/signature-visuals`. Phase 37 primitives are freshly available — Phase 38 will be their first real domain consumer.

**Implication:** No "copy an existing Donut consumer" pattern exists in domain code. Plan 38-05 must derive prop shapes from:
- `frontend/src/components/signature-visuals/Donut.tsx` + `DonutProps`
- `frontend/src/components/signature-visuals/Sparkline.tsx` + `SparklineProps`
- `frontend/src/components/signature-visuals/__tests__/` fixtures

For `GlobeSpinner` + `DossierGlyph`, the closest usage examples are the Phase 37 `__tests__` files and Storybook stories (if any ship with the barrel).

---

## Representative TanStack Query Consumer (existing)

**`frontend/src/pages/Dashboard/components/QuickStatCard.tsx`** is invoked from `QuickStatsBar.tsx` inside `OperationsHub.tsx`, which calls `useDashboardStats(user?.id)`. The same pattern transfers directly to `KpiStrip.tsx` in Phase 38 (see Plan 38-01).

For refresh/mutation patterns, see `useCommitments.ts` lines 164–310 (`useCreateCommitment`, `useUpdateCommitmentStatus` with optimistic updates). Phase 38 does NOT need mutations — widgets are read-only except MyTasks checkbox toggle (uses existing `useUpdateTaskStatus` from `useTasks`).

---

## Metadata

**Analog search scope:** `frontend/src/pages/Dashboard/`, `frontend/src/components/ui/`, `frontend/src/components/signature-visuals/`, `frontend/src/hooks/`, `frontend/src/domains/operations-hub/`, `frontend/tests/e2e/`
**Upstream phases consulted:** 33 (token engine + HeroUI wrappers), 35 (Tajawal), 36 (AppShell — summary absent but referenced via route), 37 (signature-visuals barrel)
**Pattern extraction date:** 2026-04-24
**Handoff bundle used:** `/tmp/inteldossier-handoff/inteldossier/project/src/dashboard.jsx` + `app.css` (as cited in RESEARCH.md)

---

## PATTERN MAPPING COMPLETE

**Phase:** 38 — dashboard-verbatim
**Files classified:** 23 (across 10 plans — Wave 0 infra, Wave 1 × 8 widgets, Wave 2 E2E)
**Analogs found:** 22 / 23

### Coverage
- Exact analogs: 15 (route self-preserve, barrel, adapter hooks, KpiStrip→QuickStats*, WeekAhead→TimelineZone, OverdueCommitments→AttentionZone+AttentionItem, widget unit tests, hook unit tests, i18n files)
- Role-match analogs: 7 (Dashboard composer, css file, Digest→ActivityFeed, VipVisits→TimelineEventCard, MyTasks→AttentionItem, RecentDossiers→dossierStore consumers, ForumsStrip→ActivityFeedItem, E2E spec)
- No exact analog: 1 (SlaHealth — novel Donut+Sparkline composition; derive from Phase 37 primitives + tests)

### Strongest analogs
1. `QuickStatsBar.tsx` + `QuickStatCard.tsx` → KpiStrip (already consumes `useDashboardStats`, keyboard-nav cards, Skeleton shape, LtrIsolate for large numerals)
2. `TimelineZone.tsx` + `useUpcomingEvents.ts` → WeekAhead (identical day-group + expand semantics; `groupEventsByDay` reusable)
3. `AttentionZone.tsx` + `AttentionItem.tsx` → OverdueCommitments (severity CVA, sort order, keyboard-nav, role="region" aria-label shell)
4. `dashboard.tsx` self-preserve — 90% of the route rewrite is literal preservation of lines 26–103

### Key cross-cutting patterns
- Widget shell: `role="region" aria-label` + loading Skeleton + error card with retry + empty-state component + data (AttentionZone lines 70–151)
- `LtrIsolate` for every LTR-direction numeral / date / short code
- HeroUI v3 wrappers via `@/components/ui/*` (never `@heroui/react` direct)
- `cva` variants for severity coloring (AttentionItem lines 20–34)
- `@/components/signature-visuals` barrel for all glyphs/charts/loaders

### Gaps flagged to planner
- Phase 36 and 37 SUMMARY.md files not found at expected paths (only per-plan summaries exist for 37). Planner should consult `.planning/phases/37-signature-visuals/37-PATTERNS.md` before Wave 1, and infer AppShell behavior from `routes/__root.tsx` + `routes/_protected.tsx` directly.
- No existing domain-code consumer of signature-visuals — SlaHealth (Plan 38-05) is the first real consumer; derive prop shapes from `components/signature-visuals/__tests__/`.
- Digest (38-04) and VipVisits (38-06) data-source hooks still require user Q&A gate before planning completes.

### File Created
`.planning/phases/38-dashboard-verbatim/38-PATTERNS.md`
