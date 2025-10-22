import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { X, ExternalLink, Calendar, User, Mail, Tag, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AgingIndicator } from './AgingIndicator';

/**
 * Assignment Details Modal Component
 * Feature: Waiting Queue Actions (User Story 1)
 * Purpose: Display complete assignment details in a modal dialog
 *
 * Requirements:
 * - Mobile-first responsive design (base → sm → md → lg)
 * - Full RTL support with logical properties
 * - Touch-friendly controls (44x44px minimum)
 * - WCAG AA compliance
 */

interface LinkedEntity {
  type: 'dossier' | 'position' | 'ticket';
  id: string;
  name_en?: string;
  name_ar?: string;
  title_en?: string;
  title_ar?: string;
  ticket_number?: string;
  status?: string;
}

interface WorkItemDetails {
  title_en: string;
  title_ar: string;
  description?: string;
  status?: string;
  source_type?: 'dossier' | 'position' | 'ticket';
  linked_entities?: LinkedEntity[];
  // Legacy fields (for backward compatibility)
  ticket_number?: string;
  type?: string;
}

export interface Assignment {
  id: string;
  work_item_id: string;
  work_item_type: 'dossier' | 'ticket' | 'position' | 'task';
  assignee_id: string;
  assignee_name?: string;
  assignee_email?: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  workflow_stage: 'todo' | 'in_progress' | 'done';
  assigned_at: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  last_reminder_sent_at?: string | null;
  created_at: string;
  updated_at: string;
  days_waiting?: number;
  work_item?: WorkItemDetails | null;
}

