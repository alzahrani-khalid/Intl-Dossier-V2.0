/**
 * Contract Test: GET /dossiers/{id}/after-actions
 * Feature: 010-after-action-notes
 * Task: T028
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

describe('GET /dossiers/{id}/after-actions', () => {
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

    // Create multiple engagements and after-actions
    for (let i = 0; i < 3; i++) {
      const { data: engagement } = await supabase
        .from('engagements')
        .insert({
          dossier_id: testDossierId,
          title: `Meeting ${i + 1}`,
          engagement_type: 'meeting',
          engagement_date: new Date().toISOString()
        })
        .select()
        .single();

      await supabase
        .from('after_action_records')
        .insert({
          engagement_id: engagement!.id,
          dossier_id: testDossierId,
          publication_status: i === 0 ? 'draft' : 'published',
          is_confidential: false
        });
    }
  });

  it('should list after-actions for dossier', async () => {
    const { data, error, count } = await supabase
      .from('after_action_records')
      .select('*', { count: 'exact' })
      .eq('dossier_id', testDossierId);

    expect(error).toBeNull();
    expect(data).toHaveLength(3);
    expect(count).toBe(3);
  });

  it('should filter by status', async () => {
    const { data: drafts } = await supabase
      .from('after_action_records')
      .select('*')
      .eq('dossier_id', testDossierId)
      .eq('publication_status', 'draft');

    const { data: published } = await supabase
      .from('after_action_records')
      .select('*')
      .eq('dossier_id', testDossierId)
      .eq('publication_status', 'published');

    expect(drafts).toHaveLength(1);
    expect(published).toHaveLength(2);
  });

  it('should support pagination', async () => {
    const { data } = await supabase
      .from('after_action_records')
      .select('*')
      .eq('dossier_id', testDossierId)
      .range(0, 1);

    expect(data).toHaveLength(2);
  });
});
