import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SearchService } from '../../src/services/search.service'

const mocks = vi.hoisted(() => {
  type Terminal = { data: any; error: any }

  const state = {
    createClient: vi.fn(),
    from: vi.fn(),
    directTerminal: { data: [], error: null } as Terminal,
    singleTerminal: { data: null, error: null } as Terminal,
  }

  const makeChain = () => {
    const chain: any = {
      select: vi.fn(() => chain),
      insert: vi.fn(() => chain),
      update: vi.fn(() => chain),
      delete: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      match: vi.fn(() => chain),
      or: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      single: vi.fn(async () => state.singleTerminal),
      then: (onResolved: any, onRejected?: any) =>
        Promise.resolve(state.directTerminal).then(onResolved, onRejected),
      catch: (onRejected: any) => Promise.resolve(state.directTerminal).catch(onRejected),
      finally: (onFinally: any) => Promise.resolve(state.directTerminal).finally(onFinally),
    }
    return chain
  }

  state.from.mockImplementation(() => makeChain())
  state.createClient.mockReturnValue({ from: state.from })

  return {
    ...state,
    setDirectTerminal: (terminal: Terminal) => {
      state.directTerminal = terminal
    },
    setSingleTerminal: (terminal: Terminal) => {
      state.singleTerminal = terminal
    },
    reset: () => {
      state.directTerminal = { data: [], error: null }
      state.singleTerminal = { data: null, error: null }
      state.from.mockClear()
      state.createClient.mockClear()
      state.from.mockImplementation(() => makeChain())
      state.createClient.mockReturnValue({ from: state.from })
    },
  }
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: mocks.createClient,
}))

describe('SearchService', () => {
  const vectorService = {
    generateEmbeddingFromText: vi.fn(),
    searchByVector: vi.fn(),
    isInFallbackMode: vi.fn(),
  }

  let service: SearchService

  beforeEach(() => {
    mocks.reset()
    vi.clearAllMocks()
    vectorService.isInFallbackMode.mockReturnValue(false)
    service = new SearchService('http://supabase.test', 'service-key', vectorService as any)
  })

  it('returns vector-backed search results with pagination metadata', async () => {
    const report = {
      id: 'report-1',
      title: 'Report',
      created_at: new Date().toISOString(),
      threat_indicators: [],
      geospatial_tags: [],
    }
    vectorService.generateEmbeddingFromText.mockResolvedValue(new Array(1536).fill(1))
    vectorService.searchByVector.mockResolvedValue([
      { report_id: 'report-1', similarity: 0.9, report },
    ])

    const result = await service.search({ query: 'report', page_size: 10 })

    expect(result.data).toEqual([report])
    expect(result.total_count).toBe(1)
    expect(result.partial_results).toBe(false)
  })

  it('falls back to keyword search when the vector service cannot embed text', async () => {
    const reports = [
      { id: 'report-1', title: 'Keyword result', created_at: new Date().toISOString() },
    ]
    vectorService.generateEmbeddingFromText.mockResolvedValue(null)
    vectorService.isInFallbackMode.mockReturnValue(true)
    mocks.setDirectTerminal({ data: reports, error: null })

    const result = await service.search({ query: 'keyword', page_size: 10 })

    expect(result.data).toEqual(reports)
    expect(result.partial_results).toBe(true)
    expect(result.failed_filters).toContain('vector_search')
  })

  it('saves a valid search filter', async () => {
    const savedFilter = {
      id: 'filter-1',
      user_id: 'user-1',
      name: 'My filter',
      search_entities: ['reports'],
      filter_logic: 'AND',
      page_size: 25,
      timeout_behavior: 'partial',
      max_timeout_ms: 2000,
      is_default: false,
      created_at: new Date(),
      updated_at: new Date(),
    }
    mocks.setSingleTerminal({ data: savedFilter, error: null })

    const result = await service.saveSearchFilter({
      user_id: 'user-1',
      name: 'My filter',
      search_entities: ['reports'],
    })

    expect(result).toEqual(savedFilter)
    expect(mocks.from).toHaveBeenCalledWith('search_filters')
  })
})
