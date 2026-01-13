import { u as j, j as e } from './react-vendor-Buoak6m3.js'
import { B as c, D as N, x as b, y as w, z as h, a9 as g } from './index-qYY0KoZ1.js'
import { aB as r, aN as C } from './vendor-misc-BiJvMP0A.js'
const x = {
  economic: { en: 'Economic', ar: 'اقتصادي' },
  political: { en: 'Political', ar: 'سياسي' },
  security: { en: 'Security', ar: 'أمني' },
  bilateral: { en: 'Bilateral', ar: 'ثنائي' },
  general: { en: 'General', ar: 'عام' },
}
function E({
  intelligenceTypes: m = ['economic', 'political', 'security', 'bilateral'],
  onRefresh: o,
  isLoading: s = !1,
  disabled: i = !1,
  showTypeSelection: d = !0,
  className: u,
}) {
  const { t: a, i18n: p } = j('dossier'),
    n = p.language === 'ar',
    t = () => {
      o(m)
    },
    f = (l) => {
      o([l])
    }
  return d
    ? e.jsxs('div', {
        className: 'flex flex-row gap-0',
        dir: n ? 'rtl' : 'ltr',
        children: [
          e.jsxs(c, {
            onClick: t,
            disabled: i || s,
            variant: 'outline',
            size: 'sm',
            className: 'min-h-11 gap-2 rounded-e-none border-e-0',
            'aria-label': a('intelligence.refreshAllLabel', 'Refresh all intelligence types'),
            'aria-busy': s,
            children: [
              e.jsx(r, { className: `h-4 w-4 ${s ? 'animate-spin' : ''}` }),
              e.jsx('span', {
                className: 'hidden text-sm sm:inline sm:text-base',
                children: a(s ? 'intelligence.refreshing' : 'intelligence.refreshAll'),
              }),
              e.jsx('span', {
                className: 'text-sm sm:hidden sm:text-base',
                children: a(s ? 'intelligence.refreshing' : 'intelligence.refresh'),
              }),
            ],
          }),
          e.jsxs(N, {
            children: [
              e.jsx(b, {
                asChild: !0,
                children: e.jsx(c, {
                  variant: 'outline',
                  size: 'sm',
                  className: 'min-h-11 min-w-11 rounded-s-none px-2',
                  disabled: i || s,
                  'aria-label': a('intelligence.selectType'),
                  children: e.jsx(C, { className: `h-4 w-4 ${n ? 'rotate-180' : ''}` }),
                }),
              }),
              e.jsxs(w, {
                align: n ? 'start' : 'end',
                className: 'w-48',
                children: [
                  e.jsxs(h, {
                    onClick: t,
                    disabled: s,
                    className: 'gap-2',
                    children: [
                      e.jsx(r, { className: 'h-4 w-4' }),
                      e.jsx('span', { children: a('intelligence.refreshAll') }),
                    ],
                  }),
                  e.jsx(g, {}),
                  m.map((l) =>
                    e.jsxs(
                      h,
                      {
                        onClick: () => f(l),
                        disabled: s,
                        className: 'gap-2',
                        children: [
                          e.jsx(r, { className: 'h-4 w-4' }),
                          e.jsx('span', { children: n ? x[l].ar : x[l].en }),
                        ],
                      },
                      l,
                    ),
                  ),
                ],
              }),
            ],
          }),
        ],
      })
    : e.jsxs(c, {
        onClick: t,
        disabled: i || s,
        variant: 'outline',
        size: 'sm',
        className: `min-h-11 min-w-11 gap-2 ${u || ''}`,
        dir: n ? 'rtl' : 'ltr',
        'aria-label': a('intelligence.refreshButtonLabel', 'Refresh intelligence data'),
        'aria-busy': s,
        children: [
          e.jsx(r, { className: `h-4 w-4 ${s ? 'animate-spin' : ''}` }),
          e.jsx('span', {
            className: 'text-sm sm:text-base',
            children: a(s ? 'intelligence.refreshing' : 'intelligence.refresh'),
          }),
        ],
      })
}
export { E as R }
//# sourceMappingURL=RefreshButton-B7MWE9Ka.js.map
