/**
 * Global Test Setup
 *
 * This file runs once before all tests and sets up the test environment.
 */

import { beforeAll, afterAll, afterEach, vi } from 'vitest'
import { config } from 'dotenv'
import path from 'path'

// Load root .env first (Supabase keys, etc.), then .env.test overrides
config({ path: path.resolve(__dirname, '../../.env') })
config({ path: path.resolve(__dirname, '../.env.test') })

// Set NODE_ENV to test
process.env.NODE_ENV = 'test'

vi.mock('@/config/supabase', () => {
  const terminal = { data: null, error: null }
  const makeChain = (): any => {
    const chain: any = {
      select: vi.fn(() => chain),
      insert: vi.fn(() => chain),
      update: vi.fn(() => chain),
      upsert: vi.fn(() => chain),
      delete: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      neq: vi.fn(() => chain),
      is: vi.fn(() => chain),
      in: vi.fn(() => chain),
      not: vi.fn(() => chain),
      or: vi.fn(() => chain),
      gt: vi.fn(() => chain),
      lt: vi.fn(() => chain),
      gte: vi.fn(() => chain),
      lte: vi.fn(() => chain),
      contains: vi.fn(() => chain),
      containedBy: vi.fn(() => chain),
      textSearch: vi.fn(() => chain),
      order: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      range: vi.fn(() => chain),
      returns: vi.fn(() => chain),
      single: vi.fn(async () => terminal),
      maybeSingle: vi.fn(async () => terminal),
      then: (onResolved: any, onRejected?: any) =>
        Promise.resolve(terminal).then(onResolved, onRejected),
      catch: (onRejected: any) => Promise.resolve(terminal).catch(onRejected),
      finally: (onFinally: any) => Promise.resolve(terminal).finally(onFinally),
    }
    return chain
  }

  const storageBucket = {
    upload: vi.fn(async () => terminal),
    download: vi.fn(async () => ({ data: null, error: null })),
    remove: vi.fn(async () => terminal),
    list: vi.fn(async () => ({ data: [], error: null })),
    getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'http://localhost/mock-file' } })),
  }

  return {
    supabaseAdmin: {
      from: vi.fn(() => makeChain()),
      rpc: vi.fn(async () => terminal),
      auth: {
        getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
        admin: {
          listUsers: vi.fn(async () => ({ data: { users: [] }, error: null })),
          getUserById: vi.fn(async () => ({ data: { user: null }, error: null })),
          createUser: vi.fn(async () => ({ data: { user: null }, error: null })),
          updateUserById: vi.fn(async () => ({ data: { user: null }, error: null })),
          deleteUser: vi.fn(async () => terminal),
        },
      },
      storage: { from: vi.fn(() => storageBucket) },
    },
    supabaseAnon: {
      from: vi.fn(() => makeChain()),
      auth: {
        signInWithPassword: vi.fn(async () => ({ data: null, error: null })),
        getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
        getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
        signOut: vi.fn(async () => terminal),
      },
    },
  }
})

