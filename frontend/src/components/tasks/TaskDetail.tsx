/**
 * TaskDetail Component
 * Feature: 025-unified-tasks-model
 * User Story: US1 - View My Tasks with Clear Titles
 * User Story: US2 - Track Team Collaboration
 * User Story: US4 - Link Tasks to Multiple Work Items
 * Task: T034, T048, T070
 *
 * Shows task.title as page header with mobile-first responsive design and RTL support
 * Integrates ContributorsList and AddContributorDialog for team collaboration
 * Integrates WorkItemLinker and LinkedItemsList for multi-work item support
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import {
  Clock,
  AlertCircle,
  User,
  Calendar,
  FileText,
  Link as LinkIcon,
  Edit,
  Trash2,
  UserPlus,
  Users,
  UserCheck,
  ExternalLink,
} from 'lucide-react';
import type { Database } from '../../../../backend/src/types/database.types';
import { SLAIndicator } from './SLAIndicator';
// import { ContributorsList } from './ContributorsList';
// import { AddContributorDialog } from './AddContributorDialog';
import { WorkItemLinker } from './WorkItemLinker';
import { LinkedItemsList } from './LinkedItemsList';
import { useUpdateTask } from '@/hooks/use-tasks';
// import { useTaskContributors, useRemoveContributor } from '@/hooks/use-contributors';

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskDetailProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onStatusChange?: (task: Task, newStatus: Task['status']) => void;
  showActions?: boolean;
  isTaskOwner?: boolean; // Whether current user is assignee or creator
}

export function TaskDetail({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  showActions = true,
  isTaskOwner = false,
}: TaskDetailProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Mutation hook for updating work items
  const updateTask = useUpdateTask();

  // Contributors management - temporarily disabled for migration
  // const [isAddContributorOpen, setIsAddContributorOpen] = useState(false);
  // const { data: contributors = [], isLoading: isLoadingContributors } =
  //   useTaskContributors(task.id);
  // const removeContributor = useRemoveContributor(task.id);

  const getPriorityColor = (priority: string): string => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getStatusColor = (status: string): string => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      review: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const isCompleted = task.status === 'completed' || task.status === 'cancelled';

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Page Header with Task Title */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          {/* Task Title - Mobile-first, RTL-compatible */}
          <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold flex-1 ${isRTL ? 'text-end' : 'text-start'}`}>
            {task.title}
          </h1>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(task)}>
                  <Edit className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('edit', 'Edit')}
                </Button>
              )}
              {onDelete && task.status !== 'completed' && (
                <Button variant="destructive" size="sm" onClick={() => onDelete(task)}>
                  <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('delete', 'Delete')}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge className={getPriorityColor(task.priority)}>
            {t(`priority.${task.priority}`, task.priority)}
          </Badge>
          <Badge className={getStatusColor(task.status)}>
            {t(`status.${task.status}`, task.status)}
          </Badge>
          <Badge variant="outline">
            {t(`workflow_stage.${task.workflow_stage}`, task.workflow_stage)}
          </Badge>
          {task.work_item_type && (
            <Badge variant="outline">
              <LinkIcon className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
              {t(`work_item.${task.work_item_type}`, task.work_item_type)}
            </Badge>
          )}
        </div>
      </div>

      {/* SLA Status Card - T079: Using detailed SLAIndicator component */}
      <SLAIndicator
        deadline={task.sla_deadline}
        isCompleted={isCompleted}
        completedAt={task.completed_at}
        mode="detailed"
      />

      {/* Task Details */}
      <Card>
        <CardHeader>
          <CardTitle className={isRTL ? 'text-end' : 'text-start'}>
            {t('task_details', 'Task Details')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Description */}
          {task.description && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">{t('description', 'Description')}</p>
              </div>
              <p className={`text-sm text-muted-foreground whitespace-pre-wrap ${isRTL ? 'text-end' : 'text-start'}`}>
                {task.description}
              </p>
            </div>
          )}

          <Separator />

          {/* Assignee */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">{t('assignee', 'Assignee')}</p>
            </div>
            <div className="ps-6">
              <p className="text-sm text-foreground">
                {(task as any).assignee_name || task.assignee_id || t('unassigned', 'Unassigned')}
              </p>
              {(task as any).assignee_email && (
                <a
                  href={`mailto:${(task as any).assignee_email}`}
                  className="text-xs text-primary hover:underline"
                >
                  {(task as any).assignee_email}
                </a>
              )}
            </div>
          </div>

          <Separator />

          {/* Workflow Stage */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">{t('workflow_stage', 'Workflow Stage')}</p>
            </div>
            <Badge variant="outline">
              {t(`workflow_stage.${task.workflow_stage}`, task.workflow_stage)}
            </Badge>
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">{t('created', 'Created')}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(task.created_at).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">{t('updated', 'Last Updated')}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(task.updated_at).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
              </p>
            </div>

            {task.completed_at && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{t('completed', 'Completed')}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(task.completed_at).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                </p>
              </div>
            )}
          </div>

          {/* Engagement Information - if task is linked to an engagement */}
          {(task as any).engagement && (
            <>
              <Separator />
              <div className="space-y-3">
                {/* Section Header */}
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{t('engagement', 'Engagement')}</p>
                </div>

                {/* Engagement Title */}
                <div className="ps-6">
                  <p className="text-sm font-semibold text-foreground">
                    {(task as any).engagement.title}
                  </p>
                </div>

                {/* Engagement Type & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ps-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t('type', 'Type')}</p>
                    <Badge variant="outline" className="capitalize">
                      {(task as any).engagement.engagement_type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t('date', 'Date')}</p>
                    <p className="text-sm">
                      {new Date((task as any).engagement.engagement_date).toLocaleDateString(
                        isRTL ? 'ar-SA' : 'en-US',
                        { year: 'numeric', month: 'long', day: 'numeric' }
                      )}
                    </p>
                  </div>
                </div>

                {/* Location */}
                {(task as any).engagement.location && (
                  <div className="ps-6">
                    <p className="text-xs text-muted-foreground mb-1">{t('location', 'Location')}</p>
                    <p className="text-sm text-foreground">{(task as any).engagement.location}</p>
                  </div>
                )}

                {/* Linked Dossier */}
                {(task as any).engagement.dossier && (
                  <div className="ps-6">
                    <p className="text-xs text-muted-foreground mb-1">
                      {t('related_dossier', 'Related Dossier')}
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="mt-1 h-9"
                    >
                      <a href={`/dossiers/${(task as any).engagement.dossier.id}`}>
                        <ExternalLink className={`h-3.5 w-3.5 ${isRTL ? 'ms-2' : 'me-2'}`} />
                        {isRTL
                          ? (task as any).engagement.dossier.name_ar
                          : (task as any).engagement.dossier.name_en}
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Contributors Section (US2 - Task T048) - Temporarily disabled for migration */}
      {/* <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Users className="h-5 w-5" />
              {t('contributors', 'Contributors')}
              {contributors.length > 0 && (
                <Badge variant="secondary" className="ms-2">
                  {contributors.length}
                </Badge>
              )}
            </CardTitle>

            {/* Add Contributor Button - Only for task owners *\/}
            {isTaskOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddContributorOpen(true)}
                className="h-11 min-w-11"
              >
                <UserPlus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('add_contributor', 'Add Contributor')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingContributors ? (
            <p className="text-sm text-muted-foreground text-start">
              {t('loading_contributors', 'Loading contributors...')}
            </p>
          ) : (
            <ContributorsList
              contributors={contributors}
              onRemove={isTaskOwner ? (contributorId) => removeContributor.mutate(contributorId) : undefined}
              showRemoveButton={isTaskOwner}
              maxDisplay={5}
            />
          )}
        </CardContent>
      </Card> */}

      {/* Linked Work Items Section (US4 - Task T070) */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <LinkIcon className="h-5 w-5" />
            {t('linked_work_items', 'Linked Work Items')}
            {(() => {
              // Parse source JSONB to get all linked items
              const source = task.source as any;
              const totalLinked =
                (source?.dossier_ids?.length || 0) +
                (source?.position_ids?.length || 0) +
                (source?.ticket_ids?.length || 0) +
                (task.work_item_id && task.work_item_type !== 'generic' ? 1 : 0);

              return totalLinked > 0 ? (
                <Badge variant="secondary" className="ms-2">
                  {totalLinked}
                </Badge>
              ) : null;
            })()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Display linked items */}
          {(() => {
            const taskWithWorkItems = task as any;
            const workItemsMap = new Map<string, any>();

            // Add single work item if exists
            if (task.work_item_id && task.work_item_type && task.work_item_type !== 'generic') {
              const key = `${task.work_item_type}-${task.work_item_id}`;
              const workItemTitle = isRTL
                ? (taskWithWorkItems.work_item_title_ar || taskWithWorkItems.work_item_title_en)
                : (taskWithWorkItems.work_item_title_en || taskWithWorkItems.work_item_title_ar);

              workItemsMap.set(key, {
                type: task.work_item_type,
                id: task.work_item_id,
                title: workItemTitle || `${task.work_item_type} #${task.work_item_id.substring(0, 8)}`,
              });
            }

            // Add multiple work items from API (fetched with titles), deduplicating
            if (taskWithWorkItems.work_items && Array.isArray(taskWithWorkItems.work_items)) {
              taskWithWorkItems.work_items.forEach((item: any) => {
                // Skip invalid items
                if (!item || !item.type || !item.id) return;

                const key = `${item.type}-${item.id}`;

                // Skip if already added (primary work item or duplicate)
                if (workItemsMap.has(key)) return;

                const title = isRTL
                  ? (item.title_ar || item.title_en)
                  : (item.title_en || item.title_ar);

                workItemsMap.set(key, {
                  type: item.type,
                  id: item.id,
                  title: title || `${t(`work_item.${item.type}`, item.type)} (${t('deleted', 'Deleted')})`,
                });
              });
            }

            // Convert to array and ensure no duplicates (defensive check)
            const workItems = Array.from(workItemsMap.values()).filter((item, index, self) =>
              index === self.findIndex((t) => t.type === item.type && t.id === item.id)
            );

            return workItems.length > 0 ? (
              <LinkedItemsList items={workItems} />
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {t('no_linked_items', 'No work items linked to this task')}
                </p>
              </div>
            );
          })()}

          {/* Work Item Linker for editing (if task owner) */}
          {isTaskOwner && !isCompleted && (
            <div className="pt-2 border-t mt-4 pt-4">
              <p className="text-sm text-muted-foreground mb-2">
                {t('edit_linked_items', 'Edit linked work items (re-link if deleted)')}
              </p>
              <WorkItemLinker
                selectedItems={(() => {
                  const taskWithWorkItems = task as any;
                  const itemsMap = new Map<string, any>();

                  // Add primary work item
                  if (task.work_item_id && task.work_item_type && task.work_item_type !== 'generic') {
                    const key = `${task.work_item_type}-${task.work_item_id}`;
                    const workItemTitle = isRTL
                      ? (taskWithWorkItems.work_item_title_ar || taskWithWorkItems.work_item_title_en)
                      : (taskWithWorkItems.work_item_title_en || taskWithWorkItems.work_item_title_ar);

                    itemsMap.set(key, {
                      type: task.work_item_type,
                      id: task.work_item_id,
                      title: workItemTitle || `${task.work_item_type} #${task.work_item_id.substring(0, 8)}`,
                    });
                  }

                  // Add items from source JSONB, deduplicating
                  if (taskWithWorkItems.work_items && Array.isArray(taskWithWorkItems.work_items)) {
                    taskWithWorkItems.work_items.forEach((item: any) => {
                      // Skip invalid items
                      if (!item || !item.type || !item.id) return;

                      const key = `${item.type}-${item.id}`;

                      // Skip if already added (primary work item or duplicate)
                      if (itemsMap.has(key)) return;

                      const title = isRTL
                        ? (item.title_ar || item.title_en)
                        : (item.title_en || item.title_ar);

                      itemsMap.set(key, {
                        type: item.type,
                        id: item.id,
                        title: title || `${t(`work_item.${item.type}`, item.type)} (${t('deleted', 'Deleted')})`,
                      });
                    });
                  }

                  return Array.from(itemsMap.values());
                })()}
                onItemsChange={async (newItems) => {
                  // Separate primary work item from additional items
                  const primaryItem = newItems[0];
                  const additionalItems = newItems.slice(1);

                  // Build source JSONB
                  const source: any = {
                    type: additionalItems.length > 0 ? 'multi' : 'single',
                  };

                  // Group additional items by type
                  const dossierIds = additionalItems
                    .filter((i) => i.type === 'dossier')
                    .map((i) => i.id);
                  const positionIds = additionalItems
                    .filter((i) => i.type === 'position')
                    .map((i) => i.id);
                  const ticketIds = additionalItems
                    .filter((i) => i.type === 'ticket')
                    .map((i) => i.id);

                  if (dossierIds.length > 0) source.dossier_ids = dossierIds;
                  if (positionIds.length > 0) source.position_ids = positionIds;
                  if (ticketIds.length > 0) source.ticket_ids = ticketIds;

                  // Update task via mutation hook
                  updateTask.mutate({
                    taskId: task.id,
                    data: {
                      work_item_type: primaryItem?.type || 'generic',
                      work_item_id: primaryItem?.id || null,
                      source: Object.keys(source).length > 1 ? source : null,
                      last_known_updated_at: task.updated_at, // For optimistic locking
                    },
                  });
                }}
                disabled={false}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Contributor Dialog - Temporarily disabled for migration */}
      {/* <AddContributorDialog
        open={isAddContributorOpen}
        onOpenChange={setIsAddContributorOpen}
        taskId={task.id}
        onSuccess={() => {
          setIsAddContributorOpen(false);
        }}
      /> */}
    </div>
  );
}
