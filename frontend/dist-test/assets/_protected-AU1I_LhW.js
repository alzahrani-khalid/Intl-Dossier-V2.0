import { r as n, u as T, j as e, p as ne } from './react-vendor-Buoak6m3.js'
import { j as ie, i as J, L as W, O as re } from './tanstack-vendor-BZC-rs5U.js'
import {
  a as oe,
  b as le,
  c as h,
  S as ce,
  d as de,
  B as A,
  e as me,
  f as ue,
  g as he,
  h as ge,
  i as xe,
  T as pe,
  j as V,
  k as X,
  l as be,
  m as Y,
  n as fe,
  s as $,
  o as ye,
  p as je,
} from './index-qYY0KoZ1.js'
import { T as ve, a as we, b as Ne, c as Ce } from './tooltip-CE0dVuox.js'
import {
  bg as ke,
  bB as Se,
  bC as Ae,
  aU as H,
  bD as Te,
  aW as Le,
  bd as Ee,
  bE as Ie,
  bF as Me,
  bG as Oe,
  bn as Re,
  aV as De,
  bH as _e,
  bI as ze,
  br as Be,
  bm as Fe,
  bf as Pe,
  ba as qe,
  bJ as Ue,
  bK as We,
  be as $e,
  bL as P,
  bM as He,
  bN as Qe,
  bO as Ge,
  bP as Ke,
  a$ as Je,
  bx as O,
  bQ as Ve,
  bR as Xe,
  by as Ye,
  aS as Z,
  bS as Ze,
  aR as et,
  bT as tt,
  aH as st,
  aE as ee,
  aO as at,
  aN as nt,
  aT as it,
  bU as rt,
  bV as ot,
  bW as lt,
  b6 as ct,
  bX as dt,
  bY as mt,
  aD as Q,
  bZ as ut,
} from './vendor-misc-BiJvMP0A.js'
import { A as ht, a as gt } from './avatar-lQOCSoMx.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function xt() {
  return { data: { assignments: 0, intake: 0, waiting: 0 }, isLoading: !1 }
}
const B = 768
function te() {
  const [s, m] = n.useState(void 0)
  return (
    n.useEffect(() => {
      const t = window.matchMedia(`(max-width: ${B - 1}px)`),
        a = () => {
          m(window.innerWidth < B)
        }
      return (
        t.addEventListener('change', a),
        m(window.innerWidth < B),
        () => t.removeEventListener('change', a)
      )
    }, []),
    !!s
  )
}
function pt({ compact: s = !1 }) {
  const { i18n: m } = T(),
    { language: t, setLanguage: a } = oe(),
    p = n.useCallback(async () => {
      const y = t === 'en' ? 'ar' : 'en'
      ;(await le(y), a(y))
    }, [t, a]),
    u = t === 'ar'
  return e.jsxs('button', {
    onClick: p,
    className: h(
      'relative flex items-center rounded-full transition-all duration-300',
      'bg-background border border-border',
      'hover:bg-accent',
      'focus:outline-none',
      s ? 'w-16 h-[30px] p-[3px]' : 'w-28 sm:w-32 h-9 p-1',
    ),
    'aria-label': m.t('languages.switch', 'Switch language'),
    children: [
      e.jsx('div', {
        className: h(
          'absolute rounded-full transition-all duration-300 ease-in-out',
          'bg-primary shadow-md',
          'flex items-center justify-center',
          s ? 'h-[22px] w-7 top-[3px]' : 'h-7 w-12 top-1',
          u ? (s ? 'end-[3px]' : 'end-1') : s ? 'start-[3px]' : 'start-1',
        ),
      }),
      e.jsx('span', {
        className: h(
          'relative z-10 flex-1 text-center transition-all duration-300',
          s ? 'text-[10px] font-semibold' : 'text-xs font-semibold',
          u ? 'text-muted-foreground' : 'text-primary-foreground',
        ),
        children: 'EN',
      }),
      e.jsx('span', {
        className: h(
          'relative z-10 flex-1 text-center transition-all duration-300',
          s ? 'text-[10px] font-semibold' : 'text-xs font-semibold',
          u ? 'text-primary-foreground' : 'text-muted-foreground',
        ),
        children: 'ع',
      }),
    ],
  })
}
const bt = (s, m) => {
    const t = [
      {
        id: 'my-work',
        label: 'navigation.myWork',
        items: [
          {
            id: 'unified-work',
            label: 'navigation.unifiedWork',
            path: '/my-work',
            icon: Ae,
            badgeCount: s.assignments + s.intake + s.waiting,
          },
          {
            id: 'my-assignments',
            label: 'navigation.myAssignments',
            path: '/tasks',
            icon: H,
            badgeCount: s.assignments,
          },
          { id: 'commitments', label: 'navigation.commitments', path: '/commitments', icon: Te },
          {
            id: 'intake-queue',
            label: 'navigation.intakeQueue',
            path: '/my-work/intake',
            icon: Le,
            badgeCount: s.intake,
          },
          {
            id: 'waiting-queue',
            label: 'navigation.waitingQueue',
            path: '/my-work/waiting',
            icon: Ee,
            badgeCount: s.waiting,
          },
        ],
      },
      {
        id: 'main',
        label: 'Main',
        items: [
          { id: 'dashboard', label: 'navigation.dashboard', path: '/dashboard', icon: Ie },
          {
            id: 'custom-dashboard',
            label: 'navigation.customDashboard',
            path: '/custom-dashboard',
            icon: Me,
          },
          { id: 'approvals', label: 'navigation.approvals', path: '/approvals', icon: H },
          { id: 'dossiers', label: 'navigation.dossiers', path: '/dossiers', icon: Oe },
          { id: 'positions', label: 'navigation.positions', path: '/positions', icon: Re },
          {
            id: 'after-actions',
            label: 'navigation.afterActions',
            path: '/after-actions',
            icon: De,
          },
        ],
      },
      {
        id: 'tools',
        label: 'Tools',
        items: [
          { id: 'calendar', label: 'navigation.calendar', path: '/calendar', icon: _e },
          { id: 'briefs', label: 'navigation.briefs', path: '/briefs', icon: ze },
          { id: 'intelligence', label: 'navigation.intelligence', path: '/intelligence', icon: Be },
          { id: 'analytics', label: 'navigation.analytics', path: '/analytics', icon: Fe },
          { id: 'reports', label: 'navigation.reports', path: '/reports', icon: Pe },
        ],
      },
      {
        id: 'documents',
        label: 'Documents',
        items: [
          { id: 'data-library', label: 'navigation.dataLibrary', path: '/data-library', icon: qe },
          {
            id: 'word-assistant',
            label: 'navigation.wordAssistant',
            path: '/word-assistant',
            icon: Ue,
          },
        ],
      },
    ]
    return (
      m &&
        t.push({
          id: 'admin',
          label: 'navigation.admin',
          items: [
            {
              id: 'admin-system',
              label: 'navigation.adminSystem',
              path: '/admin/system',
              icon: We,
              adminOnly: !0,
            },
            {
              id: 'admin-approvals',
              label: 'navigation.adminApprovals',
              path: '/admin/approvals',
              icon: $e,
              adminOnly: !0,
            },
            {
              id: 'ai-usage',
              label: 'navigation.aiUsage',
              path: '/admin/ai-usage',
              icon: P,
              adminOnly: !0,
            },
            {
              id: 'ai-settings',
              label: 'navigation.aiSettings',
              path: '/admin/ai-settings',
              icon: He,
              adminOnly: !0,
            },
            { id: 'users', label: 'navigation.users', path: '/users', icon: Qe, adminOnly: !0 },
            {
              id: 'monitoring',
              label: 'navigation.monitoring',
              path: '/monitoring',
              icon: Ge,
              adminOnly: !0,
            },
            { id: 'export', label: 'navigation.export', path: '/export', icon: Ke, adminOnly: !0 },
          ],
        }),
      t
    )
  },
  ft = [
    { id: 'settings', label: 'navigation.settings', path: '/settings', icon: ke },
    { id: 'help', label: 'navigation.getHelp', path: '/help', icon: Se },
  ]
