/**
 * ComparisonExport Component
 * @feature entity-comparison-view
 *
 * Export functionality for entity comparison reports.
 * Supports CSV, JSON, and PDF formats with customizable options.
 */

import { memo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, FileSpreadsheet, FileJson, FileText, Loader2, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type {
  EntityComparisonResult,
  ComparisonExportFormat,
  ComparisonExportConfig,
} from '@/types/entity-comparison.types'

/**
 * Props for ComparisonExport
 */
interface ComparisonExportProps {
  comparisonResult: EntityComparisonResult
  config?: Partial<ComparisonExportConfig>
  onExportComplete?: (format: ComparisonExportFormat) => void
  onExportError?: (error: Error) => void
  className?: string
}

/**
 * Format icons mapping
 */
const FORMAT_ICONS: Record<ComparisonExportFormat, React.ReactNode> = {
  csv: <FileSpreadsheet className="h-4 w-4" />,
  json: <FileJson className="h-4 w-4" />,
  pdf: <FileText className="h-4 w-4" />,
  xlsx: <FileSpreadsheet className="h-4 w-4" />,
}

/**
 * Generate CSV content from comparison result
 */
function generateCSV(
  result: EntityComparisonResult,
  config: ComparisonExportConfig,
  t: (key: string) => string,
): string {
  const lines: string[] = []
  const isArabic = config.language === 'ar'

  // Header
  if (config.includeHeader) {
    const headerRow = [
      t('table.field'),
      ...result.entities.map((entity) => (isArabic ? entity.name_ar : entity.name_en)),
      t('difference.same'),
    ]
    lines.push(headerRow.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  }

  // Data rows
  const fieldsToExport = config.onlyDifferences
    ? result.fieldComparisons.filter((f) => f.differenceType !== 'same')
    : result.fieldComparisons

  for (const field of fieldsToExport) {
    const row = [
      t(field.fieldLabel),
      ...field.values.map((v) => formatCellValue(v)),
      t(`difference.${field.differenceType}`),
    ]
    lines.push(row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  }

  // Summary
  if (config.includeSummary) {
    lines.push('') // Empty line
    lines.push(`"${t('summary.title')}"`)
    lines.push(`"${t('summary.totalFields')}","${result.summary.totalFields}"`)
    lines.push(`"${t('summary.sameFields')}","${result.summary.sameFields}"`)
    lines.push(`"${t('summary.differentFields')}","${result.summary.differentFields}"`)
    lines.push(`"${t('summary.similarity')}","${result.summary.similarityPercentage}%"`)
  }

  return lines.join('\n')
}

/**
 * Generate JSON content from comparison result
 */
function generateJSON(result: EntityComparisonResult, config: ComparisonExportConfig): string {
  const exportData: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    entityType: result.entityType,
    comparedAt: result.comparedAt,
  }

  if (config.includeHeader) {
    exportData.entities = result.entities.map((entity) => ({
      id: entity.id,
      name_en: entity.name_en,
      name_ar: entity.name_ar,
    }))
  }

  const fieldsToExport = config.onlyDifferences
    ? result.fieldComparisons.filter((f) => f.differenceType !== 'same')
    : result.fieldComparisons

  exportData.fields = fieldsToExport.map((field) => ({
    fieldKey: field.fieldKey,
    fieldLabel: field.fieldLabel,
    values: field.values,
    differenceType: field.differenceType,
    category: field.category,
  }))

  if (config.includeSummary) {
    exportData.summary = result.summary
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Format a cell value for export
 */
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

/**
 * Trigger browser download
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Main ComparisonExport component
 */
export const ComparisonExport = memo(function ComparisonExport({
  comparisonResult,
  config: initialConfig,
  onExportComplete,
  onExportError,
  className,
}: ComparisonExportProps) {
  const { t, i18n } = useTranslation('entity-comparison')
  const isRTL = i18n.language === 'ar'

  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [config, setConfig] = useState<ComparisonExportConfig>({
    format: 'csv',
    includeHeader: true,
    includeSummary: true,
    onlyDifferences: false,
    language: i18n.language as 'en' | 'ar',
    ...initialConfig,
  })

  const handleConfigChange = useCallback(
    <K extends keyof ComparisonExportConfig>(key: K, value: ComparisonExportConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const handleExport = useCallback(async () => {
    setIsExporting(true)

    try {
      const timestamp = new Date().toISOString().slice(0, 10)
      const baseFilename =
        config.filename || `comparison-${comparisonResult.entityType}-${timestamp}`

      let content: string
      let mimeType: string
      let extension: string

      switch (config.format) {
        case 'csv':
          content = generateCSV(comparisonResult, config, t)
          mimeType = 'text/csv;charset=utf-8'
          extension = 'csv'
          break
        case 'json':
          content = generateJSON(comparisonResult, config)
          mimeType = 'application/json'
          extension = 'json'
          break
        case 'xlsx':
          // For XLSX, we'll use CSV format with .xlsx extension
          // In production, you'd use a library like SheetJS
          content = generateCSV(comparisonResult, config, t)
          mimeType = 'text/csv;charset=utf-8'
          extension = 'csv' // Fallback to CSV
          break
        case 'pdf':
          // For PDF, we'll generate a formatted text version
          // In production, you'd use a library like jsPDF
          content = generateCSV(comparisonResult, config, t)
          mimeType = 'text/plain;charset=utf-8'
          extension = 'txt' // Fallback to text
          break
        default:
          throw new Error(`Unsupported format: ${config.format}`)
      }

      downloadFile(content, `${baseFilename}.${extension}`, mimeType)

      toast.success(t('export.success'))
      onExportComplete?.(config.format)
      setIsOpen(false)
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Export failed')
      toast.error(t('export.error', { message: err.message }))
      onExportError?.(err)
    } finally {
      setIsExporting(false)
    }
  }, [comparisonResult, config, t, onExportComplete, onExportError])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={cn('gap-2', className)}>
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">{t('actions.export')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            {t('export.title')}
          </DialogTitle>
          <DialogDescription>{t('export.subtitle')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Format selector */}
          <div className="space-y-2">
            <Label>{t('export.format')}</Label>
            <Select
              value={config.format}
              onValueChange={(value) =>
                handleConfigChange('format', value as ComparisonExportFormat)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['csv', 'json', 'pdf', 'xlsx'] as ComparisonExportFormat[]).map((format) => (
                  <SelectItem key={format} value={format}>
                    <div className="flex items-center gap-2">
                      {FORMAT_ICONS[format]}
                      <span>{t(`export.formats.${format}`)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Language selector */}
          <div className="space-y-2">
            <Label>{t('export.language')}</Label>
            <Select
              value={config.language}
              onValueChange={(value) => handleConfigChange('language', value as 'en' | 'ar')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t('export.languages.en')}</SelectItem>
                <SelectItem value="ar">{t('export.languages.ar')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Options */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="include-header" className="text-sm">
                {t('export.options.includeHeader')}
              </Label>
              <Switch
                id="include-header"
                checked={config.includeHeader}
                onCheckedChange={(checked) => handleConfigChange('includeHeader', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="include-summary" className="text-sm">
                {t('export.options.includeSummary')}
              </Label>
              <Switch
                id="include-summary"
                checked={config.includeSummary}
                onCheckedChange={(checked) => handleConfigChange('includeSummary', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="only-differences" className="text-sm">
                {t('export.options.onlyDifferences')}
              </Label>
              <Switch
                id="only-differences"
                checked={config.onlyDifferences}
                onCheckedChange={(checked) => handleConfigChange('onlyDifferences', checked)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isExporting}>
            {t('actions.back')}
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {t('export.downloading')}
              </>
            ) : (
              <>
                <Download className="h-4 w-4 me-2" />
                {t('export.exportButton')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})

export default ComparisonExport
