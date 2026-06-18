import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { createUserClient, getAuthorization } from './_supabase.js'

// Re-export so the Wave-0 scaffold's `vi.spyOn(toolModule, 'createUserClient')`
// resolves against this module (keystone contract). 72-06 keeps this export.
export { createUserClient }

/**
 * read_signals — STUB (typed placeholder, TODO: 72-06).
 *
 * Wraps the P69 `read_signals(p_dossier_id, p_status, p_since, p_limit)` RPC under
 * the caller's JWT (SECURITY INVOKER + inline clearance). 72-06 fills the body with
 * the `sb.rpc('read_signals', {...})` call. The stub returns indistinguishable-empty
 * (no clearance/filtered/restricted substring anywhere) so type-check + the scaffold
 * contract hold before the real tool lands.
 */
export const readSignalsTool = createTool({
  id: 'read_signals',
  description:
    'Read intelligence signals the caller is cleared to see, optionally scoped to a dossier, status, or time window.',
  inputSchema: z.object({
    dossierId: z.string().uuid().optional(),
    status: z.string().optional(),
    since: z.string().optional(),
    limit: z.number().int().max(100).default(50),
  }),
  outputSchema: z.object({
    signals: z.array(z.unknown()),
  }),
  execute: async (_input, context) => {
    // KEYSTONE: build the client from the caller JWT (requestContext), never service-role.
    const authorization = getAuthorization(context?.requestContext ?? { get: () => undefined })
    if (!authorization) {
      // #4465 gate: the bridge dropped the JWT. Surface empty rather than escalate.
      return { signals: [] }
    }
    // TODO: 72-06 — const sb = createUserClient(authorization)
    //   const { data } = await sb.rpc('read_signals', { p_dossier_id, p_status, p_since, p_limit })
    //   return { signals: data ?? [] }
    return { signals: [] }
  },
})

export default readSignalsTool
