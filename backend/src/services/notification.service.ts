/**
 * Notification Service (T051)
 * User Story 1: Quick After-Action Creation
 *
 * Purpose: Queue in-app and email notifications for commitment owners
 * Handles notification delivery for after-action events (publish, edit approval, etc.)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import logger from '../utils/logger';

type Notification = Database['public']['Tables']['notifications']['Insert'];
type NotificationRow = Database['public']['Tables']['notifications']['Row'];

export interface NotificationParams {
  recipientUserId?: string; // For internal users
  recipientEmail?: string; // For external contacts
  notificationType: 'commitment_assigned' | 'after_action_published' | 'edit_approved' | 'edit_rejected' | 'task_reminder' | 'commitment_overdue';
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  relatedEntityType: 'after_action' | 'commitment' | 'task' | 'dossier';
  relatedEntityId: string;
  actionUrl?: string; // Deep link for mobile or web URL
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  sendEmail?: boolean;
  sendInApp?: boolean;
  sendPush?: boolean;
}

export interface NotificationQueueResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

export interface BulkNotificationResult {
  success: boolean;
  totalQueued: number;
  failed: number;
  notificationIds: string[];
  errors: string[];
}

export class NotificationService {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  /**
   * Queue a single notification for delivery
   * Supports in-app, email, and push notifications
   */
  async queueNotification(params: NotificationParams): Promise<NotificationQueueResult> {
    const {
      recipientUserId,
      recipientEmail,
      notificationType,
      title,
      titleAr,
      message,
      messageAr,
      relatedEntityType,
      relatedEntityId,
      actionUrl,
      priority = 'medium',
      sendEmail = true,
      sendInApp = true,
      sendPush = true,
    } = params;

    logger.info('Queueing notification', {
      notificationType,
      recipientUserId,
      recipientEmail,
      relatedEntityType,
      relatedEntityId,
    });

    // Validate recipient
    if (!recipientUserId && !recipientEmail) {
      const error = 'At least one of recipientUserId or recipientEmail is required';
      logger.error(error);
      return { success: false, error };
    }

    try {
      // Build notification record
      const notificationData: Notification = {
        recipient_user_id: recipientUserId || null,
        recipient_email: recipientEmail || null,
        notification_type: notificationType,
        title,
        title_ar: titleAr || null,
        message,
        message_ar: messageAr || null,
        related_entity_type: relatedEntityType,
        related_entity_id: relatedEntityId,
        action_url: actionUrl || null,
        priority,
        status: 'pending',
        send_email: sendEmail,
        send_in_app: sendInApp,
        send_push: sendPush,
        read_at: null,
        sent_at: null,
        // Timestamps handled by database defaults
      };

      // Insert notification
      const { data, error } = await this.supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single();

      if (error) {
        logger.error('Failed to queue notification', {
          notificationType,
          error: error.message,
        });
        return { success: false, error: error.message };
      }

      if (!data) {
        const error = 'Notification insert returned no data';
        logger.error(error);
        return { success: false, error };
      }

      logger.info('Notification queued successfully', {
        notificationId: data.id,
        notificationType,
        recipientUserId,
      });

      return { success: true, notificationId: data.id };
    } catch (error) {
      const errorMsg = `Failed to queue notification: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      logger.error(errorMsg, { notificationType, error });
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Queue notifications for commitment owners when after-action is published
   * Creates one notification per commitment owner
   */
  async notifyCommitmentOwners(
    afterActionId: string,
    afterActionTitle: string,
    commitments: Array<{
      id: string;
      description_en: string;
      description_ar?: string | null;
      due_date: string;
      owner_type: 'internal' | 'external';
      internal_owner_id?: string | null;
      external_contact_id?: string | null;
    }>
  ): Promise<BulkNotificationResult> {
    logger.info('Notifying commitment owners', {
      afterActionId,
      commitmentCount: commitments.length,
    });

    const result: BulkNotificationResult = {
      success: true,
      totalQueued: 0,
      failed: 0,
      notificationIds: [],
      errors: [],
    };

    // Group commitments by owner to avoid duplicate notifications
    const ownerCommitments = new Map<string, typeof commitments>();

    for (const commitment of commitments) {
      const ownerId =
        commitment.owner_type === 'internal'
          ? commitment.internal_owner_id
          : commitment.external_contact_id;

      if (!ownerId) {
        logger.warn('Commitment has no owner - skipping notification', {
          commitmentId: commitment.id,
        });
        continue;
      }

      if (!ownerCommitments.has(ownerId)) {
        ownerCommitments.set(ownerId, []);
      }
      ownerCommitments.get(ownerId)!.push(commitment);
    }

    // Send one notification per owner with their commitments
    for (const [ownerId, ownerCommitmentList] of ownerCommitments.entries()) {
      try {
        // Determine if internal user or external contact
        const firstCommitment = ownerCommitmentList[0];
        const isInternal = firstCommitment.owner_type === 'internal';

        let recipientUserId: string | undefined;
        let recipientEmail: string | undefined;

        if (isInternal) {
          recipientUserId = ownerId;
        } else {
          // Get external contact email
          const { data: contact } = await this.supabase
            .from('external_contacts')
            .select('email')
            .eq('id', ownerId)
            .single();

          if (contact) {
            recipientEmail = contact.email;
          }
        }

        // Build notification message
        const commitmentCount = ownerCommitmentList.length;
        const commitmentWord = commitmentCount === 1 ? 'commitment' : 'commitments';
        const commitmentWordAr = commitmentCount === 1 ? 'التزام' : 'التزامات';

        const title = `New ${commitmentWord} assigned from: ${afterActionTitle}`;
        const titleAr = `تم تعيين ${commitmentWordAr} جديدة من: ${afterActionTitle}`;

        const commitmentList = ownerCommitmentList
          .map((c) => `- ${c.description_en} (due: ${c.due_date})`)
          .join('\n');

        const commitmentListAr = ownerCommitmentList
          .map((c) => `- ${c.description_ar || c.description_en} (الموعد النهائي: ${c.due_date})`)
          .join('\n');

        const message = `You have been assigned ${commitmentCount} ${commitmentWord}:\n\n${commitmentList}`;
        const messageAr = `تم تعيين ${commitmentCount} ${commitmentWordAr} لك:\n\n${commitmentListAr}`;

        const actionUrl = `/after-action/${afterActionId}`;

        // Queue notification
        const notificationResult = await this.queueNotification({
          recipientUserId,
          recipientEmail,
          notificationType: 'commitment_assigned',
          title,
          titleAr,
          message,
          messageAr,
          relatedEntityType: 'after_action',
          relatedEntityId: afterActionId,
          actionUrl,
          priority: 'medium',
          sendEmail: true,
          sendInApp: isInternal, // Only in-app for internal users
          sendPush: isInternal,
        });

        if (notificationResult.success && notificationResult.notificationId) {
          result.totalQueued++;
          result.notificationIds.push(notificationResult.notificationId);
        } else {
          result.failed++;
          result.errors.push(
            notificationResult.error || 'Unknown error queuing notification'
          );
          result.success = false;
        }
      } catch (error) {
        const errorMsg = `Failed to notify owner ${ownerId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`;
        logger.error(errorMsg, { ownerId, error });
        result.failed++;
        result.errors.push(errorMsg);
        result.success = false;
      }
    }

    logger.info('Commitment owner notifications completed', {
      afterActionId,
      totalQueued: result.totalQueued,
      failed: result.failed,
    });

    return result;
  }

  /**
   * Send task reminder notification 24 hours before due date
   * Called by scheduled job
   */
  async sendTaskReminder(
    taskId: string,
    taskTitle: string,
    taskTitleAr: string | null,
    dueDate: string,
    assigneeUserId?: string,
    externalAssigneeEmail?: string
  ): Promise<NotificationQueueResult> {
    logger.info('Sending task reminder', {
      taskId,
      assigneeUserId,
      externalAssigneeEmail,
      dueDate,
    });

    const title = `Task due tomorrow: ${taskTitle}`;
    const titleAr = taskTitleAr
      ? `المهمة مستحقة غدًا: ${taskTitleAr}`
      : `المهمة مستحقة غدًا: ${taskTitle}`;

    const message = `Your task "${taskTitle}" is due on ${dueDate}. Please complete it on time.`;
    const messageAr = `مهمتك "${taskTitleAr || taskTitle}" مستحقة في ${dueDate}. يرجى إكمالها في الوقت المحدد.`;

    return await this.queueNotification({
      recipientUserId: assigneeUserId,
      recipientEmail: externalAssigneeEmail,
      notificationType: 'task_reminder',
      title,
      titleAr,
      message,
      messageAr,
      relatedEntityType: 'task',
      relatedEntityId: taskId,
      actionUrl: `/tasks/${taskId}`,
      priority: 'medium',
      sendEmail: true,
      sendInApp: !!assigneeUserId,
      sendPush: !!assigneeUserId,
    });
  }

  /**
   * Mark notification as read (in-app)
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    logger.info('Marking notification as read', { notificationId });

    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) {
        logger.error('Failed to mark notification as read', {
          notificationId,
          error: error.message,
        });
        return false;
      }

      logger.info('Notification marked as read', { notificationId });
      return true;
    } catch (error) {
      logger.error('Error marking notification as read', {
        notificationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Get unread notifications for a user (in-app)
   */
  async getUnreadNotifications(userId: string): Promise<NotificationRow[]> {
    logger.info('Fetching unread notifications', { userId });

    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('recipient_user_id', userId)
        .is('read_at', null)
        .eq('send_in_app', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        logger.error('Failed to fetch unread notifications', {
          userId,
          error: error.message,
        });
        throw new Error(`Database error: ${error.message}`);
      }

      logger.info('Unread notifications fetched', {
        userId,
        count: data?.length || 0,
      });

      return data || [];
    } catch (error) {
      logger.error('Error fetching unread notifications', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Delete old read notifications (cleanup job)
   * Keeps system performant by removing old notifications
   */
  async deleteOldReadNotifications(daysOld: number = 30): Promise<number> {
    logger.info('Deleting old read notifications', { daysOld });

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await this.supabase
        .from('notifications')
        .delete()
        .not('read_at', 'is', null)
        .lt('read_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        logger.error('Failed to delete old notifications', {
          error: error.message,
        });
        return 0;
      }

      const deletedCount = data?.length || 0;
      logger.info('Old notifications deleted', { deletedCount });

      return deletedCount;
    } catch (error) {
      logger.error('Error deleting old notifications', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }
}

// Export singleton instance for use across application
export const createNotificationService = (
  supabaseUrl: string,
  supabaseKey: string
): NotificationService => {
  return new NotificationService(supabaseUrl, supabaseKey);
};
