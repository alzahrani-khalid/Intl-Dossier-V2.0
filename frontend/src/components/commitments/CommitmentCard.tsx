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
          cursor-pointer transition-shadow duration-200 hover:shadow-md
          ${overdue ? 'border-red-300 dark:border-red-800' : ''}
          ${commitment.status === 'completed' ? 'opacity-75' : ''}
        `}
        onClick={handleCardClick}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <CardHeader className={compact ? 'px-3 pb-2 pt-3' : 'pb-3'}>
          <div className="flex items-start justify-between gap-2">
            {/* Title and Status */}
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                <h3 className="truncate text-start text-sm font-medium sm:text-base">
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
                  className="size-9 min-h-11 min-w-11 shrink-0 p-0"
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

        <CardContent className={compact ? 'px-3 pb-3' : 'pb-4'}>
          {/* Description */}
          {!compact && commitment.description && (
            <p className="mb-3 line-clamp-2 text-start text-sm text-muted-foreground">
              {commitment.description}
            </p>
          )}

          {/* Meta info row */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* Due Date with overdue indicator */}
            <div
              className={`flex items-center gap-1.5 text-sm ${
                overdue
                  ? 'font-medium text-red-600 dark:text-red-400'
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
                <FileText className="me-1 size-3" />
                {t('form.proofRequired')}
              </Badge>
            )}

            {/* Evidence submitted indicator */}
            {commitment.proof_url && (
              <Badge
                variant="secondary"
                className="bg-green-50 text-xs text-green-700 dark:bg-green-900/20 dark:text-green-300"
              >
                <CheckCircle className="me-1 size-3" />
                {t('detail.evidence')}
              </Badge>
            )}
          </div>

          {/* Dossier context (optional) */}
          {showDossierContext && commitment.dossier_id && (
            <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">
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
            <Label htmlFor="cancel-reason" className="mb-2 block text-start">
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

          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="min-h-11">
              {t('actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              disabled={!cancelReason.trim() || cancelMutation.isPending}
              className="min-h-11 bg-red-600 text-white hover:bg-red-700"
            >
              {cancelMutation.isPending ? t('list.loading') : t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* T053: Evidence Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent
          className="max-h-[90vh] max-w-md overflow-y-auto"
          dir={isRTL ? 'rtl' : 'ltr'}
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle className="text-start">
              {t('evidence.title')}
            </DialogTitle>
          </DialogHeader>
          <p className="mb-4 text-start text-sm text-muted-foreground">
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
