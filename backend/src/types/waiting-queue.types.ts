/**
 * Waiting Queue Actions - Type Definitions
 *
 * TypeScript interfaces for assignment actions, escalations, reminders, and filtering.
 * All types follow strict mode requirements with explicit nullability.
 */

/**
 * Work item details embedded in assignments
 */
export interface WorkItemDetails {
  title_en: string;
  title_ar: string;
  ticket_number?: string;
  type?: string;
  status?: string;
}

/**
 * Assignment entity from the waiting queue
 */
export interface Assignment {
  id: string;
  work_item_id: string;
  work_item_type: 'dossier' | 'ticket' | 'position';
  assignee_id: string | null;
  assignee_name?: string;
  assignee_email?: string;
  assigned_at: string; // ISO 8601 timestamp
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  workflow_stage: string;
  last_reminder_sent_at: string | null; // ISO 8601 timestamp
  escalated: boolean;
  _version: number; // For optimistic locking
  created_at: string;
  updated_at: string;
  work_item?: WorkItemDetails | null; // Work item details fetched from related tables
}

/**
 * Escalation record for audit trail
 */
export interface EscalationRecord {
  id: string;
  assignment_id: string;
  escalated_from_user_id: string;
  escalated_to_user_id: string;
  escalated_to_name?: string;
  escalated_to_email?: string;
  reason: string | null;
  status: 'pending' | 'acknowledged' | 'resolved';
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Follow-up reminder audit trail
 */
export interface FollowUpReminder {
  id: string;
  assignment_id: string;
  sent_by_user_id: string;
  sent_to_user_id: string;
  sent_at: string; // ISO 8601 timestamp
  delivery_status: 'pending' | 'sent' | 'failed' | 'delivered';
  notification_type: 'email' | 'in_app' | 'both';
  locale: 'en' | 'ar';
  error_message: string | null;
  retry_count: number;
  created_at: string;
}

/**
 * UI state for bulk selection
 */
export interface SelectionState {
  selected_ids: string[];
  select_all: boolean;
  total_count: number;
  max_selection: number; // Default 100
}

/**
 * Filter criteria for queue filtering
 */
export interface FilterCriteria {
  priority?: ('low' | 'medium' | 'high' | 'urgent')[];
  aging?: 'all' | '0-2' | '3-6' | '7+'; // Days
  work_item_type?: ('dossier' | 'ticket' | 'position')[];
  assignee_id?: string;
  status?: ('pending' | 'in_progress' | 'completed' | 'cancelled')[];
  workflow_stage?: string[];
  sort_by?: 'assigned_at_asc' | 'assigned_at_desc' | 'priority_high_low' | 'priority_low_high';
  page?: number;
  page_size?: number;
}

/**
 * Organizational hierarchy for escalation path resolution
 */
export interface OrganizationalHierarchy {
  id: string;
  user_id: string;
  manager_id: string | null;
  position_title: string;
  department: string | null;
  level: number; // Organizational level (1=top, increasing downward)
  created_at: string;
  updated_at: string;
}

/**
 * Request payload for sending a single follow-up reminder
 */
export interface SendReminderRequest {
  assignment_id: string;
  locale?: 'en' | 'ar'; // Default to user preference
}

/**
 * Response payload for sending a single follow-up reminder
 */
export interface SendReminderResponse {
  success: boolean;
  reminder_id: string;
  sent_at: string;
  message: string;
}

/**
 * Request payload for bulk reminder sending
 */
export interface SendBulkRemindersRequest {
  assignment_ids: string[]; // Max 100
  locale?: 'en' | 'ar';
}

/**
 * Response payload for bulk reminder sending
 */
export interface SendBulkRemindersResponse {
  success: boolean;
  job_id: string;
  total_queued: number;
  message: string;
}

/**
 * Job status for bulk operations
 */
export interface BulkJobStatus {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: {
    total: number;
    processed: number;
    successful: number;
    failed: number;
  };
  results?: {
    successful_ids: string[];
    failed_ids: string[];
    skipped_ids: string[]; // No assignee, cooldown active, etc.
  };
  error?: string;
  started_at: string | null;
  completed_at: string | null;
}

/**
 * Request payload for escalating an assignment
 */
export interface EscalateAssignmentRequest {
  assignment_id: string;
  escalate_to_user_id?: string; // Optional - auto-resolve from hierarchy if not provided
  reason?: string;
}

/**
 * Response payload for escalating an assignment
 */
export interface EscalateAssignmentResponse {
  success: boolean;
  escalation_id: string;
  escalated_to_user_id: string;
  escalated_to_name: string;
  escalated_to_email: string;
  message: string;
}

/**
 * Request payload for bulk escalation
 */
export interface EscalateBulkRequest {
  assignment_ids: string[]; // Max 100
  escalate_to_user_id?: string; // Optional - auto-resolve from hierarchy if not provided
  reason?: string;
}

/**
 * Response payload for bulk escalation
 */
export interface EscalateBulkResponse {
  success: boolean;
  job_id: string;
  total_queued: number;
  message: string;
}

/**
 * Request payload for acknowledging an escalation
 */
export interface AcknowledgeEscalationRequest {
  escalation_id: string;
}

/**
 * Response payload for acknowledging an escalation
 */
export interface AcknowledgeEscalationResponse {
  success: boolean;
  escalation_id: string;
  acknowledged_at: string;
  message: string;
}

/**
 * Request payload for filtering assignments
 */
export interface GetAssignmentsRequest {
  filters: FilterCriteria;
  cache_key?: string; // Optional - for cache invalidation
}

/**
 * Response payload for filtered assignments
 */
export interface GetAssignmentsResponse {
  success: boolean;
  data: Assignment[];
  pagination: {
    current_page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
  cache_hit: boolean;
  message: string;
}

/**
 * Error response payload
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Rate limit error details
 */
export interface RateLimitError extends ErrorResponse {
  error: {
    code: 'RATE_LIMIT_EXCEEDED';
    message: string;
    details: {
      limit: number;
      window_ms: number;
      retry_after_ms: number;
    };
  };
}

/**
 * Cooldown active error details
 */
export interface CooldownActiveError extends ErrorResponse {
  error: {
    code: 'COOLDOWN_ACTIVE';
    message: string;
    details: {
      last_sent_at: string;
      cooldown_hours: number;
      retry_after_ms: number;
    };
  };
}

/**
 * No escalation path error details
 */
export interface NoEscalationPathError extends ErrorResponse {
  error: {
    code: 'NO_ESCALATION_PATH';
    message: string;
    details: {
      user_id: string;
      user_name?: string;
    };
  };
}
