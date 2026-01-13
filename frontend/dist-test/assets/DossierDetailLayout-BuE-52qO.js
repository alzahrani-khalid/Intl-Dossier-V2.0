import { u as i, j as e } from './react-vendor-Buoak6m3.js'
import { L as x } from './tanstack-vendor-BZC-rs5U.js'
import { aC as o, aM as c } from './vendor-misc-BiJvMP0A.js'
function u({ dossier: s, children: r, gridClassName: m = 'grid-cols-1', headerActions: a }) {
  const { t: n, i18n: l } = i('dossier'),
    t = l.language === 'ar'
  return e.jsxs('div', {
    className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8',
    children: [
      e.jsxs('nav', {
        className: 'flex items-center gap-2 text-sm sm:text-base mb-4 sm:mb-6',
        'aria-label': 'Breadcrumb',
        dir: t ? 'rtl' : 'ltr',
        children: [
          e.jsxs(x, {
            to: '/dossiers',
            className:
              'flex items-center gap-1 sm:gap-2 text-muted-foreground hover:text-foreground transition-colors',
            children: [
              e.jsx(o, { className: 'h-4 w-4' }),
              e.jsx('span', { children: n('hub.title') }),
            ],
          }),
          e.jsx(c, { className: `h-4 w-4 text-muted-foreground ${t ? 'rotate-180' : ''}` }),
          e.jsx('span', {
            className: 'text-foreground font-medium',
            children: t ? s.name_ar : s.name_en,
          }),
        ],
      }),
      e.jsxs('header', {
        className:
          'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b',
        dir: t ? 'rtl' : 'ltr',
        children: [
          e.jsxs('div', {
            className: 'flex-1',
            children: [
              e.jsx('h1', {
                className: 'text-2xl sm:text-3xl md:text-4xl font-bold mb-2',
                children: t ? s.name_ar : s.name_en,
              }),
              (s.description_en || s.description_ar) &&
                e.jsx('p', {
                  className: 'text-muted-foreground text-sm sm:text-base',
                  children: t ? s.description_ar : s.description_en,
                }),
            ],
          }),
          a && e.jsx('div', { className: 'flex items-center gap-2 sm:gap-3', children: a }),
        ],
      }),
      e.jsx('main', {
        className: `grid ${m} gap-4 sm:gap-6 lg:gap-8`,
        dir: t ? 'rtl' : 'ltr',
        children: r,
      }),
    ],
  })
}
export { u as D }
//# sourceMappingURL=DossierDetailLayout-BuE-52qO.js.map
