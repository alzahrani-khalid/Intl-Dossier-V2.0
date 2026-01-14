/**
 * CQRS Service
 *
 * Provides separate APIs for commands (write) and queries (read) operations.
 * Commands are sent to the write model and emit domain events.
 * Queries are served from optimized read models (projections).
 */

import { supabase } from '@/lib/supabase'

// ============================================================================
// Types
// ============================================================================

// Base types
export interface CommandResult<T = unknown> {
  success: boolean
  data?: T
  event_id?: string
  error?: string
}

export interface QueryResult<T = unknown> {
  data: T
  source: 'read_model' | 'fallback'
  query_time_ms: number
}

// Command types
export interface CreateDossierCommand {
  type: string
  name_en: string
  name_ar?: string
  summary_en?: string
  summary_ar?: string
  status?: string
  visibility?: string
  metadata?: Record<string, unknown>
  idempotency_key?: string
  correlation_id?: string
}

export interface UpdateDossierCommand {
  id: string
  changes: Record<string, unknown>
  idempotency_key?: string
  correlation_id?: string
}

export interface ArchiveDossierCommand {
  id: string
  reason?: string
  idempotency_key?: string
  correlation_id?: string
}

export interface CreateRelationshipCommand {
  source_dossier_id: string
  target_dossier_id: string
  relationship_type: string
  relationship_subtype?: string
  strength?: number
  is_bidirectional?: boolean
  metadata?: Record<string, unknown>
  idempotency_key?: string
  correlation_id?: string
}

export interface DeleteRelationshipCommand {
  id: string
  idempotency_key?: string
  correlation_id?: string
}

export interface CreateCalendarCommand {
  dossier_id: string
  entry_type: string
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  event_date: string
  event_time?: string
  duration_minutes?: number
  all_day?: boolean
  location?: string
  is_virtual?: boolean
  meeting_link?: string
  status?: string
  idempotency_key?: string
  correlation_id?: string
}

export interface UpdateCalendarCommand {
  id: string
  changes: Record<string, unknown>
  idempotency_key?: string
  correlation_id?: string
}

export interface DeleteCalendarCommand {
  id: string
  idempotency_key?: string
  correlation_id?: string
}

// Query types
export interface TimelineQuery {
  dossier_id: string
  event_types?: string[]
  priority?: string[]
  date_from?: string
  date_to?: string
  search_query?: string
  cursor?: string
  limit?: number
}

export interface TimelineEvent {
  id: string
  event_key: string
  source_table: string
  source_id: string
  event_type: string
  title_en: string | null
  title_ar: string | null
  description_en: string | null
  description_ar: string | null
  event_date: string
  end_date: string | null
  priority: string
  status: string | null
  metadata: Record<string, unknown>
  created_at: string
  created_by: string | null
}

export interface TimelineResponse {
  events: TimelineEvent[]
  next_cursor: string | undefined
  has_more: boolean
  total_count: number
  source: 'read_model' | 'fallback'
  query_time_ms: number
}

export interface GraphQuery {
  dossier_id: string
  relationship_types?: string[]
  max_depth?: number
  include_inactive?: boolean
}

export interface GraphNode {
  id: string
  type: string
  name_en: string | null
  name_ar: string | null
  status: string
  depth: number
}

export interface GraphEdge {
  source_id: string
  target_id: string
  relationship_type: string
}

export interface GraphResponse {
  start_dossier_id: string
  start_dossier: {
    id: string
    type: string
    name_en: string
    name_ar: string
    status: string
  }
  max_depth: number
  nodes: GraphNode[]
  edges: GraphEdge[]
  stats: {
    node_count: number
    edge_count: number
    max_degree: number
    query_time_ms: number
  }
  source: 'read_model' | 'fallback'
}

export interface DossierSummary {
  id: string
  type: string
  name_en: string | null
  name_ar: string | null
  summary_en: string | null
  summary_ar: string | null
  status: string
  relationship_count: number
  document_count: number
  event_count: number
  interaction_count: number
  last_activity_at: string | null
  health_score: number
  tags: string[]
  categories: string[]
  created_at: string
  updated_at: string
}

export interface SearchQuery {
  query: string
  types?: string[]
  status?: string[]
  limit?: number
  offset?: number
}

