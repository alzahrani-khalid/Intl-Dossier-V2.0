// T020: Contract test for DELETE /dossiers/{parentId}/relationships/{childId}
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('DELETE /dossiers/{parentId}/relationships/{childId}', () => {
  let supabase: ReturnType<typeof createClient>;
  let authToken: string;
  let parentDossierId: string;
  let childDossierId: string;

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
    const { data: dossier1, error: error1 } = await supabase
      .from('dossiers')
      .insert({
        name_en: 'Test Parent Dossier Delete',
        name_ar: 'ملف أب للحذف',
        type: 'country',
        sensitivity_level: 'public',
        reference_type: 'country',
      })
      .select()
      .single();

    const { data: dossier2, error: error2 } = await supabase
      .from('dossiers')
      .insert({
        name_en: 'Test Child Dossier Delete',
        name_ar: 'ملف فرع للحذف',
        type: 'organization',
        sensitivity_level: 'public',
        reference_type: 'organization',
      })
      .select()
      .single();

    if (error1 || error2) {
      throw new Error('Failed to create test dossiers');
    }

    parentDossierId = dossier1.id;
    childDossierId = dossier2.id;
  });

  afterAll(async () => {
    // Cleanup test dossiers
    await supabase.from('dossiers').delete().eq('id', parentDossierId);
    await supabase.from('dossiers').delete().eq('id', childDossierId);
  });

  it('should delete relationship and return 204', async () => {
    // Create relationship first
    await supabase.from('dossier_relationships').insert({
      parent_dossier_id: parentDossierId,
      child_dossier_id: childDossierId,
      relationship_type: 'member_of',
      relationship_strength: 'primary',
    });

    // Delete the relationship
    const response = await fetch(
      `${supabaseUrl}/functions/v1/dossiers-relationships-delete?parentId=${parentDossierId}&childId=${childDossierId}&relationship_type=member_of`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(204);

    // Verify relationship was deleted
    const { data: relationships } = await supabase
      .from('dossier_relationships')
      .select('*')
      .eq('parent_dossier_id', parentDossierId)
      .eq('child_dossier_id', childDossierId)
      .eq('relationship_type', 'member_of');

    expect(relationships).toHaveLength(0);
  });

  it('should require relationship_type query parameter', async () => {
    // Create relationship first
    await supabase.from('dossier_relationships').insert({
      parent_dossier_id: parentDossierId,
      child_dossier_id: childDossierId,
      relationship_type: 'participates_in',
      relationship_strength: 'primary',
    });

    // Try to delete without relationship_type
    const response = await fetch(
      `${supabaseUrl}/functions/v1/dossiers-relationships-delete?parentId=${parentDossierId}&childId=${childDossierId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(400);

    // Cleanup
    await supabase
      .from('dossier_relationships')
      .delete()
      .eq('parent_dossier_id', parentDossierId)
      .eq('child_dossier_id', childDossierId);
  });

  it('should return 401 when unauthorized', async () => {
    // Create relationship first
    await supabase.from('dossier_relationships').insert({
      parent_dossier_id: parentDossierId,
      child_dossier_id: childDossierId,
      relationship_type: 'collaborates_with',
      relationship_strength: 'secondary',
    });

    const response = await fetch(
      `${supabaseUrl}/functions/v1/dossiers-relationships-delete?parentId=${parentDossierId}&childId=${childDossierId}&relationship_type=collaborates_with`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(401);

    // Cleanup
    await supabase
      .from('dossier_relationships')
      .delete()
      .eq('parent_dossier_id', parentDossierId)
      .eq('child_dossier_id', childDossierId);
  });

  it('should return 404 when relationship does not exist', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/dossiers-relationships-delete?parentId=${parentDossierId}&childId=${childDossierId}&relationship_type=monitors`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(404);
  });

  it('should only delete specific relationship type', async () => {
    // Create two relationships with different types
    await supabase.from('dossier_relationships').insert([
      {
        parent_dossier_id: parentDossierId,
        child_dossier_id: childDossierId,
        relationship_type: 'is_member',
        relationship_strength: 'primary',
      },
      {
        parent_dossier_id: parentDossierId,
        child_dossier_id: childDossierId,
        relationship_type: 'hosts',
        relationship_strength: 'secondary',
      },
    ]);

    // Delete only one relationship type
    const response = await fetch(
      `${supabaseUrl}/functions/v1/dossiers-relationships-delete?parentId=${parentDossierId}&childId=${childDossierId}&relationship_type=is_member`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(204);

    // Verify only is_member was deleted
    const { data: relationships } = await supabase
      .from('dossier_relationships')
      .select('*')
      .eq('parent_dossier_id', parentDossierId)
      .eq('child_dossier_id', childDossierId);

    expect(relationships).toHaveLength(1);
    expect(relationships![0].relationship_type).toBe('hosts');

    // Cleanup remaining relationship
    await supabase
      .from('dossier_relationships')
      .delete()
      .eq('parent_dossier_id', parentDossierId)
      .eq('child_dossier_id', childDossierId);
  });

  it('should return 404 for invalid dossier IDs', async () => {
    const invalidId = '00000000-0000-0000-0000-000000000000';
    const response = await fetch(
      `${supabaseUrl}/functions/v1/dossiers-relationships-delete?parentId=${invalidId}&childId=${childDossierId}&relationship_type=member_of`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(404);
  });
});
