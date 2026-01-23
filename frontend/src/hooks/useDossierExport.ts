/**
 * useDossierExport Hook
 * Feature: dossier-export-pack
 *
 * React hook for managing dossier export operations.
 * Handles export state, progress tracking, and file download.
 */

import { useState, useCallback } from 'react'
import type {
  DossierExportConfig,
  DossierExportProgress,
  DossierExportResponse,
  DossierExportFormat,
  UseDossierExportOptions,
  UseDossierExportReturn,
} from '@/types/dossier-export.types'
import { DEFAULT_EXPORT_CONFIG } from '@/types/dossier-export.types'
import {
  exportDossier as exportDossierApi,
  downloadExportedFile,
} from '@/services/dossier-export.service'

/**
 * Hook for managing dossier export operations
 */
export function useDossierExport(options: UseDossierExportOptions = {}): UseDossierExportReturn {
  const { onStart, onProgress, onSuccess, onError } = options

  // State
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState<DossierExportProgress | null>(null)
  const [error, setError] = useState<Error | null>(null)

  // Update progress helper
  const updateProgress = useCallback(
    (partialProgress: Partial<DossierExportProgress>) => {
      setProgress((prev) => {
        const newProgress = {
          status: partialProgress.status || prev?.status || 'idle',
          progress: partialProgress.progress ?? prev?.progress ?? 0,
          message_en: partialProgress.message_en || prev?.message_en || '',
          message_ar: partialProgress.message_ar || prev?.message_ar || '',
          currentSection: partialProgress.currentSection,
        } as DossierExportProgress
        onProgress?.(newProgress)
        return newProgress
      })
    },
    [onProgress],
  )

  // Main export function
  const exportDossier = useCallback(
    async (
      dossierId: string,
      config?: Partial<DossierExportConfig>,
    ): Promise<DossierExportResponse> => {
      setIsExporting(true)
      setError(null)
      onStart?.()

      // Merge with default config
      const fullConfig: DossierExportConfig = {
        ...DEFAULT_EXPORT_CONFIG,
        ...config,
        sections: config?.sections || DEFAULT_EXPORT_CONFIG.sections,
      }

      try {
        // Stage 1: Preparing
        updateProgress({
          status: 'preparing',
          progress: 10,
          message_en: 'Preparing export...',
          message_ar: 'جارٍ إعداد التصدير...',
        })

        // Stage 2: Fetching data
        updateProgress({
          status: 'fetching',
          progress: 25,
          message_en: 'Fetching dossier data...',
          message_ar: 'جارٍ جلب بيانات الملف...',
        })

        // Stage 3: Generating document
        updateProgress({
          status: 'generating',
          progress: 50,
          message_en: 'Generating document...',
          message_ar: 'جارٍ إنشاء المستند...',
        })

        // Make API call
        const response = await exportDossierApi({
          dossier_id: dossierId,
          config: fullConfig,
        })

        // Stage 4: Uploading
        updateProgress({
          status: 'uploading',
          progress: 80,
          message_en: 'Finalizing export...',
          message_ar: 'جارٍ إنهاء التصدير...',
        })

        if (response.success) {
          // Stage 5: Ready
          updateProgress({
            status: 'ready',
            progress: 100,
            message_en: 'Export complete!',
            message_ar: 'اكتمل التصدير!',
          })

          // Trigger download if URL is available
          if (response.download_url && response.file_name) {
            await downloadExportedFile(response.download_url, response.file_name)
          } else if (response.content_base64) {
            // Fallback: Download from base64 content
            const byteCharacters = atob(response.content_base64)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            const blob = new Blob([byteArray], {
              type: response.content_type || 'text/html',
            })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = response.file_name || `briefing-pack-${dossierId}.html`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
          }

          onSuccess?.(response)
        } else {
          // Handle error response
          const errorMsg = response.error?.message_en || 'Export failed'
          throw new Error(errorMsg)
        }

        return response
      } catch (err) {
        const exportError = err instanceof Error ? err : new Error('Export failed')
        setError(exportError)
        updateProgress({
          status: 'failed',
          progress: 0,
          message_en: exportError.message,
          message_ar: 'فشل التصدير',
        })
        onError?.(exportError)
        throw exportError
      } finally {
        setIsExporting(false)
      }
    },
    [onStart, onSuccess, onError, updateProgress],
  )

  // Quick export with default settings
  const quickExport = useCallback(
    async (
      dossierId: string,
      format: DossierExportFormat = 'pdf',
    ): Promise<DossierExportResponse> => {
      return exportDossier(dossierId, { format })
    },
    [exportDossier],
  )

  // Reset state
  const reset = useCallback(() => {
    setIsExporting(false)
    setProgress(null)
    setError(null)
  }, [])

  return {
    exportDossier,
    quickExport,
    progress,
    isExporting,
    error,
    reset,
  }
}

export default useDossierExport
