import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import * as supa from './_supabase.js'

// Re-export the keystone helper; the body calls `supa.createUserClient(...)` so the
// tests' `vi.mock('./_supabase.js')` intercepts every client build.
export const createUserClient = supa.createUserClient

const EMBEDDING_DIM = 1024 // bge-m3 native; the RPC param is halfvec(1024). Never pad/truncate.
const DEFAULT_CANDIDATES = 50 // candidates the RPC hands to the reranker (p_limit)
const DEFAULT_TOP_K = 8 // rows kept AFTER rerank (the model's working set)

// A candidate row as returned by the hybrid_rag_search RPC (RLS-passing only).
interface RagCandidate {
  chunk_id: string
  source_type: string
  source_id: string
  content: string
  sensitivity_level: number
  rrf_score: number
}

// A reranked passage handed back to the model (matches the outputSchema element).
interface RagResult {
  chunkId: string
  sourceType: string
  sourceId: string
  content: string
  score: number
}

// The neutral empty result — identical for no-match, above-clearance, missing JWT, or
// any error. No clearance/filtered/restricted field anywhere.
const EMPTY_RESULTS: { results: RagResult[] } = { results: [] }

/**
 * Embed the query text to a 1024-dim bge-m3 vector via the config-driven TEI `/embed`
 * route (mirrors backend/src/jobs/reembed-rag-chunks.ts `embedChunk`). The corpus was
 * embedded with the SAME model, so the query MUST use it too or cosine distance is
 * meaningless. Throws on a wrong dim — never pad/truncate (AGENT-05).
 */
async function embedQuery(text: string): Promise<number[]> {
  const teiUrl = process.env.TEI_EMBED_URL
  if (teiUrl == null || teiUrl === '') {
    throw new Error('TEI_EMBED_URL is not configured')
  }
  const response = await fetch(`${teiUrl.replace(/\/+$/, '')}/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: text }),
  })
  if (!response.ok) {
    throw new Error(`TEI embed failed (${response.status})`)
  }
  const data = (await response.json()) as number[][]
  const embedding = Array.isArray(data) ? data[0] : undefined
  if (!Array.isArray(embedding)) {
    throw new Error('TEI embed returned an unexpected shape (expected number[][])')
  }
  if (embedding.length !== EMBEDDING_DIM) {
    throw new Error(`Expected ${EMBEDDING_DIM}-dim query embedding, got ${embedding.length}`)
  }
  return embedding
}

/** Format a JS number[] as a pgvector/halfvec text literal: `[a,b,c]`. */
function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`
}

/**
 * Rerank the RLS-passing candidates with the TEI cross-encoder (bge-reranker-v2-m3) via
 * the config-driven `/rerank` route, then keep the top-k. RLS-BEFORE-RERANK: the reranker
 * only ever sees candidates the RPC already cleared, so it cannot widen clearance.
 *
 * Degrades gracefully: if TEI_RERANK_URL is unset or the call fails, returns the
 * candidates in their existing RRF order (the RPC already ranks them), truncated to topK.
 *
 * TEI `/rerank` contract: POST { query, texts: string[] } -> [{ index, score }] (sorted).
 * Parsed defensively to tolerate a bare array or a { results: [...] } wrapper.
 */
async function rerankCandidates(
  query: string,
  candidates: RagCandidate[],
  topK: number,
): Promise<RagCandidate[]> {
  const teiUrl = process.env.TEI_RERANK_URL
  if (teiUrl == null || teiUrl === '' || candidates.length === 0) {
    return candidates.slice(0, topK)
  }
  try {
    const response = await fetch(`${teiUrl.replace(/\/+$/, '')}/rerank`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, texts: candidates.map((c) => c.content) }),
    })
    if (!response.ok) {
      return candidates.slice(0, topK)
    }
    const raw = (await response.json()) as
      | Array<{ index: number; score: number }>
      | { results: Array<{ index: number; score: number }> }
    const ranked = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : null
    if (ranked == null) {
      return candidates.slice(0, topK)
    }
    // Map reranker indices back to candidates (descending score), drop out-of-range
    // indices defensively, keep top-k.
    return ranked
      .filter((r) => typeof r.index === 'number' && r.index >= 0 && r.index < candidates.length)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((r) => candidates[r.index] as RagCandidate)
  } catch {
    return candidates.slice(0, topK)
  }
}

