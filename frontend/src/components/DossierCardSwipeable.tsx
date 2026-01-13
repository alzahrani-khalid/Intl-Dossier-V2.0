/**
 * DossierCardSwipeable Component
 *
 * Enhanced dossier card with swipe gesture support for mobile-first interactions.
 * Features:
 * - Swipe right to favorite/pin
 * - Swipe left to archive/delete
 * - Long-press for contextual menu
 * - Haptic feedback for each gesture
 * - RTL support with automatic direction adjustment
 *
 * @example
 * <DossierCardSwipeable
 *   dossier={dossier}
 *   onFavorite={(id) => handleFavorite(id)}
 *   onArchive={(id) => handleArchive(id)}
 * />
 */

import { memo, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Calendar, Tag, Star, Archive, Trash2, Eye, Edit, Pin, Share2 } from 'lucide-react'
import { SwipeableCard, type ContextMenuItem } from './ui/swipeable-card'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { Dossier } from '../types/dossier'
import { getCountryCode } from '../lib/country-codes'

export interface DossierCardSwipeableProps {
  dossier: Dossier
  /** Called when user swipes right (favorite/pin) */
  onFavorite?: (id: string) => void
  /** Called when user swipes left (archive) */
  onArchive?: (id: string) => void
  /** Called when user selects delete from context menu */
  onDelete?: (id: string) => void
  /** Called when user selects edit from context menu */
  onEdit?: (id: string) => void
  /** Called when user selects share from context menu */
  onShare?: (id: string) => void
  /** Whether swipe gestures are enabled */
  swipeEnabled?: boolean
  /** Whether the dossier is favorited */
  isFavorited?: boolean
  /** Whether the dossier is pinned */
  isPinned?: boolean
  /** Additional class names */
  className?: string
}

