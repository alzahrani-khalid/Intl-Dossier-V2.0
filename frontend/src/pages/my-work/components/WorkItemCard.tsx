/**
 * Work Item Card Component
 * Individual card for a work item
 * Mobile-first, RTL-compatible
 */
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import {
  FileCheck,
  ListChecks,
  Inbox,
  AlertTriangle,
  Calendar,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { UnifiedWorkItem, WorkSource, TrackingType } from '@/types/unified-work.types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format, isToday, isTomorrow, isPast } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface WorkItemCardProps {
  item: UnifiedWorkItem;
}

export function WorkItemCard({ item }: WorkItemCardProps) {
  const { t, i18n } = useTranslation('my-work');
  const isRTL = i18n.language === 'ar';
  const locale = isRTL ? ar : enUS;

  // Source icon and color
  const sourceConfig: Record<WorkSource, { icon: LucideIcon; color: string; label: string }> = {
    commitment: {
      icon: FileCheck,
      color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
      label: t('source.commitment', 'Commitment'),
    },
    task: {
      icon: ListChecks,
      color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
      label: t('source.task', 'Task'),
    },
    intake: {
      icon: Inbox,
      color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
      label: t('source.intake', 'Intake'),
    },
  };

  // Tracking type badge
  const trackingTypeConfig: Record<TrackingType, { color: string; label: string }> = {
    delivery: {
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      label: t('trackingType.delivery', 'Delivery'),
    },
    follow_up: {
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      label: t('trackingType.followUp', 'Follow-up'),
    },
    sla: {
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      label: t('trackingType.sla', 'SLA'),
    },
  };

  // Priority badge
  const priorityConfig: Record<string, { color: string; label: string }> = {
    low: {
      color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      label: t('priority.low', 'Low'),
    },
    medium: {
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      label: t('priority.medium', 'Medium'),
    },
    high: {
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      label: t('priority.high', 'High'),
    },
    critical: {
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      label: t('priority.critical', 'Critical'),
    },
    urgent: {
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      label: t('priority.urgent', 'Urgent'),
    },
  };

  // Format deadline
  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return null;

    const date = new Date(deadline);
    const isPastDue = isPast(date);

    if (isToday(date)) {
      return { text: t('deadline.today', 'Today'), urgent: true };
    }
    if (isTomorrow(date)) {
      return { text: t('deadline.tomorrow', 'Tomorrow'), urgent: true };
    }
    if (isPastDue) {
      return {
        text: formatDistanceToNow(date, { addSuffix: true, locale }),
        urgent: true,
      };
    }

    return {
      text: format(date, 'MMM d', { locale }),
      urgent: false,
    };
  };

  const sourceInfo = sourceConfig[item.source];
  const trackingInfo = trackingTypeConfig[item.tracking_type];
  const priorityInfo = priorityConfig[item.priority] || priorityConfig.medium;
  const deadlineInfo = formatDeadline(item.deadline);
  const Icon = sourceInfo.icon;

  // Build link URL based on source
  const getItemLink = () => {
    switch (item.source) {
      case 'commitment':
        return `/commitments?id=${item.id}`;
      case 'task':
        return `/tasks/${item.id}`;
      case 'intake':
        return `/intake/tickets/${item.id}`;
      default:
        return '#';
    }
  };

  const itemLink = getItemLink();

  return (
    <Link
      to={itemLink}
      className="block"
    >
      <Card
        className={cn(
          'transition-all hover:shadow-md hover:border-primary/20 cursor-pointer',
          item.is_overdue && 'border-red-300 dark:border-red-800'
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          {/* Source Icon */}
          <div className={cn('p-2 rounded-lg shrink-0', sourceInfo.color)}>
            <Icon className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {/* Title */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <span
                className="font-medium text-sm sm:text-base hover:text-primary transition-colors line-clamp-2 text-start"
              >
                {item.title}
              </span>
              <ChevronRight
                className={cn(
                  'h-4 w-4 text-muted-foreground shrink-0 mt-1',
                  isRTL && 'rotate-180'
                )}
              />
            </div>

            {/* Description (truncated) */}
            {item.description && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mb-2 text-start">
                {item.description}
              </p>
            )}

            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* Source Badge */}
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                {sourceInfo.label}
              </Badge>

              {/* Tracking Type Badge */}
              <Badge className={cn('text-xs px-1.5 py-0', trackingInfo.color)} variant="secondary">
                {trackingInfo.label}
              </Badge>

              {/* Priority Badge */}
              <Badge className={cn('text-xs px-1.5 py-0', priorityInfo.color)} variant="secondary">
                {priorityInfo.label}
              </Badge>

              {/* Overdue Indicator */}
              {item.is_overdue && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0 gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {t('status.overdue', 'Overdue')}
                </Badge>
              )}

              {/* Deadline */}
              {deadlineInfo && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs px-1.5 py-0 gap-1',
                    deadlineInfo.urgent && 'border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-400'
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  {deadlineInfo.text}
                </Badge>
              )}

              {/* Days until due (on larger screens) */}
              {item.days_until_due !== null && !item.is_overdue && (
                <span className="hidden sm:inline text-xs text-muted-foreground">
                  {item.days_until_due === 0
                    ? t('deadline.dueToday', 'Due today')
                    : item.days_until_due === 1
                      ? t('deadline.dueTomorrow', 'Due tomorrow')
                      : t('deadline.dueInDays', { count: item.days_until_due })}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      </Card>
    </Link>
  );
}
