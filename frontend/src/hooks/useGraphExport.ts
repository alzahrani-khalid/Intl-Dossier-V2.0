/**
 * useGraphExport Hook
 * Feature: knowledge-graph-export
 *
 * React hook for exporting relationship graphs in standard formats (RDF, GraphML, JSON-LD).
 * Handles API communication, progress tracking, and file download.
 */

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase-client'
import type {
  GraphExportRequest,
  GraphExportResponse,
  GraphExportProgress,
  UseGraphExportOptions,
  UseGraphExportReturn,
  GraphExportFormat,
  RDFSerializationFormat,
  GRAPH_EXPORT_EXTENSIONS,
  RDF_SERIALIZATION_EXTENSIONS,
} from '@/types/graph-export.types'

/**
 * Get file extension based on format
 */
function getFileExtension(format: GraphExportFormat, rdfFormat?: RDFSerializationFormat): string {
  if (format === 'rdf' && rdfFormat) {
    const extensions: Record<RDFSerializationFormat, string> = {
      turtle: 'ttl',
      'n-triples': 'nt',
      'rdf-xml': 'rdf',
    }
    return extensions[rdfFormat] || 'ttl'
  }

  const extensions: Record<GraphExportFormat, string> = {
    rdf: 'ttl',
    graphml: 'graphml',
    'json-ld': 'jsonld',
  }
  return extensions[format]
}

/**
 * Download content as a file
 */
function downloadFile(content: string, fileName: string, contentType: string): void {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Hook for exporting relationship graphs
 */
export function useGraphExport(options: UseGraphExportOptions = {}): UseGraphExportReturn {
  const { onSuccess, onError, onProgress } = options

  const [progress, setProgress] = useState<GraphExportProgress | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Update progress state and notify callback
   */
  const updateProgress = useCallback(
    (newProgress: GraphExportProgress) => {
      setProgress(newProgress)
      onProgress?.(newProgress)
    },
    [onProgress],
  )

  /**
   * Export graph data
   */
  const exportGraph = useCallback(
    async (request: GraphExportRequest): Promise<GraphExportResponse> => {
      setIsExporting(true)
      setError(null)

      try {
        // Stage 1: Fetching data
        updateProgress({
          stage: 'fetching',
          progress: 10,
          message_en: 'Fetching graph data...',
          message_ar: 'جارٍ جلب بيانات الرسم البياني...',
        })

        // Get auth session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          throw new Error('Not authenticated')
        }

        // Stage 2: Processing
        updateProgress({
          stage: 'processing',
          progress: 30,
          message_en: 'Processing graph structure...',
          message_ar: 'جارٍ معالجة بنية الرسم البياني...',
        })

        // Call edge function
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/graph-export`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(request),
          },
        )

        // Stage 3: Generating file
        updateProgress({
          stage: 'generating',
          progress: 70,
          message_en: 'Generating export file...',
          message_ar: 'جارٍ إنشاء ملف التصدير...',
        })

        const result = await response.json()

        if (!response.ok || result.error) {
          throw new Error(result.error?.message_en || 'Failed to export graph')
        }

        const exportResponse: GraphExportResponse = result

        // Download the file
        if (exportResponse.success && exportResponse.content) {
          const extension = getFileExtension(request.format, request.rdfFormat)
          const timestamp = new Date().toISOString().split('T')[0]
          const fileName =
            exportResponse.fileName || `knowledge_graph_export_${timestamp}.${extension}`
          const contentType = exportResponse.contentType || 'application/octet-stream'

          downloadFile(exportResponse.content, fileName, contentType)
        }

        // Stage 4: Complete
        updateProgress({
          stage: 'complete',
          progress: 100,
          currentCount: exportResponse.nodeCount,
          totalCount: exportResponse.nodeCount + exportResponse.edgeCount,
          message_en: `Successfully exported ${exportResponse.nodeCount} nodes and ${exportResponse.edgeCount} edges`,
          message_ar: `تم تصدير ${exportResponse.nodeCount} عقدة و ${exportResponse.edgeCount} علاقة بنجاح`,
        })

        onSuccess?.(exportResponse)
        return exportResponse
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Export failed'
        const exportError = new Error(errorMessage)

        setError(exportError)
        updateProgress({
          stage: 'error',
          progress: 0,
          message_en: errorMessage,
          message_ar: 'فشل التصدير',
        })

        onError?.(exportError)
        throw exportError
      } finally {
        setIsExporting(false)
      }
    },
    [updateProgress, onSuccess, onError],
  )

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    setProgress(null)
    setIsExporting(false)
    setError(null)
  }, [])

  return {
    exportGraph,
    progress,
    isExporting,
    error,
    reset,
  }
}

export default useGraphExport
