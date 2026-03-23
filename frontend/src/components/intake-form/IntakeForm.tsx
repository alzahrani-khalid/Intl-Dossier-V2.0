import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@/lib/form-resolver'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { IntakeFormData } from '@/types/intake'
import { TypeSpecificFields } from '../type-specific-fields/TypeSpecificFields'
import { AttachmentUploader } from '../attachment-uploader/AttachmentUploader'
import { useCreateTicket, useGetSLAPreview } from '@/hooks/useIntakeApi'
import { DossierSelector, DossierContextBadge, type SelectedDossier } from '../dossier'
import type { DossierType } from '@/types/relationship.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

// Validation schema - dossierId is now required per US4
const createIntakeSchema = (t: any, tDossier: any) =>
  z.object({
    requestType: z.enum(['engagement', 'position', 'mou_action', 'foresight'], {
      error: t('form.requestType.required'),
    }),
    title: z.string().min(3, t('form.title.minLength')).max(200, t('form.title.maxLength')),
    titleAr: z.string().max(200, t('form.title.maxLength')).optional(),
    description: z
      .string()
      .min(10, t('form.description.minLength'))
      .max(5000, t('form.description.maxLength')),
    descriptionAr: z.string().max(5000, t('form.description.maxLength')).optional(),
    urgency: z.enum(['low', 'medium', 'high', 'critical'], {
      error: t('form.urgency.required'),
    }),
    // US4: dossierId is now required
    dossierId: z.string().uuid({ message: tDossier('validation.dossier_required') }),
    typeSpecificFields: z.record(z.string(), z.any()).optional(),
    attachmentIds: z.array(z.string().uuid()).optional(),
  })

interface IntakeFormProps {
  initialData?: Partial<IntakeFormData>
  mode?: 'create' | 'edit'
  onSuccess?: (ticketId: string, ticketNumber: string) => void
}

