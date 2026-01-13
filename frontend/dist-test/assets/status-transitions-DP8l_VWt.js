import { c as q, a as te, d as se } from './tanstack-vendor-BZC-rs5U.js'
import { r as x, j as t, u as P } from './react-vendor-Buoak6m3.js'
import {
  ab as ne,
  s as C,
  c as y,
  m as U,
  B as S,
  q as ae,
  r as re,
  t as ie,
  v as le,
  w as R,
} from './index-qYY0KoZ1.js'
import {
  cW as oe,
  cX as M,
  cY as ce,
  cZ as de,
  c_ as ue,
  c$ as me,
  d0 as Q,
  d1 as ge,
  d2 as pe,
  d3 as xe,
  d4 as fe,
  d5 as be,
  d6 as he,
  d7 as ve,
  az as ye,
  aA as _e,
  aB as ke,
  cv as je,
  bF as Ne,
  d8 as we,
  cu as Ce,
  b8 as Te,
  d9 as Ie,
  bw as Oe,
  aR as $,
  aT as Se,
} from './vendor-misc-BiJvMP0A.js'
import { az as G, aA as V, aB as W } from './ui-vendor-DTR9u_Vg.js'
import { A as De, b as Ae, a as Ke } from './avatar-lQOCSoMx.js'
const L = [
    {
      key: 'todo',
      title: 'To Do',
      titleAr: 'للتنفيذ',
      color: 'text-slate-600',
      bgColor: 'bg-slate-100',
      sortOrder: 1,
    },
    {
      key: 'in_progress',
      title: 'In Progress',
      titleAr: 'قيد التنفيذ',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      sortOrder: 2,
    },
    {
      key: 'review',
      title: 'Review',
      titleAr: 'مراجعة',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      sortOrder: 3,
      allowedSources: ['task'],
    },
    {
      key: 'done',
      title: 'Done',
      titleAr: 'مكتمل',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      sortOrder: 4,
    },
    {
      key: 'cancelled',
      title: 'Cancelled',
      titleAr: 'ملغى',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      sortOrder: 5,
    },
  ],
  Re = [
    {
      key: 'urgent',
      title: 'Urgent',
      titleAr: 'عاجل',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      sortOrder: 1,
    },
    {
      key: 'high',
      title: 'High',
      titleAr: 'عالي',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      sortOrder: 2,
    },
    {
      key: 'medium',
      title: 'Medium',
      titleAr: 'متوسط',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      sortOrder: 3,
    },
    {
      key: 'low',
      title: 'Low',
      titleAr: 'منخفض',
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      sortOrder: 4,
    },
  ],
  Me = [
    {
      key: 'delivery',
      title: 'Delivery',
      titleAr: 'تسليم',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      sortOrder: 1,
    },
    {
      key: 'follow_up',
      title: 'Follow-up',
      titleAr: 'متابعة',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      sortOrder: 2,
    },
    {
      key: 'sla',
      title: 'SLA',
      titleAr: 'اتفاقية الخدمة',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      sortOrder: 3,
    },
  ]
