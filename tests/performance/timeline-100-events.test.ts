// T083: Performance test - Timeline query with 100 events
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('Timeline Query Performance (100 Events)', () => {
  let supabase: ReturnType<typeof createClient>;
  let authToken: string;
  let dossierId: string;
  let engagementIds: string[] = [];

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'kazahrani@stats.gov.sa',
      password: 'itisme',
    });

    authToken = authData?.session?.access_token || '';

    // Create test dossier
    const { data: dossier } = await supabase
      .from('dossiers')
      .insert({
        name_en: 'Timeline Performance Test',
        name_ar: 'اختبار أداء الجدول الزمني',
        type: 'country',
        sensitivity_level: 'public',
        reference_type: 'country',
      })
      .select()
      .single();

    dossierId = dossier?.id || '';

    // Create 100 engagements
    const engagements = Array.from({ length: 100 }, (_, i) => ({
      dossier_id: dossierId,
      title_en: `Timeline Event ${i + 1}`,
      title_ar: `حدث جدول زمني ${i + 1}`,
      engagement_type: 'bilateral_meeting',
      engagement_date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'scheduled',
    }));

    const { data: created } = await supabase
      .from('engagements')
      .insert(engagements)
      .select('id');

    engagementIds = created?.map(e => e.id) || [];
  });

  afterAll(async () => {
    await supabase.from('engagements').delete().in('id', engagementIds);
    await supabase.from('dossiers').delete().eq('id', dossierId);
  });

  it('should query 100 events in <1000ms', async () => {
    const startTime = Date.now();

    const { data: timeline } = await supabase
      .from('engagements')
      .select('*')
      .eq('dossier_id', dossierId)
      .order('engagement_date', { ascending: false })
      .limit(100);

    const queryTime = Date.now() - startTime;

    expect(timeline).toBeDefined();
    expect(timeline?.length).toBe(100);
    expect(queryTime).toBeLessThan(1000);

    console.log(`✓ 100-event timeline query completed in ${queryTime}ms`);
    console.log(`  Target: <1000ms, Actual: ${queryTime}ms, ${queryTime < 1000 ? 'PASS' : 'FAIL'}`);
  });

  it('should handle concurrent timeline queries', async () => {
    const startTime = Date.now();

    // Simulate 5 concurrent queries
    const queries = Array.from({ length: 5 }, () =>
      supabase
        .from('engagements')
        .select('*')
        .eq('dossier_id', dossierId)
        .order('engagement_date', { ascending: false })
        .limit(100)
    );

    const results = await Promise.all(queries);

    const queryTime = Date.now() - startTime;

    // All queries should succeed
    results.forEach(result => {
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(100);
    });

    // Total time for 5 concurrent queries should be <2s
    expect(queryTime).toBeLessThan(2000);

    console.log(`✓ 5 concurrent timeline queries completed in ${queryTime}ms`);
  });
});
