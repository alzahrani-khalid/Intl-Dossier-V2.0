import { supabaseAdmin } from '../config/supabase';
import { cacheHelpers } from '../config/redis';
import { logInfo, logError } from '../utils/logger';

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: 'action' | 'review' | 'approval' | 'follow-up';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  assigned_to: string;
  assigned_by: string;
  related_entity: {
    type: 'mou' | 'activity' | 'commitment' | 'document';
    id: string;
  };
  due_date: string;
  completed_at?: string;
  dependencies: string[];
  escalation_rules: Array<{
    days_before_due: number;
    escalate_to: string;
  }>;
  comments: Array<{
    user_id: string;
    text: string;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  type: 'action' | 'review' | 'approval' | 'follow-up';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to: string;
  related_entity: {
    type: 'mou' | 'activity' | 'commitment' | 'document';
    id: string;
  };
  due_date: string;
  dependencies?: string[];
  escalation_rules?: Array<{
    days_before_due: number;
    escalate_to: string;
  }>;
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> {
  status?: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  completed_at?: string;
}

export interface TaskSearchParams {
  assigned_to?: string;
  assigned_by?: string;
  status?: string;
  priority?: string;
  type?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  due_date_from?: string;
  due_date_to?: string;
  overdue?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export class TaskService {
  private readonly cachePrefix = 'task:';
  private readonly cacheTTL = 1800; // 30 minutes

  /**
   * Get all tasks with filters
   */
  async findAll(params: TaskSearchParams = {}): Promise<{ data: Task[]; total: number }> {
    try {
      const cacheKey = `${this.cachePrefix}list:${JSON.stringify(params)}`;
      const cached = await cacheHelpers.get<{ data: Task[]; total: number }>(cacheKey);
      if (cached) return cached;

      let query = supabaseAdmin
        .from('tasks')
        .select(`
          *,
          assignee:users!assigned_to(name_en, name_ar, email),
          assigner:users!assigned_by(name_en, name_ar, email)
        `);

      // Apply filters
      if (params.assigned_to) {
        query = query.eq('assigned_to', params.assigned_to);
      }
      if (params.assigned_by) {
        query = query.eq('assigned_by', params.assigned_by);
      }
      if (params.status) {
        query = query.eq('status', params.status);
      }
      if (params.priority) {
        query = query.eq('priority', params.priority);
      }
      if (params.type) {
        query = query.eq('type', params.type);
      }
      if (params.related_entity_type) {
        query = query.eq('related_entity->type', params.related_entity_type);
      }
      if (params.related_entity_id) {
        query = query.eq('related_entity->id', params.related_entity_id);
      }
      if (params.due_date_from) {
        query = query.gte('due_date', params.due_date_from);
      }
      if (params.due_date_to) {
        query = query.lte('due_date', params.due_date_to);
      }
      if (params.overdue) {
        const now = new Date().toISOString();
        query = query.lt('due_date', now).neq('status', 'completed');
      }
      if (params.search) {
        query = query.or(`
          title.ilike.%${params.search}%,
          description.ilike.%${params.search}%
        `);
      }

      // Apply pagination
      const limit = params.limit || 50;
      const offset = params.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Order by priority and due date
      query = query.order('priority', { ascending: false })
        .order('due_date', { ascending: true });

      const { data, error, count } = await query;

      if (error) throw error;

      const result = {
        data: data || [],
        total: count || 0
      };

      await cacheHelpers.set(cacheKey, result, this.cacheTTL);
      return result;
    } catch (error) {
      logError('TaskService.findAll error', error as Error);
      throw error;
    }
  }

  /**
   * Get task by ID
   */
  async findById(id: string): Promise<Task | null> {
    try {
      const cacheKey = `${this.cachePrefix}${id}`;
      const cached = await cacheHelpers.get<Task>(cacheKey);
      if (cached) return cached;

      const { data, error } = await supabaseAdmin
        .from('tasks')
        .select(`
          *,
          assignee:users!assigned_to(name_en, name_ar, email),
          assigner:users!assigned_by(name_en, name_ar, email)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      await cacheHelpers.set(cacheKey, data, this.cacheTTL);
      return data;
    } catch (error) {
      logError('TaskService.findById error', error as Error);
      throw error;
    }
  }

  /**
   * Create new task
   */
  async create(taskData: CreateTaskDto, createdBy: string): Promise<Task> {
    try {
      const task = {
        ...taskData,
        status: 'pending',
        assigned_by: createdBy,
        dependencies: taskData.dependencies || [],
        escalation_rules: taskData.escalation_rules || [],
        comments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('tasks')
        .insert(task)
        .select(`
          *,
          assignee:users!assigned_to(name_en, name_ar, email),
          assigner:users!assigned_by(name_en, name_ar, email)
        `)
        .single();

      if (error) throw error;

      // Invalidate cache
      await cacheHelpers.del(`${this.cachePrefix}list:*`);

      logInfo('Task created', { taskId: data.id, createdBy, assignedTo: data.assigned_to });
      return data;
    } catch (error) {
      logError('TaskService.create error', error as Error);
      throw error;
    }
  }

  /**
   * Update task
   */
  async update(id: string, updates: UpdateTaskDto, updatedBy: string): Promise<Task> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // If marking as completed, set completed_at
      if (updates.status === 'completed' && !updates.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabaseAdmin
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          assignee:users!assigned_to(name_en, name_ar, email),
          assigner:users!assigned_by(name_en, name_ar, email)
        `)
        .single();

      if (error) throw error;

      // Invalidate cache
      await cacheHelpers.del([
        `${this.cachePrefix}${id}`,
        `${this.cachePrefix}list:*`
      ]);

      logInfo('Task updated', { taskId: id, updatedBy, status: updates.status });
      return data;
    } catch (error) {
      logError('TaskService.update error', error as Error);
      throw error;
    }
  }

  /**
   * Delete task
   */
  async delete(id: string, deletedBy: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Invalidate cache
      await cacheHelpers.del([
        `${this.cachePrefix}${id}`,
        `${this.cachePrefix}list:*`
      ]);

      logInfo('Task deleted', { taskId: id, deletedBy });
      return true;
    } catch (error) {
      logError('TaskService.delete error', error as Error);
      throw error;
    }
  }

  /**
   * Add comment to task
   */
  async addComment(
    taskId: string,
    comment: { text: string },
    userId: string
  ): Promise<Task> {
    try {
      const task = await this.findById(taskId);
      if (!task) throw new Error('Task not found');

      const newComment = {
        user_id: userId,
        text: comment.text,
        created_at: new Date().toISOString()
      };

      const updatedComments = [...task.comments, newComment];

      const { data, error } = await supabaseAdmin
        .from('tasks')
        .update({
          comments: updatedComments,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select(`
          *,
          assignee:users!assigned_to(name_en, name_ar, email),
          assigner:users!assigned_by(name_en, name_ar, email)
        `)
        .single();

      if (error) throw error;

      // Invalidate cache
      await cacheHelpers.del([
        `${this.cachePrefix}${taskId}`,
        `${this.cachePrefix}list:*`
      ]);

      logInfo('Comment added to task', { taskId, userId });
      return data;
    } catch (error) {
      logError('TaskService.addComment error', error as Error);
      throw error;
    }
  }

  /**
   * Get tasks assigned to user
   */
  async findByAssignee(userId: string, includeCompleted: boolean = false): Promise<Task[]> {
    try {
      let query = supabaseAdmin
        .from('tasks')
        .select(`
          *,
          assignee:users!assigned_to(name_en, name_ar, email),
          assigner:users!assigned_by(name_en, name_ar, email)
        `)
        .eq('assigned_to', userId);

      if (!includeCompleted) {
        query = query.neq('status', 'completed');
      }

      const { data, error } = await query
        .order('priority', { ascending: false })
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('TaskService.findByAssignee error', error as Error);
      throw error;
    }
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(): Promise<Task[]> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabaseAdmin
        .from('tasks')
        .select(`
          *,
          assignee:users!assigned_to(name_en, name_ar, email),
          assigner:users!assigned_by(name_en, name_ar, email)
        `)
        .lt('due_date', now)
        .neq('status', 'completed')
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('TaskService.getOverdueTasks error', error as Error);
      throw error;
    }
  }

  /**
   * Get tasks due soon (within specified days)
   */
  async getTasksDueSoon(days: number = 7): Promise<Task[]> {
    try {
      const now = new Date();
      const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
      const futureDateISO = futureDate.toISOString();

      const { data, error } = await supabaseAdmin
        .from('tasks')
        .select(`
          *,
          assignee:users!assigned_to(name_en, name_ar, email),
          assigner:users!assigned_by(name_en, name_ar, email)
        `)
        .gte('due_date', now.toISOString())
        .lte('due_date', futureDateISO)
        .neq('status', 'completed')
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('TaskService.getTasksDueSoon error', error as Error);
      throw error;
    }
  }

  /**
   * Get tasks by related entity
   */
  async findByRelatedEntity(entityType: string, entityId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('tasks')
        .select(`
          *,
          assignee:users!assigned_to(name_en, name_ar, email),
          assigner:users!assigned_by(name_en, name_ar, email)
        `)
        .eq('related_entity->type', entityType)
        .eq('related_entity->id', entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('TaskService.findByRelatedEntity error', error as Error);
      throw error;
    }
  }

  /**
   * Update task status
   */
  async updateStatus(
    id: string,
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled',
    updatedBy: string
  ): Promise<Task> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabaseAdmin
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          assignee:users!assigned_to(name_en, name_ar, email),
          assigner:users!assigned_by(name_en, name_ar, email)
        `)
        .single();

      if (error) throw error;

      // Invalidate cache
      await cacheHelpers.del([
        `${this.cachePrefix}${id}`,
        `${this.cachePrefix}list:*`
      ]);

      logInfo('Task status updated', { taskId: id, status, updatedBy });
      return data;
    } catch (error) {
      logError('TaskService.updateStatus error', error as Error);
      throw error;
    }
  }

  /**
   * Get task statistics
   */
  async getStatistics(userId?: string): Promise<{
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    overdue: number;
    due_soon: number;
    by_priority: Record<string, number>;
    by_type: Record<string, number>;
  }> {
    try {
      let query = supabaseAdmin.from('tasks').select('*');

      if (userId) {
        query = query.eq('assigned_to', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const tasks = data || [];
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

      const stats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        in_progress: tasks.filter(t => t.status === 'in-progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        cancelled: tasks.filter(t => t.status === 'cancelled').length,
        overdue: tasks.filter(t => 
          new Date(t.due_date) < now && t.status !== 'completed'
        ).length,
        due_soon: tasks.filter(t => {
          const dueDate = new Date(t.due_date);
          return dueDate >= now && dueDate <= sevenDaysFromNow && t.status !== 'completed';
        }).length,
        by_priority: {} as Record<string, number>,
        by_type: {} as Record<string, number>
      };

      // Calculate priority and type breakdowns
      tasks.forEach(task => {
        stats.by_priority[task.priority] = (stats.by_priority[task.priority] || 0) + 1;
        stats.by_type[task.type] = (stats.by_type[task.type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logError('TaskService.getStatistics error', error as Error);
      throw error;
    }
  }

  /**
   * Check for tasks that need escalation
   */
  async checkEscalations(): Promise<Task[]> {
    try {
      const now = new Date();
      const tasks = await this.getOverdueTasks();
      const tasksNeedingEscalation: Task[] = [];

      for (const task of tasks) {
        const dueDate = new Date(task.due_date);
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        for (const rule of task.escalation_rules) {
          if (daysOverdue >= rule.days_before_due) {
            tasksNeedingEscalation.push(task);
            break;
          }
        }
      }

      return tasksNeedingEscalation;
    } catch (error) {
      logError('TaskService.checkEscalations error', error as Error);
      throw error;
    }
  }
}

export default TaskService;
