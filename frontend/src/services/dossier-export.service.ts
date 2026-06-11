/**
 * Dossier Export Service
 * Feature: dossier-export-pack
 *
 * API client for exporting a dossier to a print-ready HTML briefing pack.
 * Calls the Edge Function, which returns the pack HTML body and reports any
 * sections it could not generate via the X-Failed-Sections response header.
 */

import { supabase } from '@/lib/supabase'
import type { DossierExportRequest } from '@/types/dossier-export.types'

/**
 * Result of a successful export: the pack HTML and the list of section keys
 * the edge could not generate (empty when every section rendered).
 */
export interface ExportDossierResult {
  html: string
  failedSections: string[]
}

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
 * Export a dossier — returns the briefing pack HTML and the list of sections
 * that could not be generated (read from the X-Failed-Sections header).
 */
export async function exportDossier(request: DossierExportRequest): Promise<ExportDossierResult> {
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

  // The edge returns the pack as a text/html body.
  const html = await response.text()

  // Sections that failed are reported as a comma-separated header.
  const failedSectionsRaw = response.headers.get('X-Failed-Sections') ?? ''
  const failedSections = failedSectionsRaw ? failedSectionsRaw.split(',').filter(Boolean) : []

  return { html, failedSections }
}

// =============================================================================
// Query Keys
// =============================================================================

export const dossierExportKeys = {
  all: ['dossier-export'] as const,
  estimate: (dossierId: string) => [...dossierExportKeys.all, 'estimate', dossierId] as const,
}
