/**
 * CommitmentCard Component v1.1
 * Feature: 031-commitments-management
 * Tasks: T023, T032, T053
 *
 * Displays a single commitment with:
 * - Inline StatusDropdown for quick status updates (2 taps)
 * - Priority indicator, overdue styling
 * - Quick action buttons
 * - Evidence upload/download (T053)
 * Mobile-first, RTL-compatible, accessible (44x44px touch targets)
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Calendar,
  CheckCircle,
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  AlertTriangle,
  Upload,
  Download,
  ExternalLink,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  type Commitment,
  PRIORITY_COLORS,
} from '@/types/commitment.types';
import {
  isCommitmentOverdue,
  getDaysUntilDue,
} from '@/services/commitments.service';
import { useCancelCommitment } from '@/hooks/useCommitments';
import { getEvidenceUrl } from '@/services/commitments.service';
import { StatusDropdown } from './StatusDropdown';
import { EvidenceUpload } from './EvidenceUpload';

export interface CommitmentCardProps {
  commitment: Commitment;
  onEdit?: (commitment: Commitment) => void;
  onStatusChange?: (commitmentId: string, newStatus: string) => void;
  showDossierContext?: boolean;
  compact?: boolean;
}

export function CommitmentCard({
  commitment,
  onEdit,
  onStatusChange,
  showDossierContext = false,
  compact = false,
}: CommitmentCardProps) {
  const { t, i18n } = useTranslation('commitments');
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const cancelMutation = useCancelCommitment();

  // T053: Handle evidence download
  const handleDownloadEvidence = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!commitment.proof_url) return;

    setIsDownloading(true);
    try {
      const { signedUrl } = await getEvidenceUrl(commitment.proof_url);
      window.open(signedUrl, '_blank');
    } catch (error) {
      console.error('Failed to get evidence URL:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Calculate overdue status
  const overdue = isCommitmentOverdue(commitment.due_date, commitment.status);
  const daysUntilDue = getDaysUntilDue(commitment.due_date);

  // Format date
  const dueDate = new Date(commitment.due_date);
  const formattedDate = dueDate.toLocaleDateString(i18n.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Get style classes
  const priorityColors = PRIORITY_COLORS[commitment.priority];

  // Due date label
  const getDueDateLabel = () => {
    if (overdue) {
      return t('card.overdueDays', { days: Math.abs(daysUntilDue) });
    }
    if (daysUntilDue === 0) {
      return t('card.dueToday');
    }
    return t('card.dueIn', { days: daysUntilDue });
  };

  // Handle cancel confirmation
  const handleCancelConfirm = () => {
    if (cancelReason.trim()) {
      cancelMutation.mutate(
        { id: commitment.id, reason: cancelReason },
        {
          onSuccess: () => {
            setShowCancelDialog(false);
            setCancelReason('');
          },
        }
      );
    }
  };

  // Handle card click - navigate to detail
  const handleCardClick = () => {
    navigate({
      to: '/commitments',
      search: { id: commitment.id },
    });
  };

  return (
    <>
      <Card
        className={`
          hover:shadow-md transition-shadow duration-200 cursor-pointer
          ${overdue ? 'border-red-300 dark:border-red-800' : ''}
          ${commitment.status === 'completed' ? 'opacity-75' : ''}
        `}
        onClick={handleCardClick}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <CardHeader className={compact ? 'pb-2 pt-3 px-3' : 'pb-3'}>
          <div className="flex items-start justify-between gap-2">
            {/* Title and Status */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h3 className="text-sm sm:text-base font-medium text-start truncate">
                  {commitment.title || t('card.noTitle')}
                </h3>
                {/* T032: Inline StatusDropdown for quick status updates */}
                <div onClick={(e) => e.stopPropagation()}>
                  <StatusDropdown
                    commitmentId={commitment.id}
                    currentStatus={commitment.status}
                    compact={compact}
                  />
                </div>
              </div>
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 shrink-0 min-h-11 min-w-11"
                  aria-label={t('actions.viewDetails')}
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={isRTL ? 'start' : 'end'}
                className="w-48"
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick();
                  }}
                >
                  <FileText className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                  {t('actions.viewDetails')}
                </DropdownMenuItem>

                {/* T053: Evidence actions */}
                {commitment.proof_url && (
                  <DropdownMenuItem
                    onClick={handleDownloadEvidence}
                    disabled={isDownloading}
                  >
                    <Download className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                    {t('actions.downloadEvidence')}
                  </DropdownMenuItem>
                )}

                {commitment.status !== 'cancelled' &&
                  commitment.status !== 'completed' && (
                    <>
                      {/* Upload evidence option */}
                      {commitment.proof_required && !commitment.proof_url && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowUploadDialog(true);
                          }}
                        >
                          <Upload className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                          {t('actions.uploadEvidence')}
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit?.(commitment);
                        }}
                      >
                        <Edit className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                        {t('actions.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCancelDialog(true);
                        }}
                      >
                        <Trash2 className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                        {t('actions.cancel')}
                      </DropdownMenuItem>
                    </>
                  )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className={compact ? 'pb-3 px-3' : 'pb-4'}>
          {/* Description */}
          {!compact && commitment.description && (
            <p className="text-sm text-muted-foreground text-start line-clamp-2 mb-3">
              {commitment.description}
            </p>
          )}

          {/* Meta info row */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* Due Date with overdue indicator */}
            <div
              className={`flex items-center gap-1.5 text-sm ${
                overdue
                  ? 'text-red-600 dark:text-red-400 font-medium'
                  : 'text-muted-foreground'
              }`}
            >
              {overdue ? (
                <AlertTriangle className="size-4 shrink-0" />
              ) : (
                <Calendar className="size-4 shrink-0" />
              )}
              <span className="truncate">
                {overdue ? getDueDateLabel() : formattedDate}
              </span>
            </div>

            {/* Priority Badge */}
            <Badge
              variant="outline"
              className={`${priorityColors.bg} ${priorityColors.text} text-xs`}
            >
              {t(`priority.${commitment.priority}`)}
            </Badge>

            {/* Proof required indicator */}
            {commitment.proof_required && !commitment.proof_url && (
              <Badge variant="outline" className="text-xs">
                <FileText className="size-3 me-1" />
                {t('form.proofRequired')}
              </Badge>
            )}

            {/* Evidence submitted indicator */}
            {commitment.proof_url && (
              <Badge
                variant="secondary"
                className="text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20"
              >
                <CheckCircle className="size-3 me-1" />
                {t('detail.evidence')}
              </Badge>
            )}
          </div>

          {/* Dossier context (optional) */}
          {showDossierContext && commitment.dossier_id && (
            <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
              <span className="truncate">{commitment.dossier_id}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-start">
              {t('confirm.cancel')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-start">
              {t('confirm.delete')}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <Label htmlFor="cancel-reason" className="text-start block mb-2">
              {t('confirm.cancelReason')}
            </Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={t('confirm.cancelReasonPlaceholder')}
              className="min-h-20"
            />
          </div>

          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="min-h-11">
              {t('actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              disabled={!cancelReason.trim() || cancelMutation.isPending}
              className="min-h-11 bg-red-600 hover:bg-red-700 text-white"
            >
              {cancelMutation.isPending ? t('list.loading') : t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* T053: Evidence Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent
          className="max-w-md max-h-[90vh] overflow-y-auto"
          dir={isRTL ? 'rtl' : 'ltr'}
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle className="text-start">
              {t('evidence.title')}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-start mb-4">
            {t('evidence.description')}
          </p>
          <EvidenceUpload
            commitmentId={commitment.id}
            onSuccess={() => setShowUploadDialog(false)}
            onCancel={() => setShowUploadDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
