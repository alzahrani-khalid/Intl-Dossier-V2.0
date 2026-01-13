/**
 * TrackChangesOverlay Component
 *
 * Displays inline track changes with authorship information.
 * Shows insertions, deletions, and replacements with color coding.
 * Allows accepting or rejecting individual changes.
 * Mobile-first with RTL support.
 */

import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { Check, X, MoreHorizontal, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { TrackChangeWithAuthor, TrackChangeType } from '@/types/collaborative-editing.types'

export interface TrackChangesOverlayProps {
  changes: TrackChangeWithAuthor[]
  onAccept: (changeId: string) => void
  onReject: (changeId: string) => void
  onAcceptAll?: () => void
  onRejectAll?: () => void
  showAuthorship?: boolean
  canResolve?: boolean
  className?: string
}

// Individual change marker component
interface ChangeMarkerProps {
  change: TrackChangeWithAuthor
  onAccept: () => void
  onReject: () => void
  showAuthorship: boolean
  canResolve: boolean
  isRTL: boolean
  dateLocale: Locale
}

function ChangeMarker({
  change,
  onAccept,
  onReject,
  showAuthorship,
  canResolve,
  isRTL,
  dateLocale,
}: ChangeMarkerProps) {
  const { t } = useTranslation('collaborative-editing')
  const [isOpen, setIsOpen] = useState(false)

  const isPending = change.isAccepted === null

  const getChangeStyle = () => {
    if (!isPending) {
      // Already resolved - show muted style
      return change.isAccepted
        ? 'bg-green-50 dark:bg-green-950/30'
        : 'bg-red-50 dark:bg-red-950/30 opacity-50'
    }

    switch (change.changeType) {
      case 'insertion':
        return 'bg-green-100 dark:bg-green-900/50 border-b-2 border-green-500'
      case 'deletion':
        return 'bg-red-100 dark:bg-red-900/50 border-b-2 border-red-500 line-through'
      case 'replacement':
        return 'bg-blue-100 dark:bg-blue-900/50 border-b-2 border-blue-500'
      case 'formatting':
        return 'bg-purple-100 dark:bg-purple-900/50 border-b-2 border-purple-500'
      default:
        return 'bg-gray-100 dark:bg-gray-800'
    }
  }

  const getDisplayText = () => {
    switch (change.changeType) {
      case 'deletion':
        return change.originalText
      case 'insertion':
        return change.newText
      case 'replacement':
        return change.newText
      default:
        return change.newText || change.originalText
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <span
          className={cn(
            'relative cursor-pointer rounded px-0.5 transition-colors',
            'hover:ring-2 hover:ring-offset-1',
            isPending ? 'hover:ring-primary' : 'hover:ring-muted',
            getChangeStyle(),
          )}
          style={
            showAuthorship && change.author?.color
              ? { borderColor: change.author.color }
              : undefined
          }
        >
          {getDisplayText()}
          {showAuthorship && isPending && (
            <span
              className="absolute -top-1 -end-1 h-2 w-2 rounded-full"
              style={{ backgroundColor: change.author?.color || '#888' }}
            />
          )}
        </span>
      </PopoverTrigger>

      <PopoverContent side={isRTL ? 'left' : 'right'} align="start" className="w-64 sm:w-72 p-3">
        <div className="space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Author info */}
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={change.author?.avatarUrl} alt={change.author?.name} />
              <AvatarFallback className="text-xs">
                {change.author?.name?.slice(0, 2).toUpperCase() ||
                  change.author?.email?.slice(0, 2).toUpperCase() ||
                  '??'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {change.author?.name || change.author?.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(change.createdAt), {
                  addSuffix: true,
                  locale: dateLocale,
                })}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {t(`trackChanges.changeType.${change.changeType}`)}
            </Badge>
          </div>

          {/* Change details */}
          <div className="space-y-1">
            {change.originalText && change.changeType !== 'insertion' && (
              <div className="text-sm">
                <span className="text-muted-foreground">{t('trackChanges.original')}:</span>
                <span className="ms-1 line-through text-red-600 dark:text-red-400">
                  {change.originalText}
                </span>
              </div>
            )}
            {change.newText && change.changeType !== 'deletion' && (
              <div className="text-sm">
                <span className="text-muted-foreground">{t('trackChanges.new')}:</span>
                <span className="ms-1 text-green-600 dark:text-green-400">{change.newText}</span>
              </div>
            )}
          </div>

          {/* Status or actions */}
          {!isPending ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {change.isAccepted ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{t('trackChanges.accepted')}</span>
                </>
              ) : (
                <>
                  <X className="h-4 w-4 text-red-500" />
                  <span>{t('trackChanges.rejected')}</span>
                </>
              )}
              {change.acceptedByUser && (
                <span className="text-xs">
                  {t('trackChanges.by', {
                    name: change.acceptedByUser.name || change.acceptedByUser.email,
                  })}
                </span>
              )}
            </div>
          ) : canResolve ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => {
                  onAccept()
                  setIsOpen(false)
                }}
                className="flex-1 gap-1"
              >
                <Check className="h-4 w-4" />
                {t('trackChanges.accept')}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  onReject()
                  setIsOpen(false)
                }}
                className="flex-1 gap-1"
              >
                <X className="h-4 w-4" />
                {t('trackChanges.reject')}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t('trackChanges.pendingReview')}</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function TrackChangesOverlay({
  changes,
  onAccept,
  onReject,
  onAcceptAll,
  onRejectAll,
  showAuthorship = true,
  canResolve = true,
  className,
}: TrackChangesOverlayProps) {
  const { t, i18n } = useTranslation('collaborative-editing')
  const isRTL = i18n.language === 'ar'
  const dateLocale = i18n.language === 'ar' ? ar : enUS

  const pendingChanges = useMemo(() => changes.filter((c) => c.isAccepted === null), [changes])

  const pendingCount = pendingChanges.length

  // Group changes by author for stats
  const authorStats = useMemo(() => {
    const stats = new Map<string, { author: TrackChangeWithAuthor['author']; count: number }>()
    pendingChanges.forEach((change) => {
      const authorId = change.authorId
      const existing = stats.get(authorId)
      if (existing) {
        existing.count++
      } else {
        stats.set(authorId, { author: change.author, count: 1 })
      }
    })
    return Array.from(stats.values())
  }, [pendingChanges])

  if (changes.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-3', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Summary bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Badge variant={pendingCount > 0 ? 'default' : 'secondary'}>
            {pendingCount > 0
              ? t('trackChanges.pendingCount', { count: pendingCount })
              : t('trackChanges.allResolved')}
          </Badge>

          {/* Author chips */}
          {showAuthorship && authorStats.length > 0 && (
            <div className="flex items-center gap-1">
              {authorStats.slice(0, 3).map(({ author, count }) => (
                <div
                  key={author.id}
                  className="flex items-center gap-1 px-2 py-0.5 bg-background rounded-full text-xs"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: author.color || '#888' }}
                  />
                  <span className="truncate max-w-[60px]">
                    {author.name?.split(' ')[0] || author.email?.split('@')[0]}
                  </span>
                  <span className="text-muted-foreground">({count})</span>
                </div>
              ))}
              {authorStats.length > 3 && (
                <span className="text-xs text-muted-foreground">+{authorStats.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Bulk actions */}
        {canResolve && pendingCount > 0 && (onAcceptAll || onRejectAll) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <MoreHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">{t('trackChanges.bulkActions')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
              {onAcceptAll && (
                <DropdownMenuItem onClick={onAcceptAll} className="gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  {t('trackChanges.acceptAll')}
                </DropdownMenuItem>
              )}
              {onRejectAll && (
                <DropdownMenuItem onClick={onRejectAll} className="gap-2 text-red-600">
                  <X className="h-4 w-4" />
                  {t('trackChanges.rejectAll')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Changes list (for use outside of actual document) */}
      <div className="space-y-2">
        {changes.map((change) => (
          <div
            key={change.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg border',
              change.isAccepted === null
                ? 'bg-background'
                : change.isAccepted
                  ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800 opacity-60',
            )}
          >
            {/* Author avatar */}
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={change.author?.avatarUrl} alt={change.author?.name} />
              <AvatarFallback
                style={{ backgroundColor: change.author?.color }}
                className="text-white text-xs"
              >
                {change.author?.name?.slice(0, 2).toUpperCase() ||
                  change.author?.email?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Change content */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">
                  {change.author?.name || change.author?.email}
                </span>
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs',
                    change.changeType === 'insertion' &&
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                    change.changeType === 'deletion' &&
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                    change.changeType === 'replacement' &&
                      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                  )}
                >
                  {t(`trackChanges.changeType.${change.changeType}`)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(change.createdAt), {
                    addSuffix: true,
                    locale: dateLocale,
                  })}
                </span>
              </div>

              {/* Change preview */}
              <div className="text-sm">
                {change.originalText && change.changeType !== 'insertion' && (
                  <span className="line-through text-red-600 dark:text-red-400 me-2">
                    {change.originalText}
                  </span>
                )}
                {change.newText && change.changeType !== 'deletion' && (
                  <span className="text-green-600 dark:text-green-400">{change.newText}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            {change.isAccepted === null && canResolve ? (
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onAccept(change.id)}
                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onReject(change.id)}
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  change.isAccepted
                    ? 'border-green-500 text-green-600'
                    : 'border-red-500 text-red-600',
                )}
              >
                {change.isAccepted ? t('trackChanges.accepted') : t('trackChanges.rejected')}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Export the marker component for use in rich text editors
export { ChangeMarker }

export default TrackChangesOverlay
