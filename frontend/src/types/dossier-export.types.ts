/**
 * Dossier Export Types
 * Feature: dossier-export-pack
 *
 * TypeScript interfaces for one-click dossier export to a print-ready HTML
 * briefing pack. Includes timeline, relationships, documents, commitments,
 * positions, events, and contacts. The pack is rendered in a single language
 * (EN or AR).
 */

import type { DossierType } from '@/services/dossier-api'

/**
 * Export language options
 */
export type ExportLanguage = 'en' | 'ar'

/**
 * Export status for tracking progress
 */
export type DossierExportStatus =
  | 'idle'
  | 'preparing'
  | 'fetching'
  | 'generating'
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
  /** Pack language */
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
  language: 'en', // overridden at dialog level to match i18n.language
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
 * Export response surfaced to onSuccess callbacks
 */
export interface DossierExportResponse {
  /** Whether export succeeded */
  success: boolean
  /** Sections that could not be generated (D-08) */
  failed_sections?: string[]
  /** Error details if failed */
  error?: {
    code: string
    message_en: string
    message_ar: string
  }
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
  /** Start export with configuration — resolves with the pack HTML and failed sections */
  exportDossier: (
    dossierId: string,
    config?: Partial<DossierExportConfig>,
  ) => Promise<{ html: string; failedSections: string[] }>
  /** Quick export with default settings */
  quickExport: (dossierId: string) => Promise<{ html: string; failedSections: string[] }>
  /** Current export progress */
  progress: DossierExportProgress | null
  /** Whether export is in progress */
  isExporting: boolean
  /** Last export error */
  error: Error | null
  /** Sections the edge could not generate (D-08) */
  failedSections: string[]
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
