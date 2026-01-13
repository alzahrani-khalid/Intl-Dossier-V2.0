import { r as o, j as t } from './react-vendor-Buoak6m3.js'
import { u as s } from './index-qYY0KoZ1.js'
import { i as r } from './tanstack-vendor-BZC-rs5U.js'
import './vendor-misc-BiJvMP0A.js'
import './visualization-vendor-f5uYUx4I.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
function u() {
  const e = r(),
    { isAuthenticated: a } = s()
  return (
    o.useEffect(() => {
      a && e({ to: '/dashboard' })
    }, [a, e]),
    t.jsx('div', {
      className: 'from-base-50 to-base-100 min-h-screen bg-gradient-to-b',
      children: t.jsx('div', {
        className: 'container mx-auto px-4 py-16',
        children: t.jsxs('div', {
          className: 'mx-auto max-w-3xl text-center',
          children: [
            t.jsx('h1', {
              className: 'font-display text-base-900 mb-6 text-5xl',
              children: 'GASTAT International Dossier System',
            }),
            t.jsx('p', {
              className: 'font-text text-base-600 mb-8 text-xl',
              children: 'Welcome to the International Relations Management Platform',
            }),
            t.jsx('div', {
              className: 'flex justify-center gap-4',
              children: t.jsx('button', {
                onClick: () => e({ to: '/login' }),
                className:
                  'font-text rounded-lg bg-primary-600 px-8 py-3 text-primary-50 transition-colors hover:bg-primary-700',
                children: 'Sign In',
              }),
            }),
          ],
        }),
      }),
    })
  )
}
export { u as component }
//# sourceMappingURL=index-egbPq05E.js.map
