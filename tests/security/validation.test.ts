import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'
import { validate, ValidationError } from '../../backend/src/utils/validation'

// Helper to create mock Express req/res/next
function createMockRequest(overrides: { body?: any; query?: any; params?: any } = {}): any {
  return {
    body: overrides.body ?? {},
    query: overrides.query ?? {},
    params: overrides.params ?? {},
  }
}

function createMockResponse(): any {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }
}

describe('Input Validation Middleware', () => {
  it('rejects request with invalid UUID param', async () => {
    const schema = { params: z.object({ id: z.string().uuid() }) }
    const middleware = validate(schema)
    const req = createMockRequest({ params: { id: 'not-a-uuid' } })
    const res = createMockResponse()
    const next = vi.fn()

    await middleware(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(ValidationError))
    const error = next.mock.calls[0][0] as ValidationError
    expect(error.details).toHaveLength(1)
    expect(error.details[0].path).toBe('id')
  })

  it('rejects request with missing required body field', async () => {
    const schema = {
      body: z.object({
        name: z.string().min(1),
        email: z.string().email(),
      }),
    }
    const middleware = validate(schema)
    const req = createMockRequest({ body: { name: '' } })
    const res = createMockResponse()
    const next = vi.fn()

    await middleware(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(ValidationError))
    const error = next.mock.calls[0][0] as ValidationError
    expect(error.details.length).toBeGreaterThanOrEqual(1)
  })

  it('returns structured error with path and message', async () => {
    const schema = {
      body: z.object({
        count: z.number().int().min(1),
      }),
    }
    const middleware = validate(schema)
    const req = createMockRequest({ body: { count: 'abc' } })
    const res = createMockResponse()
    const next = vi.fn()

    await middleware(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(ValidationError))
    const error = next.mock.calls[0][0] as ValidationError
    expect(error.message).toBe('Validation failed')
    expect(error.details[0]).toHaveProperty('path')
    expect(error.details[0]).toHaveProperty('message')
    expect(error.details[0]).toHaveProperty('type')
  })

  it('passes valid input through unchanged', async () => {
    const schema = {
      body: z.object({
        name: z.string().min(1),
      }),
    }
    const middleware = validate(schema)
    const req = createMockRequest({ body: { name: 'Test' } })
    const res = createMockResponse()
    const next = vi.fn()

    await middleware(req, res, next)

    expect(next).toHaveBeenCalledWith()
    expect(req.body).toEqual({ name: 'Test' })
  })

  it('coerces query string numbers via z.coerce', async () => {
    const schema = {
      query: z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
      }),
    }
    const middleware = validate(schema)
    const req = createMockRequest({ query: { page: '3', limit: '50' } })
    const res = createMockResponse()
    const next = vi.fn()

    await middleware(req, res, next)

    expect(next).toHaveBeenCalledWith()
    expect(req.query).toEqual({ page: 3, limit: 50 })
  })

  it('rejects query with out-of-range values', async () => {
    const schema = {
      query: z.object({
        limit: z.coerce.number().min(1).max(100),
      }),
    }
    const middleware = validate(schema)
    const req = createMockRequest({ query: { limit: '200' } })
    const res = createMockResponse()
    const next = vi.fn()

    await middleware(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(ValidationError))
  })

  it('applies defaults when optional fields are missing', async () => {
    const schema = {
      query: z.object({
        page: z.coerce.number().min(1).default(1),
        order: z.enum(['asc', 'desc']).default('asc'),
      }),
    }
    const middleware = validate(schema)
    const req = createMockRequest({ query: {} })
    const res = createMockResponse()
    const next = vi.fn()

    await middleware(req, res, next)

    expect(next).toHaveBeenCalledWith()
    expect(req.query).toEqual({ page: 1, order: 'asc' })
  })

  it('validates multiple schemas (params + body) simultaneously', async () => {
    const schema = {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ name: z.string().min(1) }),
    }
    const middleware = validate(schema)
    const req = createMockRequest({
      params: { id: '550e8400-e29b-41d4-a716-446655440000' },
      body: { name: 'Valid Name' },
    })
    const res = createMockResponse()
    const next = vi.fn()

    await middleware(req, res, next)

    expect(next).toHaveBeenCalledWith()
  })
})
