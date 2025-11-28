/**
 * StatusTimeline Component v1.1
 * Feature: 031-commitments-management
 * Task: T056
 *
 * Displays commitment status history as a vertical timeline:
 * - Status changes with timestamps
 * - User who made the change
 * - Notes associated with changes
 * - Mobile-first, RTL-compatible
 */

import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Clock,
  ArrowRight,
  CheckCircle,
  XCircle,
  User,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useCommitmentStatusHistory } from '@/hooks/useCommitments';
import type { CommitmentStatus, CommitmentStatusHistory } from '@/types/commitment.types';
import { STATUS_COLORS } from '@/types/commitment.types';

export interface StatusTimelineProps {
  commitmentId: string;
  createdAt?: string | null;
  createdBy?: string | null;
}

// Status icons mapping
const statusIcons: Record<CommitmentStatus, React.ReactNode> = {
  pending: <Clock className="size-4" />,
  in_progress: <ArrowRight className="size-4" />,
  completed: <CheckCircle className="size-4" />,
  cancelled: <XCircle className="size-4" />,
  overdue: <AlertTriangle className="size-4" />,
};

export function StatusTimeline({
  commitmentId,
  createdAt,
  createdBy,
}: StatusTimelineProps) {
  const { t, i18n } = useTranslation('commitments');
  const isRTL = i18n.language === 'ar';

  // Fetch status history
  const { data: history, isLoading, isError } = useCommitmentStatusHistory(commitmentId);

  // Format date/time
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="size-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        {t('detail.noHistory')}
      </p>
    );
  }

  // Empty state
  if (!history?.length && !createdAt) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        {t('detail.noHistory')}
      </p>
    );
  }

  return (
    <div className="space-y-0" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Status history entries */}
      {history?.map((entry, index) => (
        <TimelineEntry
          key={entry.id}
          entry={entry}
          isFirst={index === 0}
          isLast={index === (history.length - 1) && !createdAt}
          formatDateTime={formatDateTime}
        />
      ))}

      {/* Creation entry */}
      {createdAt && (
        <div className="flex gap-3">
          {/* Timeline connector */}
          <div className="flex flex-col items-center">
            <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <FileText className="size-4 text-muted-foreground" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 pb-4">
            <p className="text-sm font-medium text-start">
              {t('timeline.created')}
            </p>
            <p className="text-xs text-muted-foreground text-start mt-0.5">
              {formatDateTime(createdAt)}
            </p>
            {createdBy && (
              <p className="text-xs text-muted-foreground text-start mt-0.5 flex items-center gap-1">
                <User className="size-3" />
                {t('timeline.by', { user: createdBy })}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Individual timeline entry component
interface TimelineEntryProps {
  entry: CommitmentStatusHistory;
  isFirst: boolean;
  isLast: boolean;
  formatDateTime: (dateStr: string) => string;
}

function TimelineEntry({
  entry,
  isFirst,
  isLast,
  formatDateTime,
}: TimelineEntryProps) {
  const { t, i18n } = useTranslation('commitments');
  const isRTL = i18n.language === 'ar';

  // Guard against undefined status with fallback colors
  const newStatusColors = entry.new_status && STATUS_COLORS[entry.new_status]
    ? STATUS_COLORS[entry.new_status]
    : { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-300' };

  return (
    <div className="flex gap-3">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div
          className={`size-8 rounded-full flex items-center justify-center shrink-0 ${newStatusColors.bg} ${newStatusColors.text}`}
        >
          {entry.new_status && statusIcons[entry.new_status] ? statusIcons[entry.new_status] : <Clock className="size-4" />}
        </div>
        {/* Line to next entry */}
        {!isLast && (
          <div className="w-0.5 flex-1 bg-muted min-h-4" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 ${!isLast ? 'pb-4' : ''}`}>
        <p className="text-sm font-medium text-start">
          {entry.old_status ? (
            t('timeline.statusChanged', {
              from: t(`status.${entry.old_status}`),
              to: t(`status.${entry.new_status}`),
            })
          ) : (
            t(`status.${entry.new_status}`)
          )}
        </p>
        <p className="text-xs text-muted-foreground text-start mt-0.5">
          {formatDateTime(entry.changed_at)}
        </p>
        {entry.changed_by_name && (
          <p className="text-xs text-muted-foreground text-start mt-0.5 flex items-center gap-1">
            <User className="size-3" />
            {t('timeline.by', { user: entry.changed_by_name })}
          </p>
        )}
        {entry.notes && (
          <p className="text-xs text-muted-foreground text-start mt-2 italic border-s-2 border-muted ps-2">
            {entry.notes}
          </p>
        )}
      </div>
    </div>
  );
}
