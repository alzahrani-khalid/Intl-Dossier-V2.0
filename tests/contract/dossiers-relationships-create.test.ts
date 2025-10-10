// T019: Contract test for POST /dossiers/{dossierId}/relationships
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('POST /dossiers/{dossierId}/relationships', () => {
  let supabase: ReturnType<typeof createClient>;
  let authToken: string;
  let parentDossierId: string;
  let childDossierId: string;
  let createdRelationshipIds: Array<{ parent: string; child: string; type: string }> = [];

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
        name_en: 'Test Parent Dossier',
        name_ar: 'ملف أب تجريبي',
        type: 'country',
        sensitivity_level: 'public',
        reference_type: 'country',
      })
      .select()
      .single();

    const { data: dossier2, error: error2 } = await supabase
      .from('dossiers')
      .insert({
        name_en: 'Test Child Dossier',
        name_ar: 'ملف فرع تجريبي',
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
    // Cleanup relationships
    for (const rel of createdRelationshipIds) {
      await supabase
        .from('dossier_relationships')
        .delete()
        .eq('parent_dossier_id', rel.parent)
        .eq('child_dossier_id', rel.child)
        .eq('relationship_type', rel.type);
    }

    // Cleanup test dossiers
    await supabase.from('dossiers').delete().eq('id', parentDossierId);
    await supabase.from('dossiers').delete().eq('id', childDossierId);
  });

  it('should create relationship and return 201', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/dossiers-relationships-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dossierId: parentDossierId,
          child_dossier_id: childDossierId,
          relationship_type: 'member_of',
          relationship_strength: 'primary',
          notes: 'Test relationship',
        }),
      }
    );

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data).toHaveProperty('parent_dossier_id', parentDossierId);
    expect(data).toHaveProperty('child_dossier_id', childDossierId);
    expect(data).toHaveProperty('relationship_type', 'member_of');
    expect(data).toHaveProperty('relationship_strength', 'primary');
    expect(data).toHaveProperty('created_by');
    expect(data).toHaveProperty('created_at');

    // Track for cleanup
    createdRelationshipIds.push({
      parent: parentDossierId,
      child: childDossierId,
      type: 'member_of',
    });
  });

  it('should support all relationship types', async () => {
    const types = [
      'participates_in',
      'collaborates_with',
      'monitors',
      'is_member',
      'hosts',
    ];

    for (const type of types) {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/dossiers-relationships-create`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dossierId: parentDossierId,
            child_dossier_id: childDossierId,
            relationship_type: type,
            relationship_strength: 'secondary',
          }),
        }
      );

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.relationship_type).toBe(type);

      // Track for cleanup
      createdRelationshipIds.push({
        parent: parentDossierId,
        child: childDossierId,
        type,
      });
    }
  });

  it('should support all relationship strengths', async () => {
    const strengths = ['primary', 'secondary', 'observer'];

    for (const strength of strengths) {
      // Create a unique child for each strength test
      const { data: childDossier } = await supabase
        .from('dossiers')
        .insert({
          name_en: `Test Child ${strength}`,
          name_ar: `ملف فرع ${strength}`,
          type: 'organization',
          sensitivity_level: 'public',
          reference_type: 'organization',
        })
        .select()
        .single();

      const response = await fetch(
        `${supabaseUrl}/functions/v1/dossiers-relationships-create`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dossierId: parentDossierId,
            child_dossier_id: childDossier.id,
            relationship_type: 'member_of',
            relationship_strength: strength,
          }),
        }
      );

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.relationship_strength).toBe(strength);

      // Cleanup
      await supabase
        .from('dossier_relationships')
        .delete()
        .eq('parent_dossier_id', parentDossierId)
        .eq('child_dossier_id', childDossier.id);
      await supabase.from('dossiers').delete().eq('id', childDossier.id);
    }
  });

  it('should return 409 for duplicate relationship', async () => {
    // Create first relationship
    await fetch(`${supabaseUrl}/functions/v1/dossiers-relationships-create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dossierId: parentDossierId,
        child_dossier_id: childDossierId,
        relationship_type: 'monitors',
        relationship_strength: 'observer',
      }),
    });

    // Try to create duplicate
    const response = await fetch(
      `${supabaseUrl}/functions/v1/dossiers-relationships-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dossierId: parentDossierId,
          child_dossier_id: childDossierId,
          relationship_type: 'monitors',
          relationship_strength: 'primary',
        }),
      }
    );

    expect(response.status).toBe(409);

    // Track for cleanup
    createdRelationshipIds.push({
      parent: parentDossierId,
      child: childDossierId,
      type: 'monitors',
    });
  });

  it('should return 400 for self-referencing relationship', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/dossiers-relationships-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dossierId: parentDossierId,
          child_dossier_id: parentDossierId, // Same as parent
          relationship_type: 'member_of',
          relationship_strength: 'primary',
        }),
      }
    );

    expect(response.status).toBe(400);
  });

  it('should return 401 when unauthorized', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/dossiers-relationships-create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dossierId: parentDossierId,
          child_dossier_id: childDossierId,
          relationship_type: 'member_of',
          relationship_strength: 'primary',
        }),
      }
    );

    expect(response.status).toBe(401);
  });

  it('should include audit fields in response', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/dossiers-relationships-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dossierId: parentDossierId,
          child_dossier_id: childDossierId,
          relationship_type: 'is_member',
          relationship_strength: 'secondary',
        }),
      }
    );

    const data = await response.json();
    expect(data).toHaveProperty('created_at');
    expect(data).toHaveProperty('created_by');
    expect(data.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO timestamp

    // Track for cleanup
    createdRelationshipIds.push({
      parent: parentDossierId,
      child: childDossierId,
      type: 'is_member',
    });
  });
});