export const DossierCardSwipeable = memo(function DossierCardSwipeable({
  dossier,
  onFavorite,
  onArchive,
  onDelete,
  onEdit,
  onShare,
  swipeEnabled = true,
  isFavorited = false,
  isPinned = false,
  className,
}: DossierCardSwipeableProps) {
  const { t, i18n } = useTranslation(['dossiers', 'swipe-gestures'])
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'

  // Get bilingual name
  const name = isRTL ? dossier.name_ar : dossier.name_en

  // Get country code for flag display (only for country type)
  const countryCode = dossier.type === 'country' ? getCountryCode(name) : null

  // Get summary preview (first 100 chars)
  const summary = isRTL ? dossier.summary_ar : dossier.summary_en
  const summaryPreview = summary
    ? summary.length > 100
      ? `${summary.substring(0, 100)}...`
      : summary
    : null

  // Convert sensitivity level to string for translation lookup
  const sensitivityKey = String(dossier.sensitivity_level)

  // Navigation handlers
  const handleClick = useCallback(() => {
    navigate({ to: `/dossiers/${dossier.id}` })
  }, [navigate, dossier.id])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleClick()
      }
    },
    [handleClick],
  )

  // Swipe action handlers
  const handleFavorite = useCallback(() => {
    if (onFavorite) {
      onFavorite(dossier.id)
      toast({
        title: isFavorited
          ? t('swipe-gestures:feedback.unfavorited')
          : t('swipe-gestures:feedback.favorited'),
        duration: 2000,
      })
    }
  }, [onFavorite, dossier.id, isFavorited, t])

  const handleArchive = useCallback(() => {
    if (onArchive) {
      onArchive(dossier.id)
      toast({
        title: t('swipe-gestures:feedback.archived'),
        duration: 2000,
      })
    }
  }, [onArchive, dossier.id, t])

  // Context menu items
  const contextMenuItems: ContextMenuItem[] = [
    {
      key: 'view',
      label: t('swipe-gestures:contextMenu.view'),
      icon: <Eye className="h-4 w-4" />,
      onSelect: handleClick,
    },
    ...(onEdit
      ? [
          {
            key: 'edit',
            label: t('swipe-gestures:contextMenu.edit'),
            icon: <Edit className="h-4 w-4" />,
            onSelect: () => onEdit(dossier.id),
          },
        ]
      : []),
    ...(onFavorite
      ? [
          {
            key: 'favorite',
            label: isFavorited
              ? t('swipe-gestures:contextMenu.unfavorite')
              : t('swipe-gestures:contextMenu.favorite'),
            icon: <Star className={cn('h-4 w-4', isFavorited && 'fill-current')} />,
            onSelect: handleFavorite,
          },
        ]
      : []),
    ...(onShare
      ? [
          {
            key: 'share',
            label: t('swipe-gestures:contextMenu.share'),
            icon: <Share2 className="h-4 w-4" />,
            onSelect: () => onShare(dossier.id),
          },
        ]
      : []),
    ...(onArchive
      ? [
          {
            key: 'archive',
            label: t('swipe-gestures:contextMenu.archive'),
            icon: <Archive className="h-4 w-4" />,
            onSelect: handleArchive,
          },
        ]
      : []),
    ...(onDelete
      ? [
          {
            key: 'delete',
            label: t('swipe-gestures:contextMenu.delete'),
            icon: <Trash2 className="h-4 w-4" />,
            destructive: true,
            onSelect: () => onDelete(dossier.id),
          },
        ]
      : []),
  ]

  // Get sensitivity badge class
  const getSensitivityBadgeClass = (level: string | number): string => {
    const levelStr = String(level)
    if (['5'].includes(levelStr)) {
      return 'bg-purple-950 text-white border-0'
    } else if (['4'].includes(levelStr)) {
      return 'bg-red-900 text-white border-0'
    } else if (['3'].includes(levelStr)) {
      return 'bg-red-600 text-white border-0'
    } else if (['2'].includes(levelStr)) {
      return 'bg-orange-500 text-white border-0'
    } else if (['1'].includes(levelStr)) {
      return 'bg-blue-500 text-white border-0'
    } else if (['0'].includes(levelStr)) {
      return 'bg-green-500 text-white border-0'
    }
    switch (levelStr) {
      case 'high':
        return 'bg-red-600 text-white border-0'
      case 'medium':
        return 'bg-orange-500 text-white border-0'
      case 'low':
      default:
        return 'bg-green-500 text-white border-0'
    }
  }

  // Get type badge color
  const getTypeBadgeClass = (type: string): string => {
    switch (type) {
      case 'country':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'organization':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'forum':
        return 'bg-violet-50 text-violet-700 border-violet-200'
      case 'theme':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const cardContent = (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      aria-label={t('dossiers:viewDetails') + ': ' + name}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <CardTitle className="flex items-center text-base sm:text-lg">
              {/* Pinned indicator */}
              {isPinned && (
                <Pin
                  className="h-4 w-4 text-blue-500 me-2 shrink-0"
                  aria-label={t('swipe-gestures:actions.pin')}
                />
              )}
              {/* Favorited indicator */}
              {isFavorited && (
                <Star
                  className="h-4 w-4 text-yellow-500 fill-yellow-500 me-2 shrink-0"
                  aria-label={t('swipe-gestures:actions.favorite')}
                />
              )}
              {countryCode && (
                <span
                  className={`fi fi-${countryCode} shrink-0 rounded-sm`}
                  style={{
                    width: '2em',
                    height: '1.5em',
                    display: 'inline-block',
                    backgroundSize: 'contain',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15), 0 1px 2px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    marginInlineEnd: '1rem',
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                />
              )}
              <span className="line-clamp-2 leading-tight">{name}</span>
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={`${getTypeBadgeClass(dossier.type)} text-xs`}
                aria-label={`${t('dossiers:fields.type')}: ${t(`dossiers:types.${dossier.type}`)}`}
              >
                {t(`dossiers:types.${dossier.type}`)}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge
              variant="secondary"
              className={`whitespace-nowrap text-xs font-semibold ${getSensitivityBadgeClass(sensitivityKey)}`}
              aria-label={`${t('dossiers:fields.sensitivity')}: ${t(`dossiers:sensitivity.${sensitivityKey}`)}`}
            >
              {t(`dossiers:sensitivity.${sensitivityKey}`)}
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs"
              aria-label={`${t('dossiers:fields.status')}: ${t(`dossiers:statuses.${dossier.status}`)}`}
            >
              {t(`dossiers:statuses.${dossier.status}`)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      {summaryPreview && (
        <CardContent className="pb-4">
          <CardDescription className="line-clamp-2 text-sm leading-relaxed">
            {summaryPreview}
          </CardDescription>
        </CardContent>
      )}

      <CardFooter className="flex flex-col items-start gap-3 pt-0">
        {/* Tags */}
        {dossier.tags && dossier.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 w-full">
            <Tag className="size-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
            {dossier.tags.slice(0, 3).map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs"
                aria-label={`${t('dossiers:fields.tags')}: ${tag}`}
              >
                {tag}
              </Badge>
            ))}
            {dossier.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{dossier.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between gap-2 w-full text-xs text-muted-foreground">
          <span className="font-medium">
            {t('dossiers:fields.version')} {dossier.version}
          </span>
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5" aria-hidden="true" />
            <time dateTime={dossier.updated_at}>
              {new Date(dossier.updated_at).toLocaleDateString(i18n.language, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </time>
          </div>
        </div>
      </CardFooter>
    </Card>
  )

  // Wrap with SwipeableCard if gestures are enabled
  if (swipeEnabled && (onFavorite || onArchive || contextMenuItems.length > 0)) {
    return (
      <SwipeableCard
        className={className}
        rightAction={
          onFavorite
            ? {
                type: isFavorited ? 'favorite' : 'favorite',
                label: isFavorited
                  ? t('swipe-gestures:actions.unfavorite')
                  : t('swipe-gestures:actions.favorite'),
                icon: <Star className={cn('h-5 w-5', isFavorited && 'fill-current')} />,
                colorClass: 'bg-yellow-500',
                onAction: handleFavorite,
              }
            : undefined
        }
        leftAction={
          onArchive
            ? {
                type: 'archive',
                label: t('swipe-gestures:actions.archive'),
                icon: <Archive className="h-5 w-5" />,
                colorClass: 'bg-gray-500',
                onAction: handleArchive,
              }
            : undefined
        }
        contextMenuItems={contextMenuItems.length > 0 ? contextMenuItems : undefined}
        data-testid={`swipeable-dossier-card-${dossier.id}`}
      >
        {cardContent}
      </SwipeableCard>
    )
  }

  return cardContent
})

export default DossierCardSwipeable
