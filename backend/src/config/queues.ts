/**
 * BullMQ Queue Initialization
 *
 * Configures and exports BullMQ queues for reminder and escalation operations.
 * Uses Redis for queue management and job persistence.
 */

import { Queue, QueueOptions } from 'bullmq';
import redis from './redis';

/**
 * Common queue configuration options
 */
const baseQueueOptions: QueueOptions = {
  connection: redis,
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 1000, // Start with 1 second delay
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
      count: 1000, // Keep last 1000 failed jobs
    },
  },
};

/**
 * Reminder queue for follow-up notifications
 * Processes individual and bulk reminder sending operations
 */
export const reminderQueue = new Queue('waiting-queue-reminders', {
  ...baseQueueOptions,
  defaultJobOptions: {
    ...baseQueueOptions.defaultJobOptions,
    priority: 5, // Medium priority
  },
});

/**
 * Escalation queue for assignment escalations
 * Processes individual and bulk escalation operations
 */
export const escalationQueue = new Queue('waiting-queue-escalations', {
  ...baseQueueOptions,
  defaultJobOptions: {
    ...baseQueueOptions.defaultJobOptions,
    priority: 3, // Higher priority than reminders
  },
});

/**
 * Notification queue for email and in-app notifications
 * Handles the actual sending of notifications (retry logic included)
 */
export const notificationQueue = new Queue('waiting-queue-notifications', {
  ...baseQueueOptions,
  defaultJobOptions: {
    ...baseQueueOptions.defaultJobOptions,
    priority: 4, // High priority
    attempts: 3, // Retry up to 3 times (1s, 5s, 15s exponential backoff)
  },
});

/**
 * Job types for type safety
 */
export interface ReminderJobData {
  assignment_id: string;
  sent_by_user_id: string;
  sent_to_user_id: string;
  locale: 'en' | 'ar';
  notification_type: 'email' | 'in_app' | 'both';
}

export interface BulkReminderJobData {
  assignment_ids: string[];
  sent_by_user_id: string;
  locale: 'en' | 'ar';
  job_id: string;
}

export interface EscalationJobData {
  assignment_id: string;
  escalated_from_user_id: string;
  escalated_to_user_id: string;
  reason?: string;
}

export interface BulkEscalationJobData {
  assignment_ids: string[];
  escalated_from_user_id: string;
  escalated_to_user_id?: string; // Optional - auto-resolve from hierarchy if not provided
  reason?: string;
  job_id: string;
}

export interface NotificationJobData {
  recipient_user_id: string;
  recipient_email?: string;
  template: 'reminder-en' | 'reminder-ar' | 'escalation-en' | 'escalation-ar';
  data: Record<string, unknown>;
  notification_type: 'email' | 'in_app' | 'both';
  reminder_id?: string; // For tracking delivery status
  escalation_id?: string; // For tracking delivery status
}

/**
 * Queue health check
 * Returns true if all queues are connected and ready
 */
export async function checkQueuesHealth(): Promise<boolean> {
  try {
    await Promise.all([
      reminderQueue.client.ping(),
      escalationQueue.client.ping(),
      notificationQueue.client.ping(),
    ]);
    return true;
  } catch (error) {
    console.error('[Queues] Health check failed:', error);
    return false;
  }
}

/**
 * Get queue metrics for monitoring
 */
export async function getQueueMetrics() {
  const [reminderCounts, escalationCounts, notificationCounts] = await Promise.all([
    reminderQueue.getJobCounts(),
    escalationQueue.getJobCounts(),
    notificationQueue.getJobCounts(),
  ]);

  return {
    reminders: reminderCounts,
    escalations: escalationCounts,
    notifications: notificationCounts,
  };
}

/**
 * Gracefully close all queues
 */
export async function closeQueues(): Promise<void> {
  console.log('[Queues] Closing all queues...');
  await Promise.all([
    reminderQueue.close(),
    escalationQueue.close(),
    notificationQueue.close(),
  ]);
  console.log('[Queues] All queues closed');
}

// Export queues
export default {
  reminderQueue,
  escalationQueue,
  notificationQueue,
  checkQueuesHealth,
  getQueueMetrics,
  closeQueues,
};
