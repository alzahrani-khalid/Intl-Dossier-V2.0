/**
 * Enhanced Activity Feed Component
 *
 * Full-featured activity feed with:
 * - Comprehensive filtering (entity type, action type, date range, user, relationship)
 * - Entity following with targeted notifications
 * - Real-time updates
 * - Infinite scroll pagination
 * - Mobile-first and RTL-ready design
 */

import { useRef, useEffect, useCallback } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { ar } from 'date-fns/locale'
import {
  Globe,
  Building2,
  UserRound,
  Handshake,
  Users,
  Briefcase,
  Palette,
  FileText,
  CalendarDays,
  Phone,
  CheckSquare,
  BookOpen,
  Target,
  Package,
  MapPin,
  Link,
  Brain,
  Ticket,
  Plus,
  Edit3,
  Trash2,
  MessageSquare,
  GitBranch,
  Upload,
  Download,
  Eye,
  Share2,
  UserPlus,
  AtSign,
  CheckCircle,
  XCircle,
  Archive,
  RotateCcw,
  Bell,
  BellOff,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useInView } from '@/hooks/useInView'
import { useActivityFeed, useEntityFollow } from '@/hooks/useActivityFeed'
import { ActivityFeedFilters } from './ActivityFeedFilters'
import type {
  ActivityItem,
  ActivityFilters,
  ActivityEntityType,
  ActivityActionType,
  ActivityFeedProps,
} from '@/types/activity-feed.types'
import { useDirection } from '@/hooks/useDirection'

// =============================================
// CONFIGURATION
// =============================================

const ENTITY_TYPE_ICONS: Record<ActivityEntityType, typeof Globe> = {
  country: Globe,
  organization: Building2,
  person: UserRound,
  engagement: Handshake,
  forum: Users,
  working_group: Briefcase,
  theme: Palette,
  mou: FileText,
  document: FileText,
  event: CalendarDays,
  contact: Phone,
  task: CheckSquare,
  brief: BookOpen,
  commitment: Target,
  deliverable: Package,
  position: MapPin,
  relationship: Link,
  intelligence: Brain,
  intake_ticket: Ticket,
}

const ENTITY_TYPE_COLORS: Record<ActivityEntityType, string> = {
  country: 'text-accent',
  organization: 'text-secondary-foreground',
  person: 'text-success',
  engagement: 'text-warning',
  forum: 'text-info',
  working_group: 'text-secondary-foreground',
  theme: 'text-secondary-foreground',
  mou: 'text-warning',
  document: 'text-ink-mute',
  event: 'text-danger',
  contact: 'text-success',
  task: 'text-warning',
  brief: 'text-secondary-foreground',
  commitment: 'text-danger',
  deliverable: 'text-success',
  position: 'text-info',
  relationship: 'text-secondary-foreground',
  intelligence: 'text-ink-mute',
  intake_ticket: 'text-success',
}

const ACTION_TYPE_CONFIG: Record<
  ActivityActionType,
  { icon: typeof Plus; color: string; bgColor: string }
> = {
  create: { icon: Plus, color: 'text-success', bgColor: 'bg-success/10 dark:bg-success/30' },
  update: { icon: Edit3, color: 'text-accent', bgColor: 'bg-accent/10 dark:bg-accent/30' },
  delete: { icon: Trash2, color: 'text-danger', bgColor: 'bg-danger/10 dark:bg-danger/30' },
  comment: {
    icon: MessageSquare,
    color: 'text-secondary-foreground',
    bgColor: 'bg-secondary dark:bg-secondary/30',
  },
  status_change: {
    icon: GitBranch,
    color: 'text-warning',
    bgColor: 'bg-warning/10 dark:bg-warning/30',
  },
  upload: {
    icon: Upload,
    color: 'text-secondary-foreground',
    bgColor: 'bg-secondary dark:bg-secondary/30',
  },
  download: { icon: Download, color: 'text-ink-mute', bgColor: 'bg-muted dark:bg-muted/30' },
  view: { icon: Eye, color: 'text-success', bgColor: 'bg-success/10 dark:bg-success/30' },
  share: {
    icon: Share2,
    color: 'text-secondary-foreground',
    bgColor: 'bg-secondary dark:bg-secondary/30',
  },
  assign: {
    icon: UserPlus,
    color: 'text-warning',
    bgColor: 'bg-warning/10 dark:bg-warning/30',
  },
  mention: { icon: AtSign, color: 'text-info', bgColor: 'bg-info/10 dark:bg-info/30' },
  approval: {
    icon: CheckCircle,
    color: 'text-success',
    bgColor: 'bg-success/10 dark:bg-success/30',
  },
  rejection: { icon: XCircle, color: 'text-danger', bgColor: 'bg-danger/10 dark:bg-danger/30' },
  archive: { icon: Archive, color: 'text-ink-mute', bgColor: 'bg-muted dark:bg-muted/30' },
  restore: {
    icon: RotateCcw,
    color: 'text-secondary-foreground',
    bgColor: 'bg-secondary dark:bg-secondary/30',
  },
}

