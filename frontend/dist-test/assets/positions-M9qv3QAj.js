import { j as s, u as A, r as i } from './react-vendor-Buoak6m3.js'
import { O as H } from './tanstack-vendor-BZC-rs5U.js'
import {
  a3 as V,
  Y as M,
  a4 as Q,
  B as D,
  j as n,
  k as c,
  V as u,
  l as d,
  o as R,
  I as z,
  q as g,
  r as v,
  t as N,
  v as f,
  w as a,
  a5 as Y,
  a6 as $,
} from './index-qYY0KoZ1.js'
import { aH as G, b9 as J, aE as K } from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function os() {
  const { t: e } = A(['positions', 'common']),
    _ = V.useNavigate(),
    l = V.useSearch(),
    [j, S] = i.useState(l.search || ''),
    [x, w] = i.useState(l.status || 'all'),
    [p, C] = i.useState(l.type || 'all'),
    [m, I] = i.useState(l.sort || 'updated_at'),
    [B, U] = i.useState(l.order || 'desc'),
    [k, F] = i.useState(!1),
    E = M(j, 300),
    {
      data: y,
      isLoading: O,
      error: b,
    } = Q({
      search: E,
      status: x === 'all' ? void 0 : x,
      type: p === 'all' ? void 0 : p,
      sort: m,
      order: B,
    }),
    q = i.useMemo(() => y?.pages?.[0]?.data || [], [y]),
    P = y?.pages?.[0]?.total || 0,
    h = { total: P, byStatus: {} },
    o = (t) => {
      _({ search: { ...l, ...t }, replace: !0 })
    },
    L = () => {
      ;(S(''), w('all'), C('all'), o({ search: void 0, status: void 0, type: void 0 }))
    },
    T = j || x !== 'all' || p !== 'all' || m !== 'updated_at'
  return s.jsxs('div', {
    className: 'min-h-screen bg-gray-50 dark:bg-gray-900',
    children: [
      s.jsx('div', {
        className: 'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700',
        children: s.jsxs('div', {
          className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
          children: [
            s.jsxs('div', {
              className: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
              children: [
                s.jsxs('div', {
                  className: 'space-y-1',
                  children: [
                    s.jsxs('h1', {
                      className:
                        'text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3',
                      children: [s.jsx(G, { className: 'h-8 w-8' }), e('positions:library.title')],
                    }),
                    s.jsx('p', {
                      className: 'text-gray-500 dark:text-gray-400',
                      children: e('positions:library.subtitle', { count: P }),
                    }),
                  ],
                }),
                s.jsxs(D, {
                  onClick: () => F(!0),
                  className: 'gap-2',
                  children: [
                    s.jsx(J, { className: 'h-5 w-5' }),
                    e('positions:library.create_position'),
                  ],
                }),
              ],
            }),
            s.jsxs('div', {
              className: 'mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4',
              children: [
                s.jsxs(n, {
                  children: [
                    s.jsx(c, {
                      className: 'pb-2',
                      children: s.jsx(u, {
                        className: 'text-xs',
                        children: e('positions:library.stats.total'),
                      }),
                    }),
                    s.jsx(d, {
                      children: s.jsx('div', {
                        className: 'text-2xl font-bold',
                        children: h.total,
                      }),
                    }),
                  ],
                }),
                s.jsxs(n, {
                  children: [
                    s.jsx(c, {
                      className: 'pb-2',
                      children: s.jsx(u, {
                        className: 'text-xs',
                        children: e('positions:library.stats.published'),
                      }),
                    }),
                    s.jsx(d, {
                      children: s.jsx('div', {
                        className: 'text-2xl font-bold text-green-600 dark:text-green-400',
                        children: h.byStatus?.published || 0,
                      }),
                    }),
                  ],
                }),
                s.jsxs(n, {
                  children: [
                    s.jsx(c, {
                      className: 'pb-2',
                      children: s.jsx(u, {
                        className: 'text-xs',
                        children: e('positions:library.stats.in_review'),
                      }),
                    }),
                    s.jsx(d, {
                      children: s.jsx('div', {
                        className: 'text-2xl font-bold text-yellow-600 dark:text-yellow-400',
                        children: h.byStatus?.review || 0,
                      }),
                    }),
                  ],
                }),
                s.jsxs(n, {
                  children: [
                    s.jsx(c, {
                      className: 'pb-2',
                      children: s.jsx(u, {
                        className: 'text-xs',
                        children: e('positions:library.stats.drafts'),
                      }),
                    }),
                    s.jsx(d, {
                      children: s.jsx('div', {
                        className: 'text-2xl font-bold text-gray-600 dark:text-gray-400',
                        children: h.byStatus?.draft || 0,
                      }),
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      s.jsxs('main', {
        className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
        children: [
          s.jsxs(n, {
            className: 'mb-6',
            children: [
              s.jsx(c, {
                children: s.jsxs(R, {
                  className: 'flex items-center gap-2',
                  children: [
                    s.jsx(K, { className: 'h-5 w-5' }),
                    e('positions:library.search_and_filter'),
                  ],
                }),
              }),
              s.jsxs(d, {
                children: [
                  s.jsxs('div', {
                    className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4',
                    children: [
                      s.jsx('div', {
                        className: 'lg:col-span-2',
                        children: s.jsx(z, {
                          type: 'search',
                          placeholder: e('positions:library.search_placeholder'),
                          value: j,
                          onChange: (t) => {
                            ;(S(t.target.value), o({ search: t.target.value || void 0 }))
                          },
                          className: 'w-full',
                          'aria-label': e('positions:library.search_label'),
                        }),
                      }),
                      s.jsx('div', {
                        children: s.jsxs(g, {
                          value: x,
                          onValueChange: (t) => {
                            const r = t
                            ;(w(r), o({ status: r === 'all' ? void 0 : r }))
                          },
                          children: [
                            s.jsx(v, {
                              'aria-label': e('positions:library.status_filter'),
                              children: s.jsx(N, {
                                placeholder: e('positions:library.all_statuses'),
                              }),
                            }),
                            s.jsxs(f, {
                              children: [
                                s.jsx(a, {
                                  value: 'all',
                                  children: e('positions:library.all_statuses'),
                                }),
                                s.jsx(a, { value: 'draft', children: e('positions:status.draft') }),
                                s.jsx(a, {
                                  value: 'review',
                                  children: e('positions:status.review'),
                                }),
                                s.jsx(a, {
                                  value: 'approved',
                                  children: e('positions:status.approved'),
                                }),
                                s.jsx(a, {
                                  value: 'published',
                                  children: e('positions:status.published'),
                                }),
                                s.jsx(a, {
                                  value: 'archived',
                                  children: e('positions:status.archived'),
                                }),
                              ],
                            }),
                          ],
                        }),
                      }),
                      s.jsx('div', {
                        children: s.jsxs(g, {
                          value: p,
                          onValueChange: (t) => {
                            const r = t
                            ;(C(r), o({ type: r === 'all' ? void 0 : r }))
                          },
                          children: [
                            s.jsx(v, {
                              'aria-label': e('positions:library.type_filter'),
                              children: s.jsx(N, { placeholder: e('positions:library.all_types') }),
                            }),
                            s.jsxs(f, {
                              children: [
                                s.jsx(a, {
                                  value: 'all',
                                  children: e('positions:library.all_types'),
                                }),
                                s.jsx(a, {
                                  value: 'statement',
                                  children: e('positions:type.statement'),
                                }),
                                s.jsx(a, { value: 'brief', children: e('positions:type.brief') }),
                                s.jsx(a, {
                                  value: 'talking_points',
                                  children: e('positions:type.talking_points'),
                                }),
                                s.jsx(a, {
                                  value: 'q_and_a',
                                  children: e('positions:type.q_and_a'),
                                }),
                                s.jsx(a, {
                                  value: 'guidance',
                                  children: e('positions:type.guidance'),
                                }),
                              ],
                            }),
                          ],
                        }),
                      }),
                      s.jsx('div', {
                        children: s.jsxs(g, {
                          value: m,
                          onValueChange: (t) => {
                            ;(I(t), o({ sort: t }))
                          },
                          children: [
                            s.jsx(v, {
                              'aria-label': e('positions:library.sort_by'),
                              children: s.jsx(N, {}),
                            }),
                            s.jsxs(f, {
                              children: [
                                s.jsx(a, {
                                  value: 'updated_at',
                                  children: e('positions:library.sort.updated'),
                                }),
                                s.jsx(a, {
                                  value: 'created_at',
                                  children: e('positions:library.sort.created'),
                                }),
                                s.jsx(a, {
                                  value: 'title',
                                  children: e('positions:library.sort.title'),
                                }),
                                s.jsx(a, {
                                  value: 'popularity',
                                  children: e('positions:library.sort.popularity'),
                                }),
                              ],
                            }),
                          ],
                        }),
                      }),
                    ],
                  }),
                  T &&
                    s.jsx('div', {
                      className: 'mt-4 flex justify-end',
                      children: s.jsx(D, {
                        variant: 'ghost',
                        size: 'sm',
                        onClick: L,
                        'aria-label': e('positions:library.clear_filters'),
                        children: e('common:clear_filters'),
                      }),
                    }),
                ],
              }),
            ],
          }),
          b
            ? s.jsx('div', {
                className:
                  'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center',
                role: 'alert',
                children: s.jsx('p', {
                  className: 'text-sm text-red-700 dark:text-red-300',
                  children: b instanceof Error ? b.message : e('positions:library.error_loading'),
                }),
              })
            : s.jsx(Y, {
                positions: q,
                isLoading: O,
                context: 'library',
                layout: 'grid',
                onPositionClick: (t) => {
                  _({ to: '/positions/$positionId', params: { positionId: t.id } })
                },
                emptyMessage: e(
                  T ? 'positions:library.no_results' : 'positions:library.no_positions',
                ),
              }),
        ],
      }),
      k && s.jsx($, { open: k, onClose: () => F(!1), context: 'library' }),
    ],
  })
}
const ns = () => s.jsx(H, {})
export { os as PositionsLibraryPage, ns as component }
//# sourceMappingURL=positions-M9qv3QAj.js.map
