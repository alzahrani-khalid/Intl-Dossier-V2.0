/**
 * useApproveWrite — caller-JWT commit + post-commit invalidation contract (P73 GENUI-03/04).
 *
 * Proves, with @/lib/supabase mocked:
 *  (a) signal commit issues an intelligence_event UPDATE setting status + the correct
 *      actor column (dismissed_by / escalated_by = auth.uid()) + status_changed_at,
 *      then invalidates signalKeys.lists();
 *  (b) digest commit calls rpc('publish_digest');
 *  (c) brief commit calls rpc('persist_brief') with p_dossier_id + a SINGLE p_content
 *      object (never p_content_en/p_content_ar);
 *  (d) work-item commit calls tasks-create then work-item-dossiers;
 *  (e) NO code path references a service-role key;
 *  (f) invalidation runs only AFTER the commit resolves (post-commit, not optimistic);
 *  (g) a NULL persist_brief return is a failure (throws), not a silent success.
 */
import React, { type ReactNode } from 'react'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Hoisted mock state — reset per test. Each captures the exact payload the commit builds.
const mockState = vi.hoisted(() => {
  return {
    getUser: vi.fn(),
    updateSpy: vi.fn(),
    updateEqSpy: vi.fn(),
    rpcSpy: vi.fn(),
    invokeSpy: vi.fn(),
    lastTable: '' as string,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseUrl: 'http://localhost:54321',
  supabase: {
    auth: { getUser: mockState.getUser },
    from: (table: string) => {
      mockState.lastTable = table
      return {
        update: (payload: Record<string, unknown>) => {
          mockState.updateSpy(table, payload)
          return { eq: mockState.updateEqSpy }
        },
      }
    },
    rpc: mockState.rpcSpy,
    functions: { invoke: mockState.invokeSpy },
  },
}))

// vi.mock is hoisted above imports by the Vitest transform, so the hook binds to the
// mocked @/lib/supabase regardless of this import's textual position.
import { useApproveWrite } from './useApproveWrite'

const createWrapper = (): {
  wrapper: React.FC<{ children: ReactNode }>
  client: QueryClient
} => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  const wrapper: React.FC<{ children: ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client }, children)
  return { wrapper, client }
}

beforeEach(() => {
  mockState.getUser.mockReset()
  mockState.updateSpy.mockReset()
  mockState.updateEqSpy.mockReset()
  mockState.rpcSpy.mockReset()
  mockState.invokeSpy.mockReset()
  mockState.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
  mockState.updateEqSpy.mockResolvedValue({ error: null })
  mockState.rpcSpy.mockResolvedValue({ data: 'new-id', error: null })
  mockState.invokeSpy.mockResolvedValue({ data: { task: { id: 'task-1' } }, error: null })
})

