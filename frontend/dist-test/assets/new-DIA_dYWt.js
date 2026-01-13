import { u as V, j as e, r as h } from './react-vendor-Buoak6m3.js'
import { c as ae, d as te, a as Ge, i as Xe } from './tanstack-vendor-BZC-rs5U.js'
import {
  s as O,
  j as E,
  c as g,
  m as k,
  B as v,
  l as $,
  k as Fe,
  o as ze,
  ae as We,
  J as b,
  q as ge,
  r as je,
  t as fe,
  v as ve,
  w as f,
  I,
  n as _e,
  C as Ze,
  ah as es,
  ai as ss,
  aj as as,
  aO as ts,
  aP as rs,
  aR as ns,
  aS as Ne,
  aT as ye,
} from './index-qYY0KoZ1.js'
import { b as we } from './useDossier-CiPcwRKl.js'
import { A as be, b as Ce, a as Se } from './avatar-lQOCSoMx.js'
import { T as is, a as ke, b as Te, c as Ae } from './tooltip-CE0dVuox.js'
import {
  aA as B,
  aD as Le,
  by as Ue,
  cF as re,
  bL as ne,
  bd as J,
  e7 as ls,
  aR as q,
  bN as cs,
  aI as A,
  aJ as ee,
  bw as Me,
  bx as se,
  aM as ds,
  aS as os,
  aB as Ee,
  bm as Pe,
  bi as De,
  aO as ms,
  aN as xs,
  e8 as hs,
  cj as us,
  aG as Ie,
  aX as ps,
} from './vendor-misc-BiJvMP0A.js'
import { C as gs, a as js, b as fs } from './collapsible-BZnv9hxQ.js'
import './accordion-DiUjAmkv.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function vs() {
  const s = ae()
  return te({
    mutationFn: async (r) => {
      const {
        data: { session: l },
      } = await O.auth.getSession()
      if (!l) throw new Error('Not authenticated')
      const i = await fetch(`${O.supabaseUrl}/functions/v1/calendar-create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${l.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(r),
      })
      if (!i.ok) {
        const d = await i.json()
        throw new Error(d.error || 'Failed to create calendar event')
      }
      return await i.json()
    },
    onSuccess: () => {
      s.invalidateQueries({ queryKey: ['calendar-events'] })
    },
  })
}
function _s() {
  const s = ae()
  return te({
    mutationFn: async ({ entryId: r, ...l }) => {
      const {
        data: { session: i },
      } = await O.auth.getSession()
      if (!i) throw new Error('Not authenticated')
      const d = await fetch(`${O.supabaseUrl}/functions/v1/calendar-update?entryId=${r}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${i.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(l),
      })
      if (!d.ok) {
        const u = await d.json()
        throw new Error(u.error || 'Failed to update calendar event')
      }
      return await d.json()
    },
    onSuccess: () => {
      s.invalidateQueries({ queryKey: ['calendar-events'] })
    },
  })
}
const Re = 'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/calendar-conflicts'
async function $e() {
  const {
    data: { session: s },
  } = await O.auth.getSession()
  if (!s) throw new Error('Not authenticated')
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${s.access_token}` }
}
async function Be(s) {
  if (!s.ok) {
    const r = await s.json().catch(() => ({ error: s.statusText }))
    throw new Error(r.error || 'API request failed')
  }
  return s.json()
}
function Ns(s, r) {
  const { enabled: l = !0, debounceMs: i = 500 } = r || {}
  return Ge({
    queryKey: ['conflict-check', s],
    queryFn: async () => {
      if (!s?.start_datetime || !s?.end_datetime)
        return {
          has_conflicts: !1,
          conflicts: [],
          warnings: [],
          severity_summary: { critical: 0, high: 0, medium: 0, low: 0 },
          total_conflicts: 0,
        }
      const d = await $e(),
        u = await fetch(`${Re}/check`, { method: 'POST', headers: d, body: JSON.stringify(s) })
      return Be(u)
    },
    enabled: l && !!s?.start_datetime && !!s?.end_datetime,
    staleTime: i,
    gcTime: 30 * 1e3,
  })
}
function ys() {
  const s = ae()
  return te({
    mutationFn: async (r) => {
      const l = await $e(),
        i = await fetch(`${Re}/suggest`, { method: 'POST', headers: l, body: JSON.stringify(r) })
      return Be(i)
    },
    onSuccess: (r, l) => {
      s.invalidateQueries({ queryKey: ['rescheduling-suggestions', l.event_id] })
    },
  })
}
const ws = {
    critical: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800',
    },
    high: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-800',
    },
    medium: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-700 dark:text-yellow-300',
      border: 'border-yellow-200 dark:border-yellow-800',
    },
    low: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
    },
  },
  bs = { venue: ee, participant: A, organizer: cs, holiday: q, resource: ls, travel_time: J },
  Cs = { critical: B, high: B, medium: Me, low: re }
function Ss({
  conflicts: s,
  isLoading: r,
  onResolve: l,
  onGenerateSuggestions: i,
  onDismiss: d,
  showWarnings: u = !0,
  className: a,
}) {
  const { t: x, i18n: o } = V('calendar'),
    _ = o.language === 'ar'
  if (r)
    return e.jsx(E, {
      className: g('p-4', a),
      dir: _ ? 'rtl' : 'ltr',
      children: e.jsxs('div', {
        className: 'flex items-center gap-2 animate-pulse',
        children: [
          e.jsx('div', { className: 'h-5 w-5 bg-muted rounded-full' }),
          e.jsx('div', { className: 'h-4 w-32 bg-muted rounded' }),
        ],
      }),
    })
  if (!s || (!s.has_conflicts && !s.warnings?.length)) return null
  const C = s.severity_summary.critical > 0 || s.severity_summary.high > 0
  return e.jsxs(E, {
    className: g(
      'overflow-hidden border-2 transition-colors',
      C ? 'border-destructive/50 bg-destructive/5' : 'border-warning/50 bg-warning/5',
      a,
    ),
    dir: _ ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className: 'flex items-center justify-between p-3 sm:p-4 border-b bg-background/50',
        children: [
          e.jsxs('div', {
            className: 'flex items-center gap-2',
            children: [
              e.jsx(B, {
                className: g('h-5 w-5 shrink-0', C ? 'text-destructive' : 'text-warning'),
              }),
              e.jsxs('div', {
                children: [
                  e.jsx('h3', {
                    className: 'text-sm sm:text-base font-semibold',
                    children: x('conflicts.title', { count: s.total_conflicts }),
                  }),
                  e.jsx('p', {
                    className: 'text-xs text-muted-foreground',
                    children: x('conflicts.subtitle'),
                  }),
                ],
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'flex items-center gap-2',
            children: [
              e.jsxs('div', {
                className: 'hidden sm:flex items-center gap-1',
                children: [
                  s.severity_summary.critical > 0 &&
                    e.jsxs(k, {
                      variant: 'destructive',
                      className: 'text-xs',
                      children: [
                        s.severity_summary.critical,
                        ' ',
                        x('conflicts.severity.critical'),
                      ],
                    }),
                  s.severity_summary.high > 0 &&
                    e.jsxs(k, {
                      className: 'bg-orange-500 text-xs',
                      children: [s.severity_summary.high, ' ', x('conflicts.severity.high')],
                    }),
                ],
              }),
              d &&
                e.jsx(v, {
                  variant: 'ghost',
                  size: 'icon',
                  className: 'h-8 w-8',
                  onClick: d,
                  children: e.jsx(Le, { className: 'h-4 w-4' }),
                }),
            ],
          }),
        ],
      }),
      e.jsx('div', {
        className: 'divide-y max-h-[300px] overflow-y-auto',
        children: e.jsx(Ue, {
          children: s.conflicts.map((N, T) =>
            e.jsx(
              ks,
              { conflict: N, onResolve: l, onGenerateSuggestions: i, isRTL: _, t: x },
              N.id || T,
            ),
          ),
        }),
      }),
      u &&
        s.warnings?.length > 0 &&
        e.jsx('div', {
          className: 'p-3 sm:p-4 bg-muted/30 border-t',
          children: e.jsxs('div', {
            className: 'flex items-start gap-2',
            children: [
              e.jsx(re, { className: 'h-4 w-4 text-muted-foreground shrink-0 mt-0.5' }),
              e.jsxs('div', {
                className: 'flex-1 min-w-0',
                children: [
                  e.jsx('p', {
                    className: 'text-xs font-medium text-muted-foreground mb-1',
                    children: x('conflicts.warnings'),
                  }),
                  e.jsx('ul', {
                    className: 'text-xs text-muted-foreground space-y-0.5',
                    children: s.warnings.map((N, T) =>
                      e.jsxs(
                        'li',
                        {
                          className: 'flex items-center gap-1',
                          children: [
                            e.jsx('span', {
                              className: 'h-1 w-1 rounded-full bg-muted-foreground shrink-0',
                            }),
                            N,
                          ],
                        },
                        T,
                      ),
                    ),
                  }),
                ],
              }),
            ],
          }),
        }),
      i &&
        s.has_conflicts &&
        e.jsx('div', {
          className: 'p-3 sm:p-4 bg-background border-t',
          children: e.jsxs(v, {
            variant: 'outline',
            size: 'sm',
            className: 'w-full sm:w-auto',
            onClick: () => i(),
            children: [
              e.jsx(ne, { className: g('h-4 w-4', _ ? 'ms-2' : 'me-2') }),
              x('conflicts.generateSuggestions'),
            ],
          }),
        }),
    ],
  })
}
function ks({ conflict: s, onResolve: r, onGenerateSuggestions: l, isRTL: i, t: d }) {
  const u = bs[s.conflict_type] || Me,
    a = Cs[s.severity] || re,
    x = ws[s.severity],
    o = (C) =>
      new Date(C).toLocaleTimeString(i ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
    _ = (C) =>
      new Date(C).toLocaleDateString(i ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })
  return e.jsx(se.div, {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
    className: 'p-3 sm:p-4 hover:bg-muted/50 transition-colors',
    children: e.jsxs('div', {
      className: 'flex items-start gap-3',
      children: [
        e.jsx('div', {
          className: g('p-2 rounded-lg shrink-0', x.bg, x.border, 'border'),
          children: e.jsx(u, { className: g('h-4 w-4', x.text) }),
        }),
        e.jsxs('div', {
          className: 'flex-1 min-w-0',
          children: [
            e.jsxs('div', {
              className: 'flex items-center gap-2 flex-wrap mb-1',
              children: [
                e.jsxs(k, {
                  variant: 'outline',
                  className: g('text-xs', x.bg, x.text, x.border),
                  children: [
                    e.jsx(a, { className: 'h-3 w-3 me-1' }),
                    d(`conflicts.severity.${s.severity}`),
                  ],
                }),
                e.jsx(k, {
                  variant: 'secondary',
                  className: 'text-xs',
                  children: d(`conflicts.types.${s.conflict_type}`),
                }),
              ],
            }),
            e.jsx('p', {
              className: 'text-sm font-medium text-foreground mb-1 line-clamp-2',
              children: (i && s.message_ar) || s.message_en,
            }),
            s.overlap_start &&
              s.overlap_end &&
              e.jsxs('div', {
                className: 'flex items-center gap-2 text-xs text-muted-foreground',
                children: [
                  e.jsx(J, { className: 'h-3 w-3' }),
                  e.jsxs('span', {
                    children: [
                      _(s.overlap_start),
                      ' ',
                      o(s.overlap_start),
                      ' - ',
                      o(s.overlap_end),
                    ],
                  }),
                  s.overlap_minutes &&
                    e.jsxs('span', {
                      className: 'text-xs',
                      children: ['(', s.overlap_minutes, ' ', d('conflicts.minutes'), ')'],
                    }),
                ],
              }),
            s.conflicting_event &&
              e.jsxs('div', {
                className: 'mt-2 p-2 bg-muted/50 rounded text-xs',
                children: [
                  e.jsx('p', {
                    className: 'font-medium',
                    children: i
                      ? s.conflicting_event.title_ar || s.conflicting_event.title_en
                      : s.conflicting_event.title_en || s.conflicting_event.title_ar,
                  }),
                  e.jsxs('p', {
                    className: 'text-muted-foreground',
                    children: [
                      _(s.conflicting_event.start_datetime),
                      ' ',
                      o(s.conflicting_event.start_datetime),
                      ' -',
                      ' ',
                      o(s.conflicting_event.end_datetime),
                    ],
                  }),
                ],
              }),
            s.affected_participant_ids &&
              s.affected_participant_ids.length > 0 &&
              e.jsxs('div', {
                className: 'flex items-center gap-1 mt-2 text-xs text-muted-foreground',
                children: [
                  e.jsx(A, { className: 'h-3 w-3' }),
                  e.jsx('span', {
                    children: d('conflicts.affectedParticipants', {
                      count: s.affected_participant_ids.length,
                    }),
                  }),
                ],
              }),
          ],
        }),
        e.jsx('div', {
          className: 'flex flex-col gap-1 shrink-0',
          children: e.jsxs(is, {
            children: [
              l &&
                e.jsxs(ke, {
                  children: [
                    e.jsx(Te, {
                      asChild: !0,
                      children: e.jsx(v, {
                        variant: 'ghost',
                        size: 'icon',
                        className: 'h-8 w-8',
                        onClick: () => l(s.id),
                        children: e.jsx(ne, { className: 'h-4 w-4' }),
                      }),
                    }),
                    e.jsx(Ae, { children: d('conflicts.getSuggestions') }),
                  ],
                }),
              r &&
                s.id &&
                e.jsxs(ke, {
                  children: [
                    e.jsx(Te, {
                      asChild: !0,
                      children: e.jsx(v, {
                        variant: 'ghost',
                        size: 'icon',
                        className: 'h-8 w-8',
                        onClick: () => r(s.id),
                        children: e.jsx(ds, { className: g('h-4 w-4', i && 'rotate-180') }),
                      }),
                    }),
                    e.jsx(Ae, { children: d('conflicts.resolve') }),
                  ],
                }),
            ],
          }),
        }),
      ],
    }),
  })
}
function Ts({ suggestions: s, isLoading: r, onAccept: l, onRefresh: i, eventId: d, className: u }) {
  const { t: a, i18n: x } = V('calendar'),
    o = x.language === 'ar',
    [_, C] = h.useState(0),
    N = (n) => {
      const y = new Date(n)
      return {
        date: y.toLocaleDateString(o ? 'ar-SA' : 'en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        time: y.toLocaleTimeString(o ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
      }
    },
    T = (n) =>
      n >= 0.8
        ? 'text-green-600 dark:text-green-400'
        : n >= 0.6
          ? 'text-yellow-600 dark:text-yellow-400'
          : 'text-red-600 dark:text-red-400',
    F = (n) =>
      n >= 0.8
        ? 'bg-green-100 dark:bg-green-900/30'
        : n >= 0.6
          ? 'bg-yellow-100 dark:bg-yellow-900/30'
          : 'bg-red-100 dark:bg-red-900/30'
  return r
    ? e.jsx(E, {
        className: g('overflow-hidden', u),
        dir: o ? 'rtl' : 'ltr',
        children: e.jsx($, {
          className: 'p-6',
          children: e.jsxs('div', {
            className: 'flex flex-col items-center justify-center gap-3 py-8',
            children: [
              e.jsx(os, { className: 'h-8 w-8 animate-spin text-primary' }),
              e.jsx('p', {
                className: 'text-sm text-muted-foreground',
                children: a('suggestions.generating'),
              }),
            ],
          }),
        }),
      })
    : !s || s.length === 0
      ? e.jsx(E, {
          className: g('overflow-hidden', u),
          dir: o ? 'rtl' : 'ltr',
          children: e.jsx($, {
            className: 'p-6',
            children: e.jsxs('div', {
              className: 'flex flex-col items-center justify-center gap-3 py-8 text-center',
              children: [
                e.jsx(q, { className: 'h-12 w-12 text-muted-foreground/50' }),
                e.jsxs('div', {
                  children: [
                    e.jsx('p', {
                      className: 'text-sm font-medium',
                      children: a('suggestions.noSuggestions'),
                    }),
                    e.jsx('p', {
                      className: 'text-xs text-muted-foreground mt-1',
                      children: a('suggestions.noSuggestionsDesc'),
                    }),
                  ],
                }),
                i &&
                  e.jsxs(v, {
                    variant: 'outline',
                    size: 'sm',
                    onClick: i,
                    className: 'mt-2',
                    children: [
                      e.jsx(Ee, { className: g('h-4 w-4', o ? 'ms-2' : 'me-2') }),
                      a('suggestions.retry'),
                    ],
                  }),
              ],
            }),
          }),
        })
      : e.jsxs(E, {
          className: g('overflow-hidden', u),
          dir: o ? 'rtl' : 'ltr',
          children: [
            e.jsxs(Fe, {
              className: 'pb-2',
              children: [
                e.jsxs('div', {
                  className: 'flex items-center justify-between',
                  children: [
                    e.jsxs(ze, {
                      className: 'flex items-center gap-2 text-base sm:text-lg',
                      children: [
                        e.jsx(ne, { className: 'h-5 w-5 text-primary' }),
                        a('suggestions.title'),
                      ],
                    }),
                    i &&
                      e.jsx(v, {
                        variant: 'ghost',
                        size: 'icon',
                        onClick: i,
                        className: 'h-8 w-8',
                        children: e.jsx(Ee, { className: 'h-4 w-4' }),
                      }),
                  ],
                }),
                e.jsx('p', {
                  className: 'text-xs text-muted-foreground',
                  children: a('suggestions.subtitle', { count: s.length }),
                }),
              ],
            }),
            e.jsx($, {
              className: 'p-0',
              children: e.jsx('div', {
                className: 'divide-y',
                children: e.jsx(Ue, {
                  initial: !1,
                  children: s.map((n, y) => {
                    const z = N(n.suggested_start),
                      L = N(n.suggested_end),
                      D =
                        'overall_score' in n
                          ? n.overall_score
                          : (n.availability_score + n.priority_score + n.travel_feasibility_score) /
                            3,
                      p = _ === y,
                      P = 'is_accepted' in n && n.is_accepted
                    return e.jsx(
                      se.div,
                      {
                        initial: { opacity: 0 },
                        animate: { opacity: 1 },
                        exit: { opacity: 0 },
                        children: e.jsx(gs, {
                          open: p,
                          onOpenChange: () => C(p ? null : y),
                          children: e.jsxs('div', {
                            className: g(
                              'p-3 sm:p-4 transition-colors',
                              p && 'bg-muted/50',
                              P && 'bg-green-50 dark:bg-green-900/20',
                            ),
                            children: [
                              e.jsx(js, {
                                asChild: !0,
                                children: e.jsxs('div', {
                                  className: 'flex items-start gap-3 cursor-pointer',
                                  children: [
                                    e.jsx('div', {
                                      className: g(
                                        'flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold shrink-0',
                                        y === 0
                                          ? 'bg-primary text-primary-foreground'
                                          : 'bg-muted text-muted-foreground',
                                      ),
                                      children: y + 1,
                                    }),
                                    e.jsxs('div', {
                                      className: 'flex-1 min-w-0',
                                      children: [
                                        e.jsxs('div', {
                                          className: 'flex items-center gap-2 flex-wrap mb-1',
                                          children: [
                                            e.jsxs('div', {
                                              className:
                                                'flex items-center gap-1 text-sm font-medium',
                                              children: [
                                                e.jsx(q, {
                                                  className: 'h-4 w-4 text-muted-foreground',
                                                }),
                                                e.jsx('span', { children: z.date }),
                                              ],
                                            }),
                                            e.jsxs('div', {
                                              className: 'flex items-center gap-1 text-sm',
                                              children: [
                                                e.jsx(J, {
                                                  className: 'h-4 w-4 text-muted-foreground',
                                                }),
                                                e.jsxs('span', {
                                                  children: [z.time, ' - ', L.time],
                                                }),
                                              ],
                                            }),
                                          ],
                                        }),
                                        e.jsxs('div', {
                                          className: 'flex items-center gap-2 mt-2',
                                          children: [
                                            e.jsxs(k, {
                                              variant: 'secondary',
                                              className: g('text-xs', F(D), T(D)),
                                              children: [
                                                e.jsx(Pe, { className: 'h-3 w-3 me-1' }),
                                                Math.round(D * 100),
                                                '% ',
                                                a('suggestions.match'),
                                              ],
                                            }),
                                            y === 0 &&
                                              e.jsx(k, {
                                                variant: 'default',
                                                className: 'text-xs bg-primary',
                                                children: a('suggestions.recommended'),
                                              }),
                                            P &&
                                              e.jsxs(k, {
                                                variant: 'secondary',
                                                className:
                                                  'text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
                                                children: [
                                                  e.jsx(De, { className: 'h-3 w-3 me-1' }),
                                                  a('suggestions.accepted'),
                                                ],
                                              }),
                                          ],
                                        }),
                                      ],
                                    }),
                                    e.jsx('div', {
                                      className: 'shrink-0',
                                      children: p
                                        ? e.jsx(ms, { className: 'h-5 w-5 text-muted-foreground' })
                                        : e.jsx(xs, { className: 'h-5 w-5 text-muted-foreground' }),
                                    }),
                                  ],
                                }),
                              }),
                              e.jsx(fs, {
                                children: e.jsxs(se.div, {
                                  initial: { opacity: 0, height: 0 },
                                  animate: { opacity: 1, height: 'auto' },
                                  exit: { opacity: 0, height: 0 },
                                  className: 'mt-4 space-y-4 ps-11',
                                  children: [
                                    e.jsxs('div', {
                                      className: 'space-y-2',
                                      children: [
                                        e.jsx('p', {
                                          className: 'text-xs font-medium text-muted-foreground',
                                          children: a('suggestions.scoreBreakdown'),
                                        }),
                                        e.jsxs('div', {
                                          className: 'grid gap-2',
                                          children: [
                                            e.jsx(Z, {
                                              icon: A,
                                              label: a('suggestions.availabilityScore'),
                                              score: n.availability_score,
                                            }),
                                            e.jsx(Z, {
                                              icon: Pe,
                                              label: a('suggestions.priorityScore'),
                                              score: n.priority_score,
                                            }),
                                            e.jsx(Z, {
                                              icon: hs,
                                              label: a('suggestions.travelScore'),
                                              score: n.travel_feasibility_score,
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                    (n.reason_en || n.reason_ar) &&
                                      e.jsx('div', {
                                        className: 'p-3 bg-muted/50 rounded-lg',
                                        children: e.jsx('p', {
                                          className: 'text-xs text-muted-foreground',
                                          children: o
                                            ? n.reason_ar || n.reason_en
                                            : n.reason_en || n.reason_ar,
                                        }),
                                      }),
                                    (n.alternative_venue_en || n.alternative_venue_ar) &&
                                      e.jsxs('div', {
                                        className: 'flex items-center gap-2 text-sm',
                                        children: [
                                          e.jsx(us, { className: 'h-4 w-4 text-muted-foreground' }),
                                          e.jsxs('span', {
                                            children: [
                                              a('suggestions.alternativeVenue'),
                                              ':',
                                              ' ',
                                              e.jsx('span', {
                                                className: 'font-medium',
                                                children: o
                                                  ? n.alternative_venue_ar || n.alternative_venue_en
                                                  : n.alternative_venue_en ||
                                                    n.alternative_venue_ar,
                                              }),
                                            ],
                                          }),
                                        ],
                                      }),
                                    l &&
                                      !P &&
                                      e.jsxs(v, {
                                        className: 'w-full sm:w-auto',
                                        onClick: () => l(n),
                                        children: [
                                          e.jsx(De, {
                                            className: g('h-4 w-4', o ? 'ms-2' : 'me-2'),
                                          }),
                                          a('suggestions.accept'),
                                        ],
                                      }),
                                  ],
                                }),
                              }),
                            ],
                          }),
                        }),
                      },
                      'id' in n ? n.id : y,
                    )
                  }),
                }),
              }),
            }),
          ],
        })
}
function Z({ icon: s, label: r, score: l }) {
  const i = Math.round(l * 100)
  return e.jsxs('div', {
    className: 'flex items-center gap-2',
    children: [
      e.jsx(s, { className: 'h-3.5 w-3.5 text-muted-foreground shrink-0' }),
      e.jsx('span', {
        className: 'text-xs text-muted-foreground flex-1 min-w-0 truncate',
        children: r,
      }),
      e.jsx('div', {
        className: 'w-24 shrink-0',
        children: e.jsx(We, { value: i, className: 'h-1.5' }),
      }),
      e.jsxs('span', { className: 'text-xs font-medium w-10 text-end', children: [i, '%'] }),
    ],
  })
}
function Oe(s) {
  const r = s
    .trim()
    .split(/\s+/)
    .filter((l) => l.length > 0)
  return r.length === 0
    ? '??'
    : r.length === 1
      ? r[0].slice(0, 2).toUpperCase()
      : (r[0].charAt(0) + r[r.length - 1].charAt(0)).toUpperCase()
}
function As({
  entryId: s,
  initialData: r,
  linkedItemType: l,
  linkedItemId: i,
  onSuccess: d,
  onCancel: u,
}) {
  const { t: a, i18n: x } = V(),
    o = x.language === 'ar',
    [_, C] = h.useState(r?.entry_type || 'internal_meeting'),
    [N, T] = h.useState(r?.title_en || ''),
    [F, n] = h.useState(r?.title_ar || ''),
    [y, z] = h.useState(r?.description_en || ''),
    [L, D] = h.useState(r?.description_ar || ''),
    [p, P] = h.useState(r?.start_datetime || ''),
    [S, ie] = h.useState(r?.end_datetime || ''),
    [le, qe] = h.useState(r?.all_day || !1),
    [U, ce] = h.useState(r?.location || ''),
    [de, Ve] = h.useState(r?.reminder_minutes?.toString() || '15'),
    [w, Q] = h.useState(r?.participants || []),
    [Je, H] = h.useState(!1),
    [K, oe] = h.useState(!0),
    [Qe, me] = h.useState(!1),
    xe = vs(),
    he = _s(),
    M = ys(),
    { data: Y } = we({ type: 'person', status: 'active' }),
    { data: G } = we({ type: 'organization', status: 'active' }),
    X = !!s,
    He = h.useMemo(() => {
      if (!p) return null
      const t = new Date(p).toISOString(),
        c = S
          ? new Date(S).toISOString()
          : new Date(new Date(p).getTime() + 60 * 60 * 1e3).toISOString()
      return {
        event_id: s,
        start_datetime: t,
        end_datetime: c,
        venue_en: U || void 0,
        participant_ids: w.map((m) => m.participant_id),
        check_travel_time: !0,
      }
    }, [s, p, S, U, w]),
    { data: R, isLoading: ue } = Ns(He, { enabled: !!p && K, debounceMs: 800 }),
    pe = h.useCallback(
      (t) => {
        if (!s && !p) return
        const c = p && S ? Math.round((new Date(S).getTime() - new Date(p).getTime()) / 6e4) : 60
        ;(M.mutate({
          event_id: s || 'new-event',
          conflict_id: t,
          duration_minutes: c,
          must_include_participants: w.map((m) => m.participant_id),
        }),
          me(!0))
      },
      [s, p, S, w, M],
    ),
    Ke = h.useCallback((t) => {
      if (t.suggested_start) {
        const c = new Date(t.suggested_start),
          m = new Date(c.getTime() - c.getTimezoneOffset() * 6e4).toISOString().slice(0, 16)
        P(m)
      }
      if (t.suggested_end) {
        const c = new Date(t.suggested_end),
          m = new Date(c.getTime() - c.getTimezoneOffset() * 6e4).toISOString().slice(0, 16)
        ie(m)
      }
      ;(t.alternative_venue_en && ce(t.alternative_venue_en), me(!1))
    }, []),
    Ye = async (t) => {
      if ((t.preventDefault(), !p)) {
        alert(a('calendar.form.start_datetime_required'))
        return
      }
      const c = {
        entry_type: _,
        title_en: N || void 0,
        title_ar: F || void 0,
        description_en: y || void 0,
        description_ar: L || void 0,
        start_datetime: p,
        end_datetime: S || void 0,
        all_day: le,
        location: U || void 0,
        linked_item_type: l,
        linked_item_id: i,
        reminder_minutes: parseInt(de) || 15,
        participants: w.map((m) => ({
          participant_type: m.participant_type,
          participant_id: m.participant_id,
        })),
      }
      try {
        ;(X ? await he.mutateAsync({ entryId: s, ...c }) : await xe.mutateAsync(c), d?.())
      } catch (m) {
        ;(console.error('Failed to save calendar entry:', m), alert(a('calendar.form.save_failed')))
      }
    },
    j = xe.isPending || he.isPending
  return e.jsxs(E, {
    className: 'p-4 sm:p-6',
    dir: o ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className: 'flex items-center gap-2 mb-6',
        children: [
          e.jsx(q, { className: 'h-5 w-5' }),
          e.jsx('h2', {
            className: 'text-lg sm:text-xl font-semibold',
            children: a(X ? 'calendar.form.edit_event' : 'calendar.form.create_event'),
          }),
        ],
      }),
      e.jsxs('form', {
        onSubmit: Ye,
        className: 'flex flex-col gap-4',
        children: [
          e.jsxs('div', {
            className: 'flex flex-col gap-2',
            children: [
              e.jsx(b, { htmlFor: 'entry-type', children: a('calendar.form.entry_type') }),
              e.jsxs(ge, {
                value: _,
                onValueChange: C,
                disabled: j,
                children: [
                  e.jsx(je, { id: 'entry-type', children: e.jsx(fe, {}) }),
                  e.jsxs(ve, {
                    children: [
                      e.jsx(f, {
                        value: 'internal_meeting',
                        children: a('calendar.types.internal_meeting'),
                      }),
                      e.jsx(f, { value: 'deadline', children: a('calendar.types.deadline') }),
                      e.jsx(f, { value: 'reminder', children: a('calendar.types.reminder') }),
                      e.jsx(f, { value: 'holiday', children: a('calendar.types.holiday') }),
                      e.jsx(f, { value: 'training', children: a('calendar.types.training') }),
                      e.jsx(f, { value: 'review', children: a('calendar.types.review') }),
                      e.jsx(f, { value: 'other', children: a('calendar.types.other') }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
            children: [
              e.jsxs('div', {
                className: 'flex flex-col gap-2',
                children: [
                  e.jsx(b, { htmlFor: 'title-en', children: a('calendar.form.title_en') }),
                  e.jsx(I, {
                    id: 'title-en',
                    value: N,
                    onChange: (t) => T(t.target.value),
                    placeholder: a('calendar.form.title_en_placeholder'),
                    disabled: j,
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'flex flex-col gap-2',
                children: [
                  e.jsx(b, { htmlFor: 'title-ar', children: a('calendar.form.title_ar') }),
                  e.jsx(I, {
                    id: 'title-ar',
                    value: F,
                    onChange: (t) => n(t.target.value),
                    placeholder: a('calendar.form.title_ar_placeholder'),
                    disabled: j,
                  }),
                ],
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
            children: [
              e.jsxs('div', {
                className: 'flex flex-col gap-2',
                children: [
                  e.jsx(b, { htmlFor: 'desc-en', children: a('calendar.form.description_en') }),
                  e.jsx(_e, {
                    id: 'desc-en',
                    value: y,
                    onChange: (t) => z(t.target.value),
                    placeholder: a('calendar.form.description_en_placeholder'),
                    rows: 3,
                    disabled: j,
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'flex flex-col gap-2',
                children: [
                  e.jsx(b, { htmlFor: 'desc-ar', children: a('calendar.form.description_ar') }),
                  e.jsx(_e, {
                    id: 'desc-ar',
                    value: L,
                    onChange: (t) => D(t.target.value),
                    placeholder: a('calendar.form.description_ar_placeholder'),
                    rows: 3,
                    disabled: j,
                  }),
                ],
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
            children: [
              e.jsxs('div', {
                className: 'flex flex-col gap-2',
                children: [
                  e.jsxs(b, {
                    htmlFor: 'start-datetime',
                    className: 'flex items-center gap-1',
                    children: [
                      e.jsx(J, { className: 'h-4 w-4' }),
                      a('calendar.form.start_datetime'),
                      e.jsx('span', { className: 'text-destructive', children: '*' }),
                    ],
                  }),
                  e.jsx(I, {
                    id: 'start-datetime',
                    type: 'datetime-local',
                    value: p,
                    onChange: (t) => P(t.target.value),
                    required: !0,
                    disabled: j,
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'flex flex-col gap-2',
                children: [
                  e.jsx(b, { htmlFor: 'end-datetime', children: a('calendar.form.end_datetime') }),
                  e.jsx(I, {
                    id: 'end-datetime',
                    type: 'datetime-local',
                    value: S,
                    onChange: (t) => ie(t.target.value),
                    disabled: j,
                  }),
                ],
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
            children: [
              e.jsxs('div', {
                className: 'flex items-center gap-2',
                children: [
                  e.jsx(Ze, {
                    id: 'all-day',
                    checked: le,
                    onCheckedChange: (t) => qe(t),
                    disabled: j,
                  }),
                  e.jsx(b, {
                    htmlFor: 'all-day',
                    className: 'cursor-pointer',
                    children: a('calendar.form.all_day'),
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'flex flex-col gap-2',
                children: [
                  e.jsx(b, { htmlFor: 'location', children: a('calendar.form.location') }),
                  e.jsx(I, {
                    id: 'location',
                    value: U,
                    onChange: (t) => ce(t.target.value),
                    placeholder: a('calendar.form.location_placeholder'),
                    disabled: j,
                  }),
                ],
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'flex flex-col gap-2',
            children: [
              e.jsxs('div', {
                className: 'flex items-center gap-2',
                children: [
                  e.jsx(A, { className: 'h-4 w-4' }),
                  e.jsx(b, { children: a('calendar.form.participants') }),
                ],
              }),
              w.length > 0 &&
                e.jsx('div', {
                  className: 'flex flex-wrap gap-2 mb-2',
                  children: w.map((t) =>
                    e.jsxs(
                      k,
                      {
                        variant: 'secondary',
                        className: 'flex items-center gap-2 ps-2 pe-1 py-1',
                        children: [
                          t.participant_type === 'person_dossier' && t.participant_photo
                            ? e.jsxs(be, {
                                className: 'h-5 w-5',
                                children: [
                                  e.jsx(Ce, {
                                    src: t.participant_photo,
                                    alt: t.participant_name || '',
                                  }),
                                  e.jsx(Se, {
                                    className: 'text-xs',
                                    children: Oe(t.participant_name || t.participant_id),
                                  }),
                                ],
                              })
                            : e.jsx('div', {
                                className:
                                  'h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center',
                                children:
                                  t.participant_type === 'person_dossier'
                                    ? e.jsx(A, { className: 'h-3 w-3' })
                                    : e.jsx(ee, { className: 'h-3 w-3' }),
                              }),
                          e.jsx('span', {
                            className: 'text-xs',
                            children: t.participant_name || t.participant_id,
                          }),
                          e.jsx(v, {
                            type: 'button',
                            variant: 'ghost',
                            size: 'sm',
                            className: 'h-5 w-5 p-0 hover:bg-transparent',
                            onClick: () => {
                              Q(w.filter((c) => c.participant_id !== t.participant_id))
                            },
                            disabled: j,
                            children: e.jsx(Le, { className: 'h-3 w-3' }),
                          }),
                        ],
                      },
                      t.participant_id,
                    ),
                  ),
                }),
              e.jsxs(es, {
                open: Je,
                onOpenChange: H,
                children: [
                  e.jsx(ss, {
                    asChild: !0,
                    children: e.jsxs(v, {
                      type: 'button',
                      variant: 'outline',
                      className: 'w-full justify-start',
                      disabled: j,
                      children: [
                        e.jsx(A, { className: 'h-4 w-4 me-2' }),
                        a('calendar.form.add_participant'),
                      ],
                    }),
                  }),
                  e.jsx(as, {
                    className: 'w-full sm:w-80 p-0',
                    align: o ? 'end' : 'start',
                    children: e.jsxs(ts, {
                      children: [
                        e.jsx(rs, { placeholder: a('calendar.form.search_participants') }),
                        e.jsx(ns, { children: a('calendar.form.no_participants_found') }),
                        Y &&
                          Y.length > 0 &&
                          e.jsx(Ne, {
                            heading: a('calendar.form.people'),
                            children: Y.map((t) => {
                              const c = o ? t.name_ar : t.name_en,
                                m = w.some((W) => W.participant_id === t.id)
                              return e.jsxs(
                                ye,
                                {
                                  value: c || t.id,
                                  onSelect: () => {
                                    ;(m ||
                                      Q([
                                        ...w,
                                        {
                                          participant_type: 'person_dossier',
                                          participant_id: t.id,
                                          participant_name: c || t.id,
                                          participant_photo: t.extension?.photo_url,
                                        },
                                      ]),
                                      H(!1))
                                  },
                                  disabled: m,
                                  children: [
                                    e.jsxs('div', {
                                      className: 'flex items-center gap-2 flex-1',
                                      children: [
                                        t.extension?.photo_url
                                          ? e.jsxs(be, {
                                              className: 'h-6 w-6',
                                              children: [
                                                e.jsx(Ce, {
                                                  src: t.extension.photo_url,
                                                  alt: c || '',
                                                }),
                                                e.jsx(Se, {
                                                  className: 'text-xs',
                                                  children: c ? Oe(c) : 'VIP',
                                                }),
                                              ],
                                            })
                                          : e.jsx('div', {
                                              className:
                                                'h-6 w-6 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center',
                                              children: e.jsx(A, {
                                                className:
                                                  'h-3 w-3 text-teal-800 dark:text-teal-300',
                                              }),
                                            }),
                                        e.jsxs('div', {
                                          className: 'flex flex-col',
                                          children: [
                                            e.jsx('span', { className: 'text-sm', children: c }),
                                            t.extension?.title &&
                                              e.jsx('span', {
                                                className: 'text-xs text-muted-foreground',
                                                children: t.extension.title,
                                              }),
                                          ],
                                        }),
                                      ],
                                    }),
                                    m && e.jsx(Ie, { className: 'h-4 w-4' }),
                                  ],
                                },
                                t.id,
                              )
                            }),
                          }),
                        G &&
                          G.length > 0 &&
                          e.jsx(Ne, {
                            heading: a('calendar.form.organizations'),
                            children: G.map((t) => {
                              const c = o ? t.name_ar : t.name_en,
                                m = w.some((W) => W.participant_id === t.id)
                              return e.jsxs(
                                ye,
                                {
                                  value: c || t.id,
                                  onSelect: () => {
                                    ;(m ||
                                      Q([
                                        ...w,
                                        {
                                          participant_type: 'organization_dossier',
                                          participant_id: t.id,
                                          participant_name: c || t.id,
                                        },
                                      ]),
                                      H(!1))
                                  },
                                  disabled: m,
                                  children: [
                                    e.jsxs('div', {
                                      className: 'flex items-center gap-2 flex-1',
                                      children: [
                                        e.jsx('div', {
                                          className:
                                            'h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center',
                                          children: e.jsx(ee, {
                                            className:
                                              'h-3 w-3 text-purple-800 dark:text-purple-300',
                                          }),
                                        }),
                                        e.jsx('span', { className: 'text-sm', children: c }),
                                      ],
                                    }),
                                    m && e.jsx(Ie, { className: 'h-4 w-4' }),
                                  ],
                                },
                                t.id,
                              )
                            }),
                          }),
                      ],
                    }),
                  }),
                ],
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'flex flex-col gap-2',
            children: [
              e.jsx(b, { htmlFor: 'reminder', children: a('calendar.form.reminder') }),
              e.jsxs(ge, {
                value: de,
                onValueChange: Ve,
                disabled: j,
                children: [
                  e.jsx(je, { id: 'reminder', children: e.jsx(fe, {}) }),
                  e.jsxs(ve, {
                    children: [
                      e.jsx(f, { value: '0', children: a('calendar.form.no_reminder') }),
                      e.jsxs(f, {
                        value: '5',
                        children: ['5 ', a('calendar.form.minutes_before')],
                      }),
                      e.jsxs(f, {
                        value: '15',
                        children: ['15 ', a('calendar.form.minutes_before')],
                      }),
                      e.jsxs(f, {
                        value: '30',
                        children: ['30 ', a('calendar.form.minutes_before')],
                      }),
                      e.jsxs(f, { value: '60', children: ['1 ', a('calendar.form.hour_before')] }),
                      e.jsxs(f, { value: '1440', children: ['1 ', a('calendar.form.day_before')] }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          K &&
            (R || ue) &&
            e.jsx(Ss, {
              conflicts: R || null,
              isLoading: ue,
              onGenerateSuggestions: pe,
              onDismiss: () => oe(!1),
              showWarnings: !0,
              className: 'mt-4',
            }),
          Qe &&
            e.jsx(Ts, {
              suggestions: M.data?.suggestions || [],
              isLoading: M.isPending,
              onAccept: Ke,
              onRefresh: () => pe(),
              eventId: s,
              className: 'mt-4',
            }),
          !K &&
            R?.has_conflicts &&
            e.jsxs(v, {
              type: 'button',
              variant: 'outline',
              className: 'w-full justify-start border-warning/50 bg-warning/10 hover:bg-warning/20',
              onClick: () => oe(!0),
              children: [
                e.jsx(B, { className: 'h-4 w-4 text-warning me-2' }),
                e.jsx('span', {
                  className: 'text-sm',
                  children: a('calendar.conflicts.hasConflicts', { count: R.total_conflicts }),
                }),
              ],
            }),
          e.jsxs('div', {
            className: 'flex flex-col-reverse sm:flex-row gap-2 justify-end pt-4',
            children: [
              u &&
                e.jsx(v, {
                  type: 'button',
                  variant: 'outline',
                  onClick: u,
                  disabled: j,
                  className: 'w-full sm:w-auto',
                  children: a('common.cancel'),
                }),
              e.jsx(v, {
                type: 'submit',
                disabled: j,
                className: 'w-full sm:w-auto',
                children: a(
                  j
                    ? 'common.saving'
                    : X
                      ? 'calendar.form.update_event'
                      : 'calendar.form.create_event',
                ),
              }),
            ],
          }),
        ],
      }),
    ],
  })
}
function Js() {
  const { t: s, i18n: r } = V(),
    l = r.language === 'ar',
    i = Xe(),
    d = () => {
      i({ to: '/calendar' })
    },
    u = () => {
      i({ to: '/calendar' })
    }
  return e.jsxs('div', {
    className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-4xl',
    dir: l ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className: 'mb-6',
        children: [
          e.jsxs(v, {
            variant: 'ghost',
            size: 'sm',
            onClick: u,
            className: 'mb-2',
            children: [
              e.jsx(ps, { className: `h-4 w-4 ${l ? 'rotate-180 ms-2' : 'me-2'}` }),
              s('calendar.new_event.back_to_calendar'),
            ],
          }),
          e.jsx('h1', {
            className: 'text-2xl sm:text-3xl font-bold text-start',
            children: s('calendar.new_event.title'),
          }),
          e.jsx('p', {
            className: 'text-sm sm:text-base text-muted-foreground mt-1 text-start',
            children: s('calendar.new_event.description'),
          }),
        ],
      }),
      e.jsxs(E, {
        children: [
          e.jsx(Fe, {
            children: e.jsx(ze, {
              className: 'text-base sm:text-lg text-start',
              children: s('calendar.new_event.form_title'),
            }),
          }),
          e.jsx($, { children: e.jsx(As, { onSuccess: d, onCancel: u }) }),
        ],
      }),
    ],
  })
}
export { Js as component }
//# sourceMappingURL=new-DIA_dYWt.js.map
