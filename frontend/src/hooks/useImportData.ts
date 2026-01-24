/**
 * Data Import Hooks
 * @module hooks/useImportData
 * @feature export-import-templates
 *
 * React hook for importing entity data from CSV and XLSX files with validation,
 * conflict detection, and progress tracking.
 *
 * @description
 * This module provides a comprehensive data import solution with:
 * - Multi-format file parsing (CSV, XLSX)
 * - Client-side file validation and size checking
 * - Backend validation via Edge Function
 * - Row-level validation with conflict detection
 * - Progress tracking through import stages
 * - Cancelable operations with AbortController
 * - Error handling and user notifications
 *
 * The import workflow consists of:
 * 1. **Upload & Parse**: Parse CSV/XLSX file client-side
 * 2. **Validate**: Send to backend for schema and business rule validation
 * 3. **Review**: User reviews validation results and conflicts
 * 4. **Import**: Execute import with conflict resolution strategies
 *
 * Supported entity types: dossier, person, engagement, working-group, commitment, deliverable
 *
 * @example
 * // Basic usage with file upload
 * const importHook = useImportData({
 *   entityType: 'dossier',
 *   onValidationComplete: (result) => console.log('Validated:', result),
 *   onSuccess: (response) => console.log('Imported:', response),
 * });
 *
 * // Upload and validate file
 * await importHook.uploadFile(file);
 *
 * @example
 * // Execute import after validation
 * if (importHook.validationResult) {
 *   await importHook.executeImport({
 *     mode: 'upsert',
 *     rows: importHook.validationResult.rows,
 *     conflictResolution: 'update',
 *   });
 * }
 *
 * @example
 * // Cancel ongoing operation
 * importHook.cancel();
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

/**
 * Hook for importing entity data from CSV or XLSX files
 *
 * @description
 * Manages the complete import workflow including file upload, parsing, validation,
 * and execution. Provides real-time progress tracking and error handling.
 *
 * Features:
 * - Automatic format detection (CSV, XLSX)
 * - File size validation (max 10MB)
 * - Client-side parsing with papaparse (CSV) and ExcelJS (XLSX)
 * - Backend validation via data-import Edge Function
 * - Row-level conflict detection and resolution
 * - Progress tracking with stage-based updates
 * - Cancelable operations
 * - Automatic toast notifications
 *
 * @param options - Configuration options for import behavior
 * @param options.entityType - Type of entity being imported (e.g., 'dossier', 'person')
 * @param options.defaultMode - Default import mode: 'insert' | 'update' | 'upsert' (default: 'upsert')
 * @param options.onValidationComplete - Callback after validation completes successfully
 * @param options.onSuccess - Callback after import completes successfully
 * @param options.onError - Callback when validation or import fails
 * @returns Import state and control methods
 *
 * @example
 * // Configure import for dossier entities
 * const importHook = useImportData({
 *   entityType: 'dossier',
 *   defaultMode: 'upsert',
 *   onSuccess: (response) => {
 *     console.log(`Imported ${response.successCount} dossiers`);
 *     refetchDossiers();
 *   },
 * });
 *
 * @example
 * // Handle file input change
 * const handleFileSelect = async (event) => {
 *   const file = event.target.files[0];
 *   if (file) {
 *     try {
 *       const validation = await importHook.uploadFile(file);
 *       if (validation.hasConflicts) {
 *         // Show conflict resolution UI
 *       }
 *     } catch (error) {
 *       console.error('Upload failed:', error);
 *     }
 *   }
 * };
 */
