import { u as q, r as p, j as e } from './react-vendor-Buoak6m3.js'
import {
  a1 as F,
  m as w,
  S as H,
  d as J,
  B as N,
  e as V,
  f as K,
  g as X,
  h as Y,
  p as Z,
  c as a,
  a2 as R,
} from './index-qYY0KoZ1.js'
import { T as ee, a as k, b as S, c as C } from './tooltip-CE0dVuox.js'
import {
  aU as T,
  aW as te,
  bd as se,
  bE as $,
  bG as ae,
  bC as ie,
  bn as ne,
  aV as le,
  cc as P,
  aJ as re,
  aI as oe,
  aH as de,
  ba as ce,
  bJ as xe,
  bN as pe,
  bO as ue,
  bP as he,
  bH as me,
  bI as be,
  br as ge,
  bm as fe,
  bf as U,
  a$ as we,
  aM as A,
  c7 as ve,
  cd as je,
  b9 as Ne,
  aN as O,
} from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './tanstack-vendor-BZC-rs5U.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function ye() {
  const { t, i18n: D } = q(),
    g = D.dir(),
    l = g === 'rtl',
    d = p.useMemo(
      () => [
        {
          id: 'my-work',
          icon: T,
          label: t('navigation.myWork', 'My Work'),
          headline: t('navigation.myWork', 'My Work'),
          description: t(
            'prototype.sidebar.myWorkDescription',
            'Stay on top of your priority queues and missions.',
          ),
          actionLabel: t('prototype.sidebar.myWorkAction', 'View assignments'),
          badge: '3',
          items: [
            {
              id: 'my-assignments',
              label: t('navigation.myAssignments', 'My Assignments'),
              icon: T,
              count: 12,
            },
            {
              id: 'intake-queue',
              label: t('navigation.intakeQueue', 'Intake Queue'),
              icon: te,
              count: 5,
            },
            {
              id: 'waiting-queue',
              label: t('navigation.waitingQueue', 'Waiting Queue'),
              icon: se,
              count: 2,
            },
          ],
        },
        {
          id: 'main',
          icon: $,
          label: t('navigation.mainWork', 'Main'),
          headline: t('navigation.mainWork', 'Main Workstreams'),
          description: t(
            'prototype.sidebar.mainDescription',
            'Jump into the core collaboration surfaces for dossiers and engagements.',
          ),
          actionLabel: t('prototype.sidebar.mainAction', 'Create dossier'),
          items: [
            { id: 'dashboard', label: t('navigation.dashboard', 'Dashboard'), icon: $ },
            { id: 'approvals', label: t('navigation.approvals', 'Approvals'), icon: T, count: 4 },
            { id: 'dossiers', label: t('navigation.dossiers', 'Dossiers'), icon: ae },
            { id: 'engagements', label: t('navigation.engagements', 'Engagements'), icon: ie },
            { id: 'positions', label: t('navigation.positions', 'Positions'), icon: ne },
            { id: 'after-actions', label: t('navigation.afterActions', 'After Actions'), icon: le },
          ],
        },
        {
          id: 'browse',
          icon: P,
          label: t('navigation.browse', 'Browse'),
          headline: t('navigation.browse', 'Browse Entities'),
          description: t(
            'prototype.sidebar.browseDescription',
            'Explore country portfolios, partner organizations, and formal agreements.',
          ),
          actionLabel: t('prototype.sidebar.browseAction', 'Add entity'),
          items: [
            { id: 'countries', label: t('navigation.countries', 'Countries'), icon: P, count: 64 },
            {
              id: 'organizations',
              label: t('navigation.organizations', 'Organizations'),
              icon: re,
              count: 28,
            },
            { id: 'forums', label: t('navigation.forums', 'Forums'), icon: oe, count: 11 },
            { id: 'mous', label: t('navigation.mous', 'MoUs'), icon: de, count: 37 },
          ],
        },
        {
          id: 'tools',
          icon: U,
          label: t('navigation.tools', 'Tools'),
          headline: t('navigation.reports', 'Reports'),
          description: t(
            'prototype.sidebar.toolsDescription',
            'Dive into analytics, intelligence, and operational reporting.',
          ),
          actionLabel: t('prototype.sidebar.toolsAction', 'Create report'),
          badge: '23',
          items: [
            { id: 'calendar', label: t('navigation.calendar', 'Calendar'), icon: me },
            { id: 'briefs', label: t('navigation.briefs', 'Briefs'), icon: be },
            {
              id: 'intelligence',
              label: t('navigation.intelligence', 'Intelligence'),
              icon: ge,
              status: 'beta',
            },
            { id: 'analytics', label: t('navigation.analytics', 'Analytics'), icon: fe },
            {
              id: 'reports',
              label: t('navigation.reports', 'Reports'),
              icon: U,
              count: 23,
              subItems: [
                {
                  id: 'executive-dashboards',
                  label: t('prototype.sidebar.executiveDashboards', 'Executive dashboards'),
                },
                {
                  id: 'export-center',
                  label: t('prototype.sidebar.exportCenter', 'Export center'),
                },
              ],
            },
          ],
          footerGroups: [
            {
              id: 'documents',
              label: t('navigation.documents', 'Documents'),
              items: [
                {
                  id: 'data-library',
                  label: t('navigation.dataLibrary', 'Data Library'),
                  icon: ce,
                },
                {
                  id: 'word-assistant',
                  label: t('navigation.wordAssistant', 'Word Assistant'),
                  icon: xe,
                },
              ],
            },
            {
              id: 'admin',
              label: t('navigation.admin', 'Administration'),
              items: [
                { id: 'users', label: t('navigation.users', 'User Management'), icon: pe },
                { id: 'monitoring', label: t('navigation.monitoring', 'Monitoring'), icon: ue },
                { id: 'export', label: t('navigation.export', 'Export'), icon: he },
              ],
            },
          ],
        },
      ],
      [t],
    ),
    u = d[3] ?? d[0],
    c = u?.items[0],
    [x, v] = p.useState(u?.id ?? ''),
    [j, h] = p.useState(c?.id ?? ''),
    [G, Q] = p.useState({ reports: !0 }),
    [W, E] = p.useState(!1),
    I = F(),
    M = I.isMobile || I.isTablet
  ;(p.useEffect(() => {
    !M && W && E(!1)
  }, [M, W]),
    p.useEffect(() => {
      if (!d.some((b) => b.id === x)) {
        ;(v(u?.id ?? ''), h(u?.items[0]?.id ?? ''))
        return
      }
      const n = d.find((b) => b.id === x)
      if (!n) return
      n.items.some((b) => b.id === j) || h(n.items[0]?.id ?? '')
    }, [d, x, j, u]))
  const o = p.useMemo(() => d.find((i) => i.id === x) ?? u, [d, x, u]),
    B = (i) => {
      v(i)
      const n = d.find((s) => s.id === i)
      n && h(n.items[0]?.id ?? '')
    },
    L = (i) => {
      Q((n) => ({ ...n, [i]: !n[i] }))
    },
    z = (i, n) =>
      i.items.map((s) => {
        const b = s.icon,
          r = j === s.id,
          y = !!G[s.id],
          f = !!s.subItems?.length
        return n === 'compact'
          ? e.jsxs(
              'div',
              {
                className: 'space-y-1',
                children: [
                  e.jsxs(N, {
                    type: 'button',
                    variant: 'ghost',
                    className: a(
                      'w-full justify-between rounded-2xl px-4 py-3 text-base font-semibold shadow-none',
                      'transition-all duration-200 hover:bg-neutral-100 hover:shadow-[0_16px_28px_-24px_rgba(15,23,42,0.55)]',
                      r
                        ? 'bg-neutral-900 text-white shadow-[0_24px_40px_-30px_rgba(15,23,42,0.65)] hover:bg-neutral-900'
                        : 'bg-white/60 text-neutral-600',
                    ),
                    onClick: () => {
                      ;(f && L(s.id), h(s.id))
                    },
                    children: [
                      e.jsxs('span', {
                        className: 'flex items-center gap-3',
                        children: [
                          e.jsx('span', {
                            className: a(
                              'flex h-9 w-9 items-center justify-center rounded-xl border border-transparent bg-neutral-900/5 text-neutral-600 transition-colors duration-200',
                              r && 'bg-white/10 text-white',
                            ),
                            children: e.jsx(b, { className: a('h-4 w-4', r && 'text-white') }),
                          }),
                          s.label,
                        ],
                      }),
                      e.jsxs('span', {
                        className: 'flex items-center gap-2',
                        children: [
                          s.status &&
                            e.jsx(w, {
                              variant: 'outline',
                              className: a(
                                'rounded-full border-neutral-300 text-[10px] uppercase tracking-wide',
                                r && 'border-white/40 text-white',
                              ),
                              children:
                                s.status === 'beta'
                                  ? t('common.beta', 'Beta')
                                  : t('common.new', 'New'),
                            }),
                          typeof s.count == 'number' &&
                            e.jsx(w, {
                              className: a(
                                'rounded-full bg-neutral-100 text-neutral-700 shadow-sm',
                                r && 'bg-white/20 text-white',
                              ),
                              children: s.count,
                            }),
                          f &&
                            (y
                              ? e.jsx(O, {
                                  className: a('h-4 w-4', r ? 'text-white' : 'text-neutral-400'),
                                })
                              : e.jsx(A, {
                                  className: a('h-4 w-4', r ? 'text-white' : 'text-neutral-400'),
                                })),
                        ],
                      }),
                    ],
                  }),
                  f &&
                    y &&
                    e.jsx('div', {
                      className: a(l ? 'pr-12' : 'pl-12'),
                      children: s.subItems?.map((m) => {
                        const _ = j === m.id
                        return e.jsx(
                          N,
                          {
                            variant: 'ghost',
                            className: a(
                              'w-full justify-start rounded-xl px-3 py-2 text-sm font-medium text-neutral-600',
                              'transition-all duration-200 hover:bg-neutral-100',
                              _ && 'bg-neutral-100 text-neutral-900',
                            ),
                            onClick: () => h(m.id),
                            children: m.label,
                          },
                          m.id,
                        )
                      }),
                    }),
                ],
              },
              `${i.id}-${s.id}`,
            )
          : e.jsxs(
              'div',
              {
                className: 'group relative',
                children: [
                  e.jsxs('button', {
                    type: 'button',
                    onClick: () => {
                      ;(f && L(s.id), h(s.id))
                    },
                    className: a(
                      'flex w-full items-center justify-between rounded-[22px] px-4 py-3 text-left transition-all duration-200',
                      r
                        ? 'bg-neutral-950 text-white shadow-[0_28px_44px_-28px_rgba(15,23,42,0.7)]'
                        : 'bg-white/70 text-neutral-600 hover:bg-white hover:text-neutral-900 hover:shadow-[0_18px_30px_-26px_rgba(15,23,42,0.45)]',
                    ),
                    children: [
                      e.jsxs('div', {
                        className: 'flex items-center gap-3',
                        children: [
                          e.jsx('span', {
                            className: a(
                              'flex h-9 w-9 items-center justify-center rounded-xl border border-transparent bg-neutral-900/5 transition-colors duration-200 text-neutral-500',
                              r && 'bg-white/10 border-white/15 text-white',
                            ),
                            children: e.jsx(b, {
                              className: a('h-4 w-4', r ? 'text-white' : 'text-neutral-500'),
                            }),
                          }),
                          e.jsxs('span', {
                            className: 'flex flex-col',
                            children: [
                              e.jsx('span', {
                                className: 'text-[15px] font-medium leading-snug',
                                children: s.label,
                              }),
                              f &&
                                e.jsx('span', {
                                  className: 'text-xs text-neutral-400',
                                  children: t('prototype.sidebar.expandLabel', 'View details'),
                                }),
                            ],
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        className: 'flex items-center gap-2',
                        children: [
                          s.status &&
                            e.jsx(w, {
                              variant: 'outline',
                              className: a(
                                'rounded-full border-neutral-300 text-[10px] uppercase tracking-wide',
                                r && 'border-white/30 text-white',
                              ),
                              children:
                                s.status === 'beta'
                                  ? t('common.beta', 'Beta')
                                  : t('common.new', 'New'),
                            }),
                          typeof s.count == 'number' &&
                            e.jsx(w, {
                              className: a(
                                'h-6 min-w-[1.75rem] rounded-full px-2 text-xs font-semibold backdrop-blur',
                                r ? 'bg-white/15 text-white' : 'bg-neutral-100 text-neutral-600',
                              ),
                              children: s.count,
                            }),
                          f &&
                            (y
                              ? e.jsx(O, {
                                  className: a('h-4 w-4', r ? 'text-white' : 'text-neutral-400'),
                                })
                              : e.jsx(A, {
                                  className: a('h-4 w-4', r ? 'text-white' : 'text-neutral-400'),
                                })),
                        ],
                      }),
                    ],
                  }),
                  f &&
                    y &&
                    e.jsx('div', {
                      className: a('mt-2 space-y-1', l ? 'pr-14' : 'pl-14'),
                      children: s.subItems?.map((m) => {
                        const _ = j === m.id
                        return e.jsxs(
                          'button',
                          {
                            type: 'button',
                            onClick: () => h(m.id),
                            className: a(
                              'relative w-full rounded-xl px-3 py-2 text-sm transition-all duration-200',
                              _
                                ? 'bg-neutral-100 text-neutral-900'
                                : 'text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700',
                            ),
                            children: [
                              _ &&
                                e.jsx('span', {
                                  className: a(
                                    'absolute h-4 w-[3px] -translate-y-1/2 rounded-full bg-neutral-900',
                                    l ? 'right-2 top-1/2' : 'left-2 top-1/2',
                                  ),
                                }),
                              e.jsx('span', {
                                className: a(l ? 'mr-3' : 'ml-3'),
                                children: m.label,
                              }),
                            ],
                          },
                          m.id,
                        )
                      }),
                    }),
                ],
              },
              `${i.id}-${s.id}`,
            )
      })
  return e.jsxs(ee, {
    delayDuration: 300,
    children: [
      e.jsx('div', {
        dir: g,
        className: 'lg:hidden',
        children: e.jsxs('div', {
          className:
            'flex items-center justify-between gap-3 rounded-[28px] border border-white/60 bg-white/80 px-4 py-4 shadow-[0_24px_50px_-35px_rgba(15,23,42,0.45)] backdrop-blur',
          children: [
            e.jsxs('div', {
              className: 'min-w-0',
              children: [
                e.jsx('p', {
                  className: 'text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400',
                  children: t('dossier.reports.title', 'Reports'),
                }),
                e.jsx('p', {
                  className: 'truncate text-base font-semibold text-neutral-900',
                  children: o?.headline,
                }),
              ],
            }),
            e.jsxs('div', {
              className: 'flex items-center gap-2',
              children: [
                o?.badge &&
                  e.jsx(w, {
                    className:
                      'rounded-full border border-neutral-200 bg-neutral-100 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500',
                    children: o.badge,
                  }),
                e.jsxs(H, {
                  open: W,
                  onOpenChange: E,
                  children: [
                    e.jsx(J, {
                      asChild: !0,
                      children: e.jsx(N, {
                        type: 'button',
                        variant: 'secondary',
                        size: 'icon',
                        className:
                          'h-11 w-11 rounded-2xl border border-neutral-200/70 bg-white shadow-sm',
                        'aria-label': t(
                          'prototype.sidebar.openNavigation',
                          'Open dossier navigation',
                        ),
                        children: e.jsx(we, { className: 'h-5 w-5 text-neutral-700' }),
                      }),
                    }),
                    e.jsxs(V, {
                      side: l ? 'right' : 'left',
                      className: 'w-[320px] sm:w-[360px]',
                      dir: g,
                      children: [
                        e.jsxs(K, {
                          className: 'text-start',
                          children: [
                            e.jsx(X, {
                              className: 'text-lg font-semibold text-neutral-900',
                              children: t(
                                'prototype.sidebar.navigationTitle',
                                'Workspace navigation',
                              ),
                            }),
                            e.jsx(Y, {
                              className: 'text-sm text-neutral-500',
                              children: t(
                                'prototype.sidebar.navigationDescription',
                                'Switch between workstreams, browse entities, and access tooling.',
                              ),
                            }),
                          ],
                        }),
                        e.jsx(Z, {
                          className: a('mt-6 h-[calc(100vh-160px)]', l ? 'pl-2' : 'pr-2'),
                          children: e.jsx('div', {
                            className: 'space-y-8 pb-24',
                            children: d.map((i) =>
                              e.jsxs(
                                'div',
                                {
                                  className: 'space-y-4',
                                  children: [
                                    e.jsxs('div', {
                                      className: 'flex items-center justify-between',
                                      children: [
                                        e.jsxs('button', {
                                          type: 'button',
                                          onClick: () => B(i.id),
                                          className: a(
                                            'flex items-center gap-3 text-left text-sm font-semibold text-neutral-500',
                                            x === i.id && 'text-neutral-900',
                                          ),
                                          children: [
                                            e.jsx('span', {
                                              className:
                                                'flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-200/80 text-neutral-700',
                                              children: e.jsx(i.icon, { className: 'h-4 w-4' }),
                                            }),
                                            e.jsx('span', { children: i.label }),
                                          ],
                                        }),
                                        i.badge &&
                                          e.jsx(w, {
                                            className:
                                              'rounded-full bg-neutral-100 text-xs text-neutral-600',
                                            children: i.badge,
                                          }),
                                      ],
                                    }),
                                    e.jsx('div', {
                                      className: 'space-y-3',
                                      children: z(i, 'compact'),
                                    }),
                                    i.footerGroups?.map((n) =>
                                      e.jsxs(
                                        'div',
                                        {
                                          className: 'space-y-3',
                                          children: [
                                            e.jsx(R, { className: 'bg-neutral-200/80' }),
                                            e.jsx('p', {
                                              className:
                                                'text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400',
                                              children: n.label,
                                            }),
                                            e.jsx('div', {
                                              className: 'space-y-2',
                                              children: n.items.map((s) =>
                                                e.jsxs(
                                                  N,
                                                  {
                                                    type: 'button',
                                                    variant: 'ghost',
                                                    className:
                                                      'w-full justify-between rounded-xl px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100',
                                                    onClick: () => h(s.id),
                                                    children: [
                                                      e.jsxs('span', {
                                                        className: 'flex items-center gap-3',
                                                        children: [
                                                          e.jsx('span', {
                                                            className:
                                                              'flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-200/70',
                                                            children: e.jsx(s.icon, {
                                                              className: 'h-4 w-4 text-neutral-600',
                                                            }),
                                                          }),
                                                          s.label,
                                                        ],
                                                      }),
                                                      e.jsx(A, {
                                                        className: 'h-4 w-4 text-neutral-300',
                                                      }),
                                                    ],
                                                  },
                                                  s.id,
                                                ),
                                              ),
                                            }),
                                          ],
                                        },
                                        n.id,
                                      ),
                                    ),
                                  ],
                                },
                                i.id,
                              ),
                            ),
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
      }),
      e.jsxs('aside', {
        dir: g,
        className: a(
          'relative hidden h-full min-h-[640px] lg:flex',
          l ? 'flex-row-reverse' : 'flex-row',
        ),
        role: 'complementary',
        'aria-label': t('dossier.reports.title', 'Reports'),
        children: [
          e.jsxs('div', {
            className: a(
              'flex w-[92px] flex-col items-center justify-between bg-neutral-950 px-3 py-6',
              'shadow-[0_30px_65px_-40px_rgba(0,0,0,0.65)]',
              l ? 'rounded-r-[32px]' : 'rounded-l-[32px]',
            ),
            children: [
              e.jsxs('div', {
                className: 'flex flex-col items-center gap-4',
                children: [
                  e.jsx('div', {
                    className:
                      'flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-neutral-900 shadow-lg',
                    children: e.jsx('span', { className: 'text-lg font-semibold', children: 'G' }),
                  }),
                  e.jsx('nav', {
                    className: 'mt-2 flex flex-col items-center gap-3',
                    children: d.map((i) => {
                      const n = i.icon,
                        s = i.id === o?.id
                      return e.jsxs(
                        k,
                        {
                          children: [
                            e.jsx(S, {
                              asChild: !0,
                              children: e.jsxs('button', {
                                type: 'button',
                                onClick: () => B(i.id),
                                className: a(
                                  'relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200',
                                  'text-neutral-400 hover:scale-[1.05] hover:bg-neutral-800 hover:text-white',
                                  s &&
                                    'bg-white text-neutral-950 shadow-[0_18px_40px_-24px_rgba(255,255,255,0.8)]',
                                ),
                                children: [
                                  s &&
                                    e.jsx('span', {
                                      className: a(
                                        'absolute top-1/2 h-10 w-1 -translate-y-1/2 rounded-full bg-white',
                                        l ? '-right-3' : '-left-3',
                                      ),
                                    }),
                                  e.jsx(n, { className: a('h-5 w-5', s && 'text-neutral-900') }),
                                ],
                              }),
                            }),
                            e.jsx(C, {
                              side: l ? 'left' : 'right',
                              className: 'font-medium',
                              children: i.label,
                            }),
                          ],
                        },
                        i.id,
                      )
                    }),
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'flex flex-col items-center gap-3',
                children: [
                  e.jsxs(k, {
                    children: [
                      e.jsx(S, {
                        asChild: !0,
                        children: e.jsxs('button', {
                          type: 'button',
                          className:
                            'relative flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 transition-all duration-200 hover:scale-[1.05] hover:bg-neutral-800 hover:text-white',
                          children: [
                            e.jsx(ve, { className: 'h-5 w-5' }),
                            e.jsx('span', {
                              className:
                                'absolute right-2 top-2 h-2 w-2 rounded-full bg-primary animate-pulse',
                            }),
                          ],
                        }),
                      }),
                      e.jsx(C, {
                        side: l ? 'left' : 'right',
                        className: 'font-medium',
                        children: t('common.notifications', 'Notifications'),
                      }),
                    ],
                  }),
                  e.jsxs(k, {
                    children: [
                      e.jsx(S, {
                        asChild: !0,
                        children: e.jsx('button', {
                          type: 'button',
                          className:
                            'flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 transition-all duration-200 hover:scale-[1.05] hover:bg-neutral-800 hover:text-white',
                          children: e.jsx(je, { className: 'h-5 w-5' }),
                        }),
                      }),
                      e.jsx(C, {
                        side: l ? 'left' : 'right',
                        className: 'font-medium',
                        children: t('common.profile', 'Profile'),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          e.jsx('div', {
            className: a(
              'flex w-[404px] flex-col border-white/30 bg-white/90 px-7 py-8 backdrop-blur-xl',
              l ? 'border-r' : 'border-l',
            ),
            children:
              o &&
              e.jsxs(e.Fragment, {
                children: [
                  e.jsxs('div', {
                    className: 'flex items-start justify-between gap-4',
                    children: [
                      e.jsxs('div', {
                        className: 'min-w-0',
                        children: [
                          e.jsxs('div', {
                            className: 'flex items-center gap-3',
                            children: [
                              e.jsx('h2', {
                                className:
                                  'text-[1.7rem] font-semibold leading-tight text-neutral-900',
                                children: o.headline,
                              }),
                              o.badge &&
                                e.jsx(w, {
                                  className:
                                    'rounded-full border border-neutral-200 bg-neutral-100 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500',
                                  children: o.badge,
                                }),
                            ],
                          }),
                          e.jsx('p', {
                            className: 'mt-3 max-w-[260px] text-sm leading-6 text-neutral-500',
                            children: o.description,
                          }),
                        ],
                      }),
                      e.jsxs(k, {
                        children: [
                          e.jsx(S, {
                            asChild: !0,
                            children: e.jsx(N, {
                              type: 'button',
                              size: 'icon',
                              variant: 'ghost',
                              className:
                                'h-10 w-10 rounded-full border border-neutral-200/70 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-100',
                              'aria-label': o.actionLabel,
                              children: e.jsx(Ne, { className: 'h-4 w-4 text-neutral-700' }),
                            }),
                          }),
                          e.jsx(C, {
                            side: l ? 'right' : 'left',
                            className: 'font-medium',
                            children: o.actionLabel,
                          }),
                        ],
                      }),
                    ],
                  }),
                  e.jsx('nav', { className: 'mt-6 space-y-2 pb-16', children: z(o, 'desktop') }),
                  o.footerGroups?.map((i, n) =>
                    e.jsxs(
                      'div',
                      {
                        className: a('mt-8', n === 0 && 'pt-2'),
                        children: [
                          e.jsx(R, { className: 'mb-3 bg-neutral-200/80' }),
                          e.jsx('span', {
                            className:
                              'px-3 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400',
                            children: i.label,
                          }),
                          e.jsx('div', {
                            className: 'mt-3 space-y-2',
                            children: i.items.map((s) =>
                              e.jsxs(
                                'button',
                                {
                                  type: 'button',
                                  onClick: () => h(s.id),
                                  className: a(
                                    'flex w-full items-center justify-between rounded-2xl px-3 py-2.5 transition-all duration-200',
                                    j === s.id
                                      ? 'bg-neutral-100 text-neutral-900 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.35)]'
                                      : 'bg-white/60 text-neutral-500 hover:bg-white hover:text-neutral-800',
                                  ),
                                  children: [
                                    e.jsxs('span', {
                                      className: 'flex items-center gap-3',
                                      children: [
                                        e.jsx('span', {
                                          className:
                                            'flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-200/70 text-neutral-600',
                                          children: e.jsx(s.icon, { className: 'h-4 w-4' }),
                                        }),
                                        e.jsx('span', {
                                          className: 'text-sm font-medium',
                                          children: s.label,
                                        }),
                                      ],
                                    }),
                                    e.jsx(A, { className: 'h-4 w-4 text-neutral-300' }),
                                  ],
                                },
                                s.id,
                              ),
                            ),
                          }),
                        ],
                      },
                      i.id,
                    ),
                  ),
                ],
              }),
          }),
        ],
      }),
    ],
  })
}
function _e() {
  const { t, i18n: D } = q(),
    g = D.dir(),
    l = g === 'rtl',
    d = p.useMemo(
      () => [
        { id: 'context', titleWidth: 'w-48', lines: ['w-11/12', 'w-3/4', 'w-2/3'] },
        { id: 'performance', titleWidth: 'w-56', lines: ['w-full', 'w-5/6', 'w-2/3', 'w-1/2'] },
        { id: 'signals', titleWidth: 'w-40', lines: ['w-4/5', 'w-3/5', 'w-2/3'] },
      ],
      [],
    ),
    u = p.useMemo(
      () => [
        { id: 'conversion', headerWidth: 'w-24', lines: ['w-4/5', 'w-3/5'] },
        { id: 'pipeline', headerWidth: 'w-28', lines: ['w-3/4', 'w-2/3'] },
        { id: 'activity', headerWidth: 'w-20', lines: ['w-2/3', 'w-1/2'] },
      ],
      [],
    )
  return e.jsx('div', {
    dir: g,
    className:
      'min-h-screen bg-gradient-to-br from-[#d5d8df] via-[#dadedf] to-[#c8ccd4] px-4 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14',
    children: e.jsxs('div', {
      className: a(
        'relative mx-auto w-full max-w-[1200px] overflow-visible rounded-[36px] border border-white/50 bg-white/75 p-5 shadow-[0_70px_120px_-65px_rgba(15,23,42,0.45)] backdrop-blur-2xl sm:p-8 lg:h-[780px]',
      ),
      children: [
        e.jsx('div', {
          'aria-hidden': !0,
          className:
            'pointer-events-none absolute inset-x-6 top-6 hidden h-[92%] rounded-[40px] bg-white/55 shadow-[0_55px_120px_-75px_rgba(15,23,42,0.65)] blur-[1px] lg:block lg:z-0',
        }),
        e.jsx('div', {
          'aria-hidden': !0,
          className:
            'pointer-events-none absolute inset-x-12 top-12 hidden h-[88%] rounded-[40px] bg-white/45 shadow-[0_55px_120px_-80px_rgba(15,23,42,0.55)] lg:block lg:z-0',
        }),
        e.jsxs('div', {
          className: a(
            'relative z-10 flex w-full flex-col gap-6 lg:h-full lg:gap-0',
            l ? 'lg:flex-row-reverse' : 'lg:flex-row',
          ),
          children: [
            e.jsx('div', { className: 'relative z-10 flex-shrink-0', children: e.jsx(ye, {}) }),
            e.jsx('section', {
              className: a(
                'relative z-10 flex flex-1 items-stretch rounded-[28px] bg-neutral-50/80 p-6 sm:p-8 lg:p-12',
                'shadow-[0_45px_80px_-60px_rgba(15,23,42,0.38)]',
                l
                  ? 'lg:rounded-l-[32px] lg:rounded-r-none'
                  : 'lg:rounded-r-[32px] lg:rounded-l-none',
              ),
              children: e.jsx('div', {
                className: 'flex h-full w-full items-center justify-center',
                children: e.jsx('div', {
                  className: a(
                    'w-full rounded-[24px] border border-white/60 bg-white/95 p-6 sm:p-10 lg:h-full lg:max-w-[640px] lg:rounded-[32px]',
                    'shadow-[0_55px_100px_-60px_rgba(15,23,42,0.42)]',
                  ),
                  'aria-label': t(
                    'dossier.prototype.placeholderBoard',
                    'Reports content canvas placeholder',
                  ),
                  children: e.jsxs('div', {
                    className: 'flex h-full flex-col justify-between gap-10',
                    children: [
                      e.jsxs('div', {
                        className: 'space-y-10',
                        children: [
                          e.jsxs('div', {
                            className: 'space-y-3',
                            children: [
                              e.jsx('div', {
                                className: 'h-6 w-44 rounded-full bg-neutral-200/80',
                              }),
                              e.jsx('div', {
                                className: 'h-4 w-64 rounded-full bg-neutral-200/60 sm:w-72',
                              }),
                            ],
                          }),
                          d.map((c) =>
                            e.jsxs(
                              'div',
                              {
                                className: 'space-y-4',
                                children: [
                                  e.jsx('div', {
                                    className: a(
                                      'h-4 rounded-full bg-neutral-200/70',
                                      c.titleWidth,
                                    ),
                                  }),
                                  e.jsx('div', {
                                    className: 'space-y-3',
                                    children: c.lines.map((x, v) =>
                                      e.jsx(
                                        'div',
                                        {
                                          className: a(
                                            'h-3 rounded-full bg-neutral-200/55 animate-pulse',
                                            x,
                                          ),
                                        },
                                        `${c.id}-line-${v}`,
                                      ),
                                    ),
                                  }),
                                ],
                              },
                              c.id,
                            ),
                          ),
                        ],
                      }),
                      e.jsx('div', {
                        className: 'grid gap-4 pt-4 sm:grid-cols-2',
                        children: u.map((c) =>
                          e.jsxs(
                            'div',
                            {
                              className:
                                'flex flex-col gap-3 rounded-2xl border border-neutral-100 bg-neutral-50/80 p-5 shadow-[0_30px_45px_-40px_rgba(15,23,42,0.45)]',
                              children: [
                                e.jsx('div', {
                                  className: a('h-3 rounded-full bg-neutral-200/70', c.headerWidth),
                                }),
                                e.jsx('div', {
                                  className: 'space-y-2',
                                  children: c.lines.map((x, v) =>
                                    e.jsx(
                                      'div',
                                      {
                                        className: a(
                                          'h-2.5 rounded-full bg-neutral-200/50 animate-pulse',
                                          x,
                                        ),
                                      },
                                      `${c.id}-detail-${v}`,
                                    ),
                                  ),
                                }),
                              ],
                            },
                            c.id,
                          ),
                        ),
                      }),
                    ],
                  }),
                }),
              }),
            }),
          ],
        }),
        e.jsx('div', {
          'aria-hidden': !0,
          className:
            'pointer-events-none absolute -bottom-8 left-1/2 hidden -translate-x-1/2 items-center gap-4 rounded-[32px] border border-white/40 bg-white/70 px-6 py-3 shadow-[0_55px_120px_-70px_rgba(15,23,42,0.6)] backdrop-blur-lg lg:flex lg:z-0',
          children: e.jsxs('div', {
            className: 'flex items-center gap-3',
            children: [
              e.jsx('div', { className: 'h-12 w-24 rounded-2xl bg-neutral-200/70' }),
              e.jsx('div', { className: 'h-12 w-24 rounded-2xl bg-neutral-200/60' }),
              e.jsx('div', { className: 'h-12 w-24 rounded-2xl bg-neutral-200/50' }),
            ],
          }),
        }),
        e.jsxs('div', {
          'aria-hidden': !0,
          className: a(
            'pointer-events-none absolute bottom-6 hidden items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-[0_24px_45px_-28px_rgba(15,23,42,0.65)] lg:flex lg:z-20',
            l ? 'left-6' : 'right-6',
          ),
          children: [
            e.jsx('span', {
              className: 'inline-flex h-3 w-3 items-center justify-center rounded-full bg-lime-400',
            }),
            e.jsx('span', { children: 'TanStack Query Live' }),
          ],
        }),
      ],
    }),
  })
}
const Le = _e
export { Le as component }
//# sourceMappingURL=prototype-dossier-00dynGIW.js.map
