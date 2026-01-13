/**
 * DeliverableForm Component
 * Feature: commitment-deliverables
 *
 * Form for creating and editing MoU deliverables with:
 * - Bilingual title and description fields
 * - Mobile-first, RTL-compatible layout
 * - Zod validation schema
 * - Pre-populated values for edit mode
 * - 44x44px touch targets
 */

import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { cn } from '@/lib/utils'

import { useCreateDeliverable, useUpdateDeliverable } from '@/hooks/useDeliverables'

import type {
  DeliverableWithRelations,
  DeliverablePriority,
  DeliverableStatus,
  ResponsiblePartyType,
  CreateDeliverableInput,
  UpdateDeliverableInput,
} from '@/types/deliverable.types'

// Zod validation schema
const deliverableFormSchema = z.object({
  title_en: z.string().min(1, 'validation.titleRequired').max(200, 'validation.titleMaxLength'),
  title_ar: z.string().min(1, 'validation.titleRequired').max(200, 'validation.titleMaxLength'),
  description_en: z.string().optional().nullable(),
  description_ar: z.string().optional().nullable(),
  due_date: z.date({
    required_error: 'validation.dueDateRequired',
  }),
  priority: z.enum(['low', 'medium', 'high', 'urgent'] as const),
  status: z.enum([
    'pending',
    'not_started',
    'in_progress',
    'at_risk',
    'delayed',
    'completed',
    'cancelled',
  ] as const),
  responsible_party_type: z.enum(['internal', 'external'] as const),
  responsible_user_id: z.string().optional().nullable(),
  responsible_contact_name: z.string().optional().nullable(),
  responsible_contact_email: z.string().email().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable(),
})

type DeliverableFormValues = z.infer<typeof deliverableFormSchema>

export interface DeliverableFormProps {
  mouId: string
  deliverable?: DeliverableWithRelations
  onSuccess?: () => void
  onCancel?: () => void
}

