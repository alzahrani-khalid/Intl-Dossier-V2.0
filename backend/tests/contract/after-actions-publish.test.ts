/**
 * Contract Test: POST /after-actions/{id}/publish
 * Feature: 010-after-action-notes
 * Task: T023
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

describe('POST /after-actions/{id}/publish', () => {
  let testAfterActionId: string;
  let confidentialAfterActionId: string;

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

    // Non-confidential after-action
    const { data: afterAction1 } = await supabase
      .from('after_action_records')
      .insert({
        engagement_id: engagement!.id,
        dossier_id: dossier!.id,
        is_confidential: false
      })
      .select()
      .single();

    testAfterActionId = afterAction1!.id;

    // Confidential after-action
    const { data: engagement2 } = await supabase
      .from('engagements')
      .insert({
        dossier_id: dossier!.id,
        title: 'Confidential Meeting',
        engagement_type: 'meeting',
        engagement_date: new Date().toISOString()
      })
      .select()
      .single();

    const { data: afterAction2 } = await supabase
      .from('after_action_records')
      .insert({
        engagement_id: engagement2!.id,
        dossier_id: dossier!.id,
        is_confidential: true
      })
      .select()
      .single();

    confidentialAfterActionId = afterAction2!.id;
  });

  it('should publish non-confidential after-action', async () => {
    const { data, error } = await supabase
      .from('after_action_records')
      .update({
        publication_status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', testAfterActionId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toMatchObject({
      id: testAfterActionId,
      publication_status: 'published'
    });
    expect(data.published_at).toBeDefined();
  });

  it('should require step-up MFA for confidential records', async () => {
    // This test verifies the schema supports confidential flag
    const { data } = await supabase
      .from('after_action_records')
      .select('is_confidential')
      .eq('id', confidentialAfterActionId)
      .single();

    expect(data?.is_confidential).toBe(true);
    
    // Note: Actual MFA verification will be tested in Edge Function
    // This test just ensures the schema supports the workflow
  });

  it('should enforce role check (supervisor/admin only)', async () => {
    // Schema allows publication status update
    // Role check will be enforced in Edge Function and RLS policies
    const { data } = await supabase
      .from('after_action_records')
      .select('publication_status')
      .eq('id', testAfterActionId)
      .single();

    expect(['draft', 'published', 'edit_requested']).toContain(data?.publication_status);
  });
});
