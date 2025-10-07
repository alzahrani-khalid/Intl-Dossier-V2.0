/**
 * Contract Test: GET /engagements/{id}
 * Feature: 010-after-action-notes
 * Task: T017
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

describe('GET /engagements/{id}', () => {
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
        title: 'Test Meeting',
        engagement_type: 'meeting',
        engagement_date: new Date().toISOString()
      })
      .select()
      .single();

    testEngagementId = engagement!.id;
  });

  it('should return engagement by ID', async () => {
    const { data, error } = await supabase
      .from('engagements')
      .select('*')
      .eq('id', testEngagementId)
      .single();

    expect(error).toBeNull();
    expect(data).toMatchObject({
      id: testEngagementId,
      title: 'Test Meeting',
      engagement_type: 'meeting'
    });
  });

  it('should return 404 for non-existent engagement', async () => {
    const { data, error } = await supabase
      .from('engagements')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single();

    expect(data).toBeNull();
    expect(error).toBeDefined();
  });
});
