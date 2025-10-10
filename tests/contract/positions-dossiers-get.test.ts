// T021: Contract test for GET /positions/{positionId}/dossiers
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('GET /positions/{positionId}/dossiers', () => {
  let supabase: ReturnType<typeof createClient>;
  let authToken: string;
  let testPositionId: string;
  let testDossier1Id: string;
  let testDossier2Id: string;
  let testDossier3Id: string;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Sign in test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'kazahrani@stats.gov.sa',
      password: 'itisme',
    });

    if (authError || !authData.session) {
      throw new Error(`Auth failed: ${authError?.message}`);
    }

    authToken = authData.session.access_token;

    // Create test dossiers
    const { data: dossiers, error: dError } = await supabase
      .from('dossiers')
      .insert([
        {
          name_en: 'Test Dossier 1',
          name_ar: 'ملف تجريبي 1',
          type: 'country',
          sensitivity_level: 'public',
          reference_type: 'country',
        },
        {
          name_en: 'Test Dossier 2',
          name_ar: 'ملف تجريبي 2',
          type: 'organization',
          sensitivity_level: 'public',
          reference_type: 'organization',
        },
        {
          name_en: 'Test Dossier 3',
          name_ar: 'ملف تجريبي 3',
          type: 'forum',
          sensitivity_level: 'public',
          reference_type: 'forum',
        },
      ])
      .select();

    if (dError || !dossiers || dossiers.length < 3) {
      throw new Error('Failed to create test dossiers');
    }

    testDossier1Id = dossiers[0].id;
    testDossier2Id = dossiers[1].id;
    testDossier3Id = dossiers[2].id;

    // Create test position
    const { data: position, error: pError } = await supabase
      .from('positions')
      .insert({
        title_en: 'Test Position with Multiple Dossiers',
        title_ar: 'موقف تجريبي مع عدة ملفات',
        status: 'published',
        position_type: 'bilateral',
        sensitivity_level: 'public',
      })
      .select()
      .single();

    if (pError || !position) {
      throw new Error('Failed to create test position');
    }

    testPositionId = position.id;

    // Create position-dossier links with different types
    await supabase.from('position_dossier_links').insert([
      {
        position_id: testPositionId,
        dossier_id: testDossier1Id,
        link_type: 'primary',
        notes: 'Primary dossier link',
      },
      {
        position_id: testPositionId,
        dossier_id: testDossier2Id,
        link_type: 'related',
        notes: 'Related dossier link',
      },
      {
        position_id: testPositionId,
        dossier_id: testDossier3Id,
        link_type: 'reference',
        notes: 'Reference dossier link',
      },
    ]);
  });

  afterAll(async () => {
    // Cleanup
    await supabase
      .from('position_dossier_links')
      .delete()
      .eq('position_id', testPositionId);
    await supabase.from('positions').delete().eq('id', testPositionId);
    await supabase.from('dossiers').delete().in('id', [testDossier1Id, testDossier2Id, testDossier3Id]);
  });

  it('should return 200 with array of linked dossiers', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-get?positionId=${testPositionId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('links');
    expect(data).toHaveProperty('total_count');
    expect(Array.isArray(data.links)).toBe(true);
    expect(data.total_count).toBe(3);
  });

  it('should include expanded dossier information', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-get?positionId=${testPositionId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    expect(data.links.length).toBeGreaterThan(0);

    const link = data.links[0];
    expect(link).toHaveProperty('position_id', testPositionId);
    expect(link).toHaveProperty('dossier_id');
    expect(link).toHaveProperty('link_type');
    expect(link).toHaveProperty('dossier'); // Expanded dossier object
    expect(link.dossier).toHaveProperty('name_en');
    expect(link.dossier).toHaveProperty('name_ar');
    expect(link.dossier).toHaveProperty('type');
  });

  it('should filter by link_type', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-get?positionId=${testPositionId}&link_type=primary`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.links.length).toBe(1);
    expect(data.links[0].link_type).toBe('primary');
    expect(data.links[0].dossier_id).toBe(testDossier1Id);
  });

  it('should support pagination with limit and offset', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-get?positionId=${testPositionId}&limit=2&offset=0`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.links.length).toBeLessThanOrEqual(2);
    expect(data.total_count).toBe(3); // Total should always be 3
  });

  it('should return 401 when unauthorized', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-get?positionId=${testPositionId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(401);
  });

  it('should return 404 for invalid position ID', async () => {
    const invalidId = '00000000-0000-0000-0000-000000000000';
    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-get?positionId=${invalidId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(404);
  });

  it('should return empty array for position with no dossier links', async () => {
    // Create position without links
    const { data: position } = await supabase
      .from('positions')
      .insert({
        title_en: 'Standalone Position',
        title_ar: 'موقف مستقل',
        status: 'published',
        position_type: 'bilateral',
        sensitivity_level: 'public',
      })
      .select()
      .single();

    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-get?positionId=${position.id}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.links).toEqual([]);
    expect(data.total_count).toBe(0);

    // Cleanup
    await supabase.from('positions').delete().eq('id', position.id);
  });

  it('should order links by link_type (primary, related, reference)', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-get?positionId=${testPositionId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    // Should be ordered: primary first, then related, then reference
    const linkTypes = data.links.map((l: any) => l.link_type);
    expect(linkTypes[0]).toBe('primary');
    expect(linkTypes).toContain('related');
    expect(linkTypes).toContain('reference');
  });
});
