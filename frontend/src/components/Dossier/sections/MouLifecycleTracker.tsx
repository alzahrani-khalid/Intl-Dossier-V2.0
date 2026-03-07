/**
 * MouLifecycleTracker Component
 *
 * Visual stage progression tracker for MoU lifecycle with government decision links.
 * Mobile-first responsive, RTL support.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FileText,
  MessageSquare,
  Scale,
  PenTool,
  Building2,
  CheckCircle2,
  Shield,
  Play,
  Clock,
  XCircle,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Crown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useGovernmentDecisions } from '@/hooks/useMouLifecycle'
import type { MouLifecycleStage, GovernmentDecision } from '@/types/mou-extended.types'

interface MouLifecycleTrackerProps {
  mouId: string
  currentStage?: MouLifecycleStage
  cabinetDecisionRef?: string | null
  cabinetDecisionDate?: string | null
  royalDecreeRef?: string | null
  royalDecreeDate?: string | null
  onUpdateStage?: (newStage: MouLifecycleStage) => void
}

// Define lifecycle stages in order
const LIFECYCLE_STAGES: MouLifecycleStage[] = [
  'draft',
  'negotiation',
  'legal_review',
  'signed',
  'cabinet_pending',
  'cabinet_approved',
  'ratification',
  'ratified',
  'in_force',
]

const TERMINAL_STAGES: MouLifecycleStage[] = ['expired', 'terminated', 'superseded']

export function MouLifecycleTracker({
  mouId,
  currentStage = 'draft',
  cabinetDecisionRef,
  cabinetDecisionDate,
  royalDecreeRef,
  royalDecreeDate,
  onUpdateStage,
}: MouLifecycleTrackerProps) {
  const { t, i18n } = useTranslation('mou-lifecycle')
  const isRTL = i18n.language === 'ar'

  const [showDecisions, setShowDecisions] = useState(false)

  // Fetch related government decisions
  const { data: decisions, isLoading: decisionsLoading } = useGovernmentDecisions({
    related_mou_id: mouId,
  })

  // Get stage icon
  const getStageIcon = (stage: MouLifecycleStage) => {
    const iconClass = 'h-4 w-4'
    switch (stage) {
      case 'draft':
        return <FileText className={iconClass} />
      case 'negotiation':
        return <MessageSquare className={iconClass} />
      case 'legal_review':
        return <Scale className={iconClass} />
      case 'signed':
        return <PenTool className={iconClass} />
      case 'cabinet_pending':
        return <Building2 className={iconClass} />
      case 'cabinet_approved':
        return <CheckCircle2 className={iconClass} />
      case 'ratification':
        return <Shield className={iconClass} />
      case 'ratified':
        return <Shield className={iconClass} />
      case 'in_force':
        return <Play className={iconClass} />
      case 'expired':
        return <Clock className={iconClass} />
      case 'terminated':
        return <XCircle className={iconClass} />
      case 'superseded':
        return <FileText className={iconClass} />
      default:
        return <FileText className={iconClass} />
    }
  }

  // Get stage status
  const getStageStatus = (stage: MouLifecycleStage): 'completed' | 'current' | 'upcoming' => {
    if (TERMINAL_STAGES.includes(currentStage)) {
      if (stage === currentStage) return 'current'
      return 'completed'
    }

    const currentIndex = LIFECYCLE_STAGES.indexOf(currentStage)
    const stageIndex = LIFECYCLE_STAGES.indexOf(stage)

    if (stageIndex < currentIndex) return 'completed'
    if (stageIndex === currentIndex) return 'current'
    return 'upcoming'
  }

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Check if stage is terminal
  const isTerminal = TERMINAL_STAGES.includes(currentStage)

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-start">
            {t('lifecycle.title', 'Lifecycle Management')}
          </h3>
          <p className="text-sm text-muted-foreground text-start">
            {t('lifecycle.currentStage', 'Current Stage')}:{' '}
            <span className="font-medium">{t(`stages.${currentStage}`, currentStage)}</span>
          </p>
        </div>

        {onUpdateStage && !isTerminal && (
          <Button variant="outline" size="sm" className="gap-2 min-h-10 shrink-0">
            {t('lifecycle.updateStage', 'Update Stage')}
          </Button>
        )}
      </div>

      {/* Visual Timeline */}
      <div className="relative">
        {/* Desktop: Horizontal timeline */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {LIFECYCLE_STAGES.map((stage, index) => {
              const status = getStageStatus(stage)
              const isLast = index === LIFECYCLE_STAGES.length - 1

              return (
                <div key={stage} className="flex items-center flex-1">
                  {/* Stage node */}
                  <div className="flex flex-col items-center min-w-[80px]">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                        status === 'completed' &&
                          'bg-primary border-primary text-primary-foreground',
                        status === 'current' && 'bg-primary/20 border-primary text-primary',
                        status === 'upcoming' &&
                          'bg-muted border-muted-foreground/30 text-muted-foreground',
                      )}
                    >
                      {getStageIcon(stage)}
                    </div>
                    <span
                      className={cn(
                        'text-xs mt-2 text-center max-w-[80px] line-clamp-2',
                        status === 'current' && 'font-medium text-primary',
                        status === 'upcoming' && 'text-muted-foreground',
                      )}
                    >
                      {t(`stages.${stage}`, stage)}
                    </span>
                  </div>

                  {/* Connector */}
                  {!isLast && (
                    <div
                      className={cn(
                        'flex-1 h-0.5 mx-1',
                        status === 'completed' ? 'bg-primary' : 'bg-muted-foreground/30',
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile: Vertical timeline */}
        <div className="md:hidden space-y-3">
          {LIFECYCLE_STAGES.map((stage, index) => {
            const status = getStageStatus(stage)
            const isLast = index === LIFECYCLE_STAGES.length - 1

            return (
              <div key={stage} className="flex items-start gap-3">
                {/* Stage node */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0',
                      status === 'completed' && 'bg-primary border-primary text-primary-foreground',
                      status === 'current' && 'bg-primary/20 border-primary text-primary',
                      status === 'upcoming' &&
                        'bg-muted border-muted-foreground/30 text-muted-foreground',
                    )}
                  >
                    {getStageIcon(stage)}
                  </div>
                  {!isLast && (
                    <div
                      className={cn(
                        'w-0.5 h-6 mt-1',
                        status === 'completed' ? 'bg-primary' : 'bg-muted-foreground/30',
                      )}
                    />
                  )}
                </div>

                {/* Stage info */}
                <div className="flex-1 pb-3">
                  <p
                    className={cn(
                      'text-sm',
                      status === 'current' && 'font-medium text-primary',
                      status === 'upcoming' && 'text-muted-foreground',
                    )}
                  >
                    {t(`stages.${stage}`, stage)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t(`stageDescriptions.${stage}`, '')}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Terminal Stage Badge */}
      {isTerminal && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
          {getStageIcon(currentStage)}
          <span className="text-sm font-medium text-destructive">
            {t(`stages.${currentStage}`, currentStage)}
          </span>
          <span className="text-sm text-muted-foreground">
            - {t(`stageDescriptions.${currentStage}`, '')}
          </span>
        </div>
      )}

      {/* Cabinet & Royal Decree Info */}
      {(cabinetDecisionRef || royalDecreeRef) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Cabinet Approval */}
          {cabinetDecisionRef && (
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-blue-100 p-2 shrink-0">
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-medium text-start">
                    {t('cabinetApproval.title', 'Cabinet Approval')}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('cabinetApproval.reference', 'Reference')}: {cabinetDecisionRef}
                  </p>
                  {cabinetDecisionDate && (
                    <p className="text-xs text-muted-foreground">
                      {formatDate(cabinetDecisionDate)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Royal Decree */}
          {royalDecreeRef && (
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-amber-100 p-2 shrink-0">
                  <Crown className="h-4 w-4 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-medium text-start">
                    {t('royalDecree.title', 'Royal Decree')}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('royalDecree.reference', 'Reference')}: {royalDecreeRef}
                  </p>
                  {royalDecreeDate && (
                    <p className="text-xs text-muted-foreground">{formatDate(royalDecreeDate)}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Government Decisions Section */}
      <div className="border rounded-lg">
        <button
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          onClick={() => setShowDecisions(!showDecisions)}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {t('governmentDecisions.title', 'Government Decisions')}
            </span>
            {decisions && decisions.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {decisions.length}
              </Badge>
            )}
          </div>
          {showDecisions ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className={cn('h-4 w-4 text-muted-foreground', isRTL && 'rotate-180')} />
          )}
        </button>

        {showDecisions && (
          <div className="border-t p-4 space-y-3">
            {decisionsLoading && (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            )}

            {!decisionsLoading && decisions && decisions.length > 0 && (
              <div className="space-y-3">
                {decisions.map((decision) => (
                  <DecisionCard
                    key={decision.id}
                    decision={decision}
                    isRTL={isRTL}
                    t={t}
                    i18n={i18n}
                  />
                ))}
              </div>
            )}

            {!decisionsLoading && (!decisions || decisions.length === 0) && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  {t('governmentDecisions.empty', 'No government decisions')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Decision Card Component
interface DecisionCardProps {
  decision: GovernmentDecision
  isRTL: boolean
  t: ReturnType<typeof useTranslation>['t']
  i18n: { language: string }
}

function DecisionCard({ decision, isRTL, t, i18n }: DecisionCardProps) {
  const title = isRTL ? decision.title_ar || decision.title_en : decision.title_en

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getDecisionIcon = () => {
    switch (decision.decision_type) {
      case 'royal_decree':
      case 'royal_order':
        return <Crown className="h-4 w-4 text-amber-600" />
      case 'cabinet_resolution':
        return <Building2 className="h-4 w-4 text-blue-600" />
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusVariant = (): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (decision.status) {
      case 'active':
        return 'default'
      case 'draft':
        return 'secondary'
      case 'revoked':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <div className="p-3 rounded-lg border bg-card hover:border-muted-foreground/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">{getDecisionIcon()}</div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-start line-clamp-2">{title}</p>
              <p className="text-xs text-muted-foreground">
                {t(`decisionTypes.${decision.decision_type}`, decision.decision_type)} •{' '}
                {decision.reference_number}
              </p>
            </div>

            <Badge variant={getStatusVariant()} className="text-xs shrink-0">
              {t(`decisionStatus.${decision.status}`, decision.status)}
            </Badge>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>{formatDate(decision.decision_date)}</span>
            {decision.issuing_authority_en && (
              <span>
                {isRTL
                  ? decision.issuing_authority_ar || decision.issuing_authority_en
                  : decision.issuing_authority_en}
              </span>
            )}
            {decision.document_url && (
              <a
                href={
                  isRTL ? decision.document_url_ar || decision.document_url : decision.document_url
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
                {t('actions.viewDecision', 'View')}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MouLifecycleTracker
