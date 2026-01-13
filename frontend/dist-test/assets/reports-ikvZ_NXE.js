import { u as T, r as d, j as e } from './react-vendor-Buoak6m3.js'
import { d as E } from './tanstack-vendor-BZC-rs5U.js'
import {
  s as M,
  j as m,
  k as g,
  o as j,
  V as N,
  l as p,
  J as w,
  B as f,
  I as U,
} from './index-qYY0KoZ1.js'
import {
  aH as b,
  cb as C,
  aR as H,
  aS as A,
  bP as D,
  bS as I,
  bd as L,
} from './vendor-misc-BiJvMP0A.js'
import { H as q } from './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function B() {
  const { t: s, i18n: S } = T(),
    [l, k] = d.useState(null),
    [u, R] = d.useState('pdf'),
    [i, o] = d.useState({}),
    [y, z] = d.useState([])
  S.language
  const x = [
      {
        id: 'country-overview',
        name: s('reports.templates.countryOverview'),
        description: s('reports.templates.countryOverviewDesc'),
        icon: e.jsx(b, { className: 'h-8 w-8' }),
        formats: ['pdf', 'excel'],
        parameters: [
          {
            name: 'country',
            type: 'select',
            label: s('reports.parameters.country'),
            options: [
              { value: 'all', label: s('common.all') },
              { value: 'sa', label: 'Saudi Arabia' },
              { value: 'ae', label: 'UAE' },
              { value: 'eg', label: 'Egypt' },
            ],
          },
          { name: 'dateRange', type: 'date', label: s('reports.parameters.dateRange') },
        ],
      },
      {
        id: 'mou-status',
        name: s('reports.templates.mouStatus'),
        description: s('reports.templates.mouStatusDesc'),
        icon: e.jsx(C, { className: 'h-8 w-8' }),
        formats: ['excel', 'pdf'],
        parameters: [
          {
            name: 'status',
            type: 'multiselect',
            label: s('reports.parameters.status'),
            options: [
              { value: 'active', label: s('mous.statuses.active') },
              { value: 'expired', label: s('mous.statuses.expired') },
              { value: 'draft', label: s('mous.statuses.draft') },
            ],
          },
          {
            name: 'includeExpiring',
            type: 'select',
            label: s('reports.parameters.includeExpiring'),
            options: [
              { value: 'yes', label: s('common.yes') },
              { value: 'no', label: s('common.no') },
            ],
          },
        ],
      },
      {
        id: 'event-summary',
        name: s('reports.templates.eventSummary'),
        description: s('reports.templates.eventSummaryDesc'),
        icon: e.jsx(H, { className: 'h-8 w-8' }),
        formats: ['pdf', 'word'],
        parameters: [
          {
            name: 'period',
            type: 'select',
            label: s('reports.parameters.period'),
            options: [
              { value: 'month', label: s('reports.periods.thisMonth') },
              { value: 'quarter', label: s('reports.periods.thisQuarter') },
              { value: 'year', label: s('reports.periods.thisYear') },
            ],
          },
        ],
      },
      {
        id: 'intelligence-digest',
        name: s('reports.templates.intelligenceDigest'),
        description: s('reports.templates.intelligenceDigestDesc'),
        icon: e.jsx(b, { className: 'h-8 w-8' }),
        formats: ['pdf'],
        parameters: [
          {
            name: 'confidenceLevel',
            type: 'select',
            label: s('reports.parameters.confidenceLevel'),
            options: [
              { value: 'all', label: s('common.all') },
              { value: 'high', label: s('intelligence.confidence.high') },
              { value: 'verified', label: s('intelligence.confidence.verified') },
            ],
          },
          {
            name: 'classification',
            type: 'select',
            label: s('reports.parameters.classification'),
            options: [
              { value: 'public', label: s('intelligence.classification.public') },
              { value: 'internal', label: s('intelligence.classification.internal') },
            ],
          },
        ],
      },
      {
        id: 'organization-profile',
        name: s('reports.templates.organizationProfile'),
        description: s('reports.templates.organizationProfileDesc'),
        icon: e.jsx(C, { className: 'h-8 w-8' }),
        formats: ['pdf', 'excel'],
        parameters: [
          {
            name: 'organization',
            type: 'select',
            label: s('reports.parameters.organization'),
            options: [
              { value: 'all', label: s('common.all') },
              { value: 'gov', label: s('organizations.types.government') },
              { value: 'ngo', label: s('organizations.types.ngo') },
              { value: 'private', label: s('organizations.types.private') },
            ],
          },
        ],
      },
      {
        id: 'executive-dashboard',
        name: s('reports.templates.executiveDashboard'),
        description: s('reports.templates.executiveDashboardDesc'),
        icon: e.jsx(b, { className: 'h-8 w-8' }),
        formats: ['pdf'],
        parameters: [
          {
            name: 'period',
            type: 'select',
            label: s('reports.parameters.reportPeriod'),
            options: [
              { value: 'weekly', label: s('reports.periods.weekly') },
              { value: 'monthly', label: s('reports.periods.monthly') },
              { value: 'quarterly', label: s('reports.periods.quarterly') },
            ],
          },
        ],
      },
    ],
    h = E({
      mutationFn: async ({ templateId: a, format: t, params: r }) => {
        const { data: c, error: n } = await M.functions.invoke('reports', {
          body: { template: a, format: t, parameters: r },
        })
        if (n) throw n
        return c
      },
      onSuccess: (a) => {
        z((t) => [
          {
            id: crypto.randomUUID(),
            name: x.find((r) => r.id === l)?.name,
            format: u,
            status: 'completed',
            url: a.url,
            createdAt: new Date(),
          },
          ...t,
        ])
      },
    }),
    F = () => {
      l && h.mutate({ templateId: l, format: u, params: i })
    },
    v = x.find((a) => a.id === l)
  return e.jsxs('div', {
    className: 'container mx-auto py-6',
    children: [
      e.jsx('div', {
        className: 'flex justify-between items-center mb-6',
        children: e.jsx('h1', {
          className: 'text-3xl font-bold',
          children: s('navigation.reports'),
        }),
      }),
      e.jsxs('div', {
        className: 'grid gap-6 md:grid-cols-3',
        children: [
          e.jsxs('div', {
            className: 'md:col-span-2',
            children: [
              e.jsxs(m, {
                children: [
                  e.jsxs(g, {
                    children: [
                      e.jsx(j, { children: s('reports.selectTemplate') }),
                      e.jsx(N, { children: s('reports.selectTemplateDesc') }),
                    ],
                  }),
                  e.jsx(p, {
                    children: e.jsx('div', {
                      className: 'grid gap-4 md:grid-cols-2',
                      children: x.map((a) =>
                        e.jsx(
                          m,
                          {
                            className: `cursor-pointer transition-all hover:shadow-md ${l === a.id ? 'ring-2 ring-primary' : ''}`,
                            onClick: () => {
                              ;(k(a.id), o({}))
                            },
                            children: e.jsx(p, {
                              className: 'p-4',
                              children: e.jsxs('div', {
                                className: 'flex items-start gap-4',
                                children: [
                                  e.jsx('div', { className: 'text-primary', children: a.icon }),
                                  e.jsxs('div', {
                                    className: 'flex-1',
                                    children: [
                                      e.jsx('h3', { className: 'font-semibold', children: a.name }),
                                      e.jsx('p', {
                                        className: 'text-sm text-muted-foreground mt-1',
                                        children: a.description,
                                      }),
                                      e.jsx('div', {
                                        className: 'flex gap-2 mt-2',
                                        children: a.formats.map((t) =>
                                          e.jsx(
                                            'span',
                                            {
                                              className:
                                                'inline-flex items-center px-2 py-1 bg-muted rounded text-xs',
                                              children: t.toUpperCase(),
                                            },
                                            t,
                                          ),
                                        ),
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            }),
                          },
                          a.id,
                        ),
                      ),
                    }),
                  }),
                ],
              }),
              l &&
                v &&
                e.jsxs(m, {
                  className: 'mt-6',
                  children: [
                    e.jsxs(g, {
                      children: [
                        e.jsx(j, { children: s('reports.parameters') }),
                        e.jsx(N, { children: s('reports.parametersDesc') }),
                      ],
                    }),
                    e.jsx(p, {
                      children: e.jsxs('div', {
                        className: 'space-y-4',
                        children: [
                          e.jsxs('div', {
                            children: [
                              e.jsx(w, { children: s('reports.format') }),
                              e.jsx('div', {
                                className: 'flex gap-2 mt-2',
                                children: v.formats.map((a) =>
                                  e.jsx(
                                    f,
                                    {
                                      variant: u === a ? 'default' : 'outline',
                                      size: 'sm',
                                      onClick: () => R(a),
                                      children: a.toUpperCase(),
                                    },
                                    a,
                                  ),
                                ),
                              }),
                            ],
                          }),
                          v.parameters.map((a) =>
                            e.jsxs(
                              'div',
                              {
                                children: [
                                  e.jsx(w, { children: a.label }),
                                  a.type === 'date'
                                    ? e.jsx(U, {
                                        type: 'date',
                                        value: i[a.name] || '',
                                        onChange: (t) =>
                                          o((r) => ({ ...r, [a.name]: t.target.value })),
                                        className: 'mt-2',
                                      })
                                    : a.type === 'select'
                                      ? e.jsxs('select', {
                                          value: i[a.name] || '',
                                          onChange: (t) =>
                                            o((r) => ({ ...r, [a.name]: t.target.value })),
                                          className:
                                            'mt-2 w-full rounded-md border border-input bg-background px-3 py-2',
                                          children: [
                                            e.jsx('option', {
                                              value: '',
                                              children: s('common.select'),
                                            }),
                                            a.options?.map((t) =>
                                              e.jsx(
                                                'option',
                                                { value: t.value, children: t.label },
                                                t.value,
                                              ),
                                            ),
                                          ],
                                        })
                                      : e.jsx('div', {
                                          className: 'mt-2 space-y-2',
                                          children: a.options?.map((t) =>
                                            e.jsxs(
                                              'label',
                                              {
                                                className: 'flex items-center gap-2',
                                                children: [
                                                  e.jsx('input', {
                                                    type: 'checkbox',
                                                    checked: (i[a.name] || []).includes(t.value),
                                                    onChange: (r) => {
                                                      const c = i[a.name] || []
                                                      r.target.checked
                                                        ? o((n) => ({
                                                            ...n,
                                                            [a.name]: [...c, t.value],
                                                          }))
                                                        : o((n) => ({
                                                            ...n,
                                                            [a.name]: c.filter(
                                                              (P) => P !== t.value,
                                                            ),
                                                          }))
                                                    },
                                                  }),
                                                  t.label,
                                                ],
                                              },
                                              t.value,
                                            ),
                                          ),
                                        }),
                                ],
                              },
                              a.name,
                            ),
                          ),
                          e.jsx(f, {
                            className: 'w-full',
                            onClick: F,
                            disabled: h.isPending,
                            children: h.isPending
                              ? e.jsxs(e.Fragment, {
                                  children: [
                                    e.jsx(A, { className: 'h-4 w-4 me-2 animate-spin' }),
                                    s('reports.generating'),
                                  ],
                                })
                              : e.jsxs(e.Fragment, {
                                  children: [
                                    e.jsx(D, { className: 'h-4 w-4 me-2' }),
                                    s('reports.generateReport'),
                                  ],
                                }),
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
            ],
          }),
          e.jsx('div', {
            children: e.jsxs(m, {
              children: [
                e.jsx(g, { children: e.jsx(j, { children: s('reports.recentReports') }) }),
                e.jsx(p, {
                  children:
                    y.length === 0
                      ? e.jsx('p', {
                          className: 'text-sm text-muted-foreground',
                          children: s('reports.noRecentReports'),
                        })
                      : e.jsx('div', {
                          className: 'space-y-3',
                          children: y.map((a) =>
                            e.jsxs(
                              'div',
                              {
                                className: 'flex items-center justify-between p-3 border rounded',
                                children: [
                                  e.jsxs('div', {
                                    className: 'flex-1',
                                    children: [
                                      e.jsx('div', {
                                        className: 'font-medium text-sm',
                                        children: a.name,
                                      }),
                                      e.jsxs('div', {
                                        className: 'flex items-center gap-2 mt-1',
                                        children: [
                                          e.jsx('span', {
                                            className: 'text-xs text-muted-foreground',
                                            children: q(a.createdAt, 'dd MMM HH:mm'),
                                          }),
                                          e.jsx('span', {
                                            className: 'text-xs px-2 py-0.5 bg-muted rounded',
                                            children: a.format.toUpperCase(),
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  e.jsx('div', {
                                    className: 'flex items-center gap-2',
                                    children:
                                      a.status === 'completed'
                                        ? e.jsxs(e.Fragment, {
                                            children: [
                                              e.jsx(I, { className: 'h-4 w-4 text-green-600' }),
                                              e.jsx(f, {
                                                size: 'sm',
                                                variant: 'ghost',
                                                asChild: !0,
                                                children: e.jsx('a', {
                                                  href: a.url,
                                                  download: !0,
                                                  children: e.jsx(D, { className: 'h-4 w-4' }),
                                                }),
                                              }),
                                            ],
                                          })
                                        : e.jsx(L, {
                                            className: 'h-4 w-4 text-yellow-600 animate-pulse',
                                          }),
                                  }),
                                ],
                              },
                              a.id,
                            ),
                          ),
                        }),
                }),
              ],
            }),
          }),
        ],
      }),
    ],
  })
}
const Z = B
export { Z as component }
//# sourceMappingURL=reports-ikvZ_NXE.js.map
