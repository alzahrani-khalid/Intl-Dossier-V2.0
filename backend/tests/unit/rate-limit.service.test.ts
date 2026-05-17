import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RateLimitService } from '../../src/services/rate-limit.service'
import type { RateLimitPolicy } from '../../src/models/rate-limit-policy.model'

const mocks = vi.hoisted(() => {
  type Terminal = { data: any; error: any }

  const state = {
    redisInstances: [] as any[],
    createClient: vi.fn(),
    from: vi.fn(),
    listTerminal: { data: [], error: null } as Terminal,
    singleTerminal: { data: null, error: null } as Terminal,
  }

  const makeChain = () => {
    const chain: any = {
      select: vi.fn(() => chain),
      insert: vi.fn(() => chain),
      update: vi.fn(() => chain),
      delete: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      single: vi.fn(async () => state.singleTerminal),
      then: (onResolved: any, onRejected?: any) =>
        Promise.resolve(state.listTerminal).then(onResolved, onRejected),
      catch: (onRejected: any) => Promise.resolve(state.listTerminal).catch(onRejected),
      finally: (onFinally: any) => Promise.resolve(state.listTerminal).finally(onFinally),
    }
    return chain
  }

  const Redis = vi.fn(function RedisMock() {
    const store = new Map<string, string>()
    const instance = {
      get: vi.fn(async (key: string) => store.get(key) ?? null),
      set: vi.fn(async (key: string, value: string) => {
        store.set(key, value)
        return 'OK'
      }),
      keys: vi.fn(async (pattern: string) => {
        const prefix = pattern.replace(/\*$/, '')
        return Array.from(store.keys()).filter((key) => key.startsWith(prefix))
      }),
      del: vi.fn(async (...keys: string[]) => {
        for (const key of keys) store.delete(key)
        return keys.length
      }),
      quit: vi.fn(async () => 'OK'),
    }
    state.redisInstances.push(instance)
    return instance
  })

  state.from.mockImplementation(() => makeChain())
  state.createClient.mockReturnValue({ from: state.from })

  return {
    ...state,
    Redis,
    setSingleTerminal: (terminal: Terminal) => {
      state.singleTerminal = terminal
    },
    reset: () => {
      state.redisInstances.length = 0
      state.listTerminal = { data: [], error: null }
      state.singleTerminal = { data: null, error: null }
      state.from.mockClear()
      state.createClient.mockClear()
      state.from.mockImplementation(() => makeChain())
      state.createClient.mockReturnValue({ from: state.from })
      Redis.mockClear()
    },
  }
})

vi.mock('ioredis', () => ({
  default: mocks.Redis,
  Redis: mocks.Redis,
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: mocks.createClient,
}))

describe('RateLimitService', () => {
  let service: RateLimitService

  beforeEach(() => {
    mocks.reset()
    service = new RateLimitService('redis://localhost:6379', 'http://supabase.test', 'service-key')
  })

  afterEach(async () => {
    await service.cleanup()
  })

  it('uses the default authenticated token bucket policy when no persisted policy exists', async () => {
    const first = await service.checkRateLimit('user-123', undefined, 'api')
    const second = await service.checkRateLimit('user-123', undefined, 'api')

    expect(first.allowed).toBe(true)
    expect(first.remaining).toBe(49)
    expect(first.reset_at).toBeInstanceOf(Date)
    expect(second.allowed).toBe(true)
    expect(second.remaining).toBe(48)
  })

  it('rejects a burst that exceeds the available bucket capacity', async () => {
    const allowed = await service.applyBurstLimit(51, 'user-123')

    expect(allowed).toBe(false)
  })

  it('resets cached rate-limit state for a user', async () => {
    await service.checkRateLimit('user-123', undefined, 'api')
    await service.resetRateLimit('user-123')
    const afterReset = await service.checkRateLimit('user-123', undefined, 'api')

    expect(afterReset.remaining).toBe(49)
    expect(mocks.redisInstances[0].del).toHaveBeenCalledWith(
      'rate_limit:user:user-123:endpoint:api',
    )
  })

  it('creates valid policies through Supabase and refreshes the policy cache', async () => {
    const createdPolicy: RateLimitPolicy = {
      id: 'policy-1',
      name: 'Upload policy',
      requests_per_minute: 20,
      burst_capacity: 5,
      applies_to: 'authenticated',
      endpoint_type: 'upload',
      retry_after_seconds: 30,
      enabled: true,
      created_at: new Date(),
      updated_at: new Date(),
    }
    mocks.setSingleTerminal({ data: createdPolicy, error: null })

    const result = await service.createPolicy({
      name: 'Upload policy',
      requests_per_minute: 20,
      burst_capacity: 5,
      applies_to: 'authenticated',
      endpoint_type: 'upload',
      retry_after_seconds: 30,
    })

    expect(result).toEqual(createdPolicy)
    expect(mocks.from).toHaveBeenCalledWith('rate_limit_policies')
  })

  it('rejects invalid policy input before writing to Supabase', async () => {
    await expect(
      service.createPolicy({
        name: '',
        requests_per_minute: 0,
        burst_capacity: 5,
        applies_to: 'authenticated',
        endpoint_type: 'api',
      }),
    ).rejects.toThrow('Validation failed')
  })
})
