import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  Building2,
  CheckCircle,
  Clock,
  FileText,
  Globe2,
  ShieldCheck,
} from 'lucide-react'
import { StatCard } from './components/StatCard'
import { UpcomingEvents } from './components/UpcomingEvents'
import { RelationshipHealthChart } from './components/RelationshipHealthChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface WorkflowSnapshot {
  label: string
  total: number
  delta: string
  status: 'positive' | 'neutral' | 'negative'
  description: string
}

interface AlertItem {
  id: string
  title: string
  detail: string
  severity: 'high' | 'medium'
  owner: string
  dueIn: string
}

interface IntelligenceHighlight {
  id: string
  title: string
  summary: string
  confidence: number
  classification: 'confidential' | 'restricted' | 'public'
}

export function DashboardPage() {
  const { t } = useTranslation()

  const stats = useMemo(
    () => [
      {
        title: t('dashboard.metrics.partners', 'Active bilateral partners'),
        value: '64',
        change: t('dashboard.metrics.partnersChange', '+4 since Q3'),
        changeType: 'increase' as const,
        description: t('dashboard.metrics.partnersDescription', '12 strategic partners flagged for quarterly review'),
        trend: t('dashboard.metrics.partnersTrend', '95% of partner scorecards healthy'),
      },
      {
        title: t('dashboard.metrics.mous', 'MoUs in workflow'),
        value: '28',
        change: t('dashboard.metrics.mousChange', '5 awaiting external review'),
        changeType: 'neutral' as const,
        description: t('dashboard.metrics.mousDescription', 'Average turnaround 18 days'),
        trend: t('dashboard.metrics.mousTrend', 'Three agreements expiring within 30 days'),
      },
      {
        title: t('dashboard.metrics.events', 'Upcoming missions & events'),
        value: '17',
        change: t('dashboard.metrics.eventsChange', '+2 high priority'),
        changeType: 'increase' as const,
        description: t('dashboard.metrics.eventsDescription', 'Calendar coverage at 82% capacity'),
        trend: t('dashboard.metrics.eventsTrend', 'Conflict detection triggered twice this week'),
      },
      {
        title: t('dashboard.metrics.intelligence', 'Intelligence briefs published'),
        value: '42',
        change: t('dashboard.metrics.intelligenceChange', '88% with confidence ≥ 0.75'),
        changeType: 'increase' as const,
        description: t('dashboard.metrics.intelligenceDescription', 'AI-assisted summarisation used on 31 briefs'),
        trend: t('dashboard.metrics.intelligenceTrend', 'Classification SLA at 100% compliance'),
      },
    ],
    [t]
  )

  const workflowSnapshot: WorkflowSnapshot[] = [
    {
      label: t('dashboard.workflow.internalReview', 'Internal review'),
      total: 9,
      delta: t('dashboard.workflow.internalReviewDelta', '▼ 2 since last week'),
      status: 'positive',
      description: t('dashboard.workflow.internalReviewDescription', 'All drafts include legal comments'),
    },
    {
      label: t('dashboard.workflow.externalReview', 'External review'),
      total: 5,
      delta: t('dashboard.workflow.externalReviewDelta', '▲ 1 requires policy note'),
      status: 'negative',
      description: t('dashboard.workflow.externalReviewDescription', 'Waiting on partner signature for UAE statistics exchange'),
    },
    {
      label: t('dashboard.workflow.negotiation', 'Negotiation'),
      total: 3,
      delta: t('dashboard.workflow.negotiationDelta', 'steady'),
      status: 'neutral',
      description: t('dashboard.workflow.negotiationDescription', 'Focus on renewable energy collaboration with EU bloc'),
    },
    {
      label: t('dashboard.workflow.renewals', 'Renewals this quarter'),
      total: 6,
      delta: t('dashboard.workflow.renewalsDelta', '▲ 2 triggered by expiry alerts'),
      status: 'positive',
      description: t('dashboard.workflow.renewalsDescription', 'Auto-reminders sent to legal and finance owners'),
    },
  ]

  const alertItems: AlertItem[] = [
    {
      id: 'alert-1',
      title: t('dashboard.alerts.expiringMou', 'MoU with ABS (Australia) expires in 21 days'),
      detail: t('dashboard.alerts.expiringMouDetail', 'Pending financial annex approval and updated data governance addendum.'),
      severity: 'high',
      owner: 'Legal Affairs',
      dueIn: t('dashboard.alerts.expiringMouDue', 'Review due in 7 days'),
    },
    {
      id: 'alert-2',
      title: t('dashboard.alerts.conflict', 'Schedule conflict: OECD mission vs GCC summit'),
      detail: t('dashboard.alerts.conflictDetail', 'Both events request the deputy governor. Propose alternate lead or reschedule OECD briefing.'),
      severity: 'medium',
      owner: 'International Relations',
      dueIn: t('dashboard.alerts.conflictDue', 'Escalate by 30 January'),
    },
    {
      id: 'alert-3',
      title: t('dashboard.alerts.security', 'Intelligence brief requires reclassification'),
      detail: t('dashboard.alerts.securityDetail', 'AI summary flagged sensitive source. Awaiting manual review for downgrade.'),
      severity: 'high',
      owner: 'Security Operations',
      dueIn: t('dashboard.alerts.securityDue', 'Complete within 48 hours'),
    },
  ]

  const intelligenceHighlights: IntelligenceHighlight[] = [
    {
      id: 'intel-1',
      title: t('dashboard.intelligence.gdp', 'Regional GDP harmonisation opportunity'),
      summary: t(
        'dashboard.intelligence.gdpSummary',
        'GCC working group proposes shared methodology. Requires delegation approval before March summit.'
      ),
      confidence: 0.82,
      classification: 'restricted',
    },
    {
      id: 'intel-2',
      title: t('dashboard.intelligence.ai', 'AI-assisted data exchange pilot'),
      summary: t(
        'dashboard.intelligence.aiSummary',
        'AnythingLLM pilot reduced review time by 28%. Recommend expanding to agricultural statistics domain.'
      ),
      confidence: 0.91,
      classification: 'confidential',
    },
    {
      id: 'intel-3',
      title: t('dashboard.intelligence.training', 'Capacity building demand from francophone partners'),
      summary: t(
        'dashboard.intelligence.trainingSummary',
        'Six African national statistics offices requested advanced sampling workshops. Suggested schedule Q2 2025.'
      ),
      confidence: 0.74,
      classification: 'restricted',
    },
  ]

  const performanceTargets = [
    {
      icon: Globe2,
      label: t('dashboard.performance.bilingual', 'Bilingual coverage'),
      value: '100%',
      description: t('dashboard.performance.bilingualDescription', 'All priority content available in Arabic & English'),
    },
    {
      icon: ShieldCheck,
      label: t('dashboard.performance.mfa', 'MFA compliance'),
      value: '100%',
      description: t('dashboard.performance.mfaDescription', 'TOTP enforced for 312 active accounts'),
    },
    {
      icon: FileText,
      label: t('dashboard.performance.contracts', 'Contract test coverage'),
      value: '52 / 52',
      description: t('dashboard.performance.contractsDescription', 'Latest schema sync completed 26 September 2025'),
    },
    {
      icon: Building2,
      label: t('dashboard.performance.organisations', 'Organisation hierarchies verified'),
      value: '31',
      description: t('dashboard.performance.organisationsDescription', 'All delegations mapped with delegation expiry checks'),
    },
  ]

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-semibold text-base-900 dark:text-base-50">
          {t('dashboard.title', 'Operations overview')}
        </h1>
        <p className="max-w-3xl text-base text-base-600 dark:text-base-300">
          {t(
            'dashboard.subtitle',
            'Live status of international commitments, intelligence briefs, and partner activities across the GASTAT dossier.'
          )}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>{t('dashboard.relationshipHealth', 'Relationship health')}</CardTitle>
            <span className="text-sm text-base-500">
              {t('dashboard.relationshipDescription', 'Aggregated scores across top partner blocs (rolling 90 days)')}
            </span>
          </CardHeader>
          <CardContent>
            <RelationshipHealthChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.upcomingMissions', 'Upcoming missions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <UpcomingEvents />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{t('dashboard.workflowSnapshotTitle', 'Workflow snapshot')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {workflowSnapshot.map((item) => (
              <div
                key={item.label}
                className="flex flex-col gap-2 rounded-lg border border-base-200 bg-white p-4 shadow-sm dark:border-base-700 dark:bg-base-900/70 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-base-800 dark:text-base-50">{item.label}</p>
                  <p className="text-xs text-base-500 dark:text-base-400">{item.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-primary-700 dark:text-primary-300">{item.total}</span>
                  <span
                    className={
                      item.status === 'positive'
                        ? 'text-xs font-medium text-emerald-600 dark:text-emerald-400'
                        : item.status === 'negative'
                        ? 'text-xs font-medium text-red-600 dark:text-red-400'
                        : 'text-xs font-medium text-base-500 dark:text-base-300'
                    }
                  >
                    {item.delta}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle>{t('dashboard.alerts.title', 'High-risk alerts')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {alertItems.map((alert) => (
              <div
                key={alert.id}
                className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-700/40 dark:bg-amber-800/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                    {alert.title}
                  </h3>
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                    {alert.dueIn}
                  </span>
                </div>
                <p className="mt-2 text-sm text-amber-800 dark:text-amber-200/90">{alert.detail}</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-amber-700 shadow-sm dark:bg-amber-900/40 dark:text-amber-200">
                  <ShieldCheck className="h-3 w-3" />
                  {alert.owner}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        {performanceTargets.map(({ icon: Icon, label, value, description }) => (
          <Card key={label} className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-base-700 dark:text-base-200">
                {label}
              </CardTitle>
              <Icon className="h-5 w-5 text-primary-600 dark:text-primary-300" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-base-900 dark:text-base-50">{value}</p>
              <p className="mt-2 text-sm text-base-500 dark:text-base-400">{description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <CardTitle>{t('dashboard.intelligenceHighlights', 'Intelligence highlights')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {intelligenceHighlights.map((highlight) => (
              <div
                key={highlight.id}
                className="rounded-lg border border-base-200 bg-white p-4 shadow-sm dark:border-base-700 dark:bg-base-900/70"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-base-800 dark:text-base-100">
                    {highlight.title}
                  </h3>
                  <span className="text-xs font-medium text-base-500 dark:text-base-400">
                    {t('dashboard.confidence', 'Confidence')}: {(highlight.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="mt-2 text-sm text-base-600 dark:text-base-300">{highlight.summary}</p>
                <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-200">
                  <Clock className="h-3 w-3" />
                  {highlight.classification.toUpperCase()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.keyDates', 'Key milestones')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-base-200 bg-white p-4 shadow-sm dark:border-base-700 dark:bg-base-900/70">
              <h3 className="text-sm font-semibold text-base-800 dark:text-base-100">
                {t('dashboard.milestones.q1', 'Q1: North Africa statistical forum')}
              </h3>
              <p className="mt-1 text-sm text-base-500 dark:text-base-400">
                {t(
                  'dashboard.milestones.q1Description',
                  'Finalize agenda, confirm speakers, and publish bilingual briefing pack by 10 February.'
                )}
              </p>
            </div>
            <div className="rounded-lg border border-base-200 bg-white p-4 shadow-sm dark:border-base-700 dark:bg-base-900/70">
              <h3 className="text-sm font-semibold text-base-800 dark:text-base-100">
                {t('dashboard.milestones.q2', 'Q2: Data exchange sandbox rollout')}
              </h3>
              <p className="mt-1 text-sm text-base-500 dark:text-base-400">
                {t(
                  'dashboard.milestones.q2Description',
                  'Deploy secure upload workflow with 50MB artefact validation and audit trails.'
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
