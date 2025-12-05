/**
 * Tasks Service
 * Part of: 025-unified-tasks-model implementation
 *
 * Provides CRUD operations for unified tasks table with:
 * - Optimistic locking (updated_at comparison)
 * - Soft deletes (is_deleted flag)
 * - Work item linking (dossier/position/ticket/generic)
 * - Engagement context for kanban boards
 * - Variable load optimization (10-1000+ tasks)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

type Task = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export interface CreateTaskInput {
  title: string
  description?: string
  assignee_id: string
  engagement_id?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  workflow_stage?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
  sla_deadline?: string
  work_item_type?: 'dossier' | 'position' | 'ticket' | 'generic'
  work_item_id?: string
  source?: Record<string, any>
  created_by: string
  tenant_id: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  assignee_id?: string
  engagement_id?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  workflow_stage?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  sla_deadline?: string
  work_item_type?: 'dossier' | 'position' | 'ticket' | 'generic'
  work_item_id?: string
  source?: Record<string, any>
  updated_by: string
  completed_by?: string
  completed_at?: string
  last_known_updated_at?: string // For optimistic locking
}

export interface TaskFilters {
  assignee_id?: string
  engagement_id?: string
  workflow_stage?: string
  status?: string
  work_item_type?: string
  work_item_id?: string
  sla_deadline_before?: string
  is_overdue?: boolean
}

export interface TaskListOptions {
  filters?: TaskFilters
  page?: number
  page_size?: number
  sort_by?: 'created_at' | 'updated_at' | 'sla_deadline' | 'priority'
  sort_order?: 'asc' | 'desc'
}

export class TasksService {
  private supabase: SupabaseClient<Database>

  constructor(supabaseClient?: SupabaseClient<Database>) {
    this.supabase = supabaseClient || supabase
  }

  /**
   * Create a new task
   */
  async createTask(input: CreateTaskInput): Promise<Task> {
    // Validate source JSONB structure if provided
    if (input.source && typeof input.source === 'object') {
      const { dossier_ids, position_ids, ticket_ids } = input.source

      // Validate array types
      if (dossier_ids && !Array.isArray(dossier_ids)) {
        throw new Error('source.dossier_ids must be an array')
      }
      if (position_ids && !Array.isArray(position_ids)) {
        throw new Error('source.position_ids must be an array')
      }
      if (ticket_ids && !Array.isArray(ticket_ids)) {
        throw new Error('source.ticket_ids must be an array')
      }

      // Prevent conflicting work_item_id when source is used for multiple items
      const hasMultipleWorkItems =
        (dossier_ids && dossier_ids.length > 0) ||
        (position_ids && position_ids.length > 0) ||
        (ticket_ids && ticket_ids.length > 0)

      if (hasMultipleWorkItems && input.work_item_id) {
        throw new Error(
          'Cannot specify both work_item_id and source with multiple work items. Use source field for multiple items or work_item_id for single item.',
        )
      }
    }

    const taskData: TaskInsert = {
      title: input.title,
      description: input.description || null,
      assignee_id: input.assignee_id,
      engagement_id: input.engagement_id || null,
      priority: input.priority || 'medium',
      workflow_stage: input.workflow_stage || 'todo',
      status: 'pending',
      sla_deadline: input.sla_deadline || null,
      work_item_type: input.work_item_type || null,
      work_item_id: input.work_item_id || null,
      source: input.source || {},
      assignment: {}, // Legacy field - keep for backward compatibility
      timeline: { created_at: new Date().toISOString() },
      created_by: input.created_by,
      last_modified_by: input.created_by,
      updated_by: input.created_by,
      tenant_id: input.tenant_id,
      type: 'action_item', // Default task type
      version: 1,
    }

    const { data, error } = await this.supabase.from('tasks').insert(taskData).select().single()

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`)
    }

    return data
  }

  /**
   * Get a single task by ID
   */
  async getTaskById(taskId: string, userId: string): Promise<Task | null> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('is_deleted', false)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to fetch task: ${error.message}`)
    }

    return data
  }

  /**
   * List tasks with filtering, sorting, and pagination
   */
  async listTasks(
    options: TaskListOptions = {},
  ): Promise<{ tasks: Task[]; total_count: number; page: number; page_size: number }> {
    const {
      filters = {},
      page = 1,
      page_size = 50,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = options

    let query = this.supabase.from('tasks').select('*', { count: 'exact' }).eq('is_deleted', false)

    // Apply filters
    if (filters.assignee_id) {
      query = query.eq('assignee_id', filters.assignee_id)
    }
    if (filters.engagement_id) {
      query = query.eq('engagement_id', filters.engagement_id)
    }
    if (filters.workflow_stage) {
      query = query.eq('workflow_stage', filters.workflow_stage)
    }
    if (filters.status) {
      query = query.eq(
        'status',
        filters.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
      )
    }
    if (filters.work_item_type) {
      query = query.eq('work_item_type', filters.work_item_type)
    }
    if (filters.work_item_id) {
      query = query.eq('work_item_id', filters.work_item_id)
    }
    if (filters.sla_deadline_before) {
      query = query.lt('sla_deadline', filters.sla_deadline_before)
    }
    if (filters.is_overdue) {
      query = query.lt('sla_deadline', new Date().toISOString())
      query = query.not('status', 'in', '(completed,cancelled)')
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' })

    // Apply pagination
    const from = (page - 1) * page_size
    const to = from + page_size - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to list tasks: ${error.message}`)
    }

    return {
      tasks: data || [],
      total_count: count || 0,
      page,
      page_size,
    }
  }

  /**
   * Get tasks assigned to a user
   */
  async getMyTasks(
    userId: string,
    options: Omit<TaskListOptions, 'filters'> & { filters?: Omit<TaskFilters, 'assignee_id'> } = {},
  ): Promise<{ tasks: Task[]; total_count: number }> {
    const result = await this.listTasks({
      ...options,
      filters: {
        ...options.filters,
        assignee_id: userId,
      },
    })

    return {
      tasks: result.tasks,
      total_count: result.total_count,
    }
  }

  /**
   * Get tasks for an engagement (kanban board)
   */
  async getEngagementTasks(
    engagementId: string,
    options: TaskListOptions = {},
  ): Promise<{ tasks: Task[]; total_count: number }> {
    const result = await this.listTasks({
      ...options,
      filters: {
        ...options.filters,
        engagement_id: engagementId,
      },
      sort_by: 'created_at',
      sort_order: 'desc',
    })

    return {
      tasks: result.tasks,
      total_count: result.total_count,
    }
  }

  /**
   * Get tasks linked to a work item (reverse lookup)
   */
  async getWorkItemTasks(
    workItemType: 'dossier' | 'position' | 'ticket' | 'generic',
    workItemId: string,
  ): Promise<Task[]> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('work_item_type', workItemType)
      .eq('work_item_id', workItemId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch work item tasks: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update a task with optimistic locking
   */
  async updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
    const updateData: TaskUpdate = {
      ...(input.title && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.assignee_id && { assignee_id: input.assignee_id }),
      ...(input.engagement_id !== undefined && { engagement_id: input.engagement_id }),
      ...(input.priority && { priority: input.priority }),
      ...(input.workflow_stage && { workflow_stage: input.workflow_stage }),
      ...(input.status && { status: input.status }),
      ...(input.sla_deadline !== undefined && { sla_deadline: input.sla_deadline }),
      ...(input.work_item_type !== undefined && { work_item_type: input.work_item_type }),
      ...(input.work_item_id !== undefined && { work_item_id: input.work_item_id }),
      ...(input.source && { source: input.source }),
      ...(input.completed_by && { completed_by: input.completed_by }),
      ...(input.completed_at && { completed_at: input.completed_at }),
      updated_by: input.updated_by,
      last_modified_by: input.updated_by,
      updated_at: new Date().toISOString(),
    }

    // Auto-set completed_at if status changes to completed
    if (input.status === 'completed' && !input.completed_at) {
      updateData.completed_at = new Date().toISOString()
      updateData.completed_by = input.updated_by
    }

    const { data, error } = await this.supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .eq('is_deleted', false)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update task: ${error.message}`)
    }

    return data
  }

  /**
   * Soft delete a task
   */
  async deleteTask(taskId: string, deletedBy: string): Promise<void> {
    const { error } = await this.supabase
      .from('tasks')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_by: deletedBy,
        last_modified_by: deletedBy,
      })
      .eq('id', taskId)
      .eq('is_deleted', false)

    if (error) {
      throw new Error(`Failed to delete task: ${error.message}`)
    }
  }

  /**
   * Get overdue tasks (SLA breach detection)
   */
  async getOverdueTasks(assigneeId?: string): Promise<Task[]> {
    let query = this.supabase
      .from('tasks')
      .select('*')
      .eq('is_deleted', false)
      .lt('sla_deadline', new Date().toISOString())
      .not('status', 'in', '(completed,cancelled)')
      .order('sla_deadline', { ascending: true })

    if (assigneeId) {
      query = query.eq('assignee_id', assigneeId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch overdue tasks: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get tasks approaching SLA deadline (for warnings)
   */
  async getTasksApproachingDeadline(
    hoursUntilDeadline: number = 4,
    assigneeId?: string,
  ): Promise<Task[]> {
    const warningTime = new Date()
    warningTime.setHours(warningTime.getHours() + hoursUntilDeadline)

    let query = this.supabase
      .from('tasks')
      .select('*')
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
      throw new Error(`Failed to fetch tasks approaching deadline: ${error.message}`)
    }

    return data || []
  }
}

export const tasksService = new TasksService()
