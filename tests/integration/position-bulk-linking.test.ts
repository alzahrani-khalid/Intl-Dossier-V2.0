// T036: Integration test - Position bulk linking to dossiers
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('Position Bulk Linking to Dossiers', () => {
  let supabase: ReturnType<typeof createClient>;
  let authToken: string;
  let positionId: string;
  let dossierIds: string[] = [];

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'kazahrani@stats.gov.sa',
      password: 'itisme',
    });

    authToken = authData?.session?.access_token || '';

    // Create test position
    const { data: position } = await supabase
      .from('positions')
      .insert({
        title_en: 'Multi-Dossier Test Position',
        title_ar: 'موقف اختبار متعدد الملفات',
        content_en: 'This position applies to multiple dossiers',
        content_ar: 'هذا الموقف ينطبق على ملفات متعددة',
        status: 'published',
      })
      .select()
      .single();

    positionId = position?.id || '';

    // Create 10 test dossiers
    const dossiers = Array.from({ length: 10 }, (_, i) => ({
      name_en: `Bulk Link Dossier ${i + 1}`,
      name_ar: `ملف ربط جماعي ${i + 1}`,
      type: 'country',
      sensitivity_level: 'public',
      reference_type: 'country',
    }));

    const { data: createdDossiers } = await supabase
      .from('dossiers')
      .insert(dossiers)
      .select('id');

    dossierIds = createdDossiers?.map(d => d.id) || [];
  });

  afterAll(async () => {
    await supabase.from('position_dossier_links').delete().eq('position_id', positionId);
    await supabase.from('positions').delete().eq('id', positionId);
    await supabase.from('dossiers').delete().in('id', dossierIds);
  });

  it('should bulk link position to 10 dossiers', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          position_id: positionId,
          dossier_ids: dossierIds,
          link_type: 'related',
        }),
      }
    );

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data).toHaveProperty('created_count', 10);
    expect(data).toHaveProperty('links');
    expect(Array.isArray(data.links)).toBe(true);
    expect(data.links.length).toBe(10);

    console.log('✓ Bulk linking created 10 links successfully');
  });

  it('should query all linked dossiers for position', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-get?position_id=${positionId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('total_count', 10);
    expect(data.links.length).toBe(10);

    // Verify all dossiers are linked
    const linkedDossierIds = data.links.map((link: any) => link.dossier_id);
    expect(linkedDossierIds).toEqual(expect.arrayContaining(dossierIds));

    console.log('✓ All 10 dossiers retrieved for position');
  });

  it('should handle partial failures with some invalid dossier IDs', async () => {
    const invalidId = '00000000-0000-0000-0000-000000000000';
    const mixedIds = [dossierIds[0], invalidId, dossierIds[1]];

    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          position_id: positionId,
          dossier_ids: mixedIds,
          link_type: 'reference',
        }),
      }
    );

    // Should succeed for valid IDs
    expect(response.status).toBe(201);

    const data = await response.json();
    // Should have created links for valid dossiers only (might be 0 if already linked)
    expect(data).toHaveProperty('created_count');

    console.log('✓ Partial failure handling working');
  });

  it('should filter links by link_type', async () => {
    // Create links with different types
    await supabase.from('position_dossier_links').insert({
      position_id: positionId,
      dossier_id: dossierIds[0],
      link_type: 'primary',
    });

    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-get?position_id=${positionId}&link_type=primary`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    const allPrimary = data.links.every((link: any) => link.link_type === 'primary');

    expect(allPrimary).toBe(true);

    console.log('✓ Link type filtering working');
  });

  it('should allow unlinking from a dossier', async () => {
    const unlinkDossierId = dossierIds[5];

    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-delete?position_id=${positionId}&dossier_id=${unlinkDossierId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(204);

    // Verify link removed
    const { data: links } = await supabase
      .from('position_dossier_links')
      .select('*')
      .eq('position_id', positionId)
      .eq('dossier_id', unlinkDossierId);

    expect(links?.length).toBe(0);

    console.log('✓ Unlinking working correctly');
  });
});
