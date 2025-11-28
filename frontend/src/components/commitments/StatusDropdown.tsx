/**
 * StatusDropdown Component v1.1
 * Feature: 031-commitments-management
 * Tasks: T031, T034, T035, T036
 *
 * Inline status dropdown for quick status updates with:
 * - Mobile-first design (44x44px touch targets)
 * - RTL support for Arabic
 * - Status transition validation
 * - Optimistic updates with rollback
 * - Toast notifications
 */

import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Clock,
  ArrowRight,
  CheckCircle,
  XCircle,
  ChevronDown,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import {
  type CommitmentStatus,
  STATUS_COLORS,
  VALID_STATUS_TRANSITIONS,
  isValidStatusTransition,
} from '@/types/commitment.types';
import { useUpdateCommitmentStatus } from '@/hooks/useCommitments';

export interface StatusDropdownProps {
  commitmentId: string;
  currentStatus: CommitmentStatus;
  disabled?: boolean;
  compact?: boolean;
}

// Status icons mapping
const statusIcons: Record<CommitmentStatus, React.ReactNode> = {
  pending: <Clock className="size-3.5" />,
  in_progress: <ArrowRight className="size-3.5" />,
  completed: <CheckCircle className="size-3.5" />,
  cancelled: <XCircle className="size-3.5" />,
  overdue: <AlertTriangle className="size-3.5" />,
};

export function StatusDropdown({
  commitmentId,
  currentStatus,
  disabled = false,
  compact = false,
}: StatusDropdownProps) {
  const { t, i18n } = useTranslation('commitments');
  const isRTL = i18n.language === 'ar';

  const updateStatusMutation = useUpdateCommitmentStatus();

  // Early return with loading state if currentStatus is not yet available or invalid
  if (!currentStatus || !STATUS_COLORS[currentStatus]) {
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-500 border flex items-center gap-1 text-xs">
        <Clock className="size-3.5" />
        <span>{t('status.loading', 'Loading...')}</span>
      </Badge>
    );
  }

  // Current status colors - safe after the guard above
  const statusColors = STATUS_COLORS[currentStatus];

  // T034: Get valid transitions (hide 'overdue' as it's auto-applied)
  const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  const availableTransitions = validTransitions.filter(
    (status) => status !== 'overdue'
  ) as CommitmentStatus[];

  // Check if dropdown should be disabled
  const isDisabled =
    disabled ||
    updateStatusMutation.isPending ||
    availableTransitions.length === 0;

  // Handle status change
  const handleStatusChange = (newStatus: CommitmentStatus) => {
    // T034: Validate transition before updating
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      return;
    }

    // T033: Optimistic update is handled by the hook
    updateStatusMutation.mutate({
      id: commitmentId,
      status: newStatus,
    });
  };

  // Render just a badge if no transitions available
  if (availableTransitions.length === 0) {
    return (
      <Badge
        variant="secondary"
        className={`${statusColors.bg} ${statusColors.text} ${statusColors.border} border flex items-center gap-1 text-xs`}
      >
        {statusIcons[currentStatus]}
        <span>{t(`status.${currentStatus}`)}</span>
      </Badge>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isDisabled}
          className={`
            ${compact ? 'h-8 px-2' : 'min-h-11 px-3'}
            ${statusColors.bg} ${statusColors.text} ${statusColors.border}
            border hover:opacity-90 focus:ring-2 focus:ring-offset-2
            flex items-center gap-1.5
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {updateStatusMutation.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            statusIcons[currentStatus]
          )}
          <span className="text-xs font-medium">
            {t(`status.${currentStatus}`)}
          </span>
          <ChevronDown className={`size-3 opacity-70 ${isRTL ? 'rotate-180' : ''}`} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={isRTL ? 'start' : 'end'}
        className="w-44"
        onClick={(e) => e.stopPropagation()}
      >
        {availableTransitions.map((status) => {
          const colors = STATUS_COLORS[status];
          return (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`flex items-center gap-2 cursor-pointer min-h-11 ${colors.text}`}
            >
              {statusIcons[status]}
              <span>{t(`status.${status}`)}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * StatusBadge Component
 * A non-interactive status badge for display purposes
 */
export function StatusBadge({
  status,
  showIcon = true,
  className = '',
}: {
  status: CommitmentStatus;
  showIcon?: boolean;
  className?: string;
}) {
  const { t } = useTranslation('commitments');

  // Guard against undefined status
  if (!status) {
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-500 border flex items-center gap-1 text-xs">
        <Clock className="size-3.5" />
        <span>{t('status.loading', 'Loading...')}</span>
      </Badge>
    );
  }

  const statusColors = STATUS_COLORS[status];

  return (
    <Badge
      variant="secondary"
      className={`${statusColors.bg} ${statusColors.text} ${statusColors.border} border flex items-center gap-1 text-xs ${className}`}
    >
      {showIcon && statusIcons[status]}
      <span>{t(`status.${status}`)}</span>
    </Badge>
  );
}
