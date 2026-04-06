import { createClient } from '@supabase/supabase-js'
import { notificationQueue } from '../queues/notification.queue'
import type { NotificationJobData } from '../queues/notification.queue'

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
)

interface NotificationMetadata {
  dossierId?: string
  commitmentId?: string
  type?: 'health_score_drop' | 'commitment_overdue' | 'general'
  healthScore?: {
    previous: number
    current: number
    factors: string[]
  }
  [key: string]: any
}

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  metadata: NotificationMetadata
  read: boolean
  created_at: string
}

/**
 * T176: Send in-app notification to a user
 * @param userId - The user ID to send notification to
 * @param title - Notification title
 * @param message - Notification message
 * @param metadata - Additional metadata (dossier ID, commitment ID, etc.)
 * @returns The created notification record
 */
export async function sendInAppNotification(
  userId: string,
  title: string,
  message: string,
  metadata: NotificationMetadata = {},
): Promise<Notification> {
  // T177: Insert notification record into notifications table
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      metadata,
      read: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('[NOTIFICATION-SERVICE] Failed to send notification:', error)
    throw new Error(`Failed to send notification: ${error.message}`)
  }

  console.warn(`[NOTIFICATION-SERVICE] Sent notification to user ${userId}: "${title}"`)
  return data as Notification
}

/**
 * T183-T185: Send health score drop notification
 * @param dossierId - The dossier ID
 * @param dossierName - The dossier name
 * @param ownerId - The dossier owner user ID
 * @param previousScore - Previous health score
 * @param newScore - New health score
 * @param factors - Contributing factors for the drop
 */
export async function sendHealthScoreDropNotification(
  dossierId: string,
  dossierName: string,
  ownerId: string,
  previousScore: number,
  newScore: number,
  factors: string[],
): Promise<void> {
  // T183: Notification title
  const title = `Relationship health score dropped for ${dossierName}`

  // T184: Notification message
  const message = `Health score is now ${newScore} (was ${previousScore}). Contributing factors: ${factors.join(', ')}.`

  // T185: Include contributing factors in metadata
  await sendInAppNotification(ownerId, title, message, {
    dossierId,
    type: 'health_score_drop',
    healthScore: {
      previous: previousScore,
      current: newScore,
      factors,
    },
  })

  // T187: Log notification sending
  console.warn(
    `[HEALTH-NOTIFICATION] Sent notification to user ${ownerId} for dossier ${dossierId}`,
  )
}

/**
 * Enqueue a notification for async delivery via BullMQ.
 * Preferred path for all new trigger points (per D-07).
 * The worker checks user category preferences before inserting.
 */
export async function enqueueNotification(
  data: NotificationJobData,
  jobName = 'send-notification',
): Promise<void> {
  await notificationQueue.add(jobName, data)
}

/**
 * NotificationService class for after-action integration
 */
export class NotificationService {
  private supabaseUrl: string
  private supabaseKey: string

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabaseUrl = supabaseUrl
    this.supabaseKey = supabaseKey
  }

  /**
   * Notify commitment owners when an after-action is published
   */
  async notifyCommitmentOwners(
    afterActionId: string,
    afterActionTitle: string,
    commitments: Array<{ owner_id?: string; description?: string }>,
  ): Promise<{ notified: number; errors: string[] }> {
    const result = { notified: 0, errors: [] as string[] }

    for (const commitment of commitments) {
      if (!commitment.owner_id) continue

      try {
        await sendInAppNotification(
          commitment.owner_id,
          `New commitment assigned: ${afterActionTitle}`,
          commitment.description || 'A new commitment has been assigned to you.',
          {
            type: 'general',
            afterActionId,
          },
        )
        result.notified++
      } catch (error) {
        result.errors.push(`Failed to notify ${commitment.owner_id}: ${error}`)
      }
    }

    return result
  }
}

/**
 * Factory function for creating NotificationService instance
 */
export const createNotificationService = (
  supabaseUrl: string,
  supabaseKey: string,
): NotificationService => {
  return new NotificationService(supabaseUrl, supabaseKey)
}
