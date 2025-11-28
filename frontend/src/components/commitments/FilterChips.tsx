/**
 * FilterChips Component v1.1
 * Feature: 031-commitments-management
 * Task: T038
 *
 * Displays active filters as removable chips above the list:
 * - Shows active status, priority, owner type, and date filters
 * - Click X to remove individual filter
 * - Mobile-first, RTL-compatible, 44x44px touch targets
 */

import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { CommitmentFilters } from '@/types/commitment.types';

export interface FilterChipsProps {
  filters: CommitmentFilters;
  onRemoveFilter: (key: keyof CommitmentFilters, value?: string) => void;
  onClearAll: () => void;
}

export function FilterChips({
  filters,
  onRemoveFilter,
  onClearAll,
}: FilterChipsProps) {
  const { t, i18n } = useTranslation('commitments');
  const isRTL = i18n.language === 'ar';

  // Count active filters
  const activeFilterCount =
    (filters.status?.length || 0) +
    (filters.priority?.length || 0) +
    (filters.ownerType ? 1 : 0) +
    (filters.overdue ? 1 : 0) +
    (filters.dueDateFrom ? 1 : 0) +
    (filters.dueDateTo ? 1 : 0);

  // Don't render if no active filters
  if (activeFilterCount === 0) {
    return null;
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(i18n.language, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      className="flex flex-wrap items-center gap-2 py-2"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Status chips */}
      {filters.status?.map((status) => (
        <Badge
          key={`status-${status}`}
          variant="secondary"
          className="flex items-center gap-1 pe-1 text-xs"
        >
          <span>{t(`status.${status}`)}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter('status', status)}
            className="ms-1 rounded-full hover:bg-muted p-0.5 min-w-6 min-h-6 flex items-center justify-center"
            aria-label={`Remove ${t(`status.${status}`)} filter`}
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}

      {/* Priority chips */}
      {filters.priority?.map((priority) => (
        <Badge
          key={`priority-${priority}`}
          variant="secondary"
          className="flex items-center gap-1 pe-1 text-xs"
        >
          <span>{t(`priority.${priority}`)}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter('priority', priority)}
            className="ms-1 rounded-full hover:bg-muted p-0.5 min-w-6 min-h-6 flex items-center justify-center"
            aria-label={`Remove ${t(`priority.${priority}`)} filter`}
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}

      {/* Owner type chip */}
      {filters.ownerType && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1 pe-1 text-xs"
        >
          <span>{t(`ownerType.${filters.ownerType}`)}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter('ownerType')}
            className="ms-1 rounded-full hover:bg-muted p-0.5 min-w-6 min-h-6 flex items-center justify-center"
            aria-label={`Remove ${t(`ownerType.${filters.ownerType}`)} filter`}
          >
            <X className="size-3" />
          </button>
        </Badge>
      )}

      {/* Overdue chip */}
      {filters.overdue && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1 pe-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
        >
          <span>{t('filters.overdue')}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter('overdue')}
            className="ms-1 rounded-full hover:bg-red-200 dark:hover:bg-red-800 p-0.5 min-w-6 min-h-6 flex items-center justify-center"
            aria-label={`Remove ${t('filters.overdue')} filter`}
          >
            <X className="size-3" />
          </button>
        </Badge>
      )}

      {/* Date from chip */}
      {filters.dueDateFrom && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1 pe-1 text-xs"
        >
          <span>
            {t('filters.dueDateFrom')}: {formatDate(filters.dueDateFrom)}
          </span>
          <button
            type="button"
            onClick={() => onRemoveFilter('dueDateFrom')}
            className="ms-1 rounded-full hover:bg-muted p-0.5 min-w-6 min-h-6 flex items-center justify-center"
            aria-label="Remove from date filter"
          >
            <X className="size-3" />
          </button>
        </Badge>
      )}

      {/* Date to chip */}
      {filters.dueDateTo && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1 pe-1 text-xs"
        >
          <span>
            {t('filters.dueDateTo')}: {formatDate(filters.dueDateTo)}
          </span>
          <button
            type="button"
            onClick={() => onRemoveFilter('dueDateTo')}
            className="ms-1 rounded-full hover:bg-muted p-0.5 min-w-6 min-h-6 flex items-center justify-center"
            aria-label="Remove to date filter"
          >
            <X className="size-3" />
          </button>
        </Badge>
      )}

      {/* Clear all button */}
      {activeFilterCount > 1 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="min-h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          {t('filters.clear')}
        </Button>
      )}
    </div>
  );
}
