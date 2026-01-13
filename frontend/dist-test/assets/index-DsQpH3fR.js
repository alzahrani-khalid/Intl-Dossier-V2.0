import { u as w, r as b, j as e } from './react-vendor-Buoak6m3.js'
import { L as l } from './tanstack-vendor-BZC-rs5U.js'
import { u as L } from './useDossier-CiPcwRKl.js'
import {
  B as n,
  I as _,
  N as C,
  O as T,
  P as v,
  Q as c,
  R as $,
  U as m,
  m as j,
} from './index-qYY0KoZ1.js'
import { b_ as g, b9 as k, aS as B } from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function A() {
  const { t, i18n: y } = w('dossier'),
    d = y.language === 'ar',
    [a, N] = b.useState(''),
    [o, f] = b.useState(1),
    x = 20,
    { data: r, isLoading: h, error: p } = L('topic', o, x),
    i = r?.data.filter((s) => {
      if (!a) return !0
      const u = a.toLowerCase()
      return (
        s.name_en.toLowerCase().includes(u) ||
        s.name_ar?.toLowerCase().includes(u) ||
        s.description_en?.toLowerCase().includes(u) ||
        s.description_ar?.toLowerCase().includes(u)
      )
    })
  return e.jsxs('div', {
    className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8',
    dir: d ? 'rtl' : 'ltr',
    children: [
      e.jsxs('header', {
        className:
          'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8',
        children: [
          e.jsxs('div', {
            className: 'flex items-center gap-3',
            children: [
              e.jsx(g, { className: 'h-6 w-6 sm:h-8 sm:w-8 text-primary' }),
              e.jsxs('div', {
                children: [
                  e.jsx('h1', {
                    className: 'text-2xl sm:text-3xl md:text-4xl font-bold',
                    children: t('type.topic'),
                  }),
                  e.jsx('p', {
                    className: 'text-sm sm:text-base text-muted-foreground mt-1',
                    children: t('typeDescription.topic'),
                  }),
                ],
              }),
            ],
          }),
          e.jsx(n, {
            asChild: !0,
            children: e.jsxs(l, {
              to: '/dossiers/create',
              children: [e.jsx(k, { className: 'h-4 w-4 me-2' }), t('action.create')],
            }),
          }),
        ],
      }),
      e.jsx('div', {
        className: 'mb-6',
        children: e.jsx(_, {
          type: 'text',
          placeholder: t('filter.search'),
          value: a,
          onChange: (s) => N(s.target.value),
          className: 'max-w-md',
        }),
      }),
      h &&
        e.jsxs('div', {
          className: 'flex items-center justify-center py-12 sm:py-16 lg:py-20',
          children: [
            e.jsx(B, { className: 'h-8 w-8 sm:h-10 sm:w-10 animate-spin text-muted-foreground' }),
            e.jsx('span', {
              className: 'ms-3 text-muted-foreground text-sm sm:text-base',
              children: t('list.loading'),
            }),
          ],
        }),
      p &&
        !h &&
        e.jsxs('div', {
          className: 'bg-destructive/10 border border-destructive/20 rounded-lg p-4 sm:p-6',
          role: 'alert',
          children: [
            e.jsx('h3', {
              className: 'text-base sm:text-lg font-semibold text-destructive mb-2',
              children: t('list.error'),
            }),
            e.jsx('p', {
              className: 'text-sm sm:text-base text-destructive/90',
              children: p.message,
            }),
          ],
        }),
      !h &&
        !p &&
        i?.length === 0 &&
        e.jsxs('div', {
          className:
            'flex flex-col items-center justify-center py-12 sm:py-16 lg:py-20 text-center',
          children: [
            e.jsx(g, { className: 'h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4' }),
            e.jsx('h3', {
              className: 'text-base sm:text-lg font-semibold mb-2',
              children: t(a ? 'list.emptyFiltered' : 'list.empty'),
            }),
            e.jsx('p', {
              className: 'text-sm sm:text-base text-muted-foreground max-w-md mb-6',
              children: t(a ? 'list.emptyFilteredDescription' : 'list.emptyDescription'),
            }),
            !a &&
              e.jsx(n, {
                asChild: !0,
                children: e.jsx(l, { to: '/dossiers/create', children: t('action.create') }),
              }),
          ],
        }),
      !h &&
        !p &&
        i &&
        i.length > 0 &&
        e.jsxs(e.Fragment, {
          children: [
            e.jsx('div', {
              className: 'hidden md:block rounded-lg border overflow-hidden',
              children: e.jsxs(C, {
                children: [
                  e.jsx(T, {
                    children: e.jsxs(v, {
                      children: [
                        e.jsx(c, { children: t('form.nameEn') }),
                        e.jsx(c, { children: t('form.nameAr') }),
                        e.jsx(c, { children: t('form.status') }),
                        e.jsx(c, { children: t('form.sensitivityLevel') }),
                        e.jsx(c, { className: 'text-end', children: t('action.more') }),
                      ],
                    }),
                  }),
                  e.jsx($, {
                    children: i.map((s) =>
                      e.jsxs(
                        v,
                        {
                          children: [
                            e.jsx(m, {
                              className: 'font-medium',
                              children: e.jsx(l, {
                                to: `/dossiers/${s.id}`,
                                className: 'hover:text-primary hover:underline',
                                children: s.name_en,
                              }),
                            }),
                            e.jsx(m, { children: s.name_ar }),
                            e.jsx(m, {
                              children: e.jsx(j, {
                                variant: s.status === 'active' ? 'default' : 'secondary',
                                children: t(`status.${s.status}`),
                              }),
                            }),
                            e.jsx(m, {
                              children: e.jsx(j, {
                                variant: 'outline',
                                children: t(`sensitivityLevel.${s.sensitivity_level}`),
                              }),
                            }),
                            e.jsx(m, {
                              className: 'text-end',
                              children: e.jsx(n, {
                                variant: 'ghost',
                                size: 'sm',
                                asChild: !0,
                                children: e.jsx(l, {
                                  to: `/dossiers/${s.id}`,
                                  children: t('action.view'),
                                }),
                              }),
                            }),
                          ],
                        },
                        s.id,
                      ),
                    ),
                  }),
                ],
              }),
            }),
            e.jsx('div', {
              className: 'md:hidden space-y-4',
              children: i.map((s) =>
                e.jsxs(
                  l,
                  {
                    to: `/dossiers/${s.id}`,
                    className:
                      'block p-4 rounded-lg border bg-card hover:bg-accent transition-colors',
                    children: [
                      e.jsxs('div', {
                        className: 'flex items-start justify-between gap-3 mb-3',
                        children: [
                          e.jsx('h3', {
                            className: 'font-semibold text-base',
                            children: d ? s.name_ar : s.name_en,
                          }),
                          e.jsx(j, {
                            variant: s.status === 'active' ? 'default' : 'secondary',
                            children: t(`status.${s.status}`),
                          }),
                        ],
                      }),
                      (d ? s.description_ar : s.description_en) &&
                        e.jsx('p', {
                          className: 'text-sm text-muted-foreground mb-3 line-clamp-2',
                          children: d ? s.description_ar : s.description_en,
                        }),
                      e.jsx('div', {
                        className: 'flex items-center gap-2',
                        children: e.jsx(j, {
                          variant: 'outline',
                          className: 'text-xs',
                          children: t(`sensitivityLevel.${s.sensitivity_level}`),
                        }),
                      }),
                    ],
                  },
                  s.id,
                ),
              ),
            }),
            r &&
              r.total > x &&
              e.jsxs('div', {
                className: 'mt-8 flex items-center justify-between',
                children: [
                  e.jsx(n, {
                    variant: 'outline',
                    disabled: o === 1,
                    onClick: () => f((s) => Math.max(1, s - 1)),
                    children: t('action.back'),
                  }),
                  e.jsx('span', {
                    className: 'text-sm text-muted-foreground',
                    children: t('list.pageInfo', { current: o, total: Math.ceil(r.total / x) }),
                  }),
                  e.jsx(n, {
                    variant: 'outline',
                    disabled: o * x >= r.total,
                    onClick: () => f((s) => s + 1),
                    children: t('action.next'),
                  }),
                ],
              }),
          ],
        }),
    ],
  })
}
export { A as component }
//# sourceMappingURL=index-DsQpH3fR.js.map
