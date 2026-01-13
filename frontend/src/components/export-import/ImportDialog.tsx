/**
 * ImportDialog Component
 * Feature: export-import-templates
 *
 * Multi-step modal dialog for importing entity data from CSV/XLSX files.
 * Includes file upload, validation, conflict resolution, and import execution.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDropzone } from 'react-dropzone'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react'
import { useImportData } from '@/hooks/useImportData'
import { ImportValidationResults } from './ImportValidationResults'
import type {
  ExportableEntityType,
  ImportMode,
  ConflictResolution,
  ImportRequest,
} from '@/types/export-import.types'
import { cn } from '@/lib/utils'

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: ExportableEntityType
  onImportComplete?: () => void
}

type ImportStep = 'upload' | 'validate' | 'options' | 'import' | 'complete'

export function ImportDialog({
  open,
  onOpenChange,
  entityType,
  onImportComplete,
}: ImportDialogProps) {
  const { t, i18n } = useTranslation('export-import')
  const isRTL = i18n.language === 'ar'

  const [step, setStep] = useState<ImportStep>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [mode, setMode] = useState<ImportMode>('upsert')
  const [conflictResolution, setConflictResolution] = useState<ConflictResolution>('skip')

  const {
    uploadFile,
    executeImport,
    cancel,
    validationResult,
    importResponse,
    progress,
    isValidating,
    isImporting,
    reset: resetHook,
  } = useImportData({
    entityType,
    defaultMode: mode,
    defaultConflictResolution: conflictResolution,
    onSuccess: () => {
      onImportComplete?.()
    },
  })

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        setSelectedFile(file)
        setStep('validate')

        try {
          await uploadFile(file)
          setStep('options')
        } catch {
          setStep('upload')
        }
      }
    },
    [uploadFile],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: isValidating || isImporting,
  })

  const handleImport = useCallback(async () => {
    if (!validationResult) return

    setStep('import')

    const request: ImportRequest = {
      entityType,
      mode,
      conflictResolution,
      rows: validationResult.rows,
      skipWarnings: false,
      dryRun: false,
    }

    try {
      await executeImport(request)
      setStep('complete')
    } catch {
      setStep('options')
    }
  }, [validationResult, entityType, mode, conflictResolution, executeImport])

  const handleClose = useCallback(() => {
    if (!isValidating && !isImporting) {
      resetHook()
      setStep('upload')
      setSelectedFile(null)
      setMode('upsert')
      setConflictResolution('skip')
      onOpenChange(false)
    }
  }, [isValidating, isImporting, resetHook, onOpenChange])

  const handleReset = useCallback(() => {
    cancel()
    resetHook()
    setStep('upload')
    setSelectedFile(null)
  }, [cancel, resetHook])

  const canImport =
    validationResult &&
    validationResult.validRows > 0 &&
    !validationResult.missingRequiredColumns?.length

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t('import.title')}
          </DialogTitle>
          <DialogDescription>{t('import.description')}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                  isDragActive && 'border-primary bg-primary/5',
                  !isDragActive && 'border-muted-foreground/25 hover:border-primary/50',
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-3">
                  <div className="flex gap-2">
                    <FileSpreadsheet className="h-10 w-10 text-green-500" />
                    <FileText className="h-10 w-10 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">{t('import.dropzone.title')}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('import.dropzone.subtitle')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {t('import.dropzone.maxSize', { size: 10 })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Template Instructions */}
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <h4 className="font-medium">{t('template.instructions.title')}</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>{t('template.instructions.requiredFields')}</li>
                  <li>{t('template.instructions.dateFormat')}</li>
                  <li>{t('template.instructions.booleanFormat')}</li>
                  <li>{t('template.instructions.encoding')}</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step: Validating */}
          {step === 'validate' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium">{t('import.validation.validating')}</p>
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedFile.name}</p>
                )}
              </div>
              {progress && (
                <div className="w-full max-w-xs space-y-2">
                  <Progress value={progress.progress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    {isRTL ? progress.message_ar : progress.message_en}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step: Options (Validation Complete) */}
          {step === 'options' && validationResult && (
            <div className="space-y-6">
              {/* File Info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <FileSpreadsheet className="h-8 w-8 text-green-500" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{validationResult.fileInfo?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {validationResult.fileInfo?.rows} rows,{' '}
                    {validationResult.fileInfo?.columns.length} columns
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleReset}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Validation Results */}
              <ImportValidationResults result={validationResult} maxRowsPreview={50} />

              {/* Import Options */}
              {canImport && (
                <>
                  {/* Mode Selection */}
                  <div className="space-y-3">
                    <Label>{t('import.mode.title')}</Label>
                    <RadioGroup
                      value={mode}
                      onValueChange={(value) => setMode(value as ImportMode)}
                      className="space-y-2"
                    >
                      <div className="flex items-start space-x-3 rtl:space-x-reverse p-3 rounded-lg border hover:bg-muted/50">
                        <RadioGroupItem value="create" id="mode-create" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="mode-create" className="font-medium cursor-pointer">
                            {t('import.mode.create')}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {t('import.mode.createDescription')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 rtl:space-x-reverse p-3 rounded-lg border hover:bg-muted/50">
                        <RadioGroupItem value="update" id="mode-update" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="mode-update" className="font-medium cursor-pointer">
                            {t('import.mode.update')}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {t('import.mode.updateDescription')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 rtl:space-x-reverse p-3 rounded-lg border hover:bg-muted/50">
                        <RadioGroupItem value="upsert" id="mode-upsert" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="mode-upsert" className="font-medium cursor-pointer">
                            {t('import.mode.upsert')}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {t('import.mode.upsertDescription')}
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Conflict Resolution */}
                  {validationResult.conflictRows > 0 && (
                    <div className="space-y-3">
                      <Label>{t('import.conflictResolution.title')}</Label>
                      <Select
                        value={conflictResolution}
                        onValueChange={(value) =>
                          setConflictResolution(value as ConflictResolution)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skip">
                            <div>
                              <span className="font-medium">
                                {t('import.conflictResolution.skip')}
                              </span>
                              <p className="text-xs text-muted-foreground">
                                {t('import.conflictResolution.skipDescription')}
                              </p>
                            </div>
                          </SelectItem>
                          <SelectItem value="overwrite">
                            <div>
                              <span className="font-medium">
                                {t('import.conflictResolution.overwrite')}
                              </span>
                              <p className="text-xs text-muted-foreground">
                                {t('import.conflictResolution.overwriteDescription')}
                              </p>
                            </div>
                          </SelectItem>
                          <SelectItem value="merge">
                            <div>
                              <span className="font-medium">
                                {t('import.conflictResolution.merge')}
                              </span>
                              <p className="text-xs text-muted-foreground">
                                {t('import.conflictResolution.mergeDescription')}
                              </p>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step: Importing */}
          {step === 'import' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium">{t('import.execute.importing')}</p>
              </div>
              {progress && (
                <div className="w-full max-w-xs space-y-2">
                  <Progress value={progress.progress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    {isRTL ? progress.message_ar : progress.message_en}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step: Complete */}
          {step === 'complete' && importResponse && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              {importResponse.success ? (
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              ) : (
                <AlertCircle className="h-12 w-12 text-yellow-500" />
              )}
              <div className="text-center space-y-2">
                <p className="font-medium text-lg">
                  {importResponse.success
                    ? t('import.success.title')
                    : t('import.error.partialSuccess', {
                        failed: importResponse.failedCount,
                        total: importResponse.totalRows,
                      })}
                </p>
                <p className="text-muted-foreground">
                  {t('import.success.message', {
                    success: importResponse.successCount,
                    total: importResponse.totalRows,
                  })}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 w-full max-w-sm mt-4">
                <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <p className="text-2xl font-bold text-green-600">{importResponse.createdCount}</p>
                  <p className="text-xs text-green-700">Created</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-2xl font-bold text-blue-600">{importResponse.updatedCount}</p>
                  <p className="text-xs text-blue-700">Updated</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold text-muted-foreground">
                    {importResponse.skippedCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Skipped</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 border-t pt-4">
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
              {t('common.cancel')}
            </Button>
          )}

          {step === 'options' && (
            <>
              <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto">
                {t('common.back')}
              </Button>
              <Button onClick={handleImport} disabled={!canImport} className="w-full sm:w-auto">
                <Upload className="h-4 w-4 me-2" />
                {t('import.execute.button')} ({validationResult?.validRows || 0})
              </Button>
            </>
          )}

          {step === 'complete' && (
            <Button onClick={handleClose} className="w-full sm:w-auto">
              {t('common.close')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
