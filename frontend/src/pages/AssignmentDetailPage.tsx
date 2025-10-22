/**
 * Assignment Detail Page
 *
 * Main page component composing all assignment detail sub-components.
 * Displays metadata, SLA, work item, comments, checklist, timeline, observers,
 * engagement context, and related tasks.
 *
 * Features:
 * - Real-time subscriptions via useAssignmentDetail hook (T071)
 * - Keyboard shortcuts: E=escalate, C=comment focus, K=kanban (T072)
 * - Error boundaries with bilingual messages (T073)
 *
 * @see specs/014-full-assignment-detail/tasks.md#T070-T073
 */

import { useParams, useNavigate, ErrorComponent } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useRef, useState, Component, ReactNode } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useAssignmentDetail } from '@/hooks/useAssignmentDetail';
import { useEscalateAssignment } from '@/hooks/useEscalateAssignment';
import { useAddChecklistItem } from '@/hooks/useAddChecklistItem';
import { useToggleChecklistItem } from '@/hooks/useToggleChecklistItem';
import { useImportChecklistTemplate } from '@/hooks/useImportChecklistTemplate';
import { AssignmentMetadataCard } from '@/components/assignments/AssignmentMetadataCard';
import { SLACountdown } from '@/components/assignments/SLACountdown';
import { WorkItemPreview } from '@/components/assignments/WorkItemPreview';
import { CommentList } from '@/components/assignments/CommentList';
import { CommentForm } from '@/components/assignments/CommentForm';
import { ChecklistSection } from '@/components/assignments/ChecklistSection';
import { Timeline } from '@/components/assignments/Timeline';
import { ObserversList } from '@/components/assignments/ObserversList';
import { EngagementContextBanner } from '@/components/assignments/EngagementContextBanner';
import { RelatedTasksList } from '@/components/assignments/RelatedTasksList';
import { EscalateDialog } from '@/components/assignments/EscalateDialog';
import { EngagementKanbanDialog } from '@/components/assignments/EngagementKanbanDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Error Boundary Component
 * Catches errors in child components and displays bilingual error messages
 */
