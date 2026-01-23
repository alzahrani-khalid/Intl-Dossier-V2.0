/**
 * Position Consistency Check Panel Component
 * Feature: position-consistency-checker
 *
 * Displays AI-powered consistency analysis results with:
 * - Overall score and risk level
 * - Detected conflicts
 * - Similar positions
 * - AI recommendations
 * - Human review actions
 *
 * Follows mobile-first design with RTL support
 */

import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  FileWarning,
  GitMerge,
  Loader2,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  useRunConsistencyCheck,
  useLatestConsistencyCheck,
  useSubmitReviewDecision,
  consistencyCheckUtils,
  type ConsistencyCheckResult,
  type ConflictResult,
  type SimilarPosition,
  type Recommendation,
  type RiskLevel,
} from '@/hooks/usePositionConsistencyCheck'

interface ConsistencyCheckPanelProps {
  positionId: string
  positionStatus: string
  onApprovalStatusChange?: (canProceed: boolean) => void
  className?: string
}

export function ConsistencyCheckPanel({
  positionId,
  positionStatus,
  onApprovalStatusChange,
  className,
}: ConsistencyCheckPanelProps) {
  const { t, i18n } = useTranslation('positions')
  const isRTL = i18n.language === 'ar'

  const [isConflictsOpen, setIsConflictsOpen] = useState(true)
  const [isSimilarOpen, setIsSimilarOpen] = useState(false)
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(true)
  const [reviewNotes, setReviewNotes] = useState('')

  const {
    data: latestCheck,
    isLoading: isLoadingCheck,
    refetch,
  } = useLatestConsistencyCheck(positionId)

  const runCheck = useRunConsistencyCheck()
  const submitReview = useSubmitReviewDecision()

  const handleRunCheck = async () => {
    try {
      const result = await runCheck.mutateAsync({
        position_id: positionId,
        analysis_type: 'pre_approval',
        include_recommendations: true,
      })

      // Notify parent about approval status
      if (onApprovalStatusChange) {
        onApprovalStatusChange(!result.requires_human_review || result.auto_approved)
      }
    } catch (error) {
      console.error('Failed to run consistency check:', error)
    }
  }

  const handleReviewDecision = async (decision: 'approved' | 'rejected' | 'revision_required') => {
    if (!latestCheck) return

    try {
      await submitReview.mutateAsync({
        check_id: latestCheck.id,
        decision,
        notes: reviewNotes || undefined,
      })

      if (onApprovalStatusChange) {
        onApprovalStatusChange(decision === 'approved')
      }

      setReviewNotes('')
    } catch (error) {
      console.error('Failed to submit review decision:', error)
    }
  }

  const getRiskIcon = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
      case 'low':
        return <ShieldCheck className="size-5 text-green-600" />
      case 'medium':
        return <Shield className="size-5 text-yellow-600" />
      case 'high':
        return <ShieldAlert className="size-5 text-orange-600" />
      case 'critical':
        return <AlertCircle className="size-5 text-red-600" />
      default:
        return <Shield className="size-5 text-gray-600" />
    }
  }

  if (isLoadingCheck) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <span className="ms-2 text-muted-foreground">
            {t('consistency.loading', 'Loading consistency check...')}
          </span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FileWarning className="size-5" />
            {t('consistency.title', 'Consistency Analysis')}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunCheck}
            disabled={runCheck.isPending}
            className="min-h-10 min-w-10 sm:min-h-9"
          >
            {runCheck.isPending ? (
              <Loader2 className="me-2 size-4 animate-spin" />
            ) : (
              <RefreshCw className="me-2 size-4" />
            )}
            {t('consistency.runCheck', 'Run Check')}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        {!latestCheck ? (
          <div className="py-8 text-center">
            <FileWarning className="mx-auto mb-4 size-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground sm:text-base">
              {t('consistency.noCheck', 'No consistency check has been run yet.')}
            </p>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              {t(
                'consistency.noCheckHint',
                'Run a check to analyze this position against the existing repository.',
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Score and Risk Level */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Overall Score */}
              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t('consistency.overallScore', 'Overall Score')}
                  </span>
                  <span
                    className={cn(
                      'text-2xl font-bold',
                      consistencyCheckUtils.getScoreColor(latestCheck.overall_score),
                    )}
                  >
                    {latestCheck.overall_score}%
                  </span>
                </div>
                <Progress
                  value={latestCheck.overall_score}
                  className={cn(
                    'h-2',
                    consistencyCheckUtils.getScoreProgressColor(latestCheck.overall_score),
                  )}
                />
              </div>

              {/* Risk Level */}
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t('consistency.riskLevel', 'Risk Level')}
                  </span>
                  <Badge
                    className={cn(
                      'gap-1',
                      consistencyCheckUtils.getRiskLevelColor(latestCheck.risk_level),
                    )}
                  >
                    {getRiskIcon(latestCheck.risk_level)}
                    {t(`consistency.risk.${latestCheck.risk_level}`, latestCheck.risk_level)}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {latestCheck.requires_human_review && (
                    <Badge variant="outline\" className="text-xs">
                      <AlertTriangle className="me-1 size-3" />
                      {t('consistency.humanReviewRequired', 'Review Required')}
                    </Badge>
                  )}
                  {latestCheck.auto_approved && (
                    <Badge variant="outline" className="text-xs text-green-600">
                      <CheckCircle className="me-1 size-3" />
                      {t('consistency.autoApproved', 'Auto-Approved')}
                    </Badge>
                  )}
                  {!latestCheck.ai_service_available && (
                    <Badge variant="outline" className="text-xs text-yellow-600">
                      <AlertTriangle className="me-1 size-3" />
                      {t('consistency.aiUnavailable', 'AI Unavailable')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Conflicts Section */}
            <Collapsible open={isConflictsOpen} onOpenChange={setIsConflictsOpen}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50 sm:p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="size-4 text-orange-600 sm:size-5" />
                  <span className="text-sm font-medium sm:text-base">
                    {t('consistency.conflicts', 'Conflicts')}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {latestCheck.conflicts.length}
                  </Badge>
                </div>
                {isConflictsOpen ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                {latestCheck.conflicts.length === 0 ? (
                  <div className="rounded-lg bg-green-50 p-4 text-center">
                    <CheckCircle className="mx-auto mb-2 size-6 text-green-600" />
                    <p className="text-sm text-green-700">
                      {t('consistency.noConflicts', 'No conflicts detected')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {latestCheck.conflicts.map((conflict) => (
                      <ConflictCard key={conflict.conflict_id} conflict={conflict} isRTL={isRTL} />
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Similar Positions Section */}
            <Collapsible open={isSimilarOpen} onOpenChange={setIsSimilarOpen}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50 sm:p-4">
                <div className="flex items-center gap-2">
                  <GitMerge className="size-4 text-blue-600 sm:size-5" />
                  <span className="text-sm font-medium sm:text-base">
                    {t('consistency.similarPositions', 'Similar Positions')}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {latestCheck.similar_positions.length}
                  </Badge>
                </div>
                {isSimilarOpen ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                {latestCheck.similar_positions.length === 0 ? (
                  <div className="rounded-lg bg-muted p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      {t('consistency.noSimilar', 'No similar positions found')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {latestCheck.similar_positions.map((similar) => (
                      <SimilarPositionCard
                        key={similar.position_id}
                        position={similar}
                        isRTL={isRTL}
                      />
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Recommendations Section */}
            <Collapsible open={isRecommendationsOpen} onOpenChange={setIsRecommendationsOpen}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50 sm:p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-600 sm:size-5" />
                  <span className="text-sm font-medium sm:text-base">
                    {t('consistency.recommendations', 'Recommendations')}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {latestCheck.recommendations.items.length}
                  </Badge>
                </div>
                {isRecommendationsOpen ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="mb-3 rounded-lg bg-muted/50 p-4">
                  <p className="text-sm">
                    {isRTL
                      ? latestCheck.recommendations.summary_ar
                      : latestCheck.recommendations.summary_en}
                  </p>
                </div>
                <div className="space-y-2">
                  {latestCheck.recommendations.items.map((rec, index) => (
                    <RecommendationCard key={index} recommendation={rec} isRTL={isRTL} />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Human Review Section */}
            {latestCheck.requires_human_review &&
              latestCheck.review_status === 'pending_review' && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <h4 className="mb-3 flex items-center gap-2 font-medium text-yellow-800">
                    <AlertTriangle className="size-4" />
                    {t('consistency.reviewRequired', 'Human Review Required')}
                  </h4>
                  <Textarea
                    placeholder={t(
                      'consistency.reviewNotesPlaceholder',
                      'Add review notes (optional)...',
                    )}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="mb-3 min-h-20 bg-white"
                  />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      variant="default"
                      className="min-h-11 flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleReviewDecision('approved')}
                      disabled={submitReview.isPending}
                    >
                      <CheckCircle className="me-2 size-4" />
                      {t('consistency.approve', 'Approve')}
                    </Button>
                    <Button
                      variant="outline"
                      className="min-h-11 flex-1 border-yellow-600 text-yellow-600"
                      onClick={() => handleReviewDecision('revision_required')}
                      disabled={submitReview.isPending}
                    >
                      <AlertTriangle className="me-2 size-4" />
                      {t('consistency.requestRevision', 'Request Revision')}
                    </Button>
                    <Button
                      variant="destructive"
                      className="min-h-11 flex-1"
                      onClick={() => handleReviewDecision('rejected')}
                      disabled={submitReview.isPending}
                    >
                      <XCircle className="me-2 size-4" />
                      {t('consistency.reject', 'Reject')}
                    </Button>
                  </div>
                </div>
              )}

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-2 border-t pt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="size-3" />
                {new Date(latestCheck.analyzed_at).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
              </div>
              {latestCheck.processing_time_ms && <span>({latestCheck.processing_time_ms}ms)</span>}
              {consistencyCheckUtils.isOutdated(latestCheck.analyzed_at) && (
                <Badge variant="outline" className="text-xs text-yellow-600">
                  {t('consistency.outdated', 'Outdated')}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Sub-components

function ConflictCard({ conflict, isRTL }: { conflict: ConflictResult; isRTL: boolean }) {
  const { t } = useTranslation('positions')

  return (
    <div className="rounded-lg border p-3 sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Badge
              className={cn('text-xs', consistencyCheckUtils.getSeverityColor(conflict.severity))}
            >
              {t(`consistency.severity.${conflict.severity}`, conflict.severity)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {consistencyCheckUtils.formatConflictType(conflict.conflict_type)}
            </Badge>
          </div>
          <h5 className="text-sm font-medium sm:text-base">
            {isRTL
              ? conflict.conflicting_position_title_ar
              : conflict.conflicting_position_title_en}
          </h5>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {isRTL ? conflict.description_ar : conflict.description_en}
          </p>
          {(conflict.suggested_resolution_en || conflict.suggested_resolution_ar) && (
            <div className="mt-2 rounded bg-muted p-2 text-xs">
              <span className="font-medium">
                {t('consistency.suggestedResolution', 'Suggested Resolution')}:
              </span>{' '}
              {isRTL ? conflict.suggested_resolution_ar : conflict.suggested_resolution_en}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SimilarPositionCard({ position, isRTL }: { position: SimilarPosition; isRTL: boolean }) {
  const { t } = useTranslation('positions')

  return (
    <div className="rounded-lg border p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h5 className="truncate text-sm font-medium sm:text-base">
            {isRTL ? position.title_ar : position.title_en}
          </h5>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {position.status}
            </Badge>
            {position.thematic_category && (
              <Badge variant="secondary" className="text-xs">
                {position.thematic_category}
              </Badge>
            )}
          </div>
        </div>
        <div className="text-end">
          <div className="text-lg font-bold text-blue-600">
            {(position.similarity_score * 100).toFixed(0)}%
          </div>
          <Badge
            variant={position.relationship === 'duplicate' ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {t(`consistency.relationship.${position.relationship}`, position.relationship)}
          </Badge>
        </div>
      </div>
    </div>
  )
}

function RecommendationCard({
  recommendation,
  isRTL,
}: {
  recommendation: Recommendation
  isRTL: boolean
}) {
  const { t } = useTranslation('positions')

  const getTypeIcon = () => {
    switch (recommendation.type) {
      case 'approve':
        return <CheckCircle className="size-4 text-green-600" />
      case 'reject':
        return <XCircle className="size-4 text-red-600" />
      case 'merge':
        return <GitMerge className="size-4 text-blue-600" />
      case 'update':
        return <RefreshCw className="size-4 text-yellow-600" />
      case 'deprecate':
        return <AlertTriangle className="size-4 text-orange-600" />
      case 'review':
        return <AlertCircle className="size-4 text-purple-600" />
      default:
        return <AlertCircle className="size-4" />
    }
  }

  const getPriorityColor = () => {
    switch (recommendation.priority) {
      case 'high':
        return 'border-red-200 bg-red-50'
      case 'medium':
        return 'border-yellow-200 bg-yellow-50'
      case 'low':
        return 'border-green-200 bg-green-50'
      default:
        return ''
    }
  }

  return (
    <div className={cn('rounded-lg border p-3 sm:p-4', getPriorityColor())}>
      <div className="flex items-start gap-2">
        {getTypeIcon()}
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="outline" className="text-xs capitalize">
              {recommendation.type}
            </Badge>
            <Badge
              variant={recommendation.priority === 'high' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {t(`consistency.priority.${recommendation.priority}`, recommendation.priority)}
            </Badge>
          </div>
          <p className="text-sm">
            {isRTL ? recommendation.description_ar : recommendation.description_en}
          </p>
          {((isRTL && recommendation.action_items_ar?.length) ||
            (!isRTL && recommendation.action_items_en?.length)) && (
            <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
              {(isRTL ? recommendation.action_items_ar : recommendation.action_items_en)?.map(
                (item, idx) => (
                  <li key={idx}>{item}</li>
                ),
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConsistencyCheckPanel
