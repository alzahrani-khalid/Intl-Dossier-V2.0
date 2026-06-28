/**
 * useCreateDossierWizard<T> -- All-in-one wizard hook (D-01, D-02, INFRA-01, INFRA-05)
 *
 * Composes useFormDraft, useForm, useCreateDossier, useAIFieldAssist,
 * useDossierNameSimilarity, and useDraftMigration into a single generic hook.
 * Type-specific wizards pass a WizardConfig<T> and get back everything
 * needed to render and control the wizard.
 */

import { useState, useCallback, useMemo } from 'react'
import { useForm, type FieldValues, type DefaultValues } from 'react-hook-form'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { zodResolver } from '@/lib/form-resolver'
import { getDossierDetailPath } from '@/lib/dossier-routes'
import { useFormDraft } from '@/components/ui/form-wizard'
import { useCreateDossier } from '@/hooks/useDossier'
import { useAIFieldAssist } from '@/hooks/useAIFieldAssist'
import { useDossierNameSimilarity } from '@/hooks/useDossierNameSimilarity'
import type { DossierType, CreateDossierRequest } from '@/services/dossier-api'

import type { WizardConfig, CreateWizardReturn, WizardStepConfig } from '../config/types'
import { useDraftMigration } from './useDraftMigration'

/**
 * Per-step required-field map for "Next" validation (A-3/E-5/A-5). Keyed by the
 * step `id`; the hook injects `validate: () => form.trigger(fields)` onto each
 * matching step so advancing surfaces that step's errors. Triggering a field the
 * active form doesn't register is a harmless no-op, so this single shared map
 * safely covers every wizard variant — the person / elected-official `basic`
 * step adds last-name + nationality on top of the universal name fields, while
 * other wizards only validate the names.
 */
export const STEP_VALIDATION_FIELDS: Record<string, string[]> = {
  basic: ['name_en', 'name_ar', 'last_name_en', 'last_name_ar', 'nationality_id'],
  'engagement-details': ['engagement_type', 'engagement_category', 'start_date', 'end_date'],
  'office-term': ['office_name_en', 'office_name_ar', 'country_id', 'term_start', 'term_end'],
}

export function useCreateDossierWizard<T extends FieldValues>(
  config: WizardConfig<T>,
): CreateWizardReturn<T> {
  const { t } = useTranslation(['dossier', 'form-wizard'])
  const navigate = useNavigate()

  // 1. Draft migration -- runs once on mount (INFRA-07)
  useDraftMigration()

  // 2. Draft persistence (INFRA-05)
  const draftKey = `dossier-create-${config.type}`
  const { draft, saveDraft, clearDraft, hasDraft, isDraftSaving } = useFormDraft<
    Record<string, unknown>
  >(draftKey, config.defaultValues as unknown as Record<string, unknown>)

  // 3. Form state (D-02)
  const form = useForm<T>({
    resolver: zodResolver(config.schema),
    defaultValues: draft as DefaultValues<T>,
    mode: 'onChange',
  })

  // 4. Step navigation
  const [currentStep, setCurrentStep] = useState<number>(0)

  // 5. Duplicate detection -- cast through unknown for generic T field access
  const nameEn = form.watch('name_en' as never) as unknown as string
  const nameAr = form.watch('name_ar' as never) as unknown as string | undefined
  useDossierNameSimilarity(nameEn, nameAr, {
    type: config.type,
    threshold: 0.4,
    enabled: (nameEn?.length ?? 0) >= 3,
  })

  // 6. AI field assist
  const aiAssist = useAIFieldAssist()

  const handleAIGenerate = useCallback((): void => {
    void aiAssist.generate({
      dossier_type: config.type as DossierType,
      description: nameEn ?? '',
    })
  }, [aiAssist, config.type, nameEn])

  // 7. Submission
  const createMutation = useCreateDossier()

  const handleComplete = useCallback(async (): Promise<void> => {
    if (createMutation.isPending) return

    // A-3/E-5/A-5: enforce the full per-type Zod schema before building the
    // payload. Abort (letting RHF surface field errors) when invalid so an
    // incomplete record can't persist or 500 at the DB.
    const isFormValid = await form.trigger()
    if (!isFormValid) return

    try {
      const values = form.getValues()

      const createData: CreateDossierRequest = {
        type: config.type,
        name_en: values.name_en as string,
        name_ar: values.name_ar as string,
        abbreviation: (values.abbreviation as string) || undefined,
        description_en: (values.description_en as string) || undefined,
        description_ar: (values.description_ar as string) || undefined,
        status: values.status as CreateDossierRequest['status'],
        sensitivity_level: values.sensitivity_level as number,
        tags: (values.tags as string[]) || [],
        extensionData: config.filterExtensionData(values),
      }

      // person_subtype is included in extensionData via filterExtensionData

      const newDossier = await createMutation.mutateAsync(createData)

      // Run optional postCreate hook AFTER the dossier is created but BEFORE
      // clearing the draft and navigating. Failures are logged and swallowed
      // so a participants-insert failure never rolls back the dossier itself
      // (see Plan 29-05 RESEARCH §6.4).
      if (config.postCreate != null) {
        try {
          await config.postCreate(newDossier.id, values)
        } catch (err) {
          console.warn('postCreate hook failed', err)
          toast.warning(
            t('form-wizard:postCreateWarning', {
              defaultValue:
                'Dossier created, but some related records (e.g. participants) failed to save.',
            }),
          )
        }
      }

      clearDraft()
      // Success toast is shown by useCreateDossier.onSuccess (single source).

      if (config.onSuccess != null) {
        config.onSuccess(newDossier.id, newDossier.type as DossierType)
      } else if (config.detailRouteSegment != null) {
        // Subtype wizards (e.g. elected officials submit as DB type 'person')
        // override the detail route so create lands on the correct shell (R16-02).
        void navigate({ to: `/dossiers/${config.detailRouteSegment}/${newDossier.id}` })
      } else {
        void navigate({
          to: getDossierDetailPath(newDossier.id, newDossier.type as DossierType),
        })
      }
    } catch {
      // Error toast handled by useCreateDossier onError
    }
  }, [createMutation, form, config, clearDraft, t, navigate])

  // 8. Save draft
  const handleSaveDraft = useCallback((): void => {
    saveDraft()
    toast.success(t('form-wizard:draftSaved'))
  }, [saveDraft, t])

  // 9. Cancel
  const handleCancel = useCallback((): void => {
    window.history.back()
  }, [])

  // 10. canComplete -- valid form + minimum name lengths (A-3/E-5)
  const canComplete =
    form.formState.isValid &&
    (nameEn?.length ?? 0) >= 2 &&
    (nameAr != null ? nameAr.length >= 2 : false)

  // 11. Per-step "Next" validation (A-3/E-5/A-5): inject a validate() that
  // triggers the current step's required fields so "Next" surfaces that step's
  // errors instead of deferring everything to Complete. Steps with no field
  // mapping (or that already supply a validate) pass through unchanged.
  const steps = useMemo<WizardStepConfig[]>(
    () =>
      config.steps.map((step) => {
        if (step.validate != null) return step
        const fields = STEP_VALIDATION_FIELDS[step.id]
        if (fields == null) return step
        return {
          ...step,
          validate: (): Promise<boolean> => form.trigger(fields as never),
        }
      }),
    [config.steps, form],
  )

  return {
    type: config.type,
    form,
    currentStep,
    setCurrentStep,
    steps,
    hasDraft,
    isDraftSaving,
    handleComplete,
    handleCancel,
    handleSaveDraft,
    handleAIGenerate,
    isSubmitting: createMutation.isPending,
    canComplete,
  }
}
