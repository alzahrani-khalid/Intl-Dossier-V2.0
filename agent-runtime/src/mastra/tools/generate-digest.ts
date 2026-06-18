import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { createUserClient, getAuthorization } from './_supabase.js'

export { createUserClient }

/**
 * generate_digest (PREVIEW ONLY) — STUB (typed placeholder, TODO: 72-06).
 *
 * Wraps the P70 digest PREVIEW path under the caller's JWT. READS-ONLY: this tool
 * NEVER calls publish_digest — it only previews what a digest would contain for a
 * period the caller is cleared to see. 72-06 fills the body. Indistinguishable-empty
 * on no-content or above-clearance.
 */
export const generateDigestTool = createTool({
  id: 'generate_digest_preview',
  description:
    'Preview the digest of signals and activity the caller is cleared to see for a period (daily, weekly, or monthly). Read-only preview — never publishes.',
  inputSchema: z.object({
    period: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
    dossierId: z.string().uuid().optional(),
  }),
  outputSchema: z.object({
    sections: z.array(z.unknown()),
  }),
  execute: async (_input, context) => {
    const authorization = getAuthorization(context?.requestContext ?? { get: () => undefined })
    if (!authorization) {
      return { sections: [] }
    }
    // TODO: 72-06 — const sb = createUserClient(authorization)
    //   const { data } = await sb.rpc('generate_digest', { p_period, ... }) // PREVIEW path only
    return { sections: [] }
  },
})

export default generateDigestTool
