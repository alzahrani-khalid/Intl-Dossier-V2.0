/**
 * User Management API Client
 * Provides methods for user lifecycle management operations
 */

import { supabase } from '@/lib/supabase';

// ============================================================================
// Types
// ============================================================================

export interface CreateUserRequest {
  email: string;
  username: string;
  full_name: string;
  role: 'admin' | 'editor' | 'viewer';
  user_type?: 'employee' | 'guest';
  expires_at?: string; // ISO date string (required for guest)
  allowed_resources?: string[]; // Array of resource UUIDs (required for guest)
}

export interface CreateUserResponse {
  success: boolean;
  user_id: string;
  activation_sent: boolean;
  activation_expires_at: string;
}

export interface ActivateAccountRequest {
  activation_token: string;
  password: string;
}

export interface ActivateAccountResponse {
  success: boolean;
  message: string;
}

export interface ApiError {
  error: string;
  code: string;
  details?: string[];
}

export interface AssignRoleRequest {
  user_id: string;
  new_role: 'admin' | 'editor' | 'viewer';
  reason?: string;
}

export interface AssignRoleImmediateResponse {
  success: boolean;
  role_changed: boolean;
  new_role: string;
  sessions_terminated: number;
}

export interface AssignRoleApprovalResponse {
  success: boolean;
  requires_approval: boolean;
  approval_request_id: string;
  pending_approvals: number;
}

export type AssignRoleResponse = AssignRoleImmediateResponse | AssignRoleApprovalResponse;

export interface ApproveRoleChangeRequest {
  approval_request_id: string;
  approved: boolean;
  rejection_reason?: string;
}

export interface ApproveRoleFirstResponse {
  success: boolean;
  status: 'first_approved';
  remaining_approvals: number;
}

export interface ApproveRoleAppliedResponse {
  success: boolean;
  status: 'approved';
  role_applied: boolean;
  user_id: string;
  new_role: string;
}

export interface ApproveRoleRejectedResponse {
  success: boolean;
  status: 'rejected';
  rejection_reason: string;
}

export type ApproveRoleChangeResponse =
  | ApproveRoleFirstResponse
  | ApproveRoleAppliedResponse
  | ApproveRoleRejectedResponse;

export interface PendingApproval {
  id: string;
  user_id: string;
  user_email: string;
  requested_role: string;
  requester_id: string;
  requester_email: string;
  status: 'pending' | 'first_approved' | 'approved' | 'rejected';
  first_approver_email?: string;
  first_approved_at?: string;
  created_at: string;
}

export interface PendingApprovalsResponse {
  approvals: PendingApproval[];
  total: number;
  limit: number;
  offset: number;
}

export interface DelegationSummary {
  id: string;
  grantor_email: string;
  resource_type: string;
  resource_id: string;
  valid_until: string;
}

export interface UserPermissionsResponse {
  user_id: string;
  email: string;
  primary_role: string;
  active_delegations: DelegationSummary[];
  effective_permissions: {
    can_create_dossiers: boolean;
    can_edit_dossiers: boolean;
    can_manage_users: boolean;
    accessible_resources: string[];
  };
}

export interface DeactivateUserRequest {
  userId: string;
  reason?: string;
}

export interface OrphanedItemsSummary {
  dossiers: number;
  assignments: number;
  delegations: number;
  approvals: number;
}

export interface DeactivateUserResponse {
  success: boolean;
  orphanedItems?: OrphanedItemsSummary;
  sessionsTerminated?: number;
  delegationsRevoked?: number;
}

export interface ReactivateUserRequest {
  userId: string;
  securityReviewApproval?: string;
  reason?: string;
}

export interface ReactivateUserResponse {
  success: boolean;
  roleRestored?: string;
}

// Delegation types
export interface DelegatePermissionsRequest {
  grantee_id: string;
  resource_type?: string | null;
  resource_id?: string | null;
  valid_from?: string;
  valid_until: string;
  reason: string;
}

export interface DelegatePermissionsResponse {
  success: boolean;
  delegation_id: string;
  grantor_id: string;
  grantee_id: string;
  valid_from: string;
  valid_until: string;
  expires_in_days: number;
}

