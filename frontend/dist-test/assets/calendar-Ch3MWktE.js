import { u as b, r as y, j as e } from './react-vendor-Buoak6m3.js'
import { a as L, L as z } from './tanstack-vendor-BZC-rs5U.js'
import {
  s as _,
  j as u,
  B as o,
  q as $,
  r as I,
  t as O,
  v as P,
  w as d,
  m as R,
  l as B,
} from './index-qYY0KoZ1.js'
import { aL as F, aM as q, bd as K, aR as U, b9 as V } from './vendor-misc-BiJvMP0A.js'
import {
  K as A,
  L as H,
  M as Q,
  H as h,
  O as G,
  N as J,
  T as W,
  S as X,
} from './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function Y(a) {
  const {
    data: p,
    isLoading: t,
    error: i,
    refetch: r,
  } = L({
    queryKey: ['calendar-events', a],
    queryFn: async () => {
      const n = new URLSearchParams()
      ;(a?.start_date && n.append('start_date', a.start_date),
        a?.end_date && n.append('end_date', a.end_date),
        a?.event_type && n.append('event_type', a.event_type),
        a?.dossier_id && n.append('dossier_id', a.dossier_id),
        a?.status && n.append('status', a.status))
      const {
        data: { session: m },
      } = await _.auth.getSession()
      if (!m) throw new Error('Not authenticated')
      const x = await fetch(`${_.supabaseUrl}/functions/v1/calendar-get?${n.toString()}`, {
        headers: { Authorization: `Bearer ${m.access_token}`, 'Content-Type': 'application/json' },
      })
      if (!x.ok) {
        const j = await x.json()
        throw new Error(j.error || 'Failed to fetch calendar events')
      }
      return await x.json()
    },
    staleTime: 12e4,
  })
  return {
    events: p?.entries || [],
    totalCount: p?.total_count || 0,
    isLoading: t,
    error: i,
    refetch: r,
  }
}
function Z({ linkedItemType: a, linkedItemId: p }) {
  const { t, i18n: i } = b(),
    r = i.language === 'ar',
    [n, m] = y.useState(new Date()),
    [x, w] = y.useState(void 0),
    j = A(n),
    g = H(n),
    {
      events: v,
      isLoading: M,
      error: C,
    } = Y({
      start_date: j.toISOString(),
      end_date: g.toISOString(),
      entry_type: x,
      linked_item_type: a,
    }),
    S = y.useMemo(() => Q({ start: j, end: g }), [j, g]),
    k = y.useMemo(() => {
      const s = new Map()
      return (
        v.forEach((f) => {
          const c = h(new Date(f.start_datetime), 'yyyy-MM-dd')
          ;(s.has(c) || s.set(c, []), s.get(c)?.push(f))
        }),
        s
      )
    }, [v]),
    E = () => {
      m(W(n))
    },
    T = () => {
      m(X(n, 1))
    },
    D = () => {
      m(new Date())
    }
  return M
    ? e.jsx(u, {
        className: 'p-8 text-center',
        children: e.jsx('p', { className: 'text-muted-foreground', children: t('common.loading') }),
      })
    : C
      ? e.jsx(u, {
          className: 'p-8 text-center',
          children: e.jsx('p', {
            className: 'text-destructive',
            children: t('errors.failed_to_load'),
          }),
        })
      : e.jsxs('div', {
          className: 'flex flex-col gap-4',
          dir: r ? 'rtl' : 'ltr',
          children: [
            e.jsx(u, {
              className: 'p-4',
              children: e.jsxs('div', {
                className:
                  'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4',
                children: [
                  e.jsxs('div', {
                    className: 'flex items-center gap-2 w-full sm:w-auto',
                    children: [
                      e.jsx(o, {
                        variant: 'outline',
                        size: 'sm',
                        onClick: E,
                        className: r ? 'rotate-180' : '',
                        children: e.jsx(F, { className: 'h-4 w-4' }),
                      }),
                      e.jsx('h2', {
                        className: 'text-base sm:text-lg font-semibold flex-1 text-center',
                        children: h(n, 'MMMM yyyy'),
                      }),
                      e.jsx(o, {
                        variant: 'outline',
                        size: 'sm',
                        onClick: T,
                        className: r ? 'rotate-180' : '',
                        children: e.jsx(q, { className: 'h-4 w-4' }),
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'flex flex-col sm:flex-row gap-2 w-full sm:w-auto',
                    children: [
                      e.jsx(o, {
                        variant: 'outline',
                        size: 'sm',
                        onClick: D,
                        className: 'w-full sm:w-auto',
                        children: t('calendar.today'),
                      }),
                      e.jsxs($, {
                        value: x,
                        onValueChange: (s) => w(s === 'all' ? void 0 : s),
                        children: [
                          e.jsx(I, {
                            className: 'w-full sm:w-48',
                            children: e.jsx(O, { placeholder: t('calendar.all_types') }),
                          }),
                          e.jsxs(P, {
                            children: [
                              e.jsx(d, { value: 'all', children: t('calendar.all_types') }),
                              e.jsx(d, {
                                value: 'internal_meeting',
                                children: t('calendar.types.internal_meeting'),
                              }),
                              e.jsx(d, {
                                value: 'deadline',
                                children: t('calendar.types.deadline'),
                              }),
                              e.jsx(d, {
                                value: 'reminder',
                                children: t('calendar.types.reminder'),
                              }),
                              e.jsx(d, { value: 'holiday', children: t('calendar.types.holiday') }),
                              e.jsx(d, {
                                value: 'training',
                                children: t('calendar.types.training'),
                              }),
                              e.jsx(d, { value: 'review', children: t('calendar.types.review') }),
                              e.jsx(d, { value: 'other', children: t('calendar.types.other') }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            }),
            e.jsxs(u, {
              className: 'p-2 sm:p-4',
              children: [
                e.jsx('div', {
                  className: 'grid grid-cols-7 gap-1 sm:gap-2 mb-2',
                  children: [0, 1, 2, 3, 4, 5, 6].map((s) =>
                    e.jsx(
                      'div',
                      {
                        className:
                          'text-center text-xs sm:text-sm font-medium text-muted-foreground py-2',
                        children: h(new Date(2024, 0, s + 1), 'EEE'),
                      },
                      s,
                    ),
                  ),
                }),
                e.jsx('div', {
                  className: 'grid grid-cols-7 gap-1 sm:gap-2',
                  children: S.map((s) => {
                    const f = h(s, 'yyyy-MM-dd'),
                      c = k.get(f) || [],
                      N = G(s, new Date())
                    return e.jsx(
                      'div',
                      {
                        className: `
 min-h-16 sm:min-h-24 p-1 sm:p-2 border rounded-lg
 ${J(s, n) ? '' : 'opacity-40'}
 ${N ? 'border-primary bg-primary/5' : 'border-border'}
 `,
                        children: e.jsxs('div', {
                          className: 'flex flex-col h-full',
                          children: [
                            e.jsx('div', {
                              className: `
 text-xs sm:text-sm font-medium mb-1
 ${N ? 'text-primary' : 'text-foreground'}
 `,
                              children: h(s, 'd'),
                            }),
                            e.jsxs('div', {
                              className: 'flex-1 overflow-y-auto space-y-1',
                              children: [
                                c
                                  .slice(0, 3)
                                  .map((l) =>
                                    e.jsx(
                                      'div',
                                      {
                                        className:
                                          'text-xs px-1 py-0.5 rounded bg-accent hover:bg-accent/80 cursor-pointer truncate',
                                        title: r
                                          ? l.title_ar || l.title_en
                                          : l.title_en || l.title_ar,
                                        children: e.jsxs('div', {
                                          className: 'flex items-center gap-1',
                                          children: [
                                            e.jsx(K, {
                                              className: 'h-2 w-2 sm:h-3 sm:w-3 shrink-0',
                                            }),
                                            e.jsx('span', {
                                              className: 'truncate',
                                              children: r
                                                ? l.title_ar || l.title_en
                                                : l.title_en || l.title_ar,
                                            }),
                                          ],
                                        }),
                                      },
                                      l.id,
                                    ),
                                  ),
                                c.length > 3 &&
                                  e.jsxs('div', {
                                    className: 'text-xs text-muted-foreground ps-1',
                                    children: ['+', c.length - 3, ' ', t('calendar.more')],
                                  }),
                              ],
                            }),
                          ],
                        }),
                      },
                      f,
                    )
                  }),
                }),
              ],
            }),
            e.jsxs('div', {
              className: 'sm:hidden',
              children: [
                e.jsx('h3', {
                  className: 'text-sm font-semibold mb-2',
                  children: t('calendar.upcoming_events'),
                }),
                e.jsx('div', {
                  className: 'flex flex-col gap-2',
                  children: v
                    .slice(0, 5)
                    .map((s) =>
                      e.jsx(
                        u,
                        {
                          className: 'p-3',
                          children: e.jsxs('div', {
                            className: 'flex justify-between items-start gap-2',
                            children: [
                              e.jsxs('div', {
                                className: 'flex-1 min-w-0',
                                children: [
                                  e.jsx('h4', {
                                    className: 'font-medium text-sm truncate',
                                    children: r
                                      ? s.title_ar || s.title_en
                                      : s.title_en || s.title_ar,
                                  }),
                                  e.jsx('p', {
                                    className: 'text-xs text-muted-foreground',
                                    children: h(new Date(s.start_datetime), 'PPp'),
                                  }),
                                ],
                              }),
                              e.jsx(R, {
                                variant: 'outline',
                                className: 'shrink-0 text-xs',
                                children: t(`calendar.types.${s.entry_type}`),
                              }),
                            ],
                          }),
                        },
                        s.id,
                      ),
                    ),
                }),
              ],
            }),
          ],
        })
}
function oe() {
  const { t: a, i18n: p } = b('dossiers'),
    t = p.language === 'ar',
    [i, r] = y.useState('month')
  return e.jsxs('div', {
    className: 'container mx-auto px-4 sm:px-6 lg:px-8 py-6',
    dir: t ? 'rtl' : 'ltr',
    children: [
      e.jsx('div', {
        className: 'mb-6',
        children: e.jsxs('div', {
          className: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
          children: [
            e.jsxs('div', {
              children: [
                e.jsxs('h1', {
                  className: 'text-2xl sm:text-3xl font-bold text-start flex items-center gap-2',
                  children: [
                    e.jsx(U, { className: 'h-6 w-6 sm:h-7 sm:w-7' }),
                    a('calendar.page.title'),
                  ],
                }),
                e.jsx('p', {
                  className: 'text-sm sm:text-base text-muted-foreground mt-1 text-start',
                  children: a('calendar.page.description'),
                }),
              ],
            }),
            e.jsx('div', {
              className: 'flex gap-2',
              children: e.jsx(z, {
                to: '/calendar/new',
                children: e.jsxs(o, {
                  className: 'w-full sm:w-auto',
                  children: [
                    e.jsx(V, { className: 'h-4 w-4 me-2' }),
                    a('calendar.page.create_event'),
                  ],
                }),
              }),
            }),
          ],
        }),
      }),
      e.jsx(u, {
        className: 'mb-6',
        children: e.jsx(B, {
          className: 'pt-6',
          children: e.jsxs('div', {
            className: 'flex items-center gap-2 justify-center sm:justify-start',
            children: [
              e.jsx(o, {
                variant: i === 'month' ? 'default' : 'outline',
                size: 'sm',
                onClick: () => r('month'),
                children: a('calendar.view_mode.month'),
              }),
              e.jsx(o, {
                variant: i === 'week' ? 'default' : 'outline',
                size: 'sm',
                onClick: () => r('week'),
                children: a('calendar.view_mode.week'),
              }),
              e.jsx(o, {
                variant: i === 'day' ? 'default' : 'outline',
                size: 'sm',
                onClick: () => r('day'),
                children: a('calendar.view_mode.day'),
              }),
            ],
          }),
        }),
      }),
      e.jsx(Z, { viewMode: i }),
    ],
  })
}
export { oe as component }
//# sourceMappingURL=calendar-Ch3MWktE.js.map
