/**
 * Dossier Overview Types
 * Feature: Everything about [Dossier] comprehensive view
 *
 * Type definitions for the aggregated dossier overview that combines
 * all connections: relationships, documents, work items, calendar events,
 * key contacts, and activity timeline.
 */

import type { DossierType, DossierStatus } from '@/services/dossier-api'
import type { UnifiedActivity, UnifiedActivityType } from './unified-dossier-activity.types'

// =============================================
// CORE DOSSIER INFO
// =============================================

/**
 * Core dossier information for the overview
 */
export interface DossierOverviewCore {
  id: string
  name_en: string
  name_ar: string
  type: DossierType
  status: DossierStatus
  description_en: string | null
  description_ar: string | null
  sensitivity_level: number
  tags: string[]
  created_at: string
  updated_at: string
  metadata: Record<string, unknown> | null
}

// =============================================
// RELATED DOSSIERS
// =============================================

/**
 * Relationship types between dossiers
 */
export type DossierRelationshipType =
  | 'parent'
  | 'child'
  | 'bilateral'
  | 'member_of'
  | 'has_member'
  | 'partner'
  | 'related_to'
  | 'predecessor'
  | 'successor'

/**
 * A related dossier with relationship metadata
 */
export interface RelatedDossier {
  id: string
  name_en: string
  name_ar: string
  type: DossierType
  status: DossierStatus
  relationship_type: DossierRelationshipType
  relationship_id: string
  is_outgoing: boolean
  effective_from: string | null
  effective_to: string | null
  notes_en: string | null
  notes_ar: string | null
  created_at: string
}

/**
 * Related dossiers grouped by relationship type
 */
export interface RelatedDossiersSection {
  total_count: number
  by_relationship_type: Record<DossierRelationshipType, RelatedDossier[]>
  by_dossier_type: Record<DossierType, RelatedDossier[]>
}

// =============================================
// DOCUMENTS
// =============================================

/**
 * Document types linked to dossiers
 */
export type DossierDocumentType = 'position' | 'mou' | 'brief' | 'attachment'

/**
 * A document linked to the dossier
 */
export interface DossierDocument {
  id: string
  title_en: string
  title_ar: string | null
  document_type: DossierDocumentType
  file_name: string | null
  file_path: string | null
  mime_type: string | null
  size_bytes: number | null
  status: string
  classification: string | null
  created_at: string
  updated_at: string
  created_by_name: string | null
}

/**
 * Documents section with categorization
 */
export interface DocumentsSection {
  total_count: number
  positions: DossierDocument[]
  mous: DossierDocument[]
  briefs: DossierDocument[]
  attachments: DossierDocument[]
}

// =============================================
// WORK ITEMS
// =============================================

/**
 * Work item source types
 */
export type WorkItemSource = 'task' | 'commitment' | 'intake'

/**
 * Work item status
 */
export type WorkItemStatus =
  | 'pending'
  | 'in_progress'
  | 'review'
  | 'completed'
  | 'cancelled'
  | 'overdue'

/**
 * Work item priority
 */
export type WorkItemPriority = 'low' | 'medium' | 'high' | 'urgent'

/**
 * A work item linked to the dossier
 */
export interface DossierWorkItem {
  id: string
  source: WorkItemSource
  title_en: string
  title_ar: string | null
  description_en: string | null
  description_ar: string | null
  status: WorkItemStatus
  priority: WorkItemPriority
  deadline: string | null
  assignee_id: string | null
  assignee_name: string | null
  inheritance_source: string
  created_at: string
  updated_at: string
}

/**
 * Work items status breakdown
 */
export interface WorkItemsStatusBreakdown {
  pending: number
  in_progress: number
  review: number
  completed: number
  cancelled: number
  overdue: number
}

/**
 * Work items section with categorization
 */
export interface WorkItemsSection {
  total_count: number
  status_breakdown: WorkItemsStatusBreakdown
  by_source: {
    tasks: DossierWorkItem[]
    commitments: DossierWorkItem[]
    intakes: DossierWorkItem[]
  }
  urgent_items: DossierWorkItem[]
  overdue_items: DossierWorkItem[]
}

// =============================================
// CALENDAR EVENTS
// =============================================

/**
 * Calendar event types
 */
export type CalendarEventType =
  | 'meeting'
  | 'deadline'
  | 'milestone'
  | 'reminder'
  | 'engagement'
  | 'review'

/**
 * A calendar event linked to the dossier
 */
export interface DossierCalendarEvent {
  id: string
  title_en: string
  title_ar: string | null
  event_type: CalendarEventType
  start_datetime: string
  end_datetime: string | null
  is_all_day: boolean
  location_en: string | null
  location_ar: string | null
  is_virtual: boolean
  meeting_link: string | null
  description_en: string | null
  description_ar: string | null
  created_at: string
}

