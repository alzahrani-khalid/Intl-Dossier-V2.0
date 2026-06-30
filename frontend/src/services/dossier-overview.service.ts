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
  OrganizationProfileSection,
  OrganizationFocalPoint,
  DossierExportRequest,
  DossierExportResponse,
  DossierRelationshipType,
  DossierDocumentType,
  WorkItemStatus,
  WorkItemPriority,
} from '@/types/dossier-overview.types'
import type { DossierType, DossierStatus } from '@/services/dossier-api'
import { fetchUnifiedDossierActivities } from './unified-dossier-activity.service'

// =============================================================================
// Raw Supabase Response Types (for type safety)
// =============================================================================

/**
 * Target dossier data from relationship join
 */
interface RelationshipTargetDossier {
  id: string
  name_en: string
  name_ar: string
  type: DossierType
  status: DossierStatus
}

/**
 * Source dossier data from relationship join
 */
interface RelationshipSourceDossier {
  id: string
  name_en: string
  name_ar: string
  type: DossierType
  status: DossierStatus
}

/**
 * Raw outgoing relationship row from Supabase
 */
interface OutgoingRelationshipRow {
  id: string
  relationship_type: string
  effective_from: string | null
  effective_to: string | null
  notes_en: string | null
  notes_ar: string | null
  created_at: string
  target_dossier: RelationshipTargetDossier | null
}

/**
 * Raw incoming relationship row from Supabase
 */
interface IncomingRelationshipRow {
  id: string
  relationship_type: string
  effective_from: string | null
  effective_to: string | null
  notes_en: string | null
  notes_ar: string | null
  created_at: string
  source_dossier: RelationshipSourceDossier | null
}

/**
 * Position link row from Supabase
 */
interface PositionLinkRow {
  position: {
    id: string
    title_en: string
    title_ar: string | null
    status: string
    created_at: string
    updated_at: string
  } | null
}

/**
 * MOU row from Supabase
 */
interface MOURow {
  id: string
  title: string
  title_ar: string | null
  lifecycle_state: string
  created_at: string
  updated_at: string
}

/**
 * Brief row from Supabase
 */
interface BriefRow {
  id: string
  content_en: { summary?: string } | null
  content_ar: { summary?: string } | null
  generated_by: string | null
  generated_at: string
  is_template: boolean
}

/**
 * Work item dossier link row from Supabase
 */
interface WorkItemDossierLinkRow {
  work_item_type: 'task' | 'commitment' | 'intake'
  work_item_id: string
  inheritance_source: string
}

/**
 * Task row from Supabase
 */
interface TaskRow {
  id: string
  title_en?: string
  title?: string
  title_ar?: string
  description_en?: string
  description?: string
  description_ar?: string
  status: string
  priority: string | null
  sla_deadline: string | null
  assignee_id: string | null
  created_at: string
  updated_at: string
}

/**
 * Minimal user row for the batched assignee-name lookup
 */
interface AssigneeUserRow {
  id: string
  full_name: string | null
}

/**
 * Commitment row from Supabase
 */
interface CommitmentRow {
  id: string
  title_en?: string
  title?: string
  title_ar?: string
  description_en?: string
  description?: string
  description_ar?: string
  status: string
  priority: string | null
  deadline?: string | null
  due_date?: string | null
  responsible_user_id?: string | null
  owner_user_id?: string | null
  created_at: string
  updated_at: string
}

/**
 * Intake ticket row from Supabase
 */
interface IntakeTicketRow {
  id: string
  subject?: string
  title_en?: string
  title_ar?: string
  description: string | null
  description_ar?: string
  status: string
  priority: string | null
  sla_deadline: string | null
  assigned_to_id: string | null
  assigned_to: { full_name: string } | null
  created_at: string
  updated_at: string
}

/**
 * Calendar entry row from Supabase — calendar_entries is the canonical
 * operational calendar (calendar_events is a separate, empty forum-agenda
 * model; verified vs staging 2026-06-10). Dates split into event_date +
 * event_time; a local start_datetime is synthesized at mapping time.
 */
interface CalendarEntryRow {
  id: string
  title_en: string | null
  title_ar: string | null
  entry_type: string | null
  event_date: string
  event_time: string | null
  all_day: boolean | null
  location: string | null
  is_virtual: boolean | null
  meeting_link: string | null
  description_en: string | null
  description_ar: string | null
  created_at: string
}

