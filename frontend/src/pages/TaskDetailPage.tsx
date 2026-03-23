/**
 * TaskDetailPage
 * Feature: 025-unified-tasks-model
 * User Story: US1 - View My Tasks with Clear Titles
 * Task: T036
 *
 * Fetches task with title and displays breadcrumb navigation.
 * Includes Edit and Delete dialogs with undo support.
 */

import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useTask } from '../hooks/use-tasks'
import { useToast } from '../hooks/use-toast'
import { TaskDetail } from '../components/tasks/TaskDetail'
import { TaskEditDialog } from '../components/tasks/TaskEditDialog'
import { DeleteTaskDialog } from '../components/tasks/DeleteTaskDialog'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { AlertCircle, ChevronRight } from 'lucide-react'

export function TaskDetailPage() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()
  const { toast } = useToast()
  const { id } = useParams({ from: '/_protected/tasks/$id' })

  const { data: task, isLoading, error, refetch } = useTask(id as string)

  // Dialog states
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEdit = useCallback(() => {
    setIsEditOpen(true)
  }, [])

  const handleDelete = useCallback(() => {
    setIsDeleteOpen(true)
  }, [])

  const handleDeleteSuccess = useCallback(() => {
    // Show delete confirmation toast
    toast({
      title: t('tasks.deleted', 'Task Deleted'),
      description: t('tasks.deletedRedirecting', 'Task deleted. Redirecting...'),
      duration: 3000,
    })

    // Redirect after 3s
    undoTimerRef.current = setTimeout(() => {
      navigate({ to: '/tasks' })
    }, 3000)
  }, [navigate, toast, t])

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

          {/* Edit Dialog */}
          <TaskEditDialog
            task={task}
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            onSuccess={() => refetch()}
          />

          {/* Delete Dialog */}
          <DeleteTaskDialog
            taskId={task.id}
            taskTitle={task.title}
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            onSuccess={handleDeleteSuccess}
          />
        </>
      )}
    </div>
  )
}

