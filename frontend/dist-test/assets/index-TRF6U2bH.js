import { u as s, j as e } from './react-vendor-Buoak6m3.js'
import { i as r } from './tanstack-vendor-BZC-rs5U.js'
import { B as t, j as n, k as i, o, V as c, l as m } from './index-qYY0KoZ1.js'
import { aH as l, b9 as x } from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function C() {
  const { t: d } = s(['common']),
    a = r()
  return e.jsxs('div', {
    className: 'min-h-screen bg-gray-50 dark:bg-gray-900',
    children: [
      e.jsx('div', {
        className: 'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700',
        children: e.jsx('div', {
          className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
          children: e.jsxs('div', {
            className: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
            children: [
              e.jsxs('div', {
                className: 'space-y-1',
                children: [
                  e.jsxs('h1', {
                    className:
                      'text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3',
                    children: [e.jsx(l, { className: 'h-8 w-8' }), 'After Action Records'],
                  }),
                  e.jsx('p', {
                    className: 'text-gray-500 dark:text-gray-400',
                    children: 'Manage engagement outcomes and commitments',
                  }),
                ],
              }),
              e.jsxs(t, {
                className: 'gap-2',
                onClick: () => a({ to: '/engagements' }),
                children: [e.jsx(x, { className: 'h-5 w-5' }), 'Create After Action'],
              }),
            ],
          }),
        }),
      }),
      e.jsx('main', {
        className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
        children: e.jsxs(n, {
          children: [
            e.jsxs(i, {
              children: [
                e.jsx(o, { children: 'After Actions' }),
                e.jsx(c, { children: 'After action records are created from engagement details.' }),
              ],
            }),
            e.jsx(m, {
              children: e.jsx('p', {
                className: 'text-gray-600 dark:text-gray-400 text-center py-8',
                children: 'No after action records available. Create an engagement to get started.',
              }),
            }),
          ],
        }),
      }),
    ],
  })
}
export { C as component }
//# sourceMappingURL=index-TRF6U2bH.js.map
