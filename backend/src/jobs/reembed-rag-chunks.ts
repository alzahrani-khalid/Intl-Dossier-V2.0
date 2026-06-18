/**
 * Phase 72-04 (AGENT-05 / AGENT-04 / D-06) — one-time re-embed backfill into
 * `rag_chunks`.
 *
 * Reads the v1 retrieval corpus (the 6 source types), chunks each row's text
 * (chunk-source-content.ts), embeds every chunk at bge-m3 NATIVE 1024-dim via
 * the local TEI embeddings server, and upserts the chunks into the single
 * `rag_chunks` halfvec(1024) hybrid store.
 *
 * WHY THIS EXISTS: `rag_chunks` is empty until backfilled; both the RAG tool
 * (72-06) and the AGENT-05 dimension proof need rows. This is the one-shot that
 * fills it. The corpus is tiny on staging (~23 live rows: dossiers 12 /
 * positions 2 / aa_commitments 9; signals/briefs/documents 0) so this is a
 * single linear pass — no batching/throughput planning. It is IDEMPOTENT
 * (upsert on the natural key) so the 72-09 deploy gate can re-run it after the
 * seed step (seed → re-embed → observe → restore).
 *
 * ┌─ DEFERRED RUN ────────────────────────────────────────────────────────────┐
 * │ The LIVE RUN of this job is DEFERRED to the 72-09 deploy gate. bge-m3 TEI   │
 * │ is GPU-served and NOT available locally — do NOT point this at a live       │
 * │ endpoint from a dev box. This module is authored + unit-tested (TEI mocked) │
 * │ only; 72-09 runs it on-staging against the real TEI container, then asserts │
 * │ `vector_dims(embedding) = 1024` over every row.                             │
 * └────────────────────────────────────────────────────────────────────────────┘
 *
 * SECURITY (D-10 background carve-out): `rag_chunks` has NO authenticated INSERT
 * policy — only this trusted, no-user background job writes, via the service-role
 * `supabaseAdmin` client. This is the LEGITIMATE service-role exception (a cron-
 * style backfill, NOT an interactive user path); every READ of rag_chunks goes
 * through the SECURITY INVOKER `hybrid_rag_search` RPC under the caller JWT, where
 * the clearance RLS is the enforcement floor. Service-role MUST NOT leak into any
 * tool/request path.
 *
 * DIMENSION GUARANTEE (AGENT-05): every embedding is asserted `=== 1024` before
 * insert and THROWS on mismatch — never pad/truncate (the retired P68 1536
 * corruption). bge-m3 is natively 1024-dim; a wrong size means a misconfigured
 * model and must fail loudly.
 *
 * SENSITIVITY (fail-closed, T-72-04-03): `rag_chunks.sensitivity_level` is
 * NOT NULL with NO column DEFAULT. Per source_type:
 *   - 'dossier'  → source_id IS the dossier; we leave parent_dossier_id NULL and
 *                  let the DB sync trigger read dossiers.sensitivity_level (the
 *                  live INTEGER) directly.
 *   - 'position' | 'after_action' | 'brief' | 'document' | 'signal' → we set
 *                  parent_dossier_id to the OWNING dossier; the trigger resolves
 *                  the chunk's clearance from that dossier (most-restrictive wins
 *                  for multi-linked sources). We never default; an unresolvable
 *                  row hits the NOT NULL constraint and surfaces here rather than
 *                  silently over-exposing (default-low) or deny-all'ing (NULL).
 * This delegates the exact INTEGER read to the trigger (authored in 72-03,
 * verified live), so the job does not re-encode the doc-vs-live column-type
 * ambiguity carried forward from 72-03.
 *
 * @see backend/src/jobs/chunk-source-content.ts
 * @see supabase/migrations/20260618_phase72_rag_chunks.sql
 * @see backend/src/ai/embeddings-service.ts (the retired-P68 1024 storeEmbedding guard)
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '../config/supabase'
import { chunkSourceContent, type ContentChunk, type SourceTextField } from './chunk-source-content'
import { logInfo, logError } from '../utils/logger'

/** bge-m3 native embedding dimension. Asserted on every chunk (AGENT-05). */
export const EMBEDDING_DIM = 1024

