import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import * as supa from './_supabase.js'

// Re-export the keystone helper so a `vi.spyOn(supaModule, 'createUserClient')` in the
// tests intercepts the (unused-here) client build, keeping the test harness uniform
// across the whole roster. This tool never builds a client — it only validates + echoes.
export const createUserClient = supa.createUserClient

// Lenient UUID-shape matcher (same as propose_work_item / get_dossier). Real dossier ids in
// this system include non-RFC-4122 seed ids (e.g. b0000001-…0003) that Zod's strict `.uuid()`
// rejects, so the model passing a legitimate id would hard-fail. This shape check accepts any
// UUID-shaped hex but still REJECTS names/placeholders/garbage, so the T-73-02-02 narrow-Zod
// threat control holds (a non-UUID-shaped value never produces a write proposal).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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
    dossierId: z
      .string()
      .describe('The dossier UUID the digest is for (must be a UUID from a lookup, never a name)'),
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

    // Lenient UUID-shape gate (T-73-02-02): accept any UUID-shaped id (incl. non-RFC-4122 seed
    // ids), but a name/placeholder yields the neutral proposal-absent shape — never a write.
    const dossierId = args.dossierId.trim()
    if (!UUID_RE.test(dossierId)) {
      return { proposed: false }
    }

    // PROPOSE-ONLY: validate + echo. No RPC, no insert/update. `publish_digest` is the
    // action label, not a call target — the frontend commits on approval (D-03).
    return {
      proposed: true,
      action: 'publish_digest',
      args: {
        dossierId,
        period: args.period ?? 'daily',
        summary: args.summary,
      },
    }
  },
})

export default proposePublishDigestTool
