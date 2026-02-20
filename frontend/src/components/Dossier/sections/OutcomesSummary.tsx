/**
 * Outcomes Summary Section (Feature 028 - User Story 3 - T031)
 *
 * Displays key decisions and results from engagement.
 * Fetches from after-action decisions and commitments.
 * Mobile-first layout with RTL support.
 */

import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { arSA, enUS } from 'date-fns/locale'
import { CheckCircle2, Loader2, Gavel, AlertTriangle, Target, User, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Decision {
  id: string
  description: string
  rationale?: string | null
  decision_maker: string
  decision_date: string
}

interface Commitment {
  id: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: string
  owner_type: 'internal' | 'external'
  due_date: string
}

interface Risk {
  id: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  likelihood: 'unlikely' | 'possible' | 'likely' | 'certain'
  mitigation_strategy?: string | null
}

interface OutcomesSummaryProps {
  dossierId: string
}

export function OutcomesSummary({ dossierId }: OutcomesSummaryProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const dateLocale = isRTL ? arSA : enUS

  // Fetch after-action records with decisions, commitments, and risks
  const { data: afterActionData, isLoading } = useQuery({
    queryKey: ['after-action-outcomes', dossierId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('after-actions-list', {
        body: { dossier_id: dossierId, status: 'published', limit: 10 },
      })

      if (error || !data?.data) {
        return { decisions: [], commitments: [], risks: [] }
      }

      // Aggregate all outcomes from all after-action records
      const decisions: Decision[] = []
      const commitments: Commitment[] = []
      const risks: Risk[] = []

      for (const record of data.data) {
        if (record.decisions) {
          decisions.push(...record.decisions)
        }
        if (record.commitments) {
          commitments.push(...record.commitments)
        }
        if (record.risks) {
          risks.push(...record.risks)
        }
      }

      return { decisions, commitments, risks }
    },
    enabled: !!dossierId,
  })

  const { decisions = [], commitments = [], risks = [] } = afterActionData || {}
  const hasOutcomes = decisions.length > 0 || commitments.length > 0 || risks.length > 0

  // Get severity/priority badge color
  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    }
    return colors[severity] || colors.medium
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" dir={isRTL ? 'rtl' : 'ltr'}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Show empty state
  if (!hasOutcomes) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 sm:py-12 text-center"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="mb-4 sm:mb-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
          {t('sections.engagement.outcomesSummaryEmpty')}
        </h3>

        <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6 px-4">
          {t('sections.engagement.outcomesSummaryEmptyDescription')}
        </p>
      </div>
    )
  }

  // Render outcomes summary
  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Decisions Section */}
      {decisions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Gavel className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-base">
              {t('sections.engagement.decisions', 'Decisions')} ({decisions.length})
            </h3>
          </div>
          <div className="space-y-3">
            {decisions.map((decision) => (
              <Card key={decision.id}>
                <CardContent className="p-3 sm:p-4">
                  <p className="text-sm sm:text-base text-start mb-2">{decision.description}</p>
                  {decision.rationale && (
                    <p className="text-xs sm:text-sm text-muted-foreground text-start mb-2 italic">
                      {decision.rationale}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{decision.decision_maker}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(decision.decision_date), 'PP', { locale: dateLocale })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Commitments Section */}
      {commitments.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-base">
              {t('sections.engagement.commitments', 'Commitments')} ({commitments.length})
            </h3>
          </div>
          <div className="space-y-3">
            {commitments.map((commitment) => (
              <Card key={commitment.id}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm sm:text-base text-start flex-1">
                      {commitment.description}
                    </p>
                    <Badge
                      className={cn('text-xs shrink-0', getSeverityBadge(commitment.priority))}
                    >
                      {t(`priority.${commitment.priority}`, commitment.priority)}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {commitment.owner_type === 'internal'
                        ? t('commitment.internal', 'Internal')
                        : t('commitment.external', 'External')}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {t('commitment.dueBy', 'Due')}:{' '}
                        {format(new Date(commitment.due_date), 'PP', { locale: dateLocale })}
                      </span>
                    </div>
                    <Badge
                      variant={commitment.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {t(`status.${commitment.status}`, commitment.status)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Risks Section */}
      {risks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-base">
              {t('sections.engagement.risks', 'Identified Risks')} ({risks.length})
            </h3>
          </div>
          <div className="space-y-3">
            {risks.map((risk) => (
              <Card key={risk.id} className="border-amber-200 dark:border-amber-800">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm sm:text-base text-start flex-1">{risk.description}</p>
                    <Badge className={cn('text-xs shrink-0', getSeverityBadge(risk.severity))}>
                      {t(`severity.${risk.severity}`, risk.severity)}
                    </Badge>
                  </div>
                  {risk.mitigation_strategy && (
                    <p className="text-xs sm:text-sm text-muted-foreground text-start mt-2">
                      <span className="font-medium">{t('risk.mitigation', 'Mitigation')}:</span>{' '}
                      {risk.mitigation_strategy}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {t(`likelihood.${risk.likelihood}`, risk.likelihood)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
