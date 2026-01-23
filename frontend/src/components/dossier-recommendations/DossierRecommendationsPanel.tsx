/**
 * DossierRecommendationsPanel Component
 * Feature: ai-dossier-recommendations
 *
 * Panel for displaying proactive dossier recommendations with similarity search.
 * Shows recommendations for a specific dossier with "Why recommended" explainability.
 * Mobile-first, RTL-compatible design.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  RefreshCw,
  ChevronRight,
  Filter,
  X,
  Loader2,
  Lightbulb,
  Network,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  useDossierRecommendations,
  useGenerateDossierRecommendations,
  useAcceptDossierRecommendation,
  useDismissDossierRecommendation,
  useSubmitRecommendationFeedback,
  useTrackWhyRecommendedExpand,
} from '@/hooks/useDossierRecommendations'
import { DossierRecommendationCard } from './DossierRecommendationCard'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface DossierRecommendationsPanelProps {
  dossierId: string
  className?: string
  variant?: 'sidebar' | 'inline' | 'compact'
  maxRecommendations?: number
  showRefresh?: boolean
  collapsible?: boolean
  defaultExpanded?: boolean
}

// ============================================================================
// Sub-Components
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function EmptyState({ onRefresh }: { onRefresh?: () => void }) {
  const { t } = useTranslation('dossier-recommendations')

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
        <Network className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium">{t('noRecommendations')}</h3>
      <p className="mt-1 text-xs text-muted-foreground max-w-[200px]">
        {t('noRecommendationsDescription')}
      </p>
      {onRefresh && (
        <Button variant="outline" size="sm" onClick={onRefresh} className="mt-4 gap-1.5">
          <RefreshCw className="h-4 w-4" />
          {t('generateRecommendations')}
        </Button>
      )}
    </div>
  )
}

function RecommendationsHeader({
  count,
  isLoading,
  isGenerating,
  onRefresh,
  showRefresh,
}: {
  count: number
  isLoading: boolean
  isGenerating: boolean
  onRefresh: () => void
  showRefresh: boolean
}) {
  const { t, i18n } = useTranslation('dossier-recommendations')
  const isRTL = i18n.language === 'ar'

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40">
          <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{t('title')}</h3>
          {!isLoading && count > 0 && (
            <p className="text-xs text-muted-foreground">{t('foundCount', { count })}</p>
          )}
        </div>
      </div>
      {showRefresh && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                disabled={isGenerating}
                className="h-8 w-8"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className={cn('h-4 w-4', isRTL && 'scale-x-[-1]')} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('refreshTooltip')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function DossierRecommendationsPanel({
  dossierId,
  className,
  variant = 'sidebar',
  maxRecommendations = 5,
  showRefresh = true,
  collapsible = false,
  defaultExpanded = true,
}: DossierRecommendationsPanelProps) {
  const { t, i18n } = useTranslation('dossier-recommendations')
  const isRTL = i18n.language === 'ar'
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Queries and mutations
  const {
    data: recommendationsData,
    isLoading,
    error,
    refetch,
  } = useDossierRecommendations(dossierId, {
    limit: maxRecommendations,
    status: ['pending', 'viewed'],
  })

  const generateMutation = useGenerateDossierRecommendations()
  const acceptMutation = useAcceptDossierRecommendation()
  const dismissMutation = useDismissDossierRecommendation()
  const feedbackMutation = useSubmitRecommendationFeedback()
  const trackExpandMutation = useTrackWhyRecommendedExpand()

  const recommendations = recommendationsData?.data || []
  const hasRecommendations = recommendations.length > 0

  const handleRefresh = async () => {
    await generateMutation.mutateAsync({
      source_dossier_id: dossierId,
      max_recommendations: maxRecommendations,
    })
    refetch()
  }

  const handleAccept = (recommendationId: string) => {
    acceptMutation.mutate(recommendationId)
  }

  const handleDismiss = (recommendationId: string) => {
    dismissMutation.mutate(recommendationId)
  }

  const handleFeedback = (recommendationId: string, isPositive: boolean) => {
    feedbackMutation.mutate(recommendationId, isPositive)
  }

  const handleWhyExpand = (recommendationId: string) => {
    trackExpandMutation.mutate(recommendationId)
  }

  const content = (
    <>
      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="py-4 text-center text-sm text-red-500">{t('errorLoading')}</div>
      ) : !hasRecommendations ? (
        <EmptyState onRefresh={handleRefresh} />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {recommendations.map((rec) => (
              <DossierRecommendationCard
                key={rec.id}
                recommendation={rec}
                onAccept={handleAccept}
                onDismiss={handleDismiss}
                onFeedback={handleFeedback}
                onWhyExpand={handleWhyExpand}
                isLoading={acceptMutation.isPending || dismissMutation.isPending}
                variant={variant === 'compact' ? 'compact' : 'default'}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* View all link */}
      {hasRecommendations && recommendations.length >= maxRecommendations && (
        <div className="mt-4 pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-muted-foreground hover:text-foreground"
          >
            <span>{t('viewAllRecommendations')}</span>
            <ChevronRight className={cn('h-4 w-4', isRTL && 'rotate-180')} />
          </Button>
        </div>
      )}
    </>
  )

  // Sidebar variant with card wrapper
  if (variant === 'sidebar') {
    if (collapsible) {
      return (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className={className}>
          <Card dir={isRTL ? 'rtl' : 'ltr'}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3 px-4">
                <div className="flex items-center justify-between">
                  <RecommendationsHeader
                    count={recommendations.length}
                    isLoading={isLoading}
                    isGenerating={generateMutation.isPending}
                    onRefresh={handleRefresh}
                    showRefresh={false}
                  />
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 text-muted-foreground transition-transform duration-200',
                      isExpanded && 'rotate-90',
                      isRTL && !isExpanded && 'rotate-180',
                      isRTL && isExpanded && '-rotate-90',
                    )}
                  />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 px-4 pb-4">{content}</CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )
    }

    return (
      <Card className={className} dir={isRTL ? 'rtl' : 'ltr'}>
        <CardHeader className="py-3 px-4">
          <RecommendationsHeader
            count={recommendations.length}
            isLoading={isLoading}
            isGenerating={generateMutation.isPending}
            onRefresh={handleRefresh}
            showRefresh={showRefresh}
          />
        </CardHeader>
        <CardContent className="pt-0 px-4 pb-4">{content}</CardContent>
      </Card>
    )
  }

  // Inline variant without card wrapper
  if (variant === 'inline') {
    return (
      <div className={className} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="mb-4">
          <RecommendationsHeader
            count={recommendations.length}
            isLoading={isLoading}
            isGenerating={generateMutation.isPending}
            onRefresh={handleRefresh}
            showRefresh={showRefresh}
          />
        </div>
        {content}
      </div>
    )
  }

  // Compact variant - minimal design
  return (
    <div className={cn('space-y-2', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {isLoading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs text-muted-foreground">{t('loading')}</span>
        </div>
      ) : hasRecommendations ? (
        <>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium">{t('relatedDossiers')}</span>
            <Badge variant="secondary" className="text-xs">
              {recommendations.length}
            </Badge>
          </div>
          <AnimatePresence mode="popLayout">
            {recommendations.slice(0, 3).map((rec) => (
              <DossierRecommendationCard
                key={rec.id}
                recommendation={rec}
                onAccept={handleAccept}
                onDismiss={handleDismiss}
                variant="compact"
              />
            ))}
          </AnimatePresence>
        </>
      ) : null}
    </div>
  )
}

export default DossierRecommendationsPanel
