/**
 * Role-based permission utilities for workflow stage transitions
 * Feature: 016-implement-kanban
 */

export type WorkflowStage = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
export type UserRole = 'staff' | 'manager' | 'admin';

export interface TransitionValidation {
  allowed: boolean;
  errorMessage?: string;
}

/**
 * Validates if a user can transition an assignment from one stage to another
 * based on their role.
 *
 * Rules:
 * - All roles can cancel (any stage → cancelled)
 * - Managers and admins can skip stages
 * - Staff must follow sequential flow: todo → in_progress → review → done
 */
export function canTransitionStage(
  userRole: UserRole,
  fromStage: WorkflowStage,
  toStage: WorkflowStage
): TransitionValidation {
  // All roles can cancel
  if (toStage === 'cancelled') {
    return { allowed: true };
  }

  // Cannot move from done or cancelled
  if (fromStage === 'done' || fromStage === 'cancelled') {
    return {
      allowed: false,
      errorMessage: `Cannot move assignments from '${fromStage}' stage`
    };
  }

  // Managers and admins can skip stages
  if (userRole === 'manager' || userRole === 'admin') {
    return { allowed: true };
  }

  // Staff must follow sequential flow
  const sequentialTransitions: Record<WorkflowStage, WorkflowStage[]> = {
    'todo': ['in_progress'],
    'in_progress': ['review'],
    'review': ['done'],
    'done': [],
    'cancelled': []
  };

  const allowedNextStages = sequentialTransitions[fromStage] || [];

  if (!allowedNextStages.includes(toStage)) {
    return {
      allowed: false,
      errorMessage: `Staff members must move assignments through stages sequentially. Cannot skip from '${fromStage}' to '${toStage}'.`
    };
  }

  return { allowed: true };
}

/**
 * Get the SLA deadline for a specific workflow stage (in hours).
 */
export function getStageSLAHours(stage: WorkflowStage): number | null {
  const slaHours: Record<WorkflowStage, number | null> = {
    'todo': 24,
    'in_progress': 48,
    'review': 12,
    'done': null,
    'cancelled': null
  };

  return slaHours[stage];
}

/**
 * Calculate the new stage SLA deadline based on the current time and stage.
 */
export function calculateStageSLADeadline(stage: WorkflowStage): Date | null {
  const hours = getStageSLAHours(stage);
  if (hours === null) return null;

  return new Date(Date.now() + hours * 3600000);
}
