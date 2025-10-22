/**
 * Task Contributors Service
 * Part of: 025-unified-tasks-model implementation
 *
 * Manages many-to-many relationship between tasks and contributors
 * for team collaboration tracking. Features:
 * - Add/remove contributors (soft delete with removed_at)
 * - List contributors for a task
 * - List tasks where user is a contributor
 * - RLS-aware queries (only task owners can manage contributors)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

type TaskContributor = Database['public']['Tables']['task_contributors']['Row'];
type TaskContributorInsert = Database['public']['Tables']['task_contributors']['Insert'];
type TaskContributorUpdate = Database['public']['Tables']['task_contributors']['Update'];

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AddContributorInput {
  task_id: string;
  user_id: string;
  added_by: string;
  role?: string;
}

export interface RemoveContributorInput {
  task_id: string;
  user_id: string;
  removed_by: string;
}

export class TaskContributorsService {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseClient?: SupabaseClient<Database>) {
    this.supabase = supabaseClient || supabase;
  }

  /**
   * Add a contributor to a task
   * RLS Policy: Only task assignee or creator can add contributors
   */
  async addContributor(input: AddContributorInput): Promise<TaskContributor> {
    // Check if contributor already exists (including soft-deleted)
    const { data: existing } = await this.supabase
      .from('task_contributors')
      .select('*')
      .eq('task_id', input.task_id)
      .eq('user_id', input.user_id)
      .maybeSingle();

    // If contributor was previously removed, restore them
    if (existing && existing.removed_at) {
      const { data, error } = await this.supabase
        .from('task_contributors')
        .update({
          removed_at: null,
          removed_by: null,
          role: input.role || existing.role,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to restore contributor: ${error.message}`);
      }

      return data;
    }

    // If contributor is already active, return existing record
    if (existing && !existing.removed_at) {
      return existing;
    }

    // Add new contributor
    const contributorData: TaskContributorInsert = {
      task_id: input.task_id,
      user_id: input.user_id,
      role: input.role || 'helper',
    };

    const { data, error } = await this.supabase
      .from('task_contributors')
      .insert(contributorData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add contributor: ${error.message}`);
    }

    return data;
  }

  /**
   * Remove a contributor from a task (soft delete)
   * RLS Policy: Only task assignee or creator can remove contributors
   */
  async removeContributor(input: RemoveContributorInput): Promise<void> {
    const { error } = await this.supabase
      .from('task_contributors')
      .update({
        removed_at: new Date().toISOString(),
        removed_by: input.removed_by,
      })
      .eq('task_id', input.task_id)
      .eq('user_id', input.user_id)
      .is('removed_at', null);

    if (error) {
      throw new Error(`Failed to remove contributor: ${error.message}`);
    }
  }

  /**
   * Get active contributors for a task
   */
  async getTaskContributors(taskId: string): Promise<TaskContributor[]> {
    const { data, error } = await this.supabase
      .from('task_contributors')
      .select('*')
      .eq('task_id', taskId)
      .is('removed_at', null)
      .order('added_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch task contributors: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get tasks where user is a contributor
   */
  async getContributorTasks(userId: string): Promise<TaskContributor[]> {
    const { data, error } = await this.supabase
      .from('task_contributors')
      .select('*')
      .eq('user_id', userId)
      .is('removed_at', null)
      .order('added_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch contributor tasks: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Check if user is a contributor on a task
   */
  async isContributor(taskId: string, userId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('task_contributors')
      .select('id')
      .eq('task_id', taskId)
      .eq('user_id', userId)
      .is('removed_at', null)
      .maybeSingle();

    return !!data;
  }

  /**
   * Get contributor history for a task (including removed)
   */
  async getContributorHistory(taskId: string): Promise<TaskContributor[]> {
    const { data, error } = await this.supabase
      .from('task_contributors')
      .select('*')
      .eq('task_id', taskId)
      .order('added_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch contributor history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Bulk add contributors to a task
   */
  async addMultipleContributors(
    taskId: string,
    userIds: string[],
    addedBy: string,
    role?: string
  ): Promise<TaskContributor[]> {
    const contributors: TaskContributorInsert[] = userIds.map((userId) => ({
      task_id: taskId,
      user_id: userId,
      added_by: addedBy,
      role: role || 'contributor',
    }));

    const { data, error } = await this.supabase
      .from('task_contributors')
      .insert(contributors)
      .select();

    if (error) {
      throw new Error(`Failed to add multiple contributors: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Bulk remove contributors from a task
   */
  async removeMultipleContributors(
    taskId: string,
    userIds: string[],
    removedBy: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('task_contributors')
      .update({
        removed_at: new Date().toISOString(),
        removed_by: removedBy,
      })
      .eq('task_id', taskId)
      .in('user_id', userIds)
      .is('removed_at', null);

    if (error) {
      throw new Error(`Failed to remove multiple contributors: ${error.message}`);
    }
  }

  /**
   * Get contributor count for a task
   */
  async getContributorCount(taskId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('task_contributors')
      .select('*', { count: 'exact', head: true })
      .eq('task_id', taskId)
      .is('removed_at', null);

    if (error) {
      throw new Error(`Failed to count contributors: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Replace all contributors for a task
   * Removes all existing contributors and adds new ones
   */
  async replaceContributors(
    taskId: string,
    newUserIds: string[],
    updatedBy: string,
    role?: string
  ): Promise<TaskContributor[]> {
    // Remove all existing contributors
    await this.supabase
      .from('task_contributors')
      .update({
        removed_at: new Date().toISOString(),
        removed_by: updatedBy,
      })
      .eq('task_id', taskId)
      .is('removed_at', null);

    // Add new contributors
    if (newUserIds.length === 0) {
      return [];
    }

    return this.addMultipleContributors(taskId, newUserIds, updatedBy, role);
  }
}

export const taskContributorsService = new TaskContributorsService();
