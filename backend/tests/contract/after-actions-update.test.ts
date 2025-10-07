/**
 * Contract Test: PATCH /after-actions/{id}
 * Feature: 010-after-action-notes
 * Task: T022
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

describe('PATCH /after-actions/{id}', () => {
  let testAfterActionId: string;
  let currentVersion: number;

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
    currentVersion = afterAction!.version;
  });

  it('should update after-action with correct version', async () => {
    const updates = {
      notes: 'Updated notes',
      version: currentVersion + 1
    };

    const { data, error } = await supabase
      .from('after_action_records')
      .update(updates)
      .eq('id', testAfterActionId)
      .eq('version', currentVersion)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toMatchObject({
      id: testAfterActionId,
      notes: 'Updated notes',
      version: currentVersion + 1
    });
  });

  it('should handle version conflict (optimistic locking)', async () => {
    // First update succeeds
    await supabase
      .from('after_action_records')
      .update({ version: currentVersion + 1 })
      .eq('id', testAfterActionId)
      .eq('version', currentVersion);

    // Second update with stale version should fail
    const { data, error } = await supabase
      .from('after_action_records')
      .update({ notes: 'Conflicting update', version: currentVersion + 1 })
      .eq('id', testAfterActionId)
      .eq('version', currentVersion) // Stale version
      .select();

    // No rows should be updated
    expect(data).toEqual([]);
  });
});
