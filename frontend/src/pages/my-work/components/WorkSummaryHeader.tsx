/**
 * Work Summary Header Component
 * Displays key stats: Total Active, Overdue, Due Today, Due This Week
 * Mobile-first, RTL-compatible
 */
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Calendar, CalendarDays, ListTodo } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserWorkSummary } from '@/types/unified-work.types';
import { cn } from '@/lib/utils';

interface WorkSummaryHeaderProps {
  summary?: UserWorkSummary;
  isLoading: boolean;
  onFilterClick: (filter: string | undefined) => void;
  currentFilter?: string;
}

export function WorkSummaryHeader({
  summary,
  isLoading,
  onFilterClick,
  currentFilter,
}: WorkSummaryHeaderProps) {
  const { t, i18n } = useTranslation('my-work');
  const isRTL = i18n.language === 'ar';

  const stats = [
    {
      key: 'active',
      label: t('stats.totalActive', 'Total Active'),
      value: summary?.total_active || 0,
      icon: ListTodo,
      color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
      filter: undefined, // No filter for "all active"
    },
    {
      key: 'overdue',
      label: t('stats.overdue', 'Overdue'),
      value: summary?.overdue_count || 0,
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
      filter: 'overdue',
    },
    {
      key: 'due-today',
      label: t('stats.dueToday', 'Due Today'),
      value: summary?.due_today || 0,
      icon: Calendar,
      color: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30',
      filter: 'due-today',
    },
    {
      key: 'due-week',
      label: t('stats.dueThisWeek', 'Due This Week'),
      value: summary?.due_this_week || 0,
      icon: CalendarDays,
      color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
      filter: 'due-week',
    },
  ];

  if (isLoading) {
    return (
      <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:grid-cols-4 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-3 sm:p-4">
              <Skeleton className="mb-2 h-4 w-20" />
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div
      className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:grid-cols-4 sm:gap-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        const isActive = currentFilter === stat.filter || (stat.key === 'active' && !currentFilter);

        return (
          <Card
            key={stat.key}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              isActive && 'ring-2 ring-primary ring-offset-2'
            )}
            onClick={() => onFilterClick(stat.filter === currentFilter ? undefined : stat.filter)}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={cn('p-2 rounded-lg', stat.color)}>
                  <Icon className="size-4 sm:size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-start text-xs text-muted-foreground sm:text-sm">
                    {stat.label}
                  </p>
                  <p className="text-start text-xl font-bold sm:text-2xl">
                    {stat.value.toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
