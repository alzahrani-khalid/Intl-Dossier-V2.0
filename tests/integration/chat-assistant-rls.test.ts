/**
 * REMED-03: chat-assistant runs under the caller's JWT, not supabaseAdmin (Phase 68).
 *
 * Plan 68-04 retires `supabaseAdmin` from backend/src/ai/agents/chat-assistant.ts:
 * all 5 tool functions must query through a JWT-scoped client so the assistant can
 * never read above-clearance content. The caller's Bearer token threads in via
 * ChatRequest.authHeader.
 *
 * These checks are static (no DB): a grep over the agents directory and a source
 * read. They start RED (supabaseAdmin still imported; ChatRequest has no
 * authHeader) and flip GREEN after plan 68-04.
 */
import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '..', '..')
const chatAssistantPath = path.join(repoRoot, 'backend', 'src', 'ai', 'agents', 'chat-assistant.ts')

describe('REMED-03: chat-assistant has no supabaseAdmin', () => {
  // Scope: REMED-03 / D-08 retires supabaseAdmin from the INTERACTIVE assistant
  // (chat-assistant.ts). brief-generator.ts and intake-linker.ts are separate
  // background agents and are out of scope for this phase (tracked as a follow-up).
  it('chat-assistant.ts contains no supabaseAdmin reference', () => {
    let found = true
    try {
      // grep exits 0 when a match is found, 1 when none. We want NO matches.
      execSync('grep "supabaseAdmin" backend/src/ai/agents/chat-assistant.ts', {
        cwd: repoRoot,
        stdio: 'pipe',
      })
    } catch {
      found = false
    }
    expect(
      found,
      'supabaseAdmin is still present in chat-assistant.ts (RED until plan 68-04)',
    ).toBe(false)
  })

  it('ChatRequest threads the caller JWT via an authHeader field', () => {
    const source = fs.readFileSync(chatAssistantPath, 'utf8')
    expect(
      source.includes('authHeader'),
      'ChatRequest has no authHeader field yet (RED until plan 68-04)',
    ).toBe(true)
  })
})
