import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VectorService } from '../../src/services/vector.service'

const mocks = vi.hoisted(() => {
  type Terminal = { data: any; error: any }

  const state = {
    createClient: vi.fn(),
    from: vi.fn(),
    rpc: vi.fn(),
    singleTerminal: { data: null, error: null } as Terminal,
    directTerminal: { data: [], error: null } as Terminal,
  }

  const makeChain = () => {
    const chain: any = {
      select: vi.fn(() => chain),
      insert: vi.fn(() => chain),
      update: vi.fn(() => chain),
      delete: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      limit: vi.fn(async () => state.directTerminal),
      single: vi.fn(async () => state.singleTerminal),
      then: (onResolved: any, onRejected?: any) =>
        Promise.resolve(state.directTerminal).then(onResolved, onRejected),
      catch: (onRejected: any) => Promise.resolve(state.directTerminal).catch(onRejected),
      finally: (onFinally: any) => Promise.resolve(state.directTerminal).finally(onFinally),
    }
    return chain
  }

  state.from.mockImplementation(() => makeChain())
  state.createClient.mockReturnValue({ from: state.from, rpc: state.rpc })

  return {
    ...state,
    setSingleTerminal: (terminal: Terminal) => {
      state.singleTerminal = terminal
    },
    setDirectTerminal: (terminal: Terminal) => {
      state.directTerminal = terminal
    },
    reset: () => {
      state.singleTerminal = { data: null, error: null }
      state.directTerminal = { data: [], error: null }
      state.from.mockClear()
      state.rpc.mockClear()
      state.createClient.mockClear()
      state.from.mockImplementation(() => makeChain())
      state.createClient.mockReturnValue({ from: state.from, rpc: state.rpc })
    },
  }
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: mocks.createClient,
}))

describe('VectorService', () => {
  let service: VectorService

  beforeEach(() => {
    mocks.reset()
    service = new VectorService('http://supabase.test', 'service-key')
  })

  it('creates a normalized vector embedding row', async () => {
    const embedding = new Array(1536).fill(1)
    const created = {
      id: 'embedding-1',
      report_id: 'report-1',
      embedding,
      index_method: 'hnsw',
      ef_construction: 200,
      m_parameter: 16,
      similarity_threshold: 0.8,
      created_at: new Date(),
      updated_at: new Date(),
    }
    mocks.setSingleTerminal({ data: created, error: null })

    const result = await service.createEmbedding({ report_id: 'report-1', embedding })

    expect(result).toEqual(created)
    expect(mocks.from).toHaveBeenCalledWith('vector_embeddings')
  })

  it('rejects invalid embedding dimensions before writing', async () => {
    await expect(
      service.createEmbedding({ report_id: 'report-1', embedding: [1, 2, 3] }),
    ).rejects.toThrow('Validation failed')
  })

  it('maps vector search RPC rows into report search results', async () => {
    const report = {
      id: 'report-1',
      title: 'Report',
      created_at: new Date().toISOString(),
    }
    mocks.rpc.mockResolvedValueOnce({
      data: [{ report_id: 'report-1', similarity: 0.91, report }],
      error: null,
    })

    const results = await service.searchByVector({
      query_embedding: new Array(1536).fill(1),
      similarity_threshold: 0.8,
      limit: 5,
    })

    expect(results).toEqual([{ report_id: 'report-1', similarity: 0.91, report }])
    expect(mocks.rpc).toHaveBeenCalledWith('vector_search', {
      query_embedding: expect.any(Array),
      similarity_threshold: 0.8,
      match_count: 5,
      filter: {},
    })
  })
})
