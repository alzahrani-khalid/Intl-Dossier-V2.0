/**
 * ActiveEditorAvatars Component
 *
 * Displays avatars of users currently editing the document
 * with their cursor colors and status indicators.
 * Mobile-first with RTL support.
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { ActiveEditor } from '@/types/collaborative-editing.types'

export interface ActiveEditorAvatarsProps {
  editors: ActiveEditor[]
  maxVisible?: number
  size?: 'sm' | 'md' | 'lg'
  showNames?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
}

const statusDotClasses = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
}

export function ActiveEditorAvatars({
  editors,
  maxVisible = 5,
  size = 'md',
  showNames = false,
  className,
}: ActiveEditorAvatarsProps) {
  const { t, i18n } = useTranslation('collaborative-editing')
  const isRTL = i18n.language === 'ar'

  const visibleEditors = editors.slice(0, maxVisible)
  const remainingCount = Math.max(0, editors.length - maxVisible)

  const getInitials = (name: string, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email?.slice(0, 2).toUpperCase() || '??'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'idle':
        return 'bg-yellow-500'
      case 'disconnected':
        return 'bg-gray-400'
      default:
        return 'bg-gray-400'
    }
  }

  if (editors.length === 0) {
    return null
  }

  return (
    <div className={cn('flex items-center', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <TooltipProvider>
        <div className={cn('flex', isRTL ? '-space-x-reverse' : '-space-x-2')}>
          {visibleEditors.map((editor) => (
            <Tooltip key={editor.sessionId}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar
                    className={cn(
                      sizeClasses[size],
                      'ring-2 ring-background cursor-pointer hover:z-10 transition-transform hover:scale-110',
                    )}
                    style={{ borderColor: editor.color }}
                  >
                    <AvatarImage src={editor.avatarUrl} alt={editor.name || editor.email} />
                    <AvatarFallback
                      className="font-medium"
                      style={{ backgroundColor: editor.color, color: '#fff' }}
                    >
                      {getInitials(editor.name, editor.email)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Status indicator dot */}
                  <span
                    className={cn(
                      'absolute bottom-0 end-0 rounded-full ring-2 ring-background',
                      statusDotClasses[size],
                      getStatusColor(editor.status),
                    )}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side={isRTL ? 'left' : 'right'}>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{editor.name || editor.email}</span>
                  <span className="text-xs text-muted-foreground">
                    {editor.status === 'active' && t('status.editing')}
                    {editor.status === 'idle' && t('status.idle')}
                    {editor.status === 'disconnected' && t('status.disconnected')}
                  </span>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Overflow indicator */}
          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar
                  className={cn(
                    sizeClasses[size],
                    'ring-2 ring-background bg-muted cursor-pointer',
                  )}
                >
                  <AvatarFallback className="text-muted-foreground font-medium">
                    +{remainingCount}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex flex-col gap-1">
                  {editors.slice(maxVisible).map((editor) => (
                    <span key={editor.sessionId} className="text-sm">
                      {editor.name || editor.email}
                    </span>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Optional names display */}
        {showNames && visibleEditors.length > 0 && (
          <div className={cn('flex items-center gap-1', isRTL ? 'me-3' : 'ms-3')}>
            <span className="text-sm text-muted-foreground">
              {visibleEditors.length === 1
                ? t('editors.singleEditing', {
                    name: visibleEditors[0].name || visibleEditors[0].email,
                  })
                : t('editors.multipleEditing', { count: editors.length })}
            </span>
          </div>
        )}
      </TooltipProvider>
    </div>
  )
}

// Compact version for toolbar use
export function ActiveEditorBadge({ count, className }: { count: number; className?: string }) {
  const { t, i18n } = useTranslation('collaborative-editing')
  const isRTL = i18n.language === 'ar'

  if (count === 0) return null

  return (
    <Badge variant="secondary" className={cn('gap-1', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
      {t('editors.count', { count })}
    </Badge>
  )
}

export default ActiveEditorAvatars
