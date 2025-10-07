/**
 * PositionCard Component (T044)
 * Displays position information with attachment actions
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link2, Trash2, Eye, Calendar } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import type { Position } from '@/types/position';

export interface PositionCardProps {
  position: Position;
  onClick?: () => void;
  onAttach?: () => void;
  onDetach?: () => void;
  context?: 'dossier' | 'engagement' | 'all';
  engagementAttachmentCount?: number;
  isAttached?: boolean;
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
  const { t, i18n } = useTranslation('positions');
  const isRTL = i18n.language === 'ar';
  const locale = i18n.language === 'ar' ? ar : enUS;

  // Get localized title and content - handle both old and new schema
  const title = (position as any).topic || (i18n.language === 'ar' ? position.title_ar : position.title_en);
  const content = (position as any).rationale || (i18n.language === 'ar' ? position.content_ar : position.content_en);

  // Get status from approval object or direct field
  const positionStatus = (position as any).approval?.status || position.status || 'draft';

  // Get category for display
  const category = (position as any).category || position.thematic_category;

  // Truncate content for preview (200 characters)
  const contentPreview = content
    ? content.length > 200
      ? `${content.substring(0, 200)}...`
      : content
    : t('card.noContent');

  // Status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'published':
      case 'approved':
        return 'success';
      case 'under_review':
      case 'review':
        return 'secondary';
      case 'draft':
        return 'outline';
      case 'unpublished':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Card
      className="h-full transition-shadow hover:shadow-md flex flex-col"
      role="article"
      aria-label={title}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="line-clamp-2 text-lg font-semibold leading-tight"
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
          >
            {title}
          </h3>
          <Badge variant={getStatusVariant(positionStatus)} className="shrink-0">
            {t(`status.${positionStatus}`)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3 flex-1 flex flex-col">
        {/* Content Preview */}
        <p
          className="line-clamp-3 text-sm text-muted-foreground"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {contentPreview}
        </p>

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
              <span>
                {t('card.attachedTo', { count: engagementAttachmentCount })}
              </span>
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
  );
};
