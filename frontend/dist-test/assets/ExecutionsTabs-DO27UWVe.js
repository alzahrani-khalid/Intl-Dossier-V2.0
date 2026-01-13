import { u as y, j as e, R as ne, r as v } from './react-vendor-Buoak6m3.js'
import { i as W, j as D } from './tanstack-vendor-BZC-rs5U.js'
import { T as ie, a as oe, b as le, c as re } from './tooltip-CE0dVuox.js'
import {
  c as t,
  a7 as ce,
  D as de,
  x as xe,
  y as ue,
  a8 as me,
  a9 as _,
  z as K,
  m as P,
  B as he,
  j as B,
  k as H,
  o as F,
  l as $,
  Z as R,
  _ as pe,
  $ as M,
  I as ge,
  aa as S,
} from './index-qYY0KoZ1.js'
import {
  aC as E,
  cf as G,
  aV as Q,
  aR as V,
  bf as q,
  cg as be,
  b2 as fe,
  b1 as ve,
  bg as L,
  aN as je,
  aT as A,
  cc as we,
  aJ as ye,
  aI as O,
  cd as Ne,
  b0 as ke,
  ch as Ce,
  ci as Te,
  cj as Ke,
  aH as Me,
  ck as Se,
  bT as Ae,
  cl as Ee,
  aW as Le,
  aA as De,
  bH as z,
  cm as Ie,
  cn as _e,
  bm as Pe,
  co as Re,
  bO as Oe,
  bP as ze,
  ba as Ue,
  cp as We,
  bB as Be,
  be as He,
  b5 as Fe,
  aD as $e,
  a$ as Ge,
  cq as U,
  cr as Qe,
  cs as Ve,
  aE as qe,
} from './vendor-misc-BiJvMP0A.js'
import { A as Je, b as Xe, a as Ze } from './avatar-lQOCSoMx.js'
function k({ icon: l, id: c, tooltip: a, active: x = !1, onClick: d, className: s, badge: n }) {
  const { i18n: r } = y(),
    g = r.language === 'ar'
  return e.jsx(ie, {
    delayDuration: 200,
    children: e.jsxs(oe, {
      children: [
        e.jsx(le, {
          asChild: !0,
          children: e.jsxs('button', {
            id: c,
            onClick: d,
            'aria-label': a,
            'aria-current': x ? 'page' : void 0,
            className: t(
              'icon-button',
              'relative flex items-center justify-center',
              'rounded-lg',
              x && 'active',
              'focus-visible:outline-none',
              'focus-visible:ring-2',
              'focus-visible:ring-[var(--icon-rail-active-indicator)]',
              'focus-visible:ring-offset-2',
              'focus-visible:ring-offset-[var(--icon-rail-bg)]',
              s,
            ),
            children: [
              e.jsx(l, { className: 'h-6 w-6 shrink-0', strokeWidth: 2 }),
              n !== void 0 &&
                n > 0 &&
                e.jsx('span', {
                  className: t(
                    'absolute -top-1 flex items-center justify-center',
                    'h-4 min-w-4 px-1',
                    'bg-[var(--icon-rail-active-indicator)] text-white',
                    'text-[10px] font-semibold leading-none',
                    'rounded-full',
                    g ? '-start-1' : '-end-1',
                  ),
                  'aria-label': `${n} notifications`,
                  children: n > 99 ? '99+' : n,
                }),
            ],
          }),
        }),
        e.jsx(re, {
          side: g ? 'left' : 'right',
          sideOffset: 8,
          className: 'bg-gray-900 text-white border-gray-800',
          children: e.jsx('p', { className: 'text-sm font-medium', children: a }),
        }),
      ],
    }),
  })
}
k.displayName = 'IconButton'
function J({ items: l, className: c, onItemClick: a, activeCategory: x, onCategoryChange: d }) {
  const { t: s, i18n: n } = y(),
    r = W(),
    g = D(),
    p = n.language === 'ar',
    { colorMode: m, setColorMode: h } = ce(),
    u = l || [
      { id: 'dashboard', icon: E, tooltipKey: 'navigation.dashboard', path: '/dashboard' },
      { id: 'dossiers', icon: G, tooltipKey: 'navigation.dossiers', path: '/dossiers' },
      { id: 'workflow', icon: Q, tooltipKey: 'navigation.workflow', path: '/tasks' },
      { id: 'calendar', icon: V, tooltipKey: 'navigation.calendar', path: '/calendar' },
      { id: 'reports', icon: q, tooltipKey: 'navigation.reports', path: '/reports' },
    ],
    i = (o) => {
      ;(d && d(o.id), a ? a(o) : r({ to: o.path }))
    },
    j = (o) => g.pathname === o || g.pathname.startsWith(`${o}/`),
    N = () => {
      const o = n.language === 'ar' ? 'en' : 'ar'
      n.changeLanguage(o)
    }
  return e.jsxs('aside', {
    className: t('icon-rail', 'flex flex-col', 'hidden md:flex', c),
    dir: p ? 'rtl' : 'ltr',
    'aria-label': s('navigation.mainNav', 'Main navigation'),
    children: [
      e.jsxs('nav', {
        className: t(
          'flex flex-col items-center overflow-y-auto',
          'bg-gradient-to-b from-[hsl(220,15%,2%)] via-[hsl(220,15%,4%)] to-[hsl(220,15%,6%)]',
          'mx-1 mt-1',
          'rounded-t-xl rounded-b-xl',
          'shadow-[0_3px_12px_rgba(0,0,0,0.35),0_1px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]',
        ),
        'aria-label': s('navigation.primary', 'Primary navigation'),
        children: [
          e.jsx('div', {
            className: 'w-full px-3 pt-4 pb-3 flex items-center justify-center',
            children: e.jsx('img', {
              src: '/GASTAT_LOGO.svg',
              alt: 'GASTAT Logo',
              className: 'w-10 h-10 object-contain',
            }),
          }),
          e.jsx('div', {
            className: 'w-full px-3 pb-3',
            children: e.jsx('div', {
              className: 'h-px relative',
              style: {
                background:
                  'linear-gradient(to right, transparent, rgba(0,0,0,0.4) 50%, transparent)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.1)',
              },
            }),
          }),
          e.jsx('div', {
            className: 'flex flex-col items-center gap-4 p-3 w-full',
            children: u.map((o) =>
              e.jsx(
                k,
                {
                  id: `nav-${o.id}`,
                  icon: o.icon,
                  tooltip: s(o.tooltipKey, o.id.charAt(0).toUpperCase() + o.id.slice(1)),
                  active: j(o.path),
                  onClick: () => i(o),
                  badge: o.badge,
                },
                o.id,
              ),
            ),
          }),
        ],
      }),
      e.jsx('div', {
        className: t(
          'icon-rail-text-section',
          'flex flex-col items-center justify-center flex-1 px-4',
          'overflow-hidden',
        ),
        children: e.jsx('p', {
          className: 'text-engraved text-center',
          style: { letterSpacing: '0.15em', transform: 'rotate(-90deg)', whiteSpace: 'nowrap' },
          children: 'Dossier 2025',
        }),
      }),
      e.jsx('div', { className: t('icon-rail-spacer', 'flex-1 hidden') }),
      e.jsxs('div', {
        className: t(
          'flex flex-col items-center gap-3 py-3 px-2',
          'bg-gradient-to-b from-[hsl(220,15%,2%)] via-[hsl(220,15%,4%)] to-[hsl(220,15%,6%)]',
          'mx-1 mb-1',
          'rounded-t-xl rounded-b-xl',
          'shadow-[0_3px_12px_rgba(0,0,0,0.35),0_1px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]',
        ),
        children: [
          e.jsx(k, {
            id: 'nav-language-toggle',
            icon: be,
            tooltip:
              n.language === 'ar'
                ? s('navigation.switchToEnglish', 'Switch to English')
                : s('navigation.switchToArabic', 'Switch to Arabic'),
            active: !1,
            onClick: N,
          }),
          e.jsx(k, {
            id: 'nav-theme-toggle',
            icon: m === 'dark' ? fe : ve,
            tooltip:
              m === 'dark'
                ? s('navigation.lightMode', 'Light Mode')
                : s('navigation.darkMode', 'Dark Mode'),
            active: !1,
            onClick: () => h(m === 'dark' ? 'light' : 'dark'),
          }),
          e.jsx(k, {
            id: 'nav-settings',
            icon: L,
            tooltip: s('navigation.settings', 'Settings'),
            active: x === 'system',
            onClick: () => {
              ;(d && d('system'), r({ to: '/settings' }))
            },
          }),
        ],
      }),
    ],
  })
}
J.displayName = 'IconRail'
function X({
  name: l = 'John Doe',
  email: c = 'customerpop@gmail.com',
  avatarUrl: a,
  className: x,
  onLogout: d,
  onSettings: s,
  onProfile: n,
}) {
  const { t: r, i18n: g } = y(),
    p = g.language === 'ar',
    m = (h) =>
      h
        .split(' ')
        .map((f) => f[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
  return e.jsxs(de, {
    children: [
      e.jsx(xe, {
        asChild: !0,
        children: e.jsxs('button', {
          className: t(
            'flex w-full items-center gap-3 px-4 py-3',
            'border-b border-panel-border',
            'bg-panel hover:bg-panel-hover',
            'transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-icon-rail-active-indicator',
            x,
          ),
          'aria-label': r('navigation.userMenu', 'User menu'),
          children: [
            e.jsxs(Je, {
              className: 'h-8 w-8 shrink-0',
              children: [
                e.jsx(Xe, { src: a, alt: l }),
                e.jsx(Ze, {
                  className: 'bg-icon-rail-active-indicator text-white text-xs font-semibold',
                  children: a ? null : m(l),
                }),
              ],
            }),
            e.jsxs('div', {
              className: 'flex-1 min-w-0 text-start',
              children: [
                e.jsx('p', {
                  className: 'text-sm font-semibold text-panel-text truncate',
                  children: l,
                }),
                e.jsx('p', { className: 'text-xs text-panel-text-muted truncate', children: c }),
              ],
            }),
            e.jsx(je, {
              className: t(
                'h-4 w-4 shrink-0 text-panel-text-muted transition-transform',
                p && 'rotate-180',
              ),
              'aria-hidden': 'true',
            }),
          ],
        }),
      }),
      e.jsxs(ue, {
        align: p ? 'end' : 'start',
        sideOffset: 4,
        className: 'w-56',
        children: [
          e.jsx(me, {
            className: 'font-normal',
            children: e.jsxs('div', {
              className: 'flex flex-col space-y-1',
              children: [
                e.jsx('p', { className: 'text-sm font-medium leading-none', children: l }),
                e.jsx('p', {
                  className: 'text-xs leading-none text-muted-foreground',
                  children: c,
                }),
              ],
            }),
          }),
          e.jsx(_, {}),
          n &&
            e.jsxs(K, {
              onClick: n,
              children: [
                e.jsx(A, { className: 'me-2 h-4 w-4' }),
                e.jsx('span', { children: r('navigation.profile', 'Profile') }),
              ],
            }),
          s &&
            e.jsxs(K, {
              onClick: s,
              children: [
                e.jsx(A, { className: 'me-2 h-4 w-4' }),
                e.jsx('span', { children: r('navigation.settings', 'Settings') }),
              ],
            }),
          e.jsx(_, {}),
          d &&
            e.jsxs(K, {
              onClick: d,
              className: 'text-destructive focus:text-destructive',
              children: [
                e.jsx(A, { className: 'me-2 h-4 w-4' }),
                e.jsx('span', { children: r('navigation.logout', 'Logout') }),
              ],
            }),
        ],
      }),
    ],
  })
}
X.displayName = 'UserProfile'
function Z({
  title: l,
  titleKey: c,
  items: a,
  activeId: x,
  onItemClick: d,
  className: s,
  hideHeader: n = !1,
}) {
  const { t: r, i18n: g } = y(),
    p = W(),
    m = D(),
    h = (i) => {
      d ? d(i) : p({ to: i.path })
    },
    f = (i) => m.pathname === i,
    u = c ? r(c, l) : l
  return e.jsxs('div', {
    className: t('flex flex-col', s),
    children: [
      !n && u && e.jsx('h3', { className: 'section-header px-4 py-2', children: u }),
      e.jsx('nav', {
        className: 'flex flex-col px-2',
        role: 'navigation',
        'aria-label': u,
        children: a.map((i) => {
          const j = f(i.path)
          return e.jsxs(
            'button',
            {
              onClick: () => h(i),
              className: t(
                'panel-item',
                'flex w-full items-center gap-3 py-2 px-4',
                'rounded-lg',
                'text-sm font-medium text-start',
                'text-panel-text',
                'hover:bg-panel-hover',
                j && ['bg-white/80', 'active'],
                'transition-colors duration-150',
                'focus-visible:outline-none',
                'focus-visible:ring-2',
                'focus-visible:ring-inset',
                'focus-visible:ring-icon-rail-active-indicator',
              ),
              'aria-current': j ? 'page' : void 0,
              children: [
                e.jsx('span', {
                  className: 'shrink-0',
                  'aria-hidden': 'true',
                  children: ne.createElement(i.icon, { className: 'h-4 w-4' }),
                }),
                e.jsx('span', { className: 'flex-1 truncate', children: r(i.labelKey, i.label) }),
                i.count !== void 0 &&
                  e.jsx(P, {
                    variant: 'secondary',
                    className: t(
                      'h-5 min-w-5 px-2',
                      'bg-badge text-badge-text',
                      'text-xs font-medium',
                      'rounded-full',
                      'flex items-center justify-center',
                    ),
                    children: i.count,
                  }),
                i.badge &&
                  e.jsx(P, {
                    variant: 'secondary',
                    className: t(
                      'h-5 px-2',
                      'bg-badge text-badge-text',
                      'text-xs font-medium',
                      'rounded-full',
                    ),
                    children: i.badge,
                  }),
              ],
            },
            i.id,
          )
        }),
      }),
    ],
  })
}
Z.displayName = 'NavigationSection'
const Y = [
  {
    id: 'dashboard',
    icon: E,
    tooltipKey: 'navigation.dashboard',
    path: '/dashboard',
    items: [
      {
        id: 'dashboard-overview',
        label: 'Dashboard Overview',
        labelKey: 'navigation.dashboardOverview',
        icon: E,
        path: '/dashboard',
      },
    ],
  },
  {
    id: 'dossiers',
    icon: G,
    tooltipKey: 'navigation.dossiers',
    path: '/dossiers',
    items: [
      {
        id: 'countries',
        label: 'Countries',
        labelKey: 'navigation.countries',
        icon: we,
        path: '/countries',
      },
      {
        id: 'organizations',
        label: 'Organizations',
        labelKey: 'navigation.organizations',
        icon: ye,
        path: '/organizations',
      },
      { id: 'forums', label: 'Forums', labelKey: 'navigation.forums', icon: O, path: '/forums' },
      {
        id: 'persons',
        label: 'Persons',
        labelKey: 'navigation.persons',
        icon: Ne,
        path: '/persons',
      },
      { id: 'themes', label: 'Themes', labelKey: 'navigation.themes', icon: ke, path: '/themes' },
      {
        id: 'engagements',
        label: 'Engagements',
        labelKey: 'navigation.engagements',
        icon: Ce,
        path: '/engagements',
      },
      {
        id: 'working-groups',
        label: 'Working Groups',
        labelKey: 'navigation.workingGroups',
        icon: Te,
        path: '/working-groups',
      },
      {
        id: 'positions',
        label: 'Positions',
        labelKey: 'navigation.positions',
        icon: Ke,
        path: '/positions',
      },
      { id: 'mous', label: 'MoUs', labelKey: 'navigation.mous', icon: Me, path: '/mous' },
      { id: 'briefs', label: 'Briefs', labelKey: 'navigation.briefs', icon: Se, path: '/briefs' },
    ],
  },
  {
    id: 'workflow',
    icon: Q,
    tooltipKey: 'navigation.workflow',
    path: '/tasks',
    items: [
      { id: 'tasks', label: 'Tasks', labelKey: 'navigation.tasks', icon: Ae, path: '/tasks' },
      {
        id: 'task-queue',
        label: 'Task Queue',
        labelKey: 'navigation.taskQueue',
        icon: Ee,
        path: '/tasks/queue',
      },
      { id: 'intake', label: 'Intake', labelKey: 'navigation.intake', icon: Le, path: '/intake' },
      {
        id: 'task-escalations',
        label: 'Task Escalations',
        labelKey: 'navigation.taskEscalations',
        icon: De,
        path: '/tasks/escalations',
      },
    ],
  },
  {
    id: 'calendar',
    icon: V,
    tooltipKey: 'navigation.calendar',
    path: '/calendar',
    items: [
      {
        id: 'calendar-overview',
        label: 'Calendar',
        labelKey: 'navigation.calendar',
        icon: z,
        path: '/calendar',
      },
      { id: 'events', label: 'Events', labelKey: 'navigation.events', icon: z, path: '/events' },
      {
        id: 'new-event',
        label: 'New Event',
        labelKey: 'navigation.newEvent',
        icon: Ie,
        path: '/calendar/new',
      },
    ],
  },
  {
    id: 'reports',
    icon: q,
    tooltipKey: 'navigation.reports',
    path: '/reports',
    items: [
      {
        id: 'reports',
        label: 'Reports',
        labelKey: 'navigation.reports',
        icon: _e,
        path: '/reports',
      },
      {
        id: 'analytics',
        label: 'Analytics',
        labelKey: 'navigation.analytics',
        icon: Pe,
        path: '/analytics',
      },
      {
        id: 'intelligence',
        label: 'Intelligence Signals',
        labelKey: 'navigation.intelligence',
        icon: Re,
        path: '/intelligence',
      },
      {
        id: 'monitoring',
        label: 'Monitoring',
        labelKey: 'navigation.monitoring',
        icon: Oe,
        path: '/monitoring',
      },
      { id: 'export', label: 'Export', labelKey: 'navigation.export', icon: ze, path: '/export' },
      {
        id: 'data-library',
        label: 'Data Library',
        labelKey: 'navigation.dataLibrary',
        icon: Ue,
        path: '/data-library',
      },
      {
        id: 'word-assistant',
        label: 'Word Assistant',
        labelKey: 'navigation.wordAssistant',
        icon: We,
        path: '/word-assistant',
      },
    ],
  },
  {
    id: 'system',
    icon: L,
    tooltipKey: 'navigation.system',
    path: '/settings',
    items: [
      { id: 'users', label: 'Users', labelKey: 'navigation.users', icon: O, path: '/users' },
      {
        id: 'settings',
        label: 'Settings',
        labelKey: 'navigation.settings',
        icon: L,
        path: '/settings',
      },
      { id: 'help', label: 'Help', labelKey: 'navigation.help', icon: Be, path: '/help' },
      {
        id: 'admin',
        label: 'Admin',
        labelKey: 'navigation.admin',
        icon: He,
        path: '/admin',
        adminOnly: !0,
      },
      {
        id: 'accessibility',
        label: 'Accessibility',
        labelKey: 'navigation.accessibility',
        icon: Fe,
        path: '/accessibility',
      },
    ],
  },
]
function Ye(l) {
  return Y.find((c) => c.id === l)
}
function ee({
  isOpen: l = !0,
  onClose: c,
  userName: a,
  userEmail: x,
  userAvatar: d,
  onLogout: s,
  className: n,
  activeCategory: r = 'dashboard',
}) {
  const { i18n: g } = y(),
    p = g.language === 'ar',
    m = Ye(r),
    h = m?.items || []
  return e.jsxs('aside', {
    className: t(
      'expanded-panel',
      'flex flex-col',
      'bg-sidebar',
      !l && (p ? 'translate-x-full' : '-translate-x-full'),
      'hidden lg:flex',
      n,
    ),
    style: { backgroundColor: 'var(--sidebar)' },
    dir: p ? 'rtl' : 'ltr',
    'aria-label': 'Expanded navigation panel',
    'aria-hidden': !l,
    children: [
      e.jsx(X, { name: a, email: x, avatarUrl: d, onLogout: s }),
      e.jsx('div', {
        className: 'flex-1 overflow-y-auto overflow-x-visible',
        children: e.jsx('div', {
          className: 'flex flex-col gap-6 py-4',
          children: h.length > 0 && e.jsx(Z, { titleKey: m?.tooltipKey, items: h }),
        }),
      }),
    ],
  })
}
ee.displayName = 'ExpandedPanel'
function ea({
  iconRailItems: l,
  userName: c,
  userEmail: a,
  userAvatar: x,
  onLogout: d,
  children: s,
  className: n,
  defaultPanelOpen: r = !0,
}) {
  const { i18n: g } = y(),
    p = g.language === 'ar',
    m = D(),
    [h, f] = v.useState(() => (typeof window < 'u' && window.innerWidth >= 768 ? r : !1)),
    [u, i] = v.useState(!1),
    [j, N] = v.useState('dashboard')
  ;(v.useEffect(() => {
    const b = () => {
      window.innerWidth < 768 && (f(!1), i(!1))
    }
    return (window.addEventListener('resize', b), () => window.removeEventListener('resize', b))
  }, []),
    v.useEffect(() => {
      const b = m.pathname
      for (const w of Y) {
        if (b === w.path || b.startsWith(`${w.path}/`)) {
          N(w.id)
          return
        }
        for (const T of w.items)
          if (b === T.path || b.startsWith(`${T.path}/`)) {
            N(w.id)
            return
          }
      }
    }, [m.pathname]))
  const o = () => i((b) => !b),
    C = (b) => {
      ;(N(b), f(!0))
    }
  return e.jsxs('div', {
    className: t('flex h-screen w-full overflow-hidden', n),
    dir: p ? 'rtl' : 'ltr',
    children: [
      e.jsx('div', {
        className: 'fixed top-0 start-0 z-50 p-4 md:hidden',
        children: e.jsx(he, {
          variant: 'ghost',
          size: 'icon',
          onClick: o,
          className: t(
            'h-11 w-11 rounded-lg',
            'bg-background border border-content-border',
            'hover:bg-panel-hover',
            'focus-visible:ring-2 focus-visible:ring-icon-rail-active-indicator',
          ),
          'aria-label': u ? 'Close menu' : 'Open menu',
          children: u ? e.jsx($e, { className: 'h-5 w-5' }) : e.jsx(Ge, { className: 'h-5 w-5' }),
        }),
      }),
      u &&
        e.jsx('div', {
          className: 'fixed inset-0 z-40 bg-black/50 md:hidden',
          onClick: o,
          'aria-hidden': 'true',
        }),
      e.jsx(J, { items: l, activeCategory: j, onCategoryChange: C, className: 'hidden md:flex' }),
      e.jsx('div', {
        className: t(
          'fixed inset-y-0 start-0 z-40 w-full md:w-auto md:static md:z-auto',
          'bg-sidebar',
          'transition-transform duration-250 ease-in-out',
          'md:flex',
          !u && '-translate-x-full md:translate-x-0',
          u && 'translate-x-0',
          !h && 'md:-translate-x-full',
          h && 'md:translate-x-0',
          p && [
            !u && 'translate-x-full md:-translate-x-0',
            u && '-translate-x-0',
            !h && 'md:translate-x-full',
            h && 'md:-translate-x-0',
          ],
        ),
        children: e.jsx(ee, {
          isOpen: !0,
          onClose: () => {
            ;(i(!1), f(!1))
          },
          userName: c,
          userEmail: a,
          userAvatar: x,
          onLogout: d,
          activeCategory: j,
          className: 'flex md:hidden lg:flex w-full md:w-auto',
        }),
      }),
      e.jsx('main', {
        className: t(
          'flex-1 overflow-auto',
          'bg-background',
          'px-4 sm:px-6 lg:px-8',
          'pt-20 md:pt-6 lg:pt-8',
          'pb-6 lg:pb-8',
          'my-2 me-2 h-[calc(100vh-16px)]',
          'rounded-e-[12px]',
        ),
        style: {
          backgroundColor: '#f7f9fa',
          backgroundImage:
            'linear-gradient(rgba(247, 249, 250, 0.85), rgba(247, 249, 250, 0.85)), url(/white-texture.jpg)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        },
        children: s,
      }),
    ],
  })
}
ea.displayName = 'NavigationShell'
function aa({
  label: l,
  value: c,
  trend: a,
  linkText: x,
  linkHref: d,
  animationDuration: s = 1500,
  className: n,
  onLinkClick: r,
}) {
  const { t: g, i18n: p } = y(),
    m = p.language === 'ar',
    [h, f] = v.useState(0),
    [u, i] = v.useState(!1)
  v.useEffect(() => {
    if (u) return
    const o = Date.now(),
      C = c,
      b = s,
      w = () => {
        const ae = Date.now() - o,
          I = Math.min(ae / b, 1),
          te = 1 - Math.pow(1 - I, 3),
          se = Math.floor(te * C)
        ;(f(se), I < 1 ? requestAnimationFrame(w) : i(!0))
      }
    w()
  }, [c, s, u])
  const j = () => {
      switch (a?.direction) {
        case 'up':
          return e.jsx(Ve, { className: 'h-4 w-4' })
        case 'down':
          return e.jsx(Qe, { className: 'h-4 w-4' })
        case 'neutral':
          return e.jsx(U, { className: 'h-4 w-4' })
        default:
          return null
      }
    },
    N = () => {
      switch (a?.direction) {
        case 'up':
          return 'text-success-indicator'
        case 'down':
          return 'text-warning-indicator'
        case 'neutral':
          return 'text-panel-text-muted'
        default:
          return ''
      }
    }
  return e.jsxs(B, {
    className: t('metric-card glass-highlight overflow-hidden', n),
    children: [
      e.jsx(H, {
        className: 'pb-3',
        children: e.jsx(F, { className: 'text-base font-semibold text-content-text', children: l }),
      }),
      e.jsxs($, {
        className: 'space-y-4',
        children: [
          e.jsxs('div', {
            className: 'flex items-baseline gap-3',
            children: [
              e.jsx('span', { className: 'metric-value', children: h.toLocaleString() }),
              a &&
                e.jsxs('div', {
                  className: t('flex items-center gap-1', 'text-sm font-semibold', N()),
                  children: [
                    j(),
                    e.jsxs('span', {
                      className: 'tabular-nums',
                      children: [a.direction === 'up' && '+', a.value, '%'],
                    }),
                  ],
                }),
            ],
          }),
          x &&
            e.jsxs('button', {
              onClick: r,
              className: t(
                'inline-flex items-center gap-2',
                'text-sm font-medium',
                'text-panel-active-text hover:text-icon-rail-active-indicator',
                'transition-colors duration-150',
                'focus-visible:outline-none',
                'focus-visible:ring-2',
                'focus-visible:ring-icon-rail-active-indicator',
                'focus-visible:ring-offset-2',
                'rounded-sm',
              ),
              children: [x, e.jsx(U, { className: t('h-4 w-4', m && 'rotate-180') })],
            }),
        ],
      }),
    ],
  })
}
aa.displayName = 'MetricCard'
function ta({ title: l, className: c }) {
  const { t: a } = y(),
    [x, d] = v.useState(''),
    [s, n] = v.useState('workflows')
  return e.jsxs(B, {
    className: t('overflow-hidden', c),
    children: [
      e.jsxs(H, {
        className: 'border-b border-content-border pb-0',
        children: [
          e.jsx(F, {
            className: 'text-base font-semibold text-content-text mb-4',
            children: l || a('navigation.executions', 'Executions'),
          }),
          e.jsx(R, {
            value: s,
            onValueChange: n,
            className: 'w-full',
            children: e.jsxs(pe, {
              className: 'grid w-full grid-cols-3 h-auto p-0 bg-transparent border-b-0',
              children: [
                e.jsx(M, {
                  value: 'workflows',
                  className: t(
                    'relative rounded-none border-b-2 border-transparent',
                    'data-[state=active]:border-icon-rail-active-indicator',
                    'data-[state=active]:bg-transparent',
                    'data-[state=active]:text-content-text',
                    'data-[state=active]:shadow-none',
                    'hover:text-content-text',
                    'transition-all duration-200',
                    'pb-3 text-sm font-medium',
                  ),
                  children: a('navigation.workflows', 'Workflows'),
                }),
                e.jsx(M, {
                  value: 'permissions',
                  className: t(
                    'relative rounded-none border-b-2 border-transparent',
                    'data-[state=active]:border-icon-rail-active-indicator',
                    'data-[state=active]:bg-transparent',
                    'data-[state=active]:text-content-text',
                    'data-[state=active]:shadow-none',
                    'hover:text-content-text',
                    'transition-all duration-200',
                    'pb-3 text-sm font-medium',
                  ),
                  children: a('navigation.permissions', 'Permissions'),
                }),
                e.jsx(M, {
                  value: 'members',
                  className: t(
                    'relative rounded-none border-b-2 border-transparent',
                    'data-[state=active]:border-icon-rail-active-indicator',
                    'data-[state=active]:bg-transparent',
                    'data-[state=active]:text-content-text',
                    'data-[state=active]:shadow-none',
                    'hover:text-content-text',
                    'transition-all duration-200',
                    'pb-3 text-sm font-medium',
                  ),
                  children: a('navigation.members', 'Members'),
                }),
              ],
            }),
          }),
        ],
      }),
      e.jsxs($, {
        className: 'p-6',
        children: [
          e.jsxs('div', {
            className: 'relative mb-4',
            children: [
              e.jsx(qe, {
                className:
                  'absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-text-muted',
              }),
              e.jsx(ge, {
                type: 'search',
                placeholder: a('common.search', 'Search'),
                value: x,
                onChange: (r) => d(r.target.value),
                className: t(
                  'h-10 w-full ps-10 pe-4',
                  'bg-background border-content-border',
                  'text-sm placeholder:text-content-text-muted',
                  'focus-visible:ring-icon-rail-active-indicator',
                ),
              }),
            ],
          }),
          e.jsxs(R, {
            value: s,
            children: [
              e.jsx(S, {
                value: 'workflows',
                className: 'mt-0',
                children: e.jsxs('div', {
                  className: 'flex flex-col items-center justify-center py-8 text-center',
                  children: [
                    e.jsx('p', {
                      className: 'text-sm text-content-text-muted',
                      children: a('executions.noWorkflows', 'No workflows found'),
                    }),
                    e.jsx('p', {
                      className: 'text-xs text-content-text-muted mt-1',
                      children: a('executions.tryDifferentSearch', 'Try a different search term'),
                    }),
                  ],
                }),
              }),
              e.jsx(S, {
                value: 'permissions',
                className: 'mt-0',
                children: e.jsxs('div', {
                  className: 'flex flex-col items-center justify-center py-8 text-center',
                  children: [
                    e.jsx('p', {
                      className: 'text-sm text-content-text-muted',
                      children: a('executions.noPermissions', 'No permissions found'),
                    }),
                    e.jsx('p', {
                      className: 'text-xs text-content-text-muted mt-1',
                      children: a('executions.tryDifferentSearch', 'Try a different search term'),
                    }),
                  ],
                }),
              }),
              e.jsx(S, {
                value: 'members',
                className: 'mt-0',
                children: e.jsxs('div', {
                  className: 'flex flex-col items-center justify-center py-8 text-center',
                  children: [
                    e.jsx('p', {
                      className: 'text-sm text-content-text-muted',
                      children: a('executions.noMembers', 'No members found'),
                    }),
                    e.jsx('p', {
                      className: 'text-xs text-content-text-muted mt-1',
                      children: a('executions.tryDifferentSearch', 'Try a different search term'),
                    }),
                  ],
                }),
              }),
            ],
          }),
        ],
      }),
    ],
  })
}
ta.displayName = 'ExecutionsTabs'
export { ta as E, aa as M, ea as N }
//# sourceMappingURL=ExecutionsTabs-DO27UWVe.js.map
