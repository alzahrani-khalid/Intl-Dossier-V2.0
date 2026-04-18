import { Children, type ReactElement, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { FieldValues } from 'react-hook-form'
import { FormProvider } from 'react-hook-form'
import { Save } from 'lucide-react'

import { FormWizard } from '@/components/ui/form-wizard'
import { cn } from '@/lib/utils'
import type { CreateWizardReturn } from './config/types'
import { StepGuidanceBanner } from './StepGuidanceBanner'

interface CreateWizardShellProps<T extends FieldValues> {
  wizard: CreateWizardReturn<T>
  children: React.ReactNode
  className?: string
}

export function CreateWizardShell<T extends FieldValues>({
  wizard,
  children,
  className,
}: CreateWizardShellProps<T>): ReactElement {
  const { t } = useTranslation(['dossier', 'form-wizard'])

  // Plan 31-02: prepend a <StepGuidanceBanner/> to each step's rendered
  // children when the matching WizardStepConfig has a guidanceKey. We do
  // this at the shell level (rather than inside each step component) so
  // every per-type wizard gets the banner without duplicated wiring.
  //
  // FormWizard renders `React.Children.toArray(children)[currentStep]` — so
  // wrapping each child in a fragment that includes the banner preserves the
  // existing "one child per step" contract.
  const childArray = Children.toArray(children)
  const wrappedChildren: ReactNode[] = childArray.map((child, index) => {
    const step = wizard.steps[index]
    if (step?.guidanceKey == null || step.guidanceKey === '') return child
    return (
      <>
        <StepGuidanceBanner
          type={String(wizard.type)}
          stepId={step.id}
          guidanceKey={step.guidanceKey}
        />
        {child}
      </>
    )
  })

  return (
    <div className={cn('w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8', className)}>
      {/* Draft saved indicator -- top-end corner */}
      {wizard.isDraftSaving && (
        <div className="flex items-center justify-end gap-2 mb-2 text-sm text-muted-foreground animate-in fade-in duration-250">
          <Save className="h-3.5 w-3.5" />
          <span>{t('form-wizard:draftSaved')}</span>
        </div>
      )}

      <FormProvider {...wizard.form}>
        <form onSubmit={(e: React.FormEvent): void => e.preventDefault()}>
          <FormWizard
            steps={wizard.steps}
            currentStep={wizard.currentStep}
            onStepChange={wizard.setCurrentStep}
            onComplete={wizard.handleComplete}
            onCancel={wizard.handleCancel}
            onSaveDraft={wizard.handleSaveDraft}
            isLoading={wizard.isSubmitting}
            isDraftSaving={wizard.isDraftSaving}
            hasDraft={wizard.hasDraft}
            canComplete={wizard.canComplete}
            completeButtonText={t('dossier:form.create')}
            allowStepNavigation={true}
            namespace="form-wizard"
            actionBarMode="auto"
          >
            {wrappedChildren}
          </FormWizard>
        </form>
      </FormProvider>
    </div>
  )
}
