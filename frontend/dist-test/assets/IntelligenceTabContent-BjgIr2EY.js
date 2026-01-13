import { u as v, r as o, j as e, R as S } from './react-vendor-Buoak6m3.js'
import { b as D, a as H } from './useIntelligence-BMjousVq.js'
import {
  j as N,
  k as b,
  o as w,
  l as y,
  V as T,
  m as j,
  a0 as R,
  af as A,
  ag as C,
} from './index-qYY0KoZ1.js'
import { R as _ } from './RefreshButton-B7MWE9Ka.js'
import {
  bl as E,
  bf as V,
  aI as B,
  ei as Y,
  bS as J,
  be as I,
  c6 as Q,
  ch as P,
  aK as $,
  bL as W,
  bw as z,
  aB as O,
  cj as U,
  bY as X,
} from './vendor-misc-BiJvMP0A.js'
import { U as L } from './date-vendor-s0MkYge4.js'
import './tanstack-vendor-BZC-rs5U.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function Z({ reports: i, dossierId: d }) {
  const { t, i18n: f } = v('dossier'),
    r = f.language === 'ar',
    s = o.useMemo(
      () =>
        i.length === 0
          ? null
          : i.sort(
              (n, k) =>
                new Date(k.last_refreshed_at || k.created_at).getTime() -
                new Date(n.last_refreshed_at || n.created_at).getTime(),
            )[0],
      [i],
    ),
    { mutate: u, isPending: c } = D(),
    h = o.useMemo(() => (s?.data_sources_metadata ? s.data_sources_metadata.slice(0, 3) : []), [s]),
    g = o.useMemo(() => s?.cache_expires_at && new Date(s.cache_expires_at) < new Date(), [s]),
    m = () => {
      u({ entity_id: d, intelligence_types: ['economic'], priority: 'normal' })
    }
  if (i.length === 0)
    return e.jsxs(N, {
      className: 'h-full',
      dir: r ? 'rtl' : 'ltr',
      children: [
        e.jsx(b, {
          children: e.jsxs('div', {
            className: 'flex items-center justify-between',
            children: [
              e.jsxs('div', {
                className: 'flex items-center gap-2',
                children: [
                  e.jsx(E, { className: 'h-5 w-5 text-emerald-600 dark:text-emerald-400' }),
                  e.jsx(w, {
                    className: 'text-base sm:text-lg',
                    children: t('intelligence.types.economic', 'Economic Intelligence'),
                  }),
                ],
              }),
              e.jsx(_, {
                intelligenceTypes: ['economic'],
                onRefresh: () => m(),
                isLoading: c,
                showTypeSelection: !1,
                size: 'sm',
              }),
            ],
          }),
        }),
        e.jsx(y, {
          children: e.jsxs('div', {
            className: 'text-center py-8 text-muted-foreground',
            children: [
              e.jsx(V, { className: 'mx-auto h-12 w-12 mb-3 text-gray-400' }),
              e.jsx('p', {
                className: 'text-sm',
                children: t('intelligence.noEconomicData', 'No economic intelligence available'),
              }),
            ],
          }),
        }),
      ],
    })
  const [a, x] = S.useState(!1)
  return e.jsxs(N, {
    className: 'h-full flex flex-col',
    dir: r ? 'rtl' : 'ltr',
    children: [
      e.jsx(b, {
        className: 'pb-3',
        children: e.jsxs('div', {
          className: 'flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3',
          children: [
            e.jsxs('div', {
              className: 'flex-1 min-w-0',
              children: [
                e.jsxs('div', {
                  className: 'flex items-center gap-2 mb-2',
                  children: [
                    e.jsx(E, {
                      className: 'h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400',
                    }),
                    e.jsx(w, {
                      className: 'text-base sm:text-lg truncate',
                      children: t('intelligence.types.economic', 'Economic Intelligence'),
                    }),
                  ],
                }),
                e.jsx(T, {
                  className: 'text-xs sm:text-sm line-clamp-2',
                  children: r && s?.title_ar ? s.title_ar : s?.title,
                }),
              ],
            }),
            e.jsx(_, {
              intelligenceTypes: ['economic'],
              onRefresh: () => m(),
              isLoading: c,
              showTypeSelection: !1,
              size: 'sm',
              className: 'w-full sm:w-auto flex-shrink-0',
            }),
          ],
        }),
      }),
      e.jsxs(y, {
        className: 'flex-1 flex flex-col gap-4',
        children: [
          e.jsxs('div', {
            className: 'flex flex-wrap items-center gap-2 text-xs',
            children: [
              g &&
                e.jsx(j, {
                  variant: 'outline',
                  className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                  children: t('intelligence.stale', 'Stale Data'),
                }),
              e.jsxs('span', {
                className: 'text-muted-foreground',
                children: [
                  t('intelligence.updated', 'Updated'),
                  ' ',
                  L(new Date(s?.last_refreshed_at || s?.created_at || Date.now()), {
                    addSuffix: !0,
                  }),
                ],
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'flex-1',
            children: [
              e.jsxs('div', {
                className: 'flex items-center justify-between mb-2',
                children: [
                  e.jsx('h4', {
                    className: 'text-sm font-medium',
                    children: t('intelligence.executiveSummary', 'Executive Summary'),
                  }),
                  e.jsx('button', {
                    onClick: () => x(!a),
                    className: 'text-xs text-primary hover:underline',
                    children: a
                      ? t('intelligence.showLess', 'Show Less')
                      : t('intelligence.showMore', 'Show More'),
                  }),
                ],
              }),
              e.jsx('p', {
                className: `text-sm text-muted-foreground whitespace-pre-wrap ${a ? '' : 'line-clamp-4'}`,
                children: r && s?.content_ar ? s.content_ar : s?.content,
              }),
            ],
          }),
          s?.metrics &&
            Object.keys(s.metrics).length > 0 &&
            e.jsxs('div', {
              children: [
                e.jsx('h4', {
                  className: 'text-sm font-medium mb-3',
                  children: t('intelligence.keyIndicators', 'Key Indicators'),
                }),
                e.jsx('div', {
                  className: 'grid grid-cols-2 gap-3',
                  children: Object.entries(s.metrics).map(([l, n]) =>
                    e.jsxs(
                      'div',
                      {
                        className: 'bg-muted/50 rounded-lg p-3',
                        children: [
                          e.jsxs('div', {
                            className: 'flex items-center gap-2 mb-1',
                            children: [
                              e.jsx(E, { className: 'h-4 w-4 text-emerald-600' }),
                              e.jsx('span', {
                                className: 'text-xs font-medium text-muted-foreground capitalize',
                                children: l.replace(/_/g, ' '),
                              }),
                            ],
                          }),
                          e.jsx('p', { className: 'text-sm font-semibold', children: n }),
                        ],
                      },
                      l,
                    ),
                  ),
                }),
              ],
            }),
          h.length > 0 &&
            e.jsxs('div', {
              className: 'border-t pt-3',
              children: [
                e.jsx('h4', {
                  className: 'text-xs font-medium mb-2 text-muted-foreground',
                  children: t('intelligence.sources', 'Data Sources'),
                }),
                e.jsx('div', {
                  className: 'flex flex-wrap gap-2',
                  children: h.map((l, n) =>
                    e.jsx(
                      j,
                      {
                        variant: 'outline',
                        className: 'text-xs bg-background hover:bg-muted',
                        children: l.source,
                      },
                      n,
                    ),
                  ),
                }),
              ],
            }),
          s?.anythingllm_workspace_id &&
            e.jsxs('div', {
              className:
                'text-xs text-muted-foreground border-t pt-2 flex flex-wrap items-center justify-between gap-2',
              children: [
                e.jsxs('div', {
                  children: [
                    e.jsxs('span', {
                      className: 'font-medium',
                      children: [t('intelligence.generatedBy', 'Generated by'), ':'],
                    }),
                    ' ',
                    'AnythingLLM',
                    ' ',
                    s.anythingllm_response_metadata?.model &&
                      e.jsxs('span', {
                        children: ['(', s.anythingllm_response_metadata.model, ')'],
                      }),
                  ],
                }),
                e.jsxs('span', {
                  className: 'font-medium text-foreground',
                  children: ['Confidence: ', s?.confidence_score || 0, '%'],
                }),
              ],
            }),
        ],
      }),
    ],
  })
}
function ee({ reports: i, dossierId: d }) {
  const { t, i18n: f } = v('dossier'),
    r = f.language === 'ar',
    s = o.useMemo(
      () =>
        i.length === 0
          ? null
          : i.sort(
              (l, n) =>
                new Date(n.last_refreshed_at || n.created_at).getTime() -
                new Date(l.last_refreshed_at || l.created_at).getTime(),
            )[0],
      [i],
    ),
    { mutate: u, isPending: c } = D(),
    h = o.useMemo(() => (s?.data_sources_metadata ? s.data_sources_metadata.slice(0, 3) : []), [s]),
    g = o.useMemo(() => s?.cache_expires_at && new Date(s.cache_expires_at) < new Date(), [s]),
    m = () => {
      u({ entity_id: d, intelligence_types: ['political'], priority: 'normal' })
    }
  if (i.length === 0)
    return e.jsxs(N, {
      className: 'h-full',
      dir: r ? 'rtl' : 'ltr',
      children: [
        e.jsx(b, {
          children: e.jsxs('div', {
            className: 'flex items-center justify-between',
            children: [
              e.jsxs('div', {
                className: 'flex items-center gap-2',
                children: [
                  e.jsx(B, { className: 'h-5 w-5 text-purple-600 dark:text-purple-400' }),
                  e.jsx(w, {
                    className: 'text-base sm:text-lg',
                    children: t('intelligence.types.political', 'Political Analysis'),
                  }),
                ],
              }),
              e.jsx(_, {
                intelligenceTypes: ['political'],
                onRefresh: () => m(),
                isLoading: c,
                showTypeSelection: !1,
                size: 'sm',
              }),
            ],
          }),
        }),
        e.jsx(y, {
          children: e.jsxs('div', {
            className: 'text-center py-8 text-muted-foreground',
            children: [
              e.jsx(Y, { className: 'mx-auto h-12 w-12 mb-3 text-gray-400' }),
              e.jsx('p', {
                className: 'text-sm',
                children: t('intelligence.noPoliticalData', 'No political intelligence available'),
              }),
            ],
          }),
        }),
      ],
    })
  const [a, x] = S.useState(!1)
  return e.jsxs(N, {
    className: 'h-full flex flex-col',
    dir: r ? 'rtl' : 'ltr',
    children: [
      e.jsx(b, {
        className: 'pb-3',
        children: e.jsxs('div', {
          className: 'flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3',
          children: [
            e.jsxs('div', {
              className: 'flex-1 min-w-0',
              children: [
                e.jsxs('div', {
                  className: 'flex items-center gap-2 mb-2',
                  children: [
                    e.jsx(B, {
                      className: 'h-5 w-5 flex-shrink-0 text-purple-600 dark:text-purple-400',
                    }),
                    e.jsx(w, {
                      className: 'text-base sm:text-lg truncate',
                      children: t('intelligence.types.political', 'Political Analysis'),
                    }),
                  ],
                }),
                e.jsx(T, {
                  className: 'text-xs sm:text-sm line-clamp-2',
                  children: r && s?.title_ar ? s.title_ar : s?.title,
                }),
              ],
            }),
            e.jsx(_, {
              intelligenceTypes: ['political'],
              onRefresh: () => m(),
              isLoading: c,
              showTypeSelection: !1,
              size: 'sm',
              className: 'w-full sm:w-auto flex-shrink-0',
            }),
          ],
        }),
      }),
      e.jsxs(y, {
        className: 'flex-1 flex flex-col gap-4',
        children: [
          e.jsxs('div', {
            className: 'flex flex-wrap items-center gap-2 text-xs',
            children: [
              g &&
                e.jsx(j, {
                  variant: 'outline',
                  className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                  children: t('intelligence.stale', 'Stale Data'),
                }),
              e.jsxs('span', {
                className: 'text-muted-foreground',
                children: [
                  t('intelligence.updated', 'Updated'),
                  ' ',
                  L(new Date(s?.last_refreshed_at || s?.created_at || Date.now()), {
                    addSuffix: !0,
                  }),
                ],
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'flex-1',
            children: [
              e.jsxs('div', {
                className: 'flex items-center justify-between mb-2',
                children: [
                  e.jsx('h4', {
                    className: 'text-sm font-medium',
                    children: t('intelligence.executiveSummary', 'Executive Summary'),
                  }),
                  e.jsx('button', {
                    onClick: () => x(!a),
                    className: 'text-xs text-primary hover:underline',
                    children: a
                      ? t('intelligence.showLess', 'Show Less')
                      : t('intelligence.showMore', 'Show More'),
                  }),
                ],
              }),
              e.jsx('p', {
                className: `text-sm text-muted-foreground whitespace-pre-wrap ${a ? '' : 'line-clamp-4'}`,
                children: r && s?.content_ar ? s.content_ar : s?.content,
              }),
            ],
          }),
          s?.metrics &&
            Object.keys(s.metrics).length > 0 &&
            e.jsxs('div', {
              children: [
                e.jsx('h4', {
                  className: 'text-sm font-medium mb-3',
                  children: t('intelligence.stabilityIndicators', 'Stability Indicators'),
                }),
                e.jsx('div', {
                  className: 'grid grid-cols-2 gap-3',
                  children: Object.entries(s.metrics).map(([l, n]) =>
                    e.jsxs(
                      'div',
                      {
                        className: 'bg-muted/50 rounded-lg p-3',
                        children: [
                          e.jsxs('div', {
                            className: 'flex items-center gap-2 mb-1',
                            children: [
                              e.jsx(J, { className: 'h-4 w-4 text-purple-600' }),
                              e.jsx('span', {
                                className: 'text-xs font-medium text-muted-foreground capitalize',
                                children: l.replace(/_/g, ' '),
                              }),
                            ],
                          }),
                          e.jsx('p', { className: 'text-sm font-semibold', children: n }),
                        ],
                      },
                      l,
                    ),
                  ),
                }),
              ],
            }),
          h.length > 0 &&
            e.jsxs('div', {
              className: 'border-t pt-3',
              children: [
                e.jsx('h4', {
                  className: 'text-xs font-medium mb-2 text-muted-foreground',
                  children: t('intelligence.sources', 'Data Sources'),
                }),
                e.jsx('div', {
                  className: 'flex flex-wrap gap-2',
                  children: h.map((l, n) =>
                    e.jsx(
                      j,
                      {
                        variant: 'outline',
                        className: 'text-xs bg-background hover:bg-muted',
                        children: l.source,
                      },
                      n,
                    ),
                  ),
                }),
              ],
            }),
          s?.anythingllm_workspace_id &&
            e.jsxs('div', {
              className:
                'text-xs text-muted-foreground border-t pt-2 flex flex-wrap items-center justify-between gap-2',
              children: [
                e.jsxs('div', {
                  children: [
                    e.jsxs('span', {
                      className: 'font-medium',
                      children: [t('intelligence.generatedBy', 'Generated by'), ':'],
                    }),
                    ' ',
                    'AnythingLLM',
                    ' ',
                    s.anythingllm_response_metadata?.model &&
                      e.jsxs('span', {
                        children: ['(', s.anythingllm_response_metadata.model, ')'],
                      }),
                  ],
                }),
                e.jsxs('span', {
                  className: 'font-medium text-foreground',
                  children: ['Confidence: ', s?.confidence_score || 0, '%'],
                }),
              ],
            }),
        ],
      }),
    ],
  })
}
function se({ reports: i, dossierId: d }) {
  const { t, i18n: f } = v('dossier'),
    r = f.language === 'ar',
    s = o.useMemo(
      () =>
        i.length === 0
          ? null
          : i.sort(
              (l, n) =>
                new Date(n.last_refreshed_at || n.created_at).getTime() -
                new Date(l.last_refreshed_at || l.created_at).getTime(),
            )[0],
      [i],
    ),
    { mutate: u, isPending: c } = D(),
    h = o.useMemo(() => (s?.data_sources_metadata ? s.data_sources_metadata.slice(0, 3) : []), [s]),
    g = o.useMemo(() => s?.cache_expires_at && new Date(s.cache_expires_at) < new Date(), [s]),
    m = () => {
      u({ entity_id: d, intelligence_types: ['security'], priority: 'high' })
    }
  if (i.length === 0)
    return e.jsxs(N, {
      className: 'h-full',
      dir: r ? 'rtl' : 'ltr',
      children: [
        e.jsx(b, {
          children: e.jsxs('div', {
            className: 'flex items-center justify-between',
            children: [
              e.jsxs('div', {
                className: 'flex items-center gap-2',
                children: [
                  e.jsx(I, { className: 'h-5 w-5 text-red-600 dark:text-red-400' }),
                  e.jsx(w, {
                    className: 'text-base sm:text-lg',
                    children: t('intelligence.types.security', 'Security Assessment'),
                  }),
                ],
              }),
              e.jsx(_, {
                intelligenceTypes: ['security'],
                onRefresh: () => m(),
                isLoading: c,
                showTypeSelection: !1,
                size: 'sm',
              }),
            ],
          }),
        }),
        e.jsx(y, {
          children: e.jsxs('div', {
            className: 'text-center py-8 text-muted-foreground',
            children: [
              e.jsx(Q, { className: 'mx-auto h-12 w-12 mb-3 text-gray-400' }),
              e.jsx('p', {
                className: 'text-sm',
                children: t('intelligence.noSecurityData', 'No security intelligence available'),
              }),
            ],
          }),
        }),
      ],
    })
  const [a, x] = S.useState(!1)
  return e.jsxs(N, {
    className: 'h-full flex flex-col',
    dir: r ? 'rtl' : 'ltr',
    children: [
      e.jsx(b, {
        className: 'pb-3',
        children: e.jsxs('div', {
          className: 'flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3',
          children: [
            e.jsxs('div', {
              className: 'flex-1 min-w-0',
              children: [
                e.jsxs('div', {
                  className: 'flex items-center gap-2 mb-2',
                  children: [
                    e.jsx(I, { className: 'h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400' }),
                    e.jsx(w, {
                      className: 'text-base sm:text-lg truncate',
                      children: t('intelligence.types.security', 'Security Assessment'),
                    }),
                  ],
                }),
                e.jsx(T, {
                  className: 'text-xs sm:text-sm line-clamp-2',
                  children: r && s?.title_ar ? s.title_ar : s?.title,
                }),
              ],
            }),
            e.jsx(_, {
              intelligenceTypes: ['security'],
              onRefresh: () => m(),
              isLoading: c,
              showTypeSelection: !1,
              size: 'sm',
              className: 'w-full sm:w-auto flex-shrink-0',
            }),
          ],
        }),
      }),
      e.jsxs(y, {
        className: 'flex-1 flex flex-col gap-4',
        children: [
          e.jsxs('div', {
            className: 'flex flex-wrap items-center gap-2 text-xs',
            children: [
              g &&
                e.jsx(j, {
                  variant: 'destructive',
                  className: 'animate-pulse',
                  children: t(
                    'intelligence.securityStale',
                    'Security Data Stale - Refresh Required',
                  ),
                }),
              !g &&
                e.jsx(j, {
                  variant: 'outline',
                  className: 'bg-green-50 text-green-700 border-green-200',
                  children: t('intelligence.current', 'Current'),
                }),
              e.jsxs('span', {
                className: 'text-muted-foreground',
                children: [
                  t('intelligence.updated', 'Updated'),
                  ' ',
                  L(new Date(s?.last_refreshed_at || s?.created_at || Date.now()), {
                    addSuffix: !0,
                  }),
                ],
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'flex-1',
            children: [
              e.jsxs('div', {
                className: 'flex items-center justify-between mb-2',
                children: [
                  e.jsx('h4', {
                    className: 'text-sm font-medium',
                    children: t('intelligence.threatAssessment', 'Threat Assessment'),
                  }),
                  e.jsx('button', {
                    onClick: () => x(!a),
                    className: 'text-xs text-primary hover:underline',
                    children: a
                      ? t('intelligence.showLess', 'Show Less')
                      : t('intelligence.showMore', 'Show More'),
                  }),
                ],
              }),
              e.jsx('p', {
                className: `text-sm text-muted-foreground whitespace-pre-wrap ${a ? '' : 'line-clamp-4'}`,
                children: r && s?.content_ar ? s.content_ar : s?.content,
              }),
            ],
          }),
          s?.metrics &&
            Object.keys(s.metrics).length > 0 &&
            e.jsxs('div', {
              children: [
                e.jsx('h4', {
                  className: 'text-sm font-medium mb-3',
                  children: t('intelligence.securityMetrics', 'Security Metrics'),
                }),
                e.jsx('div', {
                  className: 'grid grid-cols-2 gap-3',
                  children: Object.entries(s.metrics).map(([l, n]) =>
                    e.jsxs(
                      'div',
                      {
                        className: 'bg-muted/50 rounded-lg p-3',
                        children: [
                          e.jsxs('div', {
                            className: 'flex items-center gap-2 mb-1',
                            children: [
                              e.jsx(I, { className: 'h-4 w-4 text-red-600' }),
                              e.jsx('span', {
                                className: 'text-xs font-medium text-muted-foreground capitalize',
                                children: l.replace(/_/g, ' '),
                              }),
                            ],
                          }),
                          e.jsx('p', { className: 'text-sm font-semibold', children: n }),
                        ],
                      },
                      l,
                    ),
                  ),
                }),
              ],
            }),
          h.length > 0 &&
            e.jsxs('div', {
              className: 'border-t pt-3',
              children: [
                e.jsx('h4', {
                  className: 'text-xs font-medium mb-2 text-muted-foreground',
                  children: t('intelligence.sources', 'Data Sources'),
                }),
                e.jsx('div', {
                  className: 'flex flex-wrap gap-2',
                  children: h.map((l, n) =>
                    e.jsx(
                      j,
                      {
                        variant: 'outline',
                        className: 'text-xs bg-background hover:bg-muted',
                        children: l.source,
                      },
                      n,
                    ),
                  ),
                }),
              ],
            }),
          s?.anythingllm_workspace_id &&
            e.jsxs('div', {
              className:
                'text-xs text-muted-foreground border-t pt-2 flex flex-wrap items-center justify-between gap-2',
              children: [
                e.jsxs('div', {
                  children: [
                    e.jsxs('span', {
                      className: 'font-medium',
                      children: [t('intelligence.generatedBy', 'Generated by'), ':'],
                    }),
                    ' ',
                    'AnythingLLM',
                    ' ',
                    s.anythingllm_response_metadata?.model &&
                      e.jsxs('span', {
                        children: ['(', s.anythingllm_response_metadata.model, ')'],
                      }),
                  ],
                }),
                e.jsxs('span', {
                  className: 'font-medium text-foreground',
                  children: ['Confidence: ', s?.confidence_score || 0, '%'],
                }),
              ],
            }),
        ],
      }),
    ],
  })
}
function te({ reports: i, dossierId: d }) {
  const { t, i18n: f } = v('dossier'),
    r = f.language === 'ar',
    s = o.useMemo(
      () =>
        i.length === 0
          ? null
          : i.sort(
              (l, n) =>
                new Date(n.last_refreshed_at || n.created_at).getTime() -
                new Date(l.last_refreshed_at || l.created_at).getTime(),
            )[0],
      [i],
    ),
    { mutate: u, isPending: c } = D(),
    h = o.useMemo(() => (s?.data_sources_metadata ? s.data_sources_metadata.slice(0, 3) : []), [s]),
    g = o.useMemo(() => s?.cache_expires_at && new Date(s.cache_expires_at) < new Date(), [s]),
    m = () => {
      u({ entity_id: d, intelligence_types: ['bilateral'], priority: 'normal' })
    }
  if (i.length === 0)
    return e.jsxs(N, {
      className: 'h-full',
      dir: r ? 'rtl' : 'ltr',
      children: [
        e.jsx(b, {
          children: e.jsxs('div', {
            className: 'flex items-center justify-between',
            children: [
              e.jsxs('div', {
                className: 'flex items-center gap-2',
                children: [
                  e.jsx(P, { className: 'h-5 w-5 text-blue-600 dark:text-blue-400' }),
                  e.jsx(w, {
                    className: 'text-base sm:text-lg',
                    children: t('intelligence.types.bilateral', 'Bilateral Opportunities'),
                  }),
                ],
              }),
              e.jsx(_, {
                intelligenceTypes: ['bilateral'],
                onRefresh: () => m(),
                isLoading: c,
                showTypeSelection: !1,
                size: 'sm',
              }),
            ],
          }),
        }),
        e.jsx(y, {
          children: e.jsxs('div', {
            className: 'text-center py-8 text-muted-foreground',
            children: [
              e.jsx($, { className: 'mx-auto h-12 w-12 mb-3 text-gray-400' }),
              e.jsx('p', {
                className: 'text-sm',
                children: t('intelligence.noBilateralData', 'No bilateral intelligence available'),
              }),
            ],
          }),
        }),
      ],
    })
  const [a, x] = S.useState(!1)
  return e.jsxs(N, {
    className: 'h-full flex flex-col',
    dir: r ? 'rtl' : 'ltr',
    children: [
      e.jsx(b, {
        className: 'pb-3',
        children: e.jsxs('div', {
          className: 'flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3',
          children: [
            e.jsxs('div', {
              className: 'flex-1 min-w-0',
              children: [
                e.jsxs('div', {
                  className: 'flex items-center gap-2 mb-2',
                  children: [
                    e.jsx(P, {
                      className: 'h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400',
                    }),
                    e.jsx(w, {
                      className: 'text-base sm:text-lg truncate',
                      children: t('intelligence.types.bilateral', 'Bilateral Opportunities'),
                    }),
                  ],
                }),
                e.jsx(T, {
                  className: 'text-xs sm:text-sm line-clamp-2',
                  children: r && s?.title_ar ? s.title_ar : s?.title,
                }),
              ],
            }),
            e.jsx(_, {
              intelligenceTypes: ['bilateral'],
              onRefresh: () => m(),
              isLoading: c,
              showTypeSelection: !1,
              size: 'sm',
              className: 'w-full sm:w-auto flex-shrink-0',
            }),
          ],
        }),
      }),
      e.jsxs(y, {
        className: 'flex-1 flex flex-col gap-4',
        children: [
          e.jsxs('div', {
            className: 'flex flex-wrap items-center gap-2 text-xs',
            children: [
              g &&
                e.jsx(j, {
                  variant: 'outline',
                  className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                  children: t('intelligence.stale', 'Stale Data'),
                }),
              e.jsxs('span', {
                className: 'text-muted-foreground',
                children: [
                  t('intelligence.updated', 'Updated'),
                  ' ',
                  L(new Date(s?.last_refreshed_at || s?.created_at || Date.now()), {
                    addSuffix: !0,
                  }),
                ],
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'flex-1',
            children: [
              e.jsxs('div', {
                className: 'flex items-center justify-between mb-2',
                children: [
                  e.jsx('h4', {
                    className: 'text-sm font-medium',
                    children: t('intelligence.relationshipAnalysis', 'Relationship Analysis'),
                  }),
                  e.jsx('button', {
                    onClick: () => x(!a),
                    className: 'text-xs text-primary hover:underline',
                    children: a
                      ? t('intelligence.showLess', 'Show Less')
                      : t('intelligence.showMore', 'Show More'),
                  }),
                ],
              }),
              e.jsx('p', {
                className: `text-sm text-muted-foreground whitespace-pre-wrap ${a ? '' : 'line-clamp-4'}`,
                children: r && s?.content_ar ? s.content_ar : s?.content,
              }),
            ],
          }),
          s?.metrics &&
            Object.keys(s.metrics).length > 0 &&
            e.jsxs('div', {
              children: [
                e.jsxs('h4', {
                  className: 'text-sm font-medium mb-3 flex items-center gap-2',
                  children: [
                    e.jsx(W, { className: 'h-4 w-4 text-yellow-600' }),
                    t('intelligence.keyOpportunities', 'Key Opportunities'),
                  ],
                }),
                e.jsx('div', {
                  className: 'grid grid-cols-2 gap-3',
                  children: Object.entries(s.metrics).map(([l, n]) =>
                    e.jsxs(
                      'div',
                      {
                        className: 'bg-muted/50 rounded-lg p-3',
                        children: [
                          e.jsxs('div', {
                            className: 'flex items-center gap-2 mb-1',
                            children: [
                              e.jsx(P, { className: 'h-4 w-4 text-blue-600' }),
                              e.jsx('span', {
                                className: 'text-xs font-medium text-muted-foreground capitalize',
                                children: l.replace(/_/g, ' '),
                              }),
                            ],
                          }),
                          e.jsx('p', { className: 'text-sm font-semibold', children: n }),
                        ],
                      },
                      l,
                    ),
                  ),
                }),
              ],
            }),
          h.length > 0 &&
            e.jsxs('div', {
              className: 'border-t pt-3',
              children: [
                e.jsx('h4', {
                  className: 'text-xs font-medium mb-2 text-muted-foreground',
                  children: t('intelligence.sources', 'Data Sources'),
                }),
                e.jsx('div', {
                  className: 'flex flex-wrap gap-2',
                  children: h.map((l, n) =>
                    e.jsx(
                      j,
                      {
                        variant: 'outline',
                        className: 'text-xs bg-background hover:bg-muted',
                        children: l.source,
                      },
                      n,
                    ),
                  ),
                }),
              ],
            }),
          s?.anythingllm_workspace_id &&
            e.jsxs('div', {
              className:
                'text-xs text-muted-foreground border-t pt-2 flex flex-wrap items-center justify-between gap-2',
              children: [
                e.jsxs('div', {
                  children: [
                    e.jsxs('span', {
                      className: 'font-medium',
                      children: [t('intelligence.generatedBy', 'Generated by'), ':'],
                    }),
                    ' ',
                    'AnythingLLM',
                    ' ',
                    s.anythingllm_response_metadata?.model &&
                      e.jsxs('span', {
                        children: ['(', s.anythingllm_response_metadata.model, ')'],
                      }),
                  ],
                }),
                e.jsxs('span', {
                  className: 'font-medium text-foreground',
                  children: ['Confidence: ', s?.confidence_score || 0, '%'],
                }),
              ],
            }),
        ],
      }),
    ],
  })
}
function ue({ dossierId: i, dossier: d }) {
  const { t, i18n: f } = v('dossier'),
    r = f.language === 'ar',
    [s, u] = S.useState(!1),
    { data: c, isLoading: h, isError: g, error: m } = H(i),
    a = D()
  o.useEffect(() => {
    if (s || a.isPending || h) return
    if ((g && m?.status === 404) || !c || c.data.length === 0) {
      ;(u(!0),
        a.mutate(
          {
            entity_id: i,
            intelligence_types: ['economic', 'political', 'security', 'bilateral'],
            force: !1,
            priority: 'normal',
          },
          { onSuccess: (M) => {}, onError: (M) => {} },
        ))
      return
    }
    if (c?.data && c.data.length > 0) {
      const M = Math.min(
          ...c.data.map((G) => new Date(G.last_refreshed_at || G.created_at).getTime()),
        ),
        F = Date.now() - 30 * 24 * 60 * 60 * 1e3
      M < F &&
        (u(!0),
        a.mutate({
          entity_id: i,
          intelligence_types: ['economic', 'political', 'security', 'bilateral'],
          force: !0,
          priority: 'normal',
        }))
    }
  }, [i, c, h, g, m, s, a])
  const x = o.useMemo(() => c?.data || [], [c]),
    l = o.useMemo(() => x.filter((p) => p.intelligence_type === 'economic'), [x]),
    n = o.useMemo(() => x.filter((p) => p.intelligence_type === 'political'), [x]),
    k = o.useMemo(() => x.filter((p) => p.intelligence_type === 'security'), [x]),
    q = o.useMemo(() => x.filter((p) => p.intelligence_type === 'bilateral'), [x])
  if (h)
    return e.jsxs('div', {
      className: 'space-y-6',
      dir: r ? 'rtl' : 'ltr',
      role: 'status',
      'aria-live': 'polite',
      'aria-busy': 'true',
      children: [
        e.jsx('span', {
          className: 'sr-only',
          children: t('intelligence.loadingDashboard', 'Loading intelligence dashboard...'),
        }),
        e.jsxs('div', {
          className: 'flex flex-col sm:flex-row gap-3 sm:gap-4',
          children: [
            e.jsx(R, { className: 'h-10 w-full sm:w-48' }),
            e.jsx(R, { className: 'h-10 w-full sm:w-48' }),
            e.jsx(R, { className: 'h-10 w-full sm:w-32' }),
          ],
        }),
        e.jsx('div', {
          className: 'grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6',
          children: [1, 2, 3, 4].map((p) => e.jsx(R, { className: 'h-96 w-full' }, p)),
        }),
      ],
    })
  if (g && m?.status !== 404)
    return e.jsxs(A, {
      variant: 'destructive',
      dir: r ? 'rtl' : 'ltr',
      children: [
        e.jsx(z, { className: 'h-4 w-4' }),
        e.jsx(C, {
          children:
            m instanceof Error
              ? m.message
              : t('intelligence.error', 'Failed to load intelligence dashboard'),
        }),
      ],
    })
  const K = () => {
    a.mutate({
      entity_id: i,
      intelligence_types: ['economic', 'political', 'security', 'bilateral'],
      force: !1,
      priority: 'normal',
    })
  }
  return (g && m?.status === 404) || !c || c.data.length === 0
    ? a.isPending || (s && !a.isError)
      ? e.jsxs('div', {
          className: 'flex flex-col items-center justify-center py-12 px-4 text-center',
          dir: r ? 'rtl' : 'ltr',
          role: 'region',
          'aria-live': 'polite',
          'aria-busy': 'true',
          children: [
            e.jsx(O, {
              className: 'h-16 w-16 sm:h-20 sm:w-20 text-primary mb-6 animate-spin',
              'aria-hidden': 'true',
            }),
            e.jsx('h3', {
              className: 'text-lg sm:text-xl md:text-2xl font-semibold mb-2',
              children: t('intelligence.generating', 'Generating Intelligence...'),
            }),
            e.jsx('p', {
              className: 'text-sm sm:text-base text-muted-foreground mb-4 max-w-md',
              children: t(
                'intelligence.generatingDescription',
                'AI is analyzing available data to generate comprehensive intelligence insights. This may take 30-60 seconds.',
              ),
            }),
            e.jsxs('div', {
              className: 'flex flex-col sm:flex-row gap-2 text-xs text-muted-foreground',
              children: [
                e.jsx('span', { children: '✓ Economic indicators' }),
                e.jsx('span', { children: '✓ Political analysis' }),
                e.jsx('span', { children: '✓ Security assessment' }),
                e.jsx('span', { children: '✓ Bilateral relations' }),
              ],
            }),
          ],
        })
      : e.jsxs('div', {
          className: 'flex flex-col items-center justify-center py-12 px-4 text-center',
          dir: r ? 'rtl' : 'ltr',
          role: 'region',
          'aria-live': 'polite',
          children: [
            e.jsx(z, {
              className: 'h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground mb-6',
              'aria-hidden': 'true',
            }),
            e.jsx('h3', {
              className: 'text-lg sm:text-xl md:text-2xl font-semibold mb-2',
              children: t('intelligence.noData', 'No Intelligence Available'),
            }),
            e.jsx('p', {
              className: 'text-sm sm:text-base text-muted-foreground mb-8 max-w-md',
              children: t(
                'intelligence.noDataDescription',
                'Generate AI-powered intelligence insights for this country. The system will analyze available data to provide economic, political, security, and bilateral intelligence in both English and Arabic.',
              ),
            }),
            e.jsxs(Button, {
              onClick: K,
              disabled: a.isPending,
              size: 'lg',
              className: 'h-11 sm:h-12 px-6 sm:px-8 gap-2 min-w-11',
              'aria-label': a.isPending
                ? t('intelligence.generating', 'Generating intelligence...')
                : t('intelligence.generateButton', 'Generate Intelligence'),
              children: [
                e.jsx(O, {
                  className: `h-4 w-4 sm:h-5 sm:w-5 ${a.isPending ? 'animate-spin' : ''}`,
                  'aria-hidden': 'true',
                }),
                e.jsx('span', {
                  children: a.isPending
                    ? t('intelligence.generating', 'Generating...')
                    : t('intelligence.generateButton', 'Generate Intelligence'),
                }),
              ],
            }),
            a.isError &&
              e.jsxs(A, {
                variant: 'destructive',
                className: 'mt-6 max-w-md',
                children: [
                  e.jsx(z, { className: 'h-4 w-4' }),
                  e.jsx(C, {
                    children:
                      a.error instanceof Error
                        ? a.error.message
                        : t(
                            'intelligence.generateError',
                            'Failed to generate intelligence. Please try again.',
                          ),
                  }),
                ],
              }),
            a.isSuccess &&
              e.jsx(A, {
                className: 'mt-6 max-w-md',
                children: e.jsx(C, {
                  children: t(
                    'intelligence.generateSuccess',
                    'Intelligence generation started successfully. Data will appear shortly.',
                  ),
                }),
              }),
          ],
        })
    : e.jsxs('div', {
        className: 'space-y-6',
        dir: r ? 'rtl' : 'ltr',
        role: 'region',
        'aria-label': t('intelligence.dashboardLabel', 'Intelligence dashboard'),
        children: [
          e.jsxs('div', {
            className: 'flex flex-col gap-4',
            children: [
              e.jsxs('div', {
                children: [
                  e.jsx('h2', {
                    className: 'text-lg sm:text-xl md:text-2xl font-semibold text-foreground',
                    children: t('intelligence.dashboardTitle', 'Intelligence Dashboard'),
                  }),
                  e.jsx('p', {
                    className: 'text-xs sm:text-sm text-muted-foreground mt-1',
                    children: t(
                      'intelligence.dashboardDescription',
                      'Comprehensive analysis across economic, political, security, and bilateral dimensions',
                    ),
                  }),
                ],
              }),
              d?.extension &&
                e.jsxs('div', {
                  className:
                    'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg border',
                  children: [
                    e.jsxs('div', {
                      className: 'flex items-start gap-2',
                      children: [
                        e.jsx($, {
                          className: 'h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5',
                        }),
                        e.jsxs('div', {
                          className: 'min-w-0',
                          children: [
                            e.jsx('p', {
                              className: 'text-xs text-muted-foreground',
                              children: t('geographic.isoCode', 'ISO Code'),
                            }),
                            e.jsx('p', {
                              className: 'text-sm font-semibold truncate',
                              children: d.extension.iso_code_2 || d.extension.iso_code_3 || 'N/A',
                            }),
                          ],
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      className: 'flex items-start gap-2',
                      children: [
                        e.jsx(U, {
                          className: 'h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5',
                        }),
                        e.jsxs('div', {
                          className: 'min-w-0',
                          children: [
                            e.jsx('p', {
                              className: 'text-xs text-muted-foreground',
                              children: t('geographic.region', 'Region'),
                            }),
                            e.jsx('p', {
                              className: 'text-sm font-semibold truncate',
                              children: d.extension.region || 'N/A',
                            }),
                          ],
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      className: 'flex items-start gap-2',
                      children: [
                        e.jsx(U, {
                          className: 'h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5',
                        }),
                        e.jsxs('div', {
                          className: 'min-w-0',
                          children: [
                            e.jsx('p', {
                              className: 'text-xs text-muted-foreground',
                              children: t('geographic.capital', 'Capital'),
                            }),
                            e.jsx('p', {
                              className: 'text-sm font-semibold truncate',
                              children:
                                (r ? d.extension.capital_ar : d.extension.capital_en) ||
                                d.extension.capital_en ||
                                d.extension.capital_ar ||
                                'N/A',
                            }),
                          ],
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      className: 'flex items-start gap-2',
                      children: [
                        e.jsx(B, {
                          className: 'h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5',
                        }),
                        e.jsxs('div', {
                          className: 'min-w-0',
                          children: [
                            e.jsx('p', {
                              className: 'text-xs text-muted-foreground',
                              children: t('geographic.population', 'Population'),
                            }),
                            e.jsx('p', {
                              className: 'text-sm font-semibold truncate',
                              children: d.extension.population
                                ? d.extension.population.toLocaleString()
                                : 'N/A',
                            }),
                          ],
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      className: 'flex items-start gap-2',
                      children: [
                        e.jsx(X, {
                          className: 'h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5',
                        }),
                        e.jsxs('div', {
                          className: 'min-w-0',
                          children: [
                            e.jsx('p', {
                              className: 'text-xs text-muted-foreground',
                              children: t('geographic.area', 'Area (km²)'),
                            }),
                            e.jsx('p', {
                              className: 'text-sm font-semibold truncate',
                              children: d.extension.area_sq_km
                                ? d.extension.area_sq_km.toLocaleString()
                                : 'N/A',
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              e.jsx('div', {
                className: 'text-xs text-muted-foreground',
                children: t(
                  'intelligence.showingReports',
                  'Showing {{count}} of {{total}} reports',
                  { count: x.length, total: c.data.length },
                ),
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6',
            role: 'list',
            'aria-label': t('intelligence.dashboardSectionsLabel', 'Intelligence sections'),
            children: [
              e.jsx(Z, { reports: l, dossierId: i }),
              e.jsx(ee, { reports: n, dossierId: i }),
              e.jsx(se, { reports: k, dossierId: i }),
              e.jsx(te, { reports: q, dossierId: i }),
            ],
          }),
        ],
      })
}
export { ue as IntelligenceTabContent }
//# sourceMappingURL=IntelligenceTabContent-BjgIr2EY.js.map
