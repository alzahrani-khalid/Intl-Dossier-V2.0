import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// T079: Integration test for delegation and reassignment
describe('Delegation and Reassignment Integration Tests', () => {
  const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  let testPositionId: string;
  let positionTypeId: string;

  beforeAll(async () => {
    // Get position type
    const { data: positionTypes } = await supabase
      .from('position_types')
      .select('id')
      .eq('name_en', 'Standard Position')
      .single();
    positionTypeId = positionTypes?.id;
  });

  afterAll(async () => {
    // Cleanup
    if (testPositionId) {
      await supabase.from('approvals').delete().eq('position_id', testPositionId);
      await supabase.from('positions').delete().eq('id', testPositionId);
    }
  });

  it('should delegate approval with expiry timestamp', async () => {
    // Create position in review
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Test Position for Delegation',
        title_ar: 'موقف اختبار للتفويض',
        content_en: 'Test content',
        content_ar: 'محتوى الاختبار',
        thematic_category: 'Policy',
        status: 'under_review',
        current_stage: 1,
        version: 1
      })
      .select()
      .single();

    testPositionId = position.id;

    // Delegate approval (7 days from now)
    const delegateUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const { data: delegation, error: delegateError } = await supabase
      .from('approvals')
      .insert({
        position_id: testPositionId,
        stage: 1,
        action: 'delegate',
        delegated_until: delegateUntil.toISOString(),
        comments: 'Will be out of office'
      })
      .select()
      .single();

    expect(delegateError).toBeNull();
    expect(delegation.action).toBe('delegate');
    expect(delegation.delegated_until).toBe(delegateUntil.toISOString());

    // Verify delegation can be queried
    const { data: delegations } = await supabase
      .from('approvals')
      .select()
      .eq('position_id', testPositionId)
      .eq('action', 'delegate');

    expect(delegations).toHaveLength(1);
    expect(delegations?.[0].comments).toContain('out of office');
  });

  it('should allow delegate to approve on behalf of original approver', async () => {
    // Create position
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Position for Delegate Approval',
        title_ar: 'موقف لموافقة المفوض',
        content_en: 'Content',
        content_ar: 'المحتوى',
        thematic_category: 'Security',
        status: 'under_review',
        current_stage: 1,
        version: 1
      })
      .select()
      .single();

    const positionId = position.id;

    // Delegate
    await supabase.from('approvals').insert({
      position_id: positionId,
      stage: 1,
      action: 'delegate',
      delegated_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Delegate approves (with step-up)
    const { data: delegateApproval, error: approveError } = await supabase
      .from('approvals')
      .insert({
        position_id: positionId,
        stage: 1,
        action: 'approve',
        step_up_verified: true,
        comments: 'Approved as delegate'
      })
      .select()
      .single();

    expect(approveError).toBeNull();
    expect(delegateApproval.action).toBe('approve');
    expect(delegateApproval.step_up_verified).toBe(true);

    // Update position to next stage
    await supabase
      .from('positions')
      .update({ current_stage: 2 })
      .eq('id', positionId);

    // Verify stage advanced
    const { data: updatedPosition } = await supabase
      .from('positions')
      .select()
      .eq('id', positionId)
      .single();

    expect(updatedPosition.current_stage).toBe(2);

    // Verify audit trail: both delegation and approval recorded
    const { data: auditTrail } = await supabase
      .from('approvals')
      .select()
      .eq('position_id', positionId)
      .eq('stage', 1)
      .order('created_at', { ascending: true });

    expect(auditTrail).toHaveLength(2);
    expect(auditTrail?.[0].action).toBe('delegate');
    expect(auditTrail?.[1].action).toBe('approve');

    // Cleanup
    await supabase.from('approvals').delete().eq('position_id', positionId);
    await supabase.from('positions').delete().eq('id', positionId);
  });

  it('should handle admin reassignment with reason', async () => {
    // Create position
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Position for Reassignment',
        title_ar: 'موقف لإعادة التعيين',
        content_en: 'Content',
        content_ar: 'المحتوى',
        thematic_category: 'Policy',
        status: 'under_review',
        current_stage: 1,
        version: 1
      })
      .select()
      .single();

    const positionId = position.id;

    // Create initial approval record (pending)
    const { data: initialApproval } = await supabase
      .from('approvals')
      .insert({
        position_id: positionId,
        stage: 1,
        action: 'approve',
        step_up_verified: false // Not yet approved, pending
      })
      .select()
      .single();

    // Admin reassigns (updates approval record)
    const reassignmentReason = 'Original approver left organization';
    const { data: reassignment, error: reassignError } = await supabase
      .from('approvals')
      .update({
        action: 'reassign',
        reassignment_reason: reassignmentReason
      })
      .eq('id', initialApproval.id)
      .select()
      .single();

    expect(reassignError).toBeNull();
    expect(reassignment.action).toBe('reassign');
    expect(reassignment.reassignment_reason).toBe(reassignmentReason);

    // Create new approval record for new approver
    const { data: newApproval } = await supabase
      .from('approvals')
      .insert({
        position_id: positionId,
        stage: 1,
        action: 'approve',
        step_up_verified: true,
        comments: 'Approved after reassignment'
      })
      .select()
      .single();

    expect(newApproval.action).toBe('approve');
    expect(newApproval.step_up_verified).toBe(true);

    // Verify audit trail: reassignment + new approval
    const { data: auditTrail } = await supabase
      .from('approvals')
      .select()
      .eq('position_id', positionId)
      .order('created_at', { ascending: true });

    expect(auditTrail?.length).toBeGreaterThanOrEqual(2);

    // Find reassignment record
    const reassignRecord = auditTrail?.find(a => a.action === 'reassign');
    expect(reassignRecord).toBeDefined();
    expect(reassignRecord?.reassignment_reason).toContain('left organization');

    // Cleanup
    await supabase.from('approvals').delete().eq('position_id', positionId);
    await supabase.from('positions').delete().eq('id', positionId);
  });

  it('should maintain full audit trail for delegation and reassignment', async () => {
    // Create position
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Audit Trail Test Position',
        title_ar: 'موقف اختبار سجل التدقيق',
        content_en: 'Content',
        content_ar: 'المحتوى',
        thematic_category: 'Trade',
        status: 'under_review',
        current_stage: 1,
        version: 1
      })
      .select()
      .single();

    const positionId = position.id;

    // Action 1: Delegate
    await supabase.from('approvals').insert({
      position_id: positionId,
      stage: 1,
      action: 'delegate',
      delegated_until: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      comments: 'Delegating to colleague'
    });

    // Wait a moment to ensure distinct timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Action 2: Delegate expires, admin reassigns
    const { data: approval } = await supabase
      .from('approvals')
      .insert({
        position_id: positionId,
        stage: 1,
        action: 'reassign',
        reassignment_reason: 'Delegation expired, approver unavailable'
      })
      .select()
      .single();

    // Wait again
    await new Promise(resolve => setTimeout(resolve, 10));

    // Action 3: New approver approves
    await supabase.from('approvals').insert({
      position_id: positionId,
      stage: 1,
      action: 'approve',
      step_up_verified: true,
      comments: 'Final approval'
    });

    // Verify complete audit trail
    const { data: auditTrail } = await supabase
      .from('approvals')
      .select()
      .eq('position_id', positionId)
      .order('created_at', { ascending: true });

    expect(auditTrail).toHaveLength(3);

    // Verify sequence
    expect(auditTrail?.[0].action).toBe('delegate');
    expect(auditTrail?.[1].action).toBe('reassign');
    expect(auditTrail?.[2].action).toBe('approve');

    // Verify all have timestamps
    auditTrail?.forEach(record => {
      expect(record.created_at).toBeDefined();
    });

    // Verify delegation has expiry
    expect(auditTrail?.[0].delegated_until).toBeDefined();

    // Verify reassignment has reason
    expect(auditTrail?.[1].reassignment_reason).toContain('expired');

    // Verify approval has step-up
    expect(auditTrail?.[2].step_up_verified).toBe(true);

    // Cleanup
    await supabase.from('approvals').delete().eq('position_id', positionId);
    await supabase.from('positions').delete().eq('id', positionId);
  });
});
