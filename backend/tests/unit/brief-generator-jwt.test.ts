/**
 * Unit tests — brief-generator.ts JWT keystone (Phase 72-07 / D-10)
 *
 * Asserts the user-triggered brief-generation path runs its Supabase writes
 * under the CALLER's JWT (a per-request anon-key client + forwarded
 * Authorization header) so RLS (`sensitivity_level <= clearance_level`)
 * applies — NOT under the service-role `supabaseAdmin` client which bypasses
 * RLS. This is the keystone retirement P68 applied to chat-assistant.ts,
 * extended to the brief-generator background agent.
 *
 * @see backend/src/ai/agents/brief-generator.ts
 * @see backend/src/ai/agents/chat-assistant.ts (createUserClient, line 24)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// --- Mocks -----------------------------------------------------------------

// Capture every createClient(...) call so we can assert the keystone signature
// (anon key + forwarded caller Authorization header).
const createClientMock = vi.fn()
vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}))

// The service-role admin client. If the user path ever touches this for a
// write, RLS is bypassed — the test must fail.
const adminFrom = vi.fn()
vi.mock('../../src/config/supabase', () => ({
  supabaseAdmin: { from: adminFrom },
}))

// The brief context service — return a minimal context so generate() proceeds
// to the DB write without needing a live DB.
vi.mock('../../src/services/brief.service', () => ({
  briefContextService: {
    gatherContext: vi.fn().mockResolvedValue({
      engagement: null,
      dossier: { id: 'd1', name_en: 'Test Dossier', dossier_type: 'country' },
      relatedDossiers: [],
      positions: [],
      commitments: [],
      recentEngagements: [],
    }),
  },
}))

// The LLM router — return a parseable JSON brief so updateBriefRecord runs.
vi.mock('../../src/ai/llm-router', () => ({
  llmRouter: {
    chat: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        title: 'Brief',
        executiveSummary: 'Summary',
        background: '',
        keyParticipants: [],
        relevantPositions: [],
        activeCommitments: [],
        historicalContext: '',
        talkingPoints: [],
        recommendations: '',
      }),
      runId: 'run-1',
    }),
    streamChat: vi.fn(),
  },
}))

vi.mock('../../src/utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const ANON_KEY = 'anon-test-key'
const SERVICE_KEY = 'service-role-test-key'
const AUTH_HEADER = 'Bearer caller-jwt-token'

// A chainable query-builder stub that resolves inserts/updates without a DB.
function makeQueryBuilder(): Record<string, ReturnType<typeof vi.fn>> {
  const qb: Record<string, ReturnType<typeof vi.fn>> = {}
  qb.insert = vi.fn(() => qb)
  qb.update = vi.fn(() => qb)
  qb.eq = vi.fn(() => qb)
  qb.select = vi.fn(() => qb)
  // .single() resolves the insert chain (createBriefRecord reads data.id)
  qb.single = vi.fn().mockResolvedValue({ data: { id: 'brief-1' }, error: null })
  // a bare .select() in updateBriefRecord is awaited directly → thenable
  qb.then = (resolve: (v: { data: unknown[]; error: null }) => void) =>
    resolve({ data: [{ id: 'brief-1' }], error: null })
  return qb
}

describe('brief-generator JWT keystone (D-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_ANON_KEY = ANON_KEY
    process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_KEY
    // Each createClient() call returns a fresh per-request client whose .from()
    // yields a chainable query builder.
    createClientMock.mockImplementation(() => ({ from: vi.fn(() => makeQueryBuilder()) }))
  })

  it('threads the caller JWT and builds a per-request anon-key client (RLS-scoped)', async () => {
    const { briefGeneratorAgent } = await import('../../src/ai/agents/brief-generator')

    await briefGeneratorAgent.generate({
      dossierId: 'd1',
      organizationId: 'org-1',
      userId: 'user-1',
      language: 'en',
      authHeader: AUTH_HEADER,
    })

    // The caller-scoped client must be constructed with the ANON key + the
    // forwarded Authorization header (the keystone signature).
    expect(createClientMock).toHaveBeenCalled()
    const keystoneCall = createClientMock.mock.calls.find((call) => call[1] === ANON_KEY)
    expect(keystoneCall, 'expected a createClient(url, ANON_KEY, …) call').toBeTruthy()
    const opts = keystoneCall?.[2] as { global?: { headers?: Record<string, string> } }
    expect(opts?.global?.headers?.Authorization).toBe(AUTH_HEADER)

    // It must NOT be built with the service-role key on the user path.
    const serviceRoleCall = createClientMock.mock.calls.find((call) => call[1] === SERVICE_KEY)
    expect(serviceRoleCall, 'service-role key must not scope the user write path').toBeFalsy()
  })

  it('does not use the service-role supabaseAdmin client for the user-triggered write', async () => {
    const { briefGeneratorAgent } = await import('../../src/ai/agents/brief-generator')

    await briefGeneratorAgent.generate({
      dossierId: 'd1',
      organizationId: 'org-1',
      userId: 'user-1',
      language: 'en',
      authHeader: AUTH_HEADER,
    })

    expect(adminFrom).not.toHaveBeenCalled()
  })
})