export interface RevokeDelegationRequest {
  delegation_id: string;
  reason?: string;
}

export interface RevokeDelegationResponse {
  success: boolean;
  delegation_id: string;
  revoked_at: string;
  revoked_by: string;
}

export interface ValidateDelegationRequest {
  grantee_id: string;
  resource_type?: string;
  resource_id?: string;
}

export interface ValidationIssue {
  code: string;
  message: string;
}

export interface DelegationChainNode {
  from_user: string;
  to_user: string;
  resource: string;
}

export interface ValidateDelegationResponse {
  valid: boolean;
  can_delegate: boolean;
  issues: ValidationIssue[];
  delegation_chain: DelegationChainNode[];
}

export interface Delegation {
  id: string;
  grantor_id: string;
  grantor_email: string;
  grantee_id: string;
  grantee_email: string;
  source: string;
  resource_type: string | null;
  resource_id: string | null;
  reason: string;
  is_active: boolean;
  valid_from: string;
  valid_until: string;
  revoked_at: string | null;
  revoked_by: string | null;
  expires_in_days: number;
  created_at: string;
}

export interface MyDelegationsResponse {
  granted: Delegation[];
  received: Delegation[];
  total: number;
}

// ============================================================================
// API Client Methods
// ============================================================================

/**
 * Create a new user account (admin only)
 *
 * @param data - User creation data
 * @returns Promise with user creation response
 * @throws ApiError if creation fails
 */
export async function createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
  const { data: result, error } = await supabase.functions.invoke<CreateUserResponse>('create-user', {
    body: data,
  });

  if (error) {
    throw error;
  }

  if (!result) {
    throw new Error('No response from create-user function');
  }

  return result;
}

/**
 * Activate a user account with activation token and password
 *
 * @param data - Activation data (token and password)
 * @returns Promise with activation response
 * @throws ApiError if activation fails
 */
export async function activateAccount(data: ActivateAccountRequest): Promise<ActivateAccountResponse> {
  const { data: result, error } = await supabase.functions.invoke<ActivateAccountResponse>('activate-account', {
    body: data,
  });

  if (error) {
    throw error;
  }

  if (!result) {
    throw new Error('No response from activate-account function');
  }

  return result;
}

/**
 * Assign or change user role (admin only)
 *
 * Admin role assignments require dual approval workflow.
 * Non-admin role changes (viewer ↔ editor) take effect immediately.
 *
 * @param data - Role assignment data
 * @returns Promise with role assignment response
 * @throws ApiError if assignment fails
 */
export async function assignRole(data: AssignRoleRequest): Promise<AssignRoleResponse> {
  const { data: result, error } = await supabase.functions.invoke<AssignRoleResponse>('assign-role', {
    body: data,
  });

  if (error) {
    throw error;
  }

  if (!result) {
    throw new Error('No response from assign-role function');
  }

  return result;
}

/**
 * Approve or reject a pending admin role assignment (admin only)
 *
 * Requires two distinct administrators. Second approval automatically applies the role change.
 *
 * @param data - Approval request data
 * @returns Promise with approval response
 * @throws ApiError if approval fails
 */
export async function approveRoleChange(data: ApproveRoleChangeRequest): Promise<ApproveRoleChangeResponse> {
  const { data: result, error } = await supabase.functions.invoke<ApproveRoleChangeResponse>('approve-role-change', {
    body: data,
  });

  if (error) {
    throw error;
  }

  if (!result) {
    throw new Error('No response from approve-role-change function');
  }

  return result;
}

/**
 * Get list of pending role approval requests (admin only)
 *
 * @param params - Query parameters (status, limit, offset)
 * @returns Promise with pending approvals list
 * @throws ApiError if request fails
 */
export async function getPendingApprovals(params?: {
  status?: 'pending' | 'first_approved' | 'approved' | 'rejected';
  limit?: number;
  offset?: number;
}): Promise<PendingApprovalsResponse> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.set('status', params.status);
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.offset) queryParams.set('offset', params.offset.toString());

  const { data: result, error } = await supabase.functions.invoke<PendingApprovalsResponse>('pending-approvals', {
    method: 'GET',
  });

  if (error) {
    throw error;
  }

  if (!result) {
    throw new Error('No response from pending-approvals function');
  }

  return result;
}

