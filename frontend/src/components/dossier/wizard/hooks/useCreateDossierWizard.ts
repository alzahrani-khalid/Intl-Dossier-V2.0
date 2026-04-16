/**
 * useCreateDossierWizard<T> -- All-in-one wizard hook (D-01, D-02, INFRA-01, INFRA-05)
 *
 * Composes useFormDraft, useForm, useCreateDossier, useAIFieldAssist,
 * useDossierNameSimilarity, and useDraftMigration into a single generic hook.
 * Type-specific wizards pass a WizardConfig<T> and get back everything
 * needed to render and control the wizard.
 */

import { useState, useCallback } from 'react'
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

import type { WizardConfig, CreateWizardReturn } from '../config/types'
import { useDraftMigration } from './useDraftMigration'

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
        }
      }

      clearDraft()
      toast.success(t('dossier:create.success'))

      if (config.onSuccess != null) {
        config.onSuccess(newDossier.id, newDossier.type as DossierType)
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

  // 10. canComplete -- minimum name lengths
  const canComplete =
    (nameEn?.length ?? 0) >= 2 && (nameAr != null ? nameAr.length >= 2 : false)

  return {
    form,
    currentStep,
    setCurrentStep,
    steps: config.steps,
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
