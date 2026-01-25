/**
 * Dossier Overview Service
 * Feature: Everything about [Dossier] comprehensive view
 *
 * API client for fetching aggregated dossier data including:
 * - Related dossiers (by relationship type)
 * - Documents (positions, MOUs, briefs)
 * - Work items (tasks, commitments, intakes with status breakdown)
 * - Calendar events
 * - Key contacts
 * - Activity timeline
 * - Export capability
 */

import { supabase } from '@/lib/supabase'
import { COLUMNS } from '@/lib/query-columns'
import type {
  DossierOverviewRequest,
  DossierOverviewResponse,
  DossierOverviewCore,
  DossierOverviewStats,
  RelatedDossiersSection,
  RelatedDossier,
  DocumentsSection,
  DossierDocument,
  WorkItemsSection,
  DossierWorkItem,
  CalendarEventsSection,
  DossierCalendarEvent,
  KeyContactsSection,
  DossierKeyContact,
  ActivityTimelineSection,
  DossierExportRequest,
  DossierExportResponse,
  DossierRelationshipType,
  DossierDocumentType,
} from '@/types/dossier-overview.types'
import type { DossierType } from '@/services/dossier-api'
import { fetchUnifiedDossierActivities } from './unified-dossier-activity.service'

// =============================================================================
// API Error
// =============================================================================

export class DossierOverviewAPIError extends Error {
  code: string
  status: number
  details?: string

