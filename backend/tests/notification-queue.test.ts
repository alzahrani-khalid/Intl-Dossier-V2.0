import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use vi.hoisted so mock variables are available inside vi.mock factories
const {
  mockQueueAdd,
  mockQueueClose,
  mockWorkerOn,
  mockWorkerClose,
  mockRpc,
  mockSingle,
  mockFrom,
} = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const eqSecond = vi.fn(() => ({ single: mockSingle }))
  const eqFirst = vi.fn(() => ({ eq: eqSecond }))
  const selectFn = vi.fn(() => ({ eq: eqFirst }))
  return {
    mockQueueAdd: vi.fn().mockResolvedValue({ id: 'job-1', name: 'send-notification' }),
    mockQueueClose: vi.fn().mockResolvedValue(undefined),
    mockWorkerOn: vi.fn(),
    mockWorkerClose: vi.fn().mockResolvedValue(undefined),
    mockRpc: vi.fn(),
    mockSingle,
    mockFrom: vi.fn(() => ({ select: selectFn })),
  }
})

// Mock ioredis before any imports that use it
vi.mock('ioredis', () => {
  class RedisMock {
    on = vi.fn()
    connect = vi.fn()
    ping = vi.fn()
    quit = vi.fn()
    status = 'ready'
  }
  return { default: RedisMock, Redis: RedisMock }
})

// Mock bullmq
vi.mock('bullmq', () => {
  class QueueMock {
    add = mockQueueAdd
    close = mockQueueClose
  }
  class WorkerMock {
    on = mockWorkerOn
    close = mockWorkerClose
  }
  return { Queue: QueueMock, Worker: WorkerMock }
})

// Mock supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    rpc: mockRpc,
    from: mockFrom,
  })),
}))

// Mock logger
vi.mock('../src/utils/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}))

import type { Job } from 'bullmq'
import type { NotificationJobData } from '../src/queues/notification.queue'
import { processNotificationJob } from '../src/queues/notification.processor'

const createMockJob = (data: NotificationJobData): Job<NotificationJobData> =>
  ({
    id: 'test-job-1',
    data,
    name: 'send-notification',
    attemptsMade: 0,
    log: vi.fn(),
  }) as unknown as Job<NotificationJobData>

const sampleJobData: NotificationJobData = {
  userId: 'user-123',
  type: 'work_item_assigned',
  title: 'New task assigned',
  message: 'You have been assigned a new task',
  category: 'assignments',
  priority: 'normal',
  actionUrl: '/tasks/456',
  sourceType: 'work_item',
  sourceId: 'wi-456',
  data: { extra: 'info' },
}

describe('Notification Queue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('notificationQueue.add()', () => {
    it('enqueues a job with correct data shape', async () => {
      const { notificationQueue } = await import('../src/queues/notification.queue')

      await notificationQueue.add('send-notification', sampleJobData)

      expect(mockQueueAdd).toHaveBeenCalledWith('send-notification', sampleJobData)
    })
  })

  describe('processNotificationJob', () => {
    it('calls create_categorized_notification RPC when user preferences allow', async () => {
      // User has no preference row -> defaults to enabled
      mockSingle.mockResolvedValue({ data: null, error: null })
      mockRpc.mockResolvedValue({ data: 'notif-uuid-1', error: null })

      const job = createMockJob(sampleJobData)
      await processNotificationJob(job)

      expect(mockRpc).toHaveBeenCalledWith('create_categorized_notification', {
        p_user_id: 'user-123',
        p_type: 'work_item_assigned',
        p_title: 'New task assigned',
        p_message: 'You have been assigned a new task',
        p_category: 'assignments',
        p_data: { extra: 'info' },
        p_priority: 'normal',
        p_action_url: '/tasks/456',
        p_source_type: 'work_item',
        p_source_id: 'wi-456',
      })
    })

    it('skips notification when user has in_app_enabled=false for the category', async () => {
      // User has explicitly disabled in-app for assignments
      mockSingle.mockResolvedValue({
        data: { in_app_enabled: false },
        error: null,
      })

      const job = createMockJob(sampleJobData)
      await processNotificationJob(job)

      expect(mockRpc).not.toHaveBeenCalled()
    })

    it('handles Supabase RPC errors gracefully by throwing for worker retry', async () => {
      // No preference row -> defaults to enabled
      mockSingle.mockResolvedValue({ data: null, error: null })
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database connection lost', code: '08006' },
      })

      const job = createMockJob(sampleJobData)

      await expect(processNotificationJob(job)).rejects.toThrow(
        'Failed to create notification: Database connection lost',
      )
    })
  })
})
