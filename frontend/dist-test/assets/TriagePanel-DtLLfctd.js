import { u as f, r as g, j as e } from './react-vendor-Buoak6m3.js'
import { b as w, c as N } from './useIntakeApi-84Q7PHHY.js'
function A({ ticketId: o, onSuccess: c }) {
  const { t, i18n: m } = f('intake'),
    [b, u] = g.useState(!1),
    [s, i] = g.useState({}),
    [d, n] = g.useState(''),
    { data: a, isLoading: h, error: x } = w(o),
    v = !x,
    l = N(o),
    p = () => {
      a &&
        l.mutate(
          {
            decision_type: 'ai_suggestion',
            suggested_type: a.suggested_type,
            suggested_sensitivity: a.suggested_sensitivity,
            suggested_urgency: a.suggested_urgency,
            suggested_assignee: a.suggested_assignee,
            suggested_unit: a.suggested_unit,
          },
          {
            onSuccess: () => {
              c?.()
            },
          },
        )
    },
    y = () => {
      if (!d.trim()) {
        alert(t('triage.overrideReasonRequired', 'Please provide a reason for the override'))
        return
      }
      l.mutate(
        {
          decision_type: 'manual_override',
          suggested_type: s.suggested_type,
          suggested_sensitivity: s.suggested_sensitivity,
          suggested_urgency: s.suggested_urgency,
          suggested_assignee: s.suggested_assignee,
          suggested_unit: s.suggested_unit,
          override_reason: d,
          override_reason_ar: m.language === 'ar' ? d : void 0,
        },
        {
          onSuccess: () => {
            c?.()
          },
        },
      )
    },
    j = (r) =>
      r
        ? r >= 0.8
          ? 'text-green-600'
          : r >= 0.6
            ? 'text-yellow-600'
            : 'text-orange-600'
        : 'text-gray-500',
    k = (r) =>
      r
        ? r >= 0.8
          ? t('triage.confidence.high', 'High')
          : r >= 0.6
            ? t('triage.confidence.medium', 'Medium')
            : t('triage.confidence.low', 'Low')
        : t('triage.confidence.unknown', 'Unknown')
  return h
    ? e.jsxs('div', {
        className: 'py-8 text-center',
        children: [
          e.jsx('div', {
            className: 'inline-block size-8 animate-spin rounded-full border-b-2 border-blue-600',
          }),
          e.jsx('p', {
            className: 'mt-4 text-gray-600 dark:text-gray-400',
            children: t('triage.loadingSuggestions', 'Analyzing ticket...'),
          }),
        ],
      })
    : x || !a
      ? e.jsxs('div', {
          className: 'space-y-4',
          children: [
            !v &&
              e.jsxs('div', {
                className:
                  'rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20',
                children: [
                  e.jsxs('div', {
                    className: 'mb-2 flex items-center gap-2',
                    children: [
                      e.jsx('span', {
                        className: 'text-xl text-yellow-600 dark:text-yellow-400',
                        children: '⚠️',
                      }),
                      e.jsx('h3', {
                        className: 'font-semibold text-yellow-800 dark:text-yellow-300',
                        children: t('triage.aiUnavailable', 'AI Triage Temporarily Unavailable'),
                      }),
                    ],
                  }),
                  e.jsx('p', {
                    className: 'text-sm text-yellow-700 dark:text-yellow-400',
                    children: t(
                      'triage.aiUnavailableMessage',
                      'AI triage suggestions are currently unavailable. Please perform manual triage or try again later.',
                    ),
                  }),
                ],
              }),
            e.jsxs('div', {
              className: 'rounded-lg bg-gray-50 p-6 dark:bg-gray-900',
              children: [
                e.jsx('h3', {
                  className: 'mb-4 text-lg font-semibold text-gray-900 dark:text-white',
                  children: t('triage.manualTriage', 'Manual Triage'),
                }),
                e.jsxs('div', {
                  className: 'space-y-4',
                  children: [
                    e.jsxs('div', {
                      children: [
                        e.jsx('label', {
                          className:
                            'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300',
                          children: t('triage.sensitivity', 'Sensitivity Level'),
                        }),
                        e.jsxs('select', {
                          value: s.suggested_sensitivity || '',
                          onChange: (r) => i({ ...s, suggested_sensitivity: r.target.value }),
                          className:
                            'w-full rounded-md border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white',
                          children: [
                            e.jsx('option', {
                              value: '',
                              children: t('common.select', 'Select...'),
                            }),
                            e.jsx('option', {
                              value: 'public',
                              children: t('triage.sensitivityLevels.public', 'Public'),
                            }),
                            e.jsx('option', {
                              value: 'internal',
                              children: t('triage.sensitivityLevels.internal', 'Internal'),
                            }),
                            e.jsx('option', {
                              value: 'confidential',
                              children: t('triage.sensitivityLevels.confidential', 'Confidential'),
                            }),
                            e.jsx('option', {
                              value: 'secret',
                              children: t('triage.sensitivityLevels.secret', 'Secret'),
                            }),
                          ],
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      children: [
                        e.jsx('label', {
                          className:
                            'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300',
                          children: t('triage.urgency', 'Urgency'),
                        }),
                        e.jsxs('select', {
                          value: s.suggested_urgency || '',
                          onChange: (r) => i({ ...s, suggested_urgency: r.target.value }),
                          className:
                            'w-full rounded-md border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white',
                          children: [
                            e.jsx('option', {
                              value: '',
                              children: t('common.select', 'Select...'),
                            }),
                            e.jsx('option', {
                              value: 'low',
                              children: t('queue.urgency.low', 'Low'),
                            }),
                            e.jsx('option', {
                              value: 'medium',
                              children: t('queue.urgency.medium', 'Medium'),
                            }),
                            e.jsx('option', {
                              value: 'high',
                              children: t('queue.urgency.high', 'High'),
                            }),
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
                          className:
                            'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300',
                          children: t('triage.assignedUnit', 'Assigned Unit'),
                        }),
                        e.jsx('input', {
                          type: 'text',
                          value: s.suggested_unit || '',
                          onChange: (r) => i({ ...s, suggested_unit: r.target.value }),
                          placeholder: t('triage.assignedUnitPlaceholder', 'Enter unit name'),
                          className:
                            'w-full rounded-md border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white',
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      children: [
                        e.jsx('label', {
                          className:
                            'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300',
                          children: t('triage.reason', 'Reason'),
                        }),
                        e.jsx('textarea', {
                          value: d,
                          onChange: (r) => n(r.target.value),
                          placeholder: t(
                            'triage.reasonPlaceholder',
                            'Explain your triage decision',
                          ),
                          rows: 3,
                          className:
                            'w-full rounded-md border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white',
                        }),
                      ],
                    }),
                    e.jsx('button', {
                      onClick: y,
                      disabled: l.isPending || !d.trim(),
                      className:
                        'w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50',
                      children: l.isPending
                        ? t('triage.applying', 'Applying...')
                        : t('triage.applyManualTriage', 'Apply Manual Triage'),
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      : e.jsxs('div', {
          className: 'space-y-6',
          children: [
            e.jsx('div', {
              className:
                'rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20',
              children: e.jsxs('div', {
                className: 'flex items-center justify-between',
                children: [
                  e.jsxs('div', {
                    className: 'flex items-center gap-2',
                    children: [
                      e.jsx('span', {
                        className: 'text-xl text-blue-600 dark:text-blue-400',
                        children: '🤖',
                      }),
                      e.jsxs('div', {
                        children: [
                          e.jsx('h3', {
                            className: 'font-semibold text-blue-800 dark:text-blue-300',
                            children: t('triage.aiSuggestions', 'AI-Powered Suggestions'),
                          }),
                          e.jsxs('p', {
                            className: 'text-sm text-blue-600 dark:text-blue-400',
                            children: [
                              t('triage.modelInfo', 'Model'),
                              ': ',
                              a.model_name || 'Unknown',
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  e.jsx('div', {
                    className: `rounded-full px-3 py-1 text-sm font-semibold ${j(a.confidence_score)} bg-white dark:bg-gray-800`,
                    children: k(a.confidence_score),
                  }),
                ],
              }),
            }),
            b
              ? e.jsxs('div', {
                  className: 'space-y-4',
                  children: [
                    e.jsx('h3', {
                      className: 'text-lg font-semibold text-gray-900 dark:text-white',
                      children: t('triage.overrideTitle', 'Override AI Suggestions'),
                    }),
                    e.jsxs('div', {
                      className: 'grid grid-cols-1 gap-4 md:grid-cols-2',
                      children: [
                        e.jsxs('div', {
                          children: [
                            e.jsx('label', {
                              className:
                                'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300',
                              children: t('triage.sensitivity', 'Sensitivity Level'),
                            }),
                            e.jsxs('select', {
                              value: s.suggested_sensitivity || '',
                              onChange: (r) => i({ ...s, suggested_sensitivity: r.target.value }),
                              className:
                                'w-full rounded-md border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white',
                              children: [
                                e.jsx('option', {
                                  value: 'public',
                                  children: t('triage.sensitivityLevels.public', 'Public'),
                                }),
                                e.jsx('option', {
                                  value: 'internal',
                                  children: t('triage.sensitivityLevels.internal', 'Internal'),
                                }),
                                e.jsx('option', {
                                  value: 'confidential',
                                  children: t(
                                    'triage.sensitivityLevels.confidential',
                                    'Confidential',
                                  ),
                                }),
                                e.jsx('option', {
                                  value: 'secret',
                                  children: t('triage.sensitivityLevels.secret', 'Secret'),
                                }),
                              ],
                            }),
                          ],
                        }),
                        e.jsxs('div', {
                          children: [
                            e.jsx('label', {
                              className:
                                'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300',
                              children: t('triage.urgency', 'Urgency'),
                            }),
                            e.jsxs('select', {
                              value: s.suggested_urgency || '',
                              onChange: (r) => i({ ...s, suggested_urgency: r.target.value }),
                              className:
                                'w-full rounded-md border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white',
                              children: [
                                e.jsx('option', {
                                  value: 'low',
                                  children: t('queue.urgency.low', 'Low'),
                                }),
                                e.jsx('option', {
                                  value: 'medium',
                                  children: t('queue.urgency.medium', 'Medium'),
                                }),
                                e.jsx('option', {
                                  value: 'high',
                                  children: t('queue.urgency.high', 'High'),
                                }),
                                e.jsx('option', {
                                  value: 'critical',
                                  children: t('queue.urgency.critical', 'Critical'),
                                }),
                              ],
                            }),
                          ],
                        }),
                        e.jsxs('div', {
                          className: 'md:col-span-2',
                          children: [
                            e.jsx('label', {
                              className:
                                'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300',
                              children: t('triage.assignedUnit', 'Assigned Unit'),
                            }),
                            e.jsx('input', {
                              type: 'text',
                              value: s.suggested_unit || '',
                              onChange: (r) => i({ ...s, suggested_unit: r.target.value }),
                              className:
                                'w-full rounded-md border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white',
                            }),
                          ],
                        }),
                        e.jsxs('div', {
                          className: 'md:col-span-2',
                          children: [
                            e.jsxs('label', {
                              className:
                                'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300',
                              children: [t('triage.overrideReason', 'Reason for Override'), ' *'],
                            }),
                            e.jsx('textarea', {
                              value: d,
                              onChange: (r) => n(r.target.value),
                              placeholder: t(
                                'triage.overrideReasonPlaceholder',
                                'Explain why you are overriding the AI suggestions',
                              ),
                              rows: 3,
                              className:
                                'w-full rounded-md border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white',
                            }),
                          ],
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      className: 'flex gap-3 border-t border-gray-200 pt-4 dark:border-gray-700',
                      children: [
                        e.jsx('button', {
                          onClick: y,
                          disabled: l.isPending || !d.trim(),
                          className:
                            'flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50',
                          children: l.isPending
                            ? t('triage.applying', 'Applying...')
                            : t('triage.applyOverride', 'Apply Override'),
                        }),
                        e.jsx('button', {
                          onClick: () => {
                            ;(u(!1), i({}), n(''))
                          },
                          className:
                            'rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700',
                          children: t('common.cancel', 'Cancel'),
                        }),
                      ],
                    }),
                  ],
                })
              : e.jsxs('div', {
                  className: 'space-y-4',
                  children: [
                    e.jsxs('div', {
                      className: 'grid grid-cols-1 gap-4 md:grid-cols-2',
                      children: [
                        a.suggested_type &&
                          e.jsxs('div', {
                            className: 'rounded-lg bg-gray-50 p-4 dark:bg-gray-900',
                            children: [
                              e.jsx('label', {
                                className:
                                  'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300',
                                children: t('triage.requestType', 'Request Type'),
                              }),
                              e.jsx('p', {
                                className: 'font-semibold text-gray-900 dark:text-white',
                                children: t(`intake.form.requestType.options.${a.suggested_type}`),
                              }),
                            ],
                          }),
                        a.suggested_sensitivity &&
                          e.jsxs('div', {
                            className: 'rounded-lg bg-gray-50 p-4 dark:bg-gray-900',
                            children: [
                              e.jsx('label', {
                                className:
                                  'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300',
                                children: t('triage.sensitivity', 'Sensitivity'),
                              }),
                              e.jsx('p', {
                                className: 'font-semibold capitalize text-gray-900 dark:text-white',
                                children: a.suggested_sensitivity,
                              }),
                            ],
                          }),
                        a.suggested_urgency &&
                          e.jsxs('div', {
                            className: 'rounded-lg bg-gray-50 p-4 dark:bg-gray-900',
                            children: [
                              e.jsx('label', {
                                className:
                                  'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300',
                                children: t('triage.urgency', 'Urgency'),
                              }),
                              e.jsx('p', {
                                className: 'font-semibold text-gray-900 dark:text-white',
                                children: t(`queue.urgency.${a.suggested_urgency}`),
                              }),
                            ],
                          }),
                        a.suggested_unit &&
                          e.jsxs('div', {
                            className: 'rounded-lg bg-gray-50 p-4 dark:bg-gray-900',
                            children: [
                              e.jsx('label', {
                                className:
                                  'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300',
                                children: t('triage.assignedUnit', 'Assigned Unit'),
                              }),
                              e.jsx('p', {
                                className: 'font-semibold text-gray-900 dark:text-white',
                                children: a.suggested_unit,
                              }),
                            ],
                          }),
                      ],
                    }),
                    e.jsxs('div', {
                      className: 'flex gap-3 border-t border-gray-200 pt-4 dark:border-gray-700',
                      children: [
                        e.jsx('button', {
                          onClick: p,
                          disabled: l.isPending,
                          className:
                            'flex-1 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50',
                          children: l.isPending
                            ? t('triage.applying', 'Applying...')
                            : t('triage.acceptSuggestions', 'Accept AI Suggestions'),
                        }),
                        e.jsx('button', {
                          onClick: () => {
                            ;(u(!0), i(a))
                          },
                          className:
                            'flex-1 rounded-md bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700',
                          children: t('triage.override', 'Override'),
                        }),
                      ],
                    }),
                  ],
                }),
          ],
        })
}
export { A as T }
//# sourceMappingURL=TriagePanel-DtLLfctd.js.map
