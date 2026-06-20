import express from 'express'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  inserts: [] as Array<Record<string, unknown>>,
  updates: [] as Array<Record<string, unknown>>,
  eqCalls: [] as Array<[string, unknown]>,
  deleted: false,
}))

vi.mock('../../src/config/supabase', () => ({
  supabaseAdmin: {
    from: mocks.from,
  },
}))

const DOSSIER_ID = '00000000-0000-4000-8000-000000000001'

function makeChain(result: unknown) {
  const chain: any = {
    select: vi.fn(() => chain),
    insert: vi.fn((row: Record<string, unknown>) => {
      mocks.inserts.push(row)
      return chain
    }),
    update: vi.fn((row: Record<string, unknown>) => {
      mocks.updates.push(row)
      return chain
    }),
    delete: vi.fn(() => {
      mocks.deleted = true
      return chain
    }),
    eq: vi.fn((column: string, value: unknown) => {
      mocks.eqCalls.push([column, value])
      return chain
    }),
    order: vi.fn(() => chain),
    single: vi.fn(async () => result),
    then: (onResolved: any, onRejected?: any) =>
      Promise.resolve(result).then(onResolved, onRejected),
  }
  return chain
}

async function mountRouter() {
  const router = (await import('../../src/api/intelligence-alerts')).default
  const app = express()
  app.use(express.json())
  app.use((req, _res, next) => {
    req.user = {
      id: 'user-1',
      email: 'user@example.test',
      role: 'editor',
      organization_id: 'org-1',
      clearance_level: 2,
      permissions: [],
    }
    next()
  })
  app.use(router)

  const server = await new Promise<Server>((resolve) => {
    const started = app.listen(0, () => resolve(started))
  })
  const { port } = server.address() as AddressInfo
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}

describe('ALERT-01: alert rule CRUD', () => {
  let closeServer: (() => Promise<void>) | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.inserts.length = 0
    mocks.updates.length = 0
    mocks.eqCalls.length = 0
    mocks.deleted = false
  })

  afterEach(async () => {
    if (closeServer != null) {
      await closeServer()
      closeServer = null
    }
  })

  it('persists alert rules for the authenticated owner only', async () => {
    const row = {
      id: 'rule-1',
      organization_id: 'org-1',
      owner_id: 'user-1',
      dossier_id: DOSSIER_ID,
      dossier_type: 'country',
      condition_type: 'new_signal',
      condition_config: { severities: ['high'] },
      channels: ['in_app', 'webhook'],
      is_active: true,
    }
    mocks.from.mockReturnValue(makeChain({ data: row, error: null }))

    const { createAlertRule, listAlertRules, updateAlertRule, deleteAlertRule } =
      await import('../../src/services/alerts.service')

    await expect(
      createAlertRule({
        organization_id: 'org-1',
        owner_id: 'user-1',
        dossier_id: DOSSIER_ID,
        dossier_type: 'country',
        condition_type: 'new_signal',
        condition_config: { severities: ['high'] },
        channels: ['in_app', 'webhook'],
      }),
    ).resolves.toEqual(row)

    await listAlertRules('user-1')
    await updateAlertRule('rule-1', 'user-1', { channels: ['smtp'], is_active: false })
    await deleteAlertRule('rule-1', 'user-1')

    expect(mocks.from).toHaveBeenCalledWith('intelligence_alert_rules')
    expect(mocks.inserts[0]).toMatchObject({
      organization_id: 'org-1',
      owner_id: 'user-1',
      dossier_id: DOSSIER_ID,
      dossier_type: 'country',
      condition_type: 'new_signal',
      channels: ['in_app', 'webhook'],
      is_active: true,
    })
    expect(mocks.updates[0]).toMatchObject({
      channels: ['smtp'],
      is_active: false,
      updated_at: expect.any(String),
    })
    expect(mocks.eqCalls).toContainEqual(['owner_id', 'user-1'])
    expect(mocks.eqCalls).toContainEqual(['id', 'rule-1'])
    expect(mocks.deleted).toBe(true)
  })

  it('validates rule input at the API boundary and rejects non-dossier types', async () => {
    const server = await mountRouter()
    closeServer = server.close

    const invalidResponse = await fetch(`${server.baseUrl}/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dossier_type: 'elected_official',
        dossier_id: DOSSIER_ID,
        condition_type: 'new_signal',
        channels: ['in_app'],
      }),
    })
    expect(invalidResponse.status).toBe(400)
    expect(mocks.from).not.toHaveBeenCalled()

    mocks.from.mockReturnValueOnce(
      makeChain({
        data: {
          id: 'rule-1',
          owner_id: 'user-1',
          organization_id: 'org-1',
          dossier_id: DOSSIER_ID,
          dossier_type: 'person',
          condition_type: 'new_signal',
          channels: ['in_app'],
          is_active: true,
        },
        error: null,
      }),
    )

    const response = await fetch(`${server.baseUrl}/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dossier_type: 'person',
        dossier_id: DOSSIER_ID,
        condition_type: 'new_signal',
        channels: ['in_app'],
      }),
    })
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body).toMatchObject({ id: 'rule-1', owner_id: 'user-1', organization_id: 'org-1' })
  })
})
