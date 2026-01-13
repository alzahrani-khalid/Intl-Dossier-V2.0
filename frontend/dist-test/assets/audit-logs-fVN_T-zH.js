import { r as g, u as P, j as e } from './react-vendor-Buoak6m3.js'
import {
  s as V,
  c as _,
  I as z,
  B as j,
  m as S,
  ah as I,
  ai as O,
  aj as U,
  q as Y,
  r as G,
  t as Q,
  v as X,
  w as L,
  J as ne,
  a0 as T,
  N as pe,
  O as je,
  P as J,
  Q as D,
  R as ge,
  U as k,
  D as be,
  x as fe,
  y as Ne,
  z as le,
  j as $,
  k as F,
  o as K,
  l as M,
} from './index-qYY0KoZ1.js'
import { C as _e, b as we } from './collapsible-BZnv9hxQ.js'
import { a as se } from './tanstack-vendor-BZC-rs5U.js'
import {
  aE as ve,
  aD as E,
  ba as W,
  aN as Z,
  b8 as ie,
  b6 as ae,
  ds as te,
  b9 as re,
  aR as oe,
  aK as ee,
  bd as ye,
  aT as Se,
  aO as Ce,
  bV as ke,
  cC as Te,
  aS as me,
  bP as De,
  cb as Ee,
  cJ as Le,
  bf as q,
  be as Pe,
  du as Ae,
  bw as Re,
  aL as ze,
  aM as Ie,
} from './vendor-misc-BiJvMP0A.js'
import { T as Oe, a as Ue, b as $e, c as Fe } from './tooltip-CE0dVuox.js'
import { U as Me, H as qe, I as ce } from './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
const B = () => 'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/audit-logs-viewer'
function Ve(s) {
  const [r, x] = g.useState({}),
    [o, i] = g.useState({ limit: 50, offset: 0 }),
    m = ['audit-logs', r, o],
    {
      data: n,
      isLoading: c,
      isFetching: u,
      error: f,
      refetch: w,
    } = se({
      queryKey: m,
      queryFn: async () => {
        const {
          data: { session: t },
        } = await V.auth.getSession()
        if (!t?.access_token) throw new Error('Not authenticated')
        const a = new URLSearchParams()
        ;(a.set('limit', o.limit.toString()),
          a.set('offset', o.offset.toString()),
          r.table_name && a.set('table_name', r.table_name),
          r.user_id && a.set('user_id', r.user_id),
          r.user_email && a.set('user_email', r.user_email),
          r.operation && a.set('operation', r.operation),
          r.date_from && a.set('date_from', r.date_from),
          r.date_to && a.set('date_to', r.date_to),
          r.ip_address && a.set('ip_address', r.ip_address),
          r.search && a.set('search', r.search),
          r.row_id && a.set('row_id', r.row_id),
          r.sort_by && a.set('sort_by', r.sort_by),
          r.sort_order && a.set('sort_order', r.sort_order))
        const p = await fetch(`${B()}?${a.toString()}`, {
          headers: {
            Authorization: `Bearer ${t.access_token}`,
            'Content-Type': 'application/json',
          },
        })
        if (!p.ok) {
          const d = await p.json()
          throw new Error(d.error || 'Failed to fetch audit logs')
        }
        return p.json()
      },
      staleTime: 30 * 1e3,
      refetchInterval: 60 * 1e3,
    }),
    h = g.useCallback((t) => {
      ;(x(t), i((a) => ({ ...a, offset: 0 })))
    }, []),
    b = g.useCallback(() => {
      ;(x({}), i((t) => ({ ...t, offset: 0 })))
    }, []),
    N = g.useCallback((t) => {
      i(t)
    }, []),
    l = g.useCallback(() => {
      i((t) => ({ ...t, offset: t.offset + t.limit }))
    }, []),
    y = g.useCallback(() => {
      i((t) => ({ ...t, offset: Math.max(0, t.offset - t.limit) }))
    }, [])
  return {
    logs: n?.data || [],
    isLoading: c,
    isFetchingNextPage: u && !c,
    error: f || null,
    total: n?.metadata?.total || 0,
    hasMore: n?.metadata?.has_more || !1,
    filters: r,
    pagination: o,
    setFilters: h,
    clearFilters: b,
    setPagination: N,
    nextPage: l,
    prevPage: y,
    refetch: w,
  }
}
function Be(s, r) {
  const {
    data: x,
    isLoading: o,
    error: i,
    refetch: m,
  } = se({
    queryKey: ['audit-log-statistics', s, r],
    queryFn: async () => {
      const {
        data: { session: n },
      } = await V.auth.getSession()
      if (!n?.access_token) throw new Error('Not authenticated')
      const c = new URLSearchParams()
      ;(s && c.set('date_from', s), r && c.set('date_to', r))
      const u = await fetch(`${B()}/statistics?${c.toString()}`, {
        headers: { Authorization: `Bearer ${n.access_token}`, 'Content-Type': 'application/json' },
      })
      if (!u.ok) {
        const f = await u.json()
        throw new Error(f.error || 'Failed to fetch statistics')
      }
      return u.json()
    },
    staleTime: 3e5,
  })
  return { statistics: x?.data || null, isLoading: o, error: i || null, refetch: m }
}
function He() {
  const [s, r] = g.useState(!1),
    [x, o] = g.useState(null)
  return {
    exportLogs: g.useCallback(async (m) => {
      ;(r(!0), o(null))
      try {
        const {
          data: { session: n },
        } = await V.auth.getSession()
        if (!n?.access_token) throw new Error('Not authenticated')
        const c = new URLSearchParams()
        if ((c.set('format', m.format), m.filters)) {
          const { filters: l } = m
          ;(l.table_name && c.set('table_name', l.table_name),
            l.user_id && c.set('user_id', l.user_id),
            l.user_email && c.set('user_email', l.user_email),
            l.operation && c.set('operation', l.operation),
            l.date_from && c.set('date_from', l.date_from),
            l.date_to && c.set('date_to', l.date_to),
            l.ip_address && c.set('ip_address', l.ip_address),
            l.search && c.set('search', l.search))
        }
        const u = await fetch(`${B()}/export?${c.toString()}`, {
          headers: { Authorization: `Bearer ${n.access_token}` },
        })
        if (!u.ok) throw new Error('Failed to export audit logs')
        const f = u.headers.get('Content-Disposition')
        let w = `audit_logs_${new Date().toISOString().split('T')[0]}.${m.format}`
        if (f) {
          const l = f.match(/filename="(.+)"/)
          l && (w = l[1])
        }
        const h = await u.blob(),
          b = window.URL.createObjectURL(h),
          N = document.createElement('a')
        ;((N.href = b),
          (N.download = w),
          document.body.appendChild(N),
          N.click(),
          window.URL.revokeObjectURL(b),
          document.body.removeChild(N))
      } catch (n) {
        throw (o(n instanceof Error ? n : new Error('Export failed')), n)
      } finally {
        r(!1)
      }
    }, []),
    isExporting: s,
    error: x,
  }
}
function Je(s) {
  const {
    data: r,
    isLoading: x,
    error: o,
  } = se({
    queryKey: ['audit-log-distinct', s],
    queryFn: async () => {
      const {
        data: { session: i },
      } = await V.auth.getSession()
      if (!i?.access_token) throw new Error('Not authenticated')
      const m = await fetch(`${B()}/distinct/${s}`, {
        headers: { Authorization: `Bearer ${i.access_token}`, 'Content-Type': 'application/json' },
      })
      if (!m.ok) {
        const n = await m.json()
        throw new Error(n.error || 'Failed to fetch distinct values')
      }
      return m.json()
    },
    staleTime: 6e5,
  })
  return { values: r?.data || [], isLoading: x, error: o || null }
}
const de = {
    INSERT: { icon: re, label_en: 'Created', label_ar: 'إنشاء', color: 'text-green-600' },
    UPDATE: { icon: te, label_en: 'Updated', label_ar: 'تحديث', color: 'text-blue-600' },
    DELETE: { icon: ae, label_en: 'Deleted', label_ar: 'حذف', color: 'text-red-600' },
  },
  Ke = [
    { value: 'today', label_en: 'Today', label_ar: 'اليوم' },
    { value: 'yesterday', label_en: 'Yesterday', label_ar: 'أمس' },
    { value: 'last_7_days', label_en: 'Last 7 days', label_ar: 'آخر 7 أيام' },
    { value: 'last_30_days', label_en: 'Last 30 days', label_ar: 'آخر 30 يوم' },
    { value: 'last_90_days', label_en: 'Last 90 days', label_ar: 'آخر 90 يوم' },
    { value: 'this_month', label_en: 'This month', label_ar: 'هذا الشهر' },
    { value: 'last_month', label_en: 'Last month', label_ar: 'الشهر الماضي' },
    { value: 'custom', label_en: 'Custom range', label_ar: 'نطاق مخصص' },
  ]