/**
 * hybrid_rag_search (D-07, AGENT-04) — the single RAG retrieval tool.
 *
 * Flow (RLS-before-rerank):
 *   1. embed the query via TEI bge-m3 (1024-dim) — same model as the corpus.
 *   2. on the caller-JWT client, enable pgvector iterative scans so the dense HNSW scan
 *      doesn't collapse recall after the RLS post-filter (Pitfall 4).
 *   3. call hybrid_rag_search (SECURITY INVOKER, RRF k=60 over dense+sparse) — RLS runs
 *      inside the RPC under the caller JWT, so only cleared candidates come back.
 *   4. rerank those cleared candidates with the TEI cross-encoder and keep the top-k.
 *
 * The reranker NEVER sees above-clearance rows because step 3 already filtered them.
 * Indistinguishable-empty: every failure/empty path returns `{ results: [] }` with no
 * clearance/filtered/restricted field (sensitivity_level is carried on each row as the
 * clearance scale VALUE, used by the AGENT-03 invoker proof, not a redaction label).
 */
export const hybridRagSearchTool = createTool({
  id: 'hybrid_rag_search',
  description:
    'Search the knowledge corpus the caller is cleared to see (dossiers, signals, briefs, positions, after-actions, documents) and return the most relevant passages with their source ids for citation.',
  inputSchema: z.object({
    query: z.string().min(1).describe('The natural-language search query'),
    lang: z
      .enum(['en', 'ar'])
      .default('en')
      .describe('Query language — selects the English or Arabic full-text config'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(20)
      .default(DEFAULT_TOP_K)
      .describe('Max passages to return after reranking'),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        chunkId: z.string(),
        sourceType: z.string(),
        sourceId: z.string(),
        content: z.string(),
        score: z.number(),
      }),
    ),
  }),
  execute: async (input, context) => {
    const authorization = supa.getAuthorization(context?.requestContext ?? { get: () => undefined })
    if (!authorization) {
      return { ...EMPTY_RESULTS }
    }

    const args = input as { query: string; lang?: 'en' | 'ar'; limit?: number }
    const lang = args.lang ?? 'en'
    const topK = args.limit ?? DEFAULT_TOP_K

    try {
      // 1. Embed the query (same bge-m3 model as the corpus).
      const embedding = await embedQuery(args.query)

      // 2. Per-request JWT client + iterative-scan GUCs (best-effort recall tuning).
      const sb = supa.createUserClient(authorization)
      await supa.setIterativeScanGucs(sb)

      // 3. Hybrid RRF retrieval under the caller JWT (RLS filters inside the RPC).
      const { data, error } = await sb.rpc('hybrid_rag_search', {
        p_query_embedding: toVectorLiteral(embedding),
        p_query_text: args.query,
        p_lang: lang,
        p_limit: DEFAULT_CANDIDATES,
      })
      if (error || data == null) {
        return { ...EMPTY_RESULTS }
      }
      const candidates = (data as RagCandidate[]) ?? []
      if (candidates.length === 0) {
        return { ...EMPTY_RESULTS }
      }

      // 4. Rerank the ALREADY-cleared candidates (rerank-after-RLS), keep top-k.
      const top = await rerankCandidates(args.query, candidates, topK)

      return {
        results: top.map((c) => ({
          chunkId: c.chunk_id,
          sourceType: c.source_type,
          sourceId: c.source_id,
          content: c.content,
          score: c.rrf_score,
        })),
      }
    } catch {
      return { ...EMPTY_RESULTS }
    }
  },
})

export default hybridRagSearchTool