/**
 * Calendar events section
 */
export interface CalendarEventsSection {
  total_count: number
  upcoming: DossierCalendarEvent[]
  past: DossierCalendarEvent[]
  today: DossierCalendarEvent[]
}

// =============================================
// KEY CONTACTS
// =============================================

/**
 * A key contact for the dossier
 */
export interface DossierKeyContact {
  id: string
  name: string
  name_ar: string | null
  title_en: string | null
  title_ar: string | null
  organization_en: string | null
  organization_ar: string | null
  email: string | null
  phone: string | null
  photo_url: string | null
  last_interaction_date: string | null
  notes: string | null
  linked_person_dossier_id: string | null
}

/**
 * Key contacts section
 */
export interface KeyContactsSection {
  total_count: number
  contacts: DossierKeyContact[]
}

// =============================================
// ACTIVITY TIMELINE
// =============================================

/**
 * Activity timeline section
 */
export interface ActivityTimelineSection {
  total_count: number
  recent_activities: UnifiedActivity[]
  has_more: boolean
  next_cursor: string | null
}

// =============================================
// STATISTICS
// =============================================

/**
 * Quick statistics for the dossier
 */
export interface DossierOverviewStats {
  related_dossiers_count: number
  documents_count: number
  work_items_count: number
  pending_work_items: number
  overdue_work_items: number
  calendar_events_count: number
  upcoming_events_count: number
  key_contacts_count: number
  recent_activities_count: number
  last_activity_date: string | null
}

// =============================================
// FULL OVERVIEW RESPONSE
// =============================================

/**
 * Complete dossier overview response
 */
export interface DossierOverviewResponse {
  dossier: DossierOverviewCore
  stats: DossierOverviewStats
  related_dossiers: RelatedDossiersSection
  documents: DocumentsSection
  work_items: WorkItemsSection
  calendar_events: CalendarEventsSection
  key_contacts: KeyContactsSection
  activity_timeline: ActivityTimelineSection
  generated_at: string
}

// =============================================
// API REQUEST
// =============================================

/**
 * Request parameters for dossier overview
 */
export interface DossierOverviewRequest {
  dossier_id: string
  include_sections?: DossierOverviewSection[]
  activity_limit?: number
  work_items_limit?: number
  calendar_days_ahead?: number
  calendar_days_behind?: number
}

/**
 * Sections that can be included/excluded
 */
export type DossierOverviewSection =
  | 'related_dossiers'
  | 'documents'
  | 'work_items'
  | 'calendar_events'
  | 'key_contacts'
  | 'activity_timeline'

// =============================================
// EXPORT TYPES
// =============================================

/**
 * Export format options
 */
export type ExportFormat = 'pdf' | 'docx' | 'json'

/**
 * Export request
 */
export interface DossierExportRequest {
  dossier_id: string
  format: ExportFormat
  include_sections: DossierOverviewSection[]
  include_attachments?: boolean
  language?: 'en' | 'ar' | 'both'
}

/**
 * Export response
 */
export interface DossierExportResponse {
  download_url: string
  file_name: string
  file_size: number
  expires_at: string
}

// =============================================
// COMPONENT PROPS
// =============================================

/**
 * Props for the DossierOverview component
 */
export interface DossierOverviewProps {
  dossierId: string
  className?: string
  onExport?: (format: ExportFormat) => void
  showExportButton?: boolean
}

/**
 * Props for section components
 */
export interface OverviewSectionProps {
  isLoading?: boolean
  isRTL?: boolean
  className?: string
  onViewAll?: () => void
}

export interface RelatedDossiersSectionProps extends OverviewSectionProps {
  data: RelatedDossiersSection | null
}

export interface DocumentsSectionProps extends OverviewSectionProps {
  data: DocumentsSection | null
  dossierId: string
}

export interface WorkItemsSectionProps extends OverviewSectionProps {
  data: WorkItemsSection | null
  dossierId: string
}

export interface CalendarEventsSectionProps extends OverviewSectionProps {
  data: CalendarEventsSection | null
}

export interface KeyContactsSectionProps extends OverviewSectionProps {
  data: KeyContactsSection | null
}

export interface ActivityTimelineSectionProps extends OverviewSectionProps {
  data: ActivityTimelineSection | null
  dossierId: string
  onLoadMore?: () => void
}

// =============================================
// HOOK RETURN TYPES
// =============================================

/**
 * Return type for useDossierOverview hook
 */
export interface UseDossierOverviewReturn {
  data: DossierOverviewResponse | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Return type for useDossierExport hook
 */
export interface UseDossierExportReturn {
  exportDossier: (request: DossierExportRequest) => Promise<DossierExportResponse>
  isExporting: boolean
  exportError: Error | null
}
