/**
 * ComplianceSummaryCard Component
 * Feature: compliance-rules-management
 *
 * Displays a summary of compliance status for an entity,
 * including violation counts and quick actions.
 */

import { useTranslation } from 'react-i18next'
import {
  Shield,
  AlertTriangle,
  XCircle,
  Clock,
  FileCheck,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { ComplianceEntityType, EntityComplianceSummary } from '@/types/compliance.types'
import { useEntityComplianceSummary } from '@/hooks/useComplianceRules'

interface ComplianceSummaryCardProps {
  entityType: ComplianceEntityType
  entityId: string
  onViewViolations?: () => void
  onRunCheck?: () => void
  compact?: boolean
}

export function ComplianceSummaryCard({
  entityType,
  entityId,
  onViewViolations,
  onRunCheck,
  compact = false,
}: ComplianceSummaryCardProps) {
  const { t, i18n } = useTranslation('compliance')
  const isRTL = i18n.language === 'ar'

  const { data: summary, isLoading, error } = useEntityComplianceSummary(entityType, entityId)

  // Calculate compliance score (inverse of violation percentage)
  const getComplianceScore = (data: EntityComplianceSummary | undefined) => {
    if (!data || data.total_violations === 0) return 100
    // Score decreases based on severity-weighted violations
    const weightedPending = data.pending_violations * 1
    const weightedCritical = data.critical_violations * 2
    const weightedBlocking = data.blocking_violations * 4
    const maxScore = 100
    const penalty = Math.min((weightedPending + weightedCritical + weightedBlocking) * 5, maxScore)
    return Math.max(maxScore - penalty, 0)
  }

  const complianceScore = getComplianceScore(summary)

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    if (score >= 40) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    if (score >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getStatusBadge = () => {
    if (!summary) return null

    if (summary.blocking_violations > 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="size-3" />
          {t('summary.blockingViolations')}: {summary.blocking_violations}
        </Badge>
      )
    }

    if (summary.critical_violations > 0) {
      return (
        <Badge
          variant="outline"
          className="gap-1 border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300"
        >
          <AlertTriangle className="size-3" />
          {t('summary.criticalViolations')}: {summary.critical_violations}
        </Badge>
      )
    }

    if (summary.pending_violations > 0) {
      return (
        <Badge
          variant="outline"
          className="gap-1 border-yellow-200 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300"
        >
          <Clock className="size-3" />
          {t('summary.pendingViolations')}: {summary.pending_violations}
        </Badge>
      )
    }

    return (
      <Badge
        variant="outline"
        className="gap-1 border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
      >
        <CheckCircle className="size-3" />
        {t('check.passed')}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <Card dir={isRTL ? 'rtl' : 'ltr'}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card dir={isRTL ? 'rtl' : 'ltr'}>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <AlertTriangle className="mb-2 size-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{t('messages.error')}</p>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <div
        className="flex items-center justify-between gap-4 rounded-lg border bg-card p-3"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center gap-3">
          <Shield className={`size-5 ${getScoreColor(complianceScore)}`} />
          <div>
            <p className="text-sm font-medium">{t('summary.title')}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className={`text-lg font-bold ${getScoreColor(complianceScore)}`}>
                {complianceScore}%
              </span>
              {getStatusBadge()}
            </div>
          </div>
        </div>
        {summary?.requires_signoff ? (
          <Button size="sm" variant="outline" onClick={onViewViolations}>
            <FileCheck className="me-1 size-4" />
            {summary.requires_signoff}
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className={`size-5 ${getScoreColor(complianceScore)}`} />
            {t('summary.title')}
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Compliance Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('summary.complianceScore')}</span>
            <span className={`font-bold ${getScoreColor(complianceScore)}`}>
              {complianceScore}%
            </span>
          </div>
          <Progress
            value={complianceScore}
            className="h-2"
            style={
              {
                '--progress-indicator-color': getProgressColor(complianceScore),
              } as React.CSSProperties
            }
          />
        </div>

        {/* Violation Counts */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <p className="text-2xl font-bold">{summary?.total_violations || 0}</p>
            <p className="text-xs text-muted-foreground">{t('summary.totalViolations')}</p>
          </div>
          <div className="rounded-lg bg-yellow-50 p-2 text-center dark:bg-yellow-900/20">
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
              {summary?.pending_violations || 0}
            </p>
            <p className="text-xs text-muted-foreground">{t('summary.pendingViolations')}</p>
          </div>
          <div className="rounded-lg bg-orange-50 p-2 text-center dark:bg-orange-900/20">
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {summary?.critical_violations || 0}
            </p>
            <p className="text-xs text-muted-foreground">{t('summary.criticalViolations')}</p>
          </div>
          <div className="rounded-lg bg-red-50 p-2 text-center dark:bg-red-900/20">
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
              {summary?.blocking_violations || 0}
            </p>
            <p className="text-xs text-muted-foreground">{t('summary.blockingViolations')}</p>
          </div>
        </div>

        {/* Sign-off required indicator */}
        {summary && summary.requires_signoff > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
            <div className="flex items-center gap-2">
              <FileCheck className="size-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  {t('summary.requiresSignoff')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.requires_signoff} {summary.requires_signoff === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>
            {onViewViolations && (
              <Button
                size="sm"
                variant="outline"
                onClick={onViewViolations}
                className="border-amber-300 dark:border-amber-700"
              >
                {t('check.viewViolations')}
              </Button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 border-t pt-2">
          {onViewViolations && (
            <Button variant="outline" size="sm" onClick={onViewViolations} className="flex-1">
              {t('check.viewViolations')}
            </Button>
          )}
          {onRunCheck && (
            <Button variant="outline" size="sm" onClick={onRunCheck} className="flex-1">
              {t('check.title')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default ComplianceSummaryCard
