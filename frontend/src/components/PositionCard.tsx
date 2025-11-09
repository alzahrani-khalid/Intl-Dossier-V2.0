import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import type { Position } from '../types/position';

interface PositionCardProps {
  position: Position;
}

export function PositionCard({ position }: PositionCardProps) {
  const { t, i18n } = useTranslation('positions');
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  const handleClick = () => {
    navigate({ to: '/positions/$positionId', params: { positionId: position.id } });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Get bilingual title
  const title = isRTL ? position.title_ar : position.title_en;

  // Get content preview (first 150 chars)
  const content = isRTL ? position.content_ar : position.content_en;
  const contentPreview = content
    ? content.length > 150
      ? `${content.substring(0, 150)}...`
      : content
    : null;

  // Get badge variant based on status
  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'published':
        return 'default';
      case 'approved':
        return 'secondary';
      case 'under_review':
        return 'outline';
      case 'draft':
      default:
        return 'outline';
    }
  };

  // Get category badge color
  const getCategoryBadgeClass = (category?: string): string => {
    if (!category) return '';

    switch (category.toLowerCase()) {
      case 'trade':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200';
      case 'climate':
        return 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200';
      case 'security':
        return 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200';
      case 'technology':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200';
      case 'health':
        return 'bg-pink-100 text-pink-800 hover:bg-pink-200 dark:bg-pink-900 dark:text-pink-200';
      case 'education':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="cursor-pointer transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label={t('viewDetails') + ': ' + title}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-lg font-semibold">
            {title}
          </CardTitle>
          <Badge
            variant={getStatusVariant(position.status)}
            className="shrink-0 whitespace-nowrap"
            aria-label={`${t('fields.status')}: ${t(`statuses.${position.status}`)}`}
          >
            {t(`statuses.${position.status}`)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Category */}
          {position.thematic_category && (
            <div className="flex flex-wrap gap-2">
              <Badge
                className={getCategoryBadgeClass(position.thematic_category)}
                aria-label={`${t('fields.thematicCategory')}: ${t(`thematicCategories.${position.thematic_category}`, position.thematic_category)}`}
              >
                {t(`thematicCategories.${position.thematic_category}`, position.thematic_category)}
              </Badge>
            </div>
          )}

          {/* Content Preview */}
          {contentPreview && (
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {contentPreview}
            </p>
          )}

          {/* Consistency Score */}
          {position.consistency_score !== undefined && position.consistency_score !== null && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {t('fields.consistencyScore')}:
              </span>
              <Badge
                variant={position.consistency_score >= 80 ? 'default' : position.consistency_score >= 60 ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {position.consistency_score}/100
              </Badge>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t pt-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>
                {t('fields.version')}: {position.version}
              </span>
              <span>
                {t('fields.updated')}: {new Date(position.updated_at).toLocaleDateString(i18n.language)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
