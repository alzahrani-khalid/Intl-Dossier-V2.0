import { r as d, u as we, j as e } from './react-vendor-Buoak6m3.js'
import {
  ab as Q,
  s as te,
  c as C,
  C as ue,
  B as T,
  m as W,
  D as X,
  x as Y,
  y as G,
  z as H,
  a9 as $e,
  q as Te,
  r as Be,
  t as Le,
  v as Oe,
  w as J,
  i as Re,
  ac as Ke,
} from './index-qYY0KoZ1.js'
import {
  k as se,
  g as qe,
  a as ze,
  c as We,
  b as He,
  d as Qe,
  U as Z,
  e as Ve,
  K as me,
  f as ee,
  h as Xe,
  i as Ye,
  j as Ge,
  l as Je,
  u as Ze,
  m as et,
  n as tt,
} from './status-transitions-DP8l_VWt.js'
import './avatar-lQOCSoMx.js'
import { c as ne, d as re } from './tanstack-vendor-BZC-rs5U.js'
import {
  aD as st,
  aU as nt,
  ct as rt,
  c5 as at,
  cu as it,
  aI as lt,
  aO as ot,
  aN as ct,
  aA as dt,
  cv as ut,
} from './vendor-misc-BiJvMP0A.js'
import { o as mt, c as ge, e as pe, s as gt } from './form-vendor-BX1BhTCI.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './visualization-vendor-f5uYUx4I.js'
const fe = {
  urgent: { title: 'Urgent', titleAr: 'عاجل' },
  high: { title: 'High Priority', titleAr: 'أولوية عالية' },
  medium: { title: 'Medium Priority', titleAr: 'أولوية متوسطة' },
  low: { title: 'Low Priority', titleAr: 'أولوية منخفضة' },
}
function pt(t, n) {
  return n === 'none' ? [] : n === 'assignee' ? ft(t) : n === 'priority' ? ht(t) : []
}
function ft(t) {
  const n = new Map(),
    r = []
  t.forEach((c) => {
    if (c.assignee) {
      const g = c.assignee.id
      ;(n.has(g) || n.set(g, []), n.get(g).push(c))
    } else r.push(c)
  })
  const i = []
  return (
    Array.from(n.entries())
      .sort((c, g) => {
        const f = t.find((h) => h.assignee?.id === c[0])?.assignee?.name || '',
          a = t.find((h) => h.assignee?.id === g[0])?.assignee?.name || ''
        return f.localeCompare(a)
      })
      .forEach(([c, g]) => {
        const f = g[0]
        if (!f || !f.assignee) return
        const a = f.assignee
        i.push({ id: c, title: a.name, titleAr: a.name_ar, items: g, collapsed: !1 })
      }),
    r.length > 0 &&
      i.push({
        id: 'unassigned',
        title: 'Unassigned',
        titleAr: 'غير مسند',
        items: r,
        collapsed: !1,
      }),
    i
  )
}
function ht(t) {
  const n = new Map(),
    r = ['urgent', 'high', 'medium', 'low']
  ;(r.forEach((o) => n.set(o, [])),
    t.forEach((o) => {
      const c = o.priority || 'medium'
      n.get(c).push(o)
    }))
  const i = []
  return (
    r.forEach((o) => {
      const c = n.get(o)
      c.length > 0 &&
        i.push({ id: o, title: fe[o].title, titleAr: fe[o].titleAr, items: c, collapsed: !1 })
    }),
    i
  )
}
function xt(t) {
  switch (t) {
    case 'urgent':
      return 'border-s-red-500'
    case 'high':
      return 'border-s-orange-500'
    case 'medium':
      return 'border-s-yellow-500'
    case 'low':
      return 'border-s-slate-400'
    default:
      return 'border-s-blue-500'
  }
}
function wt(t) {
  switch (t) {
    case 'urgent':
      return 'bg-red-50/50'
    case 'high':
      return 'bg-orange-50/50'
    case 'medium':
      return 'bg-yellow-50/50'
    case 'low':
      return 'bg-slate-50/50'
    case 'unassigned':
      return 'bg-muted/30'
    default:
      return 'bg-background'
  }
}
function he(t, n, r) {
  const i = r[t]
  return i == null || i <= 0
    ? { current: n, limit: null, isAtLimit: !1, isOverLimit: !1, percentage: 0 }
    : {
        current: n,
        limit: i,
        isAtLimit: n >= i,
        isOverLimit: n > i,
        percentage: Math.min(100, Math.round((n / i) * 100)),
      }
}
function xe(t) {
  return t.limit === null
    ? 'none'
    : t.isOverLimit
      ? 'over_limit'
      : t.isAtLimit
        ? 'at_limit'
        : t.percentage >= 80
          ? 'approaching'
          : 'none'
}
function bt(t) {
  switch (t) {
    case 'over_limit':
      return 'text-red-600 bg-red-100'
    case 'at_limit':
      return 'text-amber-600 bg-amber-100'
    case 'approaching':
      return 'text-yellow-600 bg-yellow-100'
    default:
      return 'text-muted-foreground bg-muted'
  }
}
function jt(t) {
  switch (t) {
    case 'over_limit':
      return 'bg-red-500'
    case 'at_limit':
      return 'bg-amber-500'
    case 'approaching':
      return 'bg-yellow-500'
    default:
      return 'bg-primary'
  }
}
function vt(t) {
  const [n, r] = d.useState(new Set()),
    [i, o] = d.useState(!1),
    [c, g] = d.useState(null),
    f = d.useCallback(
      (w, E = !1) => {
        ;(r((y) => {
          const P = new Set(y)
          if (E && c) {
            const D = t.map((k) => k.id),
              F = D.indexOf(c),
              l = D.indexOf(w)
            if (F !== -1 && l !== -1) {
              const [k, x] = F < l ? [F, l] : [l, F]
              for (let M = k; M <= x; M++) {
                const _ = D[M]
                _ && P.add(_)
              }
            }
          } else P.has(w) ? P.delete(w) : P.add(w)
          return P
        }),
          g(w))
      },
      [t, c],
    ),
    a = d.useCallback(() => {
      r(new Set(t.map((w) => w.id)))
    }, [t]),
    h = d.useCallback(() => {
      ;(r(new Set()), g(null))
    }, []),
    N = d.useCallback(
      (w) => {
        const E = t.filter((y) => y.column_key === w)
        r(new Set(E.map((y) => y.id)))
      },
      [t],
    ),
    S = d.useCallback(() => {
      o((w) => (w && (r(new Set()), g(null)), !w))
    }, []),
    j = d.useMemo(() => t.filter((w) => n.has(w.id)), [t, n])
  return {
    selectionState: { selectedIds: n, isSelecting: i, lastSelectedId: c },
    selectedItems: j,
    selectedCount: n.size,
    toggleSelection: f,
    selectAll: a,
    clearSelection: h,
    selectByColumn: N,
    toggleSelectMode: S,
    isSelected: (w) => n.has(w),
  }
}
function St() {
  const t = ne(),
    { toast: n } = Q()
  return re({
    mutationFn: async ({ itemIds: r, targetColumn: i, items: o }) => {
      const c = await Promise.allSettled(
          r.map(async (a) => {
            const h = o.find((U) => U.id === a)
            if (!h) throw new Error(`Item ${a} not found`)
            const N = ae(h.source),
              S = Mt(h.source, i),
              { error: j } = await te.from(N).update(S).eq('id', a)
            if (j) throw j
            return { itemId: a, success: !0 }
          }),
        ),
        g = c.filter((a) => a.status === 'fulfilled').length,
        f = c.filter((a) => a.status === 'rejected').length
      return { succeeded: g, failed: f, total: r.length }
    },
    onSuccess: ({ succeeded: r, failed: i, total: o }) => {
      ;(t.invalidateQueries({ queryKey: se.all }),
        n(
          i === 0
            ? {
                title: 'Items moved successfully',
                description: `Moved ${r} item${r > 1 ? 's' : ''} to the new column.`,
              }
            : {
                title: 'Partial success',
                description: `Moved ${r} of ${o} items. ${i} failed.`,
                variant: 'destructive',
              },
        ))
    },
    onError: (r) => {
      n({
        title: 'Failed to move items',
        description: r instanceof Error ? r.message : 'Unknown error',
        variant: 'destructive',
      })
    },
  })
}
function kt() {
  const t = ne(),
    { toast: n } = Q()
  return re({
    mutationFn: async ({ itemIds: r, assigneeId: i, items: o }) => {
      const c = await Promise.allSettled(
          r.map(async (a) => {
            const h = o.find((U) => U.id === a)
            if (!h) throw new Error(`Item ${a} not found`)
            const N = ae(h.source),
              S = Nt(h.source),
              { error: j } = await te
                .from(N)
                .update({ [S]: i, updated_at: new Date().toISOString() })
                .eq('id', a)
            if (j) throw j
            return { itemId: a, success: !0 }
          }),
        ),
        g = c.filter((a) => a.status === 'fulfilled').length,
        f = c.filter((a) => a.status === 'rejected').length
      return { succeeded: g, failed: f, total: r.length }
    },
    onSuccess: ({ succeeded: r, failed: i, total: o }) => {
      ;(t.invalidateQueries({ queryKey: se.all }),
        n(
          i === 0
            ? {
                title: 'Items assigned successfully',
                description: `Assigned ${r} item${r > 1 ? 's' : ''}.`,
              }
            : {
                title: 'Partial success',
                description: `Assigned ${r} of ${o} items. ${i} failed.`,
                variant: 'destructive',
              },
        ))
    },
    onError: (r) => {
      n({
        title: 'Failed to assign items',
        description: r instanceof Error ? r.message : 'Unknown error',
        variant: 'destructive',
      })
    },
  })
}
function yt() {
  const t = ne(),
    { toast: n } = Q()
  return re({
    mutationFn: async ({ itemIds: r, priority: i, items: o }) => {
      const c = await Promise.allSettled(
          r.map(async (a) => {
            const h = o.find((j) => j.id === a)
            if (!h) throw new Error(`Item ${a} not found`)
            const N = ae(h.source),
              { error: S } = await te
                .from(N)
                .update({ priority: i, updated_at: new Date().toISOString() })
                .eq('id', a)
            if (S) throw S
            return { itemId: a, success: !0 }
          }),
        ),
        g = c.filter((a) => a.status === 'fulfilled').length,
        f = c.filter((a) => a.status === 'rejected').length
      return { succeeded: g, failed: f, total: r.length }
    },
    onSuccess: ({ succeeded: r, failed: i, total: o }) => {
      ;(t.invalidateQueries({ queryKey: se.all }),
        n(
          i === 0
            ? {
                title: 'Priority updated successfully',
                description: `Updated priority for ${r} item${r > 1 ? 's' : ''}.`,
              }
            : {
                title: 'Partial success',
                description: `Updated ${r} of ${o} items. ${i} failed.`,
                variant: 'destructive',
              },
        ))
    },
    onError: (r) => {
      n({
        title: 'Failed to update priority',
        description: r instanceof Error ? r.message : 'Unknown error',
        variant: 'destructive',
      })
    },
  })
}
function Ct(t) {
  const n = vt(t),
    r = St(),
    i = kt(),
    o = yt(),
    c = d.useCallback(
      async (a) => {
        n.selectedCount !== 0 &&
          (await r.mutateAsync({
            itemIds: Array.from(n.selectionState.selectedIds),
            targetColumn: a,
            items: t,
          }),
          n.clearSelection())
      },
      [n, r, t],
    ),
    g = d.useCallback(
      async (a) => {
        n.selectedCount !== 0 &&
          (await i.mutateAsync({
            itemIds: Array.from(n.selectionState.selectedIds),
            assigneeId: a,
            items: t,
          }),
          n.clearSelection())
      },
      [n, i, t],
    ),
    f = d.useCallback(
      async (a) => {
        n.selectedCount !== 0 &&
          (await o.mutateAsync({
            itemIds: Array.from(n.selectionState.selectedIds),
            priority: a,
            items: t,
          }),
          n.clearSelection())
      },
      [n, o, t],
    )
  return {
    ...n,
    moveSelected: c,
    assignSelected: g,
    updatePrioritySelected: f,
    isLoading: r.isPending || i.isPending || o.isPending,
  }
}
function ae(t) {
  switch (t) {
    case 'task':
      return 'tasks'
    case 'commitment':
      return 'aa_commitments'
    case 'intake':
      return 'intake_tickets'
    default:
      throw new Error(`Unknown source: ${t}`)
  }
}
function Nt(t) {
  switch (t) {
    case 'task':
      return 'assignee_id'
    case 'commitment':
      return 'owner_user_id'
    case 'intake':
      return 'assigned_to'
    default:
      throw new Error(`Unknown source: ${t}`)
  }
}
function Mt(t, n) {
  const r = { updated_at: new Date().toISOString() }
  return t === 'task'
    ? {
        ...r,
        ...{
          todo: { status: 'pending', workflow_stage: 'todo' },
          in_progress: { status: 'in_progress', workflow_stage: 'in_progress' },
          review: { status: 'in_progress', workflow_stage: 'review' },
          done: { status: 'completed', workflow_stage: 'done' },
          cancelled: { status: 'cancelled', workflow_stage: 'cancelled' },
        }[n],
      }
    : t === 'commitment'
      ? {
          ...r,
          status:
            {
              todo: 'pending',
              in_progress: 'in_progress',
              done: 'completed',
              cancelled: 'cancelled',
            }[n] || 'pending',
        }
      : t === 'intake'
        ? {
            ...r,
            status:
              {
                todo: 'pending',
                in_progress: 'in_progress',
                done: 'resolved',
                cancelled: 'closed',
              }[n] || 'pending',
          }
        : r
}
function At({
  contextType: t,
  contextId: n,
  columnMode: r = 'status',
  sourceFilter: i = [],
  showFilters: o = !0,
  showModeSwitch: c = !0,
  onItemClick: g,
  className: f,
  items: a = [],
  isLoading: h = !1,
  isError: N = !1,
  onStatusChange: S,
  onRefresh: j,
  isRefreshing: U = !1,
  swimlaneMode: w = 'none',
  onSwimlaneChange: E,
  wipLimits: y = { in_progress: 5, review: 3 },
  enableBulkOperations: P = !0,
  enableWipWarnings: D = !0,
  availableAssignees: F = [],
}) {
  const { t: l, i18n: k } = we('unified-kanban'),
    x = k.language === 'ar',
    { toast: M } = Q(),
    [_, be] = d.useState(r),
    [R, je] = d.useState(i),
    [K, ve] = d.useState(w),
    [Se, ke] = d.useState(new Set()),
    p = Ct(a),
    O = d.useMemo(() => qe(_), [_]),
    q = d.useMemo(() => ze(_, x), [_, x]),
    I = d.useMemo(() => (R.length === 0 ? a : a.filter((s) => R.includes(s.source))), [a, R]),
    ie = (s) => (s === 'pending' ? 'todo' : s),
    V = d.useMemo(() => (K === 'none' ? null : pt(I, K)), [I, K]),
    $ = d.useMemo(
      () =>
        q.map((s) => {
          const v = O.find((u) => u.key === s),
            b = I.filter((u) => ie(u.column_key || 'todo') === s)
          return { id: s, title: v?.title || s, items: b }
        }),
      [q, O, I],
    ),
    [le, z] = d.useState($)
  d.useMemo(() => {
    z($)
  }, [$])
  const ye = I.length,
    Ce = I.filter((s) => s.is_overdue).length,
    Ne = d.useCallback((s) => {
      ke((v) => {
        const b = new Set(v)
        return (b.has(s) ? b.delete(s) : b.add(s), b)
      })
    }, []),
    Me = d.useCallback(
      (s) => {
        ;(ve(s), E?.(s))
      },
      [E],
    ),
    Ae = d.useCallback(
      async (s, v, b) => {
        if (!S) return
        const u = I.find((L) => L.id === s)
        if (!u) return
        const m = b
        if (D) {
          const L = $.find((Ee) => Ee.id === m),
            ce = he(m, L?.items.length || 0, y),
            de = xe(ce)
          ;(de === 'at_limit' || de === 'over_limit') &&
            M({
              title: l('wip.limitReached'),
              description: l('wip.limitReachedDescription', { column: m, limit: ce.limit }),
              variant: 'destructive',
            })
        }
        if (!We(u.source, u.status, u.workflow_stage, m)) {
          const L = He(u.source, u.column_key, m, x ? 'ar' : 'en')
          ;(M({
            title: l('errors.invalidTransition', { column: m }),
            description: L,
            variant: 'destructive',
          }),
            z($))
          return
        }
        const { status: A, workflow_stage: Ue } = Qe(u.source, m)
        try {
          ;(await S(u.id, u.source, A, Ue),
            M({
              title: l('success.statusUpdated'),
              description: l('success.statusUpdatedDescription'),
            }))
        } catch {
          ;(M({
            title: l('errors.updateFailed'),
            description: l('errors.updateFailedDescription'),
            variant: 'destructive',
          }),
            z($))
        }
      },
      [S, I, x, M, l, $, D, y],
    ),
    oe = d.useCallback(
      (s) => {
        p.selectionState.isSelecting ? p.toggleSelection(s.id) : g && g(s)
      },
      [g, p],
    ),
    _e = d.useCallback(
      (s) =>
        s
          ? e.jsx('div', {
              className: 'rounded-lg border bg-card p-3 shadow-lg cursor-grabbing min-w-[280px]',
              children: e.jsx(Z, { item: s }),
            })
          : null,
      [],
    ),
    Ie = (s, v) => {
      if (!D) return null
      const b = he(s, v, y)
      if (b.limit === null) return null
      const u = xe(b),
        m = bt(u),
        B = jt(u)
      return e.jsxs('div', {
        className: 'flex items-center gap-2',
        children: [
          e.jsx('div', {
            className: 'flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[40px]',
            children: e.jsx('div', {
              className: C('h-full transition-all', B),
              style: { width: `${b.percentage}%` },
            }),
          }),
          e.jsxs(W, {
            variant: 'outline',
            className: C('text-[10px] px-1.5 py-0', m),
            children: [b.current, '/', b.limit],
          }),
          (u === 'at_limit' || u === 'over_limit') &&
            e.jsx(dt, { className: 'h-3.5 w-3.5 text-amber-500' }),
        ],
      })
    },
    Pe = () =>
      P
        ? e.jsxs('div', {
            className: C(
              'flex items-center gap-2 px-4 py-2 border-b bg-muted/50',
              p.selectionState.isSelecting && 'bg-primary/5',
            ),
            children: [
              e.jsx(T, {
                variant: p.selectionState.isSelecting ? 'secondary' : 'outline',
                size: 'sm',
                onClick: p.toggleSelectMode,
                className: 'gap-2',
                children: p.selectionState.isSelecting
                  ? e.jsxs(e.Fragment, {
                      children: [e.jsx(st, { className: 'h-4 w-4' }), l('bulkActions.cancel')],
                    })
                  : e.jsxs(e.Fragment, {
                      children: [e.jsx(nt, { className: 'h-4 w-4' }), l('bulkActions.select')],
                    }),
              }),
              p.selectionState.isSelecting &&
                e.jsxs(e.Fragment, {
                  children: [
                    e.jsx(T, {
                      variant: 'ghost',
                      size: 'sm',
                      onClick: p.selectAll,
                      children: l('bulkActions.selectAll'),
                    }),
                    p.selectedCount > 0 &&
                      e.jsxs(e.Fragment, {
                        children: [
                          e.jsxs(W, {
                            variant: 'secondary',
                            children: [p.selectedCount, ' ', l('bulkActions.selected')],
                          }),
                          e.jsxs(X, {
                            children: [
                              e.jsx(Y, {
                                asChild: !0,
                                children: e.jsxs(T, {
                                  variant: 'outline',
                                  size: 'sm',
                                  className: 'gap-2',
                                  children: [
                                    e.jsx(rt, { className: 'h-4 w-4' }),
                                    l('bulkActions.moveTo'),
                                  ],
                                }),
                              }),
                              e.jsx(G, {
                                children: O.map((s) =>
                                  e.jsx(
                                    H,
                                    {
                                      onClick: () => p.moveSelected(s.key),
                                      children: x ? s.titleAr : s.title,
                                    },
                                    s.key,
                                  ),
                                ),
                              }),
                            ],
                          }),
                          F.length > 0 &&
                            e.jsxs(X, {
                              children: [
                                e.jsx(Y, {
                                  asChild: !0,
                                  children: e.jsxs(T, {
                                    variant: 'outline',
                                    size: 'sm',
                                    className: 'gap-2',
                                    children: [
                                      e.jsx(at, { className: 'h-4 w-4' }),
                                      l('bulkActions.assign'),
                                    ],
                                  }),
                                }),
                                e.jsxs(G, {
                                  children: [
                                    e.jsx(H, {
                                      onClick: () => p.assignSelected(null),
                                      children: l('bulkActions.unassign'),
                                    }),
                                    e.jsx($e, {}),
                                    F.map((s) =>
                                      e.jsx(
                                        H,
                                        { onClick: () => p.assignSelected(s.id), children: s.name },
                                        s.id,
                                      ),
                                    ),
                                  ],
                                }),
                              ],
                            }),
                          e.jsxs(X, {
                            children: [
                              e.jsx(Y, {
                                asChild: !0,
                                children: e.jsxs(T, {
                                  variant: 'outline',
                                  size: 'sm',
                                  className: 'gap-2',
                                  children: [
                                    e.jsx(it, { className: 'h-4 w-4' }),
                                    l('bulkActions.priority'),
                                  ],
                                }),
                              }),
                              e.jsx(G, {
                                children: ['urgent', 'high', 'medium', 'low'].map((s) =>
                                  e.jsx(
                                    H,
                                    {
                                      onClick: () => p.updatePrioritySelected(s),
                                      children: l(`columns.${s}`),
                                    },
                                    s,
                                  ),
                                ),
                              }),
                            ],
                          }),
                          e.jsx(T, {
                            variant: 'ghost',
                            size: 'sm',
                            onClick: p.clearSelection,
                            className: 'ms-auto',
                            children: l('bulkActions.clearSelection'),
                          }),
                        ],
                      }),
                  ],
                }),
            ],
          })
        : null,
    De = () =>
      e.jsxs('div', {
        className: 'flex items-center gap-2 ms-4',
        children: [
          e.jsx(lt, { className: 'h-4 w-4 text-muted-foreground' }),
          e.jsxs(Te, {
            value: K,
            onValueChange: (s) => Me(s),
            children: [
              e.jsx(Be, { className: 'h-8 w-[140px]', children: e.jsx(Le, {}) }),
              e.jsxs(Oe, {
                children: [
                  e.jsx(J, { value: 'none', children: l('swimlanes.none') }),
                  e.jsx(J, { value: 'assignee', children: l('swimlanes.byAssignee') }),
                  e.jsx(J, { value: 'priority', children: l('swimlanes.byPriority') }),
                ],
              }),
            ],
          }),
        ],
      }),
    Fe = (s) => {
      const v = Se.has(s.id),
        b = s.items
      return e.jsxs(
        'div',
        {
          className: C('border rounded-lg mb-4', wt(s.id), 'border-s-4', xt(s.id)),
          children: [
            e.jsx('button', {
              onClick: () => Ne(s.id),
              className: C(
                'flex items-center justify-between w-full px-4 py-2',
                'hover:bg-muted/50 transition-colors',
                'text-start',
              ),
              children: e.jsxs('div', {
                className: 'flex items-center gap-2',
                children: [
                  v
                    ? e.jsx(ot, { className: C('h-4 w-4', x && 'rotate-180') })
                    : e.jsx(ct, { className: C('h-4 w-4', x && 'rotate-180') }),
                  e.jsx('span', {
                    className: 'font-medium',
                    children: x && s.titleAr ? s.titleAr : s.title,
                  }),
                  e.jsx(W, { variant: 'secondary', className: 'text-xs', children: b.length }),
                ],
              }),
            }),
            !v &&
              e.jsx('div', {
                className: 'px-2 pb-2 overflow-x-auto',
                children: e.jsx('div', {
                  className: 'flex gap-4 min-w-max',
                  children: q.map((u) => {
                    const m = O.find((A) => A.key === u),
                      B = b.filter((A) => ie(A.column_key || 'todo') === u)
                    return e.jsxs(
                      'div',
                      {
                        className: 'w-[280px] min-w-[280px] bg-card rounded-lg border p-2',
                        children: [
                          e.jsxs('div', {
                            className: 'flex items-center justify-between mb-2 px-2',
                            children: [
                              e.jsx('span', {
                                className: 'text-xs font-medium text-muted-foreground',
                                children: x && m?.titleAr ? m.titleAr : m?.title,
                              }),
                              e.jsx(W, {
                                variant: 'outline',
                                className: 'text-xs',
                                children: B.length,
                              }),
                            ],
                          }),
                          e.jsx('div', {
                            className: 'space-y-2 min-h-[100px]',
                            children:
                              B.length === 0
                                ? e.jsx('div', {
                                    className: 'text-xs text-muted-foreground text-center py-4',
                                    children: l('empty.noItemsInColumn'),
                                  })
                                : B.map((A) =>
                                    e.jsxs(
                                      'div',
                                      {
                                        onClick: () => oe(A),
                                        className: C(
                                          'rounded-lg border bg-background p-2 cursor-pointer',
                                          'hover:shadow-sm transition-shadow',
                                          p.isSelected(A.id) && 'ring-2 ring-primary',
                                        ),
                                        children: [
                                          p.selectionState.isSelecting &&
                                            e.jsx(ue, {
                                              checked: p.isSelected(A.id),
                                              className: 'mb-2',
                                            }),
                                          e.jsx(Z, { item: A, showDragHandle: !1 }),
                                        ],
                                      },
                                      A.id,
                                    ),
                                  ),
                          }),
                        ],
                      },
                      u,
                    )
                  }),
                }),
              }),
          ],
        },
        s.id,
      )
    }
  return N
    ? e.jsxs('div', {
        className: 'flex flex-col items-center justify-center h-96 text-center',
        children: [
          e.jsx('p', {
            className: 'text-lg text-muted-foreground mb-4',
            children: l('errors.loadFailed'),
          }),
          e.jsx('p', {
            className: 'text-sm text-muted-foreground mb-4',
            children: l('errors.loadFailedDescription'),
          }),
          j &&
            e.jsx('button', {
              onClick: j,
              className: 'text-primary hover:underline',
              children: l('actions.retry'),
            }),
        ],
      })
    : e.jsxs('div', {
        className: C('flex flex-col h-full', f),
        dir: x ? 'rtl' : 'ltr',
        children: [
          e.jsx(Ve, {
            columnMode: _,
            onColumnModeChange: be,
            sourceFilter: R,
            onSourceFilterChange: je,
            showFilters: o,
            showModeSwitch: c,
            showViewToggle: !1,
            isRefreshing: U,
            onRefresh: j,
            totalCount: ye,
            overdueCount: Ce,
          }),
          e.jsx('div', { className: 'flex items-center px-4 py-2 border-b', children: De() }),
          Pe(),
          e.jsx('div', {
            className: C(
              'flex-1 overflow-x-auto overflow-y-auto',
              'px-4 sm:px-6 py-4',
              'bg-muted/20',
            ),
            children: h
              ? e.jsx(me, {
                  id: 'loading',
                  data: [],
                  children: [1, 2, 3, 4].map((s) =>
                    e.jsxs(
                      'div',
                      {
                        className:
                          'flex flex-col rounded-lg border bg-muted/30 w-full sm:w-[300px] sm:min-w-[300px] h-[500px]',
                        children: [
                          e.jsxs('div', {
                            className: 'flex items-center justify-between p-3 border-b bg-muted/50',
                            children: [
                              e.jsx('div', {
                                className: 'h-5 w-20 bg-muted rounded animate-pulse',
                              }),
                              e.jsx('div', {
                                className: 'h-5 w-6 bg-muted rounded-full animate-pulse',
                              }),
                            ],
                          }),
                          e.jsxs('div', {
                            className: 'flex-1 p-2 space-y-2',
                            children: [e.jsx(ee, {}), e.jsx(ee, {}), e.jsx(ee, {})],
                          }),
                        ],
                      },
                      s,
                    ),
                  ),
                })
              : V && V.length > 0
                ? e.jsx('div', { className: 'space-y-4', children: V.map(Fe) })
                : e.jsx(Xe, {
                    columns: le,
                    onColumnsChange: z,
                    onDragEnd: Ae,
                    renderOverlay: _e,
                    children: e.jsx(me, {
                      id: 'enhanced-kanban',
                      data: I,
                      children: q.map((s) => {
                        const v = O.find((m) => m.key === s),
                          u = le.find((m) => m.id === s)?.items || []
                        return e.jsxs(
                          Ye,
                          {
                            id: s,
                            title: v?.title || s,
                            titleAr: v?.titleAr,
                            items: u,
                            isRTL: x,
                            className: v?.bgColor,
                            headerClassName: C(v?.bgColor, v?.color),
                            children: [
                              Ie(s, u.length),
                              u.length === 0
                                ? e.jsx(Ge, {
                                    message: l('empty.noItemsInColumn'),
                                    subMessage: l('empty.dragHere'),
                                  })
                                : u.map((m) =>
                                    e.jsxs(
                                      Je,
                                      {
                                        id: m.id,
                                        onClick: () => oe(m),
                                        className: C(
                                          m.is_overdue ? 'border-red-200 bg-red-50/50' : '',
                                          p.isSelected(m.id) && 'ring-2 ring-primary',
                                        ),
                                        children: [
                                          p.selectionState.isSelecting &&
                                            e.jsx('div', {
                                              className: 'mb-2',
                                              children: e.jsx(ue, {
                                                checked: p.isSelected(m.id),
                                                onCheckedChange: () => p.toggleSelection(m.id),
                                              }),
                                            }),
                                          e.jsx(Z, { item: m }),
                                        ],
                                      },
                                      m.id,
                                    ),
                                  ),
                            ],
                          },
                          s,
                        )
                      }),
                    }),
                  }),
          }),
          !h &&
            I.length === 0 &&
            e.jsx('div', {
              className:
                'absolute inset-0 flex flex-col items-center justify-center pointer-events-none',
              children: e.jsxs('div', {
                className: 'text-center p-8',
                children: [
                  e.jsx('p', {
                    className: 'text-lg font-medium text-muted-foreground mb-2',
                    children: l('empty.noItems'),
                  }),
                  e.jsx('p', {
                    className: 'text-sm text-muted-foreground',
                    children: l('empty.noItemsDescription'),
                  }),
                ],
              }),
            }),
        ],
      })
}
mt({
  mode: pe(['status', 'priority', 'tracking_type']).optional().default('status'),
  sources: gt()
    .optional()
    .transform((t) => (t ? t.split(',') : void 0)),
  swimlane: pe(['none', 'assignee', 'priority']).optional().default('none'),
  wipInProgress: ge.number().optional().default(5),
  wipReview: ge.number().optional().default(3),
})
function Rt() {
  const { t, i18n: n } = we('unified-kanban'),
    r = n.language === 'ar',
    { user: i } = Re(),
    { mode: o, sources: c, swimlane: g, wipInProgress: f, wipReview: a } = Ke.useSearch(),
    h = c,
    N = d.useMemo(() => ({ in_progress: f, review: a }), [f, a]),
    {
      items: S,
      isLoading: j,
      isError: U,
      refetch: w,
      isRefetching: E,
    } = Ze({ contextType: 'personal', columnMode: o, sourceFilter: h }),
    y = et()
  tt('personal', null, i?.id || '', !!i)
  const P = d.useCallback(
      (k) => {
        const x = new URLSearchParams()
        ;(x.set('mode', o),
          x.set('swimlane', k),
          x.set('wipInProgress', String(f)),
          x.set('wipReview', String(a)),
          (window.location.href = `/kanban?${x.toString()}`))
      },
      [o, f, a],
    ),
    D = d.useCallback(
      async (k, x, M, _) => {
        await y.mutateAsync({ itemId: k, source: x, newStatus: M, newWorkflowStage: _ })
      },
      [y],
    ),
    F = d.useCallback((k) => {
      switch (k.source) {
        case 'task':
          window.location.href = `/tasks/${k.id}`
          break
        case 'commitment':
          window.location.href = '/commitments'
          break
        case 'intake':
          window.location.href = `/intake/tickets/${k.id}`
          break
      }
    }, []),
    l = d.useCallback(() => {
      window.location.href = '/my-work'
    }, [])
  return e.jsxs('div', {
    className: 'flex flex-col h-full',
    dir: r ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className: 'flex items-center justify-between px-4 sm:px-6 py-3 border-b bg-background',
        children: [
          e.jsx('div', {
            className: 'flex items-center gap-3',
            children: e.jsx('h1', {
              className: 'text-xl sm:text-2xl font-bold',
              children: t('title'),
            }),
          }),
          e.jsx('div', {
            className: 'flex items-center gap-2',
            children: e.jsxs(T, {
              variant: 'outline',
              size: 'sm',
              onClick: l,
              className: 'flex items-center gap-2',
              children: [
                e.jsx(ut, { className: 'h-4 w-4' }),
                e.jsx('span', { className: 'hidden sm:inline', children: t('viewModes.list') }),
              ],
            }),
          }),
        ],
      }),
      e.jsx('div', {
        className: 'flex-1 overflow-hidden',
        children: e.jsx(At, {
          contextType: 'personal',
          columnMode: o,
          sourceFilter: h,
          items: S,
          isLoading: j,
          isError: U,
          onStatusChange: D,
          onItemClick: F,
          onRefresh: () => w(),
          isRefreshing: E,
          showFilters: !0,
          showModeSwitch: !0,
          swimlaneMode: g,
          onSwimlaneChange: P,
          wipLimits: N,
          enableBulkOperations: !0,
          enableWipWarnings: !0,
          className: 'h-full',
        }),
      }),
    ],
  })
}
export { Rt as component }
//# sourceMappingURL=kanban-cBS0xAAg.js.map
