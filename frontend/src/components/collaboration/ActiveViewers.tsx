/**
 * ActiveViewers Component
 * Feature: realtime-collaboration-indicators
 *
 * Avatar stack showing users currently viewing/editing a dossier
 * with tooltips showing user details and editing status.
 */

import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DossierPresenceUser, PresenceStatus } from '@/hooks/useDossierPresence'
import { Eye, Pencil, Moon, Users } from 'lucide-react'

interface ActiveViewersProps {
  /** List of users viewing/editing the dossier */
  viewers: DossierPresenceUser[]
  /** Current user's ID to exclude from display */
  currentUserId?: string
  /** Maximum avatars to show before "+N" indicator */
  maxVisible?: number
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show status indicators (editing/viewing/idle) */
  showStatus?: boolean
  /** Custom className */
  className?: string
}

const STATUS_ICONS: Record<PresenceStatus, typeof Eye> = {
  viewing: Eye,
  editing: Pencil,
  idle: Moon,
}

const SIZE_CLASSES = {
  sm: {
    avatar: 'h-6 w-6',
    text: 'text-xs',
    stack: '-space-x-2',
    badge: 'h-3 w-3',
  },
  md: {
    avatar: 'h-8 w-8',
    text: 'text-sm',
    stack: '-space-x-3',
    badge: 'h-4 w-4',
  },
  lg: {
    avatar: 'h-10 w-10',
    text: 'text-base',
    stack: '-space-x-4',
    badge: 'h-5 w-5',
  },
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getStatusColor(status: PresenceStatus): string {
  switch (status) {
    case 'editing':
      return 'bg-green-500'
    case 'viewing':
      return 'bg-blue-500'
    case 'idle':
      return 'bg-gray-400'
  }
}

function getStatusBorderColor(status: PresenceStatus): string {
  switch (status) {
    case 'editing':
      return 'ring-green-500/30'
    case 'viewing':
      return 'ring-blue-500/30'
    case 'idle':
      return 'ring-gray-400/30'
  }
}

/**
 * Individual user avatar with status indicator
 */
const UserAvatar = memo(function UserAvatar({
  user,
  size,
  showStatus,
  isRTL,
}: {
  user: DossierPresenceUser
  size: 'sm' | 'md' | 'lg'
  showStatus: boolean
  isRTL: boolean
}) {
  const { t } = useTranslation('collaboration')
  const sizeClasses = SIZE_CLASSES[size]
  const StatusIcon = STATUS_ICONS[user.status]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <Avatar
              className={cn(
                sizeClasses.avatar,
                'border-2 border-background cursor-pointer transition-transform hover:scale-110 hover:z-10',
                showStatus && `ring-2 ${getStatusBorderColor(user.status)}`,
              )}
              style={{ borderColor: user.color }}
            >
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback
                style={{ backgroundColor: user.color }}
                className="text-white font-medium"
              >
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>

            {/* Status indicator badge */}
            {showStatus && (
              <span
                className={cn(
                  'absolute -bottom-0.5 -end-0.5 rounded-full border-2 border-background',
                  sizeClasses.badge,
                  getStatusColor(user.status),
                )}
                aria-hidden="true"
              />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side={isRTL ? 'right' : 'left'}
          className="max-w-xs"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">
                {t(`status.${user.status}`, user.status)}
                {user.editing_section && (
                  <span className="ms-1">
                    - {t('editingSection', { section: user.editing_section })}
                  </span>
                )}
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})

/**
 * Overflow indicator showing additional viewers count
 */
const OverflowIndicator = memo(function OverflowIndicator({
  count,
  size,
  hiddenUsers,
  isRTL,
}: {
  count: number
  size: 'sm' | 'md' | 'lg'
  hiddenUsers: DossierPresenceUser[]
  isRTL: boolean
}) {
  const { t } = useTranslation('collaboration')
  const sizeClasses = SIZE_CLASSES[size]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              sizeClasses.avatar,
              'rounded-full bg-muted border-2 border-background flex items-center justify-center',
              'cursor-pointer transition-transform hover:scale-110 hover:z-10',
            )}
          >
            <span className={cn(sizeClasses.text, 'font-medium text-muted-foreground')}>
              +{count}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side={isRTL ? 'right' : 'left'} dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="space-y-1">
            <p className="font-medium text-sm">{t('moreViewers', { count })}</p>
            <ul className="text-xs text-muted-foreground">
              {hiddenUsers.map((user) => (
                <li key={user.user_id} className="flex items-center gap-1">
                  <span className={cn('h-2 w-2 rounded-full', getStatusColor(user.status))} />
                  {user.name}
                </li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})

/**
 * ActiveViewers component
 *
 * Displays an avatar stack of users currently viewing or editing a dossier.
 * Shows status indicators (viewing/editing/idle) and tooltips with user details.
 */
export function ActiveViewers({
  viewers,
  currentUserId,
  maxVisible = 5,
  size = 'md',
  showStatus = true,
  className,
}: ActiveViewersProps) {
  const { t, i18n } = useTranslation('collaboration')
  const isRTL = i18n.language === 'ar'
  const sizeClasses = SIZE_CLASSES[size]

  // Filter out current user and sort by status (editing first, then viewing, then idle)
  const otherViewers = viewers
    .filter((v) => v.user_id !== currentUserId)
    .sort((a, b) => {
      const statusOrder: Record<PresenceStatus, number> = {
        editing: 0,
        viewing: 1,
        idle: 2,
      }
      return statusOrder[a.status] - statusOrder[b.status]
    })

  if (otherViewers.length === 0) {
    return null
  }

  const visibleViewers = otherViewers.slice(0, maxVisible)
  const hiddenViewers = otherViewers.slice(maxVisible)
  const overflowCount = hiddenViewers.length
  const editingCount = otherViewers.filter((v) => v.status === 'editing').length

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
      role="group"
      aria-label={t('activeViewersLabel', { count: otherViewers.length })}
    >
      {/* Avatar stack */}
      <div className={cn('flex flex-row-reverse', sizeClasses.stack)}>
        {/* Overflow indicator (rendered first to appear at end due to row-reverse) */}
        {overflowCount > 0 && (
          <OverflowIndicator
            count={overflowCount}
            size={size}
            hiddenUsers={hiddenViewers}
            isRTL={isRTL}
          />
        )}

        {/* Visible avatars (reversed to show first user on top) */}
        {[...visibleViewers].reverse().map((viewer) => (
          <UserAvatar
            key={viewer.user_id}
            user={viewer}
            size={size}
            showStatus={showStatus}
            isRTL={isRTL}
          />
        ))}
      </div>

      {/* Status summary badge */}
      {editingCount > 0 && (
        <Badge
          variant="secondary"
          className="gap-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        >
          <Pencil className="h-3 w-3" />
          <span>{t('editingCount', { count: editingCount })}</span>
        </Badge>
      )}

      {/* Connection indicator for screen readers */}
      <span className="sr-only">
        {t('viewersSummary', {
          total: otherViewers.length,
          editing: editingCount,
          viewing: otherViewers.length - editingCount,
        })}
      </span>
    </div>
  )
}

/**
 * Compact version showing just the count with an icon
 */
export function ActiveViewersCompact({
  viewers,
  currentUserId,
  className,
}: Pick<ActiveViewersProps, 'viewers' | 'currentUserId' | 'className'>) {
  const { t, i18n } = useTranslation('collaboration')
  const isRTL = i18n.language === 'ar'

  const otherViewers = viewers.filter((v) => v.user_id !== currentUserId)
  const editingCount = otherViewers.filter((v) => v.status === 'editing').length

  if (otherViewers.length === 0) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 text-muted-foreground text-sm',
              editingCount > 0 &&
                'bg-green-100/50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
              className,
            )}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {editingCount > 0 ? (
              <Pencil className="h-3.5 w-3.5" />
            ) : (
              <Users className="h-3.5 w-3.5" />
            )}
            <span>{otherViewers.length}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side={isRTL ? 'right' : 'left'} dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="space-y-1">
            <p className="font-medium text-sm">
              {t('viewersSummary', {
                total: otherViewers.length,
                editing: editingCount,
                viewing: otherViewers.length - editingCount,
              })}
            </p>
            <ul className="text-xs text-muted-foreground">
              {otherViewers.slice(0, 5).map((user) => (
                <li key={user.user_id} className="flex items-center gap-1">
                  <span className={cn('h-2 w-2 rounded-full', getStatusColor(user.status))} />
                  {user.name}
                </li>
              ))}
              {otherViewers.length > 5 && (
                <li className="text-muted-foreground/70">
                  {t('andMore', { count: otherViewers.length - 5 })}
                </li>
              )}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default ActiveViewers
