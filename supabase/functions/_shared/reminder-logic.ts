// Shared reminder logic module for Supabase Edge Functions
// Implements cooldown checking, reminder sending, and timestamp updates

import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export interface ReminderResult {
  success: boolean;
  message: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface Assignment {
  id: string;
  work_item_id: string;
  work_item_type: string;
  assignee_id: string | null;
  status: string;
  priority: string;
  last_reminder_sent_at: string | null;
  _version: number;
}

/**
 * Check if reminder cooldown is active for an assignment
 * @param supabase - Supabase client
 * @param assignmentId - Assignment ID to check
 * @param cooldownHours - Cooldown period in hours (default: 24)
 * @returns Object with canSend boolean and hours_remaining if on cooldown
 */
export async function checkCooldown(
  supabase: SupabaseClient,
  assignmentId: string,
  cooldownHours = 24
): Promise<{ canSend: boolean; hours_remaining?: number }> {
  const { data: assignment, error } = await supabase
    .from('assignments')
    .select('last_reminder_sent_at')
    .eq('id', assignmentId)
    .single();

  if (error || !assignment) {
    throw new Error('ASSIGNMENT_NOT_FOUND');
  }

  // No previous reminder - can send
  if (!assignment.last_reminder_sent_at) {
    return { canSend: true };
  }

  // Calculate hours since last reminder
  const lastReminderTime = new Date(assignment.last_reminder_sent_at);
  const now = new Date();
  const hoursSinceLastReminder =
    (now.getTime() - lastReminderTime.getTime()) / 1000 / 60 / 60;

  // Check if cooldown period has passed
  if (hoursSinceLastReminder >= cooldownHours) {
    return { canSend: true };
  }

  // Cooldown still active
  const hours_remaining = Math.ceil(cooldownHours - hoursSinceLastReminder);
  return { canSend: false, hours_remaining };
}

/**
 * Validate assignment before sending reminder
 * @param supabase - Supabase client
 * @param assignmentId - Assignment ID to validate
 * @returns Assignment object if valid
 */
export async function validateAssignment(
  supabase: SupabaseClient,
  assignmentId: string
): Promise<Assignment> {
  const { data: assignment, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', assignmentId)
    .single();

  if (error || !assignment) {
    throw new Error('ASSIGNMENT_NOT_FOUND');
  }

  // Check if assignment has assignee
  if (!assignment.assignee_id) {
    throw new Error('NO_ASSIGNEE');
  }

  // Check if assignment is in valid status
  const validStatuses = ['pending', 'assigned'];
  if (!validStatuses.includes(assignment.status)) {
    throw new Error('INVALID_STATUS');
  }

  return assignment as Assignment;
}

/**
 * Update last_reminder_sent_at timestamp for assignment
 * @param supabase - Supabase client
 * @param assignmentId - Assignment ID to update
 * @param expectedVersion - Expected version for optimistic locking (optional)
 * @returns Updated assignment or throws error on conflict
 */
export async function updateLastReminderSentAt(
  supabase: SupabaseClient,
  assignmentId: string,
  expectedVersion?: number
): Promise<Assignment> {
  const now = new Date().toISOString();

  // Build update query
  let query = supabase
    .from('assignments')
    .update({ last_reminder_sent_at: now })
    .eq('id', assignmentId);

  // Add version check for optimistic locking if provided
  if (expectedVersion !== undefined) {
    query = query.eq('_version', expectedVersion);
  }

  const { data: updatedAssignment, error } = await query.select().single();

  if (error) {
    // Check for version conflict (optimistic locking)
    if (error.code === 'PGRST116') {
      // No rows returned - version mismatch
      throw new Error('VERSION_CONFLICT');
    }
    throw error;
  }

  if (!updatedAssignment) {
    throw new Error('UPDATE_FAILED');
  }

  return updatedAssignment as Assignment;
}

/**
 * Create followup_reminders audit record
 * @param supabase - Supabase client
 * @param assignmentId - Assignment ID
 * @param sentByUserId - User who sent the reminder
 * @param recipientId - Assignee who receives the reminder
 * @param notificationType - Notification channel(s)
 * @returns Created reminder record ID
 */
export async function createReminderAuditRecord(
  supabase: SupabaseClient,
  assignmentId: string,
  sentByUserId: string,
  recipientId: string,
  notificationType: 'email' | 'in_app' | 'both' = 'both'
): Promise<string> {
  const { data, error } = await supabase
    .from('followup_reminders')
    .insert({
      assignment_id: assignmentId,
      sent_by: sentByUserId,
      recipient_id: recipientId,
      notification_type: notificationType,
      sent_at: new Date().toISOString(),
      delivery_status: 'pending',
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error('FAILED_TO_CREATE_AUDIT_RECORD');
  }

  return data.id;
}

/**
 * Send reminder notification via notification service with retry mechanism
 * Implements exponential backoff: 1s, 5s, 15s (max 3 retries)
 * @param notificationServiceUrl - URL of notification service
 * @param assignmentId - Assignment ID
 * @param recipientId - User ID of recipient
 * @param locale - User locale for bilingual notifications (en/ar)
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Notification delivery result
 */
export async function sendReminderNotification(
  notificationServiceUrl: string,
  assignmentId: string,
  recipientId: string,
  locale: 'en' | 'ar' = 'en',
  maxRetries = 3
): Promise<{ success: boolean; error?: string; attempts?: number }> {
  const retryDelays = [1000, 5000, 15000]; // Exponential backoff: 1s, 5s, 15s
  let lastError: string | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(notificationServiceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'WAITING_QUEUE_REMINDER',
          recipient_id: recipientId,
          locale,
          data: {
            assignment_id: assignmentId,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastError = `HTTP ${response.status}: ${errorText}`;

        // Don't retry on 4xx client errors (except 429 Too Many Requests)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          return {
            success: false,
            error: lastError,
            attempts: attempt + 1,
          };
        }

        // Retry on 5xx server errors and 429
        if (attempt < maxRetries) {
          const delay = retryDelays[attempt] || retryDelays[retryDelays.length - 1];
          console.warn(
            `Notification delivery attempt ${attempt + 1} failed: ${lastError}. Retrying in ${delay}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      } else {
        // Success!
        return { success: true, attempts: attempt + 1 };
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';

      // Retry on network errors
      if (attempt < maxRetries) {
        const delay = retryDelays[attempt] || retryDelays[retryDelays.length - 1];
        console.warn(
          `Notification delivery attempt ${attempt + 1} failed: ${lastError}. Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  // All retries exhausted
  return {
    success: false,
    error: `All ${maxRetries + 1} delivery attempts failed. Last error: ${lastError}`,
    attempts: maxRetries + 1,
  };
}

/**
 * Main function to send a follow-up reminder
 * Coordinates cooldown check, validation, notification, and audit trail
 * @param supabase - Supabase client
 * @param assignmentId - Assignment ID
 * @param sentByUserId - User sending the reminder
 * @param notificationServiceUrl - Notification service URL
 * @param cooldownHours - Cooldown period (default: 24)
 * @returns Reminder result
 */
export async function sendReminder(
  supabase: SupabaseClient,
  assignmentId: string,
  sentByUserId: string,
  notificationServiceUrl: string,
  cooldownHours = 24
): Promise<ReminderResult> {
  try {
    // 1. Validate assignment
    const assignment = await validateAssignment(supabase, assignmentId);

    // 2. Check cooldown
    const cooldownCheck = await checkCooldown(supabase, assignmentId, cooldownHours);
    if (!cooldownCheck.canSend) {
      return {
        success: false,
        message: 'Reminder cooldown is active',
        error: {
          code: 'COOLDOWN_ACTIVE',
          message: `Cannot send reminder within ${cooldownHours} hours of last reminder`,
          details: {
            hours_remaining: cooldownCheck.hours_remaining,
          },
        },
      };
    }

    // 3. Get recipient locale for bilingual notification
    const { data: recipientData } = await supabase
      .from('users')
      .select('locale')
      .eq('id', assignment.assignee_id!)
      .single();

    const locale = (recipientData?.locale as 'en' | 'ar') || 'en';

    // 4. Update last_reminder_sent_at (with optimistic locking)
    const updatedAssignment = await updateLastReminderSentAt(
      supabase,
      assignmentId,
      assignment._version
    );

    // 5. Create audit record
    const auditRecordId = await createReminderAuditRecord(
      supabase,
      assignmentId,
      sentByUserId,
      assignment.assignee_id!
    );

    // 6. Send notification (async - don't wait)
    const notificationResult = await sendReminderNotification(
      notificationServiceUrl,
      assignmentId,
      assignment.assignee_id!,
      locale
    );

    // 7. Update audit record with delivery status
    if (!notificationResult.success) {
      await supabase
        .from('followup_reminders')
        .update({
          delivery_status: 'failed',
          error_message: notificationResult.error,
        })
        .eq('id', auditRecordId);
    } else {
      await supabase
        .from('followup_reminders')
        .update({ delivery_status: 'delivered' })
        .eq('id', auditRecordId);
    }

    return {
      success: true,
      message: 'Reminder sent successfully',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Map error codes
    const errorCodeMap: Record<string, { code: string; message: string }> = {
      ASSIGNMENT_NOT_FOUND: {
        code: 'ASSIGNMENT_NOT_FOUND',
        message: 'Assignment not found',
      },
      NO_ASSIGNEE: {
        code: 'NO_ASSIGNEE',
        message: 'Assignment has no assignee',
      },
      INVALID_STATUS: {
        code: 'INVALID_STATUS',
        message: 'Cannot send reminder for completed or cancelled assignment',
      },
      VERSION_CONFLICT: {
        code: 'VERSION_CONFLICT',
        message: 'Assignment was modified by another request',
      },
    };

    const mappedError = errorCodeMap[errorMessage] || {
      code: 'INTERNAL_ERROR',
      message: errorMessage,
    };

    return {
      success: false,
      message: 'Failed to send reminder',
      error: mappedError,
    };
  }
}
