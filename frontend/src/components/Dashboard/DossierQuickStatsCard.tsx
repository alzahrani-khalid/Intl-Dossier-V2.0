/**
 * DossierQuickStatsCard Component
 * Feature: Dossier-Centric Dashboard Redesign
 *
 * Displays a dossier card with quick stats showing:
 * - New items count
 * - Pending tasks
 * - Active commitments
 * - Overdue warning badge
 *
 * Mobile-first design with RTL support.
 */

import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import {
  Globe2,
  Building2,
  Users,
  Calendar,
  Folder,
  UserCircle,
  AlertTriangle,
  CheckSquare,
  FileCheck,
  ClipboardList,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { MyDossier } from '@/types/dossier-dashboard.types'
import type { DossierType } from '@/types/dossier-context.types'
import { getDossierDetailPath } from '@/lib/dossier-routes'

// =============================================================================
// Type Icons
// =============================================================================

const typeIcons: Record<DossierType, typeof Globe2> = {
  country: Globe2,
  organization: Building2,
  forum: Calendar,
  theme: Folder,
  working_group: Users,
  person: UserCircle,
  engagement: Calendar,
  topic: Folder,
}

// =============================================================================
// Type Colors
// =============================================================================

const typeColors: Record<DossierType, string> = {
  country: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30',
  organization: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30',
  forum: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30',
  theme: 'text-teal-500 bg-teal-50 dark:bg-teal-950/30',
  working_group: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30',
  person: 'text-pink-500 bg-pink-50 dark:bg-pink-950/30',
  engagement: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30',
  topic: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
}

// =============================================================================
// Props
// =============================================================================

export interface DossierQuickStatsCardProps {
  /** The dossier to display */
  dossier: MyDossier
  /** Whether to show the full card or compact version */
  variant?: 'full' | 'compact'
  /** Callback when card is clicked */
  onClick?: () => void
  /** Additional CSS classes */
  className?: string
}

// =============================================================================
// Component
// =============================================================================

export function DossierQuickStatsCard({
  dossier,
  variant = 'full',
  onClick,
  className,
}: DossierQuickStatsCardProps) {
  const { t, i18n } = useTranslation('dossier-dashboard')
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'

  // Get icon for type
  const TypeIcon = typeIcons[dossier.type] || Folder

  // Handle click - navigate to dossier detail
  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      const path = getDossierDetailPath(dossier.id, dossier.type)
      navigate({ to: path })
    }
  }

  // Get display name based on language
  const displayName = isRTL ? dossier.name_ar || dossier.name_en : dossier.name_en

  if (variant === 'compact') {
    return (
      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-md hover:border-primary/50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        onClick={handleClick}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
        role="button"
        aria-label={`${t(`dossierType.${dossier.type}`, dossier.type)}: ${displayName}`}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            {/* Type Icon */}
            <div
              className={cn(
                'flex items-center justify-center size-8 rounded-lg shrink-0',
                typeColors[dossier.type],
              )}
            >
              <TypeIcon className="size-4" />
            </div>

            {/* Name and Stats */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{displayName}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {dossier.stats.pending_tasks_count > 0 && (
                  <span className="flex items-center gap-0.5">
                    <CheckSquare className="size-3" />
                    {dossier.stats.pending_tasks_count}
                  </span>
                )}
                {dossier.stats.has_overdue && (
                  <span className="flex items-center gap-0.5 text-red-500">
                    <AlertTriangle className="size-3" />
                    {dossier.stats.overdue_count}
                  </span>
                )}
              </div>
            </div>

            {/* Arrow */}
            <ChevronRight
              className={cn('size-4 text-muted-foreground shrink-0', isRTL && 'rotate-180')}
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Full variant
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md hover:border-primary/50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        dossier.stats.has_overdue && 'border-red-200 dark:border-red-900/50',
        className,
      )}
      onClick={handleClick}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      role="button"
      aria-label={`${t(`dossierType.${dossier.type}`, dossier.type)}: ${displayName}`}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Type Icon */}
            <div
              className={cn(
                'flex items-center justify-center size-10 rounded-lg shrink-0',
                typeColors[dossier.type],
              )}
            >
              <TypeIcon className="size-5" />
            </div>

            {/* Name and Type */}
            <div className="min-w-0">
              <h3 className="font-semibold text-sm leading-tight truncate">{displayName}</h3>
              <p className="text-xs text-muted-foreground">
                {t(`dossierType.${dossier.type}`, dossier.type)}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-col gap-1 shrink-0">
            {dossier.stats.new_items_count > 0 && (
              <Badge variant="default" className="text-xs flex items-center gap-1">
                <Sparkles className="size-3" />
                {dossier.stats.new_items_count} {t('stats.new', 'new')}
              </Badge>
            )}
            {dossier.stats.has_overdue && (
              <Badge variant="destructive" className="text-xs flex items-center gap-1">
                <AlertTriangle className="size-3" />
                {dossier.stats.overdue_count} {t('stats.overdue', 'overdue')}
              </Badge>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Tasks */}
          <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
            <CheckSquare className="size-4 text-blue-500 mb-1" />
            <span className="text-lg font-bold">{dossier.stats.pending_tasks_count}</span>
            <span className="text-xs text-muted-foreground">{t('stats.tasks', 'Tasks')}</span>
          </div>

          {/* Commitments */}
          <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
            <FileCheck className="size-4 text-purple-500 mb-1" />
            <span className="text-lg font-bold">{dossier.stats.active_commitments_count}</span>
            <span className="text-xs text-muted-foreground">
              {t('stats.commitments', 'Commits')}
            </span>
          </div>

          {/* Intakes */}
          <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
            <ClipboardList className="size-4 text-green-500 mb-1" />
            <span className="text-lg font-bold">{dossier.stats.open_intakes_count}</span>
            <span className="text-xs text-muted-foreground">{t('stats.intakes', 'Intakes')}</span>
          </div>
        </div>

        {/* Last Activity */}
        {dossier.stats.last_activity_at && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {t('stats.lastActivity', 'Last activity')}:{' '}
              <span className="font-medium">
                {formatRelativeTime(dossier.stats.last_activity_at, i18n.language, t)}
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Helper: Format Relative Time
// =============================================================================

function formatRelativeTime(
  dateStr: string,
  locale: string,
  t: (key: string, fallback: string, options?: Record<string, unknown>) => string,
): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes < 60) {
    return t('time.minutesAgo', '{{count}} min ago', { count: diffMinutes })
  }
  if (diffHours < 24) {
    return t('time.hoursAgo', '{{count}}h ago', { count: diffHours })
  }
  if (diffDays < 7) {
    return t('time.daysAgo', '{{count}}d ago', { count: diffDays })
  }
  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  })
}

export default DossierQuickStatsCard
