/**
 * BenchmarkPreview Component
 *
 * Shows data-driven preview using anonymized aggregate statistics
 * from similar organizations before users customize their dashboard.
 *
 * Displays message like: "Teams like yours typically track X dossiers,
 * Y relationships, and Z active briefs."
 *
 * Mobile-first, RTL-compatible design following project guidelines.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Briefcase,
  Network,
  FileText,
  Calendar,
  CheckCircle,
  FileSignature,
  X,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useBenchmarkPreview } from '@/hooks/useOrganizationBenchmarks'
import type { OrganizationBenchmark, BenchmarkCategory } from '@/types/organization-benchmark.types'

interface BenchmarkPreviewProps {
  /** Callback when user clicks to customize dashboard */
  onCustomize?: () => void
  /** Callback when user dismisses the preview */
  onDismiss?: () => void
  /** Show in compact mode (smaller cards, inline layout) */
  compact?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Map benchmark data to displayable categories
 */
function mapBenchmarkToCategories(
  benchmarks: OrganizationBenchmark,
  t: (key: string) => string,
): BenchmarkCategory[] {
  return [
    {
      id: 'dossiers',
      label: t('benchmarks.categories.dossiers'),
      value: benchmarks.avgDossiers,
      range: benchmarks.dossierRange,
      icon: 'Briefcase',
      description: t('benchmarks.descriptions.dossiers'),
    },
    {
      id: 'relationships',
      label: t('benchmarks.categories.relationships'),
      value: benchmarks.avgRelationships,
      range: benchmarks.relationshipRange,
      icon: 'Network',
      description: t('benchmarks.descriptions.relationships'),
    },
    {
      id: 'briefs',
      label: t('benchmarks.categories.briefs'),
      value: benchmarks.avgActiveBriefs,
      range: benchmarks.briefRange,
      icon: 'FileText',
      description: t('benchmarks.descriptions.briefs'),
    },
    {
      id: 'engagements',
      label: t('benchmarks.categories.engagements'),
      value: benchmarks.avgMonthlyEngagements,
      range: benchmarks.engagementRange,
      icon: 'Calendar',
      description: t('benchmarks.descriptions.engagements'),
    },
    {
      id: 'commitments',
      label: t('benchmarks.categories.commitments'),
      value: benchmarks.avgCommitments,
      range: benchmarks.commitmentRange,
      icon: 'CheckCircle',
      description: t('benchmarks.descriptions.commitments'),
    },
    {
      id: 'mous',
      label: t('benchmarks.categories.mous'),
      value: benchmarks.avgMous,
      range: benchmarks.mouRange,
      icon: 'FileSignature',
      description: t('benchmarks.descriptions.mous'),
    },
  ]
}

/**
 * Get icon component by name
 */
function getIconComponent(iconName: string) {
  const icons: Record<string, typeof Briefcase> = {
    Briefcase,
    Network,
    FileText,
    Calendar,
    CheckCircle,
    FileSignature,
  }
  return icons[iconName] || Briefcase
}

/**
 * Single benchmark stat card
 */
function BenchmarkStatCard({
  category,
  compact,
  isRTL,
}: {
  category: BenchmarkCategory
  compact?: boolean
  isRTL: boolean
}) {
  const Icon = getIconComponent(category.icon)

  return (
    <div
      className={cn(
        'flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg',
        'bg-gradient-to-br from-primary/5 to-primary/10',
        'border border-primary/10',
        'transition-all duration-200 hover:shadow-md hover:border-primary/20',
        compact ? 'p-2 sm:p-3' : 'p-3 sm:p-4',
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-lg',
          'bg-primary/10 text-primary',
          compact ? 'h-8 w-8 sm:h-10 sm:w-10' : 'h-10 w-10 sm:h-12 sm:w-12',
        )}
      >
        <Icon className={cn(compact ? 'h-4 w-4 sm:h-5 sm:w-5' : 'h-5 w-5 sm:h-6 sm:w-6')} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'font-bold tabular-nums',
            compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl lg:text-3xl',
          )}
          dir="ltr"
        >
          {category.value.toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
        </p>
        <p
          className={cn(
            'text-muted-foreground truncate',
            compact ? 'text-xs' : 'text-xs sm:text-sm',
          )}
        >
          {category.label}
        </p>
      </div>
    </div>
  )
}

