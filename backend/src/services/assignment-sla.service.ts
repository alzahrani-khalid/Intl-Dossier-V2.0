/**
 * T041: Assignment SLA Service
 * Handles SLA deadline calculation and status checking for assignments
 * (Separate from intake ticket SLA service)
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

type WorkItemType = Database['public']['Enums']['work_item_type'];
type PriorityLevel = Database['public']['Enums']['priority_level'];

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Calculate SLA deadline for a work item assignment
 * @param workItemType - Type of work item (dossier, ticket, position, task)
 * @param priority - Priority level (urgent, high, normal, low)
 * @param assignedAt - When the assignment was created
 * @returns Deadline timestamp
 */
export async function calculateSLADeadline(
  workItemType: WorkItemType,
  priority: PriorityLevel,
  assignedAt: Date
): Promise<Date> {
  // Lookup deadline hours from sla_configs
  const { data: config, error } = await supabase
    .from('sla_configs')
    .select('deadline_hours')
    .eq('work_item_type', workItemType)
    .eq('priority', priority)
    .single();

  if (error || !config) {
    console.warn(
      `No SLA config found for ${workItemType}/${priority}, defaulting to 48 hours`,
      error
    );
    // Default to 48 hours if no config found
    return new Date(assignedAt.getTime() + 48 * 60 * 60 * 1000);
  }

  // Calculate deadline: assigned_at + deadline_hours
  const deadlineMs = assignedAt.getTime() + (Number(config.deadline_hours) * 60 * 60 * 1000);
  return new Date(deadlineMs);
}

/**
 * Get SLA status based on deadline and current time
 * @param deadline - SLA deadline
 * @param assignedAt - When assignment was created
 * @returns 'ok' | 'warning' | 'breached'
 */
export function getSLAStatus(
  deadline: Date,
  assignedAt: Date
): 'ok' | 'warning' | 'breached' {
  const now = Date.now();
  const deadlineTime = deadline.getTime();
  const assignedTime = assignedAt.getTime();

  if (now >= deadlineTime) {
    return 'breached';
  }

  const totalDuration = deadlineTime - assignedTime;
  const elapsed = now - assignedTime;
  const elapsedPercent = elapsed / totalDuration;

  if (elapsedPercent >= 0.75) {
    return 'warning'; // 75% threshold
  }

  return 'ok';
}

/**
 * Get remaining time in seconds
 * @param deadline - SLA deadline
 * @returns Seconds remaining (negative if breached)
 */
export function getRemainingTime(deadline: Date): number {
  const now = Date.now();
  const deadlineTime = deadline.getTime();
  return Math.floor((deadlineTime - now) / 1000);
}
