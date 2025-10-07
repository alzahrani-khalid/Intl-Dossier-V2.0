/**
 * Contract Test: GET /after-actions/{id}
 * Feature: 010-after-action-notes
 * Task: T021
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

describe('GET /after-actions/{id}', () => {
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
        is_confidential: false,
        attendees: ['John Smith']
      })
      .select()
      .single();

    testAfterActionId = afterAction!.id;

    // Create child entities
    await supabase.from('decisions').insert({
      after_action_id: testAfterActionId,
      description: 'Test decision',
      decision_maker: 'Manager',
      decision_date: new Date().toISOString()
    });

    await supabase.from('commitments').insert({
      after_action_id: testAfterActionId,
      dossier_id: dossier!.id,
      description: 'Test commitment',
      owner_type: 'internal',
      owner_user_id: user!.id,
      tracking_mode: 'automatic',
      due_date: '2025-10-15',
      priority: 'medium'
    });
  });

  it('should return after-action with child entities', async () => {
    // Main record
    const { data: afterAction, error } = await supabase
      .from('after_action_records')
      .select('*')
      .eq('id', testAfterActionId)
      .single();

    expect(error).toBeNull();
    expect(afterAction).toMatchObject({
      id: testAfterActionId,
      publication_status: 'draft'
    });

    // Child decisions
    const { data: decisions } = await supabase
      .from('decisions')
      .select('*')
      .eq('after_action_id', testAfterActionId);

    expect(decisions).toHaveLength(1);

    // Child commitments
    const { data: commitments } = await supabase
      .from('commitments')
      .select('*')
      .eq('after_action_id', testAfterActionId);

    expect(commitments).toHaveLength(1);
  });

  it('should return 404 for non-existent after-action', async () => {
    const { data, error } = await supabase
      .from('after_action_records')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single();

    expect(data).toBeNull();
    expect(error).toBeDefined();
  });
});
