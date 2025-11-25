/**
 * CommitmentsList Component
 * Feature: 030-health-commitment
 *
 * Displays a list of commitments with filtering and status management
 * Mobile-first, RTL-compatible, accessible
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useCommitments } from '../../hooks/useCommitments';
import {
  getCommitmentStatusColor,
  getCommitmentPriorityColor,
  isCommitmentOverdue,
  type Commitment,
} from '../../services/commitments.service';

export interface CommitmentsListProps {
  dossierId?: string;
  status?: string[];
  ownerId?: string;
  showFilters?: boolean;
}

function CommitmentCard({ commitment }: { commitment: Commitment }) {
  const { t, i18n } = useTranslation('commitments');
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  const overdue = isCommitmentOverdue(commitment.due_date, commitment.status);
  const dueDate = new Date(commitment.due_date);
  const formattedDate = dueDate.toLocaleDateString(i18n.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const statusIcons = {
    pending: <Clock className="size-4" />,
    in_progress: <ArrowRight className="size-4" />,
    completed: <CheckCircle className="size-4" />,
    cancelled: <XCircle className="size-4" />,
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={() => navigate({ to: `/dossiers/${commitment.dossier_id}`, search: { tab: 'commitments' } })}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <CardTitle className="text-base sm:text-lg text-start">{commitment.title}</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className={`${getCommitmentStatusColor(commitment.status)} flex items-center gap-1 text-xs`}
            >
              {statusIcons[commitment.status]}
              <span>{t(`status.${commitment.status}`)}</span>
            </Badge>
            {overdue && (
              <Badge variant="destructive" className="text-xs">
                {t('overdue')}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {commitment.description && (
          <p className="text-sm text-muted-foreground text-start line-clamp-2">
            {commitment.description}
          </p>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="size-4 shrink-0" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t('fields.priority')}:</span>
            <Badge
              variant="outline"
              className={`${getCommitmentPriorityColor(commitment.priority)} text-xs`}
            >
              {t(`priority.${commitment.priority}`)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CommitmentsList({
  dossierId,
  status,
  ownerId,
  showFilters = false,
}: CommitmentsListProps) {
  const { t, i18n } = useTranslation('commitments');
  const isRTL = i18n.language === 'ar';

  // Fetch commitments with filters
  const { data, isLoading, isError, error } = useCommitments({
    dossierId,
    status,
    ownerId,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'}>
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            {t('errors.loadFailed') ||
              `Failed to load commitments: ${error?.message}`}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty state
  if (!data || data.commitments.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 px-4 text-center"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <CheckCircle className="size-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          {t('empty.title', 'No commitments found')}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {dossierId
            ? t('empty.description.filtered', 'No commitments match your current filters.')
            : t('empty.description.all', 'There are no commitments to display.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header with count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground text-start">
          {t('title', 'Commitments')}
          <span className="ms-2 text-sm font-normal text-muted-foreground">
            ({data.totalCount})
          </span>
        </h2>
        {showFilters && (
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Filter className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
            {t('filters', 'Filters')}
          </Button>
        )}
      </div>

      {/* Commitments Grid - Mobile First */}
      <div className="grid grid-cols-1 gap-4">
        {data.commitments.map((commitment) => (
          <CommitmentCard key={commitment.id} commitment={commitment} />
        ))}
      </div>

      {/* Pagination hint (if needed in future) */}
      {data.totalCount > data.commitments.length && (
        <p className="text-sm text-muted-foreground text-center py-2">
          {t('pagination.showing', {
            count: data.commitments.length,
            total: data.totalCount,
            defaultValue: `Showing ${data.commitments.length} of ${data.totalCount}`,
          })}
        </p>
      )}
    </div>
  );
}
