/**
 * Task Repository Port
 *
 * Defines the contract for task data access operations.
 * This port is implemented by adapters (e.g., Supabase, in-memory for tests).
 */

import type { IBaseRepository } from './base.repository.port'

/**
 * Task entity interface representing a task in the domain
 */
export interface TaskEntity {
  id: string
  title: string
  description?: string
  type: 'action' | 'review' | 'approval' | 'follow-up'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  assigned_to: string
  assigned_by: string
  related_entity: {
    type: 'mou' | 'activity' | 'commitment' | 'document'
    id: string
  }
  due_date: string
  completed_at?: string
  dependencies: string[]
  escalation_rules: TaskEscalationRule[]
  comments: TaskComment[]
  created_at: string
  updated_at: string
  // Joined data (optional, populated by repository)
  assignee?: {
    name_en: string
    name_ar: string
    email: string
  }
  assigner?: {
    name_en: string
    name_ar: string
    email: string
  }
}

/**
 * Task escalation rule
 */
export interface TaskEscalationRule {
  days_before_due: number
  escalate_to: string
}

/**
 * Task comment
 */
export interface TaskComment {
  user_id: string
  text: string
  created_at: string
}

/**
 * DTO for creating tasks
 */
export interface CreateTaskDTO {
  title: string
  description?: string
  type: 'action' | 'review' | 'approval' | 'follow-up'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assigned_to: string
  related_entity: {
    type: 'mou' | 'activity' | 'commitment' | 'document'
    id: string
  }
  due_date: string
  dependencies?: string[]
  escalation_rules?: TaskEscalationRule[]
}

/**
 * DTO for updating tasks
 */
export interface UpdateTaskDTO extends Partial<CreateTaskDTO> {
  status?: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  completed_at?: string
}

/**
 * Search/filter parameters for tasks
 */
export interface TaskFilterParams {
  assigned_to?: string
  assigned_by?: string
  status?: string
  priority?: string
  type?: string
  related_entity_type?: string
  related_entity_id?: string
  due_date_from?: string
  due_date_to?: string
  overdue?: boolean
  search?: string
}

/**
 * Task statistics structure
 */
export interface TaskStatistics {
  total: number
  pending: number
  in_progress: number
  completed: number
  cancelled: number
  overdue: number
  due_soon: number
  by_priority: Record<string, number>
  by_type: Record<string, number>
}

/**
 * Task Repository Port
 *
 * Contract for task data access. Implementations can use
 * Supabase, PostgreSQL directly, or in-memory for testing.
 */
export interface ITaskRepository
  extends IBaseRepository<TaskEntity, CreateTaskDTO, UpdateTaskDTO, TaskFilterParams> {
  /**
   * Find tasks by assignee
   */
  findByAssignee(userId: string, includeCompleted?: boolean): Promise<TaskEntity[]>

  /**
   * Find tasks by related entity
   */
  findByRelatedEntity(entityType: string, entityId: string): Promise<TaskEntity[]>

  /**
   * Get overdue tasks
   */
  getOverdueTasks(): Promise<TaskEntity[]>

  /**
   * Get tasks due within specified days
   */
  getTasksDueSoon(days: number): Promise<TaskEntity[]>

  /**
   * Update task status
   */
  updateStatus(
    id: string,
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled',
    updatedBy: string,
  ): Promise<TaskEntity>

  /**
   * Add comment to task
   */
  addComment(taskId: string, comment: { text: string }, userId: string): Promise<TaskEntity>

  /**
   * Get task statistics
   */
  getStatistics(userId?: string): Promise<TaskStatistics>

  /**
   * Get tasks that need escalation
   */
  getTasksNeedingEscalation(): Promise<TaskEntity[]>
}
