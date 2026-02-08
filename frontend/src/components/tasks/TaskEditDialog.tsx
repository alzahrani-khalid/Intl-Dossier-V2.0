/**
 * TaskEditDialog - Modal for editing task details
 * Feature: Task Edit Flow (Fix 3)
 *
 * Uses react-hook-form + zod for validation.
 * Pre-populates from existing task, uses useUpdateTask with optimistic locking.
 * Mobile-first, RTL-compatible.
 */

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { UserPicker } from '@/components/Forms/UserPicker'
import { useUpdateTask } from '@/hooks/use-tasks'
import type { Database } from '../../../../backend/src/types/database.types'

type Task = Database['public']['Tables']['tasks']['Row']

const editTaskSchema = z.object({
  title: z.string().min(1, 'validation.titleRequired').max(200, 'validation.titleMaxLength'),
  description: z.string().optional(),
  assignee_id: z.string().min(1, 'validation.assigneeRequired'),
  priority: z.enum(['low', 'medium', 'high', 'urgent'] as const),
  workflow_stage: z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled'] as const),
  sla_deadline: z.date().optional().nullable(),
})

type EditTaskFormValues = z.infer<typeof editTaskSchema>

interface TaskEditDialogProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function TaskEditDialog({ task, open, onOpenChange, onSuccess }: TaskEditDialogProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const updateTask = useUpdateTask()

  const form = useForm<EditTaskFormValues>({
    resolver: zodResolver(editTaskSchema),
    defaultValues: {
      title: task.title,
      description: task.description || '',
      assignee_id: task.assignee_id || '',
      priority: (task.priority as EditTaskFormValues['priority']) || 'medium',
      workflow_stage: (task.workflow_stage as EditTaskFormValues['workflow_stage']) || 'todo',
      sla_deadline: task.sla_deadline ? new Date(task.sla_deadline) : null,
    },
  })

  // Reset form when task changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        title: task.title,
        description: task.description || '',
        assignee_id: task.assignee_id || '',
        priority: (task.priority as EditTaskFormValues['priority']) || 'medium',
        workflow_stage: (task.workflow_stage as EditTaskFormValues['workflow_stage']) || 'todo',
        sla_deadline: task.sla_deadline ? new Date(task.sla_deadline) : null,
      })
    }
  }, [open, task, form])

  const onSubmit = async (values: EditTaskFormValues) => {
    try {
      await updateTask.mutateAsync({
        taskId: task.id,
        data: {
          title: values.title,
          description: values.description || undefined,
          assignee_id: values.assignee_id,
          priority: values.priority,
          workflow_stage: values.workflow_stage,
          sla_deadline: values.sla_deadline?.toISOString() || undefined,
          last_known_updated_at: task.updated_at,
        },
      })
      onOpenChange(false)
      onSuccess?.()
    } catch {
      // Error handled by mutation hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-full sm:max-w-[640px]" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="text-start text-xl sm:text-2xl">
            {t('tasks.editTask', 'Edit Task')}
          </DialogTitle>
          <DialogDescription className="text-start">
            {t('tasks.editTaskDescription', 'Update the task details')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-start">{t('tasks.title', 'Title')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="h-11"
                      placeholder={t('tasks.titlePlaceholder', 'Task title...')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-start">
                    {t('tasks.description', 'Description')}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      className="resize-none"
                      placeholder={t('tasks.descriptionPlaceholder', 'Task description...')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assignee */}
            <FormField
              control={form.control}
              name="assignee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-start">{t('tasks.assignee', 'Assignee')}</FormLabel>
                  <FormControl>
                    <UserPicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority & Workflow Stage row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-start">{t('tasks.priority', 'Priority')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">{t('priority.low', 'Low')}</SelectItem>
                        <SelectItem value="medium">{t('priority.medium', 'Medium')}</SelectItem>
                        <SelectItem value="high">{t('priority.high', 'High')}</SelectItem>
                        <SelectItem value="urgent">{t('priority.urgent', 'Urgent')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="workflow_stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-start">
                      {t('tasks.workflowStage', 'Stage')}
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="todo">{t('workflow_stage.todo', 'To Do')}</SelectItem>
                        <SelectItem value="in_progress">
                          {t('workflow_stage.in_progress', 'In Progress')}
                        </SelectItem>
                        <SelectItem value="review">
                          {t('workflow_stage.review', 'Review')}
                        </SelectItem>
                        <SelectItem value="done">{t('workflow_stage.done', 'Done')}</SelectItem>
                        <SelectItem value="cancelled">
                          {t('workflow_stage.cancelled', 'Cancelled')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Deadline */}
            <FormField
              control={form.control}
              name="sla_deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-start">{t('tasks.deadline', 'Deadline')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full h-11 justify-start text-start font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          <CalendarIcon className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                          {field.value
                            ? format(field.value, 'PPP', { locale: isRTL ? ar : enUS })
                            : t('tasks.selectDeadline', 'Select deadline')}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ?? undefined}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-11 min-w-full sm:min-w-[100px]"
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                type="submit"
                disabled={updateTask.isPending}
                className="h-11 min-w-full sm:min-w-[100px]"
              >
                {updateTask.isPending && <Loader2 className="me-2 size-4 animate-spin" />}
                {t('common.save', 'Save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
