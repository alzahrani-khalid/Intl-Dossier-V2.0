/**
 * Commitment Types v1.1
 * Feature: 031-commitments-management
 *
 * TypeScript interfaces for commitment management with full CRUD operations,
 * status tracking, evidence upload, and filtering capabilities.
 */

// Note: Database types are manually defined here since the aa_commitments table
// and commitment_status_history table types need to match v1.1 schema.
// When regenerating database.types.ts, ensure these tables are included.

/**
 * Commitment status values
 * Note: 'overdue' is auto-applied by the backend when a commitment passes its due date
 */
export type CommitmentStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';

/**
 * Commitment priority levels
 */
export type CommitmentPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Commitment owner type
 */
export type CommitmentOwnerType = 'internal' | 'external';

/**
 * Commitment tracking mode
 */
export type CommitmentTrackingMode = 'automatic' | 'manual';

/**
 * Full commitment entity from aa_commitments table
 * Enhanced for v1.1 with title, proof fields, and audit fields
 */
export interface Commitment {
  id: string;
  dossier_id: string;
  after_action_id: string | null;

  // Core fields
  title: string;
  description: string;
  due_date: string;
  status: CommitmentStatus;
  priority: CommitmentPriority;

  // Owner fields
  owner_type: CommitmentOwnerType;
  owner_user_id: string | null;
  owner_contact_id: string | null;

  // Tracking fields
  tracking_mode: CommitmentTrackingMode;

  // Evidence fields (v1.1)
  proof_required: boolean;
  proof_url: string | null;
  evidence_submitted_at: string | null;

  // Completion fields
  completed_at: string | null;
  completion_notes: string | null;

  // AI extraction metadata
  ai_confidence: number | null;

  // Audit fields (v1.1)
  status_changed_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Commitment with computed properties for UI display
 */
export interface CommitmentWithComputedProps extends Commitment {
  isOverdue: boolean;
  daysOverdue: number;
  daysUntilDue: number;
  ownerName?: string;
  dossierName?: string;
}

/**
 * Status history entry for audit trail
 */
export interface CommitmentStatusHistory {
  id: string;
  commitment_id: string;
  old_status: CommitmentStatus | null;
  new_status: CommitmentStatus;
  changed_by: string;
  changed_at: string;
  notes: string | null;

  // Joined data for display
  changed_by_name?: string;
}

/**
 * Filter parameters for commitment queries
 */
export interface CommitmentFilters {
  // Entity filters
  dossierId?: string;
  ownerId?: string;
  ownerType?: CommitmentOwnerType;

  // Status filters
  status?: CommitmentStatus[];
  priority?: CommitmentPriority[];
  overdue?: boolean;

  // Date range filters
  dueDateFrom?: string;
  dueDateTo?: string;

  // Search
  search?: string;
}

/**
 * Pagination cursor for infinite scroll
 */
export interface PaginationCursor {
  due_date: string;
  id: string;
}

/**
 * Paginated response for commitment list
 */
export interface CommitmentsListResponse {
  commitments: Commitment[];
  totalCount: number;
  nextCursor: PaginationCursor | null;
  hasMore: boolean;
}

/**
 * Input for creating a new commitment
 */
export interface CreateCommitmentInput {
  dossier_id: string;
  after_action_id?: string | null;

  // Required fields
  title: string;
  description: string;
  due_date: string;
  owner_type: CommitmentOwnerType;

  // Optional fields with defaults
  priority?: CommitmentPriority;
  status?: CommitmentStatus;
  tracking_mode?: CommitmentTrackingMode;
  proof_required?: boolean;

  // Owner (one of these based on owner_type)
  owner_user_id?: string | null;
  owner_contact_id?: string | null;

  // Context tracking (for audit trail)
  created_from_route?: string;
  created_from_entity?: string; // JSON stringified { type, id }
}

/**
 * Input for updating an existing commitment
 */
export interface UpdateCommitmentInput {
  title?: string;
  description?: string;
  due_date?: string;
  priority?: CommitmentPriority;
  owner_type?: CommitmentOwnerType;
  owner_user_id?: string | null;
  owner_contact_id?: string | null;
  tracking_mode?: CommitmentTrackingMode;
  proof_required?: boolean;
  completion_notes?: string | null;
}

/**
 * Input for updating commitment status
 */
export interface UpdateCommitmentStatusInput {
  id: string;
  status: CommitmentStatus;
  notes?: string;
}

/**
 * Input for cancelling a commitment
 */
export interface CancelCommitmentInput {
  id: string;
  reason: string;
}

/**
 * Evidence upload response
 */
export interface EvidenceUploadResponse {
  proof_url: string;
  evidence_submitted_at: string;
}

/**
 * Signed URL response for evidence download
 */
export interface EvidenceUrlResponse {
  signedUrl: string;
  expiresAt: string;
}

/**
 * TanStack Query key factory for commitment queries
 */
export const commitmentKeys = {
  all: ['commitments'] as const,
  lists: () => [...commitmentKeys.all, 'list'] as const,
  list: (filters?: CommitmentFilters) => [...commitmentKeys.lists(), filters] as const,
  details: () => [...commitmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...commitmentKeys.details(), id] as const,
  history: (commitmentId: string) => [...commitmentKeys.all, 'history', commitmentId] as const,
};

/**
 * Valid status transitions for non-admin users
 */
export const VALID_STATUS_TRANSITIONS: Record<CommitmentStatus, CommitmentStatus[]> = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['pending', 'completed', 'cancelled'],
  completed: [], // Cannot change without admin
  cancelled: [], // Cannot change
  overdue: ['in_progress', 'completed', 'cancelled'], // Overdue items can still be worked on
};

/**
 * Check if a status transition is valid for non-admin users
 */
export function isValidStatusTransition(
  from: CommitmentStatus,
  to: CommitmentStatus
): boolean {
  return VALID_STATUS_TRANSITIONS[from].includes(to);
}

/**
 * Status color mapping for UI
 */
export const STATUS_COLORS: Record<CommitmentStatus, { bg: string; text: string; border: string }> = {
  pending: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  in_progress: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  completed: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  cancelled: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-800',
  },
  overdue: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
};

/**
 * Priority color mapping for UI
 */
export const PRIORITY_COLORS: Record<CommitmentPriority, { bg: string; text: string }> = {
  low: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
  },
  medium: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
  high: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
  },
  critical: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
  },
};

/**
 * Allowed file types for evidence upload
 */
export const ALLOWED_EVIDENCE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

/**
 * Maximum evidence file size in bytes (10MB)
 */
export const MAX_EVIDENCE_SIZE = 10 * 1024 * 1024;

/**
 * Default page size for pagination
 */
export const DEFAULT_PAGE_SIZE = 20;
