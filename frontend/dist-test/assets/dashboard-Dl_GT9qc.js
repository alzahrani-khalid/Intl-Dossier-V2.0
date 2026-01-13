import { j as e, u as j, r as v } from './react-vendor-Buoak6m3.js'
import {
  cT as N,
  bo as k,
  aR as D,
  cj as C,
  aI as A,
  cc as S,
  ce as f,
  aH as H,
  aJ as T,
  aA as R,
  bS as I,
  bd as E,
} from './vendor-misc-BiJvMP0A.js'
import { H as M } from './date-vendor-s0MkYge4.js'
import { a as q, i as U } from './tanstack-vendor-BZC-rs5U.js'
import { g as L, a as $, b as F } from './dossier-stats.service-BBABWT3E.js'
import { j as l, k as o, o as c, l as m } from './index-qYY0KoZ1.js'
import './visualization-vendor-f5uYUx4I.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
function O({ title: s, value: d, change: t, changeType: i, description: n, trend: x }) {
  return e.jsx('div', {
    className:
      'bg-card rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow',
    children: e.jsx('div', {
      className: 'flex items-start justify-between mb-4',
      children: e.jsxs('div', {
        className: 'flex-1',
        children: [
          e.jsx('p', { className: 'text-sm font-medium text-muted-foreground', children: s }),
          e.jsxs('div', {
            className: 'flex items-baseline gap-2 mt-1',
            children: [
              e.jsx('p', { className: 'text-2xl font-bold text-foreground', children: d }),
              e.jsxs('div', {
                className: 'flex items-center gap-1',
                children: [
                  i === 'increase'
                    ? e.jsx(N, { className: 'h-4 w-4 text-success' })
                    : i === 'decrease'
                      ? e.jsx(k, { className: 'h-4 w-4 text-destructive' })
                      : null,
                  e.jsx('span', {
                    className: `text-sm font-medium ${i === 'increase' ? 'text-success' : i === 'decrease' ? 'text-destructive' : 'text-muted-foreground'}`,
                    children: t,
                  }),
                ],
              }),
            ],
          }),
          n && e.jsx('p', { className: 'text-xs text-muted-foreground mt-1', children: n }),
          x &&
            e.jsx('p', { className: 'text-xs font-medium text-foreground/80 mt-2', children: x }),
        ],
      }),
    }),
  })
}
function B() {
  const s = [
      {
        id: '1',
        title: 'UN Statistical Commission',
        type: 'conference',
        date: new Date('2025-02-15'),
        location: 'New York, USA',
        participants: 150,
        priority: 'high',
      },
      {
        id: '2',
        title: 'GCC Statistics Meeting',
        type: 'meeting',
        date: new Date('2025-02-20'),
        location: 'Riyadh, Saudi Arabia',
        participants: 25,
        priority: 'high',
      },
      {
        id: '3',
        title: 'Data Innovation Workshop',
        type: 'workshop',
        date: new Date('2025-03-05'),
        location: 'Dubai, UAE',
        participants: 40,
        priority: 'medium',
      },
      {
        id: '4',
        title: 'OECD Delegation Visit',
        type: 'visit',
        date: new Date('2025-03-10'),
        location: 'Riyadh, Saudi Arabia',
        participants: 12,
        priority: 'medium',
      },
    ],
    d = (i) => {
      switch (i) {
        case 'high':
          return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
        case 'medium':
          return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
        case 'low':
          return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
      }
    },
    t = (i) => {
      switch (i) {
        case 'conference':
          return '🎯'
        case 'meeting':
          return '🤝'
        case 'workshop':
          return '💡'
        case 'visit':
          return '✈️'
      }
    }
  return e.jsx('div', {
    className: 'space-y-3',
    children: s.map((i) =>
      e.jsx(
        'div',
        {
          className:
            'border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
          children: e.jsxs('div', {
            className: 'flex items-start gap-3',
            children: [
              e.jsx('span', {
                className: 'text-2xl',
                role: 'img',
                'aria-label': i.type,
                children: t(i.type),
              }),
              e.jsxs('div', {
                className: 'flex-1',
                children: [
                  e.jsx('h4', {
                    className: 'font-medium text-gray-900 dark:text-white',
                    children: i.title,
                  }),
                  e.jsxs('div', {
                    className:
                      'flex items-center gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400',
                    children: [
                      e.jsx(D, { className: 'h-3 w-3' }),
                      e.jsx('span', { children: M(i.date, 'MMM dd, yyyy') }),
                    ],
                  }),
                  e.jsxs('div', {
                    className:
                      'flex items-center gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400',
                    children: [
                      e.jsx(C, { className: 'h-3 w-3' }),
                      e.jsx('span', { children: i.location }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'flex items-center gap-2 mt-2',
                    children: [
                      e.jsx('span', {
                        className: `px-2 py-0.5 text-xs rounded-full ${d(i.priority)}`,
                        children: i.priority,
                      }),
                      e.jsxs('div', {
                        className: 'flex items-center gap-1 text-xs text-gray-500',
                        children: [
                          e.jsx(A, { className: 'h-3 w-3' }),
                          e.jsx('span', { children: i.participants }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        },
        i.id,
      ),
    ),
  })
}
function P(s) {
  const { groupBy: d, filter: t, enabled: i = !0 } = s
  return q({
    queryKey: ['dashboardHealthAggregations', d, t],
    queryFn: () => L(d, t),
    staleTime: 5 * 60 * 1e3,
    gcTime: 30 * 60 * 1e3,
    refetchInterval: 5 * 60 * 1e3,
    refetchOnWindowFocus: !0,
    enabled: i && !!d,
  })
}
function G({ groupBy: s = 'region', filter: d }) {
  const { t, i18n: i } = j(),
    n = i.language === 'ar',
    x = U(),
    { data: a, isLoading: h, isError: g, error: p } = P({ groupBy: s, filter: d })
  if (h)
    return e.jsx('div', {
      className: 'space-y-4 animate-pulse',
      dir: n ? 'rtl' : 'ltr',
      children: [1, 2, 3, 4, 5].map((r) =>
        e.jsxs(
          'div',
          {
            className: 'space-y-2',
            children: [
              e.jsx('div', { className: 'h-6 bg-gray-200 dark:bg-gray-700 rounded' }),
              e.jsxs('div', {
                className: 'grid grid-cols-3 gap-2',
                children: [
                  e.jsx('div', { className: 'h-4 bg-gray-200 dark:bg-gray-700 rounded' }),
                  e.jsx('div', { className: 'h-4 bg-gray-200 dark:bg-gray-700 rounded' }),
                  e.jsx('div', { className: 'h-4 bg-gray-200 dark:bg-gray-700 rounded' }),
                ],
              }),
            ],
          },
          r,
        ),
      ),
    })
  if (g)
    return e.jsxs('div', {
      className:
        'px-4 py-3 text-sm text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/20 rounded-lg',
      dir: n ? 'rtl' : 'ltr',
      role: 'alert',
      'aria-live': 'polite',
      children: [
        e.jsxs('strong', {
          className: 'font-medium',
          children: [t('error.failedToLoadData'), ':'],
        }),
        ' ',
        p?.message || t('error.unknownError'),
      ],
    })
  if (!a || a.aggregations.length === 0)
    return e.jsxs('div', {
      className: 'px-4 py-8 text-center text-gray-500 dark:text-gray-400',
      dir: n ? 'rtl' : 'ltr',
      children: [
        e.jsx('p', { className: 'text-sm sm:text-base', children: t('dashboard.noHealthData') }),
        e.jsx('p', {
          className: 'mt-2 text-xs sm:text-sm',
          children: t('dashboard.healthDataHint'),
        }),
      ],
    })
  const y = (r) =>
      r >= 80
        ? 'bg-green-500 dark:bg-green-600'
        : r >= 60
          ? 'bg-yellow-500 dark:bg-yellow-600'
          : r >= 40
            ? 'bg-orange-500 dark:bg-orange-600'
            : 'bg-red-500 dark:bg-red-600',
    b = (r) => {
      x({ to: '/dossiers', search: { [s]: r, sort: 'health:asc' } })
    },
    w = (r, u) => {
      r.key === 'Enter' && b(u)
    }
  return e.jsxs('div', {
    className: 'space-y-3 sm:space-y-4',
    dir: n ? 'rtl' : 'ltr',
    children: [
      a.aggregations.map((r) =>
        e.jsxs(
          'div',
          {
            className:
              'space-y-2 px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500',
            onClick: () => b(r.groupValue),
            onKeyDown: (u) => w(u, r.groupValue),
            tabIndex: 0,
            role: 'button',
            'aria-label': `${t('dashboard.viewDossiersIn')} ${r.groupValue}: ${t('dashboard.averageHealthScore')} ${r.averageHealthScore}`,
            children: [
              e.jsxs('div', {
                className: 'flex items-center justify-between',
                children: [
                  e.jsx('span', {
                    className: 'font-medium text-sm sm:text-base text-gray-900 dark:text-white',
                    children: r.groupValue,
                  }),
                  e.jsxs('div', {
                    className: 'flex items-center gap-2',
                    children: [
                      e.jsx('span', {
                        className: 'text-xs sm:text-sm text-gray-600 dark:text-gray-400',
                        children: $(r.averageHealthScore),
                      }),
                      e.jsx('span', {
                        className: `text-xs sm:text-sm font-medium ${F(r.averageHealthScore)}`,
                        children: r.averageHealthScore,
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'space-y-1',
                children: [
                  e.jsxs('div', {
                    className: 'flex items-center justify-between text-xs',
                    children: [
                      e.jsx('span', {
                        className: 'text-gray-600 dark:text-gray-400',
                        children: t('dashboard.overallHealth'),
                      }),
                      e.jsxs('span', {
                        className: 'font-medium text-gray-900 dark:text-white',
                        children: [r.dossierCount, ' ', t('dashboard.dossiers')],
                      }),
                    ],
                  }),
                  e.jsx('div', {
                    className:
                      'h-2 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
                    children: e.jsx('div', {
                      className: `h-full ${y(r.averageHealthScore)} transition-all`,
                      style: { width: `${r.averageHealthScore}%` },
                      role: 'progressbar',
                      'aria-valuenow': r.averageHealthScore,
                      'aria-valuemin': 0,
                      'aria-valuemax': 100,
                      'aria-label': t('dashboard.healthScore'),
                    }),
                  }),
                ],
              }),
              e.jsxs('div', {
                className: 'grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 text-xs',
                children: [
                  e.jsxs('div', {
                    className: 'flex items-center gap-1 sm:gap-2',
                    children: [
                      e.jsx('div', {
                        className:
                          'w-2 h-2 sm:w-3 sm:h-3 bg-green-500 dark:bg-green-600 rounded-full',
                      }),
                      e.jsxs('span', {
                        className: 'text-gray-600 dark:text-gray-400',
                        children: [t('dashboard.excellent'), ': ', r.healthDistribution.excellent],
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'flex items-center gap-1 sm:gap-2',
                    children: [
                      e.jsx('div', {
                        className:
                          'w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 dark:bg-yellow-600 rounded-full',
                      }),
                      e.jsxs('span', {
                        className: 'text-gray-600 dark:text-gray-400',
                        children: [t('dashboard.good'), ': ', r.healthDistribution.good],
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'flex items-center gap-1 sm:gap-2',
                    children: [
                      e.jsx('div', {
                        className:
                          'w-2 h-2 sm:w-3 sm:h-3 bg-orange-500 dark:bg-orange-600 rounded-full',
                      }),
                      e.jsxs('span', {
                        className: 'text-gray-600 dark:text-gray-400',
                        children: [t('dashboard.fair'), ': ', r.healthDistribution.fair],
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'flex items-center gap-1 sm:gap-2',
                    children: [
                      e.jsx('div', {
                        className: 'w-2 h-2 sm:w-3 sm:h-3 bg-red-500 dark:bg-red-600 rounded-full',
                      }),
                      e.jsxs('span', {
                        className: 'text-gray-600 dark:text-gray-400',
                        children: [t('dashboard.poor'), ': ', r.healthDistribution.poor],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          },
          r.groupValue,
        ),
      ),
      e.jsx('div', {
        className: 'pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700',
        children: e.jsxs('div', {
          className: 'flex flex-wrap items-center justify-around gap-2 sm:gap-4 text-xs',
          children: [
            e.jsxs('div', {
              className: 'flex items-center gap-1 sm:gap-2',
              children: [
                e.jsx('div', {
                  className: 'w-2 h-2 sm:w-3 sm:h-3 bg-green-500 dark:bg-green-600 rounded-full',
                }),
                e.jsxs('span', {
                  className: 'text-gray-600 dark:text-gray-400',
                  children: [t('dashboard.excellent'), ' (80-100)'],
                }),
              ],
            }),
            e.jsxs('div', {
              className: 'flex items-center gap-1 sm:gap-2',
              children: [
                e.jsx('div', {
                  className: 'w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 dark:bg-yellow-600 rounded-full',
                }),
                e.jsxs('span', {
                  className: 'text-gray-600 dark:text-gray-400',
                  children: [t('dashboard.good'), ' (60-79)'],
                }),
              ],
            }),
            e.jsxs('div', {
              className: 'flex items-center gap-1 sm:gap-2',
              children: [
                e.jsx('div', {
                  className: 'w-2 h-2 sm:w-3 sm:h-3 bg-orange-500 dark:bg-orange-600 rounded-full',
                }),
                e.jsxs('span', {
                  className: 'text-gray-600 dark:text-gray-400',
                  children: [t('dashboard.fair'), ' (40-59)'],
                }),
              ],
            }),
            e.jsxs('div', {
              className: 'flex items-center gap-1 sm:gap-2',
              children: [
                e.jsx('div', {
                  className: 'w-2 h-2 sm:w-3 sm:h-3 bg-red-500 dark:bg-red-600 rounded-full',
                }),
                e.jsxs('span', {
                  className: 'text-gray-600 dark:text-gray-400',
                  children: [t('dashboard.poor'), ' (0-39)'],
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  })
}
function V() {
  const { t: s } = j(),
    d = v.useMemo(
      () => [
        {
          title: s('dashboard.metrics.partners', 'Active bilateral partners'),
          value: '64',
          change: s('dashboard.metrics.partnersChange', '+4 since Q3'),
          changeType: 'increase',
          description: s(
            'dashboard.metrics.partnersDescription',
            '12 strategic partners flagged for quarterly review',
          ),
          trend: s('dashboard.metrics.partnersTrend', '95% of partner scorecards healthy'),
        },
        {
          title: s('dashboard.metrics.mous', 'MoUs in workflow'),
          value: '28',
          change: s('dashboard.metrics.mousChange', '5 awaiting external review'),
          changeType: 'neutral',
          description: s('dashboard.metrics.mousDescription', 'Average turnaround 18 days'),
          trend: s('dashboard.metrics.mousTrend', 'Three agreements expiring within 30 days'),
        },
        {
          title: s('dashboard.metrics.events', 'Upcoming missions & events'),
          value: '17',
          change: s('dashboard.metrics.eventsChange', '+2 high priority'),
          changeType: 'increase',
          description: s(
            'dashboard.metrics.eventsDescription',
            'Calendar coverage at 82% capacity',
          ),
          trend: s('dashboard.metrics.eventsTrend', 'Conflict detection triggered twice this week'),
        },
        {
          title: s('dashboard.metrics.intelligence', 'Intelligence briefs published'),
          value: '42',
          change: s('dashboard.metrics.intelligenceChange', '88% with confidence ≥ 0.75'),
          changeType: 'increase',
          description: s(
            'dashboard.metrics.intelligenceDescription',
            'AI-assisted summarisation used on 31 briefs',
          ),
          trend: s('dashboard.metrics.intelligenceTrend', 'Classification SLA at 100% compliance'),
        },
      ],
      [s],
    ),
    t = [
      {
        label: s('dashboard.workflow.internalReview', 'Internal review'),
        total: 9,
        delta: s('dashboard.workflow.internalReviewDelta', '▼ 2 since last week'),
        status: 'positive',
        description: s(
          'dashboard.workflow.internalReviewDescription',
          'All drafts include legal comments',
        ),
      },
      {
        label: s('dashboard.workflow.externalReview', 'External review'),
        total: 5,
        delta: s('dashboard.workflow.externalReviewDelta', '▲ 1 requires policy note'),
        status: 'negative',
        description: s(
          'dashboard.workflow.externalReviewDescription',
          'Waiting on partner signature for UAE statistics exchange',
        ),
      },
      {
        label: s('dashboard.workflow.negotiation', 'Negotiation'),
        total: 3,
        delta: s('dashboard.workflow.negotiationDelta', 'steady'),
        status: 'neutral',
        description: s(
          'dashboard.workflow.negotiationDescription',
          'Focus on renewable energy collaboration with EU bloc',
        ),
      },
      {
        label: s('dashboard.workflow.renewals', 'Renewals this quarter'),
        total: 6,
        delta: s('dashboard.workflow.renewalsDelta', '▲ 2 triggered by expiry alerts'),
        status: 'positive',
        description: s(
          'dashboard.workflow.renewalsDescription',
          'Auto-reminders sent to legal and finance owners',
        ),
      },
    ],
    i = [
      {
        id: 'alert-1',
        title: s('dashboard.alerts.expiringMou', 'MoU with ABS (Australia) expires in 21 days'),
        detail: s(
          'dashboard.alerts.expiringMouDetail',
          'Pending financial annex approval and updated data governance addendum.',
        ),
        severity: 'high',
        owner: 'Legal Affairs',
        dueIn: s('dashboard.alerts.expiringMouDue', 'Review due in 7 days'),
      },
      {
        id: 'alert-2',
        title: s('dashboard.alerts.conflict', 'Schedule conflict: OECD mission vs GCC summit'),
        detail: s(
          'dashboard.alerts.conflictDetail',
          'Both events request the deputy governor. Propose alternate lead or reschedule OECD briefing.',
        ),
        severity: 'medium',
        owner: 'International Relations',
        dueIn: s('dashboard.alerts.conflictDue', 'Escalate by 30 January'),
      },
      {
        id: 'alert-3',
        title: s('dashboard.alerts.security', 'Intelligence brief requires reclassification'),
        detail: s(
          'dashboard.alerts.securityDetail',
          'AI summary flagged sensitive source. Awaiting manual review for downgrade.',
        ),
        severity: 'high',
        owner: 'Security Operations',
        dueIn: s('dashboard.alerts.securityDue', 'Complete within 48 hours'),
      },
    ],
    n = [
      {
        id: 'intel-1',
        title: s('dashboard.intelligence.gdp', 'Regional GDP harmonisation opportunity'),
        summary: s(
          'dashboard.intelligence.gdpSummary',
          'GCC working group proposes shared methodology. Requires delegation approval before March summit.',
        ),
        confidence: 0.82,
        classification: 'restricted',
      },
      {
        id: 'intel-2',
        title: s('dashboard.intelligence.ai', 'AI-assisted data exchange pilot'),
        summary: s(
          'dashboard.intelligence.aiSummary',
          'AnythingLLM pilot reduced review time by 28%. Recommend expanding to agricultural statistics domain.',
        ),
        confidence: 0.91,
        classification: 'confidential',
      },
      {
        id: 'intel-3',
        title: s(
          'dashboard.intelligence.training',
          'Capacity building demand from francophone partners',
        ),
        summary: s(
          'dashboard.intelligence.trainingSummary',
          'Six African national statistics offices requested advanced sampling workshops. Suggested schedule Q2 2025.',
        ),
        confidence: 0.74,
        classification: 'restricted',
      },
    ],
    x = [
      {
        icon: S,
        label: s('dashboard.performance.bilingual', 'Bilingual coverage'),
        value: '100%',
        description: s(
          'dashboard.performance.bilingualDescription',
          'All priority content available in Arabic & English',
        ),
      },
      {
        icon: f,
        label: s('dashboard.performance.mfa', 'MFA compliance'),
        value: '100%',
        description: s(
          'dashboard.performance.mfaDescription',
          'TOTP enforced for 312 active accounts',
        ),
      },
      {
        icon: H,
        label: s('dashboard.performance.contracts', 'Contract test coverage'),
        value: '52 / 52',
        description: s(
          'dashboard.performance.contractsDescription',
          'Latest schema sync completed 26 September 2025',
        ),
      },
      {
        icon: T,
        label: s('dashboard.performance.organisations', 'Organisation hierarchies verified'),
        value: '31',
        description: s(
          'dashboard.performance.organisationsDescription',
          'All delegations mapped with delegation expiry checks',
        ),
      },
    ]
  return e.jsxs('div', {
    className: 'w-full space-y-6',
    children: [
      e.jsxs('section', {
        className: 'flex flex-col gap-2',
        children: [
          e.jsx('h1', {
            className: 'text-2xl font-bold text-foreground sm:text-3xl',
            children: s('dashboard.title', 'Operations overview'),
          }),
          e.jsx('p', {
            className: 'max-w-3xl text-sm text-muted-foreground sm:text-base',
            children: s(
              'dashboard.subtitle',
              'Live status of international commitments, intelligence briefs, and partner activities across the GASTAT dossier.',
            ),
          }),
        ],
      }),
      e.jsx('section', {
        className: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4',
        children: d.map((a) => e.jsx(O, { ...a }, a.title)),
      }),
      e.jsxs('section', {
        className: 'grid gap-6 2xl:grid-cols-3',
        children: [
          e.jsxs(l, {
            className: '2xl:col-span-2',
            children: [
              e.jsxs(o, {
                className: 'flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between',
                children: [
                  e.jsx(c, { children: s('dashboard.relationshipHealth', 'Relationship health') }),
                  e.jsx('span', {
                    className: 'text-sm text-muted-foreground',
                    children: s(
                      'dashboard.relationshipDescription',
                      'Aggregated scores across top partner blocs (rolling 90 days)',
                    ),
                  }),
                ],
              }),
              e.jsx(m, { children: e.jsx(G, {}) }),
            ],
          }),
          e.jsxs(l, {
            children: [
              e.jsx(o, {
                children: e.jsx(c, {
                  children: s('dashboard.upcomingMissions', 'Upcoming missions'),
                }),
              }),
              e.jsx(m, { children: e.jsx(B, {}) }),
            ],
          }),
        ],
      }),
      e.jsxs('section', {
        className: 'grid gap-6 2xl:grid-cols-3',
        children: [
          e.jsxs(l, {
            className: '2xl:col-span-2',
            children: [
              e.jsx(o, {
                children: e.jsx(c, {
                  children: s('dashboard.workflowSnapshotTitle', 'Workflow snapshot'),
                }),
              }),
              e.jsx(m, {
                className: 'space-y-4',
                children: t.map((a) =>
                  e.jsxs(
                    'div',
                    {
                      className:
                        'flex flex-col gap-2 rounded-lg border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between',
                      children: [
                        e.jsxs('div', {
                          children: [
                            e.jsx('p', {
                              className: 'text-sm font-semibold text-foreground',
                              children: a.label,
                            }),
                            e.jsx('p', {
                              className: 'text-xs text-muted-foreground',
                              children: a.description,
                            }),
                          ],
                        }),
                        e.jsxs('div', {
                          className: 'flex items-center gap-4',
                          children: [
                            e.jsx('span', {
                              className: 'text-2xl font-bold text-primary',
                              children: a.total,
                            }),
                            e.jsx('span', {
                              className:
                                a.status === 'positive'
                                  ? 'text-xs font-medium text-success'
                                  : a.status === 'negative'
                                    ? 'text-xs font-medium text-destructive'
                                    : 'text-xs font-medium text-muted-foreground',
                              children: a.delta,
                            }),
                          ],
                        }),
                      ],
                    },
                    a.label,
                  ),
                ),
              }),
            ],
          }),
          e.jsxs(l, {
            children: [
              e.jsxs(o, {
                className: 'flex items-center gap-2',
                children: [
                  e.jsx(R, { className: 'h-5 w-5 text-warning' }),
                  e.jsx(c, { children: s('dashboard.alerts.title', 'High-risk alerts') }),
                ],
              }),
              e.jsx(m, {
                className: 'space-y-4',
                children: i.map((a) =>
                  e.jsxs(
                    'div',
                    {
                      className: 'rounded-lg border border-warning/20 bg-warning/10 p-4',
                      children: [
                        e.jsxs('div', {
                          className: 'flex items-start justify-between gap-3',
                          children: [
                            e.jsx('h3', {
                              className: 'text-sm font-semibold text-warning-foreground',
                              children: a.title,
                            }),
                            e.jsx('span', {
                              className: 'text-xs font-medium text-warning-foreground/80',
                              children: a.dueIn,
                            }),
                          ],
                        }),
                        e.jsx('p', {
                          className: 'mt-2 text-sm text-warning-foreground/90',
                          children: a.detail,
                        }),
                        e.jsxs('div', {
                          className:
                            'mt-3 inline-flex items-center gap-2 rounded-full bg-background/70 px-3 py-1 text-xs font-medium text-warning-foreground shadow-sm',
                          children: [e.jsx(f, { className: 'h-3 w-3' }), a.owner],
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
      e.jsx('section', {
        className: 'grid gap-6 sm:grid-cols-2 2xl:grid-cols-4',
        children: x.map(({ icon: a, label: h, value: g, description: p }) =>
          e.jsxs(
            l,
            {
              className: 'col-span-1',
              children: [
                e.jsxs(o, {
                  className: 'flex flex-row items-center justify-between',
                  children: [
                    e.jsx(c, { className: 'text-sm font-semibold text-foreground', children: h }),
                    e.jsx(a, { className: 'h-5 w-5 text-primary' }),
                  ],
                }),
                e.jsxs(m, {
                  children: [
                    e.jsx('p', { className: 'text-2xl font-bold text-foreground', children: g }),
                    e.jsx('p', { className: 'mt-2 text-sm text-muted-foreground', children: p }),
                  ],
                }),
              ],
            },
            h,
          ),
        ),
      }),
      e.jsxs('section', {
        className: 'grid gap-6 md:grid-cols-2',
        children: [
          e.jsxs(l, {
            children: [
              e.jsxs(o, {
                className: 'flex items-center gap-2',
                children: [
                  e.jsx(I, { className: 'h-5 w-5 text-success' }),
                  e.jsx(c, {
                    children: s('dashboard.intelligenceHighlights', 'Intelligence highlights'),
                  }),
                ],
              }),
              e.jsx(m, {
                className: 'space-y-4',
                children: n.map((a) =>
                  e.jsxs(
                    'div',
                    {
                      className: 'rounded-lg border border-border bg-card p-4 shadow-sm',
                      children: [
                        e.jsxs('div', {
                          className: 'flex items-center justify-between',
                          children: [
                            e.jsx('h3', {
                              className: 'text-sm font-semibold text-foreground',
                              children: a.title,
                            }),
                            e.jsxs('span', {
                              className: 'text-xs font-medium text-muted-foreground',
                              children: [
                                s('dashboard.confidence', 'Confidence'),
                                ': ',
                                (a.confidence * 100).toFixed(0),
                                '%',
                              ],
                            }),
                          ],
                        }),
                        e.jsx('p', {
                          className: 'mt-2 text-sm text-muted-foreground',
                          children: a.summary,
                        }),
                        e.jsxs('span', {
                          className:
                            'mt-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary',
                          children: [
                            e.jsx(E, { className: 'h-3 w-3' }),
                            a.classification.toUpperCase(),
                          ],
                        }),
                      ],
                    },
                    a.id,
                  ),
                ),
              }),
            ],
          }),
          e.jsxs(l, {
            children: [
              e.jsx(o, {
                children: e.jsx(c, { children: s('dashboard.keyDates', 'Key milestones') }),
              }),
              e.jsxs(m, {
                className: 'space-y-4',
                children: [
                  e.jsxs('div', {
                    className: 'rounded-lg border border-border bg-card p-4 shadow-sm',
                    children: [
                      e.jsx('h3', {
                        className: 'text-sm font-semibold text-foreground',
                        children: s(
                          'dashboard.milestones.q1',
                          'Q1: North Africa statistical forum',
                        ),
                      }),
                      e.jsx('p', {
                        className: 'mt-1 text-sm text-muted-foreground',
                        children: s(
                          'dashboard.milestones.q1Description',
                          'Finalize agenda, confirm speakers, and publish bilingual briefing pack by 10 February.',
                        ),
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'rounded-lg border border-border bg-card p-4 shadow-sm',
                    children: [
                      e.jsx('h3', {
                        className: 'text-sm font-semibold text-foreground',
                        children: s('dashboard.milestones.q2', 'Q2: Data exchange sandbox rollout'),
                      }),
                      e.jsx('p', {
                        className: 'mt-1 text-sm text-muted-foreground',
                        children: s(
                          'dashboard.milestones.q2Description',
                          'Deploy secure upload workflow with 50MB artefact validation and audit trails.',
                        ),
                      }),
                    ],
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
const ae = V
export { ae as component }
//# sourceMappingURL=dashboard-Dl_GT9qc.js.map