/**
 * Key contact row from Supabase — live key_contacts is monolingual and has no
 * photo/person-link columns (verified vs staging 2026-06-10)
 */
interface KeyContactRow {
  id: string
  name: string
  role: string | null
  organization: string | null
  email: string | null
  phone: string | null
  last_interaction_date: string | null
  notes: string | null
}

/**
 * Raw focal-point officer shape stored inside the gastat_focal_points jsonb —
 * all sub-fields optional (free-form import data may omit any of them).
 */
interface FocalPointRaw {
  name_en?: string | null
  name_ar?: string | null
  user_id?: string | null
}

/**
 * Raw organizations extension row for the membership & representation profile.
 * gastat_focal_points is free-form jsonb keyed by role.
 */
interface OrganizationProfileRow {
  membership_type: string | null
  importance: string | null
  representation_level: string | null
  gastat_focal_points: {
    responsible?: FocalPointRaw | null
    alternate?: FocalPointRaw | null
    support?: FocalPointRaw | null
  } | null
}

// =============================================================================
// API Error
// =============================================================================

/**
 * OVRERR-01 contract: fail-the-query. Every section fetcher throws
 * DossierOverviewAPIError on a PostgREST/edge error; Promise.all rejects the
 * section-variant query; cards render role="alert" error lines from isError.
 * Status 500 by default — transient errors keep the global 3x retry
 * (lib/query-client.ts). The optional schema-error→400 fast-fail mapping is
 * intentionally NOT implemented (keep simple); details carry PostgREST messages
 * for console/debug only and are never rendered in the UI.
 */
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
    const cause = outError ?? inError
    throw new DossierOverviewAPIError(
      'Failed to fetch related dossiers',
      500,
      'RELATED_DOSSIERS_FETCH_FAILED',
      cause?.message,
    )
  }

  const allRelated: RelatedDossier[] = []

  // Process outgoing
  // Supabase joins may return arrays; normalize to single objects
  ;((outgoing || []) as unknown as OutgoingRelationshipRow[]).forEach((rel) => {
    const targetRaw = rel.target_dossier as unknown
    const target = (
      Array.isArray(targetRaw) ? targetRaw[0] : targetRaw
    ) as RelationshipTargetDossier | null
    if (target) {
      allRelated.push({
        id: target.id,
        name_en: target.name_en,
        name_ar: target.name_ar,
        type: target.type,
        status: target.status,
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
  // Supabase joins may return arrays; normalize to single objects
  ;((incoming || []) as unknown as IncomingRelationshipRow[]).forEach((rel) => {
    const sourceRaw = rel.source_dossier as unknown
    const source = (
      Array.isArray(sourceRaw) ? sourceRaw[0] : sourceRaw
    ) as RelationshipSourceDossier | null
    if (source) {
      allRelated.push({
        id: source.id,
        name_en: source.name_en,
        name_ar: source.name_ar,
        type: source.type,
        status: source.status,
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
  const { data: positionLinks, error: positionLinksError } = await supabase
    .from('position_dossier_links')
    .select(
      `
      position:positions(id, title_en, title_ar, status, created_at, updated_at)
    `,
    )
    .eq('dossier_id', dossierId)

  if (positionLinksError) {
    throw new DossierOverviewAPIError(
      'Failed to fetch documents',
      500,
      'DOCUMENTS_FETCH_FAILED',
      positionLinksError.message,
    )
  }

  // Extract positions from links (Supabase joins may return arrays)
  const positions = ((positionLinks || []) as unknown as PositionLinkRow[])
    .map((link) => {
      const posRaw = link.position as unknown
      return (Array.isArray(posRaw) ? posRaw[0] : posRaw) as PositionLinkRow['position']
    })
    .filter((p): p is NonNullable<PositionLinkRow['position']> => p !== null)

  // Fetch MOUs where this dossier is a signatory.
  // The `mous` table has no `status` column — lifecycle is `lifecycle_state`
  // (enum mou_state). Selecting a nonexistent column makes PostgREST return an
  // error, which was previously swallowed (MoUs silently dropped from Documents).
  const { data: mous1, error: mous1Error } = await supabase
    .from('mous')
    .select('id, title, title_ar, lifecycle_state, created_at, updated_at')
    .eq('signatory_1_dossier_id', dossierId)
    .is('deleted_at', null)

  const { data: mous2, error: mous2Error } = await supabase
    .from('mous')
    .select('id, title, title_ar, lifecycle_state, created_at, updated_at')
    .eq('signatory_2_dossier_id', dossierId)
    .is('deleted_at', null)

  if (mous1Error || mous2Error) {
    const cause = mous1Error ?? mous2Error
    throw new DossierOverviewAPIError(
      'Failed to fetch documents',
      500,
      'DOCUMENTS_FETCH_FAILED',
      cause?.message,
    )
  }

  // Combine MOUs (avoid duplicates)
  const mouIds = new Set<string>()
  const mous: MOURow[] = []
  ;[...((mous1 || []) as MOURow[]), ...((mous2 || []) as MOURow[])].forEach((m) => {
    if (!mouIds.has(m.id)) {
      mouIds.add(m.id)
      mous.push(m)
    }
  })

  // Briefs sub-fetch removed: live briefs table has NO dossier_id column (links
  // via country_id/organization_id/engagement_dossier_id) and none of the
  // selected columns (content_en/ar, generated_by/at, is_template) exist, so
  // this select 42703'd on every dossier and was swallowed into an empty group
  // (verified vs staging 2026-06-10, round-11 UAT). Restore once a real
  // dossier→brief contract exists.
  const briefs: BriefRow[] = []

  // Note: Generic documents/attachments table doesn't exist in expected format
  // Attachments are linked to after_action_records, not directly to dossiers
  const attachments: DossierDocument[] = []

  const positionDocs: DossierDocument[] = positions.map((p) => ({
    id: p.id,
    title_en: p.title_en || 'Untitled Position',
    title_ar: p.title_ar,
    document_type: 'position' as DossierDocumentType,
    file_name: null,
    file_path: null,
    mime_type: null,
    size_bytes: null,
    status: p.status,
    // positions has no classification column (verified vs database.types.ts)
    classification: null,
    created_at: p.created_at,
    updated_at: p.updated_at,
    created_by_name: null,
  }))

  const mouDocs: DossierDocument[] = mous.map((m) => ({
    id: m.id,
    title_en: m.title || 'Untitled MOU',
    title_ar: m.title_ar ?? m.title,
    document_type: 'mou' as DossierDocumentType,
    file_name: null,
    file_path: null,
    mime_type: null,
    size_bytes: null,
    status: m.lifecycle_state,
    classification: null,
    created_at: m.created_at,
    updated_at: m.updated_at,
    created_by_name: null,
  }))

  const briefDocs: DossierDocument[] = briefs.map((b) => ({
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

  // attachments is already typed as DossierDocument[], no mapping needed
  const attachmentDocs: DossierDocument[] = attachments

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

// intake_tickets.priority is the wider priority_level enum whose deprecated
// values (critical/normal) predate the 20251203000001 normalization migration
const normalizeWorkItemPriority = (priority: string | null | undefined): WorkItemPriority => {
  if (priority === 'critical') return 'urgent'
  if (priority === 'normal') return 'medium'
  if (priority === 'low' || priority === 'medium' || priority === 'high' || priority === 'urgent') {
    return priority
  }
  return 'medium'
}

async function fetchWorkItems(dossierId: string, limit: number = 50): Promise<WorkItemsSection> {
  // Fetch work item dossier links
  const { data: links, error: linksError } = await supabase
    .from('work_item_dossiers')
    .select('work_item_type, work_item_id, inheritance_source')
    .eq('dossier_id', dossierId)
    .is('deleted_at', null)

  if (linksError) {
    throw new DossierOverviewAPIError(
      'Failed to fetch work items',
      500,
      'WORK_ITEMS_FETCH_FAILED',
      linksError.message,
    )
  }

  const taskIds: string[] = []
  const commitmentIds: string[] = []
  const intakeIds: string[] = []
  const linkMap: Record<string, string> = {}

  ;((links || []) as WorkItemDossierLinkRow[]).forEach((link) => {
    linkMap[link.work_item_id] = link.inheritance_source
    if (link.work_item_type === 'task') taskIds.push(link.work_item_id)
    else if (link.work_item_type === 'commitment') commitmentIds.push(link.work_item_id)
    else if (link.work_item_type === 'intake') intakeIds.push(link.work_item_id)
  })

  const allWorkItems: DossierWorkItem[] = []
  const now = new Date()

  // Fetch tasks. tasks.assignee_id does NOT FK to a table exposing full_name, so
  // an embed (assignee:assignee_id(full_name)) returns a PostgREST 400 and every
  // task is silently dropped. Fetch plain rows, then resolve assignee names via a
  // batched public.users lookup (the RLS-permitted pattern used in tasks-api.ts).
  if (taskIds.length > 0) {
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .in('id', taskIds)
      .limit(limit)

    if (tasksError) {
      throw new DossierOverviewAPIError(
        'Failed to fetch work items',
        500,
        'WORK_ITEMS_FETCH_FAILED',
        tasksError.message,
      )
    }

    const taskRows = (tasks || []) as TaskRow[]

    const assigneeIds = Array.from(
      new Set(taskRows.map((t) => t.assignee_id).filter((id): id is string => id != null)),
    )

    const assigneeNameById = new Map<string, string | null>()
    if (assigneeIds.length > 0) {
      const { data: assignees, error: assigneesError } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', assigneeIds)

      if (assigneesError) {
        throw new DossierOverviewAPIError(
          'Failed to fetch work items',
          500,
          'WORK_ITEMS_FETCH_FAILED',
          assigneesError.message,
        )
      }

      ;((assignees || []) as AssigneeUserRow[]).forEach((u) => {
        assigneeNameById.set(u.id, u.full_name)
      })
    }

    taskRows.forEach((t) => {
      const isOverdue =
        t.sla_deadline &&
        new Date(t.sla_deadline) < now &&
        t.status !== 'completed' &&
        t.status !== 'cancelled'
      allWorkItems.push({
        id: t.id,
        source: 'task',
        title_en: t.title_en || t.title || '',
        title_ar: t.title_ar || null,
        description_en: t.description_en || t.description || null,
        description_ar: t.description_ar || null,
        status: isOverdue ? 'overdue' : (t.status as WorkItemStatus),
        priority: normalizeWorkItemPriority(t.priority),
        deadline: t.sla_deadline,
        assignee_id: t.assignee_id,
        assignee_name: t.assignee_id != null ? (assigneeNameById.get(t.assignee_id) ?? null) : null,
        inheritance_source: linkMap[t.id] || 'direct',
        created_at: t.created_at,
        updated_at: t.updated_at,
      })
    })
  }

  // Fetch commitments. aa_commitments is the canonical commitments table; some
  // legacy rows are linked through work_item_dossiers, while seeded drawer
  // fixtures are linked directly by dossier_id.
  const commitmentsById = new Map<string, CommitmentRow>()
  const addCommitments = (rows: CommitmentRow[] | null | undefined): void => {
    ;(rows || []).forEach((row) => commitmentsById.set(row.id, row))
  }

  const { data: directCommitments, error: directCommitmentsError } = await supabase
    .from('aa_commitments')
    .select(COLUMNS.COMMITMENTS.SUMMARY)
    .eq('dossier_id', dossierId)
    .limit(limit)

  if (directCommitmentsError) {
    throw new DossierOverviewAPIError(
      'Failed to fetch work items',
      500,
      'WORK_ITEMS_FETCH_FAILED',
      directCommitmentsError.message,
    )
  }

  addCommitments(directCommitments as unknown as CommitmentRow[])

  if (commitmentIds.length > 0 && commitmentsById.size < limit) {
    const { data: linkedCommitments, error: linkedCommitmentsError } = await supabase
      .from('aa_commitments')
      .select(COLUMNS.COMMITMENTS.SUMMARY)
      .in('id', commitmentIds)
      .limit(limit)

    if (linkedCommitmentsError) {
      throw new DossierOverviewAPIError(
        'Failed to fetch work items',
        500,
        'WORK_ITEMS_FETCH_FAILED',
        linkedCommitmentsError.message,
      )
    }

    addCommitments(linkedCommitments as unknown as CommitmentRow[])
  }

  if (commitmentsById.size > 0) {
    Array.from(commitmentsById.values())
      .slice(0, limit)
      .forEach((c) => {
        const deadline = c.deadline ?? c.due_date ?? null
        const assigneeId = c.responsible_user_id ?? c.owner_user_id ?? null
        const isOverdue =
          deadline &&
          new Date(deadline) < now &&
          c.status !== 'completed' &&
          c.status !== 'cancelled'
        allWorkItems.push({
          id: c.id,
          source: 'commitment',
          title_en: c.title_en || c.title || '',
          title_ar: c.title_ar || null,
          description_en: c.description_en || c.description || null,
          description_ar: c.description_ar || null,
          status: isOverdue ? 'overdue' : (c.status as WorkItemStatus),
          priority: normalizeWorkItemPriority(c.priority),
          deadline,
          assignee_id: assigneeId,
          assignee_name: null,
          inheritance_source: linkMap[c.id] || 'direct',
          created_at: c.created_at,
          updated_at: c.updated_at,
        })
      })
  }

  // Fetch intake tickets
  if (intakeIds.length > 0) {
    const { data: intakes, error: intakesError } = await supabase
      .from('intake_tickets')
      .select('*, assigned_to:assigned_to_id(full_name)')
      .in('id', intakeIds)
      .limit(limit)

    if (intakesError) {
      throw new DossierOverviewAPIError(
        'Failed to fetch work items',
        500,
        'WORK_ITEMS_FETCH_FAILED',
        intakesError.message,
      )
    }

    ;((intakes || []) as IntakeTicketRow[]).forEach((i) => {
      const isOverdue =
        i.sla_deadline &&
        new Date(i.sla_deadline) < now &&
        i.status !== 'completed' &&
        i.status !== 'cancelled'
      allWorkItems.push({
        id: i.id,
        source: 'intake',
        title_en: i.subject || i.title_en || '',
        title_ar: i.title_ar || null,
        description_en: i.description,
        description_ar: i.description_ar || null,
        status: isOverdue ? 'overdue' : (i.status as WorkItemStatus),
        priority: normalizeWorkItemPriority(i.priority),
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

  // calendar_entries is the canonical operational calendar; event_date is a
  // DATE column, so window on date strings
  const { data: events, error: eventsError } = await supabase
    .from('calendar_entries')
    .select(
      'id, title_en, title_ar, entry_type, event_date, event_time, all_day, location, is_virtual, meeting_link, description_en, description_ar, created_at',
    )
    .eq('dossier_id', dossierId)
    .gte('event_date', startDate.toISOString().slice(0, 10))
    .lte('event_date', endDate.toISOString().slice(0, 10))
    .order('event_date', { ascending: true })

  if (eventsError) {
    throw new DossierOverviewAPIError(
      'Failed to fetch calendar events',
      500,
      'CALENDAR_EVENTS_FETCH_FAILED',
      eventsError.message,
    )
  }

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  const allEvents: DossierCalendarEvent[] = ((events || []) as CalendarEntryRow[]).map((e) => {
    // synthesize a LOCAL datetime (not toISOString) so day-bucketing stays
    // timezone-stable — same approach as calendar.repository mapEntryToCalendarEvent
    const time = e.all_day === true ? '00:00:00' : (e.event_time ?? '00:00:00')
    const startDatetime = `${e.event_date}T${time}`
    return {
      id: e.id,
      title_en: e.title_en || e.title_ar || '',
      title_ar: e.title_ar || e.title_en || null,
      event_type: (e.entry_type || 'meeting') as DossierCalendarEvent['event_type'],
      start_datetime: startDatetime,
      end_datetime: null,
      is_all_day: e.all_day || false,
      location_en: e.location || null,
      location_ar: e.location || null,
      is_virtual: e.is_virtual || false,
      meeting_link: e.meeting_link,
      description_en: e.description_en || null,
      description_ar: e.description_ar || null,
      created_at: e.created_at,
    }
  })

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
  const { data: contacts, error: contactsError } = await supabase
    .from('key_contacts')
    .select(COLUMNS.KEY_CONTACTS.LIST)
    .eq('dossier_id', dossierId)
    .order('name', { ascending: true })

  if (contactsError) {
    throw new DossierOverviewAPIError(
      'Failed to fetch key contacts',
      500,
      'KEY_CONTACTS_FETCH_FAILED',
      contactsError.message,
    )
  }

  const allContacts: DossierKeyContact[] = ((contacts || []) as KeyContactRow[]).map((c) => ({
    id: c.id,
    name: c.name,
    name_ar: null,
    title_en: c.role || null,
    title_ar: null,
    organization_en: c.organization,
    organization_ar: null,
    email: c.email,
    phone: c.phone,
    photo_url: null,
    last_interaction_date: c.last_interaction_date,
    notes: c.notes,
    linked_person_dossier_id: null,
  }))

  return {
    total_count: allContacts.length,
    contacts: allContacts,
  }
}

// =============================================================================
// Fetch Organization Profile (membership & representation)
// =============================================================================

/**
 * Normalizes a raw jsonb focal-point officer into the typed shape, defaulting
 * every sub-field to null. Returns null when the role is absent or has no data.
 */
function normalizeFocalPoint(raw: FocalPointRaw | null | undefined): OrganizationFocalPoint | null {
  if (!raw) return null
  const name_en = raw.name_en ?? null
  const name_ar = raw.name_ar ?? null
  const user_id = raw.user_id ?? null
  if (name_en === null && name_ar === null && user_id === null) return null
  return { name_en, name_ar, user_id }
}

const ORGANIZATION_MEMBERSHIP_TYPES = new Set([
  'board_of_directors',
  'member',
  'participant',
  'counterpart_agency',
])
const ORGANIZATION_IMPORTANCES = new Set(['high', 'medium', 'low'])
const ORGANIZATION_REPRESENTATION_LEVELS = new Set(['president', 'specialist'])

/**
 * Reads the organizations extension row for an organization dossier and
 * normalizes the membership/representation fields. Returns null when there is
 * no organizations row (e.g. a non-organization dossier). Throws
 * DossierOverviewAPIError on a real PostgREST error (OVRERR-01 contract).
 */
async function fetchOrganizationProfile(
  dossierId: string,
): Promise<OrganizationProfileSection | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('membership_type, importance, representation_level, gastat_focal_points')
    .eq('id', dossierId)
    .maybeSingle()

  if (error) {
    throw new DossierOverviewAPIError(
      'Failed to fetch organization profile',
      500,
      'ORGANIZATION_PROFILE_FETCH_FAILED',
      error.message,
    )
  }

  if (!data) return null

  const row = data as OrganizationProfileRow
  const focalPoints = row.gastat_focal_points ?? {}

  return {
    membership_type:
      row.membership_type && ORGANIZATION_MEMBERSHIP_TYPES.has(row.membership_type)
        ? (row.membership_type as OrganizationProfileSection['membership_type'])
        : null,
    importance:
      row.importance && ORGANIZATION_IMPORTANCES.has(row.importance)
        ? (row.importance as OrganizationProfileSection['importance'])
        : null,
    representation_level:
      row.representation_level && ORGANIZATION_REPRESENTATION_LEVELS.has(row.representation_level)
        ? (row.representation_level as OrganizationProfileSection['representation_level'])
        : null,
    focal_points: {
      responsible: normalizeFocalPoint(focalPoints.responsible),
      alternate: normalizeFocalPoint(focalPoints.alternate),
      support: normalizeFocalPoint(focalPoints.support),
    },
  }
}

// =============================================================================
// Fetch Activity Timeline
// =============================================================================

async function fetchActivityTimeline(
  dossierId: string,
  limit: number = 20,
): Promise<ActivityTimelineSection> {
  // OVRERR-01: no try/catch — a UnifiedActivityAPIError rejection from
  // fetchUnifiedDossierActivities propagates out of fetchDossierOverview so the
  // activity-timeline section fails the query instead of impersonating empty.
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
        ? activityTimeline.recent_activities[0]!.timestamp
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
  const [
    relatedDossiers,
    documents,
    workItems,
    calendarEvents,
    keyContacts,
    activityTimeline,
    organizationProfile,
  ] = await Promise.all([
    include_sections.includes('related_dossiers')
      ? fetchRelatedDossiers(dossier_id)
      : Promise.resolve({
          total_count: 0,
          by_relationship_type: {
            parent: [],
            child: [],
            bilateral: [],
            member_of: [],
            has_member: [],
            partner: [],
            related_to: [],
            predecessor: [],
            successor: [],
          } as Record<DossierRelationshipType, RelatedDossier[]>,
          by_dossier_type: {
            country: [],
            organization: [],
            forum: [],
            engagement: [],
            topic: [],
            working_group: [],
            person: [],
          } as Record<DossierType, RelatedDossier[]>,
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
    // organization_profile is opt-in only (never in the DEFAULT include list)
    // so non-organization dossiers never query the organizations table.
    include_sections.includes('organization_profile')
      ? fetchOrganizationProfile(dossier_id)
      : Promise.resolve(null),
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
    organization_profile: organizationProfile,
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
  // Partial-overview requests must not share one cache entry: a drawer asking
  // 3 sections would otherwise satisfy an overview card asking different ones.
  // Extends detail() so prefix invalidation still hits every variant.
  detailWithOptions: (dossierId: string, options: Record<string, unknown>) =>
    [...dossierOverviewKeys.detail(dossierId), options] as const,
  export: (dossierId: string) => [...dossierOverviewKeys.all, 'export', dossierId] as const,
}
