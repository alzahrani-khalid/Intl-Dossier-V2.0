/**
 * CommitmentQuickForm Component
 * Feature: 033-unified-work-creation-hub
 * Updated for: 035-dossier-context (Smart Dossier Context Inheritance)
 *
 * Simplified commitment creation form for the work creation palette.
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
import { CalendarIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
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
import { Badge } from '@/components/ui/badge'
import { useCreateCommitment } from '@/hooks/useCommitments'
import type { CreateCommitmentInput, Commitment } from '@/types/commitment.types'
import type { CreationContext } from '../hooks/useCreationContext'
import type { DossierOption } from '../DossierPicker'
import { useCreateWorkItemDossierLinks } from '@/hooks/useCreateWorkItemDossierLinks'
import { DossierContextBadge, DossierSelector, type SelectedDossier } from '@/components/Dossier'
import type { InheritanceSource, ContextEntityType } from '@/types/dossier-context.types'
import type { DossierType } from '@/types/relationship.types'

// Validation schema
const commitmentQuickFormSchema = z.object({
  title: z.string().min(1, 'validation.titleRequired').max(200, 'validation.titleMaxLength'),
  description: z.string().min(1, 'validation.descriptionRequired'),
  due_date: z.date({
    required_error: 'validation.dueDateRequired',
  }),
  priority: z.enum(['low', 'medium', 'high', 'critical'] as const),
  owner_type: z.enum(['internal', 'external'] as const),
})

type CommitmentQuickFormValues = z.infer<typeof commitmentQuickFormSchema>

export interface CommitmentQuickFormProps {
  /** Dossier ID for linking (optional - can be selected via DossierSelector) */
  dossierId?: string
  creationContext: CreationContext
  selectedDossier?: DossierOption
  onSuccess?: (commitment: Commitment) => void
  onCancel?: () => void
}

export function CommitmentQuickForm({
  dossierId,
  creationContext,
  selectedDossier,
  onSuccess,
  onCancel,
}: CommitmentQuickFormProps) {
  const { t, i18n } = useTranslation(['work-creation', 'commitments', 'dossier-context'])
  const isRTL = i18n.language === 'ar'

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

  const createMutation = useCreateCommitment()

  // Hook for creating dossier links after commitment creation
  const createDossierLinksMutation = useCreateWorkItemDossierLinks({
    onError: (error) => {
      // Log but don't fail the whole operation - commitment was created successfully
      console.warn('Failed to create dossier links:', error)
    },
  })

  const isPending = createMutation.isPending || createDossierLinksMutation.isPending

  const form = useForm<CommitmentQuickFormValues>({
    resolver: zodResolver(commitmentQuickFormSchema),
    defaultValues: {
      title: '',
      description: '',
      due_date: new Date(),
      priority: 'medium',
      owner_type: 'internal',
    },
  })

  const onSubmit = (values: CommitmentQuickFormValues) => {
    // Validate dossier is selected (US4 requirement)
    const effectiveDossierId = getEffectiveDossierId()
    if (!effectiveDossierId) {
      setDossierError(t('dossier-context:validation.dossier_required'))
      return
    }

    // Format due_date as ISO date string (YYYY-MM-DD)
    const dueDateStr = values.due_date.toISOString().split('T')[0] as string

    const input: CreateCommitmentInput = {
      dossier_id: effectiveDossierId,
      title: values.title,
      description: values.description,
      due_date: dueDateStr,
      priority: values.priority,
      owner_type: values.owner_type,
      // Note: tracking_mode is determined by service based on owner_type (database constraint)
      proof_required: false,
      // Context tracking
      created_from_route: creationContext.route,
      created_from_entity: creationContext.createdFromEntity
        ? JSON.stringify(creationContext.createdFromEntity)
        : undefined,
    }

    createMutation.mutate(input, {
      onSuccess: async (data) => {
        // Create dossier links if we have dossier context
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
              work_item_type: 'commitment',
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

        form.reset()
        onSuccess?.(data)
      },
    })
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
            hint={t('form.dossierHint', 'Select the dossier this commitment relates to')}
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
              <FormLabel className="text-start block">{t('commitments:form.title')} *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('commitments:form.titlePlaceholder')}
                  className="min-h-11"
                  autoFocus
                />
              </FormControl>
              <FormMessage>
                {form.formState.errors.title?.message &&
                  t(`commitments:${form.formState.errors.title.message}`)}
              </FormMessage>
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
                {t('commitments:form.description')} *
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={t('commitments:form.descriptionPlaceholder')}
                  className="min-h-20 resize-none"
                />
              </FormControl>
              <FormMessage>
                {form.formState.errors.description?.message &&
                  t(`commitments:${form.formState.errors.description.message}`)}
              </FormMessage>
            </FormItem>
          )}
        />

        {/* Due Date and Priority Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Due Date */}
          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-start">{t('commitments:form.dueDate')} *</FormLabel>
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
                          <span>{t('commitments:form.dueDate')}</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      locale={isRTL ? ar : enUS}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage>
                  {form.formState.errors.due_date?.message &&
                    t(`commitments:${form.formState.errors.due_date.message}`)}
                </FormMessage>
              </FormItem>
            )}
          />

          {/* Priority */}
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-start block">{t('commitments:form.priority')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="min-h-11">
                      <SelectValue placeholder={t('commitments:priority.label')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">{t('commitments:priority.low')}</SelectItem>
                    <SelectItem value="medium">{t('commitments:priority.medium')}</SelectItem>
                    <SelectItem value="high">{t('commitments:priority.high')}</SelectItem>
                    <SelectItem value="critical">{t('commitments:priority.critical')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Owner Type */}
        <FormField
          control={form.control}
          name="owner_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-start block">{t('commitments:form.ownerType')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="min-h-11">
                    <SelectValue placeholder={t('commitments:ownerType.label')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="internal">{t('commitments:ownerType.internal')}</SelectItem>
                  <SelectItem value="external">{t('commitments:ownerType.external')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

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
              t('form.createCommitment', 'Create Commitment')
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default CommitmentQuickForm
