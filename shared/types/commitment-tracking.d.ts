/**
 * Shared TypeScript types for Commitment Tracking API
 * Feature: 030-health-commitment
 * Date: 2025-11-15
 */

/**
 * Commitment status enum
 */
export enum CommitmentStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Overdue = 'overdue'
}

/**
 * Overdue commitment detection request
 */
export interface OverdueDetectionRequest {
  /** Dry run mode (return overdue commitments without updating status) */
  dryRun?: boolean;
  /** Optional filter: only check commitments for specific dossier */
  dossierId?: string;
}

/**
 * Overdue commitment details
 */
export interface OverdueCommitment {
  /** Commitment UUID */
  id: string;
  /** Dossier UUID */
  dossierId: string;
  /** Dossier name */
  dossierName: string;
  /** Commitment description */
  description: string;
  /** Due date (ISO 8601) */
  dueDate: string;
  /** Days overdue */
  daysOverdue: number;
  /** Commitment owner UUID */
  ownerId: string;
  /** Commitment owner name */
  ownerName: string;
  /** Current status */
  status: CommitmentStatus;
}

/**
 * Overdue commitment detection response
 */
export interface OverdueDetectionResponse {
  /** Number of commitments marked as overdue */
  overdueCount: number;
  /** Number of unique dossiers affected */
  affectedDossiers: number;
  /** Number of notifications sent */
  notificationsSent: number;
  /** Number of health scores recalculated */
  healthScoresRecalculated: number;
  /** Whether this was a dry run */
  dryRun: boolean;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** List of overdue commitments */
  commitments: OverdueCommitment[];
}

/**
 * Refresh commitment stats request
 */
export interface RefreshCommitmentStatsRequest {
  // No parameters required - refreshes all commitment stats
}

/**
 * Refresh commitment stats response
 */
export interface RefreshCommitmentStatsResponse {
  /** Whether refresh was successful */
  success: boolean;
  /** When view was refreshed (ISO 8601) */
  refreshedAt: string;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Number of dossier rows updated */
  rowsUpdated: number;
}

/**
 * Commitment notification metadata
 */
export interface CommitmentNotificationMetadata {
  /** Commitment UUID */
  commitmentId: string;
  /** Dossier UUID */
  dossierId: string;
  /** Dossier name */
  dossierName: string;
  /** Commitment description */
  description: string;
  /** Due date (ISO 8601) */
  dueDate: string;
  /** Days overdue or days remaining */
  daysDelta: number;
  /** Notification type */
  notificationType: 'overdue' | 'upcoming' | 'status_change';
  /** Recommended actions */
  recommendedActions: string[];
}

/**
 * Commitment list filter options
 */
export interface CommitmentListFilter {
  /** Filter by dossier UUID */
  dossierId?: string;
  /** Filter by status (can be array for multiple statuses) */
  status?: CommitmentStatus | CommitmentStatus[];
  /** Filter by owner UUID */
  ownerId?: string;
  /** Filter commitments due within N days */
  dueSoonDays?: number;
  /** Filter overdue commitments only */
  overdueOnly?: boolean;
}

/**
 * Commitment sort options
 */
export type CommitmentSortField = 'dueDate' | 'createdAt' | 'priority';
export type CommitmentSortOrder = 'asc' | 'desc';

/**
 * Commitment list request
 */
export interface CommitmentListRequest {
  /** Filter options */
  filter?: CommitmentListFilter;
  /** Sort field */
  sortBy?: CommitmentSortField;
  /** Sort order */
  sortOrder?: CommitmentSortOrder;
  /** Pagination: page number (0-indexed) */
  page?: number;
  /** Pagination: items per page */
  pageSize?: number;
}

/**
 * Commitment summary for list display
 */
export interface CommitmentSummary {
  /** Commitment UUID */
  id: string;
  /** Dossier UUID */
  dossierId: string;
  /** Dossier name */
  dossierName: string;
  /** Commitment description */
  description: string;
  /** Due date (ISO 8601) */
  dueDate: string;
  /** Status */
  status: CommitmentStatus;
  /** Priority */
  priority: 'high' | 'medium' | 'low';
  /** Owner UUID */
  ownerId: string;
  /** Owner name */
  ownerName: string;
  /** Days until due (negative if overdue) */
  daysUntilDue: number;
  /** Created at (ISO 8601) */
  createdAt: string;
}

/**
 * Commitment list response
 */
export interface CommitmentListResponse {
  /** Array of commitments */
  commitments: CommitmentSummary[];
  /** Total count (all pages) */
  totalCount: number;
  /** Current page (0-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total pages */
  totalPages: number;
}
