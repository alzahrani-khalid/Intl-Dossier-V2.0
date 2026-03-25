/**
 * DeleteTaskDialog - Confirmation dialog for soft-deleting tasks
 * Feature: Task Soft Delete (Fix 4)
 *
 * Uses AlertDialog pattern with destructive variant.
 * Mobile-first, RTL-compatible.
 */

import { useTranslation } from 'react-i18next'
import { Loader2, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useDeleteTask } from '@/hooks/useTasks'

interface DeleteTaskDialogProps {
  taskId: string
  taskTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteTaskDialog({
  taskId,
  taskTitle,
  open,
  onOpenChange,
  onSuccess,
}: DeleteTaskDialogProps) {
  const { t } = useTranslation()
  const deleteTask = useDeleteTask()

  const handleDelete = async () => {
    try {
      await deleteTask.mutateAsync(taskId)
      onOpenChange(false)
      onSuccess?.()
    } catch {
      // Error handled by mutation hook
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-start">
            {t('tasks.deleteTask', 'Delete Task')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-start">
            {t(
              'tasks.deleteTaskConfirmation',
              'Are you sure you want to delete "{{title}}"? This action can be undone.',
              { title: taskTitle },
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <AlertDialogCancel className="h-11 min-w-full sm:min-w-[100px]">
            {t('common.cancel', 'Cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteTask.isPending}
            className="h-11 min-w-full sm:min-w-[100px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteTask.isPending ? (
              <Loader2 className="me-2 size-4 animate-spin" />
            ) : (
              <Trash2 className="me-2 size-4" />
            )}
            {t('common.delete', 'Delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
