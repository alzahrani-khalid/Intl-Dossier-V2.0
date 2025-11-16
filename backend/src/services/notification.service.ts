import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

interface NotificationMetadata {
  dossierId?: string;
  commitmentId?: string;
  type?: 'health_score_drop' | 'commitment_overdue' | 'general';
  healthScore?: {
    previous: number;
    current: number;
    factors: string[];
  };
  [key: string]: any;
}

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  metadata: NotificationMetadata;
  read: boolean;
  created_at: string;
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
  metadata: NotificationMetadata = {}
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
    .single();

  if (error) {
    console.error('[NOTIFICATION-SERVICE] Failed to send notification:', error);
    throw new Error(`Failed to send notification: ${error.message}`);
  }

  console.log(`[NOTIFICATION-SERVICE] Sent notification to user ${userId}: "${title}"`);
  return data as Notification;
}

/**
 * T178: Fetch notifications for a user
 * @param userId - The user ID to fetch notifications for
 * @param unreadOnly - If true, only return unread notifications
 * @returns Array of notifications
 */
export async function getNotifications(
  userId: string,
  unreadOnly: boolean = false
): Promise<Notification[]> {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[NOTIFICATION-SERVICE] Failed to fetch notifications:', error);
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }

  return (data as Notification[]) || [];
}

/**
 * T179: Mark notification as read
 * @param notificationId - The notification ID to mark as read
 * @returns The updated notification record
 */
export async function markNotificationAsRead(notificationId: string): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .select()
    .single();

  if (error) {
    console.error('[NOTIFICATION-SERVICE] Failed to mark notification as read:', error);
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }

  console.log(`[NOTIFICATION-SERVICE] Marked notification ${notificationId} as read`);
  return data as Notification;
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
  factors: string[]
): Promise<void> {
  // T183: Notification title
  const title = `Relationship health score dropped for ${dossierName}`;

  // T184: Notification message
  const message = `Health score is now ${newScore} (was ${previousScore}). Contributing factors: ${factors.join(', ')}.`;

  // T185: Include contributing factors in metadata
  await sendInAppNotification(ownerId, title, message, {
    dossierId,
    type: 'health_score_drop',
    healthScore: {
      previous: previousScore,
      current: newScore,
      factors,
    },
  });

  // T187: Log notification sending
  console.log(`[HEALTH-NOTIFICATION] Sent notification to user ${ownerId} for dossier ${dossierId}`);
}

/**
 * T189: Send overdue commitment notification (used by detect-overdue-commitments job)
 * @param commitment - The overdue commitment
 * @param dossierName - The dossier name
 * @param dossierOwnerId - The dossier owner user ID (optional)
 */
export async function sendOverdueNotification(
  commitment: {
    id: string;
    dossier_id: string;
    description: string;
    due_date: string;
    owner_id: string;
  },
  dossierName: string,
  dossierOwnerId?: string
): Promise<void> {
  const title = 'Commitment is overdue';
  const message = `${commitment.description} is overdue (due ${commitment.due_date}). Dossier: ${dossierName}. Recommended: Update status or extend deadline.`;

  const metadata = {
    dossierId: commitment.dossier_id,
    commitmentId: commitment.id,
    type: 'commitment_overdue' as const,
  };

  // Send notification to commitment owner
  await sendInAppNotification(commitment.owner_id, title, message, metadata);

  // T189: Send notification to dossier owner as well (if provided and different)
  if (dossierOwnerId && dossierOwnerId !== commitment.owner_id) {
    await sendInAppNotification(dossierOwnerId, title, message, metadata);
  }

  console.log(`[OVERDUE-NOTIFICATION] Sent notification for commitment ${commitment.id}`);
}

export default {
  sendInAppNotification,
  getNotifications,
  markNotificationAsRead,
  sendHealthScoreDropNotification,
  sendOverdueNotification,
};