  constructor(message: string, status: number, code: string, details?: string) {
    super(message)
    this.name = 'DossierOverviewAPIError'
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
// Fetch Core Dossier Info
// =============================================================================

async function fetchDossierCore(dossierId: string): Promise<DossierOverviewCore> {
  const { data, error } = await supabase
    .from('dossiers')
    .select(COLUMNS.DOSSIERS.OVERVIEW)
    .eq('id', dossierId)
    .single()

  if (error) {
    throw new DossierOverviewAPIError(
      'Failed to fetch dossier',
      500,
      'DOSSIER_FETCH_FAILED',
      error.message,
    )
  }

  return {
    id: data.id,
    name_en: data.name_en,
    name_ar: data.name_ar,
    type: data.type as DossierType,
    status: data.status,
    description_en: data.description_en,
    description_ar: data.description_ar,
    sensitivity_level: data.sensitivity_level || 1,
    tags: data.tags || [],
    created_at: data.created_at,
    updated_at: data.updated_at,
    metadata: data.metadata,
  }
}

// =============================================================================
// Fetch Related Dossiers
// =============================================================================

async function fetchRelatedDossiers(dossierId: string): Promise<RelatedDossiersSection> {
  // Fetch outgoing relationships
  const { data: outgoing, error: outError } = await supabase
    .from('dossier_relationships')
    .select(
      `
      id,
      relationship_type,
      effective_from,
      effective_to,
      notes_en,
      notes_ar,
      created_at,
      target_dossier:target_dossier_id(id, name_en, name_ar, type, status)
    `,
    )
    .eq('source_dossier_id', dossierId)

  // Fetch incoming relationships
  const { data: incoming, error: inError } = await supabase
    .from('dossier_relationships')
    .select(
      `
      id,
      relationship_type,
      effective_from,
      effective_to,
      notes_en,
      notes_ar,
      created_at,
      source_dossier:source_dossier_id(id, name_en, name_ar, type, status)
    `,
    )
    .eq('target_dossier_id', dossierId)

  if (outError || inError) {
    console.error('Error fetching relationships:', outError || inError)
  }

  const allRelated: RelatedDossier[] = []

  // Process outgoing
  ;(outgoing || []).forEach((rel: any) => {
    if (rel.target_dossier) {
      allRelated.push({
        id: rel.target_dossier.id,
        name_en: rel.target_dossier.name_en,
        name_ar: rel.target_dossier.name_ar,
        type: rel.target_dossier.type,
        status: rel.target_dossier.status,
        relationship_type: rel.relationship_type as DossierRelationshipType,
        relationship_id: rel.id,
        is_outgoing: true,
        effective_from: rel.effective_from,
        effective_to: rel.effective_to,
        notes_en: rel.notes_en,
        notes_ar: rel.notes_ar,
        created_at: rel.created_at,
      })
    }
  })

  // Process incoming
  ;(incoming || []).forEach((rel: any) => {
    if (rel.source_dossier) {
      allRelated.push({
        id: rel.source_dossier.id,
        name_en: rel.source_dossier.name_en,
        name_ar: rel.source_dossier.name_ar,
        type: rel.source_dossier.type,
        status: rel.source_dossier.status,
        relationship_type: rel.relationship_type as DossierRelationshipType,
        relationship_id: rel.id,
        is_outgoing: false,
        effective_from: rel.effective_from,
        effective_to: rel.effective_to,
        notes_en: rel.notes_en,
        notes_ar: rel.notes_ar,
        created_at: rel.created_at,
      })
    }
  })

  // Group by relationship type
  const byRelationshipType: Record<DossierRelationshipType, RelatedDossier[]> = {
    parent: [],
    child: [],
    bilateral: [],
    member_of: [],
    has_member: [],
    partner: [],
    related_to: [],
    predecessor: [],
    successor: [],
  }

  // Group by dossier type
  const byDossierType: Record<DossierType, RelatedDossier[]> = {
    country: [],
    organization: [],
    forum: [],
    engagement: [],
    topic: [],
    working_group: [],
    person: [],
    elected_official: [],
  }

  allRelated.forEach((rel) => {
    if (byRelationshipType[rel.relationship_type]) {
      byRelationshipType[rel.relationship_type].push(rel)
    }
    if (byDossierType[rel.type]) {
      byDossierType[rel.type].push(rel)
    }
  })

  return {
    total_count: allRelated.length,
    by_relationship_type: byRelationshipType,
    by_dossier_type: byDossierType,
  }
}

// =============================================================================
// Fetch Documents
// =============================================================================

async function fetchDocuments(dossierId: string): Promise<DocumentsSection> {
  // Fetch positions via position_dossier_links junction table
  const { data: positionLinks } = await supabase
    .from('position_dossier_links')
    .select(
      `
      position:position_id(id, title_en, title_ar, status, created_at, updated_at)
    `,
    )
    .eq('dossier_id', dossierId)

  // Extract positions from links
  const positions = (positionLinks || [])
    .map((link: any) => link.position)
    .filter((p: any) => p !== null)

  // Fetch MOUs where this dossier is a signatory
  const { data: mous1 } = await supabase
    .from('mous')
    .select('id, title, status, created_at, updated_at')
    .eq('signatory_1_dossier_id', dossierId)
    .is('deleted_at', null)

  const { data: mous2 } = await supabase
    .from('mous')
    .select('id, title, status, created_at, updated_at')
    .eq('signatory_2_dossier_id', dossierId)
    .is('deleted_at', null)

  // Combine MOUs (avoid duplicates)
  const mouIds = new Set<string>()
  const mous: any[] = []
  ;[...(mous1 || []), ...(mous2 || [])].forEach((m: any) => {
    if (!mouIds.has(m.id)) {
      mouIds.add(m.id)
      mous.push(m)
    }
  })

  // Fetch briefs
  const { data: briefs } = await supabase
    .from('briefs')
    .select('id, content_en, content_ar, generated_by, generated_at, is_template')
    .eq('dossier_id', dossierId)

  // Note: Generic documents/attachments table doesn't exist in expected format
  // Attachments are linked to after_action_records, not directly to dossiers
  const attachments: any[] = []

  const positionDocs: DossierDocument[] = (positions || []).map((p: any) => ({
    id: p.id,
    title_en: p.title_en || 'Untitled Position',
    title_ar: p.title_ar,
    document_type: 'position' as DossierDocumentType,
    file_name: null,
    file_path: null,
    mime_type: null,
    size_bytes: null,
    status: p.status,
    classification: p.classification,
    created_at: p.created_at,
    updated_at: p.updated_at,
    created_by_name: null,
  }))

  const mouDocs: DossierDocument[] = (mous || []).map((m: any) => ({
    id: m.id,
    title_en: m.title || 'Untitled MOU',
    title_ar: m.title, // MOU table uses single 'title' column
    document_type: 'mou' as DossierDocumentType,
    file_name: null,
    file_path: null,
    mime_type: null,
    size_bytes: null,
    status: m.status,
    classification: null,
    created_at: m.created_at,
    updated_at: m.updated_at,
    created_by_name: null,
  }))

  const briefDocs: DossierDocument[] = (briefs || []).map((b: any) => ({
    id: b.id,
    title_en: b.content_en?.summary?.substring(0, 50) || 'Brief',
    title_ar: b.content_ar?.summary?.substring(0, 50) || null,
    document_type: 'brief' as DossierDocumentType,
    file_name: null,
    file_path: null,
    mime_type: null,
    size_bytes: null,
    status: b.is_template ? 'template' : 'active',
    classification: null,
    created_at: b.generated_at,
    updated_at: b.generated_at,
    created_by_name: null,
  }))

  const attachmentDocs: DossierDocument[] = (attachments || []).map((a: any) => ({
    id: a.id,
    title_en: a.file_name,
    title_ar: null,
    document_type: 'attachment' as DossierDocumentType,
    file_name: a.file_name,
    file_path: a.file_path,
    mime_type: a.mime_type,
    size_bytes: a.size_bytes,
    status: 'active',
    classification: a.classification,
    created_at: a.uploaded_at,
    updated_at: a.uploaded_at,
    created_by_name: null,
  }))

  return {
    total_count: positionDocs.length + mouDocs.length + briefDocs.length + attachmentDocs.length,
    positions: positionDocs,
    mous: mouDocs,
    briefs: briefDocs,
    attachments: attachmentDocs,
  }
}

// =============================================================================
// Fetch Work Items
// =============================================================================

async function fetchWorkItems(dossierId: string, limit: number = 50): Promise<WorkItemsSection> {
  // Fetch work item dossier links
  const { data: links } = await supabase
    .from('work_item_dossiers')
    .select('work_item_type, work_item_id, inheritance_source')
    .eq('dossier_id', dossierId)
    .is('deleted_at', null)

  const taskIds: string[] = []
  const commitmentIds: string[] = []
  const intakeIds: string[] = []
  const linkMap: Record<string, string> = {}

  ;(links || []).forEach((link: any) => {
    linkMap[link.work_item_id] = link.inheritance_source
    if (link.work_item_type === 'task') taskIds.push(link.work_item_id)
    else if (link.work_item_type === 'commitment') commitmentIds.push(link.work_item_id)
    else if (link.work_item_type === 'intake') intakeIds.push(link.work_item_id)
  })

  const allWorkItems: DossierWorkItem[] = []
  const now = new Date()

  // Fetch tasks
  if (taskIds.length > 0) {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*, assignee:assignee_id(full_name)')
      .in('id', taskIds)
      .limit(limit)

    ;(tasks || []).forEach((t: any) => {
      const isOverdue =
        t.deadline &&
        new Date(t.deadline) < now &&
        t.status !== 'completed' &&
        t.status !== 'cancelled'
      allWorkItems.push({
        id: t.id,
        source: 'task',
        title_en: t.title_en || t.title,
        title_ar: t.title_ar,
        description_en: t.description_en || t.description,
        description_ar: t.description_ar,
        status: isOverdue ? 'overdue' : t.status,
        priority: t.priority || 'medium',
        deadline: t.deadline,
        assignee_id: t.assignee_id,
        assignee_name: t.assignee?.full_name || null,
        inheritance_source: linkMap[t.id] || 'direct',
        created_at: t.created_at,
        updated_at: t.updated_at,
      })
    })
  }

  // Fetch commitments
  if (commitmentIds.length > 0) {
    const { data: commitments } = await supabase
      .from('commitments')
      .select(COLUMNS.COMMITMENTS.SUMMARY)
      .in('id', commitmentIds)
      .limit(limit)

    ;(commitments || []).forEach((c: any) => {
      const isOverdue =
        c.deadline &&
        new Date(c.deadline) < now &&
        c.status !== 'completed' &&
        c.status !== 'cancelled'
      allWorkItems.push({
        id: c.id,
        source: 'commitment',
        title_en: c.title_en || c.title,
        title_ar: c.title_ar,
        description_en: c.description_en || c.description,
        description_ar: c.description_ar,
        status: isOverdue ? 'overdue' : c.status,
        priority: c.priority || 'medium',
        deadline: c.deadline,
        assignee_id: c.responsible_user_id,
        assignee_name: null,
        inheritance_source: linkMap[c.id] || 'direct',
        created_at: c.created_at,
        updated_at: c.updated_at,
      })
    })
  }

  // Fetch intake tickets
  if (intakeIds.length > 0) {
    const { data: intakes } = await supabase
      .from('intake_tickets')
      .select('*, assigned_to:assigned_to_id(full_name)')
      .in('id', intakeIds)
      .limit(limit)

    ;(intakes || []).forEach((i: any) => {
      const isOverdue =
        i.sla_deadline &&
        new Date(i.sla_deadline) < now &&
        i.status !== 'completed' &&
        i.status !== 'cancelled'
      allWorkItems.push({
        id: i.id,
        source: 'intake',
        title_en: i.subject || i.title_en,
        title_ar: i.title_ar,
        description_en: i.description,
        description_ar: i.description_ar,
        status: isOverdue ? 'overdue' : i.status,
        priority: i.priority || 'medium',
        deadline: i.sla_deadline,
        assignee_id: i.assigned_to_id,
        assignee_name: i.assigned_to?.full_name || null,
        inheritance_source: linkMap[i.id] || 'direct',
        created_at: i.created_at,
        updated_at: i.updated_at,
      })
    })
  }

  // Calculate status breakdown
  const statusBreakdown = {
    pending: allWorkItems.filter((w) => w.status === 'pending').length,
    in_progress: allWorkItems.filter((w) => w.status === 'in_progress').length,
    review: allWorkItems.filter((w) => w.status === 'review').length,
    completed: allWorkItems.filter((w) => w.status === 'completed').length,
    cancelled: allWorkItems.filter((w) => w.status === 'cancelled').length,
    overdue: allWorkItems.filter((w) => w.status === 'overdue').length,
  }

  return {
    total_count: allWorkItems.length,
    status_breakdown: statusBreakdown,
    by_source: {
      tasks: allWorkItems.filter((w) => w.source === 'task'),
      commitments: allWorkItems.filter((w) => w.source === 'commitment'),
      intakes: allWorkItems.filter((w) => w.source === 'intake'),
    },
    urgent_items: allWorkItems.filter((w) => w.priority === 'urgent' || w.priority === 'high'),
    overdue_items: allWorkItems.filter((w) => w.status === 'overdue'),
  }
}

// =============================================================================
// Fetch Calendar Events
// =============================================================================

async function fetchCalendarEvents(
  dossierId: string,
  daysAhead: number = 30,
  daysBehind: number = 7,
): Promise<CalendarEventsSection> {
  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - daysBehind)
  const endDate = new Date(now)
  endDate.setDate(endDate.getDate() + daysAhead)

  const { data: events } = await supabase
    .from('calendar_events')
    .select(COLUMNS.CALENDAR_EVENTS.LIST)
    .eq('dossier_id', dossierId)
    .gte('start_datetime', startDate.toISOString())
    .lte('start_datetime', endDate.toISOString())
    .order('start_datetime', { ascending: true })

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  const allEvents: DossierCalendarEvent[] = (events || []).map((e: any) => ({
    id: e.id,
    title_en: e.title_en || e.title,
    title_ar: e.title_ar,
    event_type: e.event_type || 'meeting',
    start_datetime: e.start_datetime,
    end_datetime: e.end_datetime,
    is_all_day: e.is_all_day || false,
    location_en: e.location_en || e.location,
    location_ar: e.location_ar,
    is_virtual: e.is_virtual || false,
    meeting_link: e.meeting_link,
    description_en: e.description_en || e.description,
    description_ar: e.description_ar,
    created_at: e.created_at,
  }))

  return {
    total_count: allEvents.length,
    upcoming: allEvents.filter((e) => new Date(e.start_datetime) > now),
    past: allEvents.filter((e) => new Date(e.start_datetime) < todayStart),
    today: allEvents.filter((e) => {
      const eventDate = new Date(e.start_datetime)
      return eventDate >= todayStart && eventDate < todayEnd
    }),
  }
}

// =============================================================================
// Fetch Key Contacts
// =============================================================================

async function fetchKeyContacts(dossierId: string): Promise<KeyContactsSection> {
  const { data: contacts } = await supabase
    .from('key_contacts')
    .select(COLUMNS.KEY_CONTACTS.LIST)
    .eq('dossier_id', dossierId)
    .order('name', { ascending: true })

  const allContacts: DossierKeyContact[] = (contacts || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    name_ar: c.name_ar,
    title_en: c.role || c.title_en,
    title_ar: c.title_ar,
    organization_en: c.organization,
    organization_ar: c.organization_ar,
    email: c.email,
    phone: c.phone,
    photo_url: c.photo_url,
    last_interaction_date: c.last_interaction_date,
    notes: c.notes,
    linked_person_dossier_id: c.linked_person_dossier_id,
  }))

  return {
    total_count: allContacts.length,
    contacts: allContacts,
  }
}

