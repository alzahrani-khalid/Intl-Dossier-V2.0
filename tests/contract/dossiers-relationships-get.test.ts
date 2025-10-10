// T018: Contract test for GET /dossiers/{dossierId}/relationships
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('GET /dossiers/{dossierId}/relationships', () => {
  let supabase: ReturnType<typeof createClient>;
  let authToken: string;
  let testDossierId: string;
  let relatedDossierId: string;

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
        name_en: 'Test Country Dossier',
        name_ar: 'ملف دولة تجريبي',
        type: 'country',
        sensitivity_level: 'public',
        reference_type: 'country',
      })
      .select()
      .single();

    const { data: dossier2, error: error2 } = await supabase
      .from('dossiers')
      .insert({
        name_en: 'Test Organization Dossier',
        name_ar: 'ملف منظمة تجريبي',
        type: 'organization',
        sensitivity_level: 'public',
        reference_type: 'organization',
      })
      .select()
      .single();

    if (error1 || error2) {
      throw new Error('Failed to create test dossiers');
    }

    testDossierId = dossier1.id;
    relatedDossierId = dossier2.id;

    // Create test relationship
    await supabase.from('dossier_relationships').insert({
      parent_dossier_id: testDossierId,
      child_dossier_id: relatedDossierId,
      relationship_type: 'member_of',
      relationship_strength: 'primary',
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await supabase.from('dossier_relationships').delete().eq('parent_dossier_id', testDossierId);
    await supabase.from('dossiers').delete().eq('id', testDossierId);
    await supabase.from('dossiers').delete().eq('id', relatedDossierId);
  });

  it('should return 200 with relationships array', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/dossiers-relationships-get?dossierId=${testDossierId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('relationships');
    expect(data).toHaveProperty('total_count');
    expect(Array.isArray(data.relationships)).toBe(true);
    expect(data.total_count).toBeGreaterThan(0);
  });

  it('should filter by relationship_type', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/dossiers-relationships-get?dossierId=${testDossierId}&relationship_type=member_of`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.relationships.every((r: any) => r.relationship_type === 'member_of')).toBe(true);
  });

  it('should filter by direction (parent, child, both)', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/dossiers-relationships-get?dossierId=${testDossierId}&direction=parent`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data.relationships)).toBe(true);
  });

  it('should return 401 when unauthorized', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/dossiers-relationships-get?dossierId=${testDossierId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(401);
  });

  it('should return 404 for invalid dossier ID', async () => {
    const invalidId = '00000000-0000-0000-0000-000000000000';
    const response = await fetch(
      `${supabaseUrl}/functions/v1/dossiers-relationships-get?dossierId=${invalidId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(404);
  });

  it('should include expanded dossier info in response', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/dossiers-relationships-get?dossierId=${testDossierId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (data.relationships.length > 0) {
      const relationship = data.relationships[0];
      expect(relationship).toHaveProperty('parent_dossier_id');
      expect(relationship).toHaveProperty('child_dossier_id');
      expect(relationship).toHaveProperty('relationship_type');
      expect(relationship).toHaveProperty('relationship_strength');
      // Should include expanded dossier info
      expect(relationship).toHaveProperty('child_dossier');
      expect(relationship.child_dossier).toHaveProperty('name_en');
      expect(relationship.child_dossier).toHaveProperty('name_ar');
    }
  });
});