vi.mock('ioredis', () => {
  class Redis {
    status = 'ready'
    private store = new Map<string, string>()
    private expiry = new Map<string, number>()

    private read(key: string): string | null {
      const expiresAt = this.expiry.get(key)
      if (expiresAt != null && Date.now() > expiresAt) {
        this.store.delete(key)
        this.expiry.delete(key)
        return null
      }
      return this.store.get(key) ?? null
    }

    connect = vi.fn(async () => undefined)
    ping = vi.fn(async () => 'PONG')
    get = vi.fn(async (key: string) => this.read(key))
    set = vi.fn(async (key: string, val: string) => {
      this.store.set(key, val)
      return 'OK'
    })
    setex = vi.fn(async (key: string, seconds: number, val: string) => {
      this.store.set(key, val)
      this.expiry.set(key, Date.now() + seconds * 1000)
      return 'OK'
    })
    del = vi.fn(async (...keys: string[]) => {
      let deleted = 0
      for (const key of keys) {
        if (this.store.delete(key)) deleted += 1
        this.expiry.delete(key)
      }
      return deleted
    })
    exists = vi.fn(async (key: string) => (this.read(key) != null ? 1 : 0))
    expire = vi.fn(async (key: string, seconds: number) => {
      this.expiry.set(key, Date.now() + seconds * 1000)
      return 1
    })
    incr = vi.fn(async (key: string) => {
      const value = Number(this.read(key) ?? 0) + 1
      this.store.set(key, String(value))
      return value
    })
    keys = vi.fn(async (pattern: string) => {
      const prefix = pattern.replace(/\*$/, '')
      return Array.from(this.store.keys()).filter((key) => key.startsWith(prefix))
    })
    hset = vi.fn(async (key: string, field: string, val: string) => {
      const current = JSON.parse(this.read(key) ?? '{}') as Record<string, string>
      current[field] = val
      this.store.set(key, JSON.stringify(current))
      return 1
    })
    hget = vi.fn(async (key: string, field: string) => {
      const current = JSON.parse(this.read(key) ?? '{}') as Record<string, string>
      return current[field] ?? null
    })
    hgetall = vi.fn(async (key: string) => JSON.parse(this.read(key) ?? '{}'))
    sadd = vi.fn(async (key: string, ...members: string[]) => {
      const current = new Set(JSON.parse(this.read(key) ?? '[]') as string[])
      for (const member of members) current.add(member)
      this.store.set(key, JSON.stringify(Array.from(current)))
      return members.length
    })
    smembers = vi.fn(async (key: string) => JSON.parse(this.read(key) ?? '[]'))
    sismember = vi.fn(async (key: string, member: string) => {
      const current = new Set(JSON.parse(this.read(key) ?? '[]') as string[])
      return current.has(member) ? 1 : 0
    })
    on = vi.fn()
    once = vi.fn()
    off = vi.fn()
    quit = vi.fn(async () => 'OK')
    disconnect = vi.fn()
  }

  return { default: Redis, Redis }
})

vi.mock('bullmq', () => {
  const queueLike = () => ({
    add: vi.fn(async () => ({ id: 'mock-job-id' })),
    addBulk: vi.fn(async () => [{ id: 'mock-job-id' }]),
    getJob: vi.fn(async () => null),
    getJobCounts: vi.fn(async () => ({
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
    })),
    on: vi.fn(),
    close: vi.fn(async () => undefined),
  })

  return {
    Queue: vi.fn().mockImplementation(queueLike),
    Worker: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      close: vi.fn(async () => undefined),
    })),
    QueueEvents: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      close: vi.fn(async () => undefined),
    })),
  }
})

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn(async () => ({
        id: 'msg_mock',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: '{"mock": true}' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 0, output_tokens: 0 },
      })),
    },
  })),
}))

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    embeddings: {
      create: vi.fn(async () => ({
        data: [{ embedding: new Array(1536).fill(0) }],
      })),
    },
    chat: {
      completions: {
        create: vi.fn(async () => ({
          choices: [{ message: { content: '{"mock":true}' } }],
        })),
      },
    },
  })),
}))

vi.mock('@xenova/transformers', () => ({
  pipeline: vi.fn(async () => async () => ({ data: new Float32Array(1536) })),
}))

// Global test setup
beforeAll(async () => {
  const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY']
  const missing = requiredEnvVars.filter((varName) => !process.env[varName])

  if (missing.length > 0) {
    console.warn(
      `Missing env vars: ${missing.join(', ')}. ` +
        'Default test runner uses global mocks. If running test:integration, populate `.env.test` for real-service tests.',
    )
  }
})

// Global test teardown
afterAll(async () => {
  // Individual test teardown if needed
})

// Clean up after each test
afterEach(async () => {
  vi.clearAllMocks()
})
