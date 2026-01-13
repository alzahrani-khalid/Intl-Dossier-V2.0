/**
 * useImportData Hook
 * Feature: export-import-templates
 *
 * Hook for importing entity data from CSV or XLSX files.
 * Supports file parsing, validation, conflict detection, and import execution.
 */

import { useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import Papa from 'papaparse'
import * as ExcelJS from 'exceljs'
import type {
  ImportValidationResult,
  ImportRequest,
  ImportResponse,
  ImportProgress,
  UseImportDataOptions,
  UseImportDataReturn,
  RowValidationResult,
} from '@/types/export-import.types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const MAX_FILE_SIZE_MB = 10

export function useImportData(options: UseImportDataOptions): UseImportDataReturn {
  const { t } = useTranslation('export-import')
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null)
  const [importResponse, setImportResponse] = useState<ImportResponse | null>(null)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

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

  const parseCSV = useCallback(
    (content: string): Promise<{ headers: string[]; data: Record<string, unknown>[] }> => {
      return new Promise((resolve, reject) => {
        Papa.parse(content, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header: string) => header.trim(),
          complete: (results) => {
            const headers = results.meta.fields || []
            const data = results.data as Record<string, unknown>[]
            resolve({ headers, data })
          },
          error: (error: Error) => {
            reject(error)
          },
        })
      })
    },
    [],
  )

  const parseXLSX = useCallback(
    async (file: File): Promise<{ headers: string[]; data: Record<string, unknown>[] }> => {
      const workbook = new ExcelJS.Workbook()
      const buffer = await file.arrayBuffer()
      await workbook.xlsx.load(buffer)

      const worksheet = workbook.worksheets[0]
      if (!worksheet) {
        throw new Error('No worksheet found in file')
      }

      const headers: string[] = []
      const data: Record<string, unknown>[] = []

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          // Header row
          row.eachCell((cell, colNumber) => {
            headers[colNumber - 1] = String(cell.value || '').trim()
          })
        } else {
          // Data row
          const rowData: Record<string, unknown> = {}
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1]
            if (header) {
              let value: unknown = cell.value
              // Handle rich text and formulas
              if (typeof value === 'object' && value !== null) {
                if ('text' in value) {
                  value = (value as { text: string }).text
                } else if ('result' in value) {
                  value = (value as { result: unknown }).result
                }
              }
              rowData[header] = value as string | number | boolean | null
            }
          })
          if (Object.keys(rowData).length > 0) {
            data.push(rowData)
          }
        }
      })

      return { headers, data }
    },
    [],
  )

  const uploadFile = useCallback(
    async (file: File): Promise<ImportValidationResult> => {
      setIsValidating(true)
      setError(null)
      setValidationResult(null)
      abortControllerRef.current = new AbortController()

      try {
        // Check file size
        const fileSizeMB = file.size / (1024 * 1024)
        if (fileSizeMB > MAX_FILE_SIZE_MB) {
          throw new Error(t('import.error.tooLarge', { size: MAX_FILE_SIZE_MB }))
        }

        setProgress({
          stage: 'uploading',
          progress: 10,
          message_en: t('progress.uploading'),
          message_ar: t('progress.uploading'),
        })

        // Determine file type and parse
        let parsedData: { headers: string[]; data: Record<string, unknown>[] }
        const fileName = file.name.toLowerCase()

        setProgress({
          stage: 'parsing',
          progress: 30,
          message_en: t('progress.parsing'),
          message_ar: t('progress.parsing'),
        })

        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
          parsedData = await parseXLSX(file)
        } else if (fileName.endsWith('.csv')) {
          const content = await file.text()
          parsedData = await parseCSV(content)
        } else {
          throw new Error(t('import.error.invalidFormat'))
        }

        // Check for empty file
        if (parsedData.data.length === 0) {
          throw new Error(t('import.error.emptyFile'))
        }

        setProgress({
          stage: 'validating',
          progress: 50,
          message_en: t('progress.validating'),
          message_ar: t('progress.validating'),
          totalRows: parsedData.data.length,
        })

        // Send to backend for validation
        const token = getAuthToken()
        if (!token) {
          throw new Error('Not authenticated')
        }

        const response = await fetch(`${SUPABASE_URL}/functions/v1/data-import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            entityType: options.entityType,
            headers: parsedData.headers,
            data: parsedData.data,
            mode: options.defaultMode || 'upsert',
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error?.message_en || 'Validation failed')
        }

        const result = (await response.json()) as ImportValidationResult

        // Add file info
        result.fileInfo = {
          name: file.name,
          size: file.size,
          rows: parsedData.data.length,
          columns: parsedData.headers,
          format: fileName.endsWith('.xlsx') || fileName.endsWith('.xls') ? 'xlsx' : 'csv',
        }

        setProgress({
          stage: 'complete',
          progress: 100,
          message_en: t('progress.complete'),
          message_ar: t('progress.complete'),
        })

        setValidationResult(result)
        options.onValidationComplete?.(result)

        return result
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          throw new Error('Operation cancelled')
        }
        const error = err instanceof Error ? err : new Error('Upload failed')
        setError(error)
        setProgress({
          stage: 'error',
          progress: 0,
          message_en: error.message,
          message_ar: error.message,
        })
        options.onError?.(error)
        toast.error(t('import.error.title'), {
          description: error.message,
        })
        throw error
      } finally {
        setIsValidating(false)
      }
    },
    [getAuthToken, options, parseCSV, parseXLSX, t],
  )

  const executeImport = useCallback(
    async (request: ImportRequest): Promise<ImportResponse> => {
      setIsImporting(true)
      setError(null)
      abortControllerRef.current = new AbortController()

      try {
        setProgress({
          stage: 'importing',
          progress: 0,
          message_en: t('progress.importing'),
          message_ar: t('progress.importing'),
          totalRows: request.rows.length,
          currentRow: 0,
        })

        const token = getAuthToken()
        if (!token) {
          throw new Error('Not authenticated')
        }

        // Filter to only valid/warning rows
        const validRows = request.rows.filter(
          (row: RowValidationResult) =>
            row.status === 'valid' || row.status === 'warning' || row.status === 'conflict',
        )

        setProgress({
          stage: 'importing',
          progress: 20,
          message_en: t('progress.importing'),
          message_ar: t('progress.importing'),
          totalRows: validRows.length,
        })

        const response = await fetch(`${SUPABASE_URL}/functions/v1/data-import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            entityType: options.entityType,
            mode: request.mode,
            conflictResolution: request.conflictResolution,
            rows: validRows,
            conflictResolutions: request.conflictResolutions,
            skipWarnings: request.skipWarnings,
            dryRun: request.dryRun,
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error?.message_en || 'Import failed')
        }

        const result = (await response.json()) as ImportResponse

        setProgress({
          stage: 'complete',
          progress: 100,
          message_en: t('progress.complete'),
          message_ar: t('progress.complete'),
        })

        setImportResponse(result)
        options.onSuccess?.(result)

        if (result.success) {
          toast.success(t('import.success.title'), {
            description: t('import.success.message', {
              success: result.successCount,
              total: result.totalRows,
            }),
          })
        } else if (result.successCount > 0) {
          toast.warning(t('import.error.partialSuccess'), {
            description: t('import.error.partialSuccess', {
              failed: result.failedCount,
              total: result.totalRows,
            }),
          })
        } else {
          toast.error(t('import.error.title'))
        }

        return result
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          throw new Error('Operation cancelled')
        }
        const error = err instanceof Error ? err : new Error('Import failed')
        setError(error)
        setProgress({
          stage: 'error',
          progress: 0,
          message_en: error.message,
          message_ar: error.message,
        })
        options.onError?.(error)
        toast.error(t('import.error.title'), {
          description: error.message,
        })
        throw error
      } finally {
        setIsImporting(false)
      }
    },
    [getAuthToken, options, t],
  )

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsValidating(false)
    setIsImporting(false)
    setProgress(null)
  }, [])

  const reset = useCallback(() => {
    setValidationResult(null)
    setImportResponse(null)
    setProgress(null)
    setError(null)
    setIsValidating(false)
    setIsImporting(false)
  }, [])

  return {
    uploadFile,
    executeImport,
    cancel,
    validationResult,
    importResponse,
    progress,
    isValidating,
    isImporting,
    error,
    reset,
  }
}
