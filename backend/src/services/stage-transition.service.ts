/**
 * Stage Transition Service - Validates and executes workflow stage transitions
 * Feature: 016-implement-kanban
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { 
  canTransitionStage, 
  calculateStageSLADeadline, 
  type WorkflowStage, 
  type UserRole 
} from '../utils/role-permissions';
import type { Database } from '../types/database';

export interface StageTransitionResult {
  success: boolean;
  assignment?: {
    id: string;
    workflow_stage: WorkflowStage;
    current_stage_sla_deadline: string | null;
    updated_at: string;
  };
  validation_error?: string;
}

export class StageTransitionService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async updateWorkflowStage(
    assignmentId: string,
    newStage: WorkflowStage,
    userId: string
  ): Promise<StageTransitionResult> {
    // Fetch current assignment and user role
    const { data: assignment, error: fetchError } = await this.supabase
      .from('assignments')
      .select('id, workflow_stage, engagement_id')
      .eq('id', assignmentId)
      .single();

    if (fetchError || !assignment) {
      throw new Error('Assignment not found');
    }

    const { data: user, error: userError } = await this.supabase
      .from('staff_profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error('User not found');
    }

    // Validate role-based transition
    const validation = canTransitionStage(
      user.role as UserRole,
      assignment.workflow_stage as WorkflowStage,
      newStage
    );

    if (!validation.allowed) {
      return {
        success: false,
        validation_error: validation.errorMessage
      };
    }

    // Calculate new stage SLA deadline
    const newSLADeadline = calculateStageSLADeadline(newStage);

    // Update assignment
    const { data: updatedAssignment, error: updateError } = await this.supabase
      .from('assignments')
      .update({
        workflow_stage: newStage,
        current_stage_sla_deadline: newSLADeadline?.toISOString() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', assignmentId)
      .select('id, workflow_stage, current_stage_sla_deadline, updated_at')
      .single();

    if (updateError) throw updateError;

    // Insert stage history record (trigger calculates duration and SLA met)
    await this.supabase.from('assignment_stage_history').insert({
      assignment_id: assignmentId,
      from_stage: assignment.workflow_stage as WorkflowStage,
      to_stage: newStage,
      transitioned_by: userId
    });

    return {
      success: true,
      assignment: {
        id: updatedAssignment.id,
        workflow_stage: updatedAssignment.workflow_stage as WorkflowStage,
        current_stage_sla_deadline: updatedAssignment.current_stage_sla_deadline,
        updated_at: updatedAssignment.updated_at
      }
    };
  }
}
