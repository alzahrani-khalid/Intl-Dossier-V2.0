/**
 * DossierTypeStatsCard Component
 * Header info card showing statistics for a specific dossier type
 * with counts, percentages, and click-to-filter functionality
 *
 * Features:
 * - Mobile-first responsive design
 * - RTL support with logical properties
 * - Click to filter dossiers by type
 * - Loading and error states
 * - Animated statistics
 * - Contextual entity type guidance on hover
 */

import { useTranslation } from 'react-i18next'
import { m } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Globe,
  Building2,
  Users,
  Calendar,
  Target,
  Briefcase,
  User,
  TrendingUp,
  TrendingDown,
  Minus,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DossierTypeGuide } from './DossierTypeGuide'
import type { DossierType } from '@/services/dossier-api'
import { useDirection } from '@/hooks/useDirection'

interface DossierTypeStatsCardProps {
  type: DossierType
  totalCount: number
  activeCount: number
  inactiveCount: number
  percentage: number
  trend?: 'up' | 'down' | 'stable'
  trendValue?: number
  isSelected?: boolean
  onClick?: () => void
  className?: string
}

/**
 * Get type-specific icon component
 */
function getTypeIcon(type: DossierType, className?: string) {
  const iconProps = { className: className || 'h-5 w-5' }

  switch (type) {
    case 'country':
      return <Globe {...iconProps} />
    case 'organization':
      return <Building2 {...iconProps} />
    case 'forum':
      return <Users {...iconProps} />
    case 'engagement':
      return <Calendar {...iconProps} />
    case 'topic':
      return <Target {...iconProps} />
    case 'working_group':
      return <Briefcase {...iconProps} />
    case 'person':
      return <User {...iconProps} />
    default:
      return <Globe {...iconProps} />
  }
}

/**
 * Get trend icon
 */
function getTrendIcon(trend?: 'up' | 'down' | 'stable') {
  const iconProps = { className: 'h-4 w-4' }

  switch (trend) {
    case 'up':
      return <TrendingUp {...iconProps} />
    case 'down':
      return <TrendingDown {...iconProps} />
    case 'stable':
      return <Minus {...iconProps} />
    default:
      return null
  }
}

