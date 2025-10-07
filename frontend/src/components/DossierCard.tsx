import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import type { Dossier } from '../types/dossier';

interface DossierCardProps {
  dossier: Dossier;
}

export function DossierCard({ dossier }: DossierCardProps) {
  const { t, i18n } = useTranslation('dossiers');
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  const handleClick = () => {
    navigate({ to: `/dossiers/${dossier.id}` });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Get bilingual name
  const name = isRTL ? dossier.name_ar : dossier.name_en;

  // Get summary preview (first 100 chars)
  const summary = isRTL ? dossier.summary_ar : dossier.summary_en;
  const summaryPreview = summary
    ? summary.length > 100
      ? `${summary.substring(0, 100)}...`
      : summary
    : null;

  // Get badge variant based on sensitivity
  const getSensitivityVariant = (level: string): 'default' | 'secondary' | 'destructive' => {
    switch (level) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
      default:
        return 'secondary';
    }
  };

  // Get type badge color
  const getTypeBadgeClass = (type: string): string => {
    switch (type) {
      case 'country':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'organization':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'forum':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'theme':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      default:
        return '';
    }
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="cursor-pointer transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label={t('viewDetails') + ': ' + name}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {name}
          </CardTitle>
          <div className="flex gap-1 flex-shrink-0">
            <Badge
              variant={getSensitivityVariant(dossier.sensitivity_level)}
              className="whitespace-nowrap"
              aria-label={`${t('fields.sensitivity')}: ${t(`sensitivity.${dossier.sensitivity_level}`)}`}
            >
              {t(`sensitivity.${dossier.sensitivity_level}`)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Type and Status */}
          <div className="flex gap-2 flex-wrap">
            <Badge
              className={getTypeBadgeClass(dossier.type)}
              aria-label={`${t('fields.type')}: ${t(`types.${dossier.type}`)}`}
            >
              {t(`types.${dossier.type}`)}
            </Badge>
            <Badge
              variant="outline"
              aria-label={`${t('fields.status')}: ${t(`statuses.${dossier.status}`)}`}
            >
              {t(`statuses.${dossier.status}`)}
            </Badge>
          </div>

          {/* Summary Preview */}
          {summaryPreview && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {summaryPreview}
            </p>
          )}

          {/* Tags */}
          {dossier.tags && dossier.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {dossier.tags.slice(0, 3).map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs"
                  aria-label={`${t('fields.tags')}: ${tag}`}
                >
                  {tag}
                </Badge>
              ))}
              {dossier.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{dossier.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <div className="flex justify-between items-center">
              <span>
                {t('fields.version')}: {dossier.version}
              </span>
              <span>
                {t('fields.updated')}: {new Date(dossier.updated_at).toLocaleDateString(i18n.language)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}