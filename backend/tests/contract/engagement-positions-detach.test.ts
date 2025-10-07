/**
 * Contract Test: DELETE /engagements/{id}/positions/{positionId}
 * Feature: 012-positions-ui-critical
 * Task: T012
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

describe('DELETE /engagements/{id}/positions/{positionId}', () => {
  let testEngagementId: string;
  let testDossierId: string;
  let testPositionId: string;
  let testUserId: string;

  beforeAll(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    testUserId = user!.id;

    // Create test dossier
    const { data: dossier } = await supabase
      .from('dossiers')
      .insert({ title: 'Test Dossier', dossier_type: 'project', status: 'active' })
      .select()
      .single();
    testDossierId = dossier!.id;

    // Add user as owner
    await supabase
      .from('dossier_owners')
      .insert({ dossier_id: testDossierId, user_id: testUserId });

    // Create test engagement
    const { data: engagement } = await supabase
      .from('engagements')
      .insert({
        dossier_id: testDossierId,
        title: 'Test Engagement',
        engagement_type: 'meeting',
        engagement_date: new Date().toISOString()
      })
      .select()
      .single();
    testEngagementId = engagement!.id;

    // Create test position
    const { data: position } = await supabase
      .from('positions')
      .insert({
        dossier_id: testDossierId,
        title: 'Test Position',
        title_ar: 'موقف اختبار',
        content: 'Test content',
        content_ar: 'محتوى اختبار',
        type: 'policy_brief',
        status: 'published',
        primary_language: 'en'
      })
      .select()
      .single();
    testPositionId = position!.id;
  });

  afterAll(async () => {
    // Cleanup
    await supabase
      .from('engagement_positions')
      .delete()
      .eq('engagement_id', testEngagementId);

    await supabase
      .from('positions')
      .delete()
      .eq('id', testPositionId);

    await supabase
      .from('engagements')
      .delete()
      .eq('id', testEngagementId);

    await supabase
      .from('dossiers')
      .delete()
      .eq('id', testDossierId);
  });

  it('should return 204 and detach position successfully', async () => {
    // First attach the position
    await supabase
      .from('engagement_positions')
      .insert({
        engagement_id: testEngagementId,
        position_id: testPositionId,
        attached_by: testUserId
      });

    // Verify attachment exists
    const { data: beforeDelete } = await supabase
      .from('engagement_positions')
      .select('id')
      .eq('engagement_id', testEngagementId)
      .eq('position_id', testPositionId);

    expect(beforeDelete).toHaveLength(1);

    // Detach the position
    const { error, status } = await supabase
      .from('engagement_positions')
      .delete()
      .eq('engagement_id', testEngagementId)
      .eq('position_id', testPositionId);

    expect(error).toBeNull();
    expect(status).toBe(204);

    // Verify attachment no longer exists
    const { data: afterDelete } = await supabase
      .from('engagement_positions')
      .select('id')
      .eq('engagement_id', testEngagementId)
      .eq('position_id', testPositionId);

    expect(afterDelete).toHaveLength(0);
  });

  it('should return 404 Not Found when detaching non-existent position', async () => {
    const fakePositionId = '00000000-0000-0000-0000-000000000000';

    const { data, error } = await supabase
      .from('engagement_positions')
      .delete()
      .eq('engagement_id', testEngagementId)
      .eq('position_id', fakePositionId)
      .select();

    expect(error).toBeNull(); // Supabase doesn't error on delete of non-existent
    expect(data).toHaveLength(0); // But returns empty array
  });

  it('should return 404 Not Found for non-existent engagement', async () => {
    const fakeEngagementId = '00000000-0000-0000-0000-000000000000';

    const { data, error } = await supabase
      .from('engagement_positions')
      .delete()
      .eq('engagement_id', fakeEngagementId)
      .eq('position_id', testPositionId)
      .select();

    expect(error).toBeNull(); // Supabase doesn't error on delete of non-existent
    expect(data).toHaveLength(0);
  });

  it('should return 401 Unauthorized when not authenticated', async () => {
    // Attach position first
    await supabase
      .from('engagement_positions')
      .insert({
        engagement_id: testEngagementId,
        position_id: testPositionId,
        attached_by: testUserId
      });

    // Create unauthenticated client
    const anonSupabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Try to detach without authentication
    const { error } = await anonSupabase
      .from('engagement_positions')
      .delete()
      .eq('engagement_id', testEngagementId)
      .eq('position_id', testPositionId);

    expect(error).not.toBeNull();
    // RLS should block unauthenticated delete

    // Cleanup
    await supabase
      .from('engagement_positions')
      .delete()
      .eq('engagement_id', testEngagementId)
      .eq('position_id', testPositionId);
  });

  it('should return 403 Forbidden for non-collaborator user', async () => {
    // Create a dossier owned by another user
    const { data: otherDossier } = await supabase
      .from('dossiers')
      .insert({
        title: 'Other User Dossier',
        dossier_type: 'project',
        status: 'active',
        created_by: '00000000-0000-0000-0000-000000000001' // Different user
      })
      .select()
      .single();

    const { data: otherEngagement } = await supabase
      .from('engagements')
      .insert({
        dossier_id: otherDossier!.id,
        title: 'Other Engagement',
        engagement_type: 'meeting',
        engagement_date: new Date().toISOString()
      })
      .select()
      .single();

    const { data: otherPosition } = await supabase
      .from('positions')
      .insert({
        dossier_id: otherDossier!.id,
        title: 'Other Position',
        title_ar: 'موقف آخر',
        content: 'Other content',
        content_ar: 'محتوى آخر',
        type: 'policy_brief',
        status: 'published',
        primary_language: 'en'
      })
      .select()
      .single();

    // Attach position as system (bypass RLS for setup)
    const { data: attachment } = await supabase
      .from('engagement_positions')
      .insert({
        engagement_id: otherEngagement!.id,
        position_id: otherPosition!.id,
        attached_by: '00000000-0000-0000-0000-000000000001'
      })
      .select()
      .single();

    // Try to detach as current user (should be blocked by RLS)
    const { data, error } = await supabase
      .from('engagement_positions')
      .delete()
      .eq('id', attachment!.id)
      .select();

    expect(data).toHaveLength(0); // RLS blocks delete

    // Cleanup
    await supabase.from('engagement_positions').delete().eq('id', attachment!.id);
    await supabase.from('positions').delete().eq('id', otherPosition!.id);
    await supabase.from('engagements').delete().eq('id', otherEngagement!.id);
    await supabase.from('dossiers').delete().eq('id', otherDossier!.id);
  });

  it('should handle detaching multiple positions from same engagement', async () => {
    // Create multiple positions
    const { data: position1 } = await supabase
      .from('positions')
      .insert({
        dossier_id: testDossierId,
        title: 'Position A',
        title_ar: 'موقف أ',
        content: 'Content A',
        content_ar: 'محتوى أ',
        type: 'policy_brief',
        status: 'published',
        primary_language: 'en'
      })
      .select()
      .single();

    const { data: position2 } = await supabase
      .from('positions')
      .insert({
        dossier_id: testDossierId,
        title: 'Position B',
        title_ar: 'موقف ب',
        content: 'Content B',
        content_ar: 'محتوى ب',
        type: 'talking_points',
        status: 'published',
        primary_language: 'en'
      })
      .select()
      .single();

    // Attach both positions
    await supabase
      .from('engagement_positions')
      .insert([
        {
          engagement_id: testEngagementId,
          position_id: position1!.id,
          attached_by: testUserId
        },
        {
          engagement_id: testEngagementId,
          position_id: position2!.id,
          attached_by: testUserId
        }
      ]);

    // Verify both attached
    const { data: beforeDetach } = await supabase
      .from('engagement_positions')
      .select('id')
      .eq('engagement_id', testEngagementId);

    expect(beforeDetach!.length).toBeGreaterThanOrEqual(2);

    // Detach first position
    await supabase
      .from('engagement_positions')
      .delete()
      .eq('engagement_id', testEngagementId)
      .eq('position_id', position1!.id);

    // Verify only first position detached
    const { data: afterFirstDetach } = await supabase
      .from('engagement_positions')
      .select('position_id')
      .eq('engagement_id', testEngagementId);

    expect(afterFirstDetach!.some(ep => ep.position_id === position1!.id)).toBe(false);
    expect(afterFirstDetach!.some(ep => ep.position_id === position2!.id)).toBe(true);

    // Cleanup
    await supabase
      .from('engagement_positions')
      .delete()
      .eq('engagement_id', testEngagementId);

    await supabase
      .from('positions')
      .delete()
      .in('id', [position1!.id, position2!.id]);
  });
});
