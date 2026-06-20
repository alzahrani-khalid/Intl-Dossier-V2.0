/**
 * Unit tests — intake-linker.ts JWT keystone (Phase 72-07 / D-10)
 *
 * Asserts every Supabase op in the intake-linker agent runs under the CALLER's
 * JWT (per-request anon-key client + forwarded Authorization header) so RLS
 * applies — NOT under service-role `supabaseAdmin`.
 *
 * Call-graph note: `proposeLinks` is invoked ONLY from the authenticated
 * POST /api/ai/intake/:ticketId/propose-links endpoint (verified — there is no
 * queue/worker/cron caller). The `ai_entity_link_proposals` write (the site the
 * plan flagged as a *possible* cron carve-out) therefore runs synchronously
 * inside the authenticated request and is user-triggered: it too must be
 * caller-scoped, NOT a service-role carve-out.
 *
 * @see backend/src/ai/agents/intake-linker.ts
 * @see backend/src/api/ai/intake-linking.ts (the sole caller)
 * @see backend/src/ai/agents/chat-assistant.ts (createUserClient, line 24)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// --- Mocks -----------------------------------------------------------------

const createClientMock = vi.fn()
vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}))

// Service-role admin client — if any agent op touches it, RLS is bypassed.
const adminFrom = vi.fn()
vi.mock('../../src/config/supabase', () => ({
  supabaseAdmin: { from: adminFrom },
}))

// Mastra config — no-op the agent registration so construction succeeds.
vi.mock('../../src/ai/mastra-config', () => ({
  defineAgent: vi.fn(),
  createAgentTools: vi.fn(() => []),
}))

// Semantic search — return no results so the agent falls through to the
// JWT-scoped dossier/person searches.
vi.mock('../../src/services/semantic-search.service', () => ({
  SemanticSearchService: class {
    async search(): Promise<{ results: unknown[] }> {
      return { results: [] }
    }
  },
}))

// LLM router — return a JSON suggestion that maps to a real search result so a
// proposal is produced and saveProposals (the L452 write) runs.
vi.mock('../../src/ai/llm-router', () => ({
  llmRouter: {
    chat: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        summary: 'A ticket',
        suggestions: [
          {
            entityType: 'dossier',
            entityId: 'dossier-1',
            entityName: 'Test Dossier',
            confidenceScore: 90,
            justification: 'Direct match',
          },
        ],
      }),
      runId: 'run-1',
    }),
  },
}))

vi.mock('../../src/utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const ANON_KEY = 'anon-test-key'
const SERVICE_KEY = 'service-role-test-key'
const AUTH_HEADER = 'Bearer caller-jwt-token'

// A chainable query-builder stub. `.single()` resolves reads; a terminal
// `.insert(...)`/`.update(...)`/`.limit(...)`/`.or(...)` is awaited directly via
// the thenable. Row shape is generic — each table read returns the same stub.
function makeQueryBuilder(rows: unknown[]): Record<string, unknown> {
  const result = { data: rows, error: null }
  const single = { data: rows[0] ?? null, error: null }
  const qb: Record<string, unknown> = {}
  qb.select = vi.fn(() => qb)
  qb.eq = vi.fn(() => qb)
  qb.or = vi.fn(() => qb)
  qb.limit = vi.fn(() => qb)
  // insert/update return the same chainable stub so every terminal shape
  // resolves: .insert(...).select('id').single() (createRunRecord),
  // .insert(...) awaited directly (saveProposals), .update(...).eq(...) awaited
  // (updateRunStatus).
  qb.insert = vi.fn(() => qb)
  qb.update = vi.fn(() => qb)
  qb.single = vi.fn().mockResolvedValue(single)
  // Terminal awaited reads/writes resolve via the thenable
  // (.or(...).limit(...), bare .insert(...), .update(...).eq(...)).
  qb.then = (resolve: (v: typeof result) => void) => resolve(result)
  return qb
}

function fromRouter(): (table: string) => Record<string, unknown> {
  return (table: string) => {
    if (table === 'intake_tickets') {
      return makeQueryBuilder([
        { id: 'ticket-1', subject: 'Subject', description: 'Body', metadata: {} },
      ])
    }
    if (table === 'dossiers') {
      return makeQueryBuilder([
        { id: 'dossier-1', name_en: 'Test Dossier', overview_en: 'o', dossier_type: 'country' },
      ])
    }
    if (table === 'persons') {
      return makeQueryBuilder([])
    }
    if (table === 'ai_runs') {
      return makeQueryBuilder([{ id: 'run-1' }])
    }
    // ai_entity_link_proposals (the L452 write) + any other
    return makeQueryBuilder([])
  }
}

describe('intake-linker JWT keystone (D-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_ANON_KEY = ANON_KEY
    process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_KEY
    createClientMock.mockImplementation(() => ({ from: fromRouter() }))
  })

  it('threads the caller JWT and builds a per-request anon-key client (RLS-scoped)', async () => {
    const { intakeLinkerAgent } = await import('../../src/ai/agents/intake-linker')

    await intakeLinkerAgent.proposeLinks({
      intakeTicketId: 'ticket-1',
      organizationId: 'org-1',
      userId: 'user-1',
      language: 'en',
      authHeader: AUTH_HEADER,
    })

    expect(createClientMock).toHaveBeenCalled()
    const keystoneCall = createClientMock.mock.calls.find((call) => call[1] === ANON_KEY)
    expect(keystoneCall, 'expected a createClient(url, ANON_KEY, …) call').toBeTruthy()
    const opts = keystoneCall?.[2] as { global?: { headers?: Record<string, string> } }
    expect(opts?.global?.headers?.Authorization).toBe(AUTH_HEADER)

    const serviceRoleCall = createClientMock.mock.calls.find((call) => call[1] === SERVICE_KEY)
    expect(serviceRoleCall, 'service-role key must not scope the user path').toBeFalsy()
  })

  it('never uses the service-role supabaseAdmin client (incl. the proposals write)', async () => {
    const { intakeLinkerAgent } = await import('../../src/ai/agents/intake-linker')

    await intakeLinkerAgent.proposeLinks({
      intakeTicketId: 'ticket-1',
      organizationId: 'org-1',
      userId: 'user-1',
      language: 'en',
      authHeader: AUTH_HEADER,
    })

    // Includes the ai_entity_link_proposals INSERT (L452) — proven user-triggered.
    expect(adminFrom).not.toHaveBeenCalled()
  })
})
