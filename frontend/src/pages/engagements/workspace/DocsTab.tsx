/**
 * DocsTab -- Document management tab for the engagement workspace.
 * Lists AI briefs via useEngagementBriefs, provides Generate Briefing
 * action via useGenerateEngagementBrief mutation, and an upload placeholder.
 * Mobile-first, RTL-safe layout per L-06 in UI-SPEC.
 */

import type { ReactElement } from 'react'
import { useParams } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  FileText,
  Sparkles,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  Quote,
} from 'lucide-react'
import { useDirection } from '@/hooks/useDirection'
import {
  useEngagementBriefs,
  useGenerateEngagementBrief,
  type EngagementBrief,
} from '@/domains/engagements/hooks/useEngagementBriefs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Status-to-color mapping for brief status badges.
 */
function getStatusVariant(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-success/10 text-success border-success/20 dark:border-success/70'
    case 'generating':
      return 'bg-accent/10 text-accent border-accent/20 dark:border-accent/70'
    case 'failed':
      return 'bg-danger/10 text-danger border-danger/20 dark:border-danger/70'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

/**
 * Status icon for brief cards.
 */
function StatusIcon({ status }: { status: string }): ReactElement {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="size-3" />
    case 'generating':
      return <Loader2 className="size-3 animate-spin" />
    case 'failed':
      return <AlertCircle className="size-3" />
    default:
      return <Clock className="size-3" />
  }
}

/**
 * Format a date string for display respecting locale.
 */
function formatBriefDate(dateStr: string, isRTL: boolean): string {
  return new Date(dateStr).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function DocsTab(): ReactElement {
  const { engagementId } = useParams({
    from: '/_protected/engagements/$engagementId',
  })
  const { t } = useTranslation('workspace')
  const { isRTL } = useDirection()

  const { data: briefsData, isLoading } = useEngagementBriefs(engagementId)
  const generateBrief = useGenerateEngagementBrief()

  const briefs = briefsData?.data ?? []
  const isEmpty = !isLoading && briefs.length === 0

  const handleGenerateBriefing = (): void => {
    generateBrief.mutate({ engagementId })
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (isEmpty) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 px-4"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-1">{t('empty.docs.heading')}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
          {t('empty.docs.body')}
        </p>
        <Button
          variant="default"
          size="sm"
          className="min-h-11 gap-2"
          onClick={handleGenerateBriefing}
          disabled={generateBrief.isPending}
        >
          {generateBrief.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('actions.generateBriefing')}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {t('empty.docs.action')}
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header: title + actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">{t('tabs.docs')}</h2>

        <div className="flex items-center gap-2">
          {/* Upload placeholder — no-op until wired; disabled to avoid a false
              affordance (R15-02). */}
          <Button variant="outline" size="sm" className="min-h-11 gap-2" disabled>
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">{t('docs.upload')}</span>
          </Button>

          {/* Generate Briefing */}
          <Button
            variant="default"
            size="sm"
            className="min-h-11 gap-2"
            onClick={handleGenerateBriefing}
            disabled={generateBrief.isPending}
          >
            {generateBrief.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">{t('actions.generateBriefing')}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">{t('actions.generateBriefing')}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Brief count */}
      <p className="text-sm text-muted-foreground">{t('docs.count', { count: briefs.length })}</p>

      {/* Brief cards list */}
      <div className="space-y-3">
        {briefs.map((brief) => (
          <BriefCard key={brief.id} brief={brief} isRTL={isRTL} />
        ))}
      </div>
    </div>
  )
}

/**
 * Individual brief card -- displays title, status, type, date, and summary.
 */
function BriefCard({ brief, isRTL }: { brief: EngagementBrief; isRTL: boolean }): ReactElement {
  const { t } = useTranslation('workspace')
  return (
    <div className="rounded-lg border bg-card p-4 hover:border-accent transition-colors">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {/* Brief info */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title + badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <FileText className="size-4 text-muted-foreground flex-shrink-0" />
            <h4 className="text-sm font-medium truncate">
              {brief.title !== '' ? brief.title : t('docs.untitled')}
            </h4>
          </div>

          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status badge */}
            <Badge variant="outline" className={`text-xs gap-1 ${getStatusVariant(brief.status)}`}>
              <StatusIcon status={brief.status} />
              {t(`engagement-briefs:statuses.${brief.status}`, { defaultValue: brief.status })}
            </Badge>

            {/* Type badge */}
            {brief.brief_type === 'ai' ? (
              <Badge variant="secondary" className="text-xs gap-1">
                <Sparkles className="size-3" />
                {t('engagement-briefs:briefTypes.ai')}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                {t('engagement-briefs:briefTypes.legacy')}
              </Badge>
            )}

            {/* Citations indicator */}
            {brief.has_citations && (
              <Badge variant="outline" className="text-xs gap-1">
                <Quote className="size-3" />
                {t('engagement-briefs:labels.hasCitations')}
              </Badge>
            )}
          </div>

          {/* Summary */}
          {brief.summary !== '' && (
            <p className="text-sm text-muted-foreground line-clamp-2">{brief.summary}</p>
          )}

          {/* Date */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            <span>{formatBriefDate(brief.created_at, isRTL)}</span>
          </div>
        </div>

        {/* No view action: there is no brief detail route to navigate to yet */}
      </div>
    </div>
  )
}
