/**
 * useSignalEscalate — 3-step escalation orchestrator (Phase 69, Wave 2).
 *
 * Escalates a signal into a tracked Kanban task (D-11), all under the caller's JWT
 * (RLS-enforced, never the service-role client):
 *   1. tasks-create edge fn   → creates the task (workflow_stage='todo', priority from severity)
 *   2. work-item-dossiers edge fn → copies the signal's dossier links onto the new task
 *   3. intelligence_event UPDATE  → status='escalated' + escalated_task_id=<task.id> (bidirectional link)
 *
 * Step ordering matters: work_item_dossiers INSERT RLS gates on tasks.created_by =
 * auth.uid(), so the link copy must run immediately after the task is created by the
 * same caller. work_item_type is the literal 'task' (compile-time const) — any other
 * value silently fails the work_item_dossiers INSERT RLS and links are never created.
 *
 * @module domains/signals/hooks/useSignalEscalate
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { type EscalateSignalInput, signalKeys } from '../types/signal.types'

export function useSignalEscalate(): UseMutationResult<
  { taskId: string },
  Error,
  EscalateSignalInput
> {
  const queryClient = useQueryClient()

  return useMutation<{ taskId: string }, Error, EscalateSignalInput>({
    mutationFn: async (input: EscalateSignalInput): Promise<{ taskId: string }> => {
      // Compile-time assertion — never pass a variable string here (silent-RLS pitfall).
      const workItemType = 'task' as const

      // Step 1 — create the task (tasks-create requires assignee_id; the dialog pre-fills self).
      const { data: taskData, error: taskError } = await supabase.functions.invoke<{
        task: { id: string }
      }>('tasks-create', {
        body: {
          title: input.title,
          description: input.body,
          priority: input.priority,
          workflow_stage: 'todo',
          assignee_id: input.assigneeId,
          ...(input.slaDeadline ? { sla_deadline: input.slaDeadline } : {}),
        },
      })
      if (taskError) throw new Error(taskError.message || 'Task creation failed')
      if (!taskData?.task?.id) throw new Error('No task ID returned')

      const taskId = taskData.task.id

      // Step 2 — copy the signal's dossier links onto the task (warn-only; task already exists).
      if (input.dossierIds.length > 0) {
        const { error: linkError } = await supabase.functions.invoke('work-item-dossiers', {
          body: {
            work_item_type: workItemType,
            work_item_id: taskId,
            dossier_ids: input.dossierIds,
            inheritance_source: 'direct',
          },
        })
        if (linkError) {
          console.warn('Dossier link copy failed (task created):', linkError.message)
        }
      }

      // Step 3 — flip signal status + bidirectional link (the contract; throws on failure).
      const { error: updateError } = await supabase
        .from('intelligence_event')
        .update({ status: 'escalated', escalated_task_id: taskId })
        .eq('id', input.signalId)
      if (updateError) throw new Error(updateError.message || 'Signal status update failed')

      return { taskId }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: signalKeys.lists() })
    },
    onError: (error: Error) => {
      console.error('Escalation failed:', error.message)
    },
  })
}
