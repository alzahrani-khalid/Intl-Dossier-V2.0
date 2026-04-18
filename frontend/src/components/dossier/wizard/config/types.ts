import type { FieldValues, UseFormReturn } from 'react-hook-form'
import type { ZodSchema } from 'zod'
import type { DossierType, DossierExtensionData } from '@/services/dossier-api'
import type { WizardStep } from '@/components/ui/form-wizard'

export interface WizardStepConfig extends WizardStep {
  // Inherits id, title, description, icon, isOptional, validate

  // Plan 31-02 D-13/D-14: optional per-step guidance key (i18n key with
  // namespace, e.g. 'country-wizard:wizard.steps.basic.guidance'). When
  // present, CreateWizardShell renders a <StepGuidanceBanner/> at the top
  // of the step body.
  guidanceKey?: string
}

export interface WizardConfig<T extends FieldValues> {
  type: DossierType
  schema: ZodSchema<T>
  defaultValues: T
  steps: WizardStepConfig[]
  filterExtensionData: (data: T) => DossierExtensionData | undefined
  onSuccess?: (dossierId: string, type: DossierType) => void
  // Optional post-create hook invoked AFTER the dossier is persisted and
  // BEFORE navigation. Used by engagement wizard to batch-insert participant
  // rows. Failures are swallowed by the hook (warning logged) so the dossier
  // creation itself is never rolled back.
  postCreate?: (newDossierId: string, data: T) => Promise<void>
}

// Return type of the hook -- defined here so Shell can type its props
export interface CreateWizardReturn<T extends FieldValues> {
  // Plan 31-02: exposed so CreateWizardShell can build the banner storage key.
  type: DossierType
  form: UseFormReturn<T>
  currentStep: number
  setCurrentStep: (step: number) => void
  steps: WizardStepConfig[]
  hasDraft: boolean
  isDraftSaving: boolean
  handleComplete: () => Promise<void>
  handleCancel: () => void
  handleSaveDraft: () => void
  handleAIGenerate: () => void
  isSubmitting: boolean
  canComplete: boolean
}