function Ye({ filters: s, onFiltersChange: r, onClearFilters: x, className: o }) {
  const { t: i, i18n: m } = P('audit-logs'),
    n = m.language === 'ar',
    [c, u] = g.useState(s.search || ''),
    [f, w] = g.useState('last_30_days'),
    [h, b] = g.useState(!1),
    { values: N } = Je('table_name'),
    l = g.useMemo(() => {
      let a = 0
      return (
        s.table_name && (a += 1),
        s.operation && (a += 1),
        (s.date_from || s.date_to) && (a += 1),
        s.user_email && (a += 1),
        s.ip_address && (a += 1),
        s.search && (a += 1),
        a
      )
    }, [s]),
    y = g.useCallback(
      (a) => {
        u(a)
        const p = setTimeout(() => {
          r({ ...s, search: a || void 0 })
        }, 500)
        return () => clearTimeout(p)
      },
      [s, r],
    ),
    t = g.useCallback(
      (a) => {
        if ((w(a), a === 'custom')) {
          b(!0)
          return
        }
        b(!1)
        const p = new Date()
        let d,
          v = new Date()
        switch (a) {
          case 'today':
            ;((d = new Date()), d.setHours(0, 0, 0, 0))
            break
          case 'yesterday':
            ;((d = new Date()),
              d.setDate(d.getDate() - 1),
              d.setHours(0, 0, 0, 0),
              (v = new Date(d)),
              v.setHours(23, 59, 59, 999))
            break
          case 'last_7_days':
            ;((d = new Date()), d.setDate(d.getDate() - 7))
            break
          case 'last_30_days':
            ;((d = new Date()), d.setDate(d.getDate() - 30))
            break
          case 'last_90_days':
            ;((d = new Date()), d.setDate(d.getDate() - 90))
            break
          case 'this_month':
            d = new Date(p.getFullYear(), p.getMonth(), 1)
            break
          case 'last_month':
            ;((d = new Date(p.getFullYear(), p.getMonth() - 1, 1)),
              (v = new Date(p.getFullYear(), p.getMonth(), 0)))
            break
        }
        r({ ...s, date_from: d?.toISOString(), date_to: v?.toISOString() })
      },
      [s, r],
    )
  return e.jsxs('div', {
    className: _('space-y-4', o),
    dir: n ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className: 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        children: [
          e.jsxs('div', {
            className: 'relative flex-1 max-w-sm',
            children: [
              e.jsx(ve, {
                className:
                  'absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground',
              }),
              e.jsx(z, {
                type: 'text',
                placeholder: i('filters.search_placeholder'),
                value: c,
                onChange: (a) => y(a.target.value),
                className: 'ps-10 pe-4 h-10',
              }),
              c &&
                e.jsx(j, {
                  variant: 'ghost',
                  size: 'sm',
                  className: 'absolute end-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0',
                  onClick: () => y(''),
                  children: e.jsx(E, { className: 'h-4 w-4' }),
                }),
            ],
          }),
          e.jsx('div', {
            className: 'flex items-center gap-2',
            children:
              l > 0 &&
              e.jsxs(j, {
                variant: 'ghost',
                size: 'sm',
                onClick: x,
                className: 'text-muted-foreground hover:text-foreground',
                children: [
                  e.jsx(E, { className: 'h-4 w-4 me-1' }),
                  i('filters.clear_all'),
                  e.jsx(S, { variant: 'secondary', className: 'ms-1', children: l }),
                ],
              }),
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'flex flex-wrap gap-2',
        children: [
          e.jsxs(I, {
            children: [
              e.jsx(O, {
                asChild: !0,
                children: e.jsxs(j, {
                  variant: 'outline',
                  size: 'sm',
                  className: 'h-9',
                  children: [
                    e.jsx(W, { className: 'h-4 w-4 me-2' }),
                    i('filters.table'),
                    s.table_name
                      ? e.jsx(S, { variant: 'secondary', className: 'ms-2', children: '1' })
                      : e.jsx(Z, { className: 'h-4 w-4 ms-2' }),
                  ],
                }),
              }),
              e.jsx(U, {
                className: 'w-64 p-3',
                align: 'start',
                children: e.jsx('div', {
                  className: 'space-y-2',
                  children: e.jsxs(Y, {
                    value: s.table_name || 'all',
                    onValueChange: (a) => r({ ...s, table_name: a === 'all' ? void 0 : a }),
                    children: [
                      e.jsx(G, {
                        className: 'w-full',
                        children: e.jsx(Q, { placeholder: i('filters.table') }),
                      }),
                      e.jsxs(X, {
                        children: [
                          e.jsx(L, { value: 'all', children: i('operations.all') }),
                          N.map((a) => e.jsx(L, { value: a, children: i(`tables.${a}`, a) }, a)),
                        ],
                      }),
                    ],
                  }),
                }),
              }),
            ],
          }),
          e.jsxs(I, {
            children: [
              e.jsx(O, {
                asChild: !0,
                children: e.jsxs(j, {
                  variant: 'outline',
                  size: 'sm',
                  className: 'h-9',
                  children: [
                    e.jsx(ie, { className: 'h-4 w-4 me-2' }),
                    i('filters.operation'),
                    s.operation
                      ? e.jsx(S, { variant: 'secondary', className: 'ms-2', children: '1' })
                      : e.jsx(Z, { className: 'h-4 w-4 ms-2' }),
                  ],
                }),
              }),
              e.jsx(U, {
                className: 'w-56 p-3',
                align: 'start',
                children: e.jsxs('div', {
                  className: 'space-y-2',
                  children: [
                    e.jsx(j, {
                      variant: s.operation ? 'ghost' : 'secondary',
                      size: 'sm',
                      className: 'w-full justify-start',
                      onClick: () => r({ ...s, operation: void 0 }),
                      children: i('operations.all'),
                    }),
                    Object.keys(de).map((a) => {
                      const p = de[a],
                        d = p.icon,
                        v = s.operation === a
                      return e.jsxs(
                        j,
                        {
                          variant: v ? 'secondary' : 'ghost',
                          size: 'sm',
                          className: 'w-full justify-start',
                          onClick: () => r({ ...s, operation: a }),
                          children: [
                            e.jsx(d, { className: _('h-4 w-4 me-2', p.color) }),
                            n ? p.label_ar : p.label_en,
                          ],
                        },
                        a,
                      )
                    }),
                  ],
                }),
              }),
            ],
          }),
          e.jsxs(I, {
            children: [
              e.jsx(O, {
                asChild: !0,
                children: e.jsxs(j, {
                  variant: 'outline',
                  size: 'sm',
                  className: 'h-9',
                  children: [
                    e.jsx(oe, { className: 'h-4 w-4 me-2' }),
                    i('filters.date_range'),
                    (s.date_from || s.date_to) &&
                      e.jsx(S, { variant: 'secondary', className: 'ms-2', children: '1' }),
                  ],
                }),
              }),
              e.jsx(U, {
                className: 'w-64 p-3',
                align: 'start',
                children: e.jsxs('div', {
                  className: 'space-y-3',
                  children: [
                    e.jsxs(Y, {
                      value: f,
                      onValueChange: (a) => t(a),
                      children: [
                        e.jsx(G, {
                          className: 'w-full',
                          children: e.jsx(Q, { placeholder: i('filters.date_range') }),
                        }),
                        e.jsx(X, {
                          children: Ke.map((a) =>
                            e.jsx(
                              L,
                              { value: a.value, children: n ? a.label_ar : a.label_en },
                              a.value,
                            ),
                          ),
                        }),
                      ],
                    }),
                    h &&
                      e.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          e.jsxs('div', {
                            children: [
                              e.jsx(ne, { className: 'text-xs', children: n ? 'من' : 'From' }),
                              e.jsx(z, {
                                type: 'date',
                                value: s.date_from ? s.date_from.split('T')[0] : '',
                                onChange: (a) =>
                                  r({
                                    ...s,
                                    date_from: a.target.value
                                      ? new Date(a.target.value).toISOString()
                                      : void 0,
                                  }),
                                className: 'h-9',
                              }),
                            ],
                          }),
                          e.jsxs('div', {
                            children: [
                              e.jsx(ne, { className: 'text-xs', children: n ? 'إلى' : 'To' }),
                              e.jsx(z, {
                                type: 'date',
                                value: s.date_to ? s.date_to.split('T')[0] : '',
                                onChange: (a) =>
                                  r({
                                    ...s,
                                    date_to: a.target.value
                                      ? new Date(a.target.value).toISOString()
                                      : void 0,
                                  }),
                                className: 'h-9',
                              }),
                            ],
                          }),
                        ],
                      }),
                    (s.date_from || s.date_to) &&
                      e.jsx(j, {
                        variant: 'ghost',
                        size: 'sm',
                        className: 'w-full',
                        onClick: () => r({ ...s, date_from: void 0, date_to: void 0 }),
                        children: n ? 'مسح التاريخ' : 'Clear dates',
                      }),
                  ],
                }),
              }),
            ],
          }),
          e.jsxs(I, {
            children: [
              e.jsx(O, {
                asChild: !0,
                children: e.jsxs(j, {
                  variant: 'outline',
                  size: 'sm',
                  className: 'h-9',
                  children: [
                    e.jsx(ee, { className: 'h-4 w-4 me-2' }),
                    i('filters.ip_address'),
                    s.ip_address &&
                      e.jsx(S, { variant: 'secondary', className: 'ms-2', children: '1' }),
                  ],
                }),
              }),
              e.jsx(U, {
                className: 'w-64 p-3',
                align: 'start',
                children: e.jsxs('div', {
                  className: 'space-y-2',
                  children: [
                    e.jsx(z, {
                      placeholder: i('filters.ip_address'),
                      value: s.ip_address || '',
                      onChange: (a) => r({ ...s, ip_address: a.target.value || void 0 }),
                      className: 'h-9',
                    }),
                    s.ip_address &&
                      e.jsx(j, {
                        variant: 'ghost',
                        size: 'sm',
                        className: 'w-full',
                        onClick: () => r({ ...s, ip_address: void 0 }),
                        children: n ? 'مسح' : 'Clear',
                      }),
                  ],
                }),
              }),
            ],
          }),
        ],
      }),
      l > 0 &&
        e.jsxs('div', {
          className: 'flex flex-wrap gap-2 pt-2 border-t',
          children: [
            s.table_name &&
              e.jsxs(S, {
                variant: 'secondary',
                className: 'gap-1 px-2 py-1',
                children: [
                  e.jsx(W, { className: 'h-3 w-3' }),
                  i(`tables.${s.table_name}`, s.table_name),
                  e.jsx(j, {
                    variant: 'ghost',
                    size: 'sm',
                    className: 'h-4 w-4 p-0 ms-1 hover:bg-transparent',
                    onClick: () => r({ ...s, table_name: void 0 }),
                    children: e.jsx(E, { className: 'h-3 w-3' }),
                  }),
                ],
              }),
            s.operation &&
              e.jsxs(S, {
                variant: 'secondary',
                className: 'gap-1 px-2 py-1',
                children: [
                  e.jsx(ie, { className: 'h-3 w-3' }),
                  i(`operations.${s.operation}`),
                  e.jsx(j, {
                    variant: 'ghost',
                    size: 'sm',
                    className: 'h-4 w-4 p-0 ms-1 hover:bg-transparent',
                    onClick: () => r({ ...s, operation: void 0 }),
                    children: e.jsx(E, { className: 'h-3 w-3' }),
                  }),
                ],
              }),
            (s.date_from || s.date_to) &&
              e.jsxs(S, {
                variant: 'secondary',
                className: 'gap-1 px-2 py-1',
                children: [
                  e.jsx(oe, { className: 'h-3 w-3' }),
                  s.date_from && new Date(s.date_from).toLocaleDateString(n ? 'ar-SA' : 'en-US'),
                  s.date_to &&
                    ` - ${new Date(s.date_to).toLocaleDateString(n ? 'ar-SA' : 'en-US')}`,
                  e.jsx(j, {
                    variant: 'ghost',
                    size: 'sm',
                    className: 'h-4 w-4 p-0 ms-1 hover:bg-transparent',
                    onClick: () => r({ ...s, date_from: void 0, date_to: void 0 }),
                    children: e.jsx(E, { className: 'h-3 w-3' }),
                  }),
                ],
              }),
            s.ip_address &&
              e.jsxs(S, {
                variant: 'secondary',
                className: 'gap-1 px-2 py-1',
                children: [
                  e.jsx(ee, { className: 'h-3 w-3' }),
                  s.ip_address,
                  e.jsx(j, {
                    variant: 'ghost',
                    size: 'sm',
                    className: 'h-4 w-4 p-0 ms-1 hover:bg-transparent',
                    onClick: () => r({ ...s, ip_address: void 0 }),
                    children: e.jsx(E, { className: 'h-3 w-3' }),
                  }),
                ],
              }),
          ],
        }),
    ],
  })
}
const Ge = {
  INSERT: { icon: re, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  UPDATE: { icon: te, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  DELETE: { icon: ae, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
}
function Qe({
  logs: s,
  isLoading: r,
  filters: x,
  onFiltersChange: o,
  onLogClick: i,
  className: m,
}) {
  const { t: n, i18n: c } = P('audit-logs'),
    u = c.language === 'ar',
    [f, w] = g.useState(new Set()),
    h = g.useCallback((t, a) => {
      ;(a.stopPropagation(),
        w((p) => {
          const d = new Set(p)
          return (d.has(t) ? d.delete(t) : d.add(t), d)
        }))
    }, []),
    b = g.useCallback(
      (t) => {
        const a = x.sort_by === t && x.sort_order === 'desc' ? 'asc' : 'desc'
        o({ ...x, sort_by: t, sort_order: a })
      },
      [x, o],
    ),
    N = (t) => {
      const a = new Date(t)
      return qe(a, 'PPpp', { locale: u ? ce : void 0 })
    },
    l = (t) => Me(new Date(t), { addSuffix: !0, locale: u ? ce : void 0 }),
    y = ({ column: t, children: a }) =>
      e.jsxs(j, {
        variant: 'ghost',
        size: 'sm',
        className: 'h-auto p-0 font-medium hover:bg-transparent',
        onClick: () => b(t),
        children: [
          a,
          e.jsx(Te, { className: _('ms-2 h-4 w-4', x.sort_by === t && 'text-primary') }),
        ],
      })
  return r
    ? e.jsx('div', {
        className: _('space-y-2', m),
        children: Array.from({ length: 10 }).map((t, a) =>
          e.jsxs(
            'div',
            {
              className: 'flex items-center gap-4 p-4 border rounded-lg',
              children: [
                e.jsx(T, { className: 'h-8 w-8 rounded-full' }),
                e.jsxs('div', {
                  className: 'flex-1 space-y-2',
                  children: [
                    e.jsx(T, { className: 'h-4 w-1/4' }),
                    e.jsx(T, { className: 'h-3 w-1/2' }),
                  ],
                }),
                e.jsx(T, { className: 'h-6 w-20' }),
              ],
            },
            a,
          ),
        ),
      })
    : s.length === 0
      ? e.jsxs('div', {
          className: _('text-center py-12', m),
          children: [
            e.jsx(ye, { className: 'h-12 w-12 text-muted-foreground/50 mx-auto mb-4' }),
            e.jsx('h3', { className: 'text-lg font-medium mb-2', children: n('empty.title') }),
            e.jsx('p', {
              className: 'text-muted-foreground text-sm',
              children: n('empty.description'),
            }),
          ],
        })
      : e.jsx('div', {
          className: _('border rounded-lg overflow-hidden', m),
          children: e.jsxs(pe, {
            children: [
              e.jsx(je, {
                children: e.jsxs(J, {
                  children: [
                    e.jsx(D, {
                      className: 'w-[180px]',
                      children: e.jsx(y, { column: 'timestamp', children: n('columns.timestamp') }),
                    }),
                    e.jsx(D, {
                      className: 'w-[150px]',
                      children: e.jsx(y, { column: 'table_name', children: n('columns.table') }),
                    }),
                    e.jsx(D, {
                      className: 'w-[100px]',
                      children: e.jsx(y, { column: 'operation', children: n('columns.operation') }),
                    }),
                    e.jsx(D, {
                      className: 'w-[200px]',
                      children: e.jsx(y, { column: 'user_email', children: n('columns.user') }),
                    }),
                    e.jsx(D, {
                      className: 'hidden lg:table-cell w-[120px]',
                      children: n('columns.ip_address'),
                    }),
                    e.jsx(D, { children: n('columns.changes') }),
                    e.jsx(D, { className: 'w-[60px]' }),
                  ],
                }),
              }),
              e.jsx(ge, {
                children: s.map((t) => {
                  const a = f.has(t.id),
                    p = Ge[t.operation],
                    d = p.icon,
                    v = t.changed_fields && t.changed_fields.length > 0
                  return e.jsxs(e.Fragment, {
                    children: [
                      e.jsxs(
                        J,
                        {
                          className: _('cursor-pointer hover:bg-muted/50', a && 'bg-muted/30'),
                          onClick: () => i?.(t),
                          children: [
                            e.jsx(k, {
                              className: 'font-mono text-sm',
                              children: e.jsx(Oe, {
                                children: e.jsxs(Ue, {
                                  children: [
                                    e.jsx($e, {
                                      asChild: !0,
                                      children: e.jsx('span', { children: l(t.timestamp) }),
                                    }),
                                    e.jsx(Fe, {
                                      children: e.jsx('p', { children: N(t.timestamp) }),
                                    }),
                                  ],
                                }),
                              }),
                            }),
                            e.jsx(k, {
                              children: e.jsx(S, {
                                variant: 'outline',
                                className: 'font-mono text-xs',
                                children: n(`tables.${t.table_name}`, t.table_name),
                              }),
                            }),
                            e.jsx(k, {
                              children: e.jsxs(S, {
                                className: _('gap-1', p.bgColor, p.color, 'border-0'),
                                children: [
                                  e.jsx(d, { className: 'h-3 w-3' }),
                                  n(`operations.${t.operation}`),
                                ],
                              }),
                            }),
                            e.jsx(k, {
                              children: e.jsxs('div', {
                                className: 'flex items-center gap-2',
                                children: [
                                  e.jsx(Se, { className: 'h-4 w-4 text-muted-foreground' }),
                                  e.jsx('span', {
                                    className: 'text-sm truncate max-w-[150px]',
                                    children: t.user_email || 'System',
                                  }),
                                ],
                              }),
                            }),
                            e.jsx(k, {
                              className: 'hidden lg:table-cell',
                              children:
                                t.ip_address &&
                                e.jsxs('div', {
                                  className:
                                    'flex items-center gap-1 text-xs text-muted-foreground font-mono',
                                  children: [e.jsx(ee, { className: 'h-3 w-3' }), t.ip_address],
                                }),
                            }),
                            e.jsx(k, {
                              children: v
                                ? e.jsxs('span', {
                                    className: 'text-sm text-muted-foreground',
                                    children: [
                                      t.diff_summary || t.changed_fields?.slice(0, 3).join(', '),
                                      (t.changed_fields?.length || 0) > 3 &&
                                        e.jsxs('span', {
                                          className: 'text-xs ms-1',
                                          children: ['+', (t.changed_fields?.length || 0) - 3],
                                        }),
                                    ],
                                  })
                                : e.jsx('span', {
                                    className: 'text-sm text-muted-foreground italic',
                                    children: n('detail.no_changes'),
                                  }),
                            }),
                            e.jsx(k, {
                              children:
                                v &&
                                e.jsx(j, {
                                  variant: 'ghost',
                                  size: 'sm',
                                  className: 'h-8 w-8 p-0',
                                  onClick: (C) => h(t.id, C),
                                  children: a
                                    ? e.jsx(Ce, { className: 'h-4 w-4' })
                                    : e.jsx(Z, { className: 'h-4 w-4' }),
                                }),
                            }),
                          ],
                        },
                        t.id,
                      ),
                      a &&
                        v &&
                        e.jsx(
                          J,
                          {
                            children: e.jsx(k, {
                              colSpan: 7,
                              className: 'bg-muted/20 p-4',
                              children: e.jsxs('div', {
                                className: 'space-y-3',
                                children: [
                                  e.jsxs('div', {
                                    className: 'flex items-center justify-between',
                                    children: [
                                      e.jsx('h4', {
                                        className: 'font-medium text-sm',
                                        children: n('detail.changed_fields'),
                                      }),
                                      i &&
                                        e.jsxs(j, {
                                          variant: 'outline',
                                          size: 'sm',
                                          onClick: (C) => {
                                            ;(C.stopPropagation(), i(t))
                                          },
                                          children: [
                                            e.jsx(ke, { className: 'h-4 w-4 me-2' }),
                                            n('detail.view_related'),
                                          ],
                                        }),
                                    ],
                                  }),
                                  e.jsx('div', {
                                    className: 'grid gap-2 sm:grid-cols-2 lg:grid-cols-3',
                                    children: t.changed_fields?.map((C) => {
                                      const A = t.old_data?.[C],
                                        R = t.new_data?.[C]
                                      return e.jsxs(
                                        'div',
                                        {
                                          className: 'rounded-md bg-background p-3 border',
                                          children: [
                                            e.jsx('div', {
                                              className:
                                                'font-medium text-xs text-muted-foreground mb-2',
                                              children: C,
                                            }),
                                            t.operation === 'INSERT'
                                              ? e.jsx('div', {
                                                  className:
                                                    'bg-green-50 dark:bg-green-900/20 rounded px-2 py-1 text-sm text-green-800 dark:text-green-200 break-all',
                                                  children: JSON.stringify(R),
                                                })
                                              : t.operation === 'DELETE'
                                                ? e.jsx('div', {
                                                    className:
                                                      'bg-red-50 dark:bg-red-900/20 rounded px-2 py-1 text-sm text-red-800 dark:text-red-200 break-all',
                                                    children: JSON.stringify(A),
                                                  })
                                                : e.jsxs('div', {
                                                    className: 'space-y-1',
                                                    children: [
                                                      e.jsxs('div', {
                                                        className: 'flex items-start gap-2',
                                                        children: [
                                                          e.jsxs('span', {
                                                            className:
                                                              'text-xs text-muted-foreground min-w-[40px]',
                                                            children: [n('detail.old_value'), ':'],
                                                          }),
                                                          e.jsx('span', {
                                                            className:
                                                              'bg-red-50 dark:bg-red-900/20 rounded px-1.5 py-0.5 text-xs text-red-800 dark:text-red-200 break-all',
                                                            children: JSON.stringify(A),
                                                          }),
                                                        ],
                                                      }),
                                                      e.jsxs('div', {
                                                        className: 'flex items-start gap-2',
                                                        children: [
                                                          e.jsxs('span', {
                                                            className:
                                                              'text-xs text-muted-foreground min-w-[40px]',
                                                            children: [n('detail.new_value'), ':'],
                                                          }),
                                                          e.jsx('span', {
                                                            className:
                                                              'bg-green-50 dark:bg-green-900/20 rounded px-1.5 py-0.5 text-xs text-green-800 dark:text-green-200 break-all',
                                                            children: JSON.stringify(R),
                                                          }),
                                                        ],
                                                      }),
                                                    ],
                                                  }),
                                          ],
                                        },
                                        C,
                                      )
                                    }),
                                  }),
                                  e.jsxs('div', {
                                    className:
                                      'flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t',
                                    children: [
                                      t.session_id &&
                                        e.jsxs('span', {
                                          children: [
                                            n('detail.session_id'),
                                            ': ',
                                            t.session_id.slice(0, 8),
                                            '...',
                                          ],
                                        }),
                                      t.request_id &&
                                        e.jsxs('span', {
                                          children: [
                                            n('detail.request_id'),
                                            ': ',
                                            t.request_id.slice(0, 8),
                                            '...',
                                          ],
                                        }),
                                      e.jsxs('span', {
                                        children: [
                                          n('detail.record_id'),
                                          ': ',
                                          t.row_id.slice(0, 8),
                                          '...',
                                        ],
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            }),
                          },
                          `${t.id}-expanded`,
                        ),
                    ],
                  })
                }),
              }),
            ],
          }),
        })
}
function Xe({ filters: s, disabled: r = !1, className: x }) {
  const { t: o, i18n: i } = P('audit-logs'),
    m = i.language === 'ar',
    { exportLogs: n, isExporting: c } = He(),
    u = async (f) => {
      await n({ format: f, filters: s })
    }
  return e.jsxs(be, {
    children: [
      e.jsx(fe, {
        asChild: !0,
        children: e.jsxs(j, {
          variant: 'outline',
          size: 'sm',
          disabled: r || c,
          className: _('gap-2', x),
          children: [
            c
              ? e.jsx(me, { className: 'h-4 w-4 animate-spin' })
              : e.jsx(De, { className: 'h-4 w-4' }),
            o(c ? 'export.exporting' : 'export.button'),
          ],
        }),
      }),
      e.jsxs(Ne, {
        align: m ? 'start' : 'end',
        children: [
          e.jsxs(le, {
            onClick: () => u('csv'),
            disabled: c,
            children: [e.jsx(Ee, { className: 'h-4 w-4 me-2' }), o('export.csv')],
          }),
          e.jsxs(le, {
            onClick: () => u('json'),
            disabled: c,
            children: [e.jsx(Le, { className: 'h-4 w-4 me-2' }), o('export.json')],
          }),
        ],
      }),
    ],
  })
}
const We = { INSERT: re, UPDATE: te, DELETE: ae },
  Ze = {
    INSERT: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    UPDATE: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    DELETE: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  }
function es({ dateFrom: s, dateTo: r, className: x }) {
  const { t: o, i18n: i } = P('audit-logs'),
    m = i.language === 'ar',
    { statistics: n, isLoading: c, error: u } = Be(s, r)
  if (c)
    return e.jsxs($, {
      className: _('', x),
      children: [
        e.jsx(F, {
          className: 'pb-3',
          children: e.jsxs(K, {
            className: 'flex items-center gap-2 text-lg',
            children: [e.jsx(q, { className: 'h-5 w-5' }), o('statistics.title')],
          }),
        }),
        e.jsx(M, {
          children: e.jsxs('div', {
            className: 'space-y-4',
            children: [
              e.jsx(T, { className: 'h-20 w-full' }),
              e.jsxs('div', {
                className: 'grid grid-cols-3 gap-4',
                children: [
                  e.jsx(T, { className: 'h-16' }),
                  e.jsx(T, { className: 'h-16' }),
                  e.jsx(T, { className: 'h-16' }),
                ],
              }),
            ],
          }),
        }),
      ],
    })
  if (u || !n)
    return e.jsxs($, {
      className: _('', x),
      children: [
        e.jsx(F, {
          className: 'pb-3',
          children: e.jsxs(K, {
            className: 'flex items-center gap-2 text-lg',
            children: [e.jsx(q, { className: 'h-5 w-5' }), o('statistics.title')],
          }),
        }),
        e.jsx(M, {
          children: e.jsx('p', {
            className: 'text-sm text-muted-foreground text-center py-4',
            children: o('statistics.no_data'),
          }),
        }),
      ],
    })
  const f = n.by_table ? [...n.by_table].sort((h, b) => b.count - h.count).slice(0, 5) : [],
    w = f.length > 0 ? f[0].count : 1
  return e.jsxs($, {
    className: _('', x),
    dir: m ? 'rtl' : 'ltr',
    children: [
      e.jsxs(F, {
        className: 'pb-3',
        children: [
          e.jsxs(K, {
            className: 'flex items-center gap-2 text-lg',
            children: [e.jsx(q, { className: 'h-5 w-5' }), o('statistics.title')],
          }),
          e.jsxs('p', {
            className: 'text-sm text-muted-foreground',
            children: [
              o('statistics.period'),
              ': ',
              new Date(n.period.from).toLocaleDateString(m ? 'ar-SA' : 'en-US'),
              ' - ',
              new Date(n.period.to).toLocaleDateString(m ? 'ar-SA' : 'en-US'),
            ],
          }),
        ],
      }),
      e.jsxs(M, {
        className: 'space-y-6',
        children: [
          e.jsxs('div', {
            className: 'text-center p-4 bg-muted/50 rounded-lg',
            children: [
              e.jsx('div', {
                className: 'text-3xl font-bold text-primary',
                children: n.total_events.toLocaleString(m ? 'ar-SA' : 'en-US'),
              }),
              e.jsx('div', {
                className: 'text-sm text-muted-foreground',
                children: o('statistics.total_events'),
              }),
            ],
          }),
          e.jsxs('div', {
            children: [
              e.jsx('h4', {
                className: 'text-sm font-medium mb-3',
                children: o('statistics.by_operation'),
              }),
              e.jsx('div', {
                className: 'grid grid-cols-3 gap-3',
                children: n.by_operation.map((h) => {
                  const b = We[h.operation] || W,
                    N = Ze[h.operation] || 'text-gray-600 bg-gray-100'
                  return e.jsxs(
                    'div',
                    {
                      className: _('flex flex-col items-center p-3 rounded-lg', N),
                      children: [
                        e.jsx(b, { className: 'h-5 w-5 mb-1' }),
                        e.jsx('div', {
                          className: 'text-lg font-bold',
                          children: h.count.toLocaleString(m ? 'ar-SA' : 'en-US'),
                        }),
                        e.jsx('div', {
                          className: 'text-xs',
                          children: o(`operations.${h.operation}`, h.operation),
                        }),
                      ],
                    },
                    h.operation,
                  )
                }),
              }),
            ],
          }),
          f.length > 0 &&
            e.jsxs('div', {
              children: [
                e.jsx('h4', {
                  className: 'text-sm font-medium mb-3',
                  children: o('statistics.by_table'),
                }),
                e.jsx('div', {
                  className: 'space-y-2',
                  children: f.map((h, b) =>
                    e.jsxs(
                      'div',
                      {
                        className: 'flex items-center gap-2',
                        children: [
                          e.jsx(S, {
                            variant: 'outline',
                            className: 'min-w-[100px] justify-center font-mono text-xs',
                            children: o(`tables.${h.table}`, h.table),
                          }),
                          e.jsx('div', {
                            className: 'flex-1 h-6 bg-muted rounded-full overflow-hidden',
                            children: e.jsx('div', {
                              className: _(
                                'h-full rounded-full transition-all',
                                b === 0 && 'bg-primary',
                                b === 1 && 'bg-primary/80',
                                b === 2 && 'bg-primary/60',
                                b === 3 && 'bg-primary/40',
                                b === 4 && 'bg-primary/20',
                              ),
                              style: { width: `${(h.count / w) * 100}%` },
                            }),
                          }),
                          e.jsx('span', {
                            className: 'text-sm font-mono min-w-[60px] text-end',
                            children: h.count.toLocaleString(m ? 'ar-SA' : 'en-US'),
                          }),
                        ],
                      },
                      h.table,
                    ),
                  ),
                }),
              ],
            }),
        ],
      }),
    ],
  })
}
function ss() {
  const { t: s, i18n: r } = P('audit-logs'),
    x = r.language === 'ar',
    [o, i] = g.useState(!1),
    [m, n] = g.useState(null),
    {
      logs: c,
      isLoading: u,
      isFetchingNextPage: f,
      error: w,
      total: h,
      hasMore: b,
      filters: N,
      pagination: l,
      setFilters: y,
      clearFilters: t,
      setPagination: a,
      nextPage: p,
      prevPage: d,
      refetch: v,
    } = Ve(),
    C = g.useCallback((H) => {
      n(H)
    }, []),
    A = g.useCallback(
      (H) => {
        a({ ...l, limit: parseInt(H), offset: 0 })
      },
      [l, a],
    ),
    R = Math.floor(l.offset / l.limit) + 1,
    xe = Math.ceil(h / l.limit),
    he = l.offset + 1,
    ue = Math.min(l.offset + l.limit, h)
  return e.jsxs('div', {
    className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6',
    dir: x ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className: 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        children: [
          e.jsxs('div', {
            className: 'flex items-center gap-3',
            children: [
              e.jsx('div', {
                className: 'flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10',
                children: e.jsx(Pe, { className: 'h-5 w-5 text-primary' }),
              }),
              e.jsxs('div', {
                children: [
                  e.jsx('h1', { className: 'text-xl sm:text-2xl font-bold', children: s('title') }),
                  e.jsx('p', {
                    className: 'text-sm text-muted-foreground',
                    children: s('description'),
                  }),
                ],
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'flex items-center gap-2',
            children: [
              e.jsxs(j, {
                variant: 'outline',
                size: 'sm',
                onClick: () => i(!o),
                className: 'gap-2',
                children: [
                  e.jsx(q, { className: 'h-4 w-4' }),
                  e.jsx('span', { className: 'hidden sm:inline', children: s('statistics.title') }),
                ],
              }),
              e.jsx(Xe, { filters: N, disabled: u || c.length === 0 }),
              e.jsx(j, {
                variant: 'outline',
                size: 'sm',
                onClick: () => v(),
                disabled: u,
                children: u
                  ? e.jsx(me, { className: 'h-4 w-4 animate-spin' })
                  : e.jsx(Ae, { className: 'h-4 w-4' }),
              }),
            ],
          }),
        ],
      }),
      e.jsx(_e, {
        open: o,
        onOpenChange: i,
        children: e.jsx(we, {
          children: e.jsx(es, { dateFrom: N.date_from, dateTo: N.date_to, className: 'mb-6' }),
        }),
      }),
      e.jsxs($, {
        children: [
          e.jsx(F, {
            className: 'pb-4',
            children: e.jsx('div', {
              className: 'flex flex-col gap-4',
              children: e.jsx(Ye, { filters: N, onFiltersChange: y, onClearFilters: t }),
            }),
          }),
          e.jsxs(M, {
            className: 'pt-0',
            children: [
              w &&
                e.jsxs('div', {
                  className: 'flex flex-col items-center justify-center py-12 text-center',
                  children: [
                    e.jsx(Re, { className: 'h-12 w-12 text-destructive mb-4' }),
                    e.jsx('h3', {
                      className: 'text-lg font-medium mb-2',
                      children: s('error.title'),
                    }),
                    e.jsx('p', {
                      className: 'text-sm text-muted-foreground mb-4',
                      children: w.message || s('error.description'),
                    }),
                    e.jsx(j, {
                      variant: 'outline',
                      onClick: () => v(),
                      children: s('error.retry'),
                    }),
                  ],
                }),
              !w &&
                e.jsxs(e.Fragment, {
                  children: [
                    e.jsx(Qe, {
                      logs: c,
                      isLoading: u,
                      filters: N,
                      onFiltersChange: y,
                      onLogClick: C,
                    }),
                    !u &&
                      c.length > 0 &&
                      e.jsxs('div', {
                        className:
                          'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t',
                        children: [
                          e.jsx('div', {
                            className: 'text-sm text-muted-foreground',
                            children: s('pagination.showing', { from: he, to: ue, total: h }),
                          }),
                          e.jsxs('div', {
                            className: 'flex items-center gap-4',
                            children: [
                              e.jsxs('div', {
                                className: 'flex items-center gap-2',
                                children: [
                                  e.jsxs('span', {
                                    className: 'text-sm text-muted-foreground',
                                    children: [s('pagination.per_page'), ':'],
                                  }),
                                  e.jsxs(Y, {
                                    value: l.limit.toString(),
                                    onValueChange: A,
                                    children: [
                                      e.jsx(G, {
                                        className: 'w-[70px] h-8',
                                        children: e.jsx(Q, {}),
                                      }),
                                      e.jsxs(X, {
                                        children: [
                                          e.jsx(L, { value: '25', children: '25' }),
                                          e.jsx(L, { value: '50', children: '50' }),
                                          e.jsx(L, { value: '100', children: '100' }),
                                        ],
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              e.jsxs('div', {
                                className: 'flex items-center gap-2',
                                children: [
                                  e.jsxs(j, {
                                    variant: 'outline',
                                    size: 'sm',
                                    onClick: d,
                                    disabled: l.offset === 0 || f,
                                    children: [
                                      e.jsx(ze, { className: _('h-4 w-4', x && 'rotate-180') }),
                                      e.jsx('span', {
                                        className: 'hidden sm:inline ms-1',
                                        children: s('pagination.previous'),
                                      }),
                                    ],
                                  }),
                                  e.jsx('span', {
                                    className: 'text-sm px-2',
                                    children: s('pagination.page', { page: R, pages: xe || 1 }),
                                  }),
                                  e.jsxs(j, {
                                    variant: 'outline',
                                    size: 'sm',
                                    onClick: p,
                                    disabled: !b || f,
                                    children: [
                                      e.jsx('span', {
                                        className: 'hidden sm:inline me-1',
                                        children: s('pagination.next'),
                                      }),
                                      e.jsx(Ie, { className: _('h-4 w-4', x && 'rotate-180') }),
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
            ],
          }),
        ],
      }),
    ],
  })
}
const us = ss
export { us as component }
//# sourceMappingURL=audit-logs-fVN_T-zH.js.map
