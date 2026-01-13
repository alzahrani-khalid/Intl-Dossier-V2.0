import { u as z, j as e, r as t } from './react-vendor-Buoak6m3.js'
import {
  c as T,
  B as K,
  D as fe,
  x as be,
  y as je,
  a9 as ye,
  z as Ce,
  J as V,
  n as we,
  q as Q,
  r as Y,
  t as G,
  v as Z,
  w as ee,
  ae as Ne,
  N as ke,
  O as Se,
  P as se,
  Q as ne,
  C as re,
  R as ve,
  U as te,
  m as le,
} from './index-qYY0KoZ1.js'
import {
  b$ as ae,
  aN as Ae,
  aD as de,
  dq as Te,
  aA as ue,
  c7 as De,
  bp as me,
  c1 as Re,
  b6 as Ie,
  bP as Ue,
  dr as ce,
  c5 as ie,
  aB as Me,
  aS as J,
  bw as $e,
  cL as Le,
  bi as Oe,
} from './vendor-misc-BiJvMP0A.js'
import {
  A as Pe,
  a as _e,
  b as Ee,
  c as Be,
  d as Ke,
  e as ze,
  f as Fe,
  g as qe,
} from './alert-dialog-DaWYDPc1.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './tanstack-vendor-BZC-rs5U.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
const oe = {
  'update-status': e.jsx(Me, { className: 'h-4 w-4' }),
  assign: e.jsx(ie, { className: 'h-4 w-4' }),
  unassign: e.jsx(ie, { className: 'h-4 w-4' }),
  'add-tags': e.jsx(ce, { className: 'h-4 w-4' }),
  'remove-tags': e.jsx(ce, { className: 'h-4 w-4' }),
  export: e.jsx(Ue, { className: 'h-4 w-4' }),
  delete: e.jsx(Ie, { className: 'h-4 w-4' }),
  archive: e.jsx(Re, { className: 'h-4 w-4' }),
  restore: e.jsx(me, { className: 'h-4 w-4' }),
  'send-reminder': e.jsx(De, { className: 'h-4 w-4' }),
  escalate: e.jsx(ue, { className: 'h-4 w-4' }),
  'change-priority': e.jsx(Te, { className: 'h-4 w-4' }),
}
function Ve({
  selection: c,
  actions: a,
  entityType: f,
  actionState: i,
  onActionClick: j,
  onClearSelection: p,
  onSelectAll: h,
  disabled: r = !1,
  className: s,
}) {
  const { t: l, i18n: D } = z('bulk-actions'),
    b = D.language === 'ar',
    { selectedCount: S, maxReached: u } = c,
    g = i.status === 'processing'
  if (S === 0) return null
  const A = a.slice(0, 3),
    y = a.slice(3),
    R = l(S === 1 ? `entityTypes.${f}` : `entityTypes.${f}_plural`)
  return e.jsxs('div', {
    className: T(
      'sticky top-0 z-10 flex flex-col gap-2 p-3 sm:p-4',
      'bg-blue-50 border-b border-blue-200',
      'dark:bg-blue-950 dark:border-blue-800',
      'sm:flex-row sm:items-center sm:justify-between sm:gap-4',
      s,
    ),
    dir: b ? 'rtl' : 'ltr',
    role: 'toolbar',
    'aria-label': l('accessibility.toolbar'),
    children: [
      e.jsxs('div', {
        className: 'flex items-center gap-2 sm:gap-3',
        children: [
          e.jsxs('span', {
            className: 'text-sm font-medium text-blue-900 dark:text-blue-100 sm:text-base',
            children: [l('selection.selected', { count: S }), ' ', R],
          }),
          u &&
            e.jsx('span', {
              className: 'text-xs text-orange-600 dark:text-orange-400 sm:text-sm',
              children: l('selection.maxReached'),
            }),
          h &&
            !u &&
            e.jsx(K, {
              variant: 'link',
              size: 'sm',
              onClick: h,
              disabled: r || g,
              className: 'h-auto p-0 text-blue-600 dark:text-blue-400',
              children: l('selection.selectAll'),
            }),
        ],
      }),
      e.jsxs('div', {
        className: 'flex flex-wrap items-center gap-2 sm:gap-3',
        children: [
          A.map((m) =>
            e.jsxs(
              K,
              {
                onClick: () => j(m),
                disabled: r || g,
                variant: m.variant || 'default',
                size: 'sm',
                className: T(
                  'h-10 min-w-10 px-3 text-sm sm:h-11 sm:px-4',
                  m.isDestructive && 'hover:bg-red-600 hover:text-white',
                ),
                'aria-label': l(`actions.${m.id.replace(/-/g, '')}`),
                children: [
                  e.jsx('span', {
                    className: T('me-0 sm:me-2', b && 'rotate-0'),
                    children: oe[m.id] || e.jsx(ae, { className: 'h-4 w-4' }),
                  }),
                  e.jsx('span', {
                    className: 'hidden sm:inline',
                    children: l(`actions.${m.id.replace(/-/g, '')}`),
                  }),
                ],
              },
              m.id,
            ),
          ),
          y.length > 0 &&
            e.jsxs(fe, {
              children: [
                e.jsx(be, {
                  asChild: !0,
                  children: e.jsxs(K, {
                    variant: 'outline',
                    size: 'sm',
                    disabled: r || g,
                    className: 'h-10 min-w-10 px-3 sm:h-11 sm:px-4',
                    'aria-label': l('actions.moreActions'),
                    children: [
                      e.jsx(ae, { className: 'h-4 w-4 me-0 sm:me-2' }),
                      e.jsx('span', {
                        className: 'hidden sm:inline',
                        children: l('actions.moreActions'),
                      }),
                      e.jsx(Ae, { className: T('h-4 w-4 ms-1', b && 'rotate-180') }),
                    ],
                  }),
                }),
                e.jsx(je, {
                  align: b ? 'start' : 'end',
                  className: 'w-48',
                  children: y.map((m, v) =>
                    e.jsxs(
                      'div',
                      {
                        children: [
                          m.isDestructive && v > 0 && e.jsx(ye, {}),
                          e.jsxs(Ce, {
                            onClick: () => j(m),
                            disabled: r || g,
                            className: T(
                              'gap-2',
                              m.isDestructive &&
                                'text-red-600 dark:text-red-400 focus:text-red-600',
                            ),
                            children: [
                              oe[m.id] || e.jsx(ae, { className: 'h-4 w-4' }),
                              e.jsx('span', { children: l(`actions.${m.id.replace(/-/g, '')}`) }),
                            ],
                          }),
                        ],
                      },
                      m.id,
                    ),
                  ),
                }),
              ],
            }),
          e.jsxs(K, {
            onClick: p,
            variant: 'ghost',
            size: 'sm',
            disabled: g,
            className: 'h-10 min-w-10 px-3 sm:h-11 sm:px-4 text-gray-600 dark:text-gray-400',
            'aria-label': l('selection.clearSelection'),
            children: [
              e.jsx(de, { className: 'h-4 w-4' }),
              e.jsx('span', {
                className: 'hidden sm:inline ms-2',
                children: l('selection.clearSelection'),
              }),
            ],
          }),
        ],
      }),
    ],
  })
}
const xe = 100,
  X = 3e4,
  Je = [
    {
      id: 'update-status',
      labelKey: 'bulkActions.actions.updateStatus',
      icon: 'RefreshCw',
      requiresConfirmation: !0,
      supportsUndo: !0,
    },
    {
      id: 'assign',
      labelKey: 'bulkActions.actions.assign',
      icon: 'UserPlus',
      requiresConfirmation: !0,
      supportsUndo: !0,
    },
    {
      id: 'add-tags',
      labelKey: 'bulkActions.actions.addTags',
      icon: 'Tags',
      requiresConfirmation: !1,
      supportsUndo: !0,
    },
    {
      id: 'export',
      labelKey: 'bulkActions.actions.export',
      icon: 'Download',
      requiresConfirmation: !1,
      supportsUndo: !1,
    },
    {
      id: 'delete',
      labelKey: 'bulkActions.actions.delete',
      icon: 'Trash2',
      variant: 'destructive',
      requiresConfirmation: !0,
      isDestructive: !0,
      supportsUndo: !0,
    },
  ],
  Xe = [
    'pending',
    'in_progress',
    'completed',
    'cancelled',
    'draft',
    'review',
    'approved',
    'rejected',
    'archived',
  ],
  He = ['low', 'medium', 'high', 'urgent'],
  We = ['csv', 'xlsx', 'pdf', 'json']
