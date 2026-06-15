import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  authGetUserByIdMock,
  fromCalls,
  inAppSendMock,
  logErrorMock,
  mockPgClient,
  queryResponses,
  queueAddMock,
  smtpSendMock,
  updateCalls,
  webhookSendMock,
} = vi.hoisted(() => {
  const queryResponses: Array<{ data: unknown; error: null | { message: string } }> = []
  const fromCalls: string[] = []
  const updateCalls: Array<{ table: string; values: unknown }> = []

  const makeChain = (table: string) => {
    const response = queryResponses.shift() ?? { data: [], error: null }
    const chain: Record<string, unknown> = {
      select: vi.fn(() => chain),
      insert: vi.fn(() => chain),
      update: vi.fn((values: unknown) => {
        updateCalls.push({ table, values })
        return chain
      }),
      eq: vi.fn(() => chain),
      in: vi.fn(() => chain),
      gt: vi.fn(() => chain),
      gte: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      single: vi.fn(async () => response),
      then: (resolve: (value: typeof response) => unknown) =>
        Promise.resolve(response).then(resolve),
    }
    return chain
  }

  let notificationHandler:
    | ((message: { channel: string; payload?: string }) => void | Promise<void>)
    | null = null

  const mockPgClient = {
    connect: vi.fn().mockResolvedValue(undefined),
    query: vi.fn().mockResolvedValue({ rows: [] }),
    on: vi.fn(
      (event: string, handler: (message: { channel: string; payload?: string }) => void) => {
        if (event === 'notification') {
          notificationHandler = handler
        }
        return mockPgClient
      },
    ),
    emitNotification: async (message: { channel: string; payload?: string }) => {
      await notificationHandler?.(message)
    },
  }

  return {
    authGetUserByIdMock: vi.fn().mockResolvedValue({
      data: { user: { email: 'owner@example.test' } },
      error: null,
    }),
    fromCalls,
    inAppSendMock: vi.fn().mockResolvedValue(undefined),
    logErrorMock: vi.fn(),
    mockPgClient,
    queryResponses,
    queueAddMock: vi.fn().mockResolvedValue(undefined),
    smtpSendMock: vi.fn().mockResolvedValue(undefined),
    updateCalls,
    webhookSendMock: vi.fn().mockResolvedValue(undefined),
    mockFrom: vi.fn((table: string) => {
      fromCalls.push(table)
      return makeChain(table)
    }),
  }
})

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}))

vi.mock('pg', () => {
  function Client() {
    return mockPgClient
  }
  return { Client: vi.fn(Client) }
})

vi.mock('../../src/queues/notification.queue', () => ({
  notificationQueue: {
    add: queueAddMock,
  },
}))

vi.mock('../../src/config/supabase', () => ({
  supabaseAdmin: {
    from: mockFrom,
    auth: {
      admin: {
        getUserById: authGetUserByIdMock,
      },
    },
  },
}))

vi.mock('../../src/adapters/intelligence/in-app-adapter', () => ({
  inAppAdapter: { name: 'in_app', send: inAppSendMock },
}))

vi.mock('../../src/adapters/intelligence/smtp-adapter', () => ({
  smtpAdapter: { name: 'smtp', send: smtpSendMock },
}))

vi.mock('../../src/adapters/intelligence/webhook-adapter', () => ({
  webhookAdapter: { name: 'webhook', send: webhookSendMock },
}))

vi.mock('../../src/utils/logger', () => ({
  logInfo: vi.fn(),
  logError: logErrorMock,
}))

const payload = {
  event_id: 'event-1',
  organization_id: 'org-1',
  sensitivity_level: 1,
  severity: 'medium',
  occurred_at: '2026-06-15T09:00:00.000Z',
}

function setQueryResponses(
  responses: Array<{ data: unknown; error?: null | { message: string } }>,
) {
  queryResponses.length = 0
  queryResponses.push(...responses.map((response) => ({ error: null, ...response })))
}

function mockRule(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rule-1',
    owner_id: 'owner-1',
    channels: ['in_app'],
    condition_config: {},
    last_fired_at: null,
    ...overrides,
  }
}

