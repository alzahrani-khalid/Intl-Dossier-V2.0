import { u as z, r as m, j as e } from './react-vendor-Buoak6m3.js'
import { i as B } from './tanstack-vendor-BZC-rs5U.js'
import {
  j as h,
  l as u,
  c as a,
  I as V,
  B as p,
  q,
  r as H,
  t as Q,
  v as U,
  w as o,
  ah as C,
  ai as F,
  aj as P,
  ak as T,
  m as A,
  a2 as J,
} from './index-qYY0KoZ1.js'
import { u as X } from './useInteractions-BJmtWgB5.js'
import {
  aE as I,
  b8 as G,
  aD as K,
  aR as v,
  aS as O,
  aH as b,
  bV as W,
  aI as Y,
  dj as Z,
  bz as ee,
} from './vendor-misc-BiJvMP0A.js'
import { H as j, I as te, J as se } from './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function ae(t) {
  switch (t) {
    case 'meeting':
      return v
    case 'email':
      return ee
    case 'call':
      return Z
    case 'conference':
      return Y
    default:
      return b
  }
}
function re(t) {
  switch (t) {
    case 'meeting':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'email':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'call':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 'conference':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
}
function ce({ note: t, isRTL: f, locale: s, onNavigate: d }) {
  const { t: x } = z('contacts'),
    l = ae(t.type),
    y = j(new Date(t.date), 'PPP', { locale: s }),
    i = t.details.length > 200 ? `${t.details.substring(0, 200)}...` : t.details
  return e.jsx(h, {
    className: 'hover:shadow-md transition-shadow',
    children: e.jsx(u, {
      className: 'p-4',
      children: e.jsxs('div', {
        className: 'flex flex-col gap-3',
        children: [
          e.jsxs('div', {
            className: 'flex flex-wrap items-center gap-2',
            children: [
              e.jsxs('div', {
                className: 'flex items-center gap-2 flex-1 min-w-0',
                children: [
                  e.jsx('div', {
                    className: a(
                      'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                      'bg-primary/10 text-primary',
                    ),
                    children: e.jsx(l, { className: 'w-4 h-4' }),
                  }),
                  e.jsxs('div', {
                    className: 'flex flex-col gap-1 min-w-0',
                    children: [
                      e.jsx(A, {
                        variant: 'secondary',
                        className: a('w-fit text-xs', re(t.type)),
                        children: x(`contactDirectory.interactions.types.${t.type}`),
                      }),
                      e.jsx('span', { className: 'text-xs text-muted-foreground', children: y }),
                    ],
                  }),
                ],
              }),
              e.jsxs(p, {
                variant: 'outline',
                size: 'sm',
                onClick: () => d(t.contact_id),
                className: 'h-8 text-xs',
                children: [
                  e.jsx(W, { className: a('w-3 h-3', f ? 'ms-1' : 'me-1') }),
                  x('contactDirectory.interactions.view_contact'),
                ],
              }),
            ],
          }),
          t.contact &&
            e.jsxs('div', {
              className: 'flex flex-col gap-1',
              children: [
                e.jsx('p', {
                  className: 'font-medium text-sm text-start',
                  children: t.contact.full_name,
                }),
                t.contact.organization &&
                  e.jsx('p', {
                    className: 'text-xs text-muted-foreground text-start',
                    children: t.contact.organization.name,
                  }),
              ],
            }),
          e.jsx(J, {}),
          e.jsx('p', {
            className: 'text-sm text-muted-foreground text-start whitespace-pre-wrap',
            children: i,
          }),
          t.attachments &&
            t.attachments.length > 0 &&
            e.jsxs('div', {
              className: 'flex items-center gap-1 text-xs text-muted-foreground',
              children: [
                e.jsx(b, { className: 'w-3 h-3' }),
                e.jsx('span', {
                  children: x('contactDirectory.interactions.attachments_count', {
                    count: t.attachments.length,
                  }),
                }),
              ],
            }),
        ],
      }),
    }),
  })
}
function ne() {
  const { t, i18n: f } = z('contacts'),
    s = f.language === 'ar',
    d = s ? te : se,
    x = B(),
    [l, y] = m.useState(''),
    [i, w] = m.useState('all'),
    [r, D] = m.useState(void 0),
    [c, S] = m.useState(void 0),
    [_, M] = m.useState(!1),
    E = {
      query: l || void 0,
      type: i !== 'all' ? i : void 0,
      date_from: r ? j(r, 'yyyy-MM-dd') : void 0,
      date_to: c ? j(c, 'yyyy-MM-dd') : void 0,
      limit: 50,
    },
    { data: g, isLoading: L, error: k } = X(E, { enabled: !!l || i !== 'all' || !!r || !!c }),
    R = () => {
      ;(w('all'), D(void 0), S(void 0))
    },
    N = i !== 'all' || r || c,
    $ = (n) => {
      x({ to: '/contacts/$contactId', params: { contactId: n } })
    }
  return e.jsx('div', {
    className: 'min-h-screen',
    dir: s ? 'rtl' : 'ltr',
    children: e.jsxs('div', {
      className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6',
      children: [
        e.jsxs('div', {
          className: 'mb-6',
          children: [
            e.jsx('h1', {
              className: 'text-2xl sm:text-3xl font-bold mb-2 text-start',
              children: t('contactDirectory.interactions.search.title'),
            }),
            e.jsx('p', {
              className: 'text-sm text-muted-foreground text-start',
              children: t('contactDirectory.interactions.search.description'),
            }),
          ],
        }),
        e.jsx(h, {
          className: 'mb-6',
          children: e.jsx(u, {
            className: 'p-4',
            children: e.jsxs('div', {
              className: 'flex flex-col gap-4',
              children: [
                e.jsxs('div', {
                  className: 'flex gap-2',
                  children: [
                    e.jsxs('div', {
                      className: 'relative flex-1',
                      children: [
                        e.jsx(I, {
                          className: a(
                            'absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground',
                            s ? 'right-3' : 'left-3',
                          ),
                        }),
                        e.jsx(V, {
                          type: 'text',
                          placeholder: t('contactDirectory.interactions.search.placeholder'),
                          value: l,
                          onChange: (n) => y(n.target.value),
                          className: a('h-11', s ? 'pr-10' : 'pl-10'),
                        }),
                      ],
                    }),
                    e.jsx(p, {
                      variant: 'outline',
                      size: 'icon',
                      onClick: () => M(!_),
                      className: a('h-11 w-11', N && 'border-primary'),
                      children: e.jsx(G, { className: 'w-4 h-4' }),
                    }),
                  ],
                }),
                _ &&
                  e.jsxs('div', {
                    className: 'space-y-4 pt-4 border-t',
                    children: [
                      e.jsxs('div', {
                        className: 'flex items-center justify-between',
                        children: [
                          e.jsx('h3', {
                            className: 'text-sm font-medium',
                            children: t('contactDirectory.interactions.search.filters'),
                          }),
                          N &&
                            e.jsxs(p, {
                              variant: 'ghost',
                              size: 'sm',
                              onClick: R,
                              className: 'h-8 text-xs',
                              children: [
                                e.jsx(K, { className: a('w-3 h-3', s ? 'ms-1' : 'me-1') }),
                                t('contactDirectory.interactions.search.clear_filters'),
                              ],
                            }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'grid grid-cols-1 sm:grid-cols-3 gap-4',
                        children: [
                          e.jsxs('div', {
                            children: [
                              e.jsx('label', {
                                className: 'text-xs font-medium mb-1.5 block text-start',
                                children: t('contactDirectory.interactions.search.type_filter'),
                              }),
                              e.jsxs(q, {
                                value: i,
                                onValueChange: w,
                                children: [
                                  e.jsx(H, { className: 'h-10', children: e.jsx(Q, {}) }),
                                  e.jsxs(U, {
                                    children: [
                                      e.jsx(o, {
                                        value: 'all',
                                        children: t(
                                          'contactDirectory.interactions.search.all_types',
                                        ),
                                      }),
                                      e.jsx(o, {
                                        value: 'meeting',
                                        children: t('contactDirectory.interactions.types.meeting'),
                                      }),
                                      e.jsx(o, {
                                        value: 'email',
                                        children: t('contactDirectory.interactions.types.email'),
                                      }),
                                      e.jsx(o, {
                                        value: 'call',
                                        children: t('contactDirectory.interactions.types.call'),
                                      }),
                                      e.jsx(o, {
                                        value: 'conference',
                                        children: t(
                                          'contactDirectory.interactions.types.conference',
                                        ),
                                      }),
                                      e.jsx(o, {
                                        value: 'other',
                                        children: t('contactDirectory.interactions.types.other'),
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                          e.jsxs('div', {
                            children: [
                              e.jsx('label', {
                                className: 'text-xs font-medium mb-1.5 block text-start',
                                children: t('contactDirectory.interactions.search.date_from'),
                              }),
                              e.jsxs(C, {
                                children: [
                                  e.jsx(F, {
                                    asChild: !0,
                                    children: e.jsxs(p, {
                                      variant: 'outline',
                                      className: a(
                                        'w-full h-10 justify-start text-start font-normal',
                                        !r && 'text-muted-foreground',
                                      ),
                                      children: [
                                        e.jsx(v, { className: a('h-4 w-4', s ? 'ms-2' : 'me-2') }),
                                        r
                                          ? j(r, 'PP', { locale: d })
                                          : e.jsx('span', {
                                              children: t(
                                                'contactDirectory.interactions.search.select_date',
                                              ),
                                            }),
                                      ],
                                    }),
                                  }),
                                  e.jsx(P, {
                                    className: 'w-auto p-0',
                                    align: s ? 'end' : 'start',
                                    children: e.jsx(T, {
                                      mode: 'single',
                                      selected: r,
                                      onSelect: D,
                                      initialFocus: !0,
                                    }),
                                  }),
                                ],
                              }),
                            ],
                          }),
                          e.jsxs('div', {
                            children: [
                              e.jsx('label', {
                                className: 'text-xs font-medium mb-1.5 block text-start',
                                children: t('contactDirectory.interactions.search.date_to'),
                              }),
                              e.jsxs(C, {
                                children: [
                                  e.jsx(F, {
                                    asChild: !0,
                                    children: e.jsxs(p, {
                                      variant: 'outline',
                                      className: a(
                                        'w-full h-10 justify-start text-start font-normal',
                                        !c && 'text-muted-foreground',
                                      ),
                                      children: [
                                        e.jsx(v, { className: a('h-4 w-4', s ? 'ms-2' : 'me-2') }),
                                        c
                                          ? j(c, 'PP', { locale: d })
                                          : e.jsx('span', {
                                              children: t(
                                                'contactDirectory.interactions.search.select_date',
                                              ),
                                            }),
                                      ],
                                    }),
                                  }),
                                  e.jsx(P, {
                                    className: 'w-auto p-0',
                                    align: s ? 'end' : 'start',
                                    children: e.jsx(T, {
                                      mode: 'single',
                                      selected: c,
                                      onSelect: S,
                                      disabled: (n) => (r ? n < r : !1),
                                      initialFocus: !0,
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
          }),
        }),
        L
          ? e.jsx('div', {
              className: 'flex items-center justify-center py-12',
              children: e.jsxs('div', {
                className: 'flex flex-col items-center gap-2',
                children: [
                  e.jsx(O, { className: 'h-8 w-8 animate-spin text-muted-foreground' }),
                  e.jsx('p', {
                    className: 'text-sm text-muted-foreground',
                    children: t('contactDirectory.interactions.search.searching'),
                  }),
                ],
              }),
            })
          : k
            ? e.jsx(h, {
                children: e.jsx(u, {
                  className: 'p-8 text-center',
                  children: e.jsxs('p', {
                    className: 'text-sm text-destructive',
                    children: [t('contactDirectory.interactions.search.error'), ': ', k.message],
                  }),
                }),
              })
            : g && g.notes.length > 0
              ? e.jsxs(e.Fragment, {
                  children: [
                    e.jsx('div', {
                      className: 'flex items-center justify-between mb-4',
                      children: e.jsx('p', {
                        className: 'text-sm text-muted-foreground',
                        children: t('contactDirectory.interactions.search.results_count', {
                          count: g.total,
                        }),
                      }),
                    }),
                    e.jsx('div', {
                      className: 'space-y-4',
                      children: g.notes.map((n) =>
                        e.jsx(ce, { note: n, isRTL: s, locale: d, onNavigate: $ }, n.id),
                      ),
                    }),
                  ],
                })
              : l || N
                ? e.jsx(h, {
                    children: e.jsxs(u, {
                      className: 'p-12 text-center',
                      children: [
                        e.jsx(b, { className: 'w-12 h-12 text-muted-foreground/50 mx-auto mb-4' }),
                        e.jsx('h3', {
                          className: 'text-base font-medium mb-2',
                          children: t('contactDirectory.interactions.search.no_results_title'),
                        }),
                        e.jsx('p', {
                          className: 'text-sm text-muted-foreground',
                          children: t(
                            'contactDirectory.interactions.search.no_results_description',
                          ),
                        }),
                      ],
                    }),
                  })
                : e.jsx(h, {
                    children: e.jsxs(u, {
                      className: 'p-12 text-center',
                      children: [
                        e.jsx(I, { className: 'w-12 h-12 text-muted-foreground/50 mx-auto mb-4' }),
                        e.jsx('h3', {
                          className: 'text-base font-medium mb-2',
                          children: t('contactDirectory.interactions.search.start_searching_title'),
                        }),
                        e.jsx('p', {
                          className: 'text-sm text-muted-foreground',
                          children: t(
                            'contactDirectory.interactions.search.start_searching_description',
                          ),
                        }),
                      ],
                    }),
                  }),
      ],
    }),
  })
}
const fe = ne
export { fe as component }
//# sourceMappingURL=notes-search-ATo4MrWg.js.map
