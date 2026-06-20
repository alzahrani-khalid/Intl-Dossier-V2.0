/**
 * Unit tests — Phase 72-04 re-embed backfill (AGENT-05 / AGENT-04 / D-06).
 *
 * Asserts the one-time `rag_chunks` backfill:
 *   1. embeds at bge-m3 NATIVE 1024-dim and THROWS on any other size (never
 *      pad/truncate — the retired P68 1536 corruption);
 *   2. upserts on the natural key `source_type,source_id,chunk_index`
 *      (idempotent re-run for the 72-09 seed step);
 *   3. resolves per-source `parent_dossier_id` / `source_id` correctly so the
 *      DB sync trigger can resolve clearance — sensitivity is NEVER defaulted in
 *      app code (sent NULL → trigger resolves, fail-closed NOT NULL);
 *   4. stores the embedding as a pgvector text literal.
 *
 * The TEI embed call is mocked — bge-m3 TEI is GPU-served and NOT available in
 * CI; the LIVE RUN is deferred to the 72-09 deploy gate.
 *
 * Test location note: this lives in tests/unit/ (NOT src/jobs/ as the plan's
 * files list implies) because backend/vitest.config.ts only includes
 * tests/unit/** — a test under src/ would never run. The module under test is
 * src/jobs/reembed-rag-chunks.ts.
 *
 * @see backend/src/jobs/reembed-rag-chunks.ts
 * @see backend/src/jobs/chunk-source-content.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  chunkSourceContent,
  WORDS_PER_CHUNK,
  CHUNK_OVERLAP_WORDS,
} from '../../src/jobs/chunk-source-content'

// supabaseAdmin must not be touched directly — the job takes an injected client
// in tests. Stub the module so importing it doesn't require live env vars.
vi.mock('../../src/config/supabase', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

vi.mock('../../src/utils/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}))

import { reembedRagChunks, embedChunk, EMBEDDING_DIM } from '../../src/jobs/reembed-rag-chunks'

// --- Fakes ------------------------------------------------------------------

/** A 1024-dim unit-ish vector (the correct bge-m3 size). */
function vec1024(): number[] {
  return Array.from({ length: EMBEDDING_DIM }, (_, i) => (i % 7) * 0.01)
}

/** Captured upsert payloads, keyed by source row, across all .from('rag_chunks') calls. */
interface UpsertCall {
  rows: Array<Record<string, unknown>>
  options: { onConflict?: string }
}

/**
 * Build a Supabase client stub whose .select() returns canned source rows and
 * whose .from('rag_chunks').upsert() records the payload.
 */
function makeClientStub(opts: {
  dossiers?: unknown[]
  positions?: unknown[]
  aaCommitments?: unknown[]
  upsertError?: { message: string } | null
}): { client: { from: (t: string) => unknown }; upserts: UpsertCall[] } {
  const upserts: UpsertCall[] = []

  const client = {
    from(table: string) {
      if (table === 'rag_chunks') {
        return {
          upsert(rows: Array<Record<string, unknown>>, options: { onConflict?: string }) {
            upserts.push({ rows, options })
            return Promise.resolve({ error: opts.upsertError ?? null })
          },
        }
      }

      // Source reads: a chainable builder that resolves to the canned rows.
      // dossiers/positions await .select() directly; aa_commitments chains .eq().
      const data =
        table === 'dossiers'
          ? (opts.dossiers ?? [])
          : table === 'positions'
            ? (opts.positions ?? [])
            : table === 'aa_commitments'
              ? (opts.aaCommitments ?? [])
              : []

      const result = { data, error: null }
      const builder: Record<string, unknown> = {
        select: () => builder,
        eq: () => Promise.resolve(result),
        then: (resolve: (v: typeof result) => unknown) => resolve(result),
      }
      return builder
    },
  }

  return { client, upserts }
}

const ORIGINAL_TEI = process.env.TEI_EMBED_URL

beforeEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  process.env.TEI_EMBED_URL = 'http://tei-embed:80'
})

