import { u as C, r as f, j as e } from './react-vendor-Buoak6m3.js'
import { a as M, d as T } from './tanstack-vendor-BZC-rs5U.js'
import { s as g, B as u, j as l, k as m, o as x, l as o, I as $ } from './index-qYY0KoZ1.js'
import { D as S } from './DataTable-C-BIRk0G.js'
import { aH as D, bd as F, bw as q, b9 as R, aM as E } from './vendor-misc-BiJvMP0A.js'
import { H as p } from './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
const j = {
  draft: { color: 'gray', next: 'internal_review' },
  internal_review: { color: 'yellow', next: 'external_review' },
  external_review: { color: 'orange', next: 'negotiation' },
  negotiation: { color: 'blue', next: 'signed' },
  signed: { color: 'green', next: 'active' },
  active: { color: 'green', next: 'expired' },
  renewed: { color: 'blue', next: null },
  expired: { color: 'red', next: 'renewed' },
}
function K() {
  const { t, i18n: y } = C(),
    [n, w] = f.useState(''),
    [c, h] = f.useState('all'),
    i = y.language === 'ar',
    {
      data: r,
      isLoading: N,
      refetch: _,
    } = M({
      queryKey: ['mous', n, c],
      queryFn: async () => {
        let s = g.from('mous_frontend').select('*').order('created_at', { ascending: !1 })
        ;(n &&
          (s = s.or(`reference_number.ilike.%${n}%,title_en.ilike.%${n}%,title_ar.ilike.%${n}%`)),
          c !== 'all' && (s = s.eq('workflow_state', c)))
        const { data: a, error: d } = await s
        if (d) throw d
        return a
      },
    })
  T({
    mutationFn: async ({ id: s, newState: a }) => {
      const { error: d } = await g.from('mous').update({ lifecycle_state: a }).eq('id', s)
      if (d) throw d
    },
    onSuccess: () => {
      _()
    },
  })
  const v = ({ state: s }) => {
      const a = j[s]
      return e.jsxs('div', {
        className: 'flex items-center gap-2',
        children: [
          e.jsx('span', {
            className: `
 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
 ${a.color === 'gray' ? 'bg-muted text-muted-foreground' : ''}
 ${a.color === 'yellow' ? 'bg-warning/10 text-warning' : ''}
 ${a.color === 'orange' ? 'bg-warning/20 text-warning' : ''}
 ${a.color === 'blue' ? 'bg-primary/10 text-primary' : ''}
 ${a.color === 'green' ? 'bg-primary/10 text-primary' : ''}
 ${a.color === 'red' ? 'bg-destructive/10 text-destructive' : ''}
 `,
            children: t(`mous.statuses.${s}`),
          }),
          a.next &&
            e.jsxs(u, {
              size: 'sm',
              variant: 'ghost',
              className: 'h-6 px-2',
              onClick: () => {},
              children: [e.jsx(E, { className: 'h-3 w-3' }), t(`mous.statuses.${a.next}`)],
            }),
        ],
      })
    },
    b = f.useMemo(
      () => [
        {
          id: 'reference',
          accessorKey: 'reference_number',
          header: t('mous.referenceNumber'),
          cell: ({ row: s }) =>
            e.jsx('div', { className: 'font-mono text-sm', children: s.original.reference_number }),
        },
        {
          id: 'title',
          header: t('mous.title'),
          accessorFn: (s) => (i ? s.title_ar : s.title_en),
          cell: ({ row: s }) =>
            e.jsx('div', {
              className: `font-medium ${i ? 'text-end' : 'text-start'}`,
              children: i ? s.original.title_ar : s.original.title_en,
            }),
        },
        {
          id: 'parties',
          header: t('mous.parties'),
          cell: ({ row: s }) =>
            e.jsxs('div', {
              className: 'text-sm',
              children: [
                e.jsx('div', {
                  children: i ? s.original.primary_party.name_ar : s.original.primary_party.name_en,
                }),
                e.jsxs('div', {
                  className: 'text-muted-foreground',
                  children: [
                    '↔',
                    ' ',
                    i ? s.original.secondary_party.name_ar : s.original.secondary_party.name_en,
                  ],
                }),
              ],
            }),
        },
        {
          id: 'workflow',
          header: t('mous.workflow'),
          accessorKey: 'workflow_state',
          cell: ({ row: s }) => e.jsx(v, { state: s.original.workflow_state }),
        },
        {
          id: 'dates',
          header: t('mous.dates'),
          cell: ({ row: s }) =>
            e.jsxs('div', {
              className: 'text-sm space-y-1',
              children: [
                s.original.signing_date &&
                  e.jsxs('div', {
                    className: 'flex items-center gap-1',
                    children: [
                      e.jsx(D, { className: 'h-3 w-3' }),
                      p(new Date(s.original.signing_date), 'dd MMM yyyy'),
                    ],
                  }),
                s.original.expiry_date &&
                  e.jsxs('div', {
                    className: 'flex items-center gap-1',
                    children: [
                      e.jsx(F, { className: 'h-3 w-3' }),
                      p(new Date(s.original.expiry_date), 'dd MMM yyyy'),
                    ],
                  }),
              ],
            }),
        },
        {
          id: 'alerts',
          header: '',
          enableSorting: !1,
          cell: ({ row: s }) => {
            if (s.original.expiry_date) {
              const a = Math.floor(
                (new Date(s.original.expiry_date).getTime() - new Date().getTime()) / 864e5,
              )
              if (a <= 30 && a > 0)
                return e.jsxs('div', {
                  className: 'flex items-center gap-1 text-warning',
                  children: [
                    e.jsx(q, { className: 'h-4 w-4' }),
                    e.jsxs('span', { className: 'text-xs', children: [a, 'd'] }),
                  ],
                })
            }
            return null
          },
        },
      ],
      [i, t],
    ),
    k = Object.keys(j)
  return e.jsxs('div', {
    className: 'container mx-auto py-6',
    children: [
      e.jsxs('div', {
        className: 'flex justify-between items-center mb-6',
        children: [
          e.jsx('h1', { className: 'text-3xl font-bold', children: t('navigation.mous') }),
          e.jsxs(u, { children: [e.jsx(R, { className: 'h-4 w-4 me-2' }), t('mous.addMou')] }),
        ],
      }),
      e.jsxs('div', {
        className: 'grid gap-4 md:grid-cols-4 mb-6',
        children: [
          e.jsxs(l, {
            children: [
              e.jsx(m, {
                className: 'flex flex-row items-center justify-between space-y-0 pb-2',
                children: e.jsx(x, { className: 'text-sm font-medium', children: t('mous.total') }),
              }),
              e.jsx(o, {
                children: e.jsx('div', {
                  className: 'text-2xl font-bold',
                  children: r?.length || 0,
                }),
              }),
            ],
          }),
          e.jsxs(l, {
            children: [
              e.jsx(m, {
                className: 'flex flex-row items-center justify-between space-y-0 pb-2',
                children: e.jsx(x, {
                  className: 'text-sm font-medium',
                  children: t('mous.active'),
                }),
              }),
              e.jsx(o, {
                children: e.jsx('div', {
                  className: 'text-2xl font-bold',
                  children: r?.filter((s) => s.workflow_state === 'active').length || 0,
                }),
              }),
            ],
          }),
          e.jsxs(l, {
            children: [
              e.jsx(m, {
                className: 'flex flex-row items-center justify-between space-y-0 pb-2',
                children: e.jsx(x, {
                  className: 'text-sm font-medium',
                  children: t('mous.expiringSoon'),
                }),
              }),
              e.jsx(o, {
                children: e.jsx('div', {
                  className: 'text-2xl font-bold text-warning',
                  children:
                    r?.filter((s) => {
                      if (!s.expiry_date) return !1
                      const a = Math.floor(
                        (new Date(s.expiry_date).getTime() - new Date().getTime()) /
                          (1e3 * 60 * 60 * 24),
                      )
                      return a <= 30 && a > 0
                    }).length || 0,
                }),
              }),
            ],
          }),
          e.jsxs(l, {
            children: [
              e.jsx(m, {
                className: 'flex flex-row items-center justify-between space-y-0 pb-2',
                children: e.jsx(x, {
                  className: 'text-sm font-medium',
                  children: t('mous.inProgress'),
                }),
              }),
              e.jsx(o, {
                children: e.jsx('div', {
                  className: 'text-2xl font-bold',
                  children:
                    r?.filter((s) =>
                      ['internal_review', 'external_review', 'negotiation'].includes(
                        s.workflow_state,
                      ),
                    ).length || 0,
                }),
              }),
            ],
          }),
        ],
      }),
      e.jsxs(l, {
        className: 'mb-6',
        children: [
          e.jsx(m, { children: e.jsx(x, { children: t('common.filter') }) }),
          e.jsx(o, {
            children: e.jsxs('div', {
              className: 'flex gap-4',
              children: [
                e.jsx($, {
                  placeholder: t('common.search'),
                  value: n,
                  onChange: (s) => w(s.target.value),
                  className: 'max-w-sm',
                }),
                e.jsxs('div', {
                  className: 'flex gap-2 flex-wrap',
                  children: [
                    e.jsx(u, {
                      variant: c === 'all' ? 'default' : 'outline',
                      size: 'sm',
                      onClick: () => h('all'),
                      children: t('common.all'),
                    }),
                    k.map((s) =>
                      e.jsx(
                        u,
                        {
                          variant: c === s ? 'default' : 'outline',
                          size: 'sm',
                          onClick: () => h(s),
                          children: t(`mous.statuses.${s}`),
                        },
                        s,
                      ),
                    ),
                  ],
                }),
              ],
            }),
          }),
        ],
      }),
      e.jsx(l, {
        children: e.jsx(o, {
          className: 'p-0',
          children: N
            ? e.jsx('div', { className: 'p-8 text-center', children: t('common.loading') })
            : r && r.length > 0
              ? e.jsx(S, { data: r, columns: b, onRowClick: (s) => {} })
              : e.jsx('div', {
                  className: 'p-8 text-center text-muted-foreground',
                  children: t('common.noData'),
                }),
        }),
      }),
    ],
  })
}
function z() {
  return e.jsx(K, {})
}
const J = z
export { J as component }
//# sourceMappingURL=mous-DzUMXLj4.js.map