export function DossierTypeStatsCard({
  type,
  totalCount,
  activeCount,
  inactiveCount,
  percentage,
  trend,
  trendValue,
  isSelected = false,
  onClick,
  className,
}: DossierTypeStatsCardProps) {
  const { t } = useTranslation('dossier')
  const { isRTL } = useDirection()
  return (
    <m.div
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.12 }}
      className="w-full aspect-square sm:aspect-auto"
    >
      <Card
        className={cn(
          'dossier-type-stat-card cursor-pointer h-full flex flex-col overflow-hidden p-0',
          'transition-colors duration-150 hover:border-[var(--ink-faint)]',
          isSelected && 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg)]',
          className,
        )}
        onClick={onClick}
      >
        {/* Header - Compact */}
        <div className="flex-shrink-0 border-b border-[var(--line)] bg-[var(--line-soft)] p-2 text-[var(--ink)] sm:p-3">
          <div className="flex items-center justify-between mb-0.5 sm:mb-1">
            {/* Icon */}
            <div className="rounded-[var(--radius-sm)] bg-[var(--surface)] p-1 text-[var(--accent)] sm:p-1.5">
              {getTypeIcon(type, 'h-2.5 w-2.5 sm:h-4 sm:w-4')}
            </div>

            {/* Count and Help Icon */}
            <div className="flex items-center gap-1">
              {/* Help Icon with DossierTypeGuide */}
              <DossierTypeGuide
                type={type}
                variant="popover"
                trigger={
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      'hidden sm:inline-flex items-center justify-center',
                      'min-h-5 min-w-5 p-0.5',
                      'rounded-full',
                      'bg-[var(--surface)] hover:bg-[var(--accent-soft)]',
                      'text-[var(--ink-mute)] hover:text-[var(--accent-ink)]',
                      'transition-colors duration-150',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1',
                    )}
                    aria-label={t('typeGuide.learnMore', 'Learn more about this type')}
                  >
                    <HelpCircle className="h-3 w-3" />
                  </button>
                }
              />
              {/* Count */}
              <m.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'chip chip-accent px-1.5 py-0.5 text-[10px] font-bold leading-none sm:px-2 sm:py-0.5 sm:text-base',
                )}
              >
                {totalCount}
              </m.div>
            </div>
          </div>

          {/* Type Title */}
          <h3 className="card-title text-start leading-tight">{t(`type.${type}`)}</h3>

          {/* Trend Badge - Show below title on larger screens */}
          {trend && trendValue && (
            <Badge
              variant={trend === 'up' ? 'success' : trend === 'down' ? 'warning' : 'secondary'}
              className="mt-1 hidden border-0 text-xs sm:inline-flex"
            >
              {getTrendIcon(trend)}
              <span className={cn(isRTL ? 'me-1' : 'ms-1')}>
                {trendValue > 0 ? '+' : ''}
                {trendValue}%
              </span>
            </Badge>
          )}
        </div>

        {/* Stats Content */}
        <CardContent className="flex flex-1 flex-col justify-between bg-[var(--surface)]">
          {/* Percentage Display */}
          <div className="mb-2 sm:mb-3 text-center">
            <div className="mb-1 text-[10px] font-medium text-[var(--ink-mute)] sm:text-xs">
              % of total active dossiers
            </div>
            <div className="text-sm font-bold text-[var(--ink)] sm:text-lg">
              {Math.round(percentage)}%
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-2 gap-1 sm:gap-2">
            <div className="flex flex-col gap-0.5 items-center">
              <span className="text-center text-[10px] leading-tight text-[var(--ink-mute)] sm:text-xs">
                {t('status.active')}
              </span>
              <span className="text-center text-xs font-semibold text-[var(--ok)] sm:text-base">
                {activeCount}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 items-center">
              <span className="text-center text-[10px] leading-tight text-[var(--ink-mute)] sm:text-xs">
                {t('status.inactive')}
              </span>
              <span className="text-center text-xs font-semibold text-[var(--warn)] sm:text-base">
                {inactiveCount}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </m.div>
  )
}

/**
 * Loading skeleton for DossierTypeStatsCard
 */
export function DossierTypeStatsCardSkeleton({ className }: { className?: string }) {
  return (
    <div className="w-full aspect-square sm:aspect-auto">
      <Card
        className={cn('dossier-type-stat-card h-full flex flex-col overflow-hidden p-0', className)}
      >
        <div className="flex-shrink-0 border-b border-[var(--line)] bg-[var(--line-soft)] p-1.5 sm:p-3">
          <div className="flex items-center justify-between mb-0.5 sm:mb-1">
            <Skeleton className="h-4 w-4 rounded-[var(--radius-sm)] sm:h-7 sm:w-7" />
            <Skeleton className="h-5 w-9 rounded-[var(--radius-sm)] sm:h-9 sm:w-16" />
          </div>
          <Skeleton className="h-4 w-16 sm:h-5 sm:w-20" />
          <Skeleton className="mt-1 hidden h-4 w-12 rounded-full sm:block" />
        </div>
        <CardContent className="flex flex-1 flex-col justify-between bg-[var(--surface)]">
          <div className="mb-2 sm:mb-3 text-center">
            <Skeleton className="h-3 sm:h-4 w-24 sm:w-32 mx-auto mb-1" />
            <Skeleton className="h-4 sm:h-5 w-12 sm:w-16 mx-auto" />
          </div>
          <div className="grid grid-cols-2 gap-1 sm:gap-2">
            <div className="flex flex-col gap-0.5 items-center">
              <Skeleton className="h-2.5 sm:h-3 w-8" />
              <Skeleton className="h-3 sm:h-4 w-4" />
            </div>
            <div className="flex flex-col gap-0.5 items-center">
              <Skeleton className="h-2.5 sm:h-3 w-8" />
              <Skeleton className="h-3 sm:h-4 w-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
