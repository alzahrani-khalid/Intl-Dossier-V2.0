import { u as q, r as p, j as e } from './react-vendor-Buoak6m3.js'
import { i as I, a as P } from './tanstack-vendor-BZC-rs5U.js'
import {
  B as c,
  j as h,
  m as y,
  A as $,
  E as A,
  F,
  G as R,
  H as M,
  s as O,
} from './index-qYY0KoZ1.js'
import { T as Q } from './TriagePanel-DtLLfctd.js'
import { aW as b, b9 as W, bd as v, bw as B, bi as E } from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
import './useIntakeApi-84Q7PHHY.js'
function L() {
  const { t: a, i18n: w } = q(['common', 'intake']),
    l = w.language === 'ar',
    d = I(),
    [r, m] = p.useState([]),
    [k, x] = p.useState(!1),
    [f, j] = p.useState(null),
    { data: o, isLoading: u } = P({
      queryKey: ['intake-queue'],
      queryFn: async () => {
        const { data: s, error: t } = await O.from('intake_tickets')
          .select('*')
          .eq('status', 'submitted')
          .is('triaged_at', null)
          .order('created_at', { ascending: !0 })
        if (t) throw t
        return s || []
      },
      staleTime: 1 * 60 * 1e3,
    }),
    C = (s) => {
      switch (s) {
        case 'urgent':
          return 'destructive'
        case 'high':
          return 'default'
        case 'medium':
          return 'secondary'
        default:
          return 'outline'
      }
    },
    D = (s) => {
      if (!s) return { color: 'text-muted-foreground', icon: v, label: 'Not submitted' }
      const t = new Date(),
        g = new Date(s),
        i = (t.getTime() - g.getTime()) / (1e3 * 60 * 60)
      return i > 8
        ? { color: 'text-red-600', icon: B, label: `${Math.floor(i)}h waiting` }
        : i > 4
          ? { color: 'text-orange-600', icon: v, label: `${Math.floor(i)}h waiting` }
          : { color: 'text-green-600', icon: E, label: `${Math.floor(i)}h waiting` }
    },
    N = (s) => {
      ;(j(s), x(!0))
    },
    T = () => {
      ;(x(!1), j(null))
    },
    S = () => {
      ;(T(), m([]))
    }
  return e.jsxs('div', {
    className: 'min-h-screen bg-background',
    dir: l ? 'rtl' : 'ltr',
    children: [
      e.jsx('div', {
        className: 'border-b border-border bg-card',
        children: e.jsx('div', {
          className: 'container mx-auto p-4 sm:p-6 lg:px-8',
          children: e.jsxs('div', {
            className: 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
            children: [
              e.jsxs('div', {
                className: 'flex items-center gap-3',
                children: [
                  e.jsx('div', {
                    className:
                      'flex size-10 items-center justify-center rounded-lg bg-primary/10 sm:size-12',
                    children: e.jsx(b, { className: 'size-5 text-primary sm:size-6' }),
                  }),
                  e.jsxs('div', {
                    children: [
                      e.jsx('h1', {
                        className: 'text-xl font-bold text-foreground sm:text-2xl md:text-3xl',
                        children: a('navigation.intakeQueue', 'Intake Queue'),
                      }),
                      e.jsx('p', {
                        className: 'mt-1 text-sm text-muted-foreground',
                        children: a('intake.description', 'Review and classify incoming requests'),
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'flex flex-wrap items-center gap-2',
                children: [
                  e.jsxs(c, {
                    onClick: () => d({ to: '/intake/new' }),
                    size: 'sm',
                    className: 'min-h-9 gap-2',
                    children: [
                      e.jsx(W, { className: 'size-4' }),
                      e.jsx('span', {
                        className: 'hidden sm:inline',
                        children: a('intake.createNew', 'New Request'),
                      }),
                      e.jsx('span', { className: 'sm:hidden', children: '+' }),
                    ],
                  }),
                  e.jsx(c, {
                    variant: 'outline',
                    size: 'sm',
                    className: 'min-h-9',
                    children: a('common.filter', 'Filter'),
                  }),
                  r.length > 0 &&
                    e.jsxs(c, {
                      variant: 'secondary',
                      size: 'sm',
                      className: 'min-h-9',
                      onClick: () => N(r[0]),
                      children: [a('intake.classifySelected', 'Classify'), ' (', r.length, ')'],
                    }),
                ],
              }),
            ],
          }),
        }),
      }),
      e.jsxs('main', {
        className: 'container mx-auto space-y-4 px-4 py-6 sm:px-6 lg:px-8',
        children: [
          u &&
            e.jsx('div', {
              className: 'space-y-4',
              children: [1, 2, 3].map((s) =>
                e.jsxs(
                  h,
                  {
                    className: 'animate-pulse p-4',
                    children: [
                      e.jsx('div', { className: 'mb-3 h-6 w-3/4 rounded bg-muted' }),
                      e.jsx('div', { className: 'mb-2 h-4 w-full rounded bg-muted' }),
                      e.jsx('div', { className: 'h-4 w-2/3 rounded bg-muted' }),
                    ],
                  },
                  s,
                ),
              ),
            }),
          !u &&
            (!o || o.length === 0) &&
            e.jsxs(h, {
              className: 'p-8 text-center sm:p-12',
              children: [
                e.jsx(b, { className: 'mx-auto mb-4 size-12 text-muted-foreground sm:size-16' }),
                e.jsx('h3', {
                  className: 'mb-2 text-lg font-semibold text-foreground sm:text-xl',
                  children: a('intake.empty', 'No pending tickets'),
                }),
                e.jsx('p', {
                  className: 'text-sm text-muted-foreground',
                  children: a(
                    'intake.emptyDescription',
                    'All incoming requests have been processed',
                  ),
                }),
              ],
            }),
          !u &&
            o &&
            o.length > 0 &&
            e.jsx('div', {
              className: 'space-y-3',
              children: o.map((s) => {
                const t = D(s.submitted_at),
                  g = t.icon,
                  i = l ? s.title_ar : s.title,
                  z = l ? s.description_ar : s.description
                return e.jsx(
                  h,
                  {
                    className: 'group cursor-pointer p-4 transition-all hover:shadow-lg sm:p-6',
                    onClick: () => d({ to: `/intake/tickets/${s.id}` }),
                    children: e.jsxs('div', {
                      className: 'flex flex-col gap-4 sm:flex-row sm:items-start',
                      children: [
                        e.jsxs('div', {
                          className: 'flex flex-1 items-start gap-3',
                          children: [
                            e.jsx('input', {
                              type: 'checkbox',
                              checked: r.includes(s.id),
                              onChange: (n) => {
                                n.target.checked ? m([...r, s.id]) : m(r.filter((_) => _ !== s.id))
                              },
                              onClick: (n) => n.stopPropagation(),
                              className: 'mt-1 size-4 rounded border-border',
                            }),
                            e.jsxs('div', {
                              className: 'flex-1 space-y-2',
                              children: [
                                e.jsxs('div', {
                                  className: 'flex flex-wrap items-center gap-2',
                                  children: [
                                    e.jsx('h3', {
                                      className:
                                        'text-base font-semibold text-foreground transition-colors group-hover:text-primary sm:text-lg',
                                      children: i,
                                    }),
                                    e.jsx(y, { variant: C(s.priority), children: s.priority }),
                                    e.jsx(y, {
                                      variant: 'outline',
                                      className: 'text-xs',
                                      children: s.ticket_number,
                                    }),
                                  ],
                                }),
                                e.jsx('p', {
                                  className: 'line-clamp-2 text-sm text-muted-foreground',
                                  children: z,
                                }),
                                s.ai_suggestion &&
                                  e.jsxs('div', {
                                    className:
                                      'mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3',
                                    children: [
                                      e.jsxs('p', {
                                        className: 'mb-1 text-sm font-medium text-foreground',
                                        children: [
                                          '🤖 ',
                                          a('intake.aiSuggestion', 'AI Suggestion'),
                                        ],
                                      }),
                                      e.jsxs('p', {
                                        className: 'text-xs text-muted-foreground',
                                        children: [
                                          s.ai_suggestion.classification,
                                          ' (',
                                          Math.round(s.ai_suggestion.confidence * 100),
                                          '% confidence)',
                                        ],
                                      }),
                                    ],
                                  }),
                                e.jsxs('div', {
                                  className:
                                    'flex flex-wrap items-center gap-3 text-xs text-muted-foreground',
                                  children: [
                                    e.jsx('span', { children: s.source }),
                                    e.jsx('span', { children: '•' }),
                                    e.jsx('span', {
                                      children: new Date(s.created_at).toLocaleDateString(
                                        l ? 'ar-SA' : 'en-US',
                                      ),
                                    }),
                                    e.jsx('span', { children: '•' }),
                                    e.jsxs('div', {
                                      className: `flex items-center gap-1 ${t.color}`,
                                      children: [
                                        e.jsx(g, { className: 'size-3' }),
                                        e.jsx('span', { children: t.label }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                        e.jsxs('div', {
                          className: 'flex gap-2 sm:flex-col',
                          children: [
                            e.jsx(c, {
                              variant: 'outline',
                              size: 'sm',
                              className: 'min-h-9 flex-1 sm:flex-none',
                              onClick: (n) => {
                                ;(n.stopPropagation(), N(s.id))
                              },
                              children: a('intake.classify', 'Classify'),
                            }),
                            e.jsx(c, {
                              variant: 'ghost',
                              size: 'sm',
                              className: 'min-h-9 flex-1 sm:flex-none',
                              onClick: (n) => {
                                ;(n.stopPropagation(), d({ to: `/intake/tickets/${s.id}` }))
                              },
                              children: a('common.view', 'View'),
                            }),
                          ],
                        }),
                      ],
                    }),
                  },
                  s.id,
                )
              }),
            }),
        ],
      }),
      e.jsx($, {
        open: k,
        onOpenChange: x,
        children: e.jsxs(A, {
          className: 'max-h-[90vh] max-w-3xl overflow-y-auto',
          dir: l ? 'rtl' : 'ltr',
          children: [
            e.jsxs(F, {
              children: [
                e.jsx(R, {
                  className: 'text-xl sm:text-2xl',
                  children: a('intake.classifyTicket', 'Classify Ticket'),
                }),
                e.jsx(M, {
                  children: a(
                    'intake.classifyDescription',
                    'Review AI suggestions or manually classify this ticket',
                  ),
                }),
              ],
            }),
            f && e.jsx(Q, { ticketId: f, onSuccess: S }),
          ],
        }),
      }),
    ],
  })
}
const te = L
export { te as component }
//# sourceMappingURL=intake-DyU1_Bu7.js.map
