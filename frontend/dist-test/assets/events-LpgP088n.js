import { u as I, r as m, j as e } from './react-vendor-Buoak6m3.js'
import { a as L } from './tanstack-vendor-BZC-rs5U.js'
import { B as x, j as h, k as O, o as V, l as f, I as F, s as q } from './index-qYY0KoZ1.js'
import {
  aR as B,
  cv as P,
  b9 as R,
  cG as K,
  cj as G,
  aJ as J,
  cN as Q,
  aI as U,
} from './vendor-misc-BiJvMP0A.js'
import { K as w, L as b, M as W, N as A, H as u, O as X } from './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function Y() {
  const { t, i18n: _ } = I(),
    [c, k] = m.useState(''),
    [p, v] = m.useState('calendar'),
    [i, $] = m.useState(new Date()),
    [d, C] = m.useState('all'),
    l = _.language === 'ar',
    { data: o, isLoading: N } = L({
      queryKey: ['events', c, d, i],
      queryFn: async () => {
        let a = q
          .from('event_details')
          .select('*')
          .gte('start_datetime', w(i).toISOString())
          .lte('start_datetime', b(i).toISOString())
          .order('start_datetime', { ascending: !0 })
        ;(c && (a = a.or(`title_en.ilike.%${c}%,title_ar.ilike.%${c}%`)),
          d !== 'all' && (a = a.eq('type', d)))
        const { data: s, error: r } = await a
        if (r) throw r
        return s
      },
    }),
    S = () => {
      const a = w(i),
        s = b(i),
        r = W({ start: a, end: s }),
        D = (n) => o?.filter((g) => X(new Date(g.start_datetime), n)) || [],
        E = {
          meeting: 'bg-blue-500',
          conference: 'bg-purple-500',
          workshop: 'bg-green-500',
          training: 'bg-yellow-500',
          ceremony: 'bg-pink-500',
          other: 'bg-gray-500',
        }
      return e.jsxs('div', {
        className: 'grid grid-cols-7 gap-1',
        children: [
          ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((n) =>
            e.jsx(
              'div',
              {
                className: 'p-2 text-center font-semibold text-sm',
                children: t(`calendar.${n.toLowerCase()}`),
              },
              n,
            ),
          ),
          r.map((n, g) => {
            const j = D(n),
              z = A(n, i)
            return e.jsxs(
              h,
              {
                className: `min-h-[100px] p-2 cursor-pointer hover:shadow-md transition-shadow ${z ? '' : 'opacity-50'}`,
                onClick: () => $(n),
                children: [
                  e.jsx('div', { className: 'font-semibold text-sm mb-1', children: u(n, 'd') }),
                  e.jsxs('div', {
                    className: 'space-y-1',
                    children: [
                      j.slice(0, 3).map((y, H) =>
                        e.jsx(
                          'div',
                          {
                            className: `text-xs p-1 rounded text-white truncate ${E[y.type]}`,
                            children: l ? y.title_ar : y.title_en,
                          },
                          H,
                        ),
                      ),
                      j.length > 3 &&
                        e.jsxs('div', {
                          className: 'text-xs text-muted-foreground',
                          children: ['+', j.length - 3, ' ', t('events.more')],
                        }),
                    ],
                  }),
                ],
              },
              g,
            )
          }),
        ],
      })
    },
    T = () => {
      const a = [
        {
          key: 'title',
          header: t('events.eventName'),
          cell: (s) =>
            e.jsx('div', {
              className: `font-medium ${l ? 'text-end' : 'text-start'}`,
              children: l ? s.title_ar : s.title_en,
            }),
        },
        {
          key: 'type',
          header: t('events.eventType'),
          cell: (s) =>
            e.jsx('span', {
              className: `
 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
 ${s.type === 'meeting' ? 'bg-blue-100 text-blue-800' : ''}
 ${s.type === 'conference' ? 'bg-purple-100 text-purple-800' : ''}
 ${s.type === 'workshop' ? 'bg-green-100 text-green-800' : ''}
 ${s.type === 'training' ? 'bg-yellow-100 text-yellow-800' : ''}
 ${s.type === 'ceremony' ? 'bg-pink-100 text-pink-800' : ''}
 ${s.type === 'other' ? 'bg-gray-100 text-gray-800' : ''}
 `,
              children: t(`events.types.${s.type}`),
            }),
        },
        {
          key: 'datetime',
          header: t('events.dateTime'),
          cell: (s) =>
            e.jsxs('div', {
              className: 'text-sm',
              children: [
                e.jsx('div', { children: u(new Date(s.start_datetime), 'dd MMM yyyy') }),
                e.jsxs('div', {
                  className: 'text-muted-foreground',
                  children: [
                    u(new Date(s.start_datetime), 'HH:mm'),
                    ' -',
                    u(new Date(s.end_datetime), 'HH:mm'),
                  ],
                }),
              ],
            }),
        },
        {
          key: 'location',
          header: t('events.location'),
          cell: (s) =>
            e.jsx('div', {
              className: 'text-sm',
              children: s.is_virtual
                ? e.jsxs('div', {
                    className: 'flex items-center gap-1',
                    children: [
                      e.jsx(K, { className: 'h-4 w-4 text-blue-500' }),
                      e.jsx('span', { children: t('events.virtual') }),
                    ],
                  })
                : e.jsxs('div', {
                    className: 'flex items-center gap-1',
                    children: [
                      e.jsx(G, { className: 'h-4 w-4 text-muted-foreground' }),
                      e.jsx('span', { children: l ? s.location_ar : s.location_en }),
                    ],
                  }),
            }),
        },
        {
          key: 'organizer',
          header: t('events.organizer'),
          cell: (s) =>
            e.jsxs('div', {
              className: 'flex items-center gap-1 text-sm',
              children: [
                e.jsx(J, { className: 'h-4 w-4 text-muted-foreground' }),
                e.jsx('span', {
                  children: l ? s.organizer_name_ar || '-' : s.organizer_name_en || '-',
                }),
              ],
            }),
        },
        {
          key: 'country',
          header: t('events.country'),
          cell: (s) =>
            e.jsxs('div', {
              className: 'flex items-center gap-1 text-sm',
              children: [
                e.jsx(Q, { className: 'h-4 w-4 text-muted-foreground' }),
                e.jsx('span', {
                  children: l ? s.country_name_ar || '-' : s.country_name_en || '-',
                }),
              ],
            }),
        },
        {
          key: 'participants',
          header: t('events.participants'),
          cell: (s) =>
            e.jsxs('div', {
              className: 'flex items-center gap-1',
              children: [
                e.jsx(U, { className: 'h-4 w-4 text-muted-foreground' }),
                e.jsx('span', { className: 'text-sm', children: s.max_participants || '-' }),
              ],
            }),
        },
        {
          key: 'status',
          header: t('events.status'),
          cell: (s) =>
            e.jsx('span', {
              className: `
 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
 ${s.status === 'draft' ? 'bg-gray-100 text-gray-800' : ''}
 ${s.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : ''}
 ${s.status === 'ongoing' ? 'bg-green-100 text-green-800' : ''}
 ${s.status === 'completed' ? 'bg-gray-100 text-gray-800' : ''}
 ${s.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
 `,
              children: t(`events.statuses.${s.status}`),
            }),
        },
      ]
      return e.jsx('div', {
        className: 'space-y-4',
        children: o?.map((s) =>
          e.jsx(
            h,
            {
              className: 'hover:shadow-md transition-shadow cursor-pointer',
              children: e.jsx(f, {
                className: 'p-4',
                children: e.jsx('div', {
                  className: 'grid grid-cols-6 gap-4',
                  children: a.map((r) =>
                    e.jsxs(
                      'div',
                      {
                        children: [
                          e.jsx('div', {
                            className: 'text-xs text-muted-foreground mb-1',
                            children: r.header,
                          }),
                          r.cell(s),
                        ],
                      },
                      r.key,
                    ),
                  ),
                }),
              }),
            },
            s.id,
          ),
        ),
      })
    },
    M = ['all', 'meeting', 'conference', 'workshop', 'training', 'ceremony', 'other']
  return e.jsxs('div', {
    className: 'container mx-auto py-6',
    children: [
      e.jsxs('div', {
        className: 'flex justify-between items-center mb-6',
        children: [
          e.jsx('h1', { className: 'text-3xl font-bold', children: t('navigation.calendar') }),
          e.jsxs('div', {
            className: 'flex gap-2',
            children: [
              e.jsxs(x, {
                variant: p === 'calendar' ? 'default' : 'outline',
                size: 'sm',
                onClick: () => v('calendar'),
                children: [e.jsx(B, { className: 'h-4 w-4 me-2' }), t('events.calendarView')],
              }),
              e.jsxs(x, {
                variant: p === 'list' ? 'default' : 'outline',
                size: 'sm',
                onClick: () => v('list'),
                children: [e.jsx(P, { className: 'h-4 w-4 me-2' }), t('events.listView')],
              }),
              e.jsxs(x, {
                children: [e.jsx(R, { className: 'h-4 w-4 me-2' }), t('events.addEvent')],
              }),
            ],
          }),
        ],
      }),
      e.jsxs(h, {
        className: 'mb-6',
        children: [
          e.jsx(O, { children: e.jsx(V, { children: t('common.filter') }) }),
          e.jsx(f, {
            children: e.jsxs('div', {
              className: 'flex gap-4',
              children: [
                e.jsx(F, {
                  placeholder: t('common.search'),
                  value: c,
                  onChange: (a) => k(a.target.value),
                  className: 'max-w-sm',
                }),
                e.jsx('div', {
                  className: 'flex gap-2',
                  children: M.map((a) =>
                    e.jsx(
                      x,
                      {
                        variant: d === a ? 'default' : 'outline',
                        size: 'sm',
                        onClick: () => C(a),
                        children: t(a === 'all' ? 'common.all' : `events.types.${a}`),
                      },
                      a,
                    ),
                  ),
                }),
              ],
            }),
          }),
        ],
      }),
      e.jsx(h, {
        children: e.jsxs(f, {
          className: 'p-6',
          children: [
            N
              ? e.jsx('div', { className: 'p-8 text-center', children: t('common.loading') })
              : p === 'calendar'
                ? e.jsx(S, {})
                : e.jsx(T, {}),
            !N &&
              (!o || o.length === 0) &&
              e.jsx('div', {
                className: 'p-8 text-center text-muted-foreground',
                children: t('common.noData'),
              }),
          ],
        }),
      }),
    ],
  })
}
function Z() {
  return e.jsx(Y, {})
}
const oe = Z
export { oe as component }
//# sourceMappingURL=events-LpgP088n.js.map
