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

    // Fetch assignee info if available
    let assigneeName = 'Unassigned'
    let assigneeEmail: string | undefined
    if (task.assignee_id) {
      const { data: assignee, error } = await supabase
        .from('users')
        .select('full_name, username, email')
        .eq('id', task.assignee_id)
        .maybeSingle()

      if (error) {
        console.warn(`Failed to fetch assignee info for ${task.assignee_id}:`, error)
      } else if (assignee) {
        assigneeName = assignee.full_name || assignee.username || assignee.email || 'Unknown'
        assigneeEmail = assignee.email
      }
    }

    // Fetch creator info if available
    let creatorName = 'Unknown'
    if (task.created_by) {
      const { data: creator, error } = await supabase
        .from('users')
        .select('full_name, username, email')
        .eq('id', task.created_by)
        .maybeSingle()

      if (error) {
        console.warn(`Failed to fetch creator info for ${task.created_by}:`, error)
      } else if (creator) {
        creatorName = creator.full_name || creator.username || creator.email || 'Unknown'
      }
    }

    // Fetch work item title if available
    let workItemTitleEn: string | undefined
    let workItemTitleAr: string | undefined

    if (task.work_item_id && task.work_item_type && task.work_item_type !== 'generic') {
      try {
        if (task.work_item_type === 'dossier') {
          const { data: dossier, error } = await supabase
            .from('dossiers')
            .select('name_en, name_ar')
            .eq('id', task.work_item_id)
            .maybeSingle()

          if (error) {
            console.warn(`Failed to fetch dossier title for ${task.work_item_id}:`, error)
          } else if (dossier) {
            workItemTitleEn = dossier.name_en
            workItemTitleAr = dossier.name_ar
          }
        } else if (task.work_item_type === 'position') {
          const { data: position, error } = await supabase
            .from('positions')
            .select('title_en, title_ar')
            .eq('id', task.work_item_id)
            .maybeSingle()

          if (error) {
            console.warn(`Failed to fetch position title for ${task.work_item_id}:`, error)
          } else if (position) {
            workItemTitleEn = position.title_en
            workItemTitleAr = position.title_ar
          }
        } else if (task.work_item_type === 'ticket') {
          const { data: ticket, error } = await supabase
            .from('intake_tickets')
            .select('title, title_ar')
            .eq('id', task.work_item_id)
            .maybeSingle()

          if (error) {
            console.warn(`Failed to fetch ticket title for ${task.work_item_id}:`, error)
          } else if (ticket) {
            workItemTitleEn = ticket.title
            workItemTitleAr = ticket.title_ar
          }
        }
      } catch (error) {
        // Silently fail if work item not found - it might have been deleted
        console.warn(
          `Exception fetching work item title for ${task.work_item_type}:${task.work_item_id}`,
          error,
        )
      }
    }

    // Fetch titles for all work items in source JSONB field (US4 - T070)
    const workItems: Array<{
      type: string
      id: string
      title_en?: string
      title_ar?: string
    }> = []

    if (task.source) {
      const source = task.source as any

      // Fetch dossier titles
      if (source.dossier_ids && Array.isArray(source.dossier_ids)) {
        for (const dossierId of source.dossier_ids) {
          try {
            const { data: dossier, error } = await supabase
              .from('dossiers')
              .select('name_en, name_ar')
              .eq('id', dossierId)
              .maybeSingle()

            if (error) {
              console.warn(`Failed to fetch dossier title for ${dossierId}:`, error)
            }

            workItems.push({
              type: 'dossier',
              id: dossierId,
              title_en: dossier?.name_en,
              title_ar: dossier?.name_ar,
            })
          } catch (error) {
            // Dossier might not exist or user lacks clearance - add with no title
            console.warn(`Exception fetching dossier title for ${dossierId}`, error)
            workItems.push({
              type: 'dossier',
              id: dossierId,
            })
          }
        }
      }

      // Fetch position titles
      if (source.position_ids && Array.isArray(source.position_ids)) {
        for (const positionId of source.position_ids) {
          try {
            const { data: position, error } = await supabase
              .from('positions')
              .select('title_en, title_ar')
              .eq('id', positionId)
              .maybeSingle()

            if (error) {
              console.warn(`Failed to fetch position title for ${positionId}:`, error)
            }

            workItems.push({
              type: 'position',
              id: positionId,
              title_en: position?.title_en,
              title_ar: position?.title_ar,
            })
          } catch (error) {
            console.warn(`Exception fetching position title for ${positionId}`, error)
            workItems.push({
              type: 'position',
              id: positionId,
            })
          }
        }
      }

      // Fetch ticket titles
      if (source.ticket_ids && Array.isArray(source.ticket_ids)) {
        for (const ticketId of source.ticket_ids) {
          try {
            const { data: ticket, error } = await supabase
              .from('intake_tickets')
              .select('title, title_ar')
              .eq('id', ticketId)
              .maybeSingle()

            if (error) {
              console.warn(`Failed to fetch ticket title for ${ticketId}:`, error)
            }

            workItems.push({
              type: 'ticket',
              id: ticketId,
              title_en: ticket?.title,
              title_ar: ticket?.title_ar,
            })
          } catch (error) {
            console.warn(`Exception fetching ticket title for ${ticketId}`, error)
            workItems.push({
              type: 'ticket',
              id: ticketId,
            })
          }
        }
      }
    }

    // Fetch engagement details if available
    let engagement: TaskEngagement | undefined = undefined
    if (task.engagement_id) {
      try {
        const { data: engagementData, error: engagementError } = await supabase
          .from('engagements')
          .select(
            `
            id,
            title,
            engagement_type,
            engagement_date,
            location,
            dossier_id,
            dossiers (
              id,
              name_en,
              name_ar
            )
          `,
          )
          .eq('id', task.engagement_id)
          .maybeSingle()

        if (engagementError) {
          console.warn(`Failed to fetch engagement for ${task.engagement_id}:`, engagementError)
        } else if (engagementData) {
          const dossierData = engagementData.dossiers as {
            id: string
            name_en: string
            name_ar: string
          } | null
          engagement = {
            id: engagementData.id,
            title: engagementData.title,
            engagement_type: engagementData.engagement_type,
            engagement_date: engagementData.engagement_date,
            location: engagementData.location,
            dossier: dossierData
              ? {
                  id: dossierData.id,
                  name_en: dossierData.name_en,
                  name_ar: dossierData.name_ar,
                }
              : undefined,
          }
        }
      } catch (error) {
        console.warn(`Exception fetching engagement for ${task.engagement_id}`, error)
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
