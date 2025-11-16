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
      <div className="space-y-4 animate-pulse" dir={isRTL ? 'rtl' : 'ltr'}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="grid grid-cols-3 gap-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
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
        className="px-4 py-3 text-sm text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/20 rounded-lg"
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
          className="space-y-2 px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => handleGroupClick(aggregation.groupValue)}
          onKeyDown={(e) => handleKeyDown(e, aggregation.groupValue)}
          tabIndex={0}
          role="button"
          aria-label={`${t('dashboard.viewDossiersIn')} ${aggregation.groupValue}: ${t('dashboard.averageHealthScore')} ${aggregation.averageHealthScore}`}
        >
          {/* Header: Group Name + Health Label */}
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">
              {aggregation.groupValue}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {getHealthScoreLabel(aggregation.averageHealthScore)}
              </span>
              <span className={`text-xs sm:text-sm font-medium ${getHealthScoreColor(aggregation.averageHealthScore)}`}>
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
            <div className="h-2 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 text-xs">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 dark:bg-green-600 rounded-full" />
              <span className="text-gray-600 dark:text-gray-400">
                {t('dashboard.excellent')}: {aggregation.healthDistribution.excellent}
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 dark:bg-yellow-600 rounded-full" />
              <span className="text-gray-600 dark:text-gray-400">
                {t('dashboard.good')}: {aggregation.healthDistribution.good}
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-orange-500 dark:bg-orange-600 rounded-full" />
              <span className="text-gray-600 dark:text-gray-400">
                {t('dashboard.fair')}: {aggregation.healthDistribution.fair}
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 dark:bg-red-600 rounded-full" />
              <span className="text-gray-600 dark:text-gray-400">
                {t('dashboard.poor')}: {aggregation.healthDistribution.poor}
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-around gap-2 sm:gap-4 text-xs">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 dark:bg-green-600 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">
              {t('dashboard.excellent')} (80-100)
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 dark:bg-yellow-600 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">
              {t('dashboard.good')} (60-79)
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-orange-500 dark:bg-orange-600 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">
              {t('dashboard.fair')} (40-59)
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 dark:bg-red-600 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">
              {t('dashboard.poor')} (0-39)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
