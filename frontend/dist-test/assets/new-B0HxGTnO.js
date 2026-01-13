import { u as A, j as e, r as v, o as L } from './react-vendor-Buoak6m3.js'
import { aQ as H } from './vendor-misc-BiJvMP0A.js'
import { i as P } from './tanstack-vendor-BZC-rs5U.js'
import { A as E } from './AttachmentUploader-DnTiValP.js'
import { e as M, f as R } from './useIntakeApi-84Q7PHHY.js'
import { o as D, a as V, r as B, s as d, e as q, f as W } from './form-vendor-BX1BhTCI.js'
import './date-vendor-s0MkYge4.js'
import './visualization-vendor-f5uYUx4I.js'
import './index-qYY0KoZ1.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
const $ = ({ requestType: s, value: n = {}, onChange: p }) => {
    const { t, i18n: y } = A('intake')
    y.language
    const r = (i, m) => {
        p({ ...n, [i]: m })
      },
      u = () =>
        e.jsxs('div', {
          className: 'space-y-4 rounded-md border border-gray-200 bg-gray-50 p-4',
          children: [
            e.jsxs('h3', {
              className: 'text-sm font-medium text-gray-900',
              children: [
                t('intake.form.requestType.options.engagement'),
                ' - ',
                t('intake.typeSpecific.engagement.title', 'Additional Information'),
              ],
            }),
            e.jsxs('div', {
              children: [
                e.jsx('label', {
                  className: 'mb-2 block text-sm font-medium text-gray-700',
                  children: t('intake.typeSpecific.engagement.partnerName.label'),
                }),
                e.jsx('input', {
                  type: 'text',
                  value: n.partnerName || '',
                  onChange: (i) => r('partnerName', i.target.value),
                  placeholder: t('intake.typeSpecific.engagement.partnerName.placeholder'),
                  className:
                    'w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
                }),
              ],
            }),
            e.jsxs('div', {
              children: [
                e.jsx('label', {
                  className: 'mb-2 block text-sm font-medium text-gray-700',
                  children: t('intake.typeSpecific.engagement.collaborationType.label'),
                }),
                e.jsxs('select', {
                  value: n.collaborationType || '',
                  onChange: (i) => r('collaborationType', i.target.value),
                  className:
                    'w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
                  children: [
                    e.jsx('option', { value: '', children: 'Select type...' }),
                    e.jsx('option', {
                      value: 'technical',
                      children: t(
                        'intake.typeSpecific.engagement.collaborationType.options.technical',
                      ),
                    }),
                    e.jsx('option', {
                      value: 'data_sharing',
                      children: t(
                        'intake.typeSpecific.engagement.collaborationType.options.data_sharing',
                      ),
                    }),
                    e.jsx('option', {
                      value: 'capacity_building',
                      children: t(
                        'intake.typeSpecific.engagement.collaborationType.options.capacity_building',
                      ),
                    }),
                    e.jsx('option', {
                      value: 'other',
                      children: t('intake.typeSpecific.engagement.collaborationType.options.other'),
                    }),
                  ],
                }),
              ],
            }),
            e.jsxs('div', {
              children: [
                e.jsx('label', {
                  className: 'mb-2 block text-sm font-medium text-gray-700',
                  children: t('intake.typeSpecific.engagement.expectedDuration.label'),
                }),
                e.jsx('input', {
                  type: 'text',
                  value: n.expectedDuration || '',
                  onChange: (i) => r('expectedDuration', i.target.value),
                  placeholder: t('intake.typeSpecific.engagement.expectedDuration.placeholder'),
                  className:
                    'w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
                }),
              ],
            }),
          ],
        }),
      x = () =>
        e.jsxs('div', {
          className: 'space-y-4 rounded-md border border-gray-200 bg-gray-50 p-4',
          children: [
            e.jsxs('h3', {
              className: 'text-sm font-medium text-gray-900',
              children: [
                t('intake.form.requestType.options.position'),
                ' - ',
                t('intake.typeSpecific.position.title', 'Additional Information'),
              ],
            }),
            e.jsxs('div', {
              children: [
                e.jsx('label', {
                  className: 'mb-2 block text-sm font-medium text-gray-700',
                  children: t('intake.typeSpecific.position.positionTitle.label'),
                }),
                e.jsx('input', {
                  type: 'text',
                  value: n.positionTitle || '',
                  onChange: (i) => r('positionTitle', i.target.value),
                  placeholder: t('intake.typeSpecific.position.positionTitle.placeholder'),
                  className:
                    'w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
                }),
              ],
            }),
            e.jsxs('div', {
              children: [
                e.jsx('label', {
                  className: 'mb-2 block text-sm font-medium text-gray-700',
                  children: t('intake.typeSpecific.position.department.label'),
                }),
                e.jsx('input', {
                  type: 'text',
                  value: n.department || '',
                  onChange: (i) => r('department', i.target.value),
                  placeholder: t('intake.typeSpecific.position.department.placeholder'),
                  className:
                    'w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
                }),
              ],
            }),
            e.jsxs('div', {
              children: [
                e.jsx('label', {
                  className: 'mb-2 block text-sm font-medium text-gray-700',
                  children: t('intake.typeSpecific.position.requiredSkills.label'),
                }),
                e.jsx('textarea', {
                  value: n.requiredSkills || '',
                  onChange: (i) => r('requiredSkills', i.target.value),
                  placeholder: t('intake.typeSpecific.position.requiredSkills.placeholder'),
                  rows: 3,
                  className:
                    'w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
                }),
              ],
            }),
          ],
        }),
      g = () =>
        e.jsxs('div', {
          className: 'space-y-4 rounded-md border border-gray-200 bg-gray-50 p-4',
          children: [
            e.jsxs('h3', {
              className: 'text-sm font-medium text-gray-900',
              children: [
                t('intake.form.requestType.options.mou_action'),
                ' - ',
                t('intake.typeSpecific.mou_action.title', 'Additional Information'),
              ],
            }),
            e.jsxs('div', {
              children: [
                e.jsx('label', {
                  className: 'mb-2 block text-sm font-medium text-gray-700',
                  children: t('intake.typeSpecific.mou_action.mouReference.label'),
                }),
                e.jsx('input', {
                  type: 'text',
                  value: n.mouReference || '',
                  onChange: (i) => r('mouReference', i.target.value),
                  placeholder: t('intake.typeSpecific.mou_action.mouReference.placeholder'),
                  className:
                    'w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
                }),
              ],
            }),
            e.jsxs('div', {
              children: [
                e.jsx('label', {
                  className: 'mb-2 block text-sm font-medium text-gray-700',
                  children: t('intake.typeSpecific.mou_action.actionType.label'),
                }),
                e.jsxs('select', {
                  value: n.actionType || '',
                  onChange: (i) => r('actionType', i.target.value),
                  className:
                    'w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
                  children: [
                    e.jsx('option', { value: '', children: 'Select action type...' }),
                    e.jsx('option', {
                      value: 'review',
                      children: t('intake.typeSpecific.mou_action.actionType.options.review'),
                    }),
                    e.jsx('option', {
                      value: 'amendment',
                      children: t('intake.typeSpecific.mou_action.actionType.options.amendment'),
                    }),
                    e.jsx('option', {
                      value: 'renewal',
                      children: t('intake.typeSpecific.mou_action.actionType.options.renewal'),
                    }),
                    e.jsx('option', {
                      value: 'termination',
                      children: t('intake.typeSpecific.mou_action.actionType.options.termination'),
                    }),
                  ],
                }),
              ],
            }),
            e.jsxs('div', {
              children: [
                e.jsx('label', {
                  className: 'mb-2 block text-sm font-medium text-gray-700',
                  children: t('intake.typeSpecific.mou_action.deadline.label'),
                }),
                e.jsx('input', {
                  type: 'date',
                  value: n.deadline || '',
                  onChange: (i) => r('deadline', i.target.value),
                  className:
                    'w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
                }),
              ],
            }),
          ],
        }),
      b = () =>
        e.jsxs('div', {
          className: 'space-y-4 rounded-md border border-gray-200 bg-gray-50 p-4',
          children: [
            e.jsxs('h3', {
              className: 'text-sm font-medium text-gray-900',
              children: [
                t('intake.form.requestType.options.foresight'),
                ' - ',
                t('intake.typeSpecific.foresight.title', 'Additional Information'),
              ],
            }),
            e.jsxs('div', {
              children: [
                e.jsx('label', {
                  className: 'mb-2 block text-sm font-medium text-gray-700',
                  children: t('intake.typeSpecific.foresight.topic.label'),
                }),
                e.jsx('input', {
                  type: 'text',
                  value: n.topic || '',
                  onChange: (i) => r('topic', i.target.value),
                  placeholder: t('intake.typeSpecific.foresight.topic.placeholder'),
                  className:
                    'w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
                }),
              ],
            }),
            e.jsxs('div', {
              children: [
                e.jsx('label', {
                  className: 'mb-2 block text-sm font-medium text-gray-700',
                  children: t('intake.typeSpecific.foresight.timeHorizon.label'),
                }),
                e.jsxs('select', {
                  value: n.timeHorizon || '',
                  onChange: (i) => r('timeHorizon', i.target.value),
                  className:
                    'w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
                  children: [
                    e.jsx('option', { value: '', children: 'Select time horizon...' }),
                    e.jsx('option', {
                      value: 'short',
                      children: t('intake.typeSpecific.foresight.timeHorizon.options.short'),
                    }),
                    e.jsx('option', {
                      value: 'medium',
                      children: t('intake.typeSpecific.foresight.timeHorizon.options.medium'),
                    }),
                    e.jsx('option', {
                      value: 'long',
                      children: t('intake.typeSpecific.foresight.timeHorizon.options.long'),
                    }),
                  ],
                }),
              ],
            }),
            e.jsxs('div', {
              children: [
                e.jsx('label', {
                  className: 'mb-2 block text-sm font-medium text-gray-700',
                  children: t('intake.typeSpecific.foresight.stakeholders.label'),
                }),
                e.jsx('textarea', {
                  value: n.stakeholders || '',
                  onChange: (i) => r('stakeholders', i.target.value),
                  placeholder: t('intake.typeSpecific.foresight.stakeholders.placeholder'),
                  rows: 3,
                  className:
                    'w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
                }),
              ],
            }),
          ],
        })
    switch (s) {
      case 'engagement':
        return u()
      case 'position':
        return x()
      case 'mou_action':
        return g()
      case 'foresight':
        return b()
      default:
        return null
    }
  },
  G = (s) =>
    D({
      requestType: q(['engagement', 'position', 'mou_action', 'foresight'], {
        required_error: s('intake.form.requestType.required'),
      }),
      title: d()
        .min(3, s('intake.form.title.minLength'))
        .max(200, s('intake.form.title.maxLength')),
      titleAr: d().max(200, s('intake.form.title.maxLength')).optional(),
      description: d()
        .min(10, s('intake.form.description.minLength'))
        .max(5e3, s('intake.form.description.maxLength')),
      descriptionAr: d().max(5e3, s('intake.form.description.maxLength')).optional(),
      urgency: q(['low', 'medium', 'high', 'critical'], {
        required_error: s('intake.form.urgency.required'),
      }),
      dossierId: d().uuid().optional(),
      typeSpecificFields: B(W()).optional(),
      attachmentIds: V(d().uuid()).optional(),
    }),
  O = ({ initialData: s, mode: n = 'create', onSuccess: p }) => {
    const { t, i18n: y } = A('intake'),
      r = P(),
      u = y.language === 'ar',
      [x, g] = v.useState([]),
      [b, i] = v.useState(!1),
      [m, N] = v.useState(null),
      {
        register: l,
        handleSubmit: _,
        watch: k,
        setValue: a,
        formState: { errors: o, isSubmitting: w },
        reset: S,
      } = L({
        resolver: H(G(t)),
        defaultValues: s || { requestType: 'engagement', urgency: 'medium' },
      }),
      T = k('requestType'),
      z = k('urgency'),
      C = M(),
      { data: h } = R(z),
      F = async (c) => {
        try {
          const j = { ...c, attachments: x },
            f = await C.mutateAsync(j)
          ;(N({ id: f.id, ticketNumber: f.ticketNumber }), i(!0), p && p(f.id, f.ticketNumber))
        } catch (j) {
          console.error('Failed to create ticket:', j)
        }
      },
      I = (c) => {
        ;(g(c), a('attachmentIds', c))
      }
    return b && m
      ? e.jsx('div', {
          className: 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50',
          children: e.jsx('div', {
            className: 'w-full max-w-md rounded-lg bg-white p-8',
            dir: u ? 'rtl' : 'ltr',
            children: e.jsxs('div', {
              className: 'text-center',
              children: [
                e.jsx('div', {
                  className:
                    'mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100',
                  children: e.jsx('svg', {
                    className: 'size-6 text-green-600',
                    fill: 'none',
                    stroke: 'currentColor',
                    viewBox: '0 0 24 24',
                    children: e.jsx('path', {
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                      strokeWidth: 2,
                      d: 'M5 13l4 4L19 7',
                    }),
                  }),
                }),
                e.jsx('h3', {
                  className: 'mb-2 text-lg font-medium text-gray-900',
                  children: t('intake.success.title'),
                }),
                e.jsx('p', {
                  className: 'mb-6 text-sm text-gray-500',
                  children: t('intake.success.message', { ticketNumber: m.ticketNumber }),
                }),
                e.jsxs('div', {
                  className: 'flex justify-center gap-3',
                  children: [
                    e.jsx('button', {
                      onClick: () => r({ to: `/intake/tickets/${m.id}` }),
                      className:
                        'rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700',
                      children: t('intake.success.viewTicket'),
                    }),
                    e.jsx('button', {
                      onClick: () => {
                        ;(i(!1), N(null), S(), g([]))
                      },
                      className:
                        'rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50',
                      children: t('intake.success.createAnother'),
                    }),
                  ],
                }),
              ],
            }),
          }),
        })
      : e.jsx('div', {
          className: 'mx-auto max-w-4xl px-4 py-8',
          dir: u ? 'rtl' : 'ltr',
          children: e.jsxs('div', {
            className: 'rounded-lg bg-white p-6 shadow',
            children: [
              e.jsxs('div', {
                className: 'mb-6',
                children: [
                  e.jsx('h1', {
                    className: 'mb-2 text-2xl font-bold text-gray-900',
                    children: t('intake.title'),
                  }),
                  e.jsx('p', {
                    className: 'text-sm text-gray-600',
                    children: t('intake.subtitle'),
                  }),
                ],
              }),
              e.jsxs('form', {
                onSubmit: _(F),
                className: 'space-y-6',
                children: [
                  e.jsxs('div', {
                    children: [
                      e.jsxs('label', {
                        className: 'mb-2 block text-sm font-medium text-gray-700',
                        children: [
                          t('intake.form.requestType.label'),
                          e.jsx('span', { className: 'ms-1 text-red-500', children: '*' }),
                        ],
                      }),
                      e.jsxs('select', {
                        ...l('requestType'),
                        className:
                          'w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
                        children: [
                          e.jsx('option', {
                            value: '',
                            children: t('intake.form.requestType.placeholder'),
                          }),
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
                      o.requestType &&
                        e.jsx('p', {
                          className: 'mt-1 text-sm text-red-600',
                          children: o.requestType.message,
                        }),
                    ],
                  }),
                  e.jsxs('div', {
                    children: [
                      e.jsxs('label', {
                        className: 'mb-2 block text-sm font-medium text-gray-700',
                        children: [
                          t('intake.form.title.label'),
                          e.jsx('span', { className: 'ms-1 text-red-500', children: '*' }),
                        ],
                      }),
                      e.jsx('input', {
                        type: 'text',
                        ...l('title'),
                        placeholder: t('intake.form.title.placeholder'),
                        className:
                          'w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
                      }),
                      o.title &&
                        e.jsx('p', {
                          className: 'mt-1 text-sm text-red-600',
                          children: o.title.message,
                        }),
                    ],
                  }),
                  e.jsxs('div', {
                    children: [
                      e.jsx('label', {
                        className: 'mb-2 block text-sm font-medium text-gray-700',
                        children: t('intake.form.titleAr.label'),
                      }),
                      e.jsx('input', {
                        type: 'text',
                        ...l('titleAr'),
                        placeholder: t('intake.form.titleAr.placeholder'),
                        className:
                          'w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
                        dir: 'rtl',
                      }),
                      o.titleAr &&
                        e.jsx('p', {
                          className: 'mt-1 text-sm text-red-600',
                          children: o.titleAr.message,
                        }),
                    ],
                  }),
                  e.jsxs('div', {
                    children: [
                      e.jsxs('label', {
                        className: 'mb-2 block text-sm font-medium text-gray-700',
                        children: [
                          t('intake.form.description.label'),
                          e.jsx('span', { className: 'ms-1 text-red-500', children: '*' }),
                        ],
                      }),
                      e.jsx('textarea', {
                        ...l('description'),
                        placeholder: t('intake.form.description.placeholder'),
                        rows: 5,
                        className:
                          'w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
                      }),
                      o.description &&
                        e.jsx('p', {
                          className: 'mt-1 text-sm text-red-600',
                          children: o.description.message,
                        }),
                    ],
                  }),
                  e.jsxs('div', {
                    children: [
                      e.jsx('label', {
                        className: 'mb-2 block text-sm font-medium text-gray-700',
                        children: t('intake.form.descriptionAr.label'),
                      }),
                      e.jsx('textarea', {
                        ...l('descriptionAr'),
                        placeholder: t('intake.form.descriptionAr.placeholder'),
                        rows: 5,
                        className:
                          'w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
                        dir: 'rtl',
                      }),
                      o.descriptionAr &&
                        e.jsx('p', {
                          className: 'mt-1 text-sm text-red-600',
                          children: o.descriptionAr.message,
                        }),
                    ],
                  }),
                  e.jsxs('div', {
                    children: [
                      e.jsxs('label', {
                        className: 'mb-2 block text-sm font-medium text-gray-700',
                        children: [
                          t('intake.form.urgency.label'),
                          e.jsx('span', { className: 'ms-1 text-red-500', children: '*' }),
                        ],
                      }),
                      e.jsxs('select', {
                        ...l('urgency'),
                        className:
                          'w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
                        children: [
                          e.jsx('option', {
                            value: '',
                            children: t('intake.form.urgency.placeholder'),
                          }),
                          e.jsx('option', {
                            value: 'low',
                            children: t('intake.form.urgency.options.low'),
                          }),
                          e.jsx('option', {
                            value: 'medium',
                            children: t('intake.form.urgency.options.medium'),
                          }),
                          e.jsx('option', {
                            value: 'high',
                            children: t('intake.form.urgency.options.high'),
                          }),
                          e.jsx('option', {
                            value: 'critical',
                            children: t('intake.form.urgency.options.critical'),
                          }),
                        ],
                      }),
                      o.urgency &&
                        e.jsx('p', {
                          className: 'mt-1 text-sm text-red-600',
                          children: o.urgency.message,
                        }),
                    ],
                  }),
                  T &&
                    e.jsx($, {
                      requestType: T,
                      value: k('typeSpecificFields'),
                      onChange: (c) => a('typeSpecificFields', c),
                    }),
                  e.jsx(E, {
                    attachmentIds: x,
                    onChange: I,
                    maxFileSize: 25 * 1024 * 1024,
                    maxTotalSize: 100 * 1024 * 1024,
                  }),
                  h &&
                    e.jsxs('div', {
                      className: 'rounded-md border border-blue-200 bg-blue-50 p-4',
                      children: [
                        e.jsx('h3', {
                          className: 'mb-2 text-sm font-medium text-blue-900',
                          children: t('intake.slaPreview.title'),
                        }),
                        e.jsxs('div', {
                          className: 'space-y-1 text-sm text-blue-700',
                          children: [
                            e.jsxs('p', {
                              children: [
                                t('intake.slaPreview.acknowledgment'),
                                ': ',
                                h.acknowledgmentMinutes,
                                ' ',
                                t('intake.slaPreview.minutes'),
                              ],
                            }),
                            e.jsxs('p', {
                              children: [
                                t('intake.slaPreview.resolution'),
                                ': ',
                                h.resolutionHours,
                                ' ',
                                t('intake.slaPreview.hours'),
                              ],
                            }),
                            h.businessHoursOnly &&
                              e.jsx('p', {
                                className: 'text-xs',
                                children: t('intake.slaPreview.businessHours'),
                              }),
                          ],
                        }),
                      ],
                    }),
                  C.isError &&
                    e.jsx('div', {
                      className: 'rounded-md border border-red-200 bg-red-50 p-4',
                      children: e.jsx('p', {
                        className: 'text-sm text-red-800',
                        children: t('intake.error.message'),
                      }),
                    }),
                  e.jsxs('div', {
                    className: 'flex justify-end gap-3 border-t pt-4',
                    children: [
                      e.jsx('button', {
                        type: 'button',
                        onClick: () => r({ to: '/intake' }),
                        className:
                          'rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50',
                        children: t('intake.actions.cancel'),
                      }),
                      e.jsx('button', {
                        type: 'button',
                        onClick: () => S(),
                        className:
                          'rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50',
                        children: t('intake.actions.reset'),
                      }),
                      e.jsx('button', {
                        type: 'button',
                        onClick: () => {
                          ;(a('requestType', 'engagement'),
                            a('title', 'New Partnership with ExampleCorp'),
                            a('titleAr', 'شراكة جديدة مع شركة المثال'),
                            a(
                              'description',
                              'Initial discussion for a strategic partnership with ExampleCorp to expand our market reach in the new region. This involves exploring potential joint ventures and co-marketing opportunities.',
                            ),
                            a(
                              'descriptionAr',
                              'مناقشة أولية لشراكة استراتيجية مع شركة المثال لتوسيع نطاق وصولنا إلى السوق في المنطقة الجديدة. يتضمن ذلك استكشاف المشاريع المشتركة المحتملة وفرص التسويق المشترك.',
                            ),
                            a('urgency', 'high'))
                        },
                        className:
                          'rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50',
                        children: t('intake.actions.fillMock'),
                      }),
                      e.jsx('button', {
                        type: 'submit',
                        disabled: w,
                        className:
                          'rounded-md bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400',
                        children: w
                          ? e.jsxs('span', {
                              className: 'flex items-center gap-2',
                              children: [
                                e.jsxs('svg', {
                                  className: 'size-4 animate-spin',
                                  viewBox: '0 0 24 24',
                                  children: [
                                    e.jsx('circle', {
                                      className: 'opacity-25',
                                      cx: '12',
                                      cy: '12',
                                      r: '10',
                                      stroke: 'currentColor',
                                      strokeWidth: '4',
                                      fill: 'none',
                                    }),
                                    e.jsx('path', {
                                      className: 'opacity-75',
                                      fill: 'currentColor',
                                      d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z',
                                    }),
                                  ],
                                }),
                                t('intake.actions.submitting'),
                              ],
                            })
                          : t('intake.actions.submit'),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        })
  }
function se() {
  return e.jsx('div', { className: 'container mx-auto px-4 py-8', children: e.jsx(O, {}) })
}
export { se as component }
//# sourceMappingURL=new-B0HxGTnO.js.map