describe('ALERT-02: signal-triggered alert fan-out', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    queryResponses.length = 0
    fromCalls.length = 0
    updateCalls.length = 0
    mockFrom.mockImplementation((table: string) => {
      fromCalls.push(table)
      const response = queryResponses.shift() ?? { data: [], error: null }
      const chain: Record<string, unknown> = {
        select: vi.fn(() => chain),
        insert: vi.fn(() => chain),
        update: vi.fn((values: unknown) => {
          updateCalls.push({ table, values })
          return chain
        }),
        eq: vi.fn(() => chain),
        in: vi.fn(() => chain),
        gt: vi.fn(() => chain),
        gte: vi.fn(() => chain),
        limit: vi.fn(() => chain),
        single: vi.fn(async () => response),
        then: (resolve: (value: typeof response) => unknown) =>
          Promise.resolve(response).then(resolve),
      }
      return chain
    })
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db'
  })

  it('connects a pg client and LISTENs on intelligence_alert', async () => {
    setQueryResponses([{ data: [] }])
    const { startAlertListener } = await import('../../src/queues/intelligence-alert.worker')

    await startAlertListener()

    expect(mockPgClient.connect).toHaveBeenCalledTimes(1)
    expect(mockPgClient.query).toHaveBeenCalledWith('LISTEN intelligence_alert')
  })

  it('enqueues alert jobs from pg notifications with event jobId dedup', async () => {
    setQueryResponses([{ data: [] }])
    const { startAlertListener } = await import('../../src/queues/intelligence-alert.worker')

    await startAlertListener()
    await mockPgClient.emitNotification({
      channel: 'intelligence_alert',
      payload: JSON.stringify(payload),
    })

    expect(queueAddMock).toHaveBeenCalledWith('intelligence-alert', payload, {
      jobId: 'alert:event-1:check',
      removeOnComplete: { count: 500 },
    })
  })

  it('silently skips above-clearance alerts without dispatch', async () => {
    setQueryResponses([
      { data: [{ dossier_id: 'dossier-1' }] },
      { data: [mockRule()] },
      { data: { clearance_level: 1 } },
    ])
    const { processIntelligenceAlertJob } =
      await import('../../src/queues/intelligence-alert.worker')

    await processIntelligenceAlertJob({ ...payload, sensitivity_level: 2 })

    expect(inAppSendMock).not.toHaveBeenCalled()
    expect(smtpSendMock).not.toHaveBeenCalled()
    expect(webhookSendMock).not.toHaveBeenCalled()
    expect(logErrorMock).not.toHaveBeenCalled()
  })

  it('dispatches to in-app, SMTP, and webhook adapters for allowed alerts', async () => {
    setQueryResponses([
      { data: [{ dossier_id: 'dossier-1' }] },
      { data: [mockRule({ channels: ['in_app', 'smtp', 'webhook'] })] },
      { data: { clearance_level: 2 } },
      { data: null },
    ])
    const { processIntelligenceAlertJob } =
      await import('../../src/queues/intelligence-alert.worker')

    await processIntelligenceAlertJob(payload)

    expect(inAppSendMock).toHaveBeenCalledTimes(1)
    expect(smtpSendMock).toHaveBeenCalledTimes(1)
    expect(webhookSendMock).toHaveBeenCalledTimes(1)
    expect(updateCalls).toEqual([
      {
        table: 'intelligence_alert_rules',
        values: expect.objectContaining({ last_fired_at: expect.any(String) }),
      },
    ])
  })

  it('runs a startup catch-up scan for recent intelligence events', async () => {
    setQueryResponses([
      { data: [{ ...payload, id: payload.event_id }] },
      { data: [{ dossier_id: 'dossier-1' }] },
      { data: [mockRule()] },
    ])
    const { startAlertListener } = await import('../../src/queues/intelligence-alert.worker')

    await startAlertListener()

    expect(fromCalls).toContain('intelligence_event')
    expect(queueAddMock).toHaveBeenCalledWith('intelligence-alert', payload, {
      jobId: 'alert:event-1:rule-1:check',
      removeOnComplete: { count: 500 },
    })
  })

  it('coalesces bursts within five minutes per rule', async () => {
    const { processIntelligenceAlertJob } =
      await import('../../src/queues/intelligence-alert.worker')

    setQueryResponses([
      { data: [{ dossier_id: 'dossier-1' }] },
      { data: [mockRule({ last_fired_at: null })] },
      { data: { clearance_level: 2 } },
      { data: null },
    ])
    await processIntelligenceAlertJob(payload)

    setQueryResponses([
      { data: [{ dossier_id: 'dossier-1' }] },
      { data: [mockRule({ last_fired_at: new Date(Date.now() - 60_000).toISOString() })] },
      { data: { clearance_level: 2 } },
    ])
    await processIntelligenceAlertJob({ ...payload, event_id: 'event-2' })

    setQueryResponses([
      { data: [{ dossier_id: 'dossier-1' }] },
      { data: [mockRule({ last_fired_at: new Date(Date.now() - 600_000).toISOString() })] },
      { data: { clearance_level: 2 } },
      { data: null },
    ])
    await processIntelligenceAlertJob({ ...payload, event_id: 'event-3' })

    expect(inAppSendMock).toHaveBeenCalledTimes(2)
    expect(updateCalls).toHaveLength(2)
  })
})
