/**
 * IntelligenceInsight Component (Feature 029 - User Story 4 - T057)
 *
 * Inline intelligence widget for embedding contextual AI insights within dossier sections.
 * Compact version of IntelligenceCard optimized for sidebar/inline display.
 * Mobile-first, RTL-compatible, WCAG AA compliant.
 *
 * Features:
 * - Displays single intelligence insight with confidence badge
 * - Per-widget refresh button
 * - Stale data indicator
 * - "View Full Report" link to Intelligence tab
 * - Mobile-responsive: full-width on mobile, side panel on desktop
 * - RTL support with logical properties
 */

import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  CheckCircle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Link } from '@tanstack/react-router';

interface IntelligenceInsightProps {
  intelligence: IntelligenceReport;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  dossierType?: string;
  dossierId: string;
}

const intelligenceIcons = {
  economic: TrendingUp,
  political: Users,
  security: Shield,
  bilateral: Globe,
  general: Globe,
} as const;

export function IntelligenceInsight({
  intelligence,
  onRefresh,
  isRefreshing = false,
  dossierType = 'countries',
  dossierId
}: IntelligenceInsightProps) {
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

  // Truncate content for inline display (show first 200 characters)
  const truncatedContent = content.length > 200 ? `${content.substring(0, 200)}...` : content;

  return (
    <Card
      className="p-3 sm:p-4 bg-muted/30 border-muted hover:border-primary/50 transition-all duration-200"
      dir={isRTL ? 'rtl' : 'ltr'}
      role="complementary"
      aria-label={t('intelligence.inlineWidgetLabel', {
        type: t(`intelligence.types.${intelligence.intelligence_type}`),
        defaultValue: `{{type}} intelligence insight`,
      })}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div className="rounded-md bg-primary/10 p-1.5 shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-foreground line-clamp-2">
              {title}
            </h4>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <Badge
                variant="outline"
                className="text-xs py-0 px-1.5"
              >
                {t(`intelligence.types.${intelligence.intelligence_type}`, intelligence.intelligence_type)}
              </Badge>
              <ConfidenceBadge level={getConfidenceLevel(intelligence.confidence_score)} size="sm" />
              {isStale && (
                <Badge
                  variant="secondary"
                  className="text-xs py-0 px-1.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 flex items-center gap-1"
                >
                  <AlertTriangle className="h-2.5 w-2.5" />
                  {t('intelligence.stale', 'Stale')}
                </Badge>
              )}
              {intelligence.refresh_status === 'fresh' && !isStale && (
                <Badge
                  variant="secondary"
                  className="text-xs py-0 px-1.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center gap-1"
                >
                  <CheckCircle className="h-2.5 w-2.5" />
                  {t('intelligence.fresh', 'Fresh')}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 p-0 shrink-0"
            aria-label={t('intelligence.refresh', 'Refresh intelligence')}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {truncatedContent}
        </p>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {t('intelligence.updated', 'Updated')} {lastUpdated}
          </span>
        </div>

        {/* View Full Report Link */}
        <Link
          to={`/dossiers/${dossierType}/${dossierId}`}
          search={{ tab: 'intelligence' }}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline group"
        >
          <span>{t('intelligence.view_full_report', 'View Full Report')}</span>
          <ExternalLink className={`h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${isRTL ? 'rotate-180' : ''}`} />
        </Link>
      </div>
    </Card>
  );
}
