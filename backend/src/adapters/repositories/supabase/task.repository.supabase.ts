/**
 * Supabase Task Repository Adapter
 *
 * Implements the ITaskRepository port using Supabase as the data store.
 * This is an adapter in the hexagonal architecture.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import {
  ITaskRepository,
  TaskEntity,
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskFilterParams,
  TaskStatistics,
} from '../../../core/ports/repositories'
import {
  PaginatedResult,
  PaginationParams,
} from '../../../core/ports/repositories/base.repository.port'
import { ILoggerPort } from '../../../core/ports/infrastructure'

/**
 * Supabase implementation of the Task Repository
 */
export class SupabaseTaskRepository implements ITaskRepository {
  private readonly tableName = 'tasks'
  private readonly defaultSelect = `
    *,
    assignee:users!assigned_to(name_en, name_ar, email),
    assigner:users!assigned_by(name_en, name_ar, email)
  `

  constructor(
    private readonly supabase: SupabaseClient,
    private readonly logger: ILoggerPort,
  ) {}

  /**
   * Find all tasks with optional filtering and pagination
   */
  async findAll(
    params: TaskFilterParams & PaginationParams = {},
  ): Promise<PaginatedResult<TaskEntity>> {
    try {
      let query = this.supabase.from(this.tableName).select(this.defaultSelect, { count: 'exact' })

      // Apply filters
      query = this.applyFilters(query, params)

      // Apply pagination
      const limit = params.limit || 50
      const offset = params.offset || 0
      query = query.range(offset, offset + limit - 1)

      // Order by priority and due date
      query = query.order('priority', { ascending: false }).order('due_date', { ascending: true })

      const { data, error, count } = await query

      if (error) {
        this.logger.error('SupabaseTaskRepository.findAll error', { error })
        throw new Error(error.message)
      }

      return {
        data: data || [],
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
      }
    } catch (error) {
      this.logger.error('SupabaseTaskRepository.findAll failed', { error })
      throw error
    }
  }

