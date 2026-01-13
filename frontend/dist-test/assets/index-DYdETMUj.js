import { u as V, r as i, j as e } from './react-vendor-Buoak6m3.js'
import { i as O } from './tanstack-vendor-BZC-rs5U.js'
import {
  B as n,
  I as D,
  q as y,
  r as w,
  t as S,
  v as C,
  w as x,
  S as H,
  d as U,
  m as k,
  e as q,
  f as J,
  g as K,
  j as X,
  l as G,
} from './index-qYY0KoZ1.js'
import { A as Q, b as W, a as Y } from './avatar-lQOCSoMx.js'
import { u as Z, I as c } from './person.types-Ck48Y8hE.js'
import {
  aS as g,
  c6 as ee,
  b9 as _,
  aE as se,
  aD as I,
  dx as ae,
  cV as te,
  aI as A,
  bx as le,
  aJ as re,
  bz as ne,
  dj as ie,
  aM as ce,
} from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function me() {
  const { t: a, i18n: P } = V('persons'),
    t = P.language === 'ar',
    f = O(),
    [r, h] = i.useState(''),
    [l, u] = i.useState('all'),
    [F, p] = i.useState(!1),
    [N, T] = i.useState('')
  i.useMemo(() => {
    const s = setTimeout(() => {
      T(r)
    }, 300)
    return () => clearTimeout(s)
  }, [r])
  const L = i.useMemo(
      () => ({ search: N || void 0, importance_level: l !== 'all' ? l : void 0, limit: 50 }),
      [N, l],
    ),
    { data: m, isLoading: d, isError: z, error: E } = Z(L),
    v = () => {
      f({ to: '/persons/create' })
    },
    M = (s) => {
      f({ to: '/persons/$personId', params: { personId: s } })
    },
    $ = (s) =>
      s
        .split(' ')
        .map((j) => j[0])
        .join('')
        .substring(0, 2)
        .toUpperCase(),
    R = (s) => {
      switch (s) {
        case 5:
          return 'bg-red-500/10 text-red-600 border-red-200'
        case 4:
          return 'bg-orange-500/10 text-orange-600 border-orange-200'
        case 3:
          return 'bg-yellow-500/10 text-yellow-600 border-yellow-200'
        case 2:
          return 'bg-blue-500/10 text-blue-600 border-blue-200'
        default:
          return 'bg-gray-500/10 text-gray-600 border-gray-200'
      }
    },
    b = () => {
      ;(h(''), u('all'), p(!1))
    },
    o = l !== 'all',
    B = m?.pagination.total || 0
  return d && !m
    ? e.jsx('div', {
        className: 'flex min-h-96 items-center justify-center',
        children: e.jsx(g, { className: 'size-8 animate-spin text-primary' }),
      })
    : z
      ? e.jsxs('div', {
          className: 'flex min-h-96 flex-col items-center justify-center gap-4',
          children: [
            e.jsx(ee, { className: 'size-12 text-destructive' }),
            e.jsxs('div', {
              className: 'text-center',
              children: [
                e.jsx('h2', {
                  className: 'text-xl font-semibold text-foreground',
                  children: a('error.title', 'Failed to load persons'),
                }),
                e.jsx('p', {
                  className: 'text-sm text-muted-foreground',
                  children:
                    E?.message || a('error.message', 'An error occurred while fetching data'),
                }),
              ],
            }),
          ],
        })
      : e.jsxs('div', {
          className: 'min-h-screen',
          dir: t ? 'rtl' : 'ltr',
          children: [
            e.jsx('header', {
              className: 'border-b bg-background sticky top-0 z-10',
              children: e.jsxs('div', {
                className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6',
                children: [
                  e.jsxs('div', {
                    className: 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
                    children: [
                      e.jsxs('div', {
                        children: [
                          e.jsx('h1', {
                            className: 'text-2xl sm:text-3xl font-bold text-start',
                            children: a('title', 'Key Contacts'),
                          }),
                          e.jsx('p', {
                            className: 'text-sm sm:text-base text-muted-foreground mt-1 text-start',
                            children: a(
                              'subtitle',
                              'Manage your network of key contacts and stakeholders',
                            ),
                          }),
                        ],
                      }),
                      e.jsxs(n, {
                        onClick: v,
                        className: 'w-full sm:w-auto',
                        children: [
                          e.jsx(_, { className: `h-4 w-4 ${t ? 'ms-2' : 'me-2'}` }),
                          a('actions.createPerson', 'Add Person'),
                        ],
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3',
                    children: [
                      e.jsxs('div', {
                        className: 'relative flex-1',
                        children: [
                          e.jsx(se, {
                            className: `absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${t ? 'end-3' : 'start-3'}`,
                          }),
                          e.jsx(D, {
                            placeholder: a('search.placeholder', 'Search by name, title, email...'),
                            value: r,
                            onChange: (s) => h(s.target.value),
                            className: `${t ? 'pe-10' : 'ps-10'} h-11`,
                          }),
                          r &&
                            e.jsx('button', {
                              onClick: () => h(''),
                              className: `absolute top-1/2 -translate-y-1/2 ${t ? 'start-3' : 'end-3'}`,
                              children: e.jsx(I, {
                                className: 'h-4 w-4 text-muted-foreground hover:text-foreground',
                              }),
                            }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'hidden sm:flex gap-2',
                        children: [
                          e.jsxs(y, {
                            value: l === 'all' ? 'all' : String(l),
                            onValueChange: (s) => u(s === 'all' ? 'all' : Number(s)),
                            children: [
                              e.jsxs(w, {
                                className: 'w-[180px] h-11',
                                children: [
                                  e.jsx(ae, { className: 'h-4 w-4 me-2 text-muted-foreground' }),
                                  e.jsx(S, { placeholder: a('filters.importance', 'Importance') }),
                                ],
                              }),
                              e.jsxs(C, {
                                children: [
                                  e.jsx(x, {
                                    value: 'all',
                                    children: a('filters.allImportance', 'All levels'),
                                  }),
                                  [5, 4, 3, 2, 1].map((s) =>
                                    e.jsx(
                                      x,
                                      { value: String(s), children: t ? c[s].ar : c[s].en },
                                      s,
                                    ),
                                  ),
                                ],
                              }),
                            ],
                          }),
                          o &&
                            e.jsxs(n, {
                              variant: 'ghost',
                              size: 'sm',
                              onClick: b,
                              children: [
                                e.jsx(I, { className: 'h-4 w-4 me-1' }),
                                a('filters.clear', 'Clear'),
                              ],
                            }),
                        ],
                      }),
                      e.jsxs(H, {
                        open: F,
                        onOpenChange: p,
                        children: [
                          e.jsx(U, {
                            asChild: !0,
                            className: 'sm:hidden',
                            children: e.jsxs(n, {
                              variant: 'outline',
                              className: 'h-11',
                              children: [
                                e.jsx(te, { className: 'h-4 w-4 me-2' }),
                                a('filters.title', 'Filters'),
                                o &&
                                  e.jsx(k, {
                                    variant: 'secondary',
                                    className: 'ms-2',
                                    children: '1',
                                  }),
                              ],
                            }),
                          }),
                          e.jsxs(q, {
                            side: t ? 'left' : 'right',
                            children: [
                              e.jsx(J, {
                                children: e.jsx(K, { children: a('filters.title', 'Filters') }),
                              }),
                              e.jsxs('div', {
                                className: 'mt-6 space-y-4',
                                children: [
                                  e.jsxs('div', {
                                    children: [
                                      e.jsx('label', {
                                        className: 'text-sm font-medium mb-2 block',
                                        children: a('filters.importance', 'Importance Level'),
                                      }),
                                      e.jsxs(y, {
                                        value: l === 'all' ? 'all' : String(l),
                                        onValueChange: (s) => u(s === 'all' ? 'all' : Number(s)),
                                        children: [
                                          e.jsx(w, { className: 'w-full', children: e.jsx(S, {}) }),
                                          e.jsxs(C, {
                                            children: [
                                              e.jsx(x, {
                                                value: 'all',
                                                children: a('filters.allImportance', 'All levels'),
                                              }),
                                              [5, 4, 3, 2, 1].map((s) =>
                                                e.jsx(
                                                  x,
                                                  {
                                                    value: String(s),
                                                    children: t ? c[s].ar : c[s].en,
                                                  },
                                                  s,
                                                ),
                                              ),
                                            ],
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  e.jsxs('div', {
                                    className: 'flex gap-2 pt-4',
                                    children: [
                                      e.jsx(n, {
                                        variant: 'outline',
                                        className: 'flex-1',
                                        onClick: b,
                                        children: a('filters.clear', 'Clear'),
                                      }),
                                      e.jsx(n, {
                                        className: 'flex-1',
                                        onClick: () => p(!1),
                                        children: a('filters.apply', 'Apply'),
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
                  e.jsxs('div', {
                    className: 'mt-4 flex items-center gap-4 text-sm text-muted-foreground',
                    children: [
                      e.jsxs('span', {
                        className: 'flex items-center gap-1',
                        children: [
                          e.jsx(A, { className: 'h-4 w-4' }),
                          a('stats.total', '{{count}} persons', { count: B }),
                        ],
                      }),
                      d && e.jsx(g, { className: 'h-4 w-4 animate-spin' }),
                    ],
                  }),
                ],
              }),
            }),
            e.jsxs('main', {
              className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6',
              children: [
                m?.data.length === 0
                  ? e.jsxs('div', {
                      className: 'flex flex-col items-center justify-center py-16 text-center',
                      children: [
                        e.jsx('div', {
                          className:
                            'h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4',
                          children: e.jsx(A, { className: 'h-8 w-8 text-primary' }),
                        }),
                        e.jsx('h3', {
                          className: 'text-lg font-semibold mb-2',
                          children:
                            r || o
                              ? a('empty.noResults', 'No persons found')
                              : a('empty.title', 'No persons yet'),
                        }),
                        e.jsx('p', {
                          className: 'text-muted-foreground max-w-md mb-6',
                          children:
                            r || o
                              ? a(
                                  'empty.noResultsDescription',
                                  'Try adjusting your search or filters',
                                )
                              : a(
                                  'empty.description',
                                  'Start building your contact network by adding key stakeholders',
                                ),
                        }),
                        !r &&
                          !o &&
                          e.jsxs(n, {
                            onClick: v,
                            children: [
                              e.jsx(_, { className: 'h-4 w-4 me-2' }),
                              a('actions.createFirst', 'Add First Person'),
                            ],
                          }),
                      ],
                    })
                  : e.jsx('div', {
                      className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
                      children: m?.data.map((s, j) =>
                        e.jsx(
                          le.div,
                          {
                            initial: { opacity: 0, y: 20 },
                            animate: { opacity: 1, y: 0 },
                            transition: { delay: j * 0.05 },
                            children: e.jsx(X, {
                              className: 'cursor-pointer hover:shadow-md transition-shadow h-full',
                              onClick: () => M(s.id),
                              children: e.jsx(G, {
                                className: 'p-4',
                                children: e.jsxs('div', {
                                  className: 'flex items-start gap-3',
                                  children: [
                                    e.jsxs(Q, {
                                      className: 'h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0',
                                      children: [
                                        e.jsx(W, { src: s.photo_url || '', alt: s.name_en }),
                                        e.jsx(Y, {
                                          className: 'bg-primary/10 text-primary font-medium',
                                          children: $(t ? s.name_ar : s.name_en),
                                        }),
                                      ],
                                    }),
                                    e.jsxs('div', {
                                      className: 'flex-1 min-w-0',
                                      children: [
                                        e.jsxs('div', {
                                          className: 'flex items-start justify-between gap-2',
                                          children: [
                                            e.jsxs('div', {
                                              className: 'min-w-0',
                                              children: [
                                                e.jsx('h3', {
                                                  className:
                                                    'font-semibold text-sm sm:text-base truncate',
                                                  children: t ? s.name_ar : s.name_en,
                                                }),
                                                (s.title_en || s.title_ar) &&
                                                  e.jsx('p', {
                                                    className:
                                                      'text-xs sm:text-sm text-muted-foreground truncate',
                                                    children: t ? s.title_ar : s.title_en,
                                                  }),
                                              ],
                                            }),
                                            e.jsx(k, {
                                              variant: 'outline',
                                              className: `text-xs flex-shrink-0 ${R(s.importance_level)}`,
                                              children: t
                                                ? c[s.importance_level].ar
                                                : c[s.importance_level].en,
                                            }),
                                          ],
                                        }),
                                        s.organization_name &&
                                          e.jsxs('div', {
                                            className:
                                              'flex items-center gap-1 mt-2 text-xs sm:text-sm text-muted-foreground',
                                            children: [
                                              e.jsx(re, { className: 'h-3 w-3 flex-shrink-0' }),
                                              e.jsx('span', {
                                                className: 'truncate',
                                                children: s.organization_name,
                                              }),
                                            ],
                                          }),
                                        e.jsxs('div', {
                                          className: 'flex flex-wrap items-center gap-3 mt-2',
                                          children: [
                                            s.email &&
                                              e.jsxs('span', {
                                                className:
                                                  'flex items-center gap-1 text-xs text-muted-foreground',
                                                children: [
                                                  e.jsx(ne, { className: 'h-3 w-3' }),
                                                  e.jsx('span', {
                                                    className: 'truncate max-w-[120px]',
                                                    children: s.email,
                                                  }),
                                                ],
                                              }),
                                            s.phone &&
                                              e.jsxs('span', {
                                                className:
                                                  'flex items-center gap-1 text-xs text-muted-foreground',
                                                children: [
                                                  e.jsx(ie, { className: 'h-3 w-3' }),
                                                  e.jsx('span', { dir: 'ltr', children: s.phone }),
                                                ],
                                              }),
                                          ],
                                        }),
                                      ],
                                    }),
                                    e.jsx(ce, {
                                      className: `h-5 w-5 text-muted-foreground flex-shrink-0 ${t ? 'rotate-180' : ''}`,
                                    }),
                                  ],
                                }),
                              }),
                            }),
                          },
                          s.id,
                        ),
                      ),
                    }),
                m?.pagination.has_more &&
                  e.jsx('div', {
                    className: 'flex justify-center mt-8',
                    children: e.jsxs(n, {
                      variant: 'outline',
                      disabled: d,
                      children: [
                        d ? e.jsx(g, { className: 'h-4 w-4 animate-spin me-2' }) : null,
                        a('actions.loadMore', 'Load More'),
                      ],
                    }),
                  }),
              ],
            }),
          ],
        })
}
const ye = me
export { ye as component }
//# sourceMappingURL=index-DYdETMUj.js.map
