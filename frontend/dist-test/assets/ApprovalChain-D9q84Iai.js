import { u as T, j as e, R as A } from './react-vendor-Buoak6m3.js'
import { c as g, m as f } from './index-qYY0KoZ1.js'
import { T as m, a as p, b as h, c as u } from './tooltip-CE0dVuox.js'
import {
  bw as $,
  bS as N,
  bd as b,
  b3 as k,
  aT as D,
  be as L,
  aI as y,
  bn as R,
  cq as S,
} from './vendor-misc-BiJvMP0A.js'
function U(i, r, n) {
  return n === 'approved' || n === 'published' || i < r
    ? 'completed'
    : i === r
      ? 'current'
      : 'pending'
}
function q(i, r) {
  return i.filter((n) => n.stage === r)
}
function I({ approvalChainConfig: i, currentStage: r, approvals: n, status: c, className: w }) {
  const { t: s, i18n: j } = T('positions'),
    v = j.language === 'ar',
    l = i?.stages || []
  return l.length === 0
    ? e.jsxs('div', {
        className: 'flex items-center justify-center py-8 text-muted-foreground',
        children: [
          e.jsx($, { className: 'me-2 size-5' }),
          e.jsx('span', { children: s('approval.noChainConfigured') }),
        ],
      })
    : e.jsx('div', {
        className: g('w-full', w),
        children: e.jsxs('div', {
          className: 'relative',
          children: [
            e.jsx('div', {
              className: g('flex items-start gap-2 overflow-x-auto pb-4', v && 'flex-row-reverse'),
              children: l.map((t, _) => {
                const o = U(t.order, r, c),
                  d = q(n, t.order),
                  a = d[d.length - 1],
                  C = _ === l.length - 1
                return e.jsxs(
                  A.Fragment,
                  {
                    children: [
                      e.jsxs('div', {
                        className: 'flex min-w-[180px] shrink-0 flex-col items-center',
                        children: [
                          e.jsxs('div', {
                            className: 'mb-3 flex flex-col items-center',
                            children: [
                              e.jsx('div', {
                                className: g(
                                  'flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all',
                                  o === 'completed' &&
                                    'bg-green-100 border-green-600 text-green-700',
                                  o === 'current' &&
                                    'bg-blue-100 border-blue-600 text-blue-700 ring-4 ring-blue-100',
                                  o === 'pending' && 'bg-gray-100 border-gray-300 text-gray-400',
                                ),
                                role: 'img',
                                'aria-label': `${s('approval.stage')} ${t.order}`,
                                children:
                                  o === 'completed'
                                    ? e.jsx(N, { className: 'size-6' })
                                    : o === 'current'
                                      ? e.jsx(b, { className: 'size-6' })
                                      : e.jsx(k, { className: 'size-6' }),
                              }),
                              e.jsxs('span', {
                                className: 'mt-1 text-xs font-medium text-muted-foreground',
                                children: [s('approval.stage'), ' ', t.order],
                              }),
                            ],
                          }),
                          e.jsxs('div', {
                            className: 'w-full space-y-2 text-center',
                            children: [
                              e.jsx('div', {
                                className: 'break-words text-sm font-medium',
                                children: t.role,
                              }),
                              t.approver_name &&
                                e.jsxs('div', {
                                  className:
                                    'flex items-center justify-center gap-1 text-xs text-muted-foreground',
                                  children: [
                                    e.jsx(D, { className: 'size-3' }),
                                    e.jsx('span', {
                                      className: 'truncate',
                                      children: t.approver_name,
                                    }),
                                  ],
                                }),
                              a &&
                                e.jsxs('div', {
                                  className: 'space-y-2',
                                  children: [
                                    e.jsx(f, {
                                      variant:
                                        a.action === 'approve'
                                          ? 'default'
                                          : a.action === 'request_revisions'
                                            ? 'destructive'
                                            : 'secondary',
                                      className: 'text-xs',
                                      children: s(`positions.approval.actions.${a.action}`),
                                    }),
                                    a.step_up_verified &&
                                      e.jsx(m, {
                                        children: e.jsxs(p, {
                                          children: [
                                            e.jsx(h, {
                                              asChild: !0,
                                              children: e.jsxs(f, {
                                                variant: 'outline',
                                                className:
                                                  'gap-1 border-green-600 text-xs text-green-700',
                                                children: [
                                                  e.jsx(L, { className: 'size-3' }),
                                                  s('approval.stepUpVerified'),
                                                ],
                                              }),
                                            }),
                                            e.jsx(u, {
                                              children: e.jsx('p', {
                                                children: s('approval.stepUpVerifiedTooltip'),
                                              }),
                                            }),
                                          ],
                                        }),
                                      }),
                                    a.delegated_from &&
                                      e.jsx(m, {
                                        children: e.jsxs(p, {
                                          children: [
                                            e.jsx(h, {
                                              asChild: !0,
                                              children: e.jsxs('div', {
                                                className:
                                                  'flex items-center justify-center gap-1 text-xs text-amber-600',
                                                children: [
                                                  e.jsx(y, { className: 'size-3' }),
                                                  e.jsx('span', {
                                                    children: s('approval.delegated'),
                                                  }),
                                                ],
                                              }),
                                            }),
                                            e.jsxs(u, {
                                              children: [
                                                e.jsx('p', {
                                                  children: s('approval.delegatedFrom', {
                                                    name: a.delegated_from_name || a.delegated_from,
                                                  }),
                                                }),
                                                a.delegated_until &&
                                                  e.jsx('p', {
                                                    className: 'mt-1 text-xs',
                                                    children: s('approval.delegatedUntil', {
                                                      date: new Date(
                                                        a.delegated_until,
                                                      ).toLocaleDateString(j.language),
                                                    }),
                                                  }),
                                              ],
                                            }),
                                          ],
                                        }),
                                      }),
                                    a.reassigned_by &&
                                      e.jsx(m, {
                                        children: e.jsxs(p, {
                                          children: [
                                            e.jsx(h, {
                                              asChild: !0,
                                              children: e.jsxs('div', {
                                                className:
                                                  'flex items-center justify-center gap-1 text-xs text-purple-600',
                                                children: [
                                                  e.jsx(y, { className: 'size-3' }),
                                                  e.jsx('span', {
                                                    children: s('approval.reassigned'),
                                                  }),
                                                ],
                                              }),
                                            }),
                                            e.jsxs(u, {
                                              children: [
                                                e.jsx('p', {
                                                  children: s('approval.reassignedBy', {
                                                    name: a.reassigned_by_name || a.reassigned_by,
                                                  }),
                                                }),
                                                a.reassignment_reason &&
                                                  e.jsx('p', {
                                                    className: 'mt-1 max-w-xs text-xs',
                                                    children: a.reassignment_reason,
                                                  }),
                                              ],
                                            }),
                                          ],
                                        }),
                                      }),
                                    a.comments &&
                                      e.jsx(m, {
                                        children: e.jsxs(p, {
                                          children: [
                                            e.jsx(h, {
                                              asChild: !0,
                                              children: e.jsxs('div', {
                                                className:
                                                  'flex cursor-help items-center justify-center gap-1 text-xs text-blue-600',
                                                children: [
                                                  e.jsx(R, { className: 'size-3' }),
                                                  e.jsx('span', {
                                                    children: s('approval.hasComments'),
                                                  }),
                                                ],
                                              }),
                                            }),
                                            e.jsx(u, {
                                              className: 'max-w-xs',
                                              children: e.jsx('p', {
                                                className: 'whitespace-pre-wrap text-xs',
                                                children: a.comments,
                                              }),
                                            }),
                                          ],
                                        }),
                                      }),
                                    e.jsx('div', {
                                      className: 'text-xs text-muted-foreground',
                                      children: new Date(a.created_at).toLocaleDateString(
                                        j.language,
                                        { month: 'short', day: 'numeric', year: 'numeric' },
                                      ),
                                    }),
                                    d.length > 1 &&
                                      e.jsx(m, {
                                        children: e.jsxs(p, {
                                          children: [
                                            e.jsx(h, {
                                              asChild: !0,
                                              children: e.jsx('div', {
                                                className:
                                                  'cursor-help text-xs text-muted-foreground',
                                                children: s('approval.multipleActions', {
                                                  count: d.length,
                                                }),
                                              }),
                                            }),
                                            e.jsx(u, {
                                              children: e.jsx('div', {
                                                className: 'max-w-xs space-y-2',
                                                children: d.map((x, z) =>
                                                  e.jsxs(
                                                    'div',
                                                    {
                                                      className: 'text-xs',
                                                      children: [
                                                        e.jsx('div', {
                                                          className: 'font-medium',
                                                          children: s(
                                                            `positions.approval.actions.${x.action}`,
                                                          ),
                                                        }),
                                                        e.jsx('div', {
                                                          className: 'text-muted-foreground',
                                                          children:
                                                            x.approver_name || x.approver_id,
                                                        }),
                                                        e.jsx('div', {
                                                          className: 'text-muted-foreground',
                                                          children: new Date(
                                                            x.created_at,
                                                          ).toLocaleString(j.language),
                                                        }),
                                                        z < d.length - 1 &&
                                                          e.jsx('hr', { className: 'my-2' }),
                                                      ],
                                                    },
                                                    x.id,
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
                          }),
                        ],
                      }),
                      !C &&
                        e.jsx('div', {
                          className: 'flex shrink-0 items-center pt-6',
                          children: e.jsx(S, {
                            className: g('h-5 w-5 text-muted-foreground', v && 'rotate-180'),
                            'aria-hidden': 'true',
                          }),
                        }),
                    ],
                  },
                  t.order,
                )
              }),
            }),
            e.jsx('div', {
              className: 'relative mt-4 h-1 overflow-hidden rounded-full bg-gray-200',
              children: e.jsx('div', {
                className:
                  'absolute top-0 h-full rounded-full bg-blue-600 transition-all duration-500 ease-out',
                style: { width: `${((r - 1) / (l.length - 1)) * 100}%`, [v ? 'right' : 'left']: 0 },
                role: 'progressbar',
                'aria-valuenow': r,
                'aria-valuemin': 1,
                'aria-valuemax': l.length,
                'aria-label': s('approval.progress', { current: r, total: l.length }),
              }),
            }),
            e.jsxs('div', {
              className: 'mt-4 flex items-center justify-between text-sm',
              children: [
                e.jsxs('div', {
                  className: 'flex items-center gap-4',
                  children: [
                    e.jsxs('div', {
                      className: 'flex items-center gap-2',
                      children: [
                        e.jsx(N, { className: 'size-4 text-green-600' }),
                        e.jsxs('span', {
                          className: 'text-muted-foreground',
                          children: [s('approval.completed'), ': ', r - 1],
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      className: 'flex items-center gap-2',
                      children: [
                        e.jsx(b, { className: 'size-4 text-blue-600' }),
                        e.jsxs('span', {
                          className: 'text-muted-foreground',
                          children: [s('approval.remaining'), ': ', l.length - r + 1],
                        }),
                      ],
                    }),
                  ],
                }),
                e.jsx(f, {
                  variant:
                    c === 'approved' || c === 'published'
                      ? 'default'
                      : c === 'under_review'
                        ? 'secondary'
                        : 'outline',
                  children: s(`positions.status.${c}`),
                }),
              ],
            }),
          ],
        }),
      })
}
export { I as A }
//# sourceMappingURL=ApprovalChain-D9q84Iai.js.map
