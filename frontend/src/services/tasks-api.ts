/**
 * Tasks API Client
 * Part of: 025-unified-tasks-model implementation
 *
 * Typed API client for unified tasks operations.
 * Handles authentication, error handling, and response parsing.
 */

import { supabase } from '@/lib/supabase'
import { COLUMNS } from '@/lib/query-columns'
import type { Database } from '../../../backend/src/types/database.types'
import type { ApiErrorDetails, Metadata } from '@/types/common.types'

// Get Supabase URL for Edge Functions
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

type Task = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']
type TaskContributor = Database['public']['Tables']['task_contributors']['Row']

/**
 * API Request types
 */
export interface CreateTaskRequest {
  title: string
  description?: string
  assignee_id: string
  engagement_id?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  workflow_stage?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
  sla_deadline?: string
  work_item_type?: 'dossier' | 'position' | 'ticket' | 'generic'
  work_item_id?: string
  source?: Metadata
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  assignee_id?: string
  engagement_id?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  workflow_stage?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
  status?: 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled'
  sla_deadline?: string
  work_item_type?: 'dossier' | 'position' | 'ticket' | 'generic'
  work_item_id?: string
  source?: Metadata
  completed_by?: string
  completed_at?: string
  last_known_updated_at?: string // For optimistic locking
}

export interface TaskFilters {
  filter?: 'assigned' | 'contributed' | 'created' | 'all'
  assignee_id?: string
  engagement_id?: string
  workflow_stage?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
  status?: 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled'
  work_item_type?: 'dossier' | 'position' | 'ticket' | 'generic'
  work_item_id?: string
  sla_deadline_before?: string
  is_overdue?: boolean
  page?: number
  page_size?: number
  sort_by?: 'created_at' | 'updated_at' | 'sla_deadline' | 'priority'
  sort_order?: 'asc' | 'desc'
}

export interface TasksListResponse {
  tasks: Task[]
  total_count: number
  page: number
  page_size: number
}

/**
 * Task engagement details
 */
export interface TaskEngagement {
  id: string
  title: string | null
  engagement_type: string | null
  engagement_date: string | null
  location: string | null
  dossier?: {
    id: string
    name_en: string
    name_ar: string
  }
}

/**
 * API Error class
 */
export class TasksAPIError extends Error {
  code: string
  status: number
  details?: ApiErrorDetails

  constructor(message: string, status: number, code: string, details?: ApiErrorDetails) {
    super(message)
    this.name = 'TasksAPIError'
    this.code = code
    this.status = status
    this.details = details
  }
}

/**
 * Optimistic lock conflict data from API
 */
interface OptimisticLockConflictData {
  message: string
  current_state: Task
  client_timestamp: string
  server_timestamp: string
}

/**
 * Optimistic lock conflict error
 */
export class OptimisticLockConflictError extends TasksAPIError {
  current_state: Task
  client_timestamp: string
  server_timestamp: string

  constructor(data: OptimisticLockConflictData) {
    super(data.message, 409, 'optimistic_lock_conflict')
    this.current_state = data.current_state
    this.client_timestamp = data.client_timestamp
    this.server_timestamp = data.server_timestamp
  }
}

/**
 * Helper function to make authenticated requests
 */
async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new TasksAPIError('Not authenticated', 401, 'UNAUTHORIZED')
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))

    // Handle optimistic lock conflicts
    if (response.status === 409 && error.error === 'optimistic_lock_conflict') {
      throw new OptimisticLockConflictError(error)
    }

    throw new TasksAPIError(
      error.message || error.error || 'Request failed',
      response.status,
      error.code || 'UNKNOWN_ERROR',
      error,
    )
  }

  return response.json()
}

/**
 * Tasks API Client
 */
