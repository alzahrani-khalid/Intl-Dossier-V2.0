/**
 * PoliticalAnalysis Component (Feature 029 - User Story 3 - T042)
 *
 * Displays political intelligence insights including:
 * - Leadership analysis
 * - Policy changes and reforms
 * - Political stability assessment
 * - Government effectiveness
 * - Diplomatic positioning
 *
 * Features:
 * - Stability indicators
 * - Data source attribution
 * - Confidence level indicators
 * - Mobile-first responsive design
 * - RTL support with logical properties
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshButton } from '@/components/intelligence/RefreshButton';
import { useRefreshIntelligence } from '@/hooks/useIntelligence';
import { Users, AlertCircle, CheckCircle, TrendingUp, Scale } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { IntelligenceReport } from '@/types/intelligence-reports.types';

interface PoliticalAnalysisProps {
  reports: IntelligenceReport[];
  dossierId: string;
}

export function PoliticalAnalysis({ reports, dossierId }: PoliticalAnalysisProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  // Get latest political report
  const latestReport = useMemo(() => {
    if (reports.length === 0) return null;
    return reports.sort(
      (a, b) =>
        new Date(b.last_refreshed_at || b.created_at).getTime() -
        new Date(a.last_refreshed_at || a.created_at).getTime()
    )[0];
  }, [reports]);

  // Refresh mutation
  const { mutate: refresh, isPending: isRefreshing } = useRefreshIntelligence();

  // Parse data sources (must be called before any returns)
  const dataSources = useMemo(() => {
    if (!latestReport?.data_sources_metadata) return [];
    return latestReport.data_sources_metadata.slice(0, 3); // Show top 3 sources
  }, [latestReport]);

  // Determine if report is stale (must be calculated before any returns)
  const isStale = useMemo(() => {
    return latestReport?.cache_expires_at &&
      new Date(latestReport.cache_expires_at) < new Date();
  }, [latestReport]);

  const handleRefresh = () => {
    refresh({
      entity_id: dossierId,
      intelligence_types: ['political'],
      priority: 'normal',
    });
  };

  // Empty state (after all hooks)
  if (reports.length === 0) {
    return (
      <Card className="h-full" dir={isRTL ? 'rtl' : 'ltr'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <CardTitle className="text-base sm:text-lg">
                {t('intelligence.types.political', 'Political Analysis')}
              </CardTitle>
            </div>
            <RefreshButton
              intelligenceTypes={['political']}
              onRefresh={() => handleRefresh()}
              isLoading={isRefreshing}
              showTypeSelection={false}
              size="sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Scale className="mx-auto h-12 w-12 mb-3 text-gray-400" />
            <p className="text-sm">
              {t('intelligence.noPoliticalData', 'No political intelligence available')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Track expand/collapse state
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <Card className="h-full flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 flex-shrink-0 text-purple-600 dark:text-purple-400" />
              <CardTitle className="text-base sm:text-lg truncate">
                {t('intelligence.types.political', 'Political Analysis')}
              </CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm line-clamp-2">
              {isRTL && latestReport?.title_ar ? latestReport.title_ar : latestReport?.title}
            </CardDescription>
          </div>
          <RefreshButton
            intelligenceTypes={['political']}
            onRefresh={() => handleRefresh()}
            isLoading={isRefreshing}
            showTypeSelection={false}
            size="sm"
            className="w-full sm:w-auto flex-shrink-0"
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {isStale && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              {t('intelligence.stale', 'Stale Data')}
            </Badge>
          )}
          <span className="text-muted-foreground">
            {t('intelligence.updated', 'Updated')}{' '}
            {formatDistanceToNow(
              new Date(latestReport?.last_refreshed_at || latestReport?.created_at || Date.now()),
              { addSuffix: true }
            )}
          </span>
        </div>

        {/* Executive Summary */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">
              {t('intelligence.executiveSummary', 'Executive Summary')}
            </h4>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-primary hover:underline"
            >
              {isExpanded
                ? t('intelligence.showLess', 'Show Less')
                : t('intelligence.showMore', 'Show More')}
            </button>
          </div>
          <p
            className={`text-sm text-muted-foreground whitespace-pre-wrap ${
              isExpanded ? '' : 'line-clamp-4'
            }`}
          >
            {isRTL && latestReport?.content_ar ? latestReport.content_ar : latestReport?.content}
          </p>
        </div>

        {/* Political Stability Indicators */}
        {latestReport?.metrics && Object.keys(latestReport.metrics).length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">
              {t('intelligence.stabilityIndicators', 'Stability Indicators')}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(latestReport.metrics).map(([key, value]) => (
                <div key={key} className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-medium text-muted-foreground capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm font-semibold">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Sources Attribution */}
        {dataSources.length > 0 && (
          <div className="border-t pt-3">
            <h4 className="text-xs font-medium mb-2 text-muted-foreground">
              {t('intelligence.sources', 'Data Sources')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {dataSources.map((source, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="text-xs bg-background hover:bg-muted"
                >
                  {source.source}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* AnythingLLM Attribution with Confidence */}
        {latestReport?.anythingllm_workspace_id && (
          <div className="text-xs text-muted-foreground border-t pt-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-medium">
                {t('intelligence.generatedBy', 'Generated by')}:
              </span>{' '}
              AnythingLLM{' '}
              {latestReport.anythingllm_response_metadata?.model && (
                <span>({latestReport.anythingllm_response_metadata.model})</span>
              )}
            </div>
            <span className="font-medium text-foreground">
              Confidence: {latestReport?.confidence_score || 0}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
