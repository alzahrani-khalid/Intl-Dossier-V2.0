/**
 * Citation Tracking Types
 * Feature: citation-tracking
 *
 * Type definitions for citations between dossiers, briefs, and external sources.
 */

// ============================================================================
// Enum Types
// ============================================================================

/**
 * Types of sources that can be cited
 */
export type CitationSourceType =
  | 'dossier'
  | 'brief'
  | 'ai_brief'
  | 'document'
  | 'position'
  | 'mou'
  | 'engagement'
  | 'external_url'
  | 'external_document'
  | 'academic_paper'
  | 'news_article'
  | 'government_doc'
  | 'report'

/**
 * Citation status indicating validity
 */
export type CitationStatus =
  | 'active'
  | 'source_updated'
  | 'source_archived'
  | 'source_deleted'
  | 'broken'

/**
 * How the citation was detected/created
 */
export type CitationDetectionMethod = 'manual' | 'ai_detected' | 'auto_link' | 'import'

/**
 * Alert types for citation changes
 */
export type CitationAlertType =
  | 'source_updated'
  | 'source_archived'
  | 'source_deleted'
  | 'link_broken'
  | 'new_version'

// ============================================================================
// Entity Types
// ============================================================================

/**
 * Citation location information
 */
export interface CitationLocation {
  page?: number
  section?: string
  paragraph?: number
  line?: number
  start_offset?: number
  end_offset?: number
}

/**
 * External source metadata
 */
export interface ExternalSourceMetadata {
  publisher?: string
  journal?: string
  volume?: string
  issue?: string
  pages?: string
  isbn?: string
  issn?: string
  doi?: string
  abstract?: string
  keywords?: string[]
  language?: string
  [key: string]: unknown
}

/**
 * Full citation entity
 */
export interface Citation {
  id: string
  organization_id?: string

  // Citing entity (source of the citation)
  citing_entity_type: CitationSourceType
  citing_entity_id: string

  // Cited entity (the reference)
  cited_entity_type: CitationSourceType
  cited_entity_id?: string

  // External source details
  external_url?: string
  external_title?: string
  external_author?: string
  external_publication_date?: string
  external_accessed_date?: string
  external_metadata?: ExternalSourceMetadata

  // Citation context
  citation_context?: string
  citation_location?: CitationLocation
  citation_note?: string

  // Scores
  relevance_score?: number
  confidence_score?: number

  // Status
  status: CitationStatus
  detection_method: CitationDetectionMethod

  // Version tracking
  cited_version_at?: string
  cited_version_hash?: string
  last_verified_at?: string

  // Audit
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * Citation with resolved entity names (for display)
 */
export interface CitationWithNames extends Citation {
  citing_entity_name?: string
  citing_entity_name_ar?: string
  cited_entity_name?: string
  cited_entity_name_ar?: string
}

/**
 * Citation alert
 */
export interface CitationAlert {
  id: string
  organization_id?: string
  citation_id: string
  alert_type: CitationAlertType
  message: string
  message_ar?: string
  old_value?: Record<string, unknown>
  new_value?: Record<string, unknown>
  change_summary?: string
  affected_users?: string[]
  is_read: boolean
  is_resolved: boolean
  resolved_by?: string
  resolved_at?: string
  resolution_note?: string
  created_at: string

