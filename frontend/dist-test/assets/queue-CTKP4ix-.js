import { u as q, r as j, j as e } from './react-vendor-Buoak6m3.js'
import { a as S } from './tanstack-vendor-BZC-rs5U.js'
import { c as F } from './supabase-client-CBUJ6sHP.js'
import {
  af as A,
  ag as T,
  j as l,
  k as m,
  o as u,
  l as n,
  q as f,
  r as N,
  t as y,
  v as b,
  w as a,
  B as v,
  m as h,
} from './index-qYY0KoZ1.js'
import { bw as P, c5 as z, bd as L } from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
const Q = F()
function E(t = {}) {
  return S({
    queryKey: ['assignment-queue', t],
    queryFn: async () => {
      const r = new URLSearchParams()
      ;(t.priority && r.append('priority', t.priority),
        t.work_item_type && r.append('work_item_type', t.work_item_type),
        t.unit_id && r.append('unit_id', t.unit_id),
        t.page && r.append('page', String(t.page)),
        t.page_size && r.append('page_size', String(t.page_size)))
      const { data: x, error: d } = await Q.functions.invoke('assignments-queue', {
        method: 'GET',
        ...(r.toString() && { body: Object.fromEntries(r) }),
      })
      if (d) throw new Error(d.message || 'Failed to fetch assignment queue')
      return x
    },
    enabled: !0,
    refetchInterval: 15e3,
  })
}
function I() {
  const { t } = q(),
    [r, x] = j.useState(),
    [d, g] = j.useState(),
    { data: i, isLoading: c, error: p } = E({ priority: r, work_item_type: d }),
    k = (s) => {
      const o = {
        urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      }
      return o[s] || o.normal
    },
    w = i?.items.filter((s) => s.priority === 'urgent').length || 0,
    _ = i?.items.filter((s) => s.priority === 'high').length || 0,
    C = i?.items.filter((s) => ['normal', 'low'].includes(s.priority)).length || 0
  return p
    ? e.jsx('div', {
        className: 'container mx-auto p-6',
        children: e.jsxs(A, {
          variant: 'destructive',
          children: [
            e.jsx(P, { className: 'size-4' }),
            e.jsx(T, {
              children:
                p.message || 'Failed to load queue. Edge Functions may not be deployed yet.',
            }),
          ],
        }),
      })
    : e.jsxs('div', {
        className: 'container mx-auto space-y-6 p-6',
        children: [
          e.jsxs('div', {
            children: [
              e.jsx('h1', { className: 'text-3xl font-bold', children: 'Assignment Queue' }),
              e.jsx('p', {
                className: 'mt-1 text-muted-foreground',
                children: 'Manage queued work items awaiting capacity',
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'grid grid-cols-1 gap-4 md:grid-cols-4',
            children: [
              e.jsxs(l, {
                children: [
                  e.jsx(m, {
                    className: 'pb-3',
                    children: e.jsx(u, {
                      className: 'text-sm font-medium text-muted-foreground',
                      children: 'Total Queued',
                    }),
                  }),
                  e.jsx(n, {
                    children: e.jsx('div', {
                      className: 'text-2xl font-bold',
                      children: c ? '...' : i?.total_count || 0,
                    }),
                  }),
                ],
              }),
              e.jsxs(l, {
                className: 'border-red-200 dark:border-red-800',
                children: [
                  e.jsx(m, {
                    className: 'pb-3',
                    children: e.jsx(u, {
                      className: 'text-sm font-medium text-red-700 dark:text-red-300',
                      children: 'Urgent',
                    }),
                  }),
                  e.jsx(n, {
                    children: e.jsx('div', {
                      className: 'text-2xl font-bold text-red-700 dark:text-red-300',
                      children: c ? '...' : w,
                    }),
                  }),
                ],
              }),
              e.jsxs(l, {
                className: 'border-orange-200 dark:border-orange-800',
                children: [
                  e.jsx(m, {
                    className: 'pb-3',
                    children: e.jsx(u, {
                      className: 'text-sm font-medium text-orange-700 dark:text-orange-300',
                      children: 'High',
                    }),
                  }),
                  e.jsx(n, {
                    children: e.jsx('div', {
                      className: 'text-2xl font-bold text-orange-700 dark:text-orange-300',
                      children: c ? '...' : _,
                    }),
                  }),
                ],
              }),
              e.jsxs(l, {
                children: [
                  e.jsx(m, {
                    className: 'pb-3',
                    children: e.jsx(u, {
                      className: 'text-sm font-medium text-muted-foreground',
                      children: 'Normal/Low',
                    }),
                  }),
                  e.jsx(n, {
                    children: e.jsx('div', {
                      className: 'text-2xl font-bold',
                      children: c ? '...' : C,
                    }),
                  }),
                ],
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'flex gap-4',
            children: [
              e.jsxs(f, {
                value: r,
                onValueChange: x,
                children: [
                  e.jsx(N, {
                    className: 'w-[180px]',
                    children: e.jsx(y, { placeholder: 'Filter by priority' }),
                  }),
                  e.jsxs(b, {
                    children: [
                      e.jsx(a, { value: 'all', children: 'All Priorities' }),
                      e.jsx(a, { value: 'urgent', children: 'Urgent' }),
                      e.jsx(a, { value: 'high', children: 'High' }),
                      e.jsx(a, { value: 'normal', children: 'Normal' }),
                      e.jsx(a, { value: 'low', children: 'Low' }),
                    ],
                  }),
                ],
              }),
              e.jsxs(f, {
                value: d,
                onValueChange: g,
                children: [
                  e.jsx(N, {
                    className: 'w-[180px]',
                    children: e.jsx(y, { placeholder: 'Filter by type' }),
                  }),
                  e.jsxs(b, {
                    children: [
                      e.jsx(a, { value: 'all', children: 'All Types' }),
                      e.jsx(a, { value: 'dossier', children: 'Dossier' }),
                      e.jsx(a, { value: 'ticket', children: 'Ticket' }),
                      e.jsx(a, { value: 'position', children: 'Position' }),
                      e.jsx(a, { value: 'task', children: 'Task' }),
                    ],
                  }),
                ],
              }),
              (r || d) &&
                e.jsx(v, {
                  variant: 'outline',
                  onClick: () => {
                    ;(x(void 0), g(void 0))
                  },
                  children: 'Clear Filters',
                }),
            ],
          }),
          e.jsxs('div', {
            className: 'space-y-4',
            children: [
              e.jsx('h2', { className: 'text-xl font-semibold', children: 'Queued Items' }),
              c
                ? e.jsx(l, {
                    children: e.jsx(n, {
                      className: 'p-6 text-center text-muted-foreground',
                      children: 'Loading queue...',
                    }),
                  })
                : i?.items && i.items.length > 0
                  ? i.items.map((s) =>
                      e.jsx(
                        l,
                        {
                          className: 'transition-shadow hover:shadow-md',
                          children: e.jsx(n, {
                            className: 'p-6',
                            children: e.jsxs('div', {
                              className: 'flex items-start justify-between',
                              children: [
                                e.jsxs('div', {
                                  className: 'flex-1',
                                  children: [
                                    e.jsxs('div', {
                                      className: 'mb-2 flex items-center gap-2',
                                      children: [
                                        e.jsx(h, {
                                          className: k(s.priority),
                                          children: s.priority,
                                        }),
                                        e.jsx(h, {
                                          variant: 'outline',
                                          children: s.work_item_type,
                                        }),
                                        e.jsxs(h, {
                                          variant: 'secondary',
                                          children: ['Position #', s.position],
                                        }),
                                      ],
                                    }),
                                    e.jsxs('p', {
                                      className: 'text-sm text-muted-foreground',
                                      children: ['Work Item: ', s.work_item_id],
                                    }),
                                    e.jsxs('p', {
                                      className: 'mt-1 text-sm text-muted-foreground',
                                      children: [
                                        'Queued: ',
                                        new Date(s.queued_at).toLocaleString(),
                                      ],
                                    }),
                                    s.required_skills &&
                                      s.required_skills.length > 0 &&
                                      e.jsxs('div', {
                                        className: 'mt-2',
                                        children: [
                                          e.jsx('p', {
                                            className: 'mb-1 text-xs text-muted-foreground',
                                            children: 'Required Skills:',
                                          }),
                                          e.jsx('div', {
                                            className: 'flex flex-wrap gap-1',
                                            children: s.required_skills.map((o) =>
                                              e.jsx(
                                                h,
                                                {
                                                  variant: 'outline',
                                                  className: 'text-xs',
                                                  children: o.skill_name_en,
                                                },
                                                o.skill_id,
                                              ),
                                            ),
                                          }),
                                        ],
                                      }),
                                  ],
                                }),
                                e.jsxs('div', {
                                  className: 'flex flex-col gap-2 text-end',
                                  children: [
                                    e.jsxs(v, {
                                      size: 'sm',
                                      className: 'gap-2',
                                      children: [e.jsx(z, { className: 'size-4' }), 'Assign'],
                                    }),
                                    s.attempts > 0 &&
                                      e.jsxs('p', {
                                        className: 'text-xs text-muted-foreground',
                                        children: [
                                          s.attempts,
                                          ' failed attempt',
                                          s.attempts > 1 ? 's' : '',
                                        ],
                                      }),
                                  ],
                                }),
                              ],
                            }),
                          }),
                        },
                        s.queue_id,
                      ),
                    )
                  : e.jsx(l, {
                      children: e.jsxs(n, {
                        className: 'p-6 text-center text-muted-foreground',
                        children: [
                          e.jsx(L, { className: 'mx-auto mb-2 size-12 text-blue-500' }),
                          e.jsx('p', { children: 'No items in queue' }),
                        ],
                      }),
                    }),
            ],
          }),
        ],
      })
}
const J = I
export { J as component }
//# sourceMappingURL=queue-CTKP4ix-.js.map
