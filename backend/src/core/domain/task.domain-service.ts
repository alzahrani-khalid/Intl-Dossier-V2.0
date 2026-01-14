/**
 * Task Domain Service
 *
 * Business logic layer for task operations.
 * Uses dependency injection and ports for external dependencies.
 *
 * This service demonstrates the hexagonal architecture pattern:
 * - Depends only on port interfaces, not concrete implementations
 * - Business logic is isolated from infrastructure concerns
 * - Easy to test by mocking port implementations
 */

import type {
  ITaskRepository,
  TaskEntity,
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskFilterParams,
  TaskStatistics,
  PaginatedResult,
  PaginationParams,
} from '../ports/repositories'
import type { ICachePort, ILoggerPort } from '../ports/infrastructure'

/**
 * Task Domain Service
 *
 * Encapsulates business logic for task management.
 * Coordinates between repository (data access) and cache (performance).
 */
export class TaskDomainService {
  private readonly cachePrefix = 'task:'
  private readonly cacheTTL = 1800 // 30 minutes

  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly cache: ICachePort,
    private readonly logger: ILoggerPort,
  ) {}

  /**
   * Get all tasks with filtering and pagination
   */
  async findAll(
    params: TaskFilterParams & PaginationParams = {},
  ): Promise<PaginatedResult<TaskEntity>> {
    const operationId = this.logger.startOperation('TaskDomainService.findAll', { params })

    try {
      // Try cache first
      const cacheKey = `${this.cachePrefix}list:${this.hashParams(params)}`
      const cached = await this.cache.get<PaginatedResult<TaskEntity>>(cacheKey)

      if (cached) {
        this.logger.debug('Cache hit for task list', { cacheKey })
        this.logger.endOperation(operationId, { source: 'cache' })
        return cached
      }

      // Fetch from repository
      const result = await this.taskRepository.findAll(params)

      // Cache result
      await this.cache.set(cacheKey, result, { ttl: this.cacheTTL, tags: ['task'] })

      this.logger.endOperation(operationId, { source: 'database', count: result.data.length })
      return result
    } catch (error) {
      this.logger.error('TaskDomainService.findAll failed', { error, params })
      throw error
    }
  }

  /**
   * Get task by ID
   */
  async findById(id: string): Promise<TaskEntity | null> {
    const operationId = this.logger.startOperation('TaskDomainService.findById', { id })

    try {
      // Try cache first
      const cacheKey = `${this.cachePrefix}${id}`
      const cached = await this.cache.get<TaskEntity>(cacheKey)

      if (cached) {
        this.logger.debug('Cache hit for task', { id })
        this.logger.endOperation(operationId, { source: 'cache' })
        return cached
      }

      // Fetch from repository
      const task = await this.taskRepository.findById(id)

      if (task) {
        // Cache result
        await this.cache.set(cacheKey, task, { ttl: this.cacheTTL, tags: ['task', `task:${id}`] })
      }

      this.logger.endOperation(operationId, { source: 'database', found: !!task })
      return task
    } catch (error) {
      this.logger.error('TaskDomainService.findById failed', { error, id })
      throw error
    }
  }

  /**
   * Create a new task
   */
  async create(taskData: CreateTaskDTO, createdBy: string): Promise<TaskEntity> {
    const operationId = this.logger.startOperation('TaskDomainService.create', {
      title: taskData.title,
      createdBy,
    })

    try {
      // Validate business rules
      this.validateTaskCreation(taskData)

      // Create task
      const task = await this.taskRepository.create(taskData, createdBy)

      // Invalidate list caches
      await this.invalidateListCaches()

      this.logger.info('Task created', {
        taskId: task.id,
        createdBy,
        assignedTo: task.assigned_to,
      })

      this.logger.endOperation(operationId, { taskId: task.id })
      return task
    } catch (error) {
      this.logger.error('TaskDomainService.create failed', { error, taskData })
      throw error
    }
  }

  /**
   * Update a task
   */
  async update(id: string, updates: UpdateTaskDTO, updatedBy: string): Promise<TaskEntity> {
    const operationId = this.logger.startOperation('TaskDomainService.update', {
      id,
      updatedBy,
    })

    try {
      // Validate business rules
      this.validateTaskUpdate(updates)

      // Update task
      const task = await this.taskRepository.update(id, updates, updatedBy)

      // Invalidate caches
      await this.invalidateTaskCaches(id)

      this.logger.info('Task updated', {
        taskId: id,
        updatedBy,
        status: updates.status,
      })

      this.logger.endOperation(operationId)
      return task
    } catch (error) {
      this.logger.error('TaskDomainService.update failed', { error, id, updates })
      throw error
    }
  }

  /**
   * Delete a task
   */
  async delete(id: string, deletedBy: string): Promise<boolean> {
    const operationId = this.logger.startOperation('TaskDomainService.delete', {
      id,
      deletedBy,
    })

    try {
      const result = await this.taskRepository.delete(id, deletedBy)

      // Invalidate caches
      await this.invalidateTaskCaches(id)

      this.logger.info('Task deleted', { taskId: id, deletedBy })
      this.logger.endOperation(operationId)

      return result
    } catch (error) {
      this.logger.error('TaskDomainService.delete failed', { error, id })
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
    const operationId = this.logger.startOperation('TaskDomainService.updateStatus', {
      id,
      status,
      updatedBy,
    })

    try {
      // Validate status transition
      const currentTask = await this.findById(id)
      if (!currentTask) {
        throw new Error(`Task not found: ${id}`)
      }

      this.validateStatusTransition(currentTask.status, status)

      // Update status
      const task = await this.taskRepository.updateStatus(id, status, updatedBy)

      // Invalidate caches
      await this.invalidateTaskCaches(id)

      this.logger.info('Task status updated', { taskId: id, status, updatedBy })
      this.logger.endOperation(operationId)

      return task
    } catch (error) {
      this.logger.error('TaskDomainService.updateStatus failed', { error, id, status })
      throw error
    }
  }

  /**
   * Add comment to task
   */
  async addComment(taskId: string, comment: { text: string }, userId: string): Promise<TaskEntity> {
    const operationId = this.logger.startOperation('TaskDomainService.addComment', {
      taskId,
      userId,
    })

    try {
      // Validate comment
      if (!comment.text || comment.text.trim().length === 0) {
        throw new Error('Comment text cannot be empty')
      }

      const task = await this.taskRepository.addComment(taskId, comment, userId)

      // Invalidate caches
      await this.invalidateTaskCaches(taskId)

      this.logger.info('Comment added to task', { taskId, userId })
      this.logger.endOperation(operationId)

      return task
    } catch (error) {
      this.logger.error('TaskDomainService.addComment failed', { error, taskId })
      throw error
    }
  }

  /**
   * Get tasks by assignee
   */
  async findByAssignee(userId: string, includeCompleted = false): Promise<TaskEntity[]> {
    return this.taskRepository.findByAssignee(userId, includeCompleted)
  }

  /**
   * Get tasks by related entity
   */
  async findByRelatedEntity(entityType: string, entityId: string): Promise<TaskEntity[]> {
    return this.taskRepository.findByRelatedEntity(entityType, entityId)
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(): Promise<TaskEntity[]> {
    return this.taskRepository.getOverdueTasks()
  }

  /**
   * Get tasks due soon
   */
  async getTasksDueSoon(days = 7): Promise<TaskEntity[]> {
    return this.taskRepository.getTasksDueSoon(days)
  }

  /**
   * Get task statistics
   */
  async getStatistics(userId?: string): Promise<TaskStatistics> {
    const cacheKey = `${this.cachePrefix}stats:${userId || 'all'}`
    const cached = await this.cache.get<TaskStatistics>(cacheKey)

    if (cached) {
      return cached
    }

    const stats = await this.taskRepository.getStatistics(userId)

    // Cache for shorter period as stats change frequently
    await this.cache.set(cacheKey, stats, { ttl: 300, tags: ['task', 'task-stats'] })

    return stats
  }

  /**
   * Check for tasks needing escalation
   */
  async checkEscalations(): Promise<TaskEntity[]> {
    return this.taskRepository.getTasksNeedingEscalation()
  }

  // Private helper methods

  /**
   * Validate task creation data
   */
  private validateTaskCreation(data: CreateTaskDTO): void {
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Task title is required')
    }

    if (!data.assigned_to) {
      throw new Error('Task must be assigned to someone')
    }

    if (!data.due_date) {
      throw new Error('Task due date is required')
    }

    const dueDate = new Date(data.due_date)
    if (isNaN(dueDate.getTime())) {
      throw new Error('Invalid due date format')
    }
  }

  /**
   * Validate task update data
   */
  private validateTaskUpdate(data: UpdateTaskDTO): void {
    if (data.title !== undefined && data.title.trim().length === 0) {
      throw new Error('Task title cannot be empty')
    }

    if (data.due_date) {
      const dueDate = new Date(data.due_date)
      if (isNaN(dueDate.getTime())) {
        throw new Error('Invalid due date format')
      }
    }
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(currentStatus: string, newStatus: string): void {
    // Define allowed transitions
    const allowedTransitions: Record<string, string[]> = {
      pending: ['in-progress', 'cancelled'],
      'in-progress': ['completed', 'pending', 'cancelled'],
      completed: ['in-progress'], // Allow reopening
      cancelled: ['pending'], // Allow reactivation
    }

    const allowed = allowedTransitions[currentStatus] || []

    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid status transition from '${currentStatus}' to '${newStatus}'`)
    }
  }

  /**
   * Invalidate task-related caches
   */
  private async invalidateTaskCaches(taskId: string): Promise<void> {
    await Promise.all([
      this.cache.del(`${this.cachePrefix}${taskId}`),
      this.invalidateListCaches(),
      this.cache.invalidateByTag('task-stats'),
    ])
  }

  /**
   * Invalidate list caches
   */
  private async invalidateListCaches(): Promise<void> {
    await this.cache.delPattern(`${this.cachePrefix}list:*`)
  }

  /**
   * Hash parameters for cache key
   */
  private hashParams(params: TaskFilterParams & PaginationParams): string {
    return Buffer.from(JSON.stringify(params)).toString('base64').slice(0, 32)
  }
}
