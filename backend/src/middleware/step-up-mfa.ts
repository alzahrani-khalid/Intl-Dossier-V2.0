/**
 * Step-Up MFA Middleware
 * Purpose: FR-007 + spec L49 - require re-authentication for confidential operations
 *
 * Checks if the user has recently authenticated with MFA for sensitive operations.
 * If MFA verification is expired (>15 minutes), returns 403 with step-up requirement.
 */

import { createClient } from '@supabase/supabase-js';
import logger from '../utils/logger';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// MFA expiry in minutes (default: 15 minutes)
const MFA_EXPIRY_MINUTES = parseInt(
  process.env.STEP_UP_MFA_EXPIRY_MINUTES || '15',
  10
);

// Classification levels that require step-up MFA
const CONFIDENTIAL_LEVELS = ['confidential', 'secret', 'top-secret'];

interface StepUpMFAOptions {
  ticketId?: string;
  userId: string;
  operation: string;
}

interface StepUpMFAResult {
  required: boolean;
  verified: boolean;
  message?: string;
}

/**
 * Check if step-up MFA is required and verified for an operation
 */
export async function checkStepUpMFA(
  options: StepUpMFAOptions
): Promise<StepUpMFAResult> {
  const { ticketId, userId, operation } = options;

  try {
    // If no ticket ID provided, check if operation itself requires MFA
    if (!ticketId) {
      // Operations that always require MFA
      const alwaysRequireMFA = [
        'delete_ticket',
        'export_sensitive_data',
        'modify_permissions',
      ];

      if (alwaysRequireMFA.includes(operation)) {
        return await verifyMFATimestamp(userId, operation);
      }

      return { required: false, verified: true };
    }

    // Get ticket classification level
    const { data: ticket, error } = await supabase
      .from('intake_tickets')
      .select('id, sensitivity')
      .eq('id', ticketId)
      .single();

    if (error || !ticket) {
      logger.error('Failed to retrieve ticket for MFA check', {
        ticketId,
        userId,
        error: error?.message,
      });
      // Fail secure: require MFA if we can't determine classification
      return {
        required: true,
        verified: false,
        message: 'Unable to determine ticket classification',
      };
    }

    // Check if ticket requires step-up MFA
    if (CONFIDENTIAL_LEVELS.includes(ticket.sensitivity)) {
      logger.info('Step-up MFA required for confidential ticket', {
        ticketId,
        userId,
        sensitivity: ticket.sensitivity,
        operation,
      });

      return await verifyMFATimestamp(userId, operation);
    }

    // Not confidential - no MFA required
    return { required: false, verified: true };
  } catch (error) {
    logger.error('Step-up MFA check failed', {
      ticketId,
      userId,
      operation,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Fail secure
    return {
      required: true,
      verified: false,
      message: 'MFA verification failed',
    };
  }
}

/**
 * Verify that user has completed MFA within the expiry window
 */
async function verifyMFATimestamp(
  userId: string,
  operation: string
): Promise<StepUpMFAResult> {
  // Get the latest MFA verification timestamp from audit logs
  const { data: mfaLogs, error } = await supabase
    .from('audit_logs')
    .select('created_at, mfa_verified')
    .eq('user_id', userId)
    .eq('action', 'mfa_verify')
    .eq('mfa_verified', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !mfaLogs) {
    logger.warn('No recent MFA verification found', { userId, operation });
    return {
      required: true,
      verified: false,
      message: 'MFA verification required',
    };
  }

  // Check if MFA is still valid
  const mfaTimestamp = new Date(mfaLogs.created_at);
  const now = new Date();
  const minutesElapsed = Math.floor(
    (now.getTime() - mfaTimestamp.getTime()) / 60000
  );

  if (minutesElapsed > MFA_EXPIRY_MINUTES) {
    logger.warn('MFA verification expired', {
      userId,
      operation,
      minutesElapsed,
      expiryMinutes: MFA_EXPIRY_MINUTES,
    });

    return {
      required: true,
      verified: false,
      message: `MFA verification expired (${minutesElapsed} minutes ago). Please re-authenticate.`,
    };
  }

  logger.info('MFA verification valid', {
    userId,
    operation,
    minutesElapsed,
  });

  return { required: true, verified: true };
}

/**
 * Record MFA verification in audit logs
 */
export async function recordMFAVerification(
  userId: string,
  method: string,
  ipAddress?: string,
  userAgent?: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      entity_type: 'user',
      entity_id: userId,
      action: 'mfa_verify',
      user_id: userId,
      user_role: 'user', // Should be fetched from user context
      ip_address: ipAddress,
      user_agent: userAgent,
      required_mfa: true,
      mfa_verified: true,
      mfa_method: method,
      created_at: new Date().toISOString(),
    });

    if (error) {
      logger.error('Failed to record MFA verification', {
        userId,
        method,
        error: error.message,
      });
      return false;
    }

    logger.info('MFA verification recorded', { userId, method });
    return true;
  } catch (error) {
    logger.error('Exception recording MFA verification', {
      userId,
      method,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Middleware function for Express/Supabase Edge Functions
 * Returns 403 with X-Require-Step-Up header if MFA verification needed
 */
export async function requireStepUpMFA(
  userId: string,
  ticketId: string,
  operation: string
): Promise<{ success: boolean; status?: number; headers?: Record<string, string>; message?: string }> {
  const mfaCheck = await checkStepUpMFA({ userId, ticketId, operation });

  if (mfaCheck.required && !mfaCheck.verified) {
    return {
      success: false,
      status: 403,
      headers: {
        'X-Require-Step-Up': 'true',
        'X-Step-Up-Reason': mfaCheck.message || 'MFA verification required',
      },
      message: mfaCheck.message || 'MFA verification required for this operation',
    };
  }

  return { success: true };
}