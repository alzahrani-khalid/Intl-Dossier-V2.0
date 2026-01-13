import { u as o, r as p, j as e } from './react-vendor-Buoak6m3.js'
import { a0 as d, m as r, j as i, s as m } from './index-qYY0KoZ1.js'
import { a as x, L as h } from './tanstack-vendor-BZC-rs5U.js'
import { bd as u, bS as g, cL as j } from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
const v = 'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1'
async function f() {
  const {
      data: { session: s },
    } = await m.auth.getSession(),
    t = await fetch(`${v}/positions-list?status=under_review`, {
      headers: { Authorization: `Bearer ${s?.access_token}`, 'Content-Type': 'application/json' },
    })
  if (!t.ok) throw new Error('Failed to fetch approvals')
  return (await t.json()).data || []
}
function P() {
  const { t: s } = o(),
    [t, l] = p.useState('pending'),
    { data: n, isLoading: c } = x({
      queryKey: ['approvals', 'my', t],
      queryFn: f,
      staleTime: 30 * 1e3,
    })
  return c
    ? e.jsxs('div', {
        className: 'container mx-auto py-6 space-y-4',
        children: [e.jsx(d, { className: 'h-8 w-64' }), e.jsx(d, { className: 'h-96' })],
      })
    : e.jsxs('div', {
        className: 'container mx-auto py-6 space-y-6',
        children: [
          e.jsxs('div', {
            className: 'flex items-center justify-between',
            children: [
              e.jsxs('div', {
                children: [
                  e.jsx('h1', {
                    className: 'text-3xl font-bold',
                    children: s('approvals.myApprovals', 'My Approvals'),
                  }),
                  e.jsx('p', {
                    className: 'text-muted-foreground',
                    children: s('approvals.subtitle', 'Positions pending your review and approval'),
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'flex gap-2',
                children: [
                  e.jsx(r, {
                    variant: t === 'all' ? 'default' : 'outline',
                    className: 'cursor-pointer',
                    onClick: () => l('all'),
                    children: s('approvals.filter.all', 'All'),
                  }),
                  e.jsx(r, {
                    variant: t === 'pending' ? 'default' : 'outline',
                    className: 'cursor-pointer',
                    onClick: () => l('pending'),
                    children: s('approvals.filter.pending', 'Pending'),
                  }),
                  e.jsx(r, {
                    variant: t === 'completed' ? 'default' : 'outline',
                    className: 'cursor-pointer',
                    onClick: () => l('completed'),
                    children: s('approvals.filter.completed', 'Completed'),
                  }),
                ],
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'grid grid-cols-1 md:grid-cols-3 gap-4',
            children: [
              e.jsx(i, {
                className: 'p-4',
                children: e.jsxs('div', {
                  className: 'flex items-center gap-4',
                  children: [
                    e.jsx('div', {
                      className: 'p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg',
                      children: e.jsx(u, {
                        className: 'h-6 w-6 text-yellow-600 dark:text-yellow-400',
                      }),
                    }),
                    e.jsxs('div', {
                      children: [
                        e.jsx('p', { className: 'text-2xl font-bold', children: n?.length || 0 }),
                        e.jsx('p', {
                          className: 'text-sm text-muted-foreground',
                          children: s('approvals.stats.pending', 'Pending'),
                        }),
                      ],
                    }),
                  ],
                }),
              }),
              e.jsx(i, {
                className: 'p-4',
                children: e.jsxs('div', {
                  className: 'flex items-center gap-4',
                  children: [
                    e.jsx('div', {
                      className: 'p-3 bg-green-100 dark:bg-green-900 rounded-lg',
                      children: e.jsx(g, {
                        className: 'h-6 w-6 text-green-600 dark:text-green-400',
                      }),
                    }),
                    e.jsxs('div', {
                      children: [
                        e.jsx('p', { className: 'text-2xl font-bold', children: '0' }),
                        e.jsx('p', {
                          className: 'text-sm text-muted-foreground',
                          children: s('approvals.stats.approved', 'Approved This Month'),
                        }),
                      ],
                    }),
                  ],
                }),
              }),
              e.jsx(i, {
                className: 'p-4',
                children: e.jsxs('div', {
                  className: 'flex items-center gap-4',
                  children: [
                    e.jsx('div', {
                      className: 'p-3 bg-red-100 dark:bg-red-900 rounded-lg',
                      children: e.jsx(j, { className: 'h-6 w-6 text-red-600 dark:text-red-400' }),
                    }),
                    e.jsxs('div', {
                      children: [
                        e.jsx('p', { className: 'text-2xl font-bold', children: '0' }),
                        e.jsx('p', {
                          className: 'text-sm text-muted-foreground',
                          children: s('approvals.stats.rejected', 'Returned for Revisions'),
                        }),
                      ],
                    }),
                  ],
                }),
              }),
            ],
          }),
          e.jsx(i, {
            className: 'p-6',
            children:
              n && n.length > 0
                ? e.jsx('div', {
                    className: 'space-y-4',
                    children: n.map((a) =>
                      e.jsx(
                        h,
                        {
                          to: '/positions/$id',
                          params: { id: a.id },
                          className:
                            'block p-4 border rounded-lg hover:border-primary transition-colors',
                          children: e.jsxs('div', {
                            className: 'flex items-center justify-between',
                            children: [
                              e.jsxs('div', {
                                className: 'flex-1',
                                children: [
                                  e.jsxs('div', {
                                    className: 'flex items-center gap-3 mb-2',
                                    children: [
                                      e.jsx('h3', {
                                        className: 'font-semibold',
                                        children: a.title_en,
                                      }),
                                      e.jsxs(r, {
                                        variant: 'secondary',
                                        children: [
                                          s('approvals.stage', 'Stage'),
                                          ' ',
                                          a.current_stage,
                                        ],
                                      }),
                                    ],
                                  }),
                                  e.jsx('p', {
                                    className: 'text-sm text-muted-foreground',
                                    children: a.title_ar,
                                  }),
                                  e.jsxs('p', {
                                    className: 'text-xs text-muted-foreground mt-2',
                                    children: [
                                      s('approvals.submittedBy', 'Submitted by'),
                                      ': ',
                                      a.author_id,
                                    ],
                                  }),
                                ],
                              }),
                              e.jsxs('div', {
                                className: 'flex flex-col items-end gap-2',
                                children: [
                                  e.jsx(r, {
                                    children:
                                      a.thematic_category ||
                                      s('approvals.uncategorized', 'Uncategorized'),
                                  }),
                                  e.jsx('span', {
                                    className: 'text-xs text-muted-foreground',
                                    children: new Date(a.created_at).toLocaleDateString(),
                                  }),
                                ],
                              }),
                            ],
                          }),
                        },
                        a.id,
                      ),
                    ),
                  })
                : e.jsx('div', {
                    className: 'text-center py-12',
                    children: e.jsx('p', {
                      className: 'text-lg text-muted-foreground',
                      children: s('approvals.noPositions', 'No positions pending your approval'),
                    }),
                  }),
          }),
        ],
      })
}
export { P as component }
//# sourceMappingURL=index-Db_JYnFI.js.map
