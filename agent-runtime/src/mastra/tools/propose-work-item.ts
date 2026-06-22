import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import * as supa from './_supabase.js'

// Re-export the keystone helper to keep the test harness uniform across the roster.
// This tool never builds a client — it only validates + echoes.
export const createUserClient = supa.createUserClient

/**
 * propose_work_item (GENUI-02/03, D-01/D-03) — PROPOSE-ONLY write-tool.
 *
 * The agent calls this when the user asks to CREATE a work item (task) and LINK it to
 * one or more dossiers. It VALIDATES the model-supplied args (bounded title + assignee
 * UUID + priority enum + non-empty dossier-UUID array + inheritance-source enum) and
 * ECHOES them as a structured proposal for the HITL confirmation card (73-03). It NEVER
 * commits: it does not call the `tasks-create` edge function nor insert into
 * `work-item-dossiers`. The frontend approve-handler commits under the caller JWT on
 * approval (D-03).
 *
 * Work-item terminology per CLAUDE.md: `assigneeId` (the assignee), `priority` ∈
 * low|medium|high|urgent (no `critical`), `inheritanceSource` for the dossier link.
 *
 * Narrow Zod is the threat control (T-73-02-02). Indistinguishable-empty (T-73-02-03):
 * a missing caller JWT returns the neutral `{ proposed: false }` — no service-role
 * fallback, no clearance/filtered/restricted token.
 */
export const proposeWorkItemTool = createTool({
  id: 'propose_work_item',
  description:
    'Propose creating a work item (task) and linking it to one or more dossiers, for the user to confirm. Use this when the user asks to create a task, assignment, or action item. This only proposes the action — nothing is created until the user approves the confirmation card.',
  inputSchema: z.object({
    title: z.string().min(1).max(500).describe('The work item title'),
    assigneeId: z.string().uuid().describe('The UUID of the user the work item is assigned to'),
    priority: z
      .enum(['low', 'medium', 'high', 'urgent'])
      .optional()
      .describe('Optional priority: low, medium, high, or urgent'),
    dossierIds: z
      .array(z.string().uuid())
      .min(1)
      .describe('One or more dossier UUIDs to link the work item to'),
    inheritanceSource: z
      .enum(['direct', 'engagement', 'after_action', 'position', 'mou'])
      .default('direct')
      .describe('How the dossier link is derived'),
  }),
  outputSchema: z.object({
    proposed: z.boolean(),
    action: z.string().optional(),
    args: z.record(z.string(), z.unknown()).optional(),
  }),
  execute: async (input, context) => {
    // KEYSTONE (#4465 gate): require the caller JWT; an empty header surfaces the neutral
    // proposal-absent shape rather than proposing an unauthenticated write.
    const authorization = supa.getAuthorization(context?.requestContext ?? { get: () => undefined })
    if (!authorization) {
      return { proposed: false }
    }

    const args = input as {
      title: string
      assigneeId: string
      priority?: 'low' | 'medium' | 'high' | 'urgent'
      dossierIds: string[]
      inheritanceSource?: 'direct' | 'engagement' | 'after_action' | 'position' | 'mou'
    }

    // PROPOSE-ONLY: validate + echo. No edge-function call, no insert. The frontend
    // commits (tasks-create + work-item-dossiers) on approval (D-03).
    return {
      proposed: true,
      action: 'work_item',
      args: {
        title: args.title,
        assigneeId: args.assigneeId,
        priority: args.priority,
        dossierIds: args.dossierIds,
        inheritanceSource: args.inheritanceSource ?? 'direct',
      },
    }
  },
})

export default proposeWorkItemTool
