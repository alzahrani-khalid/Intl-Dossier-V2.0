/**
 * Relationship Health Chart Component
 * Feature: 030-health-commitment - User Story 2
 *
 * Displays aggregated health scores grouped by region/bloc/classification
 * Connects to real data via useDashboardHealthAggregations hook
 * Mobile-first, RTL-compatible, WCAG AA compliant
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { useDashboardHealthAggregations } from '@/hooks/useDashboardHealthAggregations';
import { getHealthScoreColor, getHealthScoreLabel } from '@/services/dossier-stats.service';

interface RelationshipHealthChartProps {
  /**
   * Field to group aggregations by (default: 'region')
   * - 'region': Group countries by region
   * - 'org_type': Group organizations by organization type
   */
  groupBy?: 'region' | 'org_type';
  /**
   * Optional filter to apply to aggregations
   */
  filter?: {
    dossierType?: 'country' | 'organization' | 'forum';
    minHealthScore?: number;
  };
}

export function RelationshipHealthChart({
  groupBy = 'region',
  filter,
}: RelationshipHealthChartProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();

  // Fetch dashboard aggregations
  const { data, isLoading, isError, error } = useDashboardHealthAggregations({
    groupBy,
    filter,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-6 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="grid grid-cols-3 gap-2">
              <div className="h-4 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div
        className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400"
        dir={isRTL ? 'rtl' : 'ltr'}
        role="alert"
        aria-live="polite"
      >
        <strong className="font-medium">{t('error.failedToLoadData')}:</strong>{' '}
        {error?.message || t('error.unknownError')}
      </div>
    );
  }

  // Empty state
  if (!data || data.aggregations.length === 0) {
    return (
      <div
        className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <p className="text-sm sm:text-base">{t('dashboard.noHealthData')}</p>
        <p className="mt-2 text-xs sm:text-sm">{t('dashboard.healthDataHint')}</p>
      </div>
    );
  }

  /**
   * Get health color class for background/border
   */
  const getHealthBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500 dark:bg-green-600';
    if (score >= 60) return 'bg-yellow-500 dark:bg-yellow-600';
    if (score >= 40) return 'bg-orange-500 dark:bg-orange-600';
    return 'bg-red-500 dark:bg-red-600';
  };

  /**
   * Navigate to dossier list filtered by region and sorted by health (lowest first)
   */
  const handleGroupClick = (groupValue: string) => {
    navigate({
      to: '/dossiers',
      search: {
        [groupBy]: groupValue,
        sort: 'health:asc', // Show lowest health first for attention
      },
    });
  };

  /**
   * Handle keyboard navigation (Enter key)
   */
  const handleKeyDown = (event: React.KeyboardEvent, groupValue: string) => {
    if (event.key === 'Enter') {
      handleGroupClick(groupValue);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {data.aggregations.map((aggregation) => (
        <div
          key={aggregation.groupValue}
          className="cursor-pointer space-y-2 rounded-lg border border-gray-200 px-3 py-2 transition-colors hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:hover:border-gray-600 sm:px-4 sm:py-3"
          onClick={() => handleGroupClick(aggregation.groupValue)}
          onKeyDown={(e) => handleKeyDown(e, aggregation.groupValue)}
          tabIndex={0}
          role="button"
          aria-label={`${t('dashboard.viewDossiersIn')} ${aggregation.groupValue}: ${t('dashboard.averageHealthScore')} ${aggregation.averageHealthScore}`}
        >
          {/* Header: Group Name + Health Label */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-white sm:text-base">
              {aggregation.groupValue}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                {getHealthScoreLabel(aggregation.averageHealthScore)}
              </span>
              <span className={`text-xs font-medium sm:text-sm ${getHealthScoreColor(aggregation.averageHealthScore)}`}>
                {aggregation.averageHealthScore}
              </span>
            </div>
          </div>

          {/* Health Score Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">
                {t('dashboard.overallHealth')}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {aggregation.dossierCount} {t('dashboard.dossiers')}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 sm:h-3">
              <div
                className={`h-full ${getHealthBgColor(aggregation.averageHealthScore)} transition-all`}
                style={{ width: `${aggregation.averageHealthScore}%` }}
                role="progressbar"
                aria-valuenow={aggregation.averageHealthScore}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t('dashboard.healthScore')}
              />
            </div>
          </div>

          {/* Health Distribution Breakdown */}
          <div className="grid grid-cols-2 gap-1 text-xs sm:grid-cols-4 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="size-2 rounded-full bg-green-500 dark:bg-green-600 sm:size-3" />
              <span className="text-gray-600 dark:text-gray-400">
                {t('dashboard.excellent')}: {aggregation.healthDistribution.excellent}
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="size-2 rounded-full bg-yellow-500 dark:bg-yellow-600 sm:size-3" />
              <span className="text-gray-600 dark:text-gray-400">
                {t('dashboard.good')}: {aggregation.healthDistribution.good}
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="size-2 rounded-full bg-orange-500 dark:bg-orange-600 sm:size-3" />
              <span className="text-gray-600 dark:text-gray-400">
                {t('dashboard.fair')}: {aggregation.healthDistribution.fair}
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="size-2 rounded-full bg-red-500 dark:bg-red-600 sm:size-3" />
              <span className="text-gray-600 dark:text-gray-400">
                {t('dashboard.poor')}: {aggregation.healthDistribution.poor}
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="border-t border-gray-200 pt-3 dark:border-gray-700 sm:pt-4">
        <div className="flex flex-wrap items-center justify-around gap-2 text-xs sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="size-2 rounded-full bg-green-500 dark:bg-green-600 sm:size-3" />
            <span className="text-gray-600 dark:text-gray-400">
              {t('dashboard.excellent')} (80-100)
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="size-2 rounded-full bg-yellow-500 dark:bg-yellow-600 sm:size-3" />
            <span className="text-gray-600 dark:text-gray-400">
              {t('dashboard.good')} (60-79)
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="size-2 rounded-full bg-orange-500 dark:bg-orange-600 sm:size-3" />
            <span className="text-gray-600 dark:text-gray-400">
              {t('dashboard.fair')} (40-59)
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="size-2 rounded-full bg-red-500 dark:bg-red-600 sm:size-3" />
            <span className="text-gray-600 dark:text-gray-400">
              {t('dashboard.poor')} (0-39)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
