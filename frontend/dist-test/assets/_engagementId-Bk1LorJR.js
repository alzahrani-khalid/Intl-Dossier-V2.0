import { u as K, r as E, j as e } from './react-vendor-Buoak6m3.js'
import { a as fe, c as Ne, d as be, m as Ee, i as Se } from './tanstack-vendor-BZC-rs5U.js'
import {
  s as Ce,
  j as u,
  k as N,
  o as b,
  m as g,
  V as De,
  A as Te,
  aW as ke,
  B as p,
  E as ze,
  F as Le,
  G as Be,
  H as Pe,
  J as ne,
  q as $e,
  r as Ie,
  t as Fe,
  v as Ue,
  w as re,
  n as Ge,
  K as Oe,
  l as h,
  Z as ve,
  _ as ye,
  $ as y,
  aa as _,
  a0 as ie,
} from './index-qYY0KoZ1.js'
import { A as Re, a as qe } from './avatar-lQOCSoMx.js'
import {
  A as Me,
  h as Ve,
  a as He,
  b as Ke,
  c as Qe,
  d as Je,
  e as Ye,
  f as We,
  g as Ze,
} from './alert-dialog-DaWYDPc1.js'
import {
  c as Xe,
  d as es,
  a as le,
  E as q,
  b as ce,
  D as oe,
  P as de,
  A as me,
  e as xe,
} from './engagement.types-DPrd-U1W.js'
import {
  aP as z,
  aH as w,
  bL as V,
  aS as B,
  bn as ge,
  by as ss,
  aB as ts,
  aI as k,
  b_ as _e,
  bi as L,
  aR as we,
  bx as as,
  dY as ns,
  bd as H,
  aM as rs,
  dZ as is,
  bw as ls,
  c6 as cs,
  aX as ue,
  c0 as os,
  b6 as ds,
  cG as he,
  cj as ms,
  aJ as pe,
  aK as xs,
  b9 as je,
  aT as gs,
} from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
const Q = 'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1',
  J = async () => {
    const {
      data: { session: r },
    } = await Ce.auth.getSession()
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${r?.access_token}` }
  },
  v = {
    all: ['engagement-briefs'],
    lists: () => [...v.all, 'list'],
    list: (r, s) => [...v.lists(), r, s],
    contexts: () => [...v.all, 'context'],
    context: (r) => [...v.contexts(), r],
  }
function us(r, s, t) {
  return fe({
    queryKey: v.list(r, s),
    queryFn: async () => {
      const a = await J(),
        c = new URLSearchParams(),
        m = await fetch(`${Q}/engagement-briefs/${r}?${c}`, { headers: a })
      if (!m.ok) {
        const j = await m.json()
        throw new Error(j.error?.message_en || 'Failed to fetch briefs')
      }
      return m.json()
    },
    enabled: !!r,
    staleTime: 3e4,
    gcTime: 5 * 6e4,
    ...t,
  })
}
function hs(r, s) {
  return fe({
    queryKey: v.context(r),
    queryFn: async () => {
      const t = await J(),
        a = await fetch(`${Q}/engagement-briefs/${r}/context`, { headers: t })
      if (!a.ok) {
        const c = await a.json()
        throw new Error(c.error?.message_en || 'Failed to fetch brief context')
      }
      return a.json()
    },
    enabled: !!r,
    staleTime: 6e4,
    gcTime: 10 * 6e4,
    ...s,
  })
}
function ps() {
  const r = Ne(),
    { t: s } = K('engagement-briefs')
  return be({
    mutationFn: async (t) => {
      const a = await J(),
        c = await fetch(`${Q}/engagement-briefs/${t.engagementId}/generate`, {
          method: 'POST',
          headers: a,
          body: JSON.stringify({
            custom_prompt: t.custom_prompt,
            language: t.language,
            date_range_start: t.date_range_start,
            date_range_end: t.date_range_end,
          }),
        }),
        m = await c.json()
      if (!c.ok) {
        if (m.fallback) return { success: !1, fallback: m.fallback, error: m.error }
        throw new Error(m.error?.message_en || 'Failed to generate brief')
      }
      return { success: !0, brief: m }
    },
    onSuccess: (t, a) => {
      t.success
        ? (r.invalidateQueries({ queryKey: v.list(a.engagementId) }),
          z.success(s('messages.generated', 'Brief generated successfully')))
        : z.warning(
            s(
              'messages.aiUnavailable',
              'AI unavailable. Use the template to create a manual brief.',
            ),
          )
    },
    onError: (t) => {
      z.error(s('messages.generateError', { error: t.message }))
    },
  })
}
function js() {
  const r = Ne(),
    { t: s } = K('engagement-briefs')
  return be({
    mutationFn: async (t) => {
      const a = await J(),
        c = await fetch(
          `${Q}/engagement-briefs/${t.engagementId}/link/${t.briefId}?brief_type=${t.brief_type}`,
          { method: 'DELETE', headers: a },
        )
      if (!c.ok) {
        const m = await c.json()
        throw new Error(m.error?.message_en || 'Failed to unlink brief')
      }
      return c.json()
    },
    onSuccess: (t, a) => {
      ;(r.invalidateQueries({ queryKey: v.list(a.engagementId) }),
        z.success(s('messages.unlinked', 'Brief unlinked successfully')))
    },
    onError: (t) => {
      z.error(s('messages.unlinkError', { error: t.message }))
    },
  })
}
function fs({ engagementId: r, engagementName: s }) {
  const { t, i18n: a } = K('engagement-briefs'),
    c = a.language === 'ar',
    [m, j] = E.useState('briefs'),
    [P, $] = E.useState(!1),
    [o, Y] = E.useState('en'),
    [I, F] = E.useState(''),
    { data: U, isLoading: G } = us(r),
    { data: x, isLoading: S, refetch: W } = hs(r),
    C = ps(),
    O = js(),
    f = U?.data || [],
    D = async () => {
      ;(await C.mutateAsync({ engagementId: r, language: o, custom_prompt: I || void 0 }),
        $(!1),
        F(''))
    },
    Z = async (l, A) => {
      await O.mutateAsync({ engagementId: r, briefId: l, brief_type: A })
    },
    X = (l) => {
      switch (l) {
        case 'completed':
          return 'bg-green-500/10 text-green-600 border-green-200'
        case 'generating':
          return 'bg-blue-500/10 text-blue-600 border-blue-200'
        case 'failed':
          return 'bg-red-500/10 text-red-600 border-red-200'
        default:
          return 'bg-gray-500/10 text-gray-600 border-gray-200'
      }
    },
    i = (l) => {
      switch (l) {
        case 'completed':
          return e.jsx(L, { className: 'size-3' })
        case 'generating':
          return e.jsx(B, { className: 'size-3 animate-spin' })
        case 'failed':
          return e.jsx(ls, { className: 'size-3' })
        default:
          return e.jsx(H, { className: 'size-3' })
      }
    },
    R = (l) =>
      new Date(l).toLocaleDateString(c ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
  return e.jsxs(u, {
    dir: c ? 'rtl' : 'ltr',
    children: [
      e.jsx(N, {
        children: e.jsxs('div', {
          className: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
          children: [
            e.jsxs('div', {
              children: [
                e.jsxs(b, {
                  className: 'flex items-center gap-2 text-lg',
                  children: [
                    e.jsx(w, { className: 'size-5 text-primary' }),
                    t('title'),
                    f.length > 0 &&
                      e.jsx(g, { variant: 'secondary', className: 'ms-2', children: f.length }),
                  ],
                }),
                e.jsx(De, { className: 'mt-1', children: t('description') }),
              ],
            }),
            e.jsx('div', {
              className: 'flex gap-2',
              children: e.jsxs(Te, {
                open: P,
                onOpenChange: $,
                children: [
                  e.jsx(ke, {
                    asChild: !0,
                    children: e.jsxs(p, {
                      size: 'sm',
                      className: 'gap-2',
                      children: [
                        e.jsx(V, { className: 'size-4' }),
                        e.jsx('span', {
                          className: 'hidden sm:inline',
                          children: t('actions.generateWithAI'),
                        }),
                      ],
                    }),
                  }),
                  e.jsxs(ze, {
                    className: 'max-w-lg',
                    dir: c ? 'rtl' : 'ltr',
                    children: [
                      e.jsxs(Le, {
                        children: [
                          e.jsxs(Be, {
                            className: 'flex items-center gap-2',
                            children: [
                              e.jsx(V, { className: 'size-5 text-primary' }),
                              t('generateDialog.title'),
                            ],
                          }),
                          e.jsx(Pe, { children: t('generateDialog.description') }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'space-y-4 py-4',
                        children: [
                          x &&
                            e.jsx('div', {
                              className: 'p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground',
                              children: t('generateDialog.contextInfo', {
                                participantCount: x.participants?.length || 0,
                                positionCount: x.positions?.length || 0,
                                commitmentCount: x.commitments?.length || 0,
                              }),
                            }),
                          e.jsxs('div', {
                            className: 'space-y-2',
                            children: [
                              e.jsx(ne, { children: t('labels.language') }),
                              e.jsxs($e, {
                                value: o,
                                onValueChange: (l) => Y(l),
                                children: [
                                  e.jsx(Ie, { children: e.jsx(Fe, {}) }),
                                  e.jsxs(Ue, {
                                    children: [
                                      e.jsx(re, {
                                        value: 'en',
                                        children: t('generateDialog.languageEn'),
                                      }),
                                      e.jsx(re, {
                                        value: 'ar',
                                        children: t('generateDialog.languageAr'),
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                          e.jsxs('div', {
                            className: 'space-y-2',
                            children: [
                              e.jsx(ne, { children: t('labels.customPrompt') }),
                              e.jsx(Ge, {
                                placeholder: t('generateDialog.customPromptPlaceholder'),
                                value: I,
                                onChange: (l) => F(l.target.value),
                                rows: 3,
                              }),
                            ],
                          }),
                        ],
                      }),
                      e.jsxs(Oe, {
                        children: [
                          e.jsx(p, {
                            variant: 'outline',
                            onClick: () => $(!1),
                            children: t('actions.cancel'),
                          }),
                          e.jsx(p, {
                            onClick: D,
                            disabled: C.isPending,
                            className: 'gap-2',
                            children: C.isPending
                              ? e.jsxs(e.Fragment, {
                                  children: [
                                    e.jsx(B, { className: 'size-4 animate-spin' }),
                                    t('generateDialog.generating'),
                                  ],
                                })
                              : e.jsxs(e.Fragment, {
                                  children: [
                                    e.jsx(V, { className: 'size-4' }),
                                    t('actions.generate'),
                                  ],
                                }),
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            }),
          ],
        }),
      }),
      e.jsx(h, {
        children: e.jsxs(ve, {
          value: m,
          onValueChange: j,
          children: [
            e.jsxs(ye, {
              className: 'w-full sm:w-auto mb-4',
              children: [
                e.jsxs(y, {
                  value: 'briefs',
                  className: 'flex-1 sm:flex-none gap-2',
                  children: [e.jsx(w, { className: 'size-4' }), t('tabs.briefs')],
                }),
                e.jsxs(y, {
                  value: 'context',
                  className: 'flex-1 sm:flex-none gap-2',
                  children: [e.jsx(ge, { className: 'size-4' }), t('tabs.context')],
                }),
              ],
            }),
            e.jsx(_, {
              value: 'briefs',
              className: 'space-y-4',
              children: G
                ? e.jsx('div', {
                    className: 'space-y-3',
                    children: [1, 2].map((l) => e.jsx(ie, { className: 'h-24 w-full' }, l)),
                  })
                : f.length === 0
                  ? e.jsxs('div', {
                      className: 'text-center py-12',
                      children: [
                        e.jsx(w, { className: 'size-12 text-muted-foreground mx-auto mb-4' }),
                        e.jsx('h3', {
                          className: 'text-lg font-medium',
                          children: t('empty.title'),
                        }),
                        e.jsx('p', {
                          className: 'text-sm text-muted-foreground mt-1',
                          children: t('empty.description'),
                        }),
                      ],
                    })
                  : e.jsx(ss, {
                      mode: 'popLayout',
                      children: f.map((l) =>
                        e.jsx(
                          Ns,
                          {
                            brief: l,
                            onUnlink: (A) => Z(l.id, A),
                            isUnlinking: O.isPending,
                            isRTL: c,
                            t,
                            formatDate: R,
                            getStatusColor: X,
                            getStatusIcon: i,
                          },
                          l.id,
                        ),
                      ),
                    }),
            }),
            e.jsxs(_, {
              value: 'context',
              className: 'space-y-4',
              children: [
                e.jsxs('div', {
                  className: 'flex items-center justify-between mb-4',
                  children: [
                    e.jsx('h4', { className: 'font-medium', children: t('sections.context') }),
                    e.jsxs(p, {
                      variant: 'outline',
                      size: 'sm',
                      onClick: () => W(),
                      disabled: S,
                      className: 'gap-2',
                      children: [
                        e.jsx(ts, { className: `size-4 ${S ? 'animate-spin' : ''}` }),
                        t('actions.refresh'),
                      ],
                    }),
                  ],
                }),
                S
                  ? e.jsx('div', {
                      className: 'space-y-3',
                      children: [1, 2, 3, 4].map((l) => e.jsx(ie, { className: 'h-20 w-full' }, l)),
                    })
                  : x
                    ? e.jsxs('div', {
                        className: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
                        children: [
                          e.jsx(M, {
                            icon: k,
                            title: t('sections.participants'),
                            count: x.participants?.length || 0,
                            items: x.participants
                              ?.slice(0, 3)
                              .map((l) => ({
                                label: l.name_en || l.name_ar || 'Unknown',
                                sublabel: l.role,
                              })),
                            isRTL: c,
                          }),
                          e.jsx(M, {
                            icon: _e,
                            title: t('sections.positions'),
                            count: x.positions?.length || 0,
                            items: x.positions
                              ?.slice(0, 3)
                              .map((l) => ({
                                label: l.title_en || l.title_ar || 'Position',
                                sublabel: l.stance,
                              })),
                            isRTL: c,
                          }),
                          e.jsx(M, {
                            icon: L,
                            title: t('sections.commitments'),
                            count: x.commitments?.length || 0,
                            items: x.commitments
                              ?.slice(0, 3)
                              .map((l) => ({
                                label: l.title_en || l.title_ar || 'Commitment',
                                sublabel: l.status,
                              })),
                            isRTL: c,
                          }),
                          e.jsx(M, {
                            icon: we,
                            title: t('sections.recentInteractions'),
                            count: x.recent_interactions?.length || 0,
                            items: x.recent_interactions
                              ?.slice(0, 3)
                              .map((l) => ({
                                label: l.event_title_en || 'Event',
                                sublabel: new Date(l.event_date).toLocaleDateString(),
                              })),
                            isRTL: c,
                          }),
                        ],
                      })
                    : e.jsxs('div', {
                        className: 'text-center py-8',
                        children: [
                          e.jsx(ge, { className: 'size-12 text-muted-foreground mx-auto mb-4' }),
                          e.jsx('h3', {
                            className: 'text-lg font-medium',
                            children: t('empty.contextTitle'),
                          }),
                          e.jsx('p', {
                            className: 'text-sm text-muted-foreground mt-1',
                            children: t('empty.contextDescription'),
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
function Ns({
  brief: r,
  onUnlink: s,
  isUnlinking: t,
  isRTL: a,
  t: c,
  formatDate: m,
  getStatusColor: j,
  getStatusIcon: P,
}) {
  return e.jsx(as.div, {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    className: 'border rounded-lg p-4 hover:shadow-md transition-shadow',
    children: e.jsxs('div', {
      className: 'flex flex-col sm:flex-row sm:items-start gap-4',
      children: [
        e.jsxs('div', {
          className: 'flex-1 min-w-0',
          children: [
            e.jsxs('div', {
              className: 'flex items-center gap-2 flex-wrap mb-2',
              children: [
                e.jsx('h4', {
                  className: 'font-medium truncate',
                  children: r.title || c('card.viewDetails'),
                }),
                e.jsxs(g, {
                  variant: 'outline',
                  className: j(r.status),
                  children: [
                    e.jsx('span', { className: 'me-1', children: P(r.status) }),
                    c(`statuses.${r.status}`),
                  ],
                }),
                r.brief_type === 'ai' &&
                  e.jsxs(g, {
                    variant: 'secondary',
                    className: 'gap-1',
                    children: [e.jsx(V, { className: 'size-3' }), c('briefTypes.ai')],
                  }),
                r.has_citations &&
                  e.jsx(g, {
                    variant: 'outline',
                    className: 'gap-1',
                    children: e.jsx(ns, { className: 'size-3' }),
                  }),
              ],
            }),
            r.summary &&
              e.jsx('p', {
                className: 'text-sm text-muted-foreground line-clamp-2',
                children: r.summary,
              }),
            e.jsxs('div', {
              className: 'flex items-center gap-4 mt-2 text-xs text-muted-foreground',
              children: [
                e.jsxs('span', {
                  className: 'flex items-center gap-1',
                  children: [e.jsx(H, { className: 'size-3' }), m(r.created_at)],
                }),
                e.jsx('span', { children: c(`sources.${r.source}`) }),
              ],
            }),
          ],
        }),
        e.jsxs('div', {
          className: 'flex gap-2 sm:flex-col',
          children: [
            e.jsxs(p, {
              variant: 'outline',
              size: 'sm',
              className: 'gap-1 flex-1 sm:flex-none',
              children: [
                e.jsx(rs, { className: `size-4 ${a ? 'rotate-180' : ''}` }),
                c('actions.view'),
              ],
            }),
            e.jsxs(p, {
              variant: 'ghost',
              size: 'sm',
              onClick: () => s(r.brief_type),
              disabled: t,
              className: 'gap-1 text-destructive hover:text-destructive',
              children: [
                t
                  ? e.jsx(B, { className: 'size-4 animate-spin' })
                  : e.jsx(is, { className: 'size-4' }),
                e.jsx('span', {
                  className: 'sr-only sm:not-sr-only',
                  children: c('actions.unlink'),
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  })
}
function M({ icon: r, title: s, count: t, items: a, isRTL: c }) {
  return e.jsxs('div', {
    className: 'border rounded-lg p-4',
    children: [
      e.jsxs('div', {
        className: 'flex items-center justify-between mb-3',
        children: [
          e.jsxs('div', {
            className: 'flex items-center gap-2',
            children: [
              e.jsx(r, { className: 'size-4 text-primary' }),
              e.jsx('span', { className: 'font-medium text-sm', children: s }),
            ],
          }),
          e.jsx(g, { variant: 'secondary', children: t }),
        ],
      }),
      a && a.length > 0
        ? e.jsx('ul', {
            className: 'space-y-2',
            children: a.map((m, j) =>
              e.jsxs(
                'li',
                {
                  className: 'text-sm',
                  children: [
                    e.jsx('span', { className: 'font-medium', children: m.label }),
                    m.sublabel &&
                      e.jsxs('span', {
                        className: 'text-muted-foreground text-xs ms-2',
                        children: ['(', m.sublabel, ')'],
                      }),
                  ],
                },
                j,
              ),
            ),
          })
        : e.jsx('p', { className: 'text-sm text-muted-foreground', children: 'No items' }),
    ],
  })
}
function bs() {
  const { engagementId: r } = Ee({ from: '/_protected/engagements/$engagementId' }),
    { t: s, i18n: t } = K('engagements'),
    a = t.language === 'ar',
    c = Se(),
    [m, j] = E.useState('overview'),
    [P, $] = E.useState({ participants: !0, agenda: !0, outcomes: !0 }),
    { data: o, isLoading: Y, isError: I, error: F } = Xe(r),
    U = es(),
    G = () => {
      c({ to: '/engagements' })
    },
    x = () => {
      c({ to: '/engagements/$engagementId/edit', params: { engagementId: r } })
    },
    S = async () => {
      ;(await U.mutateAsync(r), c({ to: '/engagements' }))
    },
    W = (n) => {
      switch (n) {
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
    C = (n) => {
      switch (n) {
        case 'completed':
          return 'bg-green-500/10 text-green-600 border-green-200'
        case 'in_progress':
          return 'bg-blue-500/10 text-blue-600 border-blue-200'
        case 'planned':
          return 'bg-gray-500/10 text-gray-600 border-gray-200'
        case 'skipped':
          return 'bg-orange-500/10 text-orange-600 border-orange-200'
        case 'postponed':
          return 'bg-yellow-500/10 text-yellow-600 border-yellow-200'
        default:
          return 'bg-gray-500/10 text-gray-600 border-gray-200'
      }
    },
    O = (n) => {
      switch (n) {
        case 'attended':
          return 'bg-green-500/10 text-green-600'
        case 'confirmed':
          return 'bg-emerald-500/10 text-emerald-600'
        case 'expected':
          return 'bg-blue-500/10 text-blue-600'
        case 'tentative':
          return 'bg-yellow-500/10 text-yellow-600'
        case 'no_show':
          return 'bg-red-500/10 text-red-600'
        case 'cancelled':
          return 'bg-gray-500/10 text-gray-600'
        default:
          return 'bg-gray-500/10 text-gray-600'
      }
    },
    f = (n) =>
      new Date(n).toLocaleDateString(a ? 'ar-SA' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    D = (n) =>
      new Date(n).toLocaleTimeString(a ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
    Z = (n, d) => {
      const T = new Date(n),
        Ae = new Date(d)
      return T.toDateString() === Ae.toDateString() ? f(n) : `${f(n)} - ${f(d)}`
    },
    X = (n) =>
      n
        .split(' ')
        .map((d) => d[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
  if (Y)
    return e.jsx('div', {
      className: 'flex min-h-96 items-center justify-center',
      children: e.jsx(B, { className: 'size-8 animate-spin text-primary' }),
    })
  if (I || !o)
    return e.jsxs('div', {
      className: 'flex min-h-96 flex-col items-center justify-center gap-4',
      children: [
        e.jsx(cs, { className: 'size-12 text-destructive' }),
        e.jsxs('div', {
          className: 'text-center',
          children: [
            e.jsx('h2', {
              className: 'text-xl font-semibold text-foreground',
              children: s('error.notFound', 'Engagement not found'),
            }),
            e.jsx('p', {
              className: 'text-sm text-muted-foreground',
              children:
                F?.message ||
                s('error.notFoundDescription', 'The engagement you are looking for does not exist'),
            }),
          ],
        }),
        e.jsxs(p, {
          onClick: G,
          children: [
            e.jsx(ue, { className: 'h-4 w-4 me-2' }),
            s('actions.backToList', 'Back to List'),
          ],
        }),
      ],
    })
  const i = o.engagement,
    R = a ? i.name_ar : i.name_en,
    l = a ? i.description_ar : i.description_en,
    A = a ? i.location_ar : i.location_en,
    ee = a ? i.venue_ar : i.venue_en,
    se = a ? i.objectives_ar : i.objectives_en,
    te = a ? i.outcomes_ar : i.outcomes_en,
    ae = a ? i.notes_ar : i.notes_en
  return e.jsxs('div', {
    className: 'min-h-screen bg-background',
    dir: a ? 'rtl' : 'ltr',
    children: [
      e.jsx('header', {
        className: 'border-b bg-background sticky top-0 z-10',
        children: e.jsx('div', {
          className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-4',
          children: e.jsxs('div', {
            className: 'flex items-center justify-between gap-4',
            children: [
              e.jsxs('div', {
                className: 'flex items-center gap-4',
                children: [
                  e.jsx(p, {
                    variant: 'ghost',
                    size: 'icon',
                    onClick: G,
                    className: 'h-10 w-10',
                    children: e.jsx(ue, { className: `h-5 w-5 ${a ? 'rotate-180' : ''}` }),
                  }),
                  e.jsxs('div', {
                    children: [
                      e.jsxs('div', {
                        className: 'flex items-center gap-2 flex-wrap',
                        children: [
                          e.jsx('h1', { className: 'text-xl sm:text-2xl font-bold', children: R }),
                          e.jsx(g, {
                            variant: 'outline',
                            className: W(i.engagement_status),
                            children: a ? le[i.engagement_status].ar : le[i.engagement_status].en,
                          }),
                        ],
                      }),
                      e.jsx('p', {
                        className: 'text-sm text-muted-foreground',
                        children: a ? q[i.engagement_type].ar : q[i.engagement_type].en,
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'flex gap-2',
                children: [
                  e.jsxs(p, {
                    variant: 'outline',
                    size: 'sm',
                    onClick: x,
                    children: [
                      e.jsx(os, { className: 'h-4 w-4 sm:me-2' }),
                      e.jsx('span', {
                        className: 'hidden sm:inline',
                        children: s('actions.edit', 'Edit'),
                      }),
                    ],
                  }),
                  e.jsxs(Me, {
                    children: [
                      e.jsx(Ve, {
                        asChild: !0,
                        children: e.jsx(p, {
                          variant: 'outline',
                          size: 'sm',
                          className: 'text-destructive hover:text-destructive',
                          children: e.jsx(ds, { className: 'h-4 w-4' }),
                        }),
                      }),
                      e.jsxs(He, {
                        children: [
                          e.jsxs(Ke, {
                            children: [
                              e.jsx(Qe, { children: s('archive.title', 'Archive Engagement?') }),
                              e.jsx(Je, {
                                children: s(
                                  'archive.description',
                                  'This will archive the engagement and hide it from the list. This action can be undone.',
                                ),
                              }),
                            ],
                          }),
                          e.jsxs(Ye, {
                            children: [
                              e.jsx(We, { children: s('actions.cancel', 'Cancel') }),
                              e.jsxs(Ze, {
                                onClick: S,
                                className:
                                  'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                                children: [
                                  U.isPending &&
                                    e.jsx(B, { className: 'h-4 w-4 animate-spin me-2' }),
                                  s('actions.archive', 'Archive'),
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
      }),
      e.jsx('main', {
        className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6',
        children: e.jsxs(ve, {
          value: m,
          onValueChange: j,
          className: 'space-y-6',
          children: [
            e.jsxs(ye, {
              className: 'w-full sm:w-auto',
              children: [
                e.jsx(y, {
                  value: 'overview',
                  className: 'flex-1 sm:flex-none',
                  children: s('tabs.overview', 'Overview'),
                }),
                e.jsx(y, {
                  value: 'participants',
                  className: 'flex-1 sm:flex-none',
                  children: s('tabs.participants', 'Participants'),
                }),
                e.jsx(y, {
                  value: 'agenda',
                  className: 'flex-1 sm:flex-none',
                  children: s('tabs.agenda', 'Agenda'),
                }),
                e.jsx(y, {
                  value: 'outcomes',
                  className: 'flex-1 sm:flex-none',
                  children: s('tabs.outcomes', 'Outcomes'),
                }),
                e.jsx(y, {
                  value: 'briefs',
                  className: 'flex-1 sm:flex-none',
                  children: s('tabs.briefs', 'Briefs'),
                }),
              ],
            }),
            e.jsx(_, {
              value: 'overview',
              className: 'space-y-6',
              children: e.jsxs('div', {
                className: 'grid grid-cols-1 lg:grid-cols-3 gap-6',
                children: [
                  e.jsxs(u, {
                    className: 'lg:col-span-1',
                    children: [
                      e.jsx(N, {
                        children: e.jsx(b, {
                          className: 'text-lg',
                          children: s('sections.details', 'Details'),
                        }),
                      }),
                      e.jsxs(h, {
                        className: 'space-y-4',
                        children: [
                          e.jsxs('div', {
                            className: 'space-y-2',
                            children: [
                              e.jsxs('div', {
                                className: 'flex items-center gap-2',
                                children: [
                                  e.jsx(we, { className: 'h-4 w-4 text-muted-foreground' }),
                                  e.jsx('span', {
                                    className: 'text-sm',
                                    children: a ? q[i.engagement_type].ar : q[i.engagement_type].en,
                                  }),
                                ],
                              }),
                              e.jsx(g, {
                                variant: 'secondary',
                                children: a
                                  ? ce[i.engagement_category].ar
                                  : ce[i.engagement_category].en,
                              }),
                            ],
                          }),
                          e.jsxs('div', {
                            className: 'pt-4 border-t',
                            children: [
                              e.jsxs('h4', {
                                className: 'text-sm font-medium mb-2 flex items-center gap-2',
                                children: [
                                  e.jsx(H, { className: 'h-4 w-4 text-muted-foreground' }),
                                  s('sections.schedule', 'Schedule'),
                                ],
                              }),
                              e.jsx('p', {
                                className: 'text-sm text-muted-foreground',
                                children: Z(i.start_date, i.end_date),
                              }),
                              e.jsxs('p', {
                                className: 'text-xs text-muted-foreground mt-1',
                                children: [D(i.start_date), ' - ', D(i.end_date)],
                              }),
                            ],
                          }),
                          e.jsxs('div', {
                            className: 'pt-4 border-t',
                            children: [
                              e.jsxs('h4', {
                                className: 'text-sm font-medium mb-2 flex items-center gap-2',
                                children: [
                                  i.is_virtual
                                    ? e.jsx(he, { className: 'h-4 w-4 text-muted-foreground' })
                                    : e.jsx(ms, { className: 'h-4 w-4 text-muted-foreground' }),
                                  s('sections.location', 'Location'),
                                ],
                              }),
                              i.is_virtual
                                ? e.jsxs('div', {
                                    children: [
                                      e.jsxs(g, {
                                        variant: 'outline',
                                        className: 'mb-2',
                                        children: [
                                          e.jsx(he, { className: 'h-3 w-3 me-1' }),
                                          s('card.virtual', 'Virtual'),
                                        ],
                                      }),
                                      i.virtual_link &&
                                        e.jsx('a', {
                                          href: i.virtual_link,
                                          target: '_blank',
                                          rel: 'noopener noreferrer',
                                          className:
                                            'text-sm text-primary hover:underline block truncate',
                                          children: i.virtual_link,
                                        }),
                                    ],
                                  })
                                : e.jsxs('div', {
                                    className: 'space-y-1',
                                    children: [
                                      A && e.jsx('p', { className: 'text-sm', children: A }),
                                      ee &&
                                        e.jsx('p', {
                                          className: 'text-xs text-muted-foreground',
                                          children: ee,
                                        }),
                                    ],
                                  }),
                            ],
                          }),
                          (o.host_country || o.host_organization) &&
                            e.jsxs('div', {
                              className: 'pt-4 border-t',
                              children: [
                                e.jsxs('h4', {
                                  className: 'text-sm font-medium mb-2 flex items-center gap-2',
                                  children: [
                                    e.jsx(pe, { className: 'h-4 w-4 text-muted-foreground' }),
                                    s('form.hostOrganization', 'Host'),
                                  ],
                                }),
                                o.host_country &&
                                  e.jsxs('div', {
                                    className: 'flex items-center gap-2 text-sm',
                                    children: [
                                      e.jsx(xs, { className: 'h-3 w-3 text-muted-foreground' }),
                                      a ? o.host_country.name_ar : o.host_country.name_en,
                                    ],
                                  }),
                                o.host_organization &&
                                  e.jsxs('div', {
                                    className: 'flex items-center gap-2 text-sm mt-1',
                                    children: [
                                      e.jsx(pe, { className: 'h-3 w-3 text-muted-foreground' }),
                                      a ? o.host_organization.name_ar : o.host_organization.name_en,
                                    ],
                                  }),
                              ],
                            }),
                          (i.delegation_level || i.delegation_size) &&
                            e.jsxs('div', {
                              className: 'pt-4 border-t',
                              children: [
                                e.jsxs('h4', {
                                  className: 'text-sm font-medium mb-2 flex items-center gap-2',
                                  children: [
                                    e.jsx(k, { className: 'h-4 w-4 text-muted-foreground' }),
                                    s('sections.delegation', 'Delegation'),
                                  ],
                                }),
                                i.delegation_level &&
                                  e.jsx('p', {
                                    className: 'text-sm',
                                    children: a
                                      ? oe[i.delegation_level].ar
                                      : oe[i.delegation_level].en,
                                  }),
                                i.delegation_size &&
                                  e.jsxs('p', {
                                    className: 'text-xs text-muted-foreground',
                                    children: [
                                      s('form.delegationSize', 'Delegation Size'),
                                      ': ',
                                      i.delegation_size,
                                    ],
                                  }),
                              ],
                            }),
                        ],
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'lg:col-span-2 space-y-6',
                    children: [
                      l &&
                        e.jsxs(u, {
                          children: [
                            e.jsx(N, {
                              children: e.jsx(b, {
                                className: 'text-lg',
                                children: s('form.descriptionEn', 'Description'),
                              }),
                            }),
                            e.jsx(h, {
                              children: e.jsx('p', {
                                className: 'text-sm text-muted-foreground whitespace-pre-wrap',
                                children: l,
                              }),
                            }),
                          ],
                        }),
                      se &&
                        e.jsxs(u, {
                          children: [
                            e.jsx(N, {
                              children: e.jsxs(b, {
                                className: 'flex items-center gap-2 text-lg',
                                children: [
                                  e.jsx(_e, { className: 'h-5 w-5 text-primary' }),
                                  s('sections.objectives', 'Objectives'),
                                ],
                              }),
                            }),
                            e.jsx(h, {
                              children: e.jsx('p', {
                                className: 'text-sm text-muted-foreground whitespace-pre-wrap',
                                children: se,
                              }),
                            }),
                          ],
                        }),
                      e.jsxs('div', {
                        className: 'grid grid-cols-3 gap-4',
                        children: [
                          e.jsx(u, {
                            children: e.jsxs(h, {
                              className: 'pt-6 text-center',
                              children: [
                                e.jsx(k, { className: 'h-6 w-6 text-primary mx-auto mb-2' }),
                                e.jsx('p', {
                                  className: 'text-2xl font-bold',
                                  children: o.participants?.length || 0,
                                }),
                                e.jsx('p', {
                                  className: 'text-xs text-muted-foreground',
                                  children: s('stats.participants', 'Participants'),
                                }),
                              ],
                            }),
                          }),
                          e.jsx(u, {
                            children: e.jsxs(h, {
                              className: 'pt-6 text-center',
                              children: [
                                e.jsx(w, { className: 'h-6 w-6 text-primary mx-auto mb-2' }),
                                e.jsx('p', {
                                  className: 'text-2xl font-bold',
                                  children: o.agenda?.length || 0,
                                }),
                                e.jsx('p', {
                                  className: 'text-xs text-muted-foreground',
                                  children: s('stats.agendaItems', 'Agenda Items'),
                                }),
                              ],
                            }),
                          }),
                          e.jsx(u, {
                            children: e.jsxs(h, {
                              className: 'pt-6 text-center',
                              children: [
                                e.jsx(L, { className: 'h-6 w-6 text-primary mx-auto mb-2' }),
                                e.jsx('p', {
                                  className: 'text-2xl font-bold',
                                  children:
                                    o.agenda?.filter((n) => n.item_status === 'completed').length ||
                                    0,
                                }),
                                e.jsx('p', {
                                  className: 'text-xs text-muted-foreground',
                                  children: s('stats.completed', 'Completed'),
                                }),
                              ],
                            }),
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            }),
            e.jsx(_, {
              value: 'participants',
              className: 'space-y-6',
              children: e.jsxs(u, {
                children: [
                  e.jsx(N, {
                    children: e.jsxs('div', {
                      className: 'flex items-center justify-between',
                      children: [
                        e.jsxs(b, {
                          className: 'flex items-center gap-2 text-lg',
                          children: [
                            e.jsx(k, { className: 'h-5 w-5 text-primary' }),
                            s('sections.participants', 'Participants'),
                            e.jsx(g, {
                              variant: 'secondary',
                              className: 'ms-2',
                              children: o.participants?.length || 0,
                            }),
                          ],
                        }),
                        e.jsxs(p, {
                          variant: 'outline',
                          size: 'sm',
                          children: [
                            e.jsx(je, { className: 'h-4 w-4 me-2' }),
                            s('actions.addParticipant', 'Add Participant'),
                          ],
                        }),
                      ],
                    }),
                  }),
                  e.jsx(h, {
                    children:
                      o.participants && o.participants.length > 0
                        ? e.jsx('div', {
                            className: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
                            children: o.participants.map((n) => {
                              const d = n.participant,
                                T =
                                  d.participant_dossier_id && n.dossier_info
                                    ? a
                                      ? n.dossier_info.name_ar
                                      : n.dossier_info.name_en
                                    : (a ? d.external_name_ar : d.external_name_en) || ''
                              return e.jsx(
                                u,
                                {
                                  className: 'hover:shadow-md transition-shadow',
                                  children: e.jsx(h, {
                                    className: 'p-4',
                                    children: e.jsxs('div', {
                                      className: 'flex items-center gap-3',
                                      children: [
                                        e.jsx(Re, {
                                          className: 'h-10 w-10',
                                          children: e.jsx(qe, {
                                            className: 'bg-primary/10 text-primary text-sm',
                                            children: T
                                              ? X(T)
                                              : e.jsx(gs, { className: 'h-4 w-4' }),
                                          }),
                                        }),
                                        e.jsxs('div', {
                                          className: 'flex-1 min-w-0',
                                          children: [
                                            e.jsx('p', {
                                              className: 'font-medium text-sm truncate',
                                              children: T,
                                            }),
                                            e.jsxs('div', {
                                              className: 'flex items-center gap-2 mt-1',
                                              children: [
                                                e.jsx(g, {
                                                  variant: 'outline',
                                                  className: 'text-xs',
                                                  children: a ? de[d.role].ar : de[d.role].en,
                                                }),
                                                e.jsx(g, {
                                                  className: `text-xs ${O(d.attendance_status)}`,
                                                  children: a
                                                    ? me[d.attendance_status].ar
                                                    : me[d.attendance_status].en,
                                                }),
                                              ],
                                            }),
                                            d.external_title_en &&
                                              e.jsx('p', {
                                                className: 'text-xs text-muted-foreground mt-1',
                                                children: a
                                                  ? d.external_title_ar
                                                  : d.external_title_en,
                                              }),
                                          ],
                                        }),
                                      ],
                                    }),
                                  }),
                                },
                                d.id,
                              )
                            }),
                          })
                        : e.jsxs('div', {
                            className: 'text-center py-8',
                            children: [
                              e.jsx(k, {
                                className: 'h-12 w-12 text-muted-foreground mx-auto mb-4',
                              }),
                              e.jsx('p', {
                                className: 'text-sm text-muted-foreground',
                                children: s('empty.participants', 'No participants added'),
                              }),
                              e.jsx('p', {
                                className: 'text-xs text-muted-foreground mt-1',
                                children: s(
                                  'empty.participantsDescription',
                                  'Add participants to this engagement',
                                ),
                              }),
                            ],
                          }),
                  }),
                ],
              }),
            }),
            e.jsx(_, {
              value: 'agenda',
              className: 'space-y-6',
              children: e.jsxs(u, {
                children: [
                  e.jsx(N, {
                    children: e.jsxs('div', {
                      className: 'flex items-center justify-between',
                      children: [
                        e.jsxs(b, {
                          className: 'flex items-center gap-2 text-lg',
                          children: [
                            e.jsx(w, { className: 'h-5 w-5 text-primary' }),
                            s('sections.agenda', 'Agenda'),
                            e.jsx(g, {
                              variant: 'secondary',
                              className: 'ms-2',
                              children: o.agenda?.length || 0,
                            }),
                          ],
                        }),
                        e.jsxs(p, {
                          variant: 'outline',
                          size: 'sm',
                          children: [
                            e.jsx(je, { className: 'h-4 w-4 me-2' }),
                            s('actions.addAgendaItem', 'Add Agenda Item'),
                          ],
                        }),
                      ],
                    }),
                  }),
                  e.jsx(h, {
                    children:
                      o.agenda && o.agenda.length > 0
                        ? e.jsx('div', {
                            className: 'space-y-4',
                            children: o.agenda
                              .sort((n, d) => n.order_number - d.order_number)
                              .map((n, d) =>
                                e.jsxs(
                                  'div',
                                  {
                                    className: `flex gap-4 ${d < o.agenda.length - 1 ? 'pb-4 border-b' : ''}`,
                                    children: [
                                      e.jsxs('div', {
                                        className: 'flex flex-col items-center',
                                        children: [
                                          e.jsx('div', {
                                            className:
                                              'h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary',
                                            children: n.order_number,
                                          }),
                                          d < o.agenda.length - 1 &&
                                            e.jsx('div', {
                                              className: 'w-0.5 flex-1 bg-border mt-2',
                                            }),
                                        ],
                                      }),
                                      e.jsxs('div', {
                                        className: 'flex-1 pb-2',
                                        children: [
                                          e.jsxs('div', {
                                            className: 'flex items-start justify-between gap-2',
                                            children: [
                                              e.jsxs('div', {
                                                children: [
                                                  e.jsx('h4', {
                                                    className: 'font-medium',
                                                    children: (a && n.title_ar) || n.title_en,
                                                  }),
                                                  (n.description_en || n.description_ar) &&
                                                    e.jsx('p', {
                                                      className:
                                                        'text-sm text-muted-foreground mt-1',
                                                      children: a
                                                        ? n.description_ar
                                                        : n.description_en,
                                                    }),
                                                ],
                                              }),
                                              e.jsx(g, {
                                                variant: 'outline',
                                                className: C(n.item_status),
                                                children: a
                                                  ? xe[n.item_status].ar
                                                  : xe[n.item_status].en,
                                              }),
                                            ],
                                          }),
                                          (n.start_time || n.duration_minutes) &&
                                            e.jsxs('div', {
                                              className:
                                                'flex items-center gap-2 mt-2 text-xs text-muted-foreground',
                                              children: [
                                                e.jsx(H, { className: 'h-3 w-3' }),
                                                n.start_time &&
                                                  e.jsx('span', { children: D(n.start_time) }),
                                                n.duration_minutes &&
                                                  e.jsxs('span', {
                                                    children: [
                                                      '(',
                                                      n.duration_minutes,
                                                      ' ',
                                                      s('form.agenda.duration', 'min'),
                                                      ')',
                                                    ],
                                                  }),
                                              ],
                                            }),
                                          (n.outcome_en || n.outcome_ar) &&
                                            e.jsxs('div', {
                                              className: 'mt-2 p-2 bg-muted/50 rounded-lg',
                                              children: [
                                                e.jsxs('p', {
                                                  className:
                                                    'text-xs font-medium text-muted-foreground mb-1',
                                                  children: [
                                                    s('form.agenda.outcomeEn', 'Outcome'),
                                                    ':',
                                                  ],
                                                }),
                                                e.jsx('p', {
                                                  className: 'text-sm',
                                                  children: a ? n.outcome_ar : n.outcome_en,
                                                }),
                                              ],
                                            }),
                                        ],
                                      }),
                                    ],
                                  },
                                  n.id,
                                ),
                              ),
                          })
                        : e.jsxs('div', {
                            className: 'text-center py-8',
                            children: [
                              e.jsx(w, {
                                className: 'h-12 w-12 text-muted-foreground mx-auto mb-4',
                              }),
                              e.jsx('p', {
                                className: 'text-sm text-muted-foreground',
                                children: s('empty.agenda', 'No agenda items'),
                              }),
                              e.jsx('p', {
                                className: 'text-xs text-muted-foreground mt-1',
                                children: s(
                                  'empty.agendaDescription',
                                  'Add agenda items to organize this engagement',
                                ),
                              }),
                            ],
                          }),
                  }),
                ],
              }),
            }),
            e.jsxs(_, {
              value: 'outcomes',
              className: 'space-y-6',
              children: [
                e.jsxs(u, {
                  children: [
                    e.jsx(N, {
                      children: e.jsxs(b, {
                        className: 'flex items-center gap-2 text-lg',
                        children: [
                          e.jsx(L, { className: 'h-5 w-5 text-primary' }),
                          s('sections.outcomes', 'Outcomes'),
                        ],
                      }),
                    }),
                    e.jsx(h, {
                      children: te
                        ? e.jsx('p', {
                            className: 'text-sm text-muted-foreground whitespace-pre-wrap',
                            children: te,
                          })
                        : e.jsxs('div', {
                            className: 'text-center py-8',
                            children: [
                              e.jsx(L, {
                                className: 'h-12 w-12 text-muted-foreground mx-auto mb-4',
                              }),
                              e.jsx('p', {
                                className: 'text-sm text-muted-foreground',
                                children: s('empty.outcomes', 'No outcomes recorded yet'),
                              }),
                            ],
                          }),
                    }),
                  ],
                }),
                ae &&
                  e.jsxs(u, {
                    children: [
                      e.jsx(N, {
                        children: e.jsxs(b, {
                          className: 'flex items-center gap-2 text-lg',
                          children: [
                            e.jsx(w, { className: 'h-5 w-5 text-primary' }),
                            s('sections.notes', 'Notes'),
                          ],
                        }),
                      }),
                      e.jsx(h, {
                        children: e.jsx('p', {
                          className: 'text-sm text-muted-foreground whitespace-pre-wrap',
                          children: ae,
                        }),
                      }),
                    ],
                  }),
              ],
            }),
            e.jsx(_, {
              value: 'briefs',
              className: 'space-y-6',
              children: e.jsx(fs, { engagementId: r, engagementName: R }),
            }),
          ],
        }),
      }),
    ],
  })
}
const Bs = bs
export { Bs as component }
//# sourceMappingURL=_engagementId-Bk1LorJR.js.map