export function DeliverableForm({ mouId, deliverable, onSuccess, onCancel }: DeliverableFormProps) {
  const { t, i18n } = useTranslation('deliverables')
  const isRTL = i18n.language === 'ar'
  const dateLocale = isRTL ? ar : enUS
  const isEditMode = !!deliverable

  const createMutation = useCreateDeliverable()
  const updateMutation = useUpdateDeliverable()
  const isPending = createMutation.isPending || updateMutation.isPending

  // Pre-populated values for edit mode
  const defaultValues: DeliverableFormValues = {
    title_en: deliverable?.title_en ?? '',
    title_ar: deliverable?.title_ar ?? '',
    description_en: deliverable?.description_en ?? '',
    description_ar: deliverable?.description_ar ?? '',
    due_date: deliverable?.due_date ? new Date(deliverable.due_date) : new Date(),
    priority: (deliverable?.priority as DeliverablePriority) ?? 'medium',
    status: (deliverable?.status as DeliverableStatus) ?? 'pending',
    responsible_party_type:
      (deliverable?.responsible_party_type as ResponsiblePartyType) ?? 'internal',
    responsible_user_id: deliverable?.responsible_user_id ?? null,
    responsible_contact_name: deliverable?.responsible_contact_name ?? '',
    responsible_contact_email: deliverable?.responsible_contact_email ?? '',
    notes: deliverable?.notes ?? '',
  }

  const form = useForm<DeliverableFormValues>({
    resolver: zodResolver(deliverableFormSchema),
    defaultValues,
  })

  const watchResponsiblePartyType = form.watch('responsible_party_type')

  const onSubmit = (values: DeliverableFormValues) => {
    if (isEditMode && deliverable) {
      // Update existing deliverable
      const updateInput: UpdateDeliverableInput = {
        title_en: values.title_en,
        title_ar: values.title_ar,
        description_en: values.description_en || null,
        description_ar: values.description_ar || null,
        due_date: format(values.due_date, 'yyyy-MM-dd'),
        priority: values.priority,
        status: values.status,
        responsible_party_type: values.responsible_party_type,
        responsible_user_id:
          values.responsible_party_type === 'internal' ? values.responsible_user_id : null,
        responsible_contact_name:
          values.responsible_party_type === 'external' ? values.responsible_contact_name : null,
        responsible_contact_email:
          values.responsible_party_type === 'external'
            ? values.responsible_contact_email || null
            : null,
        notes: values.notes || null,
      }

      updateMutation.mutate(
        { deliverableId: deliverable.id, input: updateInput },
        {
          onSuccess: () => {
            onSuccess?.()
          },
        },
      )
    } else {
      // Create new deliverable
      const createInput: CreateDeliverableInput = {
        mou_id: mouId,
        title_en: values.title_en,
        title_ar: values.title_ar,
        description_en: values.description_en || null,
        description_ar: values.description_ar || null,
        due_date: format(values.due_date, 'yyyy-MM-dd'),
        priority: values.priority,
        status: values.status,
        responsible_party_type: values.responsible_party_type,
        responsible_user_id:
          values.responsible_party_type === 'internal' ? values.responsible_user_id : null,
        responsible_contact_name:
          values.responsible_party_type === 'external' ? values.responsible_contact_name : null,
        responsible_contact_email:
          values.responsible_party_type === 'external'
            ? values.responsible_contact_email || null
            : null,
        notes: values.notes || null,
      }

      createMutation.mutate(createInput, {
        onSuccess: () => {
          onSuccess?.()
        },
      })
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Title English */}
        <FormField
          control={form.control}
          name="title_en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.titleEn')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('form.titleEnPlaceholder')}
                  className="min-h-11"
                  dir="ltr"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Title Arabic */}
        <FormField
          control={form.control}
          name="title_ar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.titleAr')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('form.titleArPlaceholder')}
                  className="min-h-11"
                  dir="rtl"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description English */}
        <FormField
          control={form.control}
          name="description_en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.descriptionEn')}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ''}
                  placeholder={t('form.descriptionPlaceholder')}
                  className="min-h-20 resize-none"
                  dir="ltr"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description Arabic */}
        <FormField
          control={form.control}
          name="description_ar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.descriptionAr')}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ''}
                  placeholder={t('form.descriptionPlaceholder')}
                  className="min-h-20 resize-none"
                  dir="rtl"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Due Date */}
        <FormField
          control={form.control}
          name="due_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t('form.dueDate')}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-start font-normal min-h-11',
                        !field.value && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className={cn('size-4', isRTL ? 'ms-2' : 'me-2')} />
                      {field.value
                        ? format(field.value, 'PP', { locale: dateLocale })
                        : t('form.selectDate')}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    locale={dateLocale}
                    disabled={(date) => date < new Date('1900-01-01')}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Priority and Status Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Priority */}
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.priority')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="min-h-11">
                      <SelectValue placeholder={t('form.selectPriority')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">{t('priority.low')}</SelectItem>
                    <SelectItem value="medium">{t('priority.medium')}</SelectItem>
                    <SelectItem value="high">{t('priority.high')}</SelectItem>
                    <SelectItem value="urgent">{t('priority.urgent')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.status')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="min-h-11">
                      <SelectValue placeholder={t('form.selectStatus')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">{t('status.pending')}</SelectItem>
                    <SelectItem value="not_started">{t('status.not_started')}</SelectItem>
                    <SelectItem value="in_progress">{t('status.in_progress')}</SelectItem>
                    <SelectItem value="at_risk">{t('status.at_risk')}</SelectItem>
                    <SelectItem value="delayed">{t('status.delayed')}</SelectItem>
                    <SelectItem value="completed">{t('status.completed')}</SelectItem>
                    <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Responsible Party Type */}
        <FormField
          control={form.control}
          name="responsible_party_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.responsiblePartyType')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="min-h-11">
                    <SelectValue placeholder={t('form.selectResponsibleType')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="internal">{t('form.internal')}</SelectItem>
                  <SelectItem value="external">{t('form.external')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Conditional fields based on responsible party type */}
        {watchResponsiblePartyType === 'internal' ? (
          <FormField
            control={form.control}
            name="responsible_user_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.responsibleUser')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder={t('form.responsibleUserPlaceholder')}
                    className="min-h-11"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <>
            <FormField
              control={form.control}
              name="responsible_contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.contactName')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder={t('form.contactNamePlaceholder')}
                      className="min-h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="responsible_contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.contactEmail')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      type="email"
                      placeholder={t('form.contactEmailPlaceholder')}
                      className="min-h-11"
                      dir="ltr"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.notes')}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ''}
                  placeholder={t('form.notesPlaceholder')}
                  className="min-h-20 resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="min-h-11 w-full sm:w-auto"
              disabled={isPending}
            >
              {t('actions.cancel')}
            </Button>
          )}
          <Button type="submit" className="min-h-11 w-full sm:flex-1" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className={cn('size-4 animate-spin', isRTL ? 'ms-2' : 'me-2')} />
                {t('actions.saving')}
              </>
            ) : isEditMode ? (
              t('actions.update')
            ) : (
              t('actions.create')
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default DeliverableForm
