/**
 * ExportDialog Component
 * Feature: export-import-templates
 *
 * Modal dialog for exporting entity data with format and column selection.
 * Supports CSV, XLSX, and JSON formats with bilingual headers.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, FileSpreadsheet, FileText, FileJson, Loader2 } from 'lucide-react'
import { useExportData } from '@/hooks/useExportData'
import type { ExportableEntityType, ExportRequest } from '@/types/export-import.types'
import type { ExportFormat } from '@/types/bulk-actions.types'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: ExportableEntityType
  selectedIds?: string[]
  onExportComplete?: () => void
}

export function ExportDialog({
  open,
  onOpenChange,
  entityType,
  selectedIds,
  onExportComplete,
}: ExportDialogProps) {
  const { t, i18n } = useTranslation('export-import')
  const isRTL = i18n.language === 'ar'

  const [format, setFormat] = useState<ExportFormat>('xlsx')
  const [language, setLanguage] = useState<'en' | 'ar' | 'both'>('both')
  const [includeTemplate, setIncludeTemplate] = useState(false)
  const [exportSelected, setExportSelected] = useState(!!selectedIds?.length)

  const { exportData, downloadTemplate, progress, isExporting, reset } = useExportData({
    onSuccess: () => {
      onExportComplete?.()
      setTimeout(() => {
        reset()
        onOpenChange(false)
      }, 1500)
    },
  })

  const handleExport = useCallback(async () => {
    const request: ExportRequest = {
      entityType,
      format: format as 'csv' | 'xlsx' | 'json',
      ids: exportSelected ? selectedIds : undefined,
      includeTemplate,
      language,
    }

    await exportData(request)
  }, [entityType, format, exportSelected, selectedIds, includeTemplate, language, exportData])

  const handleDownloadTemplate = useCallback(async () => {
    await downloadTemplate({
      entityType,
      format: format === 'xlsx' ? 'xlsx' : 'csv',
      includeSampleData: true,
      language,
    })
  }, [entityType, format, language, downloadTemplate])

  const handleClose = useCallback(() => {
    if (!isExporting) {
      reset()
      onOpenChange(false)
    }
  }, [isExporting, reset, onOpenChange])

  const formatIcons: Record<ExportFormat, React.ReactNode> = {
    xlsx: <FileSpreadsheet className="size-4" />,
    csv: <FileText className="size-4" />,
    json: <FileJson className="size-4" />,
    pdf: <FileText className="size-4" />,
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="size-5" />
            {t('export.title')}
          </DialogTitle>
          <DialogDescription>{t('export.description')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>{t('export.format.label')}</Label>
            <RadioGroup
              value={format}
              onValueChange={(value) => setFormat(value as ExportFormat)}
              className="grid grid-cols-3 gap-2"
            >
              <div>
                <RadioGroupItem value="xlsx" id="format-xlsx" className="peer sr-only" />
                <Label
                  htmlFor="format-xlsx"
                  className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  {formatIcons.xlsx}
                  <span className="mt-1 text-xs">{t('export.format.xlsx')}</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="csv" id="format-csv" className="peer sr-only" />
                <Label
                  htmlFor="format-csv"
                  className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  {formatIcons.csv}
                  <span className="mt-1 text-xs">{t('export.format.csv')}</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="json" id="format-json" className="peer sr-only" />
                <Label
                  htmlFor="format-json"
                  className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  {formatIcons.json}
                  <span className="mt-1 text-xs">{t('export.format.json')}</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Language Selection */}
          <div className="space-y-3">
            <Label>{t('export.language.title')}</Label>
            <Select
              value={language}
              onValueChange={(value) => setLanguage(value as 'en' | 'ar' | 'both')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t('export.language.en')}</SelectItem>
                <SelectItem value="ar">{t('export.language.ar')}</SelectItem>
                <SelectItem value="both">{t('export.language.both')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>{t('export.options.title')}</Label>
            <div className="space-y-2">
              {selectedIds?.length ? (
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Checkbox
                    id="export-selected"
                    checked={exportSelected}
                    onCheckedChange={(checked) => setExportSelected(!!checked)}
                  />
                  <Label htmlFor="export-selected" className="cursor-pointer text-sm font-normal">
                    {t('export.options.selectedOnly')} ({selectedIds.length})
                  </Label>
                </div>
              ) : null}
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Checkbox
                  id="include-template"
                  checked={includeTemplate}
                  onCheckedChange={(checked) => setIncludeTemplate(!!checked)}
                />
                <Label htmlFor="include-template" className="cursor-pointer text-sm font-normal">
                  {t('export.options.includeTemplate')}
                </Label>
              </div>
            </div>
          </div>

          {/* Progress */}
          {progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{i18n.language === 'ar' ? progress.message_ar : progress.message_en}</span>
                <span>{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            <FileSpreadsheet className="me-2 size-4" />
            {t('template.button')}
          </Button>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isExporting}
              className="flex-1 sm:flex-none"
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleExport} disabled={isExporting} className="flex-1 sm:flex-none">
              {isExporting ? (
                <>
                  <Loader2 className="me-2 size-4 animate-spin" />
                  {t('export.downloading')}
                </>
              ) : (
                <>
                  <Download className="me-2 size-4" />
                  {t('export.button')}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
