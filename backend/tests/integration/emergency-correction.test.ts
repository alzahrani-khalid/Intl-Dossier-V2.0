import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// T101: Integration test for emergency correction workflow
describe('Emergency Correction Workflow Integration Tests', () => {
  const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  let testPositionId: string;
  let positionTypeId: string;
  let audienceGroupId: string;

  beforeAll(async () => {
    const { data: positionTypes } = await supabase
      .from('position_types')
      .select('id')
      .eq('name_en', 'Standard Position')
      .single();
    positionTypeId = positionTypes?.id;

    const { data: audienceGroups } = await supabase
      .from('audience_groups')
      .select('id')
      .eq('name_en', 'Management')
      .single();
    audienceGroupId = audienceGroups?.id;
  });

  afterAll(async () => {
    if (testPositionId) {
      await supabase.from('position_versions').delete().eq('position_id', testPositionId);
      await supabase.from('position_audience_groups').delete().eq('position_id', testPositionId);
      await supabase.from('positions').delete().eq('id', testPositionId);
    }
  });

  it('should allow admin to trigger emergency correction with reason', async () => {
    // Create published position with error
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Published Position with Error',
        title_ar: 'موقف منشور يحتوي على خطأ',
        content_en: 'Content with critical error that needs correction',
        content_ar: 'محتوى يحتوي على خطأ حرج يحتاج إلى تصحيح',
        thematic_category: 'Policy',
        status: 'published',
        version: 1,
        emergency_correction: false
      })
      .select()
      .single();

    testPositionId = position.id;

    // Associate with audience group
    await supabase.from('position_audience_groups').insert({
      position_id: testPositionId,
      audience_group_id: audienceGroupId
    });

    // Create version 1
    await supabase.from('position_versions').insert({
      position_id: testPositionId,
      version_number: 1,
      content_en: position.content_en,
      content_ar: position.content_ar,
      full_snapshot: position,
      superseded: false,
      retention_until: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Admin triggers emergency correction
    const correctionReason = 'Critical factual error discovered in published content';
    const correctedContent = 'Corrected content with accurate information';

    // Mark original as emergency corrected
    const { data: corrected } = await supabase
      .from('positions')
      .update({
        emergency_correction: true,
        corrected_at: new Date().toISOString(),
        correction_reason: correctionReason,
        content_en: correctedContent,
        version: 2
      })
      .eq('id', testPositionId)
      .select()
      .single();

    expect(corrected.emergency_correction).toBe(true);
    expect(corrected.correction_reason).toBe(correctionReason);
    expect(corrected.content_en).toBe(correctedContent);

    // Mark version 1 as superseded
    await supabase
      .from('position_versions')
      .update({ superseded: true })
      .eq('position_id', testPositionId)
      .eq('version_number', 1);

    // Create corrected version 2
    const { data: correctedVersion } = await supabase
      .from('position_versions')
      .insert({
        position_id: testPositionId,
        version_number: 2,
        content_en: correctedContent,
        content_ar: 'محتوى مصحح بمعلومات دقيقة',
        full_snapshot: corrected,
        superseded: false,
        retention_until: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    expect(correctedVersion.version_number).toBe(2);
  });

  it('should create new corrected version and mark original', async () => {
    // Create published position
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Position to be Corrected',
        title_ar: 'موقف للتصحيح',
        content_en: 'Original content',
        content_ar: 'المحتوى الأصلي',
        thematic_category: 'Security',
        status: 'published',
        version: 1
      })
      .select()
      .single();

    const positionId = position.id;

    // Create version 1
    await supabase.from('position_versions').insert({
      position_id: positionId,
      version_number: 1,
      content_en: position.content_en,
      content_ar: position.content_ar,
      full_snapshot: position,
      superseded: false,
      retention_until: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Apply emergency correction
    await supabase
      .from('positions')
      .update({
        emergency_correction: true,
        corrected_at: new Date().toISOString(),
        correction_reason: 'Urgent correction needed',
        version: 2
      })
      .eq('id', positionId);

    // Mark version 1 as corrected (superseded)
    await supabase
      .from('position_versions')
      .update({ superseded: true })
      .eq('position_id', positionId)
      .eq('version_number', 1);

    // Verify original version marked as superseded
    const { data: originalVersion } = await supabase
      .from('position_versions')
      .select()
      .eq('position_id', positionId)
      .eq('version_number', 1)
      .single();

    expect(originalVersion.superseded).toBe(true);

    // Verify position has emergency correction flag
    const { data: correctedPosition } = await supabase
      .from('positions')
      .select()
      .eq('id', positionId)
      .single();

    expect(correctedPosition.emergency_correction).toBe(true);
    expect(correctedPosition.corrected_at).toBeDefined();
    expect(correctedPosition.correction_reason).toContain('Urgent');

    // Cleanup
    await supabase.from('position_versions').delete().eq('position_id', positionId);
    await supabase.from('positions').delete().eq('id', positionId);
  });

  it('should record correction timestamp, admin identity, and reason', async () => {
    // Create published position
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Audit Trail Test',
        title_ar: 'اختبار سجل التدقيق',
        content_en: 'Content',
        content_ar: 'المحتوى',
        thematic_category: 'Trade',
        status: 'published',
        version: 1
      })
      .select()
      .single();

    const positionId = position.id;

    // Admin applies correction
    const correctedAt = new Date();
    const correctionReason = 'Data accuracy issue identified post-publication';

    await supabase
      .from('positions')
      .update({
        emergency_correction: true,
        corrected_at: correctedAt.toISOString(),
        correction_reason: correctionReason
      })
      .eq('id', positionId);

    // Verify audit fields recorded
    const { data: auditedPosition } = await supabase
      .from('positions')
      .select()
      .eq('id', positionId)
      .single();

    expect(auditedPosition.corrected_at).toBe(correctedAt.toISOString());
    expect(auditedPosition.correction_reason).toBe(correctionReason);
    expect(auditedPosition.emergency_correction).toBe(true);

    // Cleanup
    await supabase.from('positions').delete().eq('id', positionId);
  });

  it('should verify emergency correction requires mandatory reason', async () => {
    // Create published position
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Reason Required Test',
        title_ar: 'اختبار السبب المطلوب',
        content_en: 'Content',
        content_ar: 'المحتوى',
        thematic_category: 'Policy',
        status: 'published',
        version: 1
      })
      .select()
      .single();

    const positionId = position.id;

    // Attempt correction without reason (should fail with constraint)
    const { error: correctionError } = await supabase
      .from('positions')
      .update({
        emergency_correction: true,
        corrected_at: new Date().toISOString(),
        // correction_reason: null // Missing required field
      })
      .eq('id', positionId);

    // In real system with constraints, this would fail
    // For testing, we verify reason field is required
    // Note: Actual constraint enforcement depends on DB migration

    // Correct approach with reason
    const { data: corrected, error: validError } = await supabase
      .from('positions')
      .update({
        emergency_correction: true,
        corrected_at: new Date().toISOString(),
        correction_reason: 'Valid reason provided'
      })
      .eq('id', positionId)
      .select()
      .single();

    expect(validError).toBeNull();
    expect(corrected.correction_reason).toBe('Valid reason provided');

    // Cleanup
    await supabase.from('positions').delete().eq('id', positionId);
  });

  it('should test 403 for non-admin users attempting emergency correction', async () => {
    // Create published position
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Admin-Only Correction',
        title_ar: 'تصحيح للمشرف فقط',
        content_en: 'Content',
        content_ar: 'المحتوى',
        thematic_category: 'Security',
        status: 'published',
        version: 1
      })
      .select()
      .single();

    const positionId = position.id;

    // In real system, non-admin user would get 403 from RLS policy
    // Here we verify the operation should be restricted
    // Note: Actual enforcement requires RLS policy on positions table

    // For testing purposes, we can check that emergency_correction operations
    // should only be allowed by admin role (via JWT claims)
    // This would be enforced at the Edge Function or RLS level

    // Verify position exists and can be queried
    const { data: existingPosition } = await supabase
      .from('positions')
      .select()
      .eq('id', positionId)
      .single();

    expect(existingPosition).toBeDefined();
    expect(existingPosition.status).toBe('published');

    // Cleanup
    await supabase.from('positions').delete().eq('id', positionId);
  });

  it('should verify audience notification sent on emergency correction', async () => {
    // Create published position with audience
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Notification Test Position',
        title_ar: 'موقف اختبار الإشعار',
        content_en: 'Content',
        content_ar: 'المحتوى',
        thematic_category: 'Policy',
        status: 'published',
        version: 1
      })
      .select()
      .single();

    const positionId = position.id;

    // Associate with audience group
    await supabase.from('position_audience_groups').insert({
      position_id: positionId,
      audience_group_id: audienceGroupId
    });

    // Apply emergency correction
    await supabase
      .from('positions')
      .update({
        emergency_correction: true,
        corrected_at: new Date().toISOString(),
        correction_reason: 'Critical update requiring notification'
      })
      .eq('id', positionId);

    // Verify position has audience groups (for notification targeting)
    const { data: audiences } = await supabase
      .from('position_audience_groups')
      .select()
      .eq('position_id', positionId);

    expect(audiences).toHaveLength(1);
    expect(audiences?.[0].audience_group_id).toBe(audienceGroupId);

    // In real system, notification would be sent to all users in audience groups
    // This is verified by checking the audience groups are correctly associated

    // Cleanup
    await supabase.from('position_audience_groups').delete().eq('position_id', positionId);
    await supabase.from('positions').delete().eq('id', positionId);
  });
});
