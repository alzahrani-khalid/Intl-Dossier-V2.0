/**
 * Route: /positions/:id/approvals
 * Detailed approval tracking page
 */

import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, CheckCircle, XCircle, UserPlus, Users } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import ApprovalChain from '@/components/ApprovalChain';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/_protected/positions/$id/approvals')({
  component: ApprovalTrackingPage,
});

const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

async function fetchApprovals(positionId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`${API_BASE_URL}/positions-get?id=${positionId}`, {
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch position');
  }

  return response.json();
}

function ApprovalTrackingPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  const { data: position, isLoading } = useQuery({
    queryKey: ['positions', 'detail', id],
    queryFn: () => fetchApprovals(id),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approve':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'request_revisions':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'delegate':
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'reassign':
        return <Users className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/positions/$id" params={{ id }}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="me-2 h-4 w-4" />
            {t('common.back', 'Back')}
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">
          {t('positions.approvals.title', 'Approval Tracking')}
        </h1>
      </div>

      {/* Approval Chain Visualization */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          {t('positions.approvals.progress', 'Approval Progress')}
        </h2>
        <ApprovalChain
          positionId={id}
          currentStage={position?.current_stage || 0}
          detailed={true}
        />
      </Card>

      {/* Approval History Table */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          {t('positions.approvals.history', 'Approval History')}
        </h2>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('positions.approvals.stage', 'Stage')}</TableHead>
              <TableHead>{t('positions.approvals.approver', 'Approver')}</TableHead>
              <TableHead>{t('positions.approvals.action', 'Action')}</TableHead>
              <TableHead>{t('positions.approvals.stepUp', 'Step-Up Verified')}</TableHead>
              <TableHead>{t('positions.approvals.comments', 'Comments')}</TableHead>
              <TableHead>{t('positions.approvals.timestamp', 'Timestamp')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {position?.approvals?.map((approval: any) => (
              <TableRow key={approval.id}>
                <TableCell>
                  <Badge variant="outline">{approval.stage}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{approval.approver_name || approval.approver_id}</span>
                    {approval.delegated_from && (
                      <span className="text-xs text-muted-foreground">
                        {t('positions.approvals.delegatedFrom', 'Delegated from')}: {approval.delegated_from}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getActionIcon(approval.action)}
                    <span className="capitalize">{approval.action.replace('_', ' ')}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {approval.step_up_verified ? (
                    <Badge variant="success" className="text-xs">
                      {t('common.yes', 'Yes')}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {t('common.no', 'No')}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="max-w-xs truncate">{approval.comments || '-'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(approval.created_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
