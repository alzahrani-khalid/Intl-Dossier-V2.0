import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, differenceInDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface Commitment {
  id: string;
  dossier_id: string;
  dossier_name: string;
  dossier_type: 'country' | 'organization' | 'forum';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  due_date: string;
  owner_id: string;
  owner_name: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

interface CommitmentsListProps {
  commitments: Commitment[];
  showDossierContext?: boolean;
  onCommitmentClick?: (commitment: Commitment) => void;
}

export function CommitmentsList({
  commitments,
  showDossierContext = true,
  onCommitmentClick
}: CommitmentsListProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const queryClient = useQueryClient();

  // T167: TanStack Query mutation for status updates
  const updateStatusMutation = useMutation({
    mutationFn: async ({ commitmentId, newStatus }: { commitmentId: string; newStatus: string }) => {
      const response = await fetch(`/api/commitments/${commitmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update commitment status');
      return response.json();
    },
    onSuccess: (_, variables) => {
      // T168: Invalidate useDossierStats() query cache after status update
      queryClient.invalidateQueries({ queryKey: ['dossierStats'] });
      queryClient.invalidateQueries({ queryKey: ['commitments'] });

      // T169: Health score recalculation is triggered via backend job
      // (This happens automatically in the backend within 2 minutes)
    },
  });

  const getStatusBadge = (status: Commitment['status']) => {
    const statusConfig = {
      pending: { label: t('commitments.status.pending'), className: 'bg-gray-100 text-gray-800' },
      in_progress: { label: t('commitments.status.inProgress'), className: 'bg-blue-100 text-blue-800' },
      completed: { label: t('commitments.status.completed'), className: 'bg-green-100 text-green-800' },
      cancelled: { label: t('commitments.status.cancelled'), className: 'bg-gray-100 text-gray-500' },
      overdue: { label: t('commitments.status.overdue'), className: 'bg-red-100 text-red-800' },
    };

    return statusConfig[status] || statusConfig.pending;
  };

  const getDaysIndicator = (dueDate: string, status: Commitment['status']) => {
    if (status === 'completed' || status === 'cancelled') return null;

    const today = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = differenceInDays(due, today);

    // T165: Overdue commitments - red badge with days overdue
    if (daysUntilDue < 0) {
      return {
        type: 'overdue',
        label: t('commitments.daysOverdue', { count: Math.abs(daysUntilDue) }),
        icon: AlertCircle,
        className: 'bg-red-50 text-red-700 border-red-200',
      };
    }

    // T164: Upcoming commitments (due within 30 days) - yellow badge with days remaining
    if (daysUntilDue <= 30) {
      return {
        type: 'upcoming',
        label: t('commitments.daysRemaining', { count: daysUntilDue }),
        icon: Clock,
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      };
    }

    return null;
  };

  const getNextStatus = (currentStatus: Commitment['status']): string | null => {
    const statusFlow: Record<string, string> = {
      pending: 'in_progress',
      in_progress: 'completed',
    };
    return statusFlow[currentStatus] || null;
  };

  const handleStatusUpdate = (commitmentId: string, newStatus: string) => {
    updateStatusMutation.mutate({ commitmentId, newStatus });
  };

  if (commitments.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 px-4 text-center"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <CheckCircle className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-base sm:text-lg text-gray-600">
          {t('commitments.noCommitments')}
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 gap-4 sm:gap-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {commitments.map((commitment) => {
        const statusBadge = getStatusBadge(commitment.status);
        const daysIndicator = getDaysIndicator(commitment.due_date, commitment.status);
        const nextStatus = getNextStatus(commitment.status);

        return (
          <Card
            key={commitment.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onCommitmentClick?.(commitment)}
          >
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                <div className="flex-1">
                  {/* T163: Display commitment with status badge, due date, owner, description */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge className={statusBadge.className}>
                      {statusBadge.label}
                    </Badge>
                    {daysIndicator && (
                      <Badge variant="outline" className={daysIndicator.className}>
                        <daysIndicator.icon className="h-3 w-3 me-1" />
                        {daysIndicator.label}
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="text-base sm:text-lg text-start">
                    {commitment.description}
                  </CardTitle>

                  <CardDescription className="mt-1 text-sm text-start">
                    <span className="font-medium">{t('commitments.owner')}:</span> {commitment.owner_name}
                  </CardDescription>

                  <CardDescription className="mt-1 text-sm text-start">
                    <span className="font-medium">{t('commitments.dueDate')}:</span>{' '}
                    {format(new Date(commitment.due_date), 'PPP')}
                  </CardDescription>

                  {showDossierContext && (
                    <CardDescription className="mt-1 text-sm text-start">
                      <span className="font-medium">{t('commitments.dossier')}:</span>{' '}
                      {commitment.dossier_name} ({t(`dossierType.${commitment.dossier_type}`)})
                    </CardDescription>
                  )}
                </div>

                {/* T166: Status update action button */}
                {nextStatus && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusUpdate(commitment.id, nextStatus);
                    }}
                    disabled={updateStatusMutation.isPending}
                    className="min-h-11 min-w-11 px-4 whitespace-nowrap"
                  >
                    {updateStatusMutation.isPending ? (
                      t('commitments.updating')
                    ) : nextStatus === 'in_progress' ? (
                      t('commitments.markInProgress')
                    ) : (
                      t('commitments.markCompleted')
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex items-center justify-end text-sm text-gray-500">
                <span>{t('commitments.viewDetails')}</span>
                <ChevronRight
                  className={`h-4 w-4 ms-1 ${isRTL ? 'rotate-180' : ''}`}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
