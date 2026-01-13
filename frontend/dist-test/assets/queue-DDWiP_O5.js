import { u as j, r as x, j as e } from './react-vendor-Buoak6m3.js'
import { L as c } from './tanstack-vendor-BZC-rs5U.js'
import { S as v } from './SLACountdown-Bedgm05V.js'
import { d as f } from './useIntakeApi-84Q7PHHY.js'
import './vendor-misc-BiJvMP0A.js'
import './visualization-vendor-f5uYUx4I.js'
import './date-vendor-s0MkYge4.js'
import './supabase-vendor-CTsC8ILD.js'
import './index-qYY0KoZ1.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './form-vendor-BX1BhTCI.js'
function w() {
  const { t, i18n: n } = j('intake'),
    [a, g] = x.useState({}),
    [i, d] = x.useState(1),
    o = 25,
    {
      data: s,
      isLoading: m,
      error: p,
    } = f({
      status: a.status,
      requestType: a.requestType,
      sensitivity: a.sensitivity,
      urgency: a.urgency,
      assignedUnit: a.assignedUnit,
      page: i,
      limit: o,
    }),
    l = (r, u) => {
      ;(g((k) => ({ ...k, [r]: u || void 0 })), d(1))
    },
    y = () => {
      ;(g({}), d(1))
    },
    h = (r) =>
      ({
        draft: 'bg-gray-200 text-gray-800',
        submitted: 'bg-blue-100 text-blue-800',
        triaged: 'bg-purple-100 text-purple-800',
        assigned: 'bg-yellow-100 text-yellow-800',
        in_progress: 'bg-indigo-100 text-indigo-800',
        converted: 'bg-green-100 text-green-800',
        closed: 'bg-gray-300 text-gray-700',
        merged: 'bg-orange-100 text-orange-800',
      })[r] || 'bg-gray-200 text-gray-800',
    b = (r) =>
      ({
        low: 'text-green-600',
        medium: 'text-yellow-600',
        high: 'text-orange-600',
        urgent: 'text-red-600',
      })[r] || 'text-gray-600'
  return e.jsxs('div', {
    className: 'container mx-auto px-4 py-8',
    dir: n.language === 'ar' ? 'rtl' : 'ltr',
    children: [
      e.jsxs('div', {
        className: 'mb-6 flex items-start justify-between',
        children: [
          e.jsxs('div', {
            children: [
              e.jsx('h1', {
                className: 'mb-2 text-3xl font-bold text-gray-900 dark:text-white',
                children: t('queue.title', 'Intake Queue'),
              }),
              e.jsx('p', {
                className: 'text-gray-600 dark:text-gray-400',
                children: t('queue.subtitle', 'Manage and triage incoming support requests'),
              }),
            ],
          }),
          e.jsxs(c, {
            to: '/intake/new',
            className:
              'inline-flex items-center rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700',
            children: [
              e.jsx('svg', {
                className: 'me-2 size-5',
                fill: 'none',
                stroke: 'currentColor',
                viewBox: '0 0 24 24',
                children: e.jsx('path', {
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                  strokeWidth: 2,
                  d: 'M12 4v16m8-8H4',
                }),
              }),
              t('queue.createTicket', 'Create New Ticket'),
            ],
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'mb-6 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800',
        children: [
          e.jsxs('div', {
            className: 'mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4',
            children: [
              e.jsxs('div', {
                children: [
                  e.jsx('label', {
                    className: 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300',
                    children: t('queue.filters.status', 'Status'),
                  }),
                  e.jsxs('select', {
                    value: a.status || '',
                    onChange: (r) => l('status', r.target.value),
                    className:
                      'w-full rounded-md border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white',
                    children: [
                      e.jsx('option', { value: '', children: t('queue.filters.all', 'All') }),
                      e.jsx('option', {
                        value: 'submitted',
                        children: t('queue.status.submitted', 'Submitted'),
                      }),
                      e.jsx('option', {
                        value: 'triaged',
                        children: t('queue.status.triaged', 'Triaged'),
                      }),
                      e.jsx('option', {
                        value: 'assigned',
                        children: t('queue.status.assigned', 'Assigned'),
                      }),
                      e.jsx('option', {
                        value: 'in_progress',
                        children: t('queue.status.in_progress', 'In Progress'),
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs('div', {
                children: [
                  e.jsx('label', {
                    className: 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300',
                    children: t('queue.filters.requestType', 'Request Type'),
                  }),
                  e.jsxs('select', {
                    value: a.requestType || '',
                    onChange: (r) => l('requestType', r.target.value),
                    className:
                      'w-full rounded-md border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white',
                    children: [
                      e.jsx('option', { value: '', children: t('queue.filters.all', 'All') }),
                      e.jsx('option', {
                        value: 'engagement',
                        children: t('intake.form.requestType.options.engagement'),
                      }),
                      e.jsx('option', {
                        value: 'position',
                        children: t('intake.form.requestType.options.position'),
                      }),
                      e.jsx('option', {
                        value: 'mou_action',
                        children: t('intake.form.requestType.options.mou_action'),
                      }),
                      e.jsx('option', {
                        value: 'foresight',
                        children: t('intake.form.requestType.options.foresight'),
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs('div', {
                children: [
                  e.jsx('label', {
                    className: 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300',
                    children: t('queue.filters.urgency', 'Urgency'),
                  }),
                  e.jsxs('select', {
                    value: a.urgency || '',
                    onChange: (r) => l('urgency', r.target.value),
                    className:
                      'w-full rounded-md border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white',
                    children: [
                      e.jsx('option', { value: '', children: t('queue.filters.all', 'All') }),
                      e.jsx('option', { value: 'low', children: t('queue.urgency.low', 'Low') }),
                      e.jsx('option', {
                        value: 'medium',
                        children: t('queue.urgency.medium', 'Medium'),
                      }),
                      e.jsx('option', { value: 'high', children: t('queue.urgency.high', 'High') }),
                      e.jsx('option', {
                        value: 'critical',
                        children: t('queue.urgency.critical', 'Critical'),
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs('div', {
                children: [
                  e.jsx('label', {
                    className: 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300',
                    children: t('queue.filters.search', 'Search'),
                  }),
                  e.jsx('input', {
                    type: 'text',
                    value: a.search || '',
                    onChange: (r) => l('search', r.target.value),
                    placeholder: t('queue.filters.searchPlaceholder', 'Search tickets...'),
                    className:
                      'w-full rounded-md border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white',
                  }),
                ],
              }),
            ],
          }),
          Object.keys(a).length > 0 &&
            e.jsx('button', {
              onClick: y,
              className:
                'text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300',
              children: t('queue.filters.clear', 'Clear all filters'),
            }),
        ],
      }),
      m
        ? e.jsxs('div', {
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
          })
        : p
          ? e.jsx('div', {
              className:
                'rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400',
              children: t('queue.error', 'Failed to load tickets. Please try again.'),
            })
          : !s?.tickets || s.tickets.length === 0
            ? e.jsx('div', {
                className: 'rounded-lg bg-gray-50 p-12 text-center dark:bg-gray-800',
                children: e.jsx('p', {
                  className: 'text-lg text-gray-600 dark:text-gray-400',
                  children: t('queue.noTickets', 'No tickets found'),
                }),
              })
            : e.jsxs(e.Fragment, {
                children: [
                  e.jsx('div', {
                    className: 'overflow-hidden rounded-lg bg-white shadow-md dark:bg-gray-800',
                    children: e.jsx('div', {
                      className: 'overflow-x-auto',
                      children: e.jsxs('table', {
                        className: 'min-w-full divide-y divide-gray-200 dark:divide-gray-700',
                        children: [
                          e.jsx('thead', {
                            className: 'bg-gray-50 dark:bg-gray-900',
                            children: e.jsxs('tr', {
                              children: [
                                e.jsx('th', {
                                  className:
                                    'px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400',
                                  children: t('queue.table.ticketNumber', 'Ticket #'),
                                }),
                                e.jsx('th', {
                                  className:
                                    'px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400',
                                  children: t('queue.table.title', 'Title'),
                                }),
                                e.jsx('th', {
                                  className:
                                    'px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400',
                                  children: t('queue.table.type', 'Type'),
                                }),
                                e.jsx('th', {
                                  className:
                                    'px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400',
                                  children: t('queue.table.priority', 'Priority'),
                                }),
                                e.jsx('th', {
                                  className:
                                    'px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400',
                                  children: t('queue.table.status', 'Status'),
                                }),
                                e.jsx('th', {
                                  className:
                                    'px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400',
                                  children: t('queue.table.sla', 'SLA'),
                                }),
                                e.jsx('th', {
                                  className:
                                    'px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400',
                                  children: t('queue.table.created', 'Created'),
                                }),
                              ],
                            }),
                          }),
                          e.jsx('tbody', {
                            className:
                              'divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800',
                            children: s.tickets.map((r) =>
                              e.jsxs(
                                'tr',
                                {
                                  className:
                                    'cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700',
                                  children: [
                                    e.jsx('td', {
                                      className: 'whitespace-nowrap px-6 py-4',
                                      children: e.jsx(c, {
                                        to: `/intake/tickets/${r.id}`,
                                        className:
                                          'font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300',
                                        children: r.ticket_number,
                                      }),
                                    }),
                                    e.jsx('td', {
                                      className: 'px-6 py-4',
                                      children: e.jsx('div', {
                                        className:
                                          'text-sm font-medium text-gray-900 dark:text-white',
                                        children:
                                          n.language === 'ar' && r.title_ar ? r.title_ar : r.title,
                                      }),
                                    }),
                                    e.jsx('td', {
                                      className:
                                        'whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-300',
                                      children: t(
                                        `intake.form.requestType.options.${r.request_type}`,
                                      ),
                                    }),
                                    e.jsx('td', {
                                      className: 'whitespace-nowrap px-6 py-4',
                                      children: e.jsx('span', {
                                        className: `text-sm font-semibold ${b(r.priority)}`,
                                        children: t(`intake.queue.priority.${r.priority}`),
                                      }),
                                    }),
                                    e.jsx('td', {
                                      className: 'whitespace-nowrap px-6 py-4',
                                      children: e.jsx('span', {
                                        className: `inline-flex rounded-full px-3 py-1 text-xs font-semibold leading-5 ${h(r.status)}`,
                                        children: t(`intake.queue.status.${r.status}`),
                                      }),
                                    }),
                                    e.jsx('td', {
                                      className: 'px-6 py-4',
                                      children:
                                        r.status !== 'closed' &&
                                        r.status !== 'converted' &&
                                        r.submitted_at &&
                                        e.jsx(v, {
                                          ticketId: r.id,
                                          targetMinutes:
                                            r.priority === 'urgent' || r.priority === 'high'
                                              ? 480
                                              : 1440,
                                          eventType: 'resolution',
                                          startedAt: r.submitted_at,
                                          className: 'max-w-xs',
                                        }),
                                    }),
                                    e.jsx('td', {
                                      className:
                                        'whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400',
                                      children: new Date(r.created_at).toLocaleDateString(
                                        n.language,
                                      ),
                                    }),
                                  ],
                                },
                                r.id,
                              ),
                            ),
                          }),
                        ],
                      }),
                    }),
                  }),
                  s.total_pages > 1 &&
                    e.jsxs('div', {
                      className: 'mt-6 flex items-center justify-between',
                      children: [
                        e.jsxs('div', {
                          className: 'text-sm text-gray-600 dark:text-gray-400',
                          children: [
                            t('queue.pagination.showing', 'Showing'),
                            ' ',
                            (i - 1) * o + 1,
                            ' -',
                            ' ',
                            Math.min(i * o, s.total_count),
                            ' ',
                            t('queue.pagination.of', 'of'),
                            ' ',
                            s.total_count,
                            ' ',
                            t('queue.pagination.tickets', 'tickets'),
                          ],
                        }),
                        e.jsxs('div', {
                          className: 'flex gap-2',
                          children: [
                            e.jsx('button', {
                              onClick: () => d((r) => Math.max(1, r - 1)),
                              disabled: i === 1,
                              className:
                                'rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
                              children: t('queue.pagination.previous', 'Previous'),
                            }),
                            e.jsxs('span', {
                              className: 'px-4 py-2 text-sm text-gray-700 dark:text-gray-300',
                              children: [
                                t('queue.pagination.page', 'Page'),
                                ' ',
                                i,
                                ' ',
                                t('queue.pagination.of', 'of'),
                                ' ',
                                s.total_pages,
                              ],
                            }),
                            e.jsx('button', {
                              onClick: () => d((r) => Math.min(s.total_pages, r + 1)),
                              disabled: i === s.total_pages,
                              className:
                                'rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
                              children: t('queue.pagination.next', 'Next'),
                            }),
                          ],
                        }),
                      ],
                    }),
                ],
              }),
    ],
  })
}
function z() {
  return e.jsx(w, {})
}
export { z as component }
//# sourceMappingURL=queue-DDWiP_O5.js.map
