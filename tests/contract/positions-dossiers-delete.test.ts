// T023: Contract test for DELETE /positions/{positionId}/dossiers/{dossierId}
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('DELETE /positions/{positionId}/dossiers/{dossierId}', () => {
  let supabase: ReturnType<typeof createClient>;
  let authToken: string;
  let testUserId: string;
  let testPositionId: string;
  let testDossierId: string;

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
    testUserId = authData.user.id;

    // Create test dossier
    const { data: dossier, error: dError } = await supabase
      .from('dossiers')
      .insert({
        name_en: 'Test Dossier for Delete',
        name_ar: 'ملف تجريبي للحذف',
        type: 'country',
        sensitivity_level: 'public',
        reference_type: 'country',
      })
      .select()
      .single();

    if (dError || !dossier) {
      throw new Error('Failed to create test dossier');
    }

    testDossierId = dossier.id;

    // Create test position
    const { data: position, error: pError } = await supabase
      .from('positions')
      .insert({
        title_en: 'Test Position for Link Deletion',
        title_ar: 'موقف تجريبي لحذف الروابط',
        status: 'draft',
        position_type: 'bilateral',
        sensitivity_level: 'public',
        created_by: testUserId,
      })
      .select()
      .single();

    if (pError || !position) {
      throw new Error('Failed to create test position');
    }

    testPositionId = position.id;
  });

  afterAll(async () => {
    // Cleanup
    await supabase.from('positions').delete().eq('id', testPositionId);
    await supabase.from('dossiers').delete().eq('id', testDossierId);
  });

  it('should return 204 and delete link successfully', async () => {
    // Create link first
    await supabase.from('position_dossier_links').insert({
      position_id: testPositionId,
      dossier_id: testDossierId,
      link_type: 'related',
    });

    // Delete the link
    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-delete`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positionId: testPositionId,
          dossierId: testDossierId,
        }),
      }
    );

    expect(response.status).toBe(204);

    // Verify link was deleted
    const { data: links } = await supabase
      .from('position_dossier_links')
      .select()
      .eq('position_id', testPositionId)
      .eq('dossier_id', testDossierId);

    expect(links).toEqual([]);
  });

  it('should return 404 when link does not exist', async () => {
    const nonExistentDossierId = '00000000-0000-0000-0000-000000000000';

    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-delete`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positionId: testPositionId,
          dossierId: nonExistentDossierId,
        }),
      }
    );

    expect(response.status).toBe(404);
  });

  it('should return 401 when unauthorized', async () => {
    // Create link
    await supabase.from('position_dossier_links').insert({
      position_id: testPositionId,
      dossier_id: testDossierId,
      link_type: 'related',
    });

    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-delete`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positionId: testPositionId,
          dossierId: testDossierId,
        }),
      }
    );

    expect(response.status).toBe(401);

    // Cleanup
    await supabase
      .from('position_dossier_links')
      .delete()
      .eq('position_id', testPositionId)
      .eq('dossier_id', testDossierId);
  });

  it('should return 403 when user does not own position', async () => {
    // Create another user's position
    const { data: otherPosition } = await supabase
      .from('positions')
      .insert({
        title_en: 'Other User Position',
        title_ar: 'موقف مستخدم آخر',
        status: 'draft',
        position_type: 'bilateral',
        sensitivity_level: 'public',
        created_by: '00000000-0000-0000-0000-000000000001', // Different user
      })
      .select()
      .single();

    if (!otherPosition) {
      // Skip if can't create position for other user
      return;
    }

    // Create link
    await supabase.from('position_dossier_links').insert({
      position_id: otherPosition.id,
      dossier_id: testDossierId,
      link_type: 'related',
    });

    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-delete`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positionId: otherPosition.id,
          dossierId: testDossierId,
        }),
      }
    );

    expect(response.status).toBe(403);

    // Cleanup
    await supabase
      .from('position_dossier_links')
      .delete()
      .eq('position_id', otherPosition.id);
    await supabase.from('positions').delete().eq('id', otherPosition.id);
  });

  it('should allow deleting primary link type', async () => {
    // Create primary link
    await supabase.from('position_dossier_links').insert({
      position_id: testPositionId,
      dossier_id: testDossierId,
      link_type: 'primary',
    });

    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-delete`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positionId: testPositionId,
          dossierId: testDossierId,
        }),
      }
    );

    expect(response.status).toBe(204);

    // Verify deletion
    const { data: links } = await supabase
      .from('position_dossier_links')
      .select()
      .eq('position_id', testPositionId)
      .eq('dossier_id', testDossierId);

    expect(links).toEqual([]);
  });

  it('should handle bulk deletions idempotently', async () => {
    // Create link
    await supabase.from('position_dossier_links').insert({
      position_id: testPositionId,
      dossier_id: testDossierId,
      link_type: 'related',
    });

    // First delete
    const response1 = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-delete`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positionId: testPositionId,
          dossierId: testDossierId,
        }),
      }
    );

    expect(response1.status).toBe(204);

    // Second delete (idempotent - should return 404)
    const response2 = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-delete`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positionId: testPositionId,
          dossierId: testDossierId,
        }),
      }
    );

    expect(response2.status).toBe(404);
  });

  it('should return 400 for invalid UUID format', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-dossiers-delete`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positionId: 'invalid-uuid',
          dossierId: testDossierId,
        }),
      }
    );

    expect(response.status).toBe(400);
  });
});
