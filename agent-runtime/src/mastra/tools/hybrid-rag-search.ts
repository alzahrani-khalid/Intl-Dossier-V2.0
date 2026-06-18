import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { createUserClient, getAuthorization } from './_supabase.js'

export { createUserClient }

/**
 * hybrid_rag_search — STUB (typed placeholder, TODO: 72-06).
 *
 * Wraps the new `hybrid_rag_search` RPC (RRF over dense HNSW + sparse tsvector,
 * p_lang EN/AR switch) under the caller's JWT. RLS runs before rerank; the tool-layer
 * rerank (TEI cross-encoder) only sees RLS-passing candidates. 72-06 fills the body.
 * Indistinguishable-empty on no-match or above-clearance.
 */
export const hybridRagSearchTool = createTool({
  id: 'hybrid_rag_search',
  description:
    'Search the knowledge corpus the caller is cleared to see and return the most relevant passages with citations.',
  inputSchema: z.object({
    query: z.string().min(1),
    lang: z.enum(['en', 'ar']).default('en'),
    limit: z.number().int().max(50).default(10),
  }),
  outputSchema: z.object({
    results: z.array(z.unknown()),
  }),
  execute: async (_input, context) => {
    const authorization = getAuthorization(context?.requestContext ?? { get: () => undefined })
    if (!authorization) {
      return { results: [] }
    }
    // TODO: 72-06 — const sb = createUserClient(authorization)
    //   SET LOCAL hnsw.iterative_scan='relaxed_order'; then sb.rpc('hybrid_rag_search', {...})
    return { results: [] }
  },
})

export default hybridRagSearchTool
