/**
 * PersonCardSwipeable Component
 *
 * Enhanced person card with swipe gesture support for mobile-first interactions.
 * Wraps the existing PersonCard with SwipeableCard for gesture support.
 */

import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Star, Archive, Trash2, Eye, Edit, Share2 } from 'lucide-react'
import { PersonCard } from './PersonCard'
import { SwipeableCard, type ContextMenuItem } from '@/components/ui/swipeable-card'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { DossierWithExtension } from '@/services/dossier-api'

export interface PersonCardSwipeableProps {
  dossier: DossierWithExtension & {
    type: 'person'
    extension?: {
      title?: string
      organization_id?: string
      organization_name?: string
      nationality?: string
      contact_email?: string
      contact_phone?: string
      biography_en?: string
      biography_ar?: string
      photo_url?: string
    }
  }
  /** Called when user taps/clicks view */
  onView?: (id: string) => void
  /** Called when user selects edit */
  onEdit?: (id: string) => void
  /** Called when user selects delete */
  onDelete?: (id: string) => void
  /** Called when user swipes right (favorite) */
  onFavorite?: (id: string) => void
  /** Called when user swipes left (archive) */
  onArchive?: (id: string) => void
  /** Called when user selects share */
  onShare?: (id: string) => void
  /** Whether swipe gestures are enabled */
  swipeEnabled?: boolean
  /** Whether the person is favorited */
  isFavorited?: boolean
  /** Additional class names */
  className?: string
}

export const PersonCardSwipeable = memo(function PersonCardSwipeable({
  dossier,
  onView,
  onEdit,
  onDelete,
  onFavorite,
  onArchive,
  onShare,
  swipeEnabled = true,
  isFavorited = false,
  className,
}: PersonCardSwipeableProps) {
  const { t } = useTranslation('swipe-gestures')

  // Swipe action handlers
  const handleFavorite = useCallback(() => {
    if (onFavorite) {
      onFavorite(dossier.id)
      toast({
        title: isFavorited ? t('feedback.unfavorited') : t('feedback.favorited'),
        duration: 2000,
      })
    }
  }, [onFavorite, dossier.id, isFavorited, t])

  const handleArchive = useCallback(() => {
    if (onArchive) {
      onArchive(dossier.id)
      toast({
        title: t('feedback.archived'),
        duration: 2000,
      })
    }
  }, [onArchive, dossier.id, t])

  // Context menu items
  const contextMenuItems: ContextMenuItem[] = [
    ...(onView
      ? [
          {
            key: 'view',
            label: t('contextMenu.view'),
            icon: <Eye className="h-4 w-4" />,
            onSelect: () => onView(dossier.id),
          },
        ]
      : []),
    ...(onEdit
      ? [
          {
            key: 'edit',
            label: t('contextMenu.edit'),
            icon: <Edit className="h-4 w-4" />,
            onSelect: () => onEdit(dossier.id),
          },
        ]
      : []),
    ...(onFavorite
      ? [
          {
            key: 'favorite',
            label: isFavorited ? t('contextMenu.unfavorite') : t('contextMenu.favorite'),
            icon: <Star className={cn('h-4 w-4', isFavorited && 'fill-current')} />,
            onSelect: handleFavorite,
          },
        ]
      : []),
    ...(onShare
      ? [
          {
            key: 'share',
            label: t('contextMenu.share'),
            icon: <Share2 className="h-4 w-4" />,
            onSelect: () => onShare(dossier.id),
          },
        ]
      : []),
    ...(onArchive
      ? [
          {
            key: 'archive',
            label: t('contextMenu.archive'),
            icon: <Archive className="h-4 w-4" />,
            onSelect: handleArchive,
          },
        ]
      : []),
    ...(onDelete
      ? [
          {
            key: 'delete',
            label: t('contextMenu.delete'),
            icon: <Trash2 className="h-4 w-4" />,
            destructive: true,
            onSelect: () => onDelete(dossier.id),
          },
        ]
      : []),
  ]

  const cardContent = (
    <PersonCard
      dossier={dossier}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
      className={className}
    />
  )

  // Wrap with SwipeableCard if gestures are enabled
  if (swipeEnabled && (onFavorite || onArchive || contextMenuItems.length > 0)) {
    return (
      <SwipeableCard
        className={className}
        rightAction={
          onFavorite
            ? {
                type: 'favorite',
                label: isFavorited ? t('actions.unfavorite') : t('actions.favorite'),
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
                label: t('actions.archive'),
                icon: <Archive className="h-5 w-5" />,
                colorClass: 'bg-gray-500',
                onAction: handleArchive,
              }
            : undefined
        }
        contextMenuItems={contextMenuItems.length > 0 ? contextMenuItems : undefined}
        data-testid={`swipeable-person-card-${dossier.id}`}
      >
        {cardContent}
      </SwipeableCard>
    )
  }

  return cardContent
})

export default PersonCardSwipeable
