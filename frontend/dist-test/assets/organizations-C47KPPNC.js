import { u as w, r as o, j as e } from './react-vendor-Buoak6m3.js'
import { B as S, j as l, k as c, o as d, l as m, I as C } from './index-qYY0KoZ1.js'
import { b9 as k, aJ as E, aI as T, ce as A, aM as M, ca as P } from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './tanstack-vendor-BZC-rs5U.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
const O = [
    {
      id: 'mofa',
      name: 'Ministry of Foreign Affairs',
      type: 'government',
      country: 'Saudi Arabia',
      members: 360,
      activeProjects: 14,
      status: 'active',
      delegationExpires: '2025-12-31',
    },
    {
      id: 'mofa-ir',
      name: 'International Relations Department',
      type: 'government',
      parent: 'Ministry of Foreign Affairs',
      country: 'Saudi Arabia',
      members: 56,
      activeProjects: 7,
      status: 'active',
      delegationExpires: '2025-08-30',
    },
    {
      id: 'oecd',
      name: 'Organisation for Economic Co-operation and Development',
      type: 'international',
      country: 'Multilateral',
      members: 1800,
      activeProjects: 5,
      status: 'active',
      delegationExpires: '2026-01-15',
    },
    {
      id: 'escwa',
      name: 'United Nations ESCWA',
      type: 'international',
      country: 'Multilateral',
      members: 420,
      activeProjects: 3,
      status: 'active',
      delegationExpires: '2025-05-20',
    },
    {
      id: 'thinktank',
      name: 'Gulf Policy Think Tank',
      type: 'ngo',
      country: 'United Arab Emirates',
      members: 42,
      activeProjects: 2,
      status: 'inactive',
      delegationExpires: '2024-11-01',
    },
  ],
  u = { government: 'Government', ngo: 'NGO', international: 'International', private: 'Private' }
