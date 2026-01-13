import { u as k, r as i, j as e } from './react-vendor-Buoak6m3.js'
import { B as _, j as m, k as x, o as h, l as u, I as A } from './index-qYY0KoZ1.js'
import { u as E } from './useDossier-CiPcwRKl.js'
import { aS as L, c6 as F, b9 as z, b_ as B, aH as I } from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './tanstack-vendor-BZC-rs5U.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function $() {
  const { t, i18n: g } = k(),
    [c, f] = i.useState(''),
    [a, j] = i.useState('all'),
    [l, b] = i.useState('all'),
    { data: o, isLoading: N, isError: y, error: v } = E('theme', 1, 1e3),
    n = i.useMemo(
      () =>
        o?.data
          ? o.data.filter((s) => {
              const r = s.extension_data,
                d = [s.name_en, s.name_ar]
                  .filter(Boolean)
                  .join(' ')
                  .toLowerCase()
                  .includes(c.toLowerCase()),
                T = a === 'all' || r?.scope === a,
                C = l === 'all' || s.status === l
              return d && T && C
            })
          : [],
      [o, c, a, l],
    ),
    w = n.filter((s) => s.status === 'active').length,
    S = n.reduce((s, r) => {
      const d = r.extension_data?.related_engagements_count || 0
      return s + d
    }, 0),
    p = g.dir() === 'rtl'
  return N
    ? e.jsx('div', {
        className: 'flex min-h-96 items-center justify-center',
        children: e.jsx(L, { className: 'size-8 animate-spin text-primary' }),
      })
    : y
      ? e.jsxs('div', {
          className: 'flex min-h-96 flex-col items-center justify-center gap-4',
          children: [
            e.jsx(F, { className: 'size-12 text-destructive' }),
            e.jsxs('div', {
              className: 'text-center',
              children: [
                e.jsx('h2', {
                  className: 'text-xl font-semibold text-foreground',
                  children: t('themes.error.title', 'Failed to load themes'),
                }),
                e.jsx('p', {
                  className: 'text-sm text-muted-foreground',
                  children:
                    v?.message ||
                    t('themes.error.message', 'An error occurred while fetching data'),
                }),
              ],
            }),
          ],
        })
      : e.jsxs('div', {
          className: 'space-y-6',
          children: [
            e.jsx('header', {
              className: 'flex flex-col gap-2',
              children: e.jsxs('div', {
                className: 'flex flex-wrap items-center justify-between gap-3',
                children: [
                  e.jsxs('div', {
                    children: [
                      e.jsx('h1', {
                        className: 'font-display text-3xl font-semibold text-foreground',
                        children: t('themes.title', 'Strategic Themes'),
                      }),
                      e.jsx('p', {
                        className: 'text-base text-muted-foreground',
                        children: t(
                          'themes.subtitle',
                          'Track cross-cutting strategic themes across engagements, working groups, and partnerships.',
                        ),
                      }),
                    ],
                  }),
                  e.jsxs(_, {
                    size: 'sm',
                    className: 'gap-2',
                    children: [
                      e.jsx(z, { className: 'size-4' }),
                      t('themes.actions.addTheme', 'Add new theme'),
                    ],
                  }),
                ],
              }),
            }),
            e.jsxs('section', {
              className: 'grid gap-4 sm:grid-cols-2 2xl:grid-cols-3',
              children: [
                e.jsxs(m, {
                  children: [
                    e.jsxs(x, {
                      className: 'flex flex-row items-center justify-between',
                      children: [
                        e.jsx(h, {
                          className: 'text-sm font-semibold text-card-foreground',
                          children: t('themes.metrics.activeThemes', 'Active themes'),
                        }),
                        e.jsx(B, { className: 'size-5 text-primary' }),
                      ],
                    }),
                    e.jsxs(u, {
                      children: [
                        e.jsx('p', {
                          className: 'text-2xl font-bold text-foreground',
                          children: w,
                        }),
                        e.jsx('p', {
                          className: 'mt-2 text-sm text-muted-foreground',
                          children: t(
                            'themes.metrics.activeThemesHint',
                            'Currently tracked strategic priorities',
                          ),
                        }),
                      ],
                    }),
                  ],
                }),
                e.jsxs(m, {
                  children: [
                    e.jsxs(x, {
                      className: 'flex flex-row items-center justify-between',
                      children: [
                        e.jsx(h, {
                          className: 'text-sm font-semibold text-card-foreground',
                          children: t('themes.metrics.linkedEngagements', 'Linked engagements'),
                        }),
                        e.jsx(I, { className: 'size-5 text-primary' }),
                      ],
                    }),
                    e.jsxs(u, {
                      children: [
                        e.jsx('p', {
                          className: 'text-2xl font-bold text-foreground',
                          children: S,
                        }),
                        e.jsx('p', {
                          className: 'mt-2 text-sm text-muted-foreground',
                          children: t(
                            'themes.metrics.linkedEngagementsHint',
                            'Engagements aligned with themes',
                          ),
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            e.jsxs(m, {
              children: [
                e.jsx(x, {
                  children: e.jsx(h, { children: t('themes.filters.title', 'Filters & search') }),
                }),
                e.jsxs(u, {
                  className: 'flex flex-col gap-4 lg:flex-row lg:items-end',
                  children: [
                    e.jsxs('div', {
                      className: 'flex-1',
                      children: [
                        e.jsx('label', {
                          className: 'mb-1 block text-sm font-medium text-foreground',
                          children: t('themes.filters.search', 'Search by name'),
                        }),
                        e.jsx(A, {
                          value: c,
                          onChange: (s) => f(s.target.value),
                          placeholder: t(
                            'themes.filters.searchPlaceholder',
                            'e.g. Digital Transformation, AI',
                          ),
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      children: [
                        e.jsx('label', {
                          className: 'mb-1 block text-sm font-medium text-foreground',
                          children: t('themes.filters.scope', 'Scope'),
                        }),
                        e.jsxs('select', {
                          value: a,
                          onChange: (s) => j(s.target.value),
                          className:
                            'w-48 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                          dir: p ? 'rtl' : 'ltr',
                          children: [
                            e.jsx('option', {
                              value: 'all',
                              children: t('themes.filters.allScopes', 'All scopes'),
                            }),
                            e.jsx('option', {
                              value: 'global',
                              children: t('themes.scope.global', 'Global'),
                            }),
                            e.jsx('option', {
                              value: 'regional',
                              children: t('themes.scope.regional', 'Regional'),
                            }),
                            e.jsx('option', {
                              value: 'bilateral',
                              children: t('themes.scope.bilateral', 'Bilateral'),
                            }),
                            e.jsx('option', {
                              value: 'internal',
                              children: t('themes.scope.internal', 'Internal'),
                            }),
                          ],
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      children: [
                        e.jsx('label', {
                          className: 'mb-1 block text-sm font-medium text-foreground',
                          children: t('themes.filters.status', 'Status'),
                        }),
                        e.jsxs('select', {
                          value: l,
                          onChange: (s) => b(s.target.value),
                          className:
                            'w-44 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                          dir: p ? 'rtl' : 'ltr',
                          children: [
                            e.jsx('option', {
                              value: 'all',
                              children: t('themes.filters.allStatuses', 'All statuses'),
                            }),
                            e.jsx('option', {
                              value: 'active',
                              children: t('themes.status.active', 'Active'),
                            }),
                            e.jsx('option', {
                              value: 'inactive',
                              children: t('themes.status.inactive', 'Inactive'),
                            }),
                            e.jsx('option', {
                              value: 'archived',
                              children: t('themes.status.archived', 'Archived'),
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            e.jsx('div', {
              className: 'overflow-x-auto rounded-xl border border-border bg-card shadow-sm',
              children: e.jsxs('table', {
                className: 'min-w-full divide-y divide-border text-sm',
                children: [
                  e.jsx('thead', {
                    children: e.jsxs('tr', {
                      className:
                        'bg-muted/50 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                      children: [
                        e.jsx('th', {
                          className: 'px-5 py-3 text-start',
                          children: t('themes.table.theme', 'Theme'),
                        }),
                        e.jsx('th', {
                          className: 'px-5 py-3 text-start',
                          children: t('themes.table.scope', 'Scope'),
                        }),
                        e.jsx('th', {
                          className: 'px-5 py-3 text-start',
                          children: t('themes.table.priority', 'Priority'),
                        }),
                        e.jsx('th', {
                          className: 'px-5 py-3 text-start',
                          children: t('themes.table.status', 'Status'),
                        }),
                        e.jsx('th', {
                          className: 'px-5 py-3 text-start',
                          children: t('themes.table.engagements', 'Engagements'),
                        }),
                        e.jsx('th', {
                          className: 'px-5 py-3 text-start',
                          children: t('themes.table.updated', 'Last updated'),
                        }),
                      ],
                    }),
                  }),
                  e.jsxs('tbody', {
                    className: 'divide-y divide-border',
                    children: [
                      n.map((s) => {
                        const r = s.extension_data
                        return e.jsxs(
                          'tr',
                          {
                            className: 'hover:bg-accent/50',
                            children: [
                              e.jsx('td', {
                                className: 'px-5 py-4',
                                children: e.jsxs('div', {
                                  className: 'flex flex-col',
                                  children: [
                                    e.jsx('span', {
                                      className: 'font-semibold text-foreground',
                                      children: s.name_en,
                                    }),
                                    e.jsx('span', {
                                      className: 'text-xs text-muted-foreground',
                                      children: s.name_ar,
                                    }),
                                  ],
                                }),
                              }),
                              e.jsx('td', {
                                className: 'px-5 py-4 text-muted-foreground',
                                children: r?.scope ? t(`themes.scope.${r.scope}`, r.scope) : '—',
                              }),
                              e.jsx('td', {
                                className: 'px-5 py-4',
                                children: e.jsx('span', {
                                  className: `inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${r?.priority === 'high' ? 'bg-destructive/10 text-destructive' : r?.priority === 'medium' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}`,
                                  children: r?.priority
                                    ? t(`themes.priority.${r.priority}`, r.priority)
                                    : t('themes.priority.notSet', 'Not set'),
                                }),
                              }),
                              e.jsx('td', {
                                className: 'px-5 py-4',
                                children: e.jsx('span', {
                                  className: `inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${s.status === 'active' ? 'bg-primary/10 text-primary' : s.status === 'inactive' ? 'bg-muted text-muted-foreground' : 'bg-secondary/10 text-secondary-foreground'}`,
                                  children: t(`themes.status.${s.status}`, s.status),
                                }),
                              }),
                              e.jsx('td', {
                                className: 'px-5 py-4 text-foreground',
                                children: r?.related_engagements_count || 0,
                              }),
                              e.jsx('td', {
                                className: 'px-5 py-4 text-xs text-muted-foreground',
                                children: new Date(s.updated_at).toLocaleDateString(),
                              }),
                            ],
                          },
                          s.id,
                        )
                      }),
                      n.length === 0 &&
                        e.jsx('tr', {
                          children: e.jsx('td', {
                            colSpan: 6,
                            className: 'px-5 py-8 text-center text-sm text-muted-foreground',
                            children: t(
                              'themes.table.empty',
                              'No themes match the current filters',
                            ),
                          }),
                        }),
                    ],
                  }),
                ],
              }),
            }),
          ],
        })
}
const U = $
export { U as component }
//# sourceMappingURL=themes-Ch6mcmQ9.js.map
