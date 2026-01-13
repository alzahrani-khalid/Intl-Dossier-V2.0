import { u as L, j as s } from './react-vendor-Buoak6m3.js'
import { a as q, i as H, L as X } from './tanstack-vendor-BZC-rs5U.js'
import { u as J } from './usePosition-ChrBL0hW.js'
import {
  s as K,
  j as o,
  k as x,
  o as m,
  l as p,
  V as b,
  m as P,
  aX as M,
  a0 as f,
  B as v,
  a2 as _,
} from './index-qYY0KoZ1.js'
import {
  bm as $,
  dS as Q,
  b5 as G,
  b4 as O,
  aH as S,
  aX as E,
  aR as W,
  aT as Y,
  c0 as Z,
  c1 as ss,
  dE as es,
  dz as ts,
} from './vendor-misc-BiJvMP0A.js'
import { I, J as B, H as g } from './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
var as = {}
async function is(a) {
  const { data: i } = await K.auth.getSession(),
    e = i.session?.access_token
  if (!e) throw new Error('Authentication required')
  const l = await fetch(`${as.VITE_SUPABASE_URL}/functions/v1/positions/${a}/analytics`, {
    headers: { Authorization: `Bearer ${e}` },
  })
  if (!l.ok)
    throw l.status === 404
      ? new Error('Position not found')
      : new Error('Failed to fetch position analytics')
  return await l.json()
}
function z(a) {
  const { positionId: i, enabled: e = !0 } = a,
    {
      data: l,
      isLoading: r,
      isError: c,
      error: t,
      refetch: j,
    } = q({
      queryKey: ['position-analytics', i],
      queryFn: () => is(i),
      enabled: e && !!i,
      staleTime: 10 * 60 * 1e3,
      gcTime: 30 * 60 * 1e3,
    })
  return { analytics: l, isLoading: r, isError: c, error: t, refetch: j }
}
const rs = ({ positionId: a, className: i = '' }) => {
    const { t: e, i18n: l } = L(),
      r = l.language === 'ar' ? I : B,
      { data: c, isLoading: t, error: j } = z(a)
    if (t)
      return s.jsxs(o, {
        className: i,
        children: [
          s.jsx(x, { children: s.jsx(m, { children: e('positions.analytics.title') }) }),
          s.jsx(p, {
            children: s.jsx('div', {
              className: 'flex items-center justify-center py-8',
              children: s.jsx('div', {
                className:
                  'h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent',
              }),
            }),
          }),
        ],
      })
    if (j || !c)
      return s.jsxs(o, {
        className: i,
        children: [
          s.jsx(x, { children: s.jsx(m, { children: e('positions.analytics.title') }) }),
          s.jsx(p, {
            children: s.jsx('p', {
              className: 'text-center text-sm text-muted-foreground',
              children: e('positions.analytics.error'),
            }),
          }),
        ],
      })
    const {
        view_count: h,
        attachment_count: u,
        briefing_pack_count: y,
        last_viewed_at: T,
        last_attached_at: A,
        popularity_score: C,
        usage_rank: D,
        trend_data: n,
      } = c,
      w = (d, N) => (d > N ? 'up' : d < N ? 'down' : 'stable'),
      F = (d) => (d >= 0.8 ? 'default' : d >= 0.5 ? 'secondary' : 'outline')
    return s.jsxs(o, {
      className: i,
      children: [
        s.jsxs(x, {
          children: [
            s.jsxs(m, {
              className: 'flex items-center gap-2',
              children: [s.jsx($, { className: 'h-5 w-5' }), e('positions.analytics.title')],
            }),
            s.jsx(b, { children: e('positions.analytics.description') }),
          ],
        }),
        s.jsxs(p, {
          className: 'space-y-6',
          children: [
            D &&
              s.jsxs('div', {
                className: 'flex items-center justify-between rounded-lg border bg-primary/5 p-4',
                children: [
                  s.jsxs('div', {
                    className: 'flex items-center gap-3',
                    children: [
                      s.jsx(Q, { className: 'h-8 w-8 text-primary' }),
                      s.jsxs('div', {
                        children: [
                          s.jsx('p', {
                            className: 'text-sm font-medium',
                            children: e('positions.analytics.rank'),
                          }),
                          s.jsxs('p', { className: 'text-2xl font-bold', children: ['#', D] }),
                        ],
                      }),
                    ],
                  }),
                  s.jsxs(P, {
                    variant: F(C || 0),
                    children: [
                      e('positions.analytics.popularityScore'),
                      ': ',
                      ((C || 0) * 100).toFixed(0),
                      '%',
                    ],
                  }),
                ],
              }),
            s.jsxs('div', {
              className: 'grid gap-4 sm:grid-cols-3',
              children: [
                s.jsxs('div', {
                  className: 'space-y-2 rounded-lg border p-4',
                  children: [
                    s.jsxs('div', {
                      className: 'flex items-center justify-between',
                      children: [
                        s.jsx(G, { className: 'h-5 w-5 text-muted-foreground' }),
                        n?.views && s.jsx(k, { direction: w(h, n.views.previous) }),
                      ],
                    }),
                    s.jsx('p', { className: 'text-2xl font-bold', children: h }),
                    s.jsx('p', {
                      className: 'text-xs text-muted-foreground',
                      children: e('positions.analytics.views'),
                    }),
                    T &&
                      s.jsxs('p', {
                        className: 'text-xs text-muted-foreground',
                        children: [
                          e('positions.analytics.lastViewed'),
                          ':',
                          ' ',
                          g(new Date(T), 'PP', { locale: r }),
                        ],
                      }),
                  ],
                }),
                s.jsxs('div', {
                  className: 'space-y-2 rounded-lg border p-4',
                  children: [
                    s.jsxs('div', {
                      className: 'flex items-center justify-between',
                      children: [
                        s.jsx(O, { className: 'h-5 w-5 text-muted-foreground' }),
                        n?.attachments && s.jsx(k, { direction: w(u, n.attachments.previous) }),
                      ],
                    }),
                    s.jsx('p', { className: 'text-2xl font-bold', children: u }),
                    s.jsx('p', {
                      className: 'text-xs text-muted-foreground',
                      children: e('positions.analytics.attachments'),
                    }),
                    A &&
                      s.jsxs('p', {
                        className: 'text-xs text-muted-foreground',
                        children: [
                          e('positions.analytics.lastAttached'),
                          ':',
                          ' ',
                          g(new Date(A), 'PP', { locale: r }),
                        ],
                      }),
                  ],
                }),
                s.jsxs('div', {
                  className: 'space-y-2 rounded-lg border p-4',
                  children: [
                    s.jsxs('div', {
                      className: 'flex items-center justify-between',
                      children: [
                        s.jsx(S, { className: 'h-5 w-5 text-muted-foreground' }),
                        n?.briefings && s.jsx(k, { direction: w(y, n.briefings.previous) }),
                      ],
                    }),
                    s.jsx('p', { className: 'text-2xl font-bold', children: y }),
                    s.jsx('p', {
                      className: 'text-xs text-muted-foreground',
                      children: e('positions.analytics.briefingPacks'),
                    }),
                  ],
                }),
              ],
            }),
            n?.daily &&
              n.daily.length > 0 &&
              s.jsxs('div', {
                className: 'space-y-2',
                children: [
                  s.jsx('p', {
                    className: 'text-sm font-medium',
                    children: e('positions.analytics.usageTrend'),
                  }),
                  s.jsx('div', {
                    className: 'flex h-32 items-end justify-between gap-1 rounded-lg border p-4',
                    children: n.daily.slice(-7).map((d, N) => {
                      const R = Math.max(...n.daily.map((V) => V.total)),
                        U = (d.total / R) * 100
                      return s.jsx(
                        'div',
                        {
                          className: 'flex-1 rounded-t bg-primary transition-all hover:opacity-80',
                          style: { height: `${U}%`, minHeight: '4px' },
                          title: `${d.date}: ${d.total}`,
                        },
                        N,
                      )
                    }),
                  }),
                  s.jsx('p', {
                    className: 'text-xs text-muted-foreground text-center',
                    children: e('positions.analytics.last7Days'),
                  }),
                ],
              }),
          ],
        }),
      ],
    })
  },
  k = ({ direction: a }) =>
    a === 'up'
      ? s.jsx($, { className: 'h-4 w-4 text-green-600' })
      : a === 'down'
        ? s.jsx($, { className: 'h-4 w-4 rotate-180 text-red-600' })
        : s.jsx('div', { className: 'h-4 w-4' })
