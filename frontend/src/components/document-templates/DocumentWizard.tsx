/**
 * DocumentWizard Component
 * Multi-step wizard for creating documents from templates
 * Mobile-first responsive design with RTL support
 */

import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Circle,
} from 'lucide-react'
import { WizardStep } from './WizardStep'
import { useDocumentWizard, useValidateDocument } from '@/hooks/useDocumentTemplates'
import type {
  DocumentTemplateWithSections,
  TemplatedDocument,
  TemplateValidationError,
} from '@/types/document-template.types'
import { toast } from 'sonner'

interface DocumentWizardProps {
  templateId: string
  entityType: string
  entityId: string
  open: boolean
  onClose: () => void
  onComplete?: (document: TemplatedDocument) => void
  initialDocument?: TemplatedDocument
}

export function DocumentWizard({
  templateId,
  entityType,
  entityId,
  open,
  onClose,
  onComplete,
  initialDocument,
}: DocumentWizardProps) {
  const { t, i18n } = useTranslation('document-templates')
  const isRTL = i18n.language === 'ar'

  // Wizard state
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({})
  const [validationErrors, setValidationErrors] = useState<TemplateValidationError[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [document, setDocument] = useState<TemplatedDocument | null>(initialDocument || null)

  // Hooks
  const {
    template,
    isLoading,
    error,
    startWizard,
    saveProgress,
    finish,
    isStarting,
    isSaving,
    isCompleting,
  } = useDocumentWizard(templateId, entityType, entityId)
  const validateMutation = useValidateDocument()

  // Initialize with existing document values
  useEffect(() => {
    if (initialDocument) {
      setDocument(initialDocument)
      setFieldValues(initialDocument.field_values || {})
      setCurrentSectionIndex(Math.max(0, (initialDocument.current_section_order || 1) - 1))
    }
  }, [initialDocument])

  // Get sections from template
  const sections = template?.sections || []
  const currentSection = sections[currentSectionIndex]
  const totalSections = sections.length
  const progressPercent = totalSections > 0 ? ((currentSectionIndex + 1) / totalSections) * 100 : 0

  // Field change handler
  const handleFieldChange = useCallback((fieldKey: string, value: unknown) => {
    setFieldValues((prev) => ({ ...prev, [fieldKey]: value }))
    setIsDirty(true)
    // Clear validation error for this field
    setValidationErrors((prev) => prev.filter((e) => e.field_key !== fieldKey))
  }, [])

  // Start wizard with new document
  const handleStart = async () => {
    if (!template) return

    const titleEn = `${template.template.name_en} - ${new Date().toLocaleDateString('en-US')}`
    const titleAr = `${template.template.name_ar} - ${new Date().toLocaleDateString('ar-SA')}`

    try {
      const result = await startWizard(titleEn, titleAr)
      setDocument(result.document)
      setFieldValues(result.document.field_values || {})
    } catch (err) {
      console.error('Failed to start wizard:', err)
    }
  }

  // Save current progress
  const handleSave = async () => {
    if (!document) return

    try {
      const result = await saveProgress(document.id, fieldValues, currentSectionIndex + 1)
      setDocument(result.document)
      setValidationErrors(result.validation.errors || [])
      setIsDirty(false)
      toast.success(t('wizard.progressSaved'))
    } catch (err) {
      console.error('Failed to save:', err)
    }
  }

  // Validate current section
  const validateCurrentSection = async (): Promise<boolean> => {
    if (!currentSection || !template) return true

    const currentFields = currentSection.fields
    const errors: TemplateValidationError[] = []

    for (const field of currentFields) {
      if (field.is_required) {
        const value = fieldValues[field.field_key]
        if (
          value === undefined ||
          value === null ||
          value === '' ||
          (Array.isArray(value) && value.length === 0)
        ) {
          errors.push({
            field_key: field.field_key,
            error: 'required',
            label_en: field.label_en,
            label_ar: field.label_ar,
          })
        }
      }
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  // Navigation
  const handleNext = async () => {
    const isValid = await validateCurrentSection()
    if (!isValid) {
      toast.error(t('errors.validationFailed'))
      return
    }

    // Save progress before moving
    if (document && isDirty) {
      await saveProgress(document.id, fieldValues, currentSectionIndex + 2)
    }

    if (currentSectionIndex < totalSections - 1) {
      setCurrentSectionIndex((prev) => prev + 1)
      setIsDirty(false)
    }
  }

  const handleBack = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1)
    }
  }

  // Complete wizard
  const handleFinish = async () => {
    const isValid = await validateCurrentSection()
    if (!isValid) {
      toast.error(t('errors.validationFailed'))
      return
    }

    if (!document) return

    try {
      // Save final values
      await saveProgress(document.id, fieldValues, currentSectionIndex + 1)

      // Complete the document
      const result = await finish(document.id)

      onComplete?.(result.document)
      onClose()
    } catch (err) {
      console.error('Failed to complete:', err)
    }
  }

  // Handle close with confirmation
  const handleClose = () => {
    if (isDirty) {
      setShowExitConfirm(true)
    } else {
      onClose()
    }
  }

  const handleConfirmExit = async () => {
    if (document && isDirty) {
      await saveProgress(document.id, fieldValues, currentSectionIndex + 1)
    }
    setShowExitConfirm(false)
    onClose()
  }

  // Check if section is complete
  const isSectionComplete = (sectionIndex: number) => {
    const section = sections[sectionIndex]
    if (!section) return false

    const requiredFields = section.fields.filter((f) => f.is_required)
    return requiredFields.every((field) => {
      const value = fieldValues[field.field_key]
      return (
        value !== undefined &&
        value !== null &&
        value !== '' &&
        (!Array.isArray(value) || value.length > 0)
      )
    })
  }

  // Render loading state
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Render error state
  if (error) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive">{t('errors.loadFailed')}</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Render start screen if no document yet
  if (!document) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t('wizard.title')}</DialogTitle>
            <DialogDescription>
              {template &&
                (isRTL ? template.template.description_ar : template.template.description_en)}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              {t('templates.sections', { count: totalSections })}
            </p>
            <Button onClick={handleStart} disabled={isStarting} className="w-full min-h-11">
              {isStarting ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
              {t('actions.startWizard')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const isLastSection = currentSectionIndex === totalSections - 1

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <span>{t('wizard.title')}</span>
              <Badge variant="outline">
                {t('wizard.stepOf', { current: currentSectionIndex + 1, total: totalSections })}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              {template && (isRTL ? template.template.name_ar : template.template.name_en)}
            </DialogDescription>
          </DialogHeader>

          {/* Progress bar */}
          <div className="flex-shrink-0 space-y-2">
            <Progress value={progressPercent} className="h-2" />

            {/* Step indicators */}
            <div className="flex justify-between items-center overflow-x-auto pb-2 px-1">
              {sections.map((section, index) => {
                const isComplete = isSectionComplete(index)
                const isCurrent = index === currentSectionIndex
                const sectionName = isRTL ? section.name_ar : section.name_en

                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      if (index < currentSectionIndex || isSectionComplete(currentSectionIndex)) {
                        setCurrentSectionIndex(index)
                      }
                    }}
                    className={cn(
                      'flex flex-col items-center gap-1 min-w-[60px] p-1 rounded-lg transition-colors',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                      isCurrent && 'bg-primary/10',
                      index <= currentSectionIndex
                        ? 'cursor-pointer'
                        : 'cursor-not-allowed opacity-50',
                    )}
                    disabled={
                      index > currentSectionIndex && !isSectionComplete(currentSectionIndex)
                    }
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center w-6 h-6 rounded-full border-2',
                        isComplete && 'bg-primary border-primary text-primary-foreground',
                        isCurrent && !isComplete && 'border-primary',
                        !isCurrent && !isComplete && 'border-muted-foreground/30',
                      )}
                    >
                      {isComplete ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <span className="text-xs">{index + 1}</span>
                      )}
                    </div>
                    <span className="text-xs text-center line-clamp-1 hidden sm:block">
                      {sectionName}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Wizard content */}
          <div className="flex-1 overflow-y-auto py-4 px-1">
            {currentSection && (
              <WizardStep
                section={currentSection}
                fieldValues={fieldValues}
                validationErrors={validationErrors}
                onFieldChange={handleFieldChange}
                isRTL={isRTL}
              />
            )}
          </div>

          {/* Footer actions */}
          <div className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t">
            <div className="flex items-center gap-2 order-2 sm:order-1">
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving || !isDirty}
                className="min-h-11"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                ) : (
                  <Save className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                )}
                {t('actions.saveDraft')}
              </Button>
            </div>

            <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentSectionIndex === 0}
                className="flex-1 sm:flex-none min-h-11"
              >
                {isRTL ? (
                  <ChevronRight className="h-4 w-4 me-2" />
                ) : (
                  <ChevronLeft className="h-4 w-4 me-2" />
                )}
                {t('actions.back')}
              </Button>

              {isLastSection ? (
                <Button
                  onClick={handleFinish}
                  disabled={isCompleting}
                  className="flex-1 sm:flex-none min-h-11"
                >
                  {isCompleting ? (
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                  ) : (
                    <Check className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                  )}
                  {t('actions.finish')}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none min-h-11"
                >
                  {t('actions.next')}
                  {isRTL ? (
                    <ChevronLeft className="h-4 w-4 ms-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 ms-2" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exit confirmation dialog */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('wizard.unsavedChanges')}</AlertDialogTitle>
            <AlertDialogDescription>{t('wizard.confirmExit')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="min-h-11">{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmExit} className="min-h-11">
              {t('actions.saveDraft')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default DocumentWizard