// =============================================================================
// Fetch Activity Timeline
// =============================================================================

async function fetchActivityTimeline(
  dossierId: string,
  limit: number = 20,
): Promise<ActivityTimelineSection> {
  try {
    const result = await fetchUnifiedDossierActivities({
      dossier_id: dossierId,
      limit,
    })

    return {
      total_count: result.total_estimate || result.activities.length,
      recent_activities: result.activities,
      has_more: result.has_more,
      next_cursor: result.next_cursor,
    }
  } catch (error) {
    console.error('Error fetching activity timeline:', error)
    return {
      total_count: 0,
      recent_activities: [],
      has_more: false,
      next_cursor: null,
    }
  }
}

// =============================================================================
// Calculate Stats
// =============================================================================

function calculateStats(
  relatedDossiers: RelatedDossiersSection,
  documents: DocumentsSection,
  workItems: WorkItemsSection,
  calendarEvents: CalendarEventsSection,
  keyContacts: KeyContactsSection,
  activityTimeline: ActivityTimelineSection,
): DossierOverviewStats {
  return {
    related_dossiers_count: relatedDossiers.total_count,
    documents_count: documents.total_count,
    work_items_count: workItems.total_count,
    pending_work_items: workItems.status_breakdown.pending + workItems.status_breakdown.in_progress,
    overdue_work_items: workItems.status_breakdown.overdue,
    calendar_events_count: calendarEvents.total_count,
    upcoming_events_count: calendarEvents.upcoming.length,
    key_contacts_count: keyContacts.total_count,
    recent_activities_count: activityTimeline.total_count,
    last_activity_date:
      activityTimeline.recent_activities.length > 0
        ? activityTimeline.recent_activities[0].timestamp
        : null,
  }
}

