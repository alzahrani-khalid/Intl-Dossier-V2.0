/**
 * Task Creation Service (T050)
 * User Story 1: Quick After-Action Creation
 *
 * Purpose: Create task records from commitments when after-action is published
 * Links tasks to after-action and parent dossier for timeline integration
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import { Commitment } from '../types/after-action.types';
import logger from '../utils/logger';

type Task = Database['public']['Tables']['tasks']['Insert'];
type TaskRow = Database['public']['Tables']['tasks']['Row'];

export interface TaskCreationParams {
  afterActionId: string;
  dossierId: string;
  commitments: Commitment[];
  createdBy: string;
}

export interface TaskCreationResult {
  success: boolean;
  tasksCreated: number;
  taskIds: string[];
  errors: string[];
}

export class TaskCreationService {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  /**
   * Create tasks from commitments after after-action is published
   * Implements business rules:
   * - One task per commitment
   * - Tasks inherit metadata from commitment (owner, due date, priority)
   * - Tasks linked to both after-action and dossier for timeline integration
   * - Tasks start in "pending" status
   * - Task titles use commitment descriptions (bilingual)
   */
  async createTasksFromCommitments(
    params: TaskCreationParams
  ): Promise<TaskCreationResult> {
    const { afterActionId, dossierId, commitments, createdBy } = params;

    const result: TaskCreationResult = {
      success: true,
      tasksCreated: 0,
      taskIds: [],
      errors: [],
    };

    logger.info('Starting task creation from commitments', {
      afterActionId,
      dossierId,
      commitmentCount: commitments.length,
      createdBy,
    });

    // Validate inputs
    if (!afterActionId || !dossierId || !createdBy) {
      const error = 'Missing required parameters: afterActionId, dossierId, or createdBy';
      logger.error(error);
      result.success = false;
      result.errors.push(error);
      return result;
    }

    if (!commitments || commitments.length === 0) {
      logger.warn('No commitments provided - no tasks to create', { afterActionId });
      return result;
    }

    // Create tasks in transaction
    try {
      for (const commitment of commitments) {
        try {
          const task = await this.createTaskFromCommitment(
            commitment,
            afterActionId,
            dossierId,
            createdBy
          );

          if (task) {
            result.tasksCreated++;
            result.taskIds.push(task.id);
            logger.info('Task created successfully', {
              taskId: task.id,
              commitmentId: commitment.id,
              owner: commitment.owner_type === 'internal'
                ? commitment.internal_owner_id
                : commitment.external_contact_id,
            });
          }
        } catch (error) {
          const errorMsg = `Failed to create task for commitment ${commitment.id}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`;
          logger.error(errorMsg, { commitmentId: commitment.id, error });
          result.errors.push(errorMsg);
          result.success = false;
        }
      }

      logger.info('Task creation completed', {
        afterActionId,
        tasksCreated: result.tasksCreated,
        totalCommitments: commitments.length,
        errors: result.errors.length,
      });

      return result;
    } catch (error) {
      const errorMsg = `Task creation failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      logger.error(errorMsg, { afterActionId, error });
      result.success = false;
      result.errors.push(errorMsg);
      return result;
    }
  }

  /**
   * Create a single task from a commitment
   * Maps commitment properties to task schema
   */
  private async createTaskFromCommitment(
    commitment: Commitment,
    afterActionId: string,
    dossierId: string,
    createdBy: string
  ): Promise<TaskRow | null> {
    // Determine task owner (internal user ID or external contact ID)
    let assigneeUserId: string | null = null;
    let externalContactId: string | null = null;

    if (commitment.owner_type === 'internal' && commitment.internal_owner_id) {
      assigneeUserId = commitment.internal_owner_id;
    } else if (commitment.owner_type === 'external' && commitment.external_contact_id) {
      externalContactId = commitment.external_contact_id;
    } else {
      logger.warn('Commitment has no valid owner - creating unassigned task', {
        commitmentId: commitment.id,
        ownerType: commitment.owner_type,
      });
    }

    // Build task record
    const taskData: Task = {
      title: commitment.description_en,
      title_ar: commitment.description_ar || null,
      description: `Task created from commitment in after-action record`,
      description_ar: `مهمة تم إنشاؤها من التزام في سجل الإجراءات اللاحقة`,

      // Link to dossier and after-action
      dossier_id: dossierId,
      related_after_action_id: afterActionId,
      related_commitment_id: commitment.id,

      // Assignment
      assigned_to: assigneeUserId,
      external_assignee_id: externalContactId,
      created_by: createdBy,

      // Timing
      due_date: commitment.due_date,

      // Status
      status: 'pending',
      priority: commitment.priority || 'medium',

      // Metadata
      task_type: 'commitment',
      tags: ['after-action', 'commitment'],

      // Timestamps handled by database default
    };

    // Insert task
    const { data, error } = await this.supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (error) {
      logger.error('Failed to insert task', {
        commitmentId: commitment.id,
        error: error.message,
      });
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      logger.error('Task insert returned no data', { commitmentId: commitment.id });
      throw new Error('Task insert returned no data');
    }

    return data;
  }

  /**
   * Update task status when commitment status changes
   * Maintains synchronization between commitments and tasks
   */
  async updateTaskStatusFromCommitment(
    commitmentId: string,
    newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  ): Promise<boolean> {
    logger.info('Updating task status from commitment', {
      commitmentId,
      newStatus,
    });

    try {
      const { error } = await this.supabase
        .from('tasks')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
        })
        .eq('related_commitment_id', commitmentId);

      if (error) {
        logger.error('Failed to update task status', {
          commitmentId,
          error: error.message,
        });
        return false;
      }

      logger.info('Task status updated successfully', {
        commitmentId,
        newStatus,
      });
      return true;
    } catch (error) {
      logger.error('Error updating task status', {
        commitmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Get tasks created from a specific after-action
   * Used for displaying linked tasks in after-action view
   */
  async getTasksByAfterAction(afterActionId: string): Promise<TaskRow[]> {
    logger.info('Fetching tasks for after-action', { afterActionId });

    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('related_after_action_id', afterActionId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch tasks', {
          afterActionId,
          error: error.message,
        });
        throw new Error(`Database error: ${error.message}`);
      }

      logger.info('Tasks fetched successfully', {
        afterActionId,
        taskCount: data?.length || 0,
      });

      return data || [];
    } catch (error) {
      logger.error('Error fetching tasks', {
        afterActionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Delete tasks when after-action is deleted (draft only)
   * Cascades deletion to maintain referential integrity
   */
  async deleteTasksByAfterAction(afterActionId: string): Promise<boolean> {
    logger.info('Deleting tasks for after-action', { afterActionId });

    try {
      const { error } = await this.supabase
        .from('tasks')
        .delete()
        .eq('related_after_action_id', afterActionId);

      if (error) {
        logger.error('Failed to delete tasks', {
          afterActionId,
          error: error.message,
        });
        return false;
      }

      logger.info('Tasks deleted successfully', { afterActionId });
      return true;
    } catch (error) {
      logger.error('Error deleting tasks', {
        afterActionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}

// Export singleton instance for use across application
export const createTaskCreationService = (
  supabaseUrl: string,
  supabaseKey: string
): TaskCreationService => {
  return new TaskCreationService(supabaseUrl, supabaseKey);
};
