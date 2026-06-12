/**
 * useDossierExport Hook
 * Feature: dossier-export-pack
 *
 * React hook for managing dossier export operations.
 * Handles export state and progress tracking. Delivery (new-tab write or
 * fallback download) is owned by the calling dialog — this hook performs no
 * window/document side effects.
 */

import { useState, useCallback } from 'react'
import type {
  DossierExportConfig,
  DossierExportProgress,
  DossierExportResponse,
  UseDossierExportOptions,
  UseDossierExportReturn,
} from '@/types/dossier-export.types'
import { DEFAULT_EXPORT_CONFIG } from '@/types/dossier-export.types'
import { exportDossier as exportDossierApi } from '@/services/dossier-export.service'

/**
 * Hook for managing dossier export operations
 */
export function useDossierExport(options: UseDossierExportOptions = {}): UseDossierExportReturn {
  const { onStart, onProgress, onSuccess, onError } = options

  // State
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState<DossierExportProgress | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [failedSections, setFailedSections] = useState<string[]>([])

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
    ): Promise<{ html: string; failedSections: string[] }> => {
      setIsExporting(true)
      setError(null)
      setFailedSections([])
      onStart?.()

      // Merge with default config
      const fullConfig: DossierExportConfig = {
        ...DEFAULT_EXPORT_CONFIG,
        ...config,
        sections: config?.sections || DEFAULT_EXPORT_CONFIG.sections,
      }

      try {
        // Single in-flight stage: the export is one request/response with no
        // observable intermediate milestones, and React batches synchronous
        // state updates — staged preparing/fetching updates could never render.
        updateProgress({
          status: 'generating',
          progress: 60,
          message_en: 'Generating briefing pack...',
          message_ar: 'جارٍ إنشاء حزمة الإحاطة...',
        })

        // The service returns the pack HTML and any sections that failed.
        const { html, failedSections: sections } = await exportDossierApi({
          dossier_id: dossierId,
          config: fullConfig,
        })

        setFailedSections(sections)

        // Stage 4: Ready
        updateProgress({
          status: 'ready',
          progress: 100,
          message_en: 'Export complete',
          message_ar: 'اكتمل التصدير',
        })

        const response: DossierExportResponse = { success: true, failed_sections: sections }
        onSuccess?.(response)

        return { html, failedSections: sections }
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
    async (dossierId: string): Promise<{ html: string; failedSections: string[] }> => {
      return exportDossier(dossierId)
    },
    [exportDossier],
  )

  // Reset state
  const reset = useCallback(() => {
    setIsExporting(false)
    setProgress(null)
    setError(null)
    setFailedSections([])
  }, [])

  return {
    exportDossier,
    quickExport,
    progress,
    isExporting,
    error,
    failedSections,
    reset,
  }
}
