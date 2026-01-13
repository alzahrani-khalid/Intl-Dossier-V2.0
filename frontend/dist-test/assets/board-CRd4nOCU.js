import { u as L, r as n, j as e } from './react-vendor-Buoak6m3.js'
import { i as J } from './tanstack-vendor-BZC-rs5U.js'
import { ab as Q, c as K, i as X, a$ as Y, B as Z } from './index-qYY0KoZ1.js'
import {
  g as ee,
  a as se,
  c as te,
  b as ne,
  d as ae,
  U as B,
  e as re,
  K as A,
  f as _,
  h as oe,
  i as ie,
  j as le,
  l as ce,
  u as de,
  m as ue,
  n as me,
} from './status-transitions-DP8l_VWt.js'
import './avatar-lQOCSoMx.js'
import { cv as xe } from './vendor-misc-BiJvMP0A.js'
import { o as pe, s as fe, e as he } from './form-vendor-BX1BhTCI.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './visualization-vendor-f5uYUx4I.js'
function ge({
  contextType: m,
  contextId: E,
  columnMode: T = 'status',
  sourceFilter: i = [],
  showFilters: k = !0,
  showModeSwitch: x = !0,
  onItemClick: g,
  className: p,
  items: b = [],
  isLoading: y = !1,
  isError: D = !1,
  onStatusChange: j,
  onRefresh: C,
  isRefreshing: v = !1,
}) {
  const { t: a, i18n: U } = L('unified-kanban'),
    l = U.language === 'ar',
    { toast: o } = Q(),
    [u, F] = n.useState(T),
    [f, O] = n.useState(i),
    I = n.useMemo(() => ee(u), [u]),
    S = n.useMemo(() => se(u, l), [u, l]),
    c = n.useMemo(() => (f.length === 0 ? b : b.filter((s) => f.includes(s.source))), [b, f]),
    P = (s) => (s === 'pending' ? 'todo' : s),
    h = n.useMemo(
      () =>
        S.map((s) => {
          const d = I.find((t) => t.key === s),
            N = c.filter((t) => P(t.column_key || 'todo') === s)
          return { id: s, title: d?.title || s, items: N }
        }),
      [S, I, c],
    ),
    [R, w] = n.useState(h)
  n.useMemo(() => {
    w(h)
  }, [h])
  const H = c.length,
    W = c.filter((s) => s.is_overdue).length,
    z = n.useCallback(
      async (s, d, N) => {
        if (!j) return
        const t = c.find((M) => M.id === s)
        if (!t) return
        const r = N
        if (!te(t.source, t.status, t.workflow_stage, r)) {
          const M = ne(t.source, t.column_key, r, l ? 'ar' : 'en')
          ;(o({
            title: a('errors.invalidTransition', { column: r }),
            description: M,
            variant: 'destructive',
          }),
            w(h))
          return
        }
        const { status: q, workflow_stage: G } = ae(t.source, r)
        try {
          ;(await j(t.id, t.source, q, G),
            o({
              title: a('success.statusUpdated'),
              description: a('success.statusUpdatedDescription'),
            }))
        } catch {
          ;(o({
            title: a('errors.updateFailed'),
            description: a('errors.updateFailedDescription'),
            variant: 'destructive',
          }),
            w(h))
        }
      },
      [j, c, l, o, a, h],
    ),
    V = n.useCallback(
      (s) => {
        g && g(s)
      },
      [g],
    ),
    $ = n.useCallback(
      (s) =>
        s
          ? e.jsx('div', {
              className: 'rounded-lg border bg-card p-3 shadow-lg cursor-grabbing min-w-[280px]',
              children: e.jsx(B, { item: s }),
            })
          : null,
      [],
    )
  return D
    ? e.jsxs('div', {
        className: 'flex flex-col items-center justify-center h-96 text-center',
        children: [
          e.jsx('p', {
            className: 'text-lg text-muted-foreground mb-4',
            children: a('errors.loadFailed'),
          }),
          e.jsx('p', {
            className: 'text-sm text-muted-foreground mb-4',
            children: a('errors.loadFailedDescription'),
          }),
          C &&
            e.jsx('button', {
              onClick: C,
              className: 'text-primary hover:underline',
              children: a('actions.retry'),
            }),
        ],
      })
    : e.jsxs('div', {
        className: K('flex flex-col h-full', p),
        dir: l ? 'rtl' : 'ltr',
        children: [
          e.jsx(re, {
            columnMode: u,
            onColumnModeChange: F,
            sourceFilter: f,
            onSourceFilterChange: O,
            showFilters: k,
            showModeSwitch: x,
            showViewToggle: !1,
            isRefreshing: v,
            onRefresh: C,
            totalCount: H,
            overdueCount: W,
          }),
          e.jsx('div', {
            className: K(
              'flex-1 overflow-x-auto overflow-y-hidden',
              'px-4 sm:px-6 py-4',
              'bg-muted/20',
            ),
            children: y
              ? e.jsx(A, {
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
                            children: [e.jsx(_, {}), e.jsx(_, {}), e.jsx(_, {})],
                          }),
                        ],
                      },
                      s,
                    ),
                  ),
                })
              : e.jsx(oe, {
                  columns: R,
                  onColumnsChange: w,
                  onDragEnd: z,
                  renderOverlay: $,
                  children: e.jsx(A, {
                    id: 'unified-kanban',
                    data: c,
                    children: S.map((s) => {
                      const d = I.find((r) => r.key === s),
                        t = R.find((r) => r.id === s)?.items || []
                      return e.jsx(
                        ie,
                        {
                          id: s,
                          title: d?.title || s,
                          titleAr: d?.titleAr,
                          items: t,
                          isRTL: l,
                          className: d?.bgColor,
                          headerClassName: K(d?.bgColor, d?.color),
                          children:
                            t.length === 0
                              ? e.jsx(le, {
                                  message: a('empty.noItemsInColumn'),
                                  subMessage: a('empty.dragHere'),
                                })
                              : t.map((r) =>
                                  e.jsx(
                                    ce,
                                    {
                                      id: r.id,
                                      onClick: () => V(r),
                                      className: r.is_overdue ? 'border-red-200 bg-red-50/50' : '',
                                      children: e.jsx(B, { item: r }),
                                    },
                                    r.id,
                                  ),
                                ),
                        },
                        s,
                      )
                    }),
                  }),
                }),
          }),
          !y &&
            c.length === 0 &&
            e.jsx('div', {
              className:
                'absolute inset-0 flex flex-col items-center justify-center pointer-events-none',
              children: e.jsxs('div', {
                className: 'text-center p-8',
                children: [
                  e.jsx('p', {
                    className: 'text-lg font-medium text-muted-foreground mb-2',
                    children: a('empty.noItems'),
                  }),
                  e.jsx('p', {
                    className: 'text-sm text-muted-foreground',
                    children: a('empty.noItemsDescription'),
                  }),
                ],
              }),
            }),
        ],
      })
}
pe({
  mode: he(['status', 'priority', 'tracking_type']).optional().default('status'),
  sources: fe()
    .optional()
    .transform((m) => (m ? m.split(',') : void 0)),
})
function Ie() {
  const { t: m, i18n: E } = L('unified-kanban'),
    T = E.language === 'ar',
    i = J(),
    { user: k } = X(),
    { mode: x, sources: g } = Y.useSearch(),
    p = g,
    {
      items: b,
      isLoading: y,
      isError: D,
      refetch: j,
      isRefetching: C,
    } = de({ contextType: 'personal', columnMode: x, sourceFilter: p }),
    v = ue()
  ;(me('personal', null, k?.id || '', !!k),
    n.useCallback(
      (o) => {
        i({ to: '/my-work/board', search: { mode: o, sources: p?.join(',') } })
      },
      [i, p],
    ),
    n.useCallback(
      (o) => {
        i({
          to: '/my-work/board',
          search: { mode: x, sources: o.length > 0 ? o.join(',') : void 0 },
        })
      },
      [i, x],
    ))
  const a = n.useCallback(
      async (o, u, F, f) => {
        await v.mutateAsync({ itemId: o, source: u, newStatus: F, newWorkflowStage: f })
      },
      [v],
    ),
    U = n.useCallback(
      (o) => {
        switch (o.source) {
          case 'task':
            i({ to: '/my-work/assignments' })
            break
          case 'commitment':
            break
          case 'intake':
            i({ to: '/my-work/intake' })
            break
        }
      },
      [i],
    ),
    l = n.useCallback(() => {
      i({ to: '/my-work' })
    }, [i])
  return e.jsxs('div', {
    className: 'flex flex-col h-full',
    dir: T ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className: 'flex items-center justify-between px-4 sm:px-6 py-2 border-b bg-background',
        children: [
          e.jsx('div', {
            className: 'flex items-center gap-2',
            children: e.jsx('h1', {
              className: 'text-lg font-semibold',
              children: m('context.personal'),
            }),
          }),
          e.jsxs(Z, {
            variant: 'outline',
            size: 'sm',
            onClick: l,
            className: 'flex items-center gap-2',
            children: [
              e.jsx(xe, { className: 'h-4 w-4' }),
              e.jsx('span', { className: 'hidden sm:inline', children: m('viewModes.list') }),
            ],
          }),
        ],
      }),
      e.jsx('div', {
        className: 'flex-1 overflow-hidden',
        children: e.jsx(ge, {
          contextType: 'personal',
          columnMode: x,
          sourceFilter: p,
          items: b,
          isLoading: y,
          isError: D,
          onStatusChange: a,
          onItemClick: U,
          onRefresh: () => j(),
          isRefreshing: C,
          showFilters: !0,
          showModeSwitch: !0,
          className: 'h-full',
        }),
      }),
    ],
  })
}
export { Ie as component }
//# sourceMappingURL=board-CRd4nOCU.js.map