function gs() {
  const { positionId: a } = M.useParams(),
    i = H(),
    { t: e, i18n: l } = L(['positions', 'common']),
    r = l.language === 'ar',
    c = r ? I : B,
    { data: t, isLoading: j, error: h } = J(a),
    { data: u } = z(a)
  if (j)
    return s.jsxs('div', {
      className: 'container mx-auto p-6 space-y-6',
      children: [
        s.jsx(f, { className: 'h-8 w-64' }),
        s.jsx(f, { className: 'h-96 w-full' }),
        s.jsxs('div', {
          className: 'grid grid-cols-1 lg:grid-cols-3 gap-6',
          children: [
            s.jsx(f, { className: 'lg:col-span-2 h-64' }),
            s.jsx(f, { className: 'h-64' }),
          ],
        }),
      ],
    })
  if (h)
    return s.jsx('div', {
      className: 'container mx-auto p-6',
      children: s.jsxs(o, {
        className: 'border-destructive',
        children: [
          s.jsxs(x, {
            children: [
              s.jsxs(m, {
                className: 'text-destructive flex items-center gap-2',
                children: [s.jsx(S, { className: 'h-5 w-5' }), e('common:error')],
              }),
              s.jsx(b, {
                children:
                  h instanceof Error && h.message.includes('404')
                    ? e('positions:detail.not_found')
                    : e('positions:detail.error_loading'),
              }),
            ],
          }),
          s.jsx(p, {
            children: s.jsxs(v, {
              onClick: () => i({ to: '/positions' }),
              variant: 'outline',
              children: [
                s.jsx(E, { className: `h-4 w-4 ${r ? 'rotate-180' : ''}` }),
                e('positions:detail.back_to_library'),
              ],
            }),
          }),
        ],
      }),
    })
  if (!t) return null
  const y = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
    approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
    published: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
    archived: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200',
  }
  return s.jsxs('div', {
    className: `min-h-screen bg-gray-50 dark:bg-gray-900 ${r ? 'rtl' : 'ltr'}`,
    children: [
      s.jsx('div', {
        className: 'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700',
        children: s.jsx('div', {
          className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6',
          children: s.jsxs('div', {
            className: 'flex items-start justify-between gap-4',
            children: [
              s.jsxs('div', {
                className: 'flex-1 min-w-0',
                children: [
                  s.jsxs(v, {
                    variant: 'ghost',
                    size: 'sm',
                    onClick: () => i({ to: '/positions' }),
                    className: 'mb-4',
                    children: [
                      s.jsx(E, { className: `h-4 w-4 ${r ? 'rotate-180' : ''}` }),
                      e('positions:detail.back_to_library'),
                    ],
                  }),
                  s.jsxs('div', {
                    className: 'space-y-2',
                    children: [
                      s.jsxs('div', {
                        className: 'flex items-center gap-2 flex-wrap',
                        children: [
                          s.jsx('h1', {
                            className: 'text-3xl font-bold text-gray-900 dark:text-gray-100',
                            children: r ? t.title_ar : t.title_en,
                          }),
                          s.jsx(P, {
                            className: y[t.status],
                            children: e(`positions:status.${t.status}`),
                          }),
                          s.jsx(P, { variant: 'outline', children: e(`positions:type.${t.type}`) }),
                        ],
                      }),
                      s.jsxs('div', {
                        className:
                          'flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400',
                        children: [
                          s.jsxs('span', {
                            className: 'flex items-center gap-1',
                            children: [
                              s.jsx(W, { className: 'h-4 w-4' }),
                              g(new Date(t.updated_at), 'PPP', { locale: c }),
                            ],
                          }),
                          t.created_by &&
                            s.jsxs('span', {
                              className: 'flex items-center gap-1',
                              children: [s.jsx(Y, { className: 'h-4 w-4' }), t.created_by],
                            }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              s.jsxs('div', {
                className: 'flex items-center gap-2',
                children: [
                  t.status !== 'archived' &&
                    s.jsxs(v, {
                      variant: 'outline',
                      size: 'sm',
                      children: [s.jsx(Z, { className: 'h-4 w-4' }), e('positions:detail.edit')],
                    }),
                  s.jsxs(v, {
                    variant: 'outline',
                    size: 'sm',
                    children: [
                      s.jsx(ss, { className: 'h-4 w-4' }),
                      t.status === 'archived'
                        ? e('positions:detail.restore')
                        : e('positions:detail.archive'),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
      }),
      s.jsx('main', {
        className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
        children: s.jsxs('div', {
          className: 'grid grid-cols-1 lg:grid-cols-3 gap-6',
          children: [
            s.jsxs('div', {
              className: 'lg:col-span-2 space-y-6',
              children: [
                s.jsxs(o, {
                  children: [
                    s.jsxs(x, {
                      children: [
                        s.jsx(m, { children: e('positions:detail.content_title') }),
                        s.jsx(b, { children: e('positions:detail.content_description') }),
                      ],
                    }),
                    s.jsx(p, {
                      children: s.jsxs('div', {
                        className: 'prose dark:prose-invert max-w-none',
                        children: [
                          s.jsxs('div', {
                            className: 'space-y-4',
                            children: [
                              s.jsx('h3', {
                                className: 'text-lg font-semibold',
                                children: e('positions:detail.english_version'),
                              }),
                              s.jsx('div', {
                                className: 'whitespace-pre-wrap',
                                children: t.content_en,
                              }),
                            ],
                          }),
                          s.jsx(_, { className: 'my-6' }),
                          s.jsxs('div', {
                            className: 'space-y-4 text-end',
                            dir: 'rtl',
                            children: [
                              s.jsx('h3', {
                                className: 'text-lg font-semibold',
                                children: e('positions:detail.arabic_version'),
                              }),
                              s.jsx('div', {
                                className: 'whitespace-pre-wrap',
                                children: t.content_ar,
                              }),
                            ],
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                s.jsxs(o, {
                  children: [
                    s.jsxs(x, {
                      children: [
                        s.jsxs(m, {
                          className: 'flex items-center gap-2',
                          children: [
                            s.jsx(es, { className: 'h-5 w-5' }),
                            e('positions:detail.related_engagements'),
                          ],
                        }),
                        s.jsx(b, {
                          children: e('positions:detail.related_engagements_description'),
                        }),
                      ],
                    }),
                    s.jsx(p, {
                      children: s.jsxs('div', {
                        className: 'text-center py-8 text-gray-500 dark:text-gray-400',
                        children: [
                          s.jsx(ts, { className: 'h-12 w-12 mx-auto mb-4 opacity-50' }),
                          s.jsx('p', {
                            className: 'text-sm',
                            children: e('positions:detail.no_related_engagements'),
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            s.jsxs('div', {
              className: 'space-y-6',
              children: [
                u && s.jsx(rs, { positionId: a, analytics: u }),
                s.jsxs(o, {
                  children: [
                    s.jsx(x, {
                      children: s.jsx(m, { children: e('positions:detail.metadata_title') }),
                    }),
                    s.jsxs(p, {
                      className: 'space-y-4',
                      children: [
                        s.jsxs('div', {
                          children: [
                            s.jsx('p', {
                              className: 'text-sm font-medium text-gray-500 dark:text-gray-400',
                              children: e('positions:detail.dossier'),
                            }),
                            t.dossier_id
                              ? s.jsx(X, {
                                  to: '/dossiers/$dossierId',
                                  params: { dossierId: t.dossier_id },
                                  className:
                                    'text-sm text-blue-600 dark:text-blue-400 hover:underline',
                                  children: e('positions:detail.view_dossier'),
                                })
                              : s.jsx('p', {
                                  className: 'text-sm text-gray-900 dark:text-gray-100',
                                  children: e('positions:detail.no_dossier'),
                                }),
                          ],
                        }),
                        s.jsx(_, {}),
                        s.jsxs('div', {
                          children: [
                            s.jsx('p', {
                              className: 'text-sm font-medium text-gray-500 dark:text-gray-400',
                              children: e('positions:detail.created'),
                            }),
                            s.jsx('p', {
                              className: 'text-sm text-gray-900 dark:text-gray-100',
                              children: g(new Date(t.created_at), 'PPP', { locale: c }),
                            }),
                          ],
                        }),
                        s.jsxs('div', {
                          children: [
                            s.jsx('p', {
                              className: 'text-sm font-medium text-gray-500 dark:text-gray-400',
                              children: e('positions:detail.last_updated'),
                            }),
                            s.jsx('p', {
                              className: 'text-sm text-gray-900 dark:text-gray-100',
                              children: g(new Date(t.updated_at), 'PPP', { locale: c }),
                            }),
                          ],
                        }),
                        t.version &&
                          s.jsxs(s.Fragment, {
                            children: [
                              s.jsx(_, {}),
                              s.jsxs('div', {
                                children: [
                                  s.jsx('p', {
                                    className:
                                      'text-sm font-medium text-gray-500 dark:text-gray-400',
                                    children: e('positions:detail.version'),
                                  }),
                                  s.jsxs('p', {
                                    className: 'text-sm text-gray-900 dark:text-gray-100',
                                    children: ['v', t.version],
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
      }),
    ],
  })
}
export { gs as component }
//# sourceMappingURL=_positionId-ByIEwJ6H.js.map
