/**
 * Dossier Export Types
 * Feature: dossier-export-pack
 *
 * TypeScript interfaces for one-click dossier export to PDF/DOCX briefing packets.
 * Includes timeline, relationships, documents, commitments, positions, events, and contacts.
 * Supports bilingual export (EN/AR).
 */

import type { DossierType, DossierStatus } from '@/services/dossier-api'

/**
 * Export format options
 */
export type DossierExportFormat = 'pdf' | 'docx'

/**
 * Export language options
 */
export type ExportLanguage = 'en' | 'ar' | 'both'

/**
 * Export status for tracking progress
 */
export type DossierExportStatus =
  | 'idle'
  | 'preparing'
  | 'fetching'
  | 'generating'
  | 'uploading'
  | 'ready'
  | 'failed'

/**
 * Sections that can be included in the export
 */
export type ExportSection =
  | 'executive_summary'
  | 'overview'
  | 'relationships'
  | 'positions'
  | 'mous'
  | 'commitments'
  | 'timeline'
  | 'events'
  | 'contacts'
  | 'documents'

/**
 * Export section configuration
 */
export interface ExportSectionConfig {
  /** Section type */
  type: ExportSection
  /** Section title in English */
  title_en: string
  /** Section title in Arabic */
  title_ar: string
  /** Whether this section is enabled */
  enabled: boolean
  /** Display order */
  order: number
}

/**
 * Default section configuration
 */
export const DEFAULT_EXPORT_SECTIONS: ExportSectionConfig[] = [
  {
    type: 'executive_summary',
    title_en: 'Executive Summary',
    title_ar: 'الملخص التنفيذي',
    enabled: true,
    order: 1,
  },
  {
    type: 'overview',
    title_en: 'Dossier Overview',
    title_ar: 'نظرة عامة على الملف',
    enabled: true,
    order: 2,
  },
  {
    type: 'relationships',
    title_en: 'Relationships',
    title_ar: 'العلاقات',
    enabled: true,
    order: 3,
  },
  {
    type: 'positions',
    title_en: 'Positions & Talking Points',
    title_ar: 'المواقف ونقاط النقاش',
    enabled: true,
    order: 4,
  },
  {
    type: 'mous',
    title_en: 'MoU Agreements',
    title_ar: 'مذكرات التفاهم',
    enabled: true,
    order: 5,
  },
  {
    type: 'commitments',
    title_en: 'Commitments & Deliverables',
    title_ar: 'الالتزامات والمخرجات',
    enabled: true,
    order: 6,
  },
  {
    type: 'timeline',
    title_en: 'Activity Timeline',
    title_ar: 'الجدول الزمني للأنشطة',
    enabled: true,
    order: 7,
  },
  {
    type: 'events',
    title_en: 'Upcoming Events',
    title_ar: 'الفعاليات القادمة',
    enabled: true,
    order: 8,
  },
  {
    type: 'contacts',
    title_en: 'Key Contacts',
    title_ar: 'جهات الاتصال الرئيسية',
    enabled: true,
    order: 9,
  },
  {
    type: 'documents',
    title_en: 'Related Documents',
    title_ar: 'المستندات ذات الصلة',
    enabled: false,
    order: 10,
  },
]

/**
 * Export configuration options
 */
export interface DossierExportConfig {
  /** Export format */
  format: DossierExportFormat
  /** Primary language */
  language: ExportLanguage
  /** Sections to include */
  sections: ExportSectionConfig[]
  /** Include cover page */
  includeCoverPage: boolean
  /** Include table of contents */
  includeTableOfContents: boolean
  /** Include page numbers */
  includePageNumbers: boolean
  /** Date range for timeline/events (optional) */
  dateRange?: {
    from: string
    to: string
  }
  /** Custom header text */
  headerText?: string
  /** Custom footer text */
  footerText?: string
  /** Generated at timestamp */
  generatedAt?: string
}

/**
 * Default export configuration
 */
export const DEFAULT_EXPORT_CONFIG: DossierExportConfig = {
  format: 'pdf',
  language: 'both',
  sections: DEFAULT_EXPORT_SECTIONS,
  includeCoverPage: true,
  includeTableOfContents: true,
  includePageNumbers: true,
}

/**
 * Export request to the Edge Function
 */
export interface DossierExportRequest {
  /** Dossier ID to export */
  dossier_id: string
  /** Export configuration */
  config: DossierExportConfig
}

/**
 * Export progress tracking
 */
export interface DossierExportProgress {
  /** Current status */
  status: DossierExportStatus
  /** Progress percentage (0-100) */
  progress: number
  /** Current step message in English */
  message_en: string
  /** Current step message in Arabic */
  message_ar: string
  /** Current section being processed */
  currentSection?: ExportSection
}

/**
 * Export response from the Edge Function
 */
export interface DossierExportResponse {
  /** Whether export succeeded */
  success: boolean
  /** Download URL for the generated file */
  download_url?: string
  /** Generated filename */
  file_name?: string
  /** File size in bytes */
  file_size?: number
  /** Number of pages */
  page_count?: number
  /** Expiration timestamp for the download URL */
  expires_at?: string
  /** Base64 encoded content (fallback when storage upload fails) */
  content_base64?: string
  /** MIME type of the content */
  content_type?: string
  /** Error details if failed */
  error?: {
    code: string
    message_en: string
    message_ar: string
  }
}

/**
 * Dossier summary for export cover page
 */
export interface DossierExportSummary {
  id: string
  name_en: string
  name_ar: string
  type: DossierType
  status: DossierStatus
  description_en: string | null
  description_ar: string | null
  stats: {
    relationships_count: number
    positions_count: number
    mous_count: number
    commitments_count: number
    events_count: number
    contacts_count: number
    documents_count: number
  }
  generated_at: string
  generated_by: string
}

/**
 * Hook options for useDossierExport
 */
export interface UseDossierExportOptions {
  /** Callback on export start */
  onStart?: () => void
  /** Callback on export progress */
  onProgress?: (progress: DossierExportProgress) => void
  /** Callback on export success */
  onSuccess?: (response: DossierExportResponse) => void
  /** Callback on export error */
  onError?: (error: Error) => void
}

/**
 * Hook return type for useDossierExport
 */
export interface UseDossierExportReturn {
  /** Start export with configuration */
  exportDossier: (
    dossierId: string,
    config?: Partial<DossierExportConfig>,
  ) => Promise<DossierExportResponse>
  /** Quick export with default settings */
  quickExport: (dossierId: string, format: DossierExportFormat) => Promise<DossierExportResponse>
  /** Current export progress */
  progress: DossierExportProgress | null
  /** Whether export is in progress */
  isExporting: boolean
  /** Last export error */
  error: Error | null
  /** Reset state */
  reset: () => void
}

/**
 * Export dialog props
 */
export interface ExportDossierDialogProps {
  /** Dossier to export */
  dossierId: string
  /** Dossier name for display */
  dossierName: string
  /** Dossier type */
  dossierType: DossierType
  /** Whether dialog is open */
  open: boolean
  /** Close handler */
  onClose: () => void
  /** Success callback */
  onSuccess?: (response: DossierExportResponse) => void
}
