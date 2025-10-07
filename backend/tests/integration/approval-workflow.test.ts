import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// T078: Integration test for complete approval workflow
describe('Approval Workflow Integration Tests', () => {
  const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  let testPositionId: string;
  let positionTypeId: string;
  let audienceGroupId: string;
  let drafterUserId: string;
  let approver1UserId: string;
  let approver2UserId: string;

  beforeAll(async () => {
    // Get position type (5-stage Critical Position)
    const { data: positionTypes } = await supabase
      .from('position_types')
      .select('id')
      .eq('name_en', 'Critical Position')
      .single();
    positionTypeId = positionTypes?.id;

    // Get audience group
    const { data: audienceGroups } = await supabase
      .from('audience_groups')
      .select('id')
      .eq('name_en', 'Management')
      .single();
    audienceGroupId = audienceGroups?.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testPositionId) {
      await supabase.from('approvals').delete().eq('position_id', testPositionId);
      await supabase.from('position_versions').delete().eq('position_id', testPositionId);
      await supabase.from('position_audience_groups').delete().eq('position_id', testPositionId);
      await supabase.from('positions').delete().eq('id', testPositionId);
    }
  });

  it('should complete full approval workflow: draft → submit → approve (all stages) → approved', async () => {
    // Step 1: Create draft position
    const { data: position, error: createError } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Test Critical Position',
        title_ar: 'موقف اختبار حرج',
        content_en: 'This is test content for approval workflow',
        content_ar: 'هذا محتوى اختبار لسير عمل الموافقة',
        rationale_en: 'Test rationale',
        rationale_ar: 'مبرر الاختبار',
        thematic_category: 'Trade Policy',
        status: 'draft',
        current_stage: 0,
        consistency_score: 95,
        version: 1
      })
      .select()
      .single();

    expect(createError).toBeNull();
    expect(position).toBeDefined();
    expect(position.status).toBe('draft');
    testPositionId = position.id;

    // Associate audience group
    await supabase.from('position_audience_groups').insert({
      position_id: testPositionId,
      audience_group_id: audienceGroupId
    });

    // Step 2: Submit for review
    const { data: submitted, error: submitError } = await supabase
      .from('positions')
      .update({
        status: 'under_review',
        current_stage: 1
      })
      .eq('id', testPositionId)
      .select()
      .single();

    expect(submitError).toBeNull();
    expect(submitted.status).toBe('under_review');
    expect(submitted.current_stage).toBe(1);

    // Create version 1 record
    await supabase.from('position_versions').insert({
      position_id: testPositionId,
      version_number: 1,
      content_en: position.content_en,
      content_ar: position.content_ar,
      rationale_en: position.rationale_en,
      rationale_ar: position.rationale_ar,
      full_snapshot: position,
      superseded: false,
      retention_until: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Step 3: Approve at each stage (5 stages for Critical Position)
    for (let stage = 1; stage <= 5; stage++) {
      const { error: approvalError } = await supabase.from('approvals').insert({
        position_id: testPositionId,
        stage: stage,
        action: 'approve',
        step_up_verified: true,
        comments: `Stage ${stage} approved`
      });

      expect(approvalError).toBeNull();

      // Update position to next stage or approved status
      const isLastStage = stage === 5;
      await supabase
        .from('positions')
        .update({
          current_stage: isLastStage ? 5 : stage + 1,
          status: isLastStage ? 'approved' : 'under_review'
        })
        .eq('id', testPositionId);
    }

    // Step 4: Verify final status is approved
    const { data: finalPosition } = await supabase
      .from('positions')
      .select()
      .eq('id', testPositionId)
      .single();

    expect(finalPosition.status).toBe('approved');
    expect(finalPosition.current_stage).toBe(5);

    // Step 5: Verify all 5 approvals recorded
    const { data: approvals } = await supabase
      .from('approvals')
      .select()
      .eq('position_id', testPositionId)
      .eq('action', 'approve');

    expect(approvals).toHaveLength(5);
    approvals?.forEach((approval, index) => {
      expect(approval.stage).toBe(index + 1);
      expect(approval.step_up_verified).toBe(true);
    });
  });

  it('should handle request revisions workflow: approve stage 1 → request revisions stage 2 → back to draft', async () => {
    // Create draft position
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Test Position for Revisions',
        title_ar: 'موقف اختبار للمراجعات',
        content_en: 'Content needing revisions',
        content_ar: 'محتوى يحتاج إلى مراجعات',
        thematic_category: 'Trade Policy',
        status: 'draft',
        current_stage: 0,
        version: 1
      })
      .select()
      .single();

    const positionId = position.id;

    // Submit for review
    await supabase
      .from('positions')
      .update({ status: 'under_review', current_stage: 1 })
      .eq('id', positionId);

    // Stage 1: Approve
    await supabase.from('approvals').insert({
      position_id: positionId,
      stage: 1,
      action: 'approve',
      step_up_verified: true
    });

    await supabase
      .from('positions')
      .update({ current_stage: 2 })
      .eq('id', positionId);

    // Stage 2: Request revisions
    const revisionComments = 'Please clarify the rationale section';
    await supabase.from('approvals').insert({
      position_id: positionId,
      stage: 2,
      action: 'request_revisions',
      comments: revisionComments
    });

    // Return to draft
    await supabase
      .from('positions')
      .update({ status: 'draft', current_stage: 0 })
      .eq('id', positionId);

    // Verify position returned to draft
    const { data: draftPosition } = await supabase
      .from('positions')
      .select()
      .eq('id', positionId)
      .single();

    expect(draftPosition.status).toBe('draft');
    expect(draftPosition.current_stage).toBe(0);

    // Verify revision request recorded
    const { data: revisionApproval } = await supabase
      .from('approvals')
      .select()
      .eq('position_id', positionId)
      .eq('action', 'request_revisions')
      .single();

    expect(revisionApproval.comments).toBe(revisionComments);
    expect(revisionApproval.stage).toBe(2);

    // Cleanup
    await supabase.from('approvals').delete().eq('position_id', positionId);
    await supabase.from('positions').delete().eq('id', positionId);
  });

  it('should handle delegation mid-workflow', async () => {
    // Create and submit position
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Test Position for Delegation',
        title_ar: 'موقف اختبار للتفويض',
        content_en: 'Content for delegation test',
        content_ar: 'محتوى لاختبار التفويض',
        thematic_category: 'Security',
        status: 'under_review',
        current_stage: 1,
        version: 1
      })
      .select()
      .single();

    const positionId = position.id;

    // Stage 1: Delegate approval
    const delegateUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('approvals').insert({
      position_id: positionId,
      stage: 1,
      action: 'delegate',
      delegated_until: delegateUntil,
      comments: 'Delegating due to vacation'
    });

    // Verify delegation recorded
    const { data: delegation } = await supabase
      .from('approvals')
      .select()
      .eq('position_id', positionId)
      .eq('action', 'delegate')
      .single();

    expect(delegation.delegated_until).toBe(delegateUntil);
    expect(delegation.comments).toContain('vacation');

    // Delegated user approves
    await supabase.from('approvals').insert({
      position_id: positionId,
      stage: 1,
      action: 'approve',
      step_up_verified: true,
      comments: 'Approved as delegate'
    });

    // Update position stage
    await supabase
      .from('positions')
      .update({ current_stage: 2 })
      .eq('id', positionId);

    // Verify stage progressed
    const { data: updatedPosition } = await supabase
      .from('positions')
      .select()
      .eq('id', positionId)
      .single();

    expect(updatedPosition.current_stage).toBe(2);

    // Cleanup
    await supabase.from('approvals').delete().eq('position_id', positionId);
    await supabase.from('positions').delete().eq('id', positionId);
  });
});