// =============================================================================
// Main API: Fetch Dossier Overview
// =============================================================================

/**
 * Fetches a comprehensive overview of a dossier including all related data
 */
export async function fetchDossierOverview(
  request: DossierOverviewRequest,
): Promise<DossierOverviewResponse> {
  const {
    dossier_id,
    include_sections = [
      'related_dossiers',
      'documents',
      'work_items',
      'calendar_events',
      'key_contacts',
      'activity_timeline',
    ],
    activity_limit = 20,
    work_items_limit = 50,
    calendar_days_ahead = 30,
    calendar_days_behind = 7,
  } = request

  // Fetch core dossier info
  const dossier = await fetchDossierCore(dossier_id)

  // Fetch sections in parallel
  const [relatedDossiers, documents, workItems, calendarEvents, keyContacts, activityTimeline] =
    await Promise.all([
      include_sections.includes('related_dossiers')
        ? fetchRelatedDossiers(dossier_id)
        : Promise.resolve({
            total_count: 0,
            by_relationship_type: {} as any,
            by_dossier_type: {} as any,
          }),
      include_sections.includes('documents')
        ? fetchDocuments(dossier_id)
        : Promise.resolve({
            total_count: 0,
            positions: [],
            mous: [],
            briefs: [],
            attachments: [],
          }),
      include_sections.includes('work_items')
        ? fetchWorkItems(dossier_id, work_items_limit)
        : Promise.resolve({
            total_count: 0,
            status_breakdown: {
              pending: 0,
              in_progress: 0,
              review: 0,
              completed: 0,
              cancelled: 0,
              overdue: 0,
            },
            by_source: { tasks: [], commitments: [], intakes: [] },
            urgent_items: [],
            overdue_items: [],
          }),
      include_sections.includes('calendar_events')
        ? fetchCalendarEvents(dossier_id, calendar_days_ahead, calendar_days_behind)
        : Promise.resolve({ total_count: 0, upcoming: [], past: [], today: [] }),
      include_sections.includes('key_contacts')
        ? fetchKeyContacts(dossier_id)
        : Promise.resolve({ total_count: 0, contacts: [] }),
      include_sections.includes('activity_timeline')
        ? fetchActivityTimeline(dossier_id, activity_limit)
        : Promise.resolve({
            total_count: 0,
            recent_activities: [],
            has_more: false,
            next_cursor: null,
          }),
    ])

  // Calculate stats
  const stats = calculateStats(
    relatedDossiers,
    documents,
    workItems,
    calendarEvents,
    keyContacts,
    activityTimeline,
  )

  return {
    dossier,
    stats,
    related_dossiers: relatedDossiers,
    documents,
    work_items: workItems,
    calendar_events: calendarEvents,
    key_contacts: keyContacts,
    activity_timeline: activityTimeline,
    generated_at: new Date().toISOString(),
  }
}