function F() {
  const { t: s, i18n: h } = w(),
    [x, g] = o.useState(''),
    [i, f] = o.useState('all'),
    [n, j] = o.useState('all'),
    a = o.useMemo(
      () =>
        O.filter((t) => {
          const r = [t.name, t.parent, t.country]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
              .includes(x.toLowerCase()),
            v = i === 'all' || t.type === i,
            z = n === 'all' || t.status === n
          return r && v && z
        }),
      [x, i, n],
    ),
    b = a.reduce((t, r) => t + r.members, 0),
    y = a.filter((t) => t.delegationExpires).length,
    N = new Set(a.filter((t) => !!t.parent).map((t) => t.parent)).size,
    p = h.dir() === 'rtl'
  return e.jsxs('div', {
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
                  children: s('organizations.title', 'Organizations & delegations'),
                }),
                e.jsx('p', {
                  className: 'text-base text-muted-foreground',
                  children: s(
                    'organizations.subtitle',
                    'Track hierarchies, delegation scopes, and project ownership across every partner organization.',
                  ),
                }),
              ],
            }),
            e.jsxs(S, {
              size: 'sm',
              className: 'gap-2',
              children: [
                e.jsx(k, { className: 'size-4' }),
                s('organizations.actions.addOrganization', 'Add organization'),
              ],
            }),
          ],
        }),
      }),
      e.jsxs('section', {
        className: 'grid gap-4 md:grid-cols-3',
        children: [
          e.jsxs(l, {
            children: [
              e.jsxs(c, {
                className: 'flex flex-row items-center justify-between',
                children: [
                  e.jsx(d, {
                    className: 'text-sm font-semibold text-card-foreground',
                    children: s('organizations.metrics.registered', 'Registered entities'),
                  }),
                  e.jsx(E, { className: 'size-5 text-primary' }),
                ],
              }),
              e.jsxs(m, {
                children: [
                  e.jsx('p', {
                    className: 'text-2xl font-bold text-foreground',
                    children: a.length,
                  }),
                  e.jsx('p', {
                    className: 'mt-2 text-sm text-muted-foreground',
                    children: s(
                      'organizations.metrics.registeredHint',
                      'Includes headquarters and sub-directorates',
                    ),
                  }),
                ],
              }),
            ],
          }),
          e.jsxs(l, {
            children: [
              e.jsxs(c, {
                className: 'flex flex-row items-center justify-between',
                children: [
                  e.jsx(d, {
                    className: 'text-sm font-semibold text-card-foreground',
                    children: s('organizations.metrics.members', 'Delegated members'),
                  }),
                  e.jsx(T, { className: 'size-5 text-primary' }),
                ],
              }),
              e.jsxs(m, {
                children: [
                  e.jsx('p', { className: 'text-2xl font-bold text-foreground', children: b }),
                  e.jsx('p', {
                    className: 'mt-2 text-sm text-muted-foreground',
                    children: s(
                      'organizations.metrics.membersHint',
                      'Mapped to Supabase auth roles with MFA enforced',
                    ),
                  }),
                ],
              }),
            ],
          }),
          e.jsxs(l, {
            children: [
              e.jsxs(c, {
                className: 'flex flex-row items-center justify-between',
                children: [
                  e.jsx(d, {
                    className: 'text-sm font-semibold text-card-foreground',
                    children: s('organizations.metrics.delegations', 'Active delegations'),
                  }),
                  e.jsx(A, { className: 'size-5 text-primary' }),
                ],
              }),
              e.jsxs(m, {
                children: [
                  e.jsx('p', { className: 'text-2xl font-bold text-foreground', children: y }),
                  e.jsxs('p', {
                    className: 'mt-2 text-sm text-muted-foreground',
                    children: [
                      s('organizations.metrics.delegationsHint', 'Expiring within 90 days: '),
                      e.jsx('span', { className: 'font-semibold', children: N }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      e.jsxs(l, {
        children: [
          e.jsx(c, {
            children: e.jsx(d, {
              children: s('organizations.filters.title', 'Filter organizations'),
            }),
          }),
          e.jsxs(m, {
            className: 'flex flex-col gap-4 lg:flex-row lg:items-end',
            children: [
              e.jsxs('div', {
                className: 'flex-1',
                children: [
                  e.jsx('label', {
                    className: 'mb-1 block text-sm font-medium text-foreground',
                    children: s('organizations.filters.search', 'Search by name or parent'),
                  }),
                  e.jsx(C, {
                    value: x,
                    onChange: (t) => g(t.target.value),
                    placeholder: s(
                      'organizations.filters.searchPlaceholder',
                      'e.g. Ministry, OECD, statistics',
                    ),
                  }),
                ],
              }),
              e.jsxs('div', {
                children: [
                  e.jsx('label', {
                    className: 'mb-1 block text-sm font-medium text-foreground',
                    children: s('organizations.filters.type', 'Type'),
                  }),
                  e.jsxs('select', {
                    value: i,
                    onChange: (t) => f(t.target.value),
                    className:
                      'w-48 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                    dir: p ? 'rtl' : 'ltr',
                    children: [
                      e.jsx('option', {
                        value: 'all',
                        children: s('organizations.filters.allTypes', 'All types'),
                      }),
                      Object.entries(u).map(([t, r]) =>
                        e.jsx(
                          'option',
                          { value: t, children: s(`organizations.types.${t}`, r) },
                          t,
                        ),
                      ),
                    ],
                  }),
                ],
              }),
              e.jsxs('div', {
                children: [
                  e.jsx('label', {
                    className: 'mb-1 block text-sm font-medium text-foreground',
                    children: s('organizations.filters.status', 'Status'),
                  }),
                  e.jsxs('select', {
                    value: n,
                    onChange: (t) => j(t.target.value),
                    className:
                      'w-40 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                    dir: p ? 'rtl' : 'ltr',
                    children: [
                      e.jsx('option', {
                        value: 'all',
                        children: s('organizations.filters.allStatuses', 'All statuses'),
                      }),
                      e.jsx('option', {
                        value: 'active',
                        children: s('organizations.status.active', 'Active'),
                      }),
                      e.jsx('option', {
                        value: 'inactive',
                        children: s('organizations.status.inactive', 'Inactive'),
                      }),
                      e.jsx('option', {
                        value: 'suspended',
                        children: s('organizations.status.suspended', 'Suspended'),
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
                  'bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                children: [
                  e.jsx('th', {
                    className: 'px-5 py-3 text-start',
                    children: s('organizations.table.organization', 'Organization'),
                  }),
                  e.jsx('th', {
                    className: 'px-5 py-3 text-start',
                    children: s('organizations.table.type', 'Type'),
                  }),
                  e.jsx('th', {
                    className: 'px-5 py-3 text-start',
                    children: s('organizations.table.country', 'Country'),
                  }),
                  e.jsx('th', {
                    className: 'px-5 py-3 text-start',
                    children: s('organizations.table.members', 'Members'),
                  }),
                  e.jsx('th', {
                    className: 'px-5 py-3 text-start',
                    children: s('organizations.table.projects', 'Active projects'),
                  }),
                  e.jsx('th', {
                    className: 'px-5 py-3 text-start',
                    children: s('organizations.table.delegation', 'Delegation expires'),
                  }),
                  e.jsx('th', {
                    className: 'px-5 py-3 text-start',
                    children: s('organizations.table.status', 'Status'),
                  }),
                ],
              }),
            }),
            e.jsxs('tbody', {
              className: 'divide-y divide-border',
              children: [
                a.map((t) =>
                  e.jsxs(
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
                                children: t.name,
                              }),
                              t.parent &&
                                e.jsxs('span', {
                                  className:
                                    'flex items-center gap-1 text-xs text-muted-foreground',
                                  children: [
                                    e.jsx(M, { className: 'size-3' }),
                                    s('organizations.table.parent', 'Parent'),
                                    ': ',
                                    t.parent,
                                  ],
                                }),
                            ],
                          }),
                        }),
                        e.jsx('td', {
                          className: 'px-5 py-4 text-muted-foreground',
                          children: s(`organizations.types.${t.type}`, u[t.type]),
                        }),
                        e.jsx('td', {
                          className: 'px-5 py-4 text-muted-foreground',
                          children: t.country,
                        }),
                        e.jsx('td', {
                          className: 'px-5 py-4 text-foreground',
                          children: t.members,
                        }),
                        e.jsx('td', {
                          className: 'px-5 py-4 text-foreground',
                          children: t.activeProjects,
                        }),
                        e.jsx('td', {
                          className: 'px-5 py-4 text-xs text-muted-foreground',
                          children: t.delegationExpires,
                        }),
                        e.jsx('td', {
                          className: 'px-5 py-4',
                          children: e.jsxs('span', {
                            className: `inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${t.status === 'active' ? 'bg-primary/10 text-primary' : t.status === 'inactive' ? 'bg-muted text-muted-foreground' : 'bg-destructive/10 text-destructive'}`,
                            children: [
                              e.jsx(P, { className: 'size-3' }),
                              s(`organizations.status.${t.status}`, t.status),
                            ],
                          }),
                        }),
                      ],
                    },
                    t.id,
                  ),
                ),
                a.length === 0 &&
                  e.jsx('tr', {
                    children: e.jsx('td', {
                      colSpan: 7,
                      className: 'px-5 py-8 text-center text-sm text-muted-foreground',
                      children: s(
                        'organizations.table.empty',
                        'No organizations match the selected filters',
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
const q = F
export { q as component }
//# sourceMappingURL=organizations-C47KPPNC.js.map
