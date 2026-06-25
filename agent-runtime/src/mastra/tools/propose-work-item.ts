import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import * as supa from './_supabase.js'

// Re-export the keystone helper to keep the test harness uniform across the roster.
// This tool never builds a client — it only validates + echoes.
export const createUserClient = supa.createUserClient

// Canonical RFC-4122 UUID matcher used to NORMALIZE model-supplied identifiers. The model
// frequently presents placeholders ("", "CURRENT_USER_ID") or names instead of real UUIDs;
// we keep only well-formed UUIDs and drop the rest rather than hard-rejecting the call (a
// rejection yields no proposal at all, leaving "create a task for me" broken).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// The closed set of valid dossier-link inheritance sources. The model also fumbles this
// field (live evidence: it presents "none"), so — same principle as the UUID fields — we
// NORMALIZE an unknown/placeholder value to the safe default 'direct' rather than letting a
// strict enum hard-reject the whole proposal.
const INHERITANCE_SOURCES = ['direct', 'engagement', 'after_action', 'position', 'mou'] as const
const DEFAULT_INHERITANCE_SOURCE = 'direct'

/**
 * propose_work_item (GENUI-02/03, D-01/D-03) — PROPOSE-ONLY write-tool.
 *
 * The agent calls this when the user asks to CREATE a work item (task) and LINK it to
 * one or more dossiers. It accepts a bounded title + priority enum, plus a LENIENT (string)
 * assignee, dossier-id list, and inheritance source that it SELF-NORMALIZES: it keeps only
 * well-formed UUIDs / known enum values and drops or defaults everything else, then ECHOES
 * the normalized args as a structured proposal for the HITL confirmation card (73-03).
 *
 * Leniency is deliberate. The model cannot know the caller's own UUID (JWT-derived) nor a
 * dossier UUID it has not looked up, and in practice it PRESENTS placeholders ("", a name,
 * "CURRENT_USER_ID", inheritanceSource "none") rather than omitting them. A strict schema
 * HARD-REJECTS those, so the flagship "create a task for me" never produces a proposal.
 * Instead we normalize: a non-UUID assignee becomes `undefined` (the frontend defaults it
 * to the caller via resolveUid at commit — D-03), non-UUID dossier ids are filtered out,
 * and an unknown inheritance source falls back to 'direct'. It NEVER
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
    assigneeId: z
      .string()
      .optional()
      .describe('Omit to assign to the current user; never invent a UUID (non-UUIDs are ignored)'),
    priority: z
      .enum(['low', 'medium', 'high', 'urgent'])
      .optional()
      .describe('Optional priority: low, medium, high, or urgent'),
    dossierIds: z
      .array(z.string())
      .optional()
      .describe('Dossier UUIDs to link the work item to; include ONLY UUIDs from a lookup tool (non-UUIDs are ignored)'),
    inheritanceSource: z
      .string()
      .optional()
      .describe(
        'How the dossier link is derived: one of direct, engagement, after_action, position, mou (defaults to direct; unknown values are ignored)',
      ),
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
      assigneeId?: string
      priority?: 'low' | 'medium' | 'high' | 'urgent'
      dossierIds?: string[]
      inheritanceSource?: string
    }

    // NORMALIZE the model's identifiers: keep only well-formed UUIDs. A present-but-invalid
    // assigneeId ("", a name, "CURRENT_USER_ID") becomes undefined so the frontend defaults
    // the assignee to the caller (resolveUid) at commit; junk dossier ids are filtered out.
    const normalizedAssigneeId =
      typeof args.assigneeId === 'string' && UUID_RE.test(args.assigneeId.trim())
        ? args.assigneeId.trim()
        : undefined
    const normalizedDossierIds = (args.dossierIds ?? [])
      .map((id) => (typeof id === 'string' ? id.trim() : ''))
      .filter((id) => UUID_RE.test(id))
    // An unknown/placeholder inheritance source ("none", "") falls back to the safe default.
    const candidateInheritance =
      typeof args.inheritanceSource === 'string' ? args.inheritanceSource.trim() : ''
    const normalizedInheritanceSource = (INHERITANCE_SOURCES as readonly string[]).includes(
      candidateInheritance,
    )
      ? candidateInheritance
      : DEFAULT_INHERITANCE_SOURCE

    // PROPOSE-ONLY: echo the NORMALIZED args. No edge-function call, no insert. The frontend
    // commits (tasks-create + work-item-dossiers) on approval (D-03).
    return {
      proposed: true,
      action: 'work_item',
      args: {
        title: args.title,
        assigneeId: normalizedAssigneeId,
        priority: args.priority,
        dossierIds: normalizedDossierIds,
        inheritanceSource: normalizedInheritanceSource,
      },
    }
  },
})

export default proposeWorkItemTool
