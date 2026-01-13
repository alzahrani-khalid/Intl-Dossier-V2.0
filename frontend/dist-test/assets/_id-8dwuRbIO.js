import { u as k, j as e, r as v, a as ge } from './react-vendor-Buoak6m3.js'
import { a as K, c as W, d as Y, L as R } from './tanstack-vendor-BZC-rs5U.js'
import {
  s as D,
  j as E,
  k as M,
  o as U,
  l as O,
  af as T,
  ag as C,
  B as y,
  V as Z,
  m as B,
  J as H,
  ae as re,
  Z as xe,
  _ as ue,
  $ as G,
  aa as V,
  a5 as pe,
  a6 as he,
  c as F,
  p as fe,
  aN as je,
  A as be,
  E as we,
  F as Ne,
  G as ve,
  H as ye,
  ba as _e,
  al as Q,
} from './index-qYY0KoZ1.js'
import { a as ke } from './useDossier-CiPcwRKl.js'
import { b as Se } from './dossier-type-guards-DQ1YbbnG.js'
import { D as Ee } from './DossierDetailLayout-BuE-52qO.js'
import { a as I, C as $ } from './CollapsibleSection-Bj_Tk5Ee.js'
import {
  aR as De,
  cj as Te,
  aH as A,
  aI as oe,
  bi as Ce,
  cl as Pe,
  bL as L,
  bw as z,
  bm as Ae,
  da as Ie,
  bo as $e,
  aS as te,
  bS as Le,
  bP as Oe,
  cL as Fe,
  b9 as Re,
  cW as Me,
  cX as J,
  d5 as Ue,
  d6 as ze,
  ed as Be,
  cZ as Ke,
  df as qe,
  c$ as He,
  ee as Ge,
  ef as Ve,
  d1 as Qe,
  d0 as Je,
  d3 as Xe,
  cY as ne,
  bd as We,
  bF as ce,
  aD as Ye,
  aX as X,
} from './vendor-misc-BiJvMP0A.js'
import { H as ae, I as Ze, J as es } from './date-vendor-s0MkYge4.js'
import { E as ss } from './EngagementTimeline-C_G2Lr8F.js'
import { R as ts, a as ie } from './radio-group-XNQBLInt.js'
import { A as ns, b as as, a as is } from './avatar-lQOCSoMx.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
import './useUnifiedTimeline-2-SmgReu.js'
import './use-outside-click-DyRG7K6b.js'
function rs({ dossier: t }) {
  const { t: n, i18n: i } = k('dossier'),
    s = i.language === 'ar',
    o = s ? Ze : es,
    r = t.extension,
    a = s ? r?.location_ar || r?.location : r?.location_en || r?.location
  return e.jsxs('div', {
    className: 'space-y-4 sm:space-y-6',
    dir: s ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className: 'flex items-start gap-3 sm:gap-4',
        children: [
          e.jsx(De, {
            className: 'h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground mt-0.5 flex-shrink-0',
          }),
          e.jsxs('div', {
            className: 'flex-1 min-w-0',
            children: [
              e.jsx('p', {
                className: 'text-sm sm:text-base font-medium mb-1',
                children: n('sections.engagement.date'),
              }),
              e.jsx('p', {
                className: 'text-sm sm:text-base text-muted-foreground',
                children: ae(new Date(t.created_at), 'PPP', { locale: o }),
              }),
            ],
          }),
        ],
      }),
      a &&
        e.jsxs('div', {
          className: 'flex items-start gap-3 sm:gap-4',
          children: [
            e.jsx(Te, {
              className: 'h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground mt-0.5 flex-shrink-0',
            }),
            e.jsxs('div', {
              className: 'flex-1 min-w-0',
              children: [
                e.jsx('p', {
                  className: 'text-sm sm:text-base font-medium mb-1',
                  children: n('sections.engagement.location'),
                }),
                e.jsx('p', {
                  className: 'text-sm sm:text-base text-muted-foreground',
                  children: a,
                }),
              ],
            }),
          ],
        }),
      (s ? t.description_ar : t.description_en) &&
        e.jsxs('div', {
          className: 'flex items-start gap-3 sm:gap-4',
          children: [
            e.jsx(A, {
              className: 'h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground mt-0.5 flex-shrink-0',
            }),
            e.jsxs('div', {
              className: 'flex-1 min-w-0',
              children: [
                e.jsx('p', {
                  className: 'text-sm sm:text-base font-medium mb-1',
                  children: n('sections.engagement.description'),
                }),
                e.jsx('p', {
                  className: 'text-sm sm:text-base text-muted-foreground whitespace-pre-wrap',
                  children: s ? t.description_ar : t.description_en,
                }),
              ],
            }),
          ],
        }),
      e.jsxs('div', {
        className: 'flex items-start gap-3 sm:gap-4',
        children: [
          e.jsx(oe, {
            className: 'h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground mt-0.5 flex-shrink-0',
          }),
          e.jsxs('div', {
            className: 'flex-1 min-w-0',
            children: [
              e.jsx('p', {
                className: 'text-sm sm:text-base font-medium mb-1',
                children: n('sections.engagement.createdBy'),
              }),
              e.jsx('p', {
                className: 'text-sm sm:text-base text-muted-foreground',
                children: ae(new Date(t.created_at), 'PPp', { locale: o }),
              }),
            ],
          }),
        ],
      }),
    ],
  })
}
function os({ dossierId: t }) {
  const { t: n, i18n: i } = k('dossier'),
    s = i.language === 'ar'
  return e.jsxs('div', {
    className: 'flex flex-col items-center justify-center py-8 sm:py-12 text-center',
    dir: s ? 'rtl' : 'ltr',
    children: [
      e.jsx('div', {
        className: 'mb-4 sm:mb-6',
        children: e.jsx('div', {
          className:
            'h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center',
          children: e.jsx(oe, { className: 'h-8 w-8 sm:h-10 sm:w-10 text-primary' }),
        }),
      }),
      e.jsx('h3', {
        className: 'text-base sm:text-lg font-semibold text-foreground mb-2',
        children: n('sections.engagement.participantsListEmpty'),
      }),
      e.jsx('p', {
        className: 'text-sm sm:text-base text-muted-foreground max-w-md mb-6 px-4',
        children: n('sections.engagement.participantsListEmptyDescription'),
      }),
      e.jsx('div', {
        className: 'text-xs sm:text-sm text-muted-foreground px-4',
        children: e.jsx('p', { children: n('sections.engagement.participantsListPlaceholder') }),
      }),
    ],
  })
}
function cs({ dossierId: t }) {
  const { t: n, i18n: i } = k('dossier'),
    s = i.language === 'ar'
  return e.jsxs('div', {
    className: 'flex flex-col items-center justify-center py-8 sm:py-12 text-center',
    dir: s ? 'rtl' : 'ltr',
    children: [
      e.jsx('div', {
        className: 'mb-4 sm:mb-6',
        children: e.jsx('div', {
          className:
            'h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center',
          children: e.jsx(Ce, { className: 'h-8 w-8 sm:h-10 sm:w-10 text-primary' }),
        }),
      }),
      e.jsx('h3', {
        className: 'text-base sm:text-lg font-semibold text-foreground mb-2',
        children: n('sections.engagement.outcomesSummaryEmpty'),
      }),
      e.jsx('p', {
        className: 'text-sm sm:text-base text-muted-foreground max-w-md mb-6 px-4',
        children: n('sections.engagement.outcomesSummaryEmptyDescription'),
      }),
      e.jsx('div', {
        className: 'text-xs sm:text-sm text-muted-foreground px-4',
        children: e.jsx('p', { children: n('sections.engagement.outcomesSummaryPlaceholder') }),
      }),
    ],
  })
}
function ls({ dossierId: t }) {
  const { t: n, i18n: i } = k('dossier'),
    s = i.language === 'ar'
  return e.jsxs('div', {
    className: 'flex flex-col items-center justify-center py-8 sm:py-12 text-center',
    dir: s ? 'rtl' : 'ltr',
    children: [
      e.jsx('div', {
        className: 'mb-4 sm:mb-6',
        children: e.jsx('div', {
          className:
            'h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center',
          children: e.jsx(Pe, { className: 'h-8 w-8 sm:h-10 sm:w-10 text-primary' }),
        }),
      }),
      e.jsx('h3', {
        className: 'text-base sm:text-lg font-semibold text-foreground mb-2',
        children: n('sections.engagement.followUpActionsEmpty'),
      }),
      e.jsx('p', {
        className: 'text-sm sm:text-base text-muted-foreground max-w-md mb-6 px-4',
        children: n('sections.engagement.followUpActionsEmptyDescription'),
      }),
      e.jsx('div', {
        className: 'text-xs sm:text-sm text-muted-foreground px-4',
        children: e.jsx('p', { children: n('sections.engagement.followUpActionsPlaceholder') }),
      }),
    ],
  })
}
async function ds(t) {
  const {
    engagementId: n,
    sort: i = 'attached_at',
    order: s = 'desc',
    page: o = 1,
    pageSize: r = 20,
  } = t
  let a = D.from('engagement_positions')
    .select('*, positions(*)', { count: 'exact' })
    .eq('engagement_id', n)
  const d = s === 'asc'
  a = a.order(i, { ascending: d })
  const x = (o - 1) * r,
    u = x + r - 1
  a = a.range(x, u)
  const { data: l, error: p, count: g } = await a
  if (p) throw new Error(`Failed to fetch engagement positions: ${p.message}`)
  return { positions: l || [], total: g || 0 }
}
function ms(t) {
  const {
      engagementId: n,
      sort: i = 'attached_at',
      order: s = 'desc',
      page: o = 1,
      pageSize: r = 20,
      enabled: a = !0,
    } = t,
    {
      data: d,
      isLoading: x,
      isError: u,
      error: l,
      refetch: p,
    } = K({
      queryKey: ['engagement-positions', n, i, s, o, r],
      queryFn: () => ds(t),
      enabled: a && !!n,
      staleTime: 5 * 60 * 1e3,
      gcTime: 10 * 60 * 1e3,
    }),
    g = d?.positions || [],
    m = d?.total || 0,
    b = Math.ceil(m / r)
  return {
    positions: g,
    total: m,
    page: o,
    pageSize: r,
    totalPages: b,
    isLoading: x,
    isError: u,
    error: l,
    refetch: p,
  }
}
var gs = {}
async function xs(t) {
  const { engagementId: n, minRelevance: i = 0.7, limit: s = 10 } = t,
    { data: o } = await D.auth.getSession(),
    r = o.session?.access_token
  if (!r) throw new Error('Authentication required')
  const a = await fetch(
    `${gs.VITE_SUPABASE_URL}/functions/v1/engagements/${n}/positions/suggestions?min_relevance=${i}&limit=${s}`,
    { headers: { Authorization: `Bearer ${r}` } },
  )
  if (!a.ok && a.status !== 503) throw new Error(`Failed to fetch suggestions: ${a.statusText}`)
  const d = await a.json()
  return {
    suggestions: d.data || [],
    meta: d.meta || {
      ai_service_status: a.status === 503 ? 'unavailable' : 'available',
      fallback_mode: a.status === 503,
      generated_at: new Date().toISOString(),
    },
  }
}
function le(t) {
  const { engagementId: n, minRelevance: i = 0.7, limit: s = 10, enabled: o = !0 } = t,
    {
      data: r,
      isLoading: a,
      isError: d,
      error: x,
      refetch: u,
    } = K({
      queryKey: ['position-suggestions', n, i, s],
      queryFn: () => xs(t),
      enabled: o && !!n,
      staleTime: 15 * 60 * 1e3,
      gcTime: 30 * 60 * 1e3,
      retry: 2,
      retryDelay: (l) => Math.min(1e3 * 2 ** l, 5e3),
    })
  return {
    suggestions: r?.suggestions || [],
    meta: r?.meta || null,
    isLoading: a,
    isError: d,
    error: x,
    refetch: u,
  }
}
var us = {}
async function ps(t) {
  const { engagementId: n, suggestionId: i, action: s } = t,
    { data: o } = await D.auth.getSession(),
    r = o.session?.access_token
  if (!r) throw new Error('Authentication required')
  const a = await fetch(
    `${us.VITE_SUPABASE_URL}/functions/v1/engagements/${n}/positions/suggestions`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${r}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestion_id: i, action: s }),
    },
  )
  if (!a.ok) {
    const d = await a.json()
    throw new Error(d.message || 'Failed to update suggestion action')
  }
  return await a.json()
}
function hs() {
  const t = W()
  return Y({
    mutationFn: ps,
    onSuccess: (n, i) => {
      ;(t.invalidateQueries({ queryKey: ['position-suggestions', i.engagementId] }),
        i.action === 'accepted' &&
          t.invalidateQueries({ queryKey: ['engagement-positions', i.engagementId] }))
    },
    onError: (n) => {
      console.error('Failed to update suggestion action:', n)
    },
  })
}
const fs = ({ engagementId: t, onAttach: n, className: i = '' }) => {
  const { t: s, i18n: o } = k(),
    r = o.language === 'ar',
    { data: a, isLoading: d, error: x, refetch: u } = le(t),
    l = a?.suggestions || [],
    p = a?.fallback_mode || !1,
    g = hs(),
    m = (c) =>
      c >= 0.85
        ? {
            label: s('positions.suggestions.relevance.high'),
            icon: Ae,
            variant: 'default',
            color: 'text-green-600 dark:text-green-400',
          }
        : c >= 0.75
          ? {
              label: s('positions.suggestions.relevance.medium'),
              icon: Ie,
              variant: 'secondary',
              color: 'text-yellow-600 dark:text-yellow-400',
            }
          : {
              label: s('positions.suggestions.relevance.low'),
              icon: $e,
              variant: 'outline',
              color: 'text-blue-600 dark:text-blue-400',
            },
    b = async (c) => {
      n && (n(c.position_id), await g.mutateAsync({ suggestionId: c.id, action: 'accepted' }))
    },
    f = async (c) => {
      await g.mutateAsync({ suggestionId: c, action: 'rejected' })
    },
    h = (c) => (o.language === 'ar' ? c.title_ar : c.title_en),
    w = (c) => {
      const j = o.language === 'ar' ? c.content_ar : c.content_en
      return j ? (j.length > 150 ? `${j.substring(0, 150)}...` : j) : ''
    }
  return d
    ? e.jsxs(E, {
        className: i,
        children: [
          e.jsx(M, {
            children: e.jsxs(U, {
              className: 'flex items-center gap-2',
              children: [e.jsx(L, { className: 'h-5 w-5' }), s('positions.suggestions.title')],
            }),
          }),
          e.jsx(O, {
            children: e.jsx('div', {
              className: 'flex items-center justify-center py-8',
              children: e.jsxs('div', {
                className: 'flex flex-col items-center gap-2',
                children: [
                  e.jsx('div', {
                    className:
                      'h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent',
                  }),
                  e.jsx('p', {
                    className: 'text-sm text-muted-foreground',
                    children: s('positions.suggestions.loading'),
                  }),
                ],
              }),
            }),
          }),
        ],
      })
    : x
      ? e.jsxs(E, {
          className: i,
          children: [
            e.jsx(M, {
              children: e.jsxs(U, {
                className: 'flex items-center gap-2',
                children: [e.jsx(L, { className: 'h-5 w-5' }), s('positions.suggestions.title')],
              }),
            }),
            e.jsxs(O, {
              children: [
                e.jsxs(T, {
                  variant: 'destructive',
                  children: [
                    e.jsx(z, { className: 'h-4 w-4' }),
                    e.jsx(C, { children: s('positions.suggestions.error') }),
                  ],
                }),
                e.jsx(y, {
                  variant: 'outline',
                  onClick: () => u(),
                  className: 'mt-4',
                  children: s('positions.suggestions.retry'),
                }),
              ],
            }),
          ],
        })
      : e.jsxs(E, {
          className: i,
          children: [
            e.jsxs(M, {
              children: [
                e.jsxs(U, {
                  className: 'flex items-center gap-2',
                  children: [e.jsx(L, { className: 'h-5 w-5' }), s('positions.suggestions.title')],
                }),
                e.jsx(Z, { children: s('positions.suggestions.description') }),
              ],
            }),
            e.jsxs(O, {
              children: [
                p &&
                  e.jsxs(T, {
                    className: 'mb-4',
                    children: [
                      e.jsx(z, { className: 'h-4 w-4' }),
                      e.jsx(C, { children: s('positions.suggestions.fallbackMode') }),
                    ],
                  }),
                l.length === 0
                  ? e.jsxs('div', {
                      className:
                        'flex flex-col items-center justify-center rounded-lg border border-dashed py-8',
                      children: [
                        e.jsx(L, { className: 'mb-2 h-8 w-8 text-muted-foreground' }),
                        e.jsx('p', {
                          className: 'text-center text-muted-foreground',
                          children: s('positions.suggestions.empty'),
                        }),
                        e.jsx('p', {
                          className: 'mt-1 text-center text-xs text-muted-foreground',
                          children: s('positions.suggestions.emptyHint'),
                        }),
                      ],
                    })
                  : e.jsx('div', {
                      className: 'space-y-3',
                      role: 'list',
                      'aria-label': s('positions.suggestions.listLabel'),
                      children: l.map((c) => {
                        const j = m(c.relevance_score),
                          N = j.icon,
                          P = c.user_action === 'accepted' || c.user_action === 'rejected'
                        return e.jsx(
                          E,
                          {
                            className: `transition-opacity ${P ? 'opacity-50' : ''}`,
                            role: 'listitem',
                            children: e.jsx(O, {
                              className: 'p-4',
                              children: e.jsxs('div', {
                                className: 'flex items-start justify-between gap-3',
                                children: [
                                  e.jsxs('div', {
                                    className: 'flex-1 space-y-2',
                                    children: [
                                      e.jsxs('div', {
                                        className: 'flex items-start gap-2',
                                        children: [
                                          e.jsx('h4', {
                                            className: 'font-medium leading-tight',
                                            dir: r ? 'rtl' : 'ltr',
                                            children: h(c.position),
                                          }),
                                          e.jsxs(B, {
                                            variant: j.variant,
                                            className: 'shrink-0',
                                            children: [
                                              e.jsx(N, { className: `me-1 h-3 w-3 ${j.color}` }),
                                              j.label,
                                            ],
                                          }),
                                        ],
                                      }),
                                      e.jsx('p', {
                                        className: 'text-sm text-muted-foreground line-clamp-2',
                                        dir: r ? 'rtl' : 'ltr',
                                        children: w(c.position),
                                      }),
                                      e.jsxs('div', {
                                        className:
                                          'flex items-center gap-2 text-xs text-muted-foreground',
                                        children: [
                                          e.jsxs('span', {
                                            children: [s('positions.suggestions.score'), ':'],
                                          }),
                                          e.jsxs('span', {
                                            className: 'font-mono font-medium',
                                            children: [(c.relevance_score * 100).toFixed(0), '%'],
                                          }),
                                        ],
                                      }),
                                      c.suggestion_reasoning?.keywords &&
                                        c.suggestion_reasoning.keywords.length > 0 &&
                                        e.jsx('div', {
                                          className: 'flex flex-wrap gap-1',
                                          children: c.suggestion_reasoning.keywords
                                            .slice(0, 3)
                                            .map((S, _) =>
                                              e.jsx(
                                                B,
                                                {
                                                  variant: 'outline',
                                                  className: 'text-xs',
                                                  children: S,
                                                },
                                                _,
                                              ),
                                            ),
                                        }),
                                    ],
                                  }),
                                  !P &&
                                    e.jsxs('div', {
                                      className: 'flex shrink-0 flex-col gap-2',
                                      children: [
                                        e.jsx(y, {
                                          size: 'sm',
                                          onClick: () => b(c),
                                          disabled: !n || g.isPending,
                                          'aria-label': s('positions.suggestions.attachLabel', {
                                            title: h(c.position),
                                          }),
                                          children: s('positions.suggestions.attach'),
                                        }),
                                        e.jsx(y, {
                                          variant: 'ghost',
                                          size: 'sm',
                                          onClick: () => f(c.id),
                                          disabled: g.isPending,
                                          'aria-label': s('positions.suggestions.rejectLabel', {
                                            title: h(c.position),
                                          }),
                                          children: s('positions.suggestions.reject'),
                                        }),
                                      ],
                                    }),
                                  P &&
                                    e.jsx(B, {
                                      variant:
                                        c.user_action === 'accepted' ? 'default' : 'secondary',
                                      children: s(`positions.suggestions.action.${c.user_action}`),
                                    }),
                                ],
                              }),
                            }),
                          },
                          c.id,
                        )
                      }),
                    }),
                l.length > 0 &&
                  e.jsxs(y, {
                    variant: 'outline',
                    size: 'sm',
                    onClick: () => u(),
                    className: 'mt-4 w-full',
                    disabled: d,
                    children: [
                      e.jsx(L, { className: 'me-2 h-4 w-4' }),
                      s('positions.suggestions.refresh'),
                    ],
                  }),
              ],
            }),
          ],
        })
}
var js = {}
async function bs(t) {
  const { engagementId: n, language: i, positionIds: s } = t,
    { data: o } = await D.auth.getSession(),
    r = o.session?.access_token
  if (!r) throw new Error('Authentication required')
  const a = await fetch(`${js.VITE_SUPABASE_URL}/functions/v1/engagements/${n}/briefing-packs`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${r}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: i, ...(s && { position_ids: s }) }),
  })
  if (!a.ok) {
    const d = await a.json()
    throw d.error === 'NO_POSITIONS_ATTACHED'
      ? new Error('No positions are attached to this engagement. Please attach positions first.')
      : d.error === 'TOO_MANY_POSITIONS'
        ? new Error('Too many positions attached (max 100). Please reduce the number of positions.')
        : new Error(d.message || 'Failed to generate briefing pack')
  }
  return await a.json()
}
function ws() {
  const t = W()
  return Y({
    mutationFn: bs,
    onSuccess: (n, i) => {
      ;(t.invalidateQueries({ queryKey: ['briefing-packs', i.engagementId] }),
        i.positionIds &&
          i.positionIds.forEach((s) => {
            t.invalidateQueries({ queryKey: ['position-analytics', s] })
          }))
    },
    onError: (n) => {
      console.error('Failed to generate briefing pack:', n)
    },
  })
}
var Ns = {}
async function vs(t) {
  const { data: n } = await D.auth.getSession(),
    i = n.session?.access_token
  if (!i) throw new Error('Authentication required')
  const s = await fetch(`${Ns.VITE_SUPABASE_URL}/functions/v1/briefing-packs/jobs/${t}/status`, {
    headers: { Authorization: `Bearer ${i}` },
  })
  if (!s.ok)
    throw s.status === 404
      ? new Error('Briefing pack job not found')
      : new Error('Failed to fetch briefing pack status')
  return await s.json()
}
function ys(t) {
  const { jobId: n, enabled: i = !0, onCompleted: s, onFailed: o } = t,
    {
      data: r,
      isLoading: a,
      isError: d,
      error: x,
      refetch: u,
    } = K({
      queryKey: ['briefing-pack-job', n],
      queryFn: () => vs(n),
      enabled: i && !!n,
      refetchInterval: (b) => {
        const f = b.state.data?.status
        return f === 'completed' || f === 'failed'
          ? (f === 'completed' && b.state.data?.briefing_pack && s
              ? s(b.state.data.briefing_pack)
              : f === 'failed' && b.state.data?.error && o && o(b.state.data.error),
            !1)
          : 2e3
      },
      staleTime: 0,
      gcTime: 5 * 60 * 1e3,
    }),
    l = r?.status || 'pending',
    p = l === 'pending' || l === 'generating',
    g = l === 'completed',
    m = l === 'failed'
  return {
    status: r?.status || 'pending',
    progress: r?.progress,
    error: r?.error,
    briefingPack: r?.briefing_pack,
    estimatedCompletionSeconds: r?.estimated_completion_seconds,
    metadata: r?.metadata,
    isLoading: a,
    isError: d,
    queryError: x,
    isPolling: p,
    isCompleted: g,
    isFailed: m,
    refetch: u,
  }
}
const _s = ({ engagementId: t, attachedPositionCount: n, className: i = '' }) => {
  const { t: s } = k(),
    [o, r] = v.useState('en'),
    [a, d] = v.useState(null),
    [x, u] = v.useState('idle'),
    [l, p] = v.useState(null),
    [g, m] = v.useState(null),
    b = ws(),
    { data: f } = ys(a || '')
  v.useEffect(() => {
    f &&
      (f.status === 'completed'
        ? (u('completed'), p(f.file_url), d(null))
        : f.status === 'failed' &&
          (u('failed'), m(f.error_message || s('positions.briefing.error')), d(null)))
  }, [f, s])
  const h = async () => {
      if (n === 0) {
        m(s('positions.briefing.noPositions'))
        return
      }
      ;(u('generating'), m(null), p(null))
      try {
        const N = await b.mutateAsync({ language: o })
        d(N.job_id)
      } catch (N) {
        ;(u('failed'), m(N.message || s('positions.briefing.error')))
      }
    },
    w = () => {
      l && window.open(l, '_blank')
    },
    c = () => {
      ;(u('idle'), p(null), m(null), d(null))
    },
    j = Math.ceil((n / 100) * 10)
  return e.jsxs(E, {
    className: i,
    children: [
      e.jsxs(M, {
        children: [
          e.jsxs(U, {
            className: 'flex items-center gap-2',
            children: [e.jsx(A, { className: 'h-5 w-5' }), s('positions.briefing.title')],
          }),
          e.jsx(Z, { children: s('positions.briefing.description', { count: n }) }),
        ],
      }),
      e.jsxs(O, {
        className: 'space-y-4',
        children: [
          x === 'idle' &&
            e.jsxs(e.Fragment, {
              children: [
                e.jsxs('div', {
                  className: 'space-y-3',
                  children: [
                    e.jsx(H, { children: s('positions.briefing.selectLanguage') }),
                    e.jsxs(ts, {
                      value: o,
                      onValueChange: (N) => r(N),
                      children: [
                        e.jsxs('div', {
                          className: 'flex items-center space-x-2',
                          children: [
                            e.jsx(ie, { value: 'en', id: 'lang-en' }),
                            e.jsx(H, {
                              htmlFor: 'lang-en',
                              className: 'cursor-pointer',
                              children: s('positions.briefing.language.english'),
                            }),
                          ],
                        }),
                        e.jsxs('div', {
                          className: 'flex items-center space-x-2',
                          children: [
                            e.jsx(ie, { value: 'ar', id: 'lang-ar' }),
                            e.jsx(H, {
                              htmlFor: 'lang-ar',
                              className: 'cursor-pointer',
                              children: s('positions.briefing.language.arabic'),
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                e.jsx(T, {
                  children: e.jsx(C, {
                    children: s('positions.briefing.estimatedTime', { seconds: j }),
                  }),
                }),
                e.jsx(y, {
                  onClick: h,
                  disabled: n === 0 || b.isPending,
                  className: 'w-full',
                  children: b.isPending
                    ? e.jsxs(e.Fragment, {
                        children: [
                          e.jsx(te, { className: 'me-2 h-4 w-4 animate-spin' }),
                          s('positions.briefing.initiating'),
                        ],
                      })
                    : e.jsxs(e.Fragment, {
                        children: [
                          e.jsx(A, { className: 'me-2 h-4 w-4' }),
                          s('positions.briefing.generate'),
                        ],
                      }),
                }),
              ],
            }),
          x === 'generating' &&
            e.jsxs('div', {
              className: 'space-y-4',
              children: [
                e.jsx('div', {
                  className: 'flex items-center justify-center py-6',
                  children: e.jsx(te, { className: 'h-12 w-12 animate-spin text-primary' }),
                }),
                e.jsxs('div', {
                  className: 'space-y-2',
                  children: [
                    e.jsx('p', {
                      className: 'text-center text-sm font-medium',
                      children: s('positions.briefing.generating'),
                    }),
                    e.jsx(re, { value: void 0, className: 'h-2' }),
                    e.jsx('p', {
                      className: 'text-center text-xs text-muted-foreground',
                      children: s('positions.briefing.pleaseWait'),
                    }),
                  ],
                }),
              ],
            }),
          x === 'completed' &&
            l &&
            e.jsxs('div', {
              className: 'space-y-4',
              children: [
                e.jsxs('div', {
                  className:
                    'flex flex-col items-center gap-2 rounded-lg border border-green-500 bg-green-50 p-6 dark:bg-green-950',
                  children: [
                    e.jsx(Le, { className: 'h-12 w-12 text-green-600 dark:text-green-400' }),
                    e.jsx('p', {
                      className: 'font-medium text-green-900 dark:text-green-100',
                      children: s('positions.briefing.completed'),
                    }),
                  ],
                }),
                e.jsxs(y, {
                  onClick: w,
                  className: 'w-full',
                  children: [
                    e.jsx(Oe, { className: 'me-2 h-5 w-5' }),
                    s('positions.briefing.download'),
                  ],
                }),
                e.jsx(y, {
                  onClick: c,
                  variant: 'outline',
                  className: 'w-full',
                  children: s('positions.briefing.generateAnother'),
                }),
              ],
            }),
          x === 'failed' &&
            e.jsxs('div', {
              className: 'space-y-4',
              children: [
                e.jsxs(T, {
                  variant: 'destructive',
                  children: [e.jsx(Fe, { className: 'h-4 w-4' }), e.jsx(C, { children: g })],
                }),
                e.jsx(y, {
                  onClick: c,
                  variant: 'outline',
                  className: 'w-full',
                  children: s('positions.briefing.tryAgain'),
                }),
              ],
            }),
          n === 0 &&
            x === 'idle' &&
            e.jsx(T, { children: e.jsx(C, { children: s('positions.briefing.noPositions') }) }),
        ],
      }),
    ],
  })
}
function ks({ engagementId: t }) {
  const { t: n } = k(['positions', 'common']),
    [i, s] = v.useState(!1),
    [o, r] = v.useState('attached'),
    { data: a, isLoading: d, error: x } = ms(t),
    { data: u, isLoading: l, error: p } = le(t),
    g = a?.items || [],
    m = u?.suggestions || [],
    b = u?.fallback_mode || !1,
    f = a?.total || 0,
    h = m.length
  return e.jsxs(E, {
    children: [
      e.jsx(M, {
        children: e.jsxs('div', {
          className: 'flex items-center justify-between',
          children: [
            e.jsxs('div', {
              children: [
                e.jsxs(U, {
                  className: 'flex items-center gap-2',
                  children: [
                    e.jsx(A, { className: 'h-5 w-5' }),
                    n('positions:engagement_section.title'),
                  ],
                }),
                e.jsx(Z, { children: n('positions:engagement_section.subtitle') }),
              ],
            }),
            e.jsxs(y, {
              onClick: () => s(!0),
              size: 'sm',
              className: 'gap-2',
              children: [
                e.jsx(Re, { className: 'h-4 w-4' }),
                n('positions:engagement_section.attach_position'),
              ],
            }),
          ],
        }),
      }),
      e.jsx(O, {
        children: e.jsxs(xe, {
          value: o,
          onValueChange: (w) => r(w),
          children: [
            e.jsxs(ue, {
              className: 'grid w-full grid-cols-3',
              children: [
                e.jsxs(G, {
                  value: 'attached',
                  className: 'gap-2',
                  children: [
                    n('positions:engagement_section.attached_tab'),
                    f > 0 &&
                      e.jsx('span', {
                        className:
                          'ms-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium',
                        children: f,
                      }),
                  ],
                }),
                e.jsxs(G, {
                  value: 'suggestions',
                  className: 'gap-2',
                  children: [
                    e.jsx(L, { className: 'h-4 w-4' }),
                    n('positions:engagement_section.suggestions_tab'),
                    h > 0 &&
                      e.jsx('span', {
                        className:
                          'ms-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium',
                        children: h,
                      }),
                  ],
                }),
                e.jsx(G, {
                  value: 'briefing',
                  disabled: f === 0,
                  className: 'gap-2',
                  children: n('positions:engagement_section.briefing_tab'),
                }),
              ],
            }),
            e.jsx(V, {
              value: 'attached',
              className: 'mt-6',
              children: x
                ? e.jsx('div', {
                    className:
                      'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center',
                    role: 'alert',
                    children: e.jsx('p', {
                      className: 'text-sm text-red-700 dark:text-red-300',
                      children:
                        x instanceof Error
                          ? x.message
                          : n('positions:engagement_section.error_loading_attached'),
                    }),
                  })
                : e.jsx(pe, {
                    positions: g,
                    isLoading: d,
                    context: 'engagement',
                    engagementId: t,
                    emptyMessage: n('positions:engagement_section.no_attached'),
                    showAttachButton: !1,
                  }),
            }),
            e.jsx(V, {
              value: 'suggestions',
              className: 'mt-6',
              children: p
                ? e.jsx('div', {
                    className:
                      'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center',
                    role: 'alert',
                    children: e.jsx('p', {
                      className: 'text-sm text-red-700 dark:text-red-300',
                      children:
                        p instanceof Error
                          ? p.message
                          : n('positions:engagement_section.error_loading_suggestions'),
                    }),
                  })
                : e.jsx(fs, { engagementId: t, suggestions: m, isLoading: l, isFallbackMode: b }),
            }),
            e.jsx(V, {
              value: 'briefing',
              className: 'mt-6',
              children:
                f === 0
                  ? e.jsxs('div', {
                      className: 'text-center py-12',
                      children: [
                        e.jsx(A, { className: 'h-12 w-12 mx-auto text-gray-400 mb-4' }),
                        e.jsx('p', {
                          className: 'text-sm text-gray-500 dark:text-gray-400',
                          children: n('positions:engagement_section.no_positions_for_briefing'),
                        }),
                        e.jsx(y, {
                          onClick: () => r('attached'),
                          variant: 'outline',
                          size: 'sm',
                          className: 'mt-4',
                          children: n('positions:engagement_section.attach_positions_first'),
                        }),
                      ],
                    })
                  : e.jsx(_s, { engagementId: t, positionCount: f }),
            }),
          ],
        }),
      }),
      i && e.jsx(he, { open: i, onClose: () => s(!1), context: 'engagement', contextId: t }),
    ],
  })
}
function Ss({ dossier: t }) {
  const { t: n, i18n: i } = k('dossier'),
    s = i.language === 'ar',
    [o, r] = I(`engagement-${t.id}-information-open`, !0),
    [a, d] = I(`engagement-${t.id}-positions-open`, !0),
    [x, u] = I(`engagement-${t.id}-timeline-open`, !0),
    [l, p] = I(`engagement-${t.id}-participants-open`, !0),
    [g, m] = I(`engagement-${t.id}-outcomes-open`, !0),
    [b, f] = I(`engagement-${t.id}-followup-open`, !0)
  return e.jsxs('div', {
    className: 'space-y-4 sm:space-y-6',
    dir: s ? 'rtl' : 'ltr',
    children: [
      e.jsx($, {
        id: 'information',
        title: n('sections.engagement.information'),
        description: n('sections.engagement.informationDescription'),
        isExpanded: o,
        onToggle: r,
        children: e.jsx(rs, { dossier: t }),
      }),
      e.jsx($, {
        id: 'positions',
        title: n('sections.engagement.positions'),
        description: n('sections.engagement.positionsDescription'),
        isExpanded: a,
        onToggle: d,
        children: e.jsx(ks, { engagementId: t.id }),
      }),
      e.jsx($, {
        id: 'timeline',
        title: n('sections.engagement.eventTimeline'),
        description: n('sections.engagement.eventTimelineDescription'),
        isExpanded: x,
        onToggle: u,
        children: e.jsx(ss, { dossierId: t.id }),
      }),
      e.jsx($, {
        id: 'participants',
        title: n('sections.engagement.participantsList'),
        description: n('sections.engagement.participantsListDescription'),
        isExpanded: l,
        onToggle: p,
        children: e.jsx(os, { dossierId: t.id }),
      }),
      e.jsx($, {
        id: 'outcomes',
        title: n('sections.engagement.outcomesSummary'),
        description: n('sections.engagement.outcomesSummaryDescription'),
        isExpanded: g,
        onToggle: m,
        children: e.jsx(cs, { dossierId: t.id }),
      }),
      e.jsx($, {
        id: 'followup',
        title: n('sections.engagement.followUpActions'),
        description: n('sections.engagement.followUpActionsDescription'),
        isExpanded: b,
        onToggle: f,
        children: e.jsx(ls, { dossierId: t.id }),
      }),
    ],
  })
}
const de = Ge(),
  ee = v.createContext({ columns: [], data: [], activeCardId: null }),
  Es = ({ id: t, children: n, className: i }) => {
    const { isOver: s, setNodeRef: o } = Ve({ id: t })
    return e.jsx('div', {
      className: F(
        'flex size-full min-h-40 flex-col divide-y overflow-hidden rounded-md border bg-secondary text-xs shadow-sm ring-2 transition-all',
        s ? 'ring-primary' : 'ring-transparent',
        i,
      ),
      ref: o,
      children: n,
    })
  },
  Ds = ({ id: t, name: n, children: i, className: s }) => {
    const {
        attributes: o,
        listeners: r,
        setNodeRef: a,
        transition: d,
        transform: x,
        isDragging: u,
      } = Je({ id: t }),
      { activeCardId: l } = v.useContext(ee),
      p = { transition: d, transform: Xe.Transform.toString(x) }
    return e.jsxs(e.Fragment, {
      children: [
        e.jsx('div', {
          style: p,
          ...r,
          ...o,
          ref: a,
          children: e.jsx(E, {
            className: F(
              'cursor-grab gap-4 rounded-md p-3 shadow-sm',
              u && 'pointer-events-none cursor-grabbing opacity-30',
              s,
            ),
            children: i ?? e.jsx('p', { className: 'm-0 font-medium text-sm', children: n }),
          }),
        }),
        l === t &&
          e.jsx(de.In, {
            children: e.jsx(E, {
              className: F(
                'cursor-grab gap-4 rounded-md p-3 shadow-sm ring-2 ring-primary',
                u && 'cursor-grabbing',
                s,
              ),
              children: i ?? e.jsx('p', { className: 'm-0 font-medium text-sm', children: n }),
            }),
          }),
      ],
    })
  },
  Ts = ({ children: t, className: n, ...i }) => {
    const { data: s } = v.useContext(ee),
      o = s.filter((a) => a.column === i.id),
      r = o.map((a) => a.id)
    return e.jsxs(fe, {
      className: 'overflow-hidden',
      children: [
        e.jsx(Qe, {
          items: r,
          children: e.jsx('div', {
            className: F('flex flex-grow flex-col gap-2 p-2', n),
            ...i,
            children: o.map(t),
          }),
        }),
        e.jsx(je, { orientation: 'vertical' }),
      ],
    })
  },
  Cs = ({ className: t, ...n }) =>
    e.jsx('div', { className: F('m-0 p-2 font-semibold text-sm', t), ...n }),
  Ps = ({
    children: t,
    onDragStart: n,
    onDragEnd: i,
    onDragOver: s,
    className: o,
    columns: r,
    data: a,
    onDataChange: d,
    ...x
  }) => {
    const [u, l] = v.useState(null),
      p = Me(J(Be), J(ze), J(Ue)),
      g = (h) => {
        ;(a.find((c) => c.id === h.active.id) && l(h.active.id), n?.(h))
      },
      m = (h) => {
        const { active: w, over: c } = h
        if (!c) return
        const j = a.find((_) => _.id === w.id),
          N = a.find((_) => _.id === c.id)
        if (!j) return
        const P = j.column,
          S = N?.column || r.find((_) => _.id === c.id)?.id || r[0]?.id
        if (P !== S) {
          let _ = [...a]
          const se = _.findIndex((q) => q.id === w.id),
            me = _.findIndex((q) => q.id === c.id)
          ;((_[se].column = S), (_ = ne(_, se, me)), d?.(_))
        }
        s?.(h)
      },
      b = (h) => {
        ;(l(null), i?.(h))
        const { active: w, over: c } = h
        if (!c || w.id === c.id) return
        let j = [...a]
        const N = j.findIndex((S) => S.id === w.id),
          P = j.findIndex((S) => S.id === c.id)
        ;((j = ne(j, N, P)), d?.(j))
      },
      f = {
        onDragStart({ active: h }) {
          const { name: w, column: c } = a.find((j) => j.id === h.id) ?? {}
          return `Picked up the card "${w}" from the "${c}" column`
        },
        onDragOver({ active: h, over: w }) {
          const { name: c } = a.find((N) => N.id === h.id) ?? {},
            j = r.find((N) => N.id === w?.id)?.name
          return `Dragged the card "${c}" over the "${j}" column`
        },
        onDragEnd({ active: h, over: w }) {
          const { name: c } = a.find((N) => N.id === h.id) ?? {},
            j = r.find((N) => N.id === w?.id)?.name
          return `Dropped the card "${c}" into the "${j}" column`
        },
        onDragCancel({ active: h }) {
          const { name: w } = a.find((c) => c.id === h.id) ?? {}
          return `Cancelled dragging the card "${w}"`
        },
      }
    return e.jsx(ee.Provider, {
      value: { columns: r, data: a, activeCardId: u },
      children: e.jsxs(Ke, {
        accessibility: { announcements: f },
        collisionDetection: qe,
        onDragEnd: b,
        onDragOver: m,
        onDragStart: g,
        sensors: p,
        ...x,
        children: [
          e.jsx('div', {
            className: F('grid size-full auto-cols-fr grid-flow-col gap-4', o),
            children: r.map((h) => t(h)),
          }),
          typeof window < 'u' &&
            ge.createPortal(e.jsx(He, { children: e.jsx(de.Out, {}) }), document.body),
        ],
      }),
    })
  }
function As({ assignment: t }) {
  const { t: n } = k('assignments'),
    s = (() => {
      if (!t.current_stage_sla_deadline) return null
      const x = new Date(t.current_stage_sla_deadline),
        u = new Date(),
        l = (x.getTime() - u.getTime()) / (1e3 * 60 * 60)
      return l < 0 ? 'overdue' : l < 4 ? 'urgent' : l < 24 ? 'warning' : 'normal'
    })(),
    o = {
      overdue: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950',
      urgent: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950',
      warning: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950',
      normal: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950',
    },
    r = { high: 'destructive', medium: 'default', low: 'secondary' },
    a = t.work_item_id.split('-')[0],
    d = `${t.work_item_type.toUpperCase()} ${a}`
  return e.jsxs('div', {
    className: 'space-y-3',
    children: [
      e.jsxs('div', {
        className: 'flex items-start gap-2',
        children: [
          e.jsx(A, { className: 'h-4 w-4 mt-0.5 text-muted-foreground shrink-0' }),
          e.jsx('p', { className: 'text-sm font-medium line-clamp-2 text-start', children: d }),
        ],
      }),
      e.jsxs('div', {
        className: 'flex items-center gap-2',
        children: [
          e.jsx(B, {
            variant: r[t.priority] || 'default',
            className: 'text-xs capitalize',
            children: t.priority,
          }),
          e.jsx('span', {
            className: 'text-xs text-muted-foreground capitalize',
            children: t.work_item_type,
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'flex items-center justify-between gap-2 pt-2 border-t',
        children: [
          t.assignee &&
            e.jsxs('div', {
              className: 'flex items-center gap-2',
              children: [
                e.jsxs(ns, {
                  className: 'h-6 w-6',
                  children: [
                    e.jsx(as, { src: t.assignee.avatar_url }),
                    e.jsx(is, {
                      className: 'text-xs',
                      children: t.assignee.full_name?.charAt(0) || 'S',
                    }),
                  ],
                }),
                e.jsx('span', {
                  className: 'text-xs truncate max-w-[120px]',
                  children: t.assignee.full_name || 'Staff Member',
                }),
              ],
            }),
          s &&
            e.jsxs('div', {
              className: `flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${o[s]}`,
              children: [
                e.jsx(We, { className: 'h-3 w-3' }),
                e.jsx('span', { className: 'capitalize', children: s }),
              ],
            }),
        ],
      }),
    ],
  })
}
function Is({ open: t, onClose: n, engagementTitle: i, columns: s, stats: o, onDragEnd: r }) {
  const { t: a, i18n: d } = k('assignments'),
    x = d.language === 'ar',
    u = v.useMemo(
      () => [
        { id: 'todo', name: a('kanban.todo', 'To Do') },
        { id: 'in_progress', name: a('kanban.in_progress', 'In Progress') },
        { id: 'review', name: a('kanban.review', 'Review') },
        { id: 'done', name: a('kanban.done', 'Done') },
        { id: 'cancelled', name: a('kanban.cancelled', 'Cancelled') },
      ],
      [a],
    ),
    l = v.useMemo(() => {
      if (!s) return []
      const g = []
      return (
        (s.todo || []).forEach((m) => g.push({ ...m, column: 'todo' })),
        (s.in_progress || []).forEach((m) => g.push({ ...m, column: 'in_progress' })),
        (s.review || []).forEach((m) => g.push({ ...m, column: 'review' })),
        (s.done || []).forEach((m) => g.push({ ...m, column: 'done' })),
        (s.cancelled || []).forEach((m) => g.push({ ...m, column: 'cancelled' })),
        g
      )
    }, [s]),
    p = (g) => {
      const { active: m, over: b } = g
      if (!b || !r) return
      const f = m.id,
        h = l.find((j) => j.id === f)
      if (!h) return
      const w = b.id
      ;['todo', 'in_progress', 'review', 'done', 'cancelled'].includes(w) &&
        h.column !== w &&
        r(f, w)
    }
  return e.jsx(be, {
    open: t,
    onOpenChange: n,
    children: e.jsxs(we, {
      dir: x ? 'rtl' : 'ltr',
      className: 'max-w-[95vw] max-h-[90vh] p-0',
      children: [
        e.jsx(Ne, {
          className: 'px-4 sm:px-6 pt-4 sm:pt-6 pb-4',
          children: e.jsxs('div', {
            className: 'flex items-start justify-between gap-4',
            children: [
              e.jsxs('div', {
                className: 'flex-1 space-y-2',
                children: [
                  e.jsxs(ve, {
                    className: 'flex items-center gap-2 text-lg sm:text-xl',
                    children: [e.jsx(ce, { className: 'h-4 w-4 sm:h-5 sm:w-5' }), i],
                  }),
                  e.jsx(ye, {
                    className: 'sr-only',
                    children: a(
                      'kanban.description',
                      'Drag and drop tasks between columns to update their workflow stage',
                    ),
                  }),
                  e.jsxs('div', {
                    className: 'space-y-1',
                    children: [
                      e.jsxs('div', {
                        className: 'flex items-center justify-between text-xs sm:text-sm',
                        children: [
                          e.jsxs('span', {
                            className: 'text-muted-foreground',
                            children: [a('kanban.overallProgress', 'Overall Progress'), ':'],
                          }),
                          e.jsxs('span', {
                            className: 'font-medium',
                            children: [
                              Math.round(o.progressPercentage),
                              '% (',
                              o.done,
                              '/',
                              o.total,
                              ' ',
                              a('kanban.completed', 'completed'),
                              ')',
                            ],
                          }),
                        ],
                      }),
                      e.jsx(re, { value: o.progressPercentage, className: 'h-2' }),
                    ],
                  }),
                ],
              }),
              e.jsx(y, {
                variant: 'ghost',
                size: 'icon',
                onClick: n,
                className: 'shrink-0',
                children: e.jsx(Ye, { className: 'h-4 w-4' }),
              }),
            ],
          }),
        }),
        e.jsx('div', {
          className: 'px-4 sm:px-6 pb-4 sm:pb-6 overflow-x-auto',
          children: e.jsx(Ps, {
            columns: u,
            data: l,
            onDragEnd: p,
            className: 'min-w-[1200px] pb-2 gap-3',
            children: (g) =>
              e.jsxs(
                Es,
                {
                  id: g.id,
                  className: 'bg-muted/30 border-muted',
                  children: [
                    e.jsx(Cs, {
                      className: 'bg-muted/50 font-semibold text-sm px-4 py-3 border-b',
                      children: e.jsxs('div', {
                        className: 'flex items-center justify-between',
                        children: [
                          e.jsx('span', { children: g.name }),
                          e.jsx('span', {
                            className:
                              'ms-2 px-2 py-0.5 bg-background rounded-full text-xs font-normal',
                            children: l.filter((m) => m.column === g.id).length,
                          }),
                        ],
                      }),
                    }),
                    e.jsx(Ts, {
                      id: g.id,
                      className: 'p-3 gap-3 min-h-[400px]',
                      children: (m) =>
                        e.jsx(
                          Ds,
                          {
                            id: m.id,
                            name: m.work_item_id,
                            column: m.column,
                            className:
                              'bg-background hover:shadow-md transition-shadow border-border',
                            children: e.jsx(As, { assignment: m }),
                          },
                          m.id,
                        ),
                    }),
                  ],
                },
                g.id,
              ),
          }),
        }),
        e.jsx('div', {
          className: 'px-4 sm:px-6 pb-3 sm:pb-4 text-xs text-muted-foreground',
          children: a('kanban.keyboardHint', 'Drag tasks between columns to update their status'),
        }),
      ],
    }),
  })
}
function $s(t, n = 'created_at') {
  const i = W(),
    {
      data: s,
      isLoading: o,
      error: r,
    } = K({
      queryKey: ['engagement-kanban', t, n],
      queryFn: async () => {
        const {
          data: { session: l },
        } = await D.auth.getSession()
        if (!l) throw new Error('No active session')
        const p = await fetch(
          `https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/engagements-kanban-get?engagement_id=${t}&sort=${n}`,
          { headers: { Authorization: `Bearer ${l.access_token}` } },
        )
        if (!p.ok) throw new Error('Failed to fetch Kanban board')
        return (await p.json()).columns
      },
      enabled: !!t,
    }),
    a = v.useMemo(
      () =>
        s
          ? [
              ...(s.todo || []),
              ...(s.in_progress || []),
              ...(s.review || []),
              ...(s.done || []),
              ...(s.cancelled || []),
            ]
          : [],
      [s],
    ),
    d = v.useMemo(() => {
      if (!s)
        return { total: 0, todo: 0, in_progress: 0, review: 0, done: 0, progressPercentage: 0 }
      const l = a.length,
        p = s.done?.length || 0,
        g = l > 0 ? Math.round((p / l) * 100) : 0
      return {
        total: l,
        todo: s.todo?.length || 0,
        in_progress: s.in_progress?.length || 0,
        review: s.review?.length || 0,
        done: p,
        progressPercentage: g,
      }
    }, [s, a]),
    x = Y({
      mutationFn: async ({ assignmentId: l, newStage: p }) => {
        const {
          data: { session: g },
          error: m,
        } = await D.auth.getSession()
        if (m || !g) throw new Error('No active session')
        const {
          data: { user: b },
        } = await D.auth.getUser()
        if (!b) throw new Error('User not authenticated')
        const f = await fetch(
          'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/assignments-workflow-stage-update',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${g.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              assignment_id: l,
              workflow_stage: p,
              triggered_by_user_id: b.id,
            }),
          },
        )
        if (!f.ok) {
          const h = await f.json()
          throw new Error(h.validation_error || h.error || 'Failed to update assignment stage')
        }
        return f.json()
      },
      onSuccess: () => {
        i.invalidateQueries({ queryKey: ['engagement-kanban', t] })
      },
    }),
    u = v.useCallback(
      (l, p) => {
        x.mutate({ assignmentId: l, newStage: p })
      },
      [x],
    )
  return { assignments: a, columns: s, stats: d, handleDragEnd: u, isLoading: o, error: r }
}
function Ls({ dossier: t }) {
  const { t: n, i18n: i } = k('dossier'),
    s = i.language === 'ar',
    [o, r] = v.useState(!1),
    { columns: a, stats: d, handleDragEnd: x } = $s(t.id),
    u = e.jsxs(e.Fragment, {
      children: [
        e.jsxs(y, {
          variant: 'outline',
          onClick: () => r(!0),
          className: 'gap-2 min-h-11 min-w-11',
          children: [
            e.jsx(ce, { className: 'h-4 w-4' }),
            e.jsx('span', { className: 'hidden sm:inline', children: n('engagement.viewKanban') }),
          ],
        }),
        e.jsx(y, {
          asChild: !0,
          className: 'gap-2 min-h-11 min-w-11',
          children: e.jsxs(R, {
            to: '/engagements/$engagementId/after-action',
            params: { engagementId: t.id },
            children: [
              e.jsx(A, { className: 'h-4 w-4' }),
              e.jsx('span', {
                className: 'hidden sm:inline',
                children: n('engagement.logAfterAction'),
              }),
            ],
          }),
        }),
      ],
    })
  return e.jsxs(e.Fragment, {
    children: [
      e.jsx(Ee, {
        dossier: t,
        gridClassName: 'grid-cols-1',
        headerActions: u,
        children: e.jsx(Ss, { dossier: t }),
      }),
      e.jsx(Is, {
        open: o,
        onClose: () => r(!1),
        engagementTitle: s ? t?.name_ar || '' : t?.name_en || '',
        columns: a,
        stats: d || {
          total: 0,
          todo: 0,
          in_progress: 0,
          review: 0,
          done: 0,
          progressPercentage: 0,
        },
        onDragEnd: x,
      }),
    ],
  })
}
function st() {
  const { t, i18n: n } = k('dossier'),
    i = n.language === 'ar',
    { id: s } = _e.useParams(),
    { data: o, isLoading: r, error: a } = ke(s, ['stats', 'owners', 'contacts'])
  if (r)
    return e.jsxs('div', {
      className: 'flex flex-col items-center justify-center min-h-[50vh] space-y-4',
      dir: i ? 'rtl' : 'ltr',
      children: [
        e.jsx('div', {
          className:
            'h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent',
        }),
        e.jsx('p', {
          className: 'text-sm sm:text-base text-muted-foreground',
          children: t('detail.loading'),
        }),
      ],
    })
  if (a)
    return e.jsxs('div', {
      className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
      dir: i ? 'rtl' : 'ltr',
      children: [
        e.jsxs(T, {
          variant: 'destructive',
          children: [
            e.jsx(z, { className: 'h-4 w-4' }),
            e.jsx(Q, { children: t('detail.error') }),
            e.jsx(C, { children: a instanceof Error ? a.message : t('detail.errorGeneric') }),
          ],
        }),
        e.jsx('div', {
          className: 'mt-4 sm:mt-6',
          children: e.jsx(R, {
            to: '/dossiers',
            children: e.jsxs(y, {
              variant: 'outline',
              className: 'gap-2',
              children: [
                e.jsx(X, { className: `h-4 w-4 ${i ? 'rotate-180' : ''}` }),
                t('action.backToHub'),
              ],
            }),
          }),
        }),
      ],
    })
  if (!o)
    return e.jsxs('div', {
      className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
      dir: i ? 'rtl' : 'ltr',
      children: [
        e.jsxs(T, {
          children: [
            e.jsx(z, { className: 'h-4 w-4' }),
            e.jsx(Q, { children: t('detail.notFound') }),
            e.jsx(C, { children: t('detail.errorGeneric') }),
          ],
        }),
        e.jsx('div', {
          className: 'mt-4 sm:mt-6',
          children: e.jsx(R, {
            to: '/dossiers',
            children: e.jsxs(y, {
              variant: 'outline',
              className: 'gap-2',
              children: [
                e.jsx(X, { className: `h-4 w-4 ${i ? 'rotate-180' : ''}` }),
                t('action.backToHub'),
              ],
            }),
          }),
        }),
      ],
    })
  if (!Se(o)) {
    const d = t(`type.${o.type}`),
      x = t('type.engagement')
    return e.jsxs('div', {
      className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
      dir: i ? 'rtl' : 'ltr',
      children: [
        e.jsxs(T, {
          children: [
            e.jsx(z, { className: 'h-4 w-4' }),
            e.jsx(Q, { children: t('detail.wrongType') }),
            e.jsx(C, {
              children: t('detail.wrongTypeDescription', { actualType: d, expectedType: x }),
            }),
          ],
        }),
        e.jsxs('div', {
          className: 'mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3',
          children: [
            e.jsx(R, {
              to: `/dossiers/${o.type}s/$id`,
              params: { id: o.id },
              children: e.jsx(y, {
                className: 'gap-2 w-full sm:w-auto',
                children: t('action.viewCorrectType', { type: d }),
              }),
            }),
            e.jsx(R, {
              to: '/dossiers/engagements',
              children: e.jsxs(y, {
                variant: 'outline',
                className: 'gap-2 w-full sm:w-auto',
                children: [
                  e.jsx(X, { className: `h-4 w-4 ${i ? 'rotate-180' : ''}` }),
                  t('action.backToList'),
                ],
              }),
            }),
          ],
        }),
      ],
    })
  }
  return e.jsx(Ls, { dossier: o })
}
export { st as component }
//# sourceMappingURL=_id-8dwuRbIO.js.map
