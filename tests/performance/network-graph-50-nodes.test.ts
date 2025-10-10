// T082: Performance test - Network graph rendering with 50 nodes
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('Network Graph Performance (50 Nodes)', () => {
  let supabase: ReturnType<typeof createClient>;
  let authToken: string;
  let mainDossierId: string;
  let relatedDossierIds: string[] = [];

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'kazahrani@stats.gov.sa',
      password: 'itisme',
    });

    authToken = authData?.session?.access_token || '';

    // Create main dossier
    const { data: mainDossier } = await supabase
      .from('dossiers')
      .insert({
        name_en: 'Performance Test Hub',
        name_ar: 'مركز اختبار الأداء',
        type: 'country',
        sensitivity_level: 'public',
        reference_type: 'country',
      })
      .select()
      .single();

    mainDossierId = mainDossier?.id || '';

    // Create 50 related dossiers
    const relatedDossiers = Array.from({ length: 50 }, (_, i) => ({
      name_en: `Performance Related ${i + 1}`,
      name_ar: `مرتبط بالأداء ${i + 1}`,
      type: i % 2 === 0 ? 'organization' : 'forum',
      sensitivity_level: 'public',
      reference_type: i % 2 === 0 ? 'organization' : 'forum',
    }));

    const { data: created } = await supabase
      .from('dossiers')
      .insert(relatedDossiers)
      .select('id');

    relatedDossierIds = created?.map(d => d.id) || [];

    // Create relationships
    const relationships = relatedDossierIds.map(id => ({
      parent_dossier_id: mainDossierId,
      child_dossier_id: id,
      relationship_type: 'member_of',
      relationship_strength: 'primary',
    }));

    await supabase.from('dossier_relationships').insert(relationships);
  });

  afterAll(async () => {
    await supabase.from('dossier_relationships').delete().eq('parent_dossier_id', mainDossierId);
    await supabase.from('dossiers').delete().eq('id', mainDossierId);
    await supabase.from('dossiers').delete().in('id', relatedDossierIds);
  });

  it('should render 50 nodes in <3000ms', async () => {
    const startTime = Date.now();

    const response = await fetch(
      `${supabaseUrl}/functions/v1/dossiers-relationships-get?dossierId=${mainDossierId}`,
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
    expect(data.relationships).toHaveLength(50);

    console.log(`✓ 50-node graph query completed in ${queryTime}ms`);
    console.log(`  Target: <3000ms, Actual: ${queryTime}ms, ${queryTime < 3000 ? 'PASS' : 'FAIL'}`);
  });

  it('should transform data to React Flow format efficiently', async () => {
    const { data: relationships } = await supabase
      .from('dossier_relationships')
      .select('*, child_dossier:dossiers!child_dossier_id(*)')
      .eq('parent_dossier_id', mainDossierId);

    const startTime = Date.now();

    // Simulate React Flow transformation
    const nodes = [
      { id: mainDossierId, data: { label: 'Performance Test Hub' }, position: { x: 0, y: 0 } },
      ...relationships!.map((rel, index) => ({
        id: rel.child_dossier_id,
        data: { label: rel.child_dossier.name_en },
        position: {
          x: Math.cos((2 * Math.PI * index) / 50) * 300,
          y: Math.sin((2 * Math.PI * index) / 50) * 300,
        },
      })),
    ];

    const edges = relationships!.map(rel => ({
      id: `${rel.parent_dossier_id}-${rel.child_dossier_id}`,
      source: rel.parent_dossier_id,
      target: rel.child_dossier_id,
    }));

    const transformTime = Date.now() - startTime;

    expect(nodes).toHaveLength(51); // 1 main + 50 related
    expect(edges).toHaveLength(50);
    expect(transformTime).toBeLessThan(100); // Transform should be very fast

    console.log(`✓ Data transformation completed in ${transformTime}ms`);
  });
});
