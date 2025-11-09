import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfidenceBadge } from './ConfidenceBadge';
import type { IntelligenceReport } from '@/types/intelligence-reports.types';
import { getConfidenceLevel } from '@/utils/intelligence-helpers';
import {
  TrendingUp,
  Shield,
  Users,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface IntelligenceCardProps {
  intelligence: IntelligenceReport;
  showFullAnalysis?: boolean;
  onRefresh?: () => void;
}

const intelligenceIcons = {
  economic: TrendingUp,
  political: Users,
  security: Shield,
  bilateral: Globe,
  general: Globe,
} as const;

export function IntelligenceCard({
  intelligence,
  showFullAnalysis = false
}: IntelligenceCardProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';
  const locale = isRTL ? ar : enUS;

  const Icon = intelligenceIcons[intelligence.intelligence_type] || Globe;

  // Determine if cache is stale
  const isStale = intelligence.cache_expires_at
    ? new Date(intelligence.cache_expires_at) < new Date()
    : false;

  // Get localized content (title and content with fallback)
  const title = (isRTL && intelligence.title_ar) ? intelligence.title_ar : intelligence.title;
  const content = (isRTL && intelligence.content_ar) ? intelligence.content_ar : intelligence.content;

  // Format last updated timestamp
  const lastUpdated = intelligence.last_refreshed_at
    ? formatDistanceToNow(new Date(intelligence.last_refreshed_at), {
        addSuffix: true,
        locale,
      })
    : t('intelligence.never_updated', 'Never updated');

  return (
    <Card
      className="p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200"
      dir={isRTL ? 'rtl' : 'ltr'}
      role="article"
      aria-label={t('intelligence.cardLabel', {
        type: t(`intelligence.types.${intelligence.intelligence_type}`),
        defaultValue: `{{type}} intelligence report`,
      })}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 sm:p-3 shrink-0">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-foreground line-clamp-2">
              {title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge
                variant="outline"
                className="text-xs"
              >
                {t(`intelligence.types.${intelligence.intelligence_type}`, intelligence.intelligence_type)}
              </Badge>
              <ConfidenceBadge level={getConfidenceLevel(intelligence.confidence_score)} />
              {isStale && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 flex items-center gap-1"
                >
                  <AlertTriangle className="h-3 w-3" />
                  {t('intelligence.stale', 'Stale')}
                </Badge>
              )}
              {intelligence.refresh_status === 'fresh' && !isStale && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center gap-1"
                >
                  <CheckCircle className="h-3 w-3" />
                  {t('intelligence.fresh', 'Fresh')}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {t('intelligence.last_updated', 'Updated')} {lastUpdated}
          </span>
        </div>

        {/* Data Sources Count */}
        {intelligence.data_sources_metadata && intelligence.data_sources_metadata.length > 0 && (
          <div className="text-xs sm:text-sm text-muted-foreground">
            {t('intelligence.sources_count', {
              count: intelligence.data_sources_metadata.length,
              defaultValue: `{{count}} sources`,
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
