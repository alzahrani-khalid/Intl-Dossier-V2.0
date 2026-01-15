/**
 * Entity Preview Card Component
 * Feature: rich-entity-autocomplete
 *
 * Displays rich entity preview for disambiguation in autocomplete.
 * Shows key details, status, and recent activity.
 * Mobile-first design with RTL support.
 * Supports custom layout configurations via layoutConfig prop.
 */

import { forwardRef, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import {
  Building2,
  Globe,
  Users,
  FileText,
  Briefcase,
  Handshake,
  Target,
  MessageSquare,
  Clock,
  Activity,
  Calendar,
  CheckCircle2,
  Circle,
  AlertCircle,
  Archive,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { EntityWithPreview } from './useEntityPreviewSearch'
import type { PreviewLayoutConfig } from '@/types/preview-layout.types'

// Entity type - matching the backend types
type EntityType =
  | 'dossier'
  | 'position'
  | 'mou'
  | 'engagement'
  | 'assignment'
  | 'commitment'
  | 'intelligence_signal'
  | 'organization'
  | 'country'
  | 'forum'
  | 'working_group'
  | 'topic'

// =============================================================================
// TYPES
// =============================================================================

export interface EntityPreviewCardProps {
  entity: EntityWithPreview
  isSelected?: boolean
  isHighlighted?: boolean
  showRecentActivity?: boolean
  showKeyDetails?: boolean
  compact?: boolean
  onClick?: () => void
  className?: string
  /** Custom layout configuration from admin settings */
  layoutConfig?: PreviewLayoutConfig | null
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ENTITY_TYPE_ICONS: Record<EntityType, React.ComponentType<{ className?: string }>> = {
  dossier: FileText,
  organization: Building2,
  country: Globe,
  forum: Users,
  engagement: Calendar,
  position: Briefcase,
  mou: Handshake,
  commitment: Target,
  assignment: Briefcase,
  intelligence_signal: Activity,
  working_group: Users,
  topic: MessageSquare,
}

const STATUS_CONFIG: Record<
  EntityWithPreview['status'],
  { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }
> = {
  active: {
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  inactive: {
    icon: Circle,
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
  archived: {
    icon: Archive,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  draft: {
    icon: AlertCircle,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getEntityTypeLabel(type: EntityType, isRTL: boolean): string {
  const labels: Record<EntityType, { en: string; ar: string }> = {
    dossier: { en: 'Dossier', ar: 'ملف' },
    organization: { en: 'Organization', ar: 'منظمة' },
    country: { en: 'Country', ar: 'دولة' },
    forum: { en: 'Forum', ar: 'منتدى' },
    engagement: { en: 'Engagement', ar: 'مشاركة' },
    position: { en: 'Position', ar: 'منصب' },
    mou: { en: 'MOU', ar: 'مذكرة تفاهم' },
    commitment: { en: 'Commitment', ar: 'التزام' },
    assignment: { en: 'Assignment', ar: 'مهمة' },
    intelligence_signal: { en: 'Signal', ar: 'إشارة' },
    working_group: { en: 'Working Group', ar: 'مجموعة عمل' },
    topic: { en: 'Topic', ar: 'موضوع' },
  }
  return labels[type]?.[isRTL ? 'ar' : 'en'] || type
}

function getStatusLabel(status: EntityWithPreview['status'], isRTL: boolean): string {
  const labels: Record<EntityWithPreview['status'], { en: string; ar: string }> = {
    active: { en: 'Active', ar: 'نشط' },
    inactive: { en: 'Inactive', ar: 'غير نشط' },
    archived: { en: 'Archived', ar: 'مؤرشف' },
    draft: { en: 'Draft', ar: 'مسودة' },
  }
  return labels[status]?.[isRTL ? 'ar' : 'en'] || status
}

function getRelativeTime(dateStr: string, isRTL: boolean): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return isRTL ? 'اليوم' : 'Today'
  } else if (diffDays === 1) {
    return isRTL ? 'أمس' : 'Yesterday'
  } else if (diffDays < 7) {
    return isRTL ? `منذ ${diffDays} أيام` : `${diffDays} days ago`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return isRTL ? `منذ ${weeks} أسابيع` : `${weeks}w ago`
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return isRTL ? `منذ ${months} أشهر` : `${months}mo ago`
  } else {
    const years = Math.floor(diffDays / 365)
    return isRTL ? `منذ ${years} سنوات` : `${years}y ago`
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

// =============================================================================
// COMPONENT
// =============================================================================

export const EntityPreviewCard = memo(
  forwardRef<HTMLDivElement, EntityPreviewCardProps>(
    (
      {
        entity,
        isSelected = false,
        isHighlighted = false,
        showRecentActivity = true,
        showKeyDetails = true,
        compact = false,
        onClick,
        className,
        layoutConfig,
      },
      ref,
    ) => {
      const { i18n } = useTranslation(['rich-autocomplete', 'common'])
      const isRTL = i18n.language === 'ar'

      // Apply layout config overrides if provided
      const config = {
        showAvatar: layoutConfig?.showAvatar ?? true,
        showStatus: layoutConfig?.showStatus ?? true,
        showEntityType: layoutConfig?.showEntityType ?? true,
        showLastUpdated: layoutConfig?.showLastUpdated ?? true,
        maxKeyDetails: layoutConfig?.maxKeyDetails ?? (compact ? 2 : 3),
        maxTags: layoutConfig?.maxTags ?? 3,
        showRecentActivity: layoutConfig?.showRecentActivity ?? showRecentActivity,
        showMatchScore: layoutConfig?.showMatchScore ?? false,
      }

      const EntityIcon = ENTITY_TYPE_ICONS[entity.entity_type] || FileText
      const statusConfig = STATUS_CONFIG[entity.status]
      const StatusIcon = statusConfig.icon

      const displayName = isRTL ? entity.name_ar : entity.name_en
      const subtitle = isRTL ? entity.subtitle_ar : entity.subtitle_en

      // Determine if we should show avatar section
      const shouldShowAvatar = config.showAvatar || entity.photo_url

      return (
        <motion.div
          ref={ref}
          className={cn(
            'group relative flex cursor-pointer',
            'rounded-lg border transition-all duration-200',
            'min-h-[60px] sm:min-h-[72px]',
            compact ? 'p-2 sm:p-3' : 'p-3 sm:p-4',
            isSelected
              ? 'border-primary bg-primary/5 dark:bg-primary/10'
              : isHighlighted
                ? 'border-primary/50 bg-primary/5'
                : 'border-transparent hover:border-border hover:bg-muted/50',
            className,
          )}
          dir={isRTL ? 'rtl' : 'ltr'}
          onClick={onClick}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          role="option"
          aria-selected={isSelected}
        >
          {/* Left Section: Icon/Avatar */}
          {shouldShowAvatar && (
            <div className="flex-shrink-0 me-3">
              {entity.photo_url ? (
                <Avatar className={cn(compact ? 'h-10 w-10' : 'h-12 w-12 sm:h-14 sm:w-14')}>
                  <AvatarImage src={entity.photo_url} alt={displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div
                  className={cn(
                    'flex items-center justify-center rounded-lg',
                    'bg-muted',
                    compact ? 'h-10 w-10' : 'h-12 w-12 sm:h-14 sm:w-14',
                  )}
                >
                  <EntityIcon
                    className={cn(
                      'text-muted-foreground',
                      compact ? 'h-5 w-5' : 'h-6 w-6 sm:h-7 sm:w-7',
                    )}
                  />
                </div>
              )}
            </div>
          )}

          {/* Middle Section: Content */}
          <div className="flex-1 min-w-0">
            {/* Header: Name + Type Badge */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1 min-w-0">
                <h4
                  className={cn(
                    'font-semibold text-start truncate',
                    compact ? 'text-sm' : 'text-base sm:text-lg',
                    isSelected ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {displayName}
                </h4>
                {subtitle && (
                  <p className="text-xs sm:text-sm text-muted-foreground truncate text-start">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Entity Type Badge */}
              {config.showEntityType && (
                <Badge
                  variant="outline"
                  className={cn('flex-shrink-0 text-xs', compact && 'hidden sm:inline-flex')}
                >
                  {getEntityTypeLabel(entity.entity_type, isRTL)}
                </Badge>
              )}
            </div>

            {/* Key Details */}
            {showKeyDetails && entity.key_details.length > 0 && config.maxKeyDetails > 0 && (
              <div className={cn('flex flex-wrap gap-x-3 gap-y-1', compact ? 'mt-1' : 'mt-2')}>
                {entity.key_details.slice(0, config.maxKeyDetails).map((detail, idx) => (
                  <div key={idx} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="font-medium">
                      {isRTL ? detail.label_ar : detail.label_en}:
                    </span>
                    <span className="truncate max-w-[120px]">
                      {isRTL ? detail.value_ar : detail.value_en}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Activity */}
            {config.showRecentActivity && entity.recent_activity && !compact && (
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Activity className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {isRTL
                    ? entity.recent_activity.description_ar
                    : entity.recent_activity.description_en}
                </span>
                <span className="flex-shrink-0 text-muted-foreground/60">
                  · {getRelativeTime(entity.recent_activity.date, isRTL)}
                </span>
              </div>
            )}

            {/* Tags */}
            {entity.tags && entity.tags.length > 0 && !compact && config.maxTags > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {entity.tags.slice(0, config.maxTags).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                    {tag}
                  </Badge>
                ))}
                {entity.tags.length > config.maxTags && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    +{entity.tags.length - config.maxTags}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Right Section: Status & Score */}
          <div className="flex flex-col items-end justify-between ms-2 flex-shrink-0">
            {/* Status Badge */}
            {config.showStatus && (
              <Badge
                variant="secondary"
                className={cn(
                  'flex items-center gap-1 text-xs',
                  statusConfig.bgColor,
                  statusConfig.color,
                )}
              >
                <StatusIcon className="h-3 w-3" />
                <span className={compact ? 'hidden sm:inline' : ''}>
                  {getStatusLabel(entity.status, isRTL)}
                </span>
              </Badge>
            )}

            {/* Last Updated */}
            {config.showLastUpdated && !compact && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-auto">
                <Clock className="h-3 w-3" />
                <span>{getRelativeTime(entity.last_updated, isRTL)}</span>
              </div>
            )}

            {/* Match Score Indicator */}
            {config.showMatchScore && entity.combined_score > 0.8 && (
              <div
                className={cn(
                  'mt-1 h-1.5 w-8 rounded-full',
                  entity.combined_score > 0.9
                    ? 'bg-emerald-500'
                    : entity.combined_score > 0.8
                      ? 'bg-blue-500'
                      : 'bg-gray-300',
                )}
                title={`${Math.round(entity.combined_score * 100)}% match`}
              />
            )}
          </div>

          {/* Selection Indicator */}
          {isSelected && (
            <motion.div
              className="absolute inset-y-0 start-0 w-1 bg-primary rounded-s-lg"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </motion.div>
      )
    },
  ),
)

EntityPreviewCard.displayName = 'EntityPreviewCard'

export default EntityPreviewCard
