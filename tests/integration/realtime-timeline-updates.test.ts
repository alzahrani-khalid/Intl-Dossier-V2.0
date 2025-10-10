// T033: Integration test - Realtime timeline updates
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('Realtime Timeline Updates', () => {
  let supabase: ReturnType<typeof createClient>;
  let authToken: string;
  let testDossierId: string;

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
        name_en: 'Realtime Test Dossier',
        name_ar: 'ملف اختبار الوقت الفعلي',
        type: 'country',
        sensitivity_level: 'public',
        reference_type: 'country',
      })
      .select()
      .single();

    testDossierId = dossier?.id || '';
  });

  afterAll(async () => {
    await supabase.from('dossiers').delete().eq('id', testDossierId);
  });

  it('should receive realtime updates within 2 seconds', async () => {
    const updateReceived = vi.fn();
    const startTime = Date.now();

    // Subscribe to dossier timeline channel
    const channel = supabase
      .channel(`dossier-timeline:${testDossierId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'engagements',
          filter: `dossier_id=eq.${testDossierId}`,
        },
        (payload) => {
          const updateTime = Date.now() - startTime;
          updateReceived(payload, updateTime);
        }
      )
      .subscribe();

    // Wait for subscription to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create new engagement in another "session"
    const { data: engagement } = await supabase
      .from('engagements')
      .insert({
        dossier_id: testDossierId,
        title_en: 'Realtime Test Engagement',
        title_ar: 'مشاركة اختبار الوقت الفعلي',
        engagement_type: 'bilateral_meeting',
        engagement_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'scheduled',
      })
      .select()
      .single();

    // Wait up to 3 seconds for realtime update
    await new Promise(resolve => setTimeout(resolve, 3000));

    expect(updateReceived).toHaveBeenCalled();

    const [payload, updateTime] = updateReceived.mock.calls[0];
    expect(updateTime).toBeLessThan(2000); // <2s latency target

    console.log(`✓ Realtime update received in ${updateTime}ms`);

    // Cleanup
    await supabase.from('engagements').delete().eq('id', engagement?.id);
    await supabase.removeChannel(channel);
  }, 10000); // Increase timeout for this test

  it('should support multiple concurrent subscriptions', async () => {
    const updates1 = vi.fn();
    const updates2 = vi.fn();

    // Create two subscriptions
    const channel1 = supabase
      .channel(`timeline-1:${testDossierId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dossier_relationships',
          filter: `parent_dossier_id=eq.${testDossierId}`,
        },
        updates1
      )
      .subscribe();

    const channel2 = supabase
      .channel(`timeline-2:${testDossierId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dossier_relationships',
          filter: `parent_dossier_id=eq.${testDossierId}`,
        },
        updates2
      )
      .subscribe();

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Trigger update
    const { data: related } = await supabase
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

    await supabase.from('dossier_relationships').insert({
      parent_dossier_id: testDossierId,
      child_dossier_id: related?.id,
      relationship_type: 'member_of',
      relationship_strength: 'primary',
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    expect(updates1).toHaveBeenCalled();
    expect(updates2).toHaveBeenCalled();

    console.log('✓ Multiple subscriptions working correctly');

    // Cleanup
    await supabase.from('dossier_relationships').delete().eq('parent_dossier_id', testDossierId);
    await supabase.from('dossiers').delete().eq('id', related?.id);
    await supabase.removeChannel(channel1);
    await supabase.removeChannel(channel2);
  }, 10000);
});
