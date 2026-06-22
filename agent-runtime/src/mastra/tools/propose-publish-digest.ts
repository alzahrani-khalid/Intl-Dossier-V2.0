import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import * as supa from './_supabase.js'

// Re-export the keystone helper so a `vi.spyOn(supaModule, 'createUserClient')` in the
// tests intercepts the (unused-here) client build, keeping the test harness uniform
// across the whole roster. This tool never builds a client — it only validates + echoes.
export const createUserClient = supa.createUserClient

/**
 * propose_publish_digest (GENUI-02/03, D-01/D-03) — PROPOSE-ONLY write-tool.
 *
 * The agent calls this when the user asks to PUBLISH a digest. It VALIDATES the
 * model-supplied args against a narrow Zod schema (UUID + enum + bounded string) and
 * ECHOES them as a structured proposal the frontend renders as a HITL confirmation
 * card (73-03). It NEVER commits server-side: it does not call the INVOKER
 * `publish_digest` RPC, nor any insert/update — the frontend approve-handler commits
 * under the caller JWT on explicit approval (D-03). The literal `publish_digest`
 * appears ONLY as the `action` label below, never as an RPC call target.
 *
 * Narrow Zod is the threat control (T-73-02-02): no arbitrary SQL/columns can reach the
 * commit path. The arg shape matches the live INVOKER RPC
 * `publish_digest(p_dossier_id uuid, p_period text, p_summary text, ...)` so 73-03's
 * commit succeeds verbatim.
 *
 * Indistinguishable-empty (T-73-02-03): a missing caller JWT returns the neutral
 * `{ proposed: false }` — no service-role fallback, no clearance/filtered/restricted token.
 */
export const proposePublishDigestTool = createTool({
  id: 'propose_publish_digest',
  description:
    'Propose publishing a digest of recent signals and activity for one dossier, for the user to confirm. Use this when the user asks to publish or send out a digest. This only proposes the action — nothing is published until the user approves the confirmation card.',
  inputSchema: z.object({
    dossierId: z.string().uuid().describe('The dossier UUID the digest is for'),
    period: z
      .enum(['daily', 'weekly', 'monthly'])
      .default('daily')
      .describe('The digest period window'),
    summary: z
      .string()
      .min(1)
      .max(4000)
      .describe('The digest summary text to publish'),
  }),
  outputSchema: z.object({
    proposed: z.boolean(),
    action: z.string().optional(),
    args: z.record(z.string(), z.unknown()).optional(),
  }),
  execute: async (input, context) => {
    // KEYSTONE (#4465 gate): the caller JWT must be present even though this tool does
    // not read — an empty header means the AG-UI bridge dropped the JWT, so surface the
    // neutral proposal-absent shape rather than proposing an unauthenticated write.
    const authorization = supa.getAuthorization(context?.requestContext ?? { get: () => undefined })
    if (!authorization) {
      return { proposed: false }
    }

    const args = input as { dossierId: string; period?: 'daily' | 'weekly' | 'monthly'; summary: string }

    // PROPOSE-ONLY: validate + echo. No RPC, no insert/update. `publish_digest` is the
    // action label, not a call target — the frontend commits on approval (D-03).
    return {
      proposed: true,
      action: 'publish_digest',
      args: {
        dossierId: args.dossierId,
        period: args.period ?? 'daily',
        summary: args.summary,
      },
    }
  },
})

export default proposePublishDigestTool
