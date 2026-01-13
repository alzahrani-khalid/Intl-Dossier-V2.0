import { u as x, j as s } from './react-vendor-Buoak6m3.js'
import {
  b3 as h,
  a0 as c,
  B as j,
  j as l,
  N as u,
  O as f,
  P as m,
  Q as r,
  R as g,
  U as i,
  m as n,
  s as N,
} from './index-qYY0KoZ1.js'
import { a as v, L as b } from './tanstack-vendor-BZC-rs5U.js'
import { A as w } from './ApprovalChain-D9q84Iai.js'
import { aX as y, aI as A, c5 as _, cL as T, bS as k } from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
import './tooltip-CE0dVuox.js'
const B = 'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1'
async function C(t) {
  const {
      data: { session: e },
    } = await N.auth.getSession(),
    o = await fetch(`${B}/positions-get?id=${t}`, {
      headers: { Authorization: `Bearer ${e?.access_token}`, 'Content-Type': 'application/json' },
    })
  if (!o.ok) throw new Error('Failed to fetch position')
  return o.json()
}
function D() {
  const { id: t } = h.useParams(),
    { t: e } = x(),
    { data: o, isLoading: p } = v({ queryKey: ['positions', 'detail', t], queryFn: () => C(t) })
  if (p)
    return s.jsxs('div', {
      className: 'container mx-auto py-6 space-y-4',
      children: [s.jsx(c, { className: 'h-8 w-64' }), s.jsx(c, { className: 'h-96' })],
    })
  const d = (a) => {
    switch (a) {
      case 'approve':
        return s.jsx(k, { className: 'h-4 w-4 text-green-500' })
      case 'request_revisions':
        return s.jsx(T, { className: 'h-4 w-4 text-red-500' })
      case 'delegate':
        return s.jsx(_, { className: 'h-4 w-4 text-blue-500' })
      case 'reassign':
        return s.jsx(A, { className: 'h-4 w-4 text-orange-500' })
      default:
        return null
    }
  }
  return s.jsxs('div', {
    className: 'container mx-auto py-6 space-y-6',
    children: [
      s.jsxs('div', {
        className: 'flex items-center gap-4',
        children: [
          s.jsx(b, {
            to: '/positions/$id',
            params: { id: t },
            children: s.jsxs(j, {
              variant: 'outline',
              size: 'sm',
              children: [s.jsx(y, { className: 'me-2 h-4 w-4' }), e('common.back', 'Back')],
            }),
          }),
          s.jsx('h1', {
            className: 'text-3xl font-bold',
            children: e('positions.approvals.title', 'Approval Tracking'),
          }),
        ],
      }),
      s.jsxs(l, {
        className: 'p-6',
        children: [
          s.jsx('h2', {
            className: 'text-xl font-semibold mb-4',
            children: e('positions.approvals.progress', 'Approval Progress'),
          }),
          s.jsx(w, { positionId: t, currentStage: o?.current_stage || 0, detailed: !0 }),
        ],
      }),
      s.jsxs(l, {
        className: 'p-6',
        children: [
          s.jsx('h2', {
            className: 'text-xl font-semibold mb-4',
            children: e('positions.approvals.history', 'Approval History'),
          }),
          s.jsxs(u, {
            children: [
              s.jsx(f, {
                children: s.jsxs(m, {
                  children: [
                    s.jsx(r, { children: e('positions.approvals.stage', 'Stage') }),
                    s.jsx(r, { children: e('positions.approvals.approver', 'Approver') }),
                    s.jsx(r, { children: e('positions.approvals.action', 'Action') }),
                    s.jsx(r, { children: e('positions.approvals.stepUp', 'Step-Up Verified') }),
                    s.jsx(r, { children: e('positions.approvals.comments', 'Comments') }),
                    s.jsx(r, { children: e('positions.approvals.timestamp', 'Timestamp') }),
                  ],
                }),
              }),
              s.jsx(g, {
                children: o?.approvals?.map((a) =>
                  s.jsxs(
                    m,
                    {
                      children: [
                        s.jsx(i, { children: s.jsx(n, { variant: 'outline', children: a.stage }) }),
                        s.jsx(i, {
                          children: s.jsxs('div', {
                            className: 'flex flex-col',
                            children: [
                              s.jsx('span', {
                                className: 'font-medium',
                                children: a.approver_name || a.approver_id,
                              }),
                              a.delegated_from &&
                                s.jsxs('span', {
                                  className: 'text-xs text-muted-foreground',
                                  children: [
                                    e('positions.approvals.delegatedFrom', 'Delegated from'),
                                    ': ',
                                    a.delegated_from,
                                  ],
                                }),
                            ],
                          }),
                        }),
                        s.jsx(i, {
                          children: s.jsxs('div', {
                            className: 'flex items-center gap-2',
                            children: [
                              d(a.action),
                              s.jsx('span', {
                                className: 'capitalize',
                                children: a.action.replace('_', ' '),
                              }),
                            ],
                          }),
                        }),
                        s.jsx(i, {
                          children: a.step_up_verified
                            ? s.jsx(n, {
                                variant: 'success',
                                className: 'text-xs',
                                children: e('common.yes', 'Yes'),
                              })
                            : s.jsx(n, {
                                variant: 'secondary',
                                className: 'text-xs',
                                children: e('common.no', 'No'),
                              }),
                        }),
                        s.jsx(i, { className: 'max-w-xs truncate', children: a.comments || '-' }),
                        s.jsx(i, {
                          className: 'text-sm text-muted-foreground',
                          children: new Date(a.created_at).toLocaleString(),
                        }),
                      ],
                    },
                    a.id,
                  ),
                ),
              }),
            ],
          }),
        ],
      }),
    ],
  })
}
export { D as component }
//# sourceMappingURL=approvals-D0quxhEs.js.map
