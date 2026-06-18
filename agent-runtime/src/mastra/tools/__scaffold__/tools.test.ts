/**
 * Wave-0 tool-test SCAFFOLD (Plan 72-01) — RED until Wave 5 (Plan 72-06) lands the tools.
 *
 * These tests are SKIPPED and the file is EXCLUDED from the Wave-1 run (the
 * src/mastra/tools/__scaffold__/** glob is in vitest.config.ts `test.exclude`). They
 * exist NOW so the Nyquist sampling rate has concrete targets; they turn GREEN when
 * 72-06 implements the real tools and removes the exclude / relocates this file.
 *
 * CROSS-WAVE COMPILE SAFETY (critical): the tool modules under ../<tool> do NOT exist
 * until Wave 5. This file MUST therefore compile in Wave 1 WITHOUT them — so it uses
 * ONLY lazy dynamic `await import('../<tool>')` INSIDE the skipped test bodies (and
 * vi.mock). There is ZERO top-level static `import` of any ../<tool> module. If you add
 * one, `pnpm --filter agent-runtime test` will fail to compile between Wave 1 and Wave 5.
 *
 * Each tool, once built, MUST satisfy two invariants this scaffold encodes:
 *   1. JWT-scoping (keystone): the tool builds its Supabase client from
 *      context.requestContext.get('authorization') — NOT service-role. (Per 72-01
 *      SPIKE-FINDINGS GATE 1: the DI bag is `requestContext` on @mastra/core 1.43.0.)
 *   2. Indistinguishable-empty: the serialized tool result NEVER matches
 *      /clearance|filtered|restricted/i — not in copy, not in JSON keys/values. A
 *      lower-clearance caller must not learn above-clearance content exists.
 */
import { describe, it, expect, vi } from 'vitest'

// The reads-only tool roster 72-06 will implement (D-07). Module paths are relative to
// the LIVE tools dir this scaffold relocates into in 72-06.
const TOOL_MODULES = [
  '../hybrid-rag-search',
  '../read-signals',
  '../query-graph',
  '../generate-digest',
  '../dossier-lookups',
] as const

const FORBIDDEN = /clearance|filtered|restricted/i

describe.skip('Wave-0 scaffold: read-tool keystone + indistinguishable-empty (RED until 72-06)', () => {
  it('every tool builds a per-request client from requestContext.get("authorization")', async () => {
    for (const mod of TOOL_MODULES) {
      // LAZY dynamic import — resolves only when 72-06 has created the module.
      const toolModule = await import(/* @vite-ignore */ mod)
      const tool = toolModule.default ?? Object.values(toolModule)[0]
      expect(tool, `${mod} should export a Mastra tool`).toBeTruthy()

      // Spy a per-request client factory and assert the tool reads the JWT from
      // context.requestContext (the keystone delivery path proven in 72-01 GATE 1).
      const seen: { authorization?: string } = {}
      const fakeRc = {
        get: (k: string) => (k === 'authorization' ? 'Bearer test-jwt' : undefined),
      }
      vi.spyOn(toolModule as Record<string, unknown> as never, 'createUserClient' as never).mockImplementation(
        ((auth: string) => {
          seen.authorization = auth
          return { rpc: async () => ({ data: [], error: null }), from: () => ({ select: async () => ({ data: [], error: null }) }) }
        }) as never,
      )

      await (tool as { execute: (i: unknown, c: unknown) => Promise<unknown> }).execute(
        {},
        { requestContext: fakeRc },
      )
      expect(seen.authorization, `${mod} must build its client from the caller JWT`).toBe('Bearer test-jwt')
    }
  })

  it('no tool result serializes a forbidden clearance substring (indistinguishable-empty)', async () => {
    for (const mod of TOOL_MODULES) {
      const toolModule = await import(/* @vite-ignore */ mod)
      const tool = toolModule.default ?? Object.values(toolModule)[0]
      const fakeRc = { get: (k: string) => (k === 'authorization' ? 'Bearer low-clearance-jwt' : undefined) }

      const result = await (tool as { execute: (i: unknown, c: unknown) => Promise<unknown> }).execute(
        {},
        { requestContext: fakeRc },
      )
      const serialized = JSON.stringify(result)
      // The whole payload — copy AND JSON keys/values — must be clean.
      expect(serialized).not.toMatch(FORBIDDEN)
    }
  })
})

// A non-skipped sentinel so the file is never "empty" if it is ever un-excluded early:
// asserts the forbidden-substring regex itself is wired (cheap, no tool dependency).
describe('Wave-0 scaffold sentinel', () => {
  it('forbidden-substring guard is the indistinguishable-empty regex', () => {
    expect('stats.clearance_level').toMatch(FORBIDDEN)
    expect('signals: []').not.toMatch(FORBIDDEN)
  })
})
