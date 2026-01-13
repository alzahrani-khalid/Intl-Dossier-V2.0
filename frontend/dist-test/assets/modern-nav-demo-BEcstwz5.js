import { u as a, j as e } from './react-vendor-Buoak6m3.js'
import { N as l, M as t, E as n } from './ExecutionsTabs-DO27UWVe.js'
import './index-qYY0KoZ1.js'
import './vendor-misc-BiJvMP0A.js'
import './visualization-vendor-f5uYUx4I.js'
import './date-vendor-s0MkYge4.js'
import './tanstack-vendor-BZC-rs5U.js'
import './tooltip-CE0dVuox.js'
import './ui-vendor-DTR9u_Vg.js'
import './avatar-lQOCSoMx.js'
import './i18n-vendor-Coo-X0AG.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
function N() {
  const { t: s } = a(),
    i = () => {}
  return e.jsx(l, {
    userName: 'John Doe',
    userEmail: 'customerpop@gmail.com',
    onLogout: i,
    defaultPanelOpen: !0,
    children: e.jsxs('div', {
      className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12',
      children: [
        e.jsxs('header', {
          className: 'mb-6 sm:mb-8 lg:mb-12',
          children: [
            e.jsx('h1', {
              className: 'text-2xl sm:text-3xl md:text-4xl font-bold text-content-text mb-2',
              children: s('navigation.dashboard', 'Dashboard'),
            }),
            e.jsx('p', {
              className: 'text-sm sm:text-base text-content-text-muted',
              children: s('demo.subtitle', 'Modern navigation design system demonstration'),
            }),
          ],
        }),
        e.jsxs('div', {
          className: 'grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8',
          children: [
            e.jsx('div', {
              className: 'lg:col-span-2',
              children: e.jsx(t, {
                label: s('metrics.executions', 'Executions'),
                value: 340,
                trend: { value: 23, direction: 'up' },
                linkText: s('common.seeReport', 'See Report'),
                onLinkClick: () => {},
              }),
            }),
            e.jsx(t, {
              label: s('metrics.activeProjects', 'Active Projects'),
              value: 12,
              trend: { value: 8, direction: 'up' },
              linkText: s('common.viewAll', 'View All'),
              onLinkClick: () => {},
            }),
            e.jsx(t, {
              label: s('metrics.teamMembers', 'Team Members'),
              value: 24,
              trend: { value: 2, direction: 'neutral' },
              linkText: s('common.manage', 'Manage'),
              onLinkClick: () => {},
            }),
            e.jsx('div', {
              className: 'lg:col-span-2',
              children: e.jsx(n, { title: s('navigation.executions', 'Executions') }),
            }),
          ],
        }),
        e.jsxs('div', {
          className: 'mt-12 p-6 bg-panel rounded-lg border border-panel-border',
          children: [
            e.jsx('h2', {
              className: 'text-lg font-semibold text-content-text mb-4',
              children: s('demo.features', 'Features Demonstrated'),
            }),
            e.jsxs('ul', {
              className: 'space-y-2 text-sm text-content-text-muted',
              children: [
                e.jsxs('li', {
                  className: 'flex items-start gap-2',
                  children: [
                    e.jsx('span', { className: 'text-icon-rail-active-indicator', children: '✓' }),
                    e.jsx('span', {
                      children:
                        'Material Design 3 Navigation Rail (56px) with hover states and active indicators',
                    }),
                  ],
                }),
                e.jsxs('li', {
                  className: 'flex items-start gap-2',
                  children: [
                    e.jsx('span', { className: 'text-icon-rail-active-indicator', children: '✓' }),
                    e.jsx('span', {
                      children:
                        'Expanded Panel (280px) with user profile, projects, status, history, and documents',
                    }),
                  ],
                }),
                e.jsxs('li', {
                  className: 'flex items-start gap-2',
                  children: [
                    e.jsx('span', { className: 'text-icon-rail-active-indicator', children: '✓' }),
                    e.jsx('span', {
                      children:
                        'Animated metric cards with trend indicators and smooth counter animations',
                    }),
                  ],
                }),
                e.jsxs('li', {
                  className: 'flex items-start gap-2',
                  children: [
                    e.jsx('span', { className: 'text-icon-rail-active-indicator', children: '✓' }),
                    e.jsx('span', {
                      children:
                        'Tabbed interface with search functionality (Workflows, Permissions, Members)',
                    }),
                  ],
                }),
                e.jsxs('li', {
                  className: 'flex items-start gap-2',
                  children: [
                    e.jsx('span', { className: 'text-icon-rail-active-indicator', children: '✓' }),
                    e.jsx('span', {
                      children: 'Collapsible document tree with nested folders and search',
                    }),
                  ],
                }),
                e.jsxs('li', {
                  className: 'flex items-start gap-2',
                  children: [
                    e.jsx('span', { className: 'text-icon-rail-active-indicator', children: '✓' }),
                    e.jsx('span', {
                      children:
                        'Responsive design: Mobile hamburger menu → Tablet icon rail → Desktop full layout',
                    }),
                  ],
                }),
                e.jsxs('li', {
                  className: 'flex items-start gap-2',
                  children: [
                    e.jsx('span', { className: 'text-icon-rail-active-indicator', children: '✓' }),
                    e.jsx('span', {
                      children: 'Full RTL support for Arabic language with logical properties',
                    }),
                  ],
                }),
                e.jsxs('li', {
                  className: 'flex items-start gap-2',
                  children: [
                    e.jsx('span', { className: 'text-icon-rail-active-indicator', children: '✓' }),
                    e.jsx('span', {
                      children: 'Dark/Light mode support with CSS custom properties design tokens',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        e.jsxs('div', {
          className: 'mt-6 p-6 bg-background rounded-lg border border-content-border',
          children: [
            e.jsx('h2', {
              className: 'text-lg font-semibold text-content-text mb-4',
              children: s('demo.testing', 'Testing Guide'),
            }),
            e.jsxs('div', {
              className: 'space-y-4 text-sm text-content-text-muted',
              children: [
                e.jsxs('div', {
                  children: [
                    e.jsx('h3', {
                      className: 'font-medium text-content-text mb-2',
                      children: 'Responsive Testing:',
                    }),
                    e.jsxs('ul', {
                      className: 'list-disc list-inside space-y-1 ms-4',
                      children: [
                        e.jsx('li', {
                          children: 'Mobile (<768px): Hamburger menu, full-screen overlay',
                        }),
                        e.jsx('li', {
                          children: 'Tablet (768-1024px): Icon rail visible, panel collapsed',
                        }),
                        e.jsx('li', { children: 'Desktop (>1024px): Full 3-column layout' }),
                      ],
                    }),
                  ],
                }),
                e.jsxs('div', {
                  children: [
                    e.jsx('h3', {
                      className: 'font-medium text-content-text mb-2',
                      children: 'RTL Testing:',
                    }),
                    e.jsxs('ul', {
                      className: 'list-disc list-inside space-y-1 ms-4',
                      children: [
                        e.jsx('li', { children: 'Switch to Arabic language to test RTL layout' }),
                        e.jsx('li', {
                          children: 'All icons, text, and layout should flip correctly',
                        }),
                        e.jsx('li', { children: 'Logical properties ensure proper RTL behavior' }),
                      ],
                    }),
                  ],
                }),
                e.jsxs('div', {
                  children: [
                    e.jsx('h3', {
                      className: 'font-medium text-content-text mb-2',
                      children: 'Dark Mode Testing:',
                    }),
                    e.jsxs('ul', {
                      className: 'list-disc list-inside space-y-1 ms-4',
                      children: [
                        e.jsx('li', { children: 'Toggle theme via settings to test dark mode' }),
                        e.jsx('li', {
                          children: 'All colors should adapt via CSS custom properties',
                        }),
                        e.jsx('li', { children: 'Icon rail background: #1A1D26 (dark gray)' }),
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
  })
}
export { N as component }
//# sourceMappingURL=modern-nav-demo-BEcstwz5.js.map
