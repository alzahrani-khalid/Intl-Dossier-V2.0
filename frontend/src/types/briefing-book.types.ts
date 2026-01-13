/**
 * Briefing Book Types
 * Feature: briefing-book-generator
 *
 * TypeScript interfaces for customized briefing book compilation and export.
 * Supports PDF/DOCX generation with table of contents, bookmarks, and print-optimized formatting.
 */

import type { DossierType, SensitivityLevel } from './dossier'

/**
 * Briefing book export formats
 */
export type BriefingBookFormat = 'pdf' | 'docx' | 'html'

/**
 * Briefing book status
 */
export type BriefingBookStatus = 'draft' | 'generating' | 'ready' | 'expired' | 'failed'

/**
 * Content section types available for inclusion
 */
export type BriefingBookSectionType =
  | 'executive_summary'
  | 'entity_overview'
  | 'key_contacts'
  | 'recent_engagements'
  | 'positions'
  | 'mou_agreements'
  | 'commitments'
  | 'timeline'
  | 'documents'
  | 'relationship_map'
  | 'intelligence'
  | 'custom'

/**
 * Topic categories for filtering content
 */
export type BriefingBookTopic =
  | 'statistics'
  | 'economy'
  | 'trade'
  | 'technology'
  | 'environment'
  | 'health'
  | 'education'
  | 'governance'
  | 'cooperation'
  | 'other'

/**
 * Selected entity for briefing book
 */
export interface BriefingBookEntity {
  /** Entity ID */
  id: string
  /** Entity type (country, organization, forum, theme) */
  type: DossierType
  /** Entity name in English */
  name_en: string
  /** Entity name in Arabic */
  name_ar: string
  /** Included sections for this entity */
  includedSections: BriefingBookSectionType[]
}

/**
 * Section configuration for the briefing book
 */
export interface BriefingBookSection {
  /** Section type */
  type: BriefingBookSectionType
  /** Section title in English */
  title_en: string
  /** Section title in Arabic */
  title_ar: string
  /** Whether this section is enabled */
  enabled: boolean
  /** Order in the document */
  order: number
  /** Custom content (for custom sections) */
  customContent?: {
    en: string
    ar: string
  }
}

/**
 * Date range for filtering content
 */
export interface BriefingBookDateRange {
  /** Start date (ISO string) */
  startDate: string
  /** End date (ISO string) */
  endDate: string
}

/**
 * Briefing book configuration
 */
export interface BriefingBookConfig {
  /** Book title in English */
  title_en: string
  /** Book title in Arabic */
  title_ar: string
  /** Description/purpose in English */
  description_en?: string
  /** Description/purpose in Arabic */
  description_ar?: string
  /** Selected entities to include */
  entities: BriefingBookEntity[]
  /** Date range for content filtering */
  dateRange?: BriefingBookDateRange
  /** Topics to include */
  topics?: BriefingBookTopic[]
  /** Sections to include */
  sections: BriefingBookSection[]
  /** Export format */
  format: BriefingBookFormat
  /** Primary language */
  primaryLanguage: 'en' | 'ar'
  /** Include bilingual content */
  includeBilingual: boolean
  /** Include table of contents */
  includeTableOfContents: boolean
  /** Include page numbers */
  includePageNumbers: boolean
  /** Include bookmarks */
  includeBookmarks: boolean
  /** Include cover page */
  includeCoverPage: boolean
  /** Include executive summary */
  includeExecutiveSummary: boolean
  /** Sensitivity level filter */
  maxSensitivityLevel?: SensitivityLevel
  /** Custom header text */
  headerText?: string
  /** Custom footer text */
  footerText?: string
}

/**
 * Briefing book metadata
 */
export interface BriefingBook {
  /** Unique identifier */
  id: string
  /** Configuration used */
  config: BriefingBookConfig
  /** Current status */
  status: BriefingBookStatus
  /** File URL when ready */
  fileUrl?: string
  /** File size in bytes */
  fileSizeBytes?: number
  /** Page count */
  pageCount?: number
  /** Word count */
  wordCount?: number
  /** Error message if failed */
  errorMessage?: string
  /** Created by user ID */
  createdBy: string
  /** Created by user name */
  createdByName?: string
  /** Created timestamp */
  createdAt: string
  /** Generated timestamp */
  generatedAt?: string
  /** Expires timestamp */
  expiresAt?: string
}

/**
 * Request to create a new briefing book
 */
export interface CreateBriefingBookRequest {
  /** Briefing book configuration */
  config: BriefingBookConfig
}

/**
 * Response from briefing book generation
 */
export interface CreateBriefingBookResponse {
  /** Created briefing book */
  briefingBook: BriefingBook
  /** Estimated generation time in seconds */
  estimatedTime?: number
}

/**
 * Request to list briefing books
 */
export interface ListBriefingBooksRequest {
  /** Filter by status */
  status?: BriefingBookStatus
  /** Filter by date range */
  dateRange?: BriefingBookDateRange
  /** Pagination cursor */
  cursor?: string
  /** Page size limit */
  limit?: number
}

/**
 * Response from listing briefing books
 */
export interface ListBriefingBooksResponse {
  /** List of briefing books */
  data: BriefingBook[]
  /** Pagination info */
  pagination: {
    nextCursor?: string
    hasMore: boolean
    totalCount?: number
  }
}

/**
 * Briefing book template for reuse
 */
