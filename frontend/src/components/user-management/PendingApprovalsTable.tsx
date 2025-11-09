/**
 * Pending Approvals Table Component
 * Displays pending role approval requests with approval/rejection actions
 *
 * Features:
 * - Mobile-first responsive design with TanStack Table
 * - RTL support for Arabic
 * - Touch-friendly action buttons (44x44px)
 * - Status badges and visual indicators
 * - Dual approval workflow support
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, XCircle, Clock, User, Shield } from 'lucide-react';
import { usePendingApprovals, useRoleApproval } from '@/hooks/use-role-assignment';
import { DataTable } from '@/components/Table/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { PendingApproval } from '@/services/user-management-api';

// ============================================================================
// Component
// ============================================================================

interface PendingApprovalsTableProps {
 status?: 'pending' | 'first_approved' | 'approved' | 'rejected';
}

export function PendingApprovalsTable({ status }: PendingApprovalsTableProps) {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
 const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
 const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
 const [rejectionReason, setRejectionReason] = useState('');

 const { data, isLoading } = usePendingApprovals({ status });
 const { mutate: approveRoleChange, isPending: isProcessing } = useRoleApproval();

 const handleApprove = (approval: PendingApproval) => {
 setSelectedApproval(approval);
 setIsApprovalDialogOpen(true);
 };

 const handleReject = (approval: PendingApproval) => {
 setSelectedApproval(approval);
 setRejectionReason('');
 setIsRejectionDialogOpen(true);
 };

 const confirmApproval = () => {
 if (!selectedApproval) return;
 approveRoleChange(
 {
 approval_request_id: selectedApproval.id,
 approved: true,
 },
 {
 onSuccess: () => {
 setIsApprovalDialogOpen(false);
 setSelectedApproval(null);
 },
 }
 );
 };

 const confirmRejection = () => {
 if (!selectedApproval || !rejectionReason.trim()) return;
 approveRoleChange(
 {
 approval_request_id: selectedApproval.id,
 approved: false,
 rejection_reason: rejectionReason,
 },
 {
 onSuccess: () => {
 setIsRejectionDialogOpen(false);
 setSelectedApproval(null);
 setRejectionReason('');
 },
 }
 );
 };

 const columns = useMemo<ColumnDef<PendingApproval>[]>(
 () => [
 {
 accessorKey: 'user_email',
 header: t('user_management.user', 'User'),
 cell: ({ row }) => (
 <div className="flex items-center gap-2 min-w-[150px] sm:min-w-0">
 <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
 <span className="truncate">{row.original.user_email}</span>
 </div>
 ),
 },
 {
 accessorKey: 'requested_role',
 header: t('user_management.requested_role', 'Requested Role'),
 cell: ({ row }) => (
 <Badge
 variant={row.original.requested_role === 'admin' ? 'destructive' : 'secondary'}
 className="capitalize min-w-fit"
 >
 <Shield className="h-3 w-3 me-1" />
 {row.original.requested_role}
 </Badge>
 ),
 },
 {
 accessorKey: 'requester_email',
 header: t('user_management.requester', 'Requester'),
 cell: ({ row }) => (
 <span className="text-sm text-muted-foreground truncate block max-w-[150px] sm:max-w-none">
 {row.original.requester_email}
 </span>
 ),
 },
 {
 accessorKey: 'status',
 header: t('user_management.status', 'Status'),
 cell: ({ row }) => {
 const status = row.original.status;
 const variant =
 status === 'pending'
 ? 'default'
 : status === 'first_approved'
 ? 'secondary'
 : status === 'approved'
 ? 'success'
 : 'destructive';

 const icon =
 status === 'pending' ? (
 <Clock className="h-3 w-3 me-1" />
 ) : status === 'first_approved' ? (
 <CheckCircle className="h-3 w-3 me-1" />
 ) : status === 'approved' ? (
 <CheckCircle className="h-3 w-3 me-1" />
 ) : (
 <XCircle className="h-3 w-3 me-1" />
 );

 return (
 <Badge variant={variant as any} className="min-w-fit">
 {icon}
 {t(`user_management.status_${status}`, status)}
 </Badge>
 );
 },
 },
 {
 accessorKey: 'first_approver_email',
 header: t('user_management.first_approver', 'First Approver'),
 cell: ({ row }) => (
 <span className="text-sm text-muted-foreground truncate block max-w-[150px] sm:max-w-none">
 {row.original.first_approver_email || '-'}
 </span>
 ),
 },
 {
 accessorKey: 'created_at',
 header: t('user_management.requested', 'Requested'),
 cell: ({ row }) => (
 <span className="text-sm text-muted-foreground whitespace-nowrap">
 {formatDistanceToNow(new Date(row.original.created_at), { addSuffix: true })}
 </span>
 ),
 },
 {
 id: 'actions',
 header: t('common.actions', 'Actions'),
 cell: ({ row }) => {
 const approval = row.original;
 const canApprove = approval.status === 'pending' || approval.status === 'first_approved';

 if (!canApprove) return <span className="text-sm text-muted-foreground">-</span>;

 return (
 <div className="flex items-center gap-2">
 <Button
 size="sm"
 variant="default"
 onClick={() => handleApprove(approval)}
 className="h-9 sm:h-8 px-3 sm:px-4 text-xs sm:text-sm min-w-[44px] sm:min-w-0"
 >
 <CheckCircle className={`h-4 w-4 ${isRTL ? 'ms-1' : 'me-1'}`} />
 {t('common.approve', 'Approve')}
 </Button>
 <Button
 size="sm"
 variant="destructive"
 onClick={() => handleReject(approval)}
 className="h-9 sm:h-8 px-3 sm:px-4 text-xs sm:text-sm min-w-[44px] sm:min-w-0"
 >
 <XCircle className={`h-4 w-4 ${isRTL ? 'ms-1' : 'me-1'}`} />
 {t('common.reject', 'Reject')}
 </Button>
 </div>
 );
 },
 },
 ],
 [t, isRTL]
 );

 if (isLoading) {
 return (
 <div className="flex items-center justify-center py-8 text-muted-foreground">
 <Clock className={`h-5 w-5 animate-spin ${isRTL ? 'ms-2' : 'me-2'}`} />
 {t('common.loading', 'Loading...')}
 </div>
 );
 }

 if (!data?.approvals.length) {
 return (
 <div className="text-center py-8 text-muted-foreground">
 {t('user_management.no_pending_approvals', 'No pending approvals')}
 </div>
 );
 }

 return (
 <div className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
 <DataTable
 columns={columns}
 data={data.approvals}
 pageSize={10}
 enableFiltering={true}
 enableSorting={true}
 enablePagination={true}
 />

 {/* Approval Confirmation Dialog */}
 <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
 <DialogContent className="w-[95vw] max-w-md px-4 sm:px-6" dir={isRTL ? 'rtl' : 'ltr'}>
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
 <CheckCircle className="h-5 w-5 text-green-600" />
 {t('user_management.confirm_approval', 'Confirm Approval')}
 </DialogTitle>
 <DialogDescription className="text-sm sm:text-base text-start">
 {selectedApproval?.status === 'pending'
 ? t(
 'user_management.first_approval_message',
 'You are providing the first approval. One more approval will be needed.'
 )
 : t(
 'user_management.second_approval_message',
 'You are providing the second approval. The role change will be applied immediately.'
 )}
 </DialogDescription>
 </DialogHeader>

 <div className="space-y-3 py-4">
 <div className="rounded-lg bg-muted p-3 sm:p-4 space-y-2">
 <div className="flex items-center justify-between text-sm">
 <span className="text-muted-foreground">{t('user_management.user', 'User')}:</span>
 <span className="font-medium">{selectedApproval?.user_email}</span>
 </div>
 <div className="flex items-center justify-between text-sm">
 <span className="text-muted-foreground">{t('user_management.role', 'Role')}:</span>
 <Badge variant="destructive" className="capitalize">
 {selectedApproval?.requested_role}
 </Badge>
 </div>
 </div>
 </div>

 <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2">
 <Button
 type="button"
 variant="outline"
 onClick={() => setIsApprovalDialogOpen(false)}
 disabled={isProcessing}
 className="h-11 sm:h-10 px-6 text-base sm:text-sm w-full sm:w-auto order-2 sm:order-1"
 >
 {t('common.cancel', 'Cancel')}
 </Button>
 <Button
 type="button"
 onClick={confirmApproval}
 disabled={isProcessing}
 className="h-11 sm:h-10 px-6 text-base sm:text-sm w-full sm:w-auto order-1 sm:order-2"
 >
 {isProcessing
 ? t('user_management.approving', 'Approving...')
 : t('common.approve', 'Approve')}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* Rejection Dialog */}
 <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
 <DialogContent className="w-[95vw] max-w-md px-4 sm:px-6" dir={isRTL ? 'rtl' : 'ltr'}>
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
 <XCircle className="h-5 w-5 text-destructive" />
 {t('user_management.reject_request', 'Reject Request')}
 </DialogTitle>
 <DialogDescription className="text-sm sm:text-base text-start">
 {t(
 'user_management.reject_description',
 'Please provide a reason for rejecting this role change request'
 )}
 </DialogDescription>
 </DialogHeader>

 <div className="space-y-4 py-4">
 <div className="space-y-2">
 <Label htmlFor="rejection_reason" className="text-sm sm:text-base">
 {t('user_management.rejection_reason', 'Rejection Reason')}
 <span className="text-destructive ms-1">*</span>
 </Label>
 <Textarea
 id="rejection_reason"
 value={rejectionReason}
 onChange={(e) => setRejectionReason(e.target.value)}
 placeholder={t(
 'user_management.rejection_reason_placeholder',
 'Explain why this request is being rejected'
 )}
 className="min-h-24 px-4 py-3 text-base sm:text-sm resize-none"
 disabled={isProcessing}
 />
 </div>
 </div>

 <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2">
 <Button
 type="button"
 variant="outline"
 onClick={() => setIsRejectionDialogOpen(false)}
 disabled={isProcessing}
 className="h-11 sm:h-10 px-6 text-base sm:text-sm w-full sm:w-auto order-2 sm:order-1"
 >
 {t('common.cancel', 'Cancel')}
 </Button>
 <Button
 type="button"
 variant="destructive"
 onClick={confirmRejection}
 disabled={isProcessing || !rejectionReason.trim()}
 className="h-11 sm:h-10 px-6 text-base sm:text-sm w-full sm:w-auto order-1 sm:order-2"
 >
 {isProcessing
 ? t('user_management.rejecting', 'Rejecting...')
 : t('common.reject', 'Reject')}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 );
}
