/**
 * Route: /admin/approvals
 * Admin reassignment panel for stuck approvals
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Users, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/_protected/admin/approvals')({
  component: AdminApprovalsPage,
  beforeLoad: async () => {
    // Check admin role
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    const isAdmin = user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin';

    if (!isAdmin) {
      throw new Error('Admin access required');
    }
  },
});

const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

async function fetchUnderReviewPositions() {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`${API_BASE_URL}/positions-list?status=under_review`, {
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch positions');
  }

  const data = await response.json();
  return data.data || [];
}

async function reassignApproval(approvalId: string, newApproverId: string, reason: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`${API_BASE_URL}/approvals-reassign?id=${approvalId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reassign_to: newApproverId,
      reason,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to reassign approval');
  }

  return response.json();
}

function AdminApprovalsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [reassignData, setReassignData] = useState({
    newApproverId: '',
    reason: '',
  });

  const { data: positions, isLoading } = useQuery({
    queryKey: ['admin', 'approvals', 'under_review'],
    queryFn: fetchUnderReviewPositions,
    staleTime: 30 * 1000, // 30 seconds
  });

  const reassignMutation = useMutation({
    mutationFn: ({ approvalId, newApproverId, reason }: { approvalId: string; newApproverId: string; reason: string }) =>
      reassignApproval(approvalId, newApproverId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'approvals'] });
      setIsReassignDialogOpen(false);
      setReassignData({ newApproverId: '', reason: '' });
    },
  });

  const handleReassign = (position: any) => {
    setSelectedPosition(position);
    setIsReassignDialogOpen(true);
  };

  const handleReassignSubmit = () => {
    if (selectedPosition && reassignData.newApproverId && reassignData.reason) {
      reassignMutation.mutate({
        approvalId: selectedPosition.current_approval_id || '', // This would need to come from the position
        newApproverId: reassignData.newApproverId,
        reason: reassignData.reason,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
          <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">
            {t('admin.approvals.title', 'Admin: Approval Management')}
          </h1>
          <p className="text-muted-foreground">
            {t('admin.approvals.subtitle', 'Reassign stuck approvals and manage approval chains')}
          </p>
        </div>
      </div>

      {/* Warning Banner */}
      <Card className="p-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              {t('admin.approvals.warning', 'Admin Privileges Active')}
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {t('admin.approvals.warningText', 'All reassignments are logged and require a reason for audit trail compliance.')}
            </p>
          </div>
        </div>
      </Card>

      {/* Positions Under Review Table */}
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            {t('admin.approvals.underReview', 'Positions Under Review')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('admin.approvals.underReviewDesc', 'All positions currently in the approval workflow')}
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.approvals.position', 'Position')}</TableHead>
              <TableHead>{t('admin.approvals.stage', 'Current Stage')}</TableHead>
              <TableHead>{t('admin.approvals.category', 'Category')}</TableHead>
              <TableHead>{t('admin.approvals.submittedDate', 'Submitted')}</TableHead>
              <TableHead>{t('admin.approvals.actions', 'Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions && positions.length > 0 ? (
              positions.map((position: any) => (
                <TableRow key={position.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{position.title_en}</p>
                      <p className="text-sm text-muted-foreground">{position.title_ar}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {t('admin.approvals.stageOf', 'Stage {{current}} of {{total}}', {
                        current: position.current_stage,
                        total: position.approval_chain_config?.stages?.length || 0,
                      })}
                    </Badge>
                  </TableCell>
                  <TableCell>{position.thematic_category || '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(position.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReassign(position)}
                    >
                      <Users className="me-2 h-4 w-4" />
                      {t('admin.approvals.reassign', 'Reassign')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {t('admin.approvals.noPositions', 'No positions under review')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Reassign Dialog */}
      <Dialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('admin.approvals.reassignTitle', 'Reassign Approval')}</DialogTitle>
            <DialogDescription>
              {t('admin.approvals.reassignDesc', 'Reassign this approval to a different user. A reason is required for audit purposes.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="position">
                {t('admin.approvals.position', 'Position')}
              </Label>
              <p className="text-sm font-medium">{selectedPosition?.title_en}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newApprover">
                {t('admin.approvals.newApprover', 'New Approver')} *
              </Label>
              <Input
                id="newApprover"
                placeholder={t('admin.approvals.newApproverPlaceholder', 'Enter user ID or search')}
                value={reassignData.newApproverId}
                onChange={(e) => setReassignData({ ...reassignData, newApproverId: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">
                {t('admin.approvals.reason', 'Reason for Reassignment')} *
              </Label>
              <Textarea
                id="reason"
                placeholder={t('admin.approvals.reasonPlaceholder', 'e.g., Original approver is on leave, organizational change')}
                value={reassignData.reason}
                onChange={(e) => setReassignData({ ...reassignData, reason: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReassignDialogOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              onClick={handleReassignSubmit}
              disabled={!reassignData.newApproverId || !reassignData.reason}
            >
              {t('admin.approvals.confirmReassign', 'Confirm Reassignment')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
