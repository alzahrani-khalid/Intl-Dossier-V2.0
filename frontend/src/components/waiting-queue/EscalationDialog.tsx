/**
 * EscalationDialog Component (T066)
 * User Story 4: Assignment Escalation
 *
 * Mobile-first dialog for escalating overdue assignments to management.
 * Features:
 * - Recipient selection from organizational hierarchy
 * - Optional reason input
 * - Auto-resolution of escalation path
 * - Mobile-first responsive design (base → sm: → md: → lg:)
 * - Full RTL support for Arabic
 * - Touch-friendly controls (min 44x44px)
 * - Error handling (NO_ESCALATION_PATH, INVALID_STATUS, etc.)
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ArrowUp, Loader2, User, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEscalationAction } from '@/hooks/use-waiting-queue-actions';
import { useToast } from '@/hooks/use-toast';

export interface EscalationDialogProps {
  /** Assignment ID to escalate */
  assignmentId: string;
  /** Current assignee name */
  assigneeName: string;
  /** Work item ID for display */
  workItemId: string;
  /** Whether dialog is open */
  isOpen: boolean;
  /** Callback when dialog closes */
  onClose: () => void;
  /** Callback on successful escalation */
  onSuccess?: () => void;
  /** Assignment details */
  assignment?: {
    id: string;
    work_item_id: string;
    work_item_type: string;
    assignee_id: string | null;
    assignee_name?: string;
    status: string;
    workflow_stage: string;
    assigned_at: string;
    priority: string;
    days_waiting?: number;
  };
  /** Escalation path (managers in hierarchy) */
  escalationPath?: Array<{
    user_id: string;
    full_name: string;
    position_title: string;
    department: string | null;
  }>;
  /** Callback when escalate action is triggered */
  onEscalate?: (data: { assignmentId: string; recipientId: string; reason: string }) => void;
  /** Loading state */
  isLoading?: boolean;
}

