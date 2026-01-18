/**
 * TaskQuickForm Component
 * Feature: 033-unified-work-creation-hub
 * Updated for: 035-dossier-context (Smart Dossier Context Inheritance)
 *
 * Simplified task creation form for the work creation palette.
 * Includes context tracking for audit trail and dossier linking.
 * Now includes DossierSelector for US4 compliance.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { CalendarIcon, Loader2, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormDescription,
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
import { Badge } from '@/components/ui/badge'
import { tasksAPI, type CreateTaskRequest } from '@/services/tasks-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { CreationContext } from '../hooks/useCreationContext'
import { useCreateWorkItemDossierLinks } from '@/hooks/useCreateWorkItemDossierLinks'
import { DossierContextBadge, DossierSelector, type SelectedDossier } from '@/components/Dossier'
import type { InheritanceSource, ContextEntityType } from '@/types/dossier-context.types'
import type { DossierType } from '@/types/relationship.types'

// Validation schema
const taskQuickFormSchema = z.object({
  title: z.string().min(1, 'validation.titleRequired').max(200, 'validation.titleMaxLength'),
  description: z.string().optional(),
  assignee_id: z.string().min(1, 'validation.assigneeRequired'),
  priority: z.enum(['low', 'medium', 'high', 'urgent'] as const),
  sla_deadline: z.date().optional().nullable(),
})

type TaskQuickFormValues = z.infer<typeof taskQuickFormSchema>

export interface TaskQuickFormProps {
  /** Dossier ID for linking (required when creating from generic pages) */
  dossierId?: string
  creationContext: CreationContext
  /** Pre-selected dossier info for display */
  selectedDossier?: { id: string; name_en: string; name_ar: string; type: string }
  engagementId?: string
  onSuccess?: (task: any) => void
  onCancel?: () => void
}