class AssignmentErrorBoundary extends Component<
  { children: ReactNode; onRetry: () => void; t: (key: string, options?: any) => string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Assignment Detail Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                {this.props.t('assignments.errors.unexpected', {
                  defaultValue: 'An unexpected error occurred. Please try again.'
                })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  this.props.onRetry();
                }}
              >
                <RefreshCw className="me-2 size-4" />
                {this.props.t('common.retry', { defaultValue: 'Retry' })}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export function AssignmentDetailPage() {
  const { id } = useParams({ from: '/_protected/tasks/$id' });
  const navigate = useNavigate();
  const { t } = useTranslation();

  // State for modals
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);
  const [showKanbanDialog, setShowKanbanDialog] = useState(false);

  // Ref for comment input focus
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch assignment detail with real-time subscriptions (T071 - already in hook)
  const { data, isLoading, error, refetch } = useAssignmentDetail(id);

  // Checklist mutations
  const addChecklistItem = useAddChecklistItem();
  const toggleChecklistItem = useToggleChecklistItem();
  const importChecklistTemplate = useImportChecklistTemplate();

  // Keyboard shortcuts (T072)
  // E = Escalate assignment (if allowed)
  useHotkeys(
    'e',
    () => {
      if (data?.assignment.status !== 'completed' && data?.assignment.status !== 'cancelled') {
        setShowEscalateDialog(true);
      }
    },
    { enabled: !!data }
  );

  // C = Focus comment input
  useHotkeys('c', () => {
    commentInputRef.current?.focus();
  });

  // K = Open kanban modal (only if engagement-linked)
  useHotkeys(
    'k',
    () => {
      if (data?.engagement) {
        setShowKanbanDialog(true);
      }
    },
    { enabled: !!data?.engagement }
  );

  // 404 error - redirect to tasks after 3 seconds
  if (error && error.message.includes('404')) {
    setTimeout(() => {
      navigate({ to: '/tasks' });
    }, 3000);

    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            {t('assignments.errors.not_found', {
              defaultValue: 'Assignment not found. Redirecting...'
            })}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 403 error - unauthorized access, redirect after 3 seconds
  if (error && error.message.includes('403')) {
    setTimeout(() => {
      navigate({ to: '/tasks' });
    }, 3000);

    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            {t('assignments.errors.unauthorized', {
              defaultValue: "You don't have permission to view this assignment. Redirecting..."
            })}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            {t('assignments.errors.load_failed', {
              defaultValue: 'Failed to load assignment details. Please try again.'
            })}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No data state
  if (!data) {
    return null;
  }

  const {
    assignment,
    engagement,
    sla,
    comments,
    checklist_items,
    observers,
    timeline,
    checklist_progress,
  } = data;

  // Wrap content with error boundary (T073)
  const content = (
    <div className="container mx-auto space-y-6 p-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          {t('assignments.detail.title', {
            id: assignment.id.slice(0, 8),
            defaultValue: `Assignment #${assignment.id.slice(0, 8)}`
          })}
        </h1>

        {/* Breadcrumbs */}
        <nav className="text-sm text-muted-foreground">
          <a href="/tasks" className="hover:text-foreground">
            {t('assignments.my_assignments', { defaultValue: 'My Tasks' })}
          </a>
          <span className="mx-2">/</span>
          <span className="text-foreground">
            {t('assignments.detail.breadcrumb', {
              id: assignment.id.slice(0, 8),
              defaultValue: `Task #${assignment.id.slice(0, 8)}`
            })}
          </span>
        </nav>
      </div>

      {/* Engagement Context Banner (if engagement-linked) */}
      {engagement && (
        <EngagementContextBanner
          engagementId={engagement.id}
          engagementTitle={engagement.title_en}
          engagementType={engagement.engagement_type}
          startDate={engagement.start_date}
          endDate={engagement.end_date}
          progressPercentage={engagement.progress_percentage}
          totalAssignments={engagement.total_assignments}
          completedAssignments={engagement.completed_assignments}
          onShowKanban={() => setShowKanbanDialog(true)}
        />
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Primary Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Assignment Metadata */}
          <AssignmentMetadataCard
            assignment={assignment}
            assigneeName={assignment.assignee_name}
          />

          {/* SLA Tracking */}
          {sla && <SLACountdown sla={sla} />}

          {/* Work Item Preview */}
          <WorkItemPreview assignment={assignment} />

          {/* Comments Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              {t('assignments.comments.title', { defaultValue: 'Comments' })}
            </h2>
            <CommentForm assignmentId={id} ref={commentInputRef} />
            <CommentList comments={comments} assignmentId={id} />
          </div>

          {/* Checklist Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              {t('assignments.checklist.title', { defaultValue: 'Checklist' })}
            </h2>
            <ChecklistSection
              items={checklist_items}
              onToggleItem={(itemId, completed) => {
                toggleChecklistItem.mutate({
                  item_id: itemId,
                  assignment_id: id,
                  completed,
                });
              }}
              onAddItem={(text) => {
                addChecklistItem.mutate({
                  assignment_id: id,
                  text,
                });
              }}
              onImportTemplate={(templateId) => {
                importChecklistTemplate.mutate({
                  assignment_id: id,
                  template_id: templateId,
                });
              }}
              disabled={assignment.status === 'completed' || assignment.status === 'cancelled'}
            />
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-6">
          {/* Observers List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              {t('assignments.observers.title', { defaultValue: 'Observers' })}
            </h2>
            <ObserversList observers={observers} assignmentId={id} />
          </div>

          {/* Related Tasks (if engagement-linked) */}
          {engagement && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                {t('assignments.related_tasks.title', { defaultValue: 'Related Tasks' })}
              </h2>
              {/* TODO: Fetch related assignments and pass to RelatedTasksList */}
              {/* <RelatedTasksList
                assignments={[]}
                currentAssignmentId={id}
                contextType="engagement"
              /> */}
              <div className="text-sm text-muted-foreground">
                {t('assignments.related_tasks.coming_soon', { defaultValue: 'Related tasks list coming soon' })}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              {t('assignments.timeline.title', { defaultValue: 'Timeline' })}
            </h2>
            <Timeline events={timeline} />
          </div>
        </div>
      </div>

      {/* Escalate Dialog */}
      <EscalateDialog
        assignmentId={id}
        open={showEscalateDialog}
        onOpenChange={setShowEscalateDialog}
      />

      {/* Engagement Kanban Dialog (only if engagement-linked) */}
      {/* TODO: Implement Kanban dialog with proper data fetching */}
      {/* {engagement && (
        <EngagementKanbanDialog
          open={showKanbanDialog}
          onClose={() => setShowKanbanDialog(false)}
          engagementTitle={engagement.title_en}
          assignments={[]}
          currentAssignmentId={id}
          stats={{
            total: engagement.total_assignments,
            todo: 0,
            in_progress: 0,
            review: 0,
            done: engagement.completed_assignments,
            progressPercentage: engagement.progress_percentage,
          }}
        />
      )} */}
    </div>
  );

  // Return content wrapped with error boundary (T073)
  return (
    <AssignmentErrorBoundary onRetry={refetch} t={t}>
      {content}
    </AssignmentErrorBoundary>
  );
}
