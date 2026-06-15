import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('DIGEST-02: clearance-gated digest cron', () => {
  const mocks = vi.hoisted(() => ({
    from: vi.fn(),
    rpc: vi.fn(),
    getUserById: vi.fn(),
    logInfo: vi.fn(),
    logError: vi.fn(),
    inserts: [] as Array<Record<string, unknown>>,
    eqCalls: [] as Array<[string, unknown]>,
  }))

  vi.mock('../../src/config/supabase', () => ({
    supabaseAdmin: {
      from: mocks.from,
      rpc: mocks.rpc,
      auth: {
        admin: {
          getUserById: mocks.getUserById,
        },
      },
    },
  }))

  vi.mock('../../src/utils/logger', () => ({
    logInfo: mocks.logInfo,
    logError: mocks.logError,
    logApiRequest: vi.fn(),
  }))

  vi.mock('../../src/adapters/intelligence/in-app-adapter', () => ({
    inAppAdapter: { name: 'in_app', send: vi.fn(async () => undefined) },
  }))
  vi.mock('../../src/adapters/intelligence/smtp-adapter', () => ({
    smtpAdapter: { name: 'smtp', send: vi.fn(async () => undefined) },
  }))
  vi.mock('../../src/adapters/intelligence/webhook-adapter', () => ({
    webhookAdapter: { name: 'webhook', send: vi.fn(async () => undefined) },
  }))

  const subscriptions = [
    {
      id: 'sub-low',
      organization_id: 'org-1',
      subscriber_id: 'user-low',
      dossier_id: '00000000-0000-4000-8000-000000000001',
      dossier_type: 'country',
      frequency: 'daily',
      frequency_config: { channels: [] },
    },
    {
      id: 'sub-high',
      organization_id: 'org-1',
      subscriber_id: 'user-high',
      dossier_id: '00000000-0000-4000-8000-000000000001',
      dossier_type: 'country',
      frequency: 'daily',
      frequency_config: { channels: [] },
    },
    {
      id: 'sub-missing',
      organization_id: 'org-1',
      subscriber_id: 'user-missing',
      dossier_id: '00000000-0000-4000-8000-000000000001',
      dossier_type: 'country',
      frequency: 'daily',
      frequency_config: { channels: [] },
    },
  ]

  const makeThenableChain = (resultFactory: () => unknown) => {
    const chain: any = {
      select: vi.fn(() => chain),
      insert: vi.fn((row: Record<string, unknown>) => {
        mocks.inserts.push(row)
        return chain
      }),
      eq: vi.fn((column: string, value: unknown) => {
        mocks.eqCalls.push([column, value])
        return chain
      }),
      limit: vi.fn(() => chain),
      single: vi.fn(async () => resultFactory()),
      maybeSingle: vi.fn(async () => resultFactory()),
      then: (onResolved: any, onRejected?: any) =>
        Promise.resolve(resultFactory()).then(onResolved, onRejected),
    }
    return chain
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.inserts.length = 0
    mocks.eqCalls.length = 0

    mocks.from.mockImplementation((table: string) => {
      if (table === 'intelligence_digest_subscriptions') {
        return makeThenableChain(() => ({ data: subscriptions, error: null }))
      }
      if (table === 'profiles') {
        return makeThenableChain(() => {
          const userId = [...mocks.eqCalls].reverse().find(([column]) => column === 'user_id')?.[1]
          if (userId === 'user-missing') return { data: null, error: null }
          return {
            data: { clearance_level: userId === 'user-high' ? 3 : 1 },
            error: null,
          }
        })
      }
      if (table === 'user_preferences') {
        return makeThenableChain(() => ({ data: { language: 'en' }, error: null }))
      }
      if (table === 'intelligence_digest') {
        return makeThenableChain(() => ({
          data: { id: `digest-${mocks.inserts.length}` },
          error: null,
        }))
      }
      return makeThenableChain(() => ({ data: null, error: null }))
    })

    mocks.rpc.mockImplementation(async (_name: string, args: { p_clearance_level: number }) => ({
      data: {
        signals:
          args.p_clearance_level >= 3
            ? [
                { title: 'level 1 signal', severity: 'low', occurred_at: '2026-06-15T00:00:00Z' },
                { title: 'level 3 signal', severity: 'high', occurred_at: '2026-06-15T00:00:00Z' },
              ]
            : [{ title: 'level 1 signal', severity: 'low', occurred_at: '2026-06-15T00:00:00Z' }],
        commitments_due: [],
        engagements: [],
        status_changes: [],
      },
      error: null,
    }))
    mocks.getUserById.mockImplementation(async (userId: string) => ({
      data: { user: { email: `${userId}@example.test` } },
      error: null,
    }))
  })

  it('generates per-subscriber digests filtered by each subscriber clearance level', async () => {
    const { processIntelligenceDailyDigests } =
      await import('../../src/queues/intelligence-digest.scheduler')

    await processIntelligenceDailyDigests()

    expect(mocks.rpc).toHaveBeenCalledWith(
      'generate_digest_content',
      expect.objectContaining({ p_clearance_level: 1 }),
    )
    expect(mocks.rpc).toHaveBeenCalledWith(
      'generate_digest_content',
      expect.objectContaining({ p_clearance_level: 3 }),
    )
    expect(mocks.eqCalls).toContainEqual(['user_id', 'user-low'])
    expect(mocks.eqCalls).toContainEqual(['user_id', 'user-high'])
    expect(mocks.inserts).toHaveLength(2)
    expect(mocks.inserts[0]?.summary).toContain('level 1 signal')
    expect(mocks.inserts[0]?.summary).not.toContain('level 3 signal')
    expect(mocks.inserts[1]?.summary).toContain('level 3 signal')
  })

  it('treats duplicate digest rows as an informational idempotency skip', async () => {
    mocks.from.mockImplementation((table: string) => {
      if (table === 'intelligence_digest_subscriptions') {
        return makeThenableChain(() => ({ data: [subscriptions[0]], error: null }))
      }
      if (table === 'profiles') {
        return makeThenableChain(() => ({ data: { clearance_level: 1 }, error: null }))
      }
      if (table === 'user_preferences') {
        return makeThenableChain(() => ({ data: { language: 'en' }, error: null }))
      }
      if (table === 'intelligence_digest') {
        return makeThenableChain(() => ({
          data: null,
          error: { code: '23505', message: 'duplicate' },
        }))
      }
      return makeThenableChain(() => ({ data: null, error: null }))
    })

    const { processIntelligenceDailyDigests } =
      await import('../../src/queues/intelligence-digest.scheduler')

    await processIntelligenceDailyDigests()

    expect(mocks.logInfo).toHaveBeenCalledWith(
      'Duplicate intelligence digest skipped',
      expect.objectContaining({ subscriberId: 'user-low' }),
    )
    expect(mocks.logError).not.toHaveBeenCalledWith(
      expect.stringContaining('Duplicate'),
      expect.anything(),
    )
  })
})
