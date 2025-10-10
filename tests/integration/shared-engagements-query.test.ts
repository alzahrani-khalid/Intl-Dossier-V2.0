// T031: Integration test - Cross-dossier engagement queries
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('Cross-Dossier Engagement Queries', () => {
  let supabase: ReturnType<typeof createClient>;
  let authToken: string;
  let dossierAId: string;
  let dossierBId: string;
  let sharedEngagementIds: string[] = [];
  let dossierAOnlyEngagementId: string;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'kazahrani@stats.gov.sa',
      password: 'itisme',
    });

    authToken = authData?.session?.access_token || '';

    // Create two dossiers
    const { data: dossierA } = await supabase
      .from('dossiers')
      .insert({
        name_en: 'Saudi Arabia',
        name_ar: 'المملكة العربية السعودية',
        type: 'country',
        sensitivity_level: 'public',
        reference_type: 'country',
      })
      .select()
      .single();

    const { data: dossierB } = await supabase
      .from('dossiers')
      .insert({
        name_en: 'World Bank',
        name_ar: 'البنك الدولي',
        type: 'organization',
        sensitivity_level: 'public',
        reference_type: 'organization',
      })
      .select()
      .single();

    dossierAId = dossierA?.id || '';
    dossierBId = dossierB?.id || '';

    // Create 2 shared engagements (both dossiers)
    for (let i = 0; i < 2; i++) {
      const { data: engagement } = await supabase
        .from('engagements')
        .insert({
          dossier_id: dossierAId,
          title_en: `Shared Meeting ${i + 1}`,
          title_ar: `اجتماع مشترك ${i + 1}`,
          engagement_type: 'bilateral_meeting',
          engagement_date: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          status: 'scheduled',
        })
        .select()
        .single();

      if (engagement) {
        sharedEngagementIds.push(engagement.id);
        // Link to dossierB as well
        await supabase.from('engagement_dossier_links').insert({
          engagement_id: engagement.id,
          dossier_id: dossierBId,
        });
      }
    }

    // Create 1 engagement for dossierA only
    const { data: soloEngagement } = await supabase
      .from('engagements')
      .insert({
        dossier_id: dossierAId,
        title_en: 'Solo Meeting',
        title_ar: 'اجتماع منفرد',
        engagement_type: 'unilateral_event',
        engagement_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        status: 'scheduled',
      })
      .select()
      .single();

    dossierAOnlyEngagementId = soloEngagement?.id || '';
  });

  afterAll(async () => {
    await supabase.from('engagement_dossier_links').delete().in('engagement_id', sharedEngagementIds);
    await supabase.from('engagements').delete().in('id', [...sharedEngagementIds, dossierAOnlyEngagementId]);
    await supabase.from('dossiers').delete().in('id', [dossierAId, dossierBId]);
  });

  it('should return shared engagements for dossierA', async () => {
    const startTime = Date.now();

    // Query engagements for dossierA
    const { data: engagements } = await supabase
      .from('engagements')
      .select(`
        *,
        engagement_dossier_links (
          dossier_id
        )
      `)
      .eq('dossier_id', dossierAId);

    const queryTime = Date.now() - startTime;

    expect(queryTime).toBeLessThan(1000); // <1s performance target
    expect(engagements).toBeDefined();
    expect(engagements?.length).toBeGreaterThanOrEqual(3); // 2 shared + 1 solo

    console.log(`✓ Query completed in ${queryTime}ms`);
  });

  it('should identify multi-dossier engagements', async () => {
    const { data: engagements } = await supabase
      .from('engagements')
      .select(`
        *,
        engagement_dossier_links (
          dossier_id
        )
      `)
      .eq('dossier_id', dossierAId);

    const multiDossierEngagements = engagements?.filter(
      (e: any) => e.engagement_dossier_links.length > 0
    );

    expect(multiDossierEngagements?.length).toBeGreaterThanOrEqual(2);

    console.log('✓ Multi-dossier engagements identified correctly');
  });

  it('should show World Bank in related dossiers for shared engagements', async () => {
    const { data: engagements } = await supabase
      .from('engagements')
      .select(`
        *,
        engagement_dossier_links (
          dossier_id,
          dossier:dossiers (
            id,
            name_en,
            name_ar
          )
        )
      `)
      .eq('id', sharedEngagementIds[0])
      .single();

    expect(engagements?.engagement_dossier_links).toBeDefined();
    expect(engagements?.engagement_dossier_links.length).toBeGreaterThan(0);

    const relatedDossiers = engagements?.engagement_dossier_links.map((link: any) => link.dossier_id);
    expect(relatedDossiers).toContain(dossierBId);

    console.log('✓ Related dossiers correctly linked to engagements');
  });

  it('should query shared engagements from dossierB perspective', async () => {
    const { data: engagements } = await supabase
      .from('engagement_dossier_links')
      .select(`
        engagement:engagements (
          *
        )
      `)
      .eq('dossier_id', dossierBId);

    expect(engagements?.length).toBeGreaterThanOrEqual(2);

    console.log('✓ Shared engagements visible from dossierB');
  });
});