/**
 * Get comprehensive user permissions (role + delegations)
 *
 * Authenticated user can view own permissions, admin can view any user.
 *
 * @param userId - User ID to retrieve permissions for
 * @returns Promise with user permissions response
 * @throws ApiError if request fails
 */
export async function getUserPermissions(userId: string): Promise<UserPermissionsResponse> {
  const { data: result, error } = await supabase.functions.invoke<UserPermissionsResponse>('user-permissions', {
    method: 'GET',
    body: { user_id: userId },
  });

  if (error) {
    throw error;
  }

  if (!result) {
    throw new Error('No response from user-permissions function');
  }

  return result;
}

/**
 * Deactivate a user account (admin only)
 *
 * Terminates all active sessions, revokes delegations, and marks work items as orphaned.
 * Requires deactivation reason for audit trail.
 *
 * @param data - Deactivation request data
 * @returns Promise with deactivation response including orphaned items summary
 * @throws ApiError if deactivation fails
 */
export async function deactivateUser(data: DeactivateUserRequest): Promise<DeactivateUserResponse> {
  const { data: result, error } = await supabase.functions.invoke<DeactivateUserResponse>('deactivate-user', {
    body: data,
  });

  if (error) {
    throw error;
  }

  if (!result) {
    throw new Error('No response from deactivate-user function');
  }

  return result;
}

/**
 * Reactivate a deactivated user account (admin only)
 *
 * Restores user status to active. Admin role reactivation requires security review approval.
 *
 * @param data - Reactivation request data
 * @returns Promise with reactivation response
 * @throws ApiError if reactivation fails
 */
export async function reactivateUser(data: ReactivateUserRequest): Promise<ReactivateUserResponse> {
  const { data: result, error } = await supabase.functions.invoke<ReactivateUserResponse>('reactivate-user', {
    body: data,
  });

  if (error) {
    throw error;
  }

  if (!result) {
    throw new Error('No response from reactivate-user function');
  }

  return result;
}

/**
 * Delegate permissions to another user for a time period
 *
 * Creates a time-bound delegation from current user to grantee. Validates permissions,
 * prevents circular delegations, and enforces non-transitive delegation rules.
 *
 * @param data - Delegation request data
 * @returns Promise with delegation response
 * @throws ApiError if delegation fails
 */
export async function delegatePermissions(data: DelegatePermissionsRequest): Promise<DelegatePermissionsResponse> {
  const { data: result, error } = await supabase.functions.invoke<DelegatePermissionsResponse>('delegate-permissions', {
    body: data,
  });

  if (error) {
    throw error;
  }

  if (!result) {
    throw new Error('No response from delegate-permissions function');
  }

  return result;
}

/**
 * Manually revoke an active delegation
 *
 * Revokes delegation before its expiration date. Only the grantor or an admin can revoke.
 *
 * @param data - Revocation request data
 * @returns Promise with revocation response
 * @throws ApiError if revocation fails
 */
export async function revokeDelegation(data: RevokeDelegationRequest): Promise<RevokeDelegationResponse> {
  const { data: result, error } = await supabase.functions.invoke<RevokeDelegationResponse>('revoke-delegation', {
    body: data,
  });

  if (error) {
    throw error;
  }

  if (!result) {
    throw new Error('No response from revoke-delegation function');
  }

  return result;
}

/**
 * Validate if user can delegate to another user
 *
 * Pre-validation check before creating delegation. Checks permissions, circular references,
 * and transitive delegation rules.
 *
 * @param data - Validation request data
 * @returns Promise with validation response
 * @throws ApiError if validation fails
 */
export async function validateDelegation(data: ValidateDelegationRequest): Promise<ValidateDelegationResponse> {
  const { data: result, error } = await supabase.functions.invoke<ValidateDelegationResponse>('validate-delegation', {
    body: data,
  });

  if (error) {
    throw error;
  }

  if (!result) {
    throw new Error('No response from validate-delegation function');
  }

  return result;
}

/**
 * Get user's delegations (granted and received)
 *
 * Retrieves delegations where user is grantor (granted) or grantee (received).
 * Supports filtering by type, active status, and expiration timeframe.
 *
 * @param params - Query parameters (type, active_only, expiring_within_days)
 * @returns Promise with delegations response
 * @throws ApiError if request fails
 */
