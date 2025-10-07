/**
 * Contract Test: GET /dossiers/{id}/engagements
 * Feature: 010-after-action-notes
 * Task: T019
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

describe('GET /dossiers/{id}/engagements', () => {
  let testDossierId: string;

  beforeAll(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: dossier } = await supabase
      .from('dossiers')
      .insert({ title: 'Test Dossier', dossier_type: 'project', status: 'active' })
      .select()
      .single();

    testDossierId = dossier!.id;

    await supabase
      .from('dossier_owners')
      .insert({ dossier_id: testDossierId, user_id: user!.id });

    // Create multiple engagements
    for (let i = 0; i < 3; i++) {
      await supabase
        .from('engagements')
        .insert({
          dossier_id: testDossierId,
          title: `Meeting ${i + 1}`,
          engagement_type: 'meeting',
          engagement_date: new Date().toISOString()
        });
    }
  });

  it('should list engagements for dossier', async () => {
    const { data, error, count } = await supabase
      .from('engagements')
      .select('*', { count: 'exact' })
      .eq('dossier_id', testDossierId);

    expect(error).toBeNull();
    expect(data).toHaveLength(3);
    expect(count).toBe(3);
  });

  it('should support pagination', async () => {
    const { data, error } = await supabase
      .from('engagements')
      .select('*')
      .eq('dossier_id', testDossierId)
      .range(0, 1);

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
  });
});
