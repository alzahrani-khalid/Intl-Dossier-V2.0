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
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  UserCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DossierTypeGuide } from './DossierTypeGuide'
import type { DossierType, DossierStatus } from '@/services/dossier-api'

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
 * Get type-specific gradient classes
 */
function getTypeGradient(type: DossierType): string {
  switch (type) {
    case 'country':
      return 'from-blue-500 to-blue-600'
    case 'organization':
      return 'from-purple-500 to-purple-600'
    case 'forum':
      return 'from-green-500 to-green-600'
    case 'engagement':
      return 'from-orange-500 to-orange-600'
    case 'topic':
      return 'from-pink-500 to-pink-600'
    case 'working_group':
      return 'from-indigo-500 to-indigo-600'
    case 'person':
      return 'from-teal-500 to-teal-600'
    default:
      return 'from-gray-500 to-gray-600'
  }
}

/**
 * Get type-specific hover gradient
 */
function getTypeHoverGradient(type: DossierType): string {
  switch (type) {
    case 'country':
      return 'hover:from-blue-600 hover:to-blue-700'
    case 'organization':
      return 'hover:from-purple-600 hover:to-purple-700'
    case 'forum':
      return 'hover:from-green-600 hover:to-green-700'
    case 'engagement':
      return 'hover:from-orange-600 hover:to-orange-700'
    case 'topic':
      return 'hover:from-pink-600 hover:to-pink-700'
    case 'working_group':
      return 'hover:from-indigo-600 hover:to-indigo-700'
    case 'person':
      return 'hover:from-teal-600 hover:to-teal-700'
    default:
      return 'hover:from-gray-600 hover:to-gray-700'
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
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="w-full aspect-square sm:aspect-auto"
    >
      <Card
        className={cn(
          'cursor-pointer h-full flex flex-col overflow-hidden',
          'transition-all duration-300',
          'hover:shadow-lg',
          isSelected && 'ring-2 ring-offset-2',
          className,
        )}
        onClick={onClick}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Gradient Header - Compact */}
        <div
          className={cn(
            'bg-gradient-to-br',
            getTypeGradient(type),
            getTypeHoverGradient(type),
            'text-white',
            'p-1.5 sm:p-3',
            'transition-all duration-300',
            'flex-shrink-0',
          )}
        >
          <div className="flex items-center justify-between mb-0.5 sm:mb-1">
            {/* Icon */}
            <div className="p-0.5 sm:p-1.5 bg-white/20 backdrop-blur-sm rounded">
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
                      'bg-white/20 hover:bg-white/30',
                      'text-white/80 hover:text-white',
                      'transition-colors duration-150',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1',
                    )}
                    aria-label={t('typeGuide.learnMore', 'Learn more about this type')}
                  >
                    <HelpCircle className="h-3 w-3" />
                  </button>
                }
              />
              {/* Count */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'inline-block px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded',
                  'bg-white/25 backdrop-blur-sm',
                  'text-[10px] sm:text-base font-bold leading-none',
                )}
              >
                {totalCount}
              </motion.div>
            </div>
          </div>

          {/* Type Title */}
          <h3 className="text-sm sm:text-base font-bold text-start leading-tight">
            {t(`type.${type}`)}
          </h3>

          {/* Trend Badge - Show below title on larger screens */}
          {trend && trendValue && (
            <Badge
              variant="secondary"
              className="hidden sm:inline-flex mt-1 bg-white/20 backdrop-blur-sm text-white border-0 text-xs"
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
        <CardContent className="p-1.5 sm:p-3 flex-1 flex flex-col justify-between bg-white">
          {/* Percentage Display */}
          <div className="mb-2 sm:mb-3 text-center">
            <div className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1">
              % of total active dossiers
            </div>
            <div className="text-sm sm:text-lg font-bold text-foreground">
              {Math.round(percentage)}%
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-2 gap-1 sm:gap-2">
            <div className="flex flex-col gap-0.5 items-center">
              <span className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight">
                {t('status.active')}
              </span>
              <span className="text-xs sm:text-base font-semibold text-green-600 dark:text-green-400 text-center">
                {activeCount}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 items-center">
              <span className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight">
                {t('status.inactive')}
              </span>
              <span className="text-xs sm:text-base font-semibold text-yellow-600 dark:text-yellow-400 text-center">
                {inactiveCount}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/**
 * Loading skeleton for DossierTypeStatsCard
 */
export function DossierTypeStatsCardSkeleton({ className }: { className?: string }) {
  return (
    <div className="w-full aspect-square sm:aspect-auto">
      <Card className={cn('h-full flex flex-col overflow-hidden', className)}>
        <div className="bg-gradient-to-br from-gray-400 to-gray-500 p-1.5 sm:p-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-0.5 sm:mb-1">
            <Skeleton className="h-4 w-4 sm:h-7 sm:w-7 rounded bg-white/20" />
            <Skeleton className="h-5 sm:h-9 w-9 sm:w-16 rounded bg-white/20" />
          </div>
          <Skeleton className="h-4 sm:h-5 w-16 sm:w-20 bg-white/20" />
          <Skeleton className="hidden sm:block h-4 w-12 rounded-full bg-white/20 mt-1" />
        </div>
        <CardContent className="p-1.5 sm:p-3 flex-1 flex flex-col justify-between bg-white">
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
