/**
 * useDossierExport Hook
 * @module hooks/useDossierExport
 * @feature dossier-export-pack
 *
 * React hook for managing dossier export operations with progress tracking,
 * multiple format support, and automatic file download.
 *
 * @description
 * This hook provides a stateful interface for exporting dossiers to various
 * formats (PDF, DOCX, HTML) with real-time progress tracking and callbacks.
 *
 * Features:
 * - Multi-format export (PDF, DOCX, HTML)
 * - Real-time progress tracking through 5 stages
 * - Configurable section inclusion
 * - Automatic file download on completion
 * - Error handling with bilingual messages
 * - Lifecycle callbacks (onStart, onProgress, onSuccess, onError)
 * - Quick export helper for default settings
 *
 * Export stages:
 * 1. preparing (10%) - Initializing export
 * 2. fetching (25%) - Fetching dossier data
 * 3. generating (50%) - Generating document
 * 4. uploading (80%) - Finalizing export
 * 5. ready (100%) - Export complete, file downloaded
 *
 * @example
 * // Basic usage with progress tracking
 * const {
 *   exportDossier,
 *   isExporting,
 *   progress,
 *   error,
 * } = useDossierExport({
 *   onProgress: (p) => console.log(`${p.progress}%: ${p.message_en}`),
 *   onSuccess: () => toast.success('Export complete!'),
 * });
 *
 * // Trigger export
 * await exportDossier(dossierId, {
 *   format: 'pdf',
 *   sections: ['overview', 'timeline', 'documents'],
 * });
 *
 * @example
 * // Quick export with defaults
 * const { quickExport } = useDossierExport();
 * await quickExport(dossierId, 'pdf');
 *
 * @example
 * // With full config
 * const { exportDossier } = useDossierExport();
 * await exportDossier(dossierId, {
 *   format: 'docx',
 *   language: 'ar',
 *   include_toc: true,
 *   sections: ['overview', 'timeline', 'positions', 'documents'],
 * });
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
 * Hook for managing dossier export operations with progress tracking
 *
 * @description
 * Manages the full lifecycle of a dossier export operation including state
 * management, progress tracking, and file download. Returns functions to
 * trigger exports and state for UI updates.
 *
 * @param options - Hook configuration options
 * @param options.onStart - Callback fired when export starts
 * @param options.onProgress - Callback fired on progress updates
 * @param options.onSuccess - Callback fired on successful export
 * @param options.onError - Callback fired on export error
 * @returns Export functions and current state
 *
 * @example
 * // With progress display
 * const { exportDossier, progress, isExporting } = useDossierExport({
 *   onProgress: (p) => setProgressPercent(p.progress),
 * });
 *
 * return (
 *   <div>
 *     {isExporting && <ProgressBar value={progress?.progress} />}
 *     <Button onClick={() => exportDossier(id)}>Export</Button>
 *   </div>
 * );
 */
export function useDossierExport(options: UseDossierExportOptions = {}): UseDossierExportReturn {
  const { onStart, onProgress, onSuccess, onError } = options

  // State
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState<DossierExportProgress | null>(null)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Update progress helper
   * @internal
   */
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

  /**
   * Main export function with progress tracking
   *
   * @description
   * Exports a dossier with the specified configuration. Tracks progress through
   * 5 stages and automatically downloads the file on completion. Supports both
   * download URL and base64 content fallback.
   *
   * @param dossierId - UUID of the dossier to export
   * @param config - Optional export configuration (merged with defaults)
   * @returns Promise resolving to the export response
   * @throws Error if export fails at any stage
   */
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

  /**
   * Quick export with default settings
   *
   * @description
   * Convenience function for exporting with default configuration. Only requires
   * dossier ID and format. All other settings use system defaults.
   *
   * @param dossierId - UUID of the dossier to export
   * @param format - Export format (default: 'pdf')
   * @returns Promise resolving to the export response
   *
   * @example
   * const { quickExport } = useDossierExport();
   * await quickExport(dossierId, 'pdf');
   */
  const quickExport = useCallback(
    async (
      dossierId: string,
      format: DossierExportFormat = 'pdf',
    ): Promise<DossierExportResponse> => {
      return exportDossier(dossierId, { format })
    },
    [exportDossier],
  )

  /**
   * Reset export state
   *
   * @description
   * Clears all export state including progress, errors, and loading flags.
   * Useful for resetting after an export completes or fails.
   */
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
