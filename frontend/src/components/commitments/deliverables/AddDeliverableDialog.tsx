/**
 * AddDeliverableDialog Component
 *
 * Dialog for creating/editing commitment deliverables with:
 * - Bilingual title and description fields
 * - Type selection with visual icons
 * - Due date picker
 * - Weight slider for progress calculation
 *
 * Mobile-first responsive design with RTL support.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Target,
  FileText,
  Users,
  ClipboardCheck,
  ArrowRight,
  Send,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCreateDeliverable, useUpdateDeliverable } from '@/hooks/useCommitmentDeliverables'
import type {
  CommitmentDeliverable,
  CommitmentDeliverableType,
  CreateCommitmentDeliverableInput,
} from '@/types/commitment-deliverable.types'

// Form validation schema
const formSchema = z.object({
  title_en: z.string().min(1, 'Required').max(200),
  title_ar: z.string().max(200).optional(),
  description_en: z.string().max(1000).optional(),
  description_ar: z.string().max(1000).optional(),
  deliverable_type: z.enum([
    'milestone',
    'document',
    'meeting',
    'review',
    'follow_up',
    'report',
    'custom',
  ]),
  due_date: z.string().min(1, 'Required'),
  weight: z.number().min(1).max(10),
  notes: z.string().max(500).optional(),
})

type FormValues = z.infer<typeof formSchema>

// Icon mapping for deliverable types
const TYPE_ICONS: Record<CommitmentDeliverableType, typeof FileText> = {
  milestone: Target,
  document: FileText,
  meeting: Users,
  review: ClipboardCheck,
  follow_up: ArrowRight,
  report: Send,
  custom: CheckCircle,
}

// Color mapping for deliverable types
const TYPE_COLORS: Record<CommitmentDeliverableType, string> = {
  milestone: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  document: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  meeting: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  review: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  follow_up: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  report: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  custom: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
}

const DELIVERABLE_TYPES: CommitmentDeliverableType[] = [
  'milestone',
  'document',
  'meeting',
  'review',
  'follow_up',
  'report',
  'custom',
]

interface AddDeliverableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  commitmentId: string
  commitmentDueDate: string
  defaultType?: CommitmentDeliverableType | null
  editDeliverable?: CommitmentDeliverable | null
}

export function AddDeliverableDialog({
  open,
  onOpenChange,
  commitmentId,
  commitmentDueDate,
  defaultType,
  editDeliverable,
}: AddDeliverableDialogProps) {
  const { t, i18n } = useTranslation('commitment-deliverables')
  const isRTL = i18n.language === 'ar'

  const createMutation = useCreateDeliverable()
  const updateMutation = useUpdateDeliverable()

  const isEditing = !!editDeliverable
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title_en: '',
      title_ar: '',
      description_en: '',
      description_ar: '',
      deliverable_type: defaultType || 'milestone',
      due_date: commitmentDueDate,
      weight: 1,
      notes: '',
    },
  })

  // Reset form when dialog opens/closes or edit target changes
  useEffect(() => {
    if (open) {
      if (editDeliverable) {
        form.reset({
          title_en: editDeliverable.title_en,
          title_ar: editDeliverable.title_ar || '',
          description_en: editDeliverable.description_en || '',
          description_ar: editDeliverable.description_ar || '',
          deliverable_type: editDeliverable.deliverable_type,
          due_date: editDeliverable.due_date,
          weight: editDeliverable.weight,
          notes: editDeliverable.notes || '',
        })
      } else {
        form.reset({
          title_en: '',
          title_ar: '',
          description_en: '',
          description_ar: '',
          deliverable_type: defaultType || 'milestone',
          due_date: commitmentDueDate,
          weight: 1,
          notes: '',
        })
      }
    }
  }, [open, editDeliverable, defaultType, commitmentDueDate, form])

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && editDeliverable) {
        await updateMutation.mutateAsync({
          deliverableId: editDeliverable.id,
          commitmentId,
          input: {
            title_en: values.title_en,
            title_ar: values.title_ar || undefined,
            description_en: values.description_en || undefined,
            description_ar: values.description_ar || undefined,
            deliverable_type: values.deliverable_type,
            due_date: values.due_date,
            weight: values.weight,
            notes: values.notes || undefined,
          },
        })
      } else {
        await createMutation.mutateAsync({
          commitment_id: commitmentId,
          title_en: values.title_en,
          title_ar: values.title_ar || undefined,
          description_en: values.description_en || undefined,
          description_ar: values.description_ar || undefined,
          deliverable_type: values.deliverable_type,
          due_date: values.due_date,
          weight: values.weight,
          notes: values.notes || undefined,
        })
      }
      onOpenChange(false)
    } catch (error) {
      // Error is handled by mutation
    }
  }

  const selectedType = form.watch('deliverable_type')
  const currentWeight = form.watch('weight')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="text-start">
            {isEditing ? t('form.editDeliverable') : t('form.addDeliverable')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Type Selection */}
          <div className="space-y-2">
            <Label className="text-start">{t('form.type')}</Label>
            <Select
              value={selectedType}
              onValueChange={(value) =>
                form.setValue('deliverable_type', value as CommitmentDeliverableType)
              }
            >
              <SelectTrigger className="min-h-11">
                <SelectValue placeholder={t('form.selectType')} />
              </SelectTrigger>
              <SelectContent>
                {DELIVERABLE_TYPES.map((type) => {
                  const Icon = TYPE_ICONS[type]
                  return (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'h-6 w-6 rounded flex items-center justify-center',
                            TYPE_COLORS[type],
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span>{t(`types.${type}`)}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Title (English) */}
          <div className="space-y-2">
            <Label htmlFor="title_en" className="text-start">
              {t('form.titleEn')} *
            </Label>
            <Input
              id="title_en"
              {...form.register('title_en')}
              placeholder={t('form.titleEnPlaceholder')}
              className="min-h-11"
            />
            {form.formState.errors.title_en && (
              <p className="text-xs text-destructive">{form.formState.errors.title_en.message}</p>
            )}
          </div>

          {/* Title (Arabic) */}
          <div className="space-y-2">
            <Label htmlFor="title_ar" className="text-start">
              {t('form.titleAr')}
            </Label>
            <Input
              id="title_ar"
              {...form.register('title_ar')}
              placeholder={t('form.titleArPlaceholder')}
              className="min-h-11"
              dir="rtl"
            />
          </div>

          {/* Description (English) */}
          <div className="space-y-2">
            <Label htmlFor="description_en" className="text-start">
              {t('form.descriptionEn')}
            </Label>
            <Textarea
              id="description_en"
              {...form.register('description_en')}
              placeholder={t('form.descriptionPlaceholder')}
              rows={2}
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date" className="text-start">
              {t('form.dueDate')} *
            </Label>
            <Input id="due_date" type="date" {...form.register('due_date')} className="min-h-11" />
            {form.formState.errors.due_date && (
              <p className="text-xs text-destructive">{form.formState.errors.due_date.message}</p>
            )}
          </div>

          {/* Weight Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-start">{t('form.weight')}</Label>
              <span className="text-sm font-medium text-primary">{currentWeight}</span>
            </div>
            <Slider
              value={[currentWeight]}
              onValueChange={([value]) => form.setValue('weight', value)}
              min={1}
              max={10}
              step={1}
              className="py-2"
            />
            <p className="text-xs text-muted-foreground text-start">
              {t('form.weightDescription')}
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-start">
              {t('form.notes')}
            </Label>
            <Textarea
              id="notes"
              {...form.register('notes')}
              placeholder={t('form.notesPlaceholder')}
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="min-h-11"
            >
              {t('form.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-h-11">
              {isSubmitting && (
                <Loader2 className={cn('h-4 w-4 animate-spin', isRTL ? 'ms-2' : 'me-2')} />
              )}
              {t('form.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
