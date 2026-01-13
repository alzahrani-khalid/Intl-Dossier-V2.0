import { u as f, j as e } from './react-vendor-Buoak6m3.js'
import { a as y, i as b } from './tanstack-vendor-BZC-rs5U.js'
import { c as p } from './supabase-client-CBUJ6sHP.js'
import { af as N, ag as _, j as d, k as c, o, l, m } from './index-qYY0KoZ1.js'
import { bw as v, bd as k, bi as w } from './vendor-misc-BiJvMP0A.js'
const A = p()
function C(t = {}) {
  return y({
    queryKey: ['my-assignments', t],
    queryFn: async () => {
      const i = new URLSearchParams()
      ;(t.status && i.append('status', t.status),
        t.include_completed !== void 0 &&
          i.append('include_completed', String(t.include_completed)))
      const { data: r, error: a } = await A.functions.invoke('assignments-my-assignments', {
        method: 'GET',
        ...(i.toString() && { body: Object.fromEntries(i) }),
      })
      if (a) throw new Error(a.message || 'Failed to fetch my assignments')
      return r
    },
    enabled: !0,
    refetchInterval: 3e4,
  })
}
function D() {
  const { t } = f('assignments'),
    i = b(),
    { data: r, isLoading: a, error: x } = C(),
    h = (s) => {
      i({ to: `/tasks/${s.id}` })
    },
    u = (s) => {
      if (s < 0) return t('sla_breached')
      const n = Math.floor(s / 3600),
        j = Math.floor((s % 3600) / 60)
      return n > 24 ? `${Math.floor(n / 24)}d ${n % 24}h` : `${n}h ${j}m`
    },
    g = (s) => {
      const n = {
        urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      }
      return n[s] || n.normal
    }
  return x
    ? e.jsx('div', {
        className: 'container mx-auto p-6',
        children: e.jsxs(N, {
          variant: 'destructive',
          children: [
            e.jsx(v, { className: 'size-4' }),
            e.jsx(_, {
              children:
                x.message || 'Failed to load assignments. Edge Functions may not be deployed yet.',
            }),
          ],
        }),
      })
    : e.jsxs('div', {
        className: 'container mx-auto space-y-6 p-6',
        children: [
          e.jsxs('div', {
            children: [
              e.jsx('h1', { className: 'text-3xl font-bold', children: t('my_assignments') }),
              e.jsx('p', {
                className: 'mt-1 text-muted-foreground',
                children: t('my_assignments_description'),
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'grid grid-cols-1 gap-4 md:grid-cols-3',
            children: [
              e.jsxs(d, {
                children: [
                  e.jsx(c, {
                    className: 'pb-3',
                    children: e.jsx(o, {
                      className: 'text-sm font-medium text-muted-foreground',
                      children: 'Total Active',
                    }),
                  }),
                  e.jsx(l, {
                    children: e.jsx('div', {
                      className: 'text-2xl font-bold',
                      children: a ? '...' : r?.summary.active_count || 0,
                    }),
                  }),
                ],
              }),
              e.jsxs(d, {
                className: 'border-yellow-200 dark:border-yellow-800',
                children: [
                  e.jsx(c, {
                    className: 'pb-3',
                    children: e.jsx(o, {
                      className: 'text-sm font-medium text-yellow-700 dark:text-yellow-300',
                      children: 'At Risk (75%+ SLA)',
                    }),
                  }),
                  e.jsx(l, {
                    children: e.jsx('div', {
                      className: 'text-2xl font-bold text-yellow-700 dark:text-yellow-300',
                      children: a ? '...' : r?.summary.at_risk_count || 0,
                    }),
                  }),
                ],
              }),
              e.jsxs(d, {
                className: 'border-red-200 dark:border-red-800',
                children: [
                  e.jsx(c, {
                    className: 'pb-3',
                    children: e.jsx(o, {
                      className: 'text-sm font-medium text-red-700 dark:text-red-300',
                      children: 'SLA Breached',
                    }),
                  }),
                  e.jsx(l, {
                    children: e.jsx('div', {
                      className: 'text-2xl font-bold text-red-700 dark:text-red-300',
                      children: a ? '...' : r?.summary.breached_count || 0,
                    }),
                  }),
                ],
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'space-y-4',
            children: [
              e.jsx('h2', { className: 'text-xl font-semibold', children: 'Active Assignments' }),
              a
                ? e.jsx(d, {
                    children: e.jsx(l, {
                      className: 'p-6 text-center text-muted-foreground',
                      children: 'Loading assignments...',
                    }),
                  })
                : r?.assignments && r.assignments.length > 0
                  ? r.assignments.map((s) =>
                      e.jsx(
                        d,
                        {
                          className: 'cursor-pointer transition-shadow hover:shadow-md',
                          onClick: () => h(s),
                          children: e.jsx(l, {
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
                                        e.jsx(m, {
                                          className: g(s.priority),
                                          children: s.priority,
                                        }),
                                        e.jsx(m, {
                                          variant: 'outline',
                                          children: s.work_item_type,
                                        }),
                                        s.escalated_at &&
                                          e.jsx(m, {
                                            variant: 'destructive',
                                            children: 'Escalated',
                                          }),
                                      ],
                                    }),
                                    e.jsx('h3', {
                                      className: 'mb-1 text-lg font-semibold',
                                      children: s.work_item_title || s.work_item_id,
                                    }),
                                    e.jsxs('p', {
                                      className: 'mt-1 text-sm text-muted-foreground',
                                      children: [
                                        'Assigned: ',
                                        new Date(s.assigned_at).toLocaleString(),
                                      ],
                                    }),
                                  ],
                                }),
                                e.jsxs('div', {
                                  className: 'text-end',
                                  children: [
                                    e.jsxs('div', {
                                      className: 'flex items-center justify-end gap-2',
                                      children: [
                                        e.jsx(k, {
                                          className: `size-4 ${s.time_remaining_seconds < 0 ? 'text-red-500' : s.warning_sent_at ? 'text-yellow-500' : 'text-green-500'}`,
                                        }),
                                        e.jsx('span', {
                                          className: `font-semibold ${s.time_remaining_seconds < 0 ? 'text-red-500' : s.warning_sent_at ? 'text-yellow-500' : 'text-green-500'}`,
                                          children: u(s.time_remaining_seconds),
                                        }),
                                      ],
                                    }),
                                    e.jsxs('p', {
                                      className: 'mt-1 text-xs text-muted-foreground',
                                      children: [
                                        'Due: ',
                                        new Date(s.sla_deadline).toLocaleString(),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          }),
                        },
                        s.id,
                      ),
                    )
                  : e.jsx(d, {
                      children: e.jsxs(l, {
                        className: 'p-6 text-center text-muted-foreground',
                        children: [
                          e.jsx(w, { className: 'mx-auto mb-2 size-12 text-green-500' }),
                          e.jsx('p', { children: 'No active assignments' }),
                        ],
                      }),
                    }),
            ],
          }),
        ],
      })
}
export { D as M }
//# sourceMappingURL=MyAssignments-Dhhp18mM.js.map
