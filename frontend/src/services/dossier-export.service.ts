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
  DossierExportFormat,
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
 * Quick export with default settings
 */
export async function quickExportDossier(
  dossierId: string,
  format: DossierExportFormat = 'pdf',
): Promise<DossierExportResponse> {
  const { DEFAULT_EXPORT_CONFIG } = await import('@/types/dossier-export.types')

  return exportDossier({
    dossier_id: dossierId,
    config: {
      ...DEFAULT_EXPORT_CONFIG,
      format,
    },
  })
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

/**
 * Get estimated export size based on dossier content
 */
export async function getExportEstimate(dossierId: string): Promise<{
  estimated_pages: number
  estimated_size_kb: number
  sections_with_content: string[]
}> {
  try {
    // Fetch counts from various tables
    const [
      { count: relCount },
      { count: posCount },
      { count: mouCount },
      { count: workCount },
      { count: eventCount },
      { count: contactCount },
    ] = await Promise.all([
      supabase
        .from('dossier_relationships')
        .select('id', { count: 'exact', head: true })
        .or(`source_dossier_id.eq.${dossierId},target_dossier_id.eq.${dossierId}`),
      supabase
        .from('positions')
        .select('id', { count: 'exact', head: true })
        .contains('dossier_ids', [dossierId]),
      supabase
        .from('mous')
        .select('id', { count: 'exact', head: true })
        .contains('dossier_ids', [dossierId]),
      supabase
        .from('work_item_dossiers')
        .select('id', { count: 'exact', head: true })
        .eq('dossier_id', dossierId),
      supabase
        .from('calendar_entries')
        .select('id', { count: 'exact', head: true })
        .eq('dossier_id', dossierId),
      supabase
        .from('key_contacts')
        .select('id', { count: 'exact', head: true })
        .eq('dossier_id', dossierId),
    ])

    const sectionsWithContent: string[] = ['overview', 'executive_summary']

    if ((relCount || 0) > 0) sectionsWithContent.push('relationships')
    if ((posCount || 0) > 0) sectionsWithContent.push('positions')
    if ((mouCount || 0) > 0) sectionsWithContent.push('mous')
    if ((workCount || 0) > 0) sectionsWithContent.push('commitments')
    if ((eventCount || 0) > 0) sectionsWithContent.push('events')
    if ((contactCount || 0) > 0) sectionsWithContent.push('contacts')

    // Estimate pages (rough calculation)
    const totalItems =
      (relCount || 0) +
      (posCount || 0) +
      (mouCount || 0) +
      (workCount || 0) +
      (eventCount || 0) +
      (contactCount || 0)

    const estimatedPages = Math.max(3, Math.ceil(totalItems / 10) + 2)
    const estimatedSizeKb = estimatedPages * 50 // ~50KB per page

    return {
      estimated_pages: estimatedPages,
      estimated_size_kb: estimatedSizeKb,
      sections_with_content: sectionsWithContent,
    }
  } catch (error) {
    console.error('Estimate error:', error)
    return {
      estimated_pages: 5,
      estimated_size_kb: 250,
      sections_with_content: ['overview', 'executive_summary'],
    }
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
