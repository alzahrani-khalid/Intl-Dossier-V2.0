/**
 * DossierCreateWizard — Slim orchestrator for multi-step dossier creation.
 *
 * Manages form state, step navigation, draft persistence, and submission.
 * Each step is rendered by a dedicated component from ./wizard-steps/.
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@/lib/form-resolver'
import { toast } from 'sonner'

import { FormWizard, useFormDraft } from '@/components/ui/form-wizard'
import { Form } from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { getDossierDetailPath } from '@/lib/dossier-routes'
import { useCreateDossier } from '@/hooks/useDossier'
import { useDirection } from '@/hooks/useDirection'
import { createDossier, type DossierType, type CreateDossierRequest } from '@/services/dossier-api'
import type { GeneratedFields } from '@/hooks/useAIFieldAssist'

import {
  dossierSchema,
  defaultValues,
  filterExtensionDataByType,
  buildWizardSteps,
  type DossierFormData,
} from './wizard-steps/Shared'
import TypeSelectionStep from './wizard-steps/TypeSelectionStep'
import BasicInfoStep from './wizard-steps/BasicInfoStep'
import ClassificationStep from './wizard-steps/ClassificationStep'
import TypeSpecificStep from './wizard-steps/TypeSpecificStep'
import ReviewStep from './wizard-steps/ReviewStep'
import QuickAddOrgDialog from './wizard-steps/QuickAddOrgDialog'

const DRAFT_KEY = 'dossier-create-draft'

interface DossierCreateWizardProps {
  onSuccess?: (dossierId: string, dossierType?: DossierType) => void
  onCancel?: () => void
  className?: string
  initialType?: DossierType
  recommendedTags?: string[]
}

export function DossierCreateWizard({
  onSuccess,
  onCancel,
  className,
  initialType,
  recommendedTags,
}: DossierCreateWizardProps): React.ReactElement {
  const { t } = useTranslation(['dossier', 'form-wizard', 'contextual-help'])
  const { direction, isRTL } = useDirection()
  const navigate = useNavigate()
  const createMutation = useCreateDossier()

  // Draft management
  const draftKey = initialType ? `${DRAFT_KEY}-${initialType}` : DRAFT_KEY
  const { draft, setDraft, saveDraft, clearDraft, hasDraft, isDraftSaving } =
    useFormDraft<DossierFormData>(draftKey, {
      ...defaultValues,
      type: initialType,
      tags: recommendedTags || [],
    })

  const form = useForm<DossierFormData, unknown, DossierFormData>({
    resolver: zodResolver(dossierSchema),
    defaultValues: {
      ...draft,
      type: initialType || draft.type,
      tags: recommendedTags || draft.tags || [],
    },
    mode: 'onChange',
  })

  const formValues = form.watch()
  const selectedType = form.watch('type')

  useEffect(() => {
    if (hasDraft && draft.name_en && draft.name_ar) {
      form.reset({
        ...draft,
        type: initialType || draft.type,
        tags: recommendedTags || draft.tags || [],
      })
    }
  }, [hasDraft])

  const [currentStep, setCurrentStep] = useState(() => {
    if (initialType) return 1
    if (draft.type) return 1
    return 0
  })

  // Quick-add organization state (for forum type)
  const [showQuickAddOrg, setShowQuickAddOrg] = useState(false)
  const [quickAddOrgName, setQuickAddOrgName] = useState('')
  const [quickAddOrgType, setQuickAddOrgType] = useState<
    'government' | 'ngo' | 'private' | 'international' | 'academic'
  >('international')
  const [isCreatingOrg, setIsCreatingOrg] = useState(false)
  const [organizingBodyName, setOrganizingBodyName] = useState('')

  const updateDraft = useCallback(
    (values: Partial<DossierFormData>) => {
      setDraft((prev) => ({ ...prev, ...values }))
    },
    [setDraft],
  )

  const handleTypeSelect = useCallback(
    (type: DossierType) => {
      form.setValue('type', type)
      updateDraft({ type })
      setCurrentStep(1)
    },
    [form, updateDraft],
  )

  const handleAIGenerate = useCallback(
    (fields: GeneratedFields) => {
      form.setValue('name_en', fields.name_en)
      form.setValue('name_ar', fields.name_ar)
      if (fields.description_en) form.setValue('description_en', fields.description_en)
      if (fields.description_ar) form.setValue('description_ar', fields.description_ar)
      if (fields.suggested_tags && fields.suggested_tags.length > 0) {
        form.setValue('tags', fields.suggested_tags)
      }
      updateDraft({
        name_en: fields.name_en,
        name_ar: fields.name_ar,
        description_en: fields.description_en || undefined,
        description_ar: fields.description_ar || undefined,
        tags: fields.suggested_tags || [],
      })
    },
    [form, updateDraft],
  )

  const handleQuickAddOrg = useCallback(async () => {
    if (!quickAddOrgName.trim()) return
    setIsCreatingOrg(true)
    try {
      const newOrg = await createDossier({
        type: 'organization',
        name_en: quickAddOrgName,
        name_ar: quickAddOrgName,
        status: 'active',
        sensitivity_level: 1,
        extensionData: { org_type: quickAddOrgType },
      })
      form.setValue('extension_data.organizing_body_id', newOrg.id)
      setOrganizingBodyName(quickAddOrgName)
      toast.success(
        t('dossier:form.forum.orgCreated', 'Organization "{{name}}" created', {
          name: quickAddOrgName,
        }),
      )
      setShowQuickAddOrg(false)
      setQuickAddOrgName('')
      setQuickAddOrgType('international')
    } catch (error) {
      console.error('Failed to create organization:', error)
      toast.error(t('dossier:form.forum.orgCreateFailed', 'Failed to create organization'))
    } finally {
      setIsCreatingOrg(false)
    }
  }, [quickAddOrgName, quickAddOrgType, form, t])

  const steps = useMemo(() => buildWizardSteps(t, selectedType, form), [selectedType, form, t])

  const handleComplete = async (): Promise<void> => {
    if (createMutation.isPending) return
    try {
      const values = form.getValues()
      if (!values.type) {
        toast.error(t('dossier:create.error'))
        return
      }
      const createData: CreateDossierRequest = {
        type: values.type as DossierType,
        name_en: values.name_en,
        name_ar: values.name_ar,
        abbreviation: values.abbreviation || undefined,
        description_en: values.description_en || undefined,
        description_ar: values.description_ar || undefined,
        status: values.status,
        sensitivity_level: values.sensitivity_level,
        tags: values.tags || [],
        extensionData: filterExtensionDataByType(values.type as DossierType, values.extension_data),
      }
      const newDossier = await createMutation.mutateAsync(createData)
      clearDraft()
      toast.success(t('dossier:create.success'))
      if (onSuccess) {
        onSuccess(newDossier.id, newDossier.type as DossierType)
      } else {
        void navigate({ to: getDossierDetailPath(newDossier.id, newDossier.type as DossierType) })
      }
    } catch {
      /* Error toast handled by useCreateDossier onError */
    }
  }

  const handleCancel = (): void => {
    if (onCancel) {
      onCancel()
    } else {
      void navigate({ to: '/dossiers' })
    }
  }

  const handleSaveDraft = (): void => {
    updateDraft(form.getValues())
    saveDraft()
    toast.success(t('form-wizard:draftSaved'))
  }

  const stepProps = { form, formValues, selectedType, direction, isRTL, updateDraft }

  const renderStep = (): React.ReactElement | null => {
    switch (currentStep) {
      case 0:
        return <TypeSelectionStep selectedType={selectedType} onTypeSelect={handleTypeSelect} />
      case 1:
        return (
          <BasicInfoStep {...stepProps} onAIGenerate={handleAIGenerate} currentStep={currentStep} />
        )
      case 2:
        return <ClassificationStep {...stepProps} />
      case 3:
        return (
          <TypeSpecificStep
            {...stepProps}
            organizingBodyName={organizingBodyName}
            setOrganizingBodyName={setOrganizingBodyName}
            onQuickAddOrg={(name) => {
              setQuickAddOrgName(name)
              setShowQuickAddOrg(true)
            }}
          />
        )
      case 4:
        return <ReviewStep {...stepProps} organizingBodyName={organizingBodyName} />
      default:
        return null
    }
  }

  return (
    <div className={cn('w-full max-w-4xl mx-auto', className)}>
      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()}>
            <FormWizard
              steps={steps}
              currentStep={currentStep}
              onStepChange={setCurrentStep}
              onComplete={handleComplete}
              onCancel={handleCancel}
              onSaveDraft={handleSaveDraft}
              isLoading={createMutation.isPending}
              isDraftSaving={isDraftSaving}
              hasDraft={hasDraft}
              canComplete={
                !!selectedType &&
                (formValues.name_en?.length ?? 0) >= 2 &&
                (formValues.name_ar?.length ?? 0) >= 2
              }
              completeButtonText={t('dossier:form.create')}
              allowStepNavigation={true}
              namespace="form-wizard"
              actionBarMode="auto"
            >
              {renderStep()}
            </FormWizard>
          </form>
        </Form>
      </FormProvider>

      <QuickAddOrgDialog
        open={showQuickAddOrg}
        onOpenChange={setShowQuickAddOrg}
        orgName={quickAddOrgName}
        onOrgNameChange={setQuickAddOrgName}
        orgType={quickAddOrgType}
        onOrgTypeChange={setQuickAddOrgType}
        isCreating={isCreatingOrg}
        onSubmit={handleQuickAddOrg}
      />
    </div>
  )
}
