import { u as M, r as h, j as e } from './react-vendor-Buoak6m3.js'
import { a as R } from './tanstack-vendor-BZC-rs5U.js'
import {
  af as F,
  ag as T,
  c as u,
  ah as z,
  ai as B,
  B as H,
  aj as I,
  ak as P,
  q as V,
  r as q,
  t as U,
  v as O,
  w as k,
  j as r,
  k as l,
  o as d,
  l as c,
  Z as W,
  _ as G,
  $ as j,
  aa as f,
  V as p,
  s as K,
} from './index-qYY0KoZ1.js'
import { aA as C, aR as Q, bm as Z, aH as J, aI as X, be as Y } from './vendor-misc-BiJvMP0A.js'
import { H as w } from './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function ee() {
  const { t: a, i18n: $ } = M('assignments'),
    A = $.language === 'ar',
    [n, D] = h.useState({ start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3), end: new Date() }),
    [_, E] = h.useState('day'),
    [g] = h.useState(''),
    [b] = h.useState(''),
    {
      data: t,
      isLoading: i,
      error: L,
    } = R({
      queryKey: ['escalation-report', n, _, g, b],
      queryFn: async () => {
        const s = new URLSearchParams({
          start_date: n.start.toISOString(),
          end_date: n.end.toISOString(),
          group_by: _,
        })
        ;(g && s.append('unit_id', g), b && s.append('work_item_type', b))
        const {
          data: { session: m },
        } = await K.auth.getSession()
        if (!m?.access_token) throw new Error('Not authenticated')
        const x = await fetch(
          `https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/escalations-report?${s}`,
          { headers: { Authorization: `Bearer ${m.access_token}` } },
        )
        if (!x.ok) throw new Error('Failed to fetch escalation report')
        return x.json()
      },
      refetchInterval: 6e4,
    }),
    o = h.useMemo(() => {
      if (!t?.time_series || t.time_series.length < 2) return null
      const s = Math.floor(t.time_series.length / 2),
        m = t.time_series.slice(0, s),
        x = t.time_series.slice(s),
        S = m.reduce((y, N) => y + N.count, 0) / m.length,
        v = ((x.reduce((y, N) => y + N.count, 0) / x.length - S) / S) * 100
      return {
        direction: v > 5 ? 'up' : v < -5 ? 'down' : 'stable',
        percentage: Math.abs(v).toFixed(1),
      }
    }, [t?.time_series])
  return L
    ? e.jsxs(F, {
        variant: 'destructive',
        children: [
          e.jsx(C, { className: 'h-4 w-4' }),
          e.jsx(T, { children: a('escalation_dashboard.error_loading') }),
        ],
      })
    : e.jsxs('div', {
        className: u('space-y-6', A && 'rtl'),
        children: [
          e.jsxs('div', {
            className: 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
            children: [
              e.jsxs('div', {
                children: [
                  e.jsx('h1', {
                    className: 'text-3xl font-bold tracking-tight',
                    children: a('escalation_dashboard.title'),
                  }),
                  e.jsx('p', {
                    className: 'text-muted-foreground',
                    children: a('escalation_dashboard.description'),
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'flex flex-wrap gap-2',
                children: [
                  e.jsxs(z, {
                    children: [
                      e.jsx(B, {
                        asChild: !0,
                        children: e.jsxs(H, {
                          variant: 'outline',
                          className: u(
                            'justify-start text-start font-normal',
                            !n && 'text-muted-foreground',
                          ),
                          children: [
                            e.jsx(Q, { className: 'me-2 h-4 w-4' }),
                            n.start && n.end
                              ? e.jsxs(e.Fragment, {
                                  children: [w(n.start, 'MMM dd'), ' - ', w(n.end, 'MMM dd, yyyy')],
                                })
                              : e.jsx('span', {
                                  children: a('escalation_dashboard.select_date_range'),
                                }),
                          ],
                        }),
                      }),
                      e.jsx(I, {
                        className: 'w-auto p-0',
                        align: 'start',
                        children: e.jsx(P, {
                          mode: 'range',
                          selected: { from: n.start, to: n.end },
                          onSelect: (s) => {
                            s?.from && s?.to && D({ start: s.from, end: s.to })
                          },
                          initialFocus: !0,
                        }),
                      }),
                    ],
                  }),
                  e.jsxs(V, {
                    value: _,
                    onValueChange: (s) => E(s),
                    children: [
                      e.jsx(q, { className: 'w-32', children: e.jsx(U, {}) }),
                      e.jsxs(O, {
                        children: [
                          e.jsx(k, {
                            value: 'day',
                            children: a('escalation_dashboard.group_by_day'),
                          }),
                          e.jsx(k, {
                            value: 'week',
                            children: a('escalation_dashboard.group_by_week'),
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'grid gap-4 md:grid-cols-2 lg:grid-cols-4',
            children: [
              e.jsxs(r, {
                children: [
                  e.jsxs(l, {
                    className: 'flex flex-row items-center justify-between space-y-0 pb-2',
                    children: [
                      e.jsx(d, {
                        className: 'text-sm font-medium',
                        children: a('escalation_dashboard.total_escalations'),
                      }),
                      e.jsx(C, { className: 'h-4 w-4 text-destructive' }),
                    ],
                  }),
                  e.jsxs(c, {
                    children: [
                      e.jsx('div', {
                        className: 'text-2xl font-bold',
                        children: i ? '...' : t?.summary.total_escalations.toLocaleString(),
                      }),
                      e.jsx('p', {
                        className: 'text-xs text-muted-foreground mt-1',
                        children:
                          !i &&
                          o &&
                          e.jsxs('span', {
                            className: u(
                              'flex items-center gap-1',
                              o.direction === 'up' && 'text-destructive',
                              o.direction === 'down' && 'text-green-600',
                            ),
                            children: [
                              o.direction === 'up' ? '↑' : o.direction === 'down' ? '↓' : '→',
                              o.percentage,
                              '% ',
                              a('escalation_dashboard.from_previous_period'),
                            ],
                          }),
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs(r, {
                children: [
                  e.jsxs(l, {
                    className: 'flex flex-row items-center justify-between space-y-0 pb-2',
                    children: [
                      e.jsx(d, {
                        className: 'text-sm font-medium',
                        children: a('escalation_dashboard.avg_per_day'),
                      }),
                      e.jsx(Z, { className: 'h-4 w-4 text-muted-foreground' }),
                    ],
                  }),
                  e.jsx(c, {
                    children: e.jsx('div', {
                      className: 'text-2xl font-bold',
                      children: i ? '...' : t?.summary.avg_escalations_per_day.toFixed(1),
                    }),
                  }),
                ],
              }),
              e.jsxs(r, {
                children: [
                  e.jsxs(l, {
                    className: 'flex flex-row items-center justify-between space-y-0 pb-2',
                    children: [
                      e.jsx(d, {
                        className: 'text-sm font-medium',
                        children: a('escalation_dashboard.most_common_reason'),
                      }),
                      e.jsx(J, { className: 'h-4 w-4 text-muted-foreground' }),
                    ],
                  }),
                  e.jsx(c, {
                    children: e.jsx('div', {
                      className: 'text-lg font-medium',
                      children: i
                        ? '...'
                        : a(`escalation_dashboard.reason.${t?.summary.most_common_reason}`),
                    }),
                  }),
                ],
              }),
              e.jsxs(r, {
                children: [
                  e.jsxs(l, {
                    className: 'flex flex-row items-center justify-between space-y-0 pb-2',
                    children: [
                      e.jsx(d, {
                        className: 'text-sm font-medium',
                        children: a('escalation_dashboard.affected_assignments'),
                      }),
                      e.jsx(X, { className: 'h-4 w-4 text-muted-foreground' }),
                    ],
                  }),
                  e.jsx(c, {
                    children: e.jsx('div', {
                      className: 'text-2xl font-bold',
                      children: i ? '...' : t?.summary.affected_assignments.toLocaleString(),
                    }),
                  }),
                ],
              }),
            ],
          }),
          e.jsxs(W, {
            defaultValue: 'timeline',
            className: 'space-y-4',
            children: [
              e.jsxs(G, {
                children: [
                  e.jsx(j, { value: 'timeline', children: a('escalation_dashboard.timeline') }),
                  e.jsx(j, { value: 'units', children: a('escalation_dashboard.by_unit') }),
                  e.jsx(j, { value: 'staff', children: a('escalation_dashboard.by_staff') }),
                  e.jsx(j, {
                    value: 'work_type',
                    children: a('escalation_dashboard.by_work_type'),
                  }),
                ],
              }),
              e.jsx(f, {
                value: 'timeline',
                className: 'space-y-4',
                children: e.jsxs(r, {
                  children: [
                    e.jsxs(l, {
                      children: [
                        e.jsx(d, { children: a('escalation_dashboard.escalation_timeline') }),
                        e.jsx(p, {
                          children: a('escalation_dashboard.escalation_timeline_description'),
                        }),
                      ],
                    }),
                    e.jsx(c, {
                      children: i
                        ? e.jsx('div', {
                            className: 'h-64 flex items-center justify-center',
                            children: e.jsx('p', {
                              className: 'text-muted-foreground',
                              children: a('common.loading'),
                            }),
                          })
                        : e.jsx('div', {
                            className: 'space-y-2',
                            children: t?.time_series.map((s) =>
                              e.jsxs(
                                'div',
                                {
                                  className:
                                    'flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors',
                                  children: [
                                    e.jsx('div', {
                                      className: 'w-24 text-sm font-medium',
                                      children: w(new Date(s.date), 'MMM dd'),
                                    }),
                                    e.jsx('div', {
                                      className: 'flex-1',
                                      children: e.jsx('div', {
                                        className:
                                          'h-6 bg-destructive/20 rounded-full overflow-hidden',
                                        style: {
                                          width: `${Math.min(100, (s.count / (t.summary.total_escalations / t.time_series.length)) * 100)}%`,
                                        },
                                        children: e.jsx('div', {
                                          className: 'h-full bg-destructive rounded-full',
                                        }),
                                      }),
                                    }),
                                    e.jsx('div', {
                                      className: 'w-12 text-end font-semibold',
                                      children: s.count,
                                    }),
                                  ],
                                },
                                s.date,
                              ),
                            ),
                          }),
                    }),
                  ],
                }),
              }),
              e.jsx(f, {
                value: 'units',
                className: 'space-y-4',
                children: e.jsxs(r, {
                  children: [
                    e.jsxs(l, {
                      children: [
                        e.jsx(d, { children: a('escalation_dashboard.by_unit') }),
                        e.jsx(p, { children: a('escalation_dashboard.by_unit_description') }),
                      ],
                    }),
                    e.jsx(c, {
                      children: e.jsx('div', {
                        className: 'space-y-3',
                        children: i
                          ? e.jsx('p', {
                              className: 'text-muted-foreground',
                              children: a('common.loading'),
                            })
                          : t?.by_unit.map((s) =>
                              e.jsxs(
                                'div',
                                {
                                  className: 'flex items-center gap-4',
                                  children: [
                                    e.jsxs('div', {
                                      className: 'flex-1',
                                      children: [
                                        e.jsx('div', {
                                          className: 'font-medium',
                                          children: s.unit_name,
                                        }),
                                        e.jsxs('div', {
                                          className: 'text-sm text-muted-foreground',
                                          children: [
                                            s.escalation_count,
                                            ' ',
                                            a('escalation_dashboard.escalations'),
                                            ' (',
                                            s.percentage.toFixed(1),
                                            '%)',
                                          ],
                                        }),
                                      ],
                                    }),
                                    e.jsx('div', {
                                      className: 'h-2 bg-destructive rounded-full',
                                      style: { width: `${s.percentage}%`, minWidth: '20px' },
                                    }),
                                  ],
                                },
                                s.unit_id,
                              ),
                            ),
                      }),
                    }),
                  ],
                }),
              }),
              e.jsx(f, {
                value: 'staff',
                className: 'space-y-4',
                children: e.jsxs(r, {
                  children: [
                    e.jsxs(l, {
                      children: [
                        e.jsx(d, { children: a('escalation_dashboard.by_staff') }),
                        e.jsx(p, { children: a('escalation_dashboard.by_staff_description') }),
                      ],
                    }),
                    e.jsx(c, {
                      children: e.jsx('div', {
                        className: 'space-y-3',
                        children: i
                          ? e.jsx('p', {
                              className: 'text-muted-foreground',
                              children: a('common.loading'),
                            })
                          : t?.by_assignee.slice(0, 10).map((s) =>
                              e.jsxs(
                                'div',
                                {
                                  className:
                                    'flex items-center justify-between p-3 rounded-lg hover:bg-muted/50',
                                  children: [
                                    e.jsxs('div', {
                                      children: [
                                        e.jsx('div', {
                                          className: 'font-medium',
                                          children: s.assignee_name,
                                        }),
                                        e.jsxs('div', {
                                          className: 'text-sm text-muted-foreground',
                                          children: [
                                            s.escalation_count,
                                            ' / ',
                                            s.total_assignments,
                                            ' ',
                                            a('escalation_dashboard.assignments'),
                                          ],
                                        }),
                                      ],
                                    }),
                                    e.jsxs('div', {
                                      className: u(
                                        'text-sm font-semibold px-2 py-1 rounded',
                                        s.escalation_rate > 20 &&
                                          'bg-destructive/20 text-destructive',
                                        s.escalation_rate <= 20 &&
                                          s.escalation_rate > 10 &&
                                          'bg-yellow-500/20 text-yellow-700',
                                        s.escalation_rate <= 10 && 'bg-green-500/20 text-green-700',
                                      ),
                                      children: [s.escalation_rate.toFixed(1), '%'],
                                    }),
                                  ],
                                },
                                s.assignee_id,
                              ),
                            ),
                      }),
                    }),
                  ],
                }),
              }),
              e.jsx(f, {
                value: 'work_type',
                className: 'space-y-4',
                children: e.jsxs(r, {
                  children: [
                    e.jsxs(l, {
                      children: [
                        e.jsx(d, { children: a('escalation_dashboard.by_work_type') }),
                        e.jsx(p, { children: a('escalation_dashboard.by_work_type_description') }),
                      ],
                    }),
                    e.jsx(c, {
                      children: e.jsx('div', {
                        className: 'space-y-3',
                        children: i
                          ? e.jsx('p', {
                              className: 'text-muted-foreground',
                              children: a('common.loading'),
                            })
                          : t?.by_work_type.map((s) =>
                              e.jsxs(
                                'div',
                                {
                                  className: 'flex items-center gap-4',
                                  children: [
                                    e.jsxs('div', {
                                      className: 'flex-1',
                                      children: [
                                        e.jsx('div', {
                                          className: 'font-medium capitalize',
                                          children: s.work_item_type,
                                        }),
                                        e.jsxs('div', {
                                          className: 'text-sm text-muted-foreground',
                                          children: [
                                            s.escalation_count,
                                            ' ',
                                            a('escalation_dashboard.escalations'),
                                            ' (',
                                            s.percentage.toFixed(1),
                                            '%)',
                                          ],
                                        }),
                                      ],
                                    }),
                                    e.jsx('div', {
                                      className: 'h-2 bg-destructive rounded-full',
                                      style: { width: `${s.percentage}%`, minWidth: '20px' },
                                    }),
                                  ],
                                },
                                s.work_item_type,
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
function se() {
  const { t: a } = M()
  return e.jsxs('div', {
    className: 'container mx-auto space-y-6 p-6',
    children: [
      e.jsx('div', {
        className: 'flex items-center justify-between',
        children: e.jsxs('div', {
          children: [
            e.jsx('h1', {
              className: 'text-3xl font-bold',
              children: a('assignments.escalations.title'),
            }),
            e.jsx('p', {
              className: 'mt-1 text-muted-foreground',
              children: a('assignments.escalations.description'),
            }),
          ],
        }),
      }),
      e.jsxs(F, {
        children: [
          e.jsx(Y, { className: 'size-4' }),
          e.jsx(T, { children: a('assignments.escalations.info') }),
        ],
      }),
      e.jsx(ee, {}),
    ],
  })
}
const he = se
export { he as component }
//# sourceMappingURL=escalations-CZYw-SbF.js.map
