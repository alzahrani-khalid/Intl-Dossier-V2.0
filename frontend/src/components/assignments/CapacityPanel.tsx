/**
 * CapacityPanel Component - Assignment Engine
 *
 * Displays staff or unit capacity with visual indicators.
 * Features:
 * - Shows current assignments / limit (utilization percentage)
 * - Color-coded progress bar: green (<75%), yellow (75-90%), red (>90%)
 * - Fetches data from GET /capacity/check endpoint
 * - Bilingual support (Arabic/English)
 * - Responsive layout
 *
 * @see specs/013-assignment-engine-sla/tasks.md#T056
 */

import { useTranslation } from 'react-i18next';
import { useCapacityCheck } from '@/hooks/useCapacityCheck';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, User, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper function for capacity status color
function getCapacityStatusColor(utilization: number): 'default' | 'secondary' | 'destructive' {
  if (utilization >= 90) return 'destructive';
  if (utilization >= 75) return 'secondary';
  return 'default';
}

export interface CapacityPanelProps {
  staffId?: string;
  unitId?: string;
  className?: string;
  compact?: boolean;
}

export function CapacityPanel({ staffId, unitId, className, compact = false }: CapacityPanelProps) {
  const { t } = useTranslation(['assignments', 'common']);

  // Only one of staffId or unitId should be provided
  if (!staffId && !unitId) {
    return (
      <Card className={cn('capacity-panel', className)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">{t('assignments:capacity.error.noIdProvided')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { data, isLoading, isError, error } = useCapacityCheck({
    staff_id: staffId,
    unit_id: unitId,
  });

  const getProgressBarColor = (utilization: number): string => {
    if (utilization < 75) return 'bg-green-500';
    if (utilization >= 75 && utilization < 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusBadgeVariant = (utilization: number): 'default' | 'secondary' | 'destructive' => {
    return getCapacityStatusColor(utilization);
  };

  const getStatusText = (utilization: number): string => {
    if (utilization < 75) return t('assignments:capacity.status.available');
    if (utilization >= 75 && utilization < 90) return t('assignments:capacity.status.nearCapacity');
    return t('assignments:capacity.status.atCapacity');
  };

  if (compact) {
    // Compact version for smaller spaces
    return (
      <div className={cn('capacity-panel-compact space-y-2', className)}>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('common:loading')}...
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            {error?.message}
          </div>
        )}

        {data && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {staffId ? <User className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                <span className="text-sm font-medium">
                  {data.wip_current}/{data.wip_limit}
                </span>
              </div>
              <Badge variant={getStatusBadgeVariant(data.utilization_pct)} className="text-xs">
                {data.utilization_pct.toFixed(0)}%
              </Badge>
            </div>
            <Progress
              value={data.utilization_pct}
              className={cn("h-2", getProgressBarColor(data.utilization_pct))}
            />
          </>
        )}
      </div>
    );
  }

  // Full card version
  return (
    <Card className={cn('capacity-panel', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {staffId ? <User className="w-5 h-5" /> : <Users className="w-5 h-5" />}
          {t('assignments:capacity.title')}
        </CardTitle>
        <CardDescription>
          {staffId
            ? t('assignments:capacity.staffDescription')
            : t('assignments:capacity.unitDescription')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            {t('common:loading')}...
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="font-medium">{t('assignments:capacity.error.title')}</p>
              <p className="text-sm">{error?.message}</p>
            </div>
          </div>
        )}

        {data && (
          <>
            {/* Capacity Stats */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {data.wip_current}
                  <span className="text-gray-500 dark:text-gray-400">/{data.wip_limit}</span>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('assignments:capacity.currentAssignments')}
                </p>
              </div>
              <Badge variant={getStatusBadgeVariant(data.utilization_pct)} className="text-lg px-3 py-1">
                {data.utilization_pct.toFixed(1)}%
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {t('assignments:capacity.utilization')}
                </span>
                <span className="font-medium">{getStatusText(data.utilization_pct)}</span>
              </div>
              <Progress
                value={data.utilization_pct}
                className={cn("h-3", getProgressBarColor(data.utilization_pct))}
              />
            </div>

            {/* Capacity Breakdown */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('assignments:capacity.available')}
                </p>
                <p className="text-lg font-semibold">{Math.max(0, data.wip_limit - data.wip_current)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('assignments:capacity.limit')}
                </p>
                <p className="text-lg font-semibold">{data.wip_limit}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
