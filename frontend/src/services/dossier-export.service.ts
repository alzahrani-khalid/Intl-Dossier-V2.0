/**
 * Dossier Export Service
 * Feature: dossier-export-pack
 *
 * API client for exporting dossiers to PDF/DOCX briefing packets.
 * Aggregates all dossier data and calls the Edge Function for document generation.
 */

import { supabase } from '@/lib/supabase'
import type {
  DossierExportRequest,
  DossierExportResponse,
} from '@/types/dossier-export.types'

// =============================================================================
// API Error
// =============================================================================

export class DossierExportAPIError extends Error {
  code: string
  status: number
  details?: string

  constructor(message: string, status: number, code: string, details?: string) {
    super(message)
    this.name = 'DossierExportAPIError'
    this.code = code
    this.status = status
    this.details = details
  }
}

// =============================================================================
// Helper: Get Auth Headers
// =============================================================================

async function getAuthHeaders(): Promise<Headers> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const headers = new Headers({
    'Content-Type': 'application/json',
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  })

  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }

  return headers
}

// =============================================================================
// Export Dossier
// =============================================================================

/**
 * Export a dossier to PDF or DOCX format
 */
export async function exportDossier(request: DossierExportRequest): Promise<DossierExportResponse> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dossier-export-pack`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    },
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Export failed',
      code: 'EXPORT_FAILED',
    }))
    throw new DossierExportAPIError(
      error.message || 'Failed to export dossier',
      response.status,
      error.code || 'EXPORT_FAILED',
      error.details,
    )
  }

  return response.json()
}

/**
 * Download the exported file
 */
export async function downloadExportedFile(downloadUrl: string, fileName: string): Promise<void> {
  try {
    const response = await fetch(downloadUrl)

    if (!response.ok) {
      throw new Error('Download failed')
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Download error:', error)
    throw new DossierExportAPIError(
      'Failed to download file',
      500,
      'DOWNLOAD_FAILED',
      error instanceof Error ? error.message : 'Unknown error',
    )
  }
}

// =============================================================================
// Query Keys
// =============================================================================

export const dossierExportKeys = {
  all: ['dossier-export'] as const,
  estimate: (dossierId: string) => [...dossierExportKeys.all, 'estimate', dossierId] as const,
  history: (dossierId: string) => [...dossierExportKeys.all, 'history', dossierId] as const,
}
