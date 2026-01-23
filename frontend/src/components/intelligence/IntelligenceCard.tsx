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
      className="p-4 transition-shadow duration-200 hover:shadow-lg sm:p-6"
      dir={isRTL ? 'rtl' : 'ltr'}
      role="article"
      aria-label={t('intelligence.cardLabel', {
        type: t(`intelligence.types.${intelligence.intelligence_type}`),
        defaultValue: `{{type}} intelligence report`,
      })}
    >
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-lg bg-primary/10 p-2 sm:p-3">
            <Icon className="size-5 text-primary sm:size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-base font-semibold text-foreground sm:text-lg">
              {title}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
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
                  className="flex items-center gap-1 bg-yellow-100 text-xs text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                >
                  <AlertTriangle className="size-3" />
                  {t('intelligence.stale', 'Stale')}
                </Badge>
              )}
              {intelligence.refresh_status === 'fresh' && !isStale && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 bg-green-100 text-xs text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  <CheckCircle className="size-3" />
                  {t('intelligence.fresh', 'Fresh')}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground sm:text-base">
          {content}
        </p>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
          <Clock className="size-4" />
          <span>
            {t('intelligence.last_updated', 'Updated')} {lastUpdated}
          </span>
        </div>

        {/* Data Sources Count */}
        {intelligence.data_sources_metadata && intelligence.data_sources_metadata.length > 0 && (
          <div className="text-xs text-muted-foreground sm:text-sm">
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
