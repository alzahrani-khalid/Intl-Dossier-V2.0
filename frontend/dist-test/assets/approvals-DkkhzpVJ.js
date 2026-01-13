import { u as k, r as m, j as e } from './react-vendor-Buoak6m3.js'
import {
  a0 as v,
  j as g,
  N as D,
  O as S,
  P as h,
  Q as l,
  R as _,
  U as o,
  m as I,
  B as x,
  A as T,
  E as P,
  F,
  G as B,
  H as E,
  J as u,
  I as O,
  n as q,
  K as z,
  s as j,
} from './index-qYY0KoZ1.js'
import { c as U, a as $, d as H } from './tanstack-vendor-BZC-rs5U.js'
import { be as L, bw as Q, aI as K } from './vendor-misc-BiJvMP0A.js'
import './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
const w = 'https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1'
async function M() {
  const {
      data: { session: a },
    } = await j.auth.getSession(),
    r = await fetch(`${w}/positions-list?status=under_review`, {
      headers: { Authorization: `Bearer ${a?.access_token}`, 'Content-Type': 'application/json' },
    })
  if (!r.ok) throw new Error('Failed to fetch positions')
  return (await r.json()).data || []
}
async function J(a, r, d) {
  const {
      data: { session: t },
    } = await j.auth.getSession(),
    i = await fetch(`${w}/approvals-reassign?id=${a}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${t?.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reassign_to: r, reason: d }),
    })
  if (!i.ok) throw new Error('Failed to reassign approval')
  return i.json()
}
function re() {
  const { t: a } = k(),
    r = U(),
    [d, t] = m.useState(!1),
    [i, f] = m.useState(null),
    [n, c] = m.useState({ newApproverId: '', reason: '' }),
    { data: p, isLoading: y } = $({
      queryKey: ['admin', 'approvals', 'under_review'],
      queryFn: M,
      staleTime: 30 * 1e3,
    }),
    N = H({
      mutationFn: ({ approvalId: s, newApproverId: R, reason: C }) => J(s, R, C),
      onSuccess: () => {
        ;(r.invalidateQueries({ queryKey: ['admin', 'approvals'] }),
          t(!1),
          c({ newApproverId: '', reason: '' }))
      },
    }),
    A = (s) => {
      ;(f(s), t(!0))
    },
    b = () => {
      i &&
        n.newApproverId &&
        n.reason &&
        N.mutate({
          approvalId: i.current_approval_id || '',
          newApproverId: n.newApproverId,
          reason: n.reason,
        })
    }
  return y
    ? e.jsxs('div', {
        className: 'container mx-auto py-6 space-y-4',
        children: [e.jsx(v, { className: 'h-8 w-64' }), e.jsx(v, { className: 'h-96' })],
      })
    : e.jsxs('div', {
        className: 'container mx-auto py-6 space-y-6',
        children: [
          e.jsxs('div', {
            className: 'flex items-center gap-3',
            children: [
              e.jsx('div', {
                className: 'p-3 bg-red-100 dark:bg-red-900 rounded-lg',
                children: e.jsx(L, { className: 'h-6 w-6 text-red-600 dark:text-red-400' }),
              }),
              e.jsxs('div', {
                children: [
                  e.jsx('h1', {
                    className: 'text-3xl font-bold',
                    children: a('admin.approvals.title', 'Admin: Approval Management'),
                  }),
                  e.jsx('p', {
                    className: 'text-muted-foreground',
                    children: a(
                      'admin.approvals.subtitle',
                      'Reassign stuck approvals and manage approval chains',
                    ),
                  }),
                ],
              }),
            ],
          }),
          e.jsx(g, {
            className: 'p-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
            children: e.jsxs('div', {
              className: 'flex items-start gap-3',
              children: [
                e.jsx(Q, { className: 'h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5' }),
                e.jsxs('div', {
                  children: [
                    e.jsx('p', {
                      className: 'font-medium text-yellow-800 dark:text-yellow-200',
                      children: a('admin.approvals.warning', 'Admin Privileges Active'),
                    }),
                    e.jsx('p', {
                      className: 'text-sm text-yellow-700 dark:text-yellow-300',
                      children: a(
                        'admin.approvals.warningText',
                        'All reassignments are logged and require a reason for audit trail compliance.',
                      ),
                    }),
                  ],
                }),
              ],
            }),
          }),
          e.jsxs(g, {
            className: 'p-6',
            children: [
              e.jsxs('div', {
                className: 'mb-4',
                children: [
                  e.jsx('h2', {
                    className: 'text-xl font-semibold',
                    children: a('admin.approvals.underReview', 'Positions Under Review'),
                  }),
                  e.jsx('p', {
                    className: 'text-sm text-muted-foreground',
                    children: a(
                      'admin.approvals.underReviewDesc',
                      'All positions currently in the approval workflow',
                    ),
                  }),
                ],
              }),
              e.jsxs(D, {
                children: [
                  e.jsx(S, {
                    children: e.jsxs(h, {
                      children: [
                        e.jsx(l, { children: a('admin.approvals.position', 'Position') }),
                        e.jsx(l, { children: a('admin.approvals.stage', 'Current Stage') }),
                        e.jsx(l, { children: a('admin.approvals.category', 'Category') }),
                        e.jsx(l, { children: a('admin.approvals.submittedDate', 'Submitted') }),
                        e.jsx(l, { children: a('admin.approvals.actions', 'Actions') }),
                      ],
                    }),
                  }),
                  e.jsx(_, {
                    children:
                      p && p.length > 0
                        ? p.map((s) =>
                            e.jsxs(
                              h,
                              {
                                children: [
                                  e.jsx(o, {
                                    children: e.jsxs('div', {
                                      children: [
                                        e.jsx('p', {
                                          className: 'font-medium',
                                          children: s.title_en,
                                        }),
                                        e.jsx('p', {
                                          className: 'text-sm text-muted-foreground',
                                          children: s.title_ar,
                                        }),
                                      ],
                                    }),
                                  }),
                                  e.jsx(o, {
                                    children: e.jsx(I, {
                                      variant: 'secondary',
                                      children: a(
                                        'admin.approvals.stageOf',
                                        'Stage {{current}} of {{total}}',
                                        {
                                          current: s.current_stage,
                                          total: s.approval_chain_config?.stages?.length || 0,
                                        },
                                      ),
                                    }),
                                  }),
                                  e.jsx(o, { children: s.thematic_category || '-' }),
                                  e.jsx(o, {
                                    className: 'text-sm text-muted-foreground',
                                    children: new Date(s.created_at).toLocaleDateString(),
                                  }),
                                  e.jsx(o, {
                                    children: e.jsxs(x, {
                                      variant: 'outline',
                                      size: 'sm',
                                      onClick: () => A(s),
                                      children: [
                                        e.jsx(K, { className: 'me-2 h-4 w-4' }),
                                        a('admin.approvals.reassign', 'Reassign'),
                                      ],
                                    }),
                                  }),
                                ],
                              },
                              s.id,
                            ),
                          )
                        : e.jsx(h, {
                            children: e.jsx(o, {
                              colSpan: 5,
                              className: 'text-center text-muted-foreground',
                              children: a(
                                'admin.approvals.noPositions',
                                'No positions under review',
                              ),
                            }),
                          }),
                  }),
                ],
              }),
            ],
          }),
          e.jsx(T, {
            open: d,
            onOpenChange: t,
            children: e.jsxs(P, {
              className: 'sm:max-w-[500px]',
              children: [
                e.jsxs(F, {
                  children: [
                    e.jsx(B, { children: a('admin.approvals.reassignTitle', 'Reassign Approval') }),
                    e.jsx(E, {
                      children: a(
                        'admin.approvals.reassignDesc',
                        'Reassign this approval to a different user. A reason is required for audit purposes.',
                      ),
                    }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'space-y-4 py-4',
                  children: [
                    e.jsxs('div', {
                      className: 'space-y-2',
                      children: [
                        e.jsx(u, {
                          htmlFor: 'position',
                          children: a('admin.approvals.position', 'Position'),
                        }),
                        e.jsx('p', { className: 'text-sm font-medium', children: i?.title_en }),
                      ],
                    }),
                    e.jsxs('div', {
                      className: 'space-y-2',
                      children: [
                        e.jsxs(u, {
                          htmlFor: 'newApprover',
                          children: [a('admin.approvals.newApprover', 'New Approver'), ' *'],
                        }),
                        e.jsx(O, {
                          id: 'newApprover',
                          placeholder: a(
                            'admin.approvals.newApproverPlaceholder',
                            'Enter user ID or search',
                          ),
                          value: n.newApproverId,
                          onChange: (s) => c({ ...n, newApproverId: s.target.value }),
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      className: 'space-y-2',
                      children: [
                        e.jsxs(u, {
                          htmlFor: 'reason',
                          children: [a('admin.approvals.reason', 'Reason for Reassignment'), ' *'],
                        }),
                        e.jsx(q, {
                          id: 'reason',
                          placeholder: a(
                            'admin.approvals.reasonPlaceholder',
                            'e.g., Original approver is on leave, organizational change',
                          ),
                          value: n.reason,
                          onChange: (s) => c({ ...n, reason: s.target.value }),
                          rows: 3,
                        }),
                      ],
                    }),
                  ],
                }),
                e.jsxs(z, {
                  children: [
                    e.jsx(x, {
                      variant: 'outline',
                      onClick: () => t(!1),
                      children: a('common.cancel', 'Cancel'),
                    }),
                    e.jsx(x, {
                      onClick: b,
                      disabled: !n.newApproverId || !n.reason,
                      children: a('admin.approvals.confirmReassign', 'Confirm Reassignment'),
                    }),
                  ],
                }),
              ],
            }),
          }),
        ],
      })
}
export { re as component }
//# sourceMappingURL=approvals-DkkhzpVJ.js.map
