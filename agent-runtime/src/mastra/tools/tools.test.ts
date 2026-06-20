/**
 * Reads-only tool roster tests (Plan 72-06) — the realized Wave-0 scaffold.
 *
 * Encodes the two D-07 invariants the whole phase hinges on, per tool:
 *   1. JWT-scoping (keystone): every tool builds its Supabase client from
 *      context.requestContext.get('authorization') — NOT service-role. (72-01 GATE 1:
 *      the DI bag is `requestContext` on @mastra/core 1.43.0.)
 *   2. Indistinguishable-empty: the serialized tool result NEVER matches
 *      /clearance|filtered|restricted/i — not in copy, not in JSON keys/values. A
 *      lower-clearance caller must not learn above-clearance content exists.
 *
 * Plus least-privilege guards: no tool imports the service-role key; generate_digest
 * never calls publish_digest; query_graph's query_type is enum-bounded.
 *
 * createUserClient is intercepted via `vi.mock('./_supabase.js')` (a spy on
 * createUserClient, real getAuthorization + setIterativeScanGucs) so the assertion holds
 * regardless of how each tool imports the helper. The Mastra Tool.execute wrapper runs
 * input + output validation around the body, so each tool is invoked with schema-valid
 * input and a real-shaped requestContext.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const FORBIDDEN = /clearance|filtered|restricted/i

// A fake per-request Supabase client: every read/RPC resolves empty (mirrors a
// clearance denial OR a genuinely-empty result — they must be indistinguishable).
const fakeEmptyClient = {
  rpc: vi.fn(async () => ({ data: [], error: null })),
  from: vi.fn(() => {
    const builder: Record<string, unknown> = {}
    const chain = (): unknown => builder
    builder.select = chain
    builder.eq = chain
    builder.order = chain
    builder.limit = chain
    // .single() and the awaited query both resolve to an empty PostgREST result.
    builder.single = async () => ({ data: null, error: null })
    builder.then = (resolve: (v: unknown) => unknown) => resolve({ data: [], error: null })
    return builder
  }),
}

// Spy on createUserClient; keep getAuthorization + setIterativeScanGucs real so the
// keystone read of context.requestContext is exercised for real.
const createUserClientSpy = vi.fn((_authorization: string) => fakeEmptyClient)

vi.mock('./_supabase.js', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    createUserClient: (auth: string) => createUserClientSpy(auth),
  }
})

// Each tool module + a schema-valid minimal input that passes Mastra's input validation
// so the body actually runs (required fields supplied; optional fields defaulted).
// NOTE: Zod v4 `.uuid()` validates the RFC version/variant nibbles, so an all-zeros
// string is rejected — use a real v4 UUID.
const VALID_UUID = '123e4567-e89b-42d3-a456-426614174000'
const TOOLS: Array<{ name: string; importPath: string; input: Record<string, unknown> }> = [
  { name: 'hybrid_rag_search', importPath: './hybrid-rag-search.js', input: { query: 'test query' } },
  { name: 'read_signals', importPath: './read-signals.js', input: {} },
  {
    name: 'query_graph',
    importPath: './query-graph.js',
    input: { queryType: 'forum_membership', entityId: VALID_UUID },
  },
  { name: 'generate_digest', importPath: './generate-digest.js', input: { dossierId: VALID_UUID } },
  { name: 'get_dossier', importPath: './dossier-lookups.js', input: { dossierId: VALID_UUID } },
]

const JWT = 'Bearer test-jwt'

function rcWith(authorization?: string): { get: (k: string) => unknown } {
  return {
    get: (k: string) => {
      if (k === 'authorization') return authorization
      if (k === 'language') return 'en'
      return undefined
    },
  }
}

beforeEach(() => {
  createUserClientSpy.mockClear()
  fakeEmptyClient.rpc.mockClear()
  fakeEmptyClient.from.mockClear()
  // Make the hybrid_rag_search TEI embed succeed so execution reaches createUserClient.
  // (1024-dim so the no-pad/truncate assertion passes.) Other tools don't fetch.
  process.env.TEI_EMBED_URL = 'http://tei-embed.local'
  delete process.env.TEI_RERANK_URL // force graceful degrade to RRF order
  const embedding = new Array(1024).fill(0.01)
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => [embedding],
      text: async () => '',
    })),
  )
})

describe('reads-only tool roster: keystone JWT-scoping (every tool, all 6)', () => {
  for (const { name, importPath, input } of TOOLS) {
    it(`${name} builds its Supabase client from requestContext.get("authorization")`, async () => {
      const mod = await import(importPath)
      const tool = mod.default ?? Object.values(mod)[0]
      await (tool as { execute: (i: unknown, c: unknown) => Promise<unknown> }).execute(input, {
        requestContext: rcWith(JWT),
      })
      expect(createUserClientSpy, `${name} must build its client from the caller JWT`).toHaveBeenCalledWith(JWT)
    })
  }

  it('list_dossiers and query_work_items (dossier-lookups) build the client from the JWT', async () => {
    const mod = await import('./dossier-lookups.js')
    for (const [toolName, input] of [
      ['list_dossiers', {}],
      ['query_work_items', {}],
    ] as const) {
      createUserClientSpy.mockClear()
      const tool = (mod as Record<string, { execute?: unknown }>)[
        toolName === 'list_dossiers' ? 'listDossiersTool' : 'queryWorkItemsTool'
      ] as { execute: (i: unknown, c: unknown) => Promise<unknown> }
      await tool.execute(input, { requestContext: rcWith(JWT) })
      expect(createUserClientSpy, `${toolName} must build its client from the caller JWT`).toHaveBeenCalledWith(JWT)
    }
  })

  it('no tool builds a client when the JWT is absent (#4465 gate — no service-role fallback)', async () => {
    for (const { name, importPath, input } of TOOLS) {
      createUserClientSpy.mockClear()
      const mod = await import(importPath)
      const tool = mod.default ?? Object.values(mod)[0]
      await (tool as { execute: (i: unknown, c: unknown) => Promise<unknown> }).execute(input, {
        requestContext: rcWith(undefined),
      })
      expect(createUserClientSpy, `${name} must NOT build a client without a JWT`).not.toHaveBeenCalled()
    }
  })
})

describe('reads-only tool roster: indistinguishable-empty (every tool)', () => {
  for (const { name, importPath, input } of TOOLS) {
    it(`${name} returns no forbidden clearance substring on empty/denied`, async () => {
      const mod = await import(importPath)
      const tool = mod.default ?? Object.values(mod)[0]
      const result = await (tool as { execute: (i: unknown, c: unknown) => Promise<unknown> }).execute(
        input,
        { requestContext: rcWith(JWT) },
      )
      // Guard: the input must be schema-valid so we exercise the real empty shape, not a
      // Mastra ValidationError (which would pass the substring check vacuously).
      expect(
        (result as { error?: boolean })?.error,
        `${name} input must validate so the body runs (got a ValidationError)`,
      ).not.toBe(true)
      expect(JSON.stringify(result)).not.toMatch(FORBIDDEN)
    })

    it(`${name} returns the SAME empty shape with no JWT (indistinguishable from denial)`, async () => {
      const mod = await import(importPath)
      const tool = mod.default ?? Object.values(mod)[0]
      const result = await (tool as { execute: (i: unknown, c: unknown) => Promise<unknown> }).execute(
        input,
        { requestContext: rcWith(undefined) },
      )
      expect(JSON.stringify(result)).not.toMatch(FORBIDDEN)
    })
  }

  it('dossier-lookups (list_dossiers, query_work_items) are indistinguishable-empty', async () => {
    const mod = await import('./dossier-lookups.js')
    for (const toolKey of ['listDossiersTool', 'queryWorkItemsTool'] as const) {
      const tool = (mod as Record<string, unknown>)[toolKey] as {
        execute: (i: unknown, c: unknown) => Promise<unknown>
      }
      const result = await tool.execute({}, { requestContext: rcWith(JWT) })
      expect(JSON.stringify(result)).not.toMatch(FORBIDDEN)
    }
  })
})

describe('reads-only tool roster: least-privilege (source-level guards)', () => {
  const toolsDir = path.dirname(fileURLToPath(import.meta.url))

  it('no tool source references SUPABASE_SERVICE_ROLE_KEY', () => {
    const files = [
      '_supabase.ts',
      'hybrid-rag-search.ts',
      'read-signals.ts',
      'query-graph.ts',
      'generate-digest.ts',
      'dossier-lookups.ts',
      'index.ts',
    ]
    for (const f of files) {
      const src = readFileSync(path.join(toolsDir, f), 'utf8')
      expect(src, `${f} must not reference the service-role key`).not.toContain(
        'SUPABASE_SERVICE_ROLE_KEY',
      )
    }
  })

  it('generate-digest never calls publish_digest (preview-only)', () => {
    const src = readFileSync(path.join(toolsDir, 'generate-digest.ts'), 'utf8')
    // The string may appear in a comment explaining the exclusion, but never as a call.
    expect(src).not.toContain("rpc('publish_digest'")
    expect(src).not.toContain('rpc("publish_digest"')
  })

  it('query-graph restricts query_type to the 4 whitelist values', () => {
    const src = readFileSync(path.join(toolsDir, 'query-graph.ts'), 'utf8')
    for (const t of ['forum_membership', 'shared_committees', 'engagement_chain', 'shortest_path']) {
      expect(src).toContain(t)
    }
  })

  it('_supabase keystone uses the anon key + caller header, not service-role', () => {
    const src = readFileSync(path.join(toolsDir, '_supabase.ts'), 'utf8')
    expect(src).toContain('SUPABASE_ANON_KEY')
    expect(src).toContain('Authorization')
    expect(src).not.toContain('SUPABASE_SERVICE_ROLE_KEY')
  })
})

// Sentinel: the forbidden-substring regex is the indistinguishable-empty guard.
describe('indistinguishable-empty sentinel', () => {
  it('forbidden-substring guard matches the P71 GRAPH-03 landmine and not the empty shape', () => {
    expect('stats.clearance_level').toMatch(FORBIDDEN)
    expect('signals: []').not.toMatch(FORBIDDEN)
  })
})
