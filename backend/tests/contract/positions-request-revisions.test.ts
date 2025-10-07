import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Contract Test: POST /positions/{id}/request-revisions
 *
 * Validates that the request revisions endpoint:
 * - Requires comments field
 * - Changes position status back to draft
 * - Returns updated position with status=draft
 * - Returns 400 if comments missing
 * - Returns 403 if user is not an approver at current stage
 *
 * This test MUST FAIL initially (endpoint not yet implemented).
 */

describe('POST /positions/{id}/request-revisions - Contract Test', () => {
  let supabase: SupabaseClient;
  let testPositionId: string;
  let approverToken: string;
  let nonApproverToken: string;

  beforeAll(async () => {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Create test position in under_review status
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: 'test-type-id',
        title_en: 'Test Position for Revisions',
        title_ar: 'موقف اختبار للمراجعات',
        content_en: 'Test content',
        content_ar: 'محتوى الاختبار',
        status: 'under_review',
        current_stage: 1,
        thematic_category: 'Test',
      })
      .select()
      .single();

    testPositionId = position.id;

    // Get approver token (user assigned to stage 1)
    approverToken = 'mock-approver-token';

    // Get non-approver token
    nonApproverToken = 'mock-non-approver-token';
  });

  afterAll(async () => {
    // Cleanup test data
    if (testPositionId) {
      await supabase
        .from('positions')
        .delete()
        .eq('id', testPositionId);
    }
  });

  it('should return 404 for non-existent position', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions-request-revisions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${approverToken}`,
        },
        body: JSON.stringify({
          position_id: '00000000-0000-0000-0000-000000000000',
          comments: 'Please revise',
        }),
      }
    );

    expect(response.status).toBe(404);
  });

  it('should return 400 when comments field is missing', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions-request-revisions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${approverToken}`,
        },
        body: JSON.stringify({
          position_id: testPositionId,
          // comments missing
        }),
      }
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('comments');
  });

  it('should return 400 when comments field is empty', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions-request-revisions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${approverToken}`,
        },
        body: JSON.stringify({
          position_id: testPositionId,
          comments: '',
        }),
      }
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('comments');
  });

  it('should return 403 when user is not an approver at current stage', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions-request-revisions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${nonApproverToken}`,
        },
        body: JSON.stringify({
          position_id: testPositionId,
          comments: 'Please revise the section on trade policy',
        }),
      }
    );

    expect(response.status).toBe(403);
  });

  it('should successfully request revisions with valid comments', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions-request-revisions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${approverToken}`,
        },
        body: JSON.stringify({
          position_id: testPositionId,
          comments: 'Please revise the section on trade policy and add more data',
        }),
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();

    // Validate response schema
    expect(data).toHaveProperty('id', testPositionId);
    expect(data).toHaveProperty('status', 'draft');
    expect(data).toHaveProperty('current_stage', 0);
    expect(data).toHaveProperty('approval_id');

    // Validate approval record fields
    expect(data.approval).toHaveProperty('action', 'request_revisions');
    expect(data.approval).toHaveProperty('comments', 'Please revise the section on trade policy and add more data');
    expect(data.approval).toHaveProperty('approver_id');
    expect(data.approval).toHaveProperty('stage', 1);
    expect(data.approval).toHaveProperty('created_at');
  });

  it('should return 400 if position is not in under_review status', async () => {
    // Create position in draft status
    const { data: draftPosition } = await supabase
      .from('positions')
      .insert({
        position_type_id: 'test-type-id',
        title_en: 'Draft Position',
        title_ar: 'موقف مسودة',
        status: 'draft',
        current_stage: 0,
      })
      .select()
      .single();

    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions-request-revisions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${approverToken}`,
        },
        body: JSON.stringify({
          position_id: draftPosition.id,
          comments: 'Cannot request revisions on draft',
        }),
      }
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('status');

    // Cleanup
    await supabase
      .from('positions')
      .delete()
      .eq('id', draftPosition.id);
  });

  it('should return bilingual error messages', async () => {
    const responseEn = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions-request-revisions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${approverToken}`,
          'Accept-Language': 'en',
        },
        body: JSON.stringify({
          position_id: testPositionId,
          // comments missing
        }),
      }
    );

    const dataEn = await responseEn.json();
    expect(dataEn.error).toBeDefined();
    expect(dataEn.error_ar).toBeDefined();
  });
});
