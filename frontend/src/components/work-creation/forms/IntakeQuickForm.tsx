/**
 * IntakeQuickForm Component
 * Feature: 033-unified-work-creation-hub
 * Updated for: 035-dossier-context (Smart Dossier Context Inheritance)
 *
 * Simplified intake ticket creation form for the work creation palette.
 * Includes context tracking for audit trail and dossier linking.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { Badge } from '@/components/ui/badge'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { CreationContext } from '../hooks/useCreationContext'
import type { CreateTicketRequest } from '@/types/intake'
import { DossierContextBadge, DossierSelector, type SelectedDossier } from '@/components/Dossier'
import type { DossierType } from '@/types/relationship.types'

// Validation schema
const intakeQuickFormSchema = z.object({
  requestType: z.enum(['engagement', 'position', 'mou_action', 'foresight'] as const),
  title: z.string().min(1, 'validation.titleRequired').max(200, 'validation.titleMaxLength'),
  description: z.string().min(1, 'validation.descriptionRequired'),
  urgency: z.enum(['low', 'medium', 'high', 'critical'] as const),
})

type IntakeQuickFormValues = z.infer<typeof intakeQuickFormSchema>

export interface IntakeQuickFormProps {
  dossierId?: string
  creationContext: CreationContext
  /** Pre-selected dossier info for display */
  selectedDossier?: { id: string; name_en: string; name_ar: string; type: string }
  onSuccess?: (ticket: any) => void
  onCancel?: () => void
}

// Supabase URL
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

/**
 * Create intake ticket via Edge Function
 */
async function createIntakeTicket(request: CreateTicketRequest): Promise<any> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/intake-tickets/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create ticket' }))
    throw new Error(error.message || 'Failed to create intake ticket')
  }

  return response.json()
}

export function IntakeQuickForm({
  dossierId,
  creationContext,
  selectedDossier,
  onSuccess,
  onCancel,
}: IntakeQuickFormProps) {
  const { t, i18n } = useTranslation(['work-creation', 'intake', 'dossier-context'])
  const isRTL = i18n.language === 'ar'
  const queryClient = useQueryClient()

  // State for user-selected dossier when no context is available
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

  const form = useForm<IntakeQuickFormValues>({
    resolver: zodResolver(intakeQuickFormSchema),
    defaultValues: {
      requestType: 'engagement',
      title: '',
      description: '',
      urgency: 'medium',
    },
  })

  const createMutation = useMutation({
    mutationFn: createIntakeTicket,
    onSuccess: (data) => {
      // Invalidate intake queries
      queryClient.invalidateQueries({ queryKey: ['intake-tickets'] })
      queryClient.invalidateQueries({ queryKey: ['unified-work'] })
      toast.success(t('form.intakeCreated', 'Intake request created successfully'))
      form.reset()
      onSuccess?.(data)
    },
    onError: (error: any) => {
      toast.error(error.message || t('form.intakeError', 'Failed to create intake request'))
    },
  })

  const isPending = createMutation.isPending

  const onSubmit = (values: IntakeQuickFormValues) => {
    // Validate dossier is selected
    const effectiveDossierId = getEffectiveDossierId()
    if (!effectiveDossierId) {
      setDossierError(t('dossier-context:validation.dossier_required'))
      return
    }

    const request: CreateTicketRequest = {
      requestType: values.requestType,
      title: values.title,
      description: values.description,
      urgency: values.urgency,
      dossierId: effectiveDossierId,
    }

    createMutation.mutate(request)
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
        {!selectedDossier && (dossierId || creationContext.dossierId) && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm">
            <span className="text-muted-foreground">
              {t('form.linkedTo', 'Linked to dossier')}:
            </span>
            <Badge variant="outline">{dossierId || creationContext.dossierId}</Badge>
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
            hint={t('form.dossierHint', 'Select the dossier this request relates to')}
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

        {/* Request Type */}
        <FormField
          control={form.control}
          name="requestType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-start block">
                {t('intake:form.requestType', 'Request Type')} *
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="min-h-11">
                    <SelectValue placeholder={t('intake:form.selectType', 'Select type')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="engagement">
                    {t('intake:requestTypes.engagement', 'Engagement')}
                  </SelectItem>
                  <SelectItem value="position">
                    {t('intake:requestTypes.position', 'Position')}
                  </SelectItem>
                  <SelectItem value="mou_action">
                    {t('intake:requestTypes.mou_action', 'MOU Action')}
                  </SelectItem>
                  <SelectItem value="foresight">
                    {t('intake:requestTypes.foresight', 'Foresight')}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-start block">
                {t('intake:form.title', 'Title')} *
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('intake:form.titlePlaceholder', 'Enter request title')}
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
                {t('intake:form.description', 'Description')} *
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={t('intake:form.descriptionPlaceholder', 'Describe your request')}
                  className="min-h-24 resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Urgency */}
        <FormField
          control={form.control}
          name="urgency"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-start block">
                {t('intake:form.urgency', 'Urgency')} *
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="min-h-11">
                    <SelectValue placeholder={t('intake:form.selectUrgency', 'Select urgency')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="low">{t('intake:urgency.low', 'Low')}</SelectItem>
                  <SelectItem value="medium">{t('intake:urgency.medium', 'Medium')}</SelectItem>
                  <SelectItem value="high">{t('intake:urgency.high', 'High')}</SelectItem>
                  <SelectItem value="critical">
                    {t('intake:urgency.critical', 'Critical')}
                  </SelectItem>
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
              t('form.createIntake', 'Submit Request')
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default IntakeQuickForm
