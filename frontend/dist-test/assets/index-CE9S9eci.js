import { u as ae, r, j as e } from './react-vendor-Buoak6m3.js'
import { i as te } from './tanstack-vendor-BZC-rs5U.js'
import {
  B as o,
  I as le,
  q as u,
  r as g,
  t as p,
  v as j,
  w as l,
  S as re,
  d as ne,
  m as k,
  e as ie,
  f as ce,
  g as oe,
  j as me,
  l as de,
} from './index-qYY0KoZ1.js'
import { u as xe, E as d, a as x, b as y } from './engagement.types-DPrd-U1W.js'
import {
  aS as A,
  c6 as he,
  b9 as z,
  aE as ue,
  aD as P,
  aR as f,
  cV as ge,
  bx as pe,
  cG as je,
  cj as fe,
  aI as O,
  aM as Ne,
  aJ as ve,
  aK as ye,
} from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function be() {
  const { t: a, i18n: U } = ae('engagements'),
    t = U.language === 'ar',
    F = te(),
    [n, b] = r.useState(''),
    [i, w] = r.useState('all'),
    [m, L] = r.useState('all'),
    [c, S] = r.useState('all'),
    [H, C] = r.useState(!1),
    [D, Y] = r.useState('')
  r.useMemo(() => {
    const s = setTimeout(() => {
      Y(n)
    }, 300)
    return () => clearTimeout(s)
  }, [n])
  const q = r.useMemo(
      () => ({
        search: D || void 0,
        engagement_type: i !== 'all' ? i : void 0,
        engagement_category: m !== 'all' ? m : void 0,
        engagement_status: c !== 'all' ? c : void 0,
        limit: 50,
      }),
      [D, i, m, c],
    ),
    { data: h, isLoading: N, isError: J, error: K } = xe(q),
    M = () => {
      F({ to: '/engagements/create' })
    },
    X = (s) => {
      F({ to: '/engagements/$engagementId', params: { engagementId: s } })
    },
    Q = (s) => {
      switch (s) {
        case 'completed':
          return 'bg-green-500/10 text-green-600 border-green-200'
        case 'in_progress':
          return 'bg-blue-500/10 text-blue-600 border-blue-200'
        case 'confirmed':
          return 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
        case 'planned':
          return 'bg-yellow-500/10 text-yellow-600 border-yellow-200'
        case 'postponed':
          return 'bg-orange-500/10 text-orange-600 border-orange-200'
        case 'cancelled':
          return 'bg-red-500/10 text-red-600 border-red-200'
        default:
          return 'bg-gray-500/10 text-gray-600 border-gray-200'
      }
    },
    W = (s) => {
      switch (s) {
        case 'bilateral_meeting':
        case 'consultation':
          return e.jsx(O, { className: 'h-4 w-4' })
        case 'mission':
        case 'delegation':
        case 'official_visit':
          return e.jsx(ye, { className: 'h-4 w-4' })
        case 'summit':
          return e.jsx(ve, { className: 'h-4 w-4' })
        default:
          return e.jsx(f, { className: 'h-4 w-4' })
      }
    },
    Z = (s, _) => {
      const E = new Date(s),
        B = new Date(_),
        I = { month: 'short', day: 'numeric', year: 'numeric' },
        T = t ? 'ar-SA' : 'en-US'
      return E.toDateString() === B.toDateString()
        ? E.toLocaleDateString(T, I)
        : `${E.toLocaleDateString(T, { month: 'short', day: 'numeric' })} - ${B.toLocaleDateString(T, I)}`
    },
    G = () => {
      ;(b(''), w('all'), L('all'), S('all'), C(!1))
    },
    v = i !== 'all' || m !== 'all' || c !== 'all',
    V = [i, m, c].filter((s) => s !== 'all').length,
    ee = h?.pagination.total || 0,
    $ = [
      'bilateral_meeting',
      'mission',
      'delegation',
      'summit',
      'working_group',
      'roundtable',
      'official_visit',
      'consultation',
      'other',
    ],
    se = [
      'diplomatic',
      'statistical',
      'technical',
      'economic',
      'cultural',
      'educational',
      'research',
      'other',
    ],
    R = ['planned', 'confirmed', 'in_progress', 'completed', 'postponed', 'cancelled']
  return N && !h
    ? e.jsx('div', {
        className: 'flex min-h-96 items-center justify-center',
        children: e.jsx(A, { className: 'size-8 animate-spin text-primary' }),
      })
    : J
      ? e.jsxs('div', {
          className: 'flex min-h-96 flex-col items-center justify-center gap-4',
          children: [
            e.jsx(he, { className: 'size-12 text-destructive' }),
            e.jsxs('div', {
              className: 'text-center',
              children: [
                e.jsx('h2', {
                  className: 'text-xl font-semibold text-foreground',
                  children: a('error.title', 'Failed to load engagements'),
                }),
                e.jsx('p', {
                  className: 'text-sm text-muted-foreground',
                  children:
                    K?.message || a('error.message', 'An error occurred while fetching data'),
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
                            children: a('title', 'Engagements'),
                          }),
                          e.jsx('p', {
                            className: 'text-sm sm:text-base text-muted-foreground mt-1 text-start',
                            children: a(
                              'subtitle',
                              'Manage bilateral meetings, missions, and delegations',
                            ),
                          }),
                        ],
                      }),
                      e.jsxs(o, {
                        onClick: M,
                        className: 'w-full sm:w-auto',
                        children: [
                          e.jsx(z, { className: `h-4 w-4 ${t ? 'ms-2' : 'me-2'}` }),
                          a('actions.createEngagement', 'New Engagement'),
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
                          e.jsx(ue, {
                            className: `absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${t ? 'end-3' : 'start-3'}`,
                          }),
                          e.jsx(le, {
                            placeholder: a('search.placeholder', 'Search engagements...'),
                            value: n,
                            onChange: (s) => b(s.target.value),
                            className: `${t ? 'pe-10' : 'ps-10'} h-11`,
                          }),
                          n &&
                            e.jsx('button', {
                              onClick: () => b(''),
                              className: `absolute top-1/2 -translate-y-1/2 ${t ? 'start-3' : 'end-3'}`,
                              children: e.jsx(P, {
                                className: 'h-4 w-4 text-muted-foreground hover:text-foreground',
                              }),
                            }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'hidden sm:flex gap-2',
                        children: [
                          e.jsxs(u, {
                            value: i,
                            onValueChange: (s) => w(s),
                            children: [
                              e.jsxs(g, {
                                className: 'w-[180px] h-11',
                                children: [
                                  e.jsx(f, { className: 'h-4 w-4 me-2 text-muted-foreground' }),
                                  e.jsx(p, { placeholder: a('filters.type', 'Type') }),
                                ],
                              }),
                              e.jsxs(j, {
                                children: [
                                  e.jsx(l, {
                                    value: 'all',
                                    children: a('filters.allTypes', 'All types'),
                                  }),
                                  $.map((s) =>
                                    e.jsx(l, { value: s, children: t ? d[s].ar : d[s].en }, s),
                                  ),
                                ],
                              }),
                            ],
                          }),
                          e.jsxs(u, {
                            value: c,
                            onValueChange: (s) => S(s),
                            children: [
                              e.jsx(g, {
                                className: 'w-[160px] h-11',
                                children: e.jsx(p, { placeholder: a('filters.status', 'Status') }),
                              }),
                              e.jsxs(j, {
                                children: [
                                  e.jsx(l, {
                                    value: 'all',
                                    children: a('filters.allStatuses', 'All statuses'),
                                  }),
                                  R.map((s) =>
                                    e.jsx(l, { value: s, children: t ? x[s].ar : x[s].en }, s),
                                  ),
                                ],
                              }),
                            ],
                          }),
                          v &&
                            e.jsxs(o, {
                              variant: 'ghost',
                              size: 'sm',
                              onClick: G,
                              children: [
                                e.jsx(P, { className: 'h-4 w-4 me-1' }),
                                a('filters.clear', 'Clear'),
                              ],
                            }),
                        ],
                      }),
                      e.jsxs(re, {
                        open: H,
                        onOpenChange: C,
                        children: [
                          e.jsx(ne, {
                            asChild: !0,
                            className: 'sm:hidden',
                            children: e.jsxs(o, {
                              variant: 'outline',
                              className: 'h-11',
                              children: [
                                e.jsx(ge, { className: 'h-4 w-4 me-2' }),
                                a('filters.title', 'Filters'),
                                V > 0 &&
                                  e.jsx(k, {
                                    variant: 'secondary',
                                    className: 'ms-2',
                                    children: V,
                                  }),
                              ],
                            }),
                          }),
                          e.jsxs(ie, {
                            side: t ? 'left' : 'right',
                            children: [
                              e.jsx(ce, {
                                children: e.jsx(oe, { children: a('filters.title', 'Filters') }),
                              }),
                              e.jsxs('div', {
                                className: 'mt-6 space-y-4',
                                children: [
                                  e.jsxs('div', {
                                    children: [
                                      e.jsx('label', {
                                        className: 'text-sm font-medium mb-2 block',
                                        children: a('filters.type', 'Engagement Type'),
                                      }),
                                      e.jsxs(u, {
                                        value: i,
                                        onValueChange: (s) => w(s),
                                        children: [
                                          e.jsx(g, { className: 'w-full', children: e.jsx(p, {}) }),
                                          e.jsxs(j, {
                                            children: [
                                              e.jsx(l, {
                                                value: 'all',
                                                children: a('filters.allTypes', 'All types'),
                                              }),
                                              $.map((s) =>
                                                e.jsx(
                                                  l,
                                                  { value: s, children: t ? d[s].ar : d[s].en },
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
                                    children: [
                                      e.jsx('label', {
                                        className: 'text-sm font-medium mb-2 block',
                                        children: a('filters.category', 'Category'),
                                      }),
                                      e.jsxs(u, {
                                        value: m,
                                        onValueChange: (s) => L(s),
                                        children: [
                                          e.jsx(g, { className: 'w-full', children: e.jsx(p, {}) }),
                                          e.jsxs(j, {
                                            children: [
                                              e.jsx(l, {
                                                value: 'all',
                                                children: a(
                                                  'filters.allCategories',
                                                  'All categories',
                                                ),
                                              }),
                                              se.map((s) =>
                                                e.jsx(
                                                  l,
                                                  { value: s, children: t ? y[s].ar : y[s].en },
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
                                    children: [
                                      e.jsx('label', {
                                        className: 'text-sm font-medium mb-2 block',
                                        children: a('filters.status', 'Status'),
                                      }),
                                      e.jsxs(u, {
                                        value: c,
                                        onValueChange: (s) => S(s),
                                        children: [
                                          e.jsx(g, { className: 'w-full', children: e.jsx(p, {}) }),
                                          e.jsxs(j, {
                                            children: [
                                              e.jsx(l, {
                                                value: 'all',
                                                children: a('filters.allStatuses', 'All statuses'),
                                              }),
                                              R.map((s) =>
                                                e.jsx(
                                                  l,
                                                  { value: s, children: t ? x[s].ar : x[s].en },
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
                                      e.jsx(o, {
                                        variant: 'outline',
                                        className: 'flex-1',
                                        onClick: G,
                                        children: a('filters.clear', 'Clear'),
                                      }),
                                      e.jsx(o, {
                                        className: 'flex-1',
                                        onClick: () => C(!1),
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
                          e.jsx(f, { className: 'h-4 w-4' }),
                          a('stats.total', '{{count}} engagements', { count: ee }),
                        ],
                      }),
                      N && e.jsx(A, { className: 'h-4 w-4 animate-spin' }),
                    ],
                  }),
                ],
              }),
            }),
            e.jsxs('main', {
              className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6',
              children: [
                h?.data.length === 0
                  ? e.jsxs('div', {
                      className: 'flex flex-col items-center justify-center py-16 text-center',
                      children: [
                        e.jsx('div', {
                          className:
                            'h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4',
                          children: e.jsx(f, { className: 'h-8 w-8 text-primary' }),
                        }),
                        e.jsx('h3', {
                          className: 'text-lg font-semibold mb-2',
                          children:
                            n || v
                              ? a('empty.noResults', 'No engagements found')
                              : a('empty.title', 'No engagements yet'),
                        }),
                        e.jsx('p', {
                          className: 'text-muted-foreground max-w-md mb-6',
                          children:
                            n || v
                              ? a(
                                  'empty.noResultsDescription',
                                  'Try adjusting your search or filters',
                                )
                              : a(
                                  'empty.description',
                                  'Schedule your first bilateral meeting, mission, or delegation',
                                ),
                        }),
                        !n &&
                          !v &&
                          e.jsxs(o, {
                            onClick: M,
                            children: [
                              e.jsx(z, { className: 'h-4 w-4 me-2' }),
                              a('actions.createFirst', 'Create First Engagement'),
                            ],
                          }),
                      ],
                    })
                  : e.jsx('div', {
                      className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
                      children: h?.data.map((s, _) =>
                        e.jsx(
                          pe.div,
                          {
                            initial: { opacity: 0, y: 20 },
                            animate: { opacity: 1, y: 0 },
                            transition: { delay: _ * 0.05 },
                            children: e.jsx(me, {
                              className: 'cursor-pointer hover:shadow-md transition-shadow h-full',
                              onClick: () => X(s.id),
                              children: e.jsx(de, {
                                className: 'p-4',
                                children: e.jsxs('div', {
                                  className: 'flex items-start gap-3',
                                  children: [
                                    e.jsx('div', {
                                      className:
                                        'h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0',
                                      children: W(s.engagement_type),
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
                                                e.jsx('p', {
                                                  className:
                                                    'text-xs sm:text-sm text-muted-foreground truncate',
                                                  children: t
                                                    ? d[s.engagement_type].ar
                                                    : d[s.engagement_type].en,
                                                }),
                                              ],
                                            }),
                                            e.jsx(k, {
                                              variant: 'outline',
                                              className: `text-xs flex-shrink-0 ${Q(s.engagement_status)}`,
                                              children: t
                                                ? x[s.engagement_status].ar
                                                : x[s.engagement_status].en,
                                            }),
                                          ],
                                        }),
                                        e.jsxs('div', {
                                          className:
                                            'flex items-center gap-1 mt-2 text-xs sm:text-sm text-muted-foreground',
                                          children: [
                                            e.jsx(f, { className: 'h-3 w-3 flex-shrink-0' }),
                                            e.jsx('span', {
                                              children: Z(s.start_date, s.end_date),
                                            }),
                                          ],
                                        }),
                                        e.jsxs('div', {
                                          className: 'flex flex-wrap items-center gap-3 mt-2',
                                          children: [
                                            s.is_virtual
                                              ? e.jsxs('span', {
                                                  className:
                                                    'flex items-center gap-1 text-xs text-muted-foreground',
                                                  children: [
                                                    e.jsx(je, { className: 'h-3 w-3' }),
                                                    a('card.virtual', 'Virtual'),
                                                  ],
                                                })
                                              : (s.location_en || s.location_ar) &&
                                                e.jsxs('span', {
                                                  className:
                                                    'flex items-center gap-1 text-xs text-muted-foreground',
                                                  children: [
                                                    e.jsx(fe, { className: 'h-3 w-3' }),
                                                    e.jsx('span', {
                                                      className: 'truncate max-w-[120px]',
                                                      children: t ? s.location_ar : s.location_en,
                                                    }),
                                                  ],
                                                }),
                                            s.participant_count > 0 &&
                                              e.jsxs('span', {
                                                className:
                                                  'flex items-center gap-1 text-xs text-muted-foreground',
                                                children: [
                                                  e.jsx(O, { className: 'h-3 w-3' }),
                                                  a('card.participants', '{{count}} participants', {
                                                    count: s.participant_count,
                                                  }),
                                                ],
                                              }),
                                          ],
                                        }),
                                        e.jsx('div', {
                                          className: 'mt-2',
                                          children: e.jsx(k, {
                                            variant: 'secondary',
                                            className: 'text-xs',
                                            children: t
                                              ? y[s.engagement_category].ar
                                              : y[s.engagement_category].en,
                                          }),
                                        }),
                                      ],
                                    }),
                                    e.jsx(Ne, {
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
                h?.pagination.has_more &&
                  e.jsx('div', {
                    className: 'flex justify-center mt-8',
                    children: e.jsxs(o, {
                      variant: 'outline',
                      disabled: N,
                      children: [
                        N ? e.jsx(A, { className: 'h-4 w-4 animate-spin me-2' }) : null,
                        a('actions.loadMore', 'Load More'),
                      ],
                    }),
                  }),
              ],
            }),
          ],
        })
}
const Me = be
export { Me as component }
//# sourceMappingURL=index-CE9S9eci.js.map