// =============================================
// ACTIVITY ITEM COMPONENT
// =============================================

interface ActivityItemComponentProps {
  activity: ActivityItem
  isRTL: boolean
  onEntityClick?: (entityType: ActivityEntityType, entityId: string) => void
  onFollowToggle?: (
    entityType: ActivityEntityType,
    entityId: string,
    entityNameEn: string,
    entityNameAr?: string,
  ) => void
  isFollowing?: boolean
}

function ActivityItemComponent({
  activity,
  isRTL,
  onEntityClick,
  onFollowToggle,
  isFollowing,
}: ActivityItemComponentProps) {
  const actionConfig = ACTION_TYPE_CONFIG[activity.action_type]
  const ActionIcon = actionConfig.icon
  const EntityIcon = ENTITY_TYPE_ICONS[activity.entity_type]
  const entityColor = ENTITY_TYPE_COLORS[activity.entity_type]

  const timeAgo = formatDistanceToNow(new Date(activity.created_at), {
    addSuffix: true,
    locale: isRTL ? ar : undefined,
  })

  const fullDate = format(new Date(activity.created_at), 'PPpp', {
    locale: isRTL ? ar : undefined,
  })

  const entityName =
    isRTL && activity.entity_name_ar ? activity.entity_name_ar : activity.entity_name_en

  const description =
    isRTL && activity.description_ar ? activity.description_ar : activity.description_en

  const handleEntityClick = useCallback(() => {
    if (onEntityClick) {
      onEntityClick(activity.entity_type, activity.entity_id)
    }
  }, [onEntityClick, activity.entity_type, activity.entity_id])

  const handleFollowToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (onFollowToggle) {
        onFollowToggle(
          activity.entity_type,
          activity.entity_id,
          activity.entity_name_en,
          activity.entity_name_ar,
        )
      }
    },
    [onFollowToggle, activity],
  )

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'flex gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer border-b last:border-b-0',
        activity.isNew && 'bg-warning/5 dark:bg-warning/20 animate-pulse',
      )}
      onClick={handleEntityClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleEntityClick()
        }
      }}
    >
      {/* Action Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          actionConfig.bgColor,
        )}
      >
        <ActionIcon className={cn('h-5 w-5', actionConfig.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Actor Row */}
        <div className="flex items-center gap-2 mb-1">
          <Avatar className="h-6 w-6">
            <AvatarImage src={activity.actor_avatar_url} alt={activity.actor_name} />
            <AvatarFallback className="text-xs">
              {activity.actor_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm text-foreground truncate">
            {activity.actor_name}
          </span>
          <span className="text-sm text-muted-foreground">{description}</span>
        </div>

        {/* Entity Row */}
        <div className="flex items-center gap-2 mb-2">
          <EntityIcon className={cn('h-4 w-4 flex-shrink-0', entityColor)} />
          <span className="font-medium text-sm text-foreground truncate">{entityName}</span>
          {activity.related_entity_type && (
            <>
              <ChevronRight
                className={cn('h-4 w-4 text-muted-foreground', isRTL && 'rotate-180')}
              />
              <span className="text-sm text-muted-foreground truncate">
                {isRTL && activity.related_entity_name_ar
                  ? activity.related_entity_name_ar
                  : activity.related_entity_name_en}
              </span>
            </>
          )}
        </div>

        {/* Metadata (status change, comment, etc.) */}
        {activity.metadata?.from_status && activity.metadata?.to_status && (
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {activity.metadata.from_status}
            </Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant="secondary" className="text-xs">
              {activity.metadata.to_status}
            </Badge>
          </div>
        )}

        {activity.metadata?.comment_text && (
          <p className="text-sm text-muted-foreground italic bg-muted/50 rounded px-2 py-1 mb-2">
            "{activity.metadata.comment_text}"
          </p>
        )}

        {/* Footer Row */}
        <div className="flex items-center justify-between gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground">{timeAgo}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{fullDate}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Follow Button */}
          {onFollowToggle && (
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleFollowToggle}>
              {isFollowing ? (
                <>
                  <BellOff className="h-3 w-3 me-1" />
                  <span className="text-xs">{isRTL ? 'إلغاء المتابعة' : 'Unfollow'}</span>
                </>
              ) : (
                <>
                  <Bell className="h-3 w-3 me-1" />
                  <span className="text-xs">{isRTL ? 'متابعة' : 'Follow'}</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================
// LOADING SKELETON
// =============================================

function ActivitySkeleton() {
  return (
    <div className="flex gap-3 p-4 border-b">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

// =============================================
// MAIN COMPONENT
// =============================================

export function EnhancedActivityFeed({
  filters: initialFilters,
  showFilters = true,
  showSearch = true,
  maxHeight = '600px',
  className,
  emptyMessage,
  onActivityClick,
}: ActivityFeedProps) {
  const { isRTL } = useDirection()
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(loadMoreRef as React.RefObject<HTMLElement>)

  // Hooks
  const {
    activities,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    error,
    fetchNextPage,
    filters,
    setFilters,
    clearFilters,
  } = useActivityFeed(initialFilters)

  const { following, followEntity, unfollowEntity, isFollowing } = useEntityFollow()

  // Load more when scrolling to bottom
  useEffect(() => {
    if (isInView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [isInView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Handle entity click
  const handleEntityClick = useCallback(
    (entityType: ActivityEntityType, entityId: string) => {
      // Find the activity
      const activity = activities.find(
        (a) => a.entity_type === entityType && a.entity_id === entityId,
      )
      if (activity && onActivityClick) {
        onActivityClick(activity)
      }
    },
    [activities, onActivityClick],
  )

  // Handle follow toggle
  const handleFollowToggle = useCallback(
    async (
      entityType: ActivityEntityType,
      entityId: string,
      entityNameEn: string,
      entityNameAr?: string,
    ) => {
      if (isFollowing(entityType, entityId)) {
        await unfollowEntity({ entity_type: entityType, entity_id: entityId })
      } else {
        await followEntity({
          entity_type: entityType,
          entity_id: entityId,
          entity_name_en: entityNameEn,
          entity_name_ar: entityNameAr,
        })
      }
    },
    [isFollowing, followEntity, unfollowEntity],
  )

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (newFilters: ActivityFilters) => {
      setFilters(newFilters)
    },
    [setFilters],
  )

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="h-5 w-5" />
          {isRTL ? 'سجل النشاطات' : 'Activity Feed'}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Filters */}
        {showFilters && (
          <ActivityFeedFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={clearFilters}
            showSearch={showSearch}
            className="mb-4"
          />
        )}

        {/* Activity List */}
        <div className="overflow-y-auto border rounded-lg" style={{ maxHeight }}>
          {/* Loading State */}
          {isLoading && (
            <div>
              {[0, 1, 2, 3, 4].map((n) => (
                <ActivitySkeleton key={n} />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                {isRTL ? 'حدث خطأ أثناء تحميل النشاطات' : 'Failed to load activities'}
              </p>
              <p className="text-xs text-destructive mb-4">{error.message}</p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                {isRTL ? 'إعادة المحاولة' : 'Try again'}
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && activities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                {emptyMessage || (isRTL ? 'لا توجد نشاطات لعرضها' : 'No activities to display')}
              </p>
              {filters.followed_only && (
                <p className="text-xs text-muted-foreground mt-2">
                  {isRTL
                    ? 'جرب إلغاء تحديد "المتابعة فقط" لرؤية جميع النشاطات'
                    : 'Try unchecking "Following only" to see all activities'}
                </p>
              )}
            </div>
          )}

          {/* Activities */}
          {!isLoading && !error && activities.length > 0 && (
            <>
              {activities.map((activity) => (
                <ActivityItemComponent
                  key={activity.id}
                  activity={activity}
                  isRTL={isRTL}
                  onEntityClick={handleEntityClick}
                  onFollowToggle={handleFollowToggle}
                  isFollowing={isFollowing(activity.entity_type, activity.entity_id)}
                />
              ))}

              {/* Load More Trigger */}
              {hasNextPage && (
                <div ref={loadMoreRef} className="flex items-center justify-center py-4">
                  {isFetchingNextPage ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">
                        {isRTL ? 'جاري التحميل...' : 'Loading more...'}
                      </span>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => fetchNextPage()}>
                      {isRTL ? 'تحميل المزيد' : 'Load more'}
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Following Summary */}
        {following.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              {isRTL
                ? `أنت تتابع ${following.length} عنصر`
                : `Following ${following.length} item${following.length > 1 ? 's' : ''}`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
