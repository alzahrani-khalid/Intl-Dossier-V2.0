import { u as n, j as e } from './react-vendor-Buoak6m3.js'
import { N as l, M as s, E as r } from './ExecutionsTabs-DO27UWVe.js'
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
  const { t } = n(),
    i = () => {}
  return e.jsx('div', {
    className: 'fixed inset-0 overflow-hidden',
    children: e.jsx(l, {
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
                children: t('navigation.dashboard', 'Dashboard'),
              }),
              e.jsx('p', {
                className: 'text-sm sm:text-base text-content-text-muted',
                children: 'All Your Workflows And Permissions',
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8',
            children: [
              e.jsx('div', {
                className: 'lg:col-span-2',
                children: e.jsx(s, {
                  label: t('metrics.executions', 'Executions'),
                  value: 340,
                  trend: { value: 23, direction: 'up' },
                  linkText: t('common.seeReport', 'See Report'),
                  onLinkClick: () => {},
                }),
              }),
              e.jsx(s, {
                label: t('metrics.activeProjects', 'Active Projects'),
                value: 12,
                trend: { value: 8, direction: 'up' },
                linkText: t('common.viewAll', 'View All'),
                onLinkClick: () => {},
              }),
              e.jsx(s, {
                label: t('metrics.teamMembers', 'Team Members'),
                value: 24,
                trend: { value: 2, direction: 'neutral' },
                linkText: t('common.manage', 'Manage'),
                onLinkClick: () => {},
              }),
              e.jsx('div', {
                className: 'lg:col-span-2',
                children: e.jsx(r, { title: t('navigation.executions', 'Executions') }),
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'mt-12 p-6 bg-panel rounded-lg border border-panel-border',
            children: [
              e.jsx('h2', {
                className: 'text-lg font-semibold text-content-text mb-4',
                children: '✅ Reference Design Match',
              }),
              e.jsxs('div', {
                className: 'grid grid-cols-1 md:grid-cols-3 gap-4 text-sm',
                children: [
                  e.jsxs('div', {
                    children: [
                      e.jsx('h3', {
                        className: 'font-medium text-content-text mb-2',
                        children: 'Icon Rail (Left)',
                      }),
                      e.jsxs('ul', {
                        className: 'space-y-1 text-content-text-muted',
                        children: [
                          e.jsx('li', { children: '✓ 56px width' }),
                          e.jsx('li', { children: '✓ Dark background (#1A1D26)' }),
                          e.jsx('li', { children: '✓ Icon-only buttons' }),
                          e.jsx('li', { children: '✓ Green active indicator' }),
                          e.jsx('li', { children: '✓ Settings at bottom' }),
                        ],
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    children: [
                      e.jsx('h3', {
                        className: 'font-medium text-content-text mb-2',
                        children: 'Expanded Panel (Middle)',
                      }),
                      e.jsxs('ul', {
                        className: 'space-y-1 text-content-text-muted',
                        children: [
                          e.jsx('li', { children: '✓ 280px width' }),
                          e.jsx('li', { children: '✓ Light gray background' }),
                          e.jsx('li', { children: '✓ User profile at top' }),
                          e.jsx('li', { children: '✓ Projects with badges' }),
                          e.jsx('li', { children: '✓ Status (New 3, Updates 2)' }),
                          e.jsx('li', { children: '✓ Document tree' }),
                        ],
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    children: [
                      e.jsx('h3', {
                        className: 'font-medium text-content-text mb-2',
                        children: 'Content Area (Right)',
                      }),
                      e.jsxs('ul', {
                        className: 'space-y-1 text-content-text-muted',
                        children: [
                          e.jsx('li', { children: '✓ White background' }),
                          e.jsx('li', { children: '✓ Dashboard title' }),
                          e.jsx('li', { children: '✓ Executions: 340 +23%' }),
                          e.jsx('li', { children: '✓ Animated counter' }),
                          e.jsx('li', { children: '✓ Tabs with search' }),
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
  })
}
export { N as component }
//# sourceMappingURL=modern-nav-standalone-D47gvuQV.js.map