function Ue(e) {
  switch (e) {
    case 'status':
      return L
    case 'priority':
      return Re
    case 'tracking_type':
      return Me
    default:
      return L
  }
}
function et(e, s = !1) {
  const r = Ue(e)
    .sort((a, i) => a.sortOrder - i.sortOrder)
    .map((a) => a.key)
  return s ? [...r].reverse() : r
}
function Ee(e, s, n) {
  if (e === 'task' && n) return n === 'pending' ? 'todo' : n
  switch (s) {
    case 'pending':
    case 'todo':
      return 'todo'
    case 'in_progress':
      return 'in_progress'
    case 'completed':
    case 'resolved':
    case 'closed':
    case 'done':
      return 'done'
    case 'cancelled':
      return 'cancelled'
    case 'review':
      return 'review'
    default:
      return 'todo'
  }
}
function qe(e) {
  switch (e) {
    case 'task':
      return { bg: 'bg-blue-100', text: 'text-blue-700' }
    case 'commitment':
      return { bg: 'bg-purple-100', text: 'text-purple-700' }
    case 'intake':
      return { bg: 'bg-amber-100', text: 'text-amber-700' }
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-700' }
  }
}
function ze(e) {
  switch (e) {
    case 'urgent':
      return 'bg-red-500'
    case 'high':
      return 'bg-orange-500'
    case 'medium':
      return 'bg-yellow-500'
    case 'low':
      return 'bg-slate-400'
    default:
      return 'bg-slate-300'
  }
}
const I = { all: ['unified-kanban'], list: (e) => [...I.all, 'list', e] }
function $e(e) {
  const s = e.assignee_id
    ? { id: e.assignee_id, name: e.assignee_name || 'Unknown', avatar_url: e.assignee_avatar_url }
    : null
  return {
    id: e.id,
    source: e.source,
    title: e.title,
    title_ar: e.title_ar || void 0,
    description: e.description,
    priority: e.priority,
    status: e.status,
    workflow_stage: e.workflow_stage,
    column_key: e.column_key,
    tracking_type: e.tracking_type,
    deadline: e.deadline,
    is_overdue: e.is_overdue,
    days_until_due: e.days_until_due,
    assignee: s,
    dossier_id: e.dossier_id,
    engagement_id: e.engagement_id,
    created_at: e.created_at,
    updated_at: e.updated_at,
    metadata: e.metadata,
  }
}
function Le(e) {
  const s = {}
  return (
    e.forEach((n) => {
      const r = n.column_key
      ;(s[r] || (s[r] = []), s[r].push(n))
    }),
    s
  )
}
function tt(e) {
  const {
    contextType: s,
    contextId: n,
    columnMode: r = 'status',
    sourceFilter: a,
    limitPerColumn: i = 50,
    enabled: l = !0,
  } = e
  q()
  const o = te({
      queryKey: I.list(e),
      queryFn: async () => {
        const { data: u, error: c } = await C.rpc('get_unified_work_kanban', {
          p_context_type: s,
          p_context_id: n || null,
          p_column_mode: r,
          p_source_filter: a?.length ? a : null,
          p_limit_per_column: i,
        })
        if (c) throw new Error(c.message)
        const p = u.map($e),
          N = Le(p),
          m = [...new Set(p.map((j) => j.column_key))]
        return { columns: N, columnOrder: m, totalCount: p.length, hasMore: {} }
      },
      enabled: l,
      staleTime: 30 * 1e3,
      refetchOnWindowFocus: !0,
    }),
    d = x.useMemo(
      () => (o.data?.columns ? Object.values(o.data.columns).flat() : []),
      [o.data?.columns],
    )
  return {
    ...o,
    items: d,
    columns: o.data?.columns || {},
    columnOrder: o.data?.columnOrder || [],
    totalCount: o.data?.totalCount || 0,
  }
}
function st() {
  const e = q(),
    { toast: s } = ne()
  return se({
    mutationFn: async ({ itemId: n, source: r, newStatus: a, newWorkflowStage: i }) => {
      if (r === 'task') {
        const { data: l, error: o } = await C.from('tasks')
          .update({ status: a, workflow_stage: i, updated_at: new Date().toISOString() })
          .eq('id', n)
          .select()
          .single()
        if (o) throw o
        return l
      }
      if (r === 'commitment') {
        const { data: l, error: o } = await C.from('aa_commitments')
          .update({ status: a, updated_at: new Date().toISOString() })
          .eq('id', n)
          .select()
          .single()
        if (o) throw o
        return l
      }
      if (r === 'intake') {
        const { data: l, error: o } = await C.from('intake_tickets')
          .update({ status: a, updated_at: new Date().toISOString() })
          .eq('id', n)
          .select()
          .single()
        if (o) throw o
        return l
      }
      throw new Error('Unknown source type')
    },
    onMutate: async (n) => {
      await e.cancelQueries({ queryKey: I.all })
      const r = e.getQueriesData({ queryKey: I.all })
      return (
        e.setQueriesData({ queryKey: I.all }, (a) => {
          if (!a) return a
          const i = { ...a.columns }
          for (const l of Object.keys(i)) {
            const o = i[l],
              d = o.findIndex((u) => u.id === n.itemId)
            if (d !== -1) {
              const [u] = o.splice(d, 1),
                c = {
                  ...u,
                  status: n.newStatus,
                  workflow_stage: n.newWorkflowStage || u.workflow_stage,
                  column_key: Ee(u.source, n.newStatus, n.newWorkflowStage),
                },
                p = c.column_key
              ;(i[p] || (i[p] = []), i[p].push(c))
              break
            }
          }
          return { ...a, columns: i }
        }),
        { previousData: r }
      )
    },
    onError: (n, r, a) => {
      ;(a?.previousData &&
        a.previousData.forEach(([i, l]) => {
          e.setQueryData(i, l)
        }),
        s({
          title: 'Failed to update status',
          description: n instanceof Error ? n.message : 'Unknown error',
          variant: 'destructive',
        }))
    },
    onSettled: () => {
      e.invalidateQueries({ queryKey: I.all })
    },
  })
}
function nt(e, s, n, r = !0) {
  const a = q(),
    i = x.useCallback(() => {
      const l = setTimeout(() => {
        a.invalidateQueries({ queryKey: I.all })
      }, 300)
      return () => clearTimeout(l)
    }, [a])
  x.useEffect(() => {
    if (!r) return
    const l = [],
      o = C.channel('kanban-tasks')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks', filter: `assignee_id=eq.${n}` },
          i,
        )
        .subscribe()
    l.push(o)
    const d = C.channel('kanban-commitments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'aa_commitments', filter: `owner_user_id=eq.${n}` },
        i,
      )
      .subscribe()
    l.push(d)
    const u = C.channel('kanban-intake')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'intake_tickets', filter: `assigned_to=eq.${n}` },
        i,
      )
      .subscribe()
    return (
      l.push(u),
      () => {
        l.forEach((c) => {
          C.removeChannel(c)
        })
      }
    )
  }, [e, s, n, r, i])
}
const at = ({ children: e, className: s }) =>
    t.jsx('div', {
      className: y(
        'flex gap-4 overflow-x-auto pb-4',
        'min-h-[400px] sm:min-h-[500px] md:min-h-[600px]',
        s,
      ),
      children: e,
    }),
  rt = ({ children: e, columns: s, onColumnsChange: n, onDragEnd: r, renderOverlay: a }) => {
    const [i, l] = x.useState(null),
      [o, d] = x.useState(null),
      u = oe(
        M(ve, { activationConstraint: { distance: 8 } }),
        M(he, { activationConstraint: { delay: 200, tolerance: 5 } }),
        M(be, { coordinateGetter: fe }),
      ),
      c = x.useCallback(
        (h) => {
          const g = s.find((f) => f.id === h)
          return g || s.find((f) => f.items.some((v) => v.id === h))
        },
        [s],
      ),
      p = x.useCallback(
        (h) => {
          for (const g of s) {
            const f = g.items.find((v) => v.id === h)
            if (f) return f
          }
        },
        [s],
      ),
      N = x.useCallback(
        (h) => {
          const { active: g } = h,
            f = p(g.id),
            v = c(g.id)
          ;(l(f ?? null), d(v?.id ?? null))
        },
        [p, c],
      ),
      m = x.useCallback(
        (h) => {
          const { active: g, over: f } = h
          if (!f) return
          const v = g.id,
            O = f.id
          if (v === O) return
          const k = c(v),
            w = c(O)
          if (!(!k || !w) && k.id !== w.id) {
            const D = s.map((b) => {
              if (b.id === k.id) return { ...b, items: b.items.filter((_) => _.id !== v) }
              if (b.id === w.id) {
                const _ = k.items.find((K) => K.id === v)
                if (!_) return b
                const T = b.items.findIndex((K) => K.id === O)
                if (T === -1) return { ...b, items: [...b.items, _] }
                const z = [...b.items]
                return (z.splice(T, 0, _), { ...b, items: z })
              }
              return b
            })
            n?.(D)
          }
        },
        [s, c, n],
      ),
      j = x.useCallback(
        (h) => {
          const { active: g, over: f } = h
          if (!f) {
            ;(l(null), d(null))
            return
          }
          const v = g.id,
            O = f.id,
            k = c(v),
            w = c(O)
          if (!k || !w) {
            ;(l(null), d(null))
            return
          }
          if (k.id === w.id) {
            const D = k.items.findIndex((_) => _.id === v),
              b = k.items.findIndex((_) => _.id === O)
            if (D !== b && b !== -1) {
              const _ = s.map((T) => (T.id === k.id ? { ...T, items: ce(T.items, D, b) } : T))
              n?.(_)
            }
          }
          ;(o && w.id !== o && r?.(v, o, w.id), l(null), d(null))
        },
        [s, c, n, r, o],
      ),
      A = x.useCallback(() => {
        ;(l(null), d(null))
      }, [])
    return t.jsxs(de, {
      sensors: u,
      collisionDetection: ue,
      onDragStart: N,
      onDragOver: m,
      onDragEnd: j,
      onDragCancel: A,
      children: [e, t.jsx(me, { dropAnimation: null, children: i && a ? a(i) : null })],
    })
  },
  it = ({
    id: e,
    title: s,
    titleAr: n,
    items: r,
    children: a,
    className: i,
    headerClassName: l,
    isRTL: o = !1,
  }) => {
    const { setNodeRef: d, isOver: u } = Q({
      id: e,
      data: { type: 'column', column: { id: e, title: s, items: r } },
    })
    return t.jsxs('div', {
      ref: d,
      className: y(
        'flex flex-col',
        'w-full sm:w-[300px] sm:min-w-[300px] sm:max-w-[300px]',
        'rounded-lg border bg-card shadow-sm',
        'h-full min-h-[400px] sm:min-h-[500px]',
        u && 'ring-2 ring-primary ring-offset-2',
        i,
      ),
      children: [
        t.jsxs('div', {
          className: y('flex items-center justify-between px-4 py-3 border-b', l),
          children: [
            t.jsx('h3', {
              className: 'text-sm sm:text-base font-semibold',
              children: o && n ? n : s,
            }),
            t.jsx('span', {
              className: 'text-xs sm:text-sm text-muted-foreground px-2 py-1 rounded-md bg-muted',
              children: r.length,
            }),
          ],
        }),
        t.jsx('div', {
          className: 'flex-1 overflow-y-auto p-2 sm:p-3 space-y-2',
          children: t.jsx(ge, { items: r.map((c) => c.id), strategy: pe, children: a }),
        }),
      ],
    })
  },
  Be = x.forwardRef(({ id: e, children: s, className: n, disabled: r = !1, onClick: a }, i) => {
    const {
        attributes: l,
        listeners: o,
        setNodeRef: d,
        transform: u,
        transition: c,
        isDragging: p,
      } = Q({ id: e, disabled: r, data: { type: 'card' } }),
      N = { transform: xe.Transform.toString(u), transition: c },
      m = () => {
        !p && a && a()
      }
    return t.jsx('div', {
      ref: (j) => {
        ;(d(j), typeof i == 'function' ? i(j) : i && (i.current = j))
      },
      style: N,
      className: y(
        'rounded-lg border bg-card p-3 sm:p-4',
        'cursor-grab active:cursor-grabbing',
        'transition-all hover:shadow-md hover:border-primary/20',
        'min-h-11 min-w-11',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        p && 'opacity-50 shadow-lg scale-[1.02] z-50',
        r && 'cursor-not-allowed opacity-60',
        n,
      ),
      onClick: m,
      ...l,
      ...o,
      children: s,
    })
  })