  // Joined citation info
  citation?: {
    citing_entity_type: CitationSourceType
    citing_entity_id: string
    cited_entity_type: CitationSourceType
    cited_entity_id?: string
    external_title?: string
  }
}

// ============================================================================
// Network Graph Types
// ============================================================================

/**
 * Node in citation network graph
 */
export interface CitationNetworkNode {
  id: string
  type: CitationSourceType
  name: string
  name_ar?: string
  depth: number
}

/**
 * Edge in citation network graph
 */
export interface CitationNetworkEdge {
  id: string
  source: string
  target: string
  source_type: CitationSourceType
  target_type: CitationSourceType
  relevance_score?: number
}

/**
 * Citation network graph data
 */
export interface CitationNetworkGraph {
  nodes: CitationNetworkNode[]
  edges: CitationNetworkEdge[]
  start_node: string
  depth: number
  total_nodes: number
}

// ============================================================================
// API Request Types
// ============================================================================

/**
 * Input for creating a new citation
 */
export interface CitationCreate {
  citing_entity_type: CitationSourceType
  citing_entity_id: string
  cited_entity_type: CitationSourceType
  cited_entity_id?: string
  external_url?: string
  external_title?: string
  external_author?: string
  external_publication_date?: string
  external_metadata?: ExternalSourceMetadata
  citation_context?: string
  citation_location?: CitationLocation
  citation_note?: string
  relevance_score?: number
  detection_method?: CitationDetectionMethod
}

/**
 * Input for updating a citation
 */
export interface CitationUpdate {
  citation_context?: string
  citation_location?: CitationLocation
  citation_note?: string
  relevance_score?: number
  status?: CitationStatus
  external_title?: string
  external_author?: string
  external_metadata?: ExternalSourceMetadata
}

/**
 * Parameters for listing citations
 */
export interface CitationListParams {
  citing_type?: CitationSourceType
  citing_id?: string
  cited_type?: CitationSourceType
  cited_id?: string
  status?: CitationStatus
  limit?: number
  offset?: number
}

/**
 * Parameters for getting entity citations
 */
export interface EntityCitationsParams {
  entity_type: CitationSourceType
  entity_id: string
  direction?: 'outgoing' | 'incoming' | 'both'
  include_external?: boolean
  limit?: number
}

/**
 * Parameters for citation network graph
 */
export interface CitationNetworkParams {
  entity_type: CitationSourceType
  entity_id: string
  depth?: number
  max_nodes?: number
}

/**
 * Parameters for detecting citations in text
 */
export interface DetectCitationsParams {
  text: string
  citing_entity_type?: CitationSourceType
  citing_entity_id?: string
  auto_create?: boolean
}

/**
 * Alert list parameters
 */
export interface CitationAlertListParams {
  unread_only?: boolean
  unresolved_only?: boolean
  limit?: number
  offset?: number
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Paginated citation list response
 */
export interface CitationListResponse {
  data: Citation[]
  pagination: {
    limit: number
    offset: number
    has_more: boolean
  }
}

/**
 * Entity citations response (from RPC function)
 */
export interface EntityCitation {
  citation_id: string
  direction: 'outgoing' | 'incoming'
  related_entity_type: CitationSourceType
  related_entity_id?: string
  related_entity_name?: string
  external_url?: string
  external_title?: string
  status: CitationStatus
  relevance_score?: number
  detection_method: CitationDetectionMethod
  citation_context?: string
  created_at: string
}

/**
 * Detected citation from auto-detection
 */
export interface DetectedCitation {
  type: CitationSourceType
  url?: string
  title?: string
}

/**
 * Detection response
 */
export interface CitationDetectionResponse {
  detected: DetectedCitation[]
  created?: Citation[]
}

/**
 * Alert list response
 */
export interface CitationAlertListResponse {
  data: CitationAlert[]
  pagination: {
    limit: number
    offset: number
    has_more: boolean
  }
}

// ============================================================================
// Helper Constants
// ============================================================================

/**
 * Internal source types (references to system entities)
 */
export const INTERNAL_SOURCE_TYPES: CitationSourceType[] = [
  'dossier',
  'brief',
  'ai_brief',
  'document',
  'position',
  'mou',
  'engagement',
]

/**
 * External source types (references outside the system)
 */
export const EXTERNAL_SOURCE_TYPES: CitationSourceType[] = [
  'external_url',
  'external_document',
  'academic_paper',
  'news_article',
  'government_doc',
  'report',
]

/**
 * All valid source types
 */
export const ALL_SOURCE_TYPES: CitationSourceType[] = [
  ...INTERNAL_SOURCE_TYPES,
  ...EXTERNAL_SOURCE_TYPES,
]

/**
 * Labels for citation source types
 */
export const CITATION_SOURCE_TYPE_LABELS: Record<CitationSourceType, { en: string; ar: string }> = {
  dossier: { en: 'Dossier', ar: 'ملف' },
  brief: { en: 'Brief', ar: 'موجز' },
  ai_brief: { en: 'AI Brief', ar: 'موجز ذكاء اصطناعي' },
  document: { en: 'Document', ar: 'مستند' },
  position: { en: 'Position', ar: 'موقف' },
  mou: { en: 'MOU', ar: 'مذكرة تفاهم' },
  engagement: { en: 'Engagement', ar: 'ارتباط' },
  external_url: { en: 'External Link', ar: 'رابط خارجي' },
  external_document: { en: 'External Document', ar: 'مستند خارجي' },
  academic_paper: { en: 'Academic Paper', ar: 'ورقة أكاديمية' },
  news_article: { en: 'News Article', ar: 'مقال إخباري' },
  government_doc: { en: 'Government Document', ar: 'مستند حكومي' },
  report: { en: 'Report', ar: 'تقرير' },
}

/**
 * Labels for citation status
 */
export const CITATION_STATUS_LABELS: Record<CitationStatus, { en: string; ar: string }> = {
  active: { en: 'Active', ar: 'نشط' },
  source_updated: { en: 'Source Updated', ar: 'المصدر محدث' },
  source_archived: { en: 'Source Archived', ar: 'المصدر مؤرشف' },
  source_deleted: { en: 'Source Deleted', ar: 'المصدر محذوف' },
  broken: { en: 'Broken Link', ar: 'رابط معطل' },
}

/**
 * Labels for alert types
 */
export const CITATION_ALERT_TYPE_LABELS: Record<CitationAlertType, { en: string; ar: string }> = {
  source_updated: { en: 'Source Updated', ar: 'تم تحديث المصدر' },
  source_archived: { en: 'Source Archived', ar: 'تم أرشفة المصدر' },
  source_deleted: { en: 'Source Deleted', ar: 'تم حذف المصدر' },
  link_broken: { en: 'Link Broken', ar: 'الرابط معطل' },
  new_version: { en: 'New Version Available', ar: 'إصدار جديد متاح' },
}

/**
 * Check if source type is internal
 */
export function isInternalSourceType(type: CitationSourceType): boolean {
  return INTERNAL_SOURCE_TYPES.includes(type)
}

/**
 * Check if source type is external
 */
export function isExternalSourceType(type: CitationSourceType): boolean {
  return EXTERNAL_SOURCE_TYPES.includes(type)
}

/**
 * Get status color class for styling
 */
export function getCitationStatusColor(status: CitationStatus): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'source_updated':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'source_archived':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    case 'source_deleted':
    case 'broken':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

/**
 * Get icon name for source type
 */
export function getCitationSourceIcon(type: CitationSourceType): string {
  switch (type) {
    case 'dossier':
      return 'FolderOpen'
    case 'brief':
    case 'ai_brief':
      return 'FileText'
    case 'document':
      return 'File'
    case 'position':
      return 'MessageSquare'
    case 'mou':
      return 'FileCheck'
    case 'engagement':
      return 'Calendar'
    case 'external_url':
      return 'ExternalLink'
    case 'external_document':
      return 'FileArchive'
    case 'academic_paper':
      return 'GraduationCap'
    case 'news_article':
      return 'Newspaper'
    case 'government_doc':
      return 'Building'
    case 'report':
      return 'BarChart'
    default:
      return 'Link'
  }
}
