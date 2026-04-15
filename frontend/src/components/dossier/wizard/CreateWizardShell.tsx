import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { FieldValues } from 'react-hook-form'
import { FormProvider } from 'react-hook-form'
import { Save } from 'lucide-react'

import { FormWizard } from '@/components/ui/form-wizard'
import { cn } from '@/lib/utils'
import type { CreateWizardReturn } from './config/types'

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
            {children}
          </FormWizard>
        </form>
      </FormProvider>
    </div>
  )
}
