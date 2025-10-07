/**
 * Contract Test: GET /after-actions/{id}/versions
 * Feature: 010-after-action-notes
 * Task: T027
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

describe('GET /after-actions/{id}/versions', () => {
  let testAfterActionId: string;

  beforeAll(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: dossier } = await supabase
      .from('dossiers')
      .insert({ title: 'Test Dossier', dossier_type: 'project', status: 'active' })
      .select()
      .single();

    await supabase
      .from('dossier_owners')
      .insert({ dossier_id: dossier!.id, user_id: user!.id });

    const { data: engagement } = await supabase
      .from('engagements')
      .insert({
        dossier_id: dossier!.id,
        title: 'Test Meeting',
        engagement_type: 'meeting',
        engagement_date: new Date().toISOString()
      })
      .select()
      .single();

    const { data: afterAction } = await supabase
      .from('after_action_records')
      .insert({
        engagement_id: engagement!.id,
        dossier_id: dossier!.id,
        is_confidential: false
      })
      .select()
      .single();

    testAfterActionId = afterAction!.id;

    // Create multiple versions
    await supabase.from('after_action_versions').insert([
      {
        after_action_id: testAfterActionId,
        version_number: 1,
        content: { ...afterAction, notes: 'Version 1' },
        changed_by: user!.id
      },
      {
        after_action_id: testAfterActionId,
        version_number: 2,
        content: { ...afterAction, notes: 'Version 2' },
        changed_by: user!.id
      },
      {
        after_action_id: testAfterActionId,
        version_number: 3,
        content: { ...afterAction, notes: 'Version 3' },
        changed_by: user!.id
      }
    ]);
  });

  it('should return versions in descending order', async () => {
    const { data, error } = await supabase
      .from('after_action_versions')
      .select('*')
      .eq('after_action_id', testAfterActionId)
      .order('version_number', { ascending: false });

    expect(error).toBeNull();
    expect(data).toHaveLength(3);
    expect(data![0].version_number).toBe(3);
    expect(data![1].version_number).toBe(2);
    expect(data![2].version_number).toBe(1);
  });

  it('should include full content snapshot in JSONB', async () => {
    const { data } = await supabase
      .from('after_action_versions')
      .select('content')
      .eq('after_action_id', testAfterActionId)
      .eq('version_number', 1)
      .single();

    expect(data?.content).toBeDefined();
    expect(data?.content).toHaveProperty('notes', 'Version 1');
  });
});