/**
 * Loading skeleton for benchmark preview
 */
function BenchmarkPreviewSkeleton({ compact }: { compact?: boolean }) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className={cn(compact ? 'pb-2' : 'pb-4')}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            'grid gap-3',
            compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
          )}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-6 w-16 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * BenchmarkPreview Component
 *
 * Shows anonymized aggregate statistics before dashboard customization
 */
export function BenchmarkPreview({
  onCustomize,
  onDismiss,
  compact = false,
  className,
}: BenchmarkPreviewProps) {
  const { t, i18n } = useTranslation('dashboard-widgets')
  const isRTL = i18n.language === 'ar'

  const { data, isLoading, dismissPreview } = useBenchmarkPreview()
  const [isVisible, setIsVisible] = useState(true)

  // Listen for dismiss events
  useEffect(() => {
    const handleDismiss = () => setIsVisible(false)
    window.addEventListener('benchmark-preview-dismissed', handleDismiss)
    return () => window.removeEventListener('benchmark-preview-dismissed', handleDismiss)
  }, [])

  // Don't render if dismissed or shouldn't show
  if (!isVisible || !data.shouldShowPreview) {
    return null
  }

  // Show loading skeleton
  if (isLoading) {
    return <BenchmarkPreviewSkeleton compact={compact} />
  }

  // No benchmark data available
  if (!data.benchmarks) {
    return null
  }

  const categories = mapBenchmarkToCategories(data.benchmarks, t)

  // Handle dismiss
  const handleDismiss = () => {
    dismissPreview()
    setIsVisible(false)
    onDismiss?.()
  }

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-primary/20',
        'bg-gradient-to-br from-background via-background to-primary/5',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -end-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -start-16 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
      </div>

      <CardHeader className={cn('relative', compact ? 'pb-2 sm:pb-3' : 'pb-3 sm:pb-4')}>
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <CardTitle className={cn('text-base sm:text-lg lg:text-xl')}>
                {t('benchmarks.title')}
              </CardTitle>
              <Badge variant="secondary" className="hidden sm:inline-flex text-xs">
                <Users className="h-3 w-3 me-1" />
                {data.benchmarks.sampleSize} {t('benchmarks.organizations')}
              </Badge>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              {t('benchmarks.description', {
                dossiers: data.benchmarks.avgDossiers,
                relationships: data.benchmarks.avgRelationships,
                briefs: data.benchmarks.avgActiveBriefs,
              })}
            </CardDescription>
          </div>

          {/* Dismiss button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full shrink-0 hover:bg-destructive/10 hover:text-destructive"
            onClick={handleDismiss}
            aria-label={t('benchmarks.dismiss')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="relative">
        {/* Benchmark stats grid */}
        <div
          className={cn(
            'grid gap-2 sm:gap-3',
            compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
          )}
        >
          {categories.map((category) => (
            <BenchmarkStatCard
              key={category.id}
              category={category}
              compact={compact}
              isRTL={isRTL}
            />
          ))}
        </div>

        {/* Sample size and CTA */}
        <div
          className={cn(
            'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4',
            'mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border/50',
          )}
        >
          {/* Info text */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-primary shrink-0" />
            <span>
              {t('benchmarks.typicalRange', {
                min: data.benchmarks.dossierRange.min,
                max: data.benchmarks.dossierRange.max,
              })}
            </span>
          </div>

          {/* Customize button */}
          {onCustomize && (
            <Button
              variant="default"
              size="sm"
              className="w-full sm:w-auto min-h-11 sm:min-h-9"
              onClick={onCustomize}
            >
              {t('benchmarks.customize')}
              <ChevronRight className={cn('h-4 w-4 ms-1', isRTL && 'rotate-180')} />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default BenchmarkPreview