function Qe({
  open: c,
  action: a,
  itemCount: f,
  entityType: i,
  onConfirm: j,
  onCancel: p,
  isProcessing: h = !1,
  undoTtl: r = X,
}) {
  const { t: s, i18n: l } = z('bulk-actions'),
    D = l.language === 'ar',
    [b, S] = t.useState('pending'),
    [u, g] = t.useState('medium'),
    [A, y] = t.useState('csv'),
    [R, m] = t.useState('')
  if (!a) return null
  const v = s(f === 1 ? `entityTypes.${i}` : `entityTypes.${i}_plural`),
    I = s(`actions.${a.id.replace(/-/g, '')}`),
    P = Math.round(r / 1e3),
    L = () => {
      const o = {}
      switch (a.id) {
        case 'update-status':
          o.status = b
          break
        case 'change-priority':
          o.priority = u
          break
        case 'export':
          o.exportFormat = A
          break
        case 'escalate':
          o.notes = R
          break
      }
      j(o)
    },
    _ = () => {
      switch (a.id) {
        case 'update-status':
          return e.jsxs('div', {
            className: 'space-y-3 py-4',
            children: [
              e.jsx(V, {
                htmlFor: 'status-select',
                children: s('confirmation.updateStatus.selectStatus'),
              }),
              e.jsxs(Q, {
                value: b,
                onValueChange: (o) => S(o),
                children: [
                  e.jsx(Y, { id: 'status-select', className: 'w-full', children: e.jsx(G, {}) }),
                  e.jsx(Z, {
                    children: Xe.map((o) => e.jsx(ee, { value: o, children: s(`status.${o}`) }, o)),
                  }),
                ],
              }),
            ],
          })
        case 'change-priority':
          return e.jsxs('div', {
            className: 'space-y-3 py-4',
            children: [
              e.jsx(V, {
                htmlFor: 'priority-select',
                children: s('confirmation.changePriority.selectPriority'),
              }),
              e.jsxs(Q, {
                value: u,
                onValueChange: (o) => g(o),
                children: [
                  e.jsx(Y, { id: 'priority-select', className: 'w-full', children: e.jsx(G, {}) }),
                  e.jsx(Z, {
                    children: He.map((o) =>
                      e.jsx(ee, { value: o, children: s(`priority.${o}`) }, o),
                    ),
                  }),
                ],
              }),
            ],
          })
        case 'export':
          return e.jsxs('div', {
            className: 'space-y-3 py-4',
            children: [
              e.jsx(V, {
                htmlFor: 'format-select',
                children: s('confirmation.export.selectFormat'),
              }),
              e.jsxs(Q, {
                value: A,
                onValueChange: (o) => y(o),
                children: [
                  e.jsx(Y, { id: 'format-select', className: 'w-full', children: e.jsx(G, {}) }),
                  e.jsx(Z, {
                    children: We.map((o) =>
                      e.jsx(ee, { value: o, children: s(`confirmation.export.formats.${o}`) }, o),
                    ),
                  }),
                ],
              }),
            ],
          })
        case 'escalate':
          return e.jsxs('div', {
            className: 'space-y-3 py-4',
            children: [
              e.jsx(V, { htmlFor: 'escalate-reason', children: s('confirmation.escalate.reason') }),
              e.jsx(we, {
                id: 'escalate-reason',
                value: R,
                onChange: (o) => m(o.target.value),
                placeholder: s('confirmation.escalate.reasonPlaceholder'),
                className: 'min-h-[80px]',
              }),
            ],
          })
        case 'delete':
          return e.jsxs('div', {
            className: 'flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-md mt-4',
            children: [
              e.jsx(ue, { className: 'h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5' }),
              e.jsxs('div', {
                className: 'space-y-1',
                children: [
                  e.jsx('p', {
                    className: 'text-sm text-red-800 dark:text-red-200',
                    children: s('confirmation.delete.warning'),
                  }),
                  e.jsx('p', {
                    className: 'text-xs text-red-600 dark:text-red-400',
                    children: s('confirmation.delete.permanentWarning'),
                  }),
                ],
              }),
            ],
          })
        case 'archive':
          return e.jsx('div', {
            className: 'p-3 bg-blue-50 dark:bg-blue-950 rounded-md mt-4',
            children: e.jsx('p', {
              className: 'text-sm text-blue-800 dark:text-blue-200',
              children: s('confirmation.archive.note'),
            }),
          })
        default:
          return null
      }
    }
  return e.jsx(Pe, {
    open: c,
    onOpenChange: (o) => !o && p(),
    children: e.jsxs(_e, {
      className: T('max-w-md w-[calc(100%-2rem)] sm:w-full', 'mx-4 sm:mx-auto'),
      dir: D ? 'rtl' : 'ltr',
      children: [
        e.jsxs(Ee, {
          children: [
            e.jsx(Be, {
              children: s(`confirmation.${a.id.replace(/-/g, '')}.title`, {
                defaultValue: s('confirmation.title', { action: I }),
              }),
            }),
            e.jsx(Ke, {
              children: s(`confirmation.${a.id.replace(/-/g, '')}.description`, {
                count: f,
                defaultValue: s('confirmation.description', {
                  action: I.toLowerCase(),
                  count: f,
                  entityType: v,
                }),
              }),
            }),
          ],
        }),
        _(),
        a.supportsUndo &&
          !a.isDestructive &&
          e.jsx('p', {
            className: 'text-xs text-muted-foreground mt-2',
            children: s('confirmation.undoAvailable', { seconds: P }),
          }),
        e.jsxs(ze, {
          className: 'flex-col-reverse gap-2 sm:flex-row sm:gap-0',
          children: [
            e.jsx(Fe, {
              onClick: p,
              disabled: h,
              className: 'mt-0',
              children: s('confirmation.cancel'),
            }),
            e.jsx(qe, {
              onClick: L,
              disabled: h,
              className: T(a.isDestructive && 'bg-red-600 hover:bg-red-700 focus:ring-red-600'),
              children: h
                ? e.jsxs(e.Fragment, {
                    children: [
                      e.jsx(J, { className: 'h-4 w-4 me-2 animate-spin' }),
                      s('confirmation.processing'),
                    ],
                  })
                : s('confirmation.confirm'),
            }),
          ],
        }),
      ],
    }),
  })
}
const Ye = {
    idle: null,
    pending: e.jsx(J, { className: 'h-5 w-5 animate-spin text-blue-600' }),
    processing: e.jsx(J, { className: 'h-5 w-5 animate-spin text-blue-600' }),
    completed: e.jsx(Oe, { className: 'h-5 w-5 text-green-600' }),
    failed: e.jsx(Le, { className: 'h-5 w-5 text-red-600' }),
    cancelled: e.jsx($e, { className: 'h-5 w-5 text-orange-600' }),
  },
  Ge = {
    idle: 'bg-gray-200',
    pending: 'bg-blue-600',
    processing: 'bg-blue-600',
    completed: 'bg-green-600',
    failed: 'bg-red-600',
    cancelled: 'bg-orange-600',
  }
