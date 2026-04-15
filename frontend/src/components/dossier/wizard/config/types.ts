import type { FieldValues, UseFormReturn } from 'react-hook-form'
import type { ZodSchema } from 'zod'
import type { DossierType, DossierExtensionData } from '@/services/dossier-api'
import type { WizardStep } from '@/components/ui/form-wizard'

export interface WizardStepConfig extends WizardStep {
  // Inherits id, title, description, icon, isOptional, validate
}

export interface WizardConfig<T extends FieldValues> {
  type: DossierType
  schema: ZodSchema<T>
  defaultValues: T
  steps: WizardStepConfig[]
  filterExtensionData: (data: T) => DossierExtensionData | undefined
  onSuccess?: (dossierId: string, type: DossierType) => void
}

// Return type of the hook -- defined here so Shell can type its props
export interface CreateWizardReturn<T extends FieldValues> {
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