Be.displayName = 'KanbanCard'
const Pe = x.forwardRef(({ message: e = 'No items', subMessage: s, className: n }, r) =>
  t.jsxs('div', {
    ref: r,
    className: y(
      'flex flex-col items-center justify-center',
      'p-4 text-sm text-muted-foreground text-center',
      'rounded-md border-2 border-dashed min-h-[100px]',
      n,
    ),
    children: [
      t.jsx('p', { children: e }),
      s && t.jsx('p', { className: 'text-xs mt-1', children: s }),
    ],
  }),
)
Pe.displayName = 'KanbanEmpty'
const Y = ye(
    'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    {
      variants: {
        variant: {
          default: 'bg-transparent',
          outline:
            'border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground',
        },
        size: { default: 'h-9 px-2 min-w-9', sm: 'h-8 px-1.5 min-w-8', lg: 'h-10 px-2.5 min-w-10' },
      },
      defaultVariants: { variant: 'default', size: 'default' },
    },
  ),
  Qe = x.forwardRef(({ className: e, variant: s, size: n, ...r }, a) =>
    t.jsx(G, { ref: a, className: y(Y({ variant: s, size: n, className: e })), ...r }),
  )
Qe.displayName = G.displayName
const H = x.createContext({ size: 'default', variant: 'default' }),
  X = x.forwardRef(({ className: e, variant: s, size: n, children: r, ...a }, i) =>
    t.jsx(V, {
      ref: i,
      className: y('flex items-center justify-center gap-1', e),
      ...a,
      children: t.jsx(H.Provider, { value: { variant: s, size: n }, children: r }),
    }),
  )