export function useImportData(options: UseImportDataOptions): UseImportDataReturn {
  const { t } = useTranslation('export-import')
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null)
  const [importResponse, setImportResponse] = useState<ImportResponse | null>(null)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Retrieve Supabase auth token from localStorage
   *
   * @description
   * Extracts the access token from Supabase's localStorage entry.
   * Handles both parsed objects and raw token strings.
   *
   * @returns Access token string or null if not authenticated
   * @internal
   */
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

  /**
   * Parse CSV file content using papaparse
   *
   * @description
   * Converts CSV string content into structured data with headers and rows.
   * Automatically trims headers and skips empty lines.
   *
   * @param content - CSV file content as string
   * @returns Promise resolving to parsed headers and data rows
   * @throws Error if CSV parsing fails
   * @internal
   *
   * @example
   * const parsed = await parseCSV('name_en,type\nFrance,country');
   * // { headers: ['name_en', 'type'], data: [{ name_en: 'France', type: 'country' }] }
   */
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

  /**
   * Parse XLSX file using ExcelJS
   *
   * @description
   * Reads the first worksheet from an Excel file and extracts headers and data rows.
   * Handles rich text cells and formula results automatically.
   *
   * Processing:
   * - Row 1: Extracted as column headers (trimmed)
   * - Row 2+: Extracted as data rows (empty rows skipped)
   * - Rich text cells: Converted to plain text
   * - Formula cells: Uses calculated result value
   *
   * @param file - Excel file (XLSX or XLS format)
   * @returns Promise resolving to parsed headers and data rows
   * @throws Error if file has no worksheets or cannot be parsed
   * @internal
   *
   * @example
   * const parsed = await parseXLSX(file);
   * // { headers: ['name_en', 'type'], data: [{ name_en: 'France', type: 'country' }] }
   */
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

  /**
   * Upload and validate an import file
   *
   * @description
   * Handles the complete file upload and validation workflow:
   * 1. Validates file size (max 10MB)
   * 2. Detects format and parses file (CSV or XLSX)
   * 3. Sends data to backend validation Edge Function
   * 4. Returns validation results with row-level feedback
   *
   * Progress stages: uploading → parsing → validating → complete
   *
   * Validation includes:
   * - Schema validation (required fields, data types)
   * - Business rule validation (unique constraints, references)
   * - Conflict detection for upsert/update modes
   *
   * @param file - CSV or XLSX file to import
   * @returns Promise resolving to validation result with row statuses
   * @throws Error if file is too large, empty, invalid format, or validation fails
   *
   * @example
   * // Handle file upload
   * const validation = await importHook.uploadFile(file);
   * console.log(`Valid rows: ${validation.validCount}`);
   * console.log(`Conflicts: ${validation.conflictCount}`);
   *
   * @example
   * // Check for validation errors
   * if (validation.hasErrors) {
   *   const errors = validation.rows.filter(r => r.status === 'error');
   *   errors.forEach(row => console.log(row.errors));
   * }
   */
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

  /**
   * Execute import after validation
   *
   * @description
   * Imports validated rows to the database with conflict resolution.
   * Only processes rows with status 'valid', 'warning', or 'conflict'.
   *
   * Import modes:
   * - **insert**: Create new records only (fails on duplicates)
   * - **update**: Update existing records only (fails on missing)
   * - **upsert**: Insert new or update existing (recommended)
   *
   * Conflict resolution strategies:
   * - **skip**: Skip conflicting rows
   * - **update**: Update existing records with new data
   * - **keep_existing**: Keep existing records, skip updates
   *
   * @param request - Import request configuration
   * @param request.mode - Import mode ('insert' | 'update' | 'upsert')
   * @param request.rows - Validated rows to import
   * @param request.conflictResolution - How to handle conflicts
   * @param request.conflictResolutions - Per-row conflict resolutions (optional)
   * @param request.skipWarnings - Skip rows with warnings (default: false)
   * @param request.dryRun - Simulate import without committing (default: false)
   * @returns Promise resolving to import result with success/failure counts
   * @throws Error if import fails or is cancelled
   *
   * @example
   * // Execute import with upsert mode
   * const response = await importHook.executeImport({
   *   mode: 'upsert',
   *   rows: validationResult.rows,
   *   conflictResolution: 'update',
   * });
   * console.log(`Success: ${response.successCount}/${response.totalRows}`);
   *
   * @example
   * // Dry run to preview changes
   * const preview = await importHook.executeImport({
   *   mode: 'upsert',
   *   rows: validationResult.rows,
   *   dryRun: true,
   * });
   */
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

  /**
   * Cancel ongoing upload or import operation
   *
   * @description
   * Aborts the current operation using AbortController and resets loading states.
   * Safe to call even if no operation is in progress.
   *
   * @example
   * // Cancel button handler
   * <Button onClick={importHook.cancel}>Cancel Import</Button>
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsValidating(false)
    setIsImporting(false)
    setProgress(null)
  }, [])

  /**
   * Reset all import state to initial values
   *
   * @description
   * Clears validation results, import responses, progress, and errors.
   * Use this to start a fresh import workflow.
   *
   * @example
   * // Reset after successful import
   * importHook.reset();
   * fileInputRef.current.value = '';
   */
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
