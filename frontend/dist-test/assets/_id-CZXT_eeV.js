const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      'assets/CountryDossierPage-cPP4FHbk.js',
      'assets/react-vendor-Buoak6m3.js',
      'assets/vendor-misc-BiJvMP0A.js',
      'assets/visualization-vendor-f5uYUx4I.js',
      'assets/visualization-vendor-BZV40eAE.css',
      'assets/date-vendor-s0MkYge4.js',
      'assets/react-vendor-DRguh7TN.css',
      'assets/DossierDetailLayout-BuE-52qO.js',
      'assets/tanstack-vendor-BZC-rs5U.js',
      'assets/supabase-vendor-CTsC8ILD.js',
      'assets/index-qYY0KoZ1.js',
      'assets/i18n-vendor-Coo-X0AG.js',
      'assets/ui-vendor-DTR9u_Vg.js',
      'assets/form-vendor-BX1BhTCI.js',
      'assets/index-C9Y_bLcv.css',
      'assets/QueryErrorBoundary-C6TJE_Qg.js',
      'assets/CountryTimeline-ChW1wm5i.js',
      'assets/useUnifiedTimeline-2-SmgReu.js',
      'assets/avatar-lQOCSoMx.js',
      'assets/use-outside-click-DyRG7K6b.js',
      'assets/useUnifiedTimeline-PlEUyBDy.css',
    ]),
) => i.map((i) => d[i])
import { _ as g } from './supabase-vendor-CTsC8ILD.js'
import { u as p, j as s, r as h } from './react-vendor-Buoak6m3.js'
import { a as v } from './useDossier-CiPcwRKl.js'
import { c as N } from './dossier-type-guards-DQ1YbbnG.js'
import { a0 as t, aZ as a, bb as f, bc as n, B as i } from './index-qYY0KoZ1.js'
import { L as l } from './tanstack-vendor-BZC-rs5U.js'
import { bw as m } from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function x() {
  const { i18n: e } = p(),
    o = e.language === 'ar'
  return s.jsxs('div', {
    className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
    dir: o ? 'rtl' : 'ltr',
    children: [
      s.jsxs('div', {
        className: 'mb-6 sm:mb-8 space-y-3',
        children: [
          s.jsx(t, { className: 'h-8 sm:h-10 w-2/3' }),
          s.jsx(t, { className: 'h-4 sm:h-5 w-1/2' }),
        ],
      }),
      s.jsxs('div', {
        className: 'grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 lg:gap-8',
        children: [
          s.jsxs('div', {
            className: 'space-y-6',
            children: [
              s.jsxs('div', {
                className: 'rounded-lg border border-border p-4 sm:p-6',
                children: [
                  s.jsx(t, { className: 'h-4 w-32 mb-4' }),
                  s.jsx(t, { className: 'h-64 sm:h-80 lg:h-96 w-full' }),
                ],
              }),
              s.jsxs('div', {
                className: 'rounded-lg border border-border p-4 sm:p-6',
                children: [
                  s.jsx(t, { className: 'h-4 w-40 mb-4' }),
                  s.jsxs('div', {
                    className: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
                    children: [s.jsx(a, {}), s.jsx(a, {})],
                  }),
                ],
              }),
            ],
          }),
          s.jsxs('div', {
            className: 'space-y-6',
            children: [
              s.jsxs('div', {
                className: 'rounded-lg border border-border p-4 sm:p-6',
                children: [s.jsx(t, { className: 'h-4 w-36 mb-4' }), s.jsx(f, { lines: 5 })],
              }),
              s.jsxs('div', {
                className: 'rounded-lg border border-border p-4 sm:p-6',
                children: [
                  s.jsx(t, { className: 'h-4 w-32 mb-4' }),
                  s.jsx(a, {}),
                  s.jsx('div', { className: 'mt-4', children: s.jsx(a, {}) }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}
const y = h.lazy(() =>
  g(
    () => import('./CountryDossierPage-cPP4FHbk.js'),
    __vite__mapDeps([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]),
  ).then((e) => ({ default: e.CountryDossierPage })),
)
function A() {
  const { t: e, i18n: o } = p('dossier'),
    d = o.language === 'ar',
    { id: u } = n.useParams(),
    j = n.useSearch(),
    { data: r, isLoading: b, error: c } = v(u, ['stats', 'owners', 'contacts'])
  return b
    ? s.jsx(x, {})
    : c
      ? s.jsx('div', {
          className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16',
          dir: d ? 'rtl' : 'ltr',
          children: s.jsx('div', {
            className: 'bg-destructive/10 border border-destructive/20 rounded-lg p-4 sm:p-6',
            role: 'alert',
            children: s.jsxs('div', {
              className: 'flex items-start gap-3',
              children: [
                s.jsx(m, {
                  className: 'h-5 w-5 sm:h-6 sm:w-6 text-destructive flex-shrink-0 mt-0.5',
                }),
                s.jsxs('div', {
                  className: 'flex-1 min-w-0',
                  children: [
                    s.jsx('h3', {
                      className: 'text-base sm:text-lg font-semibold text-destructive mb-2',
                      children: e('detail.error'),
                    }),
                    s.jsx('p', {
                      className: 'text-sm sm:text-base text-destructive/90',
                      children: c.message || e('detail.errorGeneric'),
                    }),
                    s.jsxs('div', {
                      className: 'mt-4 flex flex-col sm:flex-row gap-2',
                      children: [
                        s.jsx(i, {
                          variant: 'outline',
                          asChild: !0,
                          children: s.jsx(l, { to: '/dossiers', children: e('action.backToHub') }),
                        }),
                        s.jsx(i, {
                          variant: 'outline',
                          asChild: !0,
                          children: s.jsx(l, {
                            to: '/dossiers/countries',
                            children: e('action.backToList'),
                          }),
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          }),
        })
      : !r || !N(r)
        ? s.jsx('div', {
            className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16',
            dir: d ? 'rtl' : 'ltr',
            children: s.jsx('div', {
              className: 'bg-destructive/10 border border-destructive/20 rounded-lg p-4 sm:p-6',
              role: 'alert',
              children: s.jsxs('div', {
                className: 'flex items-start gap-3',
                children: [
                  s.jsx(m, {
                    className: 'h-5 w-5 sm:h-6 sm:w-6 text-destructive flex-shrink-0 mt-0.5',
                  }),
                  s.jsxs('div', {
                    className: 'flex-1 min-w-0',
                    children: [
                      s.jsx('h3', {
                        className: 'text-base sm:text-lg font-semibold text-destructive mb-2',
                        children: e('detail.wrongType'),
                      }),
                      s.jsx('p', {
                        className: 'text-sm sm:text-base text-destructive/90',
                        children: e('detail.wrongTypeDescription', {
                          expectedType: e('type.country'),
                          actualType: r ? e(`type.${r.dossier_type}`) : 'unknown',
                        }),
                      }),
                      s.jsxs('div', {
                        className: 'mt-4 flex flex-col sm:flex-row gap-2',
                        children: [
                          s.jsx(i, {
                            variant: 'outline',
                            asChild: !0,
                            children: s.jsx(l, {
                              to: '/dossiers',
                              children: e('action.backToHub'),
                            }),
                          }),
                          r &&
                            s.jsx(i, {
                              variant: 'outline',
                              asChild: !0,
                              children: s.jsx(l, {
                                to: `/dossiers/${r.dossier_type}s/${r.id}`,
                                children: e('action.viewCorrectType', {
                                  type: e(`type.${r.dossier_type}`),
                                }),
                              }),
                            }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            }),
          })
        : s.jsx(h.Suspense, {
            fallback: s.jsx(x, {}),
            children: s.jsx(y, { dossier: r, initialTab: j.tab }),
          })
}
export { A as component }
//# sourceMappingURL=_id-CZXT_eeV.js.map