interface AssignmentDetailsModalProps {
  assignment: Assignment | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AssignmentDetailsModal({
  assignment,
  isOpen,
  onClose,
}: AssignmentDetailsModalProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  if (!assignment) return null;

  // Calculate days waiting if not provided
  const daysWaiting = assignment.days_waiting ??
    Math.floor((Date.now() - new Date(assignment.assigned_at).getTime()) / (1000 * 60 * 60 * 24));

  // Format dates for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP p'); // e.g., "Jan 10, 2024 at 2:30 PM"
    } catch {
      return dateString;
    }
  };

  // Check if work item exists (not a placeholder UUID)
  const isWorkItemValid = assignment.work_item_id !== '00000000-0000-0000-0000-000000000001';

  // Get work item route based on type
  const getWorkItemRoute = () => {
    if (!isWorkItemValid) return '#';

    const routes = {
      dossier: `/dossiers/${assignment.work_item_id}`,
      ticket: `/tickets/${assignment.work_item_id}`,
      position: `/positions/${assignment.work_item_id}`,
      task: `/tasks/${assignment.work_item_id}`,
    };
    return routes[assignment.work_item_type] || '#';
  };

  // Get priority badge variant
  const getPriorityVariant = (priority: string) => {
    const variants = {
      urgent: 'destructive',
      high: 'default',
      medium: 'secondary',
      low: 'outline',
    };
    return variants[priority as keyof typeof variants] || 'secondary';
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    const variants = {
      pending: 'secondary',
      assigned: 'default',
      in_progress: 'default',
      completed: 'outline',
      cancelled: 'destructive',
    };
    return variants[status as keyof typeof variants] || 'secondary';
  };

  // Get work item title
  const getWorkItemTitle = (): string => {
    if (!assignment.work_item) {
      return assignment.work_item_id.substring(0, 8) + '...';
    }

    const title = isRTL ? assignment.work_item.title_ar : assignment.work_item.title_en;

    // For tickets, show ticket number + title
    if (assignment.work_item_type === 'ticket' && assignment.work_item.ticket_number) {
      return `${assignment.work_item.ticket_number}${title ? ': ' + title : ''}`;
    }

    return title || assignment.work_item_id.substring(0, 8) + '...';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl w-full px-4 py-6 sm:px-6 md:px-8 max-h-[90vh] overflow-y-auto"
        dir={isRTL ? 'rtl' : 'ltr'}
        data-testid="assignment-details-modal"
      >
        {/* Header */}
        <DialogHeader className="flex flex-col gap-2 sm:gap-3">
          <div className="flex items-start justify-between gap-4">
            <DialogTitle
              className="text-lg sm:text-xl md:text-2xl font-semibold text-start"
              data-testid="modal-title"
            >
              {t('waitingQueue.assignmentDetails.title', 'Assignment Details')}
            </DialogTitle>

            {/* Close Button - Touch-friendly 44x44px */}
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-11 min-w-11 h-11 w-11 rounded-full"
                data-testid="close-modal-button"
                aria-label={t('common.close', 'Close')}
              >
                <X className={`h-5 w-5 ${isRTL ? 'rotate-0' : ''}`} />
              </Button>
            </DialogClose>
          </div>

          {/* Accessible description for screen readers */}
          <DialogDescription className="sr-only">
            {t('waitingQueue.assignmentDetails.description',
              `View complete details for assignment ${assignment.id.substring(0, 8)}, assigned to ${assignment.assignee_name || 'Unknown'}`
            )}
          </DialogDescription>

          {/* Work Item Title and Aging Badge */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h3
              className="text-base sm:text-lg font-medium text-start"
              data-testid="work-item-id"
            >
              {getWorkItemTitle()}
            </h3>
            <AgingIndicator days={daysWaiting} />
          </div>
        </DialogHeader>

        {/* Content - Mobile-first grid layout */}
        <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          {/* Assignee Information */}
          <section className="space-y-3 sm:space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase">
              {t('waitingQueue.assignmentDetails.assignee', 'Assignee')}
            </h4>

            <div className="space-y-2 sm:space-y-3">
              {/* Assignee Name */}
              <div className="flex items-center gap-2 sm:gap-3">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span
                  className="text-sm sm:text-base"
                  data-testid="assignee-name"
                >
                  {assignment.assignee_name || t('common.unknown', 'Unknown')}
                </span>
              </div>

              {/* Assignee Email */}
              {assignment.assignee_email && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a
                    href={`mailto:${assignment.assignee_email}`}
                    className="text-sm sm:text-base text-primary hover:underline"
                    data-testid="assignee-email"
                  >
                    {assignment.assignee_email}
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* Status and Priority */}
          <section className="space-y-3 sm:space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase">
              {t('waitingQueue.assignmentDetails.statusAndPriority', 'Status & Priority')}
            </h4>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Status Badge */}
              <Badge
                variant={getStatusVariant(assignment.status) as any}
                className="text-xs sm:text-sm"
                data-testid="assignment-status"
              >
                {t(`waitingQueue.status.${assignment.status}`, assignment.status)}
              </Badge>

              {/* Priority Badge */}
              <Badge
                variant={getPriorityVariant(assignment.priority) as any}
                className="text-xs sm:text-sm"
                data-testid="assignment-priority"
              >
                <Tag className="h-3 w-3 me-1" />
                {t(`waitingQueue.priority.${assignment.priority}`, assignment.priority)}
              </Badge>
            </div>
          </section>

          {/* Task Description (if available) */}
          {assignment.work_item?.description && (
            <section className="space-y-3 sm:space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase">
                {t('waitingQueue.assignmentDetails.description', 'Description')}
              </h4>
              <p className="text-sm sm:text-base text-start" data-testid="task-description">
                {assignment.work_item.description}
              </p>
            </section>
          )}

          {/* Linked Entities (for tasks) */}
          {assignment.work_item?.linked_entities && assignment.work_item.linked_entities.length > 0 && (
            <section className="space-y-3 sm:space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase">
                {t('waitingQueue.assignmentDetails.linkedItems', 'Linked Items')}
              </h4>
              <div className="space-y-2">
                {assignment.work_item.linked_entities.map((entity, index) => {
                  const entityTitle = entity.type === 'dossier'
                    ? (isRTL ? entity.name_ar : entity.name_en)
                    : entity.type === 'position'
                    ? (isRTL ? entity.title_ar : entity.title_en)
                    : entity.ticket_number || (isRTL ? entity.title_ar : entity.title_en);

                  const entityTypeLabel = t(`waitingQueue.entityType.${entity.type}`, entity.type);

                  return (
                    <div
                      key={`${entity.type}-${entity.id}-${index}`}
                      className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/50"
                      data-testid={`linked-entity-${index}`}
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground capitalize">
                          {entityTypeLabel}
                        </p>
                        <p className="text-sm sm:text-base font-medium text-start">
                          {entityTitle}
                        </p>
                        {entity.status && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {entity.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Timestamps */}
          <section className="space-y-3 sm:space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase">
              {t('waitingQueue.assignmentDetails.timeline', 'Timeline')}
            </h4>

            <div className="space-y-2 sm:space-y-3">
              {/* Assigned At */}
              <div className="flex items-start gap-2 sm:gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {t('waitingQueue.assignmentDetails.assignedAt', 'Assigned At')}
                  </p>
                  <p className="text-sm sm:text-base" data-testid="assigned-at">
                    {formatDate(assignment.assigned_at)}
                  </p>
                </div>
              </div>

              {/* Days Waiting */}
              <div className="flex items-start gap-2 sm:gap-3">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {t('waitingQueue.assignmentDetails.daysWaiting', 'Days Waiting')}
                  </p>
                  <p className="text-sm sm:text-base font-medium" data-testid="days-waiting">
                    {daysWaiting} {t('common.days', 'days')}
                  </p>
                </div>
              </div>

              {/* Last Reminder Sent */}
              <div className="flex items-start gap-2 sm:gap-3">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {t('waitingQueue.assignmentDetails.lastReminder', 'Last Reminder')}
                  </p>
                  <p className="text-sm sm:text-base" data-testid="last-reminder-sent">
                    {assignment.last_reminder_sent_at
                      ? formatDate(assignment.last_reminder_sent_at)
                      : t('waitingQueue.assignmentDetails.noReminderSent', 'No reminder sent')}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Actions */}
          <section className="pt-2 sm:pt-4 border-t space-y-3">
            {/* Show task details link if it's a task */}
            {assignment.work_item_type === 'task' && isWorkItemValid && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                  {t('waitingQueue.assignmentDetails.taskActions', 'Task')}
                </h4>
                <Button
                  asChild
                  variant="outline"
                  className="w-full h-11 min-h-11 sm:w-auto"
                  data-testid="view-task-link"
                >
                  <a href={getWorkItemRoute()} className="inline-flex items-center justify-center gap-2">
                    <ExternalLink className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                    {t('waitingQueue.assignmentDetails.viewTask', 'View Task')}
                  </a>
                </Button>
              </div>
            )}

            {/* Show linked entity links */}
            {assignment.work_item?.linked_entities && assignment.work_item.linked_entities.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                  {t('waitingQueue.assignmentDetails.viewLinkedItems', 'View Linked Items')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {assignment.work_item.linked_entities.map((entity, index) => {
                    const entityRoute = {
                      dossier: `/dossiers/${entity.id}`,
                      ticket: `/tickets/${entity.id}`,
                      position: `/positions/${entity.id}`,
                    }[entity.type];

                    const entityTitle = entity.type === 'dossier'
                      ? (isRTL ? entity.name_ar : entity.name_en)
                      : entity.type === 'position'
                      ? (isRTL ? entity.title_ar : entity.title_en)
                      : entity.ticket_number || (isRTL ? entity.title_ar : entity.title_en);

                    return (
                      <Button
                        key={`view-${entity.type}-${entity.id}-${index}`}
                        asChild
                        variant="secondary"
                        size="sm"
                        className="h-9 text-xs sm:text-sm"
                        data-testid={`view-linked-entity-${index}`}
                      >
                        <a href={entityRoute} className="inline-flex items-center gap-1.5">
                          <ExternalLink className={`h-3.5 w-3.5 ${isRTL ? 'rotate-180' : ''}`} />
                          {entityTitle?.substring(0, 30)}{entityTitle && entityTitle.length > 30 ? '...' : ''}
                        </a>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Show legacy view button for non-task work items */}
            {assignment.work_item_type !== 'task' && isWorkItemValid && (
              <Button
                asChild
                variant="outline"
                className="w-full h-11 min-h-11 sm:w-auto"
                data-testid="view-full-details-link"
              >
                <a href={getWorkItemRoute()} className="inline-flex items-center justify-center gap-2">
                  <ExternalLink className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                  {t('waitingQueue.assignmentDetails.viewFullDetails', 'View Full Details')}
                </a>
              </Button>
            )}

            {/* Show disabled state if work item is invalid */}
            {!isWorkItemValid && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full h-11 min-h-11 sm:w-auto"
                  disabled
                  data-testid="view-full-details-disabled"
                >
                  <ExternalLink className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                  {t('waitingQueue.assignmentDetails.viewFullDetails', 'View Full Details')}
                </Button>
                <p className="text-xs sm:text-sm text-muted-foreground text-start">
                  {t(
                    'waitingQueue.assignmentDetails.workItemNotAvailable',
                    'The work item for this assignment is not available.'
                  )}
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Overlay for click-outside detection */}
        <div className="hidden" data-testid="modal-overlay" />
      </DialogContent>
    </Dialog>
  );
}