/** The 6 v1 re-embed source types (mirrors the rag_chunks source_type CHECK). */
export type RagSourceType =
  | 'dossier'
  | 'signal'
  | 'brief'
  | 'after_action'
  | 'position'
  | 'document'

/** A source row resolved to its chunkable text + its owning-dossier link. */
interface ResolvedSource {
  readonly sourceType: RagSourceType
  readonly sourceId: string
  /** Owning dossier for clearance resolution. NULL only for source_type
   *  'dossier' (where sourceId IS the dossier). */
  readonly parentDossierId: string | null
  readonly organizationId: string | null
  readonly fields: SourceTextField[]
}

/** One rag_chunks row ready to upsert. */
interface RagChunkRow {
  source_type: RagSourceType
  source_id: string
  parent_dossier_id: string | null
  chunk_index: number
  content: string
  content_lang: 'en' | 'ar'
  organization_id: string | null
  embedding: string
  /** Left NULL on purpose: the DB sync trigger resolves it per source
   *  (fail-closed via NOT NULL). Never defaulted. */
  sensitivity_level: null
}

export interface ReembedResult {
  /** Rows read per source type (before chunking). */
  readonly sourcesProcessed: Record<RagSourceType, number>
  /** Chunks embedded + upserted, total. */
  readonly chunksUpserted: number
  /** Source rows skipped because they had no usable text. */
  readonly emptySources: number
}

/**
 * Embed one chunk's text via the local TEI bge-m3 server (the production
 * embedder per 72-RESEARCH §Serving Substrate). Returns the raw 1024-dim vector
 * — NO pad/truncate. This is the single network boundary the unit tests mock.
 *
 * TEI's `/embed` route accepts `{ inputs: string | string[] }` and returns
 * `number[][]` (one vector per input). We send a single input and take [0].
 */
