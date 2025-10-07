import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Contract Test: PUT /approvals/{id}/reassign
 *
 * Validates that the reassign approval endpoint:
 * - Requires admin role (403 for non-admin)
 * - Requires reason field (justification for reassignment)
 * - Updates approver_id field in approvals table
 * - Records reassigned_by and reassignment_reason
 * - Returns updated approval record
 * - Notifies new approver
 *
 * This test MUST FAIL initially (endpoint not yet implemented).
 */

describe('PUT /approvals/{id}/reassign - Contract Test', () => {
  let supabase: SupabaseClient;
  let testApprovalId: string;
  let testPositionId: string;
  let adminToken: string;
  let nonAdminToken: string;
  let newApproverUserId: string;

  beforeAll(async () => {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Create test position
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: 'test-type-id',
        title_en: 'Test Position for Reassignment',
        title_ar: 'موقف اختبار لإعادة التخصيص',
        status: 'under_review',
        current_stage: 2,
      })
      .select()
      .single();

    testPositionId = position.id;

    // Create test approval record
    const { data: approval } = await supabase
      .from('approvals')
      .insert({
        position_id: testPositionId,
        stage: 2,
        approver_id: 'original-approver-id',
        original_approver_id: 'original-approver-id',
        action: 'pending',
      })
      .select()
      .single();

    testApprovalId = approval.id;

    // Get admin token
    adminToken = 'mock-admin-token';

    // Get non-admin token
    nonAdminToken = 'mock-non-admin-token';

    // New approver user ID
    newApproverUserId = 'new-approver-user-id';
  });

  afterAll(async () => {
    // Cleanup test data
    if (testApprovalId) {
      await supabase
        .from('approvals')
        .delete()
        .eq('id', testApprovalId);
    }

    if (testPositionId) {
      await supabase
        .from('positions')
        .delete()
        .eq('id', testPositionId);
    }
  });

  it('should return 404 for non-existent approval', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/approvals-reassign`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          approval_id: '00000000-0000-0000-0000-000000000000',
          new_approver_id: newApproverUserId,
          reason: 'Original approver left organization',
        }),
      }
    );

    expect(response.status).toBe(404);
  });

  it('should return 403 for non-admin users', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/approvals-reassign`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${nonAdminToken}`,
        },
        body: JSON.stringify({
          approval_id: testApprovalId,
          new_approver_id: newApproverUserId,
          reason: 'Attempting reassignment without admin role',
        }),
      }
    );

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('admin');
  });

  it('should return 400 when new_approver_id field is missing', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/approvals-reassign`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          approval_id: testApprovalId,
          reason: 'Original approver left organization',
          // new_approver_id missing
        }),
      }
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('new_approver_id');
  });

  it('should return 400 when reason field is missing', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/approvals-reassign`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          approval_id: testApprovalId,
          new_approver_id: newApproverUserId,
          // reason missing
        }),
      }
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('reason');
  });

  it('should return 400 when reason field is empty', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/approvals-reassign`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          approval_id: testApprovalId,
          new_approver_id: newApproverUserId,
          reason: '',
        }),
      }
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('reason');
  });

  it('should return 400 when new_approver_id user does not exist', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/approvals-reassign`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          approval_id: testApprovalId,
          new_approver_id: '00000000-0000-0000-0000-000000000000',
          reason: 'Original approver left organization',
        }),
      }
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('user');
  });

  it('should successfully reassign approval with valid admin request', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/approvals-reassign`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          approval_id: testApprovalId,
          new_approver_id: newApproverUserId,
          reason: 'Original approver left organization',
        }),
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();

    // Validate response schema
    expect(data).toHaveProperty('id', testApprovalId);
    expect(data).toHaveProperty('approver_id', newApproverUserId);
    expect(data).toHaveProperty('original_approver_id', 'original-approver-id');
    expect(data).toHaveProperty('reassigned_by');
    expect(data).toHaveProperty('reassignment_reason', 'Original approver left organization');
    expect(data).toHaveProperty('updated_at');

    // Validate notification was sent
    expect(data).toHaveProperty('notification_sent', true);
  });

  it('should maintain original_approver_id field', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/approvals-reassign`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          approval_id: testApprovalId,
          new_approver_id: 'another-approver-id',
          reason: 'Second reassignment',
        }),
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();

    // original_approver_id should remain unchanged
    expect(data).toHaveProperty('original_approver_id', 'original-approver-id');
    expect(data).toHaveProperty('approver_id', 'another-approver-id');
  });

  it('should record admin user ID in reassigned_by field', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/approvals-reassign`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          approval_id: testApprovalId,
          new_approver_id: newApproverUserId,
          reason: 'Reassignment for testing',
        }),
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('reassigned_by');
    expect(data.reassigned_by).toBeTruthy();
  });

  it('should return bilingual error messages', async () => {
    const responseEn = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/approvals-reassign`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'Accept-Language': 'en',
        },
        body: JSON.stringify({
          approval_id: testApprovalId,
          new_approver_id: newApproverUserId,
          // reason missing
        }),
      }
    );

    const dataEn = await responseEn.json();
    expect(dataEn.error).toBeDefined();
    expect(dataEn.error_ar).toBeDefined();
  });
});
