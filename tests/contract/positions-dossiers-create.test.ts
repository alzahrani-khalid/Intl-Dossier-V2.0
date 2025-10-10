// T022: Contract test for POST /positions/{positionId}/dossiers
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('POST /positions/{positionId}/dossiers', () => {
  let supabase: ReturnType<typeof createClient>;
  let authToken: string;
  let positionId: string;
  let dossierIds: string[] = [];

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

    // Create test position
    const { data: position, error: posError } = await supabase
      .from('positions')
      .insert({
        title_en: 'Test Position for Linking',
        title_ar: 'موقف تجريبي للربط',
        content_en: 'Test content',
        content_ar: 'محتوى تجريبي',
        status: 'draft',
      })
      .select()
      .single();

    if (posError) {
      throw new Error('Failed to create test position');
    }

    positionId = position.id;

    // Create test dossiers
    const dossiersToCreate = [
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
    ];

    const { data: dossiers, error: dossierError } = await supabase
      .from('dossiers')
      .insert(dossiersToCreate)
      .select();

    if (dossierError || !dossiers) {
      throw new Error('Failed to create test dossiers');
    }

    dossierIds = dossiers.map((d) => d.id);
  });

  afterAll(async () => {
    // Cleanup links
    await supabase
      .from('position_dossier_links')
      .delete()
      .eq('position_id', positionId);

    // Cleanup test data
    await supabase.from('positions').delete().eq('id', positionId);
    for (const dossierId of dossierIds) {
      await supabase.from('dossiers').delete().eq('id', dossierId);
    }
  });

  it('should create bulk links and return 201', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positionId,
          dossier_ids: dossierIds,
          link_type: 'related',
          notes: 'Test bulk linking',
        }),
      }
    );

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data).toHaveProperty('links');
    expect(data).toHaveProperty('created_count');
    expect(data.created_count).toBe(dossierIds.length);
    expect(data.links).toHaveLength(dossierIds.length);

    // Verify each link has correct structure
    data.links.forEach((link: any) => {
      expect(link).toHaveProperty('position_id', positionId);
      expect(link).toHaveProperty('dossier_id');
      expect(link).toHaveProperty('link_type', 'related');
      expect(link).toHaveProperty('added_by');
      expect(link).toHaveProperty('added_at');
    });
  });

  it('should validate dossier_ids array length (1-100)', async () => {
    // Test empty array
    const emptyResponse = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positionId,
          dossier_ids: [],
          link_type: 'primary',
        }),
      }
    );

    expect(emptyResponse.status).toBe(400);

    // Test array exceeding 100 items (mock with 101 IDs)
    const tooManyIds = Array(101).fill('00000000-0000-0000-0000-000000000000');
    const tooManyResponse = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positionId,
          dossier_ids: tooManyIds,
          link_type: 'primary',
        }),
      }
    );

    expect(tooManyResponse.status).toBe(400);
  });

  it('should default link_type to "related"', async () => {
    // Create new position for this test
    const { data: testPosition } = await supabase
      .from('positions')
      .insert({
        title_en: 'Test Position Default Link Type',
        title_ar: 'موقف تجريبي نوع الربط الافتراضي',
        content_en: 'Test content',
        content_ar: 'محتوى تجريبي',
        status: 'draft',
      })
      .select()
      .single();

    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positionId: testPosition.id,
          dossier_ids: [dossierIds[0]],
          // No link_type specified
        }),
      }
    );

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.links[0].link_type).toBe('related');

    // Cleanup
    await supabase
      .from('position_dossier_links')
      .delete()
      .eq('position_id', testPosition.id);
    await supabase.from('positions').delete().eq('id', testPosition.id);
  });

  it('should support all link types', async () => {
    const linkTypes = ['primary', 'related', 'reference'];

    for (const linkType of linkTypes) {
      // Create new position for each link type test
      const { data: testPosition } = await supabase
        .from('positions')
        .insert({
          title_en: `Test Position ${linkType}`,
          title_ar: `موقف تجريبي ${linkType}`,
          content_en: 'Test content',
          content_ar: 'محتوى تجريبي',
          status: 'draft',
        })
        .select()
        .single();

      const response = await fetch(
        `${supabaseUrl}/functions/v1/positions-dossiers-create`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            positionId: testPosition.id,
            dossier_ids: [dossierIds[0]],
            link_type: linkType,
          }),
        }
      );

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.links[0].link_type).toBe(linkType);

      // Cleanup
      await supabase
        .from('position_dossier_links')
        .delete()
        .eq('position_id', testPosition.id);
      await supabase.from('positions').delete().eq('id', testPosition.id);
    }
  });

  it('should return 401 when unauthorized', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positionId,
          dossier_ids: dossierIds,
          link_type: 'related',
        }),
      }
    );

    expect(response.status).toBe(401);
  });

  it('should handle partial failures gracefully', async () => {
    const invalidDossierId = '00000000-0000-0000-0000-000000000000';
    const mixedIds = [...dossierIds, invalidDossierId];

    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positionId,
          dossier_ids: mixedIds,
          link_type: 'reference',
        }),
      }
    );

    // Should succeed for valid IDs
    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.created_count).toBeLessThan(mixedIds.length);
    expect(data.links.length).toBe(dossierIds.length); // Only valid links created

    // Cleanup
    await supabase
      .from('position_dossier_links')
      .delete()
      .eq('position_id', positionId);
  });

  it('should prevent duplicate links', async () => {
    // Create first link
    await fetch(`${supabaseUrl}/functions/v1/positions-dossiers-create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        positionId,
        dossier_ids: [dossierIds[0]],
        link_type: 'primary',
      }),
    });

    // Try to create duplicate
    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positionId,
          dossier_ids: [dossierIds[0]],
          link_type: 'primary',
        }),
      }
    );

    // Should either skip duplicate or return appropriate status
    expect([201, 409]).toContain(response.status);

    // Cleanup
    await supabase
      .from('position_dossier_links')
      .delete()
      .eq('position_id', positionId);
  });

  it('should include audit fields in response', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positionId,
          dossier_ids: [dossierIds[1]],
          link_type: 'related',
        }),
      }
    );

    const data = await response.json();
    const link = data.links[0];

    expect(link).toHaveProperty('added_at');
    expect(link).toHaveProperty('added_by');
    expect(link.added_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO timestamp

    // Cleanup
    await supabase
      .from('position_dossier_links')
      .delete()
      .eq('position_id', positionId);
  });
});
