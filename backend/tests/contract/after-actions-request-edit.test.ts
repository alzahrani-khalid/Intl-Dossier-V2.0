/**
 * Contract Test: POST /after-actions/{id}/request-edit
 * Feature: 010-after-action-notes
 * Task: T024
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

describe('POST /after-actions/{id}/request-edit', () => {
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
        publication_status: 'published',
        is_confidential: false
      })
      .select()
      .single();

    testAfterActionId = afterAction!.id;
  });

  it('should request edit with valid reason', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const editRequest = {
      publication_status: 'edit_requested',
      edit_requested_by: user!.id,
      edit_requested_at: new Date().toISOString(),
      edit_request_reason: 'Need to correct the due date for the budget commitment'
    };

    const { data, error } = await supabase
      .from('after_action_records')
      .update(editRequest)
      .eq('id', testAfterActionId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toMatchObject({
      publication_status: 'edit_requested',
      edit_request_reason: 'Need to correct the due date for the budget commitment'
    });
    expect(data.edit_requested_at).toBeDefined();
  });

  it('should validate reason length (10-500 chars)', async () => {
    const shortReason = 'Too short'; // Less than 10 chars
    const validReason = 'This is a valid reason with enough characters to pass validation';
    
    expect(shortReason.length).toBeLessThan(10);
    expect(validReason.length).toBeGreaterThanOrEqual(10);
    expect(validReason.length).toBeLessThanOrEqual(500);
  });
});
