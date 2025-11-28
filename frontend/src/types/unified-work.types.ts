// Feature 032: Unified Work Management Types

export type WorkSource = 'commitment' | 'task' | 'intake';
export type TrackingType = 'delivery' | 'follow_up' | 'sla';
export type WorkItemStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue' | 'resolved' | 'closed' | 'done';
export type WorkItemPriority = 'low' | 'medium' | 'high' | 'critical' | 'urgent';

/** A single unified work item from commitments, tasks, or intake tickets */
export interface UnifiedWorkItem {
  id: string;
  source: WorkSource;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  assigned_to: string;
  deadline: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  dossier_id: string | null;
  tracking_type: TrackingType;
  is_overdue: boolean;
  days_until_due: number | null;
  metadata: WorkItemMetadata;
}

/** Source-specific metadata */
export interface WorkItemMetadata {
  // Commitment-specific
  proof_required?: boolean;
  proof_url?: string | null;
  evidence_submitted_at?: string | null;
  tracking_mode?: string;
  after_action_id?: string | null;

  // Task-specific
  type?: string;
  workflow_stage?: string;
  engagement_id?: string | null;
  work_item_type?: string | null;
  work_item_id?: string | null;

  // Intake-specific
  ticket_number?: string;
  request_type?: string;
  urgency?: string;
  sensitivity?: string;
  assigned_unit?: string | null;
}

/** User work summary for dashboard header */
export interface UserWorkSummary {
  user_id: string;
  total_active: number;
  overdue_count: number;
  due_today: number;
  due_this_week: number;
  commitment_count: number;
  task_count: number;
  intake_count: number;
  delivery_count: number;
  follow_up_count: number;
  sla_count: number;
  high_priority_count: number;
}

/** User productivity metrics */
export interface UserProductivityMetrics {
  user_id: string;
  completed_count_30d: number;
  on_time_rate_30d: number;
  avg_completion_hours_30d: number;
  completed_count_all: number;
  on_time_rate_all: number;
  avg_completion_hours_all: number;
  commitment_completed_30d: number;
  task_completed_30d: number;
  intake_completed_30d: number;
  last_refreshed_at: string;
}

/** Team member workload (for managers) */
export interface TeamMemberWorkload {
  user_id: string;
  user_email: string;
  total_active: number;
  overdue_count: number;
  due_this_week: number;
  high_priority_count: number;
  commitment_count: number;
  task_count: number;
  intake_count: number;
  on_time_rate_30d: number;
  completed_count_30d: number;
}

/** Filter parameters for work items query */
export interface WorkItemFilters {
  sources?: WorkSource[];
  trackingTypes?: TrackingType[];
  statuses?: string[];
  priorities?: string[];
  isOverdue?: boolean;
  dossierId?: string;
  searchQuery?: string;
}

/** Cursor for pagination */
export interface WorkItemCursor {
  deadline: string | null;
  id: string;
}

/** Paginated response for work items */
export interface PaginatedWorkItems {
  items: UnifiedWorkItem[];
  hasMore: boolean;
  nextCursor: WorkItemCursor | null;
}

/** Sort options for work items */
export type WorkItemSortBy = 'deadline' | 'created_at' | 'priority';
export type SortOrder = 'asc' | 'desc';

/** Query parameters for fetching work items */
export interface WorkItemQueryParams extends WorkItemFilters {
  cursor?: WorkItemCursor;
  limit?: number;
  sortBy?: WorkItemSortBy;
  sortOrder?: SortOrder;
}

/** URL state for the My Work dashboard */
export interface MyWorkUrlState {
  tab?: 'all' | 'commitments' | 'tasks' | 'intake';
  filter?: 'active' | 'overdue' | 'due-today' | 'due-week';
  trackingType?: TrackingType;
  search?: string;
  sortBy?: WorkItemSortBy;
  sortOrder?: SortOrder;
}

/** Realtime event types for work items */
export type WorkItemRealtimeEvent =
  | { type: 'INSERT'; payload: UnifiedWorkItem }
  | { type: 'UPDATE'; payload: Partial<UnifiedWorkItem> & { id: string } }
  | { type: 'DELETE'; payload: { id: string } };