function G({ className: s, onLinkClick: m, isInSheet: t = !1 }) {
  const { t: a, i18n: p } = T(),
    u = ie(),
    y = J(),
    { user: r, logout: b } = xe(),
    d = te(),
    c = p.language === 'ar',
    [g, w] = n.useState(!0),
    l = t ? !0 : g,
    { data: C } = xt(),
    f = C || { assignments: 0, intake: 0, waiting: 0 },
    o = r?.role === 'admin' || r?.role === 'super_admin',
    i = n.useMemo(() => bt(f, o), [f, o]),
    S = async () => {
      ;(await b(), y({ to: '/login' }))
    },
    N = n.useMemo(
      () =>
        !r?.name && !r?.email
          ? 'GA'
          : (r.name ?? r.email ?? 'User')
              .split(' ')
              .map((k) => k.charAt(0).toUpperCase())
              .join('')
              .slice(0, 2),
      [r],
    )
  function j({ item: x, isActive: k, isRTL: L }) {
    const R = x.icon,
      E = a(x.label, x.label),
      D = e.jsxs(W, {
        to: x.path,
        onClick: m,
        className: 'group/link relative block',
        children: [
          e.jsx(Ye, {
            children:
              k &&
              e.jsx(O.div, {
                layoutId: 'active-sidebar-link',
                className: 'absolute inset-0 bg-sidebar-accent rounded-lg z-10',
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 },
                transition: { duration: 0.15 },
              }),
          }),
          e.jsxs('div', {
            className: h(
              'relative z-20 flex items-center',
              'gap-2 px-3 py-3 sm:gap-3 sm:py-2.5 md:py-2',
              'min-h-11 sm:min-h-10',
              'rounded-lg',
              'text-sidebar-foreground transition-all duration-150',
              'group-hover/link:bg-sidebar-accent/50',
              k && 'font-medium text-sidebar-accent-foreground',
            ),
            children: [
              e.jsx(R, {
                className: h(
                  'h-5 w-5 sm:h-4 sm:w-4 shrink-0 transition-transform duration-150',
                  'group-hover/link:translate-x-1',
                  L && 'group-hover/link:-translate-x-1',
                ),
              }),
              e.jsx(O.span, {
                className: 'text-sm whitespace-pre',
                animate: { display: l ? 'inline-block' : 'none', opacity: l ? 1 : 0 },
                transition: { duration: 0.15 },
                children: E,
              }),
              x.badgeCount !== void 0 &&
                x.badgeCount > 0 &&
                l &&
                e.jsx(O.div, {
                  className: h(
                    'ms-auto flex h-5 min-w-5 items-center justify-center',
                    'rounded-md px-1 bg-primary text-primary-foreground',
                    'text-xs font-medium tabular-nums',
                  ),
                  animate: { display: l ? 'flex' : 'none', opacity: l ? 1 : 0 },
                  transition: { duration: 0.15 },
                  children: x.badgeCount > 99 ? '99+' : x.badgeCount,
                }),
            ],
          }),
        ],
      })
    return l
      ? D
      : e.jsxs(we, {
          delayDuration: 0,
          children: [
            e.jsx(Ne, { asChild: !0, children: D }),
            e.jsxs(Ce, {
              side: L ? 'left' : 'right',
              className: 'flex items-center gap-2',
              children: [
                E,
                x.badgeCount !== void 0 &&
                  x.badgeCount > 0 &&
                  e.jsx('span', {
                    className:
                      'flex h-5 min-w-5 items-center justify-center rounded-md px-1 bg-primary text-primary-foreground text-xs font-medium',
                    children: x.badgeCount > 99 ? '99+' : x.badgeCount,
                  }),
              ],
            }),
          ],
        })
  }
  return e.jsx(ve, {
    delayDuration: 0,
    children: e.jsxs(O.div, {
      className: h(
        'group/sidebar-btn relative flex flex-col h-screen flex-shrink-0',
        'bg-sidebar text-sidebar-foreground',
        !t && 'border-r border-sidebar-border',
        s,
      ),
      animate: { width: d || t ? '100%' : l ? '300px' : '70px' },
      transition: { duration: 0.2, ease: 'easeInOut' },
      dir: c ? 'rtl' : 'ltr',
      children: [
        !t &&
          e.jsx('button', {
            onClick: () => w(!g),
            className: h(
              'absolute top-[20px] z-40',
              c ? '-start-3' : '-end-3',
              'min-h-11 min-w-11 flex items-center justify-center',
              'rounded-md border-2 border-sidebar-border bg-sidebar shadow-md',
              'transition duration-200',
              'hover:bg-sidebar-accent hover:border-sidebar-accent-foreground/20',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              'hidden md:flex',
              'md:opacity-0 md:group-hover/sidebar-btn:opacity-100',
              g ? (c ? 'rotate-180' : 'rotate-0') : c ? 'rotate-0' : 'rotate-180',
            ),
            'aria-label': g
              ? a('sidebar.collapse', 'Collapse sidebar')
              : a('sidebar.expand', 'Expand sidebar'),
            children: e.jsx(Ve, {
              className:
                'h-5 w-5 sm:h-4 sm:w-4 text-sidebar-foreground/80 hover:text-sidebar-foreground',
            }),
          }),
        e.jsx('div', {
          className: 'px-4 py-4',
          children: e.jsxs(W, {
            to: '/dashboard',
            className:
              'flex items-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98]',
            children: [
              e.jsx('div', {
                className:
                  'flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground',
                children: e.jsx('span', { className: 'text-sm font-bold', children: 'G' }),
              }),
              e.jsxs(O.div, {
                className: 'grid flex-1 text-start text-sm leading-tight',
                animate: { display: l ? 'grid' : 'none', opacity: l ? 1 : 0 },
                transition: { duration: 0.2 },
                children: [
                  e.jsx('span', {
                    className: 'truncate font-semibold',
                    children: 'GASTAT Dossier',
                  }),
                  e.jsx('span', {
                    className: 'truncate text-xs text-muted-foreground',
                    children: a('common.internationalRelations', 'International Relations'),
                  }),
                ],
              }),
            ],
          }),
        }),
        e.jsx('div', {
          className: 'flex-1 overflow-y-auto px-3 sm:px-4',
          children: i.map((x) =>
            e.jsxs(
              'div',
              {
                className: 'mb-4 sm:mb-6',
                children: [
                  l &&
                    e.jsx('h3', {
                      className:
                        'px-2 mb-2 sm:mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider',
                      children: a(x.label, x.label),
                    }),
                  e.jsx('div', {
                    className: 'space-y-1 sm:space-y-1',
                    children: x.items.map((k) =>
                      e.jsx(
                        j,
                        {
                          item: k,
                          isActive: u.pathname === k.path || u.pathname.startsWith(`${k.path}/`),
                          isRTL: c,
                        },
                        k.id,
                      ),
                    ),
                  }),
                ],
              },
              x.id,
            ),
          ),
        }),
        e.jsxs('div', {
          className: 'px-4 py-4 border-t border-sidebar-border',
          children: [
            e.jsx('div', {
              className: 'space-y-1 mb-4',
              children: ft.map((x) =>
                e.jsx(j, { item: x, isActive: u.pathname === x.path, isRTL: c }, x.id),
              ),
            }),
            l &&
              e.jsxs('div', {
                className: 'flex items-center justify-center gap-2 mb-4',
                children: [e.jsx(pt, { compact: !0 }), e.jsx(pe, {})],
              }),
            e.jsxs('div', {
              className:
                'flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors',
              children: [
                e.jsx('div', {
                  className:
                    'flex aspect-square size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm',
                  children: e.jsx('span', { className: 'text-sm font-bold', children: N }),
                }),
                l &&
                  e.jsxs(e.Fragment, {
                    children: [
                      e.jsxs('div', {
                        className: 'grid flex-1 text-start text-sm leading-tight min-w-0',
                        children: [
                          e.jsx('span', {
                            className: 'truncate font-semibold text-sidebar-foreground',
                            children: r?.name ?? r?.email,
                          }),
                          e.jsx('span', {
                            className: 'truncate text-xs text-muted-foreground',
                            children: r?.role ?? a('common.administrator', 'Administrator'),
                          }),
                        ],
                      }),
                      e.jsx('button', {
                        onClick: S,
                        className: h(
                          'rounded-md p-1.5 hover:bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground transition-all',
                          'hover:scale-105 active:scale-95',
                          c && 'me-auto ms-0',
                        ),
                        'aria-label': a('common.logout', 'Sign out'),
                        children: e.jsx(Xe, { className: 'h-4 w-4' }),
                      }),
                    ],
                  }),
              ],
            }),
          ],
        }),
      ],
    }),
  })
}
function yt({ children: s }) {
  const [m, t] = n.useState(!1),
    { t: a, i18n: p } = T(),
    u = te(),
    y = p.language === 'ar',
    r = () => {
      u && t(!1)
    }
  return e.jsxs(e.Fragment, {
    children: [
      e.jsxs(ce, {
        open: m,
        onOpenChange: t,
        children: [
          e.jsx(de, {
            asChild: !0,
            children: e.jsx(A, {
              variant: 'ghost',
              size: 'icon',
              className: h(
                'fixed top-4 z-50',
                y ? 'right-4' : 'left-4',
                'md:hidden',
                'min-h-11 min-w-11',
                'bg-sidebar border border-sidebar-border shadow-lg',
                'hover:bg-sidebar-accent',
              ),
              'aria-label': a('sidebar.openMenu', 'Open menu'),
              children: e.jsx(Je, { className: 'h-5 w-5' }),
            }),
          }),
          e.jsxs(me, {
            side: y ? 'right' : 'left',
            className: 'w-[300px] p-0 bg-sidebar border-sidebar-border',
            children: [
              e.jsxs(ue, {
                className: 'sr-only',
                children: [
                  e.jsx(he, { children: a('sidebar.title', 'Navigation Menu') }),
                  e.jsx(ge, {
                    children: a('sidebar.description', 'Main navigation menu for the application'),
                  }),
                ],
              }),
              e.jsx(G, { onLinkClick: r, isInSheet: !0 }),
            ],
          }),
        ],
      }),
      e.jsx(G, { className: 'hidden md:flex' }),
      s,
    ],
  })
}
function jt({ children: s }) {
  return e.jsxs(e.Fragment, {
    children: [
      e.jsx('div', {
        className: 'flex h-screen overflow-hidden bg-background',
        children: e.jsx(yt, {
          children: e.jsx('main', {
            className: 'flex-1 overflow-y-auto pt-16 px-4 pb-4 md:pt-6 md:px-6 md:pb-6 lg:p-8',
            children: s,
          }),
        }),
      }),
      e.jsx(ne, {
        position: 'top-center',
        toastOptions: {
          duration: 4e3,
          style: { background: 'var(--toast-bg)', color: 'var(--toast-color)' },
        },
      }),
    ],
  })
}
const vt = {
    search_entities: ee,
    get_dossier: st,
    query_commitments: tt,
    get_engagement_history: et,
  },
  wt = {
    search_entities: { en: 'Searching...', ar: 'جاري البحث...' },
    get_dossier: { en: 'Loading dossier...', ar: 'جاري تحميل الملف...' },
    query_commitments: { en: 'Finding commitments...', ar: 'جاري البحث عن الالتزامات...' },
    get_engagement_history: { en: 'Loading engagements...', ar: 'جاري تحميل الاجتماعات...' },
  }
