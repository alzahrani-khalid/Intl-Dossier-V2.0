/**
 * Contract Test: PATCH /engagements/{id}
 * Feature: 010-after-action-notes
 * Task: T018
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

describe('PATCH /engagements/{id}', () => {
  let testEngagementId: string;

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
        title: 'Original Title',
        engagement_type: 'meeting',
        engagement_date: new Date().toISOString()
      })
      .select()
      .single();

    testEngagementId = engagement!.id;
  });

  it('should update engagement fields', async () => {
    const updates = {
      title: 'Updated Title',
      location: 'New Location'
    };

    const { data, error } = await supabase
      .from('engagements')
      .update(updates)
      .eq('id', testEngagementId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toMatchObject({
      id: testEngagementId,
      title: 'Updated Title',
      location: 'New Location'
    });
  });
});
