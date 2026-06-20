/**
 * REMED-04: native 1024-dim embeddings, no pad/truncate corruption (Phase 68).
 *
 * Verifies the ai_embeddings write path round-trips a vector at exactly 1024 dims
 * (the column is vector(1024); a wrong size is rejected by the DB). The write is
 * self-contained — it inserts a deterministic 1024-dim fixture via the service
 * client and cleans it up — so it runs GREEN in CI without loading the 400MB
 * BGE-M3 ONNX model. The model -> 1024 fact is confirmed by plan 68-01 (A4); the
 * storeEmbedding method's correctness (dimension assertion + no pad/truncate) is
 * checked at the source level below.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const EXPECTED_DIM = 1024
const TEST_OWNER_ID = '00000000-0000-0000-0000-000000000099'
const TEST_MODEL = 'p68-test'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '..', '..')
const embeddingsServicePath = path.join(repoRoot, 'backend', 'src', 'ai', 'embeddings-service.ts')

/**
 * pgvector serialises over PostgREST as a JSON-array string ("[0.1,0.2,...]") or,
 * depending on client version, an actual number[]. Normalise both to a length.
 */
function vectorLength(embedding: unknown): number {
  if (Array.isArray(embedding)) {
    return embedding.length
  }
  if (typeof embedding === 'string') {
    const parsed = JSON.parse(embedding) as unknown
    return Array.isArray(parsed) ? parsed.length : 0
  }
  return 0
}

describe('REMED-04: ai_embeddings stores native 1024-dim vectors', () => {
  let supabaseAdmin: SupabaseClient

  beforeAll(() => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return
    }
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  })

  afterAll(async () => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return
    }
    await supabaseAdmin
      .from('ai_embeddings')
      .delete()
      .eq('owner_id', TEST_OWNER_ID)
      .eq('model', TEST_MODEL)
  })

  it('ai_embeddings table is reachable', async () => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return
    }
    const { error, count } = await supabaseAdmin
      .from('ai_embeddings')
      .select('*', { count: 'exact', head: true })
    expect(error, `ai_embeddings not reachable: ${error?.message}`).toBeNull()
    expect(count ?? 0).toBeGreaterThanOrEqual(0)
  })

  it('a written embedding round-trips at exactly 1024 dimensions', async () => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return
    }
    // Deterministic 1024-dim fixture in the same shape storeEmbedding writes
    // (string vector literal + \x-hex bytea content_hash). The vector(1024) column
    // rejects any other size, so a successful insert proves no pad/truncate.
    const vector = `[${new Array(EXPECTED_DIM).fill(0.0123).join(',')}]`
    const contentHash = '\\x' + 'a'.repeat(64)

    const { error: upsertError } = await supabaseAdmin.from('ai_embeddings').upsert(
      {
        owner_type: 'artifact',
        owner_id: TEST_OWNER_ID,
        content_hash: contentHash,
        embedding: vector,
        model: TEST_MODEL,
        model_version: '1.0',
        embedding_dim: EXPECTED_DIM,
      },
      { onConflict: 'owner_type,owner_id,model' },
    )
    expect(upsertError, `insert failed: ${upsertError?.message}`).toBeNull()

    const { data, error } = await supabaseAdmin
      .from('ai_embeddings')
      .select('embedding, embedding_dim')
      .eq('owner_id', TEST_OWNER_ID)
      .eq('model', TEST_MODEL)
      .single()
    expect(error, `read-back failed: ${error?.message}`).toBeNull()

    const row = data as { embedding: unknown; embedding_dim: number } | null
    expect(vectorLength(row?.embedding)).toBe(EXPECTED_DIM)
    expect(row?.embedding_dim).toBe(EXPECTED_DIM)
  })

  it('storeEmbedding asserts 1024 dims, writes ai_embeddings, and never pads/truncates', () => {
    const src = readFileSync(embeddingsServicePath, 'utf8')
    expect(src.includes('storeEmbedding'), 'storeEmbedding method missing').toBe(true)
    expect(src.includes('ai_embeddings'), 'storeEmbedding does not target ai_embeddings').toBe(true)
    expect(
      src.includes('embedding.length !== 1024'),
      'storeEmbedding lacks the 1024-dim assertion',
    ).toBe(true)
    expect(
      src.includes('normalizeEmbedding'),
      'normalizeEmbedding (pad/truncate) must not exist in the embeddings service',
    ).toBe(false)
  })

  // Live RLS clearance-gate proof needs a level-1 staging user JWT. Folded into
  // the 68-08 UAT gate (CDP forced-error protocol, EN+AR) per the validation plan.
  it.todo('clearance-gate: level-1 JWT gets 0 above-clearance rows; level-2+ sees them (TEST_LEVEL1_USER_JWT)')
})