X.displayName = V.displayName
const E = x.forwardRef(({ className: e, children: s, variant: n, size: r, ...a }, i) => {
  const l = x.useContext(H)
  return t.jsx(W, {
    ref: i,
    className: y(Y({ variant: l.variant || n, size: l.size || r }), e),
    ...a,
    children: s,
  })
})
E.displayName = W.displayName
function lt({
  columnMode: e,
  onColumnModeChange: s,
  viewMode: n = 'board',
  onViewModeChange: r,
  sourceFilter: a = [],
  onSourceFilterChange: i,
  showFilters: l = !0,
  showModeSwitch: o = !0,
  showViewToggle: d = !0,
  isRefreshing: u = !1,
  onRefresh: c,
  totalCount: p = 0,
  overdueCount: N = 0,
}) {
  const { t: m, i18n: j } = P('unified-kanban'),
    A = j.language === 'ar',
    h = (g) => {
      i && (a.includes(g) ? i(a.filter((f) => f !== g)) : i([...a, g]))
    }
  return t.jsxs('div', {
    className: y(
      'flex flex-col gap-3 px-4 sm:px-6 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
    ),
    dir: A ? 'rtl' : 'ltr',
    children: [
      t.jsxs('div', {
        className: 'flex items-center justify-between gap-4',
        children: [
          t.jsxs('div', {
            className: 'flex items-center gap-3',
            children: [
              t.jsx('h1', { className: 'text-lg sm:text-xl font-semibold', children: m('title') }),
              p > 0 &&
                t.jsxs(U, {
                  variant: 'secondary',
                  className: 'text-xs',
                  children: [p, ' ', m('accessibility.itemCount', { count: p })],
                }),
              N > 0 &&
                t.jsxs(U, {
                  variant: 'destructive',
                  className: 'text-xs flex items-center gap-1',
                  children: [t.jsx(_e, { className: 'h-3 w-3' }), N],
                }),
            ],
          }),
          t.jsxs('div', {
            className: 'flex items-center gap-2',
            children: [
              c &&
                t.jsxs(S, {
                  variant: 'ghost',
                  size: 'icon',
                  onClick: c,
                  disabled: u,
                  className: 'h-9 w-9',
                  children: [
                    t.jsx(ke, { className: y('h-4 w-4', u && 'animate-spin') }),
                    t.jsx('span', { className: 'sr-only', children: m('actions.refresh') }),
                  ],
                }),
              d &&
                r &&
                t.jsxs(X, {
                  type: 'single',
                  value: n,
                  onValueChange: (g) => g && r(g),
                  className: 'bg-muted rounded-md p-0.5',
                  children: [
                    t.jsx(E, {
                      value: 'list',
                      'aria-label': m('viewModes.list'),
                      className: 'h-8 px-2.5 data-[state=on]:bg-background',
                      children: t.jsx(je, { className: 'h-4 w-4' }),
                    }),
                    t.jsx(E, {
                      value: 'board',
                      'aria-label': m('viewModes.board'),
                      className: 'h-8 px-2.5 data-[state=on]:bg-background',
                      children: t.jsx(Ne, { className: 'h-4 w-4' }),
                    }),
                  ],
                }),
            ],
          }),
        ],
      }),
      t.jsxs('div', {
        className: 'flex flex-wrap items-center gap-3',
        children: [
          o &&
            t.jsxs('div', {
              className: 'flex items-center gap-2',
              children: [
                t.jsxs('span', {
                  className: 'text-sm text-muted-foreground',
                  children: [m('columnModes.label'), ':'],
                }),
                t.jsxs(ae, {
                  value: e,
                  onValueChange: (g) => s(g),
                  children: [
                    t.jsx(re, { className: 'w-[140px] sm:w-[160px] h-9', children: t.jsx(ie, {}) }),
                    t.jsxs(le, {
                      children: [
                        t.jsx(R, {
                          value: 'status',
                          children: t.jsxs('div', {
                            className: 'flex items-center gap-2',
                            children: [
                              t.jsx(we, { className: 'h-4 w-4' }),
                              m('columnModes.status'),
                            ],
                          }),
                        }),
                        t.jsx(R, {
                          value: 'priority',
                          children: t.jsxs('div', {
                            className: 'flex items-center gap-2',
                            children: [
                              t.jsx(Ce, { className: 'h-4 w-4' }),
                              m('columnModes.priority'),
                            ],
                          }),
                        }),
                        t.jsx(R, {
                          value: 'tracking_type',
                          children: t.jsxs('div', {
                            className: 'flex items-center gap-2',
                            children: [
                              t.jsx(Te, { className: 'h-4 w-4' }),
                              m('columnModes.trackingType'),
                            ],
                          }),
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          l &&
            i &&
            t.jsxs('div', {
              className: 'flex items-center gap-2 ms-auto sm:ms-4',
              children: [
                t.jsxs('span', {
                  className: 'text-sm text-muted-foreground hidden sm:inline',
                  children: [m('filters.source'), ':'],
                }),
                t.jsxs('div', {
                  className: 'flex gap-1',
                  children: [
                    t.jsx(S, {
                      variant: a.length === 0 ? 'secondary' : 'outline',
                      size: 'sm',
                      onClick: () => i([]),
                      className: 'h-7 px-2 text-xs',
                      children: m('filters.allSources'),
                    }),
                    t.jsx(S, {
                      variant: a.includes('task') ? 'secondary' : 'outline',
                      size: 'sm',
                      onClick: () => h('task'),
                      className: 'h-7 px-2 text-xs',
                      children: m('sources.task'),
                    }),
                    t.jsx(S, {
                      variant: a.includes('commitment') ? 'secondary' : 'outline',
                      size: 'sm',
                      onClick: () => h('commitment'),
                      className: 'h-7 px-2 text-xs',
                      children: m('sources.commitment'),
                    }),
                    t.jsx(S, {
                      variant: a.includes('intake') ? 'secondary' : 'outline',
                      size: 'sm',
                      onClick: () => h('intake'),
                      className: 'h-7 px-2 text-xs',
                      children: m('sources.intake'),
                    }),
                  ],
                }),
              ],
            }),
        ],
      }),
    ],
  })
}
function ot({ item: e, showDragHandle: s = !0 }) {
  const { t: n, i18n: r } = P('unified-kanban'),
    a = r.language === 'ar',
    i = qe(e.source),
    l = ze(e.priority),
    d = e.deadline
      ? e.is_overdue
        ? { text: n('card.overdue'), className: 'text-red-600 font-medium' }
        : e.days_until_due === 0
          ? { text: n('card.dueToday'), className: 'text-amber-600 font-medium' }
          : e.days_until_due === 1
            ? { text: n('card.dueTomorrow'), className: 'text-amber-500' }
            : e.days_until_due !== null && e.days_until_due > 1
              ? {
                  text: n('card.dueIn', { count: e.days_until_due }),
                  className: 'text-muted-foreground',
                }
              : null
      : null,
    u = (c) =>
      c
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
  return t.jsxs('div', {
    className: 'relative',
    dir: a ? 'rtl' : 'ltr',
    children: [
      t.jsx('div', {
        className: y('absolute -top-3 sm:-top-4 h-1 w-full rounded-t-lg', l, 'left-0 right-0'),
        style: { left: '-12px', right: '-12px', width: 'calc(100% + 24px)' },
      }),
      s &&
        t.jsx('div', {
          className: y(
            'absolute -top-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground',
            a ? 'start-0' : 'end-0',
          ),
          children: t.jsx(Ie, { className: 'h-4 w-4' }),
        }),
      t.jsxs('div', {
        className: 'space-y-2',
        children: [
          t.jsxs('div', {
            className: 'flex items-center justify-between gap-2',
            children: [
              t.jsx(U, {
                variant: 'secondary',
                className: y('text-xs', i.bg, i.text),
                children: n(`sources.${e.source}`),
              }),
              e.is_overdue &&
                t.jsx('div', {
                  className: 'flex items-center gap-1 text-red-600',
                  children: t.jsx(Oe, { className: 'h-3.5 w-3.5' }),
                }),
            ],
          }),
          t.jsx('h4', {
            className: 'text-sm font-medium line-clamp-2 text-start',
            children: a && e.title_ar ? e.title_ar : e.title,
          }),
          t.jsxs('div', {
            className: 'flex items-center justify-between gap-2 pt-1',
            children: [
              d
                ? t.jsxs('div', {
                    className: y('flex items-center gap-1 text-xs', d.className),
                    children: [
                      t.jsx($, { className: 'h-3 w-3' }),
                      t.jsx('span', { children: d.text }),
                    ],
                  })
                : t.jsxs('div', {
                    className: 'flex items-center gap-1 text-xs text-muted-foreground',
                    children: [
                      t.jsx($, { className: 'h-3 w-3 opacity-50' }),
                      t.jsx('span', { children: n('card.noDueDate') }),
                    ],
                  }),
              e.assignee
                ? t.jsxs(De, {
                    className: 'h-6 w-6',
                    children: [
                      t.jsx(Ae, { src: e.assignee.avatar_url || void 0, alt: e.assignee.name }),
                      t.jsx(Ke, { className: 'text-xs', children: u(e.assignee.name) }),
                    ],
                  })
                : t.jsx('div', {
                    className: 'flex items-center gap-1 text-xs text-muted-foreground',
                    children: t.jsx(Se, { className: 'h-3.5 w-3.5' }),
                  }),
            ],
          }),
        ],
      }),
    ],
  })
}
function ct() {
  return t.jsx('div', {
    className: 'rounded-lg border bg-card p-3 shadow-sm animate-pulse',
    children: t.jsxs('div', {
      className: 'space-y-2',
      children: [
        t.jsx('div', { className: 'h-5 w-16 bg-muted rounded' }),
        t.jsx('div', { className: 'h-4 w-full bg-muted rounded' }),
        t.jsx('div', { className: 'h-4 w-3/4 bg-muted rounded' }),
        t.jsxs('div', {
          className: 'flex justify-between pt-1',
          children: [
            t.jsx('div', { className: 'h-4 w-20 bg-muted rounded' }),
            t.jsx('div', { className: 'h-6 w-6 bg-muted rounded-full' }),
          ],
        }),
      ],
    }),
  })
}
const Z = {
    todo: ['in_progress', 'cancelled'],
    in_progress: ['todo', 'review', 'done', 'cancelled'],
    review: ['in_progress', 'done', 'cancelled'],
    done: [],
    cancelled: [],
  },
  F = {
    pending: ['in_progress', 'cancelled'],
    in_progress: ['pending', 'completed', 'cancelled'],
    overdue: ['in_progress', 'completed', 'cancelled'],
    review: [],
    completed: [],
    cancelled: [],
  },
  J = {
    pending: ['in_progress', 'resolved', 'closed'],
    in_progress: ['pending', 'resolved', 'closed'],
    resolved: ['closed', 'in_progress'],
    closed: [],
  }
function B(e, s, n) {
  if (s === n) return !1
  switch (e) {
    case 'task':
      return Z[s]?.includes(n) ?? !1
    case 'commitment':
      return F[s]?.includes(n) ?? !1
    case 'intake':
      return J[s]?.includes(n) ?? !1
    default:
      return !1
  }
}
function Ge(e, s) {
  switch (e) {
    case 'task':
      return Z[s] ?? []
    case 'commitment':
      return F[s] ?? []
    case 'intake':
      return J[s] ?? []
    default:
      return []
  }
}
function Ve(e, s) {
  return Ge(e, s).length === 0
}
function ee(e, s) {
  if (e === 'task') return s
  if (e === 'commitment')
    switch (s) {
      case 'todo':
        return 'pending'
      case 'in_progress':
        return 'in_progress'
      case 'done':
        return 'completed'
      case 'cancelled':
        return 'cancelled'
      default:
        return 'pending'
    }
  if (e === 'intake')
    switch (s) {
      case 'todo':
        return 'pending'
      case 'in_progress':
        return 'in_progress'
      case 'done':
        return 'resolved'
      case 'cancelled':
        return 'closed'
      default:
        return 'pending'
    }
  return s
}
function We(e, s, n) {
  return e === 'task' && n
    ? n === 'pending'
      ? 'todo'
      : n
    : ['completed', 'resolved', 'done'].includes(s)
      ? 'done'
      : ['cancelled', 'closed'].includes(s)
        ? 'cancelled'
        : s === 'pending' || s === 'overdue'
          ? 'todo'
          : s
}
function dt(e, s, n, r) {
  const a = We(e, s, n)
  if (a === r) return !1
  const i = ee(e, r)
  return e === 'task' ? B('task', n || a, r) : B(e, s, i)
}
function ut(e, s) {
  if (e === 'task') {
    const r = s
    let a
    switch (r) {
      case 'done':
        a = 'completed'
        break
      case 'cancelled':
        a = 'cancelled'
        break
      default:
        a = 'in_progress'
    }
    return { status: a, workflow_stage: r }
  }
  return { status: ee(e, s) }
}
function mt(e, s, n, r = 'en') {
  const i = {
    en: {
      terminal: `Items in "${s}" status cannot be moved`,
      invalid: `Cannot move from "${s}" to "${n}"`,
      task_done: 'Completed tasks cannot be moved',
      commitment_complete: 'Completed commitments cannot be changed',
      intake_closed: 'Closed tickets cannot be reopened',
    },
    ar: {
      terminal: `لا يمكن نقل العناصر في حالة "${s}"`,
      invalid: `لا يمكن النقل من "${s}" إلى "${n}"`,
      task_done: 'لا يمكن نقل المهام المكتملة',
      commitment_complete: 'لا يمكن تغيير الالتزامات المكتملة',
      intake_closed: 'لا يمكن إعادة فتح التذاكر المغلقة',
    },
  }[r]
  return Ve(e, s)
    ? e === 'task' && s === 'done'
      ? i.task_done
      : e === 'commitment' && s === 'completed'
        ? i.commitment_complete
        : e === 'intake' && s === 'closed'
          ? i.intake_closed
          : i.terminal
    : i.invalid
}
export {
  at as K,
  ot as U,
  et as a,
  mt as b,
  dt as c,
  ut as d,
  lt as e,
  ct as f,
  Ue as g,
  rt as h,
  it as i,
  Pe as j,
  I as k,
  Be as l,
  st as m,
  nt as n,
  tt as u,
}
//# sourceMappingURL=status-transitions-DP8l_VWt.js.map