  /**
   * Find task by ID
   */
  async findById(id: string): Promise<TaskEntity | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(this.defaultSelect)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        this.logger.error('SupabaseTaskRepository.findById error', { error, id })
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      this.logger.error('SupabaseTaskRepository.findById failed', { error, id })
      throw error
    }
  }

  /**
   * Create a new task
   */
  async create(taskData: CreateTaskDTO, createdBy: string): Promise<TaskEntity> {
    try {
      const task = {
        ...taskData,
        status: 'pending',
        assigned_by: createdBy,
        dependencies: taskData.dependencies || [],
        escalation_rules: taskData.escalation_rules || [],
        comments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(task)
        .select(this.defaultSelect)
        .single()

      if (error) {
        this.logger.error('SupabaseTaskRepository.create error', { error, taskData })
        throw new Error(error.message)
      }

      this.logger.info('Task created', {
        taskId: data.id,
        createdBy,
        assignedTo: data.assigned_to,
      })

      return data
    } catch (error) {
      this.logger.error('SupabaseTaskRepository.create failed', { error })
      throw error
    }
  }

  /**
   * Update a task
   */
  async update(id: string, updates: UpdateTaskDTO, updatedBy: string): Promise<TaskEntity> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      }

      // If marking as completed, set completed_at
      if (updates.status === 'completed' && !updates.completed_at) {
        updateData.completed_at = new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select(this.defaultSelect)
        .single()

      if (error) {
        this.logger.error('SupabaseTaskRepository.update error', { error, id, updates })
        throw new Error(error.message)
      }

      this.logger.info('Task updated', {
        taskId: id,
        updatedBy,
        status: updates.status,
      })

      return data
    } catch (error) {
      this.logger.error('SupabaseTaskRepository.update failed', { error, id })
      throw error
    }
  }

  /**
   * Delete a task
   */
  async delete(id: string, deletedBy: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.from(this.tableName).delete().eq('id', id)

      if (error) {
        this.logger.error('SupabaseTaskRepository.delete error', { error, id })
        throw new Error(error.message)
      }

      this.logger.info('Task deleted', { taskId: id, deletedBy })
      return true
    } catch (error) {
      this.logger.error('SupabaseTaskRepository.delete failed', { error, id })
      throw error
    }
  }

  /**
   * Check if task exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('id')
        .eq('id', id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message)
      }

      return !!data
    } catch (error) {
      this.logger.error('SupabaseTaskRepository.exists failed', { error, id })
      throw error
    }
  }

  /**
   * Find tasks by assignee
   */
  async findByAssignee(userId: string, includeCompleted = false): Promise<TaskEntity[]> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select(this.defaultSelect)
        .eq('assigned_to', userId)

      if (!includeCompleted) {
        query = query.neq('status', 'completed')
      }

      const { data, error } = await query
        .order('priority', { ascending: false })
        .order('due_date', { ascending: true })

      if (error) {
        this.logger.error('SupabaseTaskRepository.findByAssignee error', { error, userId })
        throw new Error(error.message)
      }

      return data || []
    } catch (error) {
      this.logger.error('SupabaseTaskRepository.findByAssignee failed', { error, userId })
      throw error
    }
  }

  /**
   * Find tasks by related entity
   */
  async findByRelatedEntity(entityType: string, entityId: string): Promise<TaskEntity[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(this.defaultSelect)
        .eq('related_entity->type', entityType)
        .eq('related_entity->id', entityId)
        .order('created_at', { ascending: false })

      if (error) {
        this.logger.error('SupabaseTaskRepository.findByRelatedEntity error', {
          error,
          entityType,
          entityId,
        })
        throw new Error(error.message)
      }

      return data || []
    } catch (error) {
      this.logger.error('SupabaseTaskRepository.findByRelatedEntity failed', { error })
      throw error
    }
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(): Promise<TaskEntity[]> {
    try {
      const now = new Date().toISOString()
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(this.defaultSelect)
        .lt('due_date', now)
        .neq('status', 'completed')
        .order('due_date', { ascending: true })

      if (error) {
        this.logger.error('SupabaseTaskRepository.getOverdueTasks error', { error })
        throw new Error(error.message)
      }

      return data || []
    } catch (error) {
      this.logger.error('SupabaseTaskRepository.getOverdueTasks failed', { error })
      throw error
    }
  }

  /**
   * Get tasks due within specified days
   */
  async getTasksDueSoon(days = 7): Promise<TaskEntity[]> {
    try {
      const now = new Date()
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
      const futureDateISO = futureDate.toISOString()

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(this.defaultSelect)
        .gte('due_date', now.toISOString())
        .lte('due_date', futureDateISO)
        .neq('status', 'completed')
        .order('due_date', { ascending: true })

      if (error) {
        this.logger.error('SupabaseTaskRepository.getTasksDueSoon error', { error })
        throw new Error(error.message)
      }

      return data || []
    } catch (error) {
      this.logger.error('SupabaseTaskRepository.getTasksDueSoon failed', { error })
      throw error
    }
  }

  /**
   * Update task status
   */
  async updateStatus(
    id: string,
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled',
    updatedBy: string,
  ): Promise<TaskEntity> {
    try {
      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      }

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select(this.defaultSelect)
        .single()

      if (error) {
        this.logger.error('SupabaseTaskRepository.updateStatus error', { error, id, status })
        throw new Error(error.message)
      }

      this.logger.info('Task status updated', { taskId: id, status, updatedBy })
      return data
    } catch (error) {
      this.logger.error('SupabaseTaskRepository.updateStatus failed', { error, id })
      throw error
    }
  }

  /**
   * Add comment to task
   */
  async addComment(taskId: string, comment: { text: string }, userId: string): Promise<TaskEntity> {
    try {
      const task = await this.findById(taskId)
      if (!task) throw new Error('Task not found')

      const newComment = {
        user_id: userId,
        text: comment.text,
        created_at: new Date().toISOString(),
      }

      const updatedComments = [...task.comments, newComment]

      const { data, error } = await this.supabase
        .from(this.tableName)
        .update({
          comments: updatedComments,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select(this.defaultSelect)
        .single()

      if (error) {
        this.logger.error('SupabaseTaskRepository.addComment error', { error, taskId })
        throw new Error(error.message)
      }

      this.logger.info('Comment added to task', { taskId, userId })
      return data
    } catch (error) {
      this.logger.error('SupabaseTaskRepository.addComment failed', { error, taskId })
      throw error
    }
  }

  /**
   * Get task statistics
   */
  async getStatistics(userId?: string): Promise<TaskStatistics> {
    try {
      let query = this.supabase.from(this.tableName).select('*')

      if (userId) {
        query = query.eq('assigned_to', userId)
      }

      const { data, error } = await query

      if (error) {
        this.logger.error('SupabaseTaskRepository.getStatistics error', { error })
        throw new Error(error.message)
      }

      const tasks = data || []
      const now = new Date()
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const stats: TaskStatistics = {
        total: tasks.length,
        pending: tasks.filter((t) => t.status === 'pending').length,
        in_progress: tasks.filter((t) => t.status === 'in-progress').length,
        completed: tasks.filter((t) => t.status === 'completed').length,
        cancelled: tasks.filter((t) => t.status === 'cancelled').length,
        overdue: tasks.filter((t) => new Date(t.due_date) < now && t.status !== 'completed').length,
        due_soon: tasks.filter((t) => {
          const dueDate = new Date(t.due_date)
          return dueDate >= now && dueDate <= sevenDaysFromNow && t.status !== 'completed'
        }).length,
        by_priority: {},
        by_type: {},
      }

      // Calculate priority and type breakdowns
      tasks.forEach((task) => {
        stats.by_priority[task.priority] = (stats.by_priority[task.priority] || 0) + 1
        stats.by_type[task.type] = (stats.by_type[task.type] || 0) + 1
      })

      return stats
    } catch (error) {
      this.logger.error('SupabaseTaskRepository.getStatistics failed', { error })
      throw error
    }
  }

  /**
   * Get tasks that need escalation
   */
  async getTasksNeedingEscalation(): Promise<TaskEntity[]> {
    try {
      const now = new Date()
      const tasks = await this.getOverdueTasks()
      const tasksNeedingEscalation: TaskEntity[] = []

      for (const task of tasks) {
        const dueDate = new Date(task.due_date)
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

        for (const rule of task.escalation_rules) {
          if (daysOverdue >= rule.days_before_due) {
            tasksNeedingEscalation.push(task)
            break
          }
        }
      }

      return tasksNeedingEscalation
    } catch (error) {
      this.logger.error('SupabaseTaskRepository.getTasksNeedingEscalation failed', { error })
      throw error
    }
  }

  /**
   * Apply filters to query
   * Uses any type to avoid complex Supabase generics - filters are applied dynamically
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private applyFilters(query: any, params: TaskFilterParams): any {
    if (params.assigned_to) {
      query = query.eq('assigned_to', params.assigned_to)
    }
    if (params.assigned_by) {
      query = query.eq('assigned_by', params.assigned_by)
    }
    if (params.status) {
      query = query.eq('status', params.status)
    }
    if (params.priority) {
      query = query.eq('priority', params.priority)
    }
    if (params.type) {
      query = query.eq('type', params.type)
    }
    if (params.related_entity_type) {
      query = query.eq('related_entity->type', params.related_entity_type)
    }
    if (params.related_entity_id) {
      query = query.eq('related_entity->id', params.related_entity_id)
    }
    if (params.due_date_from) {
      query = query.gte('due_date', params.due_date_from)
    }
    if (params.due_date_to) {
      query = query.lte('due_date', params.due_date_to)
    }
    if (params.overdue) {
      const now = new Date().toISOString()
      query = query.lt('due_date', now).neq('status', 'completed')
    }
    if (params.search) {
      query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`)
    }

    return query
  }
}