function Nt({ toolName: s, input: m, result: t, isLoading: a = !1, className: p }) {
  const { i18n: u } = T('ai-chat'),
    y = u.language === 'ar',
    [r, b] = n.useState(!1),
    d = vt[s] || ee,
    c = wt[s]?.[y ? 'ar' : 'en'] || s,
    g = (f) => {
      if (!f) return ''
      if (typeof f == 'object') {
        const o = f
        if (Array.isArray(o.results)) return `Found ${o.results.length} result(s)`
        if (o.dossier && typeof o.dossier == 'object') {
          const i = o.dossier
          return `${i.name_en || i.name_ar || 'Dossier'}`
        }
        if (Array.isArray(o.commitments)) return `Found ${o.commitments.length} commitment(s)`
        if (Array.isArray(o.engagements)) return `Found ${o.engagements.length} engagement(s)`
      }
      return JSON.stringify(f).substring(0, 100)
    },
    l = ((f) => {
      if (!f || typeof f != 'object') return []
      const o = f
      return Array.isArray(o.results)
        ? o.results.map((i) => ({
            id: i.id,
            title: i.title || i.name_en || i.name_ar,
            type: i.type,
          }))
        : Array.isArray(o.commitments)
          ? o.commitments.map((i) => ({
              id: i.id,
              title: i.description_en || i.description_ar || 'Commitment',
              type: 'commitment',
            }))
          : Array.isArray(o.engagements)
            ? o.engagements.map((i) => ({
                id: i.id,
                title: i.name_en || i.name_ar || 'Engagement',
                type: 'engagement',
              }))
            : []
    })(t),
    C = l.length > 0
  return e.jsxs(V, {
    className: h('bg-muted/30 border-muted', 'transition-all duration-200', p),
    dir: y ? 'rtl' : 'ltr',
    children: [
      e.jsx(X, {
        className: 'py-2 px-3',
        children: e.jsxs('div', {
          className: 'flex items-center justify-between',
          children: [
            e.jsxs('div', {
              className: 'flex items-center gap-2',
              children: [
                a
                  ? e.jsx(Z, { className: 'h-4 w-4 animate-spin text-muted-foreground' })
                  : e.jsx(Ze, { className: 'h-4 w-4 text-green-500' }),
                e.jsx(d, { className: 'h-4 w-4 text-muted-foreground' }),
                e.jsx('span', {
                  className: 'text-xs text-muted-foreground',
                  children: a ? c : g(t),
                }),
              ],
            }),
            !a &&
              C &&
              e.jsx(A, {
                variant: 'ghost',
                size: 'sm',
                className: 'h-6 px-2',
                onClick: () => b(!r),
                children: r
                  ? e.jsx(at, { className: 'h-3 w-3' })
                  : e.jsx(nt, { className: 'h-3 w-3' }),
              }),
          ],
        }),
      }),
      r &&
        C &&
        e.jsx(be, {
          className: 'py-2 px-3 pt-0',
          children: e.jsxs('div', {
            className: 'space-y-1.5 max-h-32 overflow-y-auto',
            children: [
              l
                .slice(0, 5)
                .map((f, o) =>
                  e.jsxs(
                    'div',
                    {
                      className: 'flex items-center gap-2 text-xs',
                      children: [
                        f.type &&
                          e.jsx(Y, {
                            variant: 'outline',
                            className: 'text-[10px] px-1.5 py-0',
                            children: f.type,
                          }),
                        e.jsx('span', {
                          className: 'truncate text-muted-foreground',
                          children: f.title,
                        }),
                      ],
                    },
                    f.id || o,
                  ),
                ),
              l.length > 5 &&
                e.jsxs('span', {
                  className: 'text-xs text-muted-foreground',
                  children: ['+', l.length - 5, ' more'],
                }),
            ],
          }),
        }),
    ],
  })
}
function K({
  role: s,
  content: m,
  toolCalls: t = [],
  citations: a = [],
  isStreaming: p = !1,
  onCitationClick: u,
  className: y,
}) {
  const { i18n: r } = T('ai-chat'),
    b = r.language === 'ar',
    d = s === 'user'
  return e.jsxs('div', {
    className: h('flex gap-3 p-4', d ? 'flex-row-reverse' : 'flex-row', y),
    dir: b ? 'rtl' : 'ltr',
    children: [
      e.jsx(ht, {
        className: h('h-8 w-8 shrink-0', d ? 'bg-primary' : 'bg-muted'),
        children: e.jsx(gt, {
          className: d ? 'text-primary-foreground' : '',
          children: d ? e.jsx(it, { className: 'h-4 w-4' }) : e.jsx(rt, { className: 'h-4 w-4' }),
        }),
      }),
      e.jsxs('div', {
        className: h('flex-1 space-y-2 max-w-[80%]', d ? 'items-end' : 'items-start'),
        children: [
          !d &&
            t.length > 0 &&
            e.jsx('div', {
              className: 'space-y-2',
              children: t.map((c, g) =>
                e.jsx(Nt, { toolName: c.name, input: c.input, result: c.result }, g),
              ),
            }),
          e.jsx('div', {
            className: h(
              'rounded-2xl px-4 py-3',
              d ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md',
              b && d && 'rounded-br-2xl rounded-bl-md',
              b && !d && 'rounded-bl-2xl rounded-br-md',
            ),
            children: e.jsxs('p', {
              className: h('text-sm whitespace-pre-wrap', p && 'animate-pulse'),
              children: [
                m,
                p &&
                  e.jsx('span', {
                    className: 'inline-block w-1.5 h-4 ms-1 bg-current animate-pulse',
                  }),
              ],
            }),
          }),
          !d &&
            a.length > 0 &&
            e.jsx('div', {
              className: 'flex flex-wrap gap-1.5 mt-2',
              children: a.map((c, g) =>
                e.jsxs(
                  Y,
                  {
                    variant: 'outline',
                    className: h(
                      'text-xs cursor-pointer hover:bg-muted transition-colors',
                      'flex items-center gap-1 px-2 py-0.5',
                    ),
                    onClick: () => u?.(c.type, c.id),
                    children: [
                      e.jsx('span', { className: 'capitalize', children: c.type }),
                      e.jsx(ot, { className: 'h-3 w-3' }),
                    ],
                  },
                  g,
                ),
              ),
            }),
        ],
      }),
    ],
  })
}
function Ct({ onSend: s, disabled: m = !1, isLoading: t = !1, placeholder: a, className: p }) {
  const { t: u, i18n: y } = T('ai-chat'),
    r = y.language === 'ar',
    [b, d] = n.useState(''),
    c = n.useRef(null)
  n.useEffect(() => {
    c.current &&
      ((c.current.style.height = 'auto'),
      (c.current.style.height = `${Math.min(c.current.scrollHeight, 150)}px`))
  }, [b])
  const g = () => {
      const l = b.trim()
      l && !m && !t && (s(l), d(''), c.current && (c.current.style.height = 'auto'))
    },
    w = (l) => {
      l.key === 'Enter' && !l.shiftKey && (l.preventDefault(), g())
    }
  return e.jsxs('div', {
    className: h('flex items-end gap-2 p-3 border-t bg-background', p),
    dir: r ? 'rtl' : 'ltr',
    children: [
      e.jsx(fe, {
        ref: c,
        value: b,
        onChange: (l) => d(l.target.value),
        onKeyDown: w,
        placeholder: a || u('inputPlaceholder', 'Ask a question...'),
        disabled: m || t,
        className: h(
          'min-h-[44px] max-h-[150px] resize-none py-3',
          'rounded-2xl border-muted-foreground/20',
          'focus-visible:ring-1 focus-visible:ring-primary',
          r && 'text-right',
        ),
        rows: 1,
      }),
      e.jsx(A, {
        onClick: g,
        disabled: m || t || !b.trim(),
        size: 'icon',
        className: h(
          'h-11 w-11 shrink-0 rounded-full',
          'transition-all duration-200',
          b.trim() ? 'bg-primary' : 'bg-muted',
        ),
        children: t
          ? e.jsx(Z, { className: 'h-5 w-5 animate-spin' })
          : e.jsx(lt, { className: h('h-5 w-5', r && 'rotate-180') }),
      }),
    ],
  })
}
const kt = 'http://localhost:5001/api'
function St() {
  const [s, m] = n.useState(null),
    [t, a] = n.useState([])
  n.useEffect(() => {
    ;(async () => {
      const {
        data: { session: N },
      } = await $.auth.getSession()
      m(N?.access_token || null)
    })()
    const {
      data: { subscription: S },
    } = $.auth.onAuthStateChange((N, j) => {
      m(j?.access_token || null)
    })
    return () => S.unsubscribe()
  }, [])
  const [p, u] = n.useState(!1),
    [y, r] = n.useState(null),
    [b, d] = n.useState(''),
    [c, g] = n.useState([]),
    w = n.useRef(null),
    l = n.useRef(''),
    C = n.useCallback(
      async (i) => {
        if (p || !i.trim()) return
        ;((l.current = i), u(!0), r(null), d(''), g([]))
        const S = { role: 'user', content: i, timestamp: new Date() }
        a((j) => [...j, S])
        const N = t.map((j) => ({ role: j.role, content: j.content }))
        w.current = new AbortController()
        try {
          const j = await fetch(`${kt}/ai/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'text/event-stream',
              Authorization: `Bearer ${s}`,
            },
            body: JSON.stringify({
              message: i,
              conversation_history: N,
              language: document.documentElement.lang || 'en',
            }),
            signal: w.current.signal,
          })
          if (!j.ok) {
            const I = await j.json().catch(() => ({}))
            throw new Error(I.error || 'Chat request failed')
          }
          const x = j.body?.getReader()
          if (!x) throw new Error('No response body')
          const k = new TextDecoder()
          let L = '',
            R = ''
          const E = []
          for (;;) {
            const { done: I, value: se } = await x.read()
            if (I) break
            const ae = k.decode(se).split(`
`)
            for (const q of ae)
              if (q.startsWith('data: '))
                try {
                  const v = JSON.parse(q.slice(6))
                  if (v.type === 'init' && v.runId) R = v.runId
                  else if (v.type === 'tool_call' && v.name) {
                    const _ = { name: v.name, input: v.input || {}, result: v.result }
                    v.result
                      ? (g((M) => {
                          const U = M.findIndex((z) => z.name === v.name)
                          if (U >= 0) {
                            const z = [...M]
                            return ((z[U] = _), z)
                          }
                          return [...M, _]
                        }),
                        E.push(_))
                      : g((M) => [...M, _])
                  } else if (v.type === 'content' && v.content) ((L += v.content), d(L))
                  else {
                    if (v.type === 'done') break
                    if (v.type === 'error') throw new Error(v.error || 'Stream error')
                    v.type === 'timeout' && r('Response timed out. Please try again.')
                  }
                } catch {}
          }
          const D = { role: 'assistant', content: L, toolCalls: E, runId: R, timestamp: new Date() }
          ;(a((I) => [...I, D]), d(''), g([]))
        } catch (j) {
          j instanceof Error && j.name === 'AbortError'
            ? r('Request cancelled')
            : r(j instanceof Error ? j.message : 'Unknown error')
        } finally {
          ;(u(!1), (w.current = null))
        }
      },
      [s, t, p],
    ),
    f = n.useCallback(() => {
      ;(a([]), r(null), d(''), g([]), w.current && w.current.abort())
    }, []),
    o = n.useCallback(async () => {
      l.current &&
        (a((i) =>
          (i.length > 0 && i[i.length - 1]?.role === 'assistant') ||
          (i.length > 0 && i[i.length - 1]?.role === 'user')
            ? i.slice(0, -1)
            : i,
        ),
        await C(l.current))
    }, [C])
  return {
    messages: t,
    isLoading: p,
    error: y,
    currentStreamContent: b,
    currentToolCalls: c,
    sendMessage: C,
    clearMessages: f,
    retryLastMessage: o,
  }
}
function At({ onCitationClick: s, className: m }) {
  const { t, i18n: a } = T('ai-chat'),
    p = a.language === 'ar',
    [u, y] = n.useState(!1),
    [r, b] = n.useState(!1),
    d = n.useRef(null),
    {
      messages: c,
      isLoading: g,
      currentStreamContent: w,
      currentToolCalls: l,
      sendMessage: C,
      clearMessages: f,
    } = St()
  n.useEffect(() => {
    d.current && (d.current.scrollTop = d.current.scrollHeight)
  }, [c, w])
  const o = async (N) => {
      await C(N)
    },
    i = () => {
      ;(y(!u), u || b(!1))
    },
    S = () => {
      b(!r)
    }
  return e.jsxs('div', {
    className: h('fixed z-50', p ? 'left-4' : 'right-4', 'bottom-4', m),
    children: [
      u &&
        e.jsxs(V, {
          className: h(
            'mb-4 flex flex-col shadow-xl border',
            'transition-all duration-300 ease-in-out',
            r ? 'w-[480px] h-[600px]' : 'w-[360px] h-[480px]',
            'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)]',
          ),
          dir: p ? 'rtl' : 'ltr',
          children: [
            e.jsx(X, {
              className: 'py-3 px-4 border-b shrink-0',
              children: e.jsxs('div', {
                className: 'flex items-center justify-between',
                children: [
                  e.jsxs('div', {
                    className: 'flex items-center gap-2',
                    children: [
                      e.jsx(P, { className: 'h-5 w-5 text-primary' }),
                      e.jsx(ye, {
                        className: 'text-base font-semibold',
                        children: t('title', 'AI Assistant'),
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'flex items-center gap-1',
                    children: [
                      e.jsx(A, {
                        variant: 'ghost',
                        size: 'icon',
                        className: 'h-8 w-8',
                        onClick: f,
                        title: t('clearChat', 'Clear chat'),
                        children: e.jsx(ct, { className: 'h-4 w-4' }),
                      }),
                      e.jsx(A, {
                        variant: 'ghost',
                        size: 'icon',
                        className: 'h-8 w-8',
                        onClick: S,
                        title: r ? t('minimize', 'Minimize') : t('expand', 'Expand'),
                        children: r
                          ? e.jsx(dt, { className: 'h-4 w-4' })
                          : e.jsx(mt, { className: 'h-4 w-4' }),
                      }),
                      e.jsx(A, {
                        variant: 'ghost',
                        size: 'icon',
                        className: 'h-8 w-8',
                        onClick: i,
                        title: t('close', 'Close'),
                        children: e.jsx(Q, { className: 'h-4 w-4' }),
                      }),
                    ],
                  }),
                ],
              }),
            }),
            e.jsx(je, {
              className: 'flex-1',
              ref: d,
              children: e.jsx('div', {
                className: 'min-h-full',
                children:
                  c.length === 0 && !g
                    ? e.jsxs('div', {
                        className:
                          'flex flex-col items-center justify-center h-full py-12 px-4 text-center',
                        children: [
                          e.jsx(P, { className: 'h-12 w-12 text-muted-foreground/50 mb-4' }),
                          e.jsx('h3', {
                            className: 'text-lg font-medium text-muted-foreground mb-2',
                            children: t('welcomeTitle', 'How can I help you?'),
                          }),
                          e.jsx('p', {
                            className: 'text-sm text-muted-foreground max-w-[250px]',
                            children: t(
                              'welcomeMessage',
                              'Ask me about dossiers, commitments, engagements, or any other information in the system.',
                            ),
                          }),
                          e.jsxs('div', {
                            className: 'mt-6 space-y-2 w-full max-w-[280px]',
                            children: [
                              e.jsx(F, {
                                onClick: () => o('What are our active commitments?'),
                                isRTL: p,
                                children: t('suggestion1', 'What are our active commitments?'),
                              }),
                              e.jsx(F, {
                                onClick: () => o('Find dossiers about trade agreements'),
                                isRTL: p,
                                children: t('suggestion2', 'Find dossiers about trade agreements'),
                              }),
                              e.jsx(F, {
                                onClick: () => o('Show recent engagements'),
                                isRTL: p,
                                children: t('suggestion3', 'Show recent engagements'),
                              }),
                            ],
                          }),
                        ],
                      })
                    : e.jsxs('div', {
                        className: 'pb-4',
                        children: [
                          c.map((N, j) =>
                            e.jsx(
                              K,
                              {
                                role: N.role,
                                content: N.content,
                                toolCalls: N.toolCalls,
                                citations: N.citations,
                                onCitationClick: s,
                              },
                              j,
                            ),
                          ),
                          g &&
                            e.jsx(K, {
                              role: 'assistant',
                              content: w || '',
                              toolCalls: l,
                              isStreaming: !0,
                            }),
                        ],
                      }),
              }),
            }),
            e.jsx(Ct, {
              onSend: o,
              isLoading: g,
              placeholder: t('inputPlaceholder', 'Ask a question...'),
            }),
          ],
        }),
      e.jsx(A, {
        onClick: i,
        size: 'lg',
        className: h(
          'h-14 w-14 rounded-full shadow-lg',
          'transition-all duration-300',
          'hover:scale-105 active:scale-95',
          u && 'bg-muted text-muted-foreground hover:bg-muted',
        ),
        children: u ? e.jsx(Q, { className: 'h-6 w-6' }) : e.jsx(ut, { className: 'h-6 w-6' }),
      }),
    ],
  })
}
function F({ children: s, onClick: m, isRTL: t }) {
  return e.jsx('button', {
    onClick: m,
    className: h(
      'w-full text-start text-sm px-3 py-2 rounded-lg',
      'bg-muted/50 hover:bg-muted transition-colors',
      'text-muted-foreground hover:text-foreground',
      t && 'text-end',
    ),
    children: s,
  })
}
const Tt = n.createContext(void 0)
function Lt({ children: s }) {
  const [m, t] = n.useState(!1),
    [a, p] = n.useState(!1),
    [u, y] = n.useState(null),
    [r, b] = n.useState(null),
    d = n.useCallback(() => {
      ;(t(!0), b(new Date()))
    }, []),
    c = n.useCallback(() => {
      t(!1)
    }, []),
    g = n.useCallback(() => {
      t((o) => (o || b(new Date()), !o))
    }, []),
    w = n.useCallback((o) => {
      p(o)
    }, []),
    l = n.useCallback((o) => {
      y(o)
    }, []),
    C = n.useCallback(() => {
      b(new Date())
    }, []),
    f = {
      isOpen: m,
      isExpanded: a,
      sessionId: u,
      lastActivity: r,
      openChat: d,
      closeChat: c,
      toggleChat: g,
      setExpanded: w,
      setSessionId: l,
      updateLastActivity: C,
    }
  return e.jsx(Tt.Provider, { value: f, children: s })
}
function Wt() {
  const s = J(),
    m = (t, a) => {
      switch (t) {
        case 'dossier':
          s({ to: '/dossiers/$id', params: { id: a } })
          break
        case 'commitment':
          s({ to: '/commitments', search: { id: a } })
          break
        case 'engagement':
          s({ to: '/engagements/$engagementId', params: { engagementId: a } })
          break
        default:
          s({ to: '/search', search: { q: a, type: void 0, includeArchived: void 0 } })
      }
    }
  return e.jsxs(Lt, {
    children: [e.jsx(jt, { children: e.jsx(re, {}) }), e.jsx(At, { onCitationClick: m })],
  })
}
export { Wt as component }
//# sourceMappingURL=_protected-AU1I_LhW.js.map
