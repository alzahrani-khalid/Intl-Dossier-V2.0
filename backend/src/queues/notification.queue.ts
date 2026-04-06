import { Queue, Worker } from 'bullmq'
import type { Job } from 'bullmq'
import { queueConnection } from './queue-connection'
import { processNotificationJob } from './notification.processor'
import { processDeadlineCheck } from './deadline-scheduler'

export interface NotificationJobData {
  userId: string
  type: string
  title: string
  message: string
  category: 'assignments' | 'deadlines' | 'workflow'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  actionUrl?: string
  sourceType?: string
  sourceId?: string
  data?: Record<string, unknown>
}

export const notificationQueue = new Queue<NotificationJobData>('notifications', {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
})

export const notificationWorker = new Worker<NotificationJobData>(
  'notifications',
  async (job: Job<NotificationJobData>) => {
    if (job.name === 'check-deadlines') {
      await processDeadlineCheck()
      return
    }
    await processNotificationJob(job)
  },
  {
    connection: queueConnection,
    concurrency: 5,
  },
)
