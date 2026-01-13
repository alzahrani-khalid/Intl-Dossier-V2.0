/**
 * useExportData Hook
 * Feature: export-import-templates
 *
 * Hook for exporting entity data to CSV, XLSX, or JSON formats.
 * Supports template generation and progress tracking.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import * as ExcelJS from 'exceljs'
import type {
  ExportRequest,
  ExportResponse,
  ExportProgress,
  TemplateDownloadRequest,
  UseExportDataOptions,
  UseExportDataReturn,
  ExportableEntityType,
} from '@/types/export-import.types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

// Entity templates for download template functionality
const ENTITY_TEMPLATES: Record<
  ExportableEntityType,
  {
    columns: Array<{
      field: string
      header: string
      headerAr: string
      required: boolean
      example?: string
    }>
  }
> = {
  dossier: {
    columns: [
      {
        field: 'name_en',
        header: 'Name (English) *',
        headerAr: 'الاسم (إنجليزي) *',
        required: true,
        example: 'Ministry of Finance',
      },
      {
        field: 'name_ar',
        header: 'Name (Arabic)',
        headerAr: 'الاسم (عربي)',
        required: false,
        example: 'وزارة المالية',
      },
      {
        field: 'type',
        header: 'Type *',
        headerAr: 'النوع *',
        required: true,
        example: 'organization',
      },
      { field: 'status', header: 'Status', headerAr: 'الحالة', required: false, example: 'active' },
      {
        field: 'summary_en',
        header: 'Summary (English)',
        headerAr: 'الملخص (إنجليزي)',
        required: false,
      },
      {
        field: 'summary_ar',
        header: 'Summary (Arabic)',
        headerAr: 'الملخص (عربي)',
        required: false,
      },
      {
        field: 'sensitivity_level',
        header: 'Sensitivity Level',
        headerAr: 'مستوى الحساسية',
        required: false,
        example: 'low',
      },
      {
        field: 'tags',
        header: 'Tags',
        headerAr: 'الوسوم',
        required: false,
        example: 'finance; government',
      },
    ],
  },
  person: {
    columns: [
      {
        field: 'name_en',
        header: 'Name (English) *',
        headerAr: 'الاسم (إنجليزي) *',
        required: true,
        example: 'John Doe',
      },
      {
        field: 'name_ar',
        header: 'Name (Arabic)',
        headerAr: 'الاسم (عربي)',
        required: false,
        example: 'جون دو',
      },
      {
        field: 'title_en',
        header: 'Title (English)',
        headerAr: 'المسمى الوظيفي (إنجليزي)',
        required: false,
        example: 'Director',
      },
      {
        field: 'title_ar',
        header: 'Title (Arabic)',
        headerAr: 'المسمى الوظيفي (عربي)',
        required: false,
      },
      {
        field: 'email',
        header: 'Email',
        headerAr: 'البريد الإلكتروني',
        required: false,
        example: 'john@example.com',
      },
      {
        field: 'phone',
        header: 'Phone',
        headerAr: 'الهاتف',
        required: false,
        example: '+1234567890',
      },
      {
        field: 'importance_level',
        header: 'Importance Level (1-5)',
        headerAr: 'مستوى الأهمية (1-5)',
        required: false,
        example: '3',
      },
      {
        field: 'expertise_areas',
        header: 'Expertise Areas',
        headerAr: 'مجالات الخبرة',
        required: false,
        example: 'Finance; Policy',
      },
      {
        field: 'languages',
        header: 'Languages',
        headerAr: 'اللغات',
        required: false,
        example: 'English; Arabic',
      },
    ],
  },
  engagement: {
    columns: [
      {
        field: 'name_en',
        header: 'Name (English) *',
        headerAr: 'الاسم (إنجليزي) *',
        required: true,
        example: 'Bilateral Meeting',
      },
      { field: 'name_ar', header: 'Name (Arabic)', headerAr: 'الاسم (عربي)', required: false },
      {
        field: 'engagement_type',
        header: 'Type *',
        headerAr: 'النوع *',
        required: true,
        example: 'bilateral_meeting',
      },
      {
        field: 'category',
        header: 'Category',
        headerAr: 'الفئة',
        required: false,
        example: 'diplomatic',
      },
      {
        field: 'status',
        header: 'Status',
        headerAr: 'الحالة',
        required: false,
        example: 'planned',
      },
      {
        field: 'start_date',
        header: 'Start Date (YYYY-MM-DD)',
        headerAr: 'تاريخ البدء',
        required: false,
        example: '2025-03-15',
      },
      {
        field: 'end_date',
        header: 'End Date (YYYY-MM-DD)',
        headerAr: 'تاريخ الانتهاء',
        required: false,
        example: '2025-03-16',
      },
      {
        field: 'location_en',
        header: 'Location (English)',
        headerAr: 'الموقع (إنجليزي)',
        required: false,
        example: 'Riyadh',
      },
      {
        field: 'location_ar',
        header: 'Location (Arabic)',
        headerAr: 'الموقع (عربي)',
        required: false,
        example: 'الرياض',
      },
      {
        field: 'is_virtual',
        header: 'Virtual (true/false)',
        headerAr: 'افتراضي',
        required: false,
        example: 'false',
      },
      {
        field: 'delegation_size',
        header: 'Delegation Size',
        headerAr: 'حجم الوفد',
        required: false,
        example: '5',
      },
    ],
  },
  'working-group': {
    columns: [
      {
        field: 'name_en',
        header: 'Name (English) *',
        headerAr: 'الاسم (إنجليزي) *',
        required: true,
        example: 'Statistics Committee',
      },
      { field: 'name_ar', header: 'Name (Arabic)', headerAr: 'الاسم (عربي)', required: false },
      { field: 'status', header: 'Status', headerAr: 'الحالة', required: false, example: 'active' },
      {
        field: 'mandate_en',
        header: 'Mandate (English)',
        headerAr: 'التفويض (إنجليزي)',
        required: false,
      },
      {
        field: 'mandate_ar',
        header: 'Mandate (Arabic)',
        headerAr: 'التفويض (عربي)',
        required: false,
      },
      {
        field: 'formation_date',
        header: 'Formation Date (YYYY-MM-DD)',
        headerAr: 'تاريخ التشكيل',
        required: false,
        example: '2024-01-01',
      },
      {
        field: 'dissolution_date',
        header: 'Dissolution Date (YYYY-MM-DD)',
        headerAr: 'تاريخ الحل',
        required: false,
      },
    ],
  },
  commitment: {
    columns: [
      {
        field: 'title_en',
        header: 'Title (English) *',
        headerAr: 'العنوان (إنجليزي) *',
        required: true,
        example: 'Deliver quarterly report',
      },
      { field: 'title_ar', header: 'Title (Arabic)', headerAr: 'العنوان (عربي)', required: false },
      {
        field: 'commitment_type',
        header: 'Type *',
        headerAr: 'النوع *',
        required: true,
        example: 'internal',
      },
      {
        field: 'status',
        header: 'Status',
        headerAr: 'الحالة',
        required: false,
        example: 'pending',
      },
      {
        field: 'priority',
        header: 'Priority',
        headerAr: 'الأولوية',
        required: false,
        example: 'medium',
      },
      {
        field: 'deadline',
        header: 'Deadline (YYYY-MM-DD)',
        headerAr: 'الموعد النهائي',
        required: false,
        example: '2025-03-31',
      },
      {
        field: 'completion_percentage',
        header: 'Completion %',
        headerAr: 'نسبة الإنجاز',
        required: false,
        example: '0',
      },
    ],
  },
  deliverable: {
    columns: [
      {
        field: 'title_en',
        header: 'Title (English) *',
        headerAr: 'العنوان (إنجليزي) *',
        required: true,
        example: 'Project Report',
      },
      { field: 'title_ar', header: 'Title (Arabic)', headerAr: 'العنوان (عربي)', required: false },
      {
        field: 'status',
        header: 'Status',
        headerAr: 'الحالة',
        required: false,
        example: 'pending',
      },
      {
        field: 'due_date',
        header: 'Due Date (YYYY-MM-DD)',
        headerAr: 'تاريخ الاستحقاق',
        required: false,
        example: '2025-04-15',
      },
      {
        field: 'completion_date',
        header: 'Completion Date (YYYY-MM-DD)',
        headerAr: 'تاريخ الإنجاز',
        required: false,
      },
    ],
  },
}

export function useExportData(options: UseExportDataOptions = {}): UseExportDataReturn {
  const { t, i18n } = useTranslation('export-import')
  const [progress, setProgress] = useState<ExportProgress | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const getAuthToken = useCallback(() => {
    const supabaseAuthKey = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`
    const authData = localStorage.getItem(supabaseAuthKey)
    if (authData) {
      try {
        const parsed = JSON.parse(authData)
        return parsed.access_token || parsed
      } catch {
        return authData
      }
    }
    return null
  }, [])

  const exportData = useCallback(
    async (request: ExportRequest): Promise<ExportResponse> => {
      setIsExporting(true)
      setError(null)
      setProgress({
        stage: 'fetching',
        progress: 0,
        message_en: t('progress.fetching'),
        message_ar: t('progress.fetching'),
      })

      try {
        const token = getAuthToken()
        if (!token) {
          throw new Error('Not authenticated')
        }

        setProgress({
          stage: 'fetching',
          progress: 30,
          message_en: t('progress.fetching'),
          message_ar: t('progress.fetching'),
        })

        // Call export edge function
        const response = await fetch(`${SUPABASE_URL}/functions/v1/data-export`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(request),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error?.message_en || 'Export failed')
        }

        const result = await response.json()

        setProgress({
          stage: 'generating',
          progress: 70,
          message_en: t('progress.generating'),
          message_ar: t('progress.generating'),
        })

        // Handle XLSX conversion if needed
        if (request.format === 'xlsx' && result.content) {
          const workbook = new ExcelJS.Workbook()
          const worksheet = workbook.addWorksheet(request.entityType)

          // Parse CSV content
          const lines = result.content.replace(/^\uFEFF/, '').split('\r\n')
          const headers = lines[0].split(',').map((h: string) => h.replace(/^"|"$/g, ''))

          // Add headers
          worksheet.addRow(headers)

          // Style header row
          const headerRow = worksheet.getRow(1)
          headerRow.font = { bold: true }
          headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
          }

          // Add data rows
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              // Parse CSV line properly (handle quoted values)
              const values =
                lines[i]
                  .match(/(?:^|,)("(?:[^"]*(?:""[^"]*)*)"|[^,]*)/g)
                  ?.map((v: string) =>
                    v.replace(/^,/, '').replace(/^"|"$/g, '').replace(/""/g, '"'),
                  ) || []
              worksheet.addRow(values)
            }
          }

          // Auto-fit columns
          worksheet.columns.forEach((column) => {
            let maxLength = 10
            column.eachCell?.({ includeEmpty: true }, (cell) => {
              const cellLength = cell.value ? cell.value.toString().length : 0
              if (cellLength > maxLength) {
                maxLength = Math.min(cellLength, 50)
              }
            })
            column.width = maxLength + 2
          })

          // Generate blob
          const buffer = await workbook.xlsx.writeBuffer()
          const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          })
          const url = URL.createObjectURL(blob)

          // Download file
          const link = document.createElement('a')
          link.href = url
          link.download = result.fileName.replace('.csv', '.xlsx')
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        } else if (result.content) {
          // Download CSV or JSON directly
          const blob = new Blob([result.content], { type: result.contentType })
          const url = URL.createObjectURL(blob)

          const link = document.createElement('a')
          link.href = url
          link.download = result.fileName
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }

        setProgress({
          stage: 'complete',
          progress: 100,
          message_en: t('progress.complete'),
          message_ar: t('progress.complete'),
        })

        const exportResponse: ExportResponse = {
          success: true,
          fileName: result.fileName,
          recordCount: result.recordCount,
          exportedAt: result.exportedAt,
          entityType: result.entityType,
          format: result.format,
        }

        options.onSuccess?.(exportResponse)
        toast.success(t('export.success.title'), {
          description: t('export.success.message', { count: result.recordCount }),
        })

        return exportResponse
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Export failed')
        setError(error)
        setProgress({
          stage: 'error',
          progress: 0,
          message_en: error.message,
          message_ar: error.message,
        })
        options.onError?.(error)
        toast.error(t('export.error.title'), {
          description: error.message,
        })
        throw error
      } finally {
        setIsExporting(false)
      }
    },
    [getAuthToken, options, t],
  )

  const downloadTemplate = useCallback(
    async (request: TemplateDownloadRequest): Promise<void> => {
      setIsExporting(true)
      setError(null)

      try {
        const template = ENTITY_TEMPLATES[request.entityType]
        if (!template) {
          throw new Error(`Unknown entity type: ${request.entityType}`)
        }

        const language = request.language || (i18n.language === 'ar' ? 'ar' : 'en')

        if (request.format === 'xlsx') {
          const workbook = new ExcelJS.Workbook()
          const worksheet = workbook.addWorksheet(request.entityType)

          // Generate headers based on language
          const headers = template.columns.map((col) => {
            if (language === 'both') {
              return `${col.header} / ${col.headerAr}`
            }
            return language === 'ar' ? col.headerAr : col.header
          })

          // Add headers
          worksheet.addRow(headers)

          // Style header row
          const headerRow = worksheet.getRow(1)
          headerRow.font = { bold: true }
          headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' },
          }
          headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }

          // Add sample data if requested
          if (request.includeSampleData) {
            const sampleRow = template.columns.map((col) => col.example || '')
            worksheet.addRow(sampleRow)
          }

          // Add instruction row
          const instructionRow = template.columns.map((col) =>
            col.required ? '(Required)' : '(Optional)',
          )
          const instRow = worksheet.addRow(instructionRow)
          instRow.font = { italic: true, color: { argb: 'FF808080' } }

          // Auto-fit columns
          worksheet.columns.forEach((column, index) => {
            const header = headers[index] || ''
            const maxLength = Math.max(header.length, 15)
            column.width = Math.min(maxLength + 2, 40)
          })

          // Generate blob and download
          const buffer = await workbook.xlsx.writeBuffer()
          const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          })
          const url = URL.createObjectURL(blob)

          const link = document.createElement('a')
          link.href = url
          link.download = `${request.entityType}_template.xlsx`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        } else {
          // Generate CSV
          const headers = template.columns.map((col) => {
            if (language === 'both') {
              return `"${col.header} / ${col.headerAr}"`
            }
            const header = language === 'ar' ? col.headerAr : col.header
            return header.includes(',') ? `"${header}"` : header
          })

          const lines = [headers.join(',')]

          // Add sample data if requested
          if (request.includeSampleData) {
            const sampleRow = template.columns.map((col) => {
              const value = col.example || ''
              return value.includes(',') || value.includes('"')
                ? `"${value.replace(/"/g, '""')}"`
                : value
            })
            lines.push(sampleRow.join(','))
          }

          // Add BOM for Excel UTF-8 compatibility
          const content = '\uFEFF' + lines.join('\r\n')
          const blob = new Blob([content], { type: 'text/csv; charset=utf-8' })
          const url = URL.createObjectURL(blob)

          const link = document.createElement('a')
          link.href = url
          link.download = `${request.entityType}_template.csv`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }

        toast.success(t('template.success'))
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Template download failed')
        setError(error)
        toast.error(error.message)
        throw error
      } finally {
        setIsExporting(false)
      }
    },
    [i18n.language, t],
  )

  const reset = useCallback(() => {
    setProgress(null)
    setError(null)
    setIsExporting(false)
  }, [])

  return {
    exportData,
    downloadTemplate,
    progress,
    isExporting,
    error,
    reset,
  }
}