export async function getMyDelegations(params?: {
  type?: 'granted' | 'received' | 'all';
  active_only?: boolean;
  expiring_within_days?: number;
}): Promise<MyDelegationsResponse> {
  const queryParams = new URLSearchParams();
  if (params?.type) queryParams.set('type', params.type);
  if (params?.active_only !== undefined) queryParams.set('active_only', params.active_only.toString());
  if (params?.expiring_within_days) queryParams.set('expiring_within_days', params.expiring_within_days.toString());

  const url = `my-delegations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const { data: result, error } = await supabase.functions.invoke<MyDelegationsResponse>(url, {
    method: 'GET',
  });

  if (error) {
    throw error;
  }

  if (!result) {
    throw new Error('No response from my-delegations function');
  }

  return result;
}

// ============================================================================
// Access Review Types
// ============================================================================

export interface GenerateAccessReviewRequest {
  review_name: string;
  review_scope: 'all_users' | 'department' | 'role' | 'custom';
  department?: string;
  role?: 'admin' | 'editor' | 'viewer';
  user_ids?: string[];
  include_inactive_threshold_days?: number;
}

export interface FindingsSummary {
  inactive_users: number;
  excessive_permissions: number;
  guest_accounts_expiring: number;
  orphaned_delegations: number;
}

export interface GenerateAccessReviewResponse {
  success: boolean;
  review_id: string;
  review_name: string;
  users_reviewed: number;
  findings_summary: FindingsSummary;
  generation_time_ms: number;
}

export interface ReviewFinding {
  user_id: string;
  email: string;
  full_name: string;
  primary_role: string;
  issues: string[];
  recommendations: string[];
  last_login_at: string | null;
  days_since_login: number | null;
  active_delegations: Array<{
    id: string;
    grantor_email: string;
    resource_type: string;
    valid_until: string;
  }>;
  certified_by: string | null;
  certified_at: string | null;
}

export interface AccessReviewDetailResponse {
  id: string;
  review_name: string;
  review_scope: string;
  reviewer_email: string;
  status: 'in_progress' | 'completed';
  review_date: string;
  completed_at: string | null;
  findings: ReviewFinding[];
  summary: {
    total_users: number;
    issues_identified: number;
    recommendations_count: number;
  };
}

export interface CertifyUserAccessRequest {
  review_id: string;
  user_id: string;
  certified: boolean;
  requested_changes?: Array<{
    change_type: 'reduce_role' | 'remove_delegation' | 'deactivate' | 'other';
    reason: string;
  }>;
}

export interface CertifyUserAccessResponse {
  success: boolean;
  review_id: string;
  user_id: string;
  certified: boolean;
  certified_at: string;
}

export interface CompleteAccessReviewRequest {
  review_id: string;
  notes?: string;
}

export interface CompleteAccessReviewResponse {
  success: boolean;
  review_id: string;
  completed_at: string;
  compliance_report_url: string;
}

export interface InactiveUser {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  last_login_at: string | null;
  days_since_login: number;
  active_delegations: number;
  owned_dossiers: number;
}

export interface InactiveUsersResponse {
  users: InactiveUser[];
  total: number;
}

export interface ScheduleAccessReviewRequest {
  schedule_type: 'automatic_quarterly' | 'manual_override' | 'disable';
  next_review_date?: string;
  review_scope?: 'all_users' | 'department' | 'role';
  auto_assign_reviewer?: string;
}

export interface ScheduleAccessReviewResponse {
  success: boolean;
  schedule_type: string;
  next_scheduled_review: string;
  cron_expression: string;
}

// ============================================================================
// Access Review API Methods
// ============================================================================

/**
 * Generate comprehensive access review report (admin only)
 *
 * Creates access review with findings for specified user scope.
 * Uses materialized view for performance (<10s for 1000+ users).
 *
 * @param data - Access review generation request
 * @returns Promise with review generation response
 * @throws ApiError if generation fails
 */
export async function generateAccessReview(data: GenerateAccessReviewRequest): Promise<GenerateAccessReviewResponse> {
  const { data: result, error } = await supabase.functions.invoke<GenerateAccessReviewResponse>('generate-access-review', {
    body: data,
  });

  if (error) {
    throw error;
  }

  if (!result) {
    throw new Error('No response from generate-access-review function');
  }

  return result;
}

/**
 * Get detailed access review findings (admin only)
 *
 * Retrieves review details with optional finding type filter.
 *
 * @param reviewId - Access review ID
 * @param findingType - Optional filter (all, inactive_users, excessive_permissions, expiring_guests, orphaned_delegations)
 * @returns Promise with review detail response
 * @throws ApiError if request fails
 */
export async function getAccessReviewDetail(
  reviewId: string,
  findingType?: 'all' | 'inactive_users' | 'excessive_permissions' | 'expiring_guests' | 'orphaned_delegations'
): Promise<AccessReviewDetailResponse> {
  const queryParams = new URLSearchParams();
  if (findingType) queryParams.set('finding_type', findingType);

  const url = `access-review-detail/${reviewId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const { data: result, error } = await supabase.functions.invoke<AccessReviewDetailResponse>(url, {
    method: 'GET',
  });

  if (error) {
    throw error;
  }

  if (!result) {
    throw new Error('No response from access-review-detail function');
  }

  return result;
}

/**
 * Certify user access as appropriate or request changes (admin/manager only)
 *
 * Records certification decision for user in access review.
 *
 * @param data - Certification request data
 * @returns Promise with certification response
 * @throws ApiError if certification fails
 */
export async function certifyUserAccess(data: CertifyUserAccessRequest): Promise<CertifyUserAccessResponse> {
  const { data: result, error } = await supabase.functions.invoke<CertifyUserAccessResponse>('certify-user-access', {
    body: data,
  });

  if (error) {
    throw error;
  }

  if (!result) {
    throw new Error('No response from certify-user-access function');
  }

  return result;
}

/**
 * Mark access review as completed and generate compliance report (admin only)
 *
 * Finalizes review, locks findings, generates compliance report.
 * Must be the assigned reviewer.
 *
 * @param data - Completion request data
 * @returns Promise with completion response
 * @throws ApiError if completion fails
 */
export async function completeAccessReview(data: CompleteAccessReviewRequest): Promise<CompleteAccessReviewResponse> {
  const { data: result, error } = await supabase.functions.invoke<CompleteAccessReviewResponse>('complete-access-review', {
    body: data,
  });

  if (error) {
    throw error;
  }

  if (!result) {
    throw new Error('No response from complete-access-review function');
  }

  return result;
}

/**
 * Get list of inactive users flagged for review (admin only)
 *
 * Retrieves users who haven't logged in for specified threshold period.
 *
 * @param inactiveDays - Minimum days of inactivity (default: 90)
 * @param limit - Maximum results to return (default: 100, max: 500)
 * @returns Promise with inactive users list
 * @throws ApiError if request fails
 */
export async function getInactiveUsers(
  inactiveDays: number = 90,
  limit: number = 100
): Promise<InactiveUsersResponse> {
  const queryParams = new URLSearchParams();
  queryParams.set('inactive_days', inactiveDays.toString());
  queryParams.set('limit', limit.toString());

  const url = `inactive-users?${queryParams.toString()}`;

  const { data: result, error } = await supabase.functions.invoke<InactiveUsersResponse>(url, {
    method: 'GET',
  });

  if (error) {
    throw error;
  }

  if (!result) {
    throw new Error('No response from inactive-users function');
  }

  return result;
}

/**
 * Configure automatic access review scheduling (admin only)
 *
 * Sets up quarterly automatic reviews or manual override scheduling.
 *
 * @param data - Schedule configuration request
 * @returns Promise with schedule configuration response
 * @throws ApiError if configuration fails
 */
export async function scheduleAccessReview(data: ScheduleAccessReviewRequest): Promise<ScheduleAccessReviewResponse> {
  const { data: result, error } = await supabase.functions.invoke<ScheduleAccessReviewResponse>('schedule-access-review', {
    body: data,
  });

  if (error) {
    throw error;
  }

  if (!result) {
    throw new Error('No response from schedule-access-review function');
  }

  return result;
}