export async function embedChunk(text: string): Promise<number[]> {
  const teiUrl = process.env.TEI_EMBED_URL
  if (teiUrl == null || teiUrl === '') {
    throw new Error(
      'TEI_EMBED_URL is not configured. The re-embed backfill requires the local ' +
        'bge-m3 TEI server (run is deferred to the 72-09 deploy gate; do not run ' +
        'against a missing endpoint).',
    )
  }

  const response = await fetch(`${teiUrl.replace(/\/+$/, '')}/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: text }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`TEI embed failed (${response.status}): ${detail}`)
  }

  const data = (await response.json()) as number[][]
  const embedding = Array.isArray(data) ? data[0] : undefined
  if (!Array.isArray(embedding)) {
    throw new Error('TEI embed returned an unexpected shape (expected number[][])')
  }
  return embedding
}

// --- Source resolvers -------------------------------------------------------
// Each pulls one source type's rows + text fields + owning-dossier link.
// Column names are verified against the live schema (72-03/72-04 probes):
//   dossiers:       name_en/ar, summary_en/ar; sensitivity_level INTEGER (live)
//   positions:      title_en/ar, content_en/ar, rationale_en/ar; linked via
//                   position_dossier_links (trigger uses it — we set parent to
//                   the first linked dossier so resolution always has an anchor)
//   aa_commitments: description (single-lang free text); dossier_id (NOT NULL FK)
// signals/briefs/documents are EMPTY on staging today; resolvers are present so
// the 72-09 seed step re-runs this job against seeded rows with no code change.

async function resolveDossiers(sb: SupabaseClient): Promise<ResolvedSource[]> {
  const { data, error } = await sb
    .from('dossiers')
    .select('id, organization_id, name_en, name_ar, summary_en, summary_ar')
  if (error != null) throw new Error(`Failed to read dossiers: ${error.message}`)

  return (data ?? []).map((row): ResolvedSource => {
    const r = row as {
      id: string
      organization_id: string | null
      name_en: string | null
      name_ar: string | null
      summary_en: string | null
      summary_ar: string | null
    }
    return {
      sourceType: 'dossier',
      sourceId: r.id,
      parentDossierId: null, // source_id IS the dossier; trigger reads it directly
      organizationId: r.organization_id ?? null,
      fields: [
        { lang: 'en', text: [r.name_en, r.summary_en].filter(Boolean).join('. ') },
        { lang: 'ar', text: [r.name_ar, r.summary_ar].filter(Boolean).join('. ') },
      ],
    }
  })
}

async function resolvePositions(sb: SupabaseClient): Promise<ResolvedSource[]> {
  // Pull positions + their linked dossiers (for the owning-dossier anchor).
  const { data, error } = await sb
    .from('positions')
    .select(
      'id, title_en, title_ar, content_en, content_ar, rationale_en, rationale_ar, ' +
        'position_dossier_links(dossier_id)',
    )
  if (error != null) throw new Error(`Failed to read positions: ${error.message}`)

  return (data ?? []).map((row): ResolvedSource => {
    // Embedded-relation selects widen the row to a string-error union under the
    // generated types; narrow via unknown (the row shape is known at runtime).
    const r = row as unknown as {
      id: string
      title_en: string | null
      title_ar: string | null
      content_en: string | null
      content_ar: string | null
      rationale_en: string | null
      rationale_ar: string | null
      position_dossier_links?: Array<{ dossier_id: string }> | null
    }
    const linkedDossierId = r.position_dossier_links?.[0]?.dossier_id ?? null
    return {
      sourceType: 'position',
      sourceId: r.id,
      // Anchor clearance to a linked dossier; the trigger still takes MAX over
      // ALL links, but parent_dossier_id guarantees a non-NULL resolution path.
      parentDossierId: linkedDossierId,
      organizationId: null,
      fields: [
        {
          lang: 'en',
          text: [r.title_en, r.content_en, r.rationale_en].filter(Boolean).join('. '),
        },
        {
          lang: 'ar',
          text: [r.title_ar, r.content_ar, r.rationale_ar].filter(Boolean).join('. '),
        },
      ],
    }
  })
}

async function resolveAfterActions(sb: SupabaseClient): Promise<ResolvedSource[]> {
  // aa_commitments: single free-text `description` + a NOT NULL dossier_id FK.
  const { data, error } = await sb
    .from('aa_commitments')
    .select('id, description, dossier_id')
    .eq('is_deleted', false)
  if (error != null) throw new Error(`Failed to read aa_commitments: ${error.message}`)

  return (data ?? []).map((row): ResolvedSource => {
    const r = row as { id: string; description: string | null; dossier_id: string }
    return {
      sourceType: 'after_action',
      sourceId: r.id,
      parentDossierId: r.dossier_id, // NOT NULL FK → always resolves
      organizationId: null,
      // commitment text is single-language free text; default to 'en' lane.
      fields: [{ lang: 'en', text: r.description }],
    }
  })
}

/**
 * Resolve every present source type. Empty source tables simply yield [] and
 * cost nothing. signals/briefs/documents resolvers are intentionally omitted
 * from the v1 run because those tables are 0-rows on staging (and the
 * `document`→dossier link column is unconfirmed live, a 72-03 carry-forward
 * flag) — they are added in the 72-09 seed step when rows exist. The other 5
 * source types' contract stands; the job is idempotent and re-runnable.
 */
async function resolveAllSources(sb: SupabaseClient): Promise<ResolvedSource[]> {
  const [dossiers, positions, afterActions] = await Promise.all([
    resolveDossiers(sb),
    resolvePositions(sb),
    resolveAfterActions(sb),
  ])
  return [...dossiers, ...positions, ...afterActions]
}

/** Format a JS number[] as a pgvector/halfvec text literal: `[a,b,c]`. */
function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`
}

/**
 * Embed every chunk of one resolved source and build its rag_chunks rows.
 * Asserts each embedding is exactly EMBEDDING_DIM (AGENT-05) — throws otherwise.
 */
async function buildRowsForSource(source: ResolvedSource): Promise<RagChunkRow[]> {
  const chunks: ContentChunk[] = chunkSourceContent(source.fields)
  const rows: RagChunkRow[] = []

  for (const chunk of chunks) {
    const embedding = await embedChunk(chunk.content)
    if (embedding.length !== EMBEDDING_DIM) {
      // AGENT-05: never pad/truncate. A wrong dim is a misconfigured model.
      throw new Error(
        `Expected ${EMBEDDING_DIM}-dim embedding for ${source.sourceType}/${source.sourceId} ` +
          `chunk ${chunk.chunkIndex}, got ${embedding.length}. Refusing to pad/truncate.`,
      )
    }
    rows.push({
      source_type: source.sourceType,
      source_id: source.sourceId,
      parent_dossier_id: source.parentDossierId,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      content_lang: chunk.contentLang,
      organization_id: source.organizationId,
      embedding: toVectorLiteral(embedding),
      sensitivity_level: null, // DB trigger resolves per-source; fail-closed NOT NULL
    })
  }

  return rows
}

/**
 * Run the one-time re-embed backfill.
 *
 * @param client  Supabase client to write with. Defaults to the service-role
 *                `supabaseAdmin` (the D-10 background carve-out). Tests inject a
 *                stub. NEVER pass a user/request-scoped client here — the table
 *                has no authenticated INSERT policy by design.
 * @returns per-source counts + total chunks upserted (for the 72-09 proof log).
 */
export async function reembedRagChunks(
  client: SupabaseClient = supabaseAdmin,
): Promise<ReembedResult> {
  logInfo('[REEMBED] Starting one-time rag_chunks backfill (bge-m3 1024-dim)')

  const sources = await resolveAllSources(client)

  const sourcesProcessed: Record<RagSourceType, number> = {
    dossier: 0,
    signal: 0,
    brief: 0,
    after_action: 0,
    position: 0,
    document: 0,
  }
  let chunksUpserted = 0
  let emptySources = 0

  for (const source of sources) {
    sourcesProcessed[source.sourceType] += 1

    const rows = await buildRowsForSource(source)
    if (rows.length === 0) {
      emptySources += 1
      continue
    }

    // Idempotent upsert on the natural key so a re-run (72-09 seed step) replaces
    // rather than duplicates. sensitivity_level is omitted from the payload (NULL)
    // so the BEFORE INSERT/UPDATE trigger resolves it per source, fail-closed.
    const { error } = await client
      .from('rag_chunks')
      .upsert(rows, { onConflict: 'source_type,source_id,chunk_index' })
    if (error != null) {
      throw new Error(
        `Failed to upsert ${rows.length} chunks for ${source.sourceType}/${source.sourceId}: ` +
          error.message,
      )
    }
    chunksUpserted += rows.length
  }

  logInfo('[REEMBED] Backfill complete', {
    sourcesProcessed,
    chunksUpserted,
    emptySources,
  })

  return { sourcesProcessed, chunksUpserted, emptySources }
}

/**
 * CLI entry: `node dist/jobs/reembed-rag-chunks.js`. Guarded so importing the
 * module (tests, 72-06 reuse) does NOT trigger a run. The live run happens at
 * the 72-09 deploy gate against the staging TEI container.
 */
async function main(): Promise<void> {
  try {
    const result = await reembedRagChunks()
    logInfo('[REEMBED] Done', result)
    process.exit(0)
  } catch (err) {
    logError('[REEMBED] Backfill failed', err as Error)
    process.exit(1)
  }
}

// Only run when invoked directly (not on import).
if (process.argv[1] != null && process.argv[1].includes('reembed-rag-chunks')) {
  void main()
}