export function EscalationDialog({
  assignmentId,
  assigneeName,
  workItemId,
  isOpen,
  onClose,
  onSuccess,
  assignment,
  escalationPath = [],
  onEscalate,
  isLoading: externalLoading = false,
}: EscalationDialogProps) {
  const { t, i18n } = useTranslation(['common', 'waitingQueue']);
  const isRTL = i18n.language === 'ar';
  const { toast } = useToast();

  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [localError, setLocalError] = useState<string>('');

  const { escalate } = useEscalationAction();
  const isLoading = escalate.isPending || externalLoading;

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Default to first recipient in escalation path (immediate manager)
      if (escalationPath.length > 0) {
        setSelectedRecipientId(escalationPath[0].user_id);
      }
      setReason('');
      setLocalError('');
    }
  }, [isOpen, escalationPath]);

  const handleEscalate = async () => {
    setLocalError('');

    // Validate reason input
    if (!reason.trim()) {
      setLocalError(t('waitingQueue.escalation.reasonRequired', 'Please provide a reason for escalation'));
      return;
    }

    try {
      // If onEscalate callback provided (for testing), use it
      if (onEscalate) {
        onEscalate({
          assignmentId,
          recipientId: selectedRecipientId,
          reason: reason.trim(),
        });
        onClose();
        return;
      }

      // Otherwise, use the hook mutation
      await escalate.mutateAsync({
        assignment_id: assignmentId,
        escalation_reason: reason.trim(),
        escalate_to_user_id: selectedRecipientId || undefined,
      });

      toast({
        title: t('waitingQueue.escalation.success', 'Assignment escalated successfully'),
        description: t(
          'waitingQueue.escalation.successDesc',
          'The manager has been notified and will review the assignment.'
        ),
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      const errorCode = error?.error?.code || error?.code;
      const errorMessage = error?.error?.message || error?.message || 'Failed to escalate assignment';

      setLocalError(errorMessage);

      toast({
        variant: 'destructive',
        title: t('waitingQueue.escalation.error', 'Failed to escalate assignment'),
        description: errorMessage,
      });
    }
  };

  const selectedRecipient = escalationPath.find((r) => r.user_id === selectedRecipientId);
  const daysWaiting = assignment?.days_waiting || 0;

  // Check if escalation path is empty
  const hasNoEscalationPath = escalationPath.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="px-4 sm:px-6 max-w-md sm:max-w-lg md:max-w-xl"
        dir={isRTL ? 'rtl' : 'ltr'}
        aria-labelledby="escalation-dialog-title"
        aria-describedby="escalation-dialog-description"
      >
        <DialogHeader>
          <DialogTitle
            id="escalation-dialog-title"
            className="flex items-center gap-2 text-lg sm:text-xl"
          >
            <ArrowUp className={`h-5 w-5 sm:h-6 sm:w-6 text-orange-600 ${isRTL ? 'rotate-180' : ''}`} />
            {t('waitingQueue.escalation.escalateAssignment', 'Escalate Assignment')}
          </DialogTitle>
          <DialogDescription id="escalation-dialog-description" className="text-sm text-start">
            {t(
              'waitingQueue.escalation.dialogDescription',
              'Escalate this assignment to higher management for attention'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Assignment Details */}
          <div className="rounded-lg bg-muted p-3 sm:p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">{workItemId}</span>
              {daysWaiting >= 7 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {daysWaiting} {t('waitingQueue.agingIndicator.days', { count: daysWaiting })}
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground text-start">
              {t('waitingQueue.assignmentDetails.assignee', 'Assignee')}: {assigneeName}
            </div>
          </div>

          {/* Error: No Escalation Path */}
          {hasNoEscalationPath && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-start">
                {t(
                  'waitingQueue.escalation.noEscalationPathMessage',
                  'No manager configured for {{user}} in the organizational hierarchy.',
                  { user: assigneeName }
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Recipient Selection */}
          {!hasNoEscalationPath && (
            <div className="space-y-2">
              <Label htmlFor="recipient-select" className="text-start block">
                {t('waitingQueue.escalation.selectRecipient', 'Select Recipient')}
              </Label>
              <Select
                value={selectedRecipientId}
                onValueChange={setSelectedRecipientId}
                disabled={isLoading}
              >
                <SelectTrigger
                  id="recipient-select"
                  className="min-h-11 text-start"
                  data-testid="recipient-selector"
                  aria-label={t('waitingQueue.escalation.selectRecipient', 'Select Recipient')}
                >
                  <SelectValue>
                    {selectedRecipient && (
                      <div
                        className="flex items-center gap-2"
                        data-testid="escalation-recipient"
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{selectedRecipient.full_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {selectedRecipient.position_title}
                            {selectedRecipient.department && ` • ${selectedRecipient.department}`}
                          </span>
                        </div>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {escalationPath.map((recipient, index) => (
                    <SelectItem key={recipient.user_id} value={recipient.user_id}>
                      <div className="flex flex-col items-start py-1">
                        <span className="font-medium">{recipient.full_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {recipient.position_title}
                          {recipient.department && ` • ${recipient.department}`}
                          {index === 0 && (
                            <Badge variant="secondary" className="ms-2 text-xs">
                              {t('waitingQueue.escalation.immediateManager', 'Immediate Manager')}
                            </Badge>
                          )}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground text-start">
                {t(
                  'waitingQueue.escalation.autoResolve',
                  'Auto-resolve from organizational hierarchy'
                )}
              </p>
            </div>
          )}

          {/* Reason Textarea */}
          <div className="space-y-2">
            <Label htmlFor="escalation-reason" className="text-start block">
              {t('waitingQueue.escalation.reason', 'Reason (Optional)')}
            </Label>
            <Textarea
              id="escalation-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 500))}
              placeholder={t(
                'waitingQueue.escalation.reasonPlaceholder',
                'Why are you escalating this assignment?'
              )}
              className="min-h-24 text-start resize-none"
              maxLength={500}
              disabled={isLoading}
              aria-label={t('waitingQueue.escalation.reason', 'Reason')}
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span className="text-start">
                {t('waitingQueue.escalation.reasonHint', 'Explain why escalation is needed')}
              </span>
              <span>{reason.length}/500</span>
            </div>
          </div>

          {/* Local Error Display */}
          {localError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-start">{localError}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="min-h-11 min-w-11 px-4 sm:px-6 w-full sm:w-auto"
            aria-label={t('common.cancel', 'Cancel')}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleEscalate}
            disabled={isLoading || hasNoEscalationPath || !reason.trim()}
            className="min-h-11 min-w-11 px-4 sm:px-6 w-full sm:w-auto"
            aria-label={
              isLoading
                ? t('waitingQueue.escalation.escalating', 'Escalating...')
                : t('waitingQueue.escalation.escalate', 'Escalate')
            }
          >
            {isLoading ? (
              <>
                <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ms-2' : 'me-2'}`} />
                {t('waitingQueue.escalation.escalating', 'Escalating...')}
              </>
            ) : (
              <>
                <ArrowUp className={`h-4 w-4 ${isRTL ? 'ms-2 rotate-180' : 'me-2'}`} />
                {t('waitingQueue.escalation.escalate', 'Escalate')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