export const IntakeForm: React.FC<IntakeFormProps> = ({
  initialData,
  mode: _mode = 'create',
  onSuccess,
}) => {
  const { t, i18n } = useTranslation('intake')
  const { t: tDossier } = useTranslation('dossier-context')
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'

  const [attachmentIds, setAttachmentIds] = useState<string[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdTicket, setCreatedTicket] = useState<{
    id: string
    ticketNumber: string
  } | null>(null)

  // State for dossier selection (US4 requirement)
  const [selectedDossiers, setSelectedDossiers] = useState<SelectedDossier[]>([])
  const [dossierError, setDossierError] = useState<string>('')

  // Handle dossier selection change
  const handleDossierChange = (_: string[], dossiers: SelectedDossier[]) => {
    setSelectedDossiers(dossiers)
    const firstDossier = dossiers[0]
    if (firstDossier) {
      setValue('dossierId', firstDossier.id)
      setDossierError('')
    } else {
      setValue('dossierId', '' as unknown as string)
    }
  }

  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
    // @ts-expect-error Type instantiation too deep
  } = useForm<IntakeFormData, unknown, IntakeFormData>({
    resolver: zodResolver(createIntakeSchema(t, tDossier)),
    defaultValues: initialData || {
      requestType: 'engagement',
      urgency: 'medium',
    },
  })

  const requestType = watch('requestType')
  const urgency = watch('urgency')

  // API hooks
  const createTicketMutation = useCreateTicket()
  const { data: slaPreview } = useGetSLAPreview(urgency)

  // Handle form submission
  const onSubmit = async (data: IntakeFormData) => {
    try {
      const payload = {
        ...data,
        attachments: attachmentIds,
      }

      const result = await createTicketMutation.mutateAsync(payload)

      setCreatedTicket({
        id: result.id,
        ticketNumber: result.ticketNumber,
      })
      setShowSuccess(true)

      if (onSuccess) {
        onSuccess(result.id, result.ticketNumber)
      }
    } catch (error) {
      console.error('Failed to create ticket:', error)
    }
  }

  // Handle attachment uploads
  const handleAttachmentsChange = (newAttachmentIds: string[]) => {
    setAttachmentIds(newAttachmentIds)
    setValue('attachmentIds', newAttachmentIds)
  }

  return (
    <>
      {/* Success Dialog */}
      <Dialog open={showSuccess && !!createdTicket} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="size-6 text-success" />
            </div>
            <DialogTitle className="text-center">{t('success.title')}</DialogTitle>
            <DialogDescription className="text-center">
              {t('success.message', { ticketNumber: createdTicket?.ticketNumber })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-center gap-3 sm:justify-center">
            <Button onClick={() => navigate({ to: `/intake/tickets/${createdTicket?.id}` })}>
              {t('success.viewTicket')}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowSuccess(false)
                setCreatedTicket(null)
                reset()
                setAttachmentIds([])
                setSelectedDossiers([])
                setDossierError('')
              }}
            >
              {t('success.createAnother')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form */}
      <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8" dir={isRTL ? 'rtl' : 'ltr'}>
        <Card>
          <CardHeader>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Request Type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  {t('form.requestType.label')}
                  <span className="ms-1 text-destructive">*</span>
                </label>
                <select
                  {...register('requestType')}
                  className="flex h-12 w-full items-center rounded-field border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                >
                  <option value="">{t('form.requestType.placeholder')}</option>
                  <option value="engagement">{t('form.requestType.options.engagement')}</option>
                  <option value="position">{t('form.requestType.options.position')}</option>
                  <option value="mou_action">{t('form.requestType.options.mou_action')}</option>
                  <option value="foresight">{t('form.requestType.options.foresight')}</option>
                </select>
                {errors.requestType && (
                  <p className="mt-1 text-sm text-destructive">{errors.requestType.message}</p>
                )}
              </div>

              {/* Title (English) */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  {t('form.title.label')}
                  <span className="ms-1 text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  {...register('title')}
                  placeholder={t('form.title.placeholder')}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              {/* Title (Arabic) */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  {t('form.titleAr.label')}
                </label>
                <Input
                  type="text"
                  {...register('titleAr')}
                  placeholder={t('form.titleAr.placeholder')}
                  dir="rtl"
                />
                {errors.titleAr && (
                  <p className="mt-1 text-sm text-destructive">{errors.titleAr.message}</p>
                )}
              </div>

              {/* Description (English) */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  {t('form.description.label')}
                  <span className="ms-1 text-destructive">*</span>
                </label>
                <Textarea
                  {...register('description')}
                  placeholder={t('form.description.placeholder')}
                  rows={5}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              {/* Description (Arabic) */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  {t('form.descriptionAr.label')}
                </label>
                <Textarea
                  {...register('descriptionAr')}
                  placeholder={t('form.descriptionAr.placeholder')}
                  rows={5}
                  dir="rtl"
                />
                {errors.descriptionAr && (
                  <p className="mt-1 text-sm text-destructive">{errors.descriptionAr.message}</p>
                )}
              </div>

              {/* Urgency Level */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  {t('form.urgency.label')}
                  <span className="ms-1 text-destructive">*</span>
                </label>
                <select
                  {...register('urgency')}
                  className="flex h-12 w-full items-center rounded-field border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                >
                  <option value="">{t('form.urgency.placeholder')}</option>
                  <option value="low">{t('form.urgency.options.low')}</option>
                  <option value="medium">{t('form.urgency.options.medium')}</option>
                  <option value="high">{t('form.urgency.options.high')}</option>
                  <option value="critical">{t('form.urgency.options.critical')}</option>
                </select>
                {errors.urgency && (
                  <p className="mt-1 text-sm text-destructive">{errors.urgency.message}</p>
                )}
              </div>

              {/* US4: Dossier Selection (Required) */}
              <div>
                <DossierSelector
                  value={selectedDossiers.map((d) => d.id)}
                  onChange={handleDossierChange}
                  required
                  multiple={false}
                  label={tDossier('selector.title')}
                  hint={t('form.dossier.hint', 'Select the dossier this request relates to')}
                  error={dossierError || (errors.dossierId?.message as string)}
                />
                {/* Show selected dossier badge */}
                {selectedDossiers.length > 0 && selectedDossiers[0] && (
                  <div className="mt-2 flex items-center gap-2 rounded-md bg-muted p-2 text-sm">
                    <span className="text-muted-foreground">
                      {t('form.dossier.linkedTo', 'Linked to')}:
                    </span>
                    <DossierContextBadge
                      dossierId={selectedDossiers[0].id}
                      dossierType={(selectedDossiers[0].type as DossierType) ?? 'country'}
                      nameEn={selectedDossiers[0].name_en}
                      nameAr={selectedDossiers[0].name_ar ?? ''}
                      inheritanceSource="direct"
                      isPrimary
                      size="sm"
                      clickable={false}
                      showInheritance={false}
                    />
                  </div>
                )}
              </div>

              {/* Type-Specific Fields */}
              {requestType && (
                <TypeSpecificFields
                  requestType={requestType}
                  value={watch('typeSpecificFields')}
                  onChange={(fields) => setValue('typeSpecificFields', fields)}
                />
              )}

              {/* Attachments */}
              <AttachmentUploader
                attachmentIds={attachmentIds}
                onChange={handleAttachmentsChange}
                maxFileSize={25 * 1024 * 1024} // 25MB
                maxTotalSize={100 * 1024 * 1024} // 100MB
              />

              {/* SLA Preview */}
              {slaPreview && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <h3 className="mb-2 text-sm font-medium text-foreground">
                    {t('slaPreview.title')}
                  </h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      {t('slaPreview.acknowledgment')}: {slaPreview.acknowledgmentMinutes}{' '}
                      {t('slaPreview.minutes')}
                    </p>
                    <p>
                      {t('slaPreview.resolution')}: {slaPreview.resolutionHours}{' '}
                      {t('slaPreview.hours')}
                    </p>
                    {slaPreview.businessHoursOnly && (
                      <p className="text-xs">{t('slaPreview.businessHours')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {createTicketMutation.isError && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <p className="text-sm text-destructive">{t('error.message')}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
                <Button type="button" variant="outline" onClick={() => navigate({ to: '/intake' })}>
                  {t('actions.cancel')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    reset()
                    setSelectedDossiers([])
                    setDossierError('')
                  }}
                >
                  {t('actions.reset')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setValue('requestType', 'engagement')
                    setValue('title', 'New Partnership with ExampleCorp')
                    setValue('titleAr', 'شراكة جديدة مع شركة المثال')
                    setValue(
                      'description',
                      'Initial discussion for a strategic partnership with ExampleCorp to expand our market reach in the new region. This involves exploring potential joint ventures and co-marketing opportunities.',
                    )
                    setValue(
                      'descriptionAr',
                      'مناقشة أولية لشراكة استراتيجية مع شركة المثال لتوسيع نطاق وصولنا إلى السوق في المنطقة الجديدة. يتضمن ذلك استكشاف المشاريع المشتركة المحتملة وفرص التسويق المشترك.',
                    )
                    setValue('urgency', 'high')
                  }}
                >
                  {t('actions.fillMock')}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      {t('actions.submitting')}
                    </span>
                  ) : (
                    t('actions.submit')
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
