import { r as x, u as I, j as e } from './react-vendor-Buoak6m3.js'
import { a as R, b as ie, c as J, L as le, i as oe, k as ce } from './tanstack-vendor-BZC-rs5U.js'
import {
  s as A,
  j as w,
  l as N,
  a0 as v,
  c as p,
  k as O,
  o as K,
  ae as V,
  Z as de,
  _ as me,
  $ as ue,
  m as T,
  af as xe,
  ag as he,
  B as D,
  p as pe,
  aN as ge,
  I as fe,
  D as B,
  x as F,
  y as q,
  a8 as P,
  a9 as $,
  z as E,
} from './index-qYY0KoZ1.js'
import {
  cl as ye,
  aA as W,
  aR as G,
  bH as be,
  bi as ke,
  bm as Y,
  bd as je,
  dA as ve,
  bD as Z,
  bT as X,
  aW as ee,
  aM as we,
  b7 as Ne,
  bw as Q,
  du as Te,
  aS as z,
  aI as Ce,
  dB as _e,
  aE as Ie,
  cV as Se,
  aN as H,
  cC as Le,
  bF as Ae,
} from './vendor-misc-BiJvMP0A.js'
import {
  Q as De,
  V as Oe,
  W as Me,
  U as Ue,
  H as Ee,
  I as Re,
  J as We,
} from './date-vendor-s0MkYge4.js'
import { A as Be, a as Fe } from './avatar-lQOCSoMx.js'
import { o as qe, e as L, s as Pe } from './form-vendor-BX1BhTCI.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './visualization-vendor-f5uYUx4I.js'
const M = 'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/unified-work-list'
function $e(s) {
  const a = new URLSearchParams()
  return (
    Object.entries(s).forEach(([r, n]) => {
      n != null && (Array.isArray(n) ? a.set(r, n.join(',')) : a.set(r, String(n)))
    }),
    a.toString()
  )
}
async function U() {
  const {
      data: { session: s },
    } = await A.auth.getSession(),
    a = new Headers({
      'Content-Type': 'application/json',
      apikey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcmNqemRlbWRtd2hlYXJoZmdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MjY0OTAsImV4cCI6MjA3NDQwMjQ5MH0.JnSwNH0rsz8yg9zx73_3qc5CpJ6oo-udpo3G4ZIwkYQ',
    })
  return (s?.access_token && a.set('Authorization', `Bearer ${s.access_token}`), a)
}
async function Qe(s = {}, a, r = 50, n = 'deadline', c = 'asc') {
  const d = $e({
      endpoint: 'list',
      sources: s.sources,
      trackingTypes: s.trackingTypes,
      statuses: s.statuses,
      priorities: s.priorities,
      isOverdue: s.isOverdue,
      dossierId: s.dossierId,
      search: s.searchQuery,
      cursorDeadline: a?.deadline,
      cursorId: a?.id,
      limit: r,
      sortBy: n,
      sortOrder: c,
    }),
    l = await U(),
    t = await fetch(`${M}?${d}`, { method: 'GET', headers: l })
  if (!t.ok) {
    const i = await t.json()
    throw new Error(i.error || 'Failed to fetch work items')
  }
  return t.json()
}
async function ze() {
  const s = await U(),
    a = await fetch(`${M}?endpoint=summary`, { method: 'GET', headers: s })
  if (!a.ok) {
    const r = await a.json()
    throw new Error(r.error || 'Failed to fetch work summary')
  }
  return a.json()
}
async function He() {
  const s = await U(),
    a = await fetch(`${M}?endpoint=metrics`, { method: 'GET', headers: s })
  if (!a.ok) {
    const r = await a.json()
    throw new Error(r.error || 'Failed to fetch productivity metrics')
  }
  return a.json()
}
async function Je() {
  const s = await U(),
    a = await fetch(`${M}?endpoint=team`, { method: 'GET', headers: s })
  if (!a.ok) {
    const n = await a.json()
    throw new Error(n.error || 'Failed to fetch team workload')
  }
  return (await a.json()).team_members || []
}
const k = {
  all: ['unified-work'],
  items: () => [...k.all, 'items'],
  itemsFiltered: (s, a, r) => [...k.items(), { filters: s, sortBy: a, sortOrder: r }],
  summary: () => [...k.all, 'summary'],
  metrics: () => [...k.all, 'metrics'],
  team: () => [...k.all, 'team'],
}
function Ke(s = {}, a = 'deadline', r = 'asc', n = 50, c = !0) {
  return ie({
    queryKey: k.itemsFiltered(s, a, r),
    queryFn: async ({ pageParam: d }) => Qe(s, d, n, a, r),
    initialPageParam: void 0,
    getNextPageParam: (d) => (d.hasMore ? d.nextCursor : void 0),
    enabled: c,
    staleTime: 30 * 1e3,
    gcTime: 5 * 60 * 1e3,
  })
}
function Ve(s = !0) {
  return R({
    queryKey: k.summary(),
    queryFn: ze,
    enabled: s,
    staleTime: 30 * 1e3,
    gcTime: 5 * 60 * 1e3,
    refetchOnWindowFocus: !0,
  })
}
function Ge(s = !0) {
  return R({
    queryKey: k.metrics(),
    queryFn: He,
    enabled: s,
    staleTime: 5 * 60 * 1e3,
    gcTime: 30 * 60 * 1e3,
  })
}
function Ye(s = !0) {
  return R({
    queryKey: k.team(),
    queryFn: Je,
    enabled: s,
    staleTime: 60 * 1e3,
    gcTime: 10 * 60 * 1e3,
    retry: (a, r) => (r instanceof Error && r.message.includes('Forbidden') ? !1 : a < 3),
  })
}
function Ze() {
  const s = J()
  return {
    invalidateAll: () => {
      s.invalidateQueries({ queryKey: k.all })
    },
    invalidateItems: () => {
      s.invalidateQueries({ queryKey: k.items() })
    },
    invalidateSummary: () => {
      s.invalidateQueries({ queryKey: k.summary() })
    },
    invalidateMetrics: () => {
      s.invalidateQueries({ queryKey: k.metrics() })
    },
    invalidateTeam: () => {
      s.invalidateQueries({ queryKey: k.team() })
    },
  }
}
function Xe(s = {}, a = 'deadline', r = 'asc') {
  const n = Ve(),
    c = Ge(),
    d = Ke(s, a, r)
  return {
    summary: n,
    metrics: c,
    items: d,
    isLoading: n.isLoading || d.isLoading,
    isError: n.isError || d.isError,
    error: n.error || d.error,
  }
}
const es = 300
function ss({ userId: s, enabled: a = !0, debounceMs: r = es } = {}) {
  const n = J(),
    { invalidateAll: c, invalidateSummary: d } = Ze(),
    l = x.useRef(null),
    t = x.useRef(null),
    i = x.useRef(new Set()),
    m = x.useCallback(() => {
      ;(t.current && clearTimeout(t.current),
        (t.current = setTimeout(() => {
          const f = i.current
          ;(f.has('all')
            ? c()
            : (f.has('summary') && d(),
              f.has('items') && n.invalidateQueries({ queryKey: k.items() })),
            i.current.clear())
        }, r)))
    }, [r, c, d, n]),
    g = x.useCallback(
      (f) => {
        ;(i.current.add(f), m())
      },
      [m],
    )
  return (
    x.useEffect(() => {
      if (!a) return
      const f = s ? `unified-work:${s}` : 'unified-work:all',
        y = A.channel(f)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'aa_commitments',
              ...(s && { filter: `owner_user_id=eq.${s}` }),
            },
            (u) => {
              g('all')
            },
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'tasks',
              ...(s && { filter: `assignee_id=eq.${s}` }),
            },
            (u) => {
              g('all')
            },
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'intake_tickets',
              ...(s && { filter: `assigned_to=eq.${s}` }),
            },
            (u) => {
              g('all')
            },
          )
          .subscribe((u) => {})
      return (
        (l.current = y),
        () => {
          ;(t.current && clearTimeout(t.current),
            l.current && (A.removeChannel(l.current), (l.current = null)))
        }
      )
    }, [a, s, g]),
    {
      forceInvalidate: () => {
        ;(i.current.clear(), t.current && clearTimeout(t.current), c())
      },
    }
  )
}
function ts() {
  const [s, a] = x.useState()
  return (
    x.useEffect(() => {
      A.auth.getUser().then(({ data: n }) => {
        a(n.user?.id)
      })
      const {
        data: { subscription: r },
      } = A.auth.onAuthStateChange((n, c) => {
        a(c?.user?.id)
      })
      return () => {
        r.unsubscribe()
      }
    }, []),
    s
  )
}
function as({ summary: s, isLoading: a, onFilterClick: r, currentFilter: n }) {
  const { t: c, i18n: d } = I('my-work'),
    l = d.language === 'ar',
    t = [
      {
        key: 'active',
        label: c('stats.totalActive', 'Total Active'),
        value: s?.total_active || 0,
        icon: ye,
        color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
        filter: void 0,
      },
      {
        key: 'overdue',
        label: c('stats.overdue', 'Overdue'),
        value: s?.overdue_count || 0,
        icon: W,
        color: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
        filter: 'overdue',
      },
      {
        key: 'due-today',
        label: c('stats.dueToday', 'Due Today'),
        value: s?.due_today || 0,
        icon: G,
        color: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30',
        filter: 'due-today',
      },
      {
        key: 'due-week',
        label: c('stats.dueThisWeek', 'Due This Week'),
        value: s?.due_this_week || 0,
        icon: be,
        color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
        filter: 'due-week',
      },
    ]
  return a
    ? e.jsx('div', {
        className: 'grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6',
        children: [1, 2, 3, 4].map((i) =>
          e.jsx(
            w,
            {
              children: e.jsxs(N, {
                className: 'p-3 sm:p-4',
                children: [
                  e.jsx(v, { className: 'h-4 w-20 mb-2' }),
                  e.jsx(v, { className: 'h-8 w-12' }),
                ],
              }),
            },
            i,
          ),
        ),
      })
    : e.jsx('div', {
        className: 'grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6',
        dir: l ? 'rtl' : 'ltr',
        children: t.map((i) => {
          const m = i.icon,
            g = n === i.filter || (i.key === 'active' && !n)
          return e.jsx(
            w,
            {
              className: p(
                'cursor-pointer transition-all hover:shadow-md',
                g && 'ring-2 ring-primary ring-offset-2',
              ),
              onClick: () => r(i.filter === n ? void 0 : i.filter),
              children: e.jsx(N, {
                className: 'p-3 sm:p-4',
                children: e.jsxs('div', {
                  className: 'flex items-center gap-2 sm:gap-3',
                  children: [
                    e.jsx('div', {
                      className: p('p-2 rounded-lg', i.color),
                      children: e.jsx(m, { className: 'h-4 w-4 sm:h-5 sm:w-5' }),
                    }),
                    e.jsxs('div', {
                      className: 'min-w-0 flex-1',
                      children: [
                        e.jsx('p', {
                          className: 'text-xs sm:text-sm text-muted-foreground truncate text-start',
                          children: i.label,
                        }),
                        e.jsx('p', {
                          className: 'text-xl sm:text-2xl font-bold text-start',
                          children: i.value.toLocaleString(l ? 'ar-SA' : 'en-US'),
                        }),
                      ],
                    }),
                  ],
                }),
              }),
            },
            i.key,
          )
        }),
      })
}
function rs({ metrics: s, isLoading: a }) {
  const { t: r, i18n: n } = I('my-work'),
    c = n.language === 'ar'
  if (a)
    return e.jsxs(w, {
      className: 'mb-4 sm:mb-6',
      children: [
        e.jsx(O, { className: 'pb-2', children: e.jsx(v, { className: 'h-5 w-40' }) }),
        e.jsx(N, {
          children: e.jsx('div', {
            className: 'grid grid-cols-1 sm:grid-cols-3 gap-4',
            children: [1, 2, 3].map((t) =>
              e.jsxs(
                'div',
                {
                  className: 'flex items-center gap-3',
                  children: [
                    e.jsx(v, { className: 'h-10 w-10 rounded-lg' }),
                    e.jsxs('div', {
                      className: 'flex-1',
                      children: [
                        e.jsx(v, { className: 'h-3 w-20 mb-1' }),
                        e.jsx(v, { className: 'h-6 w-16' }),
                      ],
                    }),
                  ],
                },
                t,
              ),
            ),
          }),
        }),
      ],
    })
  const d = (t) => (t < 24 ? `${Math.round(t)}h` : `${Math.round(t / 24)}d`),
    l = [
      {
        key: 'completed',
        label: r('metrics.completed30d', 'Completed (30d)'),
        value: s?.completed_count_30d || 0,
        icon: ke,
        color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
        format: (t) => t.toLocaleString(c ? 'ar-SA' : 'en-US'),
      },
      {
        key: 'on-time',
        label: r('metrics.onTimeRate', 'On-Time Rate'),
        value: s?.on_time_rate_30d || 0,
        icon: Y,
        color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
        format: (t) => `${t}%`,
        showProgress: !0,
      },
      {
        key: 'avg-time',
        label: r('metrics.avgCompletionTime', 'Avg Completion'),
        value: s?.avg_completion_hours_30d || 0,
        icon: je,
        color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
        format: d,
      },
    ]
  return e.jsxs(w, {
    className: 'mb-4 sm:mb-6',
    dir: c ? 'rtl' : 'ltr',
    children: [
      e.jsx(O, {
        className: 'pb-2 px-4 sm:px-6',
        children: e.jsx(K, {
          className: 'text-base sm:text-lg text-start',
          children: r('metrics.title', 'Your Productivity'),
        }),
      }),
      e.jsx(N, {
        className: 'px-4 sm:px-6',
        children: e.jsx('div', {
          className: 'grid grid-cols-1 sm:grid-cols-3 gap-4',
          children: l.map((t) => {
            const i = t.icon
            return e.jsxs(
              'div',
              {
                className: 'flex items-center gap-3',
                children: [
                  e.jsx('div', {
                    className: p('p-2.5 rounded-lg shrink-0', t.color),
                    children: e.jsx(i, { className: 'h-5 w-5' }),
                  }),
                  e.jsxs('div', {
                    className: 'min-w-0 flex-1',
                    children: [
                      e.jsx('p', {
                        className: 'text-xs text-muted-foreground text-start',
                        children: t.label,
                      }),
                      e.jsxs('div', {
                        className: 'flex items-center gap-2',
                        children: [
                          e.jsx('p', {
                            className: 'text-lg sm:text-xl font-semibold text-start',
                            children: t.format(t.value),
                          }),
                          t.showProgress &&
                            e.jsx(V, { value: t.value, className: 'h-2 flex-1 max-w-20' }),
                        ],
                      }),
                    ],
                  }),
                ],
              },
              t.key,
            )
          }),
        }),
      }),
    ],
  })
}
function ns({ activeTab: s, onTabChange: a, counts: r }) {
  const { t: n, i18n: c } = I('my-work'),
    d = c.language === 'ar',
    l = [
      { id: 'all', label: n('tabs.all', 'All'), icon: ve, count: r.all },
      {
        id: 'commitments',
        label: n('tabs.commitments', 'Commitments'),
        icon: Z,
        count: r.commitments,
      },
      { id: 'tasks', label: n('tabs.tasks', 'Tasks'), icon: X, count: r.tasks },
      { id: 'intake', label: n('tabs.intake', 'Intake'), icon: ee, count: r.intake },
    ]
  return e.jsx(de, {
    value: s,
    onValueChange: a,
    className: 'mb-4',
    dir: d ? 'rtl' : 'ltr',
    children: e.jsx(me, {
      className: 'w-full h-auto flex-wrap justify-start gap-1 bg-muted/50 p-1',
      children: l.map((t) => {
        const i = t.icon,
          m = s === t.id
        return e.jsxs(
          ue,
          {
            value: t.id,
            className: p(
              'flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 min-h-10',
              'data-[state=active]:bg-background data-[state=active]:shadow-sm',
            ),
            children: [
              e.jsx(i, { className: 'h-4 w-4 shrink-0' }),
              e.jsx('span', { className: 'text-sm font-medium', children: t.label }),
              t.count > 0 &&
                e.jsx(T, {
                  variant: m ? 'default' : 'secondary',
                  className: 'ms-1 h-5 min-w-5 px-1.5 text-xs',
                  children: t.count > 99 ? '99+' : t.count,
                }),
            ],
          },
          t.id,
        )
      }),
    }),
  })
}
function is({ item: s }) {
  const { t: a, i18n: r } = I('my-work'),
    n = r.language === 'ar',
    c = n ? Re : We,
    d = {
      commitment: {
        icon: Z,
        color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
        label: a('source.commitment', 'Commitment'),
      },
      task: {
        icon: X,
        color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
        label: a('source.task', 'Task'),
      },
      intake: {
        icon: ee,
        color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
        label: a('source.intake', 'Intake'),
      },
    },
    l = {
      delivery: {
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        label: a('trackingType.delivery', 'Delivery'),
      },
      follow_up: {
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        label: a('trackingType.followUp', 'Follow-up'),
      },
      sla: {
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        label: a('trackingType.sla', 'SLA'),
      },
    },
    t = {
      low: {
        color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        label: a('priority.low', 'Low'),
      },
      medium: {
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        label: a('priority.medium', 'Medium'),
      },
      high: {
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        label: a('priority.high', 'High'),
      },
      critical: {
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        label: a('priority.critical', 'Critical'),
      },
      urgent: {
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        label: a('priority.urgent', 'Urgent'),
      },
    },
    i = (C) => {
      if (!C) return null
      const o = new Date(C),
        _ = De(o)
      return Oe(o)
        ? { text: a('deadline.today', 'Today'), urgent: !0 }
        : Me(o)
          ? { text: a('deadline.tomorrow', 'Tomorrow'), urgent: !0 }
          : _
            ? { text: Ue(o, { addSuffix: !0, locale: c }), urgent: !0 }
            : { text: Ee(o, 'MMM d', { locale: c }), urgent: !1 }
    },
    m = d[s.source],
    g = l[s.tracking_type],
    f = t[s.priority] || t.medium,
    y = i(s.deadline),
    u = m.icon,
    j = (() => {
      switch (s.source) {
        case 'commitment':
          return `/commitments?id=${s.id}`
        case 'task':
          return `/tasks/${s.id}`
        case 'intake':
          return `/intake/tickets/${s.id}`
        default:
          return '#'
      }
    })()
  return e.jsx(le, {
    to: j,
    className: 'block',
    children: e.jsx(w, {
      className: p(
        'transition-all hover:shadow-md hover:border-primary/20 cursor-pointer',
        s.is_overdue && 'border-red-300 dark:border-red-800',
      ),
      dir: n ? 'rtl' : 'ltr',
      children: e.jsx(N, {
        className: 'p-3 sm:p-4',
        children: e.jsxs('div', {
          className: 'flex items-start gap-3',
          children: [
            e.jsx('div', {
              className: p('p-2 rounded-lg shrink-0', m.color),
              children: e.jsx(u, { className: 'h-5 w-5' }),
            }),
            e.jsxs('div', {
              className: 'min-w-0 flex-1',
              children: [
                e.jsxs('div', {
                  className: 'flex items-start justify-between gap-2 mb-1',
                  children: [
                    e.jsx('span', {
                      className:
                        'font-medium text-sm sm:text-base hover:text-primary transition-colors line-clamp-2 text-start',
                      children: s.title,
                    }),
                    e.jsx(we, {
                      className: p(
                        'h-4 w-4 text-muted-foreground shrink-0 mt-1',
                        n && 'rotate-180',
                      ),
                    }),
                  ],
                }),
                s.description &&
                  e.jsx('p', {
                    className:
                      'text-xs sm:text-sm text-muted-foreground line-clamp-1 mb-2 text-start',
                    children: s.description,
                  }),
                e.jsxs('div', {
                  className: 'flex flex-wrap items-center gap-1.5 sm:gap-2',
                  children: [
                    e.jsx(T, {
                      variant: 'outline',
                      className: 'text-xs px-1.5 py-0',
                      children: m.label,
                    }),
                    e.jsx(T, {
                      className: p('text-xs px-1.5 py-0', g.color),
                      variant: 'secondary',
                      children: g.label,
                    }),
                    e.jsx(T, {
                      className: p('text-xs px-1.5 py-0', f.color),
                      variant: 'secondary',
                      children: f.label,
                    }),
                    s.is_overdue &&
                      e.jsxs(T, {
                        variant: 'destructive',
                        className: 'text-xs px-1.5 py-0 gap-1',
                        children: [
                          e.jsx(W, { className: 'h-3 w-3' }),
                          a('status.overdue', 'Overdue'),
                        ],
                      }),
                    y &&
                      e.jsxs(T, {
                        variant: 'outline',
                        className: p(
                          'text-xs px-1.5 py-0 gap-1',
                          y.urgent &&
                            'border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-400',
                        ),
                        children: [e.jsx(G, { className: 'h-3 w-3' }), y.text],
                      }),
                    s.days_until_due !== null &&
                      !s.is_overdue &&
                      e.jsx('span', {
                        className: 'hidden sm:inline text-xs text-muted-foreground',
                        children:
                          s.days_until_due === 0
                            ? a('deadline.dueToday', 'Due today')
                            : s.days_until_due === 1
                              ? a('deadline.dueTomorrow', 'Due tomorrow')
                              : a('deadline.dueInDays', { count: s.days_until_due }),
                      }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
    }),
  })
}
function ls({
  items: s,
  isLoading: a,
  isError: r,
  error: n,
  hasMore: c,
  onLoadMore: d,
  isFetchingMore: l,
}) {
  const { t, i18n: i } = I('my-work'),
    m = i.language === 'ar',
    g = x.useRef(null),
    f = Ne({
      count: s.length + (c ? 1 : 0),
      getScrollElement: () => g.current,
      estimateSize: () => 120,
      overscan: 5,
    }),
    y = x.useCallback(
      (u) => {
        if (!u || a || l || !c) return
        const b = new IntersectionObserver(
          (j) => {
            j[0].isIntersecting && d()
          },
          { rootMargin: '200px' },
        )
        return (b.observe(u), () => b.disconnect())
      },
      [a, l, c, d],
    )
  return a && s.length === 0
    ? e.jsx('div', {
        className: 'space-y-3',
        dir: m ? 'rtl' : 'ltr',
        children: [1, 2, 3, 4, 5].map((u) =>
          e.jsx(
            w,
            {
              children: e.jsx(N, {
                className: 'p-4',
                children: e.jsxs('div', {
                  className: 'flex items-start gap-3',
                  children: [
                    e.jsx(v, { className: 'h-10 w-10 rounded-lg shrink-0' }),
                    e.jsxs('div', {
                      className: 'flex-1 space-y-2',
                      children: [
                        e.jsx(v, { className: 'h-4 w-3/4' }),
                        e.jsx(v, { className: 'h-3 w-1/2' }),
                        e.jsxs('div', {
                          className: 'flex gap-2 pt-1',
                          children: [
                            e.jsx(v, { className: 'h-5 w-16' }),
                            e.jsx(v, { className: 'h-5 w-20' }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              }),
            },
            u,
          ),
        ),
      })
    : r
      ? e.jsxs(xe, {
          variant: 'destructive',
          dir: m ? 'rtl' : 'ltr',
          children: [
            e.jsx(Q, { className: 'h-4 w-4' }),
            e.jsxs(he, {
              className: 'flex items-center justify-between',
              children: [
                e.jsx('span', {
                  children: n?.message || t('error.loading', 'Failed to load work items'),
                }),
                e.jsxs(D, {
                  variant: 'outline',
                  size: 'sm',
                  onClick: () => window.location.reload(),
                  children: [e.jsx(Te, { className: 'h-4 w-4 me-2' }), t('error.retry', 'Retry')],
                }),
              ],
            }),
          ],
        })
      : s.length === 0
        ? e.jsx(w, {
            dir: m ? 'rtl' : 'ltr',
            children: e.jsxs(N, {
              className: 'py-12 text-center',
              children: [
                e.jsx('div', {
                  className:
                    'mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4',
                  children: e.jsx(Q, { className: 'h-6 w-6 text-muted-foreground' }),
                }),
                e.jsx('h3', {
                  className: 'font-medium text-lg mb-1',
                  children: t('empty.title', 'No work items found'),
                }),
                e.jsx('p', {
                  className: 'text-muted-foreground text-sm',
                  children: t(
                    'empty.description',
                    'Try adjusting your filters or check back later',
                  ),
                }),
              ],
            }),
          })
        : e.jsxs('div', {
            ref: g,
            className: 'h-[calc(100vh-400px)] min-h-[400px] overflow-auto',
            dir: m ? 'rtl' : 'ltr',
            children: [
              e.jsx('div', {
                style: { height: `${f.getTotalSize()}px`, width: '100%', position: 'relative' },
                children: f.getVirtualItems().map((u) => {
                  const b = u.index >= s.length,
                    j = s[u.index]
                  return e.jsx(
                    'div',
                    {
                      ref: u.index === s.length - 1 ? y : void 0,
                      style: {
                        position: 'absolute',
                        top: 0,
                        [m ? 'right' : 'left']: 0,
                        width: '100%',
                        transform: `translateY(${u.start}px)`,
                      },
                      className: 'pb-3',
                      children: b
                        ? e.jsx('div', {
                            className: 'flex justify-center py-4',
                            children: e.jsx(z, {
                              className: 'h-6 w-6 animate-spin text-muted-foreground',
                            }),
                          })
                        : e.jsx(is, { item: j }),
                    },
                    u.key,
                  )
                }),
              }),
              c &&
                !l &&
                e.jsx('div', {
                  className: 'flex justify-center py-4',
                  children: e.jsx(D, {
                    variant: 'outline',
                    onClick: d,
                    children: t('loadMore', 'Load More'),
                  }),
                }),
              l &&
                e.jsx('div', {
                  className: 'flex justify-center py-4',
                  children: e.jsx(z, { className: 'h-6 w-6 animate-spin text-muted-foreground' }),
                }),
            ],
          })
}
function os({ teamMembers: s, isLoading: a }) {
  const { t: r, i18n: n } = I('my-work'),
    c = n.language === 'ar'
  if (a)
    return e.jsxs(w, {
      className: 'mb-4 sm:mb-6',
      children: [
        e.jsx(O, { className: 'pb-2', children: e.jsx(v, { className: 'h-5 w-40' }) }),
        e.jsx(N, {
          children: e.jsx('div', {
            className: 'flex gap-4 overflow-hidden',
            children: [1, 2, 3, 4].map((l) =>
              e.jsx(
                'div',
                {
                  className: 'w-48 shrink-0',
                  children: e.jsx(v, { className: 'h-24 w-full rounded-lg' }),
                },
                l,
              ),
            ),
          }),
        }),
      ],
    })
  if (s.length === 0) return null
  const d = (l) => {
    const t = l.split('@')[0] || 'U',
      i = t.split(/[._-]/)
    return i.length >= 2 && i[0] && i[1]
      ? `${i[0][0]}${i[1][0]}`.toUpperCase()
      : t.slice(0, 2).toUpperCase()
  }
  return e.jsxs(w, {
    className: 'mb-4 sm:mb-6',
    dir: c ? 'rtl' : 'ltr',
    children: [
      e.jsx(O, {
        className: 'pb-2 px-4 sm:px-6',
        children: e.jsxs(K, {
          className: 'text-base sm:text-lg flex items-center gap-2 text-start',
          children: [
            e.jsx(Ce, { className: 'h-5 w-5' }),
            r('team.title', 'Team Workload'),
            e.jsxs(T, {
              variant: 'secondary',
              className: 'ms-2',
              children: [s.length, ' ', r('team.members', 'members')],
            }),
          ],
        }),
      }),
      e.jsx(N, {
        className: 'px-4 sm:px-6',
        children: e.jsxs(pe, {
          className: 'w-full',
          children: [
            e.jsx('div', {
              className: 'flex gap-3 pb-2',
              children: s.map((l) => {
                const t = l.overdue_count > 0,
                  i = Math.min((l.total_active / 20) * 100, 100)
                return e.jsx(
                  w,
                  {
                    className: p(
                      'w-48 shrink-0 transition-all hover:shadow-md',
                      t && 'border-red-200 dark:border-red-800',
                    ),
                    children: e.jsxs(N, {
                      className: 'p-3',
                      children: [
                        e.jsxs('div', {
                          className: 'flex items-center gap-2 mb-3',
                          children: [
                            e.jsx(Be, {
                              className: 'h-8 w-8',
                              children: e.jsx(Fe, {
                                className: 'text-xs',
                                children: d(l.user_email),
                              }),
                            }),
                            e.jsxs('div', {
                              className: 'min-w-0 flex-1',
                              children: [
                                e.jsx('p', {
                                  className: 'text-sm font-medium truncate text-start',
                                  children: l.user_email.split('@')[0],
                                }),
                                t &&
                                  e.jsxs('div', {
                                    className:
                                      'flex items-center gap-1 text-xs text-red-600 dark:text-red-400',
                                    children: [
                                      e.jsx(W, { className: 'h-3 w-3' }),
                                      e.jsxs('span', {
                                        children: [
                                          l.overdue_count,
                                          ' ',
                                          r('team.overdue', 'overdue'),
                                        ],
                                      }),
                                    ],
                                  }),
                              ],
                            }),
                          ],
                        }),
                        e.jsxs('div', {
                          className: 'space-y-2',
                          children: [
                            e.jsxs('div', {
                              className: 'flex items-center justify-between text-xs',
                              children: [
                                e.jsx('span', {
                                  className: 'text-muted-foreground text-start',
                                  children: r('team.active', 'Active'),
                                }),
                                e.jsx('span', {
                                  className: 'font-medium',
                                  children: l.total_active,
                                }),
                              ],
                            }),
                            e.jsx(V, {
                              value: i,
                              className: p(
                                'h-1.5',
                                i > 80 && 'bg-red-100 [&>div]:bg-red-500',
                                i > 60 && i <= 80 && 'bg-orange-100 [&>div]:bg-orange-500',
                              ),
                            }),
                            e.jsxs('div', {
                              className: 'flex items-center justify-between text-xs pt-1',
                              children: [
                                e.jsxs('span', {
                                  className:
                                    'text-muted-foreground flex items-center gap-1 text-start',
                                  children: [
                                    e.jsx(Y, { className: 'h-3 w-3' }),
                                    r('team.onTime', 'On-time'),
                                  ],
                                }),
                                e.jsxs('span', {
                                  className: p(
                                    'font-medium',
                                    l.on_time_rate_30d >= 80
                                      ? 'text-green-600 dark:text-green-400'
                                      : l.on_time_rate_30d >= 60
                                        ? 'text-yellow-600 dark:text-yellow-400'
                                        : 'text-red-600 dark:text-red-400',
                                  ),
                                  children: [l.on_time_rate_30d, '%'],
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  },
                  l.user_id,
                )
              }),
            }),
            e.jsx(ge, { orientation: 'horizontal' }),
          ],
        }),
      }),
    ],
  })
}
function cs({
  trackingType: s,
  onTrackingTypeChange: a,
  searchQuery: r,
  onSearchChange: n,
  sortBy: c,
  sortOrder: d,
  onSortChange: l,
}) {
  const { t, i18n: i } = I('my-work'),
    m = i.language === 'ar',
    [g, f] = x.useState(r),
    y = _e((o) => {
      n(o)
    }, 300),
    u = x.useCallback(
      (o) => {
        const _ = o.target.value
        ;(f(_), y(_))
      },
      [y],
    ),
    b = [
      {
        id: 'delivery',
        label: t('trackingType.delivery', 'Delivery'),
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      },
      {
        id: 'follow_up',
        label: t('trackingType.followUp', 'Follow-up'),
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      },
      {
        id: 'sla',
        label: t('trackingType.sla', 'SLA'),
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      },
    ],
    j = [
      { sortBy: 'deadline', sortOrder: 'asc', label: t('sort.deadlineAsc', 'Deadline (Earliest)') },
      { sortBy: 'deadline', sortOrder: 'desc', label: t('sort.deadlineDesc', 'Deadline (Latest)') },
      {
        sortBy: 'priority',
        sortOrder: 'desc',
        label: t('sort.priorityDesc', 'Priority (High to Low)'),
      },
      {
        sortBy: 'priority',
        sortOrder: 'asc',
        label: t('sort.priorityAsc', 'Priority (Low to High)'),
      },
      { sortBy: 'created_at', sortOrder: 'desc', label: t('sort.createdDesc', 'Newest First') },
      { sortBy: 'created_at', sortOrder: 'asc', label: t('sort.createdAsc', 'Oldest First') },
    ],
    C = j.find((o) => o.sortBy === c && o.sortOrder === d)
  return e.jsxs('div', {
    className: 'flex flex-col sm:flex-row gap-3 mb-4',
    dir: m ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className: 'relative flex-1',
        children: [
          e.jsx(Ie, {
            className: p(
              'absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground',
              m ? 'end-3' : 'start-3',
            ),
          }),
          e.jsx(fe, {
            placeholder: t('search.placeholder', 'Search work items...'),
            value: g,
            onChange: u,
            className: p('h-10', m ? 'pe-10 ps-3' : 'ps-10 pe-3'),
          }),
        ],
      }),
      e.jsxs(B, {
        children: [
          e.jsx(F, {
            asChild: !0,
            children: e.jsxs(D, {
              variant: 'outline',
              className: 'h-10 gap-2 whitespace-nowrap',
              children: [
                e.jsx(Se, { className: 'h-4 w-4' }),
                e.jsx('span', {
                  className: 'hidden sm:inline',
                  children: t('filters.trackingType', 'Type'),
                }),
                s &&
                  e.jsx(T, {
                    variant: 'secondary',
                    className: 'ms-1',
                    children: b.find((o) => o.id === s)?.label,
                  }),
                e.jsx(H, { className: 'h-4 w-4 ms-1' }),
              ],
            }),
          }),
          e.jsxs(q, {
            align: m ? 'start' : 'end',
            className: 'w-48',
            children: [
              e.jsx(P, { children: t('filters.trackingType', 'Tracking Type') }),
              e.jsx($, {}),
              e.jsx(E, { onClick: () => a(void 0), children: t('filters.all', 'All Types') }),
              b.map((o) =>
                e.jsx(
                  E,
                  {
                    onClick: () => a(o.id),
                    className: p(s === o.id && 'bg-accent'),
                    children: e.jsx(T, {
                      className: p('me-2', o.color),
                      variant: 'secondary',
                      children: o.label,
                    }),
                  },
                  o.id,
                ),
              ),
            ],
          }),
        ],
      }),
      e.jsxs(B, {
        children: [
          e.jsx(F, {
            asChild: !0,
            children: e.jsxs(D, {
              variant: 'outline',
              className: 'h-10 gap-2 whitespace-nowrap',
              children: [
                e.jsx(Le, { className: 'h-4 w-4' }),
                e.jsx('span', { className: 'hidden sm:inline', children: t('sort.label', 'Sort') }),
                e.jsx(H, { className: 'h-4 w-4 ms-1' }),
              ],
            }),
          }),
          e.jsxs(q, {
            align: m ? 'start' : 'end',
            className: 'w-56',
            children: [
              e.jsx(P, { children: t('sort.label', 'Sort By') }),
              e.jsx($, {}),
              j.map((o, _) =>
                e.jsx(
                  E,
                  {
                    onClick: () => l(o.sortBy, o.sortOrder),
                    className: p(
                      C?.sortBy === o.sortBy && C?.sortOrder === o.sortOrder && 'bg-accent',
                    ),
                    children: o.label,
                  },
                  _,
                ),
              ),
            ],
          }),
        ],
      }),
    ],
  })
}
function ds() {
  const { t: s, i18n: a } = I('my-work'),
    r = a.language === 'ar',
    n = oe(),
    c = ce({ from: '/_protected/my-work/' }),
    {
      tab: d = 'all',
      filter: l,
      trackingType: t,
      search: i,
      sortBy: m = 'deadline',
      sortOrder: g = 'asc',
    } = c,
    f = x.useMemo(() => {
      const h = {}
      if (d !== 'all') {
        const S = { commitments: 'commitment', tasks: 'task', intake: 'intake' }
        h.sources = [S[d]]
      }
      return (
        t && (h.trackingTypes = [t]),
        l === 'overdue' && (h.isOverdue = !0),
        i && (h.searchQuery = i),
        h
      )
    }, [d, t, l, i]),
    { summary: y, metrics: u, items: b } = Xe(f, m, g),
    j = Ye(),
    C = ts()
  ss({ userId: C, enabled: !!C })
  const o = x.useCallback(
      (h) => {
        n({ search: (S) => ({ ...S, ...h }), replace: !0 })
      },
      [n],
    ),
    _ = x.useCallback(
      (h) => {
        o({ tab: h })
      },
      [o],
    ),
    se = x.useCallback(
      (h) => {
        o({ filter: h })
      },
      [o],
    ),
    te = x.useCallback(
      (h) => {
        o({ trackingType: h })
      },
      [o],
    ),
    ae = x.useCallback(
      (h) => {
        o({ search: h || void 0 })
      },
      [o],
    ),
    re = x.useCallback(
      (h, S) => {
        o({ sortBy: h, sortOrder: S })
      },
      [o],
    ),
    ne = x.useMemo(() => b.data?.pages.flatMap((h) => h.items) || [], [b.data])
  return e.jsxs('div', {
    className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6',
    dir: r ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className:
          'mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3',
        children: [
          e.jsxs('div', {
            children: [
              e.jsx('h1', {
                className: 'text-2xl sm:text-3xl font-bold text-start',
                children: s('title', 'My Work'),
              }),
              e.jsx('p', {
                className: 'text-muted-foreground text-sm sm:text-base mt-1 text-start',
                children: s(
                  'subtitle',
                  'Track your commitments, tasks, and intake tickets in one place',
                ),
              }),
            ],
          }),
          e.jsxs(D, {
            variant: 'outline',
            size: 'sm',
            onClick: () => n({ to: '/my-work/board' }),
            className: 'flex items-center gap-2 self-start sm:self-auto',
            children: [
              e.jsx(Ae, { className: 'h-4 w-4' }),
              e.jsx('span', { children: s('viewBoard', 'Board View') }),
            ],
          }),
        ],
      }),
      e.jsx(as, { summary: y.data, isLoading: y.isLoading, onFilterClick: se, currentFilter: l }),
      e.jsx(rs, { metrics: u.data, isLoading: u.isLoading }),
      j.data && j.data.length > 0 && e.jsx(os, { teamMembers: j.data, isLoading: j.isLoading }),
      e.jsx(ns, {
        activeTab: d,
        onTabChange: _,
        counts: {
          all: y.data?.total_active || 0,
          commitments: y.data?.commitment_count || 0,
          tasks: y.data?.task_count || 0,
          intake: y.data?.intake_count || 0,
        },
      }),
      e.jsx(cs, {
        trackingType: t,
        onTrackingTypeChange: te,
        searchQuery: i || '',
        onSearchChange: ae,
        sortBy: m,
        sortOrder: g,
        onSortChange: re,
      }),
      e.jsx(ls, {
        items: ne,
        isLoading: b.isLoading,
        isError: b.isError,
        error: b.error,
        hasMore: b.hasNextPage,
        onLoadMore: () => b.fetchNextPage(),
        isFetchingMore: b.isFetchingNextPage,
      }),
    ],
  })
}
qe({
  tab: L(['all', 'commitments', 'tasks', 'intake']).optional().default('all'),
  filter: L(['active', 'overdue', 'due-today', 'due-week']).optional(),
  trackingType: L(['delivery', 'follow_up', 'sla']).optional(),
  search: Pe().optional(),
  sortBy: L(['deadline', 'created_at', 'priority']).optional().default('deadline'),
  sortOrder: L(['asc', 'desc']).optional().default('asc'),
})
const vs = ds
export { vs as component }
//# sourceMappingURL=index-Cq750ZR-.js.map
