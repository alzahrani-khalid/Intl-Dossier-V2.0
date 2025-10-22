import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Bell, Loader2, CheckCircle2 } from 'lucide-react';
import { useReminderAction } from '@/hooks/use-waiting-queue-actions';
import { useToast } from '@/hooks/use-toast';

/**
 * Reminder Button Component
 * Feature: Waiting Queue Actions (User Story 2)
 * Purpose: Send individual follow-up reminders to assignment owners
 *
 * Features:
 * - Send reminder with cooldown enforcement (24h default)
 * - Loading state during API call
 * - Success/error feedback via toasts
 * - Mobile-first responsive design
 * - RTL support
 * - Touch-friendly (min 44x44px)
 *
 * Requirements (from spec):
 * FR-003: Send follow-up reminder to assignment owner
 * FR-004: Display cooldown error if sent within 24h
 * FR-005: Update last_reminder_sent_at timestamp
 * FR-006: Prevent reminder if no assignee
 * FR-022: Rate limiting (100 per 5 min)
 * FR-032: Visual feedback (loading spinner, success/error)
 */

interface ReminderButtonProps {
  assignmentId: string;
  assigneeId?: string | null;
  lastReminderSentAt?: string | null;
  workItemId?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function ReminderButton({
  assignmentId,
  assigneeId,
  lastReminderSentAt,
  workItemId,
  disabled = false,
  variant = 'outline',
  size = 'default',
  className = '',
}: ReminderButtonProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { mutate: sendReminder, isPending } = useReminderAction();
  const [showSuccess, setShowSuccess] = useState(false);
  const isRTL = i18n.language === 'ar';

  // Calculate if cooldown is active
  const isCooldownActive = () => {
    if (!lastReminderSentAt) return false;

    const lastSent = new Date(lastReminderSentAt);
    const now = new Date();
    const hoursSince = (now.getTime() - lastSent.getTime()) / 1000 / 60 / 60;
    const cooldownHours = 24; // Should match backend REMINDER_COOLDOWN_HOURS

    return hoursSince < cooldownHours;
  };

  const getHoursRemaining = () => {
    if (!lastReminderSentAt) return 0;

    const lastSent = new Date(lastReminderSentAt);
    const now = new Date();
    const hoursSince = (now.getTime() - lastSent.getTime()) / 1000 / 60 / 60;
    const cooldownHours = 24;

    return Math.ceil(cooldownHours - hoursSince);
  };

  const handleSendReminder = () => {
    // Validate assignee exists
    if (!assigneeId) {
      toast({
        variant: 'destructive',
        title: t('waitingQueue.reminder.noAssignee.title', 'No Assignee'),
        description: t(
          'waitingQueue.reminder.noAssignee.description',
          'This assignment has no assignee. Please assign it first.'
        ),
      });
      return;
    }

    // Check cooldown locally before API call
    if (isCooldownActive()) {
      const hoursRemaining = getHoursRemaining();
      toast({
        variant: 'destructive',
        title: t('waitingQueue.reminder.cooldown.title', 'Cooldown Active'),
        description: t(
          'waitingQueue.reminder.cooldown.description',
          `Please wait {{hours}} more hours before sending another reminder.`,
          { hours: hoursRemaining }
        ),
      });
      return;
    }

    // Send reminder
    sendReminder(
      { assignmentId },
      {
        onSuccess: () => {
          setShowSuccess(true);
          toast({
            title: t('waitingQueue.reminder.success.title', 'Reminder Sent'),
            description: t(
              'waitingQueue.reminder.success.description',
              'Follow-up reminder has been sent successfully.'
            ),
            variant: 'default',
          });

          // Reset success icon after 2 seconds
          setTimeout(() => setShowSuccess(false), 2000);
        },
        onError: (error: any) => {
          let title = t('waitingQueue.reminder.error.title', 'Failed to Send Reminder');
          let description = t(
            'waitingQueue.reminder.error.description',
            'An error occurred while sending the reminder. Please try again.'
          );

          // Handle specific error codes
          if (error?.error === 'COOLDOWN_ACTIVE') {
            const hoursRemaining = error?.details?.hours_remaining || 24;
            title = t('waitingQueue.reminder.cooldown.title', 'Cooldown Active');
            description = t(
              'waitingQueue.reminder.cooldown.description',
              `Please wait {{hours}} more hours before sending another reminder.`,
              { hours: hoursRemaining }
            );
          } else if (error?.error === 'RATE_LIMIT_EXCEEDED') {
            title = t('waitingQueue.reminder.rateLimit.title', 'Rate Limit Exceeded');
            description = t(
              'waitingQueue.reminder.rateLimit.description',
              'You have sent too many reminders. Please wait a few minutes and try again.'
            );
          } else if (error?.error === 'NO_ASSIGNEE') {
            title = t('waitingQueue.reminder.noAssignee.title', 'No Assignee');
            description = t(
              'waitingQueue.reminder.noAssignee.description',
              'This assignment has no assignee. Please assign it first.'
            );
          } else if (error?.error === 'ASSIGNMENT_NOT_FOUND') {
            title = t('waitingQueue.reminder.notFound.title', 'Assignment Not Found');
            description = t(
              'waitingQueue.reminder.notFound.description',
              'The assignment could not be found. It may have been deleted.'
            );
          } else if (error?.error === 'VERSION_CONFLICT') {
            title = t('waitingQueue.reminder.conflict.title', 'Assignment Changed');
            description = t(
              'waitingQueue.reminder.conflict.description',
              'This assignment was modified by another user. Please refresh and try again.'
            );
          }

          toast({
            variant: 'destructive',
            title,
            description,
          });
        },
      }
    );
  };

  const cooldownActive = isCooldownActive();
  const isDisabled = disabled || isPending || cooldownActive || !assigneeId;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSendReminder}
      disabled={isDisabled}
      className={`min-h-11 min-w-11 gap-2 ${className}`}
      data-testid="reminder-button"
      aria-label={t('waitingQueue.reminder.button.label', 'Send follow-up reminder')}
    >
      {isPending ? (
        <>
          <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? '' : ''}`} />
          <span className="hidden sm:inline">
            {t('waitingQueue.reminder.button.sending', 'Sending...')}
          </span>
        </>
      ) : showSuccess ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="hidden sm:inline text-green-600">
            {t('waitingQueue.reminder.button.sent', 'Sent!')}
          </span>
        </>
      ) : (
        <>
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">
            {t('waitingQueue.reminder.button.send', 'Send Reminder')}
          </span>
        </>
      )}
    </Button>
  );
}
