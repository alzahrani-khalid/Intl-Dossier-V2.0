/**
 * PositionCard Component (T044)
 * Displays position information with attachment actions
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link2, Trash2, Eye, Calendar } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import type { Position } from '@/types/position'
import type { PositionDossierLinkType } from '@/domains/positions/types'
import { useDirection } from '@/hooks/useDirection'

export interface PositionCardProps {
  position: Position & { link_type?: PositionDossierLinkType }
  onClick?: () => void
  onAttach?: () => void
  onDetach?: () => void
  context?: 'dossier' | 'engagement' | 'all' | 'library'
  engagementAttachmentCount?: number
  isAttached?: boolean
}

export const PositionCard: React.FC<PositionCardProps> = ({
  position,
  onClick,
  onAttach,
  onDetach,
  context = 'all',
  engagementAttachmentCount = 0,
  isAttached = false,
}) => {
  const { t } = useTranslation('positions')
  const { isRTL } = useDirection()
  const locale = isRTL ? ar : enUS

  // Get localized title and content - handle both old and new schema
  const title = (position as any).topic || (isRTL ? position.title_ar : position.title_en)
  const content = (position as any).rationale || (isRTL ? position.content_ar : position.content_en)

  // Get status from approval object or direct field
  const positionStatus = (position as any).approval?.status || position.status || 'draft'

  // Truncate content for preview (200 characters)
  const contentPreview = content
    ? content.length > 200
      ? `${content.substring(0, 200)}...`
      : content
    : t('card.noContent')

  // Status badge variant
  const getStatusVariant = (
    status: string,
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'published':
      case 'approved':
        return 'default'
      case 'under_review':
      case 'review':
        return 'secondary'
      case 'draft':
        return 'outline'
      case 'unpublished':
        return 'destructive'
      default:
        return 'default'
    }
  }

  // Link type badge configuration (T059). Values mirror the canonical live
  // position_dossier_links_link_type_check; labels come from the positions
  // namespace so Arabic resolves (round-13 vocabulary realign).
  const getLinkTypeBadge = (linkType?: PositionDossierLinkType) => {
    if (!linkType) return null

    const className: Record<PositionDossierLinkType, string> = {
      applies_to: 'bg-accent/10 text-accent dark:bg-accent/30',
      related_to: 'bg-muted/10 text-muted-foreground dark:bg-muted/30',
      endorsed_by: 'bg-success/10 text-success dark:bg-success/30',
      opposed_by: 'bg-destructive/10 text-destructive dark:bg-destructive/30',
    }

    return {
      label: t(`position_dossier_links.types.${linkType}`),
      className: className[linkType],
    }
  }

  return (
    <Card
      className="h-full transition-colors hover:bg-line-soft flex flex-col"
      role="article"
      aria-label={title}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <h3
              className="line-clamp-2 text-lg font-semibold leading-tight"
              onClick={onClick}
              role={onClick ? 'button' : undefined}
              tabIndex={onClick ? 0 : undefined}
              onKeyDown={
                onClick
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onClick()
                      }
                    }
                  : undefined
              }
              style={{ cursor: onClick ? 'pointer' : 'default' }}
            >
              {title}
            </h3>
            <Badge variant={getStatusVariant(positionStatus)} className="shrink-0">
              {t(`status.${positionStatus}`)}
            </Badge>
          </div>
          {/* Link Type Badge - T059 */}
          {position.link_type && (
            <div className="flex items-center gap-2">
              <Badge
                className={`text-xs ${getLinkTypeBadge(position.link_type)?.className}`}
                variant="outline"
              >
                {getLinkTypeBadge(position.link_type)?.label}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3 flex-1 flex flex-col">
        {/* Content Preview */}
        <p className="line-clamp-3 text-sm text-muted-foreground">{contentPreview}</p>

        {/* Metadata - Pushed to bottom of CardContent */}
        <div className="mt-auto pt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {position.thematic_category && (
            <Badge variant="outline" className="text-xs">
              {position.thematic_category}
            </Badge>
          )}

          {engagementAttachmentCount > 0 && (
            <div className="flex items-center gap-1">
              <Link2 className="h-3 w-3" />
              <span>{t('card.attachedTo', { count: engagementAttachmentCount })}</span>
            </div>
          )}
        </div>

        {/* Date - Always above the button */}
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{format(new Date(position.created_at), 'PP', { locale })}</span>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 pt-3">
        {/* View Button */}
        {onClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClick}
            aria-label={t('card.view', { title })}
            className="flex-1"
          >
            <Eye className="me-2 h-4 w-4" />
            {t('card.viewButton')}
          </Button>
        )}

        {/* Attach/Detach Actions */}
        {context === 'engagement' && (
          <>
            {isAttached ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDetach}
                disabled={!onDetach}
                aria-label={t('card.detach', { title })}
                aria-keyshortcuts="Delete"
              >
                <Trash2 className="me-2 h-4 w-4" />
                {t('card.detachButton')}
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={onAttach}
                disabled={!onAttach}
                aria-label={t('card.attach', { title })}
                aria-keyshortcuts="Enter"
              >
                <Link2 className="me-2 h-4 w-4" />
                {t('card.attachButton')}
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  )
}
