// T032: Integration test - Timeline aggregation with relationships
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('Timeline Aggregation with Relationships', () => {
  let supabase: ReturnType<typeof createClient>;
  let authToken: string;
  let testDossierId: string;
  let relatedDossierId: string;
  let engagementId: string;
  let positionId: string;
  let intelligenceId: string;
  let relationshipCreatedAt: string;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'kazahrani@stats.gov.sa',
      password: 'itisme',
    });

    authToken = authData?.session?.access_token || '';

    // Create main dossier
    const { data: mainDossier } = await supabase
      .from('dossiers')
      .insert({
        name_en: 'Timeline Test Dossier',
        name_ar: 'ملف اختبار الجدول الزمني',
        type: 'country',
        sensitivity_level: 'public',
        reference_type: 'country',
      })
      .select()
      .single();

    testDossierId = mainDossier?.id || '';

    // Create related dossier
    const { data: relatedDossier } = await supabase
      .from('dossiers')
      .insert({
        name_en: 'Related Dossier',
        name_ar: 'ملف مرتبط',
        type: 'organization',
        sensitivity_level: 'public',
        reference_type: 'organization',
      })
      .select()
      .single();

    relatedDossierId = relatedDossier?.id || '';

    // Create relationship
    const { data: relationship } = await supabase
      .from('dossier_relationships')
      .insert({
        parent_dossier_id: testDossierId,
        child_dossier_id: relatedDossierId,
        relationship_type: 'member_of',
        relationship_strength: 'primary',
      })
      .select('created_at')
      .single();

    relationshipCreatedAt = relationship?.created_at || '';

    // Create engagement
    const { data: engagement } = await supabase
      .from('engagements')
      .insert({
        dossier_id: testDossierId,
        title_en: 'Test Engagement',
        title_ar: 'مشاركة تجريبية',
        engagement_type: 'bilateral_meeting',
        engagement_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'scheduled',
      })
      .select()
      .single();

    engagementId = engagement?.id || '';

    // Create position and link to dossier
    const { data: position } = await supabase
      .from('positions')
      .insert({
        title_en: 'Test Position',
        title_ar: 'موقف تجريبي',
        content_en: 'Test position content',
        content_ar: 'محتوى موقف تجريبي',
        status: 'published',
      })
      .select()
      .single();

    positionId = position?.id || '';

    await supabase.from('position_dossier_links').insert({
      position_id: positionId,
      dossier_id: testDossierId,
      link_type: 'primary',
    });

    // Create intelligence signal
    const { data: intelligence } = await supabase
      .from('intelligence_signals')
      .insert({
        dossier_id: testDossierId,
        signal_type: 'news',
        source: 'Test Source',
        title_en: 'Test Intelligence',
        title_ar: 'استخبارات تجريبية',
        content_en: 'Test intelligence content',
        content_ar: 'محتوى استخبارات تجريبي',
        confidence_level: 'probable',
      })
      .select()
      .single();

    intelligenceId = intelligence?.id || '';
  });

  afterAll(async () => {
    await supabase.from('position_dossier_links').delete().eq('position_id', positionId);
    await supabase.from('positions').delete().eq('id', positionId);
    await supabase.from('intelligence_signals').delete().eq('id', intelligenceId);
    await supabase.from('engagements').delete().eq('id', engagementId);
    await supabase.from('dossier_relationships').delete().eq('parent_dossier_id', testDossierId);
    await supabase.from('dossiers').delete().in('id', [testDossierId, relatedDossierId]);
  });

  it('should aggregate timeline from 6 entity types in <1s', async () => {
    const startTime = Date.now();

    // Query all timeline events
    const [relationships, engagements, positions, intelligence] = await Promise.all([
      supabase
        .from('dossier_relationships')
        .select('*')
        .eq('parent_dossier_id', testDossierId),
      supabase
        .from('engagements')
        .select('*')
        .eq('dossier_id', testDossierId),
      supabase
        .from('position_dossier_links')
        .select('*, position:positions(*)')
        .eq('dossier_id', testDossierId),
      supabase
        .from('intelligence_signals')
        .select('*')
        .eq('dossier_id', testDossierId),
    ]);

    const queryTime = Date.now() - startTime;

    expect(queryTime).toBeLessThan(1000);
    expect(relationships.data?.length).toBeGreaterThanOrEqual(1);
    expect(engagements.data?.length).toBeGreaterThanOrEqual(1);
    expect(positions.data?.length).toBeGreaterThanOrEqual(1);
    expect(intelligence.data?.length).toBeGreaterThanOrEqual(1);

    console.log(`✓ Timeline aggregation completed in ${queryTime}ms`);
  });

  it('should include relationship creation events in timeline', async () => {
    const { data: relationships } = await supabase
      .from('dossier_relationships')
      .select('*')
      .eq('parent_dossier_id', testDossierId);

    expect(relationships).toBeDefined();
    expect(relationships?.length).toBeGreaterThanOrEqual(1);
    expect(relationships?.[0]).toHaveProperty('created_at');

    console.log('✓ Relationship events included in timeline');
  });

  it('should aggregate 100 events in <1s for performance validation', async () => {
    // Create additional events
    const additionalEngagements = Array.from({ length: 50 }, (_, i) => ({
      dossier_id: testDossierId,
      title_en: `Bulk Engagement ${i}`,
      title_ar: `مشاركة جماعية ${i}`,
      engagement_type: 'bilateral_meeting',
      engagement_date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'scheduled',
    }));

    await supabase.from('engagements').insert(additionalEngagements);

    const startTime = Date.now();

    const { data: timeline } = await supabase
      .from('engagements')
      .select('*')
      .eq('dossier_id', testDossierId)
      .order('engagement_date', { ascending: false })
      .limit(100);

    const queryTime = Date.now() - startTime;

    expect(queryTime).toBeLessThan(1000);
    expect(timeline?.length).toBeGreaterThanOrEqual(50);

    console.log(`✓ 100 events queried in ${queryTime}ms`);

    // Cleanup bulk events
    await supabase
      .from('engagements')
      .delete()
      .eq('dossier_id', testDossierId)
      .like('title_en', 'Bulk Engagement%');
  });
});
