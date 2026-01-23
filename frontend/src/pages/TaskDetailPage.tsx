/**
 * TaskDetailPage
 * Feature: 025-unified-tasks-model
 * User Story: US1 - View My Tasks with Clear Titles
 * Task: T036
 *
 * Fetches task with title and displays breadcrumb navigation
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useTask } from '../hooks/use-tasks'
import { TaskDetail } from '../components/tasks/TaskDetail'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { AlertCircle, ChevronRight } from 'lucide-react'

export function TaskDetailPage() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()
  const { id } = useParams({ from: '/_protected/tasks/$id' })

  const { data: task, isLoading, error } = useTask(id as string)

  const handleEdit = () => {
    // TODO: Navigate to edit page (to be implemented in future stories)
  }

  const handleDelete = async () => {
    // Soft delete task (to be implemented in future stories)
    if (confirm(t('confirm_delete_task', 'Are you sure you want to delete this task?'))) {
      // TODO: Implement delete
      // After deletion, navigate back to tasks list
      // await deleteTask(task.id);
      // navigate({ to: '/tasks' });
    }
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            {error.message || t('failed_to_load_task', 'Failed to load task. Please try again.')}
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => navigate({ to: '/tasks' })} className="mt-4">
          {t('back_to_tasks', 'Back to Tasks')}
        </Button>
      </div>
    )
  }

  return (
    <div
      className="container mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {/* Task Detail */}
      {!isLoading && task && (
        <>
          {/* Back Button - Mobile-first */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: '/tasks' })}
              className="mb-4"
            >
              <ChevronRight
                className={`size-4 ${isRTL ? '' : 'rotate-180'} ${isRTL ? 'ms-2' : 'me-2'}`}
              />
              {t('back_to_tasks', 'Back to Tasks')}
            </Button>
          </div>

          {/* Task Detail Component */}
          <TaskDetail task={task} onEdit={handleEdit} onDelete={handleDelete} showActions={true} />
        </>
      )}
    </div>
  )
}

export default TaskDetailPage
