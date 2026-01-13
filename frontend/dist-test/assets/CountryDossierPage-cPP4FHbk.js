const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      'assets/IntelligenceTabContent-BjgIr2EY.js',
      'assets/react-vendor-Buoak6m3.js',
      'assets/vendor-misc-BiJvMP0A.js',
      'assets/visualization-vendor-f5uYUx4I.js',
      'assets/visualization-vendor-BZV40eAE.css',
      'assets/date-vendor-s0MkYge4.js',
      'assets/react-vendor-DRguh7TN.css',
      'assets/useIntelligence-BMjousVq.js',
      'assets/tanstack-vendor-BZC-rs5U.js',
      'assets/index-qYY0KoZ1.js',
      'assets/i18n-vendor-Coo-X0AG.js',
      'assets/ui-vendor-DTR9u_Vg.js',
      'assets/supabase-vendor-CTsC8ILD.js',
      'assets/form-vendor-BX1BhTCI.js',
      'assets/index-C9Y_bLcv.css',
      'assets/RefreshButton-B7MWE9Ka.js',
    ]),
) => i.map((i) => d[i])
import { u as x, r as n, j as e } from './react-vendor-Buoak6m3.js'
import { D as u } from './DossierDetailLayout-BuE-52qO.js'
import { _ as g } from './supabase-vendor-CTsC8ILD.js'
import { i as h } from './tanstack-vendor-BZC-rs5U.js'
import { a0 as t } from './index-qYY0KoZ1.js'
import { Q as j } from './QueryErrorBoundary-C6TJE_Qg.js'
import { C as y, R as f, D as v, a as w, K as N } from './CountryTimeline-ChW1wm5i.js'
import './vendor-misc-BiJvMP0A.js'
import './visualization-vendor-f5uYUx4I.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './form-vendor-BX1BhTCI.js'
import './useUnifiedTimeline-2-SmgReu.js'
import './avatar-lQOCSoMx.js'
import './use-outside-click-DyRG7K6b.js'
const k = n.lazy(() =>
  g(
    () => import('./IntelligenceTabContent-BjgIr2EY.js'),
    __vite__mapDeps([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]),
  ).then((a) => ({ default: a.IntelligenceTabContent })),
)
function C({ dossier: a, initialTab: r }) {
  const { t: l, i18n: o } = x('dossier'),
    d = o.language === 'ar',
    c = h(),
    [i, m] = n.useState(r || 'intelligence')
  a.extension || console.error('Country dossier extension data is missing:', a)
  const p = [
      { id: 'intelligence', label: l('intelligence.title', 'Intelligence Reports') },
      { id: 'timeline', label: l('tabs.timeline', 'Timeline') },
      { id: 'relationships', label: l('tabs.relationships', 'Relationships') },
      { id: 'positions', label: l('tabs.positions', 'Positions') },
      { id: 'mous', label: l('tabs.mous', 'MoUs') },
      { id: 'contacts', label: l('tabs.contacts', 'Contacts') },
    ],
    b = (s) => {
      ;(m(s), c({ search: { tab: s }, replace: !0 }))
    }
  return e.jsx('div', {
    className: 'space-y-6',
    dir: d ? 'rtl' : 'ltr',
    children: e.jsxs('div', {
      className: 'bg-white dark:bg-gray-800 rounded-lg shadow',
      children: [
        e.jsx('div', {
          className: 'border-b border-gray-200 dark:border-gray-700 relative',
          children: e.jsxs('div', {
            className: 'relative',
            children: [
              e.jsx('div', {
                className:
                  'absolute end-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-e from-transparent to-white dark:to-gray-800 pointer-events-none z-10',
              }),
              e.jsx('nav', {
                className: '-mb-px flex overflow-x-auto scrollbar-hide px-4 sm:px-6',
                'aria-label': l('detail.tabs_label', 'Country dossier sections'),
                role: 'tablist',
                children: p.map((s) =>
                  e.jsx(
                    'button',
                    {
                      onClick: () => !s.disabled && b(s.id),
                      disabled: s.disabled,
                      role: 'tab',
                      'aria-selected': i === s.id,
                      'aria-controls': `${s.id}-panel`,
                      className: `
                  flex-shrink-0 min-h-11 py-3 px-3 sm:px-4 md:px-6 border-b-2 font-medium text-xs sm:text-sm md:text-base
                  transition-all duration-200 ease-in-out
                  ${i === s.id ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                  ${s.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-t-md
                `,
                      children: e.jsxs('span', {
                        className: 'whitespace-nowrap flex items-center gap-1.5',
                        children: [
                          s.label,
                          s.id === 'intelligence' &&
                            e.jsx('span', {
                              className:
                                'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-black text-white dark:bg-white dark:text-black',
                              children: 'Beta',
                            }),
                        ],
                      }),
                    },
                    s.id,
                  ),
                ),
              }),
            ],
          }),
        }),
        e.jsxs('div', {
          className: 'p-4 sm:p-6',
          children: [
            i === 'intelligence' &&
              e.jsx('div', {
                id: 'intelligence-panel',
                role: 'tabpanel',
                'aria-labelledby': 'intelligence-tab',
                children: e.jsx(j, {
                  children: e.jsx(n.Suspense, {
                    fallback: e.jsxs('div', {
                      className: 'space-y-6',
                      children: [
                        e.jsxs('div', {
                          className: 'flex flex-col sm:flex-row gap-3',
                          children: [
                            e.jsx(t, { className: 'h-10 w-full sm:w-48' }),
                            e.jsx(t, { className: 'h-10 w-full sm:w-48' }),
                            e.jsx(t, { className: 'h-10 w-full sm:w-32' }),
                          ],
                        }),
                        e.jsx('div', {
                          className: 'grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6',
                          children: [1, 2, 3, 4].map((s) =>
                            e.jsx(t, { className: 'h-96 w-full' }, s),
                          ),
                        }),
                      ],
                    }),
                    children: e.jsx(k, { dossierId: a.id, dossier: a }),
                  }),
                }),
              }),
            i === 'timeline' &&
              e.jsx('div', {
                id: 'timeline-panel',
                role: 'tabpanel',
                'aria-labelledby': 'timeline-tab',
                children: e.jsx(y, { dossierId: a.id }),
              }),
            i === 'relationships' &&
              e.jsx('div', {
                id: 'relationships-panel',
                role: 'tabpanel',
                'aria-labelledby': 'relationships-tab',
                children: e.jsx(f, { dossierId: a.id }),
              }),
            i === 'positions' &&
              e.jsx('div', {
                id: 'positions-panel',
                role: 'tabpanel',
                'aria-labelledby': 'positions-tab',
                children: e.jsx(v, { dossierId: a.id }),
              }),
            i === 'mous' &&
              e.jsx('div', {
                id: 'mous-panel',
                role: 'tabpanel',
                'aria-labelledby': 'mous-tab',
                children: e.jsx(w, { dossierId: a.id }),
              }),
            i === 'contacts' &&
              e.jsx('div', {
                id: 'contacts-panel',
                role: 'tabpanel',
                'aria-labelledby': 'contacts-tab',
                children: e.jsx(N, { dossierId: a.id }),
              }),
          ],
        }),
      ],
    }),
  })
}
function U({ dossier: a, initialTab: r }) {
  return e.jsx(u, {
    dossier: a,
    gridClassName: 'grid-cols-1',
    children: e.jsx(C, { dossier: a, initialTab: r }),
  })
}
export { U as CountryDossierPage }
//# sourceMappingURL=CountryDossierPage-cPP4FHbk.js.map