// =============================================================================
// Export Dossier
// =============================================================================

/**
 * Exports a dossier profile in the specified format
 */
export async function exportDossierProfile(
  request: DossierExportRequest,
): Promise<DossierExportResponse> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dossier-export`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Export failed' }))
    throw new DossierOverviewAPIError(
      error.message || 'Failed to export dossier',
      response.status,
      'EXPORT_FAILED',
      error.details,
    )
  }

  return response.json()
}

/**
 * Generates a JSON export of the dossier overview (client-side)
 */
export function generateJSONExport(overview: DossierOverviewResponse): string {
  return JSON.stringify(overview, null, 2)
}

/**
 * Downloads the dossier overview as a JSON file
 */
export function downloadJSONExport(overview: DossierOverviewResponse, filename?: string): void {
  const json = generateJSONExport(overview)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `dossier-${overview.dossier.id}-overview.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// =============================================================================
// Query Keys
// =============================================================================

export const dossierOverviewKeys = {
  all: ['dossier-overview'] as const,
  list: () => [...dossierOverviewKeys.all, 'list'] as const,
  detail: (dossierId: string) => [...dossierOverviewKeys.all, 'detail', dossierId] as const,
  export: (dossierId: string) => [...dossierOverviewKeys.all, 'export', dossierId] as const,
}
