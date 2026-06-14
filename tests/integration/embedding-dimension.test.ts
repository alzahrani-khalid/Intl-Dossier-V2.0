/**
 * REMED-04: native 1024-dim embeddings, no pad/truncate corruption (Phase 68).
 *
 * The local ONNX BGE-M3 embedder emits 1024-dim vectors and ai_embeddings.embedding
 * is vector(1024). Plan 68-05 confirms the write path stores exactly 1024 dims
 * (no padding to 1536, no truncation) and seeds a persistent fixture row so this
 * suite has a live row to assert against.
 *
 * "reachable" is GREEN from the start (table exists, 0 rows). The 1024-dim
 * assertion starts RED (table is empty at plan 68-01) and flips GREEN once plan
 * 68-05 writes a verified 1024-dim row.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const EXPECTED_DIM = 1024

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

  it('every stored embedding is exactly 1024-dimensional (RED until plan 68-05 seeds a row)', async () => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return
    }
    const { data, error } = await supabaseAdmin
      .from('ai_embeddings')
      .select('id, embedding')
      .limit(50)
    expect(error, `ai_embeddings select failed: ${error?.message}`).toBeNull()

    const rows = (data ?? []) as Array<{ id: string; embedding: unknown }>
    expect(
      rows.length,
      'ai_embeddings has no rows yet (RED until plan 68-05 writes a 1024-dim fixture)',
    ).toBeGreaterThan(0)

    for (const row of rows) {
      expect(vectorLength(row.embedding), `row ${row.id} has wrong dimension`).toBe(EXPECTED_DIM)
    }
  })
})
