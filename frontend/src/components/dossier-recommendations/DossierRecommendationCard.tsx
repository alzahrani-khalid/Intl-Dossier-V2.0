/**
 * DossierRecommendationCard Component
 * Feature: ai-dossier-recommendations
 *
 * Displays a single dossier recommendation with "Why recommended" explainability.
 * Mobile-first, RTL-compatible design.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { m } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import {
  FileText,
  Network,
  Tags,
  Activity,
  Users,
  MapPin,
  Target,
  ChevronDown,
  X,
  Sparkles,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Building2,
  Globe,
  MessageSquare,
  Lightbulb,
  Layers,
  User,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type {
  DossierRecommendationListItem,
  DossierRecommendation,
  DossierRecommendationReason,
  ReasonBreakdown,
} from '@/types/dossier-recommendation.types'
import {
  getReasonColor,
  getReasonBgColor,
  getSimilarityColor,
  formatSimilarity,
  REASON_LABELS,
  PRIORITY_LABELS,
} from '@/types/dossier-recommendation.types'
import type { DossierType } from '@/types/dossier'
import { getDossierRouteSegment } from '@/lib/dossier-routes'
import { cn } from '@/lib/utils'
import { useDirection } from '@/hooks/useDirection'

// ============================================================================
// Types
// ============================================================================

interface DossierRecommendationCardProps {
  recommendation: DossierRecommendationListItem | DossierRecommendation
  onAccept?: (id: string) => void
  onDismiss?: (id: string) => void
  onFeedback?: (id: string, isPositive: boolean) => void
  onWhyExpand?: (id: string) => void
  isLoading?: boolean
  variant?: 'default' | 'compact'
  className?: string
}

// ============================================================================
// Icon Mapping
// ============================================================================

const reasonIcons: Record<
  DossierRecommendationReason,
  React.ComponentType<{ className?: string }>
> = {
  similar_content: FileText,
  shared_relationships: Network,
  topic_overlap: Tags,
  recent_activity: Activity,
  collaboration_history: Users,
  geographic_proximity: MapPin,
  strategic_alignment: Target,
}

const dossierTypeIcons: Record<DossierType, React.ComponentType<{ className?: string }>> = {
  country: Globe,
  organization: Building2,
  forum: MessageSquare,
  engagement: Users,
  topic: Lightbulb,
  working_group: Layers,
  person: User,
}

// ============================================================================
// Sub-Components
// ============================================================================

function SimilarityBadge({ score }: { score: number }) {
  const { t } = useTranslation('dossier-recommendations')

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'text-xs font-medium gap-1',
              // D-58-04-03: AI-similarity badge — blue+purple gradient collapses to
              // single accent-soft tint per D-07 collision rule; border uses primary/30.
              'bg-secondary',
              'border-primary/30',
            )}
          >
            <Sparkles className="h-3 w-3 text-warning" />
            <span className={getSimilarityColor(score)}>{formatSimilarity(score)}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('similarityTooltip')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function PriorityIndicator({ priority }: { priority: number }) {
  const { isRTL } = useDirection()
  const label = PRIORITY_LABELS[priority]

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs',
        // D-58-04-04: 4-tier priority palette mapped onto status tokens with
        // opacity-step siblings (Wave-3 D-58-03-10 precedent).
        //   priority>=4 (high)   → warning/80 (orange-family → warning sibling)
        //   priority===3 (med)   → warning
        //   priority<=2 (low)    → muted
        priority >= 4 && 'bg-warning/10 text-warning border-warning/30',
        priority === 3 && 'bg-warning/20 text-warning border-warning/30',
        priority <= 2 && 'bg-muted text-muted-foreground border-muted',
      )}
    >
      {isRTL ? label?.ar : label?.en}
    </Badge>
  )
}

function DossierTypeBadge({ type }: { type: DossierType }) {
  const { t } = useTranslation('dossier')
  const Icon = dossierTypeIcons[type] || FileText

  return (
    <Badge variant="secondary" className="text-xs gap-1">
      <Icon className="h-3 w-3" />
      <span>{t(`types.${type}`)}</span>
    </Badge>
  )
}

function ReasonBreakdownItem({ reason }: { reason: ReasonBreakdown }) {
  const { isRTL } = useDirection()
  const Icon = reasonIcons[reason.reason] || FileText
  const label = REASON_LABELS[reason.reason]
  const percentage = Math.round(reason.weight * 100)

  return (
    <div className="flex items-center gap-3 py-2">
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          getReasonBgColor(reason.reason),
        )}
      >
        <Icon className={cn('h-4 w-4', getReasonColor(reason.reason))} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">{isRTL ? label.ar : label.en}</span>
          <span className={cn('text-xs font-medium', getReasonColor(reason.reason))}>
            {percentage}%
          </span>
        </div>
        <Progress value={percentage} className="h-1.5" />
        {reason.details && (
          <p className="mt-1 text-xs text-muted-foreground truncate">{reason.details}</p>
        )}
      </div>
    </div>
  )
}

function WhyRecommendedSection({
  reasonBreakdown,
  explanationEn,
  explanationAr,
  onExpand,
}: {
  reasonBreakdown: ReasonBreakdown[]
  explanationEn: string
  explanationAr: string
  onExpand?: () => void
}) {
  const { t } = useTranslation('dossier-recommendations')
  const { isRTL } = useDirection()
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = () => {
    if (!isOpen && onExpand) {
      onExpand()
    }
    setIsOpen(!isOpen)
  }

  return (
    <Collapsible open={isOpen} onOpenChange={handleToggle}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between text-muted-foreground hover:text-foreground min-h-11"
        >
          <span className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            {t('whyRecommended')}
          </span>
          <ChevronDown
            className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pb-4 pt-2">
          {/* Explanation text */}
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            {isRTL ? explanationAr : explanationEn}
          </p>

          {/* Reason breakdown */}
          <div className="space-y-1 border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {t('contributingFactors')}
            </p>
            {reasonBreakdown.map((reason) => (
              <ReasonBreakdownItem key={reason.reason} reason={reason} />
            ))}
          </div>
        </m.div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function DossierRecommendationCard({
  recommendation,
  onAccept,
  onDismiss,
  onFeedback,
  onWhyExpand,
  isLoading = false,
  variant = 'default',
  className,
}: DossierRecommendationCardProps) {
  const { t } = useTranslation('dossier-recommendations')
  const { isRTL } = useDirection()
  const navigate = useNavigate()

  const dossier = recommendation.recommended_dossier
  const name = dossier ? (isRTL ? dossier.name_ar : dossier.name_en) : 'Unknown Dossier'
  const description = dossier ? (isRTL ? dossier.description_ar : dossier.description_en) : null
  const dossierType = dossier?.dossier_type as DossierType | undefined

  const isActionable = recommendation.status === 'pending' || recommendation.status === 'viewed'

  const handleNavigate = () => {
    if (onAccept) {
      onAccept(recommendation.id)
    }
    if (dossier && dossierType) {
      const routeSegment = getDossierRouteSegment(dossierType)
      navigate({ to: `/dossiers/${routeSegment}/${dossier.id}` })
    }
  }

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss(recommendation.id)
    }
  }

  const handleFeedback = (isPositive: boolean) => {
    if (onFeedback) {
      onFeedback(recommendation.id, isPositive)
    }
  }

  const handleWhyExpand = () => {
    if (onWhyExpand) {
      onWhyExpand(recommendation.id)
    }
  }

  const Icon = dossierType ? dossierTypeIcons[dossierType] : FileText

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-200',
          'hover:shadow-md',
          recommendation.priority >= 4 && 'border-warning/30',
          !isActionable && 'opacity-60',
          className,
        )}
      >
        {/* Priority Indicator Strip */}
        <div
          className={cn(
            'absolute top-0 start-0 h-full w-1',
            // D-58-04-05: priority strip — danger (5) / warning (4) / warning/80 (3) / muted (≤2).
            recommendation.priority >= 5 && 'bg-destructive',
            recommendation.priority === 4 && 'bg-warning',
            recommendation.priority === 3 && 'bg-warning/80',
            recommendation.priority <= 2 && 'bg-muted-foreground',
          )}
        />

        <CardHeader className="pb-2 ps-5 sm:ps-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            {/* Left: Icon and Name */}
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                  // D-58-04-06: AI recommendation glyph — blue+purple gradient collapses
                  // to bg-secondary (accent-soft) per D-07 collision rule.
                  'bg-secondary',
                )}
              >
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold leading-tight line-clamp-2 sm:text-base">
                  {name}
                </h3>
                {variant !== 'compact' && description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{description}</p>
                )}
              </div>
            </div>

            {/* Right: Badges */}
            <div className="flex flex-wrap items-center gap-1.5 sm:flex-nowrap">
              {dossierType && <DossierTypeBadge type={dossierType} />}
              <SimilarityBadge score={recommendation.similarity_score} />
              {variant !== 'compact' && <PriorityIndicator priority={recommendation.priority} />}
            </div>
          </div>
        </CardHeader>

        <CardContent className="ps-5 sm:ps-6 pt-0">
          {/* Why Recommended Section */}
          {variant !== 'compact' && (
            <WhyRecommendedSection
              reasonBreakdown={recommendation.reason_breakdown}
              explanationEn={recommendation.explanation_en}
              explanationAr={recommendation.explanation_ar}
              onExpand={handleWhyExpand}
            />
          )}

          {/* Actions */}
          {isActionable && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleNavigate}
                  disabled={isLoading}
                  className="min-h-11 min-w-11 flex-1 sm:flex-none gap-1.5"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>{t('viewDossier')}</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDismiss}
                  disabled={isLoading}
                  className="min-h-11 min-w-11 gap-1.5"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only">{t('dismiss')}</span>
                </Button>
              </div>

              {/* Feedback buttons */}
              {onFeedback && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground me-1">{t('wasThisHelpful')}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleFeedback(true)}
                    className="h-8 w-8"
                    aria-label={t('common:common.actions.thumbsUp', { defaultValue: 'Helpful' })}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleFeedback(false)}
                    className="h-8 w-8"
                    aria-label={t('common:common.actions.thumbsDown', {
                      defaultValue: 'Not helpful',
                    })}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Non-actionable status */}
          {!isActionable && (
            <div className="mt-3">
              <Badge variant="secondary" className="text-xs">
                {t(`status.${recommendation.status}`)}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </m.div>
  )
}