describe('useApproveWrite — caller-JWT commit + post-commit invalidation', () => {
  it('(a) signal dismiss: UPDATE status + dismissed_by + status_changed_at, then invalidate signalKeys.lists()', async () => {
    const { wrapper, client } = createWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useApproveWrite(), { wrapper })

    await result.current.commitSignalStatus({ signalId: 'sig-1', action: 'dismiss' })

    expect(mockState.updateSpy).toHaveBeenCalledTimes(1)
    const [table, payload] = mockState.updateSpy.mock.calls[0]
    expect(table).toBe('intelligence_event')
    expect(payload.status).toBe('dismissed')
    expect(payload.dismissed_by).toBe('user-1')
    expect(payload.status_changed_at).toBeTruthy()
    expect(payload.escalated_by).toBeUndefined()
    expect(mockState.updateEqSpy).toHaveBeenCalledWith('id', 'sig-1')
    // Post-commit (after the awaited UPDATE resolved), the signal list is invalidated.
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['signals', 'list'] })
  })

  it('(a2) signal escalate: UPDATE status=escalated + escalated_by (NOT dismissed_by)', async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useApproveWrite(), { wrapper })

    await result.current.commitSignalStatus({ signalId: 'sig-2', action: 'escalate' })

    const [, payload] = mockState.updateSpy.mock.calls[0]
    expect(payload.status).toBe('escalated')
    expect(payload.escalated_by).toBe('user-1')
    expect(payload.dismissed_by).toBeUndefined()
  })

  it('(b) digest: calls rpc(publish_digest) with the proposal args under the caller JWT', async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useApproveWrite(), { wrapper })

    await result.current.commitPublishDigest({
      dossierId: 'dos-1',
      period: 'weekly',
      summary: 'Weekly digest summary.',
    })

    expect(mockState.rpcSpy).toHaveBeenCalledTimes(1)
    const [fn, args] = mockState.rpcSpy.mock.calls[0]
    expect(fn).toBe('publish_digest')
    expect(args.p_dossier_id).toBe('dos-1')
    expect(args.p_period).toBe('weekly')
    expect(args.p_summary).toBe('Weekly digest summary.')
  })

  it('(c) brief: calls rpc(persist_brief) with p_dossier_id + a SINGLE p_content object (no per-language args)', async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useApproveWrite(), { wrapper })

    const content = {
      en: { summary: 'EN summary', sections: [] },
      ar: { summary: 'ملخص', sections: [] },
    }
    await result.current.commitBrief({ dossierId: 'dos-2', content })

    expect(mockState.rpcSpy).toHaveBeenCalledTimes(1)
    const [fn, args] = mockState.rpcSpy.mock.calls[0]
    expect(fn).toBe('persist_brief')
    expect(args.p_dossier_id).toBe('dos-2')
    expect(args.p_content).toEqual(content)
    // The reconciled live contract has NO per-language / engagement args.
    expect(args).not.toHaveProperty('p_content_en')
    expect(args).not.toHaveProperty('p_content_ar')
    expect(args).not.toHaveProperty('p_engagement_dossier_id')
  })

  it('(g) brief: a NULL persist_brief return is a failure (throws), not a silent success', async () => {
    mockState.rpcSpy.mockResolvedValue({ data: null, error: null })
    const { wrapper, client } = createWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useApproveWrite(), { wrapper })

    await expect(
      result.current.commitBrief({
        dossierId: 'dos-3',
        content: { en: { summary: '', sections: [] }, ar: { summary: '', sections: [] } },
      }),
    ).rejects.toThrow()
    // No invalidation on a failed (NULL) commit.
    expect(invalidateSpy).not.toHaveBeenCalled()
  })

  it('(d) work item: calls tasks-create then work-item-dossiers (in order)', async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useApproveWrite(), { wrapper })

    await result.current.commitWorkItem({
      title: 'Follow up',
      assigneeId: 'user-1',
      priority: 'high',
      dossierIds: ['dos-9'],
      inheritanceSource: 'direct',
    })

    expect(mockState.invokeSpy).toHaveBeenCalledTimes(2)
    expect(mockState.invokeSpy.mock.calls[0][0]).toBe('tasks-create')
    expect(mockState.invokeSpy.mock.calls[1][0]).toBe('work-item-dossiers')
    const linkBody = mockState.invokeSpy.mock.calls[1][1].body
    expect(linkBody.work_item_type).toBe('task')
    expect(linkBody.work_item_id).toBe('task-1')
    expect(linkBody.dossier_ids).toEqual(['dos-9'])
  })

  it('(e) the source references no service-role key', () => {
    const here = dirname(fileURLToPath(import.meta.url))
    const src = readFileSync(join(here, 'useApproveWrite.ts'), 'utf8')
    expect(src).not.toMatch(/service_role/i)
    expect(src).not.toMatch(/SERVICE_ROLE/)
  })

  it('(f) invalidation is post-commit: when the commit rejects, nothing is invalidated', async () => {
    mockState.updateEqSpy.mockResolvedValue({ error: new Error('rls denied') })
    const { wrapper, client } = createWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useApproveWrite(), { wrapper })

    await expect(
      result.current.commitSignalStatus({ signalId: 'sig-x', action: 'dismiss' }),
    ).rejects.toThrow()
    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