afterEach(() => {
  if (ORIGINAL_TEI === undefined) delete process.env.TEI_EMBED_URL
  else process.env.TEI_EMBED_URL = ORIGINAL_TEI
})

// --- chunk-source-content.ts ------------------------------------------------

describe('chunkSourceContent (chunking util)', () => {
  it('returns no chunks for all-empty/nullish fields', () => {
    expect(
      chunkSourceContent([
        { lang: 'en', text: '' },
        { lang: 'ar', text: null },
        { lang: 'en', text: undefined },
        { lang: 'en', text: '   ' },
      ]),
    ).toEqual([])
  })

  it('yields one chunk for short text and tags its language', () => {
    const chunks = chunkSourceContent([{ lang: 'ar', text: 'نص عربي قصير' }])
    expect(chunks).toHaveLength(1)
    expect(chunks[0]).toMatchObject({ chunkIndex: 0, contentLang: 'ar', content: 'نص عربي قصير' })
  })

  it('assigns a contiguous global chunk_index across multiple fields', () => {
    const chunks = chunkSourceContent([
      { lang: 'en', text: 'english one' },
      { lang: 'ar', text: 'arabic two' },
    ])
    expect(chunks.map((c) => c.chunkIndex)).toEqual([0, 1])
    expect(chunks.map((c) => c.contentLang)).toEqual(['en', 'ar'])
  })

  it('windows long text with overlap and keeps indices unique', () => {
    const longText = Array.from({ length: WORDS_PER_CHUNK * 2 }, (_, i) => `w${i}`).join(' ')
    const chunks = chunkSourceContent([{ lang: 'en', text: longText }])
    expect(chunks.length).toBeGreaterThan(1)
    // Unique, contiguous indices.
    expect(new Set(chunks.map((c) => c.chunkIndex)).size).toBe(chunks.length)
    // Overlap: the start of chunk 2 repeats the tail of chunk 1.
    const firstWords = chunks[0].content.split(' ')
    const secondWords = chunks[1].content.split(' ')
    expect(secondWords[0]).toBe(firstWords[WORDS_PER_CHUNK - CHUNK_OVERLAP_WORDS])
  })
})

// --- embedChunk (TEI boundary) ----------------------------------------------

describe('embedChunk (TEI boundary)', () => {
  it('throws a clear error when TEI_EMBED_URL is unset (run deferred)', async () => {
    delete process.env.TEI_EMBED_URL
    await expect(embedChunk('hello')).rejects.toThrow(/TEI_EMBED_URL is not configured/)
  })

  it('posts to {TEI_EMBED_URL}/embed and returns the first vector', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [vec1024()],
    })
    vi.stubGlobal('fetch', fetchMock)

    const out = await embedChunk('hello world')
    expect(out).toHaveLength(EMBEDDING_DIM)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://tei-embed:80/embed')
    expect(JSON.parse((init as { body: string }).body)).toEqual({ inputs: 'hello world' })
  })

  it('throws on a non-OK TEI response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 503, text: async () => 'down' }),
    )
    await expect(embedChunk('x')).rejects.toThrow(/TEI embed failed \(503\)/)
  })
})

// --- reembedRagChunks (the backfill) ----------------------------------------

