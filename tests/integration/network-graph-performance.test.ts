// T030: Integration test - Network graph query performance
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('Network Graph Query Performance', () => {
  let supabase: ReturnType<typeof createClient>;
  let authToken: string;
  let testDossierId: string;
  let relatedDossierIds: string[] = [];

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

    // Create main test dossier
    const { data: mainDossier } = await supabase
      .from('dossiers')
      .insert({
        name_en: 'Central Hub Dossier',
        name_ar: 'ملف المركز الرئيسي',
        type: 'country',
        sensitivity_level: 'public',
        reference_type: 'country',
      })
      .select()
      .single();

    testDossierId = mainDossier?.id || '';

    // Create 50 related dossiers (max expected scenario)
    const relatedDossiers = Array.from({ length: 50 }, (_, i) => ({
      name_en: `Related Dossier ${i + 1}`,
      name_ar: `ملف مرتبط ${i + 1}`,
      type: i % 2 === 0 ? 'organization' : 'forum',
      sensitivity_level: 'public',
      reference_type: i % 2 === 0 ? 'organization' : 'forum',
    }));

    const { data: createdDossiers } = await supabase
      .from('dossiers')
      .insert(relatedDossiers)
      .select('id');

    relatedDossierIds = createdDossiers?.map(d => d.id) || [];

    // Create relationships between main dossier and all related dossiers
    const relationships = relatedDossierIds.map((relatedId, i) => ({
      parent_dossier_id: testDossierId,
      child_dossier_id: relatedId,
      relationship_type: i % 3 === 0 ? 'member_of' : i % 3 === 1 ? 'participates_in' : 'collaborates_with',
      relationship_strength: i % 3 === 0 ? 'primary' : i % 3 === 1 ? 'secondary' : 'observer',
    }));

    await supabase.from('dossier_relationships').insert(relationships);
  });

  afterAll(async () => {
    // Cleanup
    await supabase.from('dossier_relationships').delete().eq('parent_dossier_id', testDossierId);
    await supabase.from('dossiers').delete().eq('id', testDossierId);
    await supabase.from('dossiers').delete().in('id', relatedDossierIds);
  });

  it('should query relationships in <3000ms for 50 nodes', async () => {
    const startTime = Date.now();

    const response = await fetch(
      `${supabaseUrl}/functions/v1/dossiers-relationships-get?dossierId=${testDossierId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    expect(response.status).toBe(200);
    expect(queryTime).toBeLessThan(3000); // Performance target: <3s

    const data = await response.json();
    expect(data.relationships).toHaveLength(50);
    expect(data.total_count).toBe(50);

    console.log(`✓ Network graph query completed in ${queryTime}ms for 50 relationships`);
  });

  it('should use composite index for parent_dossier_id queries', async () => {
    // Query EXPLAIN to verify index usage
    const { data: explainData } = await supabase.rpc('explain_query', {
      query_text: `
        SELECT * FROM dossier_relationships
        WHERE parent_dossier_id = '${testDossierId}'
      `,
    });

    // Check if index scan is used (not sequential scan)
    const explainOutput = JSON.stringify(explainData);
    expect(explainOutput).toContain('Index Scan');
    expect(explainOutput).not.toContain('Seq Scan');

    console.log('✓ Composite index verified for parent_dossier_id queries');
  });

  it('should handle bidirectional queries efficiently', async () => {
    const startTime = Date.now();

    // Query both parent and child relationships
    const response = await fetch(
      `${supabaseUrl}/functions/v1/dossiers-relationships-get?dossierId=${testDossierId}&direction=both`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    expect(response.status).toBe(200);
    expect(queryTime).toBeLessThan(3000);

    const data = await response.json();
    // Should return all relationships where testDossierId is either parent or child
    expect(data.relationships.length).toBeGreaterThanOrEqual(50);

    console.log(`✓ Bidirectional query completed in ${queryTime}ms`);
  });

  it('should filter by relationship_type without performance degradation', async () => {
    const startTime = Date.now();

    const response = await fetch(
      `${supabaseUrl}/functions/v1/dossiers-relationships-get?dossierId=${testDossierId}&relationship_type=member_of`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    expect(response.status).toBe(200);
    expect(queryTime).toBeLessThan(1500); // Should be faster with filter

    const data = await response.json();
    expect(data.relationships.every((r: any) => r.relationship_type === 'member_of')).toBe(true);

    console.log(`✓ Filtered query completed in ${queryTime}ms`);
  });

  it('should expand dossier info efficiently', async () => {
    const startTime = Date.now();

    const response = await fetch(
      `${supabaseUrl}/functions/v1/dossiers-relationships-get?dossierId=${testDossierId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    const data = await response.json();

    // Verify expanded dossier info is included
    if (data.relationships.length > 0) {
      const relationship = data.relationships[0];
      expect(relationship).toHaveProperty('child_dossier');
      expect(relationship.child_dossier).toHaveProperty('name_en');
      expect(relationship.child_dossier).toHaveProperty('name_ar');
      expect(relationship.child_dossier).toHaveProperty('type');
    }

    // Query should still complete in <3s even with JOINs
    expect(queryTime).toBeLessThan(3000);

    console.log(`✓ Query with expanded dossier info completed in ${queryTime}ms`);
  });

  it('should handle pagination for large result sets', async () => {
    // Query with limit
    const response = await fetch(
      `${supabaseUrl}/functions/v1/dossiers-relationships-get?dossierId=${testDossierId}&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.relationships).toHaveLength(10);
    expect(data.total_count).toBe(50); // Total should still be 50

    console.log('✓ Pagination working correctly');
  });
});
