/**
 * AvailabilityBadge Component - Assignment Engine
 *
 * Displays staff availability status with color-coded badge and tooltip.
 * Features:
 * - Color-coded badge: green (available), yellow (unavailable), red (on_leave)
 * - Shows unavailable_until date when not available
 * - Tooltip displays reason if provided
 * - ARIA label for screen reader accessibility
 * - Bilingual support (Arabic/English)
 *
 * @see specs/013-assignment-engine-sla/tasks.md#T057a
 */

import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CalendarDays, Info } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface AvailabilityBadgeProps {
  status: 'available' | 'on_leave' | 'unavailable';
  unavailableUntil?: string | null;
  reason?: string | null;
  className?: string;
  showDate?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AvailabilityBadge({
  status,
  unavailableUntil,
  reason,
  className,
  showDate = true,
  size = 'md',
}: AvailabilityBadgeProps) {
  const { t, i18n } = useTranslation(['assignments', 'common']);

  // Get badge color based on status
  const getBadgeVariant = (statusValue: string) => {
    switch (statusValue) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case 'unavailable':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
      case 'on_leave':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800';
    }
  };

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-0.5';
      case 'lg':
        return 'text-base px-3 py-1.5';
      default:
        return 'text-sm px-2.5 py-1';
    }
  };

  // Format unavailable until date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, 'PPP', {
        locale: i18n.language === 'ar' ? undefined : undefined,
      });
    } catch {
      return dateString;
    }
  };

  // Accessibility label
  const getAriaLabel = (): string => {
    let label = t(`assignments:availability.statuses.${status}`);

    if (status !== 'available' && unavailableUntil) {
      label += ` ${t('common:until')} ${formatDate(unavailableUntil)}`;
    }

    if (reason) {
      label += `. ${t('assignments:availability.reason')}: ${reason}`;
    }

    return label;
  };

  const badgeContent = (
    <Badge
      className={cn('border', getBadgeVariant(status), getSizeClasses(), className)}
      aria-label={getAriaLabel()}
    >
      <span>{t(`assignments:availability.statuses.${status}`)}</span>

      {/* Show unavailable until date */}
      {status !== 'available' && showDate && unavailableUntil && (
        <span className="ms-2 flex items-center gap-1">
          <CalendarDays className={cn('inline-block', size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')} />
          {formatDate(unavailableUntil)}
        </span>
      )}
    </Badge>
  );

  // If there's a reason, wrap in tooltip
  if (reason) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center gap-1 cursor-help">
              {badgeContent}
              <Info className={cn('text-gray-400', size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')} />
            </div>
          </TooltipTrigger>
          <TooltipContent
            className="max-w-xs"
            dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
          >
            <p className="font-medium mb-1">{t('assignments:availability.reason')}:</p>
            <p className="text-sm">{reason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badgeContent;
}
