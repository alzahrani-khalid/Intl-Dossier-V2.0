import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import * as supa from './_supabase.js'

// Re-export the keystone helper to keep the test harness uniform across the roster.
// This tool never builds a client — it only validates + echoes.
export const createUserClient = supa.createUserClient

// Lenient UUID-shape matcher (same as propose_work_item / get_dossier). Real signal ids in this
// system include non-RFC-4122 seed ids that Zod's strict `.uuid()` rejects, so the model passing
// a legitimate id would hard-fail. This shape check accepts any UUID-shaped hex but still REJECTS
// names/placeholders/garbage, so the T-73-02-02 narrow-Zod threat control holds.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * propose_signal_status (GENUI-02/03, D-01/D-03) — PROPOSE-ONLY write-tool.
 *
 * The agent calls this when the user asks to DISMISS or ESCALATE an intelligence
 * signal. It VALIDATES the model-supplied args (UUID + 2-value enum + bounded reason)
 * and ECHOES them as a structured proposal for the HITL confirmation card (73-03). It
 * NEVER commits: it does not UPDATE `intelligence_event`. The status mapping
 * (dismiss → 'dismissed' / escalate → 'escalated') and the D-06 actor columns are
 * applied by the frontend commit under the caller JWT on approval (D-03), not here.
 *
 * Narrow Zod is the threat control (T-73-02-02). Indistinguishable-empty (T-73-02-03):
 * a missing caller JWT returns the neutral `{ proposed: false }` — no service-role
 * fallback, no clearance/filtered/restricted token.
 */
export const proposeSignalStatusTool = createTool({
  id: 'propose_signal_status',
  description:
    'Propose dismissing or escalating an intelligence signal, for the user to confirm. Use this when the user asks to dismiss or escalate a signal. This only proposes the action — the signal status is not changed until the user approves the confirmation card.',
  inputSchema: z.object({
    signalId: z
      .string()
      .describe('The intelligence signal UUID to act on (must be a UUID from a lookup, never a name)'),
    action: z
      .enum(['dismiss', 'escalate'])
      .describe('Whether to dismiss or escalate the signal'),
    reason: z
      .string()
      .max(500)
      .optional()
      .describe('Optional short reason for the status change'),
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

    const args = input as { signalId: string; action: 'dismiss' | 'escalate'; reason?: string }

    // Lenient UUID-shape gate (T-73-02-02): accept any UUID-shaped id (incl. non-RFC-4122 seed
    // ids), but a name/placeholder yields the neutral proposal-absent shape — never a write.
    const signalId = args.signalId.trim()
    if (!UUID_RE.test(signalId)) {
      return { proposed: false }
    }

    // PROPOSE-ONLY: validate + echo. No UPDATE. The frontend commits on approval (D-03).
    return {
      proposed: true,
      action: 'signal_status',
      args: {
        signalId,
        action: args.action,
        reason: args.reason,
      },
    }
  },
})

export default proposeSignalStatusTool
