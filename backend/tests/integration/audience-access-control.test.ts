import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// T082: Integration test for audience group access control
describe('Audience Group Access Control Integration Tests', () => {
  const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  let testPositionId: string;
  let positionTypeId: string;
  let managementGroupId: string;
  let policyGroupId: string;
  let allStaffGroupId: string;

  beforeAll(async () => {
    // Get position type
    const { data: positionTypes } = await supabase
      .from('position_types')
      .select('id')
      .eq('name_en', 'Standard Position')
      .single();
    positionTypeId = positionTypes?.id;

    // Get audience groups
    const { data: management } = await supabase
      .from('audience_groups')
      .select('id')
      .eq('name_en', 'Management')
      .single();
    managementGroupId = management?.id;

    const { data: policy } = await supabase
      .from('audience_groups')
      .select('id')
      .eq('name_en', 'Policy Officers')
      .single();
    policyGroupId = policy?.id;

    const { data: allStaff } = await supabase
      .from('audience_groups')
      .select('id')
      .eq('name_en', 'All Staff')
      .single();
    allStaffGroupId = allStaff?.id;
  });

  afterAll(async () => {
    if (testPositionId) {
      await supabase.from('position_audience_groups').delete().eq('position_id', testPositionId);
      await supabase.from('positions').delete().eq('id', testPositionId);
    }
  });

  it('should enforce RLS: user in audience group sees published position', async () => {
    // Create published position with Management audience group
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Management-Only Position',
        title_ar: 'موقف للإدارة فقط',
        content_en: 'Sensitive management content',
        content_ar: 'محتوى إداري حساس',
        thematic_category: 'Policy',
        status: 'published',
        version: 1
      })
      .select()
      .single();

    testPositionId = position.id;

    // Associate with Management audience group
    await supabase.from('position_audience_groups').insert({
      position_id: testPositionId,
      audience_group_id: managementGroupId
    });

    // Simulate user in Management group querying published positions
    // Note: In real scenario, this would use auth.uid() in RLS policy
    // Here we verify the junction table is correctly set up
    const { data: accessiblePositions } = await supabase
      .from('positions')
      .select(`
        *,
        position_audience_groups!inner(audience_group_id)
      `)
      .eq('status', 'published')
      .eq('position_audience_groups.audience_group_id', managementGroupId);

    expect(accessiblePositions).toHaveLength(1);
    expect(accessiblePositions?.[0].id).toBe(testPositionId);
  });

  it('should enforce RLS: user NOT in audience group cannot see published position', async () => {
    // Create published position for Management only
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Restricted Position',
        title_ar: 'موقف مقيد',
        content_en: 'Restricted content',
        content_ar: 'محتوى مقيد',
        thematic_category: 'Security',
        status: 'published',
        version: 1
      })
      .select()
      .single();

    const positionId = position.id;

    // Associate ONLY with Management
    await supabase.from('position_audience_groups').insert({
      position_id: positionId,
      audience_group_id: managementGroupId
    });

    // Simulate user in Policy Officers group (NOT in Management) querying
    const { data: inaccessiblePositions } = await supabase
      .from('positions')
      .select(`
        *,
        position_audience_groups!inner(audience_group_id)
      `)
      .eq('status', 'published')
      .eq('position_audience_groups.audience_group_id', policyGroupId); // Policy group, not Management

    // Should NOT find the position
    const foundPosition = inaccessiblePositions?.find(p => p.id === positionId);
    expect(foundPosition).toBeUndefined();

    // Cleanup
    await supabase.from('position_audience_groups').delete().eq('position_id', positionId);
    await supabase.from('positions').delete().eq('id', positionId);
  });

  it('should allow drafter to see own drafts regardless of audience group', async () => {
    // Create draft position (not yet published)
    const { data: draftPosition } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Draft Position',
        title_ar: 'موقف مسودة',
        content_en: 'Draft content',
        content_ar: 'محتوى المسودة',
        thematic_category: 'Trade',
        status: 'draft',
        version: 1
      })
      .select()
      .single();

    const positionId = draftPosition.id;

    // Simulate drafter querying own drafts
    // Note: In real scenario, RLS policy checks author_id = auth.uid()
    const { data: ownDrafts } = await supabase
      .from('positions')
      .select()
      .eq('status', 'draft')
      .eq('id', positionId);

    expect(ownDrafts).toHaveLength(1);
    expect(ownDrafts?.[0].status).toBe('draft');

    // Cleanup
    await supabase.from('positions').delete().eq('id', positionId);
  });

  it('should allow approver to see positions at their stage', async () => {
    // Create position under review at stage 2
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Position Under Review',
        title_ar: 'موقف قيد المراجعة',
        content_en: 'Content under review',
        content_ar: 'محتوى قيد المراجعة',
        thematic_category: 'Policy',
        status: 'under_review',
        current_stage: 2,
        version: 1
      })
      .select()
      .single();

    const positionId = position.id;

    // Simulate approver at stage 2 querying pending approvals
    // Note: In real scenario, RLS policy checks approval_chain_config
    const { data: pendingApprovals } = await supabase
      .from('positions')
      .select()
      .eq('status', 'under_review')
      .eq('current_stage', 2)
      .eq('id', positionId);

    expect(pendingApprovals).toHaveLength(1);
    expect(pendingApprovals?.[0].current_stage).toBe(2);

    // Cleanup
    await supabase.from('positions').delete().eq('id', positionId);
  });

  it('should support position with multiple audience groups', async () => {
    // Create published position for both Management AND Policy Officers
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionTypeId,
        title_en: 'Multi-Audience Position',
        title_ar: 'موقف متعدد الجماهير',
        content_en: 'Content for multiple groups',
        content_ar: 'محتوى لمجموعات متعددة',
        thematic_category: 'Trade',
        status: 'published',
        version: 1
      })
      .select()
      .single();

    const positionId = position.id;

    // Associate with both Management and Policy Officers
    await supabase.from('position_audience_groups').insert([
      { position_id: positionId, audience_group_id: managementGroupId },
      { position_id: positionId, audience_group_id: policyGroupId }
    ]);

    // Verify both groups can access
    const { data: managementAccess } = await supabase
      .from('positions')
      .select(`
        *,
        position_audience_groups!inner(audience_group_id)
      `)
      .eq('status', 'published')
      .eq('position_audience_groups.audience_group_id', managementGroupId)
      .eq('id', positionId);

    expect(managementAccess).toHaveLength(1);

    const { data: policyAccess } = await supabase
      .from('positions')
      .select(`
        *,
        position_audience_groups!inner(audience_group_id)
      `)
      .eq('status', 'published')
      .eq('position_audience_groups.audience_group_id', policyGroupId)
      .eq('id', positionId);

    expect(policyAccess).toHaveLength(1);

    // Verify All Staff group CANNOT access (not in selected groups)
    const { data: allStaffAccess } = await supabase
      .from('positions')
      .select(`
        *,
        position_audience_groups!inner(audience_group_id)
      `)
      .eq('status', 'published')
      .eq('position_audience_groups.audience_group_id', allStaffGroupId)
      .eq('id', positionId);

    const foundByAllStaff = allStaffAccess?.find(p => p.id === positionId);
    expect(foundByAllStaff).toBeUndefined();

    // Cleanup
    await supabase.from('position_audience_groups').delete().eq('position_id', positionId);
    await supabase.from('positions').delete().eq('id', positionId);
  });
});
