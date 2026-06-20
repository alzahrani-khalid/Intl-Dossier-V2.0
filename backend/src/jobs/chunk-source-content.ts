/**
 * Phase 72-04 (AGENT-05 / D-06) — chunking util for the re-embed backfill.
 *
 * Splits a source row's text fields into bounded, embeddable chunks for the
 * single bge-m3 1024-dim `rag_chunks` store. One small, pure, well-tested helper
 * shared by `reembed-rag-chunks.ts` across all 6 source types
 * (dossier / signal / brief / after_action / position / document).
 *
 * Chunking strategy (planner discretion per the plan): word-window chunks of
 * ~WORDS_PER_CHUNK words with a small overlap so a concept split across a
 * boundary is still retrievable from both sides. The corpus is tiny (~23 live
 * rows on staging) so this is a one-shot pass, not a throughput-tuned pipeline.
 *
 * No embedding, no DB, no I/O — this module is deterministic and unit-tested in
 * isolation. The embed + upsert (and the 1024-dim guard) live in
 * reembed-rag-chunks.ts.
 *
 * @see backend/src/jobs/reembed-rag-chunks.ts
 * @see supabase/migrations/20260618_phase72_rag_chunks.sql (rag_chunks contract)
 */

/** Target words per chunk. ~512 tokens ≈ ~380–400 EN words; kept conservative
 *  for bge-m3's 8192-token window with headroom for Arabic (denser tokens). */
export const WORDS_PER_CHUNK = 350

/** Word overlap between adjacent chunks so boundary-straddling phrases stay
 *  retrievable. Must be < WORDS_PER_CHUNK. */
export const CHUNK_OVERLAP_WORDS = 40

/**
 * One labelled text field of a source row (e.g. a dossier's English summary).
 * `lang` drives which GENERATED tsvector column the chunk feeds on the DB side
 * (content_tsv_en | content_tsv_ar) — so EN and AR text are chunked separately,
 * never concatenated across languages.
 */
export interface SourceTextField {
  readonly lang: 'en' | 'ar'
  readonly text: string | null | undefined
}

/** A single chunk ready to be embedded + inserted into rag_chunks. */
export interface ContentChunk {
  readonly chunkIndex: number
  readonly content: string
  readonly contentLang: 'en' | 'ar'
}

/** Collapse runs of whitespace and trim; returns '' for nullish/blank input. */
function normalizeWhitespace(text: string | null | undefined): string {
  if (text == null) return ''
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * Split one normalized string into ~WORDS_PER_CHUNK-word windows with
 * CHUNK_OVERLAP_WORDS overlap. Returns [] for empty input. A string shorter
 * than one window yields exactly one chunk.
 */
function windowText(text: string): string[] {
  const normalized = normalizeWhitespace(text)
  if (normalized === '') return []

  const words = normalized.split(' ')
  if (words.length <= WORDS_PER_CHUNK) return [normalized]

  const step = WORDS_PER_CHUNK - CHUNK_OVERLAP_WORDS
  const chunks: string[] = []
  for (let start = 0; start < words.length; start += step) {
    const window = words.slice(start, start + WORDS_PER_CHUNK)
    if (window.length === 0) break
    chunks.push(window.join(' '))
    // The final window reached the end — stop (avoid a trailing overlap-only chunk).
    if (start + WORDS_PER_CHUNK >= words.length) break
  }
  return chunks
}

/**
 * Chunk all text fields of a source row into a single, globally-indexed
 * `ContentChunk[]`. Fields are processed in order; `chunk_index` is contiguous
 * across the whole row (NOT reset per field) so it stays unique under the
 * rag_chunks `UNIQUE (source_type, source_id, chunk_index)` constraint.
 *
 * Blank/nullish fields contribute nothing. A row with no usable text yields [].
 */
export function chunkSourceContent(fields: ReadonlyArray<SourceTextField>): ContentChunk[] {
  const chunks: ContentChunk[] = []
  let chunkIndex = 0

  for (const field of fields) {
    for (const content of windowText(field.text ?? '')) {
      chunks.push({ chunkIndex, content, contentLang: field.lang })
      chunkIndex += 1
    }
  }

  return chunks
}