export interface SearchResult extends DossierSummary {
  rank: number
}

export interface SearchResponse {
  results: SearchResult[]
  total_count: number
  query_time_ms: number
  source: 'read_model' | 'fallback'
}

// ============================================================================
// API Client Utilities
// ============================================================================

const COMMANDS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cqrs-commands`
const QUERIES_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cqrs-queries`

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

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        searchParams.set(key, value.join(','))
      } else {
        searchParams.set(key, String(value))
      }
    }
  })

  return searchParams.toString()
}

async function executeCommand<T>(
  entity: string,
  action: string,
  command: unknown,
): Promise<CommandResult<T>> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${COMMANDS_URL}/${entity}/${action}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(command),
  })

  return response.json()
}

async function executeQuery<T>(path: string, params: Record<string, unknown>): Promise<T> {
  const headers = await getAuthHeaders()
  const queryString = buildQueryString(params)

  const response = await fetch(`${QUERIES_URL}/${path}?${queryString}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Query failed: ${response.status}`)
  }

  return response.json()
}

// ============================================================================
// COMMANDS (Write Operations)
// ============================================================================

export const commands = {
  // Dossier commands
  dossier: {
    create: (command: CreateDossierCommand) =>
      executeCommand<Record<string, unknown>>('dossier', 'create', command),

    update: (command: UpdateDossierCommand) =>
      executeCommand<Record<string, unknown>>('dossier', 'update', command),

    archive: (command: ArchiveDossierCommand) =>
      executeCommand<Record<string, unknown>>('dossier', 'archive', command),
  },

  // Relationship commands
  relationship: {
    create: (command: CreateRelationshipCommand) =>
      executeCommand<Record<string, unknown>>('relationship', 'create', command),

    delete: (command: DeleteRelationshipCommand) =>
      executeCommand<{ deleted: boolean; id: string }>('relationship', 'delete', command),
  },

  // Calendar commands
  calendar: {
    create: (command: CreateCalendarCommand) =>
      executeCommand<Record<string, unknown>>('calendar', 'create', command),

    update: (command: UpdateCalendarCommand) =>
      executeCommand<Record<string, unknown>>('calendar', 'update', command),

    delete: (command: DeleteCalendarCommand) =>
      executeCommand<{ deleted: boolean; id: string }>('calendar', 'delete', command),
  },
}

// ============================================================================
// QUERIES (Read Operations)
// ============================================================================

export const queries = {
  /**
   * Get timeline events for a dossier
   * Uses optimized read model for fast queries
   */
  timeline: (query: TimelineQuery): Promise<TimelineResponse> =>
    executeQuery<TimelineResponse>('timeline', query),

  /**
   * Get relationship graph for a dossier
   * Uses pre-computed graph for fast traversal
   */
  graph: (query: GraphQuery): Promise<GraphResponse> => executeQuery<GraphResponse>('graph', query),

  /**
   * Get pre-computed dossier summary
   * Includes aggregated stats like relationship count, events, etc.
   */
  dossierSummary: (dossierId: string): Promise<DossierSummary> =>
    executeQuery<DossierSummary>('dossier/summary', { dossier_id: dossierId }),

  /**
   * Search dossiers using optimized full-text search
   */
  search: (query: SearchQuery): Promise<SearchResponse> =>
    executeQuery<SearchResponse>('dossier/search', query),

  /**
   * Get daily aggregated metrics
   */
  metrics: (params?: {
    date_from?: string
    date_to?: string
    metric_type?: string
  }): Promise<{ metrics: unknown[] }> =>
    executeQuery<{ metrics: unknown[] }>('metrics/daily', params || {}),
}

// ============================================================================
// Idempotency Key Generator
// ============================================================================

/**
 * Generate a unique idempotency key for commands
 * Prevents duplicate operations when retrying
 */
export function generateIdempotencyKey(
  operation: string,
  entityId: string,
  timestamp = Date.now(),
): string {
  return `${operation}-${entityId}-${timestamp}`
}

/**
 * Generate a correlation ID for tracking related operations
 */
export function generateCorrelationId(): string {
  return crypto.randomUUID()
}

// ============================================================================
// Default Export
// ============================================================================

export const cqrs = {
  commands,
  queries,
  generateIdempotencyKey,
  generateCorrelationId,
}

export default cqrs
