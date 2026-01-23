/**
 * Legislation Form Component
 * Form for creating and editing legislation items
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useCreateLegislation, useUpdateLegislation } from '@/hooks/useLegislation'
import type {
  LegislationType,
  LegislationStatus,
  LegislationPriority,
  LegislationImpactLevel,
  CommentPeriodStatus,
  LegislationWithDetails,
  LegislationCreateInput,
  LegislationUpdateInput,
} from '@/types/legislation.types'

// Form schema
const legislationFormSchema = z.object({
  title_en: z.string().min(1, 'Title is required'),
  title_ar: z.string().optional(),
  short_title_en: z.string().optional(),
  short_title_ar: z.string().optional(),
  summary_en: z.string().optional(),
  summary_ar: z.string().optional(),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  type: z.enum([
    'law',
    'regulation',
    'directive',
    'policy',
    'resolution',
    'treaty',
    'amendment',
    'proposal',
    'executive_order',
    'decree',
    'other',
  ]),
  status: z
    .enum([
      'draft',
      'proposed',
      'under_review',
      'in_committee',
      'pending_vote',
      'passed',
      'enacted',
      'implemented',
      'superseded',
      'repealed',
      'expired',
      'withdrawn',
    ])
    .optional(),
  reference_number: z.string().optional(),
  jurisdiction: z.string().optional(),
  issuing_body: z.string().optional(),
  issuing_body_ar: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  impact_level: z.enum(['minimal', 'low', 'medium', 'high', 'transformational']).default('medium'),
  impact_summary_en: z.string().optional(),
  impact_summary_ar: z.string().optional(),
  introduced_date: z.string().optional(),
  effective_date: z.string().optional(),
  expiration_date: z.string().optional(),
  comment_period_status: z
    .enum(['not_started', 'open', 'closed', 'extended'])
    .default('not_started'),
  comment_period_start: z.string().optional(),
  comment_period_end: z.string().optional(),
  comment_instructions_en: z.string().optional(),
  comment_instructions_ar: z.string().optional(),
  comment_submission_url: z.string().url().optional().or(z.literal('')),
  source_url: z.string().url().optional().or(z.literal('')),
  official_text_url: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string()).default([]),
  sectors: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  dossier_id: z.string().uuid().optional().or(z.literal('')),
  parent_legislation_id: z.string().uuid().optional().or(z.literal('')),
})

type LegislationFormValues = z.infer<typeof legislationFormSchema>

interface LegislationFormProps {
  legislation?: LegislationWithDetails
  onSuccess?: (id: string) => void
  onCancel?: () => void
}

export function LegislationForm({ legislation, onSuccess, onCancel }: LegislationFormProps) {
  const { t, i18n } = useTranslation('legislation')
  const isRTL = i18n.language === 'ar'
  const isEditing = !!legislation

  const createMutation = useCreateLegislation()
  const updateMutation = useUpdateLegislation()

  const form = useForm<LegislationFormValues>({
    resolver: zodResolver(legislationFormSchema),
    defaultValues: {
      title_en: legislation?.title_en ?? '',
      title_ar: legislation?.title_ar ?? '',
      short_title_en: legislation?.short_title_en ?? '',
      short_title_ar: legislation?.short_title_ar ?? '',
      summary_en: legislation?.summary_en ?? '',
      summary_ar: legislation?.summary_ar ?? '',
      description_en: legislation?.description_en ?? '',
      description_ar: legislation?.description_ar ?? '',
      type: legislation?.type ?? 'law',
      status: legislation?.status ?? 'draft',
      reference_number: legislation?.reference_number ?? '',
      jurisdiction: legislation?.jurisdiction ?? '',
      issuing_body: legislation?.issuing_body ?? '',
      issuing_body_ar: legislation?.issuing_body_ar ?? '',
      priority: legislation?.priority ?? 'medium',
      impact_level: legislation?.impact_level ?? 'medium',
      impact_summary_en: legislation?.impact_summary_en ?? '',
      impact_summary_ar: legislation?.impact_summary_ar ?? '',
      introduced_date: legislation?.introduced_date ?? '',
      effective_date: legislation?.effective_date ?? '',
      expiration_date: legislation?.expiration_date ?? '',
      comment_period_status: legislation?.comment_period_status ?? 'not_started',
      comment_period_start: legislation?.comment_period_start ?? '',
      comment_period_end: legislation?.comment_period_end ?? '',
      comment_instructions_en: legislation?.comment_instructions_en ?? '',
      comment_instructions_ar: legislation?.comment_instructions_ar ?? '',
      comment_submission_url: legislation?.comment_submission_url ?? '',
      source_url: legislation?.source_url ?? '',
      official_text_url: legislation?.official_text_url ?? '',
      tags: legislation?.tags ?? [],
      sectors: legislation?.sectors ?? [],
      keywords: legislation?.keywords ?? [],
      dossier_id: legislation?.dossier_id ?? '',
      parent_legislation_id: legislation?.parent_legislation_id ?? '',
    },
  })

  const onSubmit = async (values: LegislationFormValues) => {
    // Clean up empty optional fields
    const cleanedValues = Object.fromEntries(
      Object.entries(values).filter(([_, v]) => v !== '' && v !== undefined),
    )

    if (isEditing && legislation) {
      const input: LegislationUpdateInput = {
        ...cleanedValues,
        version: legislation.version,
      } as LegislationUpdateInput

      updateMutation.mutate(
        { id: legislation.id, input },
        {
          onSuccess: (data) => {
            onSuccess?.(data.id)
          },
        },
      )
    } else {
      const input = cleanedValues as LegislationCreateInput

      createMutation.mutate(input, {
        onSuccess: (data) => {
          onSuccess?.(data.id)
        },
      })
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const legislationTypes: LegislationType[] = [
    'law',
    'regulation',
    'directive',
    'policy',
    'resolution',
    'treaty',
    'amendment',
    'proposal',
    'executive_order',
    'decree',
    'other',
  ]

  const legislationStatuses: LegislationStatus[] = [
    'draft',
    'proposed',
    'under_review',
    'in_committee',
    'pending_vote',
    'passed',
    'enacted',
    'implemented',
    'superseded',
    'repealed',
    'expired',
    'withdrawn',
  ]

  const priorities: LegislationPriority[] = ['low', 'medium', 'high', 'critical']

  const impactLevels: LegislationImpactLevel[] = [
    'minimal',
    'low',
    'medium',
    'high',
    'transformational',
  ]

  const commentPeriodStatuses: CommentPeriodStatus[] = ['not_started', 'open', 'closed', 'extended']

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-start">{t('form.sections.basic')}</CardTitle>
            <CardDescription className="text-start">{t('description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="title_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-start block">{t('form.fields.titleEn')} *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('form.placeholders.titleEn')}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title_ar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-start block">{t('form.fields.titleAr')}</FormLabel>
                    <FormControl>
                      <Input {...field} dir="rtl" className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="short_title_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-start block">
                      {t('form.fields.shortTitleEn')}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="short_title_ar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-start block">
                      {t('form.fields.shortTitleAr')}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} dir="rtl" className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reference_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-start block">
                    {t('form.fields.referenceNumber')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t('form.placeholders.referenceNumber')}
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="summary_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-start block">{t('form.fields.summaryEn')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="summary_ar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-start block">{t('form.fields.summaryAr')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} dir="rtl" rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Classification */}
        <Card>
          <CardHeader>
            <CardTitle className="text-start">{t('form.sections.classification')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-start block">{t('form.fields.type')} *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {legislationTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`type.${type}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isEditing && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-start block">{t('form.fields.status')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {legislationStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {t(`status.${status}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-start block">{t('form.fields.priority')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorities.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {t(`priority.${priority}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="impact_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-start block">
                      {t('form.fields.impactLevel')}
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {impactLevels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {t(`impact.${level}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="jurisdiction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-start block">
                      {t('form.fields.jurisdiction')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('form.placeholders.jurisdiction')}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="issuing_body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-start block">
                      {t('form.fields.issuingBody')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('form.placeholders.issuingBody')}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Key Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-start">{t('form.sections.dates')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="introduced_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-start block">
                      {t('form.fields.introducedDate')}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="date" className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="effective_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-start block">
                      {t('form.fields.effectiveDate')}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="date" className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiration_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-start block">
                      {t('form.fields.expirationDate')}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="date" className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Comment Period */}
        <Card>
          <CardHeader>
            <CardTitle className="text-start">{t('form.sections.commentPeriod')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="comment_period_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-start block">{t('commentPeriod.status')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {commentPeriodStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {t(`commentPeriod.${status}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="comment_period_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-start block">
                      {t('commentPeriod.startDate')}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="date" className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="comment_period_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-start block">{t('commentPeriod.endDate')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="comment_submission_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-start block">{t('commentPeriod.submitUrl')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="url" placeholder="https://..." className="h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Links & References */}
        <Card>
          <CardHeader>
            <CardTitle className="text-start">{t('form.sections.links')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="source_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-start block">{t('form.fields.sourceUrl')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="url"
                        placeholder={t('form.placeholders.sourceUrl')}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="official_text_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-start block">
                      {t('form.fields.officialTextUrl')}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="url" placeholder="https://..." className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="min-h-11"
            >
              {t('actions.cancel')}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting} className="min-h-11">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin me-2" />}
            {t('actions.save')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