export interface BriefingBookTemplate {
  /** Template ID */
  id: string
  /** Template name in English */
  name_en: string
  /** Template name in Arabic */
  name_ar: string
  /** Template description in English */
  description_en?: string
  /** Template description in Arabic */
  description_ar?: string
  /** Template configuration (without entities) */
  config: Omit<BriefingBookConfig, 'entities' | 'title_en' | 'title_ar' | 'dateRange'>
  /** Whether this is a system default */
  isDefault: boolean
  /** Created by user ID */
  createdBy?: string
  /** Created timestamp */
  createdAt: string
  /** Updated timestamp */
  updatedAt: string
}

/**
 * Generation progress
 */
export interface BriefingBookProgress {
  /** Current stage */
  stage:
    | 'initializing'
    | 'fetching'
    | 'compiling'
    | 'formatting'
    | 'generating'
    | 'uploading'
    | 'complete'
    | 'error'
  /** Progress percentage (0-100) */
  progress: number
  /** Current entity being processed */
  currentEntity?: string
  /** Current section being processed */
  currentSection?: string
  /** Status message in English */
  message_en?: string
  /** Status message in Arabic */
  message_ar?: string
}

/**
 * Default sections configuration
 */
export const DEFAULT_SECTIONS: BriefingBookSection[] = [
  {
    type: 'executive_summary',
    title_en: 'Executive Summary',
    title_ar: 'الملخص التنفيذي',
    enabled: true,
    order: 1,
  },
  {
    type: 'entity_overview',
    title_en: 'Entity Overview',
    title_ar: 'نظرة عامة على الجهة',
    enabled: true,
    order: 2,
  },
  {
    type: 'key_contacts',
    title_en: 'Key Contacts',
    title_ar: 'جهات الاتصال الرئيسية',
    enabled: true,
    order: 3,
  },
  {
    type: 'recent_engagements',
    title_en: 'Recent Engagements',
    title_ar: 'التعاملات الأخيرة',
    enabled: true,
    order: 4,
  },
  {
    type: 'positions',
    title_en: 'Positions & Talking Points',
    title_ar: 'المواقف ونقاط النقاش',
    enabled: true,
    order: 5,
  },
  {
    type: 'mou_agreements',
    title_en: 'MoU Agreements',
    title_ar: 'مذكرات التفاهم',
    enabled: true,
    order: 6,
  },
  {
    type: 'commitments',
    title_en: 'Commitments & Deliverables',
    title_ar: 'الالتزامات والمخرجات',
    enabled: true,
    order: 7,
  },
  { type: 'timeline', title_en: 'Timeline', title_ar: 'الجدول الزمني', enabled: false, order: 8 },
  {
    type: 'documents',
    title_en: 'Related Documents',
    title_ar: 'المستندات ذات الصلة',
    enabled: false,
    order: 9,
  },
  {
    type: 'relationship_map',
    title_en: 'Relationship Map',
    title_ar: 'خريطة العلاقات',
    enabled: false,
    order: 10,
  },
  {
    type: 'intelligence',
    title_en: 'Intelligence & Signals',
    title_ar: 'المعلومات والإشارات',
    enabled: false,
    order: 11,
  },
]

/**
 * Available topics with labels
 */
export const BRIEFING_TOPICS: Array<{
  value: BriefingBookTopic
  label_en: string
  label_ar: string
}> = [
  { value: 'statistics', label_en: 'Statistics', label_ar: 'الإحصاءات' },
  { value: 'economy', label_en: 'Economy', label_ar: 'الاقتصاد' },
  { value: 'trade', label_en: 'Trade', label_ar: 'التجارة' },
  { value: 'technology', label_en: 'Technology', label_ar: 'التكنولوجيا' },
  { value: 'environment', label_en: 'Environment', label_ar: 'البيئة' },
  { value: 'health', label_en: 'Health', label_ar: 'الصحة' },
  { value: 'education', label_en: 'Education', label_ar: 'التعليم' },
  { value: 'governance', label_en: 'Governance', label_ar: 'الحوكمة' },
  { value: 'cooperation', label_en: 'International Cooperation', label_ar: 'التعاون الدولي' },
  { value: 'other', label_en: 'Other', label_ar: 'أخرى' },
]

/**
 * Hook options for useBriefingBooks
 */
export interface UseBriefingBooksOptions {
  /** Callback on creation success */
  onCreateSuccess?: (response: CreateBriefingBookResponse) => void
  /** Callback on error */
  onError?: (error: Error) => void
  /** Callback on progress update */
  onProgress?: (progress: BriefingBookProgress) => void
}

/**
 * Hook return type for useBriefingBooks
 */
export interface UseBriefingBooksReturn {
  /** List of briefing books */
  briefingBooks: BriefingBook[]
  /** Whether loading */
  isLoading: boolean
  /** Error if any */
  error: Error | null
  /** Create a new briefing book */
  createBriefingBook: (request: CreateBriefingBookRequest) => Promise<CreateBriefingBookResponse>
  /** Delete a briefing book */
  deleteBriefingBook: (id: string) => Promise<void>
  /** Download a briefing book */
  downloadBriefingBook: (id: string) => Promise<void>
  /** Current generation progress */
  progress: BriefingBookProgress | null
  /** Whether generating */
  isGenerating: boolean
  /** Refresh the list */
  refresh: () => void
}
