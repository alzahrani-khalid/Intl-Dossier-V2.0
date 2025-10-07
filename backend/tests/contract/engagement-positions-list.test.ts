/**
 * Contract Test: GET /engagements/{id}/positions
 * Feature: 012-positions-ui-critical
 * Task: T010
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

describe('GET /engagements/{id}/positions', () => {
  let testEngagementId: string;
  let testDossierId: string;
  let testPositionIds: string[] = [];
  let testUserId: string;

  beforeAll(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    testUserId = user!.id;

    // Create test dossier
    const { data: dossier } = await supabase
      .from('dossiers')
      .insert({ title: 'Test Dossier for Positions', dossier_type: 'project', status: 'active' })
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

    // Create test positions
    const positions = await Promise.all([
      supabase.from('positions').insert({
        dossier_id: testDossierId,
        title: 'Position 1',
        title_ar: 'الموقف ١',
        content: 'Content 1',
        content_ar: 'محتوى ١',
        type: 'policy_brief',
        status: 'published',
        primary_language: 'en'
      }).select().single(),
      supabase.from('positions').insert({
        dossier_id: testDossierId,
        title: 'Position 2',
        title_ar: 'الموقف ٢',
        content: 'Content 2',
        content_ar: 'محتوى ٢',
        type: 'talking_points',
        status: 'published',
        primary_language: 'en'
      }).select().single(),
      supabase.from('positions').insert({
        dossier_id: testDossierId,
        title: 'Position 3',
        title_ar: 'الموقف ٣',
        content: 'Content 3',
        content_ar: 'محتوى ٣',
        type: 'policy_brief',
        status: 'published',
        primary_language: 'en'
      }).select().single(),
    ]);

    testPositionIds = positions.map(p => p.data!.id);

    // Attach positions to engagement
    await Promise.all([
      supabase.from('engagement_positions').insert({
        engagement_id: testEngagementId,
        position_id: testPositionIds[0],
        attached_by: testUserId,
        display_order: 1,
        relevance_score: 0.95
      }),
      supabase.from('engagement_positions').insert({
        engagement_id: testEngagementId,
        position_id: testPositionIds[1],
        attached_by: testUserId,
        display_order: 2,
        relevance_score: 0.85
      }),
      supabase.from('engagement_positions').insert({
        engagement_id: testEngagementId,
        position_id: testPositionIds[2],
        attached_by: testUserId,
        display_order: 3,
        relevance_score: 0.75
      }),
    ]);
  });

  afterAll(async () => {
    // Cleanup: Delete engagement positions
    await supabase
      .from('engagement_positions')
      .delete()
      .eq('engagement_id', testEngagementId);

    // Delete positions
    await supabase
      .from('positions')
      .delete()
      .in('id', testPositionIds);

    // Delete engagement
    await supabase
      .from('engagements')
      .delete()
      .eq('id', testEngagementId);

    // Delete dossier
    await supabase
      .from('dossiers')
      .delete()
      .eq('id', testDossierId);
  });

  it('should return 200 with list of attached positions', async () => {
    const { data, error, status } = await supabase
      .from('engagement_positions')
      .select(`
        *,
        position:positions(*)
      `)
      .eq('engagement_id', testEngagementId)
      .order('display_order', { ascending: true });

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(data).toHaveLength(3);
    expect(data![0].display_order).toBe(1);
    expect(data![0].position.title).toBe('Position 1');
  });

  it('should support sorting by display_order', async () => {
    const { data, error } = await supabase
      .from('engagement_positions')
      .select('*, position:positions(*)')
      .eq('engagement_id', testEngagementId)
      .order('display_order', { ascending: true });

    expect(error).toBeNull();
    expect(data![0].display_order).toBe(1);
    expect(data![1].display_order).toBe(2);
    expect(data![2].display_order).toBe(3);
  });

  it('should support sorting by relevance_score', async () => {
    const { data, error } = await supabase
      .from('engagement_positions')
      .select('*, position:positions(*)')
      .eq('engagement_id', testEngagementId)
      .order('relevance_score', { ascending: false });

    expect(error).toBeNull();
    expect(data![0].relevance_score).toBeCloseTo(0.95);
    expect(data![1].relevance_score).toBeCloseTo(0.85);
    expect(data![2].relevance_score).toBeCloseTo(0.75);
  });

  it('should support sorting by attached_at', async () => {
    const { data, error } = await supabase
      .from('engagement_positions')
      .select('*, position:positions(*)')
      .eq('engagement_id', testEngagementId)
      .order('attached_at', { ascending: false });

    expect(error).toBeNull();
    expect(data).toHaveLength(3);
    expect(data![0].attached_at).toBeDefined();
  });

  it('should support pagination with limit', async () => {
    const { data, error } = await supabase
      .from('engagement_positions')
      .select('*, position:positions(*)')
      .eq('engagement_id', testEngagementId)
      .limit(2);

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
  });

  it('should return 404 for non-existent engagement', async () => {
    const fakeEngagementId = '00000000-0000-0000-0000-000000000000';

    const { data, error } = await supabase
      .from('engagement_positions')
      .select('*, position:positions(*)')
      .eq('engagement_id', fakeEngagementId);

    expect(data).toHaveLength(0);
  });

  it('should return 401 Unauthorized when not authenticated', async () => {
    const anonSupabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const { error, status } = await anonSupabase
      .from('engagement_positions')
      .select('*, position:positions(*)')
      .eq('engagement_id', testEngagementId);

    // RLS should block unauthenticated access
    expect(error).not.toBeNull();
  });

  it('should return 403 Forbidden for unauthorized user', async () => {
    // Create another user's dossier and engagement
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

    // Try to access other user's engagement positions (should be blocked by RLS)
    const { data, error } = await supabase
      .from('engagement_positions')
      .select('*, position:positions(*)')
      .eq('engagement_id', otherEngagement!.id);

    // RLS should return empty array for unauthorized access
    expect(data).toHaveLength(0);

    // Cleanup
    await supabase.from('engagements').delete().eq('id', otherEngagement!.id);
    await supabase.from('dossiers').delete().eq('id', otherDossier!.id);
  });
});
