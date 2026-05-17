import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@tests/mocks/server'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      }),
    },
  },
}))

interface CapturedRequest {
  url: string
  method: string
  headers: Headers
  body?: unknown
}

const capturedRequests: CapturedRequest[] = []

/**
 * Helper: get the expected Edge base URL from the current env
 * (mirrors what api-client.ts reads at call time)
 */
function edgeBase(): string {
  return import.meta.env.VITE_SUPABASE_URL + '/functions/v1'
}

function expressBase(): string {
  return import.meta.env.VITE_API_URL || ''
}

function mockJsonResponse(
  method: 'delete' | 'get' | 'patch' | 'post' | 'put',
  url: string,
  response: unknown = { data: 'test' },
  init?: ResponseInit,
): void {
  server.use(
    http[method](url, async ({ request }) => {
      const body =
        request.method === 'GET' || request.method === 'DELETE' ? undefined : await request.json()
      capturedRequests.push({
        url: request.url,
        method: request.method,
        headers: request.headers,
        body,
      })

      return HttpResponse.json(response, init)
    }),
  )
}

describe('apiClient', () => {
  beforeEach(() => {
    vi.resetModules()
    capturedRequests.length = 0
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('apiGet sends GET request with Authorization header containing session token', async () => {
    mockJsonResponse('get', `${edgeBase()}/test-endpoint`)

    const { apiGet } = await import('@/lib/api-client')
    await apiGet('/test-endpoint')

    expect(capturedRequests).toHaveLength(1)
    expect(capturedRequests[0]?.url).toBe(`${edgeBase()}/test-endpoint`)
    expect(capturedRequests[0]?.method).toBe('GET')
    expect(capturedRequests[0]?.headers.get('authorization')).toBe('Bearer test-token')
  })

  it('apiPost sends POST request with JSON-stringified body and Content-Type application/json', async () => {
    mockJsonResponse('post', `${edgeBase()}/test-endpoint`)

    const { apiPost } = await import('@/lib/api-client')
    const body = { name: 'test', value: 42 }
    await apiPost('/test-endpoint', body)

    expect(capturedRequests).toHaveLength(1)
    expect(capturedRequests[0]?.url).toBe(`${edgeBase()}/test-endpoint`)
    expect(capturedRequests[0]?.method).toBe('POST')
    expect(capturedRequests[0]?.headers.get('content-type')).toBe('application/json')
    expect(capturedRequests[0]?.body).toEqual(body)
  })

  it('apiGet throws Error with status code and statusText when response.ok is false', async () => {
    mockJsonResponse('get', `${edgeBase()}/missing`, { error: 'missing' }, { status: 404 })

    const { apiGet } = await import('@/lib/api-client')
    await expect(apiGet('/missing')).rejects.toThrow('API error 404: Not Found')
  })

  it('apiGet uses Edge Functions base URL by default (VITE_SUPABASE_URL + /functions/v1)', async () => {
    mockJsonResponse('get', `${edgeBase()}/dossiers-list`)

    const { apiGet } = await import('@/lib/api-client')
    await apiGet('/dossiers-list')

    const calledUrl = capturedRequests[0]?.url
    expect(calledUrl).toBe(`${edgeBase()}/dossiers-list`)
    expect(calledUrl).toContain('/functions/v1/')
  })

  it('apiGet uses Express base URL when options.baseUrl is express (VITE_API_URL)', async () => {
    mockJsonResponse('get', `${expressBase()}/api/health`)

    const { apiGet } = await import('@/lib/api-client')
    await apiGet('/api/health', { baseUrl: 'express' })

    const calledUrl = capturedRequests[0]?.url
    expect(calledUrl).toContain('/api/health')
    expect(calledUrl).not.toContain('/functions/v1')
  })

  it('apiPut, apiPatch, apiDelete use correct HTTP methods', async () => {
    mockJsonResponse('put', `${edgeBase()}/resource/1`)
    mockJsonResponse('patch', `${edgeBase()}/resource/1`)
    mockJsonResponse('delete', `${edgeBase()}/resource/1`)

    const { apiPut, apiPatch, apiDelete } = await import('@/lib/api-client')

    await apiPut('/resource/1', { name: 'updated' })
    expect(capturedRequests.at(-1)?.method).toBe('PUT')

    await apiPatch('/resource/1', { name: 'patched' })
    expect(capturedRequests.at(-1)?.method).toBe('PATCH')

    await apiDelete('/resource/1')
    expect(capturedRequests.at(-1)?.method).toBe('DELETE')
  })
})
