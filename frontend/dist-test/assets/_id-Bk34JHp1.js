import { u as j, j as e, r as T } from './react-vendor-Buoak6m3.js'
import { c as Z, i as z, d as ee, a as se } from './tanstack-vendor-BZC-rs5U.js'
import { a as te } from './useDossier-CiPcwRKl.js'
import {
  s as ae,
  m as f,
  B as y,
  D as ne,
  x as re,
  y as ie,
  z as R,
  b as le,
  a0 as _,
  af as $,
  ag as A,
  j as I,
  k as B,
  o as P,
  l as M,
  ae as oe,
  A as ce,
  E as de,
  F as me,
  G as xe,
  H as ue,
  K as ge,
  b0 as O,
} from './index-qYY0KoZ1.js'
import {
  aK as k,
  aH as L,
  dn as he,
  c0 as pe,
  c1 as fe,
  bw as D,
  aR as V,
  bO as be,
  bS as H,
  bm as q,
  bn as je,
  co as K,
  cM as ye,
  c5 as ve,
  aA as U,
  ce as Ne,
  bi as we,
  cF as Ce,
  be as _e,
  aI as ke,
  bd as De,
  aP as C,
} from './vendor-misc-BiJvMP0A.js'
import { c as Se, b as Te, a as $e } from './dossier-stats.service-BBABWT3E.js'
import { C as Ae, R as ze, D as Ie, a as Le, K as Ee } from './CountryTimeline-ChW1wm5i.js'
import { a as Fe, b as Re } from './useIntelligence-BMjousVq.js'
import { U as Oe, I as Be, J as Pe } from './date-vendor-s0MkYge4.js'
import { R as Me } from './RefreshButton-B7MWE9Ka.js'
import { E as Ve } from './EngagementTimeline-C_G2Lr8F.js'
import { O as He } from './OrganizationTimeline-Bvhhh3g1.js'
import { P as qe } from './PersonTimeline-BZvpoWic.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
import './useUnifiedTimeline-2-SmgReu.js'
import './avatar-lQOCSoMx.js'
import './use-outside-click-DyRG7K6b.js'
const Ke = (s) => {
    if (!s) return
    const n = {}
    return (
      Object.keys(s)
        .sort()
        .forEach((a) => {
          const i = s[a]
          i != null && i !== '' && (n[a] = i)
        }),
      n
    )
  },
  b = {
    all: ['dossiers'],
    lists: () => [...b.all, 'list'],
    list: (s) => [...b.lists(), Ke(s)],
    details: () => [...b.all, 'detail'],
    detail: (s, n) => [...b.details(), s, n],
    timeline: (s, n) => [...b.all, 'timeline', s, n],
    briefs: (s) => [...b.all, 'briefs', s],
  },
  Ue = 'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1',
  Qe = async () => {
    const {
      data: { session: s },
    } = await ae.auth.getSession()
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${s?.access_token}` }
  },
  Je = (s) => {
    const n = Z(),
      a = z()
    return ee({
      mutationFn: async () => {
        const i = await Qe(),
          t = await fetch(`${Ue}/dossiers-archive`, {
            method: 'DELETE',
            headers: i,
            body: JSON.stringify({ id: s }),
          })
        if (!t.ok) {
          const o = await t.json()
          throw new Error(o.error?.message_en || 'Failed to archive dossier')
        }
        if (t.status !== 204) return t.json()
      },
      onSuccess: () => {
        ;(n.invalidateQueries({ queryKey: b.lists() }),
          n.invalidateQueries({ queryKey: b.detail(s) }),
          a({ to: '/dossiers' }))
      },
    })
  }
function Ge({ dossier: s, onEdit: n, onArchive: a, onGenerateBrief: i }) {
  const { t, i18n: o } = j('dossiers'),
    r = o.language === 'ar',
    u = r ? s.name_ar : s.name_en,
    g = async () => {
      const x = o.language === 'en' ? 'ar' : 'en'
      await le(x)
    },
    m = (x) => {
      switch (x) {
        case 'high':
          return 'destructive'
        case 'medium':
          return 'default'
        case 'low':
        default:
          return 'secondary'
      }
    },
    l = (x) => {
      switch (x) {
        case 'country':
          return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
        case 'organization':
          return 'bg-green-100 text-green-800 hover:bg-green-200'
        case 'forum':
          return 'bg-purple-100 text-purple-800 hover:bg-purple-200'
        case 'theme':
          return 'bg-amber-100 text-amber-800 hover:bg-amber-200'
        default:
          return ''
      }
    }
  return e.jsx('div', {
    className: 'border-b bg-background',
    children: e.jsxs('div', {
      className: 'flex flex-col gap-4 p-6',
      children: [
        e.jsxs('div', {
          className: 'flex items-start justify-between gap-4',
          children: [
            e.jsxs('div', {
              className: 'min-w-0 flex-1',
              children: [
                e.jsx('h1', {
                  className: 'mb-2 truncate text-3xl font-bold tracking-tight',
                  children: u,
                }),
                e.jsxs('div', {
                  className: 'flex flex-wrap gap-2',
                  children: [
                    e.jsx(f, {
                      className: l(s.type),
                      'aria-label': `${t('fields.type')}: ${t(`types.${s.type}`)}`,
                      children: t(`types.${s.type}`),
                    }),
                    e.jsx(f, {
                      variant: 'outline',
                      'aria-label': `${t('fields.status')}: ${t(`statuses.${s.status}`)}`,
                      children: t(`statuses.${s.status}`),
                    }),
                    e.jsx(f, {
                      variant: m(s.sensitivity_level),
                      'aria-label': `${t('fields.sensitivity')}: ${t(`sensitivity.${s.sensitivity_level}`)}`,
                      children: t(`sensitivity.${s.sensitivity_level}`),
                    }),
                    e.jsxs(f, {
                      variant: 'outline',
                      className: 'text-xs',
                      'aria-label': `${t('fields.version')}: ${s.version}`,
                      children: ['v', s.version],
                    }),
                  ],
                }),
              ],
            }),
            e.jsxs('div', {
              className: 'flex shrink-0 items-center gap-2',
              children: [
                e.jsxs(y, {
                  variant: 'outline',
                  size: 'sm',
                  onClick: g,
                  className: 'gap-2',
                  'aria-label': t('languageToggle', { ns: 'translation' }),
                  children: [
                    e.jsx(k, { className: 'size-4' }),
                    o.language === 'en' ? 'عربي' : 'English',
                  ],
                }),
                i &&
                  e.jsxs(y, {
                    variant: 'default',
                    size: 'sm',
                    onClick: i,
                    className: 'gap-2',
                    'aria-label': t('generateBrief'),
                    children: [
                      e.jsx(L, { className: 'size-4' }),
                      e.jsx('span', {
                        className: 'hidden sm:inline',
                        children: t('generateBrief'),
                      }),
                    ],
                  }),
                e.jsxs(ne, {
                  children: [
                    e.jsx(re, {
                      asChild: !0,
                      children: e.jsx(y, {
                        variant: 'outline',
                        size: 'sm',
                        'aria-label': t('moreActions', { ns: 'translation' }),
                        children: e.jsx(he, { className: 'size-4' }),
                      }),
                    }),
                    e.jsxs(ie, {
                      align: r ? 'start' : 'end',
                      children: [
                        n &&
                          e.jsxs(R, {
                            onClick: n,
                            className: 'gap-2',
                            children: [e.jsx(pe, { className: 'size-4' }), t('edit')],
                          }),
                        a &&
                          e.jsxs(R, {
                            onClick: a,
                            className: 'gap-2 text-destructive focus:text-destructive',
                            children: [e.jsx(fe, { className: 'size-4' }), t('archive')],
                          }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        (s.summary_en || s.summary_ar) &&
          e.jsx('div', {
            className: 'border-t pt-4',
            children: e.jsx('p', {
              className: 'text-sm leading-relaxed text-muted-foreground',
              children: r ? s.summary_ar : s.summary_en,
            }),
          }),
        e.jsxs('div', {
          className: 'flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground',
          children: [
            s.tags &&
              s.tags.length > 0 &&
              e.jsxs('div', {
                className: 'flex items-center gap-1',
                children: [
                  e.jsxs('span', { className: 'font-medium', children: [t('fields.tags'), ':'] }),
                  e.jsxs('div', {
                    className: 'flex flex-wrap gap-1',
                    children: [
                      s.tags
                        .slice(0, 5)
                        .map((x, p) =>
                          e.jsx(f, { variant: 'outline', className: 'text-xs', children: x }, p),
                        ),
                      s.tags.length > 5 &&
                        e.jsxs(f, {
                          variant: 'outline',
                          className: 'text-xs',
                          children: ['+', s.tags.length - 5],
                        }),
                    ],
                  }),
                ],
              }),
            e.jsxs('div', {
              className: 'flex items-center gap-1',
              children: [
                e.jsxs('span', { className: 'font-medium', children: [t('fields.created'), ':'] }),
                e.jsx('span', { children: new Date(s.created_at).toLocaleDateString(o.language) }),
              ],
            }),
            e.jsxs('div', {
              className: 'flex items-center gap-1',
              children: [
                e.jsxs('span', { className: 'font-medium', children: [t('fields.updated'), ':'] }),
                e.jsx('span', { children: new Date(s.updated_at).toLocaleDateString(o.language) }),
              ],
            }),
            s.last_review_date &&
              e.jsxs('div', {
                className: 'flex items-center gap-1',
                children: [
                  e.jsxs('span', {
                    className: 'font-medium',
                    children: [t('fields.lastReview'), ':'],
                  }),
                  e.jsx('span', {
                    children: new Date(s.last_review_date).toLocaleDateString(o.language),
                  }),
                ],
              }),
          ],
        }),
      ],
    }),
  })
}
function We(s) {
  const { dossierId: n, include: a, enabled: i = !0 } = s
  return se({
    queryKey: ['dossierStats', n, a],
    queryFn: () => Se(n, a),
    staleTime: 5 * 60 * 1e3,
    gcTime: 30 * 60 * 1e3,
    refetchOnWindowFocus: !0,
    refetchInterval: 5 * 60 * 1e3,
    enabled: i && !!n,
  })
}
function N({
  icon: s,
  label: n,
  value: a,
  iconColor: i = 'text-muted-foreground',
  onClick: t,
  clickable: o = !1,
}) {
  const r = 'flex items-center gap-3 rounded-lg bg-muted/50 p-3 transition-all duration-200',
    u = o ? 'cursor-pointer hover:bg-muted hover:shadow-sm active:scale-[0.98]' : '',
    g = o ? 'button' : 'div'
  return e.jsxs(g, {
    className: `${r} ${u}`,
    onClick: o ? t : void 0,
    type: o ? 'button' : void 0,
    'aria-label': o ? `${n}: ${a}. Click to view details` : void 0,
    children: [
      e.jsx('div', { className: `shrink-0 ${i}`, 'aria-hidden': 'true', children: s }),
      e.jsxs('div', {
        className: 'min-w-0 flex-1 text-start',
        children: [
          e.jsx('p', {
            className: 'truncate text-sm font-medium text-muted-foreground',
            children: n,
          }),
          e.jsx('p', { className: 'text-2xl font-bold', children: a }),
        ],
      }),
    ],
  })
}
function Ye({ dossierId: s, onStatClick: n }) {
  const { t: a, i18n: i } = j('dossiers'),
    t = z(),
    o = i.language === 'ar',
    { data: r, isLoading: u, isError: g, error: m } = We({ dossierId: s })
  if (u)
    return e.jsxs('div', {
      className: 'space-y-4',
      children: [
        e.jsx('div', {
          className: 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3',
          children: [...Array(3)].map((c, h) => e.jsx(_, { className: 'h-24 w-full' }, h)),
        }),
        e.jsx('div', {
          className: 'grid grid-cols-1 gap-3 sm:grid-cols-2',
          children: [...Array(4)].map((c, h) => e.jsx(_, { className: 'h-24 w-full' }, h)),
        }),
        e.jsx(_, { className: 'h-40 w-full' }),
      ],
    })
  if (g)
    return e.jsxs($, {
      variant: 'destructive',
      children: [
        e.jsx(D, { className: 'size-4' }),
        e.jsx(A, {
          children:
            a('errors.failedToLoadStats', { ns: 'translation' }) ||
            `Failed to load dossier stats: ${m?.message}`,
        }),
      ],
    })
  if (!r)
    return e.jsx($, {
      children: e.jsx(A, {
        children:
          a('stats.noDataAvailable', { ns: 'translation' }) ||
          'No statistics available for this dossier',
      }),
    })
  const l = r.health?.overallScore ?? null,
    x = r.health?.sufficientData ?? !1,
    p = () => {
      t({ to: '/commitments', search: { dossierId: s, status: 'active,in_progress' } })
    }
  return e.jsxs('div', {
    className: 'space-y-4',
    dir: o ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className: 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3',
        children: [
          e.jsx(N, {
            icon: e.jsx(V, { className: 'size-5' }),
            label: a('stats.totalEngagements'),
            value: r.engagements?.total365d ?? 0,
            iconColor: 'text-info',
            onClick: () => n?.('engagements'),
            clickable: !!n && (r.engagements?.total365d ?? 0) > 0,
          }),
          e.jsx(N, {
            icon: e.jsx(L, { className: 'size-5' }),
            label: a('stats.totalDocuments'),
            value: r.documents?.total ?? 0,
            iconColor: 'text-muted-foreground',
          }),
          e.jsx(N, {
            icon: e.jsx(be, { className: 'size-5' }),
            label: a('stats.recentActivity'),
            value: r.engagements?.recent90d ?? 0,
            iconColor: 'text-accent',
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'grid grid-cols-1 gap-3 sm:grid-cols-2',
        children: [
          e.jsx(N, {
            icon: e.jsx(H, { className: 'size-5' }),
            label: a('stats.activeCommitments'),
            value: r.commitments?.active ?? 0,
            iconColor: 'text-success',
            onClick: p,
            clickable: (r.commitments?.active ?? 0) > 0,
          }),
          e.jsx(N, {
            icon: e.jsx(D, { className: 'size-5' }),
            label: a('stats.overdueCommitments'),
            value: r.commitments?.overdue ?? 0,
            iconColor:
              (r.commitments?.overdue ?? 0) > 0 ? 'text-destructive' : 'text-muted-foreground',
          }),
        ],
      }),
      e.jsxs(I, {
        className: 'overflow-hidden',
        children: [
          e.jsx(B, {
            className: 'pb-3',
            children: e.jsxs(P, {
              className: 'flex items-center gap-2 text-sm font-medium',
              children: [e.jsx(q, { className: 'size-4' }), a('stats.relationshipHealth')],
            }),
          }),
          e.jsx(M, {
            children: e.jsx('div', {
              className: 'space-y-3',
              children: x
                ? e.jsxs(e.Fragment, {
                    children: [
                      e.jsxs('div', {
                        className: 'flex items-center justify-between',
                        children: [
                          e.jsx('span', { className: `text-3xl font-bold ${Te(l)}`, children: l }),
                          e.jsx('span', {
                            className: 'text-sm font-medium text-muted-foreground',
                            children: $e(l),
                          }),
                        ],
                      }),
                      e.jsx(oe, {
                        value: l ?? 0,
                        className: 'h-2',
                        'aria-label': `${a('stats.relationshipHealth')}: ${l} out of 100`,
                      }),
                      e.jsxs('div', {
                        className: 'flex justify-between text-xs text-muted-foreground',
                        children: [
                          e.jsx('span', { children: '0' }),
                          e.jsx('span', { children: '50' }),
                          e.jsx('span', { children: '100' }),
                        ],
                      }),
                      r.health?.components &&
                        e.jsxs('div', {
                          className: 'space-y-1 rounded-md bg-muted/50 p-2 text-xs',
                          children: [
                            e.jsx('div', {
                              className: 'font-medium text-muted-foreground',
                              children:
                                a('stats.healthComponents', { ns: 'translation' }) ||
                                'Component Breakdown',
                            }),
                            e.jsxs('div', {
                              className: 'flex justify-between',
                              children: [
                                e.jsx('span', {
                                  children:
                                    a('stats.engagementFrequency', { ns: 'translation' }) ||
                                    'Engagement Frequency',
                                }),
                                e.jsx('span', {
                                  className: 'font-medium',
                                  children: r.health.components.engagementFrequency,
                                }),
                              ],
                            }),
                            e.jsxs('div', {
                              className: 'flex justify-between',
                              children: [
                                e.jsx('span', {
                                  children:
                                    a('stats.commitmentFulfillment', { ns: 'translation' }) ||
                                    'Commitment Fulfillment',
                                }),
                                e.jsx('span', {
                                  className: 'font-medium',
                                  children: r.health.components.commitmentFulfillment,
                                }),
                              ],
                            }),
                            e.jsxs('div', {
                              className: 'flex justify-between',
                              children: [
                                e.jsx('span', {
                                  children: a('stats.recency', { ns: 'translation' }) || 'Recency',
                                }),
                                e.jsx('span', {
                                  className: 'font-medium',
                                  children: r.health.components.recencyScore,
                                }),
                              ],
                            }),
                          ],
                        }),
                    ],
                  })
                : e.jsx('div', {
                    className: 'py-4 text-center',
                    children: e.jsx('p', {
                      className: 'text-sm text-muted-foreground',
                      children:
                        r.health?.reason ||
                        a('stats.noHealthScore', { ns: 'translation' }) ||
                        'Not enough data to calculate health score',
                    }),
                  }),
            }),
          }),
        ],
      }),
    ],
  })
}
function v({ icon: s, label: n, onClick: a, variant: i = 'outline', disabled: t = !1 }) {
  return e.jsxs(y, {
    variant: i,
    className: 'h-auto w-full justify-start gap-2 px-4 py-3',
    onClick: a,
    disabled: t,
    'aria-label': n,
    children: [
      e.jsx('div', { className: 'shrink-0', 'aria-hidden': 'true', children: s }),
      e.jsx('span', { className: 'text-sm font-medium', children: n }),
    ],
  })
}
function Xe({
  onAddEngagement: s,
  onAddPosition: n,
  onLogIntelligence: a,
  onUploadDocument: i,
  onAddContact: t,
  onGenerateBrief: o,
}) {
  const { t: r } = j('dossiers')
  return e.jsxs(I, {
    children: [
      e.jsx(B, { children: e.jsx(P, { className: 'text-base', children: 'Quick Actions' }) }),
      e.jsxs(M, {
        className: 'space-y-2',
        children: [
          o &&
            e.jsx(v, {
              icon: e.jsx(L, { className: 'size-5' }),
              label: r('generateBrief'),
              onClick: o,
              variant: 'default',
            }),
          s &&
            e.jsx(v, {
              icon: e.jsx(V, { className: 'size-5' }),
              label: r('actions.addEngagement'),
              onClick: s,
            }),
          n &&
            e.jsx(v, {
              icon: e.jsx(je, { className: 'size-5' }),
              label: r('actions.addPosition'),
              onClick: n,
            }),
          a &&
            e.jsx(v, {
              icon: e.jsx(K, { className: 'size-5' }),
              label: r('actions.logIntelligence'),
              onClick: a,
            }),
          i &&
            e.jsx(v, {
              icon: e.jsx(ye, { className: 'size-5' }),
              label: r('actions.uploadDocument'),
              onClick: i,
            }),
          t &&
            e.jsx(v, {
              icon: e.jsx(ve, { className: 'size-5' }),
              label: r('actions.addContact'),
              onClick: t,
            }),
        ],
      }),
    ],
  })
}
function Ze({ open: s, currentData: n, remoteData: a, onResolve: i }) {
  const { t, i18n: o } = j('dossiers')
  o.language
  const u = (() => {
      const l = []
      return (
        new Set([...Object.keys(n), ...Object.keys(a)]).forEach((p) => {
          const c = n[p],
            h = a[p]
          if (['id', 'created_at', 'updated_at', 'archived'].includes(p)) return
          JSON.stringify(c) !== JSON.stringify(h) &&
            c !== void 0 &&
            h !== void 0 &&
            l.push({ field: p, currentValue: c, remoteValue: h })
        }),
        l
      )
    })(),
    g = (l) =>
      l == null
        ? t('none', { ns: 'translation' }) || 'None'
        : Array.isArray(l)
          ? l.join(', ')
          : typeof l == 'object'
            ? JSON.stringify(l, null, 2)
            : typeof l == 'boolean'
              ? l
                ? t('yes', { ns: 'translation' }) || 'Yes'
                : t('no', { ns: 'translation' }) || 'No'
              : String(l),
    m = (l) => t(`fields.${l}`) || l
  return e.jsx(ce, {
    open: s,
    onOpenChange: (l) => !l && i('cancel'),
    children: e.jsxs(de, {
      className: 'max-h-[80vh] max-w-3xl overflow-y-auto',
      children: [
        e.jsxs(me, {
          children: [
            e.jsxs(xe, {
              className: 'flex items-center gap-2',
              children: [e.jsx(U, { className: 'size-5 text-amber-500' }), t('conflict.title')],
            }),
            e.jsx(ue, { children: t('conflict.message') }),
          ],
        }),
        e.jsxs('div', {
          className: 'space-y-4',
          children: [
            e.jsxs('div', {
              className: 'flex gap-4 rounded-lg bg-muted/50 p-4',
              children: [
                e.jsxs('div', {
                  className: 'flex-1',
                  children: [
                    e.jsx('p', {
                      className: 'mb-1 text-sm font-medium text-muted-foreground',
                      children: t('conflict.currentVersion'),
                    }),
                    e.jsxs(f, { variant: 'outline', children: ['v', n.version || 'unknown'] }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'flex-1',
                  children: [
                    e.jsx('p', {
                      className: 'mb-1 text-sm font-medium text-muted-foreground',
                      children: t('conflict.remoteVersion'),
                    }),
                    e.jsxs(f, { variant: 'default', children: ['v', a.version || 'unknown'] }),
                  ],
                }),
              ],
            }),
            u.length > 0 &&
              e.jsxs('div', {
                className: 'space-y-3',
                children: [
                  e.jsx('h3', {
                    className: 'text-sm font-medium',
                    children: t('conflict.changes'),
                  }),
                  e.jsx('div', {
                    className: 'overflow-hidden rounded-lg border',
                    children: e.jsxs('table', {
                      className: 'w-full text-sm',
                      children: [
                        e.jsx('thead', {
                          className: 'bg-muted/50',
                          children: e.jsxs('tr', {
                            children: [
                              e.jsx('th', {
                                className: 'p-3 text-start font-medium',
                                children: t('conflict.field'),
                              }),
                              e.jsx('th', {
                                className: 'p-3 text-start font-medium',
                                children: t('conflict.yourChange'),
                              }),
                              e.jsx('th', {
                                className: 'p-3 text-start font-medium',
                                children: t('conflict.theirChange'),
                              }),
                            ],
                          }),
                        }),
                        e.jsx('tbody', {
                          children: u.map((l, x) =>
                            e.jsxs(
                              'tr',
                              {
                                className: x % 2 === 0 ? 'bg-muted/20' : '',
                                children: [
                                  e.jsx('td', {
                                    className: 'p-3 align-top font-medium',
                                    children: m(l.field),
                                  }),
                                  e.jsx('td', {
                                    className: 'p-3 align-top',
                                    children: e.jsx('div', {
                                      className: 'rounded border border-blue-200 bg-blue-50 p-2',
                                      children: e.jsx('pre', {
                                        className: 'whitespace-pre-wrap text-xs',
                                        children: g(l.currentValue),
                                      }),
                                    }),
                                  }),
                                  e.jsx('td', {
                                    className: 'p-3 align-top',
                                    children: e.jsx('div', {
                                      className: 'rounded border border-amber-200 bg-amber-50 p-2',
                                      children: e.jsx('pre', {
                                        className: 'whitespace-pre-wrap text-xs',
                                        children: g(l.remoteValue),
                                      }),
                                    }),
                                  }),
                                ],
                              },
                              l.field,
                            ),
                          ),
                        }),
                      ],
                    }),
                  }),
                ],
              }),
            e.jsx('div', {
              className: 'rounded-lg border border-amber-200 bg-amber-50 p-4',
              children: e.jsx('p', {
                className: 'text-sm text-amber-900',
                children:
                  t('conflict.warning', { ns: 'translation' }) ||
                  'Choosing "Keep My Changes" will overwrite the remote changes. This action cannot be undone.',
              }),
            }),
          ],
        }),
        e.jsxs(ge, {
          className: 'flex-col gap-2 sm:flex-row',
          children: [
            e.jsx(y, {
              variant: 'outline',
              onClick: () => i('cancel'),
              className: 'w-full sm:w-auto',
              children: t('conflict.cancel'),
            }),
            e.jsx(y, {
              variant: 'secondary',
              onClick: () => i('use-theirs'),
              className: 'w-full sm:w-auto',
              children: t('conflict.useTheirs'),
            }),
            e.jsx(y, {
              variant: 'destructive',
              onClick: () => i('keep-mine'),
              className: 'w-full sm:w-auto',
              children: t('conflict.keepMine'),
            }),
          ],
        }),
      ],
    }),
  })
}
const es = {
    low: {
      icon: Ce,
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      textColor: 'text-gray-700 dark:text-gray-300',
      borderColor: 'border-gray-300 dark:border-gray-600',
    },
    medium: {
      icon: D,
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      textColor: 'text-blue-700 dark:text-blue-300',
      borderColor: 'border-blue-300 dark:border-blue-600',
    },
    high: {
      icon: we,
      bgColor: 'bg-green-100 dark:bg-green-900',
      textColor: 'text-green-700 dark:text-green-300',
      borderColor: 'border-green-300 dark:border-green-600',
    },
    verified: {
      icon: Ne,
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      textColor: 'text-purple-700 dark:text-purple-300',
      borderColor: 'border-purple-300 dark:border-purple-600',
    },
  },
  ss = { sm: 'text-xs px-2 py-0.5', md: 'text-sm px-2.5 py-1', lg: 'text-base px-3 py-1.5' },
  ts = { sm: 'h-3 w-3', md: 'h-3.5 w-3.5', lg: 'h-4 w-4' }
function as({ level: s, showIcon: n = !0, size: a = 'sm' }) {
  const { t: i, i18n: t } = j('dossier'),
    o = t.language === 'ar',
    r = es[s],
    u = r.icon
  return e.jsxs(f, {
    variant: 'outline',
    className: `
        ${r.bgColor}
        ${r.textColor}
        ${r.borderColor}
        ${ss[a]}
        font-medium
        inline-flex
        items-center
        gap-1
        ${o ? 'flex-row-reverse' : 'flex-row'}
      `,
    children: [
      n && e.jsx(u, { className: ts[a] }),
      e.jsx('span', { children: i(`intelligence.confidence.${s}`, s) }),
    ],
  })
}
function ns(s) {
  return s >= 90 ? 'verified' : s >= 70 ? 'high' : s >= 50 ? 'medium' : 'low'
}
const rs = { economic: q, political: ke, security: _e, bilateral: k, general: k }
function is({ intelligence: s, showFullAnalysis: n = !1 }) {
  const { t: a, i18n: i } = j('dossier'),
    t = i.language === 'ar',
    o = t ? Be : Pe,
    r = rs[s.intelligence_type] || k,
    u = s.cache_expires_at ? new Date(s.cache_expires_at) < new Date() : !1,
    g = t && s.title_ar ? s.title_ar : s.title,
    m = t && s.content_ar ? s.content_ar : s.content,
    l = s.last_refreshed_at
      ? Oe(new Date(s.last_refreshed_at), { addSuffix: !0, locale: o })
      : a('intelligence.never_updated', 'Never updated')
  return e.jsxs(I, {
    className: 'p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200',
    dir: t ? 'rtl' : 'ltr',
    role: 'article',
    'aria-label': a('intelligence.cardLabel', {
      type: a(`intelligence.types.${s.intelligence_type}`),
      defaultValue: '{{type}} intelligence report',
    }),
    children: [
      e.jsx('div', {
        className: 'flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4',
        children: e.jsxs('div', {
          className: 'flex items-start gap-3',
          children: [
            e.jsx('div', {
              className: 'rounded-lg bg-primary/10 p-2 sm:p-3 shrink-0',
              children: e.jsx(r, { className: 'h-5 w-5 sm:h-6 sm:w-6 text-primary' }),
            }),
            e.jsxs('div', {
              className: 'flex-1 min-w-0',
              children: [
                e.jsx('h3', {
                  className: 'text-base sm:text-lg font-semibold text-foreground line-clamp-2',
                  children: g,
                }),
                e.jsxs('div', {
                  className: 'flex flex-wrap items-center gap-2 mt-2',
                  children: [
                    e.jsx(f, {
                      variant: 'outline',
                      className: 'text-xs',
                      children: a(`intelligence.types.${s.intelligence_type}`, s.intelligence_type),
                    }),
                    e.jsx(as, { level: ns(s.confidence_score) }),
                    u &&
                      e.jsxs(f, {
                        variant: 'secondary',
                        className:
                          'text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 flex items-center gap-1',
                        children: [
                          e.jsx(U, { className: 'h-3 w-3' }),
                          a('intelligence.stale', 'Stale'),
                        ],
                      }),
                    s.refresh_status === 'fresh' &&
                      !u &&
                      e.jsxs(f, {
                        variant: 'secondary',
                        className:
                          'text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center gap-1',
                        children: [
                          e.jsx(H, { className: 'h-3 w-3' }),
                          a('intelligence.fresh', 'Fresh'),
                        ],
                      }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      e.jsx('div', {
        className: 'mb-4',
        children: e.jsx('p', {
          className:
            'text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap',
          children: m,
        }),
      }),
      e.jsxs('div', {
        className:
          'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-border',
        children: [
          e.jsxs('div', {
            className: 'flex items-center gap-2 text-xs sm:text-sm text-muted-foreground',
            children: [
              e.jsx(De, { className: 'h-4 w-4' }),
              e.jsxs('span', { children: [a('intelligence.last_updated', 'Updated'), ' ', l] }),
            ],
          }),
          s.data_sources_metadata &&
            s.data_sources_metadata.length > 0 &&
            e.jsx('div', {
              className: 'text-xs sm:text-sm text-muted-foreground',
              children: a('intelligence.sources_count', {
                count: s.data_sources_metadata.length,
                defaultValue: '{{count}} sources',
              }),
            }),
        ],
      }),
    ],
  })
}
function ls({ dossierId: s }) {
  const { t: n, i18n: a } = j('dossier'),
    i = a.language === 'ar',
    { data: t, isLoading: o, isError: r, error: u } = Fe(s),
    { mutate: g, isPending: m } = Re({
      onSuccess: (c) => {
        const h = c.data.map((w) => n(`intelligence.types.${w.intelligence_type}`)).join(', ')
        C.success(i ? `تم تحديث التقارير بنجاح: ${h}` : `Successfully refreshed: ${h}`)
      },
      onError: (c) => {
        c.code === 'CONFLICT'
          ? C.warning(
              i
                ? 'تحديث جاري بالفعل. يرجى الانتظار حتى يكتمل.'
                : 'Refresh already in progress. Please wait until it completes.',
            )
          : c.code === 'SERVICE_UNAVAILABLE'
            ? C.error(
                i
                  ? 'خدمة AnythingLLM غير متاحة. سيتم عرض البيانات المخزنة مؤقتاً.'
                  : 'AnythingLLM service unavailable. Showing cached data.',
              )
            : C.error(
                i
                  ? `فشل التحديث: ${c.message_ar || c.message_en}`
                  : `Refresh failed: ${c.message_en}`,
              )
      },
    }),
    l = (c) => {
      g({ entity_id: s, intelligence_types: c, priority: 'normal' })
    }
  if (o)
    return e.jsx('div', {
      className: 'space-y-4 sm:space-y-6',
      dir: i ? 'rtl' : 'ltr',
      children: e.jsx('div', {
        className: 'grid grid-cols-1 md:grid-cols-2 gap-4',
        children: [1, 2, 3, 4].map((c) => e.jsx(_, { className: 'h-48 w-full' }, c)),
      }),
    })
  if (r)
    return e.jsxs($, {
      variant: 'destructive',
      dir: i ? 'rtl' : 'ltr',
      children: [
        e.jsx(D, { className: `h-4 w-4 ${i ? 'ml-2' : 'mr-2'}` }),
        e.jsx(A, {
          children:
            u instanceof Error ? u.message : n('intelligence.error', 'Failed to load intelligence'),
        }),
      ],
    })
  if (!t || t.data.length === 0)
    return e.jsxs('div', {
      className: 'text-center py-12',
      dir: i ? 'rtl' : 'ltr',
      children: [
        e.jsx(K, { className: 'mx-auto h-12 w-12 text-gray-400 dark:text-gray-600' }),
        e.jsx('h3', {
          className: 'mt-2 text-sm font-medium text-gray-900 dark:text-white',
          children: n('intelligence.empty', 'No Intelligence Reports'),
        }),
        e.jsx('p', {
          className: 'mt-1 text-sm text-gray-500 dark:text-gray-400',
          children: n(
            'intelligence.emptyDescription',
            'No intelligence reports have been generated for this entity yet',
          ),
        }),
      ],
    })
  const x = ['economic', 'political', 'security', 'bilateral'],
    p = [...t.data].sort((c, h) => x.indexOf(c.intelligence_type) - x.indexOf(h.intelligence_type))
  return e.jsxs('div', {
    className: 'space-y-6',
    dir: i ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3',
        children: [
          e.jsxs('div', {
            children: [
              e.jsx('h2', {
                className: 'text-lg sm:text-xl font-semibold text-foreground',
                children: n('intelligence.title', 'Intelligence Reports'),
              }),
              e.jsx('p', {
                className: 'text-sm text-muted-foreground mt-1',
                children: n(
                  'intelligence.description',
                  'AI-generated intelligence insights from credible sources',
                ),
              }),
            ],
          }),
          e.jsx(Me, {
            intelligenceTypes: ['economic', 'political', 'security', 'bilateral'],
            onRefresh: l,
            isLoading: m,
            showTypeSelection: !0,
            className: 'w-full sm:w-auto',
          }),
        ],
      }),
      e.jsx('div', {
        className: 'grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6',
        children: p.map((c) => e.jsx(is, { intelligence: c, showFullAnalysis: !1 }, c.id)),
      }),
      t.meta &&
        e.jsxs('div', {
          className: 'flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400',
          children: [
            e.jsxs('div', {
              children: [
                e.jsxs('span', {
                  className: 'font-medium',
                  children: [n('intelligence.totalReports', 'Total Reports'), ':'],
                }),
                ' ',
                t.meta.total_count,
              ],
            }),
            e.jsxs('div', {
              children: [
                e.jsxs('span', {
                  className: 'font-medium',
                  children: [n('intelligence.freshReports', 'Fresh'), ':'],
                }),
                ' ',
                t.meta.fresh_count,
              ],
            }),
            e.jsxs('div', {
              children: [
                e.jsxs('span', {
                  className: 'font-medium',
                  children: [n('intelligence.staleReports', 'Stale'), ':'],
                }),
                ' ',
                t.meta.stale_count,
              ],
            }),
          ],
        }),
    ],
  })
}
function Ts() {
  const { t: s } = j('dossiers'),
    n = z(),
    { id: a } = O.useParams(),
    i = O.useSearch(),
    [t, o] = T.useState(i.tab || 'timeline'),
    [r, u] = T.useState(!1),
    [g] = T.useState(null),
    { data: m, isLoading: l, error: x } = te(a, ['stats', 'owners', 'contacts', 'recent_briefs']),
    p = Je(a),
    c = () => {},
    h = async () => {
      if (confirm(s('detail.confirm_archive')))
        try {
          ;(await p.mutateAsync(), n({ to: '/dossiers' }))
        } catch (d) {
          console.error('Failed to archive dossier:', d)
        }
    },
    w = () => {},
    Q = (d) => {
      ;(o(d), n({ search: { tab: d }, replace: !0 }))
    },
    J = (d) => {
      ;(d === 'use-theirs' && window.location.reload(), u(!1))
    },
    G = (d) => {
      const Y = { engagements: 'timeline', positions: 'positions', mous: 'mous' },
        X = { engagements: 'engagement', positions: 'position', mous: 'mou' },
        S = Y[d],
        F = X[d]
      ;(o(S),
        n({ search: { tab: S, ...(S === 'timeline' && F ? { event_type: F } : {}) }, replace: !0 }))
    }
  if (l)
    return e.jsx('div', {
      className: 'min-h-screen bg-gray-50 dark:bg-gray-900',
      children: e.jsx('div', {
        className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
        children: e.jsxs('div', {
          className: 'space-y-6',
          children: [
            e.jsx('div', {
              className: 'h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse',
            }),
            e.jsxs('div', {
              className: 'grid grid-cols-1 lg:grid-cols-3 gap-6',
              children: [
                e.jsxs('div', {
                  className: 'lg:col-span-2 space-y-6',
                  children: [
                    e.jsx('div', {
                      className: 'h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse',
                    }),
                    e.jsx('div', {
                      className: 'h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse',
                    }),
                  ],
                }),
                e.jsx('div', {
                  className: 'space-y-6',
                  children: e.jsx('div', {
                    className: 'h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse',
                  }),
                }),
              ],
            }),
          ],
        }),
      }),
    })
  if (x) {
    const d = x instanceof Error && x.message === 'DOSSIER_NOT_FOUND'
    return e.jsx('div', {
      className: 'min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4',
      children: e.jsx('div', {
        className: 'max-w-md w-full',
        children: e.jsxs('div', {
          className:
            'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6',
          role: 'alert',
          children: [
            e.jsx('h2', {
              className: 'text-lg font-medium text-red-800 dark:text-red-200',
              children: d
                ? s('detail.not_found_title', 'Dossier Not Found')
                : s('detail.error_title', 'Error Loading Dossier'),
            }),
            e.jsx('p', {
              className: 'mt-2 text-sm text-red-700 dark:text-red-300',
              children: d
                ? s(
                    'detail.not_found_message',
                    'The dossier you are looking for does not exist or may have been removed. This could be due to a data integrity issue where an assignment references a non-existent dossier.',
                  )
                : x instanceof Error
                  ? x.message
                  : s(
                      'detail.error_generic',
                      'An unexpected error occurred while loading the dossier.',
                    ),
            }),
            e.jsxs('div', {
              className: 'mt-4 flex flex-col sm:flex-row gap-2',
              children: [
                e.jsx('button', {
                  onClick: () => n({ to: '/my-work/waiting' }),
                  className:
                    'inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500',
                  children: s('detail.back_to_waiting_queue', 'Back to Waiting Queue'),
                }),
                e.jsx('button', {
                  onClick: () => n({ to: '/dossiers' }),
                  className:
                    'inline-flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500',
                  children: s('detail.back_to_hub', 'Go to Dossiers'),
                }),
              ],
            }),
          ],
        }),
      }),
    })
  }
  if (!m) return null
  const E = m.type === 'country' || m.dossier_type === 'Country',
    W = [
      { id: 'timeline', label: s('tabs.timeline') },
      { id: 'relationships', label: s('tabs.relationships') },
      { id: 'positions', label: s('tabs.positions') },
      { id: 'mous', label: s('tabs.mous') },
      { id: 'intelligence', label: s('tabs.intelligence'), disabled: !E },
      { id: 'contacts', label: s('tabs.contacts') },
      { id: 'commitments', label: s('tabs.commitments'), disabled: !0 },
      { id: 'files', label: s('tabs.files'), disabled: !0 },
    ]
  return e.jsxs('div', {
    className: 'min-h-screen bg-gray-50 dark:bg-gray-900',
    children: [
      e.jsx(Ge, { dossier: m, onEdit: c, onArchive: h, onGenerateBrief: w }),
      e.jsx('main', {
        className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
        children: e.jsxs('div', {
          className: 'space-y-6',
          children: [
            e.jsx('div', { children: e.jsx(Ye, { dossierId: a, onStatClick: G }) }),
            e.jsxs('div', {
              className: 'bg-white dark:bg-gray-800 rounded-lg shadow',
              children: [
                e.jsx('div', {
                  className: 'border-b border-gray-200 dark:border-gray-700',
                  children: e.jsx('nav', {
                    className: '-mb-px flex overflow-x-auto scrollbar-hide px-4 sm:px-6',
                    'aria-label': s('detail.tabs_label'),
                    role: 'tablist',
                    children: W.map((d) =>
                      e.jsx(
                        'button',
                        {
                          onClick: () => !d.disabled && Q(d.id),
                          disabled: d.disabled,
                          role: 'tab',
                          'aria-selected': t === d.id,
                          'aria-controls': `${d.id}-panel`,
                          className: `
 flex-shrink-0 min-h-11 py-3 px-3 sm:px-4 md:px-6 border-b-2 font-medium text-xs sm:text-sm md:text-base
 transition-all duration-200 ease-in-out
 ${t === d.id ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}
 ${d.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-t-md
 `,
                          children: e.jsx('span', {
                            className: 'whitespace-nowrap',
                            children: d.label,
                          }),
                        },
                        d.id,
                      ),
                    ),
                  }),
                }),
                e.jsxs('div', {
                  className: 'p-4 sm:p-6',
                  children: [
                    t === 'timeline' &&
                      e.jsxs('div', {
                        id: 'timeline-panel',
                        role: 'tabpanel',
                        'aria-labelledby': 'timeline-tab',
                        children: [
                          m.dossier_type === 'Country' && e.jsx(Ae, { dossierId: a }),
                          m.dossier_type === 'Organization' && e.jsx(He, { dossierId: a }),
                          m.dossier_type === 'Person' && e.jsx(qe, { dossierId: a }),
                          m.dossier_type === 'Engagement' && e.jsx(Ve, { dossierId: a }),
                          !['Country', 'Organization', 'Person', 'Engagement'].includes(
                            m.dossier_type,
                          ) &&
                            e.jsx('div', {
                              className: 'text-center py-12 text-muted-foreground',
                              children: e.jsx('p', {
                                children: s(
                                  'timeline.not_supported',
                                  'Timeline not yet supported for this dossier type',
                                ),
                              }),
                            }),
                        ],
                      }),
                    t === 'relationships' &&
                      e.jsx('div', {
                        id: 'relationships-panel',
                        role: 'tabpanel',
                        'aria-labelledby': 'relationships-tab',
                        children: e.jsx(ze, { dossierId: a }),
                      }),
                    t === 'positions' &&
                      e.jsx('div', {
                        id: 'positions-panel',
                        role: 'tabpanel',
                        'aria-labelledby': 'positions-tab',
                        children: e.jsx(Ie, { dossierId: a }),
                      }),
                    t === 'mous' &&
                      e.jsx('div', {
                        id: 'mous-panel',
                        role: 'tabpanel',
                        'aria-labelledby': 'mous-tab',
                        children: e.jsx(Le, { dossierId: a }),
                      }),
                    t === 'intelligence' &&
                      e.jsx('div', {
                        id: 'intelligence-panel',
                        role: 'tabpanel',
                        'aria-labelledby': 'intelligence-tab',
                        children: E
                          ? e.jsx(ls, { dossierId: a })
                          : e.jsx('div', {
                              className: 'text-center py-12 text-muted-foreground',
                              children: e.jsx('p', {
                                children: s(
                                  'intelligence.country_only',
                                  'Intelligence reports are only available for country dossiers',
                                ),
                              }),
                            }),
                      }),
                    t === 'contacts' &&
                      e.jsx('div', {
                        id: 'contacts-panel',
                        role: 'tabpanel',
                        'aria-labelledby': 'contacts-tab',
                        children: e.jsx(Ee, { dossierId: a }),
                      }),
                    ![
                      'timeline',
                      'relationships',
                      'positions',
                      'mous',
                      'intelligence',
                      'contacts',
                    ].includes(t) &&
                      e.jsx('div', {
                        className: 'text-center py-12 text-gray-500 dark:text-gray-400',
                        children: e.jsx('p', { children: s('detail.tab_coming_soon') }),
                      }),
                  ],
                }),
              ],
            }),
            e.jsx(Xe, { dossierId: a }),
          ],
        }),
      }),
      r && g && m && e.jsx(Ze, { open: r, currentData: m, remoteData: {}, onResolve: J }),
    ],
  })
}
export { Ts as component }
//# sourceMappingURL=_id-Bk34JHp1.js.map