export function TaskQuickForm({
  dossierId,
  creationContext,
  selectedDossier,
  engagementId,
  onSuccess,
  onCancel,
}: TaskQuickFormProps) {
  const { t, i18n } = useTranslation(['work-creation', 'dossier-context'])
  const isRTL = i18n.language === 'ar'
  const queryClient = useQueryClient()

  // State for user-selected dossier when no context is available (US4)
  const [userSelectedDossiers, setUserSelectedDossiers] = useState<SelectedDossier[]>([])
  const [dossierError, setDossierError] = useState<string>('')

  // Determine if we have a dossier from any source
  const hasDossierContext = !!(selectedDossier || dossierId || creationContext.dossierId)

  // Get the effective dossier ID (from props, context, or user selection)
  const getEffectiveDossierId = () => {
    if (dossierId) return dossierId
    if (creationContext.dossierId) return creationContext.dossierId
    const firstDossier = userSelectedDossiers[0]
    if (firstDossier) return firstDossier.id
    return undefined
  }

  // Handle dossier selection change
  const handleDossierChange = (_: string[], dossiers: SelectedDossier[]) => {
    setUserSelectedDossiers(dossiers)
    if (dossiers.length > 0) {
      setDossierError('')
    }
  }

  const form = useForm<TaskQuickFormValues>({
    resolver: zodResolver(taskQuickFormSchema),
    defaultValues: {
      title: '',
      description: '',
      assignee_id: '',
      priority: 'medium',
      sla_deadline: null,
    },
  })

  // Hook for creating dossier links after task creation
  const createDossierLinksMutation = useCreateWorkItemDossierLinks({
    onError: (error) => {
      // Log but don't fail the whole operation - task was created successfully
      console.warn('Failed to create dossier links:', error)
    },
  })

  const createTaskMutation = useMutation({
    mutationFn: (request: CreateTaskRequest) => tasksAPI.createTask(request),
    onSuccess: async (data) => {
      // Invalidate task queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['unified-work'] })

      // Create dossier links if we have dossier context
      // Use explicit dossierId prop first, then fall back to context or user selection
      const finalDossierId = getEffectiveDossierId()
      if (finalDossierId && data?.id) {
        // Determine inheritance source based on creation context
        let inheritanceSource: InheritanceSource = 'direct'
        let inheritedFromType: ContextEntityType | undefined
        let inheritedFromId: string | undefined

        if (creationContext.engagementId) {
          inheritanceSource = 'engagement'
          inheritedFromType = 'engagement'
          inheritedFromId = creationContext.engagementId
        } else if (creationContext.afterActionId) {
          inheritanceSource = 'after_action'
          inheritedFromType = 'after_action'
          inheritedFromId = creationContext.afterActionId
        } else if (creationContext.positionId) {
          inheritanceSource = 'position'
          inheritedFromType = 'position'
          inheritedFromId = creationContext.positionId
        }

        try {
          await createDossierLinksMutation.mutateAsync({
            work_item_type: 'task',
            work_item_id: data.id,
            dossier_ids: [finalDossierId],
            inheritance_source: inheritanceSource,
            inherited_from_type: inheritedFromType,
            inherited_from_id: inheritedFromId,
            is_primary: true,
          })
        } catch {
          // Error already handled in hook - continue with success
        }
      }

      toast.success(t('form.taskCreated', 'Task created successfully'))
      form.reset()
      onSuccess?.(data)
    },
    onError: (error: any) => {
      toast.error(error.message || t('form.taskError', 'Failed to create task'))
    },
  })

  const isPending = createTaskMutation.isPending || createDossierLinksMutation.isPending

  const onSubmit = (values: TaskQuickFormValues) => {
    // Validate dossier is selected (US4 requirement)
    const effectiveDossierId = getEffectiveDossierId()
    if (!effectiveDossierId) {
      setDossierError(t('dossier-context:validation.dossier_required'))
      return
    }

    const request: CreateTaskRequest = {
      title: values.title,
      description: values.description,
      assignee_id: values.assignee_id,
      priority: values.priority,
      engagement_id: engagementId ?? creationContext.engagementId,
      sla_deadline: values.sla_deadline?.toISOString(),
      workflow_stage: 'todo',
      // Context tracking via source JSONB (legacy - for backwards compatibility)
      source: {
        created_from_route: creationContext.route,
        created_from_entity: creationContext.createdFromEntity,
        dossier_ids: [effectiveDossierId],
      },
    }

    createTaskMutation.mutate(request)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* T042/US4: Dossier context display or selector */}
        {/* Show badge when dossier is provided from props or context */}
        {selectedDossier && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm">
            <span className="text-muted-foreground">{t('form.linkedTo', 'Linked to')}:</span>
            <DossierContextBadge
              dossierId={selectedDossier.id}
              dossierType={(selectedDossier.type as any) ?? 'country'}
              nameEn={selectedDossier.name_en}
              nameAr={selectedDossier.name_ar}
              inheritanceSource="direct"
              isPrimary
              size="sm"
              clickable={false}
              showInheritance={false}
            />
          </div>
        )}
        {/* Fallback for dossierId-only case (no full dossier info) */}
        {!selectedDossier && dossierId && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm">
            <span className="text-muted-foreground">{t('form.linkedTo', 'Linked to')}:</span>
            <Badge variant="outline">{dossierId}</Badge>
          </div>
        )}
        {/* US4: Show DossierSelector when no dossier context is available */}
        {!hasDossierContext && (
          <DossierSelector
            value={userSelectedDossiers.map((d) => d.id)}
            onChange={handleDossierChange}
            required
            multiple={false}
            label={t('dossier-context:selector.title')}
            hint={t('form.dossierHint', 'Select the dossier this task relates to')}
            error={dossierError}
          />
        )}
        {/* Show badge for user-selected dossier */}
        {!hasDossierContext && userSelectedDossiers.length > 0 && userSelectedDossiers[0] && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm">
            <span className="text-muted-foreground">{t('form.linkedTo', 'Linked to')}:</span>
            <DossierContextBadge
              dossierId={userSelectedDossiers[0].id}
              dossierType={(userSelectedDossiers[0].type as DossierType) ?? 'country'}
              nameEn={userSelectedDossiers[0].name_en}
              nameAr={userSelectedDossiers[0].name_ar ?? ''}
              inheritanceSource="direct"
              isPrimary
              size="sm"
              clickable={false}
              showInheritance={false}
            />
          </div>
        )}

        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-start block">
                {t('form.taskTitle', 'Task Title')} *
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('form.taskTitlePlaceholder', 'Enter task title')}
                  className="min-h-11"
                  autoFocus
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
              <FormLabel className="text-start block">
                {t('form.taskDescription', 'Description')}
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={t(
                    'form.taskDescriptionPlaceholder',
                    'Enter task details (optional)',
                  )}
                  className="min-h-20 resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Assignee - TODO: Replace with user picker */}
        <FormField
          control={form.control}
          name="assignee_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-start block">{t('form.assignee', 'Assignee')} *</FormLabel>
              <FormControl>
                <div className="relative">
                  <User
                    className={cn(
                      'absolute top-3 size-4 text-muted-foreground',
                      isRTL ? 'end-3' : 'start-3',
                    )}
                  />
                  <Input
                    {...field}
                    placeholder={t('form.assigneePlaceholder', 'Enter user ID')}
                    className={cn('min-h-11', isRTL ? 'pe-10' : 'ps-10')}
                  />
                </div>
              </FormControl>
              <FormDescription className="text-start">
                {t('form.assigneeHint', 'Enter the user ID of the assignee')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Priority and SLA Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Priority */}
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-start block">{t('form.priority', 'Priority')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="min-h-11">
                      <SelectValue placeholder={t('form.selectPriority', 'Select priority')} />
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

          {/* SLA Deadline */}
          <FormField
            control={form.control}
            name="sla_deadline"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-start">
                  {t('form.slaDeadline', 'SLA Deadline')}
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'min-h-11 w-full justify-start text-start font-normal',
                          !field.value && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                        {field.value ? (
                          format(field.value, 'PPP', {
                            locale: isRTL ? ar : enUS,
                          })
                        ) : (
                          <span>{t('form.selectDate', 'Select date')}</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ?? undefined}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      locale={isRTL ? ar : enUS}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            className="min-h-11 w-full sm:w-auto"
          >
            {t('actions.cancel', 'Cancel')}
          </Button>
          <Button type="submit" disabled={isPending} className="min-h-11 w-full sm:flex-1">
            {isPending ? (
              <>
                <Loader2 className={`size-4 animate-spin ${isRTL ? 'ms-2' : 'me-2'}`} />
                {t('form.creating', 'Creating...')}
              </>
            ) : (
              t('form.createTask', 'Create Task')
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default TaskQuickForm
