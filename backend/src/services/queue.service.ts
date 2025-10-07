/**
 * T042: Queue Service
 * Manages assignment queue (enqueue, dequeue, process)
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

type QueueEntry = Database['public']['Tables']['assignment_queue']['Row'];
type WorkItemType = Database['public']['Enums']['work_item_type'];
type PriorityLevel = Database['public']['Enums']['priority_level'];

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Add work item to assignment queue
 */
export async function enqueueWorkItem(params: {
  workItemId: string;
  workItemType: WorkItemType;
  requiredSkills: string[];
  targetUnitId?: string;
  priority: PriorityLevel;
  reason: string;
}): Promise<QueueEntry> {
  const { data, error } = await supabase
    .from('assignment_queue')
    .insert({
      work_item_id: params.workItemId,
      work_item_type: params.workItemType,
      required_skills: params.requiredSkills,
      target_unit_id: params.targetUnitId || null,
      priority: params.priority,
      notes: params.reason,
      attempts: 0,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to enqueue work item: ${error.message}`);
  }

  console.log(`✓ Work item ${params.workItemId} queued (priority: ${params.priority})`);
  return data;
}

/**
 * Remove work item from queue
 */
export async function dequeueWorkItem(queueId: string): Promise<void> {
  const { error } = await supabase
    .from('assignment_queue')
    .delete()
    .eq('id', queueId);

  if (error) {
    throw new Error(`Failed to dequeue work item: ${error.message}`);
  }

  console.log(`✓ Queue entry ${queueId} removed`);
}

/**
 * Process assignment queue for a unit
 * Attempts to assign queued items when capacity becomes available
 *
 * @param unitId - Organizational unit with freed capacity
 * @param freedSkills - Skills of staff member who freed capacity
 * @returns Array of successfully assigned items
 */
export async function processQueue(
  unitId: string,
  freedSkills: string[]
): Promise<QueueEntry[]> {
  // Get queued items that match freed skills
  // Order by priority DESC, created_at ASC (FIFO within priority)
  const { data: queuedItems, error } = await supabase
    .from('assignment_queue')
    .select('*')
    .contains('required_skills', freedSkills) // Skills overlap
    .or(`target_unit_id.eq.${unitId},target_unit_id.is.null`) // Unit match or any unit
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(10); // Process up to 10 items per invocation

  if (error) {
    console.error('Error fetching queue:', error);
    return [];
  }

  if (!queuedItems || queuedItems.length === 0) {
    console.log('✓ Queue empty, nothing to process');
    return [];
  }

  console.log(`Processing ${queuedItems.length} queued items for unit ${unitId}`);

  const assignedItems: QueueEntry[] = [];

  // Process items sequentially (to avoid race conditions)
  for (const item of queuedItems) {
    try {
      // Attempt assignment will be implemented in auto-assignment.service.ts (T040)
      // For now, just log
      console.log(`  - Processing queue item ${item.id} (${item.work_item_type})`);

      // Increment attempt count
      await supabase
        .from('assignment_queue')
        .update({
          attempts: item.attempts + 1,
          last_attempt_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      assignedItems.push(item);
    } catch (err) {
      console.error(`Failed to process queue item ${item.id}:`, err);
      // Continue with next item
    }
  }

  return assignedItems;
}

/**
 * Get queue position for a work item
 */
export async function getQueuePosition(workItemId: string): Promise<number | null> {
  const { data: item } = await supabase
    .from('assignment_queue')
    .select('created_at, priority')
    .eq('work_item_id', workItemId)
    .single();

  if (!item) return null;

  // Count items with higher priority or same priority but earlier created_at
  const { count } = await supabase
    .from('assignment_queue')
    .select('*', { count: 'exact', head: true })
    .or(
      `priority.gt.${item.priority},` +
      `and(priority.eq.${item.priority},created_at.lt.${item.created_at})`
    );

  return (count || 0) + 1; // Position is 1-indexed
}
