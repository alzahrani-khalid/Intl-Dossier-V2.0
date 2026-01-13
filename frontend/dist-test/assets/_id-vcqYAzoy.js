import { u as N, j as e, r as C } from './react-vendor-Buoak6m3.js'
import { a as Y, c as Z, d as ee, L as se, i as te, m as ae } from './tanstack-vendor-BZC-rs5U.js'
import {
  aU as H,
  ab as re,
  aV as q,
  c as k,
  J as L,
  B as _,
  A as ie,
  aW as ne,
  E as le,
  F as de,
  G as ce,
  H as oe,
  q as me,
  r as xe,
  t as ue,
  v as pe,
  w as A,
  I as ge,
  K as he,
  j as z,
  l as E,
  m as v,
  k as P,
  o as F,
  a2 as D,
  af as fe,
  ag as je,
  a0 as S,
} from './index-qYY0KoZ1.js'
import {
  bd as U,
  cL as K,
  bi as O,
  bw as X,
  aD as ye,
  b9 as we,
  aH as I,
  bC as Q,
  dD as R,
  bV as G,
  c0 as _e,
  b6 as ke,
  dE as V,
  aT as Ne,
  aR as M,
  dF as ve,
  aM as be,
} from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
const g = {
  all: ['tasks'],
  lists: () => [...g.all, 'list'],
  list: (s) => [...g.lists(), s],
  detail: (s) => [...g.all, 'detail', s],
  myTasks: () => [...g.all, 'my-tasks'],
  contributedTasks: () => [...g.all, 'contributed'],
  engagement: (s) => [...g.all, 'engagement', s],
  workItem: (s, o) => [...g.all, 'work-item', s, o],
  overdue: (s) => [...g.all, 'overdue', s || 'all'],
  approaching: (s, o) => [...g.all, 'approaching', s, o || 'all'],
}
function $e(s) {
  return Y({
    queryKey: g.detail(s),
    queryFn: () => H.getTask(s),
    enabled: !!s,
    staleTime: 1e3 * 60 * 2,
    gcTime: 1e3 * 60 * 10,
  })
}
function Se(s) {
  const { t: o } = N(),
    { toast: n } = re(),
    i = Z()
  return ee({
    mutationFn: ({ taskId: a, data: x }) => H.updateTask(a, x),
    retry: (a, x) => (x instanceof q ? a < 3 : !1),
    retryDelay: (a) => Math.min(1e3, 100 * Math.pow(2, a)),
    onMutate: async ({ taskId: a, data: x }) => {
      await i.cancelQueries({ queryKey: g.detail(a) })
      const t = i.getQueryData(g.detail(a))
      return (
        t && i.setQueryData(g.detail(a), { ...t, ...x, updated_at: new Date().toISOString() }),
        { previousTask: t }
      )
    },
    onError: (a, { taskId: x, data: t }, u) => {
      ;(u?.previousTask && i.setQueryData(g.detail(x), u.previousTask),
        a instanceof q
          ? n({
              title: o('tasks.conflict'),
              description: o('tasks.conflict_message'),
              variant: 'default',
            })
          : n({ title: o('tasks.update_failed'), description: a.message, variant: 'destructive' }))
    },
    onSuccess: (a) => {
      ;(i.setQueryData(g.detail(a.id), a),
        i.invalidateQueries({ queryKey: g.lists() }),
        i.invalidateQueries({ queryKey: g.myTasks() }),
        a.engagement_id && i.invalidateQueries({ queryKey: g.engagement(a.engagement_id) }),
        a.work_item_type &&
          a.work_item_id &&
          i.invalidateQueries({ queryKey: g.workItem(a.work_item_type, a.work_item_id) }),
        n({ title: o('tasks.updated'), description: o('tasks.updated_success') }))
    },
  })
}
function Ce(s, o = !1, n = null, i = new Date()) {
  if (!s) return { status: 'no_deadline', isBreached: !1, isCompleted: o }
  const a = new Date(s),
    x = i.getTime(),
    t = a.getTime()
  if (o && n) {
    const m = new Date(n).getTime(),
      d = m <= t
    return {
      status: d ? 'completed_on_time' : 'completed_late',
      isBreached: !d,
      isCompleted: !0,
      timeDiffMs: t - m,
      timeRemaining: d ? `Completed ${T(m - t)} early` : `Completed ${T(m - t)} late`,
    }
  }
  const u = t - x,
    r = u < 0,
    j = t - 7 * 24 * 60 * 60 * 1e3,
    b = t - j,
    $ = x - j,
    w = Math.max(0, Math.min(200, ($ / b) * 100))
  let l
  return (
    r ? (l = 'breached') : w >= 75 ? (l = 'warning') : (l = 'safe'),
    {
      status: l,
      percentElapsed: w,
      timeDiffMs: u,
      isBreached: r,
      isCompleted: !1,
      timeRemaining: r ? `${T(Math.abs(u))} overdue` : `${T(u)} remaining`,
    }
  )
}
function T(s) {
  const o = Math.abs(s),
    n = Math.floor(o / 1e3),
    i = Math.floor(n / 60),
    a = Math.floor(i / 60),
    x = Math.floor(a / 24),
    t = Math.floor(x / 7),
    u = Math.floor(x / 30)
  return u > 0
    ? `${u} ${u === 1 ? 'month' : 'months'}`
    : t > 0
      ? `${t} ${t === 1 ? 'week' : 'weeks'}`
      : x > 0
        ? `${x} ${x === 1 ? 'day' : 'days'}`
        : a > 0
          ? `${a} ${a === 1 ? 'hour' : 'hours'}`
          : i > 0
            ? `${i} ${i === 1 ? 'minute' : 'minutes'}`
            : `${n} ${n === 1 ? 'second' : 'seconds'}`
}
function De({ deadline: s, isCompleted: o = !1, completedAt: n, mode: i = 'badge', className: a }) {
  const { t: x, i18n: t } = N(),
    u = t.language === 'ar'
  if (!s) return null
  const r = Ce(s, o, n)
  return i === 'badge'
    ? e.jsx(Te, { status: r, isRTL: u, className: a })
    : e.jsx(Ie, { status: r, deadline: s, isRTL: u, className: a })
}
function Te({ status: s, isRTL: o, className: n }) {
  const { t: i } = N(),
    a = J(s.status)
  return e.jsxs('div', {
    className: k(
      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
      'min-h-11 min-w-11',
      'sm:min-h-10 sm:px-3 sm:py-1.5 sm:text-sm',
      'md:min-h-9',
      o ? 'flex-row-reverse' : 'flex-row',
      B(s.status),
      n,
    ),
    role: 'status',
    'aria-label': i(`tasks.sla.${s.status}`, { defaultValue: s.status }),
    children: [
      e.jsx(a, { className: k('size-4', o ? 'rotate-180' : ''), 'aria-hidden': 'true' }),
      e.jsx('span', { className: 'text-start', children: i(`tasks.sla.${s.status}`) }),
    ],
  })
}
function Ie({ status: s, deadline: o, isRTL: n, className: i }) {
  const { t: a } = N(),
    x = J(s.status)
  return e.jsxs('div', {
    className: k(
      'flex flex-col gap-2 p-4 rounded-lg border',
      'sm:gap-3 sm:p-6',
      'md:flex-row md:items-center md:justify-between',
      'text-start',
      Le(s.status),
      i,
    ),
    dir: n ? 'rtl' : 'ltr',
    role: 'region',
    'aria-labelledby': 'sla-info-title',
    children: [
      e.jsxs('div', {
        className: k('flex items-center gap-2', n ? 'flex-row-reverse' : 'flex-row'),
        children: [
          e.jsx(x, {
            className: k('size-5 sm:size-6', n ? 'rotate-180' : '', B(s.status)),
            'aria-hidden': 'true',
          }),
          e.jsxs('div', {
            className: 'flex flex-col',
            children: [
              e.jsx('h3', {
                id: 'sla-info-title',
                className: 'text-sm font-semibold sm:text-base',
                children: a(`tasks.sla.${s.status}`),
              }),
              e.jsx('p', {
                className: 'text-xs text-muted-foreground sm:text-sm',
                children: a('tasks.sla.deadline'),
              }),
            ],
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'flex flex-col gap-1 text-sm sm:text-base',
        children: [
          e.jsxs('div', {
            className: k('flex items-center gap-2', n ? 'flex-row-reverse' : 'flex-row'),
            children: [
              e.jsx(U, { className: k('size-4', n ? 'rotate-180' : ''), 'aria-hidden': 'true' }),
              e.jsx('span', {
                children: new Date(o).toLocaleString(n ? 'ar-SA' : 'en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }),
              }),
            ],
          }),
          s.timeRemaining &&
            e.jsx('p', {
              className: 'text-xs text-muted-foreground sm:text-sm',
              children: s.timeRemaining,
            }),
        ],
      }),
      !s.status.includes('completed') &&
        s.percentElapsed !== void 0 &&
        e.jsxs('div', {
          className: 'flex flex-col gap-1 w-full md:w-48',
          children: [
            e.jsxs('div', {
              className: 'flex justify-between text-xs text-muted-foreground',
              children: [
                e.jsx('span', { children: a('tasks.sla.progress') }),
                e.jsxs('span', { children: [Math.round(s.percentElapsed), '%'] }),
              ],
            }),
            e.jsx('div', {
              className: 'w-full h-2 bg-gray-200 rounded-full overflow-hidden',
              children: e.jsx('div', {
                className: k('h-full transition-all duration-500', B(s.status)),
                style: { width: `${Math.min(s.percentElapsed, 100)}%` },
                role: 'progressbar',
                'aria-valuenow': Math.round(s.percentElapsed),
                'aria-valuemin': 0,
                'aria-valuemax': 100,
              }),
            }),
          ],
        }),
    ],
  })
}
function J(s) {
  switch (s) {
    case 'safe':
      return O
    case 'warning':
      return X
    case 'breached':
      return K
    case 'completed_on_time':
      return O
    case 'completed_late':
      return K
    default:
      return U
  }
}
function B(s) {
  switch (s) {
    case 'safe':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
    case 'breached':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
    case 'completed_on_time':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
    case 'completed_late':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
  }
}
function Le(s) {
  switch (s) {
    case 'safe':
      return 'border-green-300 dark:border-green-700'
    case 'warning':
      return 'border-yellow-300 dark:border-yellow-700'
    case 'breached':
      return 'border-red-300 dark:border-red-700'
    case 'completed_on_time':
      return 'border-blue-300 dark:border-blue-700'
    case 'completed_late':
      return 'border-gray-300 dark:border-gray-700'
    default:
      return 'border-gray-300 dark:border-gray-700'
  }
}
function Ae({ selectedItems: s, onItemsChange: o, disabled: n = !1 }) {
  const { t: i, i18n: a } = N(),
    x = a.language === 'ar',
    [t, u] = C.useState(!1),
    [r, j] = C.useState('dossier'),
    [b, $] = C.useState(''),
    [w, l] = C.useState([]),
    p = async (c, y) => {
      const h = [
        { type: 'dossier', id: '1', title: 'Australia Population Data Initiative' },
        { type: 'dossier', id: '2', title: 'Canada Trade Agreement Review' },
        { type: 'position', id: '3', title: 'Senior Analyst Position' },
        { type: 'ticket', id: '4', title: 'Intake #25' },
      ].filter((W) => W.type === y && W.title.toLowerCase().includes(c.toLowerCase()))
      l(h)
    },
    m = (c) => {
      ;(s.find((y) => y.id === c.id && y.type === c.type) || o([...s, c]), $(''), l([]))
    },
    d = (c, y) => {
      o(s.filter((h) => !(h.id === c && h.type === y)))
    },
    f = (c) => {
      switch (c) {
        case 'dossier':
          return e.jsx(I, { className: 'size-4' })
        case 'position':
          return e.jsx(Q, { className: 'size-4' })
        case 'ticket':
          return e.jsx(R, { className: 'size-4' })
      }
    }
  return e.jsxs('div', {
    className: 'space-y-2',
    dir: x ? 'rtl' : 'ltr',
    children: [
      e.jsx(L, { className: 'text-sm sm:text-base', children: i('tasks.linkedItems') }),
      e.jsxs('div', {
        className: 'flex flex-wrap gap-2',
        children: [
          s.map((c) =>
            e.jsxs(
              'div',
              {
                className: 'flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm',
                children: [
                  f(c.type),
                  e.jsx('span', { className: 'text-start', children: c.title }),
                  e.jsxs(_, {
                    variant: 'ghost',
                    size: 'icon',
                    className: 'h-5 w-5',
                    onClick: () => d(c.id, c.type),
                    disabled: n,
                    children: [
                      e.jsx(ye, { className: 'size-3' }),
                      e.jsx('span', { className: 'sr-only', children: i('common.remove') }),
                    ],
                  }),
                ],
              },
              `${c.type}-${c.id}`,
            ),
          ),
          s.length === 0 &&
            e.jsx('p', {
              className: 'text-sm text-muted-foreground text-start',
              children: i('tasks.noLinkedItems'),
            }),
        ],
      }),
      e.jsxs(ie, {
        open: t,
        onOpenChange: u,
        children: [
          e.jsx(ne, {
            asChild: !0,
            children: e.jsxs(_, {
              variant: 'outline',
              size: 'sm',
              className: 'w-full sm:w-auto',
              disabled: n,
              children: [
                e.jsx(we, { className: `size-4 ${x ? 'ms-2' : 'me-2'}` }),
                i('tasks.addWorkItem'),
              ],
            }),
          }),
          e.jsxs(le, {
            className: 'w-[calc(100vw-2rem)] max-w-lg sm:max-w-xl',
            children: [
              e.jsxs(de, {
                children: [
                  e.jsx(ce, {
                    className: 'text-start text-lg sm:text-xl',
                    children: i('tasks.linkWorkItems'),
                  }),
                  e.jsx(oe, {
                    className: 'text-start text-sm sm:text-base',
                    children: i('tasks.linkWorkItemsDescription'),
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'space-y-4 py-4',
                children: [
                  e.jsxs('div', {
                    className: 'space-y-2',
                    children: [
                      e.jsx(L, {
                        className: 'text-sm sm:text-base',
                        children: i('tasks.itemType'),
                      }),
                      e.jsxs(me, {
                        value: r,
                        onValueChange: (c) => j(c),
                        children: [
                          e.jsx(xe, { className: 'w-full', children: e.jsx(ue, {}) }),
                          e.jsxs(pe, {
                            children: [
                              e.jsx(A, {
                                value: 'dossier',
                                children: e.jsxs('div', {
                                  className: 'flex items-center gap-2',
                                  children: [
                                    e.jsx(I, { className: 'size-4' }),
                                    e.jsx('span', { children: i('tasks.dossier') }),
                                  ],
                                }),
                              }),
                              e.jsx(A, {
                                value: 'position',
                                children: e.jsxs('div', {
                                  className: 'flex items-center gap-2',
                                  children: [
                                    e.jsx(Q, { className: 'size-4' }),
                                    e.jsx('span', { children: i('tasks.position') }),
                                  ],
                                }),
                              }),
                              e.jsx(A, {
                                value: 'ticket',
                                children: e.jsxs('div', {
                                  className: 'flex items-center gap-2',
                                  children: [
                                    e.jsx(R, { className: 'size-4' }),
                                    e.jsx('span', { children: i('tasks.ticket') }),
                                  ],
                                }),
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
                      e.jsx(L, { className: 'text-sm sm:text-base', children: i('tasks.search') }),
                      e.jsx(ge, {
                        type: 'text',
                        placeholder: i('tasks.searchPlaceholder'),
                        value: b,
                        onChange: (c) => {
                          ;($(c.target.value),
                            c.target.value.length >= 2 ? p(c.target.value, r) : l([]))
                        },
                        className: 'text-start',
                      }),
                    ],
                  }),
                  w.length > 0 &&
                    e.jsx('div', {
                      className: 'max-h-48 space-y-2 overflow-y-auto rounded-lg border p-2',
                      children: w.map((c) =>
                        e.jsx(
                          _,
                          {
                            variant: 'ghost',
                            className: 'h-auto w-full justify-start px-3 py-2 text-start',
                            onClick: () => m(c),
                            children: e.jsxs('div', {
                              className: 'flex items-center gap-2',
                              children: [f(c.type), e.jsx('span', { children: c.title })],
                            }),
                          },
                          `${c.type}-${c.id}`,
                        ),
                      ),
                    }),
                  b.length >= 2 &&
                    w.length === 0 &&
                    e.jsx('p', {
                      className: 'text-sm text-muted-foreground text-start',
                      children: i('tasks.noResults'),
                    }),
                ],
              }),
              e.jsx(he, {
                className: 'flex-col-reverse gap-2 sm:flex-row',
                children: e.jsx(_, {
                  variant: 'outline',
                  onClick: () => u(!1),
                  className: 'w-full sm:w-auto',
                  children: i('common.close'),
                }),
              }),
            ],
          }),
        ],
      }),
    ],
  })
}
function Me({ items: s, emptyMessage: o }) {
  const { t: n, i18n: i } = N(),
    a = i.language === 'ar',
    x = (r) => {
      const j = 'size-4 sm:size-5'
      switch (r) {
        case 'dossier':
          return e.jsx(I, { className: j })
        case 'position':
          return e.jsx(Q, { className: j })
        case 'ticket':
          return e.jsx(R, { className: j })
      }
    },
    t = (r) => {
      switch (r.type) {
        case 'dossier':
          return `/dossiers/${r.id}`
        case 'position':
          return `/positions/${r.id}`
        case 'ticket':
          return `/intake-tickets/${r.id}`
      }
    },
    u = (r) => {
      switch (r) {
        case 'dossier':
          return n('tasks.dossier')
        case 'position':
          return n('tasks.position')
        case 'ticket':
          return n('tasks.ticket')
      }
    }
  return s.length === 0
    ? e.jsx('div', {
        className: 'rounded-lg border border-dashed p-6 text-center',
        dir: a ? 'rtl' : 'ltr',
        children: e.jsx('p', {
          className: 'text-sm text-muted-foreground',
          children: o || n('tasks.noLinkedItems'),
        }),
      })
    : e.jsx('div', {
        className: 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3',
        dir: a ? 'rtl' : 'ltr',
        children: s.map((r) =>
          e.jsx(
            se,
            {
              to: t(r),
              className: 'group',
              children: e.jsx(z, {
                className: 'h-full transition-all hover:shadow-md hover:border-primary/50',
                children: e.jsxs(E, {
                  className: 'flex flex-col gap-3 p-4',
                  children: [
                    e.jsxs('div', {
                      className: 'flex items-center justify-between',
                      children: [
                        e.jsxs('div', {
                          className: 'flex items-center gap-2',
                          children: [
                            e.jsx('div', {
                              className: 'rounded-full bg-muted p-2',
                              children: x(r.type),
                            }),
                            e.jsx('span', {
                              className: 'text-xs text-muted-foreground sm:text-sm',
                              children: u(r.type),
                            }),
                          ],
                        }),
                        e.jsx(G, {
                          className: 'size-4 opacity-0 transition-opacity group-hover:opacity-100',
                        }),
                      ],
                    }),
                    e.jsx('h3', {
                      className: 'text-sm font-medium text-start line-clamp-2 sm:text-base',
                      children: r.title,
                    }),
                  ],
                }),
              }),
            },
            `${r.type}-${r.id}`,
          ),
        ),
      })
}
function ze({
  task: s,
  onEdit: o,
  onDelete: n,
  onStatusChange: i,
  showActions: a = !0,
  isTaskOwner: x = !1,
}) {
  const { t, i18n: u } = N(),
    r = u.language === 'ar',
    j = Se(),
    b = (l) => {
      const p = {
        urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      }
      return p[l] || p.medium
    },
    $ = (l) => {
      const p = {
        pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        review: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      }
      return p[l] || p.pending
    },
    w = s.status === 'completed' || s.status === 'cancelled'
  return e.jsxs('div', {
    className: 'space-y-6',
    dir: r ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        children: [
          e.jsxs('div', {
            className: 'flex flex-wrap items-start justify-between gap-4 mb-4',
            children: [
              e.jsx('h1', {
                className: `text-2xl sm:text-3xl md:text-4xl font-bold flex-1 ${r ? 'text-end' : 'text-start'}`,
                children: s.title,
              }),
              a &&
                e.jsxs('div', {
                  className: 'flex gap-2',
                  children: [
                    o &&
                      e.jsxs(_, {
                        variant: 'outline',
                        size: 'sm',
                        onClick: () => o(s),
                        children: [
                          e.jsx(_e, { className: `h-4 w-4 ${r ? 'ml-2' : 'mr-2'}` }),
                          t('edit', 'Edit'),
                        ],
                      }),
                    n &&
                      s.status !== 'completed' &&
                      e.jsxs(_, {
                        variant: 'destructive',
                        size: 'sm',
                        onClick: () => n(s),
                        children: [
                          e.jsx(ke, { className: `h-4 w-4 ${r ? 'ml-2' : 'mr-2'}` }),
                          t('delete', 'Delete'),
                        ],
                      }),
                  ],
                }),
            ],
          }),
          e.jsxs('div', {
            className: 'flex flex-wrap gap-2',
            children: [
              e.jsx(v, {
                className: b(s.priority),
                children: t(`priority.${s.priority}`, s.priority),
              }),
              e.jsx(v, { className: $(s.status), children: t(`status.${s.status}`, s.status) }),
              e.jsx(v, {
                variant: 'outline',
                children: t(`workflow_stage.${s.workflow_stage}`, s.workflow_stage),
              }),
              s.work_item_type &&
                e.jsxs(v, {
                  variant: 'outline',
                  children: [
                    e.jsx(V, { className: `h-3 w-3 ${r ? 'ml-1' : 'mr-1'}` }),
                    t(`work_item.${s.work_item_type}`, s.work_item_type),
                  ],
                }),
            ],
          }),
        ],
      }),
      e.jsx(De, {
        deadline: s.sla_deadline,
        isCompleted: w,
        completedAt: s.completed_at,
        mode: 'detailed',
      }),
      e.jsxs(z, {
        children: [
          e.jsx(P, {
            children: e.jsx(F, {
              className: r ? 'text-end' : 'text-start',
              children: t('task_details', 'Task Details'),
            }),
          }),
          e.jsxs(E, {
            className: 'space-y-4',
            children: [
              s.description &&
                e.jsxs('div', {
                  children: [
                    e.jsxs('div', {
                      className: 'flex items-center gap-2 mb-2',
                      children: [
                        e.jsx(I, { className: 'h-4 w-4 text-muted-foreground' }),
                        e.jsx('p', {
                          className: 'text-sm font-medium',
                          children: t('description', 'Description'),
                        }),
                      ],
                    }),
                    e.jsx('p', {
                      className: `text-sm text-muted-foreground whitespace-pre-wrap ${r ? 'text-end' : 'text-start'}`,
                      children: s.description,
                    }),
                  ],
                }),
              e.jsx(D, {}),
              e.jsxs('div', {
                children: [
                  e.jsxs('div', {
                    className: 'flex items-center gap-2 mb-2',
                    children: [
                      e.jsx(Ne, { className: 'h-4 w-4 text-muted-foreground' }),
                      e.jsx('p', {
                        className: 'text-sm font-medium',
                        children: t('assignee', 'Assignee'),
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'ps-6',
                    children: [
                      e.jsx('p', {
                        className: 'text-sm text-foreground',
                        children: s.assignee_name || s.assignee_id || t('unassigned', 'Unassigned'),
                      }),
                      s.assignee_email &&
                        e.jsx('a', {
                          href: `mailto:${s.assignee_email}`,
                          className: 'text-xs text-primary hover:underline',
                          children: s.assignee_email,
                        }),
                    ],
                  }),
                ],
              }),
              e.jsx(D, {}),
              e.jsxs('div', {
                className: 'flex items-center justify-between',
                children: [
                  e.jsxs('div', {
                    className: 'flex items-center gap-2',
                    children: [
                      e.jsx(U, { className: 'h-4 w-4 text-muted-foreground' }),
                      e.jsx('p', {
                        className: 'text-sm font-medium',
                        children: t('workflow_stage', 'Workflow Stage'),
                      }),
                    ],
                  }),
                  e.jsx(v, {
                    variant: 'outline',
                    children: t(`workflow_stage.${s.workflow_stage}`, s.workflow_stage),
                  }),
                ],
              }),
              e.jsx(D, {}),
              e.jsxs('div', {
                className: 'space-y-2',
                children: [
                  e.jsxs('div', {
                    className: 'flex items-center justify-between',
                    children: [
                      e.jsxs('div', {
                        className: 'flex items-center gap-2',
                        children: [
                          e.jsx(M, { className: 'h-4 w-4 text-muted-foreground' }),
                          e.jsx('p', {
                            className: 'text-sm font-medium',
                            children: t('created', 'Created'),
                          }),
                        ],
                      }),
                      e.jsx('p', {
                        className: 'text-sm text-muted-foreground',
                        children: new Date(s.created_at).toLocaleString(r ? 'ar-SA' : 'en-US'),
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'flex items-center justify-between',
                    children: [
                      e.jsxs('div', {
                        className: 'flex items-center gap-2',
                        children: [
                          e.jsx(M, { className: 'h-4 w-4 text-muted-foreground' }),
                          e.jsx('p', {
                            className: 'text-sm font-medium',
                            children: t('updated', 'Last Updated'),
                          }),
                        ],
                      }),
                      e.jsx('p', {
                        className: 'text-sm text-muted-foreground',
                        children: new Date(s.updated_at).toLocaleString(r ? 'ar-SA' : 'en-US'),
                      }),
                    ],
                  }),
                  s.completed_at &&
                    e.jsxs('div', {
                      className: 'flex items-center justify-between',
                      children: [
                        e.jsxs('div', {
                          className: 'flex items-center gap-2',
                          children: [
                            e.jsx(M, { className: 'h-4 w-4 text-muted-foreground' }),
                            e.jsx('p', {
                              className: 'text-sm font-medium',
                              children: t('completed', 'Completed'),
                            }),
                          ],
                        }),
                        e.jsx('p', {
                          className: 'text-sm text-muted-foreground',
                          children: new Date(s.completed_at).toLocaleString(r ? 'ar-SA' : 'en-US'),
                        }),
                      ],
                    }),
                ],
              }),
              s.engagement &&
                e.jsxs(e.Fragment, {
                  children: [
                    e.jsx(D, {}),
                    e.jsxs('div', {
                      className: 'space-y-3',
                      children: [
                        e.jsxs('div', {
                          className: 'flex items-center gap-2',
                          children: [
                            e.jsx(ve, { className: 'h-4 w-4 text-muted-foreground' }),
                            e.jsx('p', {
                              className: 'text-sm font-medium',
                              children: t('engagement', 'Engagement'),
                            }),
                          ],
                        }),
                        e.jsx('div', {
                          className: 'ps-6',
                          children: e.jsx('p', {
                            className: 'text-sm font-semibold text-foreground',
                            children: s.engagement.title,
                          }),
                        }),
                        e.jsxs('div', {
                          className: 'grid grid-cols-1 sm:grid-cols-2 gap-3 ps-6',
                          children: [
                            e.jsxs('div', {
                              children: [
                                e.jsx('p', {
                                  className: 'text-xs text-muted-foreground mb-1',
                                  children: t('type', 'Type'),
                                }),
                                e.jsx(v, {
                                  variant: 'outline',
                                  className: 'capitalize',
                                  children: s.engagement.engagement_type.replace(/_/g, ' '),
                                }),
                              ],
                            }),
                            e.jsxs('div', {
                              children: [
                                e.jsx('p', {
                                  className: 'text-xs text-muted-foreground mb-1',
                                  children: t('date', 'Date'),
                                }),
                                e.jsx('p', {
                                  className: 'text-sm',
                                  children: new Date(
                                    s.engagement.engagement_date,
                                  ).toLocaleDateString(r ? 'ar-SA' : 'en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  }),
                                }),
                              ],
                            }),
                          ],
                        }),
                        s.engagement.location &&
                          e.jsxs('div', {
                            className: 'ps-6',
                            children: [
                              e.jsx('p', {
                                className: 'text-xs text-muted-foreground mb-1',
                                children: t('location', 'Location'),
                              }),
                              e.jsx('p', {
                                className: 'text-sm text-foreground',
                                children: s.engagement.location,
                              }),
                            ],
                          }),
                        s.engagement.dossier &&
                          e.jsxs('div', {
                            className: 'ps-6',
                            children: [
                              e.jsx('p', {
                                className: 'text-xs text-muted-foreground mb-1',
                                children: t('related_dossier', 'Related Dossier'),
                              }),
                              e.jsx(_, {
                                asChild: !0,
                                variant: 'outline',
                                size: 'sm',
                                className: 'mt-1 h-9',
                                children: e.jsxs('a', {
                                  href: `/dossiers/${s.engagement.dossier.id}`,
                                  children: [
                                    e.jsx(G, { className: `h-3.5 w-3.5 ${r ? 'ms-2' : 'me-2'}` }),
                                    r ? s.engagement.dossier.name_ar : s.engagement.dossier.name_en,
                                  ],
                                }),
                              }),
                            ],
                          }),
                      ],
                    }),
                  ],
                }),
            ],
          }),
        ],
      }),
      e.jsxs(z, {
        children: [
          e.jsx(P, {
            children: e.jsxs(F, {
              className: `flex items-center gap-2 ${r ? 'flex-row-reverse' : ''}`,
              children: [
                e.jsx(V, { className: 'h-5 w-5' }),
                t('linked_work_items', 'Linked Work Items'),
                (() => {
                  const l = s.source,
                    p =
                      (l?.dossier_ids?.length || 0) +
                      (l?.position_ids?.length || 0) +
                      (l?.ticket_ids?.length || 0) +
                      (s.work_item_id && s.work_item_type !== 'generic' ? 1 : 0)
                  return p > 0
                    ? e.jsx(v, { variant: 'secondary', className: 'ms-2', children: p })
                    : null
                })(),
              ],
            }),
          }),
          e.jsxs(E, {
            className: 'space-y-4',
            children: [
              (() => {
                const l = s,
                  p = new Map()
                if (s.work_item_id && s.work_item_type && s.work_item_type !== 'generic') {
                  const d = `${s.work_item_type}-${s.work_item_id}`,
                    f = r
                      ? l.work_item_title_ar || l.work_item_title_en
                      : l.work_item_title_en || l.work_item_title_ar
                  p.set(d, {
                    type: s.work_item_type,
                    id: s.work_item_id,
                    title: f || `${s.work_item_type} #${s.work_item_id.substring(0, 8)}`,
                  })
                }
                l.work_items &&
                  Array.isArray(l.work_items) &&
                  l.work_items.forEach((d) => {
                    if (!d || !d.type || !d.id) return
                    const f = `${d.type}-${d.id}`
                    if (p.has(f)) return
                    const c = r ? d.title_ar || d.title_en : d.title_en || d.title_ar
                    p.set(f, {
                      type: d.type,
                      id: d.id,
                      title:
                        c || `${t(`work_item.${d.type}`, d.type)} (${t('deleted', 'Deleted')})`,
                    })
                  })
                const m = Array.from(p.values()).filter(
                  (d, f, c) => f === c.findIndex((y) => y.type === d.type && y.id === d.id),
                )
                return m.length > 0
                  ? e.jsx(Me, { items: m })
                  : e.jsx('div', {
                      className: 'rounded-lg border border-dashed p-6 text-center',
                      children: e.jsx('p', {
                        className: 'text-sm text-muted-foreground',
                        children: t('no_linked_items', 'No work items linked to this task'),
                      }),
                    })
              })(),
              x &&
                !w &&
                e.jsxs('div', {
                  className: 'pt-2 border-t mt-4 pt-4',
                  children: [
                    e.jsx('p', {
                      className: 'text-sm text-muted-foreground mb-2',
                      children: t(
                        'edit_linked_items',
                        'Edit linked work items (re-link if deleted)',
                      ),
                    }),
                    e.jsx(Ae, {
                      selectedItems: (() => {
                        const l = s,
                          p = new Map()
                        if (s.work_item_id && s.work_item_type && s.work_item_type !== 'generic') {
                          const m = `${s.work_item_type}-${s.work_item_id}`,
                            d = r
                              ? l.work_item_title_ar || l.work_item_title_en
                              : l.work_item_title_en || l.work_item_title_ar
                          p.set(m, {
                            type: s.work_item_type,
                            id: s.work_item_id,
                            title: d || `${s.work_item_type} #${s.work_item_id.substring(0, 8)}`,
                          })
                        }
                        return (
                          l.work_items &&
                            Array.isArray(l.work_items) &&
                            l.work_items.forEach((m) => {
                              if (!m || !m.type || !m.id) return
                              const d = `${m.type}-${m.id}`
                              if (p.has(d)) return
                              const f = r ? m.title_ar || m.title_en : m.title_en || m.title_ar
                              p.set(d, {
                                type: m.type,
                                id: m.id,
                                title:
                                  f ||
                                  `${t(`work_item.${m.type}`, m.type)} (${t('deleted', 'Deleted')})`,
                              })
                            }),
                          Array.from(p.values())
                        )
                      })(),
                      onItemsChange: async (l) => {
                        const p = l[0],
                          m = l.slice(1),
                          d = { type: m.length > 0 ? 'multi' : 'single' },
                          f = m.filter((h) => h.type === 'dossier').map((h) => h.id),
                          c = m.filter((h) => h.type === 'position').map((h) => h.id),
                          y = m.filter((h) => h.type === 'ticket').map((h) => h.id)
                        ;(f.length > 0 && (d.dossier_ids = f),
                          c.length > 0 && (d.position_ids = c),
                          y.length > 0 && (d.ticket_ids = y),
                          j.mutate({
                            taskId: s.id,
                            data: {
                              work_item_type: p?.type || 'generic',
                              work_item_id: p?.id || null,
                              source: Object.keys(d).length > 1 ? d : null,
                              last_known_updated_at: s.updated_at,
                            },
                          }))
                      },
                      disabled: !1,
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
function Ee() {
  const { t: s, i18n: o } = N(),
    n = o.language === 'ar',
    i = te(),
    { id: a } = ae({ from: '/_protected/tasks/$id' }),
    { data: x, isLoading: t, error: u } = $e(a),
    r = () => {},
    j = async () => {
      confirm(s('confirm_delete_task', 'Are you sure you want to delete this task?'))
    }
  return u
    ? e.jsxs('div', {
        className: 'container mx-auto px-4 py-6 sm:px-6 lg:px-8',
        children: [
          e.jsxs(fe, {
            variant: 'destructive',
            children: [
              e.jsx(X, { className: 'size-4' }),
              e.jsx(je, {
                children:
                  u.message || s('failed_to_load_task', 'Failed to load task. Please try again.'),
              }),
            ],
          }),
          e.jsx(_, {
            variant: 'outline',
            onClick: () => i({ to: '/tasks' }),
            className: 'mt-4',
            children: s('back_to_tasks', 'Back to Tasks'),
          }),
        ],
      })
    : e.jsxs('div', {
        className: 'container mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8',
        dir: n ? 'rtl' : 'ltr',
        children: [
          t &&
            e.jsxs('div', {
              className: 'space-y-6',
              children: [
                e.jsxs('div', {
                  className: 'space-y-4',
                  children: [
                    e.jsx(S, { className: 'h-12 w-3/4' }),
                    e.jsxs('div', {
                      className: 'flex gap-2',
                      children: [
                        e.jsx(S, { className: 'h-6 w-20' }),
                        e.jsx(S, { className: 'h-6 w-24' }),
                        e.jsx(S, { className: 'h-6 w-20' }),
                      ],
                    }),
                  ],
                }),
                e.jsx(S, { className: 'h-64 w-full' }),
                e.jsx(S, { className: 'h-48 w-full' }),
              ],
            }),
          !t &&
            x &&
            e.jsxs(e.Fragment, {
              children: [
                e.jsx('div', {
                  children: e.jsxs(_, {
                    variant: 'ghost',
                    size: 'sm',
                    onClick: () => i({ to: '/tasks' }),
                    className: 'mb-4',
                    children: [
                      e.jsx(be, {
                        className: `size-4 ${n ? '' : 'rotate-180'} ${n ? 'ml-2' : 'mr-2'}`,
                      }),
                      s('back_to_tasks', 'Back to Tasks'),
                    ],
                  }),
                }),
                e.jsx(ze, { task: x, onEdit: r, onDelete: j, showActions: !0 }),
              ],
            }),
        ],
      })
}
const Ve = Ee
export { Ve as component }
//# sourceMappingURL=_id-vcqYAzoy.js.map