export const tasksAPI = {
  /**
   * Get tasks with filtering and pagination
   */
  async getTasks(filters: TaskFilters = {}): Promise<TasksListResponse> {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })

    const url = `${supabaseUrl}/functions/v1/tasks-get?${params}`
    return fetchWithAuth<TasksListResponse>(url)
  },

  /**
   * Get a single task by ID
   */
  async getTask(taskId: string): Promise<
    Task & {
      assignee_name?: string
      assignee_email?: string
      created_by_name?: string
      work_item_title_en?: string
      work_item_title_ar?: string
      work_items?: Array<{
        type: string
        id: string
        title_en?: string
        title_ar?: string
      }>
      engagement?: {
        id: string
        title: string
        engagement_type: string
        engagement_date: string
        location?: string
        dossier?: {
          id: string
          name_en: string
          name_ar: string
        }
      }
    }
  > {
    // Fetch the task - use maybeSingle() to avoid 406 error when task not found
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(COLUMNS.TASKS.DETAIL)
      .eq('id', taskId)
      .eq('is_deleted', false)
      .maybeSingle()

    if (taskError) {
      throw new TasksAPIError(taskError.message, 500, taskError.code)
    }

    if (!task) {
      throw new TasksAPIError('Task not found', 404, 'NOT_FOUND')
    }

    // Parallel fetch: assignee, creator, engagement (3 queries in parallel)
    const [assigneeResult, creatorResult, engagementResult] = await Promise.all([
      task.assignee_id
        ? supabase
            .from('users')
            .select('full_name, username, email')
            .eq('id', task.assignee_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      task.created_by
        ? supabase
            .from('users')
            .select('full_name, username, email')
            .eq('id', task.created_by)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      task.engagement_id
        ? supabase
            .from('engagements')
            .select(
              `id, title, engagement_type, engagement_date, location, dossier_id, dossiers (id, name_en, name_ar)`,
            )
            .eq('id', task.engagement_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ])

    // Process assignee
    let assigneeName = 'Unassigned'
    let assigneeEmail: string | undefined
    if (assigneeResult.error) {
      console.warn(`Failed to fetch assignee info for ${task.assignee_id}:`, assigneeResult.error)
    } else if (assigneeResult.data) {
      const a = assigneeResult.data
      assigneeName = a.full_name || a.username || a.email || 'Unknown'
      assigneeEmail = a.email
    }

    // Process creator
    let creatorName = 'Unknown'
    if (creatorResult.error) {
      console.warn(`Failed to fetch creator info for ${task.created_by}:`, creatorResult.error)
    } else if (creatorResult.data) {
      const c = creatorResult.data
      creatorName = c.full_name || c.username || c.email || 'Unknown'
    }

    // Collect all IDs from work_item and source JSONB for batch fetching
    const dossierIds: string[] = []
    const positionIds: string[] = []
    const ticketIds: string[] = []

    // Single work_item_id
    if (task.work_item_id && task.work_item_type && task.work_item_type !== 'generic') {
      if (task.work_item_type === 'dossier') dossierIds.push(task.work_item_id)
      else if (task.work_item_type === 'position') positionIds.push(task.work_item_id)
      else if (task.work_item_type === 'ticket') ticketIds.push(task.work_item_id)
    }

    // Source JSONB arrays
    const source = task.source as any
    if (source) {
      if (source.dossier_ids && Array.isArray(source.dossier_ids)) {
        for (const id of source.dossier_ids) {
          if (!dossierIds.includes(id)) dossierIds.push(id)
        }
      }
      if (source.position_ids && Array.isArray(source.position_ids)) {
        for (const id of source.position_ids) {
          if (!positionIds.includes(id)) positionIds.push(id)
        }
      }
      if (source.ticket_ids && Array.isArray(source.ticket_ids)) {
        for (const id of source.ticket_ids) {
          if (!ticketIds.includes(id)) ticketIds.push(id)
        }
      }
    }

    // Batch fetch all related entities in parallel
    const [dossiersResult, positionsResult, ticketsResult] = await Promise.all([
      dossierIds.length
        ? supabase.from('dossiers').select('id, name_en, name_ar').in('id', dossierIds)
        : Promise.resolve({
            data: [] as { id: string; name_en: string; name_ar: string }[],
            error: null,
          }),
      positionIds.length
        ? supabase.from('positions').select('id, title_en, title_ar').in('id', positionIds)
        : Promise.resolve({
            data: [] as { id: string; title_en: string; title_ar: string }[],
            error: null,
          }),
      ticketIds.length
        ? supabase.from('intake_tickets').select('id, title, title_ar').in('id', ticketIds)
        : Promise.resolve({
            data: [] as { id: string; title: string; title_ar: string }[],
            error: null,
          }),
    ])

    // Build lookup maps
    const dossierMap = new Map((dossiersResult.data ?? []).map((d) => [d.id, d]))
    const positionMap = new Map((positionsResult.data ?? []).map((p) => [p.id, p]))
    const ticketMap = new Map((ticketsResult.data ?? []).map((t) => [t.id, t]))

    // Resolve single work item title
    let workItemTitleEn: string | undefined
    let workItemTitleAr: string | undefined
    if (task.work_item_id && task.work_item_type && task.work_item_type !== 'generic') {
      if (task.work_item_type === 'dossier') {
        const d = dossierMap.get(task.work_item_id)
        if (d) {
          workItemTitleEn = d.name_en
          workItemTitleAr = d.name_ar
        }
      } else if (task.work_item_type === 'position') {
        const p = positionMap.get(task.work_item_id)
        if (p) {
          workItemTitleEn = p.title_en
          workItemTitleAr = p.title_ar
        }
      } else if (task.work_item_type === 'ticket') {
        const t = ticketMap.get(task.work_item_id)
        if (t) {
          workItemTitleEn = t.title
          workItemTitleAr = t.title_ar
        }
      }
    }

    // Build work items array from source JSONB
    const workItems: Array<{
      type: string
      id: string
      title_en?: string
      title_ar?: string
    }> = []

    if (source) {
      if (source.dossier_ids && Array.isArray(source.dossier_ids)) {
        for (const id of source.dossier_ids) {
          const d = dossierMap.get(id)
          workItems.push({ type: 'dossier', id, title_en: d?.name_en, title_ar: d?.name_ar })
        }
      }
      if (source.position_ids && Array.isArray(source.position_ids)) {
        for (const id of source.position_ids) {
          const p = positionMap.get(id)
          workItems.push({ type: 'position', id, title_en: p?.title_en, title_ar: p?.title_ar })
        }
      }
      if (source.ticket_ids && Array.isArray(source.ticket_ids)) {
        for (const id of source.ticket_ids) {
          const t = ticketMap.get(id)
          workItems.push({ type: 'ticket', id, title_en: t?.title, title_ar: t?.title_ar })
        }
      }
    }

    // Process engagement
    let engagement: TaskEngagement | undefined = undefined
    if (engagementResult.error) {
      console.warn(`Failed to fetch engagement for ${task.engagement_id}:`, engagementResult.error)
    } else if (engagementResult.data) {
      const e = engagementResult.data
      const dossierData = e.dossiers as {
        id: string
        name_en: string
        name_ar: string
      } | null
      engagement = {
        id: e.id,
        title: e.title,
        engagement_type: e.engagement_type,
        engagement_date: e.engagement_date,
        location: e.location,
        dossier: dossierData
          ? { id: dossierData.id, name_en: dossierData.name_en, name_ar: dossierData.name_ar }
          : undefined,
      }
    }

    return {
      ...task,
      assignee_name: assigneeName,
      assignee_email: assigneeEmail,
      created_by_name: creatorName,
      work_item_title_en: workItemTitleEn,
      work_item_title_ar: workItemTitleAr,
      work_items: workItems.length > 0 ? workItems : undefined,
      engagement,
    }
  },

  /**
   * Create a new task
   */
  async createTask(request: CreateTaskRequest): Promise<Task> {
    const url = `${supabaseUrl}/functions/v1/tasks-create`
    const response = await fetchWithAuth<{ task: Task }>(url, {
      method: 'POST',
      body: JSON.stringify(request),
    })
    return response.task
  },

  /**
   * Update a task
   */
  async updateTask(taskId: string, request: UpdateTaskRequest): Promise<Task> {
    const url = `${supabaseUrl}/functions/v1/tasks-update/${taskId}`
    const response = await fetchWithAuth<{ task: Task }>(url, {
      method: 'PUT',
      body: JSON.stringify(request),
    })
    return response.task
  },

  /**
   * Update task workflow stage (for kanban drag-and-drop)
   */
  async updateWorkflowStage(
    taskId: string,
    workflow_stage: UpdateTaskRequest['workflow_stage'],
    last_known_updated_at?: string,
  ): Promise<Task> {
    return tasksAPI.updateTask(taskId, {
      workflow_stage,
      last_known_updated_at,
    })
  },

  /**
   * Mark task as completed
   */
  async completeTask(taskId: string, last_known_updated_at?: string): Promise<Task> {
    return tasksAPI.updateTask(taskId, {
      status: 'completed',
      workflow_stage: 'done',
      completed_at: new Date().toISOString(),
      last_known_updated_at,
    })
  },

  /**
   * Delete a task (soft delete)
   */
  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .eq('is_deleted', false)

    if (error) {
      throw new TasksAPIError(error.message, 500, error.code)
    }
  },

  /**
   * Get my tasks (assigned to current user)
   */
  async getMyTasks(filters: Omit<TaskFilters, 'filter'> = {}): Promise<TasksListResponse> {
    return tasksAPI.getTasks({ ...filters, filter: 'assigned' })
  },

  /**
   * Get tasks I contributed to (US2 - T049)
   * Queries tasks via task_contributors join where current user is a contributor
   */
  async getContributedTasks(filters: Omit<TaskFilters, 'filter'> = {}): Promise<TasksListResponse> {
    return tasksAPI.getTasks({ ...filters, filter: 'contributed' })
  },

  /**
   * Get tasks for an engagement (kanban board)
   */
  async getEngagementTasks(engagementId: string): Promise<TasksListResponse> {
    return tasksAPI.getTasks({ engagement_id: engagementId })
  },

  /**
   * Get tasks linked to a work item
   */
  async getWorkItemTasks(
    workItemType: 'dossier' | 'position' | 'ticket' | 'generic',
    workItemId: string,
  ): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(COLUMNS.TASKS.LIST)
      .eq('work_item_type', workItemType)
      .eq('work_item_id', workItemId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (error) {
      throw new TasksAPIError(error.message, 500, error.code)
    }

    return data || []
  },

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(assigneeId?: string): Promise<Task[]> {
    let query = supabase
      .from('tasks')
      .select(COLUMNS.TASKS.LIST)
      .eq('is_deleted', false)
      .lt('sla_deadline', new Date().toISOString())
      .not('status', 'in', '(completed,cancelled)')
      .order('sla_deadline', { ascending: true })

    if (assigneeId) {
      query = query.eq('assignee_id', assigneeId)
    }

    const { data, error } = await query

    if (error) {
      throw new TasksAPIError(error.message, 500, error.code)
    }

    return data || []
  },

  /**
   * Get tasks approaching SLA deadline
   */
  async getTasksApproachingDeadline(hours: number = 4, assigneeId?: string): Promise<Task[]> {
    const warningTime = new Date()
    warningTime.setHours(warningTime.getHours() + hours)

    let query = supabase
      .from('tasks')
      .select(COLUMNS.TASKS.LIST)
      .eq('is_deleted', false)
      .lte('sla_deadline', warningTime.toISOString())
      .gte('sla_deadline', new Date().toISOString())
      .not('status', 'in', '(completed,cancelled)')
      .order('sla_deadline', { ascending: true })

    if (assigneeId) {
      query = query.eq('assignee_id', assigneeId)
    }

    const { data, error } = await query

    if (error) {
      throw new TasksAPIError(error.message, 500, error.code)
    }

    return data || []
  },
}

export default tasksAPI