describe('reembedRagChunks (backfill)', () => {
  function stubFetch1024(): void {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [vec1024()] }))
  }

  it('embeds at 1024-dim and upserts dossier chunks with parent_dossier_id NULL', async () => {
    stubFetch1024()
    const { client, upserts } = makeClientStub({
      dossiers: [
        {
          id: 'dossier-1',
          organization_id: 'org-1',
          name_en: 'Saudi Arabia',
          name_ar: 'السعودية',
          summary_en: 'A country dossier.',
          summary_ar: 'ملف دولة.',
        },
      ],
    })

    const result = await reembedRagChunks(client as never)

    expect(result.sourcesProcessed.dossier).toBe(1)
    expect(result.chunksUpserted).toBeGreaterThan(0)

    const allRows = upserts.flatMap((u) => u.rows)
    // Every row is a 1024-dim pgvector literal, source_type=dossier, parent NULL.
    for (const row of allRows) {
      expect(row.source_type).toBe('dossier')
      expect(row.source_id).toBe('dossier-1')
      expect(row.parent_dossier_id).toBeNull() // source_id IS the dossier
      expect(row.sensitivity_level).toBeNull() // trigger resolves; never defaulted
      const literal = row.embedding as string
      expect(literal.startsWith('[') && literal.endsWith(']')).toBe(true)
      expect(literal.slice(1, -1).split(',')).toHaveLength(EMBEDDING_DIM)
    }
    // Idempotent natural-key conflict target.
    expect(upserts[0].options.onConflict).toBe('source_type,source_id,chunk_index')
  })

  it('sets parent_dossier_id to the owning dossier for positions and after_action', async () => {
    stubFetch1024()
    const { client, upserts } = makeClientStub({
      positions: [
        {
          id: 'pos-1',
          title_en: 'Position title',
          title_ar: 'عنوان الموقف',
          content_en: 'Body.',
          content_ar: 'النص.',
          rationale_en: null,
          rationale_ar: null,
          position_dossier_links: [{ dossier_id: 'dossier-9' }],
        },
      ],
      aaCommitments: [{ id: 'aa-1', description: 'Deliver the report.', dossier_id: 'dossier-7' }],
    })

    await reembedRagChunks(client as never)
    const rows = upserts.flatMap((u) => u.rows)

    const posRows = rows.filter((r) => r.source_type === 'position')
    expect(posRows.length).toBeGreaterThan(0)
    for (const r of posRows) {
      expect(r.source_id).toBe('pos-1')
      expect(r.parent_dossier_id).toBe('dossier-9') // owning dossier anchor
      expect(r.sensitivity_level).toBeNull()
    }

    const aaRows = rows.filter((r) => r.source_type === 'after_action')
    expect(aaRows.length).toBeGreaterThan(0)
    for (const r of aaRows) {
      expect(r.source_id).toBe('aa-1')
      expect(r.parent_dossier_id).toBe('dossier-7') // NOT NULL FK
      expect(r.sensitivity_level).toBeNull()
    }
  })

  it('THROWS on a wrong-dimension embedding (never pad/truncate — AGENT-05)', async () => {
    // TEI returns a 768-dim vector (wrong model) — the job must refuse.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [Array.from({ length: 768 }, () => 0.1)],
      }),
    )
    const { client } = makeClientStub({
      dossiers: [
        {
          id: 'dossier-1',
          organization_id: null,
          name_en: 'X',
          name_ar: 'س',
          summary_en: null,
          summary_ar: null,
        },
      ],
    })

    await expect(reembedRagChunks(client as never)).rejects.toThrow(
      /Expected 1024-dim embedding.*got 768.*Refusing to pad\/truncate/s,
    )
  })

  it('skips source rows with no usable text (no embed, no upsert)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [vec1024()] })
    vi.stubGlobal('fetch', fetchMock)
    const { client, upserts } = makeClientStub({
      dossiers: [
        {
          id: 'empty-dossier',
          organization_id: null,
          name_en: '',
          name_ar: null,
          summary_en: '   ',
          summary_ar: '',
        },
      ],
    })

    const result = await reembedRagChunks(client as never)
    expect(result.emptySources).toBe(1)
    expect(result.chunksUpserted).toBe(0)
    expect(upserts).toHaveLength(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('surfaces a DB upsert error instead of swallowing it', async () => {
    stubFetch1024()
    const { client } = makeClientStub({
      dossiers: [
        {
          id: 'dossier-1',
          organization_id: null,
          name_en: 'A',
          name_ar: 'أ',
          summary_en: null,
          summary_ar: null,
        },
      ],
      upsertError: { message: 'null value in column "sensitivity_level"' },
    })

    await expect(reembedRagChunks(client as never)).rejects.toThrow(/Failed to upsert/)
  })
})
