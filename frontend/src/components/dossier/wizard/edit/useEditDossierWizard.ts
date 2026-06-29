/**
 * useEditDossierWizard<T> -- edit-mode sibling of useCreateDossierWizard (A-1).
 *
 * Reuses the exact same WizardConfig<T> (schema, steps, filterExtensionData) as
 * the create flow so per-step Zod validation is never duplicated. The only
 * differences from create are:
 *   - no draft persistence / migration (drafts are a create-only concern)
 *   - no duplicate-name detection (an edited dossier always matches itself)
 *   - submit calls useUpdateDossier({ id, request }) instead of create
 *   - the form is seeded from the loaded dossier via `initialValues`
 *
 * Returns the same CreateWizardReturn<T> shape so CreateWizardShell renders it
 * unchanged (the shell only needs a different complete-button label).
 */

import { useCallback, useMemo, useState } from 'react'
import { useForm, type DefaultValues, type FieldValues } from 'react-hook-form'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { zodResolver } from '@/lib/form-resolver'
import { getDossierDetailPath } from '@/lib/dossier-routes'
import { useUpdateDossier } from '@/hooks/useDossier'
import type { DossierType, UpdateDossierRequest } from '@/services/dossier-api'

import type { CreateWizardReturn, WizardConfig, WizardStepConfig } from '../config/types'
import { STEP_VALIDATION_FIELDS } from '../hooks/useCreateDossierWizard'

interface EditWizardParams<T extends FieldValues> {
  dossierId: string
  // Form values reverse-mapped from the loaded dossier + its extension row.
  initialValues: Record<string, unknown>
  // Optional hook run AFTER the dossier update succeeds and BEFORE navigation,
  // mirroring the create flow's postCreate. Used by the engagement branch to
  // sync participant rows that don't live on the dossier extension. Failures are
  // surfaced as a warning toast and never roll back the dossier update.
  onAfterUpdate?: (values: T) => Promise<void>
}

export function useEditDossierWizard<T extends FieldValues>(
  config: WizardConfig<T>,
  { dossierId, initialValues, onAfterUpdate }: EditWizardParams<T>,
): CreateWizardReturn<T> {
  const { t } = useTranslation(['form-wizard'])
  const navigate = useNavigate()

  // Form state seeded from the existing dossier (same resolver as create).
  const form = useForm<T>({
    resolver: zodResolver(config.schema),
    defaultValues: initialValues as DefaultValues<T>,
    mode: 'onChange',
  })

  const [currentStep, setCurrentStep] = useState<number>(0)

  const nameEn = form.watch('name_en' as never) as unknown as string
  const nameAr = form.watch('name_ar' as never) as unknown as string | undefined

  const updateMutation = useUpdateDossier()

  const handleComplete = useCallback(async (): Promise<void> => {
    if (updateMutation.isPending) return

    // Enforce the full per-type Zod schema before building the payload, exactly
    // like create — abort and let RHF surface field errors when invalid.
    const isFormValid = await form.trigger()
    if (!isFormValid) return

    try {
      const values = form.getValues()

      const request: UpdateDossierRequest = {
        name_en: values.name_en as string,
        name_ar: values.name_ar as string,
        abbreviation: (values.abbreviation as string) || undefined,
        description_en: (values.description_en as string) || undefined,
        description_ar: (values.description_ar as string) || undefined,
        status: values.status as UpdateDossierRequest['status'],
        sensitivity_level: values.sensitivity_level as number,
        tags: (values.tags as string[]) || [],
        extensionData: config.filterExtensionData(values),
      }

      const updated = await updateMutation.mutateAsync({ id: dossierId, request })

      // Run the optional post-update hook AFTER the dossier update succeeds and
      // BEFORE navigation (mirrors create's postCreate). A participant-sync
      // failure is surfaced as a warning toast and never rolls back the update.
      if (onAfterUpdate != null) {
        try {
          await onAfterUpdate(values)
        } catch (err) {
          console.warn('edit post-update hook failed', err)
          toast.warning(
            t('form-wizard:postUpdateWarning', {
              defaultValue:
                'Dossier updated, but some related records (e.g. participants) failed to save.',
            }),
          )
        }
      }

      // Subtype wizards (elected officials submit as DB type 'person') override
      // the detail route so save lands on the correct shell, mirroring create.
      if (config.detailRouteSegment != null) {
        void navigate({ to: `/dossiers/${config.detailRouteSegment}/${dossierId}` })
      } else {
        void navigate({
          to: getDossierDetailPath(dossierId, updated.type as DossierType),
        })
      }
    } catch {
      // Error toast handled by useUpdateDossier onError.
    }
  }, [updateMutation, form, config, dossierId, navigate, onAfterUpdate, t])

  // Edit has no draft; cancel returns to the previous screen.
  const handleCancel = useCallback((): void => {
    window.history.back()
  }, [])

  const handleSaveDraft = useCallback((): void => {}, [])
  const handleAIGenerate = useCallback((): void => {}, [])

  const canComplete =
    form.formState.isValid &&
    (nameEn?.length ?? 0) >= 2 &&
    (nameAr != null ? nameAr.length >= 2 : false)

  // Reuse the shared per-step "Next" validation map (A-3/E-5/A-5) so advancing a
  // step surfaces that step's errors — identical wiring to the create flow.
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
    hasDraft: false,
    isDraftSaving: false,
    handleComplete,
    handleCancel,
    handleSaveDraft,
    handleAIGenerate,
    isSubmitting: updateMutation.isPending,
    canComplete,
  }
}
