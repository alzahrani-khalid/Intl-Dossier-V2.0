import { u as F, r as l, j as e } from './react-vendor-Buoak6m3.js'
import { B as L, j as c, k as o, o as d, l as x, I as z } from './index-qYY0KoZ1.js'
import { u as E } from './useDossier-CiPcwRKl.js'
import { aS as R, c6 as f, b9 as T, cc as I, aH as H } from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './tanstack-vendor-BZC-rs5U.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
const P = ['Asia', 'Europe', 'Africa', 'Americas', 'Oceania']
function B() {
  const { t: s, i18n: j } = F(),
    [m, g] = l.useState(''),
    [n, N] = l.useState('all'),
    [i, b] = l.useState('all'),
    { data: u, isLoading: v, isError: y, error: w } = E('country', 1, 1e3),
    a = l.useMemo(
      () =>
        u?.data
          ? u.data.filter((t) => {
              const r = t.extension_data,
                h = [t.name_en, t.name_ar, r?.iso2, r?.iso3]
                  .filter(Boolean)
                  .join(' ')
                  .toLowerCase()
                  .includes(m.toLowerCase()),
                _ = n === 'all' || r?.region === n,
                k = i === 'all' || t.status === i
              return h && _ && k
            })
          : [],
      [u, m, n, i],
    ),
    C = a.reduce((t, r) => {
      const h = r.extension_data?.agreements_count || 0
      return t + h
    }, 0),
    S = a.filter((t) => t.status === 'active').length,
    A = a.filter((t) => t.status === 'suspended').length,
    p = j.dir() === 'rtl'
  return v
    ? e.jsx('div', {
        className: 'flex min-h-96 items-center justify-center',
        children: e.jsx(R, { className: 'size-8 animate-spin text-primary' }),
      })
    : y
      ? e.jsxs('div', {
          className: 'flex min-h-96 flex-col items-center justify-center gap-4',
          children: [
            e.jsx(f, { className: 'size-12 text-destructive' }),
            e.jsxs('div', {
              className: 'text-center',
              children: [
                e.jsx('h2', {
                  className: 'text-xl font-semibold text-foreground',
                  children: s('countries.error.title', 'Failed to load countries'),
                }),
                e.jsx('p', {
                  className: 'text-sm text-muted-foreground',
                  children:
                    w?.message ||
                    s('countries.error.message', 'An error occurred while fetching data'),
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
                        children: s('countries.title', 'Countries overview'),
                      }),
                      e.jsx('p', {
                        className: 'text-base text-muted-foreground',
                        children: s(
                          'countries.subtitle',
                          'Monitor bilateral relationships, workflow status, and compliance posture across every partner state.',
                        ),
                      }),
                    ],
                  }),
                  e.jsxs(L, {
                    size: 'sm',
                    className: 'gap-2',
                    children: [
                      e.jsx(T, { className: 'size-4' }),
                      s('countries.actions.addCountry', 'Add new country'),
                    ],
                  }),
                ],
              }),
            }),
            e.jsxs('section', {
              className: 'grid gap-4 sm:grid-cols-2 2xl:grid-cols-3',
              children: [
                e.jsxs(c, {
                  children: [
                    e.jsxs(o, {
                      className: 'flex flex-row items-center justify-between',
                      children: [
                        e.jsx(d, {
                          className: 'text-sm font-semibold text-card-foreground',
                          children: s('countries.metrics.totalPartners', 'Active partners'),
                        }),
                        e.jsx(I, { className: 'size-5 text-primary' }),
                      ],
                    }),
                    e.jsxs(x, {
                      children: [
                        e.jsx('p', {
                          className: 'text-2xl font-bold text-foreground',
                          children: S,
                        }),
                        e.jsx('p', {
                          className: 'mt-2 text-sm text-muted-foreground',
                          children: s(
                            'countries.metrics.totalPartnersHint',
                            'Includes strategic and operational partnerships',
                          ),
                        }),
                      ],
                    }),
                  ],
                }),
                e.jsxs(c, {
                  children: [
                    e.jsxs(o, {
                      className: 'flex flex-row items-center justify-between',
                      children: [
                        e.jsx(d, {
                          className: 'text-sm font-semibold text-card-foreground',
                          children: s('countries.metrics.totalAgreements', 'Linked agreements'),
                        }),
                        e.jsx(H, { className: 'size-5 text-primary' }),
                      ],
                    }),
                    e.jsxs(x, {
                      children: [
                        e.jsx('p', {
                          className: 'text-2xl font-bold text-foreground',
                          children: C,
                        }),
                        e.jsx('p', {
                          className: 'mt-2 text-sm text-muted-foreground',
                          children: s(
                            'countries.metrics.totalAgreementsHint',
                            'Contracts and memoranda currently in force',
                          ),
                        }),
                      ],
                    }),
                  ],
                }),
                e.jsxs(c, {
                  children: [
                    e.jsxs(o, {
                      className: 'flex flex-row items-center justify-between',
                      children: [
                        e.jsx(d, {
                          className: 'text-sm font-semibold text-card-foreground',
                          children: s('countries.metrics.escalations', 'Escalations'),
                        }),
                        e.jsx(f, { className: 'size-5 text-destructive' }),
                      ],
                    }),
                    e.jsxs(x, {
                      children: [
                        e.jsx('p', {
                          className: 'text-2xl font-bold text-destructive',
                          children: A,
                        }),
                        e.jsx('p', {
                          className: 'mt-2 text-sm text-muted-foreground',
                          children: s(
                            'countries.metrics.escalationsHint',
                            'Partners pending compliance or data-sovereignty review',
                          ),
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            e.jsxs(c, {
              children: [
                e.jsx(o, {
                  children: e.jsx(d, {
                    children: s('countries.filters.title', 'Filters & search'),
                  }),
                }),
                e.jsxs(x, {
                  className: 'flex flex-col gap-4 lg:flex-row lg:items-end',
                  children: [
                    e.jsxs('div', {
                      className: 'flex-1',
                      children: [
                        e.jsx('label', {
                          className: 'mb-1 block text-sm font-medium text-foreground',
                          children: s('countries.filters.search', 'Search by name or ISO code'),
                        }),
                        e.jsx(z, {
                          value: m,
                          onChange: (t) => g(t.target.value),
                          placeholder: s(
                            'countries.filters.searchPlaceholder',
                            'e.g. AE, France, نيجيريا',
                          ),
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      children: [
                        e.jsx('label', {
                          className: 'mb-1 block text-sm font-medium text-foreground',
                          children: s('countries.filters.region', 'Region'),
                        }),
                        e.jsxs('select', {
                          value: n,
                          onChange: (t) => N(t.target.value),
                          className:
                            'w-48 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                          dir: p ? 'rtl' : 'ltr',
                          children: [
                            e.jsx('option', {
                              value: 'all',
                              children: s('countries.filters.allRegions', 'All regions'),
                            }),
                            P.map((t) => e.jsx('option', { value: t, children: t }, t)),
                          ],
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      children: [
                        e.jsx('label', {
                          className: 'mb-1 block text-sm font-medium text-foreground',
                          children: s('countries.filters.status', 'Status'),
                        }),
                        e.jsxs('select', {
                          value: i,
                          onChange: (t) => b(t.target.value),
                          className:
                            'w-44 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                          dir: p ? 'rtl' : 'ltr',
                          children: [
                            e.jsx('option', {
                              value: 'all',
                              children: s('countries.filters.allStatuses', 'All statuses'),
                            }),
                            e.jsx('option', {
                              value: 'active',
                              children: s('countries.status.active', 'Active'),
                            }),
                            e.jsx('option', {
                              value: 'inactive',
                              children: s('countries.status.inactive', 'Inactive'),
                            }),
                            e.jsx('option', {
                              value: 'suspended',
                              children: s('countries.status.suspended', 'Suspended'),
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
                          children: s('countries.table.country', 'Country'),
                        }),
                        e.jsx('th', {
                          className: 'px-5 py-3 text-start',
                          children: s('countries.table.iso', 'ISO codes'),
                        }),
                        e.jsx('th', {
                          className: 'px-5 py-3 text-start',
                          children: s('countries.table.region', 'Region'),
                        }),
                        e.jsx('th', {
                          className: 'px-5 py-3 text-start',
                          children: s('countries.table.status', 'Status'),
                        }),
                        e.jsx('th', {
                          className: 'px-5 py-3 text-start',
                          children: s('countries.table.agreements', 'Agreements'),
                        }),
                        e.jsx('th', {
                          className: 'px-5 py-3 text-start',
                          children: s('countries.table.updated', 'Last updated'),
                        }),
                      ],
                    }),
                  }),
                  e.jsxs('tbody', {
                    className: 'divide-y divide-border',
                    children: [
                      a.map((t) => {
                        const r = t.extension_data
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
                                      children: t.name_en,
                                    }),
                                    e.jsx('span', {
                                      className: 'text-xs text-muted-foreground',
                                      children: t.name_ar,
                                    }),
                                  ],
                                }),
                              }),
                              e.jsxs('td', {
                                className: 'px-5 py-4 font-mono text-sm text-foreground',
                                children: [r?.iso2 || '—', ' · ', r?.iso3 || '—'],
                              }),
                              e.jsx('td', {
                                className: 'px-5 py-4 text-muted-foreground',
                                children: r?.region || '—',
                              }),
                              e.jsx('td', {
                                className: 'px-5 py-4',
                                children: e.jsx('span', {
                                  className: `inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${t.status === 'active' ? 'bg-primary/10 text-primary' : t.status === 'inactive' ? 'bg-muted text-muted-foreground' : 'bg-destructive/10 text-destructive'}`,
                                  children: s(`countries.status.${t.status}`, t.status),
                                }),
                              }),
                              e.jsx('td', {
                                className: 'px-5 py-4 text-foreground',
                                children: r?.agreements_count || 0,
                              }),
                              e.jsx('td', {
                                className: 'px-5 py-4 text-xs text-muted-foreground',
                                children: new Date(t.updated_at).toLocaleDateString(),
                              }),
                            ],
                          },
                          t.id,
                        )
                      }),
                      a.length === 0 &&
                        e.jsx('tr', {
                          children: e.jsx('td', {
                            colSpan: 6,
                            className: 'px-5 py-8 text-center text-sm text-muted-foreground',
                            children: s(
                              'countries.table.empty',
                              'No countries match the current filters',
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
const W = B
export { W as component }
//# sourceMappingURL=countries-LL9sNDE3.js.map