function Ze({
  status: c,
  progress: a,
  processedCount: f,
  totalCount: i,
  actionType: j,
  entityType: p,
  onCancel: h,
  className: r,
}) {
  const { t: s, i18n: l } = z('bulk-actions'),
    D = l.language === 'ar'
  if (c === 'idle') return null
  const b = c === 'processing' || c === 'pending',
    S = s(i === 1 ? `entityTypes.${p}` : `entityTypes.${p}_plural`),
    u = j ? s(`actions.${j.replace(/-/g, '')}`) : ''
  return e.jsxs('div', {
    className: T('p-4 bg-white dark:bg-gray-900 rounded-lg border shadow-sm', 'space-y-3', r),
    dir: D ? 'rtl' : 'ltr',
    role: 'progressbar',
    'aria-valuenow': a,
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    'aria-label': s('accessibility.progressBar', { progress: a }),
    children: [
      e.jsxs('div', {
        className: 'flex items-center justify-between',
        children: [
          e.jsxs('div', {
            className: 'flex items-center gap-3',
            children: [
              Ye[c],
              e.jsxs('div', {
                children: [
                  e.jsx('h4', {
                    className: 'text-sm font-medium text-gray-900 dark:text-gray-100',
                    children: s(b ? 'progress.title' : `progress.${c}`),
                  }),
                  e.jsxs('p', {
                    className: 'text-xs text-muted-foreground',
                    children: [u, ' ', S],
                  }),
                ],
              }),
            ],
          }),
          b &&
            h &&
            e.jsx(K, {
              variant: 'ghost',
              size: 'sm',
              onClick: h,
              className: 'h-8 px-3 text-xs',
              children: s('progress.cancel'),
            }),
        ],
      }),
      e.jsxs('div', {
        className: 'space-y-1',
        children: [
          e.jsx(Ne, { value: a, className: T('h-2', Ge[c]) }),
          e.jsxs('div', {
            className: 'flex justify-between text-xs text-muted-foreground',
            children: [
              e.jsx('span', { children: s('progress.processing', { current: f, total: i }) }),
              e.jsxs('span', { children: [a, '%'] }),
            ],
          }),
        ],
      }),
      b &&
        e.jsx('p', {
          className: 'text-xs text-muted-foreground',
          children: s('progress.pleaseWait'),
        }),
    ],
  })
}
function es({
  data: c,
  columns: a,
  selection: f,
  onToggleSelection: i,
  onSelectAll: j,
  onClearSelection: p,
  onSelectRange: h,
  idField: r = 'id',
  selectionDisabled: s = !1,
  onRowClick: l,
  rowClassName: D,
  emptyMessage: b,
  className: S,
}) {
  const { t: u, i18n: g } = z('bulk-actions'),
    A = g.language === 'ar',
    y = t.useRef(null),
    { selectedIds: R, selectedCount: m, allSelected: v, partiallySelected: I, maxReached: P } = f,
    L = t.useMemo(() => c.map((x) => String(x[r])), [c, r]),
    _ = t.useCallback(() => {
      v ? p() : j(L)
    }, [v, L, j, p]),
    o = t.useCallback(
      (x, N) => {
        ;(x.shiftKey && y.current && h ? h(y.current, N, L) : i(N), (y.current = N))
      },
      [L, i, h],
    ),
    F = t.useCallback(
      (x, N) => {
        x.target.closest('[role="checkbox"]') || l?.(N)
      },
      [l],
    ),
    E = (x, N) =>
      N.cell
        ? N.cell(x)
        : typeof N.accessor == 'function'
          ? N.accessor(x)
          : String(x[N.accessor] ?? '')
  return e.jsxs('div', {
    className: T('w-full overflow-auto', S),
    dir: A ? 'rtl' : 'ltr',
    children: [
      e.jsxs(ke, {
        children: [
          e.jsx(Se, {
            children: e.jsxs(se, {
              children: [
                e.jsx(ne, {
                  className: 'w-12',
                  children: e.jsx('div', {
                    className: 'flex items-center justify-center',
                    children: e.jsx(re, {
                      checked: v ? !0 : I ? 'indeterminate' : !1,
                      onCheckedChange: _,
                      disabled: s || c.length === 0,
                      'aria-label': u('accessibility.selectAllCheckbox'),
                    }),
                  }),
                }),
                a.map((x) =>
                  e.jsx(
                    ne,
                    {
                      className: T(
                        x.width && `w-[${x.width}]`,
                        x.align === 'center' && 'text-center',
                        x.align === 'end' && 'text-end',
                      ),
                      children: u(x.headerKey, { defaultValue: x.headerKey }),
                    },
                    x.id,
                  ),
                ),
              ],
            }),
          }),
          e.jsx(ve, {
            children:
              c.length === 0
                ? e.jsx(se, {
                    children: e.jsx(te, {
                      colSpan: a.length + 1,
                      className: 'h-24 text-center text-muted-foreground',
                      children: b || u('errors.noSelection'),
                    }),
                  })
                : c.map((x) => {
                    const N = String(x[r]),
                      n = R.has(N),
                      B = n || !P
                    return e.jsxs(
                      se,
                      {
                        onClick: ($) => F($, x),
                        className: T(
                          'cursor-pointer',
                          n && 'bg-blue-50 dark:bg-blue-950',
                          l && 'hover:bg-muted/50',
                          D?.(x, n),
                        ),
                        'data-selected': n,
                        children: [
                          e.jsx(te, {
                            className: 'w-12',
                            children: e.jsx('div', {
                              className: 'flex items-center justify-center',
                              children: e.jsx(re, {
                                checked: n,
                                onClick: ($) => o($, N),
                                disabled: s || (!n && !B),
                                'aria-label': u('accessibility.selectionCheckbox', {
                                  name: x.name || N,
                                }),
                              }),
                            }),
                          }),
                          a.map(($) =>
                            e.jsx(
                              te,
                              {
                                className: T(
                                  $.align === 'center' && 'text-center',
                                  $.align === 'end' && 'text-end',
                                ),
                                children: E(x, $),
                              },
                              $.id,
                            ),
                          ),
                        ],
                      },
                      N,
                    )
                  }),
          }),
        ],
      }),
      m > 0 &&
        e.jsxs('div', {
          className: 'flex items-center justify-between p-3 border-t bg-muted/30 text-sm',
          children: [
            e.jsxs('span', {
              className: 'text-muted-foreground',
              children: [u('selection.selected', { count: m }), ' / ', c.length],
            }),
            P &&
              e.jsx('span', {
                className: 'text-xs text-orange-600 dark:text-orange-400',
                children: u('selection.maxReachedDescription', { max: xe }),
              }),
          ],
        }),
    ],
  })
}
function ss({
  visible: c,
  action: a,
  itemCount: f,
  undoTtl: i,
  onUndo: j,
  onDismiss: p,
  className: h,
}) {
  const { t: r, i18n: s } = z('bulk-actions'),
    l = s.language === 'ar',
    [D, b] = t.useState(i),
    [S, u] = t.useState(!1),
    g = (D / i) * 100,
    A = Math.ceil(D / 1e3)
  ;(t.useEffect(() => {
    if (!c) {
      b(i)
      return
    }
    const m = setInterval(() => {
      b((v) => {
        const I = v - 100
        return I <= 0 ? (clearInterval(m), p(), 0) : I
      })
    }, 100)
    return () => clearInterval(m)
  }, [c, i, p]),
    t.useEffect(() => {
      c && (b(i), u(!1))
    }, [c, i]))
  const y = t.useCallback(async () => {
      u(!0)
      try {
        await j()
      } finally {
        u(!1)
      }
    }, [j]),
    R = r(`actions.${a.replace(/-/g, '')}`)
  return c
    ? e.jsx('div', {
        className: T(
          'fixed bottom-4 start-4 end-4 sm:start-auto sm:end-4 sm:w-96',
          'z-50 animate-in slide-in-from-bottom-4 fade-in-0',
          h,
        ),
        dir: l ? 'rtl' : 'ltr',
        role: 'alert',
        'aria-live': 'polite',
        children: e.jsxs('div', {
          className:
            'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg shadow-lg overflow-hidden',
          children: [
            e.jsx('div', {
              className: 'h-1 bg-gray-700 dark:bg-gray-300',
              children: e.jsx('div', {
                className: 'h-full bg-blue-500 transition-all duration-100 ease-linear',
                style: { width: `${g}%`, transformOrigin: l ? 'right' : 'left' },
              }),
            }),
            e.jsxs('div', {
              className: 'flex items-center justify-between gap-3 p-3 sm:p-4',
              children: [
                e.jsxs('div', {
                  className: 'flex-1 min-w-0',
                  children: [
                    e.jsx('p', {
                      className: 'text-sm font-medium truncate',
                      children: r('undo.message', { action: R, count: f }),
                    }),
                    e.jsx('p', {
                      className: 'text-xs text-gray-400 dark:text-gray-600',
                      children: r('undo.timeRemaining', { seconds: A }),
                    }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'flex items-center gap-2 shrink-0',
                  children: [
                    e.jsx(K, {
                      variant: 'secondary',
                      size: 'sm',
                      onClick: y,
                      disabled: S,
                      className:
                        'h-8 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800',
                      children: S
                        ? e.jsxs(e.Fragment, {
                            children: [
                              e.jsx(J, { className: 'h-4 w-4 me-1 animate-spin' }),
                              r('undo.undoing'),
                            ],
                          })
                        : e.jsxs(e.Fragment, {
                            children: [e.jsx(me, { className: 'h-4 w-4 me-1' }), r('undo.undo')],
                          }),
                    }),
                    e.jsx(K, {
                      variant: 'ghost',
                      size: 'icon',
                      onClick: p,
                      disabled: S,
                      className:
                        'h-8 w-8 text-gray-400 hover:text-white dark:text-gray-600 dark:hover:text-gray-900',
                      'aria-label': r('accessibility.closeDialog'),
                      children: e.jsx(de, { className: 'h-4 w-4' }),
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      })
    : null
}
function ts(c) {
  const {
      maxSelection: a = xe,
      entityType: f,
      undoTtl: i = X,
      onActionComplete: j,
      onActionError: p,
      onUndo: h,
    } = c,
    [r, s] = t.useState(new Set()),
    [l, D] = t.useState([]),
    b = t.useRef(null),
    [S, u] = t.useState({
      status: 'idle',
      currentAction: null,
      progress: 0,
      processedCount: 0,
      totalCount: 0,
      lastResult: null,
      error: null,
    }),
    [g, A] = t.useState(null),
    y = t.useRef(null),
    [R, m] = t.useState(null),
    v = t.useRef(null),
    I = t.useRef(!1),
    P = t.useMemo(() => {
      const d = r.size,
        U = d >= a,
        k = d < a,
        M = l.length > 0 && l.every((w) => r.has(w)),
        C = l.some((w) => r.has(w)) && !M
      return {
        selectedIds: r,
        selectedCount: d,
        maxReached: U,
        canSelectMore: k,
        allSelected: M,
        partiallySelected: C,
      }
    }, [r, a, l]),
    L = t.useCallback((d) => r.has(d), [r]),
    _ = t.useCallback(
      (d) => {
        ;(s((U) => {
          const k = new Set(U)
          if (k.has(d)) k.delete(d)
          else if (k.size < a) k.add(d)
          else return (console.warn(`Maximum selection limit (${a}) reached`), U)
          return k
        }),
          (b.current = d))
      },
      [a],
    ),
    o = t.useCallback(
      (d) => {
        ;(D(d), s(new Set(d.slice(0, a))))
      },
      [a],
    ),
    F = t.useCallback(
      (d, U, k) => {
        const M = k.indexOf(d),
          C = k.indexOf(U)
        if (M === -1 || C === -1) return
        const w = Math.min(M, C),
          O = Math.max(M, C)
        s((q) => {
          const H = new Set(q)
          for (let W = w; W <= O && H.size < a; W++) H.add(k[W])
          return H
        })
      },
      [a],
    ),
    E = t.useCallback(() => {
      ;(s(new Set()), (b.current = null))
    }, []),
    x = t.useCallback(
      async (d, U) => {
        const k = Array.from(r),
          M = k.length
        if (M === 0)
          return {
            success: !1,
            successCount: 0,
            failedCount: 0,
            failedIds: [],
            message: 'No items selected',
          }
        ;((I.current = !1),
          u({
            status: 'processing',
            currentAction: d.id,
            progress: 0,
            processedCount: 0,
            totalCount: M,
            lastResult: null,
            error: null,
          }))
        try {
          let C
          if (
            (d.execute
              ? (C = await d.execute(
                  k.map((w) => ({ id: w })),
                  U,
                ))
              : (C = await as(d.id, k, (w) => {
                  if (I.current) return
                  const O = Math.round((w / M) * 100)
                  u((q) => ({ ...q, progress: O, processedCount: w }))
                })),
            I.current)
          ) {
            const w = {
              success: !1,
              successCount: 0,
              failedCount: M,
              failedIds: k,
              message: 'Action cancelled',
            }
            return (u((O) => ({ ...O, status: 'cancelled', lastResult: w })), w)
          }
          if (d.supportsUndo && C.success) {
            const w = {
              actionType: d.id,
              entityType: f,
              itemIds: k.filter((O) => !C.failedIds.includes(O)),
              timestamp: Date.now(),
              ttl: i,
            }
            ;(A(w),
              y.current && clearTimeout(y.current),
              (y.current = setTimeout(() => {
                A(null)
              }, i)))
          }
          return (
            u((w) => ({
              ...w,
              status: C.success ? 'completed' : 'failed',
              progress: 100,
              processedCount: M,
              lastResult: C,
              error: C.success ? null : C.message || 'Action failed',
            })),
            C.success && E(),
            j?.(C),
            C
          )
        } catch (C) {
          const w = C instanceof Error ? C.message : 'Unknown error',
            O = { success: !1, successCount: 0, failedCount: M, failedIds: k, message: w }
          return (
            u((q) => ({ ...q, status: 'failed', lastResult: O, error: w })),
            p?.(C instanceof Error ? C : new Error(w)),
            O
          )
        }
      },
      [r, f, i, j, p, E],
    ),
    N = t.useCallback(() => {
      ;((I.current = !0), u((d) => ({ ...d, status: 'cancelled' })))
    }, []),
    n = t.useCallback(() => {
      u({
        status: 'idle',
        currentAction: null,
        progress: 0,
        processedCount: 0,
        totalCount: 0,
        lastResult: null,
        error: null,
      })
    }, []),
    B = t.useCallback(async () => {
      if (!g || !h) return !1
      try {
        const d = await h(g)
        return (d && (A(null), y.current && clearTimeout(y.current)), d)
      } catch {
        return !1
      }
    }, [g, h]),
    $ = t.useCallback(() => {
      ;(A(null), y.current && clearTimeout(y.current))
    }, []),
    he = t.useCallback(
      (d, U) => {
        ;((v.current = { action: d, items: U }),
          m({
            open: !0,
            action: d,
            itemCount: U.length,
            entityType: f,
            onConfirm: () => {},
            onCancel: () => {},
          }))
      },
      [f],
    ),
    ge = t.useCallback(
      (d) => {
        const U = v.current
        U && (m(null), (v.current = null), x(U.action, d))
      },
      [x],
    ),
    pe = t.useCallback(() => {
      ;(m(null), (v.current = null))
    }, [])
  return (
    t.useEffect(
      () => () => {
        y.current && clearTimeout(y.current)
      },
      [],
    ),
    {
      selection: P,
      isSelected: L,
      toggleSelection: _,
      selectAll: o,
      selectRange: F,
      clearSelection: E,
      actionState: S,
      executeAction: x,
      cancelAction: N,
      resetActionState: n,
      canUndo: !!g && !!h,
      undoData: g,
      executeUndo: B,
      clearUndoData: $,
      pendingConfirmation: R,
      requestConfirmation: he,
      confirmAction: ge,
      cancelConfirmation: pe,
    }
  )
}
async function as(c, a, f) {
  const i = a.length,
    j = 10,
    p = 50
  let h = 0
  const r = []
  for (let s = 0; s < i; s += j)
    (await new Promise((l) => setTimeout(l, p)), (h = Math.min(s + j, i)), f(h))
  return {
    success: r.length === 0,
    successCount: i - r.length,
    failedCount: r.length,
    failedIds: r,
  }
}
function ns(c) {
  const a = ['pending', 'in_progress', 'completed', 'cancelled'],
    f = ['low', 'medium', 'high', 'urgent'],
    i = ['John Doe', 'Jane Smith', 'Ahmed Ali', 'Sarah Johnson']
  return Array.from({ length: c }, (j, p) => ({
    id: `item-${p + 1}`,
    name: `Item ${p + 1}`,
    status: a[Math.floor(Math.random() * a.length)],
    priority: f[Math.floor(Math.random() * f.length)],
    assignee: i[Math.floor(Math.random() * i.length)],
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1e3).toISOString(),
  }))
}
function rs() {
  const { t: c, i18n: a } = z('bulk-actions'),
    f = a.language === 'ar',
    [i] = t.useState(() => ns(25)),
    [j, p] = t.useState(!1),
    [h, r] = t.useState(null),
    s = t.useCallback(
      async (n) => (
        console.log('Undo requested:', n),
        await new Promise((B) => setTimeout(B, 1e3)),
        !0
      ),
      [],
    ),
    {
      selection: l,
      toggleSelection: D,
      selectAll: b,
      selectRange: S,
      clearSelection: u,
      actionState: g,
      executeAction: A,
      resetActionState: y,
      pendingConfirmation: R,
      requestConfirmation: m,
      confirmAction: v,
      cancelConfirmation: I,
      executeUndo: P,
      clearUndoData: L,
    } = ts({
      entityType: 'entity',
      undoTtl: X,
      onActionComplete: (n) => {
        ;(console.log('Action completed:', n),
          n.success && (r({ action: g.currentAction || 'action', count: n.successCount }), p(!0)))
      },
      onActionError: (n) => {
        console.error('Action error:', n)
      },
      onUndo: s,
    }),
    _ = t.useMemo(
      () => [
        { id: 'name', headerKey: 'Name', accessor: 'name', sortable: !0 },
        {
          id: 'status',
          headerKey: 'Status',
          accessor: 'status',
          cell: (n) =>
            e.jsx(le, {
              variant: 'secondary',
              className: T(
                n.status === 'completed' && 'bg-green-100 text-green-800',
                n.status === 'in_progress' && 'bg-blue-100 text-blue-800',
                n.status === 'pending' && 'bg-yellow-100 text-yellow-800',
                n.status === 'cancelled' && 'bg-gray-100 text-gray-800',
              ),
              children: c(`status.${n.status}`),
            }),
        },
        {
          id: 'priority',
          headerKey: 'Priority',
          accessor: 'priority',
          cell: (n) =>
            e.jsx(le, {
              variant: 'outline',
              className: T(
                n.priority === 'urgent' && 'border-red-500 text-red-600',
                n.priority === 'high' && 'border-orange-500 text-orange-600',
                n.priority === 'medium' && 'border-yellow-500 text-yellow-600',
                n.priority === 'low' && 'border-green-500 text-green-600',
              ),
              children: c(`priority.${n.priority}`),
            }),
        },
        { id: 'assignee', headerKey: 'Assignee', accessor: 'assignee' },
        {
          id: 'createdAt',
          headerKey: 'Created',
          accessor: (n) => new Date(n.createdAt).toLocaleDateString(),
        },
      ],
      [c],
    ),
    o = t.useCallback(
      (n) => {
        const B = i.filter(($) => l.selectedIds.has($.id))
        n.requiresConfirmation ? m(n, B) : A(n)
      },
      [i, l.selectedIds, m, A],
    ),
    F = t.useCallback(
      (n) => {
        v(n)
      },
      [v],
    ),
    E = t.useCallback(async () => {
      ;(await P(), p(!1))
    }, [P]),
    x = t.useCallback(() => {
      ;(p(!1), L())
    }, [L]),
    N = t.useMemo(() => i.map((n) => n.id), [i])
  return e.jsxs('div', {
    className: 'container mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6',
    dir: f ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className: 'space-y-2',
        children: [
          e.jsx('h1', { className: 'text-2xl font-bold sm:text-3xl', children: c('title') }),
          e.jsx('p', { className: 'text-muted-foreground', children: c('description') }),
        ],
      }),
      e.jsx(Ve, {
        selection: l,
        actions: Je,
        entityType: 'entity',
        actionState: g,
        onActionClick: o,
        onClearSelection: u,
        onSelectAll: () => b(N),
      }),
      g.status !== 'idle' &&
        e.jsx(Ze, {
          status: g.status,
          progress: g.progress,
          processedCount: g.processedCount,
          totalCount: g.totalCount,
          actionType: g.currentAction,
          entityType: 'entity',
          onCancel: y,
        }),
      e.jsx('div', {
        className: 'border rounded-lg overflow-hidden',
        children: e.jsx(es, {
          data: i,
          columns: _,
          selection: l,
          onToggleSelection: D,
          onSelectAll: b,
          onClearSelection: u,
          onSelectRange: S,
        }),
      }),
      e.jsx(Qe, {
        open: !!R,
        action: R?.action || null,
        itemCount: R?.itemCount || 0,
        entityType: 'entity',
        onConfirm: F,
        onCancel: I,
        isProcessing: g.status === 'processing',
      }),
      e.jsx(ss, {
        visible: j && !!h,
        action: h?.action || 'update-status',
        itemCount: h?.count || 0,
        undoTtl: X,
        onUndo: E,
        onDismiss: x,
      }),
    ],
  })
}
const fs = rs
export { fs as component }
//# sourceMappingURL=bulk-actions-demo-DUVlf5sx.js.map
