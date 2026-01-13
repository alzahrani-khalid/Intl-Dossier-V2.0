/**
 * Follow Button Component
 *
 * Standalone button for following/unfollowing entities.
 * Can be placed on any entity card or detail page.
 *
 * Mobile-first and RTL-ready
 */

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useEntityFollow } from '@/hooks/useActivityFeed'
import type { FollowButtonProps } from '@/types/activity-feed.types'

export function FollowButton({
  entityType,
  entityId,
  entityNameEn,
  entityNameAr,
  size = 'md',
  variant = 'outline',
  className,
}: FollowButtonProps) {
  const { t, i18n } = useTranslation('activity-feed')
  const isRTL = i18n.language === 'ar'

  const { followEntity, unfollowEntity, isFollowing, isFollowPending, isUnfollowPending } =
    useEntityFollow()

  const following = isFollowing(entityType, entityId)
  const isPending = isFollowPending || isUnfollowPending

  const handleClick = useCallback(async () => {
    if (following) {
      await unfollowEntity({ entity_type: entityType, entity_id: entityId })
    } else {
      await followEntity({
        entity_type: entityType,
        entity_id: entityId,
        entity_name_en: entityNameEn,
        entity_name_ar: entityNameAr,
      })
    }
  }, [following, followEntity, unfollowEntity, entityType, entityId, entityNameEn, entityNameAr])

  // Size configurations
  const sizeConfig = {
    sm: {
      button: 'h-7 px-2 text-xs',
      icon: 'h-3 w-3',
      iconOnly: 'h-7 w-7',
    },
    md: {
      button: 'h-9 px-3 text-sm',
      icon: 'h-4 w-4',
      iconOnly: 'h-9 w-9',
    },
    lg: {
      button: 'h-11 px-4 text-base',
      icon: 'h-5 w-5',
      iconOnly: 'h-11 w-11',
    },
  }

  const config = sizeConfig[size]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={following ? 'secondary' : variant}
            size="sm"
            className={cn(config.button, className)}
            onClick={handleClick}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className={cn(config.icon, 'animate-spin')} />
            ) : following ? (
              <BellOff className={config.icon} />
            ) : (
              <Bell className={config.icon} />
            )}
            <span className="ms-1.5 hidden sm:inline">
              {following ? (isRTL ? 'إلغاء المتابعة' : 'Unfollow') : isRTL ? 'متابعة' : 'Follow'}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {following
              ? isRTL
                ? 'إلغاء متابعة هذا العنصر للتوقف عن تلقي التحديثات'
                : 'Unfollow to stop receiving updates'
              : isRTL
                ? 'متابعة للحصول على إشعارات عند حدوث تغييرات'
                : 'Follow to get notified of changes'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default FollowButton
