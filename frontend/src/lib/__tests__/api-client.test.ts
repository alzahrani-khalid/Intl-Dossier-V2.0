import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      }),
    },
  },
}))

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

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

describe('apiClient', () => {
  beforeEach(() => {
    vi.resetModules()
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: 'test' }),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('apiGet sends GET request with Authorization header containing session token', async () => {
    const { apiGet } = await import('@/lib/api-client')
    await apiGet('/test-endpoint')

    expect(mockFetch).toHaveBeenCalledWith(
      `${edgeBase()}/test-endpoint`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    )
  })

  it('apiPost sends POST request with JSON-stringified body and Content-Type application/json', async () => {
    const { apiPost } = await import('@/lib/api-client')
    const body = { name: 'test', value: 42 }
    await apiPost('/test-endpoint', body)

    expect(mockFetch).toHaveBeenCalledWith(
      `${edgeBase()}/test-endpoint`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(body),
      }),
    )
  })

  it('apiGet throws Error with status code and statusText when response.ok is false', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    })

    const { apiGet } = await import('@/lib/api-client')
    await expect(apiGet('/missing')).rejects.toThrow('API error 404: Not Found')
  })

  it('apiGet uses Edge Functions base URL by default (VITE_SUPABASE_URL + /functions/v1)', async () => {
    const { apiGet } = await import('@/lib/api-client')
    await apiGet('/dossiers-list')

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toBe(`${edgeBase()}/dossiers-list`)
    expect(calledUrl).toContain('/functions/v1/')
  })

  it('apiGet uses Express base URL when options.baseUrl is express (VITE_API_URL)', async () => {
    const { apiGet } = await import('@/lib/api-client')
    await apiGet('/api/health', { baseUrl: 'express' })

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toBe(`${expressBase()}/api/health`)
    expect(calledUrl).not.toContain('/functions/v1')
  })

  it('apiPut, apiPatch, apiDelete use correct HTTP methods', async () => {
    const { apiPut, apiPatch, apiDelete } = await import('@/lib/api-client')

    await apiPut('/resource/1', { name: 'updated' })
    expect(mockFetch).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'PUT' }),
    )

    await apiPatch('/resource/1', { name: 'patched' })
    expect(mockFetch).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'PATCH' }),
    )

    await apiDelete('/resource/1')
    expect(mockFetch).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'DELETE' }),
    )
  })
})
