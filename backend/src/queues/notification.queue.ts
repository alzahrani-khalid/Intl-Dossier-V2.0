import { Queue, Worker } from 'bullmq'
import type { Job } from 'bullmq'
import { queueConnection } from './queue-connection'
import { processNotificationJob } from './notification.processor'
import { processDeadlineCheck } from './deadline-scheduler'
import { processDigestJob } from './digest-scheduler'
import {
  processIntelligenceAlertJob,
  type IntelligenceAlertPayload,
} from './intelligence-alert.worker'

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

export type NotificationQueueJobData = NotificationJobData | IntelligenceAlertPayload

export async function processIntelligenceDigestJob(jobName: string): Promise<void> {
  void jobName
}

export const notificationQueue = new Queue<NotificationQueueJobData>('notifications', {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
})

export const notificationWorker = new Worker<NotificationQueueJobData>(
  'notifications',
  async (job: Job<NotificationQueueJobData>) => {
    if (job.name === 'check-deadlines') {
      await processDeadlineCheck()
      return
    }
    if (job.name === 'process-daily-digests' || job.name === 'process-weekly-digests') {
      await processDigestJob(job.name)
      return
    }
    if (job.name === 'intelligence-alert') {
      await processIntelligenceAlertJob(job.data as IntelligenceAlertPayload)
      return
    }
    if (
      job.name === 'process-intelligence-digests-daily' ||
      job.name === 'process-intelligence-digests-weekly' ||
      job.name === 'process-intelligence-digests-monthly'
    ) {
      await processIntelligenceDigestJob(job.name)
      return
    }
    await processNotificationJob(job as Job<NotificationJobData>)
  },
  {
    connection: queueConnection,
    concurrency: 5,
    // Deadline/digest jobs scan many rows; a longer lock + bounded stalled
    // retries prevent false stall detection and lock contention under the
    // duplicate-instance churn that tsx-watch reloads can cause in dev.
    lockDuration: 60_000,
    maxStalledCount: 2,
  },
)
