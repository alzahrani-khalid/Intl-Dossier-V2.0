import { u as X, r as m, j as e } from './react-vendor-Buoak6m3.js'
import {
  cw as Y,
  aE as Z,
  bF as $,
  cU as ee,
  cV as se,
  cB as x,
  cD as P,
  cE as k,
  aM as R,
  aL as z,
  cx as ae,
  cy as te,
  cz as ne,
  cA as le,
  cs as ie,
  cr as oe,
  cC as re,
} from './vendor-misc-BiJvMP0A.js'
import {
  a0 as V,
  c,
  I as ce,
  B as d,
  D as de,
  x as me,
  y as xe,
  a8 as ge,
  a9 as he,
  ad as ue,
  j as I,
  l as F,
  q as pe,
  r as je,
  t as we,
  v as fe,
  w as Ne,
} from './index-qYY0KoZ1.js'
function Se({
  columns: p,
  data: u,
  pageSize: T = 10,
  pageSizeOptions: A = [5, 10, 20, 50],
  enableFiltering: j = !0,
  enableSorting: L = !0,
  enablePagination: w = !0,
  enableColumnVisibility: E = !0,
  enableViewToggle: H = !0,
  onRowClick: g,
  isLoading: B = !1,
  emptyMessage: f,
  searchPlaceholder: G,
  mobileCardColumns: N,
  cardTitleColumn: b,
  cardDescriptionColumn: v,
}) {
  const { t: n, i18n: U } = X(),
    r = U.language === 'ar',
    [W, q] = m.useState([]),
    [_, J] = m.useState([]),
    [C, S] = m.useState(''),
    [y, K] = m.useState({}),
    [h, M] = m.useState('table'),
    a = Y({
      data: u,
      columns: p,
      getCoreRowModel: le(),
      getPaginationRowModel: w ? ne() : void 0,
      getSortedRowModel: L ? te() : void 0,
      getFilteredRowModel: j ? ae() : void 0,
      onSortingChange: q,
      onColumnFiltersChange: J,
      onGlobalFilterChange: S,
      onColumnVisibilityChange: K,
      state: { sorting: W, columnFilters: _, globalFilter: C, columnVisibility: y },
      initialState: { pagination: { pageSize: T } },
    })
  m.useMemo(() => a.getAllColumns().filter((s) => s.getIsVisible()), [a, y])
  const O = (s) =>
      s === 'asc'
        ? e.jsx(ie, { className: 'h-3.5 w-3.5 flex-shrink-0' })
        : s === 'desc'
          ? e.jsx(oe, { className: 'h-3.5 w-3.5 flex-shrink-0' })
          : e.jsx(re, { className: 'h-3.5 w-3.5 flex-shrink-0 opacity-50' }),
    Q = (s) => {
      const t = s.getVisibleCells(),
        l = b ? t.find((i) => i.column.id === b) : t[0],
        o = v ? t.find((i) => i.column.id === v) : t[1],
        D = N ? t.filter((i) => N.includes(i.column.id)) : t.slice(2, 5)
      return e.jsx(
        I,
        {
          className: c(
            'transition-colors',
            g && 'cursor-pointer hover:bg-accent/50 active:bg-accent',
          ),
          onClick: () => g?.(s.original),
          children: e.jsxs(F, {
            className: 'p-4 space-y-3',
            children: [
              l &&
                e.jsx('div', {
                  className: 'flex items-start justify-between gap-3',
                  children: e.jsxs('div', {
                    className: 'flex-1 min-w-0',
                    children: [
                      e.jsx('div', {
                        className: 'font-medium text-sm sm:text-base truncate',
                        children: x(l.column.columnDef.cell, l.getContext()),
                      }),
                      o &&
                        o !== l &&
                        e.jsx('div', {
                          className: 'text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2',
                          children: x(o.column.columnDef.cell, o.getContext()),
                        }),
                    ],
                  }),
                }),
              D.length > 0 &&
                e.jsx('div', {
                  className: 'grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-border',
                  children: D.map((i) =>
                    e.jsxs(
                      'div',
                      {
                        className: 'space-y-0.5',
                        children: [
                          e.jsx('div', {
                            className:
                              'text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide',
                            children:
                              typeof i.column.columnDef.header == 'string'
                                ? i.column.columnDef.header
                                : i.column.id,
                          }),
                          e.jsx('div', {
                            className: 'text-xs sm:text-sm font-medium',
                            children: x(i.column.columnDef.cell, i.getContext()),
                          }),
                        ],
                      },
                      i.id,
                    ),
                  ),
                }),
            ],
          }),
        },
        s.id,
      )
    }
  return B
    ? e.jsxs('div', {
        className: 'space-y-4',
        children: [
          e.jsx(V, { className: 'h-10 w-full max-w-sm' }),
          e.jsx('div', {
            className: 'space-y-3',
            children: Array.from({ length: 5 }).map((s, t) =>
              e.jsx(V, { className: 'h-16 w-full' }, t),
            ),
          }),
        ],
      })
    : e.jsxs('div', {
        className: 'space-y-2 min-w-0 w-full',
        dir: r ? 'rtl' : 'ltr',
        children: [
          e.jsxs('div', {
            className: 'flex items-center justify-between gap-2',
            children: [
              j &&
                e.jsxs('div', {
                  className: 'relative flex-1 max-w-xs',
                  children: [
                    e.jsx(Z, {
                      className: c(
                        'absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground',
                        r ? 'end-2.5' : 'start-2.5',
                      ),
                    }),
                    e.jsx(ce, {
                      type: 'text',
                      value: C ?? '',
                      onChange: (s) => S(s.target.value),
                      placeholder: G || n('common.search', 'Search...'),
                      className: c('w-full h-8 text-sm', r ? 'pe-2.5 ps-8' : 'ps-8 pe-2.5'),
                    }),
                  ],
                }),
              e.jsxs('div', {
                className: 'flex items-center gap-1.5',
                children: [
                  H &&
                    e.jsxs('div', {
                      className: 'flex items-center rounded-md border border-input p-0.5 sm:hidden',
                      children: [
                        e.jsx(d, {
                          variant: h === 'card' ? 'secondary' : 'ghost',
                          size: 'sm',
                          className: 'h-7 w-7 p-0',
                          onClick: () => M('card'),
                          'aria-label': n('common.cardView', 'Card view'),
                          children: e.jsx($, { className: 'h-3.5 w-3.5' }),
                        }),
                        e.jsx(d, {
                          variant: h === 'table' ? 'secondary' : 'ghost',
                          size: 'sm',
                          className: 'h-7 w-7 p-0',
                          onClick: () => M('table'),
                          'aria-label': n('common.tableView', 'Table view'),
                          children: e.jsx(ee, { className: 'h-3.5 w-3.5' }),
                        }),
                      ],
                    }),
                  E &&
                    e.jsxs(de, {
                      children: [
                        e.jsx(me, {
                          asChild: !0,
                          children: e.jsxs(d, {
                            variant: 'outline',
                            size: 'sm',
                            className: 'h-8 gap-1.5 text-xs',
                            children: [
                              e.jsx(se, { className: 'h-3.5 w-3.5' }),
                              e.jsx('span', {
                                className: 'hidden sm:inline',
                                children: n('common.columns', 'Columns'),
                              }),
                            ],
                          }),
                        }),
                        e.jsxs(xe, {
                          align: r ? 'start' : 'end',
                          className: 'w-44',
                          children: [
                            e.jsx(ge, {
                              className: 'text-xs',
                              children: n('common.toggleColumns', 'Toggle columns'),
                            }),
                            e.jsx(he, {}),
                            a
                              .getAllColumns()
                              .filter((s) => s.getCanHide())
                              .map((s) =>
                                e.jsx(
                                  ue,
                                  {
                                    checked: s.getIsVisible(),
                                    onCheckedChange: (t) => s.toggleVisibility(!!t),
                                    className: 'capitalize text-xs',
                                    children:
                                      typeof s.columnDef.header == 'string'
                                        ? s.columnDef.header
                                        : s.id,
                                  },
                                  s.id,
                                ),
                              ),
                          ],
                        }),
                      ],
                    }),
                ],
              }),
            ],
          }),
          e.jsx('div', {
            className: c('sm:hidden', h === 'table' && 'hidden'),
            children:
              a.getRowModel().rows.length > 0
                ? e.jsx('div', {
                    className: 'space-y-3',
                    children: a.getRowModel().rows.map((s) => Q(s)),
                  })
                : e.jsx(I, {
                    children: e.jsx(F, {
                      className: 'py-12 text-center text-muted-foreground',
                      children: f || n('common.noResults', 'No results found.'),
                    }),
                  }),
          }),
          e.jsx('div', {
            className: c('rounded-md border border-border overflow-hidden', 'hidden sm:block'),
            children: e.jsxs('table', {
              className: 'w-full table-fixed',
              children: [
                e.jsx('thead', {
                  className: 'bg-muted/40 border-b border-border',
                  children: a.getHeaderGroups().map((s) =>
                    e.jsx(
                      'tr',
                      {
                        children: s.headers.map((t) => {
                          const l = t.column.columnDef.size,
                            o = l && l !== 150
                          return e.jsx(
                            'th',
                            {
                              className: c(
                                'px-3 py-2 text-start text-[11px] font-medium text-muted-foreground uppercase tracking-wide overflow-hidden',
                                t.column.getCanSort() &&
                                  'cursor-pointer select-none hover:text-foreground',
                                !o && 'max-w-0',
                              ),
                              style: o ? { width: l } : void 0,
                              onClick: t.column.getToggleSortingHandler(),
                              children: t.isPlaceholder
                                ? null
                                : e.jsxs('div', {
                                    className: 'flex items-center gap-1',
                                    children: [
                                      e.jsx('span', {
                                        className: 'truncate',
                                        children: x(t.column.columnDef.header, t.getContext()),
                                      }),
                                      t.column.getCanSort() && O(t.column.getIsSorted()),
                                    ],
                                  }),
                            },
                            t.id,
                          )
                        }),
                      },
                      s.id,
                    ),
                  ),
                }),
                e.jsx('tbody', {
                  className: 'divide-y divide-border',
                  children:
                    a.getRowModel().rows.length > 0
                      ? a.getRowModel().rows.map((s) =>
                          e.jsx(
                            'tr',
                            {
                              className: c(
                                'bg-background transition-colors',
                                g && 'cursor-pointer hover:bg-accent/50',
                              ),
                              onClick: () => g?.(s.original),
                              children: s.getVisibleCells().map((t) => {
                                const l = t.column.columnDef.size,
                                  o = l && l !== 150
                                return e.jsx(
                                  'td',
                                  {
                                    className: c(
                                      'px-3 py-2 text-sm text-foreground align-top overflow-hidden',
                                      !o && 'max-w-0',
                                    ),
                                    style: o ? { width: l } : void 0,
                                    children: x(t.column.columnDef.cell, t.getContext()),
                                  },
                                  t.id,
                                )
                              }),
                            },
                            s.id,
                          ),
                        )
                      : e.jsx('tr', {
                          children: e.jsx('td', {
                            colSpan: p.length,
                            className: 'h-20 text-center text-sm text-muted-foreground',
                            children: f || n('common.noResults', 'No results found.'),
                          }),
                        }),
                }),
              ],
            }),
          }),
          w &&
            a.getRowModel().rows.length > 0 &&
            e.jsxs('div', {
              className: 'flex items-center justify-between pt-1',
              children: [
                e.jsxs('div', {
                  className: 'flex items-center gap-2',
                  children: [
                    e.jsxs('p', {
                      className: 'text-xs text-muted-foreground whitespace-nowrap',
                      children: [
                        n('common.showing', 'Showing'),
                        ' ',
                        a.getState().pagination.pageIndex * a.getState().pagination.pageSize + 1,
                        ' - ',
                        Math.min(
                          (a.getState().pagination.pageIndex + 1) *
                            a.getState().pagination.pageSize,
                          u.length,
                        ),
                        ' ',
                        n('common.of', 'of'),
                        ' ',
                        u.length,
                      ],
                    }),
                    e.jsxs(pe, {
                      value: String(a.getState().pagination.pageSize),
                      onValueChange: (s) => a.setPageSize(Number(s)),
                      children: [
                        e.jsx(je, { className: 'h-7 w-[60px] text-xs', children: e.jsx(we, {}) }),
                        e.jsx(fe, {
                          children: A.map((s) =>
                            e.jsx(Ne, { value: String(s), className: 'text-xs', children: s }, s),
                          ),
                        }),
                      ],
                    }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'flex items-center gap-0.5',
                  children: [
                    e.jsx(d, {
                      variant: 'ghost',
                      size: 'icon',
                      className: 'h-7 w-7',
                      onClick: () => a.setPageIndex(0),
                      disabled: !a.getCanPreviousPage(),
                      'aria-label': n('common.firstPage', 'First page'),
                      children: r
                        ? e.jsx(P, { className: 'h-3.5 w-3.5' })
                        : e.jsx(k, { className: 'h-3.5 w-3.5' }),
                    }),
                    e.jsx(d, {
                      variant: 'ghost',
                      size: 'icon',
                      className: 'h-7 w-7',
                      onClick: () => a.previousPage(),
                      disabled: !a.getCanPreviousPage(),
                      'aria-label': n('common.previousPage', 'Previous page'),
                      children: r
                        ? e.jsx(R, { className: 'h-3.5 w-3.5' })
                        : e.jsx(z, { className: 'h-3.5 w-3.5' }),
                    }),
                    e.jsxs('span', {
                      className: 'px-1.5 text-xs text-muted-foreground whitespace-nowrap',
                      children: [
                        n('common.page', 'Page'),
                        ' ',
                        a.getState().pagination.pageIndex + 1,
                        ' /',
                        ' ',
                        a.getPageCount() || 1,
                      ],
                    }),
                    e.jsx(d, {
                      variant: 'ghost',
                      size: 'icon',
                      className: 'h-7 w-7',
                      onClick: () => a.nextPage(),
                      disabled: !a.getCanNextPage(),
                      'aria-label': n('common.nextPage', 'Next page'),
                      children: r
                        ? e.jsx(z, { className: 'h-3.5 w-3.5' })
                        : e.jsx(R, { className: 'h-3.5 w-3.5' }),
                    }),
                    e.jsx(d, {
                      variant: 'ghost',
                      size: 'icon',
                      className: 'h-7 w-7',
                      onClick: () => a.setPageIndex(a.getPageCount() - 1),
                      disabled: !a.getCanNextPage(),
                      'aria-label': n('common.lastPage', 'Last page'),
                      children: r
                        ? e.jsx(k, { className: 'h-3.5 w-3.5' })
                        : e.jsx(P, { className: 'h-3.5 w-3.5' }),
                    }),
                  ],
                }),
              ],
            }),
        ],
      })
}
export { Se as D }
//# sourceMappingURL=DataTable-C-BIRk0G.js.map
