import { u as Z, r as f, j as e } from './react-vendor-Buoak6m3.js'
import {
  c as V,
  I as Q,
  B as h,
  D as xe,
  x as ue,
  y as he,
  ad as Ce,
  N as De,
  O as Se,
  P as G,
  Q as Fe,
  R as ke,
  U as ae,
  C as ne,
  i as ze,
  s as C,
  A as ge,
  E as pe,
  F as je,
  G as fe,
  m as B,
  H as Ne,
  a2 as Pe,
  p as Ee,
  j as R,
  k as $,
  o as H,
  l as T,
  z as Y,
  J as L,
  n as ie,
  K as Me,
} from './index-qYY0KoZ1.js'
import {
  A as Re,
  a as Te,
  b as Ae,
  c as qe,
  d as Ie,
  e as Oe,
  f as Ve,
  g as $e,
} from './alert-dialog-DaWYDPc1.js'
import {
  cw as He,
  cx as Ke,
  cy as Ue,
  cz as Le,
  cA as Qe,
  aE as ve,
  aD as Be,
  aN as Ge,
  bP as Ye,
  cB as re,
  cC as Je,
  cD as le,
  cE as oe,
  aM as ce,
  aL as de,
  aP as K,
  aI as U,
  cm as Xe,
  c0 as We,
  cF as Ze,
  aR as W,
  cj as es,
  cG as ss,
  aJ as J,
  bd as ts,
  cc as as,
  b$ as ns,
  b5 as is,
  cH as rs,
  b6 as ls,
  b9 as me,
  b8 as os,
  aS as X,
} from './vendor-misc-BiJvMP0A.js'
import { c as ee, d as se, a as ye } from './tanstack-vendor-BZC-rs5U.js'
import { H as _e } from './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function cs({
  columns: a,
  data: s,
  searchPlaceholder: g,
  onRowClick: y,
  enableRowSelection: r = !1,
  enableExport: w = !0,
  exportFileName: x = 'export',
}) {
  const { t: l, i18n: P } = Z(),
    p = P.dir() === 'rtl',
    [E, N] = f.useState([]),
    [q, j] = f.useState([]),
    [_, D] = f.useState({}),
    [S, v] = f.useState({}),
    [b, F] = f.useState(''),
    M = f.useMemo(
      () =>
        r
          ? [
              {
                id: 'select',
                header: ({ table: i }) =>
                  e.jsx(ne, {
                    checked:
                      i.getIsAllPageRowsSelected() ||
                      (i.getIsSomePageRowsSelected() && 'indeterminate'),
                    onCheckedChange: (u) => i.toggleAllPageRowsSelected(!!u),
                    'aria-label': l('common:selectAll'),
                  }),
                cell: ({ row: i }) =>
                  e.jsx(ne, {
                    checked: i.getIsSelected(),
                    onCheckedChange: (u) => i.toggleSelected(!!u),
                    'aria-label': l('common:selectRow'),
                  }),
                enableSorting: !1,
                enableHiding: !1,
              },
              ...a,
            ]
          : a,
      [a, r, l],
    ),
    o = He({
      data: s,
      columns: M,
      onSortingChange: N,
      onColumnFiltersChange: j,
      getCoreRowModel: Qe(),
      getPaginationRowModel: Le(),
      getSortedRowModel: Ue(),
      getFilteredRowModel: Ke(),
      onColumnVisibilityChange: D,
      onRowSelectionChange: v,
      onGlobalFilterChange: F,
      globalFilterFn: 'includesString',
      state: {
        sorting: E,
        columnFilters: q,
        columnVisibility: _,
        rowSelection: S,
        globalFilter: b,
      },
    }),
    A = () => {
      const n = o.getFilteredRowModel().rows
      if (n.length === 0) return
      const i = o
          .getAllColumns()
          .filter((m) => m.getIsVisible() && m.id !== 'select' && m.id !== 'actions'),
        u = i.map((m) => {
          const t = m.columnDef.header
          return typeof t == 'string' ? t : m.id
        }),
        k = n.map((m) =>
          i.map((t) => {
            const c = m.getValue(t.id)
            return c == null
              ? ''
              : typeof c == 'object'
                ? JSON.stringify(c)
                : String(c).replace(/"/g, '""')
          }),
        ),
        I = [u.join(','), ...k.map((m) => m.map((t) => `"${t}"`).join(','))].join(`
`),
        O = new Blob([I], { type: 'text/csv;charset=utf-8;' }),
        d = document.createElement('a'),
        z = URL.createObjectURL(O)
      ;(d.setAttribute('href', z),
        d.setAttribute('download', `${x}.csv`),
        (d.style.visibility = 'hidden'),
        document.body.appendChild(d),
        d.click(),
        document.body.removeChild(d))
    }
  return e.jsxs('div', {
    className: 'w-full space-y-3 sm:space-y-4',
    children: [
      e.jsxs('div', {
        className: 'flex flex-col sm:flex-row gap-3 sm:gap-4',
        children: [
          e.jsxs('div', {
            className: 'relative flex-1',
            children: [
              e.jsx(ve, {
                className: V(
                  'absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none',
                  p ? 'right-3' : 'left-3',
                ),
              }),
              e.jsx(Q, {
                placeholder: g || l('common:searchAll'),
                value: b ?? '',
                onChange: (n) => F(n.target.value),
                className: V('w-full', p ? 'pr-10 pl-10' : 'pl-10 pr-10'),
              }),
              b &&
                e.jsx(h, {
                  variant: 'ghost',
                  size: 'sm',
                  className: V(
                    'absolute top-1/2 -translate-y-1/2 h-7 w-7 p-0',
                    p ? 'left-1' : 'right-1',
                  ),
                  onClick: () => F(''),
                  children: e.jsx(Be, { className: 'h-4 w-4' }),
                }),
            ],
          }),
          e.jsxs('div', {
            className: 'flex gap-2',
            children: [
              e.jsxs(xe, {
                children: [
                  e.jsx(ue, {
                    asChild: !0,
                    children: e.jsxs(h, {
                      variant: 'outline',
                      className: ' sm:min-h-0',
                      children: [e.jsx(Ge, { className: 'h-4 w-4 me-2' }), l('common:columns')],
                    }),
                  }),
                  e.jsx(he, {
                    align: 'end',
                    className: 'w-48',
                    children: o
                      .getAllColumns()
                      .filter((n) => n.getCanHide())
                      .map((n) =>
                        e.jsx(
                          Ce,
                          {
                            className: 'capitalize',
                            checked: n.getIsVisible(),
                            onCheckedChange: (i) => n.toggleVisibility(!!i),
                            children: n.id,
                          },
                          n.id,
                        ),
                      ),
                  }),
                ],
              }),
              w &&
                e.jsxs(h, {
                  variant: 'outline',
                  onClick: A,
                  disabled: s.length === 0,
                  className: ' sm:min-h-0',
                  children: [e.jsx(Ye, { className: 'h-4 w-4 me-2' }), l('common:export')],
                }),
            ],
          }),
        ],
      }),
      e.jsx('div', {
        className: 'rounded-lg border border-border overflow-hidden',
        children: e.jsx('div', {
          className: 'overflow-x-auto touch-pan-x',
          children: e.jsxs(De, {
            children: [
              e.jsx(Se, {
                children: o
                  .getHeaderGroups()
                  .map((n) =>
                    e.jsx(
                      G,
                      {
                        children: n.headers.map((i) =>
                          e.jsx(
                            Fe,
                            {
                              className: V(
                                'px-3 py-2 sm:px-4 sm:py-3 lg:px-6',
                                i.column.getCanSort() && 'cursor-pointer select-none',
                              ),
                              onClick: i.column.getToggleSortingHandler(),
                              children: i.isPlaceholder
                                ? null
                                : e.jsxs('div', {
                                    className: V(
                                      'flex items-center gap-2',
                                      i.column.getCanSort() && 'hover:text-foreground',
                                    ),
                                    children: [
                                      re(i.column.columnDef.header, i.getContext()),
                                      i.column.getCanSort() && e.jsx(Je, { className: 'h-3 w-3' }),
                                    ],
                                  }),
                            },
                            i.id,
                          ),
                        ),
                      },
                      n.id,
                    ),
                  ),
              }),
              e.jsx(ke, {
                children: o.getRowModel().rows?.length
                  ? o
                      .getRowModel()
                      .rows.map((n) =>
                        e.jsx(
                          G,
                          {
                            'data-state': n.getIsSelected() && 'selected',
                            className: V(
                              y && 'cursor-pointer hover:bg-accent/50',
                              'transition-colors',
                            ),
                            onClick: () => y?.(n.original),
                            children: n
                              .getVisibleCells()
                              .map((i) =>
                                e.jsx(
                                  ae,
                                  {
                                    className:
                                      'px-3 py-3 sm:px-4 sm:py-4 lg:px-6 text-xs sm:text-sm',
                                    children: re(i.column.columnDef.cell, i.getContext()),
                                  },
                                  i.id,
                                ),
                              ),
                          },
                          n.id,
                        ),
                      )
                  : e.jsx(G, {
                      children: e.jsx(ae, {
                        colSpan: M.length,
                        className: 'h-24 text-center',
                        children: l('common:noData'),
                      }),
                    }),
              }),
            ],
          }),
        }),
      }),
      e.jsxs('div', {
        className: 'flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4',
        children: [
          r &&
            e.jsxs('div', {
              className: 'text-xs sm:text-sm text-muted-foreground order-2 sm:order-1',
              children: [
                o.getFilteredSelectedRowModel().rows.length,
                ' ',
                l('common:of'),
                ' ',
                o.getFilteredRowModel().rows.length,
                ' ',
                l('common:selected'),
              ],
            }),
          !r &&
            e.jsxs('div', {
              className: 'text-xs sm:text-sm text-muted-foreground order-2 sm:order-1',
              children: [
                l('common:showing'),
                ' ',
                o.getState().pagination.pageIndex * o.getState().pagination.pageSize + 1,
                ' -',
                ' ',
                Math.min(
                  (o.getState().pagination.pageIndex + 1) * o.getState().pagination.pageSize,
                  s.length,
                ),
                ' ',
                l('common:of'),
                ' ',
                s.length,
              ],
            }),
          e.jsxs('div', {
            className: 'flex items-center gap-1 sm:gap-2 order-1 sm:order-2',
            children: [
              e.jsx(h, {
                variant: 'outline',
                size: 'sm',
                onClick: () => o.setPageIndex(0),
                disabled: !o.getCanPreviousPage(),
                className: ' min-w-[44px] sm:min-h-0 sm:min-w-0',
                children: p
                  ? e.jsx(le, { className: 'h-4 w-4' })
                  : e.jsx(oe, { className: 'h-4 w-4' }),
              }),
              e.jsx(h, {
                variant: 'outline',
                size: 'sm',
                onClick: () => o.previousPage(),
                disabled: !o.getCanPreviousPage(),
                className: ' min-w-[44px] sm:min-h-0 sm:min-w-0',
                children: p
                  ? e.jsx(ce, { className: 'h-4 w-4' })
                  : e.jsx(de, { className: 'h-4 w-4' }),
              }),
              e.jsxs('span', {
                className: 'text-xs sm:text-sm text-muted-foreground px-2 whitespace-nowrap',
                children: [
                  l('common:page'),
                  ' ',
                  o.getState().pagination.pageIndex + 1,
                  ' ',
                  l('common:of'),
                  ' ',
                  o.getPageCount(),
                ],
              }),
              e.jsx(h, {
                variant: 'outline',
                size: 'sm',
                onClick: () => o.nextPage(),
                disabled: !o.getCanNextPage(),
                className: ' min-w-[44px] sm:min-h-0 sm:min-w-0',
                children: p
                  ? e.jsx(de, { className: 'h-4 w-4' })
                  : e.jsx(ce, { className: 'h-4 w-4' }),
              }),
              e.jsx(h, {
                variant: 'outline',
                size: 'sm',
                onClick: () => o.setPageIndex(o.getPageCount() - 1),
                disabled: !o.getCanNextPage(),
                className: ' min-w-[44px] sm:min-h-0 sm:min-w-0',
                children: p
                  ? e.jsx(oe, { className: 'h-4 w-4' })
                  : e.jsx(le, { className: 'h-4 w-4' }),
              }),
            ],
          }),
        ],
      }),
    ],
  })
}
function ds({ forumId: a, forum: s, open: g, onOpenChange: y }) {
  const { t: r, i18n: w } = Z('forums'),
    { user: x } = ze(),
    l = w.language === 'ar',
    P = x?.role === 'admin' || x?.role === 'manager',
    p = () => {},
    E = ee(),
    N = se({
      mutationFn: async () => {
        if (!s) throw new Error('Missing forum data')
        const {
          data: { user: n },
          error: i,
        } = await C.auth.getUser()
        if (i || !n) throw new Error('Not authenticated')
        const { data: u, error: k } = await C.from('calendar_entries')
          .insert({
            title_en: s.title_en,
            title_ar: s.title_ar,
            description_en: s.description_en,
            description_ar: s.description_ar,
            entry_type: 'forum',
            event_date: s.start_datetime.split('T')[0],
            event_time: s.start_datetime.split('T')[1]?.split('.')[0] || '00:00:00',
            all_day: !1,
            location: l ? s.location_ar : s.location_en,
            is_virtual: s.is_virtual,
            linked_item_type: 'forum',
            linked_item_id: s.id,
            organizer_id: n.id,
            status: 'scheduled',
            created_by: n.id,
          })
          .select()
          .single()
        if (k) throw k
        return u
      },
      onSuccess: () => {
        ;(K.success(r('common:common.success', 'Success'), {
          description: 'Forum added to calendar successfully',
        }),
          E.invalidateQueries({ queryKey: ['calendar-entries'] }))
      },
      onError: (n) => {
        K.error(r('common:common.error', 'Error'), {
          description: n.message || 'Failed to add forum to calendar',
        })
      },
    }),
    q = () => {
      N.mutate()
    },
    { data: j } = ye({
      queryKey: ['forum-participants', a],
      queryFn: async () => {
        if (!a) return { countries: [], organizations: [] }
        const { data: n, error: i } = await C.from('forum_participants')
          .select('entity_id, entity_type, participation_type')
          .eq('forum_id', a)
        if (i) throw i
        if (!n || n.length === 0) return { countries: [], organizations: [] }
        const u = n.filter((d) => d.entity_type === 'country').map((d) => d.entity_id),
          k = n.filter((d) => d.entity_type === 'organization').map((d) => d.entity_id)
        let I = []
        if (u.length > 0) {
          const { data: d, error: z } = await C.from('countries')
            .select('id, name_en, name_ar')
            .in('id', u)
          if (z) throw z
          I = (d || []).map((m) => ({
            ...m,
            participation_type:
              n.find((t) => t.entity_id === m.id && t.entity_type === 'country')
                ?.participation_type || 'member',
          }))
        }
        let O = []
        if (k.length > 0) {
          const { data: d, error: z } = await C.from('organizations')
            .select('id, name_en, name_ar')
            .in('id', k)
          if (z) throw z
          O = (d || []).map((m) => ({
            ...m,
            participation_type:
              n.find((t) => t.entity_id === m.id && t.entity_type === 'organization')
                ?.participation_type || 'member',
          }))
        }
        return { countries: I, organizations: O }
      },
      enabled: !!a && g,
    })
  if (!s) return null
  const _ = l ? s.title_ar : s.title_en,
    D = l ? s.description_ar : s.description_en,
    S = l ? s.location_ar : s.location_en,
    v = l ? s.venue_ar : s.venue_en,
    b = l ? s.organizer.name_ar : s.organizer.name_en,
    F = j?.countries || [],
    M = j?.organizations || [],
    o = (n) => {
      const i = new Date(n)
      return isNaN(i.getTime()) ? '-' : _e(i, 'dd MMM yyyy')
    },
    A = (n) => {
      switch (n) {
        case 'scheduled':
          return 'bg-blue-100 text-blue-800'
        case 'ongoing':
          return 'bg-green-100 text-green-800'
        case 'completed':
          return 'bg-gray-100 text-gray-800'
        case 'cancelled':
          return 'bg-red-100 text-red-800'
        default:
          return 'bg-gray-100 text-gray-800'
      }
    }
  return e.jsx(ge, {
    open: g,
    onOpenChange: y,
    children: e.jsxs(pe, {
      className: 'max-w-4xl max-h-[90vh] p-0',
      children: [
        e.jsxs(je, {
          className: 'px-6 pt-6 pb-4',
          children: [
            e.jsxs('div', {
              className: 'flex items-start justify-between gap-4',
              children: [
                e.jsxs(fe, {
                  className: 'text-xl sm:text-2xl flex items-start gap-3 flex-1',
                  children: [
                    e.jsx(U, { className: 'h-6 w-6 mt-1 shrink-0' }),
                    e.jsxs('div', {
                      className: 'flex-1',
                      children: [
                        e.jsx('div', { children: _ }),
                        e.jsx(B, {
                          className: `mt-2 ${A(s.status)}`,
                          children: r(`statuses.${s.status}`),
                        }),
                      ],
                    }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'flex items-center gap-2',
                  children: [
                    e.jsxs(h, {
                      variant: 'outline',
                      size: 'sm',
                      onClick: q,
                      disabled: N.isPending,
                      className: 'shrink-0',
                      children: [
                        e.jsx(Xe, { className: 'h-4 w-4 me-2' }),
                        N.isPending ? 'Adding...' : 'Add to Calendar',
                      ],
                    }),
                    P &&
                      e.jsxs(h, {
                        variant: 'outline',
                        size: 'sm',
                        onClick: p,
                        className: 'shrink-0',
                        children: [
                          e.jsx(We, { className: 'h-4 w-4 me-2' }),
                          r('common:common.edit'),
                        ],
                      }),
                  ],
                }),
              ],
            }),
            e.jsxs(Ne, { className: 'sr-only', children: [r('common:common.view'), ' ', _] }),
          ],
        }),
        e.jsx(Pe, {}),
        e.jsx(Ee, {
          className: 'px-6 pb-6',
          style: { maxHeight: 'calc(90vh - 120px)' },
          children: e.jsxs('div', {
            className: 'space-y-6',
            children: [
              e.jsxs(R, {
                children: [
                  e.jsx($, {
                    className: 'pb-3',
                    children: e.jsxs(H, {
                      className: 'text-base flex items-center gap-2',
                      children: [e.jsx(Ze, { className: 'h-4 w-4' }), r('common:common.about')],
                    }),
                  }),
                  e.jsxs(T, {
                    className: 'space-y-3',
                    children: [
                      D &&
                        e.jsxs('div', {
                          children: [
                            e.jsx('p', {
                              className: 'text-sm text-muted-foreground mb-1',
                              children: r('common:common.about'),
                            }),
                            e.jsx('p', { className: 'text-sm', children: D }),
                          ],
                        }),
                      e.jsxs('div', {
                        className: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
                        children: [
                          e.jsxs('div', {
                            className: 'flex items-start gap-2',
                            children: [
                              e.jsx(W, {
                                className: 'h-4 w-4 mt-0.5 text-muted-foreground shrink-0',
                              }),
                              e.jsxs('div', {
                                children: [
                                  e.jsx('p', {
                                    className: 'text-sm font-medium',
                                    children: r('dates'),
                                  }),
                                  e.jsxs('p', {
                                    className: 'text-sm text-muted-foreground',
                                    children: [
                                      o(s.start_datetime),
                                      s.end_datetime && ` - ${o(s.end_datetime)}`,
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                          e.jsxs('div', {
                            className: 'flex items-start gap-2',
                            children: [
                              e.jsx(es, {
                                className: 'h-4 w-4 mt-0.5 text-muted-foreground shrink-0',
                              }),
                              e.jsxs('div', {
                                children: [
                                  e.jsx('p', {
                                    className: 'text-sm font-medium',
                                    children: r('location'),
                                  }),
                                  e.jsx('p', {
                                    className: 'text-sm text-muted-foreground',
                                    children: S || '-',
                                  }),
                                ],
                              }),
                            ],
                          }),
                          e.jsxs('div', {
                            className: 'flex items-start gap-2',
                            children: [
                              s.is_virtual
                                ? e.jsx(ss, {
                                    className: 'h-4 w-4 mt-0.5 text-muted-foreground shrink-0',
                                  })
                                : e.jsx(J, {
                                    className: 'h-4 w-4 mt-0.5 text-muted-foreground shrink-0',
                                  }),
                              e.jsxs('div', {
                                children: [
                                  e.jsx('p', {
                                    className: 'text-sm font-medium',
                                    children: r('venue'),
                                  }),
                                  e.jsx('p', {
                                    className: 'text-sm text-muted-foreground',
                                    children: s.is_virtual ? r('virtual') : v,
                                  }),
                                ],
                              }),
                            ],
                          }),
                          e.jsxs('div', {
                            className: 'flex items-start gap-2',
                            children: [
                              e.jsx(ts, {
                                className: 'h-4 w-4 mt-0.5 text-muted-foreground shrink-0',
                              }),
                              e.jsxs('div', {
                                children: [
                                  e.jsx('p', {
                                    className: 'text-sm font-medium',
                                    children: r('sessions'),
                                  }),
                                  e.jsxs('p', {
                                    className: 'text-sm text-muted-foreground',
                                    children: [
                                      s.number_of_sessions,
                                      ' ',
                                      r('sessions').toLowerCase(),
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                          s.max_participants &&
                            e.jsxs('div', {
                              className: 'flex items-start gap-2',
                              children: [
                                e.jsx(U, {
                                  className: 'h-4 w-4 mt-0.5 text-muted-foreground shrink-0',
                                }),
                                e.jsxs('div', {
                                  children: [
                                    e.jsx('p', {
                                      className: 'text-sm font-medium',
                                      children: r('participants'),
                                    }),
                                    e.jsxs('p', {
                                      className: 'text-sm text-muted-foreground',
                                      children: [s.max_participants, ' max'],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          e.jsxs('div', {
                            className: 'flex items-start gap-2',
                            children: [
                              e.jsx(J, {
                                className: 'h-4 w-4 mt-0.5 text-muted-foreground shrink-0',
                              }),
                              e.jsxs('div', {
                                children: [
                                  e.jsx('p', {
                                    className: 'text-sm font-medium',
                                    children: r('organizer', 'Organizer'),
                                  }),
                                  e.jsx('p', {
                                    className: 'text-sm text-muted-foreground',
                                    children: b,
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
              e.jsxs(R, {
                children: [
                  e.jsx($, {
                    className: 'pb-3',
                    children: e.jsxs(H, {
                      className: 'text-base flex items-center gap-2',
                      children: [
                        e.jsx(as, { className: 'h-4 w-4' }),
                        r('countries'),
                        ' (',
                        F.length,
                        ')',
                      ],
                    }),
                  }),
                  e.jsx(T, {
                    children:
                      F.length > 0
                        ? e.jsx('div', {
                            className: 'grid grid-cols-1 sm:grid-cols-2 gap-2',
                            children: F.map((n, i) =>
                              e.jsxs(
                                'div',
                                {
                                  className:
                                    'flex items-center justify-between p-2 rounded-lg border',
                                  children: [
                                    e.jsx('span', {
                                      className: 'text-sm',
                                      children: l ? n.name_ar : n.name_en,
                                    }),
                                    e.jsx(B, {
                                      variant: 'outline',
                                      className: 'text-xs',
                                      children: r(`participationType.${n.participation_type}`),
                                    }),
                                  ],
                                },
                                i,
                              ),
                            ),
                          })
                        : e.jsx('p', {
                            className: 'text-sm text-muted-foreground text-center py-4',
                            children: r('noCountries'),
                          }),
                  }),
                ],
              }),
              e.jsxs(R, {
                children: [
                  e.jsx($, {
                    className: 'pb-3',
                    children: e.jsxs(H, {
                      className: 'text-base flex items-center gap-2',
                      children: [
                        e.jsx(J, { className: 'h-4 w-4' }),
                        r('organizations'),
                        ' (',
                        M.length,
                        ')',
                      ],
                    }),
                  }),
                  e.jsx(T, {
                    children:
                      M.length > 0
                        ? e.jsx('div', {
                            className: 'grid grid-cols-1 sm:grid-cols-2 gap-2',
                            children: M.map((n, i) =>
                              e.jsxs(
                                'div',
                                {
                                  className:
                                    'flex items-center justify-between p-2 rounded-lg border',
                                  children: [
                                    e.jsx('span', {
                                      className: 'text-sm',
                                      children: l ? n.name_ar : n.name_en,
                                    }),
                                    e.jsx(B, {
                                      variant: 'outline',
                                      className: 'text-xs',
                                      children: r(`participationType.${n.participation_type}`),
                                    }),
                                  ],
                                },
                                i,
                              ),
                            ),
                          })
                        : e.jsx('p', {
                            className: 'text-sm text-muted-foreground text-center py-4',
                            children: r('noOrganizations'),
                          }),
                  }),
                ],
              }),
            ],
          }),
        }),
      ],
    }),
  })
}
const te = 'forums',
  we = 'forum'
function ms(a = {}) {
  return ye({
    queryKey: [te, a],
    queryFn: async () => {
      const { search: s, status: g, page: y = 1, limit: r = 20 } = a,
        w = (y - 1) * r
      let x = C.from('dossiers')
        .select('*', { count: 'exact' })
        .eq('type', 'forum')
        .neq('status', 'deleted')
      ;(s &&
        (x = x.or(
          `name_en.ilike.%${s}%,name_ar.ilike.%${s}%,description_en.ilike.%${s}%,description_ar.ilike.%${s}%`,
        )),
        g && (x = x.eq('status', g)),
        (x = x.order('name_en', { ascending: !0 }).range(w, w + r - 1)))
      const { data: l, error: P, count: p } = await x
      if (P) throw new Error(P.message)
      const E = (l || []).map((j) => j.id)
      let N = {}
      if (E.length > 0) {
        const { data: j } = await C.from('forums').select('*').in('id', E)
        j && (N = j.reduce((_, D) => ((_[D.id] = D), _), {}))
      }
      return {
        data: (l || []).map((j) => ({ ...j, type: 'forum', extension: N[j.id] || {} })),
        pagination: { page: y, limit: r, total: p, totalPages: Math.ceil((p || 0) / r) },
      }
    },
    staleTime: 1e3 * 60 * 5,
  })
}
function xs() {
  const a = ee()
  return se({
    mutationFn: async (s) => {
      const {
          data: { user: g },
        } = await C.auth.getUser(),
        { data: y, error: r } = await C.from('dossiers')
          .insert({
            type: 'forum',
            name_en: s.name_en,
            name_ar: s.name_ar,
            description_en: s.description_en || null,
            description_ar: s.description_ar || null,
            status: s.status || 'active',
            sensitivity_level: s.sensitivity_level || 1,
            tags: s.tags || [],
            metadata: s.metadata || {},
            created_by: g?.id,
            updated_by: g?.id,
          })
          .select()
          .single()
      if (r) throw new Error(r.message)
      if (s.extension) {
        const { error: w } = await C.from('forums').insert({
          id: y.id,
          number_of_sessions: s.extension.number_of_sessions,
          keynote_speakers: s.extension.keynote_speakers || [],
          sponsors: s.extension.sponsors || [],
          registration_fee: s.extension.registration_fee,
          currency: s.extension.currency,
          agenda_url: s.extension.agenda_url,
          live_stream_url: s.extension.live_stream_url,
        })
        w && console.error('Error creating forum extension:', w)
      }
      return { ...y, type: 'forum', extension: s.extension || {} }
    },
    onSuccess: (s) => {
      ;(a.invalidateQueries({ queryKey: [te] }),
        a.setQueryData([we, s.id], s),
        K.success('Forum created successfully'))
    },
    onError: (s) => {
      K.error(s instanceof Error ? s.message : 'Failed to create forum')
    },
  })
}
function us() {
  const a = ee()
  return se({
    mutationFn: async (s) => {
      const { error: g } = await C.from('dossiers')
        .update({ status: 'archived' })
        .eq('id', s)
        .eq('type', 'forum')
      if (g) throw new Error(g.message)
      return s
    },
    onSuccess: (s) => {
      ;(a.invalidateQueries({ queryKey: [te] }),
        a.removeQueries({ queryKey: [we, s] }),
        K.success('Forum deleted successfully'))
    },
    onError: (s) => {
      K.error(s instanceof Error ? s.message : 'Failed to delete forum')
    },
  })
}
function hs() {
  const { t: a, i18n: s } = Z('forums'),
    [g, y] = f.useState(''),
    [r, w] = f.useState('all'),
    [x, l] = f.useState(null),
    [P, p] = f.useState(!1),
    [E, N] = f.useState(!1),
    [q, j] = f.useState(!1),
    [_, D] = f.useState(1),
    S = s.language === 'ar',
    [v, b] = f.useState({ name_en: '', name_ar: '', description_en: '', description_ar: '' }),
    {
      data: F,
      isLoading: M,
      error: o,
    } = ms({ search: g || void 0, status: r !== 'all' ? r : void 0, page: _, limit: 20 }),
    A = xs(),
    n = us(),
    i = F?.data || [],
    u = F?.pagination,
    k = f.useMemo(() => i.filter((t) => t.status === 'active').length, [i]),
    I = async () => {
      !v.name_en ||
        !v.name_ar ||
        (await A.mutateAsync(v),
        N(!1),
        b({ name_en: '', name_ar: '', description_en: '', description_ar: '' }))
    },
    O = async () => {
      x && (await n.mutateAsync(x.id), j(!1), l(null))
    },
    d = (t) => {
      ;(l(t), j(!0))
    },
    z = [
      {
        accessorKey: 'name_en',
        header: a('table.name'),
        cell: ({ row: t }) =>
          e.jsxs('div', {
            className: `font-medium ${S ? 'text-end' : 'text-start'}`,
            children: [
              e.jsx('div', { children: S ? t.original.name_ar : t.original.name_en }),
              t.original.description_en &&
                e.jsx('div', {
                  className: 'text-xs text-muted-foreground mt-1 line-clamp-1',
                  children: S ? t.original.description_ar : t.original.description_en,
                }),
            ],
          }),
      },
      {
        accessorKey: 'created_at',
        header: a('table.created'),
        cell: ({ row: t }) => {
          const c = t.original.created_at ? new Date(t.original.created_at) : null,
            be = c && !isNaN(c.getTime())
          return e.jsxs('div', {
            className: 'flex items-center gap-1',
            children: [
              e.jsx(W, { className: 'h-4 w-4 text-muted-foreground' }),
              e.jsx('span', { className: 'text-sm', children: be ? _e(c, 'dd MMM yyyy') : '-' }),
            ],
          })
        },
      },
      {
        accessorKey: 'extension.number_of_sessions',
        header: a('table.sessions'),
        cell: ({ row: t }) => {
          const c = t.original.extension
          return e.jsx('span', { className: 'text-sm', children: c?.number_of_sessions || '-' })
        },
      },
      {
        accessorKey: 'status',
        header: a('table.status'),
        cell: ({ row: t }) => {
          if (!t.original.status)
            return e.jsx('span', { className: 'text-sm text-muted-foreground', children: '-' })
          const c =
            t.original.status === 'active'
              ? 'default'
              : t.original.status === 'inactive'
                ? 'secondary'
                : 'outline'
          return e.jsx(B, { variant: c, children: a(`statuses.${t.original.status}`) })
        },
      },
      {
        id: 'actions',
        header: a('table.actions'),
        cell: ({ row: t }) =>
          e.jsxs(xe, {
            children: [
              e.jsx(ue, {
                asChild: !0,
                children: e.jsxs(h, {
                  variant: 'ghost',
                  size: 'icon',
                  className: 'min-h-11 min-w-11',
                  children: [
                    e.jsx(ns, { className: 'size-4' }),
                    e.jsx('span', { className: 'sr-only', children: a('table.actions') }),
                  ],
                }),
              }),
              e.jsxs(he, {
                align: S ? 'start' : 'end',
                children: [
                  e.jsxs(Y, {
                    onClick: () => {
                      ;(l(t.original), p(!0))
                    },
                    children: [e.jsx(is, { className: 'size-4 me-2' }), a('viewDetails')],
                  }),
                  e.jsxs(Y, {
                    onClick: () => console.log('Edit:', t.original.id),
                    children: [e.jsx(rs, { className: 'size-4 me-2' }), a('editForum')],
                  }),
                  e.jsxs(Y, {
                    onClick: () => d(t.original),
                    className: 'text-destructive focus:text-destructive',
                    children: [e.jsx(ls, { className: 'size-4 me-2' }), a('deleteForum')],
                  }),
                ],
              }),
            ],
          }),
      },
    ],
    m = [
      { value: 'all', label: a('allStatuses') },
      { value: 'active', label: a('statuses.active') },
      { value: 'inactive', label: a('statuses.inactive') },
      { value: 'archived', label: a('statuses.archived') },
    ]
  return e.jsxs('div', {
    className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6',
    children: [
      e.jsx('header', {
        className: 'flex flex-col gap-2',
        children: e.jsxs('div', {
          className:
            'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4',
          children: [
            e.jsxs('div', {
              children: [
                e.jsx('h1', {
                  className: 'text-2xl sm:text-3xl font-bold',
                  children: a('pageTitle'),
                }),
                e.jsx('p', {
                  className: 'text-sm sm:text-base text-muted-foreground',
                  children: a('pageSubtitle'),
                }),
              ],
            }),
            e.jsxs(h, {
              className: 'w-full sm:w-auto min-h-11',
              onClick: () => N(!0),
              children: [e.jsx(me, { className: 'h-4 w-4 me-2' }), a('addForum')],
            }),
          ],
        }),
      }),
      e.jsxs('section', {
        className: 'grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        children: [
          e.jsxs(R, {
            children: [
              e.jsxs($, {
                className: 'flex flex-row items-center justify-between pb-2',
                children: [
                  e.jsx(H, {
                    className: 'text-sm font-semibold',
                    children: a('metrics.totalForums'),
                  }),
                  e.jsx(U, { className: 'size-5 text-primary' }),
                ],
              }),
              e.jsx(T, {
                children: e.jsx('p', { className: 'text-2xl font-bold', children: u?.total || 0 }),
              }),
            ],
          }),
          e.jsxs(R, {
            children: [
              e.jsxs($, {
                className: 'flex flex-row items-center justify-between pb-2',
                children: [
                  e.jsx(H, {
                    className: 'text-sm font-semibold',
                    children: a('metrics.activeForums'),
                  }),
                  e.jsx(W, { className: 'size-5 text-primary' }),
                ],
              }),
              e.jsx(T, { children: e.jsx('p', { className: 'text-2xl font-bold', children: k }) }),
            ],
          }),
          e.jsxs(R, {
            className: 'sm:col-span-2 lg:col-span-1',
            children: [
              e.jsxs($, {
                className: 'flex flex-row items-center justify-between pb-2',
                children: [
                  e.jsx(H, { className: 'text-sm font-semibold', children: a('sessions') }),
                  e.jsx(U, { className: 'size-5 text-primary' }),
                ],
              }),
              e.jsx(T, {
                children: e.jsx('p', {
                  className: 'text-2xl font-bold',
                  children: i.reduce((t, c) => t + (c.extension?.number_of_sessions || 0), 0),
                }),
              }),
            ],
          }),
        ],
      }),
      e.jsx(R, {
        children: e.jsx(T, {
          className: 'pt-6',
          children: e.jsxs('div', {
            className: 'flex flex-col sm:flex-row gap-4',
            children: [
              e.jsx('div', {
                className: 'flex-1',
                children: e.jsxs('div', {
                  className: 'relative',
                  children: [
                    e.jsx(ve, {
                      className:
                        'absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground',
                    }),
                    e.jsx(Q, {
                      placeholder: a('searchPlaceholder'),
                      value: g,
                      onChange: (t) => y(t.target.value),
                      className: 'ps-10 min-h-11',
                    }),
                  ],
                }),
              }),
              e.jsxs('div', {
                className: 'flex flex-wrap items-center gap-2',
                children: [
                  e.jsx(os, { className: 'h-4 w-4 text-muted-foreground flex-shrink-0' }),
                  m.map((t) =>
                    e.jsx(
                      h,
                      {
                        variant: r === t.value ? 'default' : 'outline',
                        size: 'sm',
                        onClick: () => w(t.value),
                        className: 'min-h-11 text-xs sm:text-sm',
                        children: t.label,
                      },
                      t.value,
                    ),
                  ),
                ],
              }),
            ],
          }),
        }),
      }),
      e.jsx(R, {
        children: e.jsx(T, {
          className: 'p-0',
          children: M
            ? e.jsx('div', {
                className: 'flex items-center justify-center py-12',
                children: e.jsx(X, { className: 'size-8 animate-spin text-muted-foreground' }),
              })
            : o
              ? e.jsx('div', {
                  className: 'px-5 py-8 text-center text-sm text-destructive',
                  children: o.message || 'Error loading forums',
                })
              : i && i.length > 0
                ? e.jsx(cs, {
                    data: i,
                    columns: z,
                    searchPlaceholder: a('searchPlaceholder'),
                    onRowClick: (t) => {
                      ;(l(t), p(!0))
                    },
                    enableExport: !0,
                    exportFileName: 'forums',
                  })
                : e.jsxs('div', {
                    className: 'px-5 py-12 text-center',
                    children: [
                      e.jsx(U, { className: 'mx-auto size-12 text-muted-foreground/50' }),
                      e.jsx('h3', {
                        className: 'mt-4 text-lg font-semibold',
                        children: a('noForumsFound'),
                      }),
                      e.jsx('p', {
                        className: 'mt-2 text-sm text-muted-foreground',
                        children: a('noForumsDescription'),
                      }),
                      e.jsxs(h, {
                        className: 'mt-6 gap-2',
                        onClick: () => N(!0),
                        children: [e.jsx(me, { className: 'size-4' }), a('addForum')],
                      }),
                    ],
                  }),
        }),
      }),
      u &&
        u.totalPages > 1 &&
        e.jsxs('div', {
          className: 'flex items-center justify-center gap-2',
          children: [
            e.jsx(h, {
              variant: 'outline',
              size: 'sm',
              onClick: () => D((t) => Math.max(1, t - 1)),
              disabled: _ === 1,
              className: 'min-h-11',
              children: S ? 'التالي' : 'Previous',
            }),
            e.jsxs('span', {
              className: 'text-sm text-muted-foreground',
              children: [_, ' / ', u.totalPages],
            }),
            e.jsx(h, {
              variant: 'outline',
              size: 'sm',
              onClick: () => D((t) => Math.min(u.totalPages, t + 1)),
              disabled: _ === u.totalPages,
              className: 'min-h-11',
              children: S ? 'السابق' : 'Next',
            }),
          ],
        }),
      e.jsx(ds, { forumId: x?.id || null, forum: x, open: P, onOpenChange: p }),
      e.jsx(ge, {
        open: E,
        onOpenChange: N,
        children: e.jsxs(pe, {
          className: 'max-w-lg',
          children: [
            e.jsxs(je, {
              children: [
                e.jsx(fe, { children: a('createDialog.title') }),
                e.jsx(Ne, { children: a('createDialog.description') }),
              ],
            }),
            e.jsxs('div', {
              className: 'space-y-4 py-4',
              children: [
                e.jsxs('div', {
                  className: 'space-y-2',
                  children: [
                    e.jsx(L, { htmlFor: 'name_en', children: a('form.nameEn') }),
                    e.jsx(Q, {
                      id: 'name_en',
                      value: v.name_en,
                      onChange: (t) => b((c) => ({ ...c, name_en: t.target.value })),
                      placeholder: 'e.g., UN Statistical Commission',
                      className: 'min-h-11',
                    }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'space-y-2',
                  children: [
                    e.jsx(L, { htmlFor: 'name_ar', children: a('form.nameAr') }),
                    e.jsx(Q, {
                      id: 'name_ar',
                      value: v.name_ar,
                      onChange: (t) => b((c) => ({ ...c, name_ar: t.target.value })),
                      placeholder: 'مثال: لجنة الأمم المتحدة الإحصائية',
                      dir: 'rtl',
                      className: 'min-h-11',
                    }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'space-y-2',
                  children: [
                    e.jsx(L, { htmlFor: 'description_en', children: a('form.descriptionEn') }),
                    e.jsx(ie, {
                      id: 'description_en',
                      value: v.description_en,
                      onChange: (t) => b((c) => ({ ...c, description_en: t.target.value })),
                      placeholder: 'Enter forum description...',
                      rows: 3,
                    }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'space-y-2',
                  children: [
                    e.jsx(L, { htmlFor: 'description_ar', children: a('form.descriptionAr') }),
                    e.jsx(ie, {
                      id: 'description_ar',
                      value: v.description_ar,
                      onChange: (t) => b((c) => ({ ...c, description_ar: t.target.value })),
                      placeholder: 'أدخل وصف المنتدى...',
                      dir: 'rtl',
                      rows: 3,
                    }),
                  ],
                }),
              ],
            }),
            e.jsxs(Me, {
              className: 'flex-col sm:flex-row gap-2',
              children: [
                e.jsx(h, {
                  variant: 'outline',
                  onClick: () => N(!1),
                  className: 'min-h-11 w-full sm:w-auto',
                  children: a('form.cancel'),
                }),
                e.jsxs(h, {
                  onClick: I,
                  disabled: !v.name_en || !v.name_ar || A.isPending,
                  className: 'min-h-11 w-full sm:w-auto',
                  children: [
                    A.isPending && e.jsx(X, { className: 'size-4 me-2 animate-spin' }),
                    a('form.save'),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      e.jsx(Re, {
        open: q,
        onOpenChange: j,
        children: e.jsxs(Te, {
          children: [
            e.jsxs(Ae, {
              children: [
                e.jsx(qe, { children: a('deleteDialog.title') }),
                e.jsx(Ie, { children: a('deleteDialog.description') }),
              ],
            }),
            e.jsxs(Oe, {
              className: 'flex-col sm:flex-row gap-2',
              children: [
                e.jsx(Ve, { className: 'min-h-11', children: a('deleteDialog.cancel') }),
                e.jsxs($e, {
                  onClick: O,
                  className:
                    'bg-destructive text-destructive-foreground hover:bg-destructive/90 min-h-11',
                  disabled: n.isPending,
                  children: [
                    n.isPending && e.jsx(X, { className: 'size-4 me-2 animate-spin' }),
                    a('deleteDialog.confirm'),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  })
}
const Ds = hs
export { Ds as component }
//# sourceMappingURL=forums-zgIOuIm5.js.map
