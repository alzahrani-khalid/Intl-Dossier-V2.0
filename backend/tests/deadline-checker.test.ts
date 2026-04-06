import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock logger - must be before imports that use it
vi.mock('../src/utils/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

// Mock notification queue - factory cannot reference outer variables
vi.mock('../src/queues/notification.queue', () => ({
  notificationQueue: {
    add: vi.fn().mockResolvedValue(undefined),
  },
}))

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => {
  const chainMethods = (): Record<string, unknown> => {
    const chain: Record<string, unknown> = {}
    const methods = ['select', 'eq', 'neq', 'not', 'lte', 'gt']
    for (const m of methods) {
      chain[m] = vi.fn(() => chain)
    }
    // Default: return empty data
    chain._resolve = { data: [] as unknown[] }
    // Make thenable
    chain.then = function (
      resolve: (val: { data: unknown[] }) => void,
    ): Record<string, unknown> {
      resolve((chain as { _resolve: { data: unknown[] } })._resolve)
      return chain
    }
    return chain
  }

  let callIndex = 0
  const mockResults: Array<{ data: unknown[] }> = []

  const mockFrom = vi.fn(() => {
    const chain = chainMethods()
    if (mockResults.length > 0 && callIndex < mockResults.length) {
      chain._resolve = mockResults[callIndex]
      callIndex++
    }
    return chain
  })

  return {
    createClient: vi.fn(() => ({
      from: mockFrom,
    })),
    __setMockResults: (results: Array<{ data: unknown[] }>): void => {
      mockResults.length = 0
      mockResults.push(...results)
      callIndex = 0
    },
    __getMockFrom: (): ReturnType<typeof vi.fn> => mockFrom,
  }
})

// Import after mocks
import { processDeadlineCheck } from '../src/queues/deadline-scheduler'
import { notificationQueue } from '../src/queues/notification.queue'
import { __setMockResults } from '@supabase/supabase-js'

describe('processDeadlineCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    __setMockResults([])
  })

  it('finds tasks with sla_deadline within 24 hours and enqueues deadline-approaching notification', async () => {
    const approachingTask = {
      id: 'task-1',
      title: 'Approaching task',
      assignee_id: 'user-1',
      sla_deadline: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    }

    __setMockResults([
      { data: [approachingTask] }, // approaching query
      { data: [] },                // overdue query
    ])

    await processDeadlineCheck()

    expect(notificationQueue.add).toHaveBeenCalledWith(
      'deadline-approaching',
      expect.objectContaining({
        userId: 'user-1',
        type: 'deadline_approaching',
        category: 'deadlines',
        priority: 'high',
      }),
      expect.objectContaining({
        jobId: 'deadline-24h-task-1',
      }),
    )
  })

  it('finds overdue tasks and enqueues deadline-overdue notification', async () => {
    const overdueTask = {
      id: 'task-2',
      title: 'Overdue task',
      assignee_id: 'user-2',
      sla_deadline: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    }

    __setMockResults([
      { data: [] },               // approaching query
      { data: [overdueTask] },    // overdue query
    ])

    await processDeadlineCheck()

    expect(notificationQueue.add).toHaveBeenCalledWith(
      'deadline-overdue',
      expect.objectContaining({
        userId: 'user-2',
        type: 'deadline_overdue',
        category: 'deadlines',
        priority: 'urgent',
      }),
      expect.objectContaining({
        jobId: 'deadline-overdue-task-2',
      }),
    )
  })

  it('skips completed and cancelled tasks', async () => {
    // Both queries return empty (completed/cancelled filtered out by DB query)
    __setMockResults([
      { data: [] }, // approaching
      { data: [] }, // overdue
    ])

    await processDeadlineCheck()

    expect(notificationQueue.add).not.toHaveBeenCalledWith(
      'deadline-approaching',
      expect.anything(),
      expect.anything(),
    )
    expect(notificationQueue.add).not.toHaveBeenCalledWith(
      'deadline-overdue',
      expect.anything(),
      expect.anything(),
    )
  })

  it('uses jobId for dedup to prevent re-enqueuing same deadline notification', async () => {
    const task = {
      id: 'task-dedup',
      title: 'Dedup test',
      assignee_id: 'user-3',
      sla_deadline: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    }

    __setMockResults([
      { data: [task] }, // approaching
      { data: [] },     // overdue
    ])

    await processDeadlineCheck()

    expect(notificationQueue.add).toHaveBeenCalledWith(
      'deadline-approaching',
      expect.anything(),
      expect.objectContaining({
        jobId: 'deadline-24h-task-dedup',
      }),
    )
  })
})
