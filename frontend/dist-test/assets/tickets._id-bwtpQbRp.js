const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      'assets/EntityLinkManager-HzbH6mRj.js',
      'assets/react-vendor-Buoak6m3.js',
      'assets/vendor-misc-BiJvMP0A.js',
      'assets/visualization-vendor-f5uYUx4I.js',
      'assets/visualization-vendor-BZV40eAE.css',
      'assets/date-vendor-s0MkYge4.js',
      'assets/react-vendor-DRguh7TN.css',
      'assets/tanstack-vendor-BZC-rs5U.js',
      'assets/index-qYY0KoZ1.js',
      'assets/i18n-vendor-Coo-X0AG.js',
      'assets/ui-vendor-DTR9u_Vg.js',
      'assets/supabase-vendor-CTsC8ILD.js',
      'assets/form-vendor-BX1BhTCI.js',
      'assets/index-C9Y_bLcv.css',
      'assets/alert-dialog-DaWYDPc1.js',
      'assets/tooltip-CE0dVuox.js',
    ]),
) => i.map((i) => d[i])
import { u as j, r as h, j as e } from './react-vendor-Buoak6m3.js'
import { _ as w } from './supabase-vendor-CTsC8ILD.js'
import { c as _, d as C, L as D, m as T, i as S } from './tanstack-vendor-BZC-rs5U.js'
import { S as f } from './SLACountdown-Bedgm05V.js'
import { T as M } from './TriagePanel-DtLLfctd.js'
import { g as P, h as A, i as $, j as q, k as z, l as R } from './useIntakeApi-84Q7PHHY.js'
import './vendor-misc-BiJvMP0A.js'
import './visualization-vendor-f5uYUx4I.js'
import './date-vendor-s0MkYge4.js'
import './index-qYY0KoZ1.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './form-vendor-BX1BhTCI.js'
function L({ ticketId: t }) {
  const { t: l, i18n: d } = j('intake'),
    m = _(),
    [s, n] = h.useState(null),
    [c, o] = h.useState(''),
    { data: k, isLoading: r, error: u } = P(t),
    x = k?.candidates || [],
    b = A(t),
    p = C({
      mutationFn: async (i) => {
        const y = await fetch(`http://localhost:5001/api/intake/duplicates/${i}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({ status: 'not_duplicate' }),
        })
        if (!y.ok) throw new Error('Failed to update duplicate status')
        return y.json()
      },
      onSuccess: () => {
        m.invalidateQueries({ queryKey: ['duplicate-candidates', t] })
      },
    }),
    a = (i) => {
      if (!s || !c.trim()) {
        alert(l('duplicates.mergeReasonRequired', 'Please provide a reason for merging'))
        return
      }
      const y = i === t ? s.target_ticket_id : t
      b.mutate(
        {
          targetTicketIds: [y],
          primaryTicketId: i,
          mergeReason: c,
          mergeReasonAr: d.language === 'ar' ? c : void 0,
        },
        {
          onSuccess: () => {
            ;(n(null), o(''))
          },
        },
      )
    }
  if (r)
    return e.jsxs('div', {
      className: 'py-8 text-center',
      children: [
        e.jsx('div', {
          className: 'inline-block size-8 animate-spin rounded-full border-b-2 border-blue-600',
        }),
        e.jsx('p', {
          className: 'mt-4 text-gray-600 dark:text-gray-400',
          children: l('duplicates.loading', 'Checking for duplicates...'),
        }),
      ],
    })
  if (u)
    return e.jsx('div', {
      className:
        'rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400',
      children: l('duplicates.error', 'Failed to load duplicate candidates. Please try again.'),
    })
  if (!x || x.length === 0)
    return e.jsxs('div', {
      className: 'py-8 text-center',
      children: [
        e.jsx('div', { className: 'mb-4 text-6xl', children: '✓' }),
        e.jsx('p', {
          className: 'text-lg text-gray-600 dark:text-gray-400',
          children: l('duplicates.noDuplicates', 'No potential duplicates detected'),
        }),
      ],
    })
  const g = x.filter((i) => i.overall_score >= 0.8),
    v = x.filter((i) => i.overall_score >= 0.65 && i.overall_score < 0.8)
  return e.jsxs('div', {
    className: 'space-y-6',
    children: [
      g.length > 0 &&
        e.jsxs('div', {
          className:
            'rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20',
          children: [
            e.jsxs('div', {
              className: 'mb-2 flex items-center gap-2',
              children: [
                e.jsx('span', {
                  className: 'text-xl text-red-600 dark:text-red-400',
                  children: '⚠️',
                }),
                e.jsx('h3', {
                  className: 'font-semibold text-red-800 dark:text-red-300',
                  children: l(
                    'duplicates.highConfidenceWarning',
                    'High Confidence Duplicates Detected',
                  ),
                }),
              ],
            }),
            e.jsx('p', {
              className: 'text-sm text-red-700 dark:text-red-400',
              children: l(
                'duplicates.highConfidenceMessage',
                'We found {{count}} ticket(s) with high similarity. Please review and consider merging.',
                { count: g.length },
              ),
            }),
          ],
        }),
      g.length > 0 &&
        e.jsxs('div', {
          children: [
            e.jsx('h3', {
              className: 'mb-4 text-lg font-semibold text-gray-900 dark:text-white',
              children: l('duplicates.highConfidence', 'High Confidence Duplicates'),
            }),
            e.jsx('div', {
              className: 'space-y-4',
              children: g.map((i) =>
                e.jsx(
                  N,
                  {
                    candidate: i,
                    onSelect: () => n(i),
                    onNotDuplicate: () => p.mutate(i.id),
                    isSelected: s?.id === i.id,
                  },
                  i.id,
                ),
              ),
            }),
          ],
        }),
      v.length > 0 &&
        e.jsxs('div', {
          children: [
            e.jsx('h3', {
              className: 'mb-4 text-lg font-semibold text-gray-900 dark:text-white',
              children: l('duplicates.mediumConfidence', 'Possible Duplicates'),
            }),
            e.jsx('div', {
              className: 'space-y-4',
              children: v.map((i) =>
                e.jsx(
                  N,
                  {
                    candidate: i,
                    onSelect: () => n(i),
                    onNotDuplicate: () => p.mutate(i.id),
                    isSelected: s?.id === i.id,
                  },
                  i.id,
                ),
              ),
            }),
          ],
        }),
      s &&
        e.jsx('div', {
          className:
            'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4',
          children: e.jsx('div', {
            className:
              'max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-800',
            children: e.jsxs('div', {
              className: 'p-6',
              children: [
                e.jsx('h2', {
                  className: 'mb-4 text-2xl font-bold text-gray-900 dark:text-white',
                  children: l('duplicates.mergDialog.title', 'Merge Tickets'),
                }),
                e.jsxs('div', {
                  className: 'mb-6 space-y-4',
                  children: [
                    e.jsxs('div', {
                      children: [
                        e.jsx('label', {
                          className:
                            'mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300',
                          children: l(
                            'duplicates.mergeDialog.primaryTicket',
                            'Select Primary Ticket',
                          ),
                        }),
                        e.jsx('p', {
                          className: 'mb-3 text-sm text-gray-600 dark:text-gray-400',
                          children: l(
                            'duplicates.mergeDialog.primaryTicketHelp',
                            'The primary ticket will remain active, and the other will be marked as merged.',
                          ),
                        }),
                        e.jsxs('div', {
                          className: 'space-y-2',
                          children: [
                            e.jsxs('button', {
                              onClick: () => a(t),
                              className:
                                'w-full rounded-lg border-2 border-blue-500 bg-blue-50 p-3 text-start hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30',
                              children: [
                                e.jsx('div', {
                                  className: 'font-medium text-gray-900 dark:text-white',
                                  children: l(
                                    'duplicates.mergeDialog.currentTicket',
                                    'Current Ticket',
                                  ),
                                }),
                                e.jsx('div', {
                                  className: 'text-sm text-gray-600 dark:text-gray-400',
                                  children: t,
                                }),
                              ],
                            }),
                            e.jsxs('button', {
                              onClick: () => a(s.target_ticket_id),
                              className:
                                'w-full rounded-lg border-2 border-gray-300 p-3 text-start hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700',
                              children: [
                                e.jsx('div', {
                                  className: 'font-medium text-gray-900 dark:text-white',
                                  children: s.target_ticket.ticket_number,
                                }),
                                e.jsx('div', {
                                  className: 'text-sm text-gray-600 dark:text-gray-400',
                                  children:
                                    d.language === 'ar' && s.target_ticket.title_ar
                                      ? s.target_ticket.title_ar
                                      : s.target_ticket.title,
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      children: [
                        e.jsxs('label', {
                          className:
                            'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300',
                          children: [l('duplicates.mergeDialog.reason', 'Reason for Merge'), ' *'],
                        }),
                        e.jsx('textarea', {
                          value: c,
                          onChange: (i) => o(i.target.value),
                          placeholder: l(
                            'duplicates.mergeDialog.reasonPlaceholder',
                            'Explain why these tickets should be merged',
                          ),
                          rows: 3,
                          className:
                            'w-full rounded-md border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white',
                        }),
                      ],
                    }),
                  ],
                }),
                e.jsx('div', {
                  className: 'flex gap-3',
                  children: e.jsx('button', {
                    onClick: () => {
                      ;(n(null), o(''))
                    },
                    className:
                      'flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700',
                    children: l('common.cancel', 'Cancel'),
                  }),
                }),
              ],
            }),
          }),
        }),
    ],
  })
}
function N({ candidate: t, onSelect: l, onNotDuplicate: d, isSelected: m }) {
  const { t: s, i18n: n } = j('intake'),
    c = (o) =>
      o >= 0.8
        ? 'text-red-600 bg-red-100 dark:bg-red-900/20'
        : o >= 0.65
          ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
          : 'text-green-600 bg-green-100 dark:bg-green-900/20'
  return e.jsxs('div', {
    className: `rounded-lg border-2 p-4 transition-all ${m ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'}`,
    children: [
      e.jsxs('div', {
        className: 'mb-3 flex items-start justify-between',
        children: [
          e.jsxs('div', {
            className: 'flex-1',
            children: [
              e.jsxs(D, {
                to: `/intake/tickets/${t.target_ticket_id}`,
                className: 'font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400',
                target: '_blank',
                children: [t.target_ticket.ticket_number, ' ↗'],
              }),
              e.jsx('h4', {
                className: 'mt-1 text-lg font-semibold text-gray-900 dark:text-white',
                children:
                  n.language === 'ar' && t.target_ticket.title_ar
                    ? t.target_ticket.title_ar
                    : t.target_ticket.title,
              }),
            ],
          }),
          e.jsxs('div', {
            className: `rounded-full px-3 py-1 text-sm font-semibold ${c(t.overall_score)}`,
            children: [Math.round(t.overall_score * 100), '%'],
          }),
        ],
      }),
      e.jsx('p', {
        className: 'mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400',
        children:
          n.language === 'ar' && t.target_ticket.description_ar
            ? t.target_ticket.description_ar
            : t.target_ticket.description,
      }),
      e.jsxs('div', {
        className: 'mb-4 grid grid-cols-3 gap-2',
        children: [
          e.jsxs('div', {
            className: 'text-center',
            children: [
              e.jsx('div', {
                className: 'mb-1 text-xs text-gray-500 dark:text-gray-400',
                children: s('duplicates.titleSimilarity', 'Title'),
              }),
              e.jsxs('div', {
                className: 'text-sm font-semibold text-gray-900 dark:text-white',
                children: [Math.round(t.title_similarity * 100), '%'],
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'text-center',
            children: [
              e.jsx('div', {
                className: 'mb-1 text-xs text-gray-500 dark:text-gray-400',
                children: s('duplicates.contentSimilarity', 'Content'),
              }),
              e.jsxs('div', {
                className: 'text-sm font-semibold text-gray-900 dark:text-white',
                children: [Math.round(t.content_similarity * 100), '%'],
              }),
            ],
          }),
          e.jsxs('div', {
            className: 'text-center',
            children: [
              e.jsx('div', {
                className: 'mb-1 text-xs text-gray-500 dark:text-gray-400',
                children: s('duplicates.metadataSimilarity', 'Metadata'),
              }),
              e.jsxs('div', {
                className: 'text-sm font-semibold text-gray-900 dark:text-white',
                children: [Math.round(t.metadata_similarity * 100), '%'],
              }),
            ],
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'flex gap-2',
        children: [
          e.jsx('button', {
            onClick: l,
            className:
              'flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700',
            children: s('duplicates.merge', 'Merge Tickets'),
          }),
          e.jsx('button', {
            onClick: d,
            className:
              'rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700',
            children: s('duplicates.notDuplicate', 'Not a Duplicate'),
          }),
        ],
      }),
    ],
  })
}
const E = h.lazy(() =>
  w(
    () => import('./EntityLinkManager-HzbH6mRj.js'),
    __vite__mapDeps([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]),
  ),
)
function I() {
  const { t, i18n: l } = j('intake'),
    { id: d } = T({ strict: !1 }),
    m = S(),
    [s, n] = h.useState('details'),
    { data: c, isLoading: o, error: k } = $(d || ''),
    r = c?.ticket,
    u = c?.attachments || []
  q(d || '')
  const x = z(d || ''),
    b = R(d || ''),
    p = (a) =>
      ({
        draft: 'bg-gray-200 text-gray-800',
        submitted: 'bg-blue-100 text-blue-800',
        triaged: 'bg-purple-100 text-purple-800',
        assigned: 'bg-yellow-100 text-yellow-800',
        in_progress: 'bg-indigo-100 text-indigo-800',
        converted: 'bg-green-100 text-green-800',
        closed: 'bg-gray-300 text-gray-700',
        merged: 'bg-orange-100 text-orange-800',
      })[a] || 'bg-gray-200 text-gray-800'
  return o
    ? e.jsx('div', {
        className: 'container mx-auto px-4 py-8',
        children: e.jsxs('div', {
          className: 'py-12 text-center',
          children: [
            e.jsx('div', {
              className:
                'inline-block size-12 animate-spin rounded-full border-b-2 border-gray-900 dark:border-white',
            }),
            e.jsx('p', {
              className: 'mt-4 text-gray-600 dark:text-gray-400',
              children: t('common.loading', 'Loading...'),
            }),
          ],
        }),
      })
    : k || !r
      ? e.jsx('div', {
          className: 'container mx-auto px-4 py-8',
          children: e.jsx('div', {
            className:
              'rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400',
            children: t('ticketDetail.error', 'Failed to load ticket. Please try again.'),
          }),
        })
      : e.jsxs('div', {
          className: 'container mx-auto px-4 py-8',
          dir: l.language === 'ar' ? 'rtl' : 'ltr',
          children: [
            e.jsxs('div', {
              className: 'mb-6',
              children: [
                e.jsxs('div', {
                  className: 'mb-4 flex items-center justify-between',
                  children: [
                    e.jsxs('div', {
                      children: [
                        e.jsx('h1', {
                          className: 'mb-2 text-3xl font-bold text-gray-900 dark:text-white',
                          children: r.ticket_number,
                        }),
                        e.jsx('p', {
                          className: 'text-gray-600 dark:text-gray-400',
                          children: l.language === 'ar' && r.title_ar ? r.title_ar : r.title,
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      className: 'flex items-center gap-3',
                      children: [
                        e.jsx('span', {
                          className: `inline-flex rounded-full px-4 py-2 text-sm font-semibold ${p(r.status)}`,
                          children: t(`queue.status.${r.status}`),
                        }),
                        e.jsx('button', {
                          onClick: () => m({ to: '/intake/queue' }),
                          className:
                            'rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
                          children: t('common.back', 'Back to Queue'),
                        }),
                      ],
                    }),
                  ],
                }),
                r.status !== 'closed' &&
                  r.status !== 'converted' &&
                  r.submitted_at &&
                  e.jsxs('div', {
                    className: 'mb-6 grid grid-cols-1 gap-4 md:grid-cols-2',
                    children: [
                      e.jsx(f, {
                        ticketId: r.id,
                        targetMinutes: r.priority === 'urgent' || r.priority === 'high' ? 30 : 60,
                        eventType: 'acknowledgment',
                        startedAt: r.submitted_at,
                      }),
                      e.jsx(f, {
                        ticketId: r.id,
                        targetMinutes:
                          r.priority === 'urgent' || r.priority === 'high' ? 480 : 1440,
                        eventType: 'resolution',
                        startedAt: r.submitted_at,
                      }),
                    ],
                  }),
              ],
            }),
            e.jsx('div', {
              className: 'mb-6 border-b border-gray-200 dark:border-gray-700',
              children: e.jsx('nav', {
                className: '-mb-px flex',
                children: ['details', 'triage', 'duplicates', 'history', 'links'].map((a) =>
                  e.jsx(
                    'button',
                    {
                      onClick: () => n(a),
                      className: `border-b-2 px-6 py-3 text-sm font-medium transition-colors ${s === a ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`,
                      children: t(`ticketDetail.tabs.${a}`, a.charAt(0).toUpperCase() + a.slice(1)),
                    },
                    a,
                  ),
                ),
              }),
            }),
            e.jsxs('div', {
              className: 'rounded-lg bg-white p-6 shadow-md dark:bg-gray-800',
              children: [
                s === 'details' &&
                  e.jsxs('div', {
                    className: 'space-y-6',
                    children: [
                      e.jsxs('div', {
                        className: 'grid grid-cols-1 gap-6 md:grid-cols-2',
                        children: [
                          e.jsxs('div', {
                            children: [
                              e.jsx('label', {
                                className:
                                  'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300',
                                children: t('ticketDetail.requestType', 'Request Type'),
                              }),
                              e.jsx('p', {
                                className: 'text-gray-900 dark:text-white',
                                children: t(`form.requestType.options.${r.requestType}`),
                              }),
                            ],
                          }),
                          e.jsxs('div', {
                            children: [
                              e.jsx('label', {
                                className:
                                  'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300',
                                children: t('ticketDetail.urgency', 'Urgency'),
                              }),
                              e.jsx('p', {
                                className: 'text-gray-900 dark:text-white',
                                children: t(`queue.urgency.${r.urgency}`),
                              }),
                            ],
                          }),
                          e.jsxs('div', {
                            children: [
                              e.jsx('label', {
                                className:
                                  'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300',
                                children: t('ticketDetail.sensitivity', 'Sensitivity'),
                              }),
                              e.jsx('p', {
                                className: 'capitalize text-gray-900 dark:text-white',
                                children: r.sensitivity,
                              }),
                            ],
                          }),
                          e.jsxs('div', {
                            children: [
                              e.jsx('label', {
                                className:
                                  'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300',
                                children: t('ticketDetail.priority', 'Priority'),
                              }),
                              e.jsx('p', {
                                className: 'text-gray-900 dark:text-white',
                                children: t(`queue.priority.${r.priority}`),
                              }),
                            ],
                          }),
                        ],
                      }),
                      e.jsxs('div', {
                        children: [
                          e.jsx('label', {
                            className:
                              'mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300',
                            children: t('ticketDetail.description', 'Description'),
                          }),
                          e.jsx('div', {
                            className: 'rounded-lg bg-gray-50 p-4 dark:bg-gray-900',
                            children: e.jsx('p', {
                              className: 'whitespace-pre-wrap text-gray-900 dark:text-white',
                              children:
                                l.language === 'ar' && r.description_ar
                                  ? r.description_ar
                                  : r.description,
                            }),
                          }),
                        ],
                      }),
                      r.type_specific_fields &&
                        Object.keys(r.type_specific_fields).length > 0 &&
                        e.jsxs('div', {
                          children: [
                            e.jsx('label', {
                              className:
                                'mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300',
                              children: t('ticketDetail.additionalInfo', 'Additional Information'),
                            }),
                            e.jsx('div', {
                              className: 'space-y-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-900',
                              children: Object.entries(r.type_specific_fields).map(([a, g]) =>
                                e.jsxs(
                                  'div',
                                  {
                                    className: 'flex justify-between',
                                    children: [
                                      e.jsxs('span', {
                                        className: 'capitalize text-gray-600 dark:text-gray-400',
                                        children: [a, ':'],
                                      }),
                                      e.jsx('span', {
                                        className: 'text-gray-900 dark:text-white',
                                        children: String(g),
                                      }),
                                    ],
                                  },
                                  a,
                                ),
                              ),
                            }),
                          ],
                        }),
                      u &&
                        u.length > 0 &&
                        e.jsxs('div', {
                          children: [
                            e.jsx('label', {
                              className:
                                'mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300',
                              children: t('ticketDetail.attachments', 'Attachments'),
                            }),
                            e.jsx('div', {
                              className: 'space-y-2',
                              children: u.map((a) =>
                                e.jsxs(
                                  'div',
                                  {
                                    className:
                                      'flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-900',
                                    children: [
                                      e.jsxs('div', {
                                        className: 'flex items-center gap-3',
                                        children: [
                                          e.jsx('span', { className: 'text-2xl', children: '📎' }),
                                          e.jsxs('div', {
                                            children: [
                                              e.jsx('p', {
                                                className:
                                                  'text-sm font-medium text-gray-900 dark:text-white',
                                                children: a.file_name,
                                              }),
                                              e.jsxs('p', {
                                                className:
                                                  'text-xs text-gray-500 dark:text-gray-400',
                                                children: [
                                                  (a.file_size / 1024 / 1024).toFixed(2),
                                                  ' MB',
                                                ],
                                              }),
                                            ],
                                          }),
                                        ],
                                      }),
                                      e.jsx('button', {
                                        className:
                                          'text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400',
                                        children: t('common.download', 'Download'),
                                      }),
                                    ],
                                  },
                                  a.id,
                                ),
                              ),
                            }),
                          ],
                        }),
                      r.status !== 'closed' &&
                        r.status !== 'converted' &&
                        e.jsxs('div', {
                          className:
                            'flex gap-3 border-t border-gray-200 pt-4 dark:border-gray-700',
                          children: [
                            r.status === 'triaged' &&
                              e.jsx('button', {
                                onClick: () => {
                                  const a = window.prompt(
                                    t(
                                      'ticketDetail.convertPrompt',
                                      'Enter target type (dossier/engagement/position):',
                                    ),
                                  )
                                  a && x.mutate({ targetType: a })
                                },
                                disabled: x.isPending,
                                className:
                                  'rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50',
                                children: t('ticketDetail.convert', 'Convert to Artifact'),
                              }),
                            e.jsx('button', {
                              onClick: () => {
                                const a = window.prompt(
                                  t('ticketDetail.closePrompt', 'Enter resolution:'),
                                )
                                a &&
                                  b.mutate({
                                    resolution: a,
                                    resolutionAr: l.language === 'ar' ? a : void 0,
                                  })
                              },
                              disabled: b.isPending,
                              className:
                                'rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 disabled:opacity-50',
                              children: t('ticketDetail.close', 'Close Ticket'),
                            }),
                          ],
                        }),
                    ],
                  }),
                s === 'triage' && e.jsx(M, { ticketId: r.id }),
                s === 'duplicates' && e.jsx(L, { ticketId: r.id }),
                s === 'history' &&
                  e.jsx('div', {
                    className: 'text-gray-600 dark:text-gray-400',
                    children: t(
                      'ticketDetail.historyPlaceholder',
                      'Audit history will be displayed here',
                    ),
                  }),
                s === 'links' &&
                  e.jsx(h.Suspense, {
                    fallback: e.jsxs('div', {
                      className: 'flex items-center justify-center py-12',
                      children: [
                        e.jsx('div', {
                          className:
                            'inline-block size-12 animate-spin rounded-full border-b-2 border-gray-900 dark:border-white',
                        }),
                        e.jsx('p', {
                          className: 'ms-4 text-gray-600 dark:text-gray-400',
                          children: t('common.loading', 'Loading...'),
                        }),
                      ],
                    }),
                    children: e.jsx(E, {
                      intakeId: r.id,
                      organizationId: r.organization_id,
                      classificationLevel: r.classification_level || 0,
                      canRestore: !1,
                      enableReorder: !0,
                    }),
                  }),
              ],
            }),
          ],
        })
}
function Z() {
  return e.jsx(I, {})
}
export { Z as component }
//# sourceMappingURL=tickets._id-bwtpQbRp.js.map
