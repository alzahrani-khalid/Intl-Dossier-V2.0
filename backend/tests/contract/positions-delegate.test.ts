import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Contract Test: POST /positions/{id}/delegate
 *
 * Validates that the delegate approval endpoint:
 * - Requires delegate_to field (user ID)
 * - Requires valid_until field (delegation expiry timestamp)
 * - Returns delegation_id upon success
 * - Records delegation in approvals table
 * - Returns 403 if user is not the assigned approver
 * - Returns 400 if delegate_to user is invalid
 *
 * This test MUST FAIL initially (endpoint not yet implemented).
 */

describe('POST /positions/{id}/delegate - Contract Test', () => {
  let supabase: SupabaseClient;
  let testPositionId: string;
  let approverToken: string;
  let delegateUserId: string;
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
        title_en: 'Test Position for Delegation',
        title_ar: 'موقف اختبار للتفويض',
        content_en: 'Test content',
        content_ar: 'محتوى الاختبار',
        status: 'under_review',
        current_stage: 2,
        thematic_category: 'Test',
      })
      .select()
      .single();

    testPositionId = position.id;

    // Get approver token (user assigned to stage 2)
    approverToken = 'mock-approver-token';

    // Get delegate user ID
    delegateUserId = 'mock-delegate-user-id';

    // Get non-approver token
    nonApproverToken = 'mock-non-approver-token';
  });

  afterAll(async () => {
    // Cleanup test data
    if (testPositionId) {
      await supabase
        .from('approvals')
        .delete()
        .eq('position_id', testPositionId);

      await supabase
        .from('positions')
        .delete()
        .eq('id', testPositionId);
    }
  });

  it('should return 404 for non-existent position', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions-delegate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${approverToken}`,
        },
        body: JSON.stringify({
          position_id: '00000000-0000-0000-0000-000000000000',
          delegate_to: delegateUserId,
          valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      }
    );

    expect(response.status).toBe(404);
  });

  it('should return 400 when delegate_to field is missing', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions-delegate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${approverToken}`,
        },
        body: JSON.stringify({
          position_id: testPositionId,
          valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          // delegate_to missing
        }),
      }
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('delegate_to');
  });

  it('should return 400 when valid_until field is missing', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions-delegate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${approverToken}`,
        },
        body: JSON.stringify({
          position_id: testPositionId,
          delegate_to: delegateUserId,
          // valid_until missing
        }),
      }
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('valid_until');
  });

  it('should return 400 when valid_until is in the past', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions-delegate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${approverToken}`,
        },
        body: JSON.stringify({
          position_id: testPositionId,
          delegate_to: delegateUserId,
          valid_until: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        }),
      }
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('past');
  });

  it('should return 400 when delegate_to user does not exist', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions-delegate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${approverToken}`,
        },
        body: JSON.stringify({
          position_id: testPositionId,
          delegate_to: '00000000-0000-0000-0000-000000000000',
          valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      }
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('user');
  });

  it('should return 403 when user is not the assigned approver', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions-delegate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${nonApproverToken}`,
        },
        body: JSON.stringify({
          position_id: testPositionId,
          delegate_to: delegateUserId,
          valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      }
    );

    expect(response.status).toBe(403);
  });

  it('should successfully delegate approval', async () => {
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions-delegate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${approverToken}`,
        },
        body: JSON.stringify({
          position_id: testPositionId,
          delegate_to: delegateUserId,
          valid_until: validUntil,
          reason: 'Will be on leave next week',
        }),
      }
    );

    expect(response.status).toBe(201);

    const data = await response.json();

    // Validate response schema
    expect(data).toHaveProperty('delegation_id');
    expect(data).toHaveProperty('position_id', testPositionId);
    expect(data).toHaveProperty('delegate_to', delegateUserId);
    expect(data).toHaveProperty('valid_until', validUntil);

    // Validate delegation record fields
    expect(data.delegation).toHaveProperty('id');
    expect(data.delegation).toHaveProperty('action', 'delegate');
    expect(data.delegation).toHaveProperty('delegated_from');
    expect(data.delegation).toHaveProperty('delegated_until', validUntil);
    expect(data.delegation).toHaveProperty('stage', 2);
    expect(data.delegation).toHaveProperty('created_at');
  });

  it('should allow optional reason field', async () => {
    const validUntil = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/positions-delegate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${approverToken}`,
        },
        body: JSON.stringify({
          position_id: testPositionId,
          delegate_to: delegateUserId,
          valid_until: validUntil,
          // reason omitted (optional)
        }),
      }
    );

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data).toHaveProperty('delegation_id');
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
      `${process.env.SUPABASE_URL}/functions/v1/positions-delegate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${approverToken}`,
        },
        body: JSON.stringify({
          position_id: draftPosition.id,
          delegate_to: delegateUserId,
          valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
      `${process.env.SUPABASE_URL}/functions/v1/positions-delegate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${approverToken}`,
          'Accept-Language': 'en',
        },
        body: JSON.stringify({
          position_id: testPositionId,
          // delegate_to missing
          valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      }
    );

    const dataEn = await responseEn.json();
    expect(dataEn.error).toBeDefined();
    expect(dataEn.error_ar).toBeDefined();
  });
});
